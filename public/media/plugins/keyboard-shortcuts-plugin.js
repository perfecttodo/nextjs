/**
 * plugins/keyboard-shortcuts-plugin.js  (v1.0.0)
 *
 * 从 index.html 提取的快捷键功能，作为独立插件存在：
 *  - 未启用时不注册任何键盘监听，零副作用
 *  - 命令分发到主应用的全局函数（togglePlay / playNext / ...）
 *  - 支持修饰键（ctrl+/meta+/alt+/shift+）
 *  - 提供可视化设置面板，可点击重新绑定
 *  - 可开关「扩展绑定」（/、M、←/→）
 *
 * index.html 需删除：
 *   - function initKeyboardShortcuts() { ... }
 *   - DOMContentLoaded 中的 initKeyboardShortcuts();
 */
(function () {
    'use strict';

    // ============================================================
    // §0 占位导出：即使崩溃也让 plugin-center 拿到可读错误
    // ============================================================
    const PLACEHOLDER = {
        __version: '1.0.0',
        __loading: true,
        __loadedAt: Date.now(),
        __error: null
    };
    window.MP3KeyboardShortcutsPlugin = PLACEHOLDER;

    try {
        // ============================================================
        // §1 常量
        // ============================================================
        const BINDINGS_KEY = 'mp3_keyboard_bindings';       // 用户覆盖
        const EXPERIMENTAL_KEY = 'mp3_keyboard_experimental'; // '1' / '0'

        // 需要 preventDefault 的基础键（避免页面滚动、Firefox 快速查找等）
        const PREVENT_DEFAULT_KEYS = new Set([
            ' ', 'n', 'p', 'r', '/', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'
        ]);

        // 与 index.html 原有快捷键完全一致的默认绑定
        const DEFAULT_BINDINGS = Object.freeze({
            'l':        { action: 'togglePlayerLike',   desc: '加入/取消最愛' },
            'n':        { action: 'playNext',           desc: '下一個' },
            'p':        { action: 'playPrev',           desc: '上一個' },
            'r':        { action: 'refreshFiles',       desc: '重新整理列表' },
            ' ':        { action: 'togglePlay',         desc: '播放/暫停' },
            'escape':   { action: 'closeMobileDrawer',  desc: '關閉手機側欄' }
        });

        // 实验绑定：默认关闭，开启后才生效
        const EXPERIMENTAL_BINDINGS = Object.freeze({
            '/':        { action: 'focusSearch',        desc: '聚焦搜尋框' },
            'm':        { action: 'toggleMute',         desc: '靜音/取消靜音' },
            'arrowleft':  { action: 'seekBackward',     desc: '後退 5 秒' },
            'arrowright': { action: 'seekForward',      desc: '前進 5 秒' }
        });

        // ============================================================
        // §2 工具
        // ============================================================
        function escapeHtml(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }
        function escapeAttr(s) { return escapeHtml(s); }

        const KEY_DISPLAY = {
            ' ': 'Space', 'escape': 'Esc', 'enter': 'Enter', 'tab': 'Tab',
            'backspace': 'Backspace', 'delete': 'Del',
            'arrowleft': '←', 'arrowright': '→', 'arrowup': '↑', 'arrowdown': '↓'
        };
        function keyToDisplay(key) {
            const parts = String(key).split('+');
            const base = parts.pop();
            const mods = parts.map(p => p[0].toUpperCase() + p.slice(1));
            const baseDisp = KEY_DISPLAY[base] || (base.length === 1 ? base.toUpperCase() : base);
            return [...mods, baseDisp].join('+');
        }

        // 把 KeyboardEvent 规范为 "ctrl+shift+l" 形式（base 用 code 兜底）
        function eventToKeyName(e) {
            const parts = [];
            if (e.ctrlKey) parts.push('ctrl');
            if (e.metaKey) parts.push('meta');
            if (e.altKey) parts.push('alt');
            if (e.shiftKey) parts.push('shift');

            let base;
            const code = e.code || '';
            if (code === 'Space') base = ' ';
            else if (code === 'Escape') base = 'escape';
            else if (code === 'Slash') base = '/';
            else if (code === 'Enter' || code === 'NumpadEnter') base = 'enter';
            else if (code === 'Tab') base = 'tab';
            else if (code === 'Backspace') base = 'backspace';
            else if (code === 'Delete') base = 'delete';
            else if (code.startsWith('Arrow')) base = code.toLowerCase();
            else if (code.startsWith('Key')) base = code.slice(3).toLowerCase();
            else if (code.startsWith('Digit')) base = code.slice(5);
            else base = (e.key || '').toLowerCase();

            parts.push(base);
            return parts.join('+');
        }

        function parseBinding(spec) {
            const parts = String(spec).toLowerCase().split('+');
            const base = parts.pop();
            const mods = new Set(parts.filter(p => ['ctrl', 'meta', 'alt', 'shift'].includes(p)));
            return { base, mods };
        }

        /**
         * 判断绑定 spec 是否匹配已规范化的按键名 pressedName
         * - 绑定无修饰键：忽略 pressed 的修饰键（向后兼容原行为，如 Shift+L 也触发 L）
         * - 绑定有修饰键：严格匹配
         */
        function bindingMatches(spec, pressedName) {
            const b = parseBinding(spec);
            const p = parseBinding(pressedName);
            if (b.base !== p.base) return false;
            if (b.mods.size === 0) return true;
            if (b.mods.size !== p.mods.size) return false;
            for (const m of b.mods) if (!p.mods.has(m)) return false;
            return true;
        }

        // ============================================================
        // §3 命令表
        // ============================================================
        const COMMANDS = {
            togglePlayerLike: () => window.togglePlayerLike?.(),
            playNext:         () => window.playNext?.(),
            playPrev:         () => window.playPrev?.(),
            togglePlay:       () => window.togglePlay?.(),
            refreshFiles:     () => window.loadFiles?.(false),
            closeMobileDrawer:() => window.toggleMobileDrawer?.(false),

            focusSearch: () => {
                const el = document.getElementById('searchInput');
                if (el) { el.focus(); el.select?.(); }
            },
            toggleMute: () => {
                const ap = window.MP3AppExtension?.audioPlayer;
                if (ap) ap.muted = !ap.muted;
            },
            seekBackward: () => {
                const ap = window.MP3AppExtension?.audioPlayer;
                if (ap && isFinite(ap.duration)) ap.currentTime = Math.max(0, ap.currentTime - 5);
            },
            seekForward: () => {
                const ap = window.MP3AppExtension?.audioPlayer;
                if (ap && isFinite(ap.duration)) ap.currentTime = Math.min(ap.duration, ap.currentTime + 5);
            }
        };

        // ============================================================
        // §4 存储读写（只保存差异）
        // ============================================================
        function getStoredCustom() {
            try {
                const raw = localStorage.getItem(BINDINGS_KEY);
                if (!raw) return {};
                const obj = JSON.parse(raw);
                return obj && typeof obj === 'object' ? obj : {};
            } catch (e) { return {}; }
        }
        function saveStoredCustom(obj) {
            try { localStorage.setItem(BINDINGS_KEY, JSON.stringify(obj)); } catch (e) {}
        }
        function isExperimentalEnabled() {
            return localStorage.getItem(EXPERIMENTAL_KEY) === '1';
        }
        function setExperimentalEnabled(v) {
            try { localStorage.setItem(EXPERIMENTAL_KEY, v ? '1' : '0'); } catch (e) {}
        }

        /** 默认 + 用户覆盖（不含实验层） */
        function getUserBaseBindings() {
            const custom = getStoredCustom();
            const base = { ...DEFAULT_BINDINGS };
            for (const [k, v] of Object.entries(custom)) {
                if (v === null) delete base[k];
                else base[k] = v;
            }
            return base;
        }

        /** 真正生效的绑定（含实验层） */
        function getActiveBindings() {
            const base = getUserBaseBindings();
            if (isExperimentalEnabled()) {
                for (const [k, v] of Object.entries(EXPERIMENTAL_BINDINGS)) {
                    if (!(k in base)) base[k] = v;
                }
            }
            return base;
        }

        /** 从 userBase 反推差异并持久化 */
        function persistUserBase(userBase) {
            const custom = {};
            for (const [k, v] of Object.entries(userBase)) {
                const def = DEFAULT_BINDINGS[k];
                if (!def || def.action !== v.action) custom[k] = v;
            }
            for (const k of Object.keys(DEFAULT_BINDINGS)) {
                if (!(k in userBase)) custom[k] = null;
            }
            saveStoredCustom(custom);
        }

        // ============================================================
        // §5 主 keydown 处理
        // ============================================================
        let installedHandler = null;
        let recordingState = null; // { originalKey, handler }

        function isEditableTarget(el) {
            if (!el) return false;
            const tag = el.tagName;
            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
            if (el.isContentEditable) return true;
            return false;
        }

        function handleKeydown(e) {
            if (recordingState) return;             // 录制中，主 handler 不响应
            if (e.defaultPrevented) return;
            if (e.repeat) return;                   // 长按不重复触发（修正原 bug）
            if (isEditableTarget(document.activeElement)) return;

            // 纯修饰键忽略
            if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

            const pressed = eventToKeyName(e);
            const active = getActiveBindings();

            for (const [spec, binding] of Object.entries(active)) {
                if (!bindingMatches(spec, pressed)) continue;

                const cmd = COMMANDS[binding.action];
                if (typeof cmd === 'function') {
                    if (PREVENT_DEFAULT_KEYS.has(parseBinding(spec).base)) e.preventDefault();
                    try { cmd(e); }
                    catch (err) { console.warn('[KeyboardShortcuts] 命令失败:', binding.action, err); }
                } else {
                    console.warn('[KeyboardShortcuts] 未知命令:', binding.action);
                }
                return;
            }
        }

        function installHandler() {
            if (installedHandler) return;
            installedHandler = handleKeydown;
            window.addEventListener('keydown', installedHandler);
            console.log('[KeyboardShortcuts] listener installed');
        }
        function uninstallHandler() {
            if (!installedHandler) return;
            window.removeEventListener('keydown', installedHandler);
            installedHandler = null;
            console.log('[KeyboardShortcuts] listener removed');
        }

        // ============================================================
        // §6 录制（改键）
        // ============================================================
        function startRecording(originalKey) {
            cancelRecording();

            const userBase = getUserBaseBindings();
            if (!(originalKey in userBase)) {
                // 实验绑定不可编辑
                return;
            }

            const handler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
                if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    cancelRecording();
                    return;
                }
                finalizeRecording(originalKey, eventToKeyName(e));
            };

            recordingState = { originalKey, handler };
            window.addEventListener('keydown', handler, true);
            renderBindingsList();
        }

        function cancelRecording() {
            if (!recordingState) return;
            window.removeEventListener('keydown', recordingState.handler, true);
            recordingState = null;
            renderBindingsList();
        }

        function finalizeRecording(originalKey, newKey) {
            if (!recordingState) return;
            window.removeEventListener('keydown', recordingState.handler, true);
            recordingState = null;

            const userBase = getUserBaseBindings();
            const item = userBase[originalKey];
            if (!item) { renderBindingsList(); return; }

            // 冲突检测（只针对 userBase，实验层不算冲突）
            const conflictKey = Object.keys(userBase).find(
                k => k !== originalKey && bindingMatches(k, newKey)
            );
            if (conflictKey) {
                const conflictDesc = userBase[conflictKey].desc || userBase[conflictKey].action;
                if (!window.confirm(`「${keyToDisplay(newKey)}」已被「${conflictDesc}」使用，是否覆蓋？`)) {
                    renderBindingsList();
                    return;
                }
                delete userBase[conflictKey];
            }

            delete userBase[originalKey];
            userBase[newKey] = item;
            persistUserBase(userBase);
            renderBindingsList();
        }

        // ============================================================
        // §7 插件对象
        // ============================================================
        let initPromise = null;
        let uiMounted = false;

        const plugin = {
            __version: '1.0.0',
            __loading: false,
            __error: null,

            async init() {
                if (initPromise) return initPromise;
                initPromise = (async () => {
                    console.log('[KeyboardShortcuts] init() begin');
                    installHandler();
                    renderSettingsUI();
                    uiMounted = true;
                    console.log('[KeyboardShortcuts] ✅ init() done');
                })().catch(err => {
                    initPromise = null;
                    console.error('[KeyboardShortcuts] init() 失败:', err);
                    throw err;
                });
                return initPromise;
            },

            async unload() {
                cancelRecording();
                uninstallHandler();
                const card = document.getElementById('keyboardShortcutsCard');
                if (card) card.remove();
                uiMounted = false;
                initPromise = null;
                console.log('[KeyboardShortcuts] unloaded');
            },

            // 供外部调试 / 编程式改绑
            getBindings: () => getActiveBindings(),
            setBinding(key, binding) {
                const userBase = getUserBaseBindings();
                userBase[key] = binding;
                persistUserBase(userBase);
                renderBindingsList();
            },
            resetBindings() {
                saveStoredCustom({});
                renderBindingsList();
            },

            async __selfTest() {
                console.table({
                    version: this.__version,
                    listenerInstalled: !!installedHandler,
                    uiMounted,
                    experimental: isExperimentalEnabled(),
                    bindingCount: Object.keys(getActiveBindings()).length,
                    defaultCount: Object.keys(DEFAULT_BINDINGS).length
                });
            }
        };

        // ============================================================
        // §8 设置 UI
        // ============================================================
        function renderSettingsUI() {
            const slot = document.getElementById('pluginSlot');
            if (!slot) return;

            let card = document.getElementById('keyboardShortcutsCard');
            if (!card) {
                card = document.createElement('div');
                card.id = 'keyboardShortcutsCard';
                card.className = 'sidebar-card bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden';
                card.dataset.collapseKey = 'keyboard';
                card.innerHTML = `
                    <button type="button" class="sidebar-card-header w-full flex items-center justify-between gap-2 px-4 py-3 text-left" onclick="window.toggleSidebarCard && window.toggleSidebarCard('keyboard')" aria-expanded="true">
                        <span class="flex items-center gap-2 min-w-0">
                            <i class="fa-solid fa-keyboard text-indigo-400 text-xs"></i>
                            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">鍵盤快捷鍵</span>
                        </span>
                        <i class="fa-solid fa-chevron-down sidebar-card-chevron text-slate-500 text-[10px]"></i>
                    </button>
                    <div class="sidebar-card-body">
                        <div class="inner px-4">
                            <div id="kbBindingsList" class="space-y-1.5"></div>
                            <div class="flex items-center justify-between pt-2 mt-3 border-t border-slate-800">
                                <label class="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                                    <input type="checkbox" id="kbExperimentalToggle" class="w-3 h-3 accent-indigo-500">
                                    <span>擴展綁定</span>
                                </label>
                                <button id="kbResetBtn" class="text-[11px] text-indigo-400 hover:underline">恢復預設</button>
                            </div>
                        </div>
                    </div>`;
                slot.appendChild(card);

                // 让主应用的折叠逻辑对新卡片生效
                if (typeof window.MP3SetupSidebarCards === 'function') {
                    window.MP3SetupSidebarCards();
                }

                card.querySelector('#kbResetBtn').addEventListener('click', () => {
                    if (!window.confirm('確定要將所有快捷鍵恢復為預設嗎？')) return;
                    plugin.resetBindings();
                });
                card.querySelector('#kbExperimentalToggle').addEventListener('change', (e) => {
                    setExperimentalEnabled(e.target.checked);
                    renderBindingsList();
                });
            }
            renderBindingsList();
        }

        function renderBindingsList() {
            const list = document.getElementById('kbBindingsList');
            if (!list) return;

            const experimental = isExperimentalEnabled();
            const toggle = document.getElementById('kbExperimentalToggle');
            if (toggle) toggle.checked = experimental;

            const userBase = getUserBaseBindings();
            const active = getActiveBindings();

            list.innerHTML = Object.entries(active).map(([key, b]) => {
                const isRecording = recordingState && recordingState.originalKey === key;
                const isEditable = key in userBase;
                const keyDisplay = isRecording ? '按鍵中…' : keyToDisplay(key);
                const kbdClass = isRecording
                    ? 'px-1.5 py-0.5 rounded bg-indigo-900 border border-indigo-500 font-mono text-[10px] text-indigo-200 ring-2 ring-indigo-500/50 animate-pulse'
                    : isEditable
                        ? 'cursor-pointer px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition'
                        : 'px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 font-mono text-[10px] text-slate-500 opacity-70 cursor-not-allowed';
                return `
                    <div class="flex items-center justify-between gap-2 text-[11px]">
                        <span class="text-slate-300 truncate" title="${escapeAttr(b.desc || b.action)}">${escapeHtml(b.desc || b.action)}</span>
                        <kbd ${isEditable ? `data-kb-key="${escapeAttr(key)}"` : ''}
                            class="${kbdClass}"
                            title="${isEditable ? '點擊重新綁定' : '擴展綁定不可編輯'}">${escapeHtml(keyDisplay)}</kbd>
                    </div>`;
            }).join('');

            list.querySelectorAll('kbd[data-kb-key]').forEach(kbd => {
                kbd.addEventListener('click', () => startRecording(kbd.dataset.kbKey));
            });
        }

        // ============================================================
        // §9 升级占位对象
        // ============================================================
        Object.assign(PLACEHOLDER, plugin);
        PLACEHOLDER.__loading = false;
        console.log('[KeyboardShortcuts] ✅ exposed as window.MP3KeyboardShortcutsPlugin v' + plugin.__version);

    } catch (err) {
        console.error('[KeyboardShortcuts] ❌ IIFE 初始化异常:', err);
        PLACEHOLDER.__loading = false;
        PLACEHOLDER.__error = (err && err.message) || String(err);
        PLACEHOLDER.__stack = err && err.stack;
        PLACEHOLDER.init = async function () {
            throw new Error('[KeyboardShortcuts] 加载异常: ' + PLACEHOLDER.__error);
        };
        PLACEHOLDER.unload = async function () {};
    }
})();