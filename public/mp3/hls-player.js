/**
 * MP3 HLS Player 模块 v1.2
 *
 * 关键修复：
 *  1. 原生 HLS 只在 iOS / iPadOS Safari 上启用（其他环境一律走 hls.js / MSE）
 *  2. 原生失败后彻底清理 audioEl（移除 src + load + 50ms 等待）
 *  3. 尝试原生前临时禁用 onerror，防止主程序 onAudioError 打断
 *  4. isActive 默认宽容（切歌由 session 机制处理）
 */
(function () {
    'use strict';

    const HLS_JS_CDN = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
    const MAX_NETWORK_RETRY = 4;

    let hlsScriptPromise = null;
    let currentSession = 0;
    let hlsInstance = null;
    let currentAudioEl = null;
    let currentOnStatus = null;
    let currentIsActive = null;
    let mediaErrorRecovered = false;
    let networkRetryCount = 0;
    const prefetched = new Set();
    let recoveryListenersAttached = false;

    /* ============ 设备判定 ============ */
    function isIOSDevice() {
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
        // iPadOS 13+ 伪装成 Mac
        if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
        return false;
    }

    /**
     * 原生 HLS 判断：仅 iOS / iPadOS Safari 启用。
     * 桌面 Chrome / Edge / Firefox / Android Chrome 全部走 hls.js。
     */
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
            s.onerror = () => reject(new Error('无法加载 hls.js（CDN: ' + HLS_JS_CDN + '）'));
            document.head.appendChild(s);
        }).catch(e => {
            hlsScriptPromise = null;
            throw e;
        });

        return hlsScriptPromise;
    }

    /* ============ 会话有效性 ============ */
    function isStillActive(mySession) {
        if (mySession !== currentSession) return false;
        if (typeof currentIsActive === 'function') {
            try { if (!currentIsActive()) return false; } catch (e) {}
        }
        return true;
    }

    /* ============ 清理 ============ */
    function cleanupCurrent() {
        if (hlsInstance) {
            try { hlsInstance.destroy(); } catch (e) {}
            hlsInstance = null;
        }
        currentOnStatus = null;
        currentIsActive = null;
        mediaErrorRecovered = false;
        networkRetryCount = 0;
    }

    /* ============ 彻底清空 audioEl 状态 ============ */
    async function resetAudioEl(audioEl) {
        try { audioEl.pause(); } catch (e) {}
        try {
            audioEl.removeAttribute('src');
            audioEl.load();
        } catch (e) {}
        await new Promise(r => setTimeout(r, 50));
    }

    /* ============ 主入口 ============ */
    async function play(audioEl, url, { onStatus, isActive } = {}) {
        if (!audioEl || !url) throw new Error('play: audioEl 或 url 为空');

        const mySession = ++currentSession;
        cleanupCurrent();

        currentAudioEl = audioEl;
        currentOnStatus = onStatus || (() => {});
        currentIsActive = isActive || (() => true);

        try { audioEl.pause(); } catch (e) {}
        try {
            audioEl.removeAttribute('src');
            audioEl.load();
        } catch (e) {}

        // ★ 临时禁用 onerror，防止主程序 onAudioError 打断（切歌）
        const prevOnError = audioEl.onerror;
        audioEl.onerror = (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            return false;
        };

        try {
            // ---------- 仅在 iOS 上尝试原生 ----------
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
                        throw new Error('HLS 播放失败（原生）：' + (e.message || e));
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
                    currentOnStatus(`网络不稳定，${(delay / 1000).toFixed(0)}s 后重试 (${networkRetryCount}/${MAX_NETWORK_RETRY})…`, 'warn');
                    setTimeout(() => {
                        if (!isStillActive(mySession) || !hlsInstance) return;
                        try { hlsInstance.startLoad(); } catch (e) {}
                    }, delay);
                } else {
                    currentOnStatus('HLS 流反复失败：' + (details || 'unknown'), 'error');
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
                currentOnStatus('媒体错误无法恢复', 'error');
            }
            return;
        }

        if (fatal) {
            currentOnStatus('HLS 播放失败: ' + (details || type), 'error');
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
        if (!currentAudioEl || !isStillActive(currentSession)) return;
        if (hlsInstance) {
            try {
                if (currentAudioEl.readyState < 3 && !currentAudioEl.paused) {
                    hlsInstance.startLoad();
                }
            } catch (e) {}
        }
    }

    function onOnline() {
        if (!currentAudioEl || !isStillActive(currentSession)) return;
        if (hlsInstance) {
            try { hlsInstance.startLoad(); } catch (e) {}
        } else if (currentAudioEl.paused) {
            currentAudioEl.play().catch(() => {});
        }
    }

    function onOffline() {
        if (!currentAudioEl || !isStillActive(currentSession)) return;
        try { currentAudioEl.pause(); } catch (e) {}
        if (currentOnStatus) currentOnStatus('网络已断开，恢复连接后自动继续', 'warn');
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
        version: '1.2.0',
        play,
        destroy,
        prefetch,
        clearCache,
        isSupported
    };

    console.log('[MP3HlsPlayer] v' + window.MP3HlsPlayer.version + ' ready');
})();