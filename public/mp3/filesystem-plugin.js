/**
 * 本地文件系统插件 v2.0（多目录版）
 *
 * 使用 File System Access API 直接读取用户选择的本地目录，无需任何后端 API。
 * 需要 Chrome / Edge 86+ / Android Chrome；不支持 Firefox / Safari / iOS。
 *
 * 特性：
 *  - 支持多个目录，每个目录独立扫描 / 独立授权 / 独立刷新 / 独立移除
 *  - 目录句柄持久化到 IndexedDB（数组），下次会话可一键恢复
 *  - 自动从 v1.0 单目录数据迁移
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
    const UI_THROTTLE = 40;

    const IDB_NAME = 'mp3-fs-plugin';
    const IDB_STORE = 'handles';
    const IDB_KEY_DIRS = 'local-dirs-v2';    // 新：数组
    const IDB_KEY_LEGACY = 'local-dir';       // 旧：单个 handle，读取后迁移

    let uiRoot = null;
    let adapterHandle = null;

    /**
     * 目录条目结构：
     * {
     *   id, name, handle,
     *   filesMap: Map<fileKey, meta>,
     *   scanning: boolean,
     *   scanCancel: boolean,
     *   needsPermission: boolean,
     *   error: string|null
     * }
     */
    const state = {
        dirs: new Map(),             // dirId -> entry
        currentBlobUrl: null
    };

    function genId() {
        return 'dir_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* ==================== 支持检测 ==================== */

    function isSupported() {
        return typeof window.showDirectoryPicker === 'function'
            && typeof window.indexedDB !== 'undefined';
    }

    /* ==================== IndexedDB ==================== */

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

    async function persistDirs() {
        const arr = [];
        state.dirs.forEach((entry, id) => {
            if (entry.handle) {
                arr.push({ id, name: entry.name, handle: entry.handle });
            }
        });
        try { await idbPut(IDB_KEY_DIRS, arr); }
        catch (e) { console.warn('[FS] 持久化目录失败:', e); }
    }

    /* ==================== 权限 ==================== */

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

    async function* walkDirectory(dirHandle, pathPrefix = '', depth = 0, cancelRef) {
        if (depth > MAX_DEPTH) return;
        if (cancelRef && cancelRef.value) return;

        let entries;
        try {
            entries = dirHandle.entries();
        } catch (e) {
            console.warn('[FS] entries() 失败:', e);
            throw e;
        }
        for await (const [name, handle] of entries) {
            if (cancelRef && cancelRef.value) return;
            if (name === '.DS_Store' || name.startsWith('.')) continue;

            if (handle.kind === 'directory') {
                yield* walkDirectory(handle, pathPrefix + name + '/', depth + 1, cancelRef);
            } else if (handle.kind === 'file' && AUDIO_EXT_RE.test(name)) {
                yield { handle, name, path: pathPrefix + name };
            }
        }
    }

    /* ==================== 扫描单个目录 ==================== */

    async function scanDir(entry) {
        if (!entry || !entry.handle) return;
        if (entry.scanning) return;

        const perm = await checkPermission(entry.handle, 'read');
        if (perm !== 'granted') {
            entry.needsPermission = true;
            entry.scanning = false;
            entry.error = null;
            renderCard();
            return;
        }

        entry.scanning = true;
        entry.needsPermission = false;
        entry.error = null;
        const cancelRef = { value: false };
        entry._cancelRef = cancelRef;
        entry.filesMap.clear();
        renderCard();

        let count = 0;
        let lastUi = Date.now();

        try {
            for await (const { handle, name, path } of walkDirectory(entry.handle, '', 0, cancelRef)) {
                if (cancelRef.value) break;

                let size = 0, lastModified = 0;
                try {
                    const f = await handle.getFile();
                    size = f.size;
                    lastModified = f.lastModified;
                } catch (e) {
                    console.warn('[FS] getFile 失败:', path, e);
                    continue;
                }

                const fileKey = `[FS] ${entry.id}:${path}`;
                entry.filesMap.set(fileKey, {
                    handle, name, path, size, lastModified, dirId: entry.id
                });
                count++;

                if (count % UI_THROTTLE === 0 || Date.now() - lastUi > 300) {
                    lastUi = Date.now();
                    renderCard();
                    await new Promise(r => setTimeout(r, 0));
                }
            }
        } catch (e) {
            entry.error = e.message || String(e);
        } finally {
            entry.scanning = false;
            entry._cancelRef = null;
            renderCard();
            await adapterHandle?.refresh();
        }
    }

    /* ==================== 用户交互 ==================== */

    async function addDirectory() {
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

            const entry = {
                id: genId(),
                name: dirHandle.name || '未命名目錄',
                handle: dirHandle,
                filesMap: new Map(),
                scanning: false,
                scanCancel: false,
                needsPermission: false,
                error: null
            };
            state.dirs.set(entry.id, entry);
            await persistDirs();
            renderCard();

            // 异步扫描
            scanDir(entry).catch(e => console.warn('[FS] 扫描失败:', e));
        } catch (e) {
            if (e && e.name === 'AbortError') return;
            console.warn('[FS] 选择目录失败:', e);
            showStatus('選擇目錄失敗：' + (e.message || e), 'error');
        }
    }

    async function refreshDir(dirId) {
        const entry = state.dirs.get(dirId);
        if (!entry) return;
        await scanDir(entry);
    }

    async function refreshAllDirs() {
        const tasks = [];
        state.dirs.forEach(entry => {
            tasks.push(scanDir(entry).catch(e => console.warn('[FS] 扫描失败:', e)));
        });
        await Promise.allSettled(tasks);
    }

    async function grantDirPermission(dirId) {
        const entry = state.dirs.get(dirId);
        if (!entry) return;
        const perm = await requestPermission(entry.handle, 'read');
        if (perm === 'granted') {
            entry.needsPermission = false;
            renderCard();
            await scanDir(entry);
        } else {
            showStatus('未取得讀取權限', 'warn');
        }
    }

    async function removeDir(dirId) {
        const entry = state.dirs.get(dirId);
        if (!entry) return;

        // 检查是否有正在播放的该目录文件
        const ext = window.MP3AppExtension;
        if (ext && ext.currentPlayingFile) {
            const playingFile = ext.allFiles.find(f => ext.getFileKey(f) === ext.currentPlayingFile);
            if (playingFile && playingFile._source === 'filesystem' && playingFile._fsDirId === dirId) {
                const confirmed = await window.showCustomModal?.({
                    title: '正在播放此目錄的歌曲',
                    message: '移除後會停止目前播放。是否繼續？',
                    type: 'confirm', confirmText: '移除'
                });
                if (!confirmed) return;
            }
        }

        // 中断扫描
        if (entry._cancelRef) entry._cancelRef.value = true;
        entry.scanning = false;

        state.dirs.delete(dirId);
        await persistDirs();
        renderCard();
        await adapterHandle?.refresh();
    }

    async function renameDir(dirId) {
        const entry = state.dirs.get(dirId);
        if (!entry) return;
        const result = await window.showCustomModal?.({
            title: '重命名目錄',
            subtitle: '顯示名稱',
            message: '輸入新名稱：',
            type: 'confirm',
            isPrompt: true,
            defaultValue: entry.name,
            confirmText: '保存'
        });
        if (result === null || result === undefined || result === false) return;
        const newName = String(result).trim();
        if (!newName || newName === entry.name) return;
        entry.name = newName;
        await persistDirs();
        renderCard();
        await adapterHandle?.refresh();
    }

    /* ==================== 启动恢复 ==================== */

    async function restoreDirs() {
        let arr = [];
        try { arr = (await idbGet(IDB_KEY_DIRS)) || []; } catch (e) {}
        if (!Array.isArray(arr)) arr = [];

        // 兼容迁移：旧版本只存了一个 handle
        if (arr.length === 0) {
            try {
                const legacy = await idbGet(IDB_KEY_LEGACY);
                if (legacy && legacy.kind === 'directory') {
                    arr.push({ id: genId(), name: legacy.name || '', handle: legacy });
                    await persistDirs();
                    await idbDelete(IDB_KEY_LEGACY);
                }
            } catch (e) {}
        }

        if (arr.length === 0) {
            renderCard();
            return;
        }

        const scanTasks = [];
        for (const item of arr) {
            if (!item || !item.handle) continue;
            const entry = {
                id: item.id || genId(),
                name: item.name || item.handle.name || '未命名目錄',
                handle: item.handle,
                filesMap: new Map(),
                scanning: false,
                scanCancel: false,
                needsPermission: false,
                error: null
            };
            state.dirs.set(entry.id, entry);

            const perm = await checkPermission(entry.handle, 'read');
            if (perm === 'granted') {
                scanTasks.push(scanDir(entry).catch(e => console.warn('[FS] 恢复扫描失败:', e)));
            } else {
                entry.needsPermission = true;
            }
        }
        renderCard();
        await adapterHandle?.refresh();
        await Promise.allSettled(scanTasks);
    }

    /* ==================== Adapter 注册 ==================== */

    function registerAdapter() {
        adapterHandle = window.MP3RegisterSourceAdapter({
            id: 'filesystem',
            categoryName: CATEGORY_NAME,
            onStatusChange: showStatus,

            // 聚合所有目录的文件
            list: async () => {
                const files = [];
                state.dirs.forEach((entry, dirId) => {
                    entry.filesMap.forEach((meta, fileKey) => {
                        files.push({
                            _key: fileKey,                                      // 强制唯一（dirId + path）
                            filename: meta.name,
                            displayName: meta.name,
                            relativePath: `[${entry.name}] ${meta.path}`,       // 展示用
                            size: meta.size,
                            category: CATEGORY_NAME,
                            tags: ['本機'],
                            _source: 'filesystem',
                            _fsDirId: dirId,
                            _fsPath: meta.path,
                            _fsSize: meta.size,
                            _fsLastModified: meta.lastModified
                        });
                    });
                });

                // 排序：先按目录名，再按路径
                const dirNameOf = (dirId) => state.dirs.get(dirId)?.name || '';
                files.sort((a, b) => {
                    if (a._fsDirId !== b._fsDirId) {
                        return dirNameOf(a._fsDirId).localeCompare(dirNameOf(b._fsDirId));
                    }
                    return a._fsPath.localeCompare(b._fsPath);
                });

                return { files, total: files.length, totalPages: 1 };
            },

            // 播放：按 dirId 找到目录，用对应句柄读取
            resolveMedia: async (file) => {
                return {
                    play: async (audioPlayer) => {
                        const dirId = file._fsDirId;
                        const entry = state.dirs.get(dirId);
                        if (!entry) throw new Error('目錄已被移除');

                        const meta = entry.filesMap.get(file._key);
                        if (!meta) throw new Error('文件不存在（可能已被移動或刪除）');

                        // 权限检查（可能过期）
                        let perm = await checkPermission(meta.handle, 'read');
                        if (perm !== 'granted') {
                            perm = await requestPermission(meta.handle, 'read');
                        }
                        if (perm !== 'granted') {
                            entry.needsPermission = true;
                            renderCard();
                            throw new Error(`目錄「${entry.name}」權限已過期，請點擊「重新授權」`);
                        }

                        showStatus('正在讀取檔案…');
                        const fileObj = await meta.handle.getFile();
                        const newUrl = URL.createObjectURL(fileObj);
                        const oldUrl = state.currentBlobUrl;
                        state.currentBlobUrl = newUrl;

                        audioPlayer.src = newUrl;
                        await audioPlayer.play();

                        // 延迟 revoke 旧 URL（防止切换间隙中断播放）
                        if (oldUrl && oldUrl !== newUrl) {
                            setTimeout(() => {
                                try { URL.revokeObjectURL(oldUrl); } catch (e) {}
                            }, 10000);
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
                state.dirs.forEach(entry => {
                    if (entry._cancelRef) entry._cancelRef.value = true;
                    entry.scanning = false;
                });
                if (state.currentBlobUrl) {
                    const url = state.currentBlobUrl;
                    setTimeout(() => {
                        try { URL.revokeObjectURL(url); } catch (e) {}
                    }, 3000);
                    state.currentBlobUrl = null;
                }
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
        uiRoot.className = 'space-y-1.5';
        uiRoot.innerHTML = `
            <div class="fs-unsupported hidden text-[10px] text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded p-1.5 leading-relaxed">
                <i class="fa-solid fa-triangle-exclamation mr-1"></i>
                目前瀏覽器不支援。請使用 Chrome / Edge 86+（HTTPS 或 localhost）。
            </div>
            <div class="fs-main space-y-1">
                <p class="fs-info text-[10px] text-slate-500 leading-relaxed"></p>
                <div class="fs-dirs space-y-1"></div>
                <div class="flex items-center gap-1 pt-1">
                    <button class="fs-add flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-1 rounded text-[10px] font-medium transition">
                        <i class="fa-solid fa-plus mr-0.5"></i>新增目錄
                    </button>
                    <button class="fs-refresh-all p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] transition" title="重新掃描所有目錄">
                        <i class="fa-solid fa-rotate text-[10px]"></i>
                    </button>
                </div>
            </div>
            <p class="fs-status text-[10px] min-h-[0.75rem] break-all text-slate-500"></p>
        `;
        body.appendChild(uiRoot);

        if (!isSupported()) {
            uiRoot.querySelector('.fs-unsupported').classList.remove('hidden');
            uiRoot.querySelector('.fs-main').classList.add('hidden');
        } else {
            uiRoot.querySelector('.fs-add').addEventListener('click', () => addDirectory());
            uiRoot.querySelector('.fs-refresh-all').addEventListener('click', () => refreshAllDirs());
        }

        renderCard();
    }

    function renderCard() {
        if (!uiRoot) return;
        const info = uiRoot.querySelector('.fs-info');
        const dirsList = uiRoot.querySelector('.fs-dirs');
        if (!info || !dirsList) return;

        const totalDirs = state.dirs.size;
        let totalFiles = 0;
        state.dirs.forEach(e => { totalFiles += e.filesMap.size; });

        if (totalDirs === 0) {
            info.innerHTML = `<span class="text-slate-500">尚未選擇任何目錄</span>`;
            dirsList.innerHTML = '';
            return;
        }

        let scanning = 0;
        state.dirs.forEach(e => { if (e.scanning) scanning++; });
        info.innerHTML = scanning > 0
            ? `<span class="text-cyan-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i>掃描中…</span> · ${totalDirs} 個目錄 · 已發現 <span class="text-cyan-400 font-medium">${totalFiles}</span> 首`
            : `<span class="text-slate-400">${totalDirs}</span> 個目錄 · 共 <span class="text-cyan-400 font-medium">${totalFiles}</span> 首`;

        // 渲染目录行
        const rows = [];
        state.dirs.forEach((entry, dirId) => {
            let statusText = '';
            let statusClass = 'text-slate-500';
            let actionBtn = '';

            if (entry.scanning) {
                statusText = '掃描中…';
                statusClass = 'text-cyan-400';
            } else if (entry.error) {
                statusText = '失敗';
                statusClass = 'text-rose-400';
                actionBtn = `<button class="fs-row-grant p-0.5 text-slate-500 hover:text-amber-400" data-id="${escapeHtml(dirId)}" title="重新授權"><i class="fa-solid fa-key text-[10px]"></i></button>`;
            } else if (entry.needsPermission) {
                statusText = '需授權';
                statusClass = 'text-amber-400';
                actionBtn = `<button class="fs-row-grant p-0.5 text-amber-400 hover:text-amber-300" data-id="${escapeHtml(dirId)}" title="重新授權"><i class="fa-solid fa-key text-[10px]"></i></button>`;
            } else {
                statusText = entry.filesMap.size + ' 首';
                statusClass = 'text-emerald-400';
            }

            rows.push(`
                <div class="fs-dir-row bg-slate-800/40 border border-slate-700/60 rounded p-1.5" data-id="${escapeHtml(dirId)}">
                    <div class="flex items-center gap-1">
                        <i class="fa-solid fa-folder text-cyan-400 text-[10px] shrink-0"></i>
                        <span class="text-[10px] text-slate-200 font-medium flex-1 truncate" title="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}</span>
                        <span class="fs-row-status text-[9px] ${statusClass} whitespace-nowrap" title="${entry.error ? escapeHtml(entry.error) : ''}">${statusText}</span>
                        ${actionBtn}
                        <button class="fs-row-refresh p-0.5 text-slate-500 hover:text-cyan-400" data-id="${escapeHtml(dirId)}" title="重新掃描"><i class="fa-solid fa-rotate text-[10px]"></i></button>
                        <button class="fs-row-rename p-0.5 text-slate-500 hover:text-indigo-400" data-id="${escapeHtml(dirId)}" title="重命名"><i class="fa-solid fa-pen text-[10px]"></i></button>
                        <button class="fs-row-del p-0.5 text-slate-500 hover:text-rose-400" data-id="${escapeHtml(dirId)}" title="移除"><i class="fa-solid fa-xmark text-[10px]"></i></button>
                    </div>
                </div>
            `);
        });
        dirsList.innerHTML = rows.join('');

        // 绑定事件
        dirsList.querySelectorAll('.fs-row-grant').forEach(btn => {
            btn.addEventListener('click', () => grantDirPermission(btn.dataset.id));
        });
        dirsList.querySelectorAll('.fs-row-refresh').forEach(btn => {
            btn.addEventListener('click', () => refreshDir(btn.dataset.id));
        });
        dirsList.querySelectorAll('.fs-row-rename').forEach(btn => {
            btn.addEventListener('click', () => renameDir(btn.dataset.id));
        });
        dirsList.querySelectorAll('.fs-row-del').forEach(btn => {
            btn.addEventListener('click', () => removeDir(btn.dataset.id));
        });
    }

    /* ==================== 插件导出 ==================== */

    window.MP3FileSystemPlugin = {
        version: '2.0.0',
        async init() {
            registerAdapter();
            injectUI();
            if (isSupported()) {
                await restoreDirs();
            }
        },
        async unload() {
            state.dirs.forEach(entry => {
                if (entry._cancelRef) entry._cancelRef.value = true;
            });
            await adapterHandle?.unload();
            adapterHandle = null;
            if (typeof window.refreshSourceFilterOptions === 'function') {
                window.refreshSourceFilterOptions();
            }
        }
    };

    console.log('[MP3FileSystemPlugin] v2.0.0 ready（多目录）');
})();