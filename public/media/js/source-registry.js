(function () {
    'use strict';
    const U = window.MP3Utils;

    window.MP3SourceRegistry = window.MP3SourceRegistry || {
        local: { label: '本地', icon: 'fa-solid fa-hard-drive', badgeClass: 'bg-slate-800/80 text-slate-300 border-slate-600/60', dotClass: 'bg-slate-400' },
        gdrive: { label: 'Drive', icon: 'fa-brands fa-google-drive', badgeClass: 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30', dotClass: 'bg-emerald-400' },
        news: { label: 'News', icon: 'fa-solid fa-newspaper', badgeClass: 'bg-amber-950/50 text-amber-300 border-amber-500/30', dotClass: 'bg-amber-400' },
        filesystem: { label: '本機', icon: 'fa-solid fa-hard-drive', badgeClass: 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30', dotClass: 'bg-cyan-400' },
        urlmedia: { label: '連結', icon: 'fa-solid fa-link', badgeClass: 'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-500/30', dotClass: 'bg-fuchsia-400' }
    };

    window.MP3GetSourceMeta = function (file) {
        const key = (file && file._source) || 'local';
        const meta = window.MP3SourceRegistry[key];
        if (meta) return Object.assign({ key }, meta);
        return { key, label: key, icon: 'fa-solid fa-cloud', badgeClass: 'bg-indigo-950/50 text-indigo-300 border-indigo-500/30', dotClass: 'bg-indigo-400' };
    };

    window.MP3RenderSourceBadge = function (file) {
        const meta = window.MP3GetSourceMeta(file);
        return `<span class="source-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium shrink-0 ${meta.badgeClass}" title="來源：${U.escapeHtmlAttr(meta.label)}"><i class="${meta.icon} text-[9px]"></i><span>${U.escapeHtmlAttr(meta.label)}</span></span>`;
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

    window.currentSourceFilter = 'all';

    window.refreshSourceFilterOptions = function () {
        const sel = document.getElementById('sourceFilter');
        if (!sel) return;
        const files = (window.MP3AppExtension && window.MP3AppExtension.allFiles) || [];
        const present = new Set();
        if (files.length === 0) present.add('local');
        else files.forEach(f => present.add(f._source || 'local'));
        while (sel.options.length > 1) sel.remove(1);
        const orderedKeys = Object.keys(window.MP3SourceRegistry || {});
        const presentArr = [...present].sort((a, b) => {
            const ia = orderedKeys.indexOf(a);
            const ib = orderedKeys.indexOf(b);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        presentArr.forEach(key => {
            const meta = window.MP3GetSourceMeta({ _source: key });
            const opt = document.createElement('option');
            opt.value = key; opt.textContent = meta.label;
            sel.appendChild(opt);
        });
        if (window.currentSourceFilter !== 'all' && !present.has(window.currentSourceFilter)) {
            window.currentSourceFilter = 'all';
            sel.value = 'all';
        } else sel.value = window.currentSourceFilter;
    };

    window.handleSourceFilterChange = function (value) {
        window.currentSourceFilter = value;
        window.MP3State.currentPage = 1;
        window.MP3Table.renderTable();
    };
})();