/**
 * 本地目錄插件 v3.1（加固版）
 * - init 顺序：ensureUI → renderRows → 各源并行 loadSource
 * - 每源独立 try/catch，失败只影响该源
 * - 数据"先清后加"，即使抛错也不留半截数据
 */
(function () {
    'use strict';

    const SOURCES_KEY = 'mp3_local_sources';

    let isActive = false;
    let uiRoot = null;
    let editingId = null;

    const status = {};

    function loadSources() {
        try { return JSON.parse(localStorage.getItem(SOURCES_KEY) || '[]'); } catch (e) { return []; }
    }
    function saveSources(list) {
        localStorage.setItem(SOURCES_KEY, JSON.stringify(list));
    }
    function genId() {
        return 'src_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    }
    function normalizeApiBase(base) {
        let b = String(base || '').trim().replace(/\/+$/, '');
        return b || '/api/mp3';
    }
    function getSourceStatus(id) {
        if (!status[id]) status[id] = { loading: false, count: 0, error: null };
        return status[id];
    }
    function getSourceName(src) {
        if (src.name && src.name.trim()) return src.name.trim();
        const parts = String(src.dir || '').split(/[\/\\]/).filter(Boolean);
        return parts[parts.length - 1] || src.dir || src.apiBase;
    }

    async function loadSource(src) {
        const ext = window.MP3AppExtension;
        if (!ext) return;

        const st = getSourceStatus(src.id);
        st.loading = true;
        st.error = null;
        renderRows();

        try {
            const res = await fetch(`${src.apiBase}?dir=${encodeURIComponent(src.dir)}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error || '加载失败');

            const likedMap = window.getLikedMap ? window.getLikedMap() : {};
            const dislikedMap = window.getDislikedMap ? window.getDislikedMap() : {};
            let tagsMap = {};
            try { tagsMap = JSON.parse(localStorage.getItem('mp3_tags_map') || '{}'); } catch (e) {}

            let likedChanged = false;
            let dislikedChanged = false;
            let tagsChanged = false;

            const newFiles = (data.files || []).map(f => {
                const fileKey = f.relativePath || f.filename;
                const uniqueKey = fileKey + '\x00' + src.id;

                let rawLike = likedMap[uniqueKey];
                if (!rawLike && likedMap[fileKey]) {
                    rawLike = likedMap[fileKey];
                    likedMap[uniqueKey] = rawLike;
                    likedChanged = true;
                }
                let rawDislike = dislikedMap[uniqueKey];
                if (!rawDislike && dislikedMap[fileKey]) {
                    rawDislike = dislikedMap[fileKey];
                    dislikedMap[uniqueKey] = rawDislike;
                    dislikedChanged = true;
                }
                let tags = tagsMap[uniqueKey];
                if (!tags && tagsMap[fileKey]) {
                    tags = tagsMap[fileKey];
                    tagsMap[uniqueKey] = tags;
                    tagsChanged = true;
                }

                return {
                    ...f,
                    _source: 'local',
                    _sourceId: src.id,
                    _key: uniqueKey,
                    _originalKey: fileKey,
                    _apiBase: src.apiBase,
                    _dir: src.dir,
                    isLiked: !!rawLike,
                    likedAt: window.parseLikedAt ? window.parseLikedAt(rawLike) : null,
                    isDisliked: !!rawDislike,
                    tags: tags || []
                };
            });

            if (likedChanged) window.saveLikedMap(likedMap);
            if (dislikedChanged) window.saveDislikedMap(dislikedMap);
            if (tagsChanged) window.saveTagsMap(tagsMap);

            // 先清后加
            ext.allFiles = ext.allFiles.filter(f => !(f._source === 'local' && f._sourceId === src.id));
            ext.allFiles = [...ext.allFiles, ...newFiles];

            st.count = newFiles.length;
            st.loading = false;

            ext.renderAll();
            if (typeof window.restoreLastPlayedSong === 'function') window.restoreLastPlayedSong();
        } catch (e) {
            st.loading = false;
            st.error = e.message;
            st.count = 0;
            ext.allFiles = ext.allFiles.filter(f => !(f._source === 'local' && f._sourceId === src.id));
            ext.renderAll();
        }
        renderRows();
    }

    async function loadAllSources() {
        if (!isActive) return;
        const sources = loadSources().filter(s => s.enabled);
        const ext = window.MP3AppExtension;
        if (ext) { ext.currentPage = 1; }
        if (typeof window.updateUrlParams === 'function') window.updateUrlParams();

        if (sources.length === 0) {
            if (ext) {
                ext.allFiles = ext.allFiles.filter(f => !(f._source === 'local' && f._sourceId));
                ext.renderAll();
            }
            renderRows();
            return;
        }

        await Promise.allSettled(sources.map(s => loadSource(s)));
    }

    async function unloadSource(id) {
        const ext = window.MP3AppExtension;
        if (!ext) return;

        const playingKey = ext.currentPlayingFile;
        const wasPlayingFromThis = playingKey && ext.allFiles.find(
            f => window.getFileKey(f) === playingKey && f._sourceId === id
        );

        ext.allFiles = ext.allFiles.filter(f => !(f._source === 'local' && f._sourceId === id));

        if (wasPlayingFromThis) {
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
    }

    async function addOrUpdateSource(form) {
        const sources = loadSources();
        const apiBase = normalizeApiBase(form.apiBase);
        const dir = (form.dir || '').trim();
        if (!dir) throw new Error('目錄路徑不能為空');

        if (editingId) {
            const idx = sources.findIndex(s => s.id === editingId);
            if (idx === -1) throw new Error('源不存在');
            sources[idx] = { ...sources[idx], name: form.name, apiBase, dir };
            saveSources(sources);
            await loadSource(sources[idx]);
        } else {
            const src = { id: genId(), name: form.name || '', apiBase, dir, enabled: true };
            sources.push(src);
            saveSources(sources);
            await loadSource(src);
        }
        renderRows();
    }

    async function removeSource(id) {
        if (!confirm('確定要刪除此目錄配置？')) return;
        const sources = loadSources().filter(s => s.id !== id);
        saveSources(sources);
        await unloadSource(id);
        renderRows();
    }

    async function toggleSourceEnabled(id, enabled) {
        const sources = loadSources();
        const src = sources.find(s => s.id === id);
        if (!src) return;
        src.enabled = enabled;
        saveSources(sources);
        if (enabled) await loadSource(src);
        else await unloadSource(id);
        renderRows();
    }

    function ensureUI() {
        return new Promise((resolve) => {
            function tryInject() {
                const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
                    ? window.MP3PluginManager.getBodyContainer('local') : null;
                if (!body) { setTimeout(tryInject, 300); return; }
                if (uiRoot) { resolve(); return; }

                uiRoot = document.createElement('div');
                uiRoot.className = 'space-y-1.5';
                uiRoot.innerHTML = `
                    <div class="local-sources-list space-y-1"></div>
                    <div class="flex items-center gap-1">
                        <button class="local-add-btn flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-[11px] font-medium transition shadow-sm">
                            <i class="fa-solid fa-plus mr-1"></i>新增目錄
                        </button>
                        <button class="local-reload-all p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition" title="重新加載所有啟用的源">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                    <div class="local-edit-form hidden bg-slate-800/60 border border-indigo-500/40 rounded-lg p-2 space-y-1.5">
                        <input type="text" class="local-form-name w-full bg-slate-900 border border-slate-700 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-200" placeholder="名稱（選填）">
                        <input type="text" class="local-form-api w-full bg-slate-900 border border-slate-700 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-200" placeholder="API 端點（預設 /api/mp3）">
                        <input type="text" class="local-form-dir w-full bg-slate-900 border border-slate-700 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-200" placeholder="目錄絕對路徑">
                        <div class="flex items-center gap-1">
                            <button class="local-form-save flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1 rounded text-[11px] font-medium transition">儲存</button>
                            <button class="local-form-cancel flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-1 rounded text-[11px] transition">取消</button>
                        </div>
                        <p class="local-form-error text-[10px] text-rose-400 hidden"></p>
                    </div>
                `;
                body.appendChild(uiRoot);

                uiRoot.querySelector('.local-add-btn').addEventListener('click', () => openForm(null));
                uiRoot.querySelector('.local-reload-all').addEventListener('click', () => loadAllSources());
                uiRoot.querySelector('.local-form-save').addEventListener('click', saveForm);
                uiRoot.querySelector('.local-form-cancel').addEventListener('click', closeForm);

                resolve();
            }
            tryInject();
        });
    }

    function renderRows() {
        if (!uiRoot) return;
        const list = uiRoot.querySelector('.local-sources-list');
        if (!list) return;

        const sources = loadSources();
        if (sources.length === 0) {
            list.innerHTML = `<p class="text-[10px] text-slate-600 px-1 py-1">尚無目錄，點擊下方「新增目錄」</p>`;
            return;
        }

        list.innerHTML = sources.map(src => {
            const st = getSourceStatus(src.id);
            const name = escapeHtmlAttr(getSourceName(src));
            const detail = escapeHtmlAttr(src.apiBase + ' · ' + src.dir);
            let statusText = '';
            let statusClass = 'text-slate-500';
            if (st.loading) { statusText = '加載中…'; statusClass = 'text-indigo-400'; }
            else if (st.error) { statusText = '失敗'; statusClass = 'text-rose-400'; }
            else if (st.count > 0) { statusText = st.count + ' 首'; statusClass = 'text-emerald-400'; }
            else if (src.enabled) { statusText = '—'; }
            else { statusText = '停用'; statusClass = 'text-slate-600'; }

            return `
                <div class="local-source-row bg-slate-800/40 border border-slate-700/60 rounded-lg p-2" data-id="${escapeHtmlAttr(src.id)}">
                    <div class="flex items-center gap-1.5">
                        <input type="checkbox" class="local-src-enable shrink-0" data-id="${escapeHtmlAttr(src.id)}" ${src.enabled ? 'checked' : ''}>
                        <span class="text-[11px] text-slate-200 font-medium flex-1 truncate" title="${name}">${name}</span>
                        <span class="local-src-status text-[10px] ${statusClass} whitespace-nowrap" title="${st.error ? escapeHtmlAttr(st.error) : ''}">${statusText}</span>
                        <button class="local-src-edit shrink-0 p-0.5 text-slate-500 hover:text-indigo-400" data-id="${escapeHtmlAttr(src.id)}" title="編輯"><i class="fa-solid fa-gear text-[10px]"></i></button>
                        <button class="local-src-del shrink-0 p-0.5 text-slate-500 hover:text-rose-400" data-id="${escapeHtmlAttr(src.id)}" title="刪除"><i class="fa-solid fa-xmark text-[10px]"></i></button>
                    </div>
                    <div class="text-[9px] text-slate-500 truncate mt-0.5 pl-5" title="${detail}">${detail}</div>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.local-src-enable').forEach(cb => {
            cb.addEventListener('change', (e) => {
                toggleSourceEnabled(e.target.dataset.id, e.target.checked);
            });
        });
        list.querySelectorAll('.local-src-edit').forEach(btn => {
            btn.addEventListener('click', () => openForm(btn.dataset.id));
        });
        list.querySelectorAll('.local-src-del').forEach(btn => {
            btn.addEventListener('click', () => removeSource(btn.dataset.id));
        });
    }

    function openForm(id) {
        if (!uiRoot) return;
        editingId = id;
        const form = uiRoot.querySelector('.local-edit-form');
        form.classList.remove('hidden');
        uiRoot.querySelector('.local-form-error').classList.add('hidden');

        const src = id ? loadSources().find(s => s.id === id) : null;
        uiRoot.querySelector('.local-form-name').value = src ? (src.name || '') : '';
        uiRoot.querySelector('.local-form-api').value = src ? src.apiBase : '/api/mp3';
        uiRoot.querySelector('.local-form-dir').value = src ? src.dir : '';

        setTimeout(() => uiRoot.querySelector('.local-form-dir').focus(), 50);
    }

    function closeForm() {
        if (!uiRoot) return;
        editingId = null;
        uiRoot.querySelector('.local-edit-form').classList.add('hidden');
    }

    async function saveForm() {
        if (!uiRoot) return;
        const name = uiRoot.querySelector('.local-form-name').value;
        const apiBase = uiRoot.querySelector('.local-form-api').value;
        const dir = uiRoot.querySelector('.local-form-dir').value;
        const errEl = uiRoot.querySelector('.local-form-error');

        try {
            errEl.classList.add('hidden');
            await addOrUpdateSource({ name, apiBase, dir });
            closeForm();
        } catch (e) {
            errEl.textContent = e.message;
            errEl.classList.remove('hidden');
        }
    }

    window.MP3LocalPlugin = {
        version: '3.1.0',
        async init() {
            isActive = true;
            await ensureUI();
            renderRows();
            const sources = loadSources().filter(s => s.enabled);
            // 每源独立，Promise.allSettled 保证一个失败不影响其他
            await Promise.allSettled(sources.map(s => loadSource(s)));
        },
        async unload() {
            isActive = false;

            const ext = window.MP3AppExtension;
            if (ext) {
                const playingKey = ext.currentPlayingFile;
                const playingFile = playingKey ? ext.allFiles.find(f => window.getFileKey(f) === playingKey) : null;
                const isPlayingLocal = playingFile && playingFile._source === 'local';

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
            }

            if (uiRoot) { uiRoot.remove(); uiRoot = null; }
            Object.keys(status).forEach(k => delete status[k]);
        },
        loadAllSources,
        loadSource,
        getSources: loadSources
    };
})();