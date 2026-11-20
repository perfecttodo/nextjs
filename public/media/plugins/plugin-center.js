/**
 * ============================================================
 *  plugins/plugin-center.js — 插件中心（分组 + 筛选 chips 版）
 *
 *  设计：
 *   - 已启用 / 未启用 两组同屏显示，无需切换 Tab
 *   - filter chips：全部 / 已启用 / 未启用 / 错误（纯过滤，不切视图）
 *   - 全局搜索跨两组；分组标题可折叠；状态持久化
 *   - 启用/停用后插件行自动在两组之间移动
 *   - .plugin-body[data-plugin-id] 容器永远保留在 DOM
 *   - 旧 Tab 设置自动迁移到 filter
 * ============================================================
 */
(function () {
    'use strict';

    const PLUGIN_BASE = 'plugins/';

    // ==================== 插件註冊表（全部位於 ./plugins/） ====================
    const REGISTRY = {
        local: {
            id: 'local', name: '本地目錄', description: '支援多個 API 端點與多個目錄',
            icon: 'fa-solid fa-folder-open', iconClass: 'text-slate-300',
            scriptSrc: PLUGIN_BASE + 'local-plugin.js', globalVar: 'MP3LocalPlugin', autoEnable: true, dataSourceKeys: []
        },
        filesystem: {
            id: 'filesystem', name: '本地檔案（瀏覽器）', description: '直接讀取本機目錄，無需 API（Chrome / Edge）',
            icon: 'fa-solid fa-folder-tree', iconClass: 'text-cyan-400',
            scriptSrc: PLUGIN_BASE + 'filesystem-plugin.js', globalVar: 'MP3FileSystemPlugin', dataSourceKeys: ['filesystem']
        },
        gdrive: {
            id: 'gdrive', name: 'Google Drive 音樂', description: '從 Drive 的 music/fav 加載音樂',
            icon: 'fa-brands fa-google-drive', iconClass: 'text-emerald-400',
            scriptSrc: PLUGIN_BASE + 'google-drive-plugin.js', globalVar: 'MP3GoogleDrivePlugin', dataSourceKeys: ['gdrive']
        },
        news: {
            id: 'news', name: 'News 播放列表', description: '通過 /api/mp3/news 加載新聞音頻（m3u8）',
            icon: 'fa-solid fa-newspaper', iconClass: 'text-amber-400',
            scriptSrc: PLUGIN_BASE + 'news-plugin.js', globalVar: 'MP3NewsPlugin', dataSourceKeys: ['news']
        },
        urlMedia: {
            id: 'urlMedia', name: 'URL 媒體', description: '貼上 URL 加入媒體庫（音訊 / 影片 / 串流）',
            icon: 'fa-solid fa-link', iconClass: 'text-fuchsia-400',
            scriptSrc: PLUGIN_BASE + 'url-media-plugin.js', globalVar: 'MP3UrlMediaPlugin', autoEnable: true, dataSourceKeys: ['urlmedia']
        },
        share: {
            id: 'share', name: '分享與接受分享', description: '多選媒體、問題保護、URL 分享與接收',
            icon: 'fa-solid fa-share-nodes', iconClass: 'text-sky-400',
            scriptSrc: PLUGIN_BASE + 'share-plugin.js', globalVar: 'MP3SharePlugin', autoEnable: true, dataSourceKeys: []
        },
        copyFav: {
            id: 'copyFav', name: '複製我的最愛', description: '把「我的最愛」複製到指定本地目錄',
            icon: 'fa-solid fa-copy', iconClass: 'text-rose-400',
            scriptSrc: PLUGIN_BASE + 'copy-favorites-plugin.js', globalVar: 'MP3CopyFavoritesPlugin', dataSourceKeys: []
        },
        autoPlay: {
            id: 'autoPlay', name: '自動播放', description: '定時自動切換下一首',
            icon: 'fa-solid fa-bolt', iconClass: 'text-amber-400',
            scriptSrc: PLUGIN_BASE + 'autoplay-plugin.js', globalVar: 'MP3AutoPlayPlugin', autoEnable: true, dataSourceKeys: []
        },
        videoPlayer: {
            id: 'videoPlayer', name: '視頻渲染', description: '檢測到視頻軌時顯示懸浮小窗，支持全屏 / 畫中畫',
            icon: 'fa-solid fa-tv', iconClass: 'text-purple-400',
            scriptSrc: PLUGIN_BASE + 'video-player-plugin.js', globalVar: 'MP3VideoPlayerPlugin', autoEnable: true, dataSourceKeys: []
        },
        multiUser: {
            id: 'multiUser', name: '多用戶', description: '每個用戶獨立的 Like 記憶',
            icon: 'fa-solid fa-user-shield', iconClass: 'text-indigo-400',
            scriptSrc: PLUGIN_BASE + 'multi-user-plugin.js', globalVar: 'MP3MultiUserPlugin', autoEnable: true, dataSourceKeys: []
        },
        youtube: {
            id: 'youtube', name: 'YouTube 播放清單', description: '匯入多個 YouTube 清單並播放',
            icon: 'fa-brands fa-youtube', iconClass: 'text-red-500',
            scriptSrc: 'plugins/youtube-plugin.js', globalVar: 'MP3YouTubePlugin',
            autoEnable: false, dataSourceKeys: ['youtube']
        },
        webdavStorage: {
            id: 'webdavStorage',
            name: 'WebDAV 存储',
            description: '把媒体存入 WebDAV 服务器',
            icon: 'fa-solid fa-cloud',
            iconClass: 'text-sky-400',
            scriptSrc: PLUGIN_BASE + 'webdav-storage-plugin.js',
            globalVar: 'MP3WebDAVStoragePlugin',
            autoEnable: false,
            dataSourceKeys: []
        },
        keyboardShortcuts: {
            id: 'keyboardShortcuts',
            name: '鍵盤快捷鍵',
            description: 'P/N/L/R/Space/Esc 等快捷鍵，可自訂綁定',
            icon: 'fa-solid fa-keyboard',
            iconClass: 'text-indigo-300',
            scriptSrc: PLUGIN_BASE + 'keyboard-shortcuts-plugin.js',
            globalVar: 'MP3KeyboardShortcutsPlugin',
            autoEnable: true,
            dataSourceKeys: []
        },
        recording: {
            id: 'recording',
            name: '录音',
            description: '浏览器麦克风录音，存入存储并加入播放列表',
            icon: 'fa-solid fa-microphone',
            iconClass: 'text-rose-400',
            scriptSrc: PLUGIN_BASE + 'recording-plugin.js',
            globalVar: 'MP3RecordingPlugin',
            autoEnable: false,
            dataSourceKeys: ['recording']
        },
    };

    const STORAGE_KEY = 'mp3_enabled_dynamic_plugins';
    const EXPANDED_KEY = 'mp3_plugin_center_expanded';
    const FILTER_KEY = 'mp3_plugin_center_filter';
    const GROUP_KEY = 'mp3_plugin_center_groups';
    const TAB_KEY_LEGACY = 'mp3_plugin_center_tab';

    const enabled = new Set();
    const loadedPlugins = {};
    const loadingPlugins = {};
    const loadedScripts = new Set();
    const busyMap = {};
    const errorMap = {};
    const rowRefs = {};
    const refs = {};
    let uiRoot = null;
    let uiBuilt = false;
    let query = '';
    let expandedId = null;
    let filterMode = 'all';
    const collapsedGroups = { on: false, off: false };

    try {
        const savedFilter = localStorage.getItem(FILTER_KEY);
        if (savedFilter === 'all' || savedFilter === 'on' || savedFilter === 'off' || savedFilter === 'error') {
            filterMode = savedFilter;
        } else {
            const legacyTab = localStorage.getItem(TAB_KEY_LEGACY);
            if (legacyTab === 'on' || legacyTab === 'off') filterMode = legacyTab;
        }
        const g = JSON.parse(localStorage.getItem(GROUP_KEY) || '{}');
        if (typeof g.on === 'boolean') collapsedGroups.on = g.on;
        if (typeof g.off === 'boolean') collapsedGroups.off = g.off;
        const savedExpanded = localStorage.getItem(EXPANDED_KEY);
        if (savedExpanded && REGISTRY[savedExpanded]) expandedId = savedExpanded;
    } catch (e) {}

    const storedRaw = localStorage.getItem(STORAGE_KEY);
    if (storedRaw === null) {
        Object.values(REGISTRY).forEach(meta => { if (meta.autoEnable) enabled.add(meta.id); });
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...enabled])); } catch (e) {}
    } else {
        try {
            const parsed = JSON.parse(storedRaw);
            if (Array.isArray(parsed)) parsed.forEach(id => { if (REGISTRY[id]) enabled.add(id); });
        } catch (e) {}
    }

    // ==================== 小工具 ====================
    function esc(s) {
        return typeof window.escapeHtmlAttr === 'function'
            ? window.escapeHtmlAttr(s)
            : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...enabled])); } catch (e) {} }
    function persistFilter() { try { localStorage.setItem(FILTER_KEY, filterMode); } catch (e) {} }
    function persistGroups() { try { localStorage.setItem(GROUP_KEY, JSON.stringify(collapsedGroups)); } catch (e) {} }
    function persistExpanded() {
        try {
            if (expandedId) localStorage.setItem(EXPANDED_KEY, expandedId);
            else localStorage.removeItem(EXPANDED_KEY);
        } catch (e) {}
    }
    function withTimeout(promise, ms, msg) {
        return Promise.race([
            Promise.resolve(promise),
            new Promise((_, reject) => setTimeout(() => reject(new Error(msg || ('操作逾時（' + ms + 'ms）'))), ms))
        ]);
    }
    function getBodyContainer(id) {
        return uiRoot ? uiRoot.querySelector('.plugin-body[data-plugin-id="' + id + '"]') : null;
    }
    function cleanupDataSources(meta) {
        if (!window.MP3DataSourceHandlers) return;
        const keys = Array.isArray(meta.dataSourceKeys) ? meta.dataSourceKeys : [meta.id];
        keys.forEach(k => { try { delete window.MP3DataSourceHandlers[k]; } catch (e) {} });
    }

    // ==================== 插件生命週期 ====================
    async function rollbackPlugin(id, meta, plugin) {
        if (plugin && typeof plugin.unload === 'function') {
            try { await withTimeout(plugin.unload(), 4000, 'unload 逾時'); } catch (e) {}
        }
        const bodyEl = getBodyContainer(id);
        if (bodyEl) bodyEl.innerHTML = '';
        cleanupDataSources(meta);
        try { delete window[meta.globalVar]; } catch (e) {}
        const ext = window.MP3AppExtension;
        if (ext && Array.isArray(ext.allFiles)) {
            const sourceKeys = Array.isArray(meta.dataSourceKeys) ? meta.dataSourceKeys : [];
            if (sourceKeys.length) {
                try {
                    ext.allFiles = ext.allFiles.filter(f => sourceKeys.indexOf(f._source) === -1);
                    if (typeof window.renderTable === 'function') window.renderTable();
                } catch (e) {}
            }
        }
        enabled.delete(id);
        persist();
    }

    function loadScriptOnce(src) {
        if (loadedScripts.has(src)) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.dataset.pluginSrc = src;
            s.onload = () => { loadedScripts.add(src); resolve(); };
            s.onerror = () => reject(new Error('無法載入插件腳本：' + src));
            document.head.appendChild(s);
        });
    }

    async function enablePlugin(id) {
        const meta = REGISTRY[id];
        if (!meta) throw new Error('未知插件：' + id);
        if (loadedPlugins[id]) {
            enabled.add(id);
            persist();
            return loadedPlugins[id];
        }
        if (loadingPlugins[id]) return loadingPlugins[id];

        const task = (async () => {
            let plugin = null;
            try {
                await withTimeout(loadScriptOnce(meta.scriptSrc), 10000, '載入腳本逾時');
                plugin = window[meta.globalVar];
                if (!plugin) throw new Error('插件未暴露全域變數：' + meta.globalVar);
                if (typeof plugin.init !== 'function') throw new Error('插件缺少 init() 方法');
                await withTimeout(plugin.init(), 15000, 'init 逾時');
                loadedPlugins[id] = plugin;
                enabled.add(id);
                persist();
                return plugin;
            } catch (err) {
                await rollbackPlugin(id, meta, plugin || window[meta.globalVar]);
                throw err;
            }
        })();
        loadingPlugins[id] = task;
        try { return await task; }
        finally { delete loadingPlugins[id]; }
    }

    async function disablePlugin(id) {
        const meta = REGISTRY[id];
        const plugin = loadedPlugins[id];
        if (plugin && typeof plugin.unload === 'function') {
            try { await withTimeout(plugin.unload(), 5000, 'unload 逾時'); } catch (e) {}
        }
        delete loadedPlugins[id];
        enabled.delete(id);
        persist();
        const bodyEl = getBodyContainer(id);
        if (bodyEl) bodyEl.innerHTML = '';
        if (meta) cleanupDataSources(meta);
    }

    // ==================== 樣式 ====================
    function injectStyles() {
        if (document.getElementById('pluginCenterTabStyles')) return;
        const style = document.createElement('style');
        style.id = 'pluginCenterTabStyles';
        style.textContent = `
            #pluginManagerCard .pc-scroll{scrollbar-width:thin;scrollbar-color:rgba(99,102,241,.45) rgba(15,23,42,.6)}
            #pluginManagerCard .pc-scroll::-webkit-scrollbar{width:6px;height:6px}
            #pluginManagerCard .pc-scroll::-webkit-scrollbar-track{background:rgba(15,23,42,.6);border-radius:999px}
            #pluginManagerCard .pc-scroll::-webkit-scrollbar-thumb{background:rgba(99,102,241,.5);border-radius:999px}
            #pluginManagerCard .pc-scroll::-webkit-scrollbar-thumb:hover{background:rgba(129,140,248,.75)}
            #pluginManagerCard .pc-item{border-color:rgba(51,65,85,.7);background:rgba(15,23,42,.35);transition:border-color .18s ease,background .18s ease,box-shadow .18s ease}
            #pluginManagerCard .pc-item:hover{border-color:rgba(99,102,241,.3);background:rgba(30,41,59,.45)}
            #pluginManagerCard .pc-item.is-enabled{border-color:rgba(99,102,241,.35);background:rgba(99,102,241,.08);box-shadow:inset 2px 0 0 rgba(99,102,241,.9)}
            #pluginManagerCard .pc-item.is-enabled .pc-tile{border-color:rgba(99,102,241,.4);box-shadow:0 0 10px rgba(99,102,241,.18)}
            #pluginManagerCard .pc-item.is-open{border-color:rgba(99,102,241,.45)}
            #pluginManagerCard .pc-item.is-busy{opacity:.85}
            #pluginManagerCard .pc-item.has-error{border-color:rgba(244,63,94,.45);background:rgba(244,63,94,.06)}
            #pluginManagerCard .pc-dot{background:#475569;transition:all .2s}
            #pluginManagerCard .pc-item.is-enabled .pc-dot{background:#818cf8;box-shadow:0 0 6px rgba(129,140,248,.9)}
            #pluginManagerCard .pc-item.is-busy .pc-dot{background:#f59e0b;animation:pcPulse 1s ease-in-out infinite}
            #pluginManagerCard .pc-item.has-error .pc-dot{background:#f43f5e}
            #pluginManagerCard .pc-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .28s cubic-bezier(.4,0,.2,1)}
            #pluginManagerCard .pc-item.is-open .pc-panel{grid-template-rows:1fr}
            #pluginManagerCard .pc-panel>div{overflow:hidden;min-height:0}
            #pluginManagerCard .pc-chevron{transition:transform .22s ease}
            #pluginManagerCard .pc-item.is-open .pc-chevron{transform:rotate(180deg)}
            #pluginManagerCard .pc-expand:focus-visible,#pluginManagerCard .pc-chip:focus-visible,#pluginManagerCard .pc-group-header:focus-visible{outline:2px solid rgba(99,102,241,.6);outline-offset:2px;border-radius:10px}
            @keyframes pcPulse{0%,100%{opacity:1}50%{opacity:.35}}

            /* filter chips */
            #pluginManagerCard .pc-chip{border-color:rgba(51,65,85,.8);background:rgba(30,41,59,.5);color:#94a3b8;transition:all .15s ease}
            #pluginManagerCard .pc-chip:hover{border-color:rgba(99,102,241,.35);color:#c7d2fe}
            #pluginManagerCard .pc-chip.is-active{border-color:rgba(99,102,241,.5);background:rgba(99,102,241,.18);color:#a5b4fc}
            #pluginManagerCard .pc-chip-count{background:rgba(15,23,42,.5);color:inherit;opacity:.85}
            #pluginManagerCard .pc-chip.is-active .pc-chip-count{background:rgba(99,102,241,.25)}
            #pluginManagerCard .pc-chip-error{border-color:rgba(244,63,94,.45);color:#fda4af;background:rgba(244,63,94,.08)}
            #pluginManagerCard .pc-chip-error.is-active{border-color:rgba(244,63,94,.6);background:rgba(244,63,94,.18);color:#fecdd3}

            /* group */
            #pluginManagerCard .pc-group-header{color:#64748b;transition:color .15s ease}
            #pluginManagerCard .pc-group-header:hover{color:#cbd5e1}
            #pluginManagerCard .pc-group-chevron{transition:transform .2s ease}
            #pluginManagerCard .pc-group.is-collapsed .pc-group-chevron{transform:rotate(-90deg)}
            #pluginManagerCard .pc-group.is-collapsed .pc-group-body{display:none}
            #pluginManagerCard .pc-group-count{background:rgba(15,23,42,.6);border:1px solid rgba(71,85,105,.6);border-radius:999px;padding:0 6px}
            #pluginManagerCard .pc-group[data-group="on"] .pc-group-count{color:#a5b4fc;border-color:rgba(99,102,241,.4)}
        `;
        document.head.appendChild(style);
    }

    // ==================== UI ====================
    function pluginRowHtml(meta) {
        return `
        <div class="pc-item rounded-xl border" data-plugin-id="${meta.id}">
            <div class="flex items-center gap-2 px-2.5 py-2">
                <button type="button" class="pc-expand flex items-center gap-2.5 min-w-0 flex-1 text-left" aria-expanded="false" title="點擊展開 / 收合設定">
                    <span class="pc-tile w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 transition">
                        <i class="${meta.icon} ${meta.iconClass || 'text-indigo-400'} text-[13px]"></i>
                    </span>
                    <span class="min-w-0 flex-1">
                        <span class="flex items-center gap-1.5">
                            <span class="text-xs font-medium text-slate-200 truncate">${esc(meta.name)}</span>
                            <span class="pc-dot w-1.5 h-1.5 rounded-full shrink-0"></span>
                        </span>
                        <span class="pc-desc block text-[10px] text-slate-500 truncate">${esc(meta.description)}</span>
                    </span>
                    <i class="pc-chevron fa-solid fa-chevron-down text-[9px] text-slate-600 shrink-0"></i>
                </button>
                <label class="relative inline-flex items-center cursor-pointer shrink-0" title="啟用 / 停用">
                    <input type="checkbox" class="pc-toggle sr-only peer" data-plugin-id="${meta.id}">
                    <span class="block w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition"></span>
                    <span class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-4 block"></span>
                    <span class="pc-spin absolute inset-0 hidden items-center justify-center"><i class="fa-solid fa-spinner fa-spin text-[9px] text-white"></i></span>
                </label>
            </div>
            <div class="pc-panel">
                <div>
                    <div class="px-3 pb-3">
                        <div class="pt-2 border-t border-slate-800/60 space-y-2">
                            <p class="text-[10px] text-slate-500 leading-relaxed">${esc(meta.description)}</p>
                            <div class="pc-err hidden rounded-lg bg-rose-950/30 border border-rose-500/30 px-2.5 py-2">
                                <div class="pc-err-text text-[10px] text-rose-300 leading-relaxed"></div>
                                <button type="button" class="pc-retry mt-1.5 text-[10px] text-rose-300 hover:text-white underline">重試啟用</button>
                            </div>
                            <div class="pc-hint hidden rounded-lg bg-slate-800/40 border border-slate-700/60 px-2.5 py-2 flex items-center justify-between gap-2">
                                <span class="text-[10px] text-slate-400">尚未啟用，開啟後即可使用</span>
                                <button type="button" class="pc-enable text-[10px] px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition">啟用</button>
                            </div>
                            <div class="pc-noui hidden text-[10px] text-slate-600 italic">此插件在背景執行，沒有額外設定介面。</div>
                            <div class="plugin-body" data-plugin-id="${meta.id}"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function buildUI() {
        const slot = document.getElementById('pluginSlot');
        if (!slot) { setTimeout(buildUI, 200); return; }
        if (uiBuilt) return;
        uiBuilt = true;
        injectStyles();

        uiRoot = document.createElement('div');
        uiRoot.id = 'pluginManagerCard';
        uiRoot.className = 'sidebar-card bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden';
        uiRoot.dataset.collapseKey = 'plugins';

        const total = Object.keys(REGISTRY).length;
        const rowsHtml = Object.values(REGISTRY).map(pluginRowHtml).join('');

        uiRoot.innerHTML = `
            <button type="button" class="sidebar-card-header w-full flex items-center justify-between gap-2 px-4 py-3 text-left" onclick="toggleSidebarCard('plugins')" aria-expanded="true">
                <span class="flex items-center gap-2 min-w-0">
                    <i class="fa-solid fa-puzzle-piece text-indigo-400 text-xs"></i>
                    <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">插件中心</span>
                </span>
                <span class="flex items-center gap-2 shrink-0">
                    <span class="pc-count text-xs text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-500/30">0 / ${total}</span>
                    <i class="fa-solid fa-chevron-down sidebar-card-chevron text-slate-500 text-[10px]"></i>
                </span>
            </button>
            <div class="sidebar-card-body">
                <div class="inner px-4">
                    <div class="relative mb-2">
                        <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500"></i>
                        <input type="text" class="pc-search w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-7 pr-7 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" placeholder="搜尋所有插件…">
                        <button type="button" class="pc-search-clear absolute right-1.5 top-1/2 -translate-y-1/2 hidden p-1 text-slate-500 hover:text-white" title="清除搜尋"><i class="fa-solid fa-xmark text-[10px]"></i></button>
                    </div>
                    <div class="flex items-center gap-1 mb-2 flex-wrap" role="group" aria-label="篩選插件">
                        <button type="button" class="pc-chip is-active inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium" data-filter="all">全部 <span class="pc-chip-count text-[9px] font-mono px-1.5 py-0.5 rounded-full" data-count="all">${total}</span></button>
                        <button type="button" class="pc-chip inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium" data-filter="on">已啟用 <span class="pc-chip-count text-[9px] font-mono px-1.5 py-0.5 rounded-full" data-count="on">0</span></button>
                        <button type="button" class="pc-chip inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium" data-filter="off">未啟用 <span class="pc-chip-count text-[9px] font-mono px-1.5 py-0.5 rounded-full" data-count="off">0</span></button>
                        <button type="button" class="pc-chip pc-chip-error hidden inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium" data-filter="error">
                            <i class="fa-solid fa-triangle-exclamation text-[9px]"></i>
                            <span>錯誤</span>
                            <span class="pc-chip-count text-[9px] font-mono px-1.5 py-0.5 rounded-full" data-count="error">0</span>
                        </button>
                    </div>
                    <div class="pc-scroll max-h-[46vh] overflow-y-auto pr-0.5">
                        <div class="pc-group" data-group="on">
                            <button type="button" class="pc-group-header w-full flex items-center gap-1.5 px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider">
                                <i class="pc-group-chevron fa-solid fa-chevron-down text-[8px]"></i>
                                <span>已啟用</span>
                                <span class="pc-group-count text-[9px] font-mono">0</span>
                            </button>
                            <div class="pc-group-body space-y-1.5 pb-2"></div>
                        </div>
                        <div class="pc-group" data-group="off">
                            <button type="button" class="pc-group-header w-full flex items-center gap-1.5 px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider">
                                <i class="pc-group-chevron fa-solid fa-chevron-down text-[8px]"></i>
                                <span>未啟用</span>
                                <span class="pc-group-count text-[9px] font-mono">0</span>
                            </button>
                            <div class="pc-group-body space-y-1.5 pb-2"></div>
                        </div>
                        <div class="pc-empty hidden text-center py-6"></div>
                    </div>
                </div>
            </div>`;
        slot.appendChild(uiRoot);

        refs.search      = uiRoot.querySelector('.pc-search');
        refs.clear       = uiRoot.querySelector('.pc-search-clear');
        refs.empty       = uiRoot.querySelector('.pc-empty');
        refs.count       = uiRoot.querySelector('.pc-count');
        refs.chips       = Array.from(uiRoot.querySelectorAll('.pc-chip'));
        refs.chipError   = uiRoot.querySelector('.pc-chip-error');
        refs.groupOn     = uiRoot.querySelector('.pc-group[data-group="on"]');
        refs.groupOff    = uiRoot.querySelector('.pc-group[data-group="off"]');
        refs.groupOnBody = refs.groupOn.querySelector('.pc-group-body');
        refs.groupOffBody= refs.groupOff.querySelector('.pc-group-body');
        refs.groupHeaders= Array.from(uiRoot.querySelectorAll('.pc-group-header'));
        refs.groupCounts = {
            on:  refs.groupOn.querySelector('.pc-group-count'),
            off: refs.groupOff.querySelector('.pc-group-count')
        };

        refs.groupOffBody.insertAdjacentHTML('beforeend', rowsHtml);

        Object.values(REGISTRY).forEach(meta => {
            const row = uiRoot.querySelector('.pc-item[data-plugin-id="' + meta.id + '"]');
            if (!row) return;
            rowRefs[meta.id] = {
                row,
                expand: row.querySelector('.pc-expand'),
                toggle: row.querySelector('.pc-toggle'),
                spin:   row.querySelector('.pc-spin'),
                desc:   row.querySelector('.pc-desc'),
                errBox: row.querySelector('.pc-err'),
                errText:row.querySelector('.pc-err-text'),
                retry:  row.querySelector('.pc-retry'),
                hint:   row.querySelector('.pc-hint'),
                enable: row.querySelector('.pc-enable'),
                noui:   row.querySelector('.pc-noui'),
                body:   row.querySelector('.plugin-body')
            };
            const r = rowRefs[meta.id];
            r.expand.addEventListener('click', () => {
                expandedId = (expandedId === meta.id) ? null : meta.id;
                persistExpanded();
                updateUI();
                if (expandedId === meta.id) {
                    setTimeout(() => { if (r.row.isConnected) r.row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 90);
                }
            });
            r.toggle.addEventListener('change', () => handleToggle(meta.id, r.toggle.checked));
            r.enable.addEventListener('click', () => handleToggle(meta.id, true));
            r.retry.addEventListener('click',  () => handleToggle(meta.id, true));
        });

        refs.chips.forEach(chip => chip.addEventListener('click', () => setFilter(chip.dataset.filter)));

        refs.groupHeaders.forEach(h => h.addEventListener('click', () => {
            const g = h.closest('.pc-group').dataset.group;
            collapsedGroups[g] = !collapsedGroups[g];
            persistGroups();
            updateGroups();
        }));

        refs.search.addEventListener('input', () => { query = refs.search.value || ''; updateUI(); });
        refs.clear.addEventListener('click', () => {
            query = ''; refs.search.value = ''; updateUI(); refs.search.focus();
        });
        refs.empty.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-empty-act]');
            if (!btn) return;
            if (btn.dataset.emptyAct === 'clear') {
                query = ''; refs.search.value = ''; updateUI(); refs.search.focus();
            } else if (btn.dataset.emptyAct === 'show-all') {
                setFilter('all');
            }
        });

        if (typeof window.MP3SetupSidebarCards === 'function') {
            try { window.MP3SetupSidebarCards(); } catch (e) {}
        }
        updateGroups();
        updateUI();
    }

    function matches(meta) {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (meta.name + ' ' + meta.description + ' ' + meta.id + ' ' + (meta.globalVar || '')).toLowerCase().indexOf(q) !== -1;
    }

    function setFilter(f) {
        if (f !== 'all' && f !== 'on' && f !== 'off' && f !== 'error') return;
        if (filterMode === f) return;
        filterMode = f;
        persistFilter();
        if (expandedId) {
            const isEn = enabled.has(expandedId);
            if ((f === 'on' && !isEn) || (f === 'off' && isEn) || (f === 'error' && !errorMap[expandedId])) {
                expandedId = null;
                persistExpanded();
            }
        }
        updateUI();
    }

    function updateGroups() {
        if (!refs.groupOn || !refs.groupOff) return;
        ['on', 'off'].forEach(g => {
            const el = g === 'on' ? refs.groupOn : refs.groupOff;
            el.classList.toggle('is-collapsed', collapsedGroups[g]);
        });
        if (refs.groupCounts) {
            refs.groupCounts.on.textContent  = String(enabled.size);
            refs.groupCounts.off.textContent = String(Object.keys(REGISTRY).length - enabled.size);
        }
    }

    function switchTab(tab) {
        setFilter(tab === 'on' ? 'on' : tab === 'off' ? 'off' : 'all');
    }

    function updateRow(id) {
        const r = rowRefs[id];
        const meta = REGISTRY[id];
        if (!r || !meta) return false;

        const isEn   = enabled.has(id);
        const isBusy = !!busyMap[id];
        const err    = errorMap[id] || '';

        let inFilter;
        switch (filterMode) {
            case 'on':    inFilter = isEn;   break;
            case 'off':   inFilter = !isEn;  break;
            case 'error': inFilter = !!err;  break;
            default:      inFilter = true;
        }
        const visible = inFilter && matches(meta);

        r.row.classList.toggle('is-enabled', isEn);
        r.row.classList.toggle('is-busy', isBusy);
        r.row.classList.toggle('has-error', !!err);
        r.row.classList.toggle('is-open', expandedId === id);
        r.row.classList.toggle('hidden', !visible);

        const targetBody = isEn ? refs.groupOnBody : refs.groupOffBody;
        if (targetBody && r.row.parentElement !== targetBody) targetBody.appendChild(r.row);

        r.expand.setAttribute('aria-expanded', String(expandedId === id));
        r.toggle.checked = isEn;
        r.toggle.disabled = isBusy;
        r.spin.classList.toggle('hidden', !isBusy);
        r.spin.classList.toggle('flex', isBusy);
        r.desc.textContent = err ? '⚠ ' + err : meta.description;
        r.desc.classList.toggle('text-rose-400', !!err);
        r.desc.classList.toggle('text-slate-500', !err);
        r.errBox.classList.toggle('hidden', !err);
        r.errText.textContent = err;
        r.hint.classList.toggle('hidden', isEn || isBusy);
        const hasUi = r.body.children.length > 0 || r.body.textContent.trim().length > 0;
        r.noui.classList.toggle('hidden', !isEn || hasUi || isBusy);

        return visible;
    }

    function renderEmpty(visibleCount) {
        if (!refs.empty) return;
        if (visibleCount > 0) {
            refs.empty.classList.add('hidden');
            refs.empty.innerHTML = '';
            return;
        }
        refs.empty.classList.remove('hidden');

        if (query.trim()) {
            refs.empty.innerHTML = `
                <i class="fa-solid fa-magnifying-glass text-slate-700 text-lg mb-2 block"></i>
                <div class="text-[11px] text-slate-500">沒有符合的插件</div>
                <button type="button" data-empty-act="clear" class="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 underline">清除搜尋</button>`;
        } else if (filterMode === 'error') {
            refs.empty.innerHTML = `
                <i class="fa-solid fa-circle-check text-emerald-600/70 text-lg mb-2 block"></i>
                <div class="text-[11px] text-slate-500">目前沒有錯誤</div>
                <button type="button" data-empty-act="show-all" class="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 underline">顯示全部插件</button>`;
        } else if (filterMode === 'on') {
            refs.empty.innerHTML = `
                <i class="fa-solid fa-plug-circle-xmark text-slate-700 text-lg mb-2 block"></i>
                <div class="text-[11px] text-slate-500">尚未啟用任何插件</div>
                <button type="button" data-empty-act="show-all" class="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 underline">顯示全部插件</button>`;
        } else if (filterMode === 'off') {
            refs.empty.innerHTML = `
                <i class="fa-solid fa-circle-check text-slate-700 text-lg mb-2 block"></i>
                <div class="text-[11px] text-slate-500">所有插件皆已啟用</div>`;
        }
    }

    function updateUI() {
        if (!uiBuilt) return;
        const total    = Object.keys(REGISTRY).length;
        const onCount  = enabled.size;
        const offCount = total - onCount;
        const errCount = Object.keys(errorMap).length;

        refs.count.textContent = onCount + ' / ' + total;

        const setCount = (k, v) => {
            const el = uiRoot.querySelector('.pc-chip [data-count="' + k + '"]');
            if (el) el.textContent = String(v);
        };
        setCount('all', total); setCount('on', onCount); setCount('off', offCount); setCount('error', errCount);
        if (refs.chipError) refs.chipError.classList.toggle('hidden', errCount === 0);
        refs.chips.forEach(c => c.classList.toggle('is-active', c.dataset.filter === filterMode));

        let visOn = 0, visOff = 0;
        Object.keys(REGISTRY).forEach(id => {
            if (updateRow(id)) { enabled.has(id) ? visOn++ : visOff++; }
        });
        refs.groupOn.classList.toggle('hidden',  visOn  === 0);
        refs.groupOff.classList.toggle('hidden', visOff === 0);

        refs.clear.classList.toggle('hidden', !query);
        renderEmpty(visOn + visOff);
        updateGroups();
    }

    function expandPlugin(id) {
        if (!REGISTRY[id]) return;
        const isEn = enabled.has(id);

        if ((filterMode === 'on'  && !isEn) ||
            (filterMode === 'off' &&  isEn) ||
            (filterMode === 'error' && !errorMap[id])) {
            filterMode = 'all';
            persistFilter();
        }
        if (query && !matches(REGISTRY[id])) {
            query = '';
            if (refs.search) refs.search.value = '';
        }
        const g = isEn ? 'on' : 'off';
        if (collapsedGroups[g]) {
            collapsedGroups[g] = false;
            persistGroups();
            updateGroups();
        }

        expandedId = id;
        persistExpanded();
        updateUI();

        setTimeout(() => {
            const r = rowRefs[id];
            if (r && r.row.isConnected) r.row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 90);
    }

    async function handleToggle(id, on) {
        if (busyMap[id]) return;
        busyMap[id] = true;
        delete errorMap[id];
        updateUI();
        try {
            if (on) {
                await enablePlugin(id);
                expandPlugin(id);
            } else {
                await disablePlugin(id);
                if (expandedId === id) { expandedId = null; persistExpanded(); }
            }
        } catch (err) {
            errorMap[id] = (err && err.message) ? err.message : '操作失敗';
            expandPlugin(id);
        } finally {
            busyMap[id] = false;
            updateUI();
            setTimeout(updateUI, 350);
            try {
                if (typeof window.refreshSourceFilterOptions === 'function') window.refreshSourceFilterOptions();
                if (typeof window.renderTable === 'function') window.renderTable();
            } catch (e) {}
        }
    }

    async function restoreAll() {
        const rank = id => id === 'multiUser' ? 0 : id === 'local' ? 1 : 2;
        const order = Object.keys(REGISTRY).sort((a, b) => rank(a) - rank(b));
        const run = async (id) => {
            if (!enabled.has(id)) return;
            busyMap[id] = true;
            updateUI();
            try { await enablePlugin(id); }
            catch (e) { errorMap[id] = (e && e.message) ? e.message : '恢復失敗'; console.error('[PluginCenter] ' + id + ' 恢復失敗:', e); }
            finally { busyMap[id] = false; updateUI(); }
        };
        if (enabled.has('multiUser')) await run('multiUser');
        const rest = order.filter(id => id !== 'multiUser' && enabled.has(id));
        await Promise.allSettled(rest.map(run));
        persist();
        updateUI();
    }

    // ==================== 對外 API ====================
    window.MP3PluginManager = {
        REGISTRY,
        enable: enablePlugin,
        disable: disablePlugin,
        isEnabled: (id) => enabled.has(id),
        isLoaded: (id) => !!loadedPlugins[id],
        getBodyContainer,
        refreshUI: updateUI,
        expandPlugin,
        setFilter,
        getFilter: () => filterMode
    };

    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(async () => {
            buildUI();
            await restoreAll();
            try { if (typeof window.refreshSourceFilterOptions === 'function') window.refreshSourceFilterOptions(); } catch (e) {}
        }, 400);
    });
})();
