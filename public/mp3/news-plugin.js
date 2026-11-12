/**
 * News 播放列表插件 v2.3
 * 
 * 相对 v2.2 的改动：
 *  1. 新增 visibilitychange 处理，解决切后台 HLS 停播问题
 *  2. hidden 时：记录播放状态，不销毁 hls 实例、不 stopLoad（否则音频真断）
 *  3. visible 时：尝试恢复播放 + 检查缓冲、必要时 startLoad
 *  4. reset / unload 时清理监听
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

    // ★ 可见性相关
    let visibilityHandler = null;
    let wasPlayingBeforeHidden = false;

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

    // ==================== 可见性处理 ====================
    function attachVisibilityHandler(media) {
        cleanupVisibilityHandler();

        visibilityHandler = () => {
            if (!hlsInstance) return;

            if (document.visibilityState === 'hidden') {
                // 记录切后台前的播放状态，但不暂停、不 stopLoad
                // 让浏览器/系统自己处理媒体元素暂停；hls 解析在 Worker 中不受影响
                wasPlayingBeforeHidden = !media.paused;
                console.log('[News HLS] Page hidden, wasPlaying =', wasPlayingBeforeHidden);
            } else if (document.visibilityState === 'visible') {
                console.log('[News HLS] Page visible, attempting resume…');
                // 1. 如果切回来时媒体元素被浏览器强制暂停了，尝试恢复
                if (wasPlayingBeforeHidden && media.paused) {
                    media.play().catch((e) => {
                        console.warn('[News HLS] Resume play failed:', e);
                    });
                }
                // 2. 检查缓冲，如果已经耗尽（长时间后台），重新 startLoad
                try {
                    const buffered = media.buffered;
                    let hasBuffer = false;
                    const t = media.currentTime || 0;
                    for (let i = 0; i < buffered.length; i++) {
                        if (buffered.start(i) <= t && buffered.end(i) > t + 0.5) {
                            hasBuffer = true;
                            break;
                        }
                    }
                    if (!hasBuffer) {
                        console.log('[News HLS] Buffer empty, restarting load at', t);
                        hlsInstance.startLoad(t > 0 ? t - 1 : -1);
                    }
                } catch (e) {
                    console.warn('[News HLS] startLoad check failed:', e);
                }
            }
        };

        document.addEventListener('visibilitychange', visibilityHandler);
    }

    function cleanupVisibilityHandler() {
        if (visibilityHandler) {
            document.removeEventListener('visibilitychange', visibilityHandler);
            visibilityHandler = null;
        }
    }

    // ==================== 数据加载 ====================
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

    // ==================== 预检 m3u8 ====================
    async function preflightM3u8(url) {
        try {
            const res = await fetch(url, { method: 'GET', cache: 'no-cache' });
            if (!res.ok) throw new Error(`m3u8 无法访问（HTTP ${res.status}）`);
            const text = await res.text();
            if (!text.includes('#EXTM3U')) throw new Error('返回内容不是有效的 HLS 播放列表');
            return true;
        } catch (e) {
            if (e instanceof TypeError) throw new Error('m3u8 请求失败，可能是 CORS 未开放：' + e.message);
            throw e;
        }
    }

    // ==================== HLS 播放核心 ====================
    async function playHls(url) {
        const ext = window.MP3AppExtension;
        const media = ext.audioPlayer;

        if (hlsInstance) { try { hlsInstance.destroy(); } catch (e) {} hlsInstance = null; }
        try { media.pause(); } catch (e) {}
        media.removeAttribute('src');
        try { media.load(); } catch (e) {}

        console.log('[News HLS] URL:', url);
        console.log('[News HLS] 浏览器能力:', {
            hasMSE: !!window.MediaSource,
            canPlayNative: media.canPlayType('application/vnd.apple.mpegurl')
        });

        try {
            setStatus('正在检查 m3u8…');
            await preflightM3u8(url);
        } catch (e) {
            console.error('[News HLS] 预检失败:', e);
            throw new Error('m3u8 预检失败：' + e.message);
        }

        try {
            await ensureHlsJs();
            if (window.Hls && window.Hls.isSupported()) {
                console.log('[News HLS] 使用 hls.js');
                await playWithHlsJs(media, url);
                return;
            }
        } catch (e) {
            console.warn('[News HLS] hls.js 加载/播放失败，尝试原生:', e.message);
        }

        if (media.canPlayType('application/vnd.apple.mpegurl')) {
            console.log('[News HLS] 使用原生 HLS');
            await playWithNativeHls(media, url);
            return;
        }

        throw new Error('浏览器不支持 HLS');
    }

    async function playWithHlsJs(media, url) {
        return new Promise((resolve, reject) => {
            const hls = new window.Hls({
                lowLatencyMode: false,
                enableWorker: true,             // ★ Worker 线程解析，后台不受可见性节流影响
                manifestLoadingMaxRetry: 2,
                manifestLoadingRetryDelay: 800,
                fragLoadingMaxRetry: 3,
                fragLoadingRetryDelay: 800,
                fragLoadingMaxRetryTimeout: 8000,
                appendErrorMaxRetry: 2,
                startLevel: -1
            });
            hlsInstance = hls;

            let recoveredNetwork = false;
            let recoveredMedia = false;

            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('HLS 加载超时（15s）'));
            }, 15000);

            const cleanup = () => {
                clearTimeout(timeout);
                try {
                    hls.off(window.Hls.Events.MANIFEST_PARSED);
                    hls.off(window.Hls.Events.ERROR);
                } catch (e) {}
            };

            hls.on(window.Hls.Events.MANIFEST_PARSED, (e, data) => {
                console.log('[News HLS] manifest 解析成功，levels:', (data.levels || []).map(lv => ({
                    videoCodec: lv.videoCodec || '(无)',
                    audioCodec: lv.audioCodec || '(无)'
                })));
                cleanup();
                media.play()
                    .then(() => {
                        // ★ 播放成功后挂载可见性监听
                        attachVisibilityHandler(media);
                        resolve();
                    })
                    .catch(err => reject(new Error('播放失败: ' + err.message)));
            });

            hls.on(window.Hls.Events.ERROR, (e, data) => {
                console.error('[News HLS] error:', data.type, data.details, 'fatal=' + data.fatal);
                if (!data.fatal) return;

                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR && !recoveredNetwork) {
                    recoveredNetwork = true;
                    try { hls.startLoad(); return; } catch (er) {}
                }
                if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR && !recoveredMedia) {
                    recoveredMedia = true;
                    try { hls.recoverMediaError(); return; } catch (er) {}
                }

                cleanup();
                const reason = data.reason ? '：' + data.reason : '';
                reject(new Error(`${data.type}/${data.details}${reason}`));
            });

            hls.loadSource(url);
            hls.attachMedia(media);
        });
    }

    async function playWithNativeHls(media, url) {
        return new Promise((resolve, reject) => {
            media.crossOrigin = 'anonymous';
            media.src = url;

            const timeout = setTimeout(() => {
                cleanup();
                const err = media.error;
                const detail = err ? ` (error.code=${err.code})` : '';
                reject(new Error('原生 HLS 加载超时 15s' + detail));
            }, 15000);

            const onLoaded = () => {
                cleanup();
                media.play()
                    .then(() => {
                        // ★ 原生 HLS 也挂载可见性监听
                        attachVisibilityHandler(media);
                        resolve();
                    })
                    .catch(err => reject(new Error('原生播放失败: ' + err.message)));
            };
            const onError = () => {
                cleanup();
                const err = media.error;
                let detail = '未知错误';
                if (err) {
                    const codeMap = { 1: 'MEDIA_ERR_ABORTED', 2: 'MEDIA_ERR_NETWORK', 3: 'MEDIA_ERR_DECODE', 4: 'MEDIA_ERR_SRC_NOT_SUPPORTED' };
                    detail = `${codeMap[err.code] || err.code} / ${err.message || '(空)'}`;
                }
                reject(new Error('原生播放失败：' + detail));
            };
            const cleanup = () => {
                clearTimeout(timeout);
                media.removeEventListener('loadedmetadata', onLoaded);
                media.removeEventListener('error', onError);
            };

            media.addEventListener('loadedmetadata', onLoaded);
            media.addEventListener('error', onError);
            media.load();
        });
    }

    // ==================== 数据源处理器 ====================
    function registerDataSource() {
        window.MP3DataSourceHandlers = window.MP3DataSourceHandlers || {};
        window.MP3DataSourceHandlers['news'] = {
            reset() {
                cleanupVisibilityHandler();   // ★ 切歌/清理时移除可见性监听
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

                const url = item.url;
                const isHls = /\.m3u8(\?|$)/i.test(url) || item.format === 'application/vnd.apple.mpegurl';

                try {
                    setStatus('正在加载音频…');

                    if (isHls) {
                        await playHls(url);
                    } else {
                        if (hlsInstance) { try { hlsInstance.destroy(); } catch (e) {} hlsInstance = null; }
                        ext.audioPlayer.crossOrigin = null;
                        ext.audioPlayer.src = url;
                        await ext.audioPlayer.play().catch(e => { throw new Error('播放失败：' + e.message); });
                    }

                    ext.currentPlayingFile = window.getFileKey(file);
                    document.getElementById('currentSongTitle').innerText = file.displayName;
                    document.getElementById('currentSongCategory').innerText = file.category;

                    if (typeof window.MP3SetPlayerSourceBadge === 'function') {
                        window.MP3SetPlayerSourceBadge(file);
                    }

                    ext.updatePlayerLikeState();
                    ext.updatePlayerDislikeState();
                    ext.renderTable();
                    ext.updatePlayButton();

                    if (window.MP3AppExtension?.syncMediaSession) window.MP3AppExtension.syncMediaSession();

                    setStatus('▶️ ' + file.displayName, 'success');
                } catch (e) {
                    console.error('[News] 播放失败:', e);
                    setStatus('播放失败：' + e.message, 'error');
                }
            }
        };
    }

    // ==================== UI ====================
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
        version: '2.3.0',
        async init() {
            registerDataSource();
            injectUI();
            await refresh();
        },
        async unload() {
            const ext = window.MP3AppExtension;

            cleanupVisibilityHandler();   // ★ 卸载时清理可见性监听

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

            if (uiRoot) { uiRoot.remove(); uiRoot = null; }

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