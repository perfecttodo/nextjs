/**
 * 多用户插件 v1.3
 * - init 顺序：initStorage → injectUI → hookCoreFunctions（UI 成功后才 hook）
 * - badge 用 getFileKey，兼容本地多源的 _key
 * - Like 时间只显示日期
 */
(function () {
    'use strict';

    const STORAGE_KEYS = {
        USERS: 'mp3_plugin_users_list',
        CURRENT_USER: 'mp3_plugin_current_user',
        DEFAULT_USER_NAME: '預設用戶'
    };

    let usersList = [STORAGE_KEYS.DEFAULT_USER_NAME];
    let currentUser = STORAGE_KEYS.DEFAULT_USER_NAME;
    let uiRoot = null;

    let originalGetLikedMap = null;
    let originalSaveLikedMap = null;
    let originalRenderTable = null;

    function encodeInlineArgLocal(s) {
        if (typeof window.encodeInlineArg === 'function') return window.encodeInlineArg(s);
        return encodeURIComponent(String(s == null ? '' : s)).replace(/'/g, '%27');
    }
    function escapeAttr(s) {
        if (typeof window.escapeHtmlAttr === 'function') return window.escapeHtmlAttr(s);
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function formatDate(ts) {
        if (typeof window.formatLikedAtDate === 'function') return window.formatLikedAtDate(ts);
        if (!ts) return '';
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function initStorage() {
        const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        if (savedUsers) { try { usersList = JSON.parse(savedUsers); } catch (e) {} }
        else localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));

        if (!usersList.includes(STORAGE_KEYS.DEFAULT_USER_NAME)) usersList.unshift(STORAGE_KEYS.DEFAULT_USER_NAME);

        const lastUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (lastUser && usersList.includes(lastUser)) currentUser = lastUser;
        else {
            currentUser = STORAGE_KEYS.DEFAULT_USER_NAME;
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
        }
    }

    function getStorageKeyForUser(username) {
        if (username === STORAGE_KEYS.DEFAULT_USER_NAME) return 'mp3_liked_map';
        return `mp3_${username}_liked_map`;
    }
    function getUserLikesMap(username) {
        try { return JSON.parse(localStorage.getItem(getStorageKeyForUser(username)) || '{}'); } catch (e) { return {}; }
    }
    function saveUserLikesMap(username, map) {
        localStorage.setItem(getStorageKeyForUser(username), JSON.stringify(map));
    }

    function hookCoreFunctions() {
        originalGetLikedMap = window.getLikedMap;
        originalSaveLikedMap = window.saveLikedMap;

        window.getLikedMap = function () { return getUserLikesMap(currentUser); };
        window.saveLikedMap = function (map) { saveUserLikesMap(currentUser, map); };

        originalRenderTable = window.renderTable;
        if (typeof originalRenderTable === 'function') {
            window.renderTable = function () {
                originalRenderTable.apply(this, arguments);
                decorateRowsWithLikesBadges();
            };
        }
    }

    function unhookCoreFunctions() {
        if (originalGetLikedMap) window.getLikedMap = originalGetLikedMap;
        if (originalSaveLikedMap) window.saveLikedMap = originalSaveLikedMap;
        if (originalRenderTable) window.renderTable = originalRenderTable;
        originalGetLikedMap = null;
        originalSaveLikedMap = null;
        originalRenderTable = null;
        document.querySelectorAll('.plugin-likes-badge').forEach(el => el.remove());
    }

    function decorateRowsWithLikesBadges() {
        try {
            const files = (window.MP3AppExtension && window.MP3AppExtension.allFiles) || [];
            if (files.length === 0) return;

            files.forEach(file => {
                const fileKey = (typeof window.getFileKey === 'function')
                    ? window.getFileKey(file)
                    : (file._key || file.relativePath || file.filename);
                const encodedKey = encodeInlineArgLocal(fileKey);
                const rowId = `row-${encodedKey.replace(/[%._-]/g, '_')}`;
                const row = document.getElementById(rowId);
                if (!row) return;

                const likedUsers = [];
                usersList.forEach(u => {
                    const map = getUserLikesMap(u);
                    if (map && map[fileKey]) {
                        let ts = null;
                        const v = map[fileKey];
                        if (typeof v === 'object' && typeof v.ts === 'number') ts = v.ts;
                        likedUsers.push({ name: u, ts });
                    }
                });

                const titleContainer = row.querySelector('.flex.items-center.space-x-2');
                if (!titleContainer) return;

                const oldBadge = titleContainer.querySelector('.plugin-likes-badge');
                if (oldBadge) oldBadge.remove();

                if (likedUsers.length > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'plugin-likes-badge text-[10px] text-rose-400 bg-rose-950/40 border border-rose-500/30 px-1.5 py-0.5 rounded ml-2';
                    const tooltip = likedUsers.map(x => x.ts ? `${x.name}（${formatDate(x.ts)}）` : x.name).join('\n');
                    badge.title = `按讚用戶：\n${tooltip}`;
                    badge.innerHTML = `<i class="fa-solid fa-heart mr-1"></i>${likedUsers.length}`;
                    titleContainer.appendChild(badge);
                }
            });
        } catch (e) {
            console.error('[multiUser] decorateRowsWithLikesBadges 失败:', e);
        }
    }

    function injectUI() {
        return new Promise((resolve) => {
            function tryInject() {
                const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
                    ? window.MP3PluginManager.getBodyContainer('multiUser') : null;
                if (!body) { setTimeout(tryInject, 300); return; }
                if (uiRoot) { resolve(); return; }

                uiRoot = document.createElement('div');
                uiRoot.className = 'space-y-1';
                uiRoot.innerHTML = `
                    <div class="flex items-center space-x-1.5">
                        <select class="plugin-user-select bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 font-medium flex-1 min-w-0"></select>
                        <button class="plugin-user-manage p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-700 rounded-lg text-xs transition shrink-0" title="管理用户">
                            <i class="fa-solid fa-gear"></i>
                        </button>
                        <button class="plugin-user-add p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs transition shrink-0" title="新增用户">
                            <i class="fa-solid fa-user-plus"></i>
                        </button>
                    </div>
                    <div class="flex items-center justify-between text-[10px] text-slate-500 gap-2">
                        <span class="plugin-user-likes-count truncate"></span>
                    </div>
                `;
                body.appendChild(uiRoot);

                uiRoot.querySelector('.plugin-user-select').addEventListener('change', (e) => switchUser(e.target.value));
                uiRoot.querySelector('.plugin-user-manage').addEventListener('click', openManageModal);
                uiRoot.querySelector('.plugin-user-add').addEventListener('click', promptAddUser);
                resolve();
            }
            tryInject();
        });
    }

    function refreshUI() {
        if (!uiRoot) return;
        const select = uiRoot.querySelector('.plugin-user-select');
        if (select) {
            select.innerHTML = usersList.map(u => {
                const safe = escapeAttr(u);
                return `<option value="${safe}" ${u === currentUser ? 'selected' : ''}>${safe}</option>`;
            }).join('');
        }
        const likesCount = uiRoot.querySelector('.plugin-user-likes-count');
        if (likesCount) {
            const likes = getUserLikesMap(currentUser);
            likesCount.innerText = `已收藏 ${Object.keys(likes).length} 首`;
        }
    }

    function switchUser(username) {
        if (!usersList.includes(username)) return;
        currentUser = username;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
        refreshUI();
        if (typeof window.loadFiles === 'function') window.loadFiles(false);
    }

    async function promptAddUser() {
        if (typeof window.showCustomModal !== 'function') return;
        const newName = await window.showCustomModal({
            title: '登記新用戶', message: '請輸入新用戶名稱（無需密碼）：',
            type: 'confirm', isPrompt: true, defaultValue: '', confirmText: '新增並切換'
        });
        if (!newName || !newName.trim()) return;
        const trimmed = newName.trim();
        if (trimmed === STORAGE_KEYS.DEFAULT_USER_NAME) { alert('「預設用戶」為系統保留名稱！'); return; }
        if (!usersList.includes(trimmed)) {
            usersList.push(trimmed);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
        }
        refreshUI();
        switchUser(trimmed);
    }

    function openManageModal() {
        let modal = document.getElementById('pluginUserManageModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'pluginUserManageModal';
            modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center';
            document.body.appendChild(modal);
        }

        const usersHtml = usersList.map(u => {
            const likes = getUserLikesMap(u);
            const likeCount = Object.keys(likes).length;
            const isCurrent = u === currentUser;
            const isDefault = u === STORAGE_KEYS.DEFAULT_USER_NAME;
            const safeU = escapeAttr(u);
            return `
                <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <div class="min-w-0 flex-1">
                        <div class="font-semibold text-sm text-slate-200 flex items-center flex-wrap gap-1">
                            <span class="truncate">${safeU}</span>
                            ${isCurrent ? '<span class="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full shrink-0">當前</span>' : ''}
                            ${isDefault ? '<span class="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full shrink-0">系統預設</span>' : ''}
                        </div>
                        <div class="text-xs text-slate-400 mt-0.5">已收藏 ${likeCount} 首歌</div>
                    </div>
                    <div class="flex items-center space-x-1.5 shrink-0 flex-wrap justify-end">
                        ${!isDefault ? `<button data-action="rename" data-user="${safeU}" class="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-xs transition">改名</button>` : ''}
                        <button data-action="export" data-user="${safeU}" class="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg text-xs transition">匯出</button>
                        <button data-action="merge" data-user="${safeU}" class="px-2.5 py-1 bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white rounded-lg text-xs transition">合併</button>
                        ${!isDefault && usersList.length > 1 ? `<button data-action="delete" data-user="${safeU}" class="px-2.5 py-1 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg text-xs transition">刪除</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85dvh]">
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <h3 class="text-base font-bold text-slate-100 flex items-center">
                        <i class="fa-solid fa-users-gear text-indigo-400 mr-2"></i> 用戶管理中心
                    </h3>
                    <button class="modal-close text-slate-400 hover:text-white text-sm"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="space-y-3 overflow-y-auto flex-1 pr-1 mb-4">${usersHtml}</div>
                <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button class="modal-import px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl transition">
                        <i class="fa-solid fa-file-import mr-1"></i> 匯入用戶資料
                    </button>
                    <button class="modal-close px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-xl transition">關閉</button>
                </div>
            </div>
        `;

        modal.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const a = btn.dataset.action, u = btn.dataset.user;
                if (a === 'rename') renameUser(u);
                else if (a === 'export') exportUser(u);
                else if (a === 'merge') mergeUserPrompt(u);
                else if (a === 'delete') deleteUser(u);
            });
        });
        modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => modal.remove()));
        modal.querySelector('.modal-import').addEventListener('click', importUserPrompt);
    }

    async function renameUser(oldName) {
        if (oldName === STORAGE_KEYS.DEFAULT_USER_NAME) return;
        const newName = prompt(`請輸入「${oldName}」的新名稱：`, oldName);
        if (!newName || !newName.trim() || newName.trim() === oldName) return;
        const trimmed = newName.trim();
        if (trimmed === STORAGE_KEYS.DEFAULT_USER_NAME || usersList.includes(trimmed)) {
            alert('此用戶名稱無效或已存在！'); return;
        }
        const oldKey = getStorageKeyForUser(oldName);
        const newKey = getStorageKeyForUser(trimmed);
        const data = localStorage.getItem(oldKey);
        if (data) { localStorage.setItem(newKey, data); localStorage.removeItem(oldKey); }
        usersList = usersList.map(u => u === oldName ? trimmed : u);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
        if (currentUser === oldName) {
            currentUser = trimmed;
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
        }
        refreshUI();
        openManageModal();
        if (typeof window.loadFiles === 'function') window.loadFiles(false);
    }

    async function deleteUser(username) {
        if (username === STORAGE_KEYS.DEFAULT_USER_NAME) { alert('「預設用戶」不能被刪除！'); return; }
        if (!confirm(`確定要刪除用戶「${username}」嗎？`)) return;
        usersList = usersList.filter(u => u !== username);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
        localStorage.removeItem(getStorageKeyForUser(username));
        if (currentUser === username) {
            currentUser = STORAGE_KEYS.DEFAULT_USER_NAME;
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
        }
        refreshUI();
        openManageModal();
        if (typeof window.loadFiles === 'function') window.loadFiles(false);
    }

    function exportUser(username) {
        const likes = getUserLikesMap(username);
        const userData = { username, likes };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `mp3_user_${username}_liked_map.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    function importUserPrompt() {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (!imported.username || !imported.likes) { alert('匯入失敗：檔案格式不正確！'); return; }
                    let targetUser = imported.username;
                    if (targetUser === STORAGE_KEYS.DEFAULT_USER_NAME || usersList.includes(targetUser)) {
                        targetUser = targetUser + '_import_' + Date.now().toString().slice(-4);
                    }
                    usersList.push(targetUser);
                    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
                    saveUserLikesMap(targetUser, imported.likes);
                    refreshUI();
                    openManageModal();
                    alert(`成功匯入用戶「${targetUser}」！`);
                    if (typeof window.loadFiles === 'function') window.loadFiles(false);
                } catch (err) { alert('解析 JSON 檔案失敗！'); }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function mergeUserPrompt(sourceUser) {
        const otherUsers = usersList.filter(u => u !== sourceUser);
        if (otherUsers.length === 0) { alert('沒有其他用戶可供合併！'); return; }
        const targetUser = prompt(`請選擇要將「${sourceUser}」的 Like 記錄合併到哪一個用戶？\n現有其他用戶：${otherUsers.join(', ')}`);
        if (!targetUser || !otherUsers.includes(targetUser.trim())) {
            if (targetUser) alert('輸入的目標用戶不存在！'); return;
        }
        const target = targetUser.trim();
        if (!confirm(`確定要將「${sourceUser}」的所有 Like 合併到「${target}」嗎？`)) return;

        const sourceLikes = getUserLikesMap(sourceUser);
        const targetLikes = getUserLikesMap(target);
        Object.keys(sourceLikes).forEach(k => {
            if (!targetLikes[k]) targetLikes[k] = sourceLikes[k];
        });
        saveUserLikesMap(target, targetLikes);
        localStorage.removeItem(getStorageKeyForUser(sourceUser));

        usersList = usersList.filter(u => u !== sourceUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
        if (currentUser === sourceUser) {
            currentUser = target;
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
        }
        refreshUI();
        openManageModal();
        alert(`成功合併至 「${target}」！`);
        if (typeof window.loadFiles === 'function') window.loadFiles(false);
    }

    window.MP3MultiUserPlugin = {
        version: '1.3.0',
        async init() {
            initStorage();
            await injectUI();          // 先完成 UI
            hookCoreFunctions();       // UI 成功后再 hook
            refreshUI();
            setTimeout(() => {
                if (typeof window.renderTable === 'function') {
                    try { window.renderTable(); } catch (e) {}
                }
            }, 100);
        },
        async unload() {
            if (currentUser !== STORAGE_KEYS.DEFAULT_USER_NAME) {
                currentUser = STORAGE_KEYS.DEFAULT_USER_NAME;
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
            }
            const modal = document.getElementById('pluginUserManageModal');
            if (modal) modal.remove();
            unhookCoreFunctions();
            if (uiRoot) { uiRoot.remove(); uiRoot = null; }
            if (typeof window.loadFiles === 'function') {
                window.loadFiles(false);
            } else if (typeof window.renderTable === 'function') {
                window.renderTable();
            }
        }
    };
})();