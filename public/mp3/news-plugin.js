/**
 * News 播放列表插件 v2.0
 * 
 * 统一设计：
 *  - UI 渲染到插件管理器的 .plugin-body 容器内（不再有独立卡片）
 *  - 无独立分页 UI，主表格翻页自动加载
 *  - API 固定每页 30 条，主表格 pageSize 用户随便改，不影响 API
 */
(function () {
    'use strict';

    const CONFIG = {
        apiBase: '/api/mp3/news',
        categoryName: '📰 News',
        apiPageSize: 30
    };

    let uiRoot = null;
    let lastMeta = null;
    let loadedPages = new Set();
    let loading = false;
    let hlsInstance = null;

    // ==================== 工具 ====================
    function setStatus(msg, tone) {
        if (!uiRoot) return;
        const el = uiRoot.querySelector('.news-status');
        if (!el) return;
        el.textContent = msg || '';
        el.className = 'news-status text-[10px] min-h-[0.75rem] break-all ' + (
            tone === 'error' ? 'text-rose-400' :
            tone === 'success' ? 'text-emerald-400' :
            tone === 'warn' ? 'text-amber-400' :
            'text-slate-500'
        );
    }

    function ensureHlsJs() {
        return new Promise((resolve, reject) => {
            if (window.Hls) return resolve();
            const existing = document.querySelector('script[data-news-hls]');
            if (existing) {
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', () => reject(new Error('hls.js 加载失败')));
                return;
            }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
            s.dataset.newsHls = '1';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('hls.js 加载失败'));
            document.head.appendChild(s);
        });
    }

    function buildFileEntry(item) {
        const key = `[News] ${item.id}`;
        return {
            filename: item.title || item.id,
            displayName: item.title || '(无标题)',
            relativePath: key,
            size: 0,
            category: CONFIG.categoryName,
            isLiked: false,
            isDisliked: false,
            tags: item.group ? [item.group] : ['News'],
            _source: 'news',
            _newsItem: item
        };
    }

    // ==================== API ====================
    async function loadPage(page) {
        const ext = window.MP3AppExtension;
        if (!ext) throw new Error('MP3AppExtension 未就绪');

        const url = `${CONFIG.apiBase}?page=${page}&limit=${CONFIG.apiPageSize}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || !Array.isArray(data.data)) throw new Error('API 返回格式不正确');

        lastMeta = {
            total: Number(data.total) || 0,
            totalPages: Number(data.totalPages) || 1
        };

        const likedMap = ext.getLikedMap ? ext.getLikedMap() : {};
        const dislikeMap = ext.getDislikedMap ? ext.getDislikedMap() : {};

        const newFiles = (data.data || []).map(item => {
            const entry = buildFileEntry(item);
            entry.isLiked = !!likedMap[entry.relativePath];
            entry.isDisliked = !!dislikeMap[entry.relativePath];
            return entry;
        });

        ext.allFiles = [...ext.allFiles, ...newFiles];
        loadedPages.add(page);

        if (!ext.categories.includes(CONFIG.categoryName)) {
            ext.categories.push(CONFIG.categoryName);
            ext.saveCategories(ext.categories);
        }

        ext.renderAll();
    }

    async function refresh() {
        if (loading) return;
        const ext = window.MP3AppExtension;
        if (!ext) return;

        loading = true;
        setStatus('正在加载…');
        try {
            ext.allFiles = ext.allFiles.filter(f => f._source !== 'news');
            loadedPages.clear();
            lastMeta = null;

            await loadPage(1);
            setStatus(`✅ 已加载 ${CONFIG.apiPageSize} 条`, 'success');
            renderCard();
        } catch (e) {
            setStatus('加载失败：' + e.message, 'error');
        } finally {
            loading = false;
        }
    }

    async function loadMore() {
        if (loading) return;
        const ext = window.MP3AppExtension;
        if (!ext) return;
        if (!lastMeta) return;

        const maxLoaded = loadedPages.size > 0 ? Math.max(...loadedPages) : 0;
        const nextPage = maxLoaded + 1;
        if (nextPage > lastMeta.totalPages) return;

        loading = true;
        setStatus(`正在加载第 ${nextPage} 页…`);
        try {
            await loadPage(nextPage);
            setStatus(`✅ 已加载第 ${nextPage} 页`, 'success');
            renderCard();
        } catch (e) {
            setStatus('加载失败：' + e.message, 'error');
        } finally {
            loading = false;
        }
    }

    // 主表格 renderTable 后调用，检查是否需要加载
    function maybeAutoLoad() {
        const ext = window.MP3AppExtension;
        if (!ext || loading || !lastMeta) return;
        if (ext.currentCategory !== CONFIG.categoryName) return;

        const currentPage = ext.currentPage || 1;
        const pageSize = ext.pageSize || 20;
        const need = currentPage * pageSize;
        const newsCount = ext.allFiles.filter(f => f._source === 'news').length;
        const maxLoaded = loadedPages.size > 0 ? Math.max(...loadedPages) : 0;

        if (newsCount < need && maxLoaded < lastMeta.totalPages) {
            loadMore();
        }
    }

    // ==================== 数据源处理器 ====================
    function registerDataSource() {
        window.MP3DataSourceHandlers = window.MP3DataSourceHandlers || {};
        window.MP3DataSourceHandlers['news'] = {
            reset() {
                if (hlsInstance) {
                    try { hlsInstance.destroy(); } catch (e) {}
                    hlsInstance = null;
                }
            },
            play: async (file) => {
                const ext = window.MP3AppExtension;
                if (!ext) return;
                const item = file._newsItem;
                if (!item || !item.url) {
                    setStatus('该条新闻缺少播放地址', 'error');
                    return;
                }

                if (hlsInstance) {
                    try { hlsInstance.destroy(); } catch (e) {}
                    hlsInstance = null;
                }

                const url = item.url;
                const isHls = /\.m3u8(\?|$)/i.test(url) || item.format === 'application/vnd.apple.mpegurl';

                try {
                    setStatus('正在加载音频…');

                    if (isHls) {
                        if (ext.audioPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                            ext.audioPlayer.src = url;
                        } else {
                            await ensureHlsJs();
                            if (window.Hls && window.Hls.isSupported()) {
                                hlsInstance = new window.Hls({ lowLatencyMode: true });
                                hlsInstance.loadSource(url);
                                hlsInstance.attachMedia(ext.audioPlayer);
                                await new Promise((resolve, reject) => {
                                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, resolve);
                                    hlsInstance.on(window.Hls.Events.ERROR, (evt, data) => {
                                        if (data && data.fatal) reject(new Error('HLS 解析失败：' + data.type));
                                    });
                                });
                            } else {
                                throw new Error('当前浏览器不支持 HLS');
                            }
                        }
                    } else {
                        ext.audioPlayer.src = url;
                    }

                    await ext.audioPlayer.play().catch(e => { throw new Error('播放失败：' + e.message); });

                    ext.currentPlayingFile = file.relativePath;
                    document.getElementById('currentSongTitle').innerText = file.displayName;
                    document.getElementById('currentSongCategory').innerText = file.category;

                    if (typeof window.MP3SetPlayerSourceBadge === 'function') {
                        window.MP3SetPlayerSourceBadge(file);
                    }

                    ext.updatePlayerLikeState();
                    ext.updatePlayerDislikeState();
                    ext.renderTable();
                    ext.updatePlayButton();

                    setStatus('▶️ ' + file.displayName, 'success');
                } catch (e) {
                    setStatus('播放失败：' + e.message, 'error');
                }
            }
        };
    }

    // ==================== UI（渲染到插件管理器的容器） ====================
    function injectUI() {
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
            ? window.MP3PluginManager.getBodyContainer('news')
            : null;
        if (!body) { setTimeout(injectUI, 300); return; }
        if (uiRoot) return;

        uiRoot = document.createElement('div');
        uiRoot.className = 'space-y-1';
        uiRoot.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <span class="news-info text-[10px] text-slate-500 flex-1 min-w-0 truncate"></span>
                <button class="news-refresh text-[10px] text-amber-400 hover:text-amber-300 shrink-0 whitespace-nowrap" title="重新加载第 1 页">
                    <i class="fa-solid fa-rotate text-[9px] mr-0.5"></i>刷新
                </button>
            </div>
            <p class="news-status text-[10px] min-h-[0.75rem] break-all text-slate-500"></p>
        `;
        body.appendChild(uiRoot);

        uiRoot.querySelector('.news-refresh').addEventListener('click', () => refresh());
        renderCard();
    }

    function renderCard() {
        if (!uiRoot) return;
        const info = uiRoot.querySelector('.news-info');
        if (!info) return;

        if (!lastMeta) {
            info.innerHTML = `<span class="text-slate-500">尚未加载</span>`;
            return;
        }

        const ext = window.MP3AppExtension;
        const newsCount = ext ? ext.allFiles.filter(f => f._source === 'news').length : 0;
        const maxLoaded = loadedPages.size > 0 ? Math.max(...loadedPages) : 0;
        const hasMore = maxLoaded < lastMeta.totalPages;

        info.innerHTML = `已加载 <span class="text-amber-400 font-medium">${newsCount}</span> / ${lastMeta.total}
            ${hasMore ? '<span class="text-slate-600">· 翻到末页自动加载</span>' : '<span class="text-emerald-500">· 已全部加载</span>'}`;
    }

    // ==================== 插件 API ====================
    window.MP3NewsPlugin = {
        version: '2.0.0',
        async init() {
            registerDataSource();
            injectUI();
            await refresh();
        },
        async unload() {
            const ext = window.MP3AppExtension;

            if (hlsInstance) {
                try { hlsInstance.destroy(); } catch (e) {}
                hlsInstance = null;
            }

            if (ext) {
                const playingKey = ext.currentPlayingFile;
                const isPlayingNews = playingKey && String(playingKey).startsWith('[News]');

                ext.allFiles = ext.allFiles.filter(f => f._source !== 'news');
                ext.categories = ext.categories.filter(c => c !== CONFIG.categoryName);
                ext.saveCategories(ext.categories);

                if (isPlayingNews) {
                    try { ext.audioPlayer.pause(); } catch (e) {}
                    ext.audioPlayer.removeAttribute('src');
                    try { ext.audioPlayer.load(); } catch (e) {}
                    ext.currentPlayingFile = null;

                    const titleEl = document.getElementById('currentSongTitle');
                    const catEl = document.getElementById('currentSongCategory');
                    if (titleEl) titleEl.innerText = '尚未選擇播放歌曲';
                    if (catEl) catEl.innerText = '就緒';
                    if (typeof window.MP3SetPlayerSourceBadge === 'function') {
                        window.MP3SetPlayerSourceBadge(null);
                    }
                }

                ext.updatePlayButton();
                ext.updatePlayerLikeState();
                ext.updatePlayerDislikeState();
                ext.renderAll();
            }

            if (uiRoot) {
                uiRoot.remove();
                uiRoot = null;
            }

            if (window.MP3DataSourceHandlers) delete window.MP3DataSourceHandlers['news'];

            if (typeof window.refreshSourceFilterOptions === 'function') {
                window.refreshSourceFilterOptions();
            }

            lastMeta = null;
            loadedPages.clear();
            loading = false;
        },
        maybeAutoLoad
    };
})();