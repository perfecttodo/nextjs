/**
 * Google Drive 扩展插件 v3.0（按需加载版）
 *
 * 对外接口：
 *   window.MP3GoogleDrivePlugin = { version, init(), unload(), ... }
 *
 * 由 MP3PluginManager 在用户打开开关时动态加载，
 * 关闭时调用 unload() 清理；开启时调用 init() 挂载。
 */
window.MP3GoogleDriveConfig = {
    clientId: '802199089900-5n676d4hansnab5c66igukb1mch5m7m1.apps.googleusercontent.com'
  };
(function () {
    'use strict';

    const CFG = window.MP3GoogleDriveConfig || {};
    const CONFIG = {
        clientId: CFG.clientId || '',
        favoritesFolderPath: CFG.favoritesFolderPath || ['music', 'fav'],
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

    const EXCLUDED_BACKUP_KEYS = new Set([KEY_TOKEN, KEY_FAV_FOLDER_ID]);

    const state = {
        authorized: false,
        driveFiles: [],
        currentBlobUrl: null,
        uploadingFavorites: false
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

    // ==================== Token 持久化 ====================
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
        if (cacheKey) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${cached}?fields=id,trashed`);
                    if (res.ok) {
                        const info = await res.json();
                        if (info && !info.trashed) return cached;
                    }
                } catch (e) {}
                localStorage.removeItem(cacheKey);
            }
        }
        let parentId = 'root';
        for (const name of pathParts) {
            parentId = await ensureFolder(name, parentId);
        }
        if (cacheKey) localStorage.setItem(cacheKey, parentId);
        return parentId;
    }

    // ==================== 同步进主列表 ====================
    async function syncDriveFilesToMainList() {
        const ext = window.MP3AppExtension;
        if (!ext) { setStatus('主应用未就绪', 'error'); return; }
        try {
            setStatus('正在加载 Drive 音乐列表…');
            const folderId = await ensureNestedFolder(CONFIG.favoritesFolderPath, KEY_FAV_FOLDER_ID);
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
            setStatus(`✅ 已加载 ${driveFiles.length} 首 Drive 音乐`, 'success');
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
    function injectUI() {
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
            ? window.MP3PluginManager.getBodyContainer('gdrive')
            : null;
        if (!body) { setTimeout(injectUI, 300); return; }
        if (uiRoot) return;

        uiRoot = document.createElement('div');
        uiRoot.className = 'space-y-1.5';
        uiRoot.innerHTML = `
            <p class="text-[10px] text-slate-500 leading-relaxed">
                音乐合并到主列表「${CONFIG.driveCategoryName}」。登录会记住。
            </p>
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
            </div>
            <p class="gdrive-status text-[10px] text-slate-500 min-h-[0.75rem] break-all"></p>
        `;
        body.appendChild(uiRoot);

        uiRoot.querySelector('.gdrive-auth').addEventListener('click', async () => {
            if (!CONFIG.clientId) {
                setStatus('未配置 window.MP3GoogleDriveConfig.clientId，无法授权', 'error');
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
        const sourceDir = dirInput ? dirInput.value.trim() : '';
        if (!sourceDir) { setStatus('请先输入资料夹路径。', 'warn'); return; }

        if (!window.confirm(`即将上传 ${likedKeys.length} 首到 Drive 的 ${CONFIG.favoritesFolderPath.join('/')} 目录。\n同名文件会跳过。继续？`)) return;

        state.uploadingFavorites = true;
        const favBtn = uiRoot.querySelector('.gdrive-upload-favorites');
        favBtn.disabled = true;

        try {
            setStatus('正在准备 Drive 目录…');
            let favFolderId;
            try {
                favFolderId = await ensureNestedFolder(CONFIG.favoritesFolderPath, KEY_FAV_FOLDER_ID);
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
                    const streamUrl =
                        `/api/mp3?dir=${encodeURIComponent(sourceDir)}` +
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
        version: '3.0.0',
        async init() {
            registerDataSource();
            injectUI();
            await new Promise(r => setTimeout(r, 50));
            if (!CONFIG.clientId) {
                setStatus('未配置 window.MP3GoogleDriveConfig.clientId，无法授权', 'error');
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
            accessToken = null;
            tokenClient = null;
        }
    };
})();