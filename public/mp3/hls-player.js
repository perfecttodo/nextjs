/**
 * HLS 播放模块 v1.0.0
 *
 * 由数据源插件（如 news-plugin.js）在遇到 m3u8 资源时按需懒加载。
 * 提供：原生 HLS 优先、hls.js 降级、暂停联动、弱网守护、可见性恢复。
 *
 * 通过回调与上层解耦：
 *  - onStatus(msg, tone)：状态显示交给上层 UI（tone: 'error'|'success'|'warn'）
 *  - isActive()：判断当前业务源是否仍是本模块服务的数据源
 *
 * 对外 API（window.MP3HlsPlayer）：
 *  - supports(url)              → boolean
 *  - preflight(url)             → Promise<true>（失败抛出）
 *  - prefetch(url)              → Promise<boolean>（不抛异常）
 *  - play(media, url, options)  → Promise<void>
 *  - destroy()                  → void
 *  - clearCache()               → void
 */
(function () {
    'use strict';

    let hlsInstance = null;
    let hlsAttachedMedia = null;

    let visibilityHandler = null;
    let wasPlayingBeforeHidden = false;

    let hlsPauseBound = false;
    let hlsStoppedByPause = false;
    let hlsBoundMedia = null;

    let hlsStoppedByNetwork = false;
    let waitingGuardMedia = null;
    let waitingGuardTimer = null;
    let networkOfflineHandler = null;
    let networkOnlineHandler = null;

    let currentOptions = null;
    const preflightCache = new Map();

    // ==================== 回调 ====================
    function status(msg, tone) {
        if (currentOptions && typeof currentOptions.onStatus === 'function') {
            try { currentOptions.onStatus(msg, tone); } catch (e) {}
        }
    }

    function isActive() {
        if (currentOptions && typeof currentOptions.isActive === 'function') {
            try { return !!currentOptions.isActive(); } catch (e) { return true; }
        }
        return true;
    }

    // ==================== 网络状态感知（hls.js 管道） ====================
    function setupNetworkListeners() {
        teardownNetworkListeners();

        networkOfflineHandler = () => {
            console.log('[HLS Network] offline');
            if (hlsInstance) {
                try {
                    hlsInstance.stopLoad();
                    hlsStoppedByNetwork = true;
                    console.log('[HLS Network] hls.stopLoad (offline)');
                } catch (e) {}
            }
        };

        networkOnlineHandler = () => {
            console.log('[HLS Network] online');
            if (!hlsInstance) return;
            // 若因 pause 停止加载，交给 play 事件恢复，不在此处干预
            if (hlsStoppedByPause) return;
            if (!hlsStoppedByNetwork) return;
            try {
                const media = hlsAttachedMedia;
                const t = media && isFinite(media.currentTime) ? media.currentTime : -1;
                hlsInstance.startLoad(t > 0 ? t - 1 : -1);
                hlsStoppedByNetwork = false;
                console.log('[HLS Network] hls.startLoad (online)', t);
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
            if (waitingGuardMedia._hlsOnWaiting) waitingGuardMedia.removeEventListener('waiting', waitingGuardMedia._hlsOnWaiting);
            if (waitingGuardMedia._hlsOnPlaying) waitingGuardMedia.removeEventListener('playing', waitingGuardMedia._hlsOnPlaying);
            waitingGuardMedia._hlsOnWaiting = null;
            waitingGuardMedia._hlsOnPlaying = null;
        }
        waitingGuardMedia = null;
    }

    function attachWeakNetworkGuard(media) {
        if (!media) return;
        if (waitingGuardMedia === media && media._hlsOnWaiting) return;
        detachWeakNetworkGuard();
        waitingGuardMedia = media;

        const onWaiting = () => {
            console.log('[HLS WeakNet] waiting');
            if (waitingGuardTimer) clearTimeout(waitingGuardTimer);
            // 30s 内仍未恢复才介入，给 hls.js 缓冲和重试留出窗口
            waitingGuardTimer = setTimeout(() => {
                waitingGuardTimer = null;
                if (media.readyState >= 3) return; // 已恢复
                if (!isActive()) return;           // 业务源已切走，不干预
                if (!navigator.onLine) {
                    console.log('[HLS WeakNet] still waiting, but offline — hold');
                    return;
                }
                console.log('[HLS WeakNet] waiting too long, attempting recovery');
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
        media._hlsOnWaiting = onWaiting;
        media._hlsOnPlaying = onPlaying;
    }

    // ==================== hls.js CDN 加载 ====================
    function ensureHlsJs() {
        return new Promise((resolve, reject) => {
            if (window.Hls) return resolve();
            const existing = document.querySelector('script[data-hls-js]');
            if (existing) {
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', () => reject(new Error('hls.js 加载失败')));
                return;
            }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
            s.dataset.hlsJs = '1';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('hls.js 加载失败'));
            document.head.appendChild(s);
        });
    }

    // ==================== m3u8 预检 ====================
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

    // ==================== 暂停/播放联动 ====================
    function onHlsPause() {
        if (!hlsInstance) return;
        try {
            hlsInstance.stopLoad();
            hlsStoppedByPause = true;
            console.log('[HLS] media pause → hls.stopLoad');
        } catch (e) {}
    }

    function onHlsPlay() {
        if (!hlsInstance || !hlsStoppedByPause) return;
        try {
            hlsInstance.startLoad();
            hlsStoppedByPause = false;
            hlsStoppedByNetwork = false;
            console.log('[HLS] media play → hls.startLoad');
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
                    console.log('[HLS] foreground recovery skipped (offline)');
                    return;
                }
                console.log('[HLS] foreground recovery: pipe dead, reload');
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
                    console.log('[HLS] foreground resume skipped (offline)');
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

    // ==================== 播放主流程 ====================
    async function playHls(media, url) {
        console.log('[HLS] playHls:', url,
            'nativePreferred =', prefersNativeHls(media),
            'hlsReuse =', !!(hlsInstance && hlsAttachedMedia === media),
            'preflightCached =', preflightCache.get(url),
            'online =', navigator.onLine);

        if (!navigator.onLine) {
            // 离线时仍允许尝试播放（原生管道可能命中本地缓存），但跳过预检
            console.log('[HLS] offline, skip preflight');
        } else if (preflightCache.get(url) !== true) {
            try {
                status('正在检查 m3u8…');
                await preflightM3u8(url);
                preflightCache.set(url, true);
            } catch (e) {
                preflightCache.set(url, false);
                throw new Error('m3u8 预检失败：' + e.message);
            }
        }

        if (prefersNativeHls(media)) {
            try {
                status('正在使用原生 HLS…');
                destroyPipeline();
                await playWithNativeHls(media, url);
                return;
            } catch (e) {
                console.warn('[HLS] 原生 HLS 失败，降级 hls.js:', e.message);
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
                        console.warn('[HLS] 复用失败，降级重建:', e.message);
                        destroyPipeline();
                    }
                }
                await createAndPlayHls(media, url);
                return;
            }
        } catch (e) {
            console.warn('[HLS] hls.js 失败，尝试原生:', e.message);
        }

        if (media.canPlayType('application/vnd.apple.mpegurl')) {
            destroyPipeline();
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
                    console.log('[HLS] switch network error while offline, deferring');
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
                    console.log('[HLS] network error while offline, deferring recovery');
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

    // ==================== 清理 ====================
    function destroyPipeline() {
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

    function destroy() {
        destroyPipeline();
        teardownNetworkListeners();
        currentOptions = null;
    }

    // ==================== 对外 API ====================
    window.MP3HlsPlayer = {
        version: '1.0.0',

        supports(url) {
            return /\.m3u8(\?|$)/i.test(String(url || ''));
        },

        async preflight(url) {
            if (preflightCache.get(url) === true) return true;
            try {
                await preflightM3u8(url);
                preflightCache.set(url, true);
                return true;
            } catch (e) {
                preflightCache.set(url, false);
                throw e;
            }
        },

        prefetch(url) {
            return this.preflight(url).catch(() => false);
        },

        async play(media, url, options) {
            if (!media) throw new Error('hls-player: media 元素缺失');
            if (!url) throw new Error('hls-player: url 缺失');
            currentOptions = options || {};
            setupNetworkListeners();
            try {
                await playHls(media, url);
            } catch (e) {
                // 失败清理，但保留 preflightCache（可能是临时网络问题）
                destroyPipeline();
                teardownNetworkListeners();
                throw e;
            }
        },

        destroy,

        clearCache() {
            preflightCache.clear();
        }
    };
})();