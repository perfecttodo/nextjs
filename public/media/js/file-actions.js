/**
 * file-actions.js
 * 职责：针对单个文件的操作 —— 删除、修改分类、清理元数据、外部来源删除确认
 * 依赖：MP3Utils、MP3State、MP3Modal（window.showCustomModal）
 * 依赖运行时：window.MP3Table.renderTable、window.MP3Player、window.MP3DataSourceHandlers
 * 导出：window.MP3FileActions + 兼容旧版 window.deleteSong / changeCategory / cleanupFileMetadata
 */
(function () {
    'use strict';

    const U = window.MP3Utils;
    const S = window.MP3State;

    if (!U || !S) {
        console.error('[file-actions.js] 缺少 MP3Utils 或 MP3State，请检查脚本加载顺序');
        return;
    }

    /* ============================================================
     * 一、清理本地元数据（喜欢 / 隐藏 / 标签）
     * ============================================================ */
    function cleanupFileMetadata(uniqueKey) {
        const likedMap = U.storage.getLikedMap();
        if (likedMap[uniqueKey]) { delete likedMap[uniqueKey]; U.storage.saveLikedMap(likedMap); }
        const dislikedMap = U.storage.getDislikedMap();
        if (dislikedMap[uniqueKey]) { delete dislikedMap[uniqueKey]; U.storage.saveDislikedMap(dislikedMap); }
        const tagsMap = U.storage.getTagsMap();
        if (tagsMap[uniqueKey]) { delete tagsMap[uniqueKey]; U.storage.saveTagsMap(tagsMap); }
    }

    /* ============================================================
     * 二、修改文件分类（仅本地来源）
     * ============================================================ */
    async function changeCategory(encodedKey, newCategory) {
        const uniqueKey = U.safeDecodeURI(encodedKey);
        const file = S.allFiles.find(f => U.getFileKey(f) === uniqueKey);
        if (!file) return;
        const { apiBase, dir, originalKey } = S.getFileRequestParams(file);
        try {
            const res = await fetch(apiBase, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dir, filename: originalKey, newCategory })
            });
            const data = await res.json();
            if (data.success) window.loadFiles(false);
            else window.showCustomModal({ title: '修改失敗', message: data.error, type: 'error' });
        } catch (e) {
            window.showCustomModal({ title: '連線錯誤', message: e.message, type: 'error' });
        }
    }

    /* ============================================================
     * 三、外部来源删除确认（自定义弹窗，支持「不再提示」）
     * ============================================================ */
    const EXTERNAL_SOURCE_INFO = {
        gdrive:    { name: 'Google Drive', icon: 'fa-brands fa-google-drive', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        news:      { name: 'News',         icon: 'fa-solid fa-newspaper',      color: 'text-amber-400',  bg: 'bg-amber-500/20' },
        filesystem:{ name: '本機檔案',      icon: 'fa-solid fa-hard-drive',     color: 'text-cyan-400',   bg: 'bg-cyan-500/20' },
        urlmedia:  { name: '連結媒體清單',  icon: 'fa-solid fa-link',           color: 'text-fuchsia-400',bg: 'bg-fuchsia-500/20' },
    };

    function confirmExternalDelete(file, source) {
        const info = EXTERNAL_SOURCE_INFO[source] || { name: source, icon: 'fa-solid fa-cloud', color: 'text-indigo-400', bg: 'bg-indigo-500/20' };
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4';
            overlay.innerHTML = `
                <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
                    <div class="flex items-start gap-3 mb-4">
                        <div class="w-10 h-10 rounded-xl ${info.bg} ${info.color} flex items-center justify-center shrink-0">
                            <i class="${info.icon} text-base"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="text-sm font-bold text-slate-100 mb-1">从 ${U.escapeHtmlAttr(info.name)} 删除</h3>
                            <p class="text-[11px] text-slate-400 leading-relaxed">将从你的 ${U.escapeHtmlAttr(info.name)} 账户中永久删除此文件。</p>
                        </div>
                    </div>
                    <div class="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 mb-4">
                        <div class="text-xs text-slate-200 truncate" title="${U.escapeHtmlAttr(file.displayName || file.filename)}">
                            <i class="fa-solid fa-music text-indigo-400 mr-1.5"></i>${U.escapeHtmlAttr(file.displayName || file.filename)}
                        </div>
                        ${file.size ? `<div class="text-[10px] text-slate-500 mt-0.5 pl-5">${U.formatBytesShort(file.size)}</div>` : ''}
                    </div>
                    <p class="text-[11px] text-rose-400 mb-4 flex items-center gap-1"><i class="fa-solid fa-triangle-exclamation"></i>此操作无法撤销。</p>
                    <label class="flex items-center gap-2 mb-4 cursor-pointer text-[11px] text-slate-400 hover:text-slate-300 select-none">
                        <input type="checkbox" class="skip-checkbox w-3.5 h-3.5 accent-indigo-500">
                        <span>下次从 ${U.escapeHtmlAttr(info.name)} 删除时不再提示</span>
                    </label>
                    <div class="flex items-center justify-end gap-2">
                        <button data-action="cancel" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition">取消</button>
                        <button data-action="delete" class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-medium transition shadow-sm">
                            <i class="fa-solid fa-trash-can mr-1"></i>确认删除
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            const checkbox = overlay.querySelector('.skip-checkbox');
            overlay.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    if (action === 'delete' && checkbox.checked) {
                        try {
                            const skipMap = JSON.parse(localStorage.getItem('mp3_skip_delete_prompt') || '{}');
                            skipMap[source] = true;
                            localStorage.setItem('mp3_skip_delete_prompt', JSON.stringify(skipMap));
                        } catch (e) {}
                    }
                    overlay.remove();
                    resolve(action === 'delete');
                });
            });
        });
    }

    /* ============================================================
     * 四、删除文件（统一入口）
     * ============================================================ */
    async function deleteSong(encodedKey) {
        const uniqueKey = U.safeDecodeURI(encodedKey);
        const file = S.allFiles.find(f => U.getFileKey(f) === uniqueKey);
        if (!file) return;
        const src = file._source || 'local';

        // 4.1 外部来源：委托给数据源适配器
        if (src !== 'local'
            && window.MP3DataSourceHandlers
            && window.MP3DataSourceHandlers[src]
            && typeof window.MP3DataSourceHandlers[src].delete === 'function') {

            let skipMap = {};
            try { skipMap = JSON.parse(localStorage.getItem('mp3_skip_delete_prompt') || '{}'); } catch (e) {}
            if (!skipMap[src]) {
                const confirmed = await confirmExternalDelete(file, src);
                if (!confirmed) return;
            }
            try {
                await window.MP3DataSourceHandlers[src].delete(file);
            } catch (e) {
                window.showCustomModal({ title: '刪除失敗', message: e.message || '未知错误', type: 'error' });
            }
            return;
        }

        // 4.2 本地来源：走 API DELETE
        const confirmed = await window.showCustomModal({
            title: '刪除檔案確認',
            subtitle: '此操作無法復原',
            message: '確定要從硬碟中刪除這個媒體檔案嗎？',
            type: 'danger',
            confirmText: '確認刪除'
        });
        if (!confirmed) return;

        const { apiBase, dir, originalKey } = S.getFileRequestParams(file);
        try {
            const res = await fetch(`${apiBase}?dir=${encodeURIComponent(dir)}&filename=${encodeURIComponent(originalKey)}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                if (S.currentPlayingFile === uniqueKey) {
                    const audioPlayer = document.getElementById('audioPlayer');
                    if (audioPlayer) audioPlayer.pause();
                    S.currentPlayingFile = null;
                    localStorage.removeItem('mp3_last_played_key');
                    sessionStorage.removeItem('mp3_last_played_time');
                    if (window.MP3Categories) {
                        window.MP3Categories.updatePlayerLikeState();
                        window.MP3Categories.updatePlayerDislikeState();
                    }
                    if (window.MP3MediaSession) window.MP3MediaSession.resetMediaSession();
                }
                cleanupFileMetadata(uniqueKey);
                window.loadFiles(false);
            } else {
                window.showCustomModal({ title: '刪除失敗', message: data.error, type: 'error' });
            }
        } catch (e) {
            window.showCustomModal({ title: '連線錯誤', message: e.message, type: 'error' });
        }
    }

    /* ============================================================
     * 五、对外导出
     * ============================================================ */
    window.MP3FileActions = {
        cleanupFileMetadata,
        changeCategory,
        confirmExternalDelete,
        deleteSong
    };

    /* 兼容既有 HTML onclick / 插件直接调用 */
    window.cleanupFileMetadata = cleanupFileMetadata;
    window.changeCategory = changeCategory;
    window.deleteSong = deleteSong;

    console.log('[MP3FileActions] ready');
})();