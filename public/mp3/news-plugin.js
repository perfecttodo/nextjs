/**
 * News 播放列表插件 v2.10
 *
 * 相对 v2.9 的改动（弱网下后台播放稳定性）：
 *  1. 网络状态感知：offline → hls.stopLoad，online → hls.startLoad（hls.js 管道）。
 *     原生 HLS 管道下浏览器自行管理，仅靠 waiting 守护兜底。
 *  2. hls.js 缓冲策略放宽：maxBufferLength 30→60s，maxMaxBufferLength 120s，
 *     fragLoadingMaxRetry 3→5，为弱网争取更多容错时间。
 *  3. 弱网错误恢复：NETWORK_ERROR 且 navigator.onLine===false 时不立即判死，
 *     延迟到 online 事件恢复，避免离线状态下的假性致命错误。
 *  4. waiting 事件驱动的保活守护：仅在缓冲停滞时启动一个 30s 低频 setTimeout，
 *     替代高频轮询，为弱网恢复留出窗口。
 *  5. 弱网下前台恢复更宽容：offline 期间切回前台不强行 play，避免未就绪状态下
 *     触发 iOS 的 NotAllowedError。
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
    let hlsAttachedMedia = null;

    let visibilityHandler = null;
    let wasPlayingBeforeHidden = false;

    // HLS 暂停/播放联动
    let hlsPauseBound = false;
    let hlsStoppedByPause = false;
    let hlsBoundMedia = null;

    // loop 回绕控制
    let newsLoopMedia = null;
    let newsLoopBound = false;
    let lastSeekTime = 0;
    let playedPastStart = false;

    // 兜底 & 预取 & MediaSession
    let bgEndTimer = null;
    let bgEndKey = null;
    let switchingNext = false;
    let mediaSessionSetup = false;
    const preflightCache = new Map();

    // ★ 弱网相关
    let hlsStoppedByNetwork = false;
    let waitingGuardMedia = null;
    let waitingGuardTimer = null;
    let networkOfflineHandler = null;
    let networkOnlineHandler = null;

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

    // ==================== 网络状态感知（hls.js 管道） ====================
    function setupNetworkListeners() {
        teardownNetworkListeners();

        networkOfflineHandler = () => {
            console.log('[News Network] offline');
            if (hlsInstance) {
                try {
                    hlsInstance.stopLoad();
                    hlsStoppedByNetwork = true;
                    console.log('[News Network] hls.stopLoad (offline)');
                } catch (e) {}
            }
        };

        networkOnlineHandler = () => {
            console.log('[News Network] online');
            if (!hlsInstance) return;
            // 若因 pause 停止加载，交给 play 事件恢复，不在此处干预
            if (hlsStoppedByPause) return;
            if (!hlsStoppedByNetwork) return;
            try {
                const media = hlsAttachedMedia;
                const t = media && isFinite(media.currentTime) ? media.currentTime : -1;
                hlsInstance.startLoad(t > 0 ? t - 1 : -1);
                hlsStoppedByNetwork = false;
                console.log('[News Network] hls.startLoad (online)', t);
            } catch (e) {}
        };

        window.addEventListener('offline', networkOfflineHandler);
        window.addEventListener('online', networkOnlineHandler);
    }

    function teardownNetworkListeners() {
        if (networkOfflineHandler) {
            window.removeEventListener('offline', networkOfflineHandler);
            networkOfflineHandler = null;
        }
        if (networkOnlineHandler) {
            window.removeEventListener('online', networkOnlineHandler);
            networkOnlineHandler = null;
        }
    }

    // ==================== 弱网 waiting 守护 ====================
    function detachWeakNetworkGuard() {
        if (waitingGuardTimer) {
            clearTimeout(waitingGuardTimer);
            waitingGuardTimer = null;
        }
        if (waitingGuardMedia) {
            if (waitingGuardMedia._newsOnWaiting) waitingGuardMedia.removeEventListener('waiting', waitingGuardMedia._newsOnWaiting);
            if (waitingGuardMedia._newsOnPlaying) waitingGuardMedia.removeEventListener('playing', waitingGuardMedia._newsOnPlaying);
            waitingGuardMedia._newsOnWaiting = null;
            waitingGuardMedia._newsOnPlaying = null;
        }
        waitingGuardMedia = null;
    }

    function attachWeakNetworkGuard(media) {
        if (!media) return;
        if (waitingGuardMedia === media && media._newsOnWaiting) return;
        detachWeakNetworkGuard();
        waitingGuardMedia = media;

        const onWaiting = () => {
            console.log('[News WeakNet] waiting');
            if (waitingGuardTimer) clearTimeout(waitingGuardTimer);
            // 30s 内仍未恢复才介入，给 hls.js 缓冲和重试留出窗口
            waitingGuardTimer = setTimeout(() => {
                waitingGuardTimer = null;
                if (media.readyState >= 3) return; // 已恢复
                // 若离线或用户已切换，不强行操作
                const ext = window.MP3AppExtension;
                const key = ext?.currentPlayingFile;
                if (!key || !String(key).startsWith('[News]')) return;
                if (!navigator.onLine) {
                    console.log('[News WeakNet] still waiting, but offline — hold');
                    return;
                }
                console.log('[News WeakNet] waiting too long, attempting recovery');
                if (hlsInstance) {
                    try {
                        hlsInstance.startLoad(media.currentTime || -1);
                        hlsStoppedByNetwork = false;
                    } catch (e) {}
                } else {
                    // 原生 HLS 管道：轻量重建
                    const t = media.currentTime || 0;
                    try {
                        media.load();
                        media.currentTime = t;
                        media.play().catch(() => {});
                    } catch (e) {}
                }
            }, 30000);
        };

        const onPlaying = () => {
            if (waitingGuardTimer) {
                clearTimeout(waitingGuardTimer);
                waitingGuardTimer = null;
            }
        };

        media.addEventListener('waiting', onWaiting);
        media.addEventListener('playing', onPlaying);
        media._newsOnWaiting = onWaiting;
        media._newsOnPlaying = onPlaying;
    }

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

    // ==================== loop 回绕控制（主路径） ====================
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
                console.log('[News Loop] natural wrap:', from.toFixed(2), '→', to.toFixed(2));
                try { media.pause(); } catch (e) {}
                playNextNewsInBackground();
            } else if (to > 1) {
                playedPastStart = true;
            }
            lastSeekTime = to;
        };

        const onEnded = () => {
            console.log('[News Loop] unexpected ended, switching');
            playNextNewsInBackground();
        };

        const onEmptied = () => {
            setTimeout(() => {
                const ext = window.MP3AppExtension;
                const key = ext?.currentPlayingFile;
                if (!key || !String(key).startsWith('[News]')) {
                    console.log('[News Loop] detached (source changed)');
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
        const next = getNextNewsFile();
        const url = next?._newsItem?.url;
        if (!url) return;
        if (preflightCache.get(url) === true) return;
        preflightM3u8(url)
            .then(() => preflightCache.set(url, true))
            .catch(() => preflightCache.set(url, false));
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
            // 有足够缓冲但时间不走 → 可能是管道卡死（区别于弱网缓冲）
            if (Math.abs(t - lastT) < 0.1 && media.readyState >= 3) {
                stagnant++;
                if (stagnant >= 3) {
                    console.log('[News Fallback] playback stalled, forcing switch');
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
            console.warn('[News BG] next throw:', e);
            switchingNext = false;
        }
    }

    // ==================== HLS 暂停/播放联动 ====================
    function onHlsPause() {
        if (!hlsInstance) return;
        try {
            hlsInstance.stopLoad();
            hlsStoppedByPause = true;
            console.log('[News HLS] media pause → hls.stopLoad');
        } catch (e) {}
    }

    function onHlsPlay() {
        if (!hlsInstance || !hlsStoppedByPause) return;
        try {
            hlsInstance.startLoad();
            hlsStoppedByPause = false;
            hlsStoppedByNetwork = false;
            console.log('[News HLS] media play → hls.startLoad');
        } catch (e) {}
    }

    function bindHlsPauseControl(media) {
        if (!media) return;
        if (hlsPauseBound && hlsBoundMedia === media) return;
        if (hlsBoundMedia) {
            hlsBoundMedia.removeEventListener('pause', onHlsPause);
            hlsBoundMedia.removeEventListener('play', onHlsPlay);
        }
        hlsBoundMedia = media;
        hlsPauseBound = true;
        media.addEventListener('pause', onHlsPause);
        media.addEventListener('play', onHlsPlay);
    }

    function unbindHlsPauseControl() {
        if (hlsBoundMedia) {
            hlsBoundMedia.removeEventListener('pause', onHlsPause);
            hlsBoundMedia.removeEventListener('play', onHlsPlay);
        }
        hlsBoundMedia = null;
        hlsPauseBound = false;
        hlsStoppedByPause = false;
    }

    // ==================== 可见性处理 & 前台恢复 ====================
    function attachVisibilityHandler(media) {
        cleanupVisibilityHandler();
        visibilityHandler = () => {
            if (document.visibilityState === 'hidden') {
                wasPlayingBeforeHidden = !media.paused;
                return;
            }
            // visible 分支
            const offline = !navigator.onLine;
            if (wasPlayingBeforeHidden && !media.paused && media.readyState < 2) {
                if (offline) {
                    console.log('[News] foreground recovery skipped (offline)');
                    return;
                }
                console.log('[News] foreground recovery: pipe dead, reload');
                const t = media.currentTime || 0;
                try {
                    media.pause();
                    media.load();
                    media.currentTime = t;
                    media.play().catch(() => {});
                } catch (e) {}
            }
            if (wasPlayingBeforeHidden && media.paused) {
                if (offline) {
                    console.log('[News] foreground resume skipped (offline)');
                    return;
                }
                media.play().catch(() => {});
            }
            if (hlsInstance) {
                try {
                    const buffered = media.buffered;
                    let hasBuffer = false;
                    const t = media.currentTime || 0;
                    for (let i = 0; i < buffered.length; i++) {
                        if (buffered.start(i) <= t && buffered.end(i) > t + 0.5) { hasBuffer = true; break; }
                    }
                    if (!hasBuffer && !offline) {
                        hlsInstance.startLoad(t > 0 ? t - 1 : -1);
                        hlsStoppedByNetwork = false;
                    }
                } catch (e) {}
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

    // ==================== 播放 ====================
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

    function prefersNativeHls(media) {
        const ua = navigator.userAgent;
        const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|Chromium|Edg|OPR|Android/i.test(ua);
        const isIOS = /iP(hone|ad|od)/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (!(isSafari || isIOS)) return false;
        try {
            return media.canPlayType('application/vnd.apple.mpegurl') !== '';
        } catch (e) {
            return false;
        }
    }

    async function playHls(url) {
        const ext = window.MP3AppExtension;
        const media = ext.audioPlayer;

        console.log('[News HLS] playHls:', url,
            'nativePreferred =', prefersNativeHls(media),
            'hlsReuse =', !!(hlsInstance && hlsAttachedMedia === media),
            'preflightCached =', preflightCache.get(url),
            'online =', navigator.onLine);

        if (!navigator.onLine) {
            // 离线时仍允许尝试播放（原生管道可能命中本地缓存），但跳过预检
            console.log('[News HLS] offline, skip preflight');
        } else if (preflightCache.get(url) !== true) {
            try {
                setStatus('正在检查 m3u8…');
                await preflightM3u8(url);
                preflightCache.set(url, true);
            } catch (e) {
                preflightCache.set(url, false);
                throw new Error('m3u8 预检失败：' + e.message);
            }
        }

        if (prefersNativeHls(media)) {
            try {
                setStatus('正在使用原生 HLS…');
                destroyHls();
                await playWithNativeHls(media, url);
                return;
            } catch (e) {
                console.warn('[News HLS] 原生 HLS 失败，降级 hls.js:', e.message);
            }
        }

        try {
            await ensureHlsJs();
            if (window.Hls && window.Hls.isSupported()) {
                if (hlsInstance && hlsAttachedMedia === media) {
                    try {
                        await switchHlsSource(media, url);
                        return;
                    } catch (e) {
                        console.warn('[News HLS] 复用失败，降级重建:', e.message);
                        destroyHls();
                    }
                }
                await createAndPlayHls(media, url);
                return;
            }
        } catch (e) {
            console.warn('[News HLS] hls.js 失败，尝试原生:', e.message);
        }

        if (media.canPlayType('application/vnd.apple.mpegurl')) {
            destroyHls();
            await playWithNativeHls(media, url);
            return;
        }
        throw new Error('浏览器不支持 HLS');
    }

    async function switchHlsSource(media, url) {
        return new Promise((resolve, reject) => {
            const hls = hlsInstance;
            let settled = false;
            const finish = (fn, arg) => { if (settled) return; settled = true; fn(arg); };

            const onParsed = () => {
                cleanup();
                media.play()
                    .then(() => {
                        attachVisibilityHandler(media);
                        bindHlsPauseControl(media);
                        attachWeakNetworkGuard(media);
                        finish(resolve);
                    })
                    .catch(err => finish(reject, new Error('切换后播放失败: ' + err.message)));
            };

            const onError = (e, data) => {
                if (!data.fatal) return;
                // 弱网保护：离线时不立即判死
                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR && !navigator.onLine) {
                    console.log('[News HLS] switch network error while offline, deferring');
                    hlsStoppedByNetwork = true;
                    return;
                }
                cleanup();
                finish(reject, new Error(`${data.type}/${data.details}`));
            };

            const onTimeout = () => { cleanup(); finish(reject, new Error('切换 HLS 源超时')); };

            const cleanup = () => {
                clearTimeout(timeoutId);
                try { hls.off(window.Hls.Events.MANIFEST_PARSED, onParsed); } catch (e) {}
                try { hls.off(window.Hls.Events.ERROR, onError); } catch (e) {}
            };

            hls.on(window.Hls.Events.MANIFEST_PARSED, onParsed);
            hls.on(window.Hls.Events.ERROR, onError);
            const timeoutId = setTimeout(onTimeout, 12000);

            try {
                try { hls.stopLoad(); } catch (e) {}
                hls.loadSource(url);
                if (hls.media !== media) hls.attachMedia(media);
                try { hls.startLoad(); } catch (e) {}
                hlsStoppedByPause = false;
                hlsStoppedByNetwork = false;
            } catch (e) {
                cleanup();
                finish(reject, e);
            }
        });
    }

    async function createAndPlayHls(media, url) {
        return new Promise((resolve, reject) => {
            const hls = new window.Hls({
                lowLatencyMode: false,
                enableWorker: true,

                // ★ 弱网缓冲策略：为缓冲抖动预留空间
                maxBufferLength: 60,
                maxMaxBufferLength: 120,
                backBufferLength: 30,

                // ★ 弱网重试策略：放宽上限
                manifestLoadingMaxRetry: 3,
                manifestLoadingRetryDelay: 1000,
                fragLoadingMaxRetry: 5,
                fragLoadingRetryDelay: 1000,
                fragLoadingMaxRetryTimeout: 15000,
                appendErrorMaxRetry: 3,

                startLevel: -1
            });
            hlsInstance = hls;
            hlsAttachedMedia = media;

            let recoveredNetwork = false;
            let recoveredMedia = false;

            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('HLS 加载超时（20s）'));
            }, 20000); // 弱网下稍微放宽

            const cleanup = () => {
                clearTimeout(timeout);
                try { hls.off(window.Hls.Events.MANIFEST_PARSED, onParsed); } catch (e) {}
                try { hls.off(window.Hls.Events.ERROR, onError); } catch (e) {}
            };

            const onParsed = () => {
                cleanup();
                media.play()
                    .then(() => {
                        attachVisibilityHandler(media);
                        bindHlsPauseControl(media);
                        attachWeakNetworkGuard(media);
                        resolve();
                    })
                    .catch(err => reject(new Error('播放失败: ' + err.message)));
            };

            const onError = (e, data) => {
                if (!data.fatal) return;

                // ★ 弱网保护：离线期间不判死，等待 online 事件恢复
                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR && !navigator.onLine) {
                    console.log('[News HLS] network error while offline, deferring recovery');
                    hlsStoppedByNetwork = true;
                    return;
                }

                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR && !recoveredNetwork) {
                    recoveredNetwork = true;
                    try { hls.startLoad(); return; } catch (er) {}
                }
                if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR && !recoveredMedia) {
                    recoveredMedia = true;
                    try { hls.recoverMediaError(); return; } catch (er) {}
                }
                cleanup();
                reject(new Error(`${data.type}/${data.details}`));
            };

            hls.on(window.Hls.Events.MANIFEST_PARSED, onParsed);
            hls.on(window.Hls.Events.ERROR, onError);

            hls.loadSource(url);
            hls.attachMedia(media);
            hlsStoppedByPause = false;
            hlsStoppedByNetwork = false;
        });
    }

    async function playWithNativeHls(media, url) {
        return new Promise((resolve, reject) => {
            try { media.removeAttribute('src'); } catch (e) {}
            try { media.load(); } catch (e) {}

            media.crossOrigin = 'anonymous';
            media.src = url;
            // 弱网下原生管道首次加载可能较慢，超时放宽到 20s
            const timeout = setTimeout(() => { cleanup(); reject(new Error('原生 HLS 加载超时 20s')); }, 20000);
            const onLoaded = () => {
                cleanup();
                media.play()
                    .then(() => {
                        attachVisibilityHandler(media);
                        attachWeakNetworkGuard(media);
                        resolve();
                    })
                    .catch(err => reject(new Error('原生播放失败: ' + err.message)));
            };
            const onError = () => { cleanup(); reject(new Error('原生播放失败')); };
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

    function destroyHls() {
        cleanupVisibilityHandler();
        unbindHlsPauseControl();
        detachWeakNetworkGuard();
        hlsStoppedByNetwork = false;
        if (hlsInstance) {
            try { hlsInstance.destroy(); } catch (e) {}
            hlsInstance = null;
            hlsAttachedMedia = null;
        }
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
                if (!item || !item.url) { setStatus('该条新闻缺少播放地址', 'error'); return; }
                const url = item.url;
                const isHls = /\.m3u8(\?|$)/i.test(url) || item.format === 'application/vnd.apple.mpegurl';

                setupAudioSession();
                stopBackgroundEndCheck();

                try {
                    setStatus('正在加载音频…');
                    if (isHls) {
                        await playHls(url);
                    } else {
                        destroyHls();
                        ext.audioPlayer.crossOrigin = null;
                        ext.audioPlayer.src = url;
                        await ext.audioPlayer.play().catch(e => { throw new Error('播放失败：' + e.message); });
                        attachWeakNetworkGuard(ext.audioPlayer);
                    }
                    ext.currentPlayingFile = window.getFileKey(file);
                    document.getElementById('currentSongTitle').innerText = file.displayName;
                    document.getElementById('currentSongCategory').innerText = file.category;
                    if (typeof window.MP3SetPlayerSourceBadge === 'function') window.MP3SetPlayerSourceBadge(file);
                    ext.updatePlayerLikeState();
                    ext.updatePlayerDislikeState();
                    ext.renderTable();
                    ext.updatePlayButton();
                    if (window.MP3AppExtension?.syncMediaSession) window.MP3AppExtension.syncMediaSession();

                    attachNewsLoopControl(ext.audioPlayer);
                    prefetchNextNews();
                    setupMediaSessionForNews();
                    startFallbackCheck(ext.audioPlayer, ext.currentPlayingFile);

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
        version: '2.10.0',
        async init() {
            setupAudioSession();
            setupNetworkListeners();
            registerDataSource();
            injectUI();
            await refresh();
        },
        async unload() {
            const ext = window.MP3AppExtension;

            stopBackgroundEndCheck();
            detachNewsLoopControl();
            teardownMediaSession();
            teardownNetworkListeners();
            switchingNext = false;

            destroyHls();
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
                    if (typeof window.MP3SetPlayerSourceBadge === 'function') window.MP3SetPlayerSourceBadge(null);
                }
                ext.updatePlayButton();
                ext.updatePlayerLikeState();
                ext.updatePlayerDislikeState();
                ext.renderAll();
            }
            if (uiRoot) { uiRoot.remove(); uiRoot = null; }
            if (window.MP3DataSourceHandlers) delete window.MP3DataSourceHandlers['news'];
            if (typeof window.refreshSourceFilterOptions === 'function') window.refreshSourceFilterOptions();
            preflightCache.clear();
            lastMeta = null;
            loadedPages.clear();
            loading = false;
        },
        maybeAutoLoad
    };
})();