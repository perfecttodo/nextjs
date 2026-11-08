/**
 * MP3 系統多用戶與單向 Like 插件 (優化版：預設用戶存放在 mp3_liked_map，其他用戶存放在 mp3_用戶名_liked_map)
 */
(function() {
    const STORAGE_KEYS = {
        USERS: 'mp3_plugin_users_list',
        CURRENT_USER: 'mp3_plugin_current_user',
        DEFAULT_USER_NAME: '預設用戶'
    };

    let usersList = ['預設用戶'];
    let currentUser = '預設用戶';

    function initPluginStorage() {
        const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        if (savedUsers) {
            try { usersList = JSON.parse(savedUsers); } catch(e) {}
        } else {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
        }

        const lastUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (lastUser && usersList.includes(lastUser)) {
            currentUser = lastUser;
        } else {
            currentUser = usersList[0];
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
        }
    }

    // 核心對應：根據用戶名稱動態回傳對應的 localStorage Key
    function getStorageKeyForUser(username) {
        if (username === STORAGE_KEYS.DEFAULT_USER_NAME) {
            return 'mp3_liked_map'; // 預設用戶維持原樣
        }
        return `mp3_${username}_liked_map`; // 其他用戶獨立儲存
    }

    // 取得指定用戶的 Likes 字典
    function getUserLikesMap(username) {
        const key = getStorageKeyForUser(username);
        try {
            return JSON.parse(localStorage.getItem(key) || '{}');
        } catch(e) { return {}; }
    }

    // 儲存指定用戶的 Likes 字典
    function saveUserLikesMap(username, map) {
        const key = getStorageKeyForUser(username);
        localStorage.setItem(key, JSON.stringify(map));
    }

    // 1. 動態注入 UI 到頂部導覽列
    function injectUserUI() {
        const headerFlex = document.querySelector('header');
        if (!headerFlex) return;

        const userToolbar = document.createElement('div');
        userToolbar.className = 'flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl shadow-inner';
        userToolbar.innerHTML = `
            <div class="flex items-center space-x-1.5 text-xs text-indigo-400">
                <i class="fa-solid fa-user-shield"></i>
                <span class="text-slate-300">用戶:</span>
            </div>
            <select id="pluginUserSelect" onchange="window.pluginSwitchUser(this.value)" class="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 font-medium">
                ${usersList.map(u => `<option value="${u}" ${u === currentUser ? 'selected' : ''}>${u}</option>`).join('')}
            </select>
            <button onclick="window.pluginOpenManageModal()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 px-2 py-1 rounded-lg text-xs transition" title="用戶管理 (改名/刪除/合併/遷移)">
                <i class="fa-solid fa-gear"></i>
            </button>
            <button onclick="window.pluginPromptAddUser()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg text-xs transition shadow" title="登記新用戶">
                <i class="fa-solid fa-user-plus mr-1"></i> 新增
            </button>
        `;

        headerFlex.appendChild(userToolbar);
    }

    window.pluginSwitchUser = function(username) {
        currentUser = username;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
        if (typeof window.loadFiles === 'function') {
            window.loadFiles(false);
        }
    };

    window.pluginPromptAddUser = async function() {
        if (typeof window.showCustomModal === 'function') {
            const newName = await window.showCustomModal({
                title: '登記新用戶',
                message: '請輸入新用戶名稱（無需密碼）：',
                type: 'confirm',
                isPrompt: true,
                defaultValue: '',
                confirmText: '新增並切換'
            });

            if (!newName || !newName.trim()) return;
            const trimmed = newName.trim();

            if (trimmed === STORAGE_KEYS.DEFAULT_USER_NAME) {
                alert('「預設用戶」為系統保留名稱！');
                return;
            }

            if (!usersList.includes(trimmed)) {
                usersList.push(trimmed);
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
            }
            
            refreshUserSelects();
            window.pluginSwitchUser(trimmed);
        }
    };

    function refreshUserSelects() {
        const selectEl = document.getElementById('pluginUserSelect');
        if (selectEl) {
            selectEl.innerHTML = usersList.map(u => `<option value="${u}" ${u === currentUser ? 'selected' : ''}>${u}</option>`).join('');
        }
    }

    // 2. 用戶管理面板 Modal (適配獨立 Key 結構)
    window.pluginOpenManageModal = function() {
        let modal = document.getElementById('pluginUserManageModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'pluginUserManageModal';
            modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center';
            document.body.appendChild(modal);
        }

        let usersHtml = usersList.map(u => {
            const userLikes = getUserLikesMap(u);
            const likeCount = Object.keys(userLikes).length;
            const isCurrent = u === currentUser;
            const isDefault = u === STORAGE_KEYS.DEFAULT_USER_NAME;

            return `
                <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <div>
                        <div class="font-semibold text-sm text-slate-200 flex items-center">
                            ${u} 
                            ${isCurrent ? '<span class="ml-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">當前</span>' : ''}
                            ${isDefault ? '<span class="ml-2 text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">系統預設</span>' : ''}
                        </div>
                        <div class="text-xs text-slate-400 mt-0.5">已收藏 ${likeCount} 首歌 (Key: ${getStorageKeyForUser(u)})</div>
                    </div>
                    <div class="flex items-center space-x-1.5">
                        ${!isDefault ? `<button onclick="window.pluginRenameUser('${u}')" class="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-xs transition" title="更改名稱">改名</button>` : ''}
                        <button onclick="window.pluginExportUser('${u}')" class="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg text-xs transition" title="匯出Like資料">匯出</button>
                        <button onclick="window.pluginMergeUserPrompt('${u}')" class="px-2.5 py-1 bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white rounded-lg text-xs transition" title="合併到其他用戶">合併</button>
                        ${!isDefault && usersList.length > 1 ? `<button onclick="window.pluginDeleteUser('${u}')" class="px-2.5 py-1 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg text-xs transition" title="刪除用戶">刪除</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]">
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <h3 class="text-base font-bold text-slate-100 flex items-center">
                        <i class="fa-solid fa-users-gear text-indigo-400 mr-2"></i> 用戶管理中心 (獨立 Key 儲存架構)
                    </h3>
                    <button onclick="document.getElementById('pluginUserManageModal').remove()" class="text-slate-400 hover:text-white text-sm"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div class="space-y-3 overflow-y-auto flex-1 pr-1 mb-4">
                    ${usersHtml}
                </div>

                <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button onclick="window.pluginImportUserPrompt()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl transition">
                        <i class="fa-solid fa-file-import mr-1"></i> 匯入用戶資料
                    </button>
                    <button onclick="document.getElementById('pluginUserManageModal').remove()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-xl transition">
                        關閉
                    </button>
                </div>
            </div>
        `;
    };

    // 3. 管理操作支援獨立 Key 遷移
    window.pluginRenameUser = async function(oldName) {
        if (oldName === STORAGE_KEYS.DEFAULT_USER_NAME) return;
        const newName = prompt(`請輸入「${oldName}」的新名稱：`, oldName);
        if (!newName || !newName.trim() || newName.trim() === oldName) return;
        const trimmed = newName.trim();

        if (trimmed === STORAGE_KEYS.DEFAULT_USER_NAME || usersList.includes(trimmed)) {
            alert('此用戶名稱無效或已存在！');
            return;
        }

        // 轉移 localStorage 資料 Key
        const oldKey = getStorageKeyForUser(oldName);
        const newKey = getStorageKeyForUser(trimmed);
        const data = localStorage.getItem(oldKey);
        if (data) {
            localStorage.setItem(newKey, data);
            localStorage.removeItem(oldKey);
        }

        usersList = usersList.map(u => u === oldName ? trimmed : u);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));

        if (currentUser === oldName) {
            currentUser = trimmed;
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
        }

        refreshUserSelects();
        window.pluginOpenManageModal();
        if (typeof window.loadFiles === 'function') window.loadFiles(false);
    };

    window.pluginDeleteUser = async function(username) {
        if (username === STORAGE_KEYS.DEFAULT_USER_NAME) {
            alert('「預設用戶」不能被刪除！');
            return;
        }
        if (!confirm(`確定要刪除用戶「${username}」嗎？其獨立的 Like 記錄檔將被移除。`)) return;

        usersList = usersList.filter(u => u !== username);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));

        const key = getStorageKeyForUser(username);
        localStorage.removeItem(key);

        if (currentUser === username) {
            currentUser = STORAGE_KEYS.DEFAULT_USER_NAME;
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
        }

        refreshUserSelects();
        window.pluginOpenManageModal();
        if (typeof window.loadFiles === 'function') window.loadFiles(false);
    };

    window.pluginExportUser = function(username) {
        const likes = getUserLikesMap(username);
        const userData = { username, likes };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `mp3_user_${username}_liked_map.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    window.pluginImportUserPrompt = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (!imported.username || !imported.likes) {
                        alert('匯入失敗：檔案格式不正確！');
                        return;
                    }

                    let targetUser = imported.username;
                    if (targetUser === STORAGE_KEYS.DEFAULT_USER_NAME || usersList.includes(targetUser)) {
                        targetUser = targetUser + '_import_' + Date.now().toString().slice(-4);
                    }

                    usersList.push(targetUser);
                    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
                    saveUserLikesMap(targetUser, imported.likes);

                    refreshUserSelects();
                    window.pluginOpenManageModal();
                    alert(`成功匯入用戶「${targetUser}」！`);
                    if (typeof window.loadFiles === 'function') window.loadFiles(false);
                } catch(err) {
                    alert('解析 JSON 檔案失敗！');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    window.pluginMergeUserPrompt = function(sourceUser) {
        const otherUsers = usersList.filter(u => u !== sourceUser);
        if (otherUsers.length === 0) {
            alert('沒有其他用戶可供合併！');
            return;
        }

        const targetUser = prompt(`請選擇要將「${sourceUser}」的 Like 記錄合併到哪一個用戶？\n現有其他用戶：${otherUsers.join(', ')}`);
        if (!targetUser || !otherUsers.includes(targetUser.trim())) {
            if (targetUser) alert('輸入的目標用戶不存在！');
            return;
        }

        const target = targetUser.trim();
        if (!confirm(`確定要將「${sourceUser}」的所有 Like 合併到「${target}」嗎？合併後「${sourceUser}」將被刪除。`)) return;

        const sourceLikes = getUserLikesMap(sourceUser);
        const targetLikes = getUserLikesMap(target);

        Object.keys(sourceLikes).forEach(songKey => {
            targetLikes[songKey] = true;
        });

        saveUserLikesMap(target, targetLikes);
        localStorage.removeItem(getStorageKeyForUser(sourceUser));

        usersList = usersList.filter(u => u !== sourceUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));

        if (currentUser === sourceUser) {
            currentUser = target;
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
        }

        refreshUserSelects();
        window.pluginOpenManageModal();
        alert(`成功將 「${sourceUser}」 合併至 「${target}」！`);
        if (typeof window.loadFiles === 'function') window.loadFiles(false);
    };

    // 4. 攔截並覆寫核心邏輯 (對應各自獨立的 Key)
    function overrideCoreFunctions() {

        window.getLikedMap = function() {
            return getUserLikesMap(currentUser);
        };

        const originalRenderTable = window.renderTable;
        if (typeof originalRenderTable === 'function') {
            window.renderTable = function() {
                originalRenderTable();
                
                if (window.allFiles && window.allFiles.length > 0) {
                    window.allFiles.forEach(file => {
                        const fileKey = file.relativePath || file.filename;
                        const safeIdKey = encodeURIComponent(fileKey).replace(/[%._-]/g, '_');
                        const row = document.getElementById(`row-${safeIdKey}`);
                        if (row) {
                            // 掃描所有已登記用戶的 Like 狀態，計算誰按過讚
                            const likedUsers = [];
                            usersList.forEach(u => {
                                const map = getUserLikesMap(u);
                                if (map && map[fileKey]) {
                                    likedUsers.push(u);
                                }
                            });

                            if (likedUsers.length > 0) {
                                const titleContainer = row.querySelector('.flex.items-center.space-x-2');
                                if (titleContainer && !titleContainer.querySelector('.plugin-likes-badge')) {
                                    const badge = document.createElement('span');
                                    badge.className = 'plugin-likes-badge text-[10px] text-rose-400 bg-rose-950/40 border border-rose-500/30 px-1.5 py-0.5 rounded ml-2';
                                    badge.title = `按讚用戶: ${likedUsers.join(', ')}`;
                                    badge.innerHTML = `<i class="fa-solid fa-heart mr-1"></i>${likedUsers.length} (${likedUsers.join(', ')})`;
                                    titleContainer.appendChild(badge);
                                }
                            }
                        }
                    });
                }
            };
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        initPluginStorage();
        injectUserUI();
        setTimeout(overrideCoreFunctions, 100);
    });

})();