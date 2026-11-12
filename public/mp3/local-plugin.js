/**
 * 本地目录插件 v2.0
 * 
 * 相对 v1.1 的改动：
 *  - UI 全部渲染到插件自己的 plugin-body（header 工具栏已移除）
 *  - API 端点可配置（localStorage['mp3_api_base']，默认 /api/mp3）
 *  - 所有 fetch 走 window.MP3GetMp3ApiBase()
 *  - 目录值持久化到 localStorage['mp3_last_dir']
 *  - 输入框实时保存，Enter 触发加载
 */
(function () {
    'use strict';

    let isActive = false;
    let uiRoot = null;

    // ==================== 工具 ====================
    function getApiBase() {
        if (typeof window.MP3GetMp3ApiBase === 'function') return window.MP3GetMp3ApiBase();
        let base = localStorage.getItem('mp3_api_base') || '/api/mp3';
        return String(base).trim().replace(/\/+$/, '') || '/api/mp3';
    }

    function setApiBase(base) {
        let b = String(base || '').trim().replace(/\/+$/, '');
        if (!b) b = '/api/mp3';
        localStorage.setItem('mp3_api_base', b);
        return b;
    }

    function getCurrentDir() {
        if (typeof window.MP3GetCurrentDir === 'function') return window.MP3GetCurrentDir();
        return localStorage.getItem('mp3_last_dir') || '';
    }

    function setCurrentDir(dir) {
        localStorage.setItem('mp3_last_dir', dir || '');
    }

    function setLoading(loading) {
        if (!uiRoot) return;
        const btn = uiRoot.querySelector('.local-load-btn');
        if (!btn) return;
        btn.disabled = loading;
        btn.innerHTML = loading
            ? '<i class="fa-solid fa-spinner fa-spin mr-1"></i>載入中…'
            : '<i class="fa-solid fa-rotate mr-1"></i>載入';
    }

    function updateCountBadge(count) {
        if (!uiRoot) return;
        const el = uiRoot.querySelector('.local-count');
        if (el) el.innerText = count > 0 ? `${count} 首` : '';
    }

    // ==================== 加载本地文件 ====================
    async function loadLocalFiles(resetPage = false) {
        if (!isActive) return;

        const ext = window.MP3AppExtension;
        if (!ext) return;

        const dir = getCurrentDir();
        if (resetPage) ext.currentPage = 1;
        if (typeof window.updateUrlParams === 'function') window.updateUrlParams();

        if (!dir) {
            ext.allFiles = ext.allFiles.filter(f => f._source !== 'local');
            ext.renderAll();
            updateCountBadge(0);
            return;
        }

        setLoading(true);
        try {
            const apiBase = getApiBase();
            const res = await fetch(`${apiBase}?dir=${encodeURIComponent(dir)}`);
            const data = await res.json();
            if (!data.success) {
                if (typeof window.showCustomModal === 'function') {
                    await window.showCustomModal({ title: '載入失敗', message: data.error || '未知錯誤', type: 'error' });
                }
                return;
            }

            const likedMap = (typeof window.getLikedMap === 'function') ? window.getLikedMap() : {};
            const dislikedMap = (typeof window.getDislikedMap === 'function') ? window.getDislikedMap() : {};
            let tagsMap = {};
            try { tagsMap = JSON.parse(localStorage.getItem('mp3_tags_map') || '{}'); } catch (e) {}

            const parseTs = typeof window.parseLikedAt === 'function'
                ? window.parseLikedAt
                : (raw) => (raw && typeof raw === 'object' && typeof raw.ts === 'number') ? raw.ts : null;

            const localFiles = data.files.map(f => {
                const key = f.relativePath || f.filename;
                const rawLike = likedMap[key];
                return {
                    ...f,
                    _source: 'local',
                    isLiked: !!rawLike,
                    likedAt: parseTs(rawLike),
                    isDisliked: !!dislikedMap[key],
                    tags: tagsMap[key] || []
                };
            });

            const existingExternal = ext.allFiles.filter(f => f._source && f._source !== 'local');
            ext.allFiles = [...localFiles, ...existingExternal];

            ext.renderAll();
            if (typeof window.updatePlayerLikeState === 'function') window.updatePlayerLikeState();
            if (typeof window.updatePlayerDislikeState === 'function') window.updatePlayerDislikeState();
            if (typeof window.restoreLastPlayedSong === 'function') window.restoreLastPlayedSong();

            updateCountBadge(localFiles.length);
        } catch (err) {
            if (typeof window.showCustomModal === 'function') {
                await window.showCustomModal({ title: '連線錯誤', message: '無法連線至 API 伺服器（' + getApiBase() + '）', type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    }

    // ==================== UI（渲染到 plugin-body） ====================
    function injectUI() {
        return new Promise((resolve) => {
            function tryInject() {
                const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
                    ? window.MP3PluginManager.getBodyContainer('local')
                    : null;
                if (!body) { setTimeout(tryInject, 300); return; }
                if (uiRoot) { resolve(); return; }

                uiRoot = document.createElement('div');
                uiRoot.className = 'space-y-1.5';
                uiRoot.innerHTML = `
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-500">
                            <i class="fa-solid fa-folder text-[10px]"></i>
                        </span>
                        <input type="text" class="local-dir-input w-full bg-slate-800 border border-slate-700 text-xs rounded-lg pl-7 pr-2 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-200" placeholder="資料夾絕對路徑...">
                    </div>
                    <div class="flex items-center justify-between gap-2">
                        <button class="local-load-btn flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-1.5 rounded-lg text-[11px] font-medium transition shadow-sm">
                            <i class="fa-solid fa-rotate mr-1"></i>載入
                        </button>
                        <span class="local-count text-[10px] text-slate-500 whitespace-nowrap"></span>
                    </div>
                    <details class="text-[10px] text-slate-500">
                        <summary class="cursor-pointer hover:text-slate-300 select-none">⚙️ 進階設定</summary>
                        <div class="mt-1.5 space-y-1">
                            <label class="block text-slate-500">API 端點</label>
                            <input type="text" class="local-api-input w-full bg-slate-800 border border-slate-700 text-[10px] rounded px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-200" placeholder="/api/mp3">
                        </div>
                    </details>
                `;
                body.appendChild(uiRoot);

                const dirInput = uiRoot.querySelector('.local-dir-input');
                const loadBtn = uiRoot.querySelector('.local-load-btn');
                const apiInput = uiRoot.querySelector('.local-api-input');

                // 初始值
                dirInput.value = getCurrentDir();
                apiInput.value = getApiBase();

                // 输入框实时保存 + Enter 触发
                dirInput.addEventListener('input', () => setCurrentDir(dirInput.value));
                dirInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); loadLocalFiles(true); }
                });

                loadBtn.addEventListener('click', () => loadLocalFiles(true));

                // API 端点变更：规范化后写回
                apiInput.addEventListener('change', () => {
                    const newBase = setApiBase(apiInput.value);
                    apiInput.value = newBase;
                });

                resolve();
            }
            tryInject();
        });
    }

    function refreshUI() {
        if (!uiRoot) return;
        const dirInput = uiRoot.querySelector('.local-dir-input');
        if (dirInput && document.activeElement !== dirInput) dirInput.value = getCurrentDir();
        const apiInput = uiRoot.querySelector('.local-api-input');
        if (apiInput && document.activeElement !== apiInput) apiInput.value = getApiBase();
    }

    // ==================== 对外 API ====================
    window.MP3LocalPlugin = {
        version: '2.0.0',
        async init() {
            isActive = true;
            await injectUI();
            refreshUI();

            // 有目录则自动加载
            if (getCurrentDir()) {
                await loadLocalFiles(false);
            }
        },
        async unload() {
            isActive = false;

            const ext = window.MP3AppExtension;
            if (!ext) {
                if (uiRoot) { uiRoot.remove(); uiRoot = null; }
                return;
            }

            // 停止播放本地文件（如果正在播放）
            const playingKey = ext.currentPlayingFile;
            let isPlayingLocal = false;
            if (playingKey) {
                const pf = ext.allFiles.find(f => (f.relativePath || f.filename) === playingKey);
                isPlayingLocal = pf && pf._source === 'local';
            }

            ext.allFiles = ext.allFiles.filter(f => f._source !== 'local');

            if (isPlayingLocal) {
                try { ext.audioPlayer.pause(); } catch (e) {}
                ext.audioPlayer.removeAttribute('src');
                try { ext.audioPlayer.load(); } catch (e) {}
                ext.currentPlayingFile = null;
                const t = document.getElementById('currentSongTitle');
                const c = document.getElementById('currentSongCategory');
                if (t) t.innerText = '尚未選擇播放歌曲';
                if (c) c.innerText = '就緒';
                if (typeof window.MP3SetPlayerSourceBadge === 'function') window.MP3SetPlayerSourceBadge(null);
                if (typeof window.updatePlayButton === 'function') window.updatePlayButton();
                if (typeof window.updatePlayerLikeState === 'function') window.updatePlayerLikeState();
                if (typeof window.updatePlayerDislikeState === 'function') window.updatePlayerDislikeState();
            }

            ext.renderAll();

            if (uiRoot) {
                uiRoot.remove();
                uiRoot = null;
            }
        },
        loadLocalFiles
    };
})();