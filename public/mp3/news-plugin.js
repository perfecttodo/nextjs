/**
 * News 播放列表插件 v3.0（Core API 版）
 *
 * 相对 v2.11 的改动：
 *  - play 内的 UI 同步（标题/badge/renderTable/updatePlayButton/syncMediaSession）
 *    全部删除，改由主程序 applyPlaybackUI 统一处理
 *  - 加载使用 ext.decorateFiles / ext.ensureSourceCategory
 *  - 卸载使用 ext.stopIfPlayingFrom / ext.removeSourceData
 *  - HLS 播放统一用 ext.playMedia（不再自己 ensureHlsPlayer / destroy）
 *  - 保留 news 特有：分页加载、loop 回绕、预取、兜底切歌、MediaSession 覆盖
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

    let newsLoopMedia = null;
    let newsLoopBound = false;
    let lastSeekTime = 0;
    let playedPastStart = false;

    let bgEndTimer = null;
    let bgEndKey = null;
    let switchingNext = false;
    let mediaSessionSetup = false;

    // ==================== 音频会话 / Media Session ====================
    function setupAudioSession() {
        if (navigator.audioSession) {
            try { navigator.audioSession.type = 'playback'; } catch (e) {}
        }
    }

    function setupMediaSessionForNews() {
        if (mediaSessionSetup || !('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                playNextNewsInBackground();
            });
            mediaSessionSetup = true;
        } catch (e) {}
    }

    function teardownMediaSession() {
        if (!('mediaSession' in navigator)) return;
        try { navigator.mediaSession.setActionHandler('nexttrack', null); } catch (e) {}
        mediaSessionSetup = false;
    }

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

    // ==================== loop 回绕控制 ====================
    function getNextNewsFile() {
        const ext = window.MP3AppExtension;
        if (!ext) return null;
        const newsFiles = ext.allFiles.filter(f => f._source === 'news');
        if (!newsFiles.length) return null;
        const curKey = ext.currentPlayingFile;
        const idx = newsFiles.findIndex(f => window.getFileKey(f) === curKey);
        if (idx < 0) return newsFiles[0];
        return newsFiles[(idx + 1) % newsFiles.length];
    }

    function isNaturalWrap(from, to, dur) {
        if (!playedPastStart) return false;
        if (!isFinite(dur) || dur < 5) return false;
        return from > 3 && to < 1.5 && (from - to) > 2;
    }

    function attachNewsLoopControl(media) {
        if (!media) return;
        if (newsLoopBound && newsLoopMedia === media) {
            media.loop = true;
            return;
        }
        detachNewsLoopControl();
        newsLoopMedia = media;
        newsLoopBound = true;
        media.loop = true;
        playedPastStart = false;
        lastSeekTime = media.currentTime || 0;

        const onTimeUpdate = () => {
            const t = media.currentTime || 0;
            if (t > 1) playedPastStart = true;
            lastSeekTime = t;
        };

        const onSeeking = () => {
            const from = lastSeekTime;
            const to = media.currentTime || 0;
            if (isNaturalWrap(from, to, media.duration)) {
                try { media.pause(); } catch (e) {}
                playNextNewsInBackground();
            } else if (to > 1) {
                playedPastStart = true;
            }
            lastSeekTime = to;
        };

        const onEnded = () => {
            playNextNewsInBackground();
        };

        const onEmptied = () => {
            setTimeout(() => {
                const ext = window.MP3AppExtension;
                const key = ext?.currentPlayingFile;
                if (!key || !String(key).startsWith('[News]')) {
                    detachNewsLoopControl();
                }
            }, 500);
        };

        media.addEventListener('timeupdate', onTimeUpdate);
        media.addEventListener('seeking', onSeeking);
        media.addEventListener('ended', onEnded);
        media.addEventListener('emptied', onEmptied);

        media._newsOnTimeUpdate = onTimeUpdate;
        media._newsOnSeeking = onSeeking;
        media._newsOnEnded = onEnded;
        media._newsOnEmptied = onEmptied;
    }

    function detachNewsLoopControl() {
        if (newsLoopMedia) {
            try { newsLoopMedia.loop = false; } catch (e) {}
            if (newsLoopMedia._newsOnTimeUpdate) newsLoopMedia.removeEventListener('timeupdate', newsLoopMedia._newsOnTimeUpdate);
            if (newsLoopMedia._newsOnSeeking) newsLoopMedia.removeEventListener('seeking', newsLoopMedia._newsOnSeeking);
            if (newsLoopMedia._newsOnEnded) newsLoopMedia.removeEventListener('ended', newsLoopMedia._newsOnEnded);
            if (newsLoopMedia._newsOnEmptied) newsLoopMedia.removeEventListener('emptied', newsLoopMedia._newsOnEmptied);
            newsLoopMedia._newsOnTimeUpdate = null;
            newsLoopMedia._newsOnSeeking = null;
            newsLoopMedia._newsOnEnded = null;
            newsLoopMedia._newsOnEmptied = null;
        }
        newsLoopMedia = null;
        newsLoopBound = false;
        playedPastStart = false;
    }

    // ==================== 预取 & 兜底 ====================
    function prefetchNextNews() {
        if (!window.MP3HlsPlayer) return;
        const next = getNextNewsFile();
        const url = next?._newsItem?.url;
        if (!url) return;
        if (!/\.m3u8(\?|$)/i.test(url)) return;
        window.MP3HlsPlayer.prefetch(url);
    }

    function stopBackgroundEndCheck() {
        if (bgEndTimer) {
            clearInterval(bgEndTimer);
            bgEndTimer = null;
        }
        bgEndKey = null;
    }

    function startFallbackCheck(media, fileKey) {
        stopBackgroundEndCheck();
        if (!media || !fileKey) return;
        bgEndKey = fileKey;
        let lastT = media.currentTime || 0;
        let stagnant = 0;
        bgEndTimer = setInterval(() => {
            if (switchingNext) return;
            const ext = window.MP3AppExtension;
            if (!ext || ext.currentPlayingFile !== bgEndKey) { stopBackgroundEndCheck(); return; }
            if (!media || media.paused) { lastT = media.currentTime || 0; stagnant = 0; return; }
            const t = media.currentTime || 0;
            if (Math.abs(t - lastT) < 0.1 && media.readyState >= 3) {
                stagnant++;
                if (stagnant >= 3) {
                    try { media.pause(); } catch (e) {}
                    playNextNewsInBackground();
                    return;
                }
            } else {
                stagnant = 0;
            }
            lastT = t;
        }, 2000);
    }

    function playNextNewsInBackground() {
        if (switchingNext) return;
        const nextFile = getNextNewsFile();
        if (!nextFile) return;
        switchingNext = true;
        stopBackgroundEndCheck();
        const handler = window.MP3DataSourceHandlers && window.MP3DataSourceHandlers['news'];
        if (!handler || typeof handler.play !== 'function') {
            switchingNext = false;
            return;
        }
        try {
            Promise.resolve(handler.play(nextFile))
                .catch(e => console.warn('[News BG] next failed:', e))
                .finally(() => { switchingNext = false; });
        } catch (e) {
            switchingNext = false;
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

        // ★ 用 Core 统一装饰
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

    // ==================== 数据源注册 ====================
    function registerDataSource() {
        window.MP3DataSourceHandlers = window.MP3DataSourceHandlers || {};
        window.MP3DataSourceHandlers['news'] = {
            reset() {},
            play: async (file) => {
                const ext = window.MP3AppExtension;
                if (!ext) return;
                const item = file._newsItem;
                if (!item || !item.url) { setStatus('该条新闻缺少播放地址', 'error'); throw new Error('无播放地址'); }

                setupAudioSession();
                stopBackgroundEndCheck();

                try {
                    setStatus('正在加载音频…');
                    const isHls = /\.m3u8(\?|$)/i.test(item.url) || item.format === 'application/vnd.apple.mpegurl';

                    // ★ 统一用 Core 的 playMedia，HLS / 直链判断自动化
                    await ext.playMedia(item.url, {
                        type: isHls ? 'hls' : 'auto',
                        onStatus: setStatus,
                        isActive: () => {
                            const key = ext.currentPlayingFile;
                            return !!key && String(key).startsWith('[News]');
                        }
                    });

                    // ★ 以下为 news 特有逻辑（UI 同步由主程序 applyPlaybackUI 统一负责）
                    attachNewsLoopControl(ext.audioPlayer);
                    prefetchNextNews();
                    setupMediaSessionForNews();
                    startFallbackCheck(ext.audioPlayer, window.getFileKey(file));

                    setStatus('▶️ ' + file.displayName, 'success');
                } catch (e) {
                    console.error('[News] 播放失败:', e);
                    setStatus('播放失败：' + e.message, 'error');
                    throw e;
                }
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
        version: '3.0.0',
        async init() {
            setupAudioSession();
            registerDataSource();
            injectUI();
            await refresh();
        },
        async unload() {
            const ext = window.MP3AppExtension;

            stopBackgroundEndCheck();
            detachNewsLoopControl();
            teardownMediaSession();
            switchingNext = false;

            if (window.MP3HlsPlayer) {
                try { window.MP3HlsPlayer.destroy(); } catch (e) {}
                try { window.MP3HlsPlayer.clearCache(); } catch (e) {}
            }

            if (ext) {
                // ★ 用 Core 统一清理
                ext.stopIfPlayingFrom('news');
                ext.removeSourceData({
                    sourceKeys: ['news'],
                    categoryNames: [CONFIG.categoryName]
                });
                ext.updatePlayButton();
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