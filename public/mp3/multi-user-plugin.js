/**
 * MP3 系統多用戶與單向 Like 插件 (Plugin)
 * 特點：不需修改原本的核心資料結構，透過運行時動態注入與函數攔截實現多用戶隔離與全局可見。
 */
(function() {
    // 插件專屬儲存 Key，與原系統區隔
    const STORAGE_KEYS = {
        USERS: 'mp3_plugin_users_list',
        CURRENT_USER: 'mp3_plugin_current_user',
        GLOBAL_LIKES: 'mp3_plugin_global_likes_map'
    };

    let usersList = ['預設用戶'];
    let currentUser = '預設用戶';

    // 初始化插件資料
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

    // 取得全局多用戶 Likes 字典：{ "用戶A": { "song1": true }, "用戶B": { "song2": true } }
    function getPluginGlobalLikes() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.GLOBAL_LIKES) || '{}');
        } catch(e) { return {}; }
    }

    function savePluginGlobalLikes(map) {
        localStorage.setItem(STORAGE_KEYS.GLOBAL_LIKES, JSON.stringify(map));
    }

    // 1. 動態注入 UI 到頂部導覽列
    function injectUserUI() {
        const headerFlex = document.querySelector('header');
        if (!headerFlex) return;

        // 建立插件專屬的用戶切換區塊
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
            <button onclick="window.pluginPromptAddUser()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg text-xs transition shadow" title="登記新用戶">
                <i class="fa-solid fa-user-plus mr-1"></i> 新增
            </button>
        `;

        // 插入至導覽列右側
        headerFlex.appendChild(userToolbar);
    }

    // 2. 用戶切換與新增函數掛載到全域
    window.pluginSwitchUser = function(username) {
        currentUser = username;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
        
        // 重新同步原本系統的檔案 Like 狀態並重新渲染
        if (typeof window.loadFiles === 'function') {
            window.loadFiles(false);
        }
    };

    window.pluginPromptAddUser = async function() {
        // 呼叫原本系統的 Modal（如果存在）
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

            if (!usersList.includes(trimmed)) {
                usersList.push(trimmed);
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
            }
            
            // 更新下拉選單
            const selectEl = document.getElementById('pluginUserSelect');
            if (selectEl) {
                selectEl.innerHTML = usersList.map(u => `<option value="${u}" ${u === trimmed ? 'selected' : ''}>${u}</option>`).join('');
            }
            window.pluginSwitchUser(trimmed);
        }
    };

    // 3. 攔截並覆寫核心 Like 邏輯 (實現「只能 Like、不能 Unlike」與「多用戶隔離但全局可見」)
    function overrideCoreFunctions() {
        // 覆寫原本的 toggleLike 函數
        window.toggleLike = function(fileKey, event) {
            if (event) event.stopPropagation();
            
            const globalLikes = getPluginGlobalLikes();
            if (!globalLikes[currentUser]) {
                globalLikes[currentUser] = {};
            }

            // 核心規則：只能 Like，一旦 Like 就不允許取消
            if (!globalLikes[currentUser][fileKey]) {
                globalLikes[currentUser][fileKey] = true;
                savePluginGlobalLikes(globalLikes);

                // 重新載入或局部刷新表格
                if (typeof window.loadFiles === 'function') {
                    window.loadFiles(false);
                }

                // 支援自動換歌計時器（如果原本系統有開啓）
                if (window.isAutoMode && window.currentPlayingFile === fileKey) {
                    if (typeof window.clearAutoTimer === 'function') window.clearAutoTimer();
                    const timerText = document.getElementById('autoTimerText');
                    if (timerText) {
                        timerText.classList.remove('hidden');
                        timerText.innerText = '[已Like，3秒後換歌...]';
                    }
                    window.autoTimer = setTimeout(() => { if (window.isAutoMode && typeof window.playNext === 'function') window.playNext(); }, 3000);
                }
            }
        };

        // 覆寫原本的 getLikedMap，讓「我的最愛」分類只抓取當前用戶的 Like
        window.getLikedMap = function() {
            const globalLikes = getPluginGlobalLikes();
            return globalLikes[currentUser] || {};
        };

        // 增強原本的 renderTable 顯示：在歌名後方加上「誰按過 Like」的標籤徽章
        const originalRenderTable = window.renderTable;
        if (typeof originalRenderTable === 'function') {
            window.renderTable = function() {
                originalRenderTable();
                
                // 動態為表格中的每一行補上所有用戶的 Like 統計標籤
                const globalLikes = getPluginGlobalLikes();
                if (window.allFiles && window.allFiles.length > 0) {
                    window.allFiles.forEach(file => {
                        const fileKey = file.relativePath || file.filename;
                        const safeIdKey = encodeURIComponent(fileKey).replace(/[%._-]/g, '_');
                        const row = document.getElementById(`row-${safeIdKey}`);
                        if (row) {
                            // 收集有哪些用戶按過這首歌的 Like
                            const likedUsers = [];
                            Object.keys(globalLikes).forEach(u => {
                                if (globalLikes[u] && globalLikes[u][fileKey]) {
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

    // 當 DOM 載入完成後啟動插件
    window.addEventListener('DOMContentLoaded', () => {
        initPluginStorage();
        injectUserUI();
        // 延遲一下確保原系統的函數都已載入完畢再進行攔截
        setTimeout(overrideCoreFunctions, 100);
    });

})();