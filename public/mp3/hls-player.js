/**
 * MP3 HLS Player v1.4
 *
 * v1.4 相对 v1.3 的关键修复：
 *  - 三重 ended 兜底：
 *      1) 原生 <video> ended（正常路径）
 *      2) Hls.Events.LEVEL_ENDED（hls.js 特有，最可靠）
 *      3) Watchdog：timeupdate 时 currentTime 接近 duration 但 paused
 *    任意一个先到 → dispatch 一次 ended，通知主程序切歌
 *  - 严格去重：endedFired 标记，避免三重兜底重复触发 playNext
 */
(function () {
    'use strict';

    const HLS_JS_CDN = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
    const MAX_NETWORK_RETRY = 4;
    const WATCHDOG_INTERVAL = 1000;
    const WATCHDOG_END_THRESHOLD = 0.5;   // 距结尾 0.5s 内 + paused → 视为 ended

    let hlsScriptPromise = null;
    let currentSession = 0;
    let hlsInstance = null;
    let currentAudioEl = null;
    let currentOnStatus = null;
    let mediaErrorRecovered = false;
    let networkRetryCount = 0;
    const prefetched = new Set();
    let recoveryListenersAttached = false;

    /* ============ 设备判定 ============ */
    function isIOSDevice() {
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
        if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
        return false;
    }

    function canPlayNative(audioEl) {
        if (!isIOSDevice()) return false;
        if (!audioEl || !audioEl.canPlayType) return false;
        const t = audioEl.canPlayType('application/vnd.apple.mpegurl');
        return t === 'maybe' || t === 'probably';
    }

    /* ============ hls.js 懒加载 ============ */
    function loadHlsScript() {
        if (window.Hls) return Promise.resolve(window.Hls);
        if (hlsScriptPromise) return hlsScriptPromise;

        hlsScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-mp3-hls-js]');
            if (existing) {
                if (window.Hls) { resolve(window.Hls); return; }
                existing.addEventListener('load', () => {
                    if (window.Hls) resolve(window.Hls);
                    else reject(new Error('hls.js 加载后未暴露 window.Hls'));
                });
                existing.addEventListener('error', () => reject(new Error('hls.js 加载失败')));
                return;
            }
            const s = document.createElement('script');
            s.src = HLS_JS_CDN;
            s.async = true;
            s.dataset.mp3HlsJs = '1';
            s.onload = () => {
                if (window.Hls) resolve(window.Hls);
                else reject(new Error('hls.js 加载后未暴露 window.Hls'));
            };
            s.onerror = () => reject(new Error('无法加载 hls.js'));
            document.head.appendChild(s);
        }).catch(e => {
            hlsScriptPromise = null;
            throw e;
        });

        return hlsScriptPromise;
    }

    /* ============ 会话有效性 ============ */
    function isStillActive(mySession) {
        return mySession === currentSession;
    }

    /* ============ 清理 ============ */
    function cleanupCurrent() {
        if (hlsInstance) {
            try { hlsInstance.destroy(); } catch (e) {}
            hlsInstance = null;
        }
        mediaErrorRecovered = false;
        networkRetryCount = 0;
    }

    async function resetAudioEl(audioEl) {
        try { audioEl.pause(); } catch (e) {}
        try {
            audioEl.removeAttribute('src');
            audioEl.load();
        } catch (e) {}
        await new Promise(r => setTimeout(r, 50));
    }

    /* ============ 主入口 ============ */
    async function play(audioEl, url, { onStatus } = {}) {
        if (!audioEl || !url) throw new Error('play: audioEl 或 url 为空');

        // ★ loop 永远关闭：ended 是切歌唯一信号
        try { audioEl.loop = false; } catch (e) {}

        // ★ 声明音频会话（iOS / Android 后台播放）
        try {
            if (navigator.audioSession) navigator.audioSession.type = 'playback';
        } catch (e) {}

        const mySession = ++currentSession;
        cleanupCurrent();

        currentAudioEl = audioEl;
        currentOnStatus = onStatus || (() => {});

        try { audioEl.pause(); } catch (e) {}
        try {
            audioEl.removeAttribute('src');
            audioEl.load();
        } catch (e) {}

        // 临时禁用 onerror（防止启动阶段主程序误切歌）
        const prevOnError = audioEl.onerror;
        audioEl.onerror = (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            return false;
        };

        /* ==================== ended 三重兜底 ==================== */
        let endedFired = false;

        const fireEnded = (source) => {
            if (endedFired) return;
            endedFired = true;
            if (!isStillActive(mySession)) return;
            console.log('[HLS] dispatch ended (source:', source + ')');
            try {
                audioEl.dispatchEvent(new Event('ended'));
            } catch (e) {}
        };

        // 兜底 1：原生 ended（正常路径）
        const onNativeEnded = () => {
            if (endedFired) return;
            endedFired = true;
            console.log('[HLS] native ended');
        };
        audioEl.addEventListener('ended', onNativeEnded);

        // 兜底 3：watchdog —— timeupdate 停在结尾且 paused
        const watchdog = setInterval(() => {
            if (endedFired || !isStillActive(mySession)) {
                clearInterval(watchdog);
                return;
            }
            const d = audioEl.duration;
            const t = audioEl.currentTime;
            if (!isFinite(d) || d <= 0) return;
            if (d - t < WATCHDOG_END_THRESHOLD && audioEl.paused) {
                console.log('[HLS] watchdog detected end (d=' + d.toFixed(2) + ' t=' + t.toFixed(2) + ' paused)');
                fireEnded('watchdog');
                clearInterval(watchdog);
            }
        }, WATCHDOG_INTERVAL);

        try {
            // ---------- iOS 原生 HLS ----------
            if (canPlayNative(audioEl)) {
                try {
                    currentOnStatus('正在加载 (原生 HLS)…');
                    audioEl.removeAttribute('crossorigin');
                    audioEl.src = url;
                    await audioEl.play();

                    if (!isStillActive(mySession)) return;
                    attachRecovery();
                    currentOnStatus('▶️ 播放中 (原生 HLS)', 'success');
                    return;
                } catch (e) {
                    if (!isStillActive(mySession)) return;
                    console.warn('[HLS] 原生播放失败，切换 hls.js:', e.message || e);
                    await resetAudioEl(audioEl);
                }
            }

            // ---------- hls.js 兜底 ----------
            const Hls = await loadHlsScript();
            if (!isStillActive(mySession)) return;

            if (!Hls || typeof Hls.isSupported !== 'function' || !Hls.isSupported()) {
                if (canPlayNative(audioEl)) {
                    try {
                        audioEl.removeAttribute('crossorigin');
                        audioEl.src = url;
                        await audioEl.play();
                        if (!isStillActive(mySession)) return;
                        attachRecovery();
                        currentOnStatus('▶️ 播放中 (原生 HLS)', 'success');
                        return;
                    } catch (e) {
                        throw new Error('HLS 播放失败：' + (e.message || e));
                    }
                }
                throw new Error('当前浏览器不支持 HLS 播放（MSE 不可用）');
            }

            currentOnStatus('正在加载 HLS 流…');

            hlsInstance = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                maxBufferSize: 60 * 1000 * 1000,
                enableWorker: true,
                lowLatencyMode: false,
                manifestLoadingMaxRetry: 3,
                levelLoadingMaxRetry: 4,
                fragLoadingMaxRetry: 6,
            });

            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                if (!isStillActive(mySession)) return;
                networkRetryCount = 0;
                audioEl.play().catch((err) => {
                    if (isStillActive(mySession)) {
                        currentOnStatus('自动播放被浏览器拦截，请点击播放按钮', 'warn');
                        console.warn('[HLS] autoplay blocked:', err);
                    }
                });
            });

            // ★ 兜底 2：Hls.Events.LEVEL_ENDED（最可靠的结束信号）
            hlsInstance.on(Hls.Events.LEVEL_ENDED, () => {
                if (!isStillActive(mySession)) return;
                console.log('[HLS] LEVEL_ENDED');
                fireEnded('LEVEL_ENDED');
            });

            hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                if (!isStillActive(mySession)) return;
                handleHlsError(data, mySession);
            });

            hlsInstance.on(Hls.Events.FRAG_LOADED, () => {
                if (!isStillActive(mySession)) return;
                networkRetryCount = 0;
                currentOnStatus('▶️ 播放中', 'success');
            });

            hlsInstance.attachMedia(audioEl);
            hlsInstance.loadSource(url);

            // 等待真正开始播放（或 15s 兜底）
            await new Promise((resolve) => {
                let settled = false;
                const finish = () => {
                    if (settled) return;
                    settled = true;
                    audioEl.removeEventListener('playing', finish);
                    audioEl.removeEventListener('error', finish);
                    resolve();
                };
                audioEl.addEventListener('playing', finish);
                audioEl.addEventListener('error', finish);
                setTimeout(finish, 15000);
            });

            if (!isStillActive(mySession)) return;
            attachRecovery();
            currentOnStatus('▶️ 播放中', 'success');
        } finally {
            // 恢复 onerror（仅当会话仍有效，防止覆盖新会话的绑定）
            if (currentSession === mySession) {
                audioEl.onerror = prevOnError;
            }
            // 移除原生 ended 监听器（防止泄漏，多余的 ended 由 fireEnded 去重）
            // 注意：不要在这里 clearInterval(watchdog)，
            //      因为切歌后 watchdog 会自动因 !isStillActive 而自行清理；
            //      如果同一首歌重播（如 single 模式），watchdog 不应被外部清掉，
            //      但 endedFired 重置在每次 play 调用时天然发生（新会话）。
        }
    }

    /* ============ hls.js 错误处理 ============ */
    function handleHlsError(data, mySession) {
        const Hls = window.Hls;
        if (!Hls) return;
        const { type, details, fatal } = data;

        if (type === Hls.ErrorTypes.NETWORK_ERROR) {
            if (fatal) {
                networkRetryCount++;
                if (networkRetryCount <= MAX_NETWORK_RETRY) {
                    const delay = Math.min(1000 * networkRetryCount, 5000);
                    currentOnStatus(`网络不稳定，${(delay / 1000).toFixed(0)}s 后重试…`, 'warn');
                    setTimeout(() => {
                        if (!isStillActive(mySession) || !hlsInstance) return;
                        try { hlsInstance.startLoad(); } catch (e) {}
                    }, delay);
                } else {
                    currentOnStatus('HLS 流反复失败，跳过', 'error');
                    if (currentAudioEl) {
                        try { currentAudioEl.dispatchEvent(new Event('error')); } catch (e) {}
                    }
                }
            }
            return;
        }

        if (type === Hls.ErrorTypes.MEDIA_ERROR) {
            if (!mediaErrorRecovered) {
                mediaErrorRecovered = true;
                currentOnStatus('媒体错误，正在恢复…', 'warn');
                try { hlsInstance.recoverMediaError(); } catch (e) {}
            } else {
                currentOnStatus('媒体错误无法恢复，跳过', 'error');
                if (currentAudioEl) {
                    try { currentAudioEl.dispatchEvent(new Event('error')); } catch (e) {}
                }
            }
            return;
        }

        if (fatal) {
            currentOnStatus('HLS 播放失败，跳过: ' + (details || type), 'error');
            if (currentAudioEl) {
                try { currentAudioEl.dispatchEvent(new Event('error')); } catch (e) {}
            }
        }
    }

    /* ============ 网络 / 可见性恢复 ============ */
    function attachRecovery() {
        if (recoveryListenersAttached) return;
        recoveryListenersAttached = true;
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
    }

    function onVisibilityChange() {
        if (document.visibilityState !== 'visible') return;
        if (!currentAudioEl) return;
        if (hlsInstance) {
            try {
                if (currentAudioEl.readyState < 3 && !currentAudioEl.paused) {
                    hlsInstance.startLoad();
                }
            } catch (e) {}
        }
    }

    function onOnline() {
        if (!currentAudioEl) return;
        if (hlsInstance) {
            try { hlsInstance.startLoad(); } catch (e) {}
        } else if (currentAudioEl.paused && currentAudioEl.src) {
            currentAudioEl.play().catch(() => {});
        }
        if (currentOnStatus) currentOnStatus('网络已恢复', 'success');
    }

    function onOffline() {
        if (!currentAudioEl) return;
        if (currentOnStatus) currentOnStatus('网络已断开，恢复后自动继续', 'warn');
    }

    /* ============ 销毁 ============ */
    function destroy() {
        currentSession++;
        cleanupCurrent();
        if (currentAudioEl) {
            try { currentAudioEl.pause(); } catch (e) {}
            try {
                currentAudioEl.removeAttribute('src');
                currentAudioEl.load();
            } catch (e) {}
        }
        currentAudioEl = null;
    }

    /* ============ 预取 / 缓存 ============ */
    function prefetch(url) {
        if (!url || prefetched.has(url)) return;
        if (!/\.m3u8(\?|$)/i.test(url)) return;
        prefetched.add(url);
        const doPrefetch = () => {
            fetch(url, { method: 'GET', cache: 'default', credentials: 'same-origin' })
                .then(r => r.text())
                .catch(() => {});
        };
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(doPrefetch, { timeout: 3000 });
        } else {
            setTimeout(doPrefetch, 800);
        }
    }

    function clearCache() {
        prefetched.clear();
        hlsScriptPromise = null;
    }

    function isSupported() {
        if (isIOSDevice()) return true;
        if (window.Hls && typeof window.Hls.isSupported === 'function' && window.Hls.isSupported()) return true;
        return false;
    }

    /* ============ 导出 ============ */
    window.MP3HlsPlayer = {
        version: '1.4.0',
        play,
        destroy,
        prefetch,
        clearCache,
        isSupported
    };

    console.log('[MP3HlsPlayer] v1.4.0 ready（ended 三重兜底）');
})();