/**
 * News 播放列表插件 v4.0
 *
 * 职责边界：
 *  - 只负责数据加载（list）、分页、预取下一首、UI
 *  - 播放控制完全交给 hls-player + 主程序 onAudioEnded
 *  - 不再干预 loop、切歌、MediaSession、stalled 检测
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

    // ==================== UI 状态 ====================
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

    // ==================== 文件条目 ====================
    function buildFileEntry(item) {
        const key = `[News] ${item.id}`;
        return {
            filename: item.title || item.id,
            displayName: item.title || '(无标题)',
            relativePath: key,
            size: 0,
            category: CONFIG.categoryName,
            tags: item.group ? [item.group] : ['News'],
            _source: 'news',
            _newsItem: item
        };
    }

    // ==================== 预取下一首 manifest（性能优化，无副作用） ====================
    function prefetchNextNews() {
        const ext = window.MP3AppExtension;
        if (!ext) return;
        const newsFiles = ext.allFiles.filter(f => f._source === 'news');
        if (!newsFiles.length) return;
        const curKey = ext.currentPlayingFile;
        const idx = newsFiles.findIndex(f => window.getFileKey(f) === curKey);
        const next = idx < 0 ? newsFiles[0] : newsFiles[(idx + 1) % newsFiles.length];
        const url = next?._newsItem?.url;
        if (!url) return;
        if (!/\.m3u8(\?|$)/i.test(url)) return;

        if (window.MP3HlsPlayer) {
            window.MP3HlsPlayer.prefetch(url);
        } else if (ext.ensureHlsPlayerModule) {
            ext.ensureHlsPlayerModule()
                .then(() => window.MP3HlsPlayer?.prefetch(url))
                .catch(() => {});
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

        const decorated = ext.decorateFiles((data.data || []).map(buildFileEntry), {
            getKey: (f) => window.getFileKey(f),
            sourceKey: 'news'
        });

        ext.allFiles = [...ext.allFiles, ...decorated];
        loadedPages.add(page);
        ext.ensureSourceCategory(CONFIG.categoryName);
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
        if (!ext || !lastMeta) return;
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
        const need = (ext.currentPage || 1) * (ext.pageSize || 20);
        const newsCount = ext.allFiles.filter(f => f._source === 'news').length;
        const maxLoaded = loadedPages.size > 0 ? Math.max(...loadedPages) : 0;
        if (newsCount < need && maxLoaded < lastMeta.totalPages) loadMore();
    }

    // ==================== 数据源注册（极简：只提供 URL） ====================
    function registerDataSource() {
        window.MP3DataSourceHandlers = window.MP3DataSourceHandlers || {};
        window.MP3DataSourceHandlers['news'] = {
            reset() {},
            play: async (file) => {
                const ext = window.MP3AppExtension;
                if (!ext) return;
                const item = file._newsItem;
                if (!item || !item.url) {
                    setStatus('该条新闻缺少播放地址', 'error');
                    throw new Error('无播放地址');
                }

                setStatus('正在加载音频…');
                const isHls = /\.m3u8(\?|$)/i.test(item.url);

                // 完全交给 Core → hls-player 处理
                await ext.playMedia(item.url, {
                    type: isHls ? 'hls' : 'auto',
                    onStatus: setStatus
                });

                // 播放开始后预取下一首（性能优化）
                prefetchNextNews();

                setStatus('▶️ ' + file.displayName, 'success');
            }
        };
    }

    // ==================== UI ====================
    function injectUI() {
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
            ? window.MP3PluginManager.getBodyContainer('news') : null;
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
        if (!lastMeta) { info.innerHTML = `<span class="text-slate-500">尚未加载</span>`; return; }
        const ext = window.MP3AppExtension;
        const newsCount = ext ? ext.allFiles.filter(f => f._source === 'news').length : 0;
        const maxLoaded = loadedPages.size > 0 ? Math.max(...loadedPages) : 0;
        const hasMore = maxLoaded < lastMeta.totalPages;
        info.innerHTML = `已加载 <span class="text-amber-400 font-medium">${newsCount}</span> / ${lastMeta.total}
            ${hasMore ? '<span class="text-slate-600">· 翻到末页自动加载</span>' : '<span class="text-emerald-500">· 已全部加载</span>'}`;
    }

    // ==================== 插件导出 ====================
    window.MP3NewsPlugin = {
        version: '4.0.0',
        async init() {
            registerDataSource();
            injectUI();
            await refresh();
        },
        async unload() {
            const ext = window.MP3AppExtension;

            // 清理 HLS 实例
            if (window.MP3HlsPlayer) {
                try { window.MP3HlsPlayer.destroy(); } catch (e) {}
                try { window.MP3HlsPlayer.clearCache(); } catch (e) {}
            }

            // 交给 Core 处理播放停止 + 数据清理
            if (ext) {
                ext.stopIfPlayingFrom('news');
                ext.removeSourceData({
                    sourceKeys: ['news'],
                    categoryNames: [CONFIG.categoryName]
                });
                ext.renderAll();
            }

            if (uiRoot) { uiRoot.remove(); uiRoot = null; }
            if (window.MP3DataSourceHandlers) delete window.MP3DataSourceHandlers['news'];
            if (typeof window.refreshSourceFilterOptions === 'function') window.refreshSourceFilterOptions();
            lastMeta = null;
            loadedPages.clear();
            loading = false;
        },
        maybeAutoLoad
    };
})();