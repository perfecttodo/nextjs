/**
 * 123 云盘插件 v1.0 (纯前端直链)
 * 
 * 配置：
 *  - 在 123 云盘开放平台创建应用，获取 client_id 和 client_secret
 *  - 通过 OAuth 流程（或 OpenList 等工具）获取 access_token
 *  - 在插件 UI 中填入 access_token
 * 
 * 注意：前端直接暴露 client_secret 不安全，此处仅使用 access_token。
 *       access_token 有效期为 7200 秒，过期后需重新获取。
 */
(function () {
    'use strict';

    const CONFIG = {
        categoryName: '☁️ 123 云盘',
        apiBase: 'https://open-api.123pan.com',
        tokenKey: 'pan123_access_token',
        parentFileId: 0, // 0 表示根目录，可改为指定文件夹 ID
        pageSize: 100
    };

    let uiRoot = null;
    let loadedFiles = [];

    function setStatus(msg, tone) {
        if (!uiRoot) return;
        const el = uiRoot.querySelector('.pan123-status');
        if (!el) return;
        el.textContent = msg || '';
        el.className = 'pan123-status text-[10px] min-h-[0.75rem] break-all ' + (
            tone === 'error' ? 'text-rose-400' :
            tone === 'success' ? 'text-emerald-400' : 'text-slate-500'
        );
    }

    function getToken() {
        return localStorage.getItem(CONFIG.tokenKey);
    }

    // 获取文件列表 (官方 API: /api/v1/file/list)[reference:1]
    async function fetchFileList() {
        const token = getToken();
        if (!token) throw new Error('请先填写 access_token');

        const res = await fetch(`${CONFIG.apiBase}/api/v1/file/list`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                parentFileId: CONFIG.parentFileId,
                limit: CONFIG.pageSize,
                searchData: '',
                searchMode: 0,
                lastFileId: 0
            })
        });

        if (res.status === 401) {
            localStorage.removeItem(CONFIG.tokenKey);
            throw new Error('Token 已过期，请重新填写');
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (data.code !== 0) throw new Error(data.message || '获取列表失败');

        return (data.data?.fileList || []).filter(item =>
            item.category === 2 || /\.(mp3|m4a|flac|aac|wav|ogg)$/i.test(item.fileName || '')
        );
    }

    // 获取直链 (官方 API: /api/v1/direct-link/url 或类似)[reference:2]
    async function fetchDirectLink(fileId) {
        const token = getToken();
        if (!token) throw new Error('Token 缺失');

        const res = await fetch(`${CONFIG.apiBase}/api/v1/direct-link/url`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileId })
        });

        if (!res.ok) throw new Error('获取直链失败');
        const data = await res.json();
        if (data.code !== 0) throw new Error(data.message || '直链接口返回错误');
        return data.data?.url;
    }

    function registerDataSource() {
        window.MP3DataSourceHandlers = window.MP3DataSourceHandlers || {};
        window.MP3DataSourceHandlers['pan123'] = {
            reset() {},
            play: async (file) => {
                const ext = window.MP3AppExtension;
                if (!ext) return;

                try {
                    setStatus('正在获取播放地址…');
                    const directUrl = await fetchDirectLink(file._pan123FileId);
                    if (!directUrl) throw new Error('直链为空');

                    ext.audioPlayer.src = directUrl;
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
                } catch (e) {
                    setStatus('播放失败：' + e.message, 'error');
                    throw e;
                }
            }
        };
    }

    async function syncToMainList() {
        const ext = window.MP3AppExtension;
        if (!ext) throw new Error('MP3AppExtension 未就绪');

        const items = await fetchFileList();
        const newFiles = items.map(item => ({
            filename: item.fileName,
            displayName: item.fileName,
            relativePath: `[123云盘] ${item.fileId}`,
            size: item.size || 0,
            category: CONFIG.categoryName,
            isLiked: false,
            isDisliked: false,
            tags: ['123pan'],
            _source: 'pan123',
            _pan123FileId: item.fileId,
            _key: `pan123::${item.fileId}`
        }));

        loadedFiles = newFiles;
        ext.allFiles = ext.allFiles.filter(f => f._source !== 'pan123');
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
                    ? window.MP3PluginManager.getBodyContainer('pan123') : null;
                if (!body) { setTimeout(tryInject, 300); return; }
                if (uiRoot) { resolve(); return; }

                const savedToken = getToken() || '';
                uiRoot = document.createElement('div');
                uiRoot.className = 'space-y-1.5';
                uiRoot.innerHTML = `
                    <p class="text-[10px] text-slate-500">填入 123 云盘 access_token 以拉取音频。</p>
                    <input type="text" class="pan123-token-input w-full bg-slate-800 border border-slate-700 text-[10px] rounded px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-200" placeholder="access_token" value="${escapeHtmlAttr(savedToken)}">
                    <div class="flex items-center gap-1">
                        <button class="pan123-save w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 rounded text-[10px] transition">保存 Token</button>
                        <button class="pan123-sync w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white py-1 rounded text-[10px] font-medium transition">拉取列表</button>
                    </div>
                    <p class="pan123-status text-[10px] text-slate-500 min-h-[0.75rem]"></p>
                `;
                body.appendChild(uiRoot);

                const tokenInput = uiRoot.querySelector('.pan123-token-input');
                uiRoot.querySelector('.pan123-save').addEventListener('click', () => {
                    localStorage.setItem(CONFIG.tokenKey, tokenInput.value.trim());
                    setStatus('Token 已保存', 'success');
                });
                uiRoot.querySelector('.pan123-sync').addEventListener('click', async () => {
                    localStorage.setItem(CONFIG.tokenKey, tokenInput.value.trim());
                    setStatus('正在拉取…');
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

    window.MP3Pan123Plugin = {
        version: '1.0.0',
        async init() {
            registerDataSource();
            await injectUI();
            if (getToken()) {
                try {
                    await syncToMainList();
                    setStatus(`✅ 已自动加载 ${loadedFiles.length} 首`, 'success');
                } catch (e) { setStatus('自动同步跳过：' + e.message, 'error'); }
            }
        },
        async unload() {
            const ext = window.MP3AppExtension;
            if (ext) {
                const playingKey = ext.currentPlayingFile;
                const playingFile = playingKey ? ext.allFiles.find(f => window.getFileKey(f) === playingKey) : null;
                if (playingFile && playingFile._source === 'pan123') {
                    try { ext.audioPlayer.pause(); } catch (e) {}
                    ext.audioPlayer.removeAttribute('src');
                    ext.currentPlayingFile = null;
                }
                ext.allFiles = ext.allFiles.filter(f => f._source !== 'pan123');
                ext.categories = ext.categories.filter(c => c !== CONFIG.categoryName);
                ext.saveCategories(ext.categories);
                ext.renderAll();
            }
            if (window.MP3DataSourceHandlers) delete window.MP3DataSourceHandlers['pan123'];
            if (uiRoot) { uiRoot.remove(); uiRoot = null; }
            loadedFiles = [];
        }
    };
})();