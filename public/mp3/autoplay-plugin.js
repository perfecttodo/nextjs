/**
 * 自动播放模式插件 v1.1
 *
 * 特性：
 *  - 可配置秒数（1-300，默认 10），持久化到 localStorage
 *  - 由主程序事件驱动（play / pause / ended / songchange / liked）
 *  - 到点自动调 ext.playNext()
 *  - liked 当前播放的歌 → 3 秒后快速切歌
 *  - ★ v1.1：移除对 autoModeBtn 的依赖，自动播放完全由插件 UI 控制
 *
 * 依赖：主程序 MP3AppExtension 事件 API
 *  - ext.on(event, cb) / ext.off(event, cb)
 *  - ext.setTimerText(msg, tone)
 *  - ext.playNext() / ext.playPrev()
 *  - ext.getFileKey(file) / ext.currentPlayingFile / ext.audioPlayer
 */
(function () {
    'use strict';

    const KEY_ENABLED = 'mp3_autoplay_enabled';
    const KEY_SECONDS = 'mp3_autoplay_seconds';
    const DEFAULT_SECONDS = 10;
    const MIN_SECONDS = 1;
    const MAX_SECONDS = 300;
    const LIKED_FAST_SWITCH = 3000;

    let uiRoot = null;
    let enabled = false;
    let seconds = DEFAULT_SECONDS;
    let countdownTimer = null;
    let countdownInterval = null;
    let remaining = 0;

    function getExt() {
        return window.MP3AppExtension || null;
    }

    function loadConfig() {
        enabled = localStorage.getItem(KEY_ENABLED) === 'true';
        const s = parseInt(localStorage.getItem(KEY_SECONDS), 10);
        seconds = (!isNaN(s) && s >= MIN_SECONDS && s <= MAX_SECONDS) ? s : DEFAULT_SECONDS;
    }

    function saveConfig() {
        try {
            localStorage.setItem(KEY_ENABLED, String(enabled));
            localStorage.setItem(KEY_SECONDS, String(seconds));
        } catch (e) {}
    }

    function setStatus(msg, tone) {
        if (!uiRoot) return;
        const el = uiRoot.querySelector('.autoplay-status');
        if (!el) return;
        el.textContent = msg || '';
        el.className = 'autoplay-status text-[10px] min-h-[0.75rem] break-all ' + (
            tone === 'error' ? 'text-rose-400' :
            tone === 'success' ? 'text-emerald-400' :
            tone === 'warn' ? 'text-amber-400' :
            'text-slate-500'
        );
    }

    /* ==================== 倒计时 ==================== */

    function clearTimer() {
        if (countdownTimer) { clearTimeout(countdownTimer); countdownTimer = null; }
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
        const ext = getExt();
        if (ext && typeof ext.setTimerText === 'function') ext.setTimerText(null);
    }

    function startCountdown() {
        clearTimer();
        if (!enabled) return;
        const ext = getExt();
        if (!ext) return;
        if (!ext.currentPlayingFile) return;
        if (!ext.audioPlayer || ext.audioPlayer.paused) return;

        remaining = seconds;
        if (typeof ext.setTimerText === 'function') {
            ext.setTimerText(`[自動換歌: ${remaining}s]`);
        }
        countdownInterval = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                if (typeof ext.setTimerText === 'function') {
                    ext.setTimerText(`[自動換歌: ${remaining}s]`);
                }
            } else {
                if (typeof ext.setTimerText === 'function') {
                    ext.setTimerText(`[自動換歌: 0s]`);
                }
                if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
            }
        }, 1000);
        countdownTimer = setTimeout(() => {
            if (enabled) {
                try { ext.playNext(); }
                catch (e) { console.warn('[AutoPlay] playNext 失败:', e); }
            }
        }, seconds * 1000);
    }

    function likedFastSwitch() {
        clearTimer();
        const ext = getExt();
        if (!ext) return;
        if (typeof ext.setTimerText === 'function') {
            ext.setTimerText('[已Like，3秒後換歌...]', 'warn');
        }
        countdownTimer = setTimeout(() => {
            if (enabled) {
                try { ext.playNext(); }
                catch (e) { console.warn('[AutoPlay] playNext 失败:', e); }
            }
        }, LIKED_FAST_SWITCH);
    }

    /* ==================== 事件绑定 ==================== */

    function bindAudioEvents() {
        const ext = getExt();
        if (!ext || typeof ext.on !== 'function') {
            setTimeout(bindAudioEvents, 300);
            return;
        }

        ext.on('play', () => {
            if (enabled) startCountdown();
        });

        ext.on('pause', () => {
            clearTimer();
        });

        ext.on('ended', () => {
            clearTimer();
            // 新的 play 事件会重启
        });

        ext.on('songchange', () => {
            clearTimer();
            // 等新歌真正开始播放后再启动
            setTimeout(() => {
                if (!enabled) return;
                const e = getExt();
                if (e && e.audioPlayer && !e.audioPlayer.paused && e.currentPlayingFile) {
                    startCountdown();
                }
            }, 100);
        });

        ext.on('liked', (file) => {
            if (!enabled) return;
            const e = getExt();
            if (!e || !e.currentPlayingFile) return;
            if (e.getFileKey(file) !== e.currentPlayingFile) return;
            likedFastSwitch();
        });
    }

    /* ==================== UI ==================== */

    function injectUI() {
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
            ? window.MP3PluginManager.getBodyContainer('autoPlay') : null;
        if (!body) { setTimeout(injectUI, 300); return; }
        if (uiRoot) return;

        uiRoot = document.createElement('div');
        uiRoot.className = 'space-y-1';
        uiRoot.innerHTML = `
            <div class="flex items-center justify-between gap-2 text-[10px]">
                <span class="text-slate-400">啟用自動播放</span>
                <label class="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" class="autoplay-toggle sr-only peer">
                    <div class="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:bg-amber-600 transition"></div>
                    <span class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4"></span>
                </label>
            </div>
            <div class="flex items-center gap-1.5 text-[10px]">
                <span class="text-slate-400 shrink-0">切歌間隔</span>
                <input type="number" class="autoplay-seconds w-16 bg-slate-800 border border-slate-700 text-[11px] rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
                    min="${MIN_SECONDS}" max="${MAX_SECONDS}" step="1">
                <span class="text-slate-500">秒</span>
            </div>
            <p class="text-[10px] text-slate-500 leading-relaxed">开启后，每首歌播放指定秒数后自动切换到下一首。</p>
            <p class="autoplay-status text-[10px] min-h-[0.75rem] break-all text-slate-500"></p>
        `;
        body.appendChild(uiRoot);

        const toggle = uiRoot.querySelector('.autoplay-toggle');
        const secInput = uiRoot.querySelector('.autoplay-seconds');

        toggle.checked = enabled;
        secInput.value = seconds;

        toggle.addEventListener('change', (e) => {
            enabled = e.target.checked;
            saveConfig();
            if (enabled) {
                setStatus(`已开启（${seconds} 秒）`, 'success');
                const ext = getExt();
                if (ext && ext.currentPlayingFile && ext.audioPlayer && !ext.audioPlayer.paused) {
                    startCountdown();
                }
            } else {
                setStatus('已关闭');
                clearTimer();
            }
        });

        secInput.addEventListener('change', (e) => {
            let v = parseInt(e.target.value, 10);
            if (isNaN(v) || v < MIN_SECONDS) v = MIN_SECONDS;
            if (v > MAX_SECONDS) v = MAX_SECONDS;
            seconds = v;
            secInput.value = v;
            saveConfig();
            if (enabled) {
                const ext = getExt();
                if (ext && ext.audioPlayer && !ext.audioPlayer.paused && ext.currentPlayingFile) {
                    startCountdown();
                }
            }
        });
    }

    /* ==================== 导出 ==================== */

    window.MP3AutoPlayPlugin = {
        version: '1.1.0',
        async init() {
            loadConfig();
            injectUI();
            bindAudioEvents();
            // 启动时若已开启且正在播 → 尝试拉起
            setTimeout(() => {
                if (enabled) {
                    const ext = getExt();
                    if (ext && ext.currentPlayingFile && ext.audioPlayer && !ext.audioPlayer.paused) {
                        startCountdown();
                    }
                }
            }, 1500);
        },
        async unload() {
            clearTimer();
            if (uiRoot) { uiRoot.remove(); uiRoot = null; }
        },
        getEnabled: () => enabled,
        getSeconds: () => seconds
    };

    console.log('[MP3AutoPlayPlugin] v1.1.0 ready');
})();