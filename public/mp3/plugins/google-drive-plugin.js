/**
 * Google Drive 扩展插件 v4.2（Player-agnostic）
 *
 * 职责边界：
 *  - OAuth 授权 / Drive 列表 / 上传 / 迁移 / 备份
 *  - resolveMedia：返回 { blob, mimeType }，由 core-player.native 负责播放
 *  - Blob LRU 缓存（5 首）+ 预加载下一首
 *
 * 不负责：
 *  - audioPlayer.src / createObjectURL / 播放  → core-player.native
 *  - currentPlayingFile / UI 同步              → 主程序
 *  - 数据清理（stopIfPlayingFrom）             → Core Adapter.unload
 */
window.MP3GoogleDriveConfig = {
    clientId: '802199089900-5n676d4hansnab5c66igukb1mch5m7m1.apps.googleusercontent.com'
};

(function () {
    'use strict';

    const CFG = window.MP3GoogleDriveConfig || {};
    const CONFIG = {
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
    const KEY_CLIENT_ID = NS + 'client_id';
    const KEY_FAV_FOLDER_ID = NS + 'fav_folder_id';
    const KEY_FAV_PATH = NS + 'fav_path';
    const KEY_MIGRATED = NS + 'fav_migrated';

    const DEFAULT_FAV_PATH = ['apps', 'music', 'fav'];
    const INVALID_PATH_CHARS = /[<>:"|?*\x00-\x1f]/;
    const LARGE_FILE_WARN = 500 * 1024 * 1024;

    const EXCLUDED_BACKUP_KEYS = new Set([
        KEY_TOKEN, KEY_CLIENT_ID, KEY_FAV_FOLDER_ID, KEY_FAV_PATH, KEY_MIGRATED
    ]);

    const state = {
        authorized: false,
        uploadingFavorites: false,
        uploadingLocalFiles: false,
        cancelLocalUpload: false,
        migrating: false,
        switching: false
    };

    let accessToken = null;
    let tokenClient = null;
    let uiRoot = null;
    let adapterHandle = null;

    /* ==================== Blob LRU 缓存（存 blob 而非 URL） ==================== */

    const blobCache = new Map();       // fileId -> Blob
    const MAX_CACHE_SIZE = 5;

    function getCachedBlob(fileId) {
        const blob = blobCache.get(fileId);
        if (!blob) return null;
        // LRU：命中时移到末尾
        blobCache.delete(fileId);
        blobCache.set(fileId, blob);
        return blob;
    }

    function setCachedBlob(fileId, blob) {
        if (!blob) return;
        if (blobCache.has(fileId)) blobCache.delete(fileId);
        blobCache.set(fileId, blob);
        while (blobCache.size > MAX_CACHE_SIZE) {
            const firstKey = blobCache.keys().next().value;
            blobCache.delete(firstKey);
        }
    }

    function clearBlobCache() {
        blobCache.clear();
    }

    /* ==================== 预加载下一首 ==================== */

    let prefetchTimer = null;

    function schedulePrefetchNext() {
        if (prefetchTimer) clearTimeout(prefetchTimer);
        prefetchTimer = setTimeout(() => {
            prefetchTimer = null;
            prefetchNextDriveFile().catch(() => {});
        }, 3000);
    }

    async function prefetchNextDriveFile() {
        if (!state.authorized) return;
        const ext = window.MP3AppExtension;
        if (!ext || !ext.currentPlayingFile) return;

        const cur = ext.allFiles.find(f => ext.getFileKey(f) === ext.currentPlayingFile);
        if (!cur || cur._source !== 'gdrive') return;

        const driveFiles = ext.allFiles.filter(f => f._source === 'gdrive');
        if (driveFiles.length < 2) return;

        const idx = driveFiles.findIndex(f => ext.getFileKey(f) === ext.currentPlayingFile);
        if (idx < 0) return;

        const next = driveFiles[(idx + 1) % driveFiles.length];
        if (!next || !next._driveFileId) return;
        if (getCachedBlob(next._driveFileId)) return;

        try {
            const res = await driveFetch(
                `https://www.googleapis.com/drive/v3/files/${next._driveFileId}?alt=media`
            );
            if (!res.ok) return;
            const blob = await res.blob();
            setCachedBlob(next._driveFileId, blob);
            console.log('[GDrive] 预加载完成:', next.displayName);
        } catch (e) {
            // 静默失败
        }
    }

    /* ==================== 基础辅助 ==================== */

    function escapeHtml(s) {
        if (typeof window.escapeHtmlAttr === 'function') return window.escapeHtmlAttr(s);
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

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

    function formatBytes(bytes) {
        if (!bytes || bytes < 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
        return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
    }

    function sanitizeFilename(key) {
        const parts = String(key).split(/[\/\\]/);
        let name = parts[parts.length - 1] || 'untitled.mp3';
        if (!/\.mp3$/i.test(name)) name += '.mp3';
        return name;
    }

    function pathKey(parts) { return parts.join('/'); }

    /* ==================== 弹窗辅助 ==================== */

    function showPluginConfirm({ title, message, confirmText = '确定', type = 'confirm' }) {
        if (typeof window.showCustomModal === 'function') {
            return window.showCustomModal({
                title, subtitle: '请确认操作', message: escapeHtml(message), type, confirmText
            });
        }
        return fallbackConfirm({ title, message, confirmText, type, needsCancel: true });
    }

    function showPluginAlert({ title, message, type = 'info', confirmText = '知道了' }) {
        if (typeof window.showCustomModal === 'function') {
            return window.showCustomModal({
                title, subtitle: '提示', message: escapeHtml(message), type, confirmText
            });
        }
        return fallbackConfirm({ title, message, confirmText, type, needsCancel: false });
    }

    function fallbackConfirm({ title, message, confirmText, type, needsCancel }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4';
            const iconBgMap = {
                danger: 'bg-rose-500/20 text-rose-400', error: 'bg-rose-500/20 text-rose-400',
                success: 'bg-emerald-500/20 text-emerald-400', warning: 'bg-amber-500/20 text-amber-400',
                info: 'bg-indigo-500/20 text-indigo-400', confirm: 'bg-indigo-500/20 text-indigo-400'
            };
            const iconClsMap = {
                danger: 'fa-triangle-exclamation', error: 'fa-triangle-exclamation',
                success: 'fa-circle-check', warning: 'fa-circle-exclamation',
                info: 'fa-circle-info', confirm: 'fa-circle-question'
            };
            const btnClsMap = {
                danger: 'bg-rose-600 hover:bg-rose-500', error: 'bg-rose-600 hover:bg-rose-500',
                success: 'bg-emerald-600 hover:bg-emerald-500', warning: 'bg-amber-600 hover:bg-amber-500',
                info: 'bg-indigo-600 hover:bg-indigo-500', confirm: 'bg-indigo-600 hover:bg-indigo-500'
            };
            const iconBg = iconBgMap[type] || iconBgMap.info;
            const iconCls = iconClsMap[type] || iconClsMap.info;
            const btnCls = btnClsMap[type] || btnClsMap.info;

            overlay.innerHTML = `
                <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
                    <div class="flex items-start gap-3 mb-4">
                        <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0">
                            <i class="fa-solid ${iconCls} text-base"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="text-sm font-bold text-slate-100 mb-1">${escapeHtml(title)}</h3>
                            <p class="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line">${escapeHtml(message)}</p>
                        </div>
                    </div>
                    <div class="flex items-center justify-end gap-2">
                        ${needsCancel ? `<button data-action="cancel" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition">取消</button>` : ''}
                        <button data-action="confirm" class="px-4 py-2 ${btnCls} text-white rounded-lg text-[11px] font-medium transition shadow-sm">${escapeHtml(confirmText)}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    overlay.remove();
                    resolve(action === 'confirm');
                });
            });
        });
    }

    /* ==================== Client ID / Token ==================== */

    function getClientId() {
        try {
            const saved = localStorage.getItem(KEY_CLIENT_ID);
            if (saved && saved.trim()) return saved.trim();
        } catch (e) {}
        if (CFG.clientId && CFG.clientId.trim()) {
            const v = CFG.clientId.trim();
            if (!/^YOUR_|placeholder/i.test(v)) return v;
        }
        return '';
    }

    function saveClientId(id) {
        const trimmed = String(id || '').trim();
        if (!trimmed) {
            try { localStorage.removeItem(KEY_CLIENT_ID); } catch (e) {}
            return '';
        }
        if (!/\.apps\.googleusercontent\.com$/.test(trimmed)) {
            throw new Error('格式不正确，应以 .apps.googleusercontent.com 结尾');
        }
        try { localStorage.setItem(KEY_CLIENT_ID, trimmed); } catch (e) {}
        return trimmed;
    }

    /* ==================== 路径配置 ==================== */

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
            if (INVALID_PATH_CHARS.test(p)) return `路径段 "${p}" 含非法字符`;
            if (p === '.' || p === '..') return `路径段 "${p}" 无效`;
        }
        return null;
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

    function readFolderCache(cacheKey, expectedPath) {
        try {
            const raw = localStorage.getItem(cacheKey);
            if (!raw) return null;
            let obj; try { obj = JSON.parse(raw); } catch (e) { obj = null; }
            if (!obj || typeof obj !== 'object' || !obj.id) { localStorage.removeItem(cacheKey); return null; }
            if (obj.path !== expectedPath) { localStorage.removeItem(cacheKey); return null; }
            return obj.id;
        } catch (e) { return null; }
    }
    function writeFolderCache(cacheKey, path, id) {
        try { localStorage.setItem(cacheKey, JSON.stringify({ path, id })); } catch (e) {}
    }

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
        const clientId = getClientId();
        if (!clientId) throw new Error('未配置 Client ID');
        await loadGisScript();
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
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
                adapterHandle?.refresh().catch(() => {});
            }
        });
    }

    async function tryRestoreSession() {
        const clientId = getClientId();
        if (!clientId) { refreshUI(); return false; }
        const cached = loadCachedToken();
        if (cached) {
            accessToken = cached;
            state.authorized = true;
            showAuthedUI();
            setStatus('✅ 已恢复之前的授权', 'success');
            adapterHandle?.refresh().catch(() => {});
            return true;
        }
        try {
            await ensureTokenClient();
            tokenClient.requestAccessToken({ prompt: '' });
        } catch (e) { console.warn('[GDrive] 静默刷新失败:', e); }
        return false;
    }

    async function driveFetch(url, options = {}) {
        if (!accessToken) throw new Error('尚未授权');
        const headers = Object.assign({}, options.headers, { 'Authorization': 'Bearer ' + accessToken });
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

    /* ==================== Drive API 辅助 ==================== */

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
        for (const name of pathParts) parentId = await ensureFolder(name, parentId);
        if (cacheKey) writeFolderCache(cacheKey, expectedPath, parentId);
        return parentId;
    }

    async function listSubFolders(parentId) {
        const q = encodeURIComponent(`'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
        const res = await driveFetch(
            `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&orderBy=name&pageSize=200`
        );
        if (!res.ok) throw new Error('列出子文件夹失败');
        const data = await res.json();
        return data.files || [];
    }

    async function resolveFolderIdByPath(pathParts) {
        let parentId = 'root';
        const resolvedParts = [];
        for (const name of pathParts) {
            const q = encodeURIComponent(
                `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
            );
            const res = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`);
            const data = await res.json();
            if (!data.files || data.files.length === 0) return { id: null, resolvedParts };
            parentId = data.files[0].id;
            resolvedParts.push(name);
        }
        return { id: parentId, resolvedParts };
    }

    async function createFolderIn(parentId, name) {
        const res = await driveFetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error ? err.error.message : '创建文件夹失败');
        }
        return (await res.json()).id;
    }

    /* ==================== 文件夹浏览器 ==================== */

    function openFolderBrowser(initialPathParts) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4';
            document.body.appendChild(overlay);
            const browserState = { stack: [{ id: 'root', name: '我的雲端硬碟' }], currentId: 'root', folders: [], loading: true, error: null };

            function close(result) { overlay.remove(); resolve(result); }

            async function loadFolders() {
                browserState.loading = true; browserState.error = null; render();
                try { browserState.folders = await listSubFolders(browserState.currentId); }
                catch (e) { browserState.error = e.message; browserState.folders = []; }
                finally { browserState.loading = false; render(); }
            }

            function render() {
                const breadcrumbsHtml = browserState.stack.map((item, i) => {
                    const isLast = i === browserState.stack.length - 1;
                    const sep = i > 0 ? '<i class="fa-solid fa-chevron-right text-[8px] text-slate-600 mx-1"></i>' : '';
                    if (isLast) return `${sep}<span class="text-indigo-400 font-medium">${escapeHtml(item.name)}</span>`;
                    return `${sep}<button class="breadcrumb-item text-slate-400 hover:text-indigo-300 transition" data-index="${i}">${escapeHtml(item.name)}</button>`;
                }).join('');

                let foldersHtml = '';
                if (browserState.loading) foldersHtml = `<div class="py-10 text-center text-slate-500 text-xs"><i class="fa-solid fa-spinner fa-spin mr-1.5"></i>加载中…</div>`;
                else if (browserState.error) foldersHtml = `<div class="py-10 text-center text-rose-400 text-xs px-4">${escapeHtml(browserState.error)}</div>`;
                else if (browserState.folders.length === 0) foldersHtml = `<div class="py-10 text-center text-slate-500 text-xs"><i class="fa-solid fa-folder-open text-3xl mb-2 block opacity-30"></i>此目录下没有子文件夹</div>`;
                else foldersHtml = browserState.folders.map(f => `
                    <button class="folder-item w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition flex items-center gap-2 group" data-id="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}">
                        <i class="fa-solid fa-folder text-amber-400"></i>
                        <span class="text-xs text-slate-200 truncate flex-1">${escapeHtml(f.name)}</span>
                        <i class="fa-solid fa-chevron-right text-[9px] text-slate-600 group-hover:text-slate-400"></i>
                    </button>
                `).join('');

                const pathPreview = browserState.stack.map(s => s.name).join(' / ');
                overlay.innerHTML = `
                    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col" style="max-height: 80vh;">
                        <div class="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
                            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                                <i class="fa-solid fa-folder-tree text-indigo-400"></i>选择目录
                            </h3>
                            <button class="browser-close text-slate-400 hover:text-white transition"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="px-4 py-2 border-b border-slate-800 shrink-0 bg-slate-950/40">
                            <div class="text-[11px] text-slate-400 flex items-center flex-wrap gap-0.5 leading-relaxed">${breadcrumbsHtml}</div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-2 space-y-0.5" style="min-height: 220px;">${foldersHtml}</div>
                        <div class="p-3 border-t border-slate-800 space-y-2 shrink-0">
                            <div class="text-[10px] text-slate-500 truncate" title="${escapeHtml(pathPreview)}">当前：<span class="text-slate-300">${escapeHtml(pathPreview)}</span></div>
                            <button class="browser-new-folder w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg text-[11px] transition">
                                <i class="fa-solid fa-folder-plus mr-1"></i>在此新建文件夹
                            </button>
                            <div class="flex gap-2">
                                <button class="browser-cancel flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg text-[11px] transition">取消</button>
                                <button class="browser-confirm flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-[11px] font-medium transition">
                                    <i class="fa-solid fa-check mr-1"></i>选择此目录
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                overlay.querySelectorAll('.breadcrumb-item').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.index, 10);
                        browserState.stack = browserState.stack.slice(0, idx + 1);
                        browserState.currentId = browserState.stack[idx].id;
                        loadFolders();
                    });
                });
                overlay.querySelectorAll('.folder-item').forEach(btn => {
                    btn.addEventListener('click', () => {
                        browserState.stack.push({ id: btn.dataset.id, name: btn.dataset.name });
                        browserState.currentId = btn.dataset.id;
                        loadFolders();
                    });
                });
                overlay.querySelector('.browser-close').addEventListener('click', () => close(null));
                overlay.querySelector('.browser-cancel').addEventListener('click', () => close(null));
                overlay.querySelector('.browser-confirm').addEventListener('click', () => {
                    const selectedPath = browserState.stack.slice(1).map(s => s.name);
                    close(selectedPath);
                });
                overlay.querySelector('.browser-new-folder').addEventListener('click', async () => {
                    const name = prompt('新建文件夹名称：');
                    if (!name || !name.trim()) return;
                    const trimmed = name.trim();
                    if (INVALID_PATH_CHARS.test(trimmed)) { alert('文件夹名称含非法字符'); return; }
                    try { await createFolderIn(browserState.currentId, trimmed); await loadFolders(); }
                    catch (e) { alert('创建失败：' + e.message); }
                });
            }

            (async () => {
                try {
                    if (initialPathParts && initialPathParts.length > 0) {
                        const resolved = await resolveFolderIdByPath(initialPathParts);
                        if (resolved.id && resolved.resolvedParts.length > 0) {
                            let pid = 'root';
                            browserState.stack = [{ id: 'root', name: '我的雲端硬碟' }];
                            for (const name of resolved.resolvedParts) {
                                const q = encodeURIComponent(
                                    `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${pid}' in parents and trashed=false`
                                );
                                const r = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`);
                                const d = await r.json();
                                if (!d.files || d.files.length === 0) break;
                                pid = d.files[0].id;
                                browserState.stack.push({ id: pid, name });
                            }
                            browserState.currentId = pid;
                        }
                    }
                } catch (e) {}
                await loadFolders();
            })();

            render();
        });
    }

    /* ==================== 迁移辅助 ==================== */

    async function probeFolder(pathParts) {
        try {
            const resolved = await resolveFolderIdByPath(pathParts);
            if (!resolved.id) return { exists: false, id: null, count: 0 };
            const q = encodeURIComponent(
                `'${resolved.id}' in parents and trashed=false and (mimeType='audio/mpeg' or name contains '.mp3')`
            );
            const countRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=1000`);
            const countData = await countRes.json();
            return { exists: true, id: resolved.id, count: (countData.files || []).length };
        } catch (e) {
            return { exists: false, id: null, count: 0 };
        }
    }

    async function migrateFilesBetween(oldPathParts, newPathParts) {
        const oldProbe = await probeFolder(oldPathParts);
        if (!oldProbe.exists || oldProbe.count === 0) return { ok: 0, fail: 0, skipped: true };
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
        return { ok, fail, total: files.length };
    }

    function showSwitchDialog({ oldPath, newPath, oldCount, newCount }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4';
            const warning = newCount > 0;
            const iconBg = warning ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400';
            const iconCls = warning ? 'fa-triangle-exclamation' : 'fa-folder-tree';
            let bodyMsg = '';
            if (warning) {
                bodyMsg = `旧目录 <code class="text-slate-200">${escapeHtml(oldPath)}</code> 有 <b class="text-amber-400">${oldCount}</b> 个文件，新目录 <code class="text-slate-200">${escapeHtml(newPath)}</code> 已有 <b class="text-amber-400">${newCount}</b> 个文件。<br>迁移后新旧文件会合并在新目录里。`;
            } else {
                bodyMsg = `旧目录 <code class="text-slate-200">${escapeHtml(oldPath)}</code> 有 <b class="text-indigo-400">${oldCount}</b> 个文件，新目录 <code class="text-slate-200">${escapeHtml(newPath)}</code> 为空。`;
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
                        <p><i class="fa-solid fa-arrow-right-to-bracket text-indigo-400 mr-1.5"></i><b class="text-slate-200">迁移并切换</b>：把旧文件移动到新目录</p>
                        <p><i class="fa-solid fa-arrow-right text-slate-400 mr-1.5"></i><b class="text-slate-200">直接切换</b>：旧文件留在原地</p>
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

    async function handlePathSave(newPathInput) {
        if (state.switching) return;
        let newParts;
        try {
            const raw = normalizePathParts(newPathInput);
            if (raw.length === 0) newParts = [...DEFAULT_FAV_PATH];
            else {
                const err = validatePathParts(raw);
                if (err) throw new Error(err);
                newParts = raw;
            }
        } catch (e) {
            setStatus('路径无效：' + e.message, 'error');
            return;
        }
        const oldParts = getFavoritesFolderPath();
        const oldPath = pathKey(oldParts);
        const newPath = pathKey(newParts);
        if (oldPath === newPath) {
            if (uiRoot) { const input = uiRoot.querySelector('.gdrive-path-input'); if (input) input.value = newPath; }
            setStatus(`路径未变化（${newPath}）`, 'warn');
            return;
        }
        if (!state.authorized) {
            saveFavoritesFolderPath(newPath);
            if (uiRoot) { const input = uiRoot.querySelector('.gdrive-path-input'); if (input) input.value = newPath; }
            refreshPathDisplay();
            setStatus(`路径已保存为 ${newPath}，授权后生效。`, 'success');
            return;
        }
        state.switching = true;
        try {
            setStatus('正在检测旧目录内容…');
            const oldProbe = await probeFolder(oldParts);
            if (!oldProbe.exists || oldProbe.count === 0) {
                saveFavoritesFolderPath(newPath);
                if (uiRoot) { const input = uiRoot.querySelector('.gdrive-path-input'); if (input) input.value = newPath; }
                refreshPathDisplay();
                await adapterHandle?.refresh();
                setStatus(`✅ 已切换到 ${newPath}`, 'success');
                return;
            }
            setStatus('正在检测新目录…');
            const newProbe = await probeFolder(newParts);
            setStatus(`旧目录有 ${oldProbe.count} 个文件，请确认操作…`);
            const choice = await showSwitchDialog({ oldPath, newPath, oldCount: oldProbe.count, newCount: newProbe.count });
            if (choice === 'cancel') {
                if (uiRoot) { const input = uiRoot.querySelector('.gdrive-path-input'); if (input) input.value = oldPath; }
                refreshPathDisplay();
                setStatus('已取消路径切换', 'warn');
                return;
            }
            saveFavoritesFolderPath(newPath);
            if (uiRoot) { const input = uiRoot.querySelector('.gdrive-path-input'); if (input) input.value = newPath; }
            refreshPathDisplay();
            if (choice === 'migrate') {
                setStatus(`正在迁移 ${oldProbe.count} 个文件到 ${newPath}…`);
                const result = await migrateFilesBetween(oldParts, newParts);
                if (result.fail === 0) setStatus(`✅ 迁移完成：${result.ok} 个文件已移动到 ${newPath}`, 'success');
                else setStatus(`迁移部分完成：成功 ${result.ok}，失败 ${result.fail}`, 'warn');
            } else {
                setStatus(`已切换到 ${newPath}（旧文件保留在原目录）`, 'success');
            }
            await adapterHandle?.refresh();
        } catch (e) {
            setStatus('切换失败：' + e.message, 'error');
        } finally {
            state.switching = false;
        }
    }

    async function migrateLegacyFiles() {
        if (state.migrating) return;
        const currentParts = getFavoritesFolderPath();
        const legacyParts = CONFIG.legacyFolderPath;
        if (pathKey(currentParts) === pathKey(legacyParts)) {
            setStatus('当前路径即旧路径，无需迁移。', 'warn');
            return;
        }
        state.migrating = true;
        if (uiRoot) { const btn = uiRoot.querySelector('.gdrive-migrate'); if (btn) { btn.disabled = true; btn.textContent = '迁移中…'; } }
        try {
            setStatus(`正在从 ${pathKey(legacyParts)} 迁移到 ${pathKey(currentParts)}…`);
            const result = await migrateFilesBetween(legacyParts, currentParts);
            if (result.skipped) setStatus(`旧目录 ${pathKey(legacyParts)} 为空或不存在，无需迁移。`, 'warn');
            else if (result.fail === 0) {
                setStatus(`✅ 迁移完成：${result.ok} 个文件已移动到 ${pathKey(currentParts)}`, 'success');
                try { localStorage.setItem(KEY_MIGRATED, '1'); } catch (e) {}
            } else setStatus(`迁移部分完成：成功 ${result.ok}，失败 ${result.fail}`, 'warn');
            await adapterHandle?.refresh();
        } catch (e) {
            setStatus('迁移失败：' + e.message, 'error');
        } finally {
            state.migrating = false;
            if (uiRoot) {
                const btn = uiRoot.querySelector('.gdrive-migrate');
                if (btn) {
                    btn.disabled = false; btn.textContent = '迁移旧文件';
                    if (localStorage.getItem(KEY_MIGRATED) === '1') btn.classList.add('hidden');
                }
            }
        }
    }

    /* ==================== Adapter 注册 ==================== */

    function registerAdapter() {
        adapterHandle = window.MP3RegisterSourceAdapter({
            id: 'gdrive',
            categoryName: CONFIG.driveCategoryName,
            onStatusChange: setStatus,

            list: async () => {
                if (!state.authorized) throw new Error('请先授权 Google Drive');
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
                const files = (data.files || []).map(f => ({
                    filename: f.name,
                    displayName: f.name,
                    relativePath: `[Drive] ${f.name}`,
                    size: Number(f.size) || 0,
                    category: CONFIG.driveCategoryName,
                    tags: ['gdrive'],
                    _driveFileId: f.id
                }));
                setStatus(`✅ 已加载 ${files.length} 首（${pathKey(folderPath)}）`, 'success');
                return { files, total: files.length, totalPages: 1 };
            },

            // ★ Player-agnostic：返回 { blob, mimeType }，由 core-player.native 处理播放
            resolveMedia: async (file) => {
                if (!state.authorized) throw new Error('请先授权 Google Drive');
                const fileId = file._driveFileId;

                // 命中缓存
                let blob = getCachedBlob(fileId);
                if (blob) {
                    setStatus('▶️ 从缓存加载…');
                } else {
                    setStatus('正在下载 Drive 音频…');
                    const res = await driveFetch(
                        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
                    );
                    if (!res.ok) throw new Error('下载失败 HTTP ' + res.status);
                    blob = await res.blob();
                    setCachedBlob(fileId, blob);
                }

                // 播放开始后延迟预加载下一首
                schedulePrefetchNext();

                return { blob, mimeType: 'audio/mpeg' };
            },

            // 只删 Drive 上的文件 + 清缓存；allFiles / 播放器清理交给 adapter
            delete: async (file) => {
                if (!state.authorized) throw new Error('请先授权 Google Drive');
                setStatus('正在从 Drive 删除：' + file.displayName + '…');
                const res = await driveFetch(
                    `https://www.googleapis.com/drive/v3/files/${file._driveFileId}`,
                    { method: 'DELETE' }
                );
                if (!res.ok && res.status !== 204) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error ? err.error.message : ('删除失败 HTTP ' + res.status));
                }
                blobCache.delete(file._driveFileId);
                setStatus('✅ 已从 Drive 删除：' + file.displayName, 'success');
            },

            // 切歌前：清预加载定时器（不清缓存，缓存要跨曲目保留）
            reset: () => {
                if (prefetchTimer) {
                    clearTimeout(prefetchTimer);
                    prefetchTimer = null;
                }
            },

            // 卸载时的本源特有清理（核心清理由 adapter.unload 负责）
            onUnload: () => {
                if (prefetchTimer) {
                    clearTimeout(prefetchTimer);
                    prefetchTimer = null;
                }
                clearBlobCache();
                state.authorized = false;
                state.uploadingFavorites = false;
                state.uploadingLocalFiles = false;
                state.cancelLocalUpload = false;
                state.migrating = false;
                state.switching = false;
                accessToken = null;
                tokenClient = null;
                if (uiRoot) { uiRoot.remove(); uiRoot = null; }
            }
        });
    }

    /* ==================== UI ==================== */

    function refreshPathDisplay() {
        if (!uiRoot) return;
        const currentPath = pathKey(getFavoritesFolderPath());
        const pathText = uiRoot.querySelector('.gdrive-path-text');
        if (pathText) pathText.textContent = currentPath;
        const input = uiRoot.querySelector('.gdrive-path-input');
        if (input && document.activeElement !== input) input.value = currentPath;
        const migrateBtn = uiRoot.querySelector('.gdrive-migrate');
        if (migrateBtn) migrateBtn.title = `把 ${pathKey(CONFIG.legacyFolderPath)} 的文件移到 ${currentPath}`;
    }

    function refreshUI() {
        if (!uiRoot) return;
        const clientId = getClientId();
        const setupEl = uiRoot.querySelector('.gdrive-client-setup');
        const mainEl = uiRoot.querySelector('.gdrive-main');
        const authBtn = uiRoot.querySelector('.gdrive-auth');
        if (!clientId) {
            if (setupEl) setupEl.classList.remove('hidden');
            if (mainEl) mainEl.classList.add('hidden');
            if (authBtn) authBtn.classList.add('hidden');
        } else {
            if (setupEl) setupEl.classList.add('hidden');
            if (mainEl) mainEl.classList.remove('hidden');
            if (!state.authorized && authBtn) authBtn.classList.remove('hidden');
        }
    }

    function showAuthedUI() {
        if (!uiRoot) return;
        uiRoot.querySelector('.gdrive-auth').classList.add('hidden');
        uiRoot.querySelector('.gdrive-actions').classList.remove('hidden');
    }
    function resetAuthUI() {
        state.authorized = false;
        if (!uiRoot) return;
        uiRoot.querySelector('.gdrive-auth').classList.remove('hidden');
        uiRoot.querySelector('.gdrive-actions').classList.add('hidden');
    }

    function injectUI() {
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
            ? window.MP3PluginManager.getBodyContainer('gdrive') : null;
        if (!body) { setTimeout(injectUI, 300); return; }
        if (uiRoot) return;

        uiRoot = document.createElement('div');
        uiRoot.className = 'space-y-1.5';

        const folderPathText = pathKey(getFavoritesFolderPath());
        const legacyPathText = pathKey(CONFIG.legacyFolderPath);
        const shouldShowMigrate = localStorage.getItem(KEY_MIGRATED) !== '1';
        const clientId = getClientId();

        uiRoot.innerHTML = `
            <div class="gdrive-client-setup ${clientId ? 'hidden' : ''} space-y-1.5 p-2 bg-amber-950/30 border border-amber-500/30 rounded-lg">
                <p class="text-[10px] text-amber-300 flex items-start gap-1 leading-relaxed">
                    <i class="fa-solid fa-key mt-0.5 shrink-0"></i>
                    <span>需要 Google OAuth Client ID 才能使用。填入后即可授权。</span>
                </p>
                <input type="text"
                    class="gdrive-client-input w-full bg-slate-800 border border-slate-700 text-[10px] rounded px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-200 font-mono"
                    placeholder="xxxxx.apps.googleusercontent.com">
                <button class="gdrive-client-save w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1 rounded text-[10px] font-medium transition">
                    <i class="fa-solid fa-check mr-1"></i>保存 Client ID
                </button>
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener"
                    class="block text-[10px] text-indigo-400 hover:text-indigo-300 underline text-center">
                    如何获取 Client ID →
                </a>
            </div>

            <div class="gdrive-main ${clientId ? '' : 'hidden'} space-y-1.5">
                <p class="text-[10px] text-slate-500 leading-relaxed">
                    音乐合并到主列表「${CONFIG.driveCategoryName}」，从 Drive 的
                    <code class="gdrive-path-text text-indigo-300">${folderPathText}</code>
                    加载。登录会记住。
                </p>
                <div class="flex items-center gap-1">
                    <div class="relative flex-1">
                        <input type="text"
                            class="gdrive-path-input w-full bg-slate-800 border border-slate-700 text-[10px] rounded pl-2 pr-8 py-1 focus:outline-none focus:border-indigo-500 text-slate-200"
                            placeholder="${pathKey(DEFAULT_FAV_PATH)}"
                            value="${folderPathText}"
                            title="自定义 favorite 目录，或点右侧文件夹图标浏览">
                        <button class="gdrive-path-browse absolute right-0.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-400 transition rounded" title="浏览目录">
                            <i class="fa-solid fa-folder-tree text-[10px]"></i>
                        </button>
                    </div>
                    <button class="gdrive-path-save px-2 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 rounded text-[10px] transition shrink-0"
                        title="保存并刷新">保存</button>
                </div>
                <button class="gdrive-auth ${clientId ? '' : 'hidden'} w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-[11px] font-medium transition shadow-sm">
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
                    <button class="gdrive-upload-local w-full bg-sky-600 hover:bg-sky-500 text-white py-1.5 rounded-lg text-[11px] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fa-solid fa-upload mr-1"></i>上传本地文件到 Drive
                    </button>
                    <button class="gdrive-cancel-upload hidden w-full bg-red-600 hover:bg-red-500 text-white py-1.5 rounded-lg text-[11px] font-medium transition">
                        <i class="fa-solid fa-stop mr-1"></i>取消上传
                    </button>
                    <button class="gdrive-migrate w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg text-[11px] font-medium transition border border-slate-700 ${shouldShowMigrate ? '' : 'hidden'}"
                        title="把 ${legacyPathText} 的文件移到 ${folderPathText}">
                        <i class="fa-solid fa-arrow-right-arrow-left mr-1"></i>迁移旧文件（${legacyPathText}）
                    </button>
                    <button class="gdrive-reset-client w-full text-[10px] text-slate-500 hover:text-slate-300 py-1 transition" title="清除已保存的 Client ID">
                        重置 Client ID
                    </button>
                    <button class="gdrive-reset-delete-prompt w-full text-[10px] text-slate-500 hover:text-slate-300 py-1 transition" title="重新启用删除确认提示">
                        重置删除确认提示
                    </button>
                </div>
            </div>

            <p class="gdrive-status text-[10px] text-slate-500 min-h-[0.75rem] break-all"></p>
        `;
        body.appendChild(uiRoot);

        const clientInput = uiRoot.querySelector('.gdrive-client-input');
        const clientSaveBtn = uiRoot.querySelector('.gdrive-client-save');

        async function saveClient() {
            try {
                const saved = saveClientId(clientInput.value);
                if (!saved) { setStatus('Client ID 不能为空', 'warn'); return; }
                refreshUI();
                setStatus('✅ Client ID 已保存，请点击「授权 Google Drive」', 'success');
                await tryRestoreSession();
            } catch (e) { setStatus('保存失败：' + e.message, 'error'); }
        }
        clientSaveBtn.addEventListener('click', saveClient);
        clientInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveClient(); } });

        const pathInput = uiRoot.querySelector('.gdrive-path-input');
        const pathSaveBtn = uiRoot.querySelector('.gdrive-path-save');
        const pathBrowseBtn = uiRoot.querySelector('.gdrive-path-browse');

        pathSaveBtn.addEventListener('click', () => handlePathSave(pathInput.value));
        pathInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handlePathSave(pathInput.value); } });
        pathBrowseBtn.addEventListener('click', async () => {
            if (!state.authorized) { setStatus('请先授权 Google Drive 再浏览目录', 'warn'); return; }
            try {
                const current = getFavoritesFolderPath();
                const selected = await openFolderBrowser(current);
                if (!selected) return;
                const newPath = pathKey(selected);
                pathInput.value = newPath;
                await handlePathSave(newPath);
            } catch (e) { setStatus('选择目录失败：' + e.message, 'error'); }
        });

        uiRoot.querySelector('.gdrive-auth').addEventListener('click', async () => {
            const cid = getClientId();
            if (!cid) { setStatus('请先配置 Client ID', 'error'); refreshUI(); return; }
            setStatus('正在打开 Google 授权窗口…');
            try {
                await ensureTokenClient();
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (e) { setStatus('授权失败：' + e.message, 'error'); }
        });

        uiRoot.querySelector('.gdrive-sync').addEventListener('click', () => {
            adapterHandle?.refresh().catch(() => {});
        });
        uiRoot.querySelector('.gdrive-backup').addEventListener('click', () => backupToDrive());
        uiRoot.querySelector('.gdrive-restore').addEventListener('click', () => restoreFromDrive());
        uiRoot.querySelector('.gdrive-upload-favorites').addEventListener('click', () => uploadFavoritesToDrive());
        uiRoot.querySelector('.gdrive-upload-local').addEventListener('click', () => pickAndUploadLocalFiles());
        uiRoot.querySelector('.gdrive-cancel-upload').addEventListener('click', () => {
            if (state.uploadingLocalFiles) { state.cancelLocalUpload = true; setStatus('正在取消…（当前文件上传完会停止）', 'warn'); }
        });
        uiRoot.querySelector('.gdrive-migrate').addEventListener('click', () => migrateLegacyFiles());

        uiRoot.querySelector('.gdrive-reset-client').addEventListener('click', async () => {
            const confirmed = await showPluginConfirm({
                title: '重置 Client ID',
                message: '清除已保存的 Client ID？下次使用需重新填写。',
                confirmText: '确认重置', type: 'danger'
            });
            if (!confirmed) return;
            try { localStorage.removeItem(KEY_CLIENT_ID); } catch (e) {}
            clearCachedToken();
            accessToken = null; tokenClient = null;
            state.authorized = false;
            resetAuthUI();
            refreshUI();
            setStatus('Client ID 已清除', 'warn');
        });

        uiRoot.querySelector('.gdrive-reset-delete-prompt').addEventListener('click', () => {
            try {
                const skipMap = JSON.parse(localStorage.getItem('mp3_skip_delete_prompt') || '{}');
                delete skipMap['gdrive'];
                localStorage.setItem('mp3_skip_delete_prompt', JSON.stringify(skipMap));
                setStatus('✅ 已重新启用删除确认提示', 'success');
            } catch (e) {
                setStatus('重置失败：' + e.message, 'error');
            }
        });
    }

    /* ==================== 备份 / 恢复 / 上传 ==================== */

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
        const q = encodeURIComponent(`name='${CONFIG.backupFileName}' and 'appDataFolder' in parents and trashed=false`);
        let existingId = null;
        try {
            const listRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`);
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
                    delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                    JSON.stringify(metadata) + delimiter +
                    'Content-Type: application/json\r\n\r\n' + json + closeDelim;
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
        const confirmed = await showPluginConfirm({
            title: '从 Drive 恢复',
            message: '从 Drive 恢复会覆盖本机同名的 mp3_* 数据。是否继续？',
            confirmText: '确认恢复', type: 'danger'
        });
        if (!confirmed) return;
        try {
            setStatus('正在查找备份…');
            const q = encodeURIComponent(`name='${CONFIG.backupFileName}' and 'appDataFolder' in parents and trashed=false`);
            const listRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`);
            const listData = await listRes.json();
            if (!listData.files || listData.files.length === 0) {
                await showPluginAlert({ title: '未找到备份', message: `Drive 的 appDataFolder 里没有 ${CONFIG.backupFileName}，请先执行「备份」。`, type: 'warning' });
                return;
            }
            const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${listData.files[0].id}?alt=media`);
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
        const ext = window.MP3AppExtension;
        const likedMap = ext ? ext.getLikedMap() : {};
        const likedKeys = Object.keys(likedMap);
        if (likedKeys.length === 0) {
            await showPluginAlert({ title: '「我的最愛」为空', message: '请先在列表中为歌曲点击 ♥ 加入最愛。', type: 'info' });
            return;
        }
        const sourceDir = window.MP3GetCurrentDir ? window.MP3GetCurrentDir() : '';
        if (!sourceDir) {
            await showPluginAlert({ title: '未指定本地目录', message: '请先在「本地目錄」插件里添加并加载一个目录。', type: 'warning' });
            return;
        }
        const folderPath = getFavoritesFolderPath();
        const pathText = pathKey(folderPath);
        const confirmed = await showPluginConfirm({
            title: '上传我的最愛',
            message: `即将上传 ${likedKeys.length} 首到 Drive 的 ${pathText} 目录。\n\n同名文件会自动跳过。`,
            confirmText: '开始上传', type: 'confirm'
        });
        if (!confirmed) return;
        state.uploadingFavorites = true;
        const favBtn = uiRoot.querySelector('.gdrive-upload-favorites');
        favBtn.disabled = true;
        try {
            setStatus(`正在准备 Drive 目录 ${pathText}…`);
            let favFolderId;
            try { favFolderId = await ensureNestedFolder(folderPath, KEY_FAV_FOLDER_ID); }
            catch (e) { setStatus('创建目录失败：' + e.message, 'error'); return; }
            setStatus('正在读取 Drive 现有文件…');
            const existingNames = new Set();
            try {
                const q = encodeURIComponent(`'${favFolderId}' in parents and trashed=false`);
                const listRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1000`);
                const listData = await listRes.json();
                (listData.files || []).forEach(f => existingNames.add(f.name));
            } catch (e) {}
            let successCount = 0, skipCount = 0, failCount = 0;
            const failures = [];
            for (let i = 0; i < likedKeys.length; i++) {
                const key = likedKeys[i];
                const filename = sanitizeFilename(key);
                if (existingNames.has(filename)) {
                    skipCount++; setStatus(`(${i + 1}/${likedKeys.length}) 跳过：${filename}`, 'warn'); continue;
                }
                setStatus(`(${i + 1}/${likedKeys.length}) 上传：${filename}…`);
                try {
                    const apiBase = window.MP3GetMp3ApiBase ? window.MP3GetMp3ApiBase() : '/api/mp3';
                    const streamUrl = `${apiBase}?dir=${encodeURIComponent(sourceDir)}&action=stream&filename=${encodeURIComponent(key)}`;
                    const fileRes = await fetch(streamUrl);
                    if (!fileRes.ok) throw new Error(`获取文件失败 HTTP ${fileRes.status}`);
                    const blob = await fileRes.blob();
                    if (!blob || blob.size === 0) throw new Error('文件内容为空');
                    await uploadBlobToDrive(blob, filename, favFolderId);
                    successCount++; existingNames.add(filename);
                } catch (e) { failCount++; failures.push({ filename, error: e.message }); }
                await new Promise(r => setTimeout(r, 30));
            }
            const summary = `成功 ${successCount}，跳过 ${skipCount}，失败 ${failCount}。`;
            setStatus(`✅ 完成。${summary}`, failCount > 0 ? 'warn' : 'success');
            if (failures.length > 0) {
                await showPluginAlert({
                    title: '部分文件上传失败',
                    message: summary + '\n\n失败详情：\n' + failures.map(f => `• ${f.filename}：${f.error}`).join('\n'),
                    type: 'error'
                });
            }
            adapterHandle?.refresh().catch(() => {});
        } finally {
            state.uploadingFavorites = false;
            favBtn.disabled = false;
        }
    }

    function pickAndUploadLocalFiles() {
        if (!state.authorized) { setStatus('请先授权。', 'warn'); return; }
        if (state.uploadingLocalFiles) { setStatus('已有上传任务…', 'warn'); return; }
        const input = document.createElement('input');
        input.type = 'file'; input.multiple = true;
        input.accept = 'audio/*,.mp3,.m4a,.flac,.aac,.wav,.ogg,.opus,.wma';
        input.onchange = async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;
            await uploadLocalFiles(files);
        };
        input.click();
    }

    async function uploadLocalFiles(files) {
        const folderPath = getFavoritesFolderPath();
        const pathText = pathKey(folderPath);
        const largeFiles = files.filter(f => f.size > LARGE_FILE_WARN);
        let message = `即将上传 ${files.length} 个文件到 Drive 的 ${pathText} 目录。\n\n同名文件会自动跳过。`;
        if (largeFiles.length > 0) message += `\n\n⚠️ 其中 ${largeFiles.length} 个文件大于 500MB，浏览器内存可能不足，建议分次上传。`;
        const confirmed = await showPluginConfirm({
            title: '上传本地文件', message,
            confirmText: '开始上传', type: largeFiles.length > 0 ? 'danger' : 'confirm'
        });
        if (!confirmed) return;
        state.uploadingLocalFiles = true;
        state.cancelLocalUpload = false;
        const btn = uiRoot.querySelector('.gdrive-upload-local');
        const cancelBtn = uiRoot.querySelector('.gdrive-cancel-upload');
        if (btn) btn.disabled = true;
        if (cancelBtn) cancelBtn.classList.remove('hidden');
        try {
            setStatus(`正在准备 Drive 目录 ${pathText}…`);
            let favFolderId;
            try { favFolderId = await ensureNestedFolder(folderPath, KEY_FAV_FOLDER_ID); }
            catch (e) { setStatus('创建目录失败：' + e.message, 'error'); return; }
            setStatus('正在读取 Drive 现有文件…');
            const existingNames = new Set();
            try {
                const q = encodeURIComponent(`'${favFolderId}' in parents and trashed=false`);
                const listRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1000`);
                const listData = await listRes.json();
                (listData.files || []).forEach(f => existingNames.add(f.name));
            } catch (e) {}
            let successCount = 0, skipCount = 0, failCount = 0;
            const failures = [];
            const totalSize = files.reduce((sum, f) => sum + f.size, 0);
            let uploadedSize = 0;
            for (let i = 0; i < files.length; i++) {
                if (state.cancelLocalUpload) { setStatus(`已取消（完成 ${successCount}/${files.length}）`, 'warn'); break; }
                const file = files[i];
                const filename = file.name;
                if (existingNames.has(filename)) {
                    skipCount++; uploadedSize += file.size;
                    setStatus(`(${i + 1}/${files.length}) 跳过（已存在）：${filename}`, 'warn');
                    continue;
                }
                const progress = `(${i + 1}/${files.length} · ${formatBytes(uploadedSize)}/${formatBytes(totalSize)})`;
                setStatus(`${progress} 上传：${filename}（${formatBytes(file.size)}）…`);
                try {
                    await uploadBlobToDrive(file, filename, favFolderId);
                    successCount++; existingNames.add(filename); uploadedSize += file.size;
                } catch (e) {
                    failCount++; uploadedSize += file.size; failures.push({ filename, error: e.message });
                }
                await new Promise(r => setTimeout(r, 30));
            }
            const wasCancelled = state.cancelLocalUpload;
            const prefix = wasCancelled ? '已取消。' : '✅ 完成。';
            const summary = `${prefix}成功 ${successCount}，跳过 ${skipCount}，失败 ${failCount}。`;
            setStatus(summary, (failCount > 0 || wasCancelled) ? 'warn' : 'success');
            if (failures.length > 0) {
                await showPluginAlert({
                    title: '部分文件上传失败',
                    message: summary + '\n\n失败详情：\n' + failures.map(f => `• ${f.filename}：${f.error}`).join('\n'),
                    type: 'error'
                });
            }
            await adapterHandle?.refresh();
        } catch (e) {
            setStatus('上传失败：' + e.message, 'error');
        } finally {
            state.uploadingLocalFiles = false;
            state.cancelLocalUpload = false;
            if (btn) btn.disabled = false;
            if (cancelBtn) cancelBtn.classList.add('hidden');
        }
    }

    /* ==================== 插件导出 ==================== */

    window.MP3GoogleDrivePlugin = {
        version: '4.2.0',
        async init() {
            registerAdapter();
            injectUI();
            await new Promise(r => setTimeout(r, 50));
            refreshUI();
            await tryRestoreSession();
        },
        async unload() {
            // adapter.unload 内部会：
            //   1) 调 onUnload() 清本源 cache / UI / token
            //   2) stopIfPlayingFrom('gdrive') → ext.destroyPlayer()
            //   3) removeSourceData({ sourceKeys:['gdrive'], categoryNames:[...] })
            //   4) 删除 MP3DataSourceHandlers['gdrive']
            await adapterHandle?.unload();
            adapterHandle = null;
            if (typeof window.refreshSourceFilterOptions === 'function') {
                window.refreshSourceFilterOptions();
            }
        },
        getFavoritesPath: () => pathKey(getFavoritesFolderPath()),
        openFolderBrowser: (initialPath) => openFolderBrowser(initialPath || getFavoritesFolderPath())
    };

    console.log('[MP3GoogleDrivePlugin] v4.2.0 ready（Player-agnostic + Blob LRU 缓存）');
})();