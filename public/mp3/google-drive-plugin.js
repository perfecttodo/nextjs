/**
 * Google Drive 扩展插件 v3.3
 * 
 * 相对 v3.2 的改动：
 *  1. 路径切换时探测旧/新目录内容，旧目录有文件则弹窗确认
 *  2. 弹窗三选项：迁移并切换 / 直接切换（不迁移）/ 取消（保持原路径）
 *  3. 未授权时不探测目录，只保存路径
 *  4. 保留「迁移旧文件」按钮作为兜底（从 legacyFolderPath 迁移到当前路径）
 */
window.MP3GoogleDriveConfig = {
    clientId: '802199089900-5n676d4hansnab5c66igukb1mch5m7m1.apps.googleusercontent.com'
  };
(function () {
    'use strict';

    const CFG = window.MP3GoogleDriveConfig || {};
    const CONFIG = {
        clientId: CFG.clientId || '',
        legacyFolderPath: CFG.legacyFolderPath || ['music', 'fav'],
        backupFileName: CFG.backupFileName || 'mp3_player_backup.json',
        driveCategoryName: CFG.driveCategoryName || '☁️ Drive 音樂'
    };

    const SCOPES = [
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/drive.file'
    ].join(' ');

    const NS = 'mp3_gdrive_';
    const KEY_TOKEN = NS + 'token';
    const KEY_FAV_FOLDER_ID = NS + 'fav_folder_id';
    const KEY_FAV_PATH = NS + 'fav_path';
    const KEY_MIGRATED = NS + 'fav_migrated';

    const DEFAULT_FAV_PATH = ['apps', 'music', 'fav'];
    const INVALID_PATH_CHARS = /[<>:"|?*\x00-\x1f]/;

    const EXCLUDED_BACKUP_KEYS = new Set([KEY_TOKEN, KEY_FAV_FOLDER_ID, KEY_FAV_PATH, KEY_MIGRATED]);

    const state = {
        authorized: false,
        driveFiles: [],
        currentBlobUrl: null,
        uploadingFavorites: false,
        migrating: false,
        switching: false
    };

    let accessToken = null;
    let tokenClient = null;
    let uiRoot = null;

    // ==================== 工具 ====================
    function setStatus(msg, tone) {
        if (!uiRoot) return;
        const el = uiRoot.querySelector('.gdrive-status');
        if (!el) return;
        el.textContent = msg || '';
        el.className = 'gdrive-status text-[10px] min-h-[0.75rem] break-all ' + (
            tone === 'error' ? 'text-rose-400' :
            tone === 'success' ? 'text-emerald-400' :
            tone === 'warn' ? 'text-amber-400' :
            'text-slate-500'
        );
    }

    function sanitizeFilename(key) {
        const parts = String(key).split(/[\/\\]/);
        let name = parts[parts.length - 1] || 'untitled.mp3';
        if (!/\.mp3$/i.test(name)) name += '.mp3';
        return name;
    }

    function pathKey(parts) {
        return parts.join('/');
    }

    // ==================== 路径配置 ====================
    function normalizePathParts(input) {
        if (Array.isArray(input)) {
            return input.map(s => String(s == null ? '' : s).trim()).filter(Boolean);
        }
        const str = String(input == null ? '' : input).trim();
        if (!str) return [];
        return str.split(/[\/\\]+/).map(s => s.trim()).filter(Boolean);
    }

    function validatePathParts(parts) {
        for (const p of parts) {
            if (INVALID_PATH_CHARS.test(p)) return `路径段 "${p}" 含非法字符（不允许 < > : " | ? *）`;
            if (p === '.' || p === '..') return `路径段 "${p}" 无效`;
        }
        return null;
    }

    function validateAndNormalizePath(input) {
        const parts = normalizePathParts(input);
        if (parts.length === 0) return { parts: [...DEFAULT_FAV_PATH], cleared: true };
        const err = validatePathParts(parts);
        if (err) throw new Error(err);
        return { parts, cleared: false };
    }

    function getFavoritesFolderPath() {
        try {
            const saved = localStorage.getItem(KEY_FAV_PATH);
            if (saved) {
                const parsed = normalizePathParts(JSON.parse(saved));
                if (parsed.length > 0 && !validatePathParts(parsed)) return parsed;
            }
        } catch (e) {}
        if (CFG.favoritesFolderPath) {
            const parts = normalizePathParts(CFG.favoritesFolderPath);
            if (parts.length > 0 && !validatePathParts(parts)) return parts;
        }
        return [...DEFAULT_FAV_PATH];
    }

    function saveFavoritesFolderPath(input) {
        const parts = normalizePathParts(input);
        if (parts.length === 0) {
            try { localStorage.removeItem(KEY_FAV_PATH); } catch (e) {}
            return [...DEFAULT_FAV_PATH];
        }
        const err = validatePathParts(parts);
        if (err) throw new Error(err);
        try { localStorage.setItem(KEY_FAV_PATH, JSON.stringify(parts)); } catch (e) {}
        return parts;
    }

    // ==================== 缓存 ====================
    function readFolderCache(cacheKey, expectedPath) {
        try {
            const raw = localStorage.getItem(cacheKey);
            if (!raw) return null;
            let obj;
            try { obj = JSON.parse(raw); } catch (e) { obj = null; }
            if (!obj || typeof obj !== 'object' || !obj.id) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            if (obj.path !== expectedPath) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            return obj.id;
        } catch (e) { return null; }
    }
    function writeFolderCache(cacheKey, path, id) {
        try { localStorage.setItem(cacheKey, JSON.stringify({ path, id })); } catch (e) {}
    }

    // ==================== Token ====================
    function saveToken(token, expiresInSec) {
        const expiresAt = Date.now() + (expiresInSec || 3600) * 1000 - 60000;
        try { localStorage.setItem(KEY_TOKEN, JSON.stringify({ token, expiresAt })); } catch (e) {}
    }
    function loadCachedToken() {
        try {
            const saved = JSON.parse(localStorage.getItem(KEY_TOKEN) || 'null');
            if (saved && saved.token && saved.expiresAt > Date.now()) return saved.token;
        } catch (e) {}
        return null;
    }
    function clearCachedToken() { localStorage.removeItem(KEY_TOKEN); }

    // ==================== GIS ====================
    function loadGisScript() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.accounts && window.google.accounts.oauth2) return resolve();
            const s = document.createElement('script');
            s.src = 'https://accounts.google.com/gsi/client';
            s.async = true; s.defer = true;
            s.onload = resolve;
            s.onerror = () => reject(new Error('无法加载 Google Identity Services'));
            document.head.appendChild(s);
        });
    }

    async function ensureTokenClient() {
        if (tokenClient) return;
        await loadGisScript();
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.clientId,
            scope: SCOPES,
            callback: (response) => {
                if (response.error) {
                    setStatus('授权失败：' + response.error, 'error');
                    resetAuthUI();
                    clearCachedToken();
                    return;
                }
                accessToken = response.access_token;
                saveToken(accessToken, response.expires_in);
                state.authorized = true;
                showAuthedUI();
                setStatus('✅ 已授权 Google Drive', 'success');
                syncDriveFilesToMainList().catch(() => {});
            }
        });
    }

    async function tryRestoreSession() {
        const cached = loadCachedToken();
        if (cached) {
            accessToken = cached;
            state.authorized = true;
            showAuthedUI();
            setStatus('✅ 已恢复之前的授权', 'success');
            syncDriveFilesToMainList().catch(() => {});
            return true;
        }
        try {
            await ensureTokenClient();
            tokenClient.requestAccessToken({ prompt: '' });
        } catch (e) {
            console.warn('[GDrive] 静默刷新失败:', e);
        }
        return false;
    }

    // ==================== Drive Fetch ====================
    async function driveFetch(url, options = {}) {
        if (!accessToken) throw new Error('尚未授权');
        const headers = Object.assign({}, options.headers, {
            'Authorization': 'Bearer ' + accessToken
        });
        const res = await fetch(url, Object.assign({}, options, { headers }));
        if (res.status === 401) {
            accessToken = null;
            clearCachedToken();
            resetAuthUI();
            setStatus('授权已过期，请重新授权。', 'warn');
            throw new Error('Token expired');
        }
        return res;
    }

    // ==================== 文件夹 ====================
    async function ensureFolder(name, parentId) {
        const q = encodeURIComponent(
            `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
        );
        const res = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`);
        const data = await res.json();
        if (data.files && data.files.length > 0) return data.files[0].id;

        const createRes = await driveFetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] })
        });
        if (!createRes.ok) {
            const err = await createRes.json().catch(() => ({}));
            throw new Error(err.error ? err.error.message : '创建文件夹失败');
        }
        return (await createRes.json()).id;
    }

    async function ensureNestedFolder(pathParts, cacheKey) {
        const expectedPath = pathKey(pathParts);

        if (cacheKey) {
            const cachedId = readFolderCache(cacheKey, expectedPath);
            if (cachedId) {
                try {
                    const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${cachedId}?fields=id,trashed`);
                    if (res.ok) {
                        const info = await res.json();
                        if (info && !info.trashed) return cachedId;
                    }
                } catch (e) {}
                localStorage.removeItem(cacheKey);
            }
        }

        let parentId = 'root';
        for (const name of pathParts) {
            parentId = await ensureFolder(name, parentId);
        }

        if (cacheKey) writeFolderCache(cacheKey, expectedPath, parentId);
        return parentId;
    }

    // ==================== 探测目录（不创建） ====================
    async function probeFolder(pathParts) {
        try {
            let parentId = 'root';
            for (const name of pathParts) {
                const q = encodeURIComponent(
                    `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
                );
                const res = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`);
                const data = await res.json();
                if (!data.files || data.files.length === 0) {
                    return { exists: false, id: null, count: 0 };
                }
                parentId = data.files[0].id;
            }
            const q = encodeURIComponent(
                `'${parentId}' in parents and trashed=false and (mimeType='audio/mpeg' or name contains '.mp3')`
            );
            const countRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=1000`);
            const countData = await countRes.json();
            return { exists: true, id: parentId, count: (countData.files || []).length };
        } catch (e) {
            return { exists: false, id: null, count: 0 };
        }
    }

    // ==================== 迁移文件（参数化） ====================
    async function migrateFilesBetween(oldPathParts, newPathParts) {
        const oldPathText = pathKey(oldPathParts);
        const newPathText = pathKey(newPathParts);

        const oldProbe = await probeFolder(oldPathParts);
        if (!oldProbe.exists || oldProbe.count === 0) {
            return { ok: 0, fail: 0, skipped: true };
        }

        const oldParent = oldProbe.id;
        const newParent = await ensureNestedFolder(newPathParts, KEY_FAV_FOLDER_ID);

        const q = encodeURIComponent(
            `'${oldParent}' in parents and trashed=false and (mimeType='audio/mpeg' or name contains '.mp3')`
        );
        const listRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1000`);
        const listData = await listRes.json();
        const files = listData.files || [];

        let ok = 0, fail = 0;
        for (const f of files) {
            try {
                const res = await driveFetch(
                    `https://www.googleapis.com/drive/v3/files/${f.id}?addParents=${newParent}&removeParents=${oldParent}&fields=id,parents`,
                    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' }
                );
                if (res.ok) ok++; else fail++;
            } catch (e) { fail++; }
        }

        return { ok, fail, total: files.length, oldPathText, newPathText };
    }

    // ==================== 路径切换确认弹窗 ====================
    function showSwitchDialog({ oldPath, newPath, oldCount, newCount }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4';

            const warning = newCount > 0;
            const iconBg = warning ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400';
            const iconCls = warning ? 'fa-triangle-exclamation' : 'fa-folder-tree';

            let bodyMsg = '';
            if (warning) {
                bodyMsg = `旧目录 <code class="text-slate-200">${escapeHtmlAttr(oldPath)}</code> 有 <b class="text-amber-400">${oldCount}</b> 个文件，新目录 <code class="text-slate-200">${escapeHtmlAttr(newPath)}</code> 已有 <b class="text-amber-400">${newCount}</b> 个文件。<br>迁移后新旧文件会合并在新目录里。`;
            } else {
                bodyMsg = `旧目录 <code class="text-slate-200">${escapeHtmlAttr(oldPath)}</code> 有 <b class="text-indigo-400">${oldCount}</b> 个文件，新目录 <code class="text-slate-200">${escapeHtmlAttr(newPath)}</code> 为空。`;
            }

            overlay.innerHTML = `
                <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
                    <div class="flex items-start gap-3 mb-4">
                        <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0">
                            <i class="fa-solid ${iconCls} text-base"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="text-sm font-bold text-slate-100 mb-1">切换目录前确认</h3>
                            <p class="text-[11px] text-slate-400 leading-relaxed">${bodyMsg}</p>
                        </div>
                    </div>
                    <div class="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 mb-4 space-y-1">
                        <p><i class="fa-solid fa-arrow-right-to-bracket text-indigo-400 mr-1.5"></i><b class="text-slate-200">迁移并切换</b>：把旧文件移动到新目录（旧目录变空）</p>
                        <p><i class="fa-solid fa-arrow-right text-slate-400 mr-1.5"></i><b class="text-slate-200">直接切换</b>：旧文件留在原地，新目录从空开始</p>
                        <p><i class="fa-solid fa-xmark text-slate-500 mr-1.5"></i><b class="text-slate-200">取消</b>：保持当前路径不变</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button data-action="cancel" class="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition">取消</button>
                        <button data-action="switch" class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[11px] font-medium transition">直接切换</button>
                        <button data-action="migrate" class="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-medium transition">迁移并切换</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            overlay.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    overlay.remove();
                    resolve(action);
                });
            });
        });
    }

    // ==================== 路径切换主流程 ====================
    async function handlePathSave(newPathInput) {
        if (state.switching) return;

        // 1. 验证新路径（不保存）
        let newParts;
        try {
            const result = validateAndNormalizePath(newPathInput);
            newParts = result.parts;
        } catch (e) {
            setStatus('路径无效：' + e.message, 'error');
            return;
        }

        const oldParts = getFavoritesFolderPath();
        const oldPath = pathKey(oldParts);
        const newPath = pathKey(newParts);

        // 2. 无变化
        if (oldPath === newPath) {
            if (uiRoot) {
                const input = uiRoot.querySelector('.gdrive-path-input');
                if (input) input.value = newPath;
            }
            setStatus(`路径未变化（${newPath}）`, 'warn');
            return;
        }

        // 3. 未授权：只保存路径，不探测
        if (!state.authorized) {
            saveFavoritesFolderPath(newPathInput);
            if (uiRoot) {
                const input = uiRoot.querySelector('.gdrive-path-input');
                if (input) input.value = newPath;
            }
            refreshPathDisplay();
            setStatus(`路径已保存为 ${newPath}，授权后生效。`, 'success');
            return;
        }

        // 4. 已授权：探测旧/新目录
        state.switching = true;
        try {
            setStatus('正在检测旧目录内容…');
            const oldProbe = await probeFolder(oldParts);

            // 4a. 旧目录空或不存在 → 直接切换
            if (!oldProbe.exists || oldProbe.count === 0) {
                saveFavoritesFolderPath(newPathInput);
                if (uiRoot) {
                    const input = uiRoot.querySelector('.gdrive-path-input');
                    if (input) input.value = newPath;
                }
                refreshPathDisplay();
                await syncDriveFilesToMainList();
                setStatus(`✅ 已切换到 ${newPath}`, 'success');
                return;
            }

            setStatus(`正在检测新目录…`);
            const newProbe = await probeFolder(newParts);

            // 4b. 弹窗确认
            setStatus(`旧目录有 ${oldProbe.count} 个文件，请确认操作…`);
            const choice = await showSwitchDialog({
                oldPath, newPath,
                oldCount: oldProbe.count,
                newCount: newProbe.count
            });

            if (choice === 'cancel') {
                if (uiRoot) {
                    const input = uiRoot.querySelector('.gdrive-path-input');
                    if (input) input.value = oldPath;
                }
                refreshPathDisplay();
                setStatus('已取消路径切换', 'warn');
                return;
            }

            // 4c. 保存新路径
            saveFavoritesFolderPath(newPathInput);
            if (uiRoot) {
                const input = uiRoot.querySelector('.gdrive-path-input');
                if (input) input.value = newPath;
            }
            refreshPathDisplay();

            // 4d. 根据选择迁移或跳过
            if (choice === 'migrate') {
                setStatus(`正在迁移 ${oldProbe.count} 个文件到 ${newPath}…`);
                const result = await migrateFilesBetween(oldParts, newParts);
                if (result.fail === 0) {
                    setStatus(`✅ 迁移完成：${result.ok} 个文件已移动到 ${newPath}`, 'success');
                } else {
                    setStatus(`迁移部分完成：成功 ${result.ok}，失败 ${result.fail}`, 'warn');
                }
            } else {
                setStatus(`已切换到 ${newPath}（旧文件保留在原目录）`, 'success');
            }

            await syncDriveFilesToMainList();
        } catch (e) {
            setStatus('切换失败：' + e.message, 'error');
        } finally {
            state.switching = false;
        }
    }

    // ==================== 兜底迁移：legacyFolderPath → 当前路径 ====================
    async function migrateLegacyFiles() {
        if (state.migrating) return;

        const currentParts = getFavoritesFolderPath();
        const legacyParts = CONFIG.legacyFolderPath;

        if (pathKey(currentParts) === pathKey(legacyParts)) {
            setStatus('当前路径即旧路径，无需迁移。', 'warn');
            return;
        }

        state.migrating = true;
        if (uiRoot) {
            const btn = uiRoot.querySelector('.gdrive-migrate');
            if (btn) { btn.disabled = true; btn.textContent = '迁移中…'; }
        }

        try {
            setStatus(`正在从 ${pathKey(legacyParts)} 迁移到 ${pathKey(currentParts)}…`);
            const result = await migrateFilesBetween(legacyParts, currentParts);

            if (result.skipped) {
                setStatus(`旧目录 ${pathKey(legacyParts)} 为空或不存在，无需迁移。`, 'warn');
            } else if (result.fail === 0) {
                setStatus(`✅ 迁移完成：${result.ok} 个文件已移动到 ${pathKey(currentParts)}`, 'success');
                try { localStorage.setItem(KEY_MIGRATED, '1'); } catch (e) {}
            } else {
                setStatus(`迁移部分完成：成功 ${result.ok}，失败 ${result.fail}`, 'warn');
            }

            await syncDriveFilesToMainList();
        } catch (e) {
            setStatus('迁移失败：' + e.message, 'error');
        } finally {
            state.migrating = false;
            if (uiRoot) {
                const btn = uiRoot.querySelector('.gdrive-migrate');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = '迁移旧文件';
                    if (localStorage.getItem(KEY_MIGRATED) === '1') btn.classList.add('hidden');
                }
            }
        }
    }

    // ==================== 同步列表 ====================
    async function syncDriveFilesToMainList() {
        const ext = window.MP3AppExtension;
        if (!ext) { setStatus('主应用未就绪', 'error'); return; }

        try {
            const folderPath = getFavoritesFolderPath();
            setStatus(`正在加载 ${pathKey(folderPath)} 音乐列表…`);
            const folderId = await ensureNestedFolder(folderPath, KEY_FAV_FOLDER_ID);
            const q = encodeURIComponent(
                `'${folderId}' in parents and trashed=false and (mimeType='audio/mpeg' or name contains '.mp3')`
            );
            const res = await driveFetch(
                `https://www.googleapis.com/drive/v3/files?q=${q}` +
                `&fields=files(id,name,size,modifiedTime)&pageSize=1000&orderBy=modifiedTime desc`
            );
            if (!res.ok) throw new Error('读取 Drive 列表失败');
            const data = await res.json();
            state.driveFiles = data.files || [];

            const likedMap = ext.getLikedMap ? ext.getLikedMap() : {};
            const dislikeMap = ext.getDislikedMap ? ext.getDislikedMap() : {};

            const driveFiles = state.driveFiles.map(f => {
                const key = `[Drive] ${f.name}`;
                return {
                    filename: f.name,
                    displayName: f.name,
                    relativePath: key,
                    size: Number(f.size) || 0,
                    category: CONFIG.driveCategoryName,
                    isLiked: !!likedMap[key],
                    isDisliked: !!dislikeMap[key],
                    tags: ['gdrive'],
                    _source: 'gdrive',
                    _driveFileId: f.id
                };
            });

            const localFiles = ext.allFiles.filter(f => f._source !== 'gdrive');
            ext.allFiles = [...localFiles, ...driveFiles];

            if (!ext.categories.includes(CONFIG.driveCategoryName)) {
                ext.categories.push(CONFIG.driveCategoryName);
                ext.saveCategories(ext.categories);
            }

            ext.renderAll();
            setStatus(`✅ 已加载 ${driveFiles.length} 首（${pathKey(folderPath)}）`, 'success');
        } catch (e) {
            setStatus('加载 Drive 音乐失败：' + e.message, 'error');
        }
    }

    // ==================== 数据源处理器 ====================
    function registerDataSource() {
        window.MP3DataSourceHandlers = window.MP3DataSourceHandlers || {};
        window.MP3DataSourceHandlers['gdrive'] = {
            reset() {
                if (state.currentBlobUrl) {
                    try { URL.revokeObjectURL(state.currentBlobUrl); } catch (e) {}
                    state.currentBlobUrl = null;
                }
            },
            play: async (file) => {
                const ext = window.MP3AppExtension;
                if (!ext) return;

                if (ext.currentPlayingFile === file.relativePath &&
                    state.currentBlobUrl && ext.audioPlayer.src === state.currentBlobUrl) {
                    if (ext.audioPlayer.paused) ext.audioPlayer.play();
                    else ext.audioPlayer.pause();
                    ext.updatePlayButton();
                    return;
                }

                try {
                    setStatus('正在加载 Drive 音频…');
                    const res = await driveFetch(
                        `https://www.googleapis.com/drive/v3/files/${file._driveFileId}?alt=media`
                    );
                    if (!res.ok) throw new Error('下载失败');
                    const blob = await res.blob();

                    if (state.currentBlobUrl) {
                        try { URL.revokeObjectURL(state.currentBlobUrl); } catch (e) {}
                    }
                    state.currentBlobUrl = URL.createObjectURL(blob);

                    ext.audioPlayer.src = state.currentBlobUrl;
                    await ext.audioPlayer.play();
                    ext.currentPlayingFile = file.relativePath;

                    document.getElementById('currentSongTitle').innerText = file.displayName;
                    document.getElementById('currentSongCategory').innerText = file.category;

                    if (typeof window.MP3SetPlayerSourceBadge === 'function') {
                        window.MP3SetPlayerSourceBadge(file);
                    }

                    ext.updatePlayerLikeState();
                    ext.updatePlayerDislikeState();
                    ext.renderTable();
                    ext.updatePlayButton();

                    setStatus('▶️ ' + file.displayName, 'success');
                } catch (e) {
                    setStatus('播放失败：' + e.message, 'error');
                }
            }
        };
    }

    // ==================== UI ====================
    function refreshPathDisplay() {
        if (!uiRoot) return;
        const currentPath = pathKey(getFavoritesFolderPath());
        const pathText = uiRoot.querySelector('.gdrive-path-text');
        if (pathText) pathText.textContent = currentPath;
        const input = uiRoot.querySelector('.gdrive-path-input');
        if (input && document.activeElement !== input) input.value = currentPath;
        const migrateBtn = uiRoot.querySelector('.gdrive-migrate');
        if (migrateBtn) {
            migrateBtn.title = `把 ${pathKey(CONFIG.legacyFolderPath)} 的文件移到 ${currentPath}`;
        }
    }

    function injectUI() {
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
            ? window.MP3PluginManager.getBodyContainer('gdrive')
            : null;
        if (!body) { setTimeout(injectUI, 300); return; }
        if (uiRoot) return;

        uiRoot = document.createElement('div');
        uiRoot.className = 'space-y-1.5';

        const folderPathText = pathKey(getFavoritesFolderPath());
        const legacyPathText = pathKey(CONFIG.legacyFolderPath);
        const shouldShowMigrate = localStorage.getItem(KEY_MIGRATED) !== '1';

        uiRoot.innerHTML = `
            <p class="text-[10px] text-slate-500 leading-relaxed">
                音乐合并到主列表「${CONFIG.driveCategoryName}」，从 Drive 的
                <code class="gdrive-path-text text-indigo-300">${folderPathText}</code>
                加载。登录会记住。
            </p>
            <div class="flex items-center gap-1">
                <input type="text"
                    class="gdrive-path-input flex-1 bg-slate-800 border border-slate-700 text-[10px] rounded px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-200"
                    placeholder="${pathKey(DEFAULT_FAV_PATH)}"
                    value="${folderPathText}"
                    title="自定义 favorite 目录，如 apps/music/fav 或 my/music">
                <button class="gdrive-path-save px-2 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 rounded text-[10px] transition shrink-0"
                    title="保存并刷新">保存</button>
            </div>
            <button class="gdrive-auth w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-[11px] font-medium transition shadow-sm">
                <i class="fa-solid fa-right-to-bracket mr-1"></i>授权 Google Drive
            </button>
            <div class="gdrive-actions hidden space-y-1">
                <button class="gdrive-sync w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-[11px] font-medium transition shadow-sm">
                    <i class="fa-solid fa-rotate mr-1"></i>刷新 Drive 音乐
                </button>
                <div class="grid grid-cols-2 gap-1">
                    <button class="gdrive-backup bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg text-[11px] font-medium transition">
                        <i class="fa-solid fa-cloud-arrow-up mr-0.5"></i>备份
                    </button>
                    <button class="gdrive-restore bg-amber-600 hover:bg-amber-500 text-white py-1.5 rounded-lg text-[11px] font-medium transition">
                        <i class="fa-solid fa-cloud-arrow-down mr-0.5"></i>恢复
                    </button>
                </div>
                <button class="gdrive-upload-favorites w-full bg-rose-600 hover:bg-rose-500 text-white py-1.5 rounded-lg text-[11px] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fa-solid fa-heart mr-1"></i>上传我的最愛到 Drive
                </button>
                <button class="gdrive-migrate w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg text-[11px] font-medium transition border border-slate-700 ${shouldShowMigrate ? '' : 'hidden'}"
                    title="把 ${legacyPathText} 的文件移到 ${folderPathText}">
                    <i class="fa-solid fa-arrow-right-arrow-left mr-1"></i>迁移旧文件（${legacyPathText}）
                </button>
            </div>
            <p class="gdrive-status text-[10px] text-slate-500 min-h-[0.75rem] break-all"></p>
        `;
        body.appendChild(uiRoot);

        const pathInput = uiRoot.querySelector('.gdrive-path-input');
        const pathSaveBtn = uiRoot.querySelector('.gdrive-path-save');

        pathSaveBtn.addEventListener('click', () => handlePathSave(pathInput.value));
        pathInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); handlePathSave(pathInput.value); }
        });

        uiRoot.querySelector('.gdrive-auth').addEventListener('click', async () => {
            if (!CONFIG.clientId) {
                setStatus('未配置 window.MP3GoogleDriveConfig.clientId', 'error');
                return;
            }
            setStatus('正在打开 Google 授权窗口…');
            try {
                await ensureTokenClient();
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (e) {
                setStatus('授权失败：' + e.message, 'error');
            }
        });
        uiRoot.querySelector('.gdrive-sync').addEventListener('click', () => syncDriveFilesToMainList());
        uiRoot.querySelector('.gdrive-backup').addEventListener('click', () => backupToDrive());
        uiRoot.querySelector('.gdrive-restore').addEventListener('click', () => restoreFromDrive());
        uiRoot.querySelector('.gdrive-upload-favorites').addEventListener('click', () => uploadFavoritesToDrive());
        uiRoot.querySelector('.gdrive-migrate').addEventListener('click', () => migrateLegacyFiles());
    }

    function showAuthedUI() {
        if (!uiRoot) return;
        uiRoot.querySelector('.gdrive-auth').classList.add('hidden');
        uiRoot.querySelector('.gdrive-actions').classList.remove('hidden');
    }
    function resetAuthUI() {
        state.authorized = false;
        state.driveFiles = [];
        if (!uiRoot) return;
        uiRoot.querySelector('.gdrive-auth').classList.remove('hidden');
        uiRoot.querySelector('.gdrive-actions').classList.add('hidden');
    }

    // ==================== 备份 / 恢复 ====================
    function collectBackupData() {
        const payload = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('mp3_') && !EXCLUDED_BACKUP_KEYS.has(key) && !key.startsWith('mp3_gdrive_')) {
                payload[key] = localStorage.getItem(key);
            }
        }
        return { version: 2, exportedAt: new Date().toISOString(), data: payload };
    }

    async function backupToDrive() {
        if (!state.authorized) { setStatus('请先授权。', 'warn'); return; }
        setStatus('正在收集本地数据…');
        const backup = collectBackupData();
        const json = JSON.stringify(backup, null, 2);

        const q = encodeURIComponent(
            `name='${CONFIG.backupFileName}' and 'appDataFolder' in parents and trashed=false`
        );
        let existingId = null;
        try {
            const listRes = await driveFetch(
                `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`
            );
            const listData = await listRes.json();
            if (listData.files && listData.files.length > 0) existingId = listData.files[0].id;
        } catch (e) {}

        try {
            setStatus('正在上传备份…');
            let res;
            if (existingId) {
                res = await driveFetch(
                    `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`,
                    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: json }
                );
            } else {
                const boundary = '----mp3gdrive' + Date.now();
                const delimiter = '\r\n--' + boundary + '\r\n';
                const closeDelim = '\r\n--' + boundary + '--';
                const metadata = { name: CONFIG.backupFileName, mimeType: 'application/json', parents: ['appDataFolder'] };
                const body =
                    delimiter +
                    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    json + closeDelim;
                res = await driveFetch(
                    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                    { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body }
                );
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error ? err.error.message : res.statusText);
            }
            setStatus(`✅ 备份完成（${Object.keys(backup.data).length} 项数据）`, 'success');
        } catch (e) {
            setStatus('备份失败：' + e.message, 'error');
        }
    }

    async function restoreFromDrive() {
        if (!state.authorized) { setStatus('请先授权。', 'warn'); return; }
        if (!window.confirm('从 Drive 恢复会覆盖本机同名的 mp3_* 数据。是否继续？')) return;

        try {
            setStatus('正在查找备份…');
            const q = encodeURIComponent(
                `name='${CONFIG.backupFileName}' and 'appDataFolder' in parents and trashed=false`
            );
            const listRes = await driveFetch(
                `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`
            );
            const listData = await listRes.json();
            if (!listData.files || listData.files.length === 0) {
                setStatus('未找到备份文件', 'warn');
                return;
            }
            const res = await driveFetch(
                `https://www.googleapis.com/drive/v3/files/${listData.files[0].id}?alt=media`
            );
            if (!res.ok) throw new Error('下载失败');
            const parsed = JSON.parse(await res.text());
            if (!parsed.data) throw new Error('备份文件格式不正确');

            let count = 0;
            Object.keys(parsed.data).forEach(key => {
                if (key.startsWith('mp3_') && !EXCLUDED_BACKUP_KEYS.has(key) && !key.startsWith('mp3_gdrive_')) {
                    localStorage.setItem(key, parsed.data[key]);
                    count++;
                }
            });
            setStatus(`✅ 已恢复 ${count} 项数据，正在刷新…`, 'success');
            refreshPathDisplay();
            setTimeout(() => {
                if (typeof window.loadFiles === 'function') window.loadFiles(false);
                else window.location.reload();
            }, 800);
        } catch (e) {
            setStatus('恢复失败：' + e.message, 'error');
        }
    }

    // ==================== 上传 MP3 ====================
    async function uploadBlobToDrive(blob, filename, parentId) {
        const initRes = await driveFetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'X-Upload-Content-Type': 'audio/mpeg',
                    'X-Upload-Content-Length': String(blob.size)
                },
                body: JSON.stringify({ name: filename, mimeType: 'audio/mpeg', parents: [parentId] })
            }
        );
        if (!initRes.ok) {
            const err = await initRes.json().catch(() => ({}));
            throw new Error(err.error ? err.error.message : '初始化上传失败');
        }
        const uploadUrl = initRes.headers.get('Location');
        if (!uploadUrl) throw new Error('未获取上传地址');
        const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'audio/mpeg' },
            body: blob
        });
        if (!putRes.ok) {
            const err = await putRes.json().catch(() => ({}));
            throw new Error(err.error ? err.error.message : '上传失败 HTTP ' + putRes.status);
        }
        return putRes.json();
    }

    async function uploadFavoritesToDrive() {
        if (!state.authorized) { setStatus('请先授权。', 'warn'); return; }
        if (state.uploadingFavorites) { setStatus('已有上传任务…', 'warn'); return; }

        const likedMap = typeof window.getLikedMap === 'function' ? window.getLikedMap() : {};
        const likedKeys = Object.keys(likedMap);
        if (likedKeys.length === 0) { setStatus('「我的最愛」为空。', 'warn'); return; }

        const dirInput = document.getElementById('dirInput');
        const sourceDir = dirInput ? dirInput.value.trim() : (window.MP3GetCurrentDir ? window.MP3GetCurrentDir() : '');
        if (!sourceDir) { setStatus('请先输入资料夹路径。', 'warn'); return; }

        const folderPath = getFavoritesFolderPath();
        const pathText = pathKey(folderPath);
        if (!window.confirm(`即将上传 ${likedKeys.length} 首到 Drive 的 ${pathText} 目录。\n同名文件会跳过。继续？`)) return;

        state.uploadingFavorites = true;
        const favBtn = uiRoot.querySelector('.gdrive-upload-favorites');
        favBtn.disabled = true;

        try {
            setStatus(`正在准备 Drive 目录 ${pathText}…`);
            let favFolderId;
            try {
                favFolderId = await ensureNestedFolder(folderPath, KEY_FAV_FOLDER_ID);
            } catch (e) {
                setStatus('创建目录失败：' + e.message, 'error');
                return;
            }

            setStatus('正在读取 Drive 现有文件…');
            const existingNames = new Set();
            try {
                const q = encodeURIComponent(`'${favFolderId}' in parents and trashed=false`);
                const listRes = await driveFetch(
                    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1000`
                );
                const listData = await listRes.json();
                (listData.files || []).forEach(f => existingNames.add(f.name));
            } catch (e) {}

            let successCount = 0, skipCount = 0, failCount = 0;
            const failures = [];

            for (let i = 0; i < likedKeys.length; i++) {
                const key = likedKeys[i];
                const filename = sanitizeFilename(key);
                if (existingNames.has(filename)) {
                    skipCount++;
                    setStatus(`(${i + 1}/${likedKeys.length}) 跳过：${filename}`, 'warn');
                    continue;
                }
                setStatus(`(${i + 1}/${likedKeys.length}) 上传：${filename}…`);
                try {
                    const apiBase = window.MP3GetMp3ApiBase ? window.MP3GetMp3ApiBase() : '/api/mp3';
                    const streamUrl =
                        `${apiBase}?dir=${encodeURIComponent(sourceDir)}` +
                        `&action=stream&filename=${encodeURIComponent(key)}`;
                    const fileRes = await fetch(streamUrl);
                    if (!fileRes.ok) throw new Error(`获取文件失败 HTTP ${fileRes.status}`);
                    const blob = await fileRes.blob();
                    if (!blob || blob.size === 0) throw new Error('文件内容为空');
                    await uploadBlobToDrive(blob, filename, favFolderId);
                    successCount++;
                    existingNames.add(filename);
                } catch (e) {
                    failCount++;
                    failures.push({ filename, error: e.message });
                }
                await new Promise(r => setTimeout(r, 30));
            }

            const summary = `✅ 完成。成功 ${successCount}，跳过 ${skipCount}，失败 ${failCount}。`;
            setStatus(summary, failCount > 0 ? 'warn' : 'success');
            if (failures.length > 0) {
                window.alert(summary + '\n\n失败：\n' + failures.map(f => `• ${f.filename}: ${f.error}`).join('\n'));
            }
            syncDriveFilesToMainList().catch(() => {});
        } finally {
            state.uploadingFavorites = false;
            favBtn.disabled = false;
        }
    }

    // ==================== 对外 API ====================
    window.MP3GoogleDrivePlugin = {
        version: '3.3.0',
        async init() {
            registerDataSource();
            injectUI();
            await new Promise(r => setTimeout(r, 50));
            if (!CONFIG.clientId) {
                setStatus('未配置 window.MP3GoogleDriveConfig.clientId', 'error');
                return;
            }
            await tryRestoreSession();
        },
        async unload() {
            const ext = window.MP3AppExtension;

            if (state.currentBlobUrl) {
                try { URL.revokeObjectURL(state.currentBlobUrl); } catch (e) {}
                state.currentBlobUrl = null;
            }

            if (ext) {
                const playingKey = ext.currentPlayingFile;
                const isPlayingGdrive = playingKey && String(playingKey).startsWith('[Drive]');

                ext.allFiles = ext.allFiles.filter(f => f._source !== 'gdrive');
                ext.categories = ext.categories.filter(c => c !== CONFIG.driveCategoryName);
                ext.saveCategories(ext.categories);

                if (isPlayingGdrive) {
                    try { ext.audioPlayer.pause(); } catch (e) {}
                    ext.audioPlayer.removeAttribute('src');
                    try { ext.audioPlayer.load(); } catch (e) {}
                    ext.currentPlayingFile = null;

                    const titleEl = document.getElementById('currentSongTitle');
                    const catEl = document.getElementById('currentSongCategory');
                    if (titleEl) titleEl.innerText = '尚未選擇播放歌曲';
                    if (catEl) catEl.innerText = '就緒';
                    if (typeof window.MP3SetPlayerSourceBadge === 'function') {
                        window.MP3SetPlayerSourceBadge(null);
                    }
                }

                ext.updatePlayButton();
                ext.updatePlayerLikeState();
                ext.updatePlayerDislikeState();
                ext.renderAll();
            }

            if (window.MP3DataSourceHandlers) delete window.MP3DataSourceHandlers['gdrive'];

            if (uiRoot) {
                uiRoot.remove();
                uiRoot = null;
            }

            if (typeof window.refreshSourceFilterOptions === 'function') {
                window.refreshSourceFilterOptions();
            }

            state.authorized = false;
            state.driveFiles = [];
            state.uploadingFavorites = false;
            state.migrating = false;
            state.switching = false;
            accessToken = null;
            tokenClient = null;
        },
        getFavoritesPath: () => pathKey(getFavoritesFolderPath())
    };
})();