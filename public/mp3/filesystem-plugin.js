/**
 * 本地文件系统插件 v1.0
 *
 * 使用 File System Access API 直接读取用户选择的本地目录，无需任何后端 API。
 * 需要 Chrome / Edge 86+ / Android Chrome；不支持 Firefox / Safari / iOS。
 *
 * 特性：
 *  - 用户选择目录 → 递归遍历 → 构建索引
 *  - 播放时 handle.getFile() → Blob URL
 *  - 目录句柄持久化到 IndexedDB，下次会话可一键恢复访问
 *  - 通过 MP3RegisterSourceAdapter 与 Core 集成
 *
 * 约束：
 *  - 需要 HTTPS 或 localhost
 *  - 不实现删除（本地文件建议用文件管理器删除后刷新）
 */
(function () {
    'use strict';

    const AUDIO_EXT_RE = /\.(mp3|m4a|aac|flac|wav|ogg|opus|wma|webm|mp4)$/i;
    const CATEGORY_NAME = '📁 本機檔案';
    const MAX_DEPTH = 15;
    const UI_THROTTLE = 40;          // 每扫描 N 个文件刷新一次 UI

    const IDB_NAME = 'mp3-fs-plugin';
    const IDB_STORE = 'handles';
    const IDB_KEY_DIR = 'local-dir';

    let uiRoot = null;
    let adapterHandle = null;

    const state = {
        dirHandle: null,
        dirName: '',
        filesMap: new Map(),         // key -> { handle, name, path, size, lastModified }
        scanning: false,
        scanCancel: false,
        needsPermission: false,
        currentBlobUrl: null,
        pendingRevoke: []
    };

    /* ==================== 支持检测 ==================== */

    function isSupported() {
        return typeof window.showDirectoryPicker === 'function'
            && typeof window.indexedDB !== 'undefined';
    }

    /* ==================== IndexedDB 目录句柄持久化 ==================== */

    function openIDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function idbPut(key, value) {
        const db = await openIDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put(value, key);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
        });
    }

    async function idbGet(key) {
        const db = await openIDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const getReq = tx.objectStore(IDB_STORE).get(key);
            getReq.onsuccess = () => { db.close(); resolve(getReq.result || null); };
            getReq.onerror = () => { db.close(); reject(getReq.error); };
        });
    }

    async function idbDelete(key) {
        const db = await openIDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).delete(key);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
        });
    }

    /* ==================== 权限检查 ==================== */

    async function checkPermission(handle, mode = 'read') {
        if (!handle) return 'denied';
        try {
            if (typeof handle.queryPermission !== 'function') return 'prompt';
            return await handle.queryPermission({ mode });
        } catch (e) {
            return 'denied';
        }
    }

    async function requestPermission(handle, mode = 'read') {
        if (!handle) return 'denied';
        try {
            if (typeof handle.requestPermission !== 'function') return 'denied';
            return await handle.requestPermission({ mode });
        } catch (e) {
            return 'denied';
        }
    }

    /* ==================== 目录遍历 ==================== */

    async function* walkDirectory(dirHandle, pathPrefix = '', depth = 0) {
        if (depth > MAX_DEPTH) return;
        let entries;
        try {
            entries = dirHandle.entries();
        } catch (e) {
            console.warn('[FS] entries() 失败:', e);
            return;
        }
        for await (const [name, handle] of entries) {
            if (state.scanCancel) return;

            // 跳过 macOS 元数据
            if (name === '.DS_Store' || name.startsWith('.')) continue;

            if (handle.kind === 'directory') {
                yield* walkDirectory(handle, pathPrefix + name + '/', depth + 1);
            } else if (handle.kind === 'file' && AUDIO_EXT_RE.test(name)) {
                yield { handle, name, path: pathPrefix + name };
            }
        }
    }

    async function scanDirectory(dirHandle, dirName) {
        state.scanning = true;
        state.scanCancel = false;
        state.filesMap.clear();
        renderCard();

        let count = 0;
        let lastUi = Date.now();

        try {
            for await (const { handle, name, path } of walkDirectory(dirHandle)) {
                if (state.scanCancel) break;

                // 获取元信息（会走浏览器 I/O，但有缓存）
                let size = 0, lastModified = 0;
                try {
                    const f = await handle.getFile();
                    size = f.size;
                    lastModified = f.lastModified;
                } catch (e) {
                    console.warn('[FS] getFile 失败:', path, e);
                    continue;
                }

                const key = `[FS] ${path}`;
                state.filesMap.set(key, { handle, name, path, size, lastModified });
                count++;

                if (count % UI_THROTTLE === 0 || Date.now() - lastUi > 300) {
                    lastUi = Date.now();
                    renderCard(count);
                    // 让出主线程，避免 UI 冻结
                    await new Promise(r => setTimeout(r, 0));
                }
            }
        } finally {
            state.scanning = false;
            state.dirHandle = dirHandle;
            state.dirName = dirName || dirHandle.name || '';
            renderCard();
            await adapterHandle?.refresh();
        }
    }

    /* ==================== 用户交互 ==================== */

    async function pickDirectory() {
        if (!isSupported()) {
            await window.showCustomModal?.({
                title: '瀏覽器不支援',
                message: '此功能需要 Chrome / Edge 86+ 或 Android Chrome，並在 HTTPS 或 localhost 下使用。\n\nFirefox / Safari / iOS 暫不支援。',
                type: 'error'
            });
            return;
        }

        try {
            const dirHandle = await window.showDirectoryPicker({
                mode: 'read',
                id: 'mp3-fs-music',
                startIn: 'music'
            });

            // 存到 IDB
            try { await idbPut(IDB_KEY_DIR, dirHandle); } catch (e) {
                console.warn('[FS] 目录句柄无法持久化:', e);
            }

            state.dirHandle = dirHandle;
            state.dirName = dirHandle.name || '';
            state.needsPermission = false;
            await scanDirectory(dirHandle, state.dirName);
        } catch (e) {
            // AbortError = 用户取消，不算错误
            if (e && e.name === 'AbortError') return;
            console.warn('[FS] 选择目录失败:', e);
            showStatus('選擇目錄失敗：' + (e.message || e));
        }
    }

    async function restoreAccess() {
        if (!state.dirHandle) {
            await pickDirectory();
            return;
        }
        const perm = await requestPermission(state.dirHandle, 'read');
        if (perm === 'granted') {
            state.needsPermission = false;
            await scanDirectory(state.dirHandle, state.dirName);
        } else {
            showStatus('未取得讀取權限');
        }
    }

    async function refreshDir() {
        if (!state.dirHandle) {
            await pickDirectory();
            return;
        }
        const perm = await checkPermission(state.dirHandle, 'read');
        if (perm !== 'granted') {
            state.needsPermission = true;
            renderCard();
            return;
        }
        await scanDirectory(state.dirHandle, state.dirName);
    }

    async function clearDir() {
        state.scanCancel = true;
        state.dirHandle = null;
        state.dirName = '';
        state.filesMap.clear();
        state.needsPermission = false;
        try { await idbDelete(IDB_KEY_DIR); } catch (e) {}
        renderCard();
        await adapterHandle?.unload();
        // unload 会清理所有文件 + handler；重建 handler 供下次使用
        registerAdapter();
    }

    /* ==================== 初始化恢复 ==================== */

    async function tryRestoreFromIDB() {
        try {
            const handle = await idbGet(IDB_KEY_DIR);
            if (!handle) return;
            state.dirHandle = handle;
            state.dirName = handle.name || '';
            const perm = await checkPermission(handle, 'read');
            if (perm === 'granted') {
                await scanDirectory(handle, state.dirName);
            } else if (perm === 'prompt') {
                state.needsPermission = true;
            } else {
                state.needsPermission = true;
            }
        } catch (e) {
            console.warn('[FS] 恢复目录失败:', e);
        }
    }

    /* ==================== Adapter 注册 ==================== */

    function registerAdapter() {
        adapterHandle = window.MP3RegisterSourceAdapter({
            id: 'filesystem',
            categoryName: CATEGORY_NAME,
            onStatusChange: showStatus,

            list: async () => {
                const files = [];
                state.filesMap.forEach((meta, key) => {
                    files.push({
                        filename: meta.name,
                        displayName: meta.name,
                        relativePath: key,
                        size: meta.size,
                        category: CATEGORY_NAME,
                        tags: ['本機'],
                        _source: 'filesystem',
                        _fsPath: meta.path,
                        _fsSize: meta.size,
                        _fsLastModified: meta.lastModified
                    });
                });
                // 按路径排序，字母序
                files.sort((a, b) => a._fsPath.localeCompare(b._fsPath));
                return { files, total: files.length, totalPages: 1 };
            },

            resolveMedia: async (file) => {
                return {
                    play: async (audioPlayer) => {
                        const meta = state.filesMap.get(window.getFileKey(file))
                            || state.filesMap.get(file._key)
                            || state.filesMap.get(file.relativePath);
                        if (!meta) throw new Error('找不到文件句柄（可能已被移除或目录已重选）');

                        // 检查权限
                        let perm = await checkPermission(meta.handle, 'read');
                        if (perm !== 'granted') {
                            perm = await requestPermission(meta.handle, 'read');
                        }
                        if (perm !== 'granted') {
                            throw new Error('檔案讀取權限已過期，請點擊「重新授權」');
                        }

                        showStatus('正在讀取檔案…');
                        const fileObj = await meta.handle.getFile();
                        const newUrl = URL.createObjectURL(fileObj);

                        // 替换 src 前先记住旧的
                        const oldUrl = state.currentBlobUrl;
                        state.currentBlobUrl = newUrl;

                        audioPlayer.src = newUrl;
                        await audioPlayer.play();

                        // 延迟 revoke 旧 URL（防止正在播放时中断）
                        if (oldUrl && oldUrl !== newUrl) {
                            setTimeout(() => {
                                try { URL.revokeObjectURL(oldUrl); } catch (e) {}
                            }, 5000);
                        }

                        showStatus('▶️ ' + file.displayName, 'success');
                    }
                };
            },

            // 不支持删除（用户去文件管理器删后刷新）
            delete: null,

            reset: () => {
                // 不主动 revoke（防止打断播放），由 play() 里延迟 revoke
            },

            onUnload: () => {
                state.scanCancel = true;
                state.scanning = false;
                if (state.currentBlobUrl) {
                    const url = state.currentBlobUrl;
                    setTimeout(() => {
                        try { URL.revokeObjectURL(url); } catch (e) {}
                    }, 3000);
                    state.currentBlobUrl = null;
                }
                state.filesMap.clear();
                if (uiRoot) { uiRoot.remove(); uiRoot = null; }
            }
        });
    }

    /* ==================== UI ==================== */

    function showStatus(msg, tone) {
        if (!uiRoot) return;
        const el = uiRoot.querySelector('.fs-status');
        if (!el) return;
        el.textContent = msg || '';
        el.className = 'fs-status text-[10px] min-h-[0.75rem] break-all ' + (
            tone === 'error' ? 'text-rose-400' :
            tone === 'success' ? 'text-emerald-400' :
            tone === 'warn' ? 'text-amber-400' :
            'text-slate-500'
        );
    }

    function injectUI() {
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
            ? window.MP3PluginManager.getBodyContainer('filesystem') : null;
        if (!body) { setTimeout(injectUI, 300); return; }
        if (uiRoot) return;

        uiRoot = document.createElement('div');
        uiRoot.className = 'space-y-1';
        uiRoot.innerHTML = `
            <div class="fs-unsupported hidden text-[10px] text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded p-1.5 leading-relaxed">
                <i class="fa-solid fa-triangle-exclamation mr-1"></i>
                目前瀏覽器不支援。請使用 Chrome / Edge 86+（HTTPS 或 localhost）。
            </div>
            <div class="fs-main space-y-1">
                <div class="flex items-center justify-between gap-1">
                    <span class="fs-info text-[10px] text-slate-500 flex-1 min-w-0 truncate"></span>
                    <button class="fs-pick text-[10px] text-cyan-400 hover:text-cyan-300 shrink-0 whitespace-nowrap" title="選擇或更換目錄">
                        <i class="fa-solid fa-folder-open text-[9px] mr-0.5"></i>選擇目錄
                    </button>
                </div>
                <div class="flex items-center gap-1">
                    <button class="fs-refresh flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 rounded text-[10px] transition" title="重新掃描當前目錄">
                        <i class="fa-solid fa-rotate mr-0.5"></i>刷新
                    </button>
                    <button class="fs-clear flex-1 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 py-1 rounded text-[10px] transition" title="清除目錄選擇">
                        <i class="fa-solid fa-xmark mr-0.5"></i>清除
                    </button>
                </div>
                <button class="fs-grant hidden w-full bg-amber-600 hover:bg-amber-500 text-white py-1 rounded text-[10px] font-medium transition">
                    <i class="fa-solid fa-key mr-0.5"></i>重新授權存取
                </button>
            </div>
            <p class="fs-status text-[10px] min-h-[0.75rem] break-all text-slate-500"></p>
        `;
        body.appendChild(uiRoot);

        if (!isSupported()) {
            uiRoot.querySelector('.fs-unsupported').classList.remove('hidden');
            uiRoot.querySelector('.fs-main').classList.add('hidden');
        } else {
            uiRoot.querySelector('.fs-pick').addEventListener('click', () => pickDirectory());
            uiRoot.querySelector('.fs-refresh').addEventListener('click', () => refreshDir());
            uiRoot.querySelector('.fs-clear').addEventListener('click', () => clearDir());
            uiRoot.querySelector('.fs-grant').addEventListener('click', () => restoreAccess());
        }

        renderCard();
    }

    function renderCard(scanCount) {
        if (!uiRoot) return;
        const info = uiRoot.querySelector('.fs-info');
        const grantBtn = uiRoot.querySelector('.fs-grant');
        const pickBtn = uiRoot.querySelector('.fs-pick');
        if (!info) return;

        // 授权按钮显示
        if (state.needsPermission && state.dirHandle) {
            grantBtn?.classList.remove('hidden');
        } else {
            grantBtn?.classList.add('hidden');
        }

        // 选择按钮文案
        if (pickBtn) {
            pickBtn.innerHTML = state.dirHandle
                ? '<i class="fa-solid fa-folder-open text-[9px] mr-0.5"></i>更換目錄'
                : '<i class="fa-solid fa-folder-open text-[9px] mr-0.5"></i>選擇目錄';
        }

        if (state.scanning) {
            info.innerHTML = `<span class="text-cyan-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i>掃描中… ${scanCount != null ? scanCount : state.filesMap.size} 首</span>`;
            return;
        }
        if (!state.dirHandle) {
            info.innerHTML = `<span class="text-slate-500">尚未選擇目錄</span>`;
            return;
        }
        const n = state.filesMap.size;
        info.innerHTML = `<span class="text-slate-300">${escapeHtml(state.dirName || '已選目錄')}</span> · <span class="text-cyan-400 font-medium">${n}</span> 首`;
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* ==================== 插件导出 ==================== */

    window.MP3FileSystemPlugin = {
        version: '1.0.0',
        async init() {
            registerAdapter();
            injectUI();
            if (isSupported()) {
                await tryRestoreFromIDB();
            }
        },
        async unload() {
            state.scanCancel = true;
            await adapterHandle?.unload();
            adapterHandle = null;
            if (typeof window.refreshSourceFilterOptions === 'function') {
                window.refreshSourceFilterOptions();
            }
        }
    };

    console.log('[MP3FileSystemPlugin] v1.0.0 ready（File System Access API）');
})();