/**
 * OneDrive 插件 v1.0 (MSAL.js 纯前端认证)
 * 
 * 配置（在 Azure Portal 应用注册中设置）：
 *  - 应用类型：单页应用 (SPA)
 *  - 重定向 URI：你的前端页面地址
 *  - API 权限：Files.Read (Microsoft Graph)
 * 
 * 已知限制：
 *  - @microsoft.graph.downloadUrl 约 1 小时后失效，长音频需定期刷新[reference:4]
 *  - 某些情况下直接播放可能遭遇 CORS 错误，需准备代理降级方案
 */
(function () {
    'use strict';

    const CONFIG = {
        categoryName: '☁️ OneDrive',
        clientId: 'YOUR_AZURE_CLIENT_ID', // ★ 替换为你的 Azure 应用 Client ID
        redirectUri: window.location.origin + window.location.pathname,
        scopes: ['Files.Read'],
        graphBase: 'https://graph.microsoft.com/v1.0',
        folderPath: 'Music' // 可改为指定文件夹路径，空字符串表示根目录
    };

    let uiRoot = null;
    let msalApp = null;
    let loadedFiles = [];
    let currentDownloadUrl = null;

    function setStatus(msg, tone) {
        if (!uiRoot) return;
        const el = uiRoot.querySelector('.onedrive-status');
        if (!el) return;
        el.textContent = msg || '';
        el.className = 'onedrive-status text-[10px] min-h-[0.75rem] break-all ' + (
            tone === 'error' ? 'text-rose-400' :
            tone === 'success' ? 'text-emerald-400' : 'text-slate-500'
        );
    }

    async function getMsalApp() {
        if (msalApp) return msalApp;
        if (!window.msal) {
            await loadScript('https://alcdn.msauth.net/browser/2.38.1/js/msal-browser.min.js');
        }
        msalApp = new msal.PublicClientApplication({
            auth: {
                clientId: CONFIG.clientId,
                redirectUri: CONFIG.redirectUri
            },
            cache: { cacheLocation: 'localStorage' }
        });
        await msalApp.handleRedirectPromise();
        return msalApp;
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src; s.onload = resolve; s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    async function acquireToken() {
        const app = await getMsalApp();
        const accounts = app.getAllAccounts();
        if (accounts.length > 0) {
            try {
                const res = await app.acquireTokenSilent({ scopes: CONFIG.scopes, account: accounts[0] });
                return res.accessToken;
            } catch (e) { /* 静默获取失败，继续尝试交互 */ }
        }
        const res = await app.loginPopup({ scopes: CONFIG.scopes });
        return res.accessToken;
    }

    // 获取文件列表，select 包含 @microsoft.graph.downloadUrl
    async function fetchAudioFiles(token) {
        const folderSegment = CONFIG.folderPath ? `/root:/${encodeURIComponent(CONFIG.folderPath)}:` : '/root';
        const url = `${CONFIG.graphBase}/me/drive${folderSegment}/children?$select=id,name,size,file,@microsoft.graph.downloadUrl&$top=200`;

        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Graph API 错误 (${res.status})`);
        const data = await res.json();

        return (data.value || []).filter(item =>
            item.file && /\.(mp3|m4a|flac|aac|wav|ogg)$/i.test(item.name)
        );
    }

    function registerDataSource() {
        window.MP3DataSourceHandlers = window.MP3DataSourceHandlers || {};
        window.MP3DataSourceHandlers['onedrive'] = {
            reset() { currentDownloadUrl = null; },
            play: async (file) => {
                const ext = window.MP3AppExtension;
                if (!ext) return;

                try {
                    setStatus('正在获取播放地址…');
                    const token = await acquireToken();
                    // 重新请求一次，获取最新的 downloadUrl（避免过期）
                    const url = `${CONFIG.graphBase}/me/drive/items/${file._onedriveFileId}?select=id,@microsoft.graph.downloadUrl`;
                    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) throw new Error('获取下载地址失败');
                    const data = await res.json();
                    const downloadUrl = data['@microsoft.graph.downloadUrl'];
                    if (!downloadUrl) throw new Error('下载地址为空');

                    currentDownloadUrl = downloadUrl;
                    ext.audioPlayer.src = downloadUrl;
                    await ext.audioPlayer.play();
                    ext.currentPlayingFile = window.getFileKey(file);

                    document.getElementById('currentSongTitle').innerText = file.displayName;
                    document.getElementById('currentSongCategory').innerText = file.category;
                    if (typeof window.MP3SetPlayerSourceBadge === 'function') {
                        window.MP3SetPlayerSourceBadge(file);
                    }
                    ext.updatePlayButton();
                    ext.updatePlayerLikeState();
                    ext.updatePlayerDislikeState();
                    setStatus('▶️ ' + file.displayName, 'success');

                    // 如果音频超过 55 分钟，提前刷新一次 URL（简单处理）
                    if (file.size > 50 * 1024 * 1024) {
                        setTimeout(() => refreshCurrentUrlIfNeeded(ext, file), 55 * 60 * 1000);
                    }
                } catch (e) {
                    setStatus('播放失败：' + e.message, 'error');
                    if (e.message.includes('CORS') || e.name === 'NotAllowedError') {
                        setStatus('播放失败（可能 CORS 限制）。建议配置代理后端转发 downloadUrl。', 'error');
                    }
                    throw e;
                }
            }
        };
    }

    async function refreshCurrentUrlIfNeeded(ext, file) {
        if (ext.currentPlayingFile !== window.getFileKey(file)) return; // 已切歌
        try {
            const token = await acquireToken();
            const url = `${CONFIG.graphBase}/me/drive/items/${file._onedriveFileId}?select=id,@microsoft.graph.downloadUrl`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            const newUrl = data['@microsoft.graph.downloadUrl'];
            if (newUrl && newUrl !== currentDownloadUrl) {
                const wasPlaying = !ext.audioPlayer.paused;
                const curTime = ext.audioPlayer.currentTime;
                ext.audioPlayer.src = newUrl;
                ext.audioPlayer.currentTime = curTime;
                if (wasPlaying) ext.audioPlayer.play();
                currentDownloadUrl = newUrl;
            }
        } catch (e) { /* 刷新失败，忽略 */ }
    }

    async function syncToMainList() {
        const ext = window.MP3AppExtension;
        if (!ext) throw new Error('MP3AppExtension 未就绪');

        const token = await acquireToken();
        const items = await fetchAudioFiles(token);

        const newFiles = items.map(item => ({
            filename: item.name,
            displayName: item.name,
            relativePath: `[OneDrive] ${item.name}`,
            size: item.size || 0,
            category: CONFIG.categoryName,
            isLiked: false,
            isDisliked: false,
            tags: ['onedrive'],
            _source: 'onedrive',
            _onedriveFileId: item.id,
            _key: `onedrive::${item.id}`
        }));

        loadedFiles = newFiles;
        ext.allFiles = ext.allFiles.filter(f => f._source !== 'onedrive');
        ext.allFiles = [...ext.allFiles, ...newFiles];

        if (!ext.categories.includes(CONFIG.categoryName)) {
            ext.categories.push(CONFIG.categoryName);
            ext.saveCategories(ext.categories);
        }
        ext.renderAll();
    }

    function injectUI() {
        return new Promise((resolve) => {
            function tryInject() {
                const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
                    ? window.MP3PluginManager.getBodyContainer('onedrive') : null;
                if (!body) { setTimeout(tryInject, 300); return; }
                if (uiRoot) { resolve(); return; }

                uiRoot = document.createElement('div');
                uiRoot.className = 'space-y-1.5';
                uiRoot.innerHTML = `
                    <p class="text-[10px] text-slate-500">登录 Microsoft 账户以拉取 OneDrive 音频。</p>
                    <button class="onedrive-login w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-[11px] font-medium transition">
                        <i class="fa-brands fa-microsoft mr-1"></i>登录并拉取列表
                    </button>
                    <p class="onedrive-status text-[10px] text-slate-500 min-h-[0.75rem]"></p>
                `;
                body.appendChild(uiRoot);

                uiRoot.querySelector('.onedrive-login').addEventListener('click', async () => {
                    setStatus('正在登录/拉取…');
                    try {
                        await syncToMainList();
                        setStatus(`✅ 已加载 ${loadedFiles.length} 首`, 'success');
                        if (typeof window.refreshSourceFilterOptions === 'function') window.refreshSourceFilterOptions();
                    } catch (e) {
                        setStatus('失败：' + e.message, 'error');
                    }
                });
                resolve();
            }
            tryInject();
        });
    }

    window.MP3OneDrivePlugin = {
        version: '1.0.0',
        async init() {
            if (CONFIG.clientId === 'YOUR_AZURE_CLIENT_ID') {
                console.warn('[OneDrive] 请先在插件中配置 Azure Client ID');
                return;
            }
            registerDataSource();
            await injectUI();
            // 尝试静默恢复会话并同步
            try {
                const token = await acquireToken();
                if (token) {
                    await syncToMainList();
                    setStatus(`✅ 已恢复并加载 ${loadedFiles.length} 首`, 'success');
                }
            } catch (e) { /* 用户未登录，等待点击 */ }
        },
        async unload() {
            const ext = window.MP3AppExtension;
            if (ext) {
                const playingKey = ext.currentPlayingFile;
                const playingFile = playingKey ? ext.allFiles.find(f => window.getFileKey(f) === playingKey) : null;
                if (playingFile && playingFile._source === 'onedrive') {
                    try { ext.audioPlayer.pause(); } catch (e) {}
                    ext.audioPlayer.removeAttribute('src');
                    ext.currentPlayingFile = null;
                }
                ext.allFiles = ext.allFiles.filter(f => f._source !== 'onedrive');
                ext.categories = ext.categories.filter(c => c !== CONFIG.categoryName);
                ext.saveCategories(ext.categories);
                ext.renderAll();
            }
            if (window.MP3DataSourceHandlers) delete window.MP3DataSourceHandlers['onedrive'];
            if (uiRoot) { uiRoot.remove(); uiRoot = null; }
            loadedFiles = [];
            currentDownloadUrl = null;
        }
    };
})();