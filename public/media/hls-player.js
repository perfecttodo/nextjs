/**
 * MP3 HLS Player v1.5 — 面向移动端后台连续播放优化
 * 相对 v1.4：
 *  - 复用媒体元素，仅在 native↔MSE 切换/致命错误时才硬重置（保住音频会话）
 *  - 加大缓冲 + backBuffer，后台网络抖动更耐断
 *  - waiting/stalled/online/visibility 自动恢复；audioSession 持续重申
 *  - ended 以 原生ended + LEVEL_ENDED 为准（后台可用）；watchdog 仅前台兜底
 *  - 预取 manifest + 首个分片，缩短切歌间隙
 *  - 新增 markIntent()：区分“用户暂停”与“被系统中断”，避免跟用户抢播放
 */
(function () {
    'use strict';

    const HLS_JS_CDN = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
    const MAX_NETWORK_RETRY = 6;

    let hlsScriptPromise = null;
    let currentSession = 0;
    let hlsInstance = null;
    let currentAudioEl = null;
    let currentOnStatus = null;
    let mediaErrorRecovered = false;
    let networkRetryCount = 0;
    const prefetched = new Set();
    let guardiansAttached = false;
    let intendedPlaying = false;      // 用户“想让它播”
    let interruptedWhileHidden = false;
    let lastPath = null;              // 'native' | 'mse'
    let watchdogTimer = null;
    let stallTimer = null;

    function isIOSDevice() {
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
        return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    }
    function canPlayNative(el) {
        if (!isIOSDevice() || !el || !el.canPlayType) return false;
        const t = el.canPlayType('application/vnd.apple.mpegurl');
        return t === 'maybe' || t === 'probably';
    }
    function isStillActive(s) { return s === currentSession; }

    function assertAudioSession() {
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    }
    function setMSState(state) {
        try { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = state; } catch (e) {}
    }

    function loadHlsScript() {
        if (window.Hls) return Promise.resolve(window.Hls);
        if (hlsScriptPromise) return hlsScriptPromise;
        hlsScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-mp3-hls-js]');
            if (existing) {
                if (window.Hls) { resolve(window.Hls); return; }
                existing.addEventListener('load', () => window.Hls ? resolve(window.Hls) : reject(new Error('hls.js 未暴露')));
                existing.addEventListener('error', () => reject(new Error('hls.js 加载失败')));
                return;
            }
            const s = document.createElement('script');
            s.src = HLS_JS_CDN; s.async = true; s.dataset.mp3HlsJs = '1';
            s.onload = () => window.Hls ? resolve(window.Hls) : reject(new Error('hls.js 未暴露'));
            s.onerror = () => reject(new Error('无法加载 hls.js'));
            document.head.appendChild(s);
        }).catch(e => { hlsScriptPromise = null; throw e; });
        return hlsScriptPromise;
    }

    function cleanupCurrent() {
        if (hlsInstance) { try { hlsInstance.destroy(); } catch (e) {} hlsInstance = null; }
        mediaErrorRecovered = false;
        networkRetryCount = 0;
        if (watchdogTimer) { clearInterval(watchdogTimer); watchdogTimer = null; }
        if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
    }

    async function hardReset(el) {
        try { el.pause(); } catch (e) {}
        try { el.removeAttribute('src'); el.load(); } catch (e) {}
        await new Promise(r => setTimeout(r, 40));
    }

    /* ============ 持续守护（只挂一次） ============ */
    function attachGuardians(el) {
        if (guardiansAttached) return;
        guardiansAttached = true;

        const tryResume = () => {
            if (!currentAudioEl || !intendedPlaying) return;
            if (!currentAudioEl.paused) return;
            assertAudioSession();
            currentAudioEl.play().catch(() => {});
        };

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') return;
            assertAudioSession();
            if (hlsInstance && currentAudioEl && currentAudioEl.readyState < 3) {
                try { hlsInstance.startLoad(); } catch (e) {}
            }
            if (interruptedWhileHidden) { interruptedWhileHidden = false; tryResume(); }
        });
        window.addEventListener('online', () => {
            assertAudioSession();
            if (hlsInstance) { try { hlsInstance.startLoad(); } catch (e) {} }
            tryResume();
            if (currentOnStatus) currentOnStatus('网络已恢复', 'success');
        });
        window.addEventListener('offline', () => {
            if (currentOnStatus) currentOnStatus('网络已断开，恢复后自动继续', 'warn');
        });
        window.addEventListener('pageshow', tryResume);
        window.addEventListener('focus', tryResume);

        el.addEventListener('playing', () => { interruptedWhileHidden = false; setMSState('playing'); });
        el.addEventListener('pause', () => {
            setMSState('paused');
            // 后台被暂停且用户仍想播 → 视为系统中断，回到前台时恢复
            if (document.visibilityState === 'hidden' && intendedPlaying) interruptedWhileHidden = true;
        });
        const onStall = () => {
            if (!intendedPlaying || !currentAudioEl) return;
            if (stallTimer) clearTimeout(stallTimer);
            stallTimer = setTimeout(() => {
                if (!intendedPlaying || !currentAudioEl) return;
                if (hlsInstance) { try { hlsInstance.startLoad(); } catch (e) {} }
                if (currentAudioEl.paused) currentAudioEl.play().catch(() => {});
            }, 1200);
        };
        el.addEventListener('waiting', onStall);
        el.addEventListener('stalled', onStall);
    }

    /* ============ 主入口 ============ */
    async function play(audioEl, url, { onStatus } = {}) {
        if (!audioEl || !url) throw new Error('play: audioEl 或 url 为空');
        try { audioEl.loop = false; } catch (e) {}
        try { audioEl.setAttribute('playsinline', ''); audioEl.preload = 'auto'; } catch (e) {}
        assertAudioSession();

        const mySession = ++currentSession;
        const prevPath = lastPath;
        cleanupCurrent();
        currentAudioEl = audioEl;
        currentOnStatus = onStatus || (() => {});
        intendedPlaying = true;
        interruptedWhileHidden = false;

        const useNative = canPlayNative(audioEl);
        const targetPath = useNative ? 'native' : 'mse';
        // ★ 仅切换播放路径时才硬重置；同路径切歌直接换源，保住音频会话
        if (prevPath && prevPath !== targetPath) await hardReset(audioEl);
        lastPath = targetPath;

        const prevOnError = audioEl.onerror;
        audioEl.onerror = (e) => { if (e && e.preventDefault) e.preventDefault(); return false; };

        let endedFired = false;
        const fireEnded = (src) => {
            if (endedFired) return;
            endedFired = true; intendedPlaying = false;
            if (!isStillActive(mySession)) return;
            try { audioEl.dispatchEvent(new Event('ended')); } catch (e) {}
        };
        audioEl.addEventListener('ended', () => { endedFired = true; intendedPlaying = false; }, { once: true });

        // watchdog 仅前台兜底（后台定时器不可靠）
        watchdogTimer = setInterval(() => {
            if (endedFired || !isStillActive(mySession)) { clearInterval(watchdogTimer); watchdogTimer = null; return; }
            if (document.visibilityState !== 'visible') return;
            const d = audioEl.duration, t = audioEl.currentTime;
            if (isFinite(d) && d > 0 && d - t < 0.5 && audioEl.paused) fireEnded('watchdog');
        }, 1000);

        try {
            if (useNative) {
                try {
                    currentOnStatus('正在加载 (原生 HLS)…');
                    audioEl.removeAttribute('crossorigin');
                    audioEl.src = url;
                    await audioEl.play();
                    if (!isStillActive(mySession)) return;
                    attachGuardians(audioEl);
                    currentOnStatus('▶️ 播放中 (原生 HLS)', 'success');
                    return;
                } catch (e) {
                    if (!isStillActive(mySession)) return;
                    await hardReset(audioEl); lastPath = 'mse';
                }
            }

            const Hls = await loadHlsScript();
            if (!isStillActive(mySession)) return;
            if (!Hls || typeof Hls.isSupported !== 'function' || !Hls.isSupported()) {
                if (canPlayNative(audioEl)) {
                    audioEl.removeAttribute('crossorigin');
                    audioEl.src = url;
                    await audioEl.play();
                    if (!isStillActive(mySession)) return;
                    attachGuardians(audioEl);
                    currentOnStatus('▶️ 播放中 (原生 HLS)', 'success');
                    return;
                }
                throw new Error('当前浏览器不支持 HLS 播放（MSE 不可用）');
            }

            currentOnStatus('正在加载 HLS 流…');
            hlsInstance = new Hls({
                maxBufferLength: 60,
                maxMaxBufferLength: 120,
                backBufferLength: 30,
                maxBufferSize: 120 * 1000 * 1000,
                enableWorker: true,
                lowLatencyMode: false,
                manifestLoadingMaxRetry: 4,
                levelLoadingMaxRetry: 5,
                fragLoadingMaxRetry: 8,
                manifestLoadingRetryDelay: 800,
                fragLoadingRetryDelay: 800
            });
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                if (!isStillActive(mySession)) return;
                networkRetryCount = 0;
                audioEl.play().catch(() => { if (isStillActive(mySession)) currentOnStatus('自动播放被拦截，请点击播放', 'warn'); });
            });
            hlsInstance.on(Hls.Events.LEVEL_ENDED, () => { if (isStillActive(mySession)) fireEnded('LEVEL_ENDED'); });
            hlsInstance.on(Hls.Events.ERROR, (e, data) => { if (isStillActive(mySession)) handleHlsError(data, mySession); });
            hlsInstance.on(Hls.Events.FRAG_LOADED, () => { if (isStillActive(mySession)) networkRetryCount = 0; });
            hlsInstance.attachMedia(audioEl);
            hlsInstance.loadSource(url);

            await new Promise(res => {
                let done = false;
                const fin = () => { if (done) return; done = true; audioEl.removeEventListener('playing', fin); audioEl.removeEventListener('error', fin); res(); };
                audioEl.addEventListener('playing', fin);
                audioEl.addEventListener('error', fin);
                setTimeout(fin, 15000);
            });
            if (!isStillActive(mySession)) return;
            attachGuardians(audioEl);
            currentOnStatus('▶️ 播放中', 'success');
        } finally {
            if (currentSession === mySession) audioEl.onerror = prevOnError;
        }
    }

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
                    setTimeout(() => { if (isStillActive(mySession) && hlsInstance) { try { hlsInstance.startLoad(); } catch (e) {} } }, delay);
                } else {
                    currentOnStatus('HLS 流反复失败，跳过', 'error');
                    if (currentAudioEl) { try { currentAudioEl.dispatchEvent(new Event('error')); } catch (e) {} }
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
                if (currentAudioEl) { try { currentAudioEl.dispatchEvent(new Event('error')); } catch (e) {} }
            }
            return;
        }
        if (fatal) {
            currentOnStatus('HLS 播放失败，跳过: ' + (details || type), 'error');
            if (currentAudioEl) { try { currentAudioEl.dispatchEvent(new Event('error')); } catch (e) {} }
        }
    }

    function destroy() {
        currentSession++;
        intendedPlaying = false;
        cleanupCurrent();
        lastPath = null;
        if (currentAudioEl) {
            try { currentAudioEl.pause(); } catch (e) {}
            try { currentAudioEl.removeAttribute('src'); currentAudioEl.load(); } catch (e) {}
        }
        currentAudioEl = null;
    }

    /* 预取 manifest + 首个分片 */
    function prefetch(url) {
        if (!url || prefetched.has(url)) return;
        if (!/\.m3u8(\?|$)/i.test(url)) return;
        prefetched.add(url);
        const run = () => {
            fetch(url, { cache: 'default', credentials: 'same-origin' })
                .then(r => r.text())
                .then(text => {
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
                    if (!lines.length) return;
                    let first = lines[0];
                    try { first = new URL(first, url).href; } catch (e) {}
                    fetch(first, { cache: 'default', credentials: 'same-origin' }).catch(() => {});
                })
                .catch(() => {});
        };
        if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 });
        else setTimeout(run, 800);
    }

    function clearCache() { prefetched.clear(); hlsScriptPromise = null; }
    function isSupported() {
        if (isIOSDevice()) return true;
        return !!(window.Hls && typeof window.Hls.isSupported === 'function' && window.Hls.isSupported());
    }
    function markIntent(playing) { intendedPlaying = !!playing; if (!playing) interruptedWhileHidden = false; }

    window.MP3HlsPlayer = {
        version: '1.5.0',
        play, destroy, prefetch, clearCache, isSupported, markIntent
    };
    console.log('[MP3HlsPlayer] v1.5.0 ready（后台连续播放优化）');
})();