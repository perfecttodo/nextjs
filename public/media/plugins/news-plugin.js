/**
 * News 播放列表插件 v4.1（Player-agnostic）
 *
 * 职责边界：
 *  - 通过 API 加载新闻列表（分页）
 *  - 提供 resolveMedia：只返回 { url, mimeType }，由 core-player 决定怎么播
 *  - UI 状态显示
 *  - 下一首 prefetch（性能优化，无副作用）
 *
 * 不负责：
 *  - HLS 播放 / loop / ended 检测   → hls-player + core-player
 *  - 播放器实例 / audioPlayer.src   → core-player
 *  - currentPlayingFile / UI 同步   → 主程序 applyPlaybackUI
 *  - 数据清理（stopIfPlayingFrom）  → Core Adapter.unload
 */
(function () {
    'use strict';

    const CONFIG = {
        apiBase: '/api/mp3/news',
        categoryName: '📰 News',
        apiPageSize: 30
    };

    let uiRoot = null;
    let adapterHandle = null;
    let lastMeta = null;
    let loadedPages = new Set();
    let loading = false;
    let rawCache = []; // 原始新闻条目（未装饰），adapter.list() 返回此数组

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

    // ==================== 分页加载（只入 rawCache） ====================
    async function fetchPageIntoCache(page) {
        const url = `${CONFIG.apiBase}?page=${page}&limit=${CONFIG.apiPageSize}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || !Array.isArray(data.data)) throw new Error('API 返回格式不正确');
        lastMeta = {
            total: Number(data.total) || 0,
            totalPages: Number(data.totalPages) || 1
        };
        const rawFiles = (data.data || []).map(buildFileEntry);
        rawCache = rawCache.concat(rawFiles);
        loadedPages.add(page);
    }

    async function refresh() {
        if (loading) return;
        loading = true;
        setStatus('正在加载…');
        try {
            rawCache = [];
            loadedPages.clear();
            lastMeta = null;
            await fetchPageIntoCache(1);
            // 让 adapter 从 rawCache 拉数据并替换 allFiles 里的 news 项
            await adapterHandle?.refresh();
            setStatus(`✅ 已加载 ${CONFIG.apiPageSize} 条`, 'success');
            renderCard();
        } catch (e) {
            setStatus('加载失败：' + e.message, 'error');
        } finally {
            loading = false;
        }
    }

    async function loadMore() {
        if (loading || !lastMeta) return;
        const maxLoaded = loadedPages.size > 0 ? Math.max(...loadedPages) : 0;
        const nextPage = maxLoaded + 1;
        if (nextPage > lastMeta.totalPages) return;
        loading = true;
        setStatus(`正在加载第 ${nextPage} 页…`);
        try {
            await fetchPageIntoCache(nextPage);
            await adapterHandle?.refresh();
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

    // ==================== 下一首预取 ====================
    function prefetchNextNews(currentFile) {
        const ext = window.MP3AppExtension;
        if (!ext) return;
        const newsFiles = ext.allFiles.filter(f => f._source === 'news');
        if (newsFiles.length < 1) return;

        const curKey = ext.getFileKey(currentFile);
        const idx = newsFiles.findIndex(f => ext.getFileKey(f) === curKey);
        if (idx < 0) return;

        const next = newsFiles[(idx + 1) % newsFiles.length];
        const url = next?._newsItem?.url;
        if (!url) return;
        if (!/\.m3u8(\?|$)/i.test(url)) return;

        // hls-player 已加载 → 直接预热 manifest
        if (window.MP3HlsPlayer) {
            window.MP3HlsPlayer.prefetch(url);
            return;
        }
        // 尚未加载 → 让 core-player 触发加载后再预热
        if (typeof ext.ensureHlsPlayer === 'function') {
            ext.ensureHlsPlayer()
                .then(() => window.MP3HlsPlayer?.prefetch(url))
                .catch(() => {});
        }
    }

    // ==================== Adapter 注册 ====================
    function registerAdapter() {
        adapterHandle = window.MP3RegisterSourceAdapter({
            id: 'news',
            categoryName: CONFIG.categoryName,
            onStatusChange: setStatus,

            // 返回原始数据（未装饰），adapter 内部会统一 decorate
            list: async () => {
                return { files: rawCache, total: rawCache.length, totalPages: 1 };
            },

            // 按 URL 后缀决定 mimeType，由 core-player 分发
            resolveMedia: async (file) => {
                const item = file._newsItem;
                if (!item || !item.url) throw new Error('该条新闻缺少播放地址');
                const isHls = /\.m3u8(\?|$)/i.test(item.url);
                return {
                    url: item.url,
                    mimeType: isHls ? 'application/vnd.apple.mpegurl' : 'audio/mpeg'
                };
            },

            // 播放开始后的副作用：预取下一首
            onPlaying: (file) => {
                prefetchNextNews(file);
                setStatus('▶️ ' + file.displayName, 'success');
            },

            // 卸载时的本源特有清理（核心清理由 adapter.unload 负责）
            onUnload: () => {
                rawCache = [];
                loadedPages.clear();
                lastMeta = null;
                if (uiRoot) { uiRoot.remove(); uiRoot = null; }
            }
        });
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
        version: '4.1.0',
        async init() {
            registerAdapter();
            injectUI();
            await refresh();
        },
        async unload() {
            // 清理 HLS 实例（若 news 正在播）
            if (window.MP3HlsPlayer) {
                try { window.MP3HlsPlayer.destroy(); } catch (e) {}
                try { window.MP3HlsPlayer.clearCache(); } catch (e) {}
            }
            // adapter.unload 内部会：
            //   1) 调 onUnload() 清本源 cache / UI
            //   2) stopIfPlayingFrom('news') → ext.destroyPlayer()
            //   3) removeSourceData({ sourceKeys:['news'], categoryNames:[...] })
            //   4) 删除 MP3DataSourceHandlers['news']
            await adapterHandle?.unload();
            adapterHandle = null;
            if (typeof window.refreshSourceFilterOptions === 'function') {
                window.refreshSourceFilterOptions();
            }
        },
        maybeAutoLoad
    };

    console.log('[MP3NewsPlugin] v4.1.0 ready（Player-agnostic）');
})();