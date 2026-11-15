/**
 * MP3 HLS Player v1.7-audio — 音频优先播放
 * 新增：
 *  - 依据 window.MP3PluginManager.isEnabled("videoPlayer") 决定是否锁定纯音频流
 *  - resolveAudioOnlyUrl()：从 Master Playlist 解析 EXT-X-STREAM-INF / EXT-X-MEDIA 的纯音频 URI
 *  - diagnose(url)：诊断主清单结构、是否找到纯音频变体
 *  - 纯音频场景移除 backBufferLength，修复 ended 丢失/卡住
 *  - trackEnded 标志修复后台切歌时 pause 误判为系统中断的竞态
 */
(function () {
    'use strict';

    const HLS_JS_CDN = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
    const MAX_NETWORK_RETRY = 6;
    const AUDIO_RESOLVE_TIMEOUT = 3000;

    let hlsScriptPromise = null;
    let currentSession = 0;
    let hlsInstance = null;
    let currentAudioEl = null;
    let currentOnStatus = null;
    let mediaErrorRecovered = false;
    let networkRetryCount = 0;
    const prefetched = new Set();
    let guardiansAttached = false;
    let intendedPlaying = false;
    let interruptedWhileHidden = false;
    let trackEnded = false;          // 曲目自然结束标志，避免 pause 误判为系统中断
    let lastPath = null;             // 'native' | 'mse'
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

    /* ===== 插件开关判断 ===== */
    function isVideoPlayerEnabled() {
        try {
            if (window.MP3PluginManager && typeof window.MP3PluginManager.isEnabled === 'function') {
                return !!window.MP3PluginManager.isEnabled('videoPlayer');
            }
        } catch (e) {}
        // 管理器不存在时默认视为启用，走标准流程，不改变既有行为
        return true;
    }

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

    /* ============ 纯音频解析 ============ */
    function isAudioOnlyStreamInf(line) {
        // 有 RESOLUTION 一定不是纯音频
        if (/RESOLUTION=/i.test(line)) return false;
        const codecsMatch = line.match(/CODECS="([^"]+)"/i);
        if (codecsMatch) {
            const codecs = codecsMatch[1];
            // 含任一视频编码标识即排除
            const videoCodecPattern = /avc1|avc3|hvc1|hev1|hvc|hev|dvh|vp0?9|vp8|av01|mp4v/i;
            if (videoCodecPattern.test(codecs)) return false;
            return true;
        }
        // 无 RESOLUTION 且无 CODECS，保守视为纯音频（不少音频 HLS 不写 CODECS）
        return true;
    }

    async function resolveAudioOnlyUrl(masterUrl, onStatus) {
        if (!masterUrl || !/\.m3u8(\?|$)/i.test(masterUrl)) {
            if (onStatus) onStatus('URL 不是 m3u8，无法解析纯音频流', 'warn');
            return null;
        }

        let text;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AUDIO_RESOLVE_TIMEOUT);
        try {
            const resp = await fetch(masterUrl, { cache: 'default', credentials: 'same-origin', signal: controller.signal });
            clearTimeout(timeoutId);
            if (!resp.ok) {
                if (onStatus) onStatus('获取 m3u8 主清单失败 (' + resp.status + ')，回退标准播放', 'warn');
                return null;
            }
            text = await resp.text();
        } catch (e) {
            clearTimeout(timeoutId);
            if (onStatus) onStatus('解析 m3u8 主清单异常，回退标准播放', 'warn');
            console.warn('[MP3HlsPlayer] resolveAudioOnlyUrl fetch failed:', e);
            return null;
        }

        const isMaster = /#EXT-X-STREAM-INF/i.test(text) || /#EXT-X-MEDIA/i.test(text);
        if (!isMaster) {
            if (onStatus) onStatus('传入的是媒体清单而非主清单，无法切换为纯音频', 'warn');
            return null;
        }

        const lines = text.split(/\r?\n/);

        // 策略 1：EXT-X-STREAM-INF 纯音频变体
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line.startsWith('#EXT-X-STREAM-INF')) continue;
            if (!isAudioOnlyStreamInf(line)) continue;
            for (let j = i + 1; j < lines.length; j++) {
                const candidate = lines[j].trim();
                if (!candidate || candidate.startsWith('#')) continue;
                try {
                    const abs = new URL(candidate, masterUrl).href;
                    console.log('[MP3HlsPlayer] 命中纯音频变体:', abs);
                    return abs;
                } catch (e) {
                    return candidate;
                }
            }
        }

        // 策略 2：EXT-X-MEDIA:TYPE=AUDIO 的 URI（音视频分离但无独立纯音频 variant 时）
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line.startsWith('#EXT-X-MEDIA')) continue;
            if (!/TYPE=AUDIO/i.test(line)) continue;
            const uriMatch = line.match(/URI="([^"]+)"/i);
            if (uriMatch && uriMatch[1]) {
                try {
                    const abs = new URL(uriMatch[1], masterUrl).href;
                    console.log('[MP3HlsPlayer] 命中 EXT-X-MEDIA 音频 URI:', abs);
                    return abs;
                } catch (e) {
                    return uriMatch[1];
                }
            }
        }

        if (onStatus) onStatus('主清单中未找到纯音频流，回退标准播放（可能仍会下载视频数据）', 'warn');
        console.warn('[MP3HlsPlayer] 未找到纯音频变体。主清单前 1500 字符:\n' + text.slice(0, 1500));
        return null;
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

        el.addEventListener('playing', () => { trackEnded = false; interruptedWhileHidden = false; setMSState('playing'); });
        el.addEventListener('pause', () => {
            setMSState('paused');
            // 曲目自然结束导致的 pause 不视为系统中断
            if (document.visibilityState === 'hidden' && intendedPlaying && !trackEnded) interruptedWhileHidden = true;
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
        trackEnded = false;

        // ★ 依据 videoPlayer 插件状态决定是否解析纯音频流
        const videoEnabled = isVideoPlayerEnabled();
        const useNative = canPlayNative(audioEl);
        let targetUrl = url;

        if (!videoEnabled) {
            console.log('[MP3HlsPlayer] videoPlayer 未启用，尝试锁定纯音频流');
            const audioOnlyUrl = await resolveAudioOnlyUrl(url, currentOnStatus);
            if (!isStillActive(mySession)) return;
            if (audioOnlyUrl) {
                targetUrl = audioOnlyUrl;
                currentOnStatus('视频播放器未启用，已切换为纯音频流', 'success');
            } else {
                currentOnStatus('未找到纯音频流，回退标准播放（可能仍会下载视频数据）', 'warn');
            }
        } else {
            console.log('[MP3HlsPlayer] videoPlayer 启用，走标准播放流程');
        }

        const targetPath = useNative ? 'native' : 'mse';
        if (prevPath && prevPath !== targetPath) await hardReset(audioEl);
        lastPath = targetPath;

        const prevOnError = audioEl.onerror;
        audioEl.onerror = (e) => { if (e && e.preventDefault) e.preventDefault(); return false; };

        let endedFired = false;
        const fireEnded = (src) => {
            if (endedFired) return;
            endedFired = true;
            trackEnded = true;       // 只标记曲目结束，不改变用户“想继续播”的意图
            if (!isStillActive(mySession)) return;
            try { audioEl.dispatchEvent(new Event('ended')); } catch (e) {}
        };
        audioEl.addEventListener('ended', () => { endedFired = true; trackEnded = true; }, { once: true });

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
                    audioEl.src = targetUrl;
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
                    audioEl.src = targetUrl;
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
                // ★ 纯音频场景不设 backBufferLength，避免 ended 丢失/卡 bufferStalledError
                // backBufferLength: 30,
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
            hlsInstance.loadSource(targetUrl);

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
        trackEnded = false;
        cleanupCurrent();
        lastPath = null;
        if (currentAudioEl) {
            try { currentAudioEl.pause(); } catch (e) {}
            try { currentAudioEl.removeAttribute('src'); currentAudioEl.load(); } catch (e) {}
        }
        currentAudioEl = null;
    }

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

    /* ============ 诊断工具 ============ */
    async function diagnose(url) {
        const videoEnabled = isVideoPlayerEnabled();
        console.log('===== MP3HlsPlayer Diagnose =====');
        console.log('videoPlayer enabled:', videoEnabled);
        console.log('URL:', url);
        if (!url || !/\.m3u8(\?|$)/i.test(url)) {
            console.log('❌ 传入的 URL 不是 m3u8，无法解析');
            return { videoEnabled, isMaster: false, audioOnlyUrl: null };
        }
        try {
            const resp = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
            console.log('HTTP status:', resp.status);
            const text = await resp.text();
            console.log('m3u8 content (前 2000 字符):\n' + text.slice(0, 2000));
            const isMaster = /#EXT-X-STREAM-INF/i.test(text) || /#EXT-X-MEDIA/i.test(text);
            console.log('is master playlist:', isMaster);
            let audioOnlyUrl = null;
            if (isMaster) {
                audioOnlyUrl = await resolveAudioOnlyUrl(url);
                console.log('resolved audio-only URL:', audioOnlyUrl);
                if (!audioOnlyUrl) {
                    console.log('❌ 主清单中没有纯音频变体。前端无法剥离 muxed 分片中的视频数据，需要服务端额外输出 audio-only rendition。');
                }
            } else {
                console.log('❌ 传入的是 media playlist，无法从中分离音频。需要主清单 URL（含 EXT-X-STREAM-INF）。');
            }
            return { videoEnabled, isMaster, audioOnlyUrl };
        } catch (e) {
            console.error('❌ diagnose 失败:', e);
            console.log('常见原因：CORS 未放行、URL 需要鉴权 header、网络异常。');
            return { videoEnabled, isMaster: null, audioOnlyUrl: null, error: e };
        }
    }

    function clearCache() { prefetched.clear(); hlsScriptPromise = null; }
    function isSupported() {
        if (isIOSDevice()) return true;
        return !!(window.Hls && typeof window.Hls.isSupported === 'function' && window.Hls.isSupported());
    }
    function markIntent(playing) { intendedPlaying = !!playing; if (!playing) interruptedWhileHidden = false; }

    window.MP3HlsPlayer = {
        version: '1.7.0-audio',
        play, destroy, prefetch, clearCache, isSupported, markIntent, diagnose
    };
    console.log('[MP3HlsPlayer] v1.7.0-audio ready（videoPlayer 关闭时锁定纯音频流）');
})();