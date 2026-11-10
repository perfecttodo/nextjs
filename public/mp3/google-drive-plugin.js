/**
 * MP3 Player - Google Drive 扩展插件 v2.1
 * 特性：
 *  1. 记住登录：token 持久化，刷新自动恢复（缓存 + GIS 静默刷新）
 *  2. Drive 音乐统一进主列表：与本地音乐共享分类、分页、搜索、Like、播放器
 *  3. 数据源架构：window.MP3DataSourceHandlers 可无限扩展
 *  4. 来源徽章：由主应用 MP3SourceRegistry 统一渲染，插件只负责设置 _source='gdrive'
 */
window.MP3GoogleDriveConfig = {
    clientId: '802199089900-5n676d4hansnab5c66igukb1mch5m7m1.apps.googleusercontent.com'
  };
(function () {
    'use strict';

    const scriptEl = document.currentScript;
    const globalCfg = window.MP3GoogleDriveConfig || {};
    const dataCfg = scriptEl ? scriptEl.dataset : {};

    const CONFIG = {
        clientId: globalCfg.clientId || dataCfg.clientId || '',
        favoritesFolderPath: globalCfg.favoritesFolderPath || ['music', 'fav'],
        backupFileName: globalCfg.backupFileName || 'mp3_player_backup.json',
        sidebarSelector: globalCfg.sidebarSelector || '#sidebarContentWrapper',
        driveCategoryName: globalCfg.driveCategoryName || '☁️ Drive 音樂',
        autoEnable: globalCfg.autoEnable === true || dataCfg.autoEnable === 'true'
    };

    if (!CONFIG.clientId) {
        console.warn('[GDrive Plugin] 未配置 clientId，插件未启用。');
        return;
    }

    const SCOPES = [
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/drive.file'
    ].join(' ');

    const NS = 'mp3_gdrive_';
    const KEY_ENABLED = NS + 'enabled';
    const KEY_TOKEN = NS + 'token';
    const KEY_FAV_FOLDER_ID = NS + 'fav_folder_id';

    const EXCLUDED_BACKUP_KEYS = new Set([KEY_ENABLED, KEY_TOKEN, KEY_FAV_FOLDER_ID]);

    const state = {
        enabled: localStorage.getItem(KEY_ENABLED) === 'true' || CONFIG.autoEnable,
        authorized: false,
        driveFiles: [],
        currentBlobUrl: null,
        uploadingFavorites: false
    };

    let accessToken = null;
    let tokenClient = null;
    let uiRoot = null;
    let tableObserver = null;

    // ==================== 工具 ====================
    function setStatus(msg, tone) {
        const el = uiRoot && uiRoot.querySelector('.gdrive-status');
        if (!el) return;
        el.textContent = msg || '';
        el.className = 'gdrive-status text-[11px] break-all min-h-[1rem] ' + (
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
        try {
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
        } catch (e) { setStatus(e.message, 'error'); }
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
        await ensureTokenClient();
        if (tokenClient) tokenClient.requestAccessToken({ prompt: '' });
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
        if (!window.MP3AppExtension) {
            setStatus('主应用未暴露 MP3AppExtension，无法整合 Drive 音乐。', 'error');
            return;
        }
        const ext = window.MP3AppExtension;
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
            setStatus(`✅ 已加载 ${driveFiles.length} 首 Drive 音乐到主列表`, 'success');
        } catch (e) {
            setStatus('加载 Drive 音乐失败：' + e.message, 'error');
        }
    }

    // ==================== 数据源处理器 ====================
    function registerDataSource() {
        window.MP3DataSourceHandlers = window.MP3DataSourceHandlers || {};
        window.MP3DataSourceHandlers['gdrive'] = {
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

                    if (state.currentBlobUrl) URL.revokeObjectURL(state.currentBlobUrl);
                    state.currentBlobUrl = URL.createObjectURL(blob);

                    ext.audioPlayer.src = state.currentBlobUrl;
                    ext.audioPlayer.play();
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
        const sidebar = document.querySelector(CONFIG.sidebarSelector);
        if (!sidebar) { setTimeout(injectUI, 300); return; }
        if (uiRoot) return;

        uiRoot = document.createElement('div');
        uiRoot.id = 'gdrivePluginCard';
        uiRoot.className = 'bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl';
        uiRoot.innerHTML = `
            <div class="flex items-center justify-between mb-2 px-1">
                <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                    <i class="fa-brands fa-google-drive text-indigo-400 mr-1.5"></i> Google Drive
                </h2>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="gdrive-toggle sr-only peer" ${state.enabled ? 'checked' : ''}>
                    <div class="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 transition"></div>
                    <span class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-4"></span>
                </label>
            </div>
            <div class="gdrive-body space-y-2.5 ${state.enabled ? '' : 'hidden'}">
                <p class="text-[11px] text-slate-500 leading-relaxed">
                    Drive 音乐自动整合到主列表的「${CONFIG.driveCategoryName}」分类。登录状态会记住。
                </p>
                <button class="gdrive-auth w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-medium transition shadow-md">
                    <i class="fa-solid fa-right-to-bracket mr-1.5"></i> 授权 Google Drive
                </button>
                <div class="gdrive-actions space-y-2 hidden">
                    <button class="gdrive-sync w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-medium transition shadow-md">
                        <i class="fa-solid fa-rotate mr-1.5"></i> 刷新 Drive 音乐列表
                    </button>
                    <button class="gdrive-backup w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-medium transition shadow-md">
                        <i class="fa-solid fa-cloud-arrow-up mr-1.5"></i> 备份数据到 Drive
                    </button>
                    <button class="gdrive-restore w-full bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-xl text-xs font-medium transition shadow-md">
                        <i class="fa-solid fa-cloud-arrow-down mr-1.5"></i> 从 Drive 恢复数据
                    </button>
                    <div class="border-t border-slate-800 pt-2 mt-1">
                        <button class="gdrive-upload-favorites w-full bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-xl text-xs font-medium transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fa-solid fa-heart mr-1.5"></i> 上传我的最愛到 Drive
                        </button>
                    </div>
                </div>
                <p class="gdrive-status text-[11px] text-slate-500 break-all min-h-[1rem]"></p>
            </div>
        `;
        sidebar.insertBefore(uiRoot, sidebar.firstChild);
        bindUI();
    }

    function bindUI() {
        const toggle = uiRoot.querySelector('.gdrive-toggle');
        const body = uiRoot.querySelector('.gdrive-body');

        toggle.addEventListener('change', async (e) => {
            state.enabled = e.target.checked;
            localStorage.setItem(KEY_ENABLED, state.enabled);
            body.classList.toggle('hidden', !state.enabled);
            if (state.enabled) {
                const restored = await tryRestoreSession();
                if (!restored) setStatus('请点击授权。');
            } else {
                setStatus('');
            }
        });

        uiRoot.querySelector('.gdrive-auth').addEventListener('click', async () => {
            await ensureTokenClient();
            if (!tokenClient) return;
            setStatus('正在打开 Google 授权窗口…');
            tokenClient.requestAccessToken({ prompt: 'consent' });
        });
        uiRoot.querySelector('.gdrive-sync').addEventListener('click', syncDriveFilesToMainList);
        uiRoot.querySelector('.gdrive-backup').addEventListener('click', backupToDrive);
        uiRoot.querySelector('.gdrive-restore').addEventListener('click', restoreFromDrive);
        uiRoot.querySelector('.gdrive-upload-favorites').addEventListener('click', uploadFavoritesToDrive);
    }

    function showAuthedUI() {
        uiRoot.querySelector('.gdrive-auth').classList.add('hidden');
        uiRoot.querySelector('.gdrive-actions').classList.remove('hidden');
    }
    function resetAuthUI() {
        state.authorized = false;
        state.driveFiles = [];
        uiRoot.querySelector('.gdrive-auth').classList.remove('hidden');
        uiRoot.querySelector('.gdrive-actions').classList.add('hidden');
    }

    // ==================== 备份/恢复 ====================
    function collectBackupData() {
        const payload = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('mp3_') && !EXCLUDED_BACKUP_KEYS.has(key)) {
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
                if (key.startsWith('mp3_') && !EXCLUDED_BACKUP_KEYS.has(key)) {
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

    // ==================== 上传 ====================
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
        if (state.uploadingFavorites) { setStatus('已有上传任务执行中…', 'warn'); return; }

        const likedMap = typeof window.getLikedMap === 'function' ? window.getLikedMap() : {};
        const likedKeys = Object.keys(likedMap);
        if (likedKeys.length === 0) { setStatus('「我的最愛」为空。', 'warn'); return; }

        const dirInput = document.getElementById('dirInput');
        const sourceDir = dirInput ? dirInput.value.trim() : '';
        if (!sourceDir) { setStatus('请先在顶部输入资料夹路径。', 'warn'); return; }

        if (!window.confirm(`即将上传 ${likedKeys.length} 首歌曲到 Drive 的 ${CONFIG.favoritesFolderPath.join('/')} 目录。\n已存在的同名文件会跳过。是否继续？`)) return;

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
                const idxLabel = `(${i + 1}/${likedKeys.length})`;

                if (existingNames.has(filename)) {
                    skipCount++;
                    setStatus(`${idxLabel} 跳过：${filename}`, 'warn');
                    continue;
                }

                setStatus(`${idxLabel} 上传：${filename}…`);
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

    // ==================== 对外 ====================
    window.MP3GoogleDrivePlugin = {
        isEnabled: () => state.enabled,
        isAuthorized: () => state.authorized,
        backup: backupToDrive,
        restore: restoreFromDrive,
        uploadFavorites: uploadFavoritesToDrive,
        syncDriveList: syncDriveFilesToMainList,
        version: '2.1.0'
    };

    // ==================== 启动 ====================
    function init() {
        setTimeout(async () => {
            injectUI();
            registerDataSource();
            if (state.enabled) await tryRestoreSession();
        }, 300);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();