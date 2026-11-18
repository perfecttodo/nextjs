(function () {
    'use strict';
    const U = window.MP3Utils;
    const S = window.MP3State;

    function scrollToCurrentSongInTable(retries = 20) {
        if (!S.currentPlayingFile) return;
        const container = document.getElementById('tableContainer');
        if (!container) return;
        const rowId = `row-${U.encodeInlineArg(S.currentPlayingFile).replace(/[%._-]/g, '_')}`;
        const row = document.getElementById(rowId);
        if (!row || row.offsetHeight === 0) {
            if (retries > 0) setTimeout(() => scrollToCurrentSongInTable(retries - 1), 40);
            return;
        }
        try {
            row.scrollIntoView({ block: 'center', behavior: 'auto', inline: 'nearest' });
        } catch (e) {
            const cr = container.getBoundingClientRect();
            const rr = row.getBoundingClientRect();
            container.style.scrollBehavior = 'auto';
            container.scrollTop += (rr.top - cr.top) + rr.height / 2 - cr.height / 2;
        }
        requestAnimationFrame(() => {
            if (!row.isConnected) return;
            const rowStill = document.getElementById(rowId);
            if (!rowStill) return;
            const cr = container.getBoundingClientRect();
            const rr = rowStill.getBoundingClientRect();
            const header = container.querySelector('thead');
            const hh = (header && header.offsetHeight > 0) ? header.offsetHeight : 0;
            const vh = cr.height - hh;
            const rc = (rr.top - cr.top) + rr.height / 2;
            const tc = hh + vh / 2;
            const delta = rc - tc;
            if (Math.abs(delta) > 2) {
                container.style.scrollBehavior = 'auto';
                container.scrollTop += delta;
            }
        });
    }

    function isFileDeletable(file) {
        if (!file) return false;
        const src = file._source || 'local';
        const meta = window.MP3GetSourceMeta(src);
        if (!meta.deletable) return false;
        if (meta.isLocal) return true;
        return !!(window.MP3DataSourceHandlers
            && window.MP3DataSourceHandlers[src]
            && typeof window.MP3DataSourceHandlers[src].delete === 'function');
    }

    function renderTable() {
        try { renderTableInner(); }
        catch (err) {
            console.error('[renderTable] 渲染失败:', err);
            const tbody = document.getElementById('fileTableBody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="text-center py-12 text-rose-400"><i class="fa-solid fa-triangle-exclamation text-3xl mb-2 block"></i>渲染失败：${U.escapeHtmlAttr(err.message || '未知错误')}</td></tr>`;
        }
    }

    function renderTableInner() {
        const tbody = document.getElementById('fileTableBody');
        let filtered = window.MP3SearchFilter.getFilteredFiles();
        document.getElementById('fileCountText').innerText = `共 ${filtered.length} 筆`;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-12 text-slate-500"><i class="fa-solid fa-photo-film text-3xl mb-2 block"></i>沒有找到符合的媒體檔案</td></tr>`;
            document.getElementById('paginationContainer').innerHTML = '';
            document.getElementById('topPageIndicator').innerText = `1 / 1`;
            document.getElementById('topPrevBtn').disabled = true;
            document.getElementById('topNextBtn').disabled = true;
            S.pendingScrollToCurrentSong = false;
            if (typeof window.refreshSourceFilterOptions === 'function') window.refreshSourceFilterOptions();
            if (window.MP3NewsPlugin && typeof window.MP3NewsPlugin.maybeAutoLoad === 'function') window.MP3NewsPlugin.maybeAutoLoad();
            return;
        }

        const totalPages = Math.ceil(filtered.length / S.pageSize);
        if (S.currentPage > totalPages) S.currentPage = totalPages;
        if (S.currentPage < 1) S.currentPage = 1;
        const startIdx = (S.currentPage - 1) * S.pageSize;
        const pageItems = filtered.slice(startIdx, startIdx + S.pageSize);

        const audioPlayer = document.getElementById('audioPlayer');
        let html = '';
        pageItems.forEach(file => {
            try {
                const uniqueKey = U.getFileKey(file);
                const isPlaying = S.currentPlayingFile === uniqueKey;
                const isLoadingRow = isPlaying && (S.playbackLoadingKey === uniqueKey);
                const sizeMb = file.size ? ((file.size / (1024 * 1024)).toFixed(1) + ' MB') : '';
                const catOptions = S.categories.map(c => {
                    const safe = U.escapeHtmlAttr(c);
                    return `<option value="${safe}" ${c === file.category ? 'selected' : ''}>${safe}</option>`;
                }).join('');
                const tagsHtml = (file.tags || []).map(t => `<span class="bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded text-[10px]">#${U.escapeHtmlAttr(t)}</span>`).join(' ');
                const encodedKey = U.encodeInlineArg(uniqueKey);
                const encodedName = U.encodeInlineArg(file.displayName || file.filename || '');
                const rowId = `row-${encodedKey.replace(/[%._-]/g, '_')}`;
                const meta = window.MP3GetSourceMeta(file);
                const isExternal = meta.external;
                const deletable = isFileDeletable(file);
                const likeTitle = file.isLiked
                    ? (file.likedAt ? `取消最愛（收藏于 ${U.formatLikedAtDate(file.likedAt)}）` : '取消最愛')
                    : '加入最愛';
                const likedAtLine = (S.currentCategory === '我的最愛' && file.likedAt && window.mp3_showLikedDate)
                    ? `<div class="text-[10px] text-rose-400/80 mt-0.5 flex items-center gap-1"><i class="fa-solid fa-clock text-[9px]"></i><span>收藏于 ${U.formatLikedAtDate(file.likedAt)}</span></div>`
                    : '';
                const rowClass = isPlaying ? 'playing-row bg-indigo-950/30 border-l-4 border-indigo-500' : 'hover:bg-slate-900/50';
                const deleteTitle = !deletable ? '此來源不支援刪除' : (isExternal ? `從 ${file._source} 刪除` : '刪除檔案');
                const playBtnTitle = isLoadingRow ? '載入中…' : ((isPlaying && !audioPlayer.paused) ? '暫停' : '播放');
                const playBtnIcon = isLoadingRow ? 'fa-spinner fa-spin' : (isPlaying && !audioPlayer.paused ? 'fa-pause' : 'fa-play');

                html += `
                    <tr id="${rowId}" class="${rowClass} transition">
                        <td class="py-3 px-4 md:px-6" colspan="4">
                            <div class="flex flex-col md:flex-row md:items-center gap-3">
                                <div class="flex items-center space-x-3 flex-1 min-w-0">
                                    <button onclick="togglePlaySong('${encodedKey}', '${encodedName}')" title="${playBtnTitle}" class="w-9 h-9 rounded-lg ${isPlaying ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white'} flex items-center justify-center transition shadow flex-shrink-0">
                                        <i class="fa-solid ${playBtnIcon} text-xs"></i>
                                    </button>
                                    <div class="overflow-hidden flex-1 min-w-0">
                                        <div class="flex items-center space-x-2">
                                            ${typeof window.MP3RenderSourceBadge === 'function' ? window.MP3RenderSourceBadge(file) : ''}
                                            <span class="font-medium text-slate-200 truncate" title="${U.escapeHtmlAttr(file.displayName)}">${U.escapeHtmlAttr(file.displayName)}</span>
                                            <button onclick="toggleLike('${encodedKey}', event)" class="text-xs transition ${file.isLiked ? 'text-rose-500 hover:text-rose-400' : 'text-slate-600 hover:text-slate-400'}" title="${U.escapeHtmlAttr(likeTitle)}">
                                                <i class="${file.isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
                                            </button>
                                        </div>
                                        ${file.relativePath && file.relativePath !== file.filename ? `<div class="text-[11px] text-slate-500 truncate">${U.escapeHtmlAttr(file.relativePath)}</div>` : ''}
                                        ${likedAtLine}
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center gap-2 md:w-44 md:flex-shrink-0 md:justify-end">
                                    <select onchange="changeCategory('${encodedKey}', this.value)" class="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 ${isExternal ? 'opacity-50 cursor-not-allowed' : ''}" ${isExternal ? 'disabled title="外部來源分類不可修改"' : ''}>
                                        ${catOptions}
                                    </select>
                                    ${tagsHtml}
                                    <button onclick="editSongTags('${encodedKey}', '${encodedName}')" class="text-[10px] text-slate-500 hover:text-indigo-400 px-1 border border-dashed border-slate-700 rounded ${isExternal ? 'opacity-30 cursor-not-allowed' : ''}" ${isExternal ? 'disabled' : ''}>+標籤</button>
                                </div>
                                <div class="hidden lg:block w-20 flex-shrink-0 text-xs text-slate-400 whitespace-nowrap">${sizeMb}</div>
                                <div class="flex items-center justify-end gap-1 md:w-20 flex-shrink-0">
                                    <button onclick="toggleFileDislike('${encodedKey}')" class="p-1.5 rounded-lg transition ${file.isDisliked ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-400'}" title="${file.isDisliked ? '取消隱藏' : '隱藏此媒體'}">
                                        <i class="${file.isDisliked ? 'fa-solid' : 'fa-regular'} fa-thumbs-down text-sm"></i>
                                    </button>
                                    <button onclick="deleteSong('${encodedKey}')" class="text-slate-500 hover:text-rose-400 p-1.5 transition ${deletable ? '' : 'opacity-30 cursor-not-allowed'}" ${deletable ? `title="${U.escapeHtmlAttr(deleteTitle)}"` : `disabled title="${U.escapeHtmlAttr(deleteTitle)}"`}>
                                        <i class="fa-solid fa-trash-can text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>`;
            } catch (err) {
                console.error('[renderTable] 单行渲染失败:', file, err);
                html += `<tr><td colspan="4" class="px-4 py-2 text-rose-400 text-xs">⚠️ 无法渲染：${U.escapeHtmlAttr(file?.filename || '未知文件')}</td></tr>`;
            }
        });
        tbody.innerHTML = html;
        renderPagination(totalPages, filtered.length);

        if (S.pendingScrollToCurrentSong && S.currentPlayingFile) {
            S.pendingScrollToCurrentSong = false;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => { scrollToCurrentSongInTable(); });
            });
        }

        if (typeof window.refreshSourceFilterOptions === 'function') window.refreshSourceFilterOptions();
        if (window.MP3NewsPlugin && typeof window.MP3NewsPlugin.maybeAutoLoad === 'function') window.MP3NewsPlugin.maybeAutoLoad();
    }

    function renderPagination(totalPages, totalItems) {
        const container = document.getElementById('paginationContainer');
        document.getElementById('topPageIndicator').innerText = `${S.currentPage} / ${totalPages}`;
        document.getElementById('topPrevBtn').disabled = (S.currentPage <= 1);
        document.getElementById('topNextBtn').disabled = (S.currentPage >= totalPages);
        container.innerHTML = `
            <span class="text-xs text-slate-400">顯示第 ${(S.currentPage - 1) * S.pageSize + 1} - ${Math.min(S.currentPage * S.pageSize, totalItems)} 筆，共 ${totalItems} 筆資料</span>
            <div class="flex items-center space-x-1.5">
                <button onclick="goToPage(1)" ${S.currentPage === 1 ? 'disabled class="px-2.5 py-1 bg-slate-900 text-slate-600 rounded-lg text-xs cursor-not-allowed"' : 'class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"'}>首頁</button>
                <button onclick="goToPage(window.MP3State.currentPage - 1)" ${S.currentPage === 1 ? 'disabled class="px-2.5 py-1 bg-slate-900 text-slate-600 rounded-lg text-xs cursor-not-allowed"' : 'class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"'}>上一頁</button>
                <span class="text-xs text-indigo-400 font-mono px-2">${S.currentPage} / ${totalPages}</span>
                <button onclick="goToPage(window.MP3State.currentPage + 1)" ${S.currentPage >= totalPages ? 'disabled class="px-2.5 py-1 bg-slate-900 text-slate-600 rounded-lg text-xs cursor-not-allowed"' : 'class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"'}>下一頁</button>
                <button onclick="goToPage(${totalPages})" ${S.currentPage >= totalPages ? 'disabled class="px-2.5 py-1 bg-slate-900 text-slate-600 rounded-lg text-xs cursor-not-allowed"' : 'class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"'}>末頁</button>
            </div>`;
    }

    window.MP3Table = { renderTable, renderTableInner, scrollToCurrentSongInTable, isFileDeletable };
    window.renderTable = renderTable;
})();