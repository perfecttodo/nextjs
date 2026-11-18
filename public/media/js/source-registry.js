/**
 * source-registry.js
 * 职责：唯一的数据来源元信息注册表 + 徽章渲染 + 来源过滤器
 * 对外：
 *   window.MP3SourceRegistry             注册表本体（可直接读写，但推荐用 registerSource）
 *   window.MP3RegisterSource(key, meta)  注册/覆盖一个来源
 *   window.MP3GetSourceMeta(fileOrKey)   取元信息（自动补默认值）
 *   window.MP3RenderSourceBadge(file)    表格行徽章 HTML
 *   window.MP3SetPlayerSourceBadge(file) 播放器徽章
 *   window.refreshSourceFilterOptions()  刷新 <select id="sourceFilter">
 *   window.handleSourceFilterChange(v)   来源过滤切换
 */
(function () {
    'use strict';

    const U = window.MP3Utils;
    if (!U) { console.error('[source-registry.js] 缺少 MP3Utils'); return; }

    /* ============================================================
     * 默认元信息（缺字段时自动补齐）
     * ============================================================ */
    const DEFAULT_META = {
        label: '',           // 未给则用 key
        name: '',            // 未给则用 label
        artist: '',          // 未给则用 name
        icon: 'fa-solid fa-cloud',
        badgeClass: 'bg-indigo-950/50 text-indigo-300 border-indigo-500/30',
        dotClass: 'bg-indigo-400',
        accent: { color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
        deletable: false,
        external: true,
        isLocal: false
    };

    /* ============================================================
     * 注册表（内置来源；插件可继续注册）
     * ============================================================ */
    window.MP3SourceRegistry = window.MP3SourceRegistry || {
        local: {
            label: '本地', name: '本地媒體', artist: '本地媒體',
            icon: 'fa-solid fa-hard-drive',
            badgeClass: 'bg-slate-800/80 text-slate-300 border-slate-600/60',
            dotClass: 'bg-slate-400',
            accent: { color: 'text-slate-300', bg: 'bg-slate-500/20' },
            deletable: true, external: false, isLocal: true
        },
        gdrive: {
            label: 'Drive', name: 'Google Drive', artist: 'Google Drive',
            icon: 'fa-brands fa-google-drive',
            badgeClass: 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30',
            dotClass: 'bg-emerald-400',
            accent: { color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
            deletable: true, external: true
        },
        news: {
            label: 'News', name: 'News', artist: 'News',
            icon: 'fa-solid fa-newspaper',
            badgeClass: 'bg-amber-950/50 text-amber-300 border-amber-500/30',
            dotClass: 'bg-amber-400',
            accent: { color: 'text-amber-400', bg: 'bg-amber-500/20' },
            deletable: true, external: true
        },
        filesystem: {
            label: '本機', name: '本機檔案', artist: '本機檔案',
            icon: 'fa-solid fa-hard-drive',
            badgeClass: 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30',
            dotClass: 'bg-cyan-400',
            accent: { color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
            deletable: true, external: true
        },
        urlmedia: {
            label: '連結', name: '連結媒體清單', artist: '連結媒體',
            icon: 'fa-solid fa-link',
            badgeClass: 'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-500/30',
            dotClass: 'bg-fuchsia-400',
            accent: { color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20' },
            deletable: true, external: true
        },
        pan123: {
            label: '123', name: '123 云盘', artist: '123 云盘',
            icon: 'fa-solid fa-cloud',
            badgeClass: 'bg-orange-950/50 text-orange-300 border-orange-500/30',
            dotClass: 'bg-orange-400',
            accent: { color: 'text-orange-400', bg: 'bg-orange-500/20' },
            deletable: true, external: true
        },
        onedrive: {
            label: 'OneDrive', name: 'OneDrive', artist: 'OneDrive',
            icon: 'fa-brands fa-microsoft',
            badgeClass: 'bg-sky-950/50 text-sky-300 border-sky-500/30',
            dotClass: 'bg-sky-400',
            accent: { color: 'text-sky-400', bg: 'bg-sky-500/20' },
            deletable: true, external: true
        }
    };

    /* ============================================================
     * 合并默认值的工具
     * ============================================================ */
    function normalize(key, raw) {
        raw = raw || {};
        const m = Object.assign({}, DEFAULT_META, raw, { key });
        // accent 单独合并，避免整体被替换
        m.accent = Object.assign({}, DEFAULT_META.accent, raw.accent || {});
        // 派生
        m.label = m.label || key;
        m.name = m.name || m.label;
        m.artist = m.artist || m.name;
        if (m.isLocal) { m.external = false; }
        return m;
    }

    /* ============================================================
     * 注册/覆盖来源（插件调用）
     * ============================================================ */
    window.MP3RegisterSource = function (key, meta) {
        if (!key) throw new Error('MP3RegisterSource: key 必填');
        window.MP3SourceRegistry[key] = normalize(key, meta);
        // 若来源过滤器已存在，刷新一次选项
        if (typeof window.refreshSourceFilterOptions === 'function') {
            try { window.refreshSourceFilterOptions(); } catch (e) {}
        }
        return window.MP3SourceRegistry[key];
    };

    // 初始化时把所有内置项规范化一遍
    Object.keys(window.MP3SourceRegistry).forEach(k => {
        window.MP3SourceRegistry[k] = normalize(k, window.MP3SourceRegistry[k]);
    });

    /* ============================================================
     * 取元信息（file 或 string 均可）
     * ============================================================ */
    window.MP3GetSourceMeta = function (fileOrKey) {
        const key = (typeof fileOrKey === 'string')
            ? fileOrKey
            : ((fileOrKey && fileOrKey._source) || 'local');
        const raw = window.MP3SourceRegistry[key];
        // 未注册的来源：动态生成一个"未知来源"，不抛错
        return raw ? Object.assign({}, raw, { key }) : normalize(key, { label: key });
    };

    /* ============================================================
     * 徽章渲染
     * ============================================================ */
    window.MP3RenderSourceBadge = function (file) {
        const meta = window.MP3GetSourceMeta(file);
        return `<span class="source-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium shrink-0 ${meta.badgeClass}" title="來源：${U.escapeHtmlAttr(meta.name)}"><i class="${meta.icon} text-[9px]"></i><span>${U.escapeHtmlAttr(meta.label)}</span></span>`;
    };

    window.MP3SetPlayerSourceBadge = function (file) {
        const el = document.getElementById('currentSongSourceBadge');
        if (!el) return;
        if (!file) { el.classList.add('hidden'); return; }
        const meta = window.MP3GetSourceMeta(file);
        el.className = `inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] font-medium shrink-0 ${meta.badgeClass}`;
        el.innerHTML = `<i class="${meta.icon} text-[9px]"></i>${U.escapeHtmlAttr(meta.label)}`;
        el.classList.remove('hidden');
    };

    /* ============================================================
     * 来源过滤器
     * ============================================================ */
    window.currentSourceFilter = 'all';

    window.refreshSourceFilterOptions = function () {
        const sel = document.getElementById('sourceFilter');
        if (!sel) return;
        const files = (window.MP3AppExtension && window.MP3AppExtension.allFiles) || [];
        const present = new Set();
        if (files.length === 0) present.add('local');
        else files.forEach(f => present.add(f._source || 'local'));

        // 清空除 "所有來源" 外的选项
        while (sel.options.length > 1) sel.remove(1);

        // 按注册表顺序优先，未注册的排后
        const orderedKeys = Object.keys(window.MP3SourceRegistry);
        const presentArr = [...present].sort((a, b) => {
            const ia = orderedKeys.indexOf(a);
            const ib = orderedKeys.indexOf(b);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });

        presentArr.forEach(key => {
            const meta = window.MP3GetSourceMeta(key);
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = meta.label;
            sel.appendChild(opt);
        });

        if (window.currentSourceFilter !== 'all' && !present.has(window.currentSourceFilter)) {
            window.currentSourceFilter = 'all';
            sel.value = 'all';
        } else {
            sel.value = window.currentSourceFilter;
        }
    };

    window.handleSourceFilterChange = function (value) {
        window.currentSourceFilter = value;
        window.MP3State.currentPage = 1;
        window.MP3Table.renderTable();
    };

    console.log('[MP3SourceRegistry] ready, sources:', Object.keys(window.MP3SourceRegistry).join(', '));
})();