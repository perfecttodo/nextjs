/**
 * 视频渲染插件 v1.5
 *
 * 相对 v1.4 的改动：
 *  1. ★ 全屏时控制条隐藏 → 光标同步隐藏；控制条出现 → 光标同步显示
 *  2. ★ 实现方式：给 .video-stage 增删 fs-hide-cursor 类，CSS 用 :fullscreen 伪类 + cursor:none 兜底
 *  3. ★ 仅在"全屏 + 播放中 + UI 空闲"时隐藏光标；暂停时保持可见
 *  4. 其余全屏容器化、PiP、隐藏记忆、拖动等逻辑保持不变
 */
(function () {
    'use strict';

    const NS = 'mp3_video_player_';
    const KEY_DISABLED_FOR_SRC = NS + 'disabled_for_src';
    const KEY_GLOBAL_HIDDEN = NS + 'global_hidden';
    const KEY_POSITION = NS + 'position';
    const KEY_FULLSCREEN_INTENT = NS + 'fullscreen_intent';
    const STYLE_ID = 'mp3_video_player_styles';

    const MEDIA_CHANGE_WINDOW = 1500;
    const RESTORE_DEBOUNCE = 300;
    const FS_UI_IDLE_MS = 3000;

    const state = {
        container: null,
        originalParent: null,
        videoEl: null,
        hiddenForCurrentSrc: false,
        dragState: { active: false, startX: 0, startY: 0, originX: 0, originY: 0 },
        eventHandlers: [],
        fullscreenIntent: localStorage.getItem(KEY_FULLSCREEN_INTENT) === 'true',
        userPressedEscape: false,
        lastMediaChangeAt: 0,
        lastRestoreAttemptAt: 0,
        fsUiTimer: null,
        fsSeeking: false
    };

    // ==================== 工具 ====================
    function attach(el, event, handler) {
        el.addEventListener(event, handler);
        state.eventHandlers.push({ el, event, handler });
    }

    function detachAll() {
        state.eventHandlers.forEach(({ el, event, handler }) => {
            try { el.removeEventListener(event, handler); } catch (e) {}
        });
        state.eventHandlers = [];
    }

    function currentSrcKey() {
        const ext = window.MP3AppExtension;
        return (ext && ext.currentPlayingFile) || '';
    }

    function isHiddenForCurrentSrc() {
        return localStorage.getItem(KEY_DISABLED_FOR_SRC) === currentSrcKey();
    }

    function setHiddenForCurrentSrc(hidden) {
        const key = currentSrcKey();
        if (hidden && key) localStorage.setItem(KEY_DISABLED_FOR_SRC, key);
        else localStorage.removeItem(KEY_DISABLED_FOR_SRC);
        state.hiddenForCurrentSrc = hidden;
    }

    function isGloballyHidden() {
        return localStorage.getItem(KEY_GLOBAL_HIDDEN) === 'true';
    }

    function setGloballyHidden(hidden) {
        try {
            if (hidden) localStorage.setItem(KEY_GLOBAL_HIDDEN, 'true');
            else localStorage.removeItem(KEY_GLOBAL_HIDDEN);
        } catch (e) {}
    }

    function saveFullscreenIntent(value) {
        state.fullscreenIntent = value;
        try {
            if (value) localStorage.setItem(KEY_FULLSCREEN_INTENT, 'true');
            else localStorage.removeItem(KEY_FULLSCREEN_INTENT);
        } catch (e) {}
    }

    function markMediaChange() {
        state.lastMediaChangeAt = Date.now();
    }

    function isInPip() {
        return state.videoEl && document.pictureInPictureElement === state.videoEl;
    }

    function isVideoFullscreen() {
        const stage = state.container ? state.container.querySelector('.video-stage') : null;
        if (stage && document.fullscreenElement === stage) return true;
        if (stage && document.webkitFullscreenElement === stage) return true;
        if (state.videoEl && state.videoEl.webkitDisplayingFullscreen) return true;
        return false;
    }

    function formatTime(sec) {
        if (!isFinite(sec) || sec < 0) sec = 0;
        sec = Math.floor(sec);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        return m + ':' + String(s).padStart(2, '0');
    }

    // ==================== 注入样式 ====================
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            /* 全屏时容器铺满视口，覆盖内联 aspect-ratio */
            #videoPlayerContainer .video-stage:fullscreen {
                aspect-ratio: auto !important;
                width: 100vw !important;
                height: 100vh !important;
                max-width: none !important;
                max-height: none !important;
                background: #000 !important;
            }
            #videoPlayerContainer .video-stage:-webkit-full-screen {
                aspect-ratio: auto !important;
                width: 100vw !important;
                height: 100vh !important;
                max-width: none !important;
                max-height: none !important;
                background: #000 !important;
            }
            /* 兜底：全屏时隐藏 WebKit 原生控件层 */
            #videoPlayerContainer .video-stage:fullscreen video::-webkit-media-controls,
            #videoPlayerContainer .video-stage:fullscreen video::-webkit-media-controls-enclosure {
                display: none !important;
            }
            #videoPlayerContainer .video-stage:-webkit-full-screen video::-webkit-media-controls,
            #videoPlayerContainer .video-stage:-webkit-full-screen video::-webkit-media-controls-enclosure {
                display: none !important;
            }
            /* ★ 全屏 + UI 空闲 → 隐藏光标（含所有子元素） */
            #videoPlayerContainer .video-stage:fullscreen.fs-hide-cursor,
            #videoPlayerContainer .video-stage:-webkit-full-screen.fs-hide-cursor,
            #videoPlayerContainer .video-stage:fullscreen.fs-hide-cursor *,
            #videoPlayerContainer .video-stage:-webkit-full-screen.fs-hide-cursor * {
                cursor: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    function removeStyles() {
        const el = document.getElementById(STYLE_ID);
        if (el) el.remove();
    }

    // ==================== 视频容器 ====================
    function createContainer() {
        const el = document.createElement('div');
        el.id = 'videoPlayerContainer';
        el.className = 'fixed bottom-28 right-4 z-[45] bg-black rounded-xl shadow-2xl border border-slate-700 overflow-hidden hidden';
        el.style.width = '320px';
        el.style.maxWidth = 'calc(100vw - 2rem)';
        el.style.touchAction = 'none';
        el.innerHTML = `
            <div class="video-drag-handle flex items-center justify-between px-2 py-1.5 bg-slate-800/95 cursor-move select-none">
                <div class="flex items-center gap-1.5 min-w-0">
                    <i class="fa-solid fa-grip-lines text-slate-500 text-[10px]"></i>
                    <span class="text-[10px] text-slate-300 truncate">视频</span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button class="video-btn-pip p-1 text-slate-400 hover:text-indigo-400 transition" title="画中画">
                        <i class="fa-solid fa-clone text-[10px]"></i>
                    </button>
                    <button class="video-btn-fullscreen p-1 text-slate-400 hover:text-indigo-400 transition" title="全屏">
                        <i class="fa-solid fa-expand text-[10px]"></i>
                    </button>
                    <button class="video-btn-close p-1 text-slate-400 hover:text-rose-400 transition" title="关闭视频（仅本次）">
                        <i class="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                </div>
            </div>
            <div class="video-stage relative bg-black" style="aspect-ratio: 16 / 9;">
                <div class="video-slot absolute inset-0"></div>
                <div class="video-fs-ui hidden absolute inset-0 z-20 flex flex-col justify-between pointer-events-none">
                    <div class="flex justify-end p-3">
                        <button class="video-fs-exit pointer-events-auto w-9 h-9 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition" title="退出全屏">
                            <i class="fa-solid fa-compress text-sm"></i>
                        </button>
                    </div>
                    <div class="video-fs-bottom px-3 pb-3 pt-6 bg-gradient-to-t from-black/80 to-transparent">
                        <div class="flex items-center gap-2">
                            <button class="video-fs-play pointer-events-auto w-8 h-8 rounded-md hover:bg-white/10 text-white flex items-center justify-center transition" title="播放/暂停">
                                <i class="fa-solid fa-play text-sm"></i>
                            </button>
                            <span class="video-fs-cur text-[11px] text-white/90 tabular-nums w-9 text-right">0:00</span>
                            <input type="range" class="video-fs-seek pointer-events-auto flex-1 accent-indigo-400 cursor-pointer" min="0" max="1000" value="0">
                            <span class="video-fs-dur text-[11px] text-white/90 tabular-nums w-9">0:00</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="video-hint px-2 py-1 bg-slate-900/95 text-[9px] text-slate-500 text-center">
                拖动顶栏移动 · PiP 中关闭则保持隐藏
            </div>
        `;
        document.body.appendChild(el);
        return el;
    }

    function applySavedPosition() {
        if (!state.container) return;
        try {
            const saved = JSON.parse(localStorage.getItem(KEY_POSITION) || 'null');
            if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
                const x = Math.max(0, Math.min(window.innerWidth - 60, saved.x));
                const y = Math.max(0, Math.min(window.innerHeight - 60, saved.y));
                state.container.style.left = x + 'px';
                state.container.style.top = y + 'px';
                state.container.style.right = 'auto';
                state.container.style.bottom = 'auto';
            }
        } catch (e) {}
    }

    function savePosition() {
        if (!state.container) return;
        const rect = state.container.getBoundingClientRect();
        try {
            localStorage.setItem(KEY_POSITION, JSON.stringify({ x: Math.round(rect.left), y: Math.round(rect.top) }));
        } catch (e) {}
    }

    // ==================== 拖动 ====================
    function bindDrag(container) {
        const handle = container.querySelector('.video-drag-handle');
        if (!handle) return;

        const onStart = (clientX, clientY) => {
            const rect = container.getBoundingClientRect();
            state.dragState = { active: true, startX: clientX, startY: clientY, originX: rect.left, originY: rect.top };
            container.style.left = rect.left + 'px';
            container.style.top = rect.top + 'px';
            container.style.right = 'auto';
            container.style.bottom = 'auto';
        };
        const onMove = (clientX, clientY) => {
            if (!state.dragState.active) return;
            const dx = clientX - state.dragState.startX;
            const dy = clientY - state.dragState.startY;
            let x = state.dragState.originX + dx;
            let y = state.dragState.originY + dy;
            const rect = container.getBoundingClientRect();
            x = Math.max(0, Math.min(window.innerWidth - rect.width, x));
            y = Math.max(0, Math.min(window.innerHeight - rect.height, y));
            container.style.left = x + 'px';
            container.style.top = y + 'px';
        };
        const onEnd = () => {
            if (state.dragState.active) { state.dragState.active = false; savePosition(); }
        };

        handle.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            onStart(e.clientX, e.clientY);
        });
        window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', onEnd);

        handle.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            if (t) onStart(t.clientX, t.clientY);
        }, { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (!state.dragState.active) return;
            const t = e.touches[0];
            if (t) onMove(t.clientX, t.clientY);
        }, { passive: true });
        window.addEventListener('touchend', onEnd);
    }

    // ==================== 自定义全屏控制层 ====================
    function showFsUi() {
        if (!state.container) return;
        const ui = state.container.querySelector('.video-fs-ui');
        const stage = state.container.querySelector('.video-stage');
        if (ui) ui.classList.remove('hidden');
        // ★ 显示 UI 的同时恢复光标
        if (stage) stage.classList.remove('fs-hide-cursor');
    }

    function hideFsUi() {
        if (!state.container) return;
        const ui = state.container.querySelector('.video-fs-ui');
        const stage = state.container.querySelector('.video-stage');
        if (ui) ui.classList.add('hidden');
        // ★ 隐藏 UI 的同时隐藏光标（仅在真正的全屏 CSS 选择器下生效）
        if (stage) stage.classList.add('fs-hide-cursor');
    }

    function scheduleFsUiHide() {
        clearTimeout(state.fsUiTimer);
        state.fsUiTimer = null;
        // 暂停时保持 UI 与光标可见
        if (!state.videoEl || state.videoEl.paused) return;
        state.fsUiTimer = setTimeout(() => {
            if (isVideoFullscreen() && state.videoEl && !state.videoEl.paused) hideFsUi();
        }, FS_UI_IDLE_MS);
    }

    function updateFsPlayIcon() {
        if (!state.container || !state.videoEl) return;
        const icon = state.container.querySelector('.video-fs-play i');
        if (!icon) return;
        icon.className = state.videoEl.paused ? 'fa-solid fa-play text-sm' : 'fa-solid fa-pause text-sm';
    }

    function updateFsSeek() {
        if (!state.container || !state.videoEl) return;
        const seek = state.container.querySelector('.video-fs-seek');
        const cur = state.container.querySelector('.video-fs-cur');
        const v = state.videoEl;
        if (seek && !state.fsSeeking) {
            const dur = v.duration || 0;
            seek.value = dur > 0 ? String(Math.round((v.currentTime / dur) * 1000)) : '0';
        }
        if (cur) cur.textContent = formatTime(v.currentTime);
    }

    function updateFsDuration() {
        if (!state.container || !state.videoEl) return;
        const dur = state.container.querySelector('.video-fs-dur');
        if (dur) dur.textContent = formatTime(state.videoEl.duration);
    }

    function onEnterFullscreenUI() {
        if (state.videoEl) state.videoEl.controls = false;
        hideRestoreHint();
        updateFsPlayIcon();
        updateFsSeek();
        updateFsDuration();
        showFsUi();
        scheduleFsUiHide();
    }

    function onExitFullscreenUI() {
        if (state.videoEl) {
            const containerVisible = state.container && !state.container.classList.contains('hidden');
            const hasVideo = (state.videoEl.videoWidth || 0) > 0;
            state.videoEl.controls = !!(containerVisible && hasVideo);
        }
        // ★ 退出全屏：清理光标隐藏状态并关闭 UI
        const stage = state.container ? state.container.querySelector('.video-stage') : null;
        if (stage) stage.classList.remove('fs-hide-cursor');
        const ui = state.container ? state.container.querySelector('.video-fs-ui') : null;
        if (ui) ui.classList.add('hidden');
        clearTimeout(state.fsUiTimer);
        state.fsUiTimer = null;
    }

    function bindFsUi(container) {
        const stage = container.querySelector('.video-stage');
        const ui = container.querySelector('.video-fs-ui');
        if (!stage || !ui) return;

        const playBtn = ui.querySelector('.video-fs-play');
        const exitBtn = ui.querySelector('.video-fs-exit');
        const seek = ui.querySelector('.video-fs-seek');

        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!state.videoEl) return;
                if (state.videoEl.paused) state.videoEl.play().catch(() => {});
                else state.videoEl.pause();
            });
        }

        if (exitBtn) {
            exitBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    if (document.exitFullscreen) await document.exitFullscreen().catch(() => {});
                    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                    else if (state.videoEl && state.videoEl.webkitExitFullscreen) state.videoEl.webkitExitFullscreen();
                } catch (err) {}
            });
        }

        if (seek) {
            seek.addEventListener('input', () => {
                state.fsSeeking = true;
                const v = state.videoEl;
                if (!v || !v.duration) return;
                const t = (Number(seek.value) / 1000) * v.duration;
                const cur = container.querySelector('.video-fs-cur');
                if (cur) cur.textContent = formatTime(t);
            });
            seek.addEventListener('change', () => {
                const v = state.videoEl;
                if (v && v.duration) v.currentTime = (Number(seek.value) / 1000) * v.duration;
                state.fsSeeking = false;
            });
        }

        // ★ 全屏时鼠标/触摸活动 → 显示控件与光标，并重置隐藏定时器
        //   注意：光标被隐藏时 mousemove 仍会触发，因此能可靠地"唤醒"光标
        stage.addEventListener('mousemove', () => {
            if (!isVideoFullscreen()) return;
            showFsUi();
            scheduleFsUiHide();
        });
        stage.addEventListener('touchstart', () => {
            if (!isVideoFullscreen()) return;
            showFsUi();
            scheduleFsUiHide();
        }, { passive: true });

        // 全屏时点击画面切换播放/暂停
        stage.addEventListener('click', (e) => {
            if (!isVideoFullscreen()) return;
            if (e.target.closest('.video-fs-ui')) return;
            if (!state.videoEl) return;
            if (state.videoEl.paused) state.videoEl.play().catch(() => {});
            else state.videoEl.pause();
            showFsUi();
            scheduleFsUiHide();
        });
    }

    // ==================== 全屏请求 ====================
    async function requestFullscreenWithIntent() {
        if (!state.videoEl || !state.container) return false;

        const stage = state.container.querySelector('.video-stage');
        if (!stage) return false;

        if (document.fullscreenElement && document.fullscreenElement !== stage) return false;

        try {
            if (stage.requestFullscreen) {
                await stage.requestFullscreen();
            } else if (stage.webkitRequestFullscreen) {
                stage.webkitRequestFullscreen();
            } else if (state.videoEl.webkitEnterFullscreen) {
                // iOS Safari：容器不支持全屏，退回 video 全屏（此路径原生控件与光标由系统控制）
                state.videoEl.webkitEnterFullscreen();
            } else {
                return false;
            }
            saveFullscreenIntent(true);
            hideRestoreHint();
            return true;
        } catch (e) {
            console.warn('[VideoPlayer] requestFullscreen 失败:', e);
            try {
                if (state.videoEl.webkitEnterFullscreen) {
                    state.videoEl.webkitEnterFullscreen();
                    saveFullscreenIntent(true);
                    hideRestoreHint();
                    return true;
                }
            } catch (e2) {}
            return false;
        }
    }

    async function tryRestoreFullscreen() {
        if (!state.fullscreenIntent) return;
        if (!state.videoEl) return;
        if (isVideoFullscreen()) return;
        if (isHiddenForCurrentSrc()) return;
        if (Date.now() - state.lastRestoreAttemptAt < RESTORE_DEBOUNCE) return;
        state.lastRestoreAttemptAt = Date.now();

        const ok = await requestFullscreenWithIntent();
        if (!ok) showRestoreHint();
    }

    function showRestoreHint() {
        if (!state.container) return;
        let hint = state.container.querySelector('.video-restore-fullscreen');
        if (hint) { hint.classList.remove('hidden'); return; }
        hint = document.createElement('button');
        hint.className = 'video-restore-fullscreen absolute inset-0 bg-black/60 backdrop-blur-sm text-white flex items-center justify-center gap-2 text-xs font-medium transition z-10';
        hint.innerHTML = `<i class="fa-solid fa-expand"></i><span>点击恢复全屏</span>`;
        hint.addEventListener('click', async (e) => {
            e.stopPropagation();
            state.lastRestoreAttemptAt = 0;
            const ok = await requestFullscreenWithIntent();
            if (ok) hideRestoreHint();
        });
        const stage = state.container.querySelector('.video-stage');
        if (stage) stage.appendChild(hint);
    }

    function hideRestoreHint() {
        if (!state.container) return;
        const hint = state.container.querySelector('.video-restore-fullscreen');
        if (hint) hint.classList.add('hidden');
    }

    async function togglePictureInPicture() {
        if (!state.videoEl) return;
        try {
            if (document.pictureInPictureElement) await document.exitPictureInPicture();
            else if (state.videoEl.requestPictureInPicture) await state.videoEl.requestPictureInPicture();
        } catch (e) {
            console.warn('[VideoPlayer] PiP failed:', e);
        }
    }

    // ==================== 显示 / 隐藏 ====================
    function showContainer() {
        if (!state.container) return;
        if (isHiddenForCurrentSrc()) return;
        if (isGloballyHidden() && isInPip()) return;

        state.container.classList.remove('hidden');
        applySavedPosition();

        const slot = state.container.querySelector('.video-slot');
        if (slot && state.videoEl) {
            if (state.videoEl.parentNode !== slot) {
                if (!state.originalParent) state.originalParent = state.videoEl.parentNode || document.body;
                slot.appendChild(state.videoEl);
            }
            state.videoEl.classList.remove('sr-only');
            state.videoEl.removeAttribute('aria-hidden');
            state.videoEl.style.width = '100%';
            state.videoEl.style.height = '100%';
            state.videoEl.style.objectFit = 'contain';
            state.videoEl.controls = !isVideoFullscreen();

            if (state.videoEl.paused && !isVideoFullscreen()) state.videoEl.play().catch(() => {});
        }
    }

    function hideContainer() {
        if (!state.container) return;
        state.container.classList.add('hidden');
        hideRestoreHint();

        if (state.videoEl) {
            state.videoEl.controls = false;
            state.videoEl.classList.add('sr-only');
            state.videoEl.setAttribute('aria-hidden', 'true');
            state.videoEl.style.width = '';
            state.videoEl.style.height = '';
            state.videoEl.style.objectFit = '';

            if (state.originalParent && state.videoEl.parentNode !== state.originalParent) {
                state.originalParent.appendChild(state.videoEl);
            } else if (!state.originalParent) {
                document.body.appendChild(state.videoEl);
            }
        }
    }

    // ==================== 视频轨道检测 ====================
    function checkVideoTrack() {
        if (!state.videoEl) return;
        const hasVideo = (state.videoEl.videoWidth || 0) > 0 && (state.videoEl.videoHeight || 0) > 0;

        if (!hasVideo) {
            hideContainer();
            updatePluginCardStatus();
            return;
        }

        if (isGloballyHidden()) {
            if (isInPip()) {
                hideContainer();
                updatePluginCardStatus();
                return;
            }
            setGloballyHidden(false);
            try { localStorage.removeItem(KEY_DISABLED_FOR_SRC); } catch (e) {}
            state.hiddenForCurrentSrc = false;
        }

        if (isHiddenForCurrentSrc()) {
            hideContainer();
            updatePluginCardStatus();
            return;
        }

        showContainer();
        updatePluginCardStatus();
    }

    // ==================== 全屏事件 ====================
    function bindFullscreenEvents() {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                state.userPressedEscape = true;
                setTimeout(() => { state.userPressedEscape = false; }, 1000);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        state.eventHandlers.push({ el: document, event: 'keydown', handler: onKeyDown });

        const onFullscreenChange = () => {
            if (isVideoFullscreen()) {
                saveFullscreenIntent(true);
                hideRestoreHint();
                onEnterFullscreenUI();
            } else {
                onExitFullscreenUI();
                if (state.userPressedEscape) {
                    state.userPressedEscape = false;
                    saveFullscreenIntent(false);
                } else if (state.fullscreenIntent &&
                           (Date.now() - state.lastMediaChangeAt) < MEDIA_CHANGE_WINDOW) {
                    // 切歌导致，保留意图，等 playing 时恢复
                } else {
                    saveFullscreenIntent(false);
                }
            }
            updatePluginCardStatus();
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        state.eventHandlers.push({ el: document, event: 'fullscreenchange', handler: onFullscreenChange });
        state.eventHandlers.push({ el: document, event: 'webkitfullscreenchange', handler: onFullscreenChange });
    }

    // ==================== PiP 事件 ====================
    function bindPictureInPictureEvents(video) {
        attach(video, 'enterpictureinpicture', () => {
            console.log('[VideoPlayer] 进入 PiP');
            updatePluginCardStatus();
        });

        attach(video, 'leavepictureinpicture', () => {
            console.log('[VideoPlayer] 退出 PiP');
            const isMediaChanging = (Date.now() - state.lastMediaChangeAt) < MEDIA_CHANGE_WINDOW;

            if (isMediaChanging) {
                console.log('[VideoPlayer] PiP 退出（媒体变化中），保留全局隐藏');
                updatePluginCardStatus();
                return;
            }

            if (isGloballyHidden()) {
                setGloballyHidden(false);
                try { localStorage.removeItem(KEY_DISABLED_FOR_SRC); } catch (e) {}
                state.hiddenForCurrentSrc = false;
                console.log('[VideoPlayer] 用户退出 PiP，清除全局隐藏，恢复小窗');
            }
            checkVideoTrack();
            updatePluginCardStatus();
        });
    }

    // ==================== 视频事件 ====================
    function bindVideoEvents() {
        const ext = window.MP3AppExtension;
        if (!ext || !ext.audioPlayer) { setTimeout(bindVideoEvents, 300); return; }

        const video = ext.audioPlayer;
        state.videoEl = video;
        state.originalParent = video.parentNode || document.body;

        attach(video, 'loadstart', markMediaChange);
        attach(video, 'emptied', markMediaChange);
        attach(video, 'durationchange', markMediaChange);
        attach(video, 'ended', markMediaChange);

        attach(video, 'loadedmetadata', () => {
            state.hiddenForCurrentSrc = isHiddenForCurrentSrc();
            checkVideoTrack();
            updatePluginCardStatus();
            updateFsDuration();
        });

        attach(video, 'playing', () => {
            markMediaChange();
            if (state.fullscreenIntent && !isVideoFullscreen()) {
                tryRestoreFullscreen();
            }
        });

        attach(video, 'canplay', () => {
            if (state.fullscreenIntent && !isVideoFullscreen()) {
                tryRestoreFullscreen();
            }
        });

        attach(video, 'resize', () => {
            checkVideoTrack();
            updatePluginCardStatus();
        });

        // 全屏控制层数据同步
        attach(video, 'timeupdate', () => {
            if (isVideoFullscreen()) updateFsSeek();
        });
        attach(video, 'durationchange', () => {
            if (isVideoFullscreen()) updateFsDuration();
        });
        attach(video, 'play', () => {
            updateFsPlayIcon();
            if (isVideoFullscreen()) { showFsUi(); scheduleFsUiHide(); }
        });
        attach(video, 'pause', () => {
            updateFsPlayIcon();
            // ★ 暂停时强制显示 UI 与光标，并停止隐藏计时
            if (isVideoFullscreen()) { showFsUi(); clearTimeout(state.fsUiTimer); state.fsUiTimer = null; }
        });

        // iOS 原生 video 全屏事件
        attach(video, 'webkitbeginfullscreen', () => {
            saveFullscreenIntent(true);
            onEnterFullscreenUI();
            updatePluginCardStatus();
        });
        attach(video, 'webkitendfullscreen', () => {
            onExitFullscreenUI();
            if (state.userPressedEscape) {
                state.userPressedEscape = false;
                saveFullscreenIntent(false);
            } else if (state.fullscreenIntent &&
                       (Date.now() - state.lastMediaChangeAt) < MEDIA_CHANGE_WINDOW) {
                // 切歌导致，保留意图
            } else {
                saveFullscreenIntent(false);
            }
            updatePluginCardStatus();
        });

        bindPictureInPictureEvents(video);
    }

    // ==================== 插件卡片 UI ====================
    function injectUI() {
        return new Promise((resolve) => {
            function tryInject() {
                const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
                    ? window.MP3PluginManager.getBodyContainer('videoPlayer') : null;
                if (!body) { setTimeout(tryInject, 300); return; }
                body.innerHTML = `
                    <p class="text-[10px] text-slate-500 leading-relaxed">
                        检测到视频轨道时，在右下角显示悬浮小窗。全屏状态跨歌保持；PiP 中关闭小窗会保持隐藏。
                    </p>
                    <div class="flex items-center justify-between mt-1.5 gap-2">
                        <span class="text-[10px] text-slate-400 min-w-0 truncate">
                            状态：<b class="vp-status text-slate-500">等待播放</b>
                        </span>
                        <div class="flex items-center gap-1 shrink-0">
                            <button class="vp-show-btn hidden text-[10px] text-indigo-400 hover:text-indigo-300 transition" title="重新显示视频小窗">
                                <i class="fa-solid fa-eye mr-0.5"></i>显示小窗
                            </button>
                            <button class="vp-reset-hint text-[10px] text-slate-500 hover:text-slate-300 transition" title="清除所有隐藏和全屏记录">
                                清除记忆
                            </button>
                        </div>
                    </div>
                `;
                bindPluginCardButtons();
                resolve();
            }
            tryInject();
        });
    }

    function bindPluginCardButtons() {
        const body = window.MP3PluginManager?.getBodyContainer?.('videoPlayer');
        if (!body) return;

        const resetBtn = body.querySelector('.vp-reset-hint');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                try {
                    localStorage.removeItem(KEY_DISABLED_FOR_SRC);
                    localStorage.removeItem(KEY_GLOBAL_HIDDEN);
                    localStorage.removeItem(KEY_FULLSCREEN_INTENT);
                } catch (e) {}
                state.hiddenForCurrentSrc = false;
                state.fullscreenIntent = false;
                checkVideoTrack();
                updatePluginCardStatus();
            });
        }

        const showBtn = body.querySelector('.vp-show-btn');
        if (showBtn) {
            showBtn.addEventListener('click', () => {
                setGloballyHidden(false);
                try { localStorage.removeItem(KEY_DISABLED_FOR_SRC); } catch (e) {}
                state.hiddenForCurrentSrc = false;
                checkVideoTrack();
                updatePluginCardStatus();
            });
        }
    }

    function updatePluginCardStatus() {
        const body = window.MP3PluginManager?.getBodyContainer?.('videoPlayer');
        if (!body) return;
        const el = body.querySelector('.vp-status');
        const showBtn = body.querySelector('.vp-show-btn');
        if (!el) return;

        if (!state.videoEl) {
            el.textContent = '等待播放';
            el.className = 'vp-status text-slate-500';
            if (showBtn) showBtn.classList.add('hidden');
            return;
        }

        const hasVideo = (state.videoEl.videoWidth || 0) > 0;
        const inPip = isInPip();
        const containerVisible = state.container && !state.container.classList.contains('hidden');
        const globallyHidden = isGloballyHidden();

        if (hasVideo) {
            if (globallyHidden && inPip) {
                el.textContent = '画中画中（小窗已隐藏）';
                el.className = 'vp-status text-purple-400';
            } else if (isVideoFullscreen()) {
                el.textContent = '全屏播放中';
                el.className = 'vp-status text-emerald-400';
            } else if (containerVisible) {
                el.textContent = state.fullscreenIntent ? '视频播放中（全屏待恢复）' : '视频播放中';
                el.className = 'vp-status text-emerald-400';
            } else {
                el.textContent = '视频（已关闭）';
                el.className = 'vp-status text-amber-400';
            }
        } else if (state.videoEl.currentSrc || state.videoEl.src) {
            el.textContent = '纯音频';
            el.className = 'vp-status text-slate-500';
        } else {
            el.textContent = '等待播放';
            el.className = 'vp-status text-slate-500';
        }

        if (showBtn) {
            const shouldShow = hasVideo && !containerVisible;
            if (shouldShow) showBtn.classList.remove('hidden');
            else showBtn.classList.add('hidden');
        }
    }

    function bindContainerButtons(container) {
        container.querySelector('.video-btn-close').addEventListener('click', () => {
            const inPip = isInPip();
            setHiddenForCurrentSrc(true);
            if (inPip) {
                setGloballyHidden(true);
                console.log('[VideoPlayer] PiP 中关闭小窗 → 设置全局隐藏（切歌保持隐藏）');
            }
            hideContainer();
            updatePluginCardStatus();
        });

        container.querySelector('.video-btn-fullscreen').addEventListener('click', () => {
            requestFullscreenWithIntent();
        });
        container.querySelector('.video-btn-pip').addEventListener('click', () => {
            togglePictureInPicture();
        });
    }

    // ==================== 插件生命周期 ====================
    window.MP3VideoPlayerPlugin = {
        version: '1.5.0',
        async init() {
            injectStyles();
            state.container = createContainer();
            bindDrag(state.container);
            bindContainerButtons(state.container);
            bindFsUi(state.container);
            bindFullscreenEvents();
            await injectUI();

            await new Promise((resolve) => {
                let attempts = 0;
                const timer = setInterval(() => {
                    const ext = window.MP3AppExtension;
                    if (ext && ext.audioPlayer) { clearInterval(timer); resolve(); }
                    else if (++attempts > 30) { clearInterval(timer); resolve(); }
                }, 100);
            });

            bindVideoEvents();
            updatePluginCardStatus();
        },
        async unload() {
            try {
                if (isVideoFullscreen()) {
                    if (document.fullscreenElement && document.exitFullscreen) {
                        await document.exitFullscreen().catch(() => {});
                    } else if (state.videoEl && state.videoEl.webkitDisplayingFullscreen && state.videoEl.webkitExitFullscreen) {
                        try { state.videoEl.webkitExitFullscreen(); } catch (e) {}
                    }
                }
                if (document.pictureInPictureElement === state.videoEl) {
                    if (document.exitPictureInPicture) await document.exitPictureInPicture().catch(() => {});
                }
            } catch (e) {}

            if (state.videoEl) {
                try {
                    state.videoEl.controls = false;
                    state.videoEl.classList.add('sr-only');
                    state.videoEl.setAttribute('aria-hidden', 'true');
                    state.videoEl.style.width = '';
                    state.videoEl.style.height = '';
                    state.videoEl.style.objectFit = '';
                    if (state.originalParent && state.videoEl.parentNode !== state.originalParent) {
                        state.originalParent.appendChild(state.videoEl);
                    }
                } catch (e) {}
            }

            clearTimeout(state.fsUiTimer);
            state.fsUiTimer = null;

            detachAll();
            if (state.container) { state.container.remove(); state.container = null; }
            removeStyles();
            state.videoEl = null;
            state.originalParent = null;
            state.dragState = { active: false, startX: 0, startY: 0, originX: 0, originY: 0 };
            state.hiddenForCurrentSrc = false;
            state.userPressedEscape = false;
            state.fsSeeking = false;
        }
    };
})();