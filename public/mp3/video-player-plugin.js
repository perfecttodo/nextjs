/**
 * 视频渲染插件 v1.1
 * 
 * 相对 v1.0 的改动：
 *  1. ★ 全屏意图持久化：用户进入全屏后记录意图，切歌自动尝试恢复
 *  2. 切歌后如果全屏被浏览器意外退出 → 尝试重新 requestFullscreen
 *  3. 失败时显示「点击恢复全屏」浮层（避免用户手动找按钮）
 *  4. 用户按 ESC 主动退出时，清除全屏意图（不会自动恢复）
 */
(function () {
    'use strict';

    const NS = 'mp3_video_player_';
    const KEY_DISABLED_FOR_SRC = NS + 'disabled_for_src';
    const KEY_POSITION = NS + 'position';
    const KEY_FULLSCREEN_INTENT = NS + 'fullscreen_intent';

    const state = {
        container: null,
        originalParent: null,
        videoEl: null,
        hiddenForCurrentSrc: false,
        dragState: { active: false, startX: 0, startY: 0, originX: 0, originY: 0 },
        eventHandlers: [],
        // ★ 全屏意图
        fullscreenIntent: localStorage.getItem(KEY_FULLSCREEN_INTENT) === 'true',
        restoreHintTimer: null,
        userExitedFullscreenAt: 0
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

    function saveFullscreenIntent(value) {
        state.fullscreenIntent = value;
        try {
            if (value) localStorage.setItem(KEY_FULLSCREEN_INTENT, 'true');
            else localStorage.removeItem(KEY_FULLSCREEN_INTENT);
        } catch (e) {}
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
            </div>
            <div class="video-hint px-2 py-1 bg-slate-900/95 text-[9px] text-slate-500 text-center">
                拖动顶栏移动 · 关闭后本次不再显示
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
                const maxX = window.innerWidth - 60;
                const maxY = window.innerHeight - 60;
                const x = Math.max(0, Math.min(maxX, saved.x));
                const y = Math.max(0, Math.min(maxY, saved.y));
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

    // ==================== 全屏请求（带意图管理） ====================
    async function requestFullscreenWithIntent() {
        if (!state.videoEl) return false;
        const el = state.videoEl;
        try {
            if (el.requestFullscreen) await el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen();
            else return false;
            saveFullscreenIntent(true);
            hideRestoreHint();
            return true;
        } catch (e) {
            console.warn('[VideoPlayer] Fullscreen failed:', e);
            return false;
        }
    }

    async function tryRestoreFullscreen() {
        if (!state.fullscreenIntent) return;
        if (!state.videoEl) return;
        if (document.fullscreenElement === state.videoEl) return;
        if (isHiddenForCurrentSrc()) return;

        const ok = await requestFullscreenWithIntent();
        if (!ok) {
            showRestoreHint();
        }
    }

    function showRestoreHint() {
        if (!state.container) return;
        let hint = state.container.querySelector('.video-restore-fullscreen');
        if (hint) { hint.classList.remove('hidden'); return; }
        hint = document.createElement('button');
        hint.className = 'video-restore-fullscreen absolute inset-0 bg-black/60 backdrop-blur-sm text-white flex items-center justify-center gap-2 text-xs font-medium transition';
        hint.innerHTML = `<i class="fa-solid fa-expand"></i><span>点击恢复全屏</span>`;
        hint.addEventListener('click', async (e) => {
            e.stopPropagation();
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

    function requestFullscreen() {
        requestFullscreenWithIntent();
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
            state.videoEl.controls = true;

            if (state.videoEl.paused) {
                state.videoEl.play().catch(() => {});
            }
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
        if (hasVideo) {
            showContainer();
            // ★ 切歌后如果全屏意图还在但丢失了全屏 → 尝试恢复
            if (state.fullscreenIntent && document.fullscreenElement !== state.videoEl) {
                setTimeout(() => tryRestoreFullscreen(), 200);
            }
        } else {
            hideContainer();
        }
    }

    // ==================== 主流程 ====================
    function injectUI() {
        return new Promise((resolve) => {
            function tryInject() {
                const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
                    ? window.MP3PluginManager.getBodyContainer('videoPlayer') : null;
                if (!body) { setTimeout(tryInject, 300); return; }
                body.innerHTML = `
                    <p class="text-[10px] text-slate-500 leading-relaxed">
                        检测到视频轨道时，在右下角显示悬浮小窗，可拖动、全屏、画中画。全屏状态跨歌保留。
                    </p>
                    <div class="flex items-center justify-between mt-1.5 gap-2">
                        <span class="text-[10px] text-slate-400">
                            当前状态：<b class="vp-status text-slate-500">等待播放</b>
                        </span>
                        <button class="vp-reset-hint text-[10px] text-slate-500 hover:text-slate-300 transition" title="清除所有『已关闭』和『全屏意图』记录">
                            清除记忆
                        </button>
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
                    localStorage.removeItem(KEY_FULLSCREEN_INTENT);
                } catch (e) {}
                state.hiddenForCurrentSrc = false;
                state.fullscreenIntent = false;
                updatePluginCardStatus();
                checkVideoTrack();
            });
        }
    }

    function updatePluginCardStatus() {
        const body = window.MP3PluginManager?.getBodyContainer?.('videoPlayer');
        if (!body) return;
        const el = body.querySelector('.vp-status');
        if (!el) return;
        if (!state.videoEl) {
            el.textContent = '等待播放';
            el.className = 'vp-status text-slate-500';
            return;
        }
        const hasVideo = (state.videoEl.videoWidth || 0) > 0;
        if (hasVideo) {
            if (state.container && !state.container.classList.contains('hidden')) {
                el.textContent = '视频播放中';
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
    }

    function bindContainerButtons(container) {
        container.querySelector('.video-btn-close').addEventListener('click', () => {
            setHiddenForCurrentSrc(true);
            hideContainer();
            updatePluginCardStatus();
        });
        container.querySelector('.video-btn-fullscreen').addEventListener('click', () => {
            requestFullscreen();
        });
        container.querySelector('.video-btn-pip').addEventListener('click', () => {
            togglePictureInPicture();
        });
    }

    // ==================== 全屏事件监听 ====================
    function bindFullscreenEvents() {
        const onFullscreenChange = () => {
            const isFull = !!document.fullscreenElement;
            if (isFull) {
                // 进入全屏：记录意图
                if (document.fullscreenElement === state.videoEl) {
                    saveFullscreenIntent(true);
                    hideRestoreHint();
                }
            } else {
                // 退出全屏：区分「用户主动 ESC」和「切歌导致」
                const now = Date.now();
                // 切歌后 800ms 内的退出视为「浏览器强制」，保留意图
                // 超过 800ms 之后的退出，视为用户主动 ESC，清除意图
                if (now - state.userExitedFullscreenAt > 800) {
                    saveFullscreenIntent(false);
                }
                state.userExitedFullscreenAt = now;

                // 如果是切歌导致（意图还在），稍后尝试恢复
                if (state.fullscreenIntent) {
                    setTimeout(() => tryRestoreFullscreen(), 300);
                }
            }
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        state.eventHandlers.push({ el: document, event: 'fullscreenchange', handler: onFullscreenChange });
        state.eventHandlers.push({ el: document, event: 'webkitfullscreenchange', handler: onFullscreenChange });
    }

    // ==================== 视频事件绑定 ====================
    function bindVideoEvents() {
        const ext = window.MP3AppExtension;
        if (!ext || !ext.audioPlayer) { setTimeout(bindVideoEvents, 300); return; }

        const video = ext.audioPlayer;
        state.videoEl = video;
        state.originalParent = video.parentNode || document.body;

        // ★ 每次加载新视频元数据 → 检查视频轨道 + 尝试恢复全屏
        attach(video, 'loadedmetadata', () => {
            state.hiddenForCurrentSrc = isHiddenForCurrentSrc();
            checkVideoTrack();
            updatePluginCardStatus();
            // 再多等一会，有些流 videoWidth 出来得晚
            setTimeout(() => tryRestoreFullscreen(), 300);
        });

        attach(video, 'durationchange', () => {
            checkVideoTrack();
            updatePluginCardStatus();
        });

        attach(video, 'canplay', () => {
            if (state.fullscreenIntent && document.fullscreenElement !== video) {
                setTimeout(() => tryRestoreFullscreen(), 100);
            }
        });

        attach(video, 'emptied', () => {
            // src 被清空（切到纯音频或切源），不立刻隐藏，等下一次 loadedmetadata 判断
            updatePluginCardStatus();
        });

        attach(video, 'resize', () => {
            checkVideoTrack();
            updatePluginCardStatus();
        });

        // 用户手动进入全屏（原生控件点击全屏按钮）也会触发 fullscreenchange
        // 已在 bindFullscreenEvents 处理
    }

    // ==================== 插件生命周期 ====================
    window.MP3VideoPlayerPlugin = {
        version: '1.1.0',
        async init() {
            state.container = createContainer();
            bindDrag(state.container);
            bindContainerButtons(state.container);
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
            // 退出全屏（如果当前在全屏）
            try {
                if (document.fullscreenElement === state.videoEl) {
                    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
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

            detachAll();
            if (state.container) { state.container.remove(); state.container = null; }
            state.videoEl = null;
            state.originalParent = null;
            state.dragState = { active: false, startX: 0, startY: 0, originX: 0, originY: 0 };
            state.hiddenForCurrentSrc = false;
            state.restoreHintTimer = null;
        }
    };
})();