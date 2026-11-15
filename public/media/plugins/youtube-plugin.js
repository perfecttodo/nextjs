/**
 * ============================================================
 *  plugins/youtube-plugin.js — YouTube 播放清單插件 v1.0
 *
 *  功能：
 *   - 多清單管理：新增（URL / 清單 ID）、啟用 / 停用、重新整理、
 *     手動匯入、重新命名、刪除；清單與項目持久化於 localStorage
 *   - 透過官方 YouTube IFrame Player API 播放（不解析原始串流）
 *   - 自動接管主介面：進度條 / 時間 / 播放鍵 / 音量 / seek /
 *     鎖屏 Media Session / 播完自動切歌 / 嵌入受限自動跳過
 *   - 懸浮播放器視窗（可切換為純音訊模式）
 *
 *  依賴：MP3AppExtension / MP3RegisterSourceAdapter / MP3PluginManager
 *
 *  安裝：
 *   1) 本文件放於 plugins/ 目錄。
 *   2) plugins/plugin-center.js 的 REGISTRY 加入：
 *      youtube: { id: 'youtube', name: 'YouTube 播放清單', description: '匯入多個 YouTube 清單並播放',
 *          icon: 'fa-brands fa-youtube', iconClass: 'text-red-500',
 *          scriptSrc: 'plugins/youtube-plugin.js', globalVar: 'MP3YouTubePlugin',
 *          autoEnable: false, dataSourceKeys: ['youtube'] },
 *   3) 於插件中心啟用，並填入 YouTube Data API v3 金鑰（自動匯入用；
 *      無金鑰時可手動貼上影片 URL / ID）。
 *
 *  注意：
 *   - 行動瀏覽器首次播放可能需點一下播放器（自動播放政策）；
 *     鎖屏後 YouTube iframe 音訊可能被系統暫停，此為平台限制。
 *   - 私人 / 已刪除 / 禁止嵌入的影片會自動跳過。
 * ============================================================
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'youtube';
    const SOURCE_ID = 'youtube';
    const CATEGORY_NAME = 'YouTube';
    const KEY_PREFIX = 'youtube:';
    const STORE_KEY = 'mp3_youtube_plugin_v1';
    const API_BASE = 'https://www.googleapis.com/youtube/v3';
    const MAX_ITEMS = 500;

    let ext = null;
    let adapter = null;
    let initialized = false;
    let store = { apiKey: '', playlists: [], showDock: true };

    let ytPlayer = null;
    let ytApiPromise = null;
    let ytPending = null;
    let currentVideoId = null;
    let endedGuard = false;
    let ticker = null;
    let fetchBusy = false;
    let statusTimer = null;
    let uiRetry = 0;
    const orig = {};
    let dockEl = null;

    // ==================== 儲存 ====================
    function loadStore() {
        try {
            const s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            return {
                apiKey: String(s.apiKey || ''),
                playlists: Array.isArray(s.playlists) ? s.playlists.filter(p => p && p.id) : [],
                showDock: s.showDock !== false
            };
        } catch (e) { return { apiKey: '', playlists: [], showDock: true }; }
    }
    function saveStore() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
    }

    // ==================== 小工具 ====================
    function esc(s) {
        return typeof window.escapeHtmlAttr === 'function'
            ? window.escapeHtmlAttr(s)
            : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function fmtTime(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
        const p = n => String(n).padStart(2, '0');
        return h > 0 ? (h + ':' + p(m) + ':' + p(s)) : (p(m) + ':' + p(s));
    }
    function isYtCurrent() {
        return !!(ext && ext.currentPlayingFile && String(ext.currentPlayingFile).indexOf(KEY_PREFIX) === 0);
    }
    function extractListId(input) {
        const s = String(input || '').trim();
        if (!s) return '';
        const m = s.match(/[?&]list=([A-Za-z0-9_-]+)/);
        if (m) return m[1];
        if (/^[A-Za-z0-9_-]{10,}$/.test(s)) return s;
        return '';
    }
    function extractVideoId(line) {
        const s = String(line || '').trim();
        if (!s) return '';
        let m = s.match(/[?&]v=([A-Za-z0-9_-]{11})/);
        if (m) return m[1];
        m = s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
        if (m) return m[1];
        m = s.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
        if (m) return m[1];
        if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
        return '';
    }
    function parseDur(iso) {
        if (!iso) return 0;
        const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
        if (!m) return 0;
        return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
    }
    function showStatus(msg, tone) {
        const el = document.getElementById('ytStatus');
        if (!el) return;
        el.textContent = msg;
        el.className = 'text-[10px] leading-relaxed ' + (
            tone === 'success' ? 'text-emerald-400' :
            tone === 'warn' ? 'text-amber-400' :
            tone === 'error' ? 'text-rose-400' : 'text-slate-400');
        if (statusTimer) clearTimeout(statusTimer);
        statusTimer = setTimeout(() => {
            const cur = document.getElementById('ytStatus');
            if (cur) cur.classList.add('hidden');
        }, 5000);
    }

    // ==================== YouTube Data API ====================
    async function apiGet(path, params) {
        const q = new URLSearchParams(Object.assign({}, params, { key: store.apiKey }));
        const res = await fetch(API_BASE + '/' + path + '?' + q.toString());
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status));
        return data;
    }
    async function fillDurations(items) {
        for (let i = 0; i < items.length; i += 50) {
            const chunk = items.slice(i, i + 50);
            try {
                const res = await apiGet('videos', { part: 'contentDetails', id: chunk.map(x => x.videoId).join(',') });
                const map = {};
                (res.items || []).forEach(v => { map[v.id] = parseDur(v.contentDetails && v.contentDetails.duration); });
                chunk.forEach(x => { if (map[x.videoId]) x.duration = map[x.videoId]; });
            } catch (e) {}
        }
    }
    async function fetchPlaylist(listId) {
        if (!store.apiKey) throw new Error('請先設定 YouTube Data API v3 金鑰');
        const meta = await apiGet('playlists', { part: 'snippet,contentDetails', id: listId });
        if (!meta.items || !meta.items.length) throw new Error('找不到播放清單（可能為私人清單）');
        const title = meta.items[0].snippet.title;
        const author = meta.items[0].snippet.channelTitle || '';
        const items = [];
        let pageToken = '';
        do {
            const params = { part: 'snippet,contentDetails', playlistId: listId, maxResults: 50 };
            if (pageToken) params.pageToken = pageToken;
            const res = await apiGet('playlistItems', params);
            (res.items || []).forEach(it => {
                const vid = (it.contentDetails && it.contentDetails.videoId) ||
                    (it.snippet && it.snippet.resourceId && it.snippet.resourceId.videoId);
                const t = it.snippet ? it.snippet.title : '';
                if (!vid || !t || t === 'Private video' || t === 'Deleted video') return;
                items.push({ videoId: vid, title: t, author: (it.snippet && it.snippet.videoOwnerChannelTitle) || author, duration: 0 });
            });
            pageToken = res.nextPageToken || '';
        } while (pageToken && items.length < MAX_ITEMS);
        const trimmed = items.slice(0, MAX_ITEMS);
        await fillDurations(trimmed);
        return { title: title, author: author, items: trimmed };
    }

    // ==================== 清單操作 ====================
    function enabledItems() {
        const seen = new Set();
        const out = [];
        store.playlists.forEach(pl => {
            if (pl.enabled === false) return;
            (pl.items || []).forEach(it => {
                if (!it || !it.videoId || seen.has(it.videoId)) return;
                seen.add(it.videoId);
                out.push(Object.assign({}, it, { playlistTitle: pl.title || pl.id }));
            });
        });
        return out;
    }
    function toFile(it) {
        return {
            _key: KEY_PREFIX + it.videoId,
            videoId: it.videoId,
            url: 'https://www.youtube.com/watch?v=' + it.videoId,
            filename: it.title,
            displayName: it.title,
            relativePath: 'YouTube · ' + (it.playlistTitle || ''),
            category: CATEGORY_NAME,
            size: 0,
            duration: it.duration || 0,
            author: it.author || ''
        };
    }
    async function addPlaylist(input) {
        const listId = extractListId(input);
        if (!listId) { showStatus('無效的播放清單 URL / ID', 'warn'); return; }
        if (store.playlists.some(p => p.id === listId)) { showStatus('此清單已存在', 'warn'); return; }
        if (store.apiKey) {
            if (fetchBusy) return;
            fetchBusy = true;
            showStatus('正在讀取清單…', 'info');
            renderList();
            try {
                const data = await fetchPlaylist(listId);
                store.playlists.push({ id: listId, title: data.title, author: data.author, items: data.items, enabled: true, addedAt: Date.now() });
                saveStore();
                if (adapter) await adapter.refresh();
                showStatus('已新增「' + data.title + '」（' + data.items.length + ' 部）', 'success');
            } catch (e) {
                showStatus('讀取失敗：' + e.message, 'error');
            } finally {
                fetchBusy = false;
                renderList();
            }
        } else {
            const pl = { id: listId, title: listId, author: '', items: [], enabled: true, addedAt: Date.now() };
            store.playlists.push(pl);
            saveStore();
            if (adapter) await adapter.refresh();
            renderList();
            showStatus('已新增清單；未設金鑰，請手動匯入影片', 'warn');
            await importItems(pl.id);
        }
    }
    async function refreshPlaylist(id) {
        const pl = store.playlists.find(p => p.id === id);
        if (!pl || fetchBusy) return;
        if (!store.apiKey) { showStatus('請先設定 API 金鑰才能重新整理', 'warn'); return; }
        fetchBusy = true;
        showStatus('正在重新整理「' + (pl.title || id) + '」…', 'info');
        renderList();
        try {
            const data = await fetchPlaylist(id);
            pl.title = data.title; pl.author = data.author; pl.items = data.items;
            saveStore();
            if (adapter) await adapter.refresh();
            showStatus('已更新（' + data.items.length + ' 部）', 'success');
        } catch (e) {
            showStatus('更新失敗：' + e.message, 'error');
        } finally {
            fetchBusy = false;
            renderList();
        }
    }
    async function importItems(id) {
        const pl = store.playlists.find(p => p.id === id);
        if (!pl) return;
        const text = await ext.showCustomModal({
            title: '手動匯入影片', subtitle: pl.title || id,
            message: '每行一個影片 URL 或 ID（可用「URL | 名稱」自訂標題）：',
            type: 'confirm', isPrompt: true, defaultValue: '', confirmText: '匯入'
        });
        if (text === null) return;
        const existing = new Set((pl.items || []).map(x => x.videoId));
        let added = 0;
        String(text).split(/[\r\n]+/).forEach(line => {
            line = line.trim();
            if (!line) return;
            let title = '';
            const bar = line.indexOf('|');
            if (bar > -1) { title = line.slice(bar + 1).trim(); line = line.slice(0, bar).trim(); }
            const vid = extractVideoId(line);
            if (!vid || existing.has(vid)) return;
            existing.add(vid);
            pl.items.push({ videoId: vid, title: title || ('YouTube ' + vid), author: '', duration: 0 });
            added++;
        });
        if (added > 0) {
            saveStore();
            if (adapter) await adapter.refresh();
            showStatus('已匯入 ' + added + ' 部影片', 'success');
        } else {
            showStatus('沒有可匯入的新影片', 'warn');
        }
        renderList();
    }
    async function renamePlaylist(id) {
        const pl = store.playlists.find(p => p.id === id);
        if (!pl) return;
        const val = await ext.showCustomModal({
            title: '重新命名清單', message: '請輸入新的清單名稱：',
            type: 'confirm', isPrompt: true, defaultValue: pl.title || pl.id, confirmText: '儲存'
        });
        if (val === null) return;
        const name = String(val).trim();
        if (!name) return;
        pl.title = name;
        saveStore();
        if (adapter) await adapter.refresh();
        renderList();
    }
    async function removePlaylist(id) {
        const pl = store.playlists.find(p => p.id === id);
        if (!pl) return;
        const ok = await ext.showCustomModal({
            title: '刪除清單', message: '確定要刪除「' + (pl.title || id) + '」嗎？\n（只移除本機清單，不影響 YouTube）',
            type: 'danger', confirmText: '刪除'
        });
        if (!ok) return;
        store.playlists = store.playlists.filter(p => p.id !== id);
        saveStore();
        if (adapter) await adapter.refresh();
        renderList();
        showStatus('已刪除清單', 'success');
    }

    // ==================== YouTube IFrame 播放器 ====================
    function loadYtApi() {
        if (window.YT && window.YT.Player) return Promise.resolve();
        if (ytApiPromise) return ytApiPromise;
        ytApiPromise = new Promise((resolve, reject) => {
            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                try { if (typeof prev === 'function') prev(); } catch (e) {}
                resolve();
            };
            const s = document.createElement('script');
            s.src = 'https://www.youtube.com/iframe_api';
            s.onerror = () => reject(new Error('無法載入 YouTube IFrame API'));
            document.head.appendChild(s);
            setTimeout(() => { if (!(window.YT && window.YT.Player)) reject(new Error('YouTube API 載入逾時')); }, 15000);
        }).catch(e => { ytApiPromise = null; throw e; });
        return ytApiPromise;
    }

    function buildDock() {
        if (dockEl) return;
        dockEl = document.createElement('div');
        dockEl.id = 'ytDock';
        dockEl.className = 'fixed right-3 bottom-28 md:bottom-24 z-[45] w-[min(320px,calc(100vw-24px))] rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur shadow-2xl overflow-hidden';
        dockEl.innerHTML = `
            <div class="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
                <i class="fa-brands fa-youtube text-red-500 text-sm shrink-0"></i>
                <div id="ytDockTitle" class="flex-1 min-w-0 text-[11px] text-slate-200 truncate">YouTube</div>
                <button id="ytDockPlay" class="p-1 text-slate-400 hover:text-white shrink-0" title="播放 / 暫停"><i class="fa-solid fa-play text-[10px]"></i></button>
                <button id="ytDockToggle" class="p-1 text-slate-400 hover:text-white shrink-0" title="顯示 / 隱藏畫面"><i class="fa-solid fa-eye-slash text-[10px]"></i></button>
                <button id="ytDockClose" class="p-1 text-slate-400 hover:text-rose-400 shrink-0" title="停止並關閉"><i class="fa-solid fa-xmark text-[11px]"></i></button>
            </div>
            <div id="ytPlayerWrap" class="relative w-full aspect-video bg-black">
                <div id="ytPlayerHost" class="absolute inset-0"></div>
            </div>`;
        document.body.appendChild(dockEl);
        dockEl.querySelector('#ytDockPlay').addEventListener('click', toggleYt);
        dockEl.querySelector('#ytDockToggle').addEventListener('click', () => {
            store.showDock = !store.showDock;
            saveStore();
            applyDockMode();
            const cb = document.getElementById('ytShowDock');
            if (cb) cb.checked = store.showDock;
        });
        dockEl.querySelector('#ytDockClose').addEventListener('click', () => {
            try { if (ytPlayer) ytPlayer.stopVideo(); } catch (e) {}
            stopTicker();
            if (dockEl) dockEl.style.display = 'none';
            try { ext.stopIfPlayingFrom(SOURCE_ID); } catch (e) {}
        });
        applyDockMode();
    }
    function applyDockMode() {
        if (!dockEl) return;
        const wrap = dockEl.querySelector('#ytPlayerWrap');
        const icon = dockEl.querySelector('#ytDockToggle i');
        if (!wrap) return;
        if (store.showDock) {
            wrap.style.cssText = '';
            wrap.className = 'relative w-full aspect-video bg-black';
            if (icon) icon.className = 'fa-solid fa-eye-slash text-[10px]';
        } else {
            // 純音訊模式：保持 iframe 掛載與尺寸（不 reparent、不 display:none），移至畫面外
            wrap.className = 'bg-black';
            wrap.style.cssText = 'position:fixed;left:-10000px;top:0;width:200px;height:200px;';
            if (icon) icon.className = 'fa-solid fa-eye text-[10px]';
        }
    }
    function setDockTitle(t) {
        const el = document.getElementById('ytDockTitle');
        if (el) el.textContent = t || 'YouTube';
    }

    async function ensurePlayer() {
        await loadYtApi();
        if (ytPlayer) return ytPlayer;
        buildDock();
        dockEl.style.display = '';
        ytPlayer = await new Promise((resolve, reject) => {
            let done = false;
            const timer = setTimeout(() => { if (!done) { done = true; reject(new Error('YouTube 播放器初始化逾時')); } }, 20000);
            const vars = { playsinline: 1, controls: 1, rel: 0, modestbranding: 1 };
            if (/^https?:/.test(location.protocol)) vars.origin = location.origin;
            try {
                new window.YT.Player('ytPlayerHost', {
                    width: '100%', height: '100%',
                    playerVars: vars,
                    events: {
                        onReady: (e) => { if (!done) { done = true; clearTimeout(timer); resolve(e.target); } },
                        onStateChange: onYtState,
                        onError: onYtError,
                        onAutoplayBlocked: () => {
                            showStatus('自動播放被阻擋，請點擊 YouTube 播放器開始', 'warn');
                            store.showDock = true; saveStore(); applyDockMode();
                            if (ytPending) { ytPending.finish(); ytPending = null; }
                        }
                    }
                });
            } catch (e) { clearTimeout(timer); reject(e); }
        });
        try {
            const vol = parseFloat(localStorage.getItem('mp3_last_volume') || '1');
            ytPlayer.setVolume(Math.round(Math.max(0, Math.min(1, vol)) * 100));
        } catch (e) {}
        return ytPlayer;
    }

    async function playYouTube(file) {
        const player = await ensurePlayer();
        // 停掉主媒體元素，避免雙聲
        try { ext.audioPlayer.pause(); } catch (e) {}
        try { if (typeof ext.destroyPlayer === 'function') ext.destroyPlayer(); } catch (e) {}
        currentVideoId = file.videoId;
        endedGuard = false;
        dockEl.style.display = '';
        applyDockMode();
        setDockTitle(file.displayName);
        installYtMediaSession();
        await new Promise((resolve, reject) => {
            let settled = false;
            const finish = (err) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                if (err) reject(err); else resolve();
            };
            const timer = setTimeout(() => finish(new Error('YouTube 載入逾時')), 20000);
            ytPending = { finish: finish };
            try { player.loadVideoById({ videoId: file.videoId, startSeconds: 0 }); }
            catch (e) { finish(e); }
        });
        ytPending = null;
        startTicker();
        renderYtControls();
    }

    function onYtState(e) {
        const YT = window.YT;
        const st = e.data;
        if (ytPending && (st === YT.PlayerState.PLAYING || st === YT.PlayerState.PAUSED)) {
            ytPending.finish();
            ytPending = null;
        }
        if (st === YT.PlayerState.ENDED) {
            if (!endedGuard) {
                endedGuard = true;
                stopTicker();
                renderYtControls(st);
                const mode = localStorage.getItem('mp3_last_play_mode') || 'loop';
                if (mode === 'single') {
                    try { ytPlayer.seekTo(0, true); ytPlayer.playVideo(); } catch (err) {}
                } else {
                    try { window.playNext(); } catch (err) {}
                }
            }
            return;
        }
        if (st === YT.PlayerState.PLAYING) { endedGuard = false; startTicker(); }
        renderYtControls(st);
    }

    function onYtError(e) {
        const code = e && e.data;
        const msg = (code === 101 || code === 150) ? '此影片禁止嵌入播放' :
            code === 100 ? '影片不存在或已移除' : 'YouTube 播放錯誤（' + code + '）';
        if (ytPending) { ytPending.finish(new Error(msg)); ytPending = null; return; }
        showStatus(msg + '，自動跳過', 'warn');
        const vid = currentVideoId;
        setTimeout(() => {
            if (currentVideoId === vid && isYtCurrent()) {
                try { window.playNext(); } catch (err) {}
            }
        }, 1200);
    }

    function toggleYt() {
        if (!ytPlayer) return;
        try {
            const st = ytPlayer.getPlayerState();
            if (st === window.YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
            else ytPlayer.playVideo();
        } catch (e) {}
        renderYtControls();
    }

    function renderYtControls(st) {
        if (!isYtCurrent()) return;
        let state = st;
        if (state === undefined && ytPlayer) { try { state = ytPlayer.getPlayerState(); } catch (e) { state = -1; } }
        const playing = state === (window.YT && window.YT.PlayerState.PLAYING);
        const btn = document.getElementById('playPauseBtn');
        if (btn) btn.innerHTML = playing ? '<i class="fa-solid fa-pause text-xs"></i>' : '<i class="fa-solid fa-play text-xs"></i>';
        const dockBtn = document.querySelector('#ytDockPlay i');
        if (dockBtn) dockBtn.className = playing ? 'fa-solid fa-pause text-[10px]' : 'fa-solid fa-play text-[10px]';
        try { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; } catch (e) {}
    }

    function startTicker() { if (!ticker) ticker = setInterval(tick, 500); }
    function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }
    function tick() {
        if (!isYtCurrent() || !ytPlayer) { stopTicker(); return; }
        let dur = 0, cur = 0, st = -1;
        try { dur = ytPlayer.getDuration() || 0; cur = ytPlayer.getCurrentTime() || 0; st = ytPlayer.getPlayerState(); } catch (e) { return; }
        const pb = document.getElementById('progressBar');
        if (pb && dur > 0) pb.value = (cur / dur) * 100;
        const ct = document.getElementById('currentTime');
        if (ct) ct.innerText = fmtTime(cur);
        const dt = document.getElementById('durationTime');
        if (dt) dt.innerText = fmtTime(dur);
        renderYtControls(st);
        try {
            if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && dur > 0) {
                navigator.mediaSession.setPositionState({ duration: dur, playbackRate: 1, position: Math.min(cur, dur) });
            }
        } catch (e) {}
        if (st === 1) { try { sessionStorage.setItem('mp3_last_played_time', String(cur)); } catch (e) {} }
    }

    // ==================== 主介面接管 ====================
    function installWrappers() {
        orig.togglePlay = window.togglePlay;
        orig.seekAudio = window.seekAudio;
        orig.changeVolume = window.changeVolume;
        orig.updatePlayButton = window.updatePlayButton;
        window.togglePlay = function () {
            if (isYtCurrent() && ytPlayer) { toggleYt(); return; }
            return orig.togglePlay.apply(this, arguments);
        };
        window.seekAudio = function (v) {
            if (isYtCurrent() && ytPlayer) {
                try { const d = ytPlayer.getDuration() || 0; ytPlayer.seekTo((v / 100) * d, true); } catch (e) {}
                return;
            }
            return orig.seekAudio.apply(this, arguments);
        };
        window.changeVolume = function (v) {
            try { if (ytPlayer) ytPlayer.setVolume(Math.round(Math.max(0, Math.min(1, v)) * 100)); } catch (e) {}
            return orig.changeVolume.apply(this, arguments);
        };
        window.updatePlayButton = function () {
            const r = orig.updatePlayButton.apply(this, arguments);
            if (isYtCurrent()) renderYtControls();
            return r;
        };
    }
    function restoreWrappers() {
        Object.keys(orig).forEach(k => { if (typeof orig[k] === 'function') window[k] = orig[k]; });
    }
    function installYtMediaSession() {
        if (!('mediaSession' in navigator)) return;
        const ms = navigator.mediaSession;
        try {
            ms.setActionHandler('play', () => {
                if (isYtCurrent() && ytPlayer) ytPlayer.playVideo();
                else { try { ext.audioPlayer.play(); } catch (e) {} }
            });
            ms.setActionHandler('pause', () => {
                if (isYtCurrent() && ytPlayer) ytPlayer.pauseVideo();
                else { try { ext.audioPlayer.pause(); } catch (e) {} }
            });
            ms.setActionHandler('previoustrack', () => window.playPrev());
            ms.setActionHandler('nexttrack', () => window.playNext());
            ms.setActionHandler('seekto', (d) => {
                if (isYtCurrent() && ytPlayer && d && typeof d.seekTime === 'number') ytPlayer.seekTo(d.seekTime, true);
                else { try { ext.audioPlayer.currentTime = d.seekTime; } catch (e) {} }
            });
            ms.setActionHandler('seekbackward', (d) => {
                const s = (d && d.seekOffset) || 10;
                if (isYtCurrent() && ytPlayer) { try { ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime() - s), true); } catch (e) {} }
                else { try { ext.audioPlayer.currentTime = Math.max(0, ext.audioPlayer.currentTime - s); } catch (e) {} }
            });
            ms.setActionHandler('seekforward', (d) => {
                const s = (d && d.seekOffset) || 10;
                if (isYtCurrent() && ytPlayer) { try { ytPlayer.seekTo(ytPlayer.getCurrentTime() + s, true); } catch (e) {} }
                else { try { ext.audioPlayer.currentTime += s; } catch (e) {} }
            });
            ms.setActionHandler('stop', () => { try { if (ytPlayer) ytPlayer.stopVideo(); } catch (e) {} });
        } catch (e) {}
    }

    // ==================== 插件 UI ====================
    function renderUI() {
        if (!initialized) return;
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer(PLUGIN_ID);
        if (!body) { if (uiRetry++ < 25) setTimeout(renderUI, 200); return; }
        if (body.dataset.ytReady === '1') { renderList(); return; }
        body.dataset.ytReady = '1';
        body.innerHTML = `
            <div class="space-y-2 pt-1">
                <div class="flex items-center gap-1.5">
                    <input id="ytApiKey" type="password" placeholder="YouTube Data API v3 金鑰（自動匯入用）"
                        class="flex-1 min-w-0 bg-slate-800 border border-slate-700 text-[11px] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-200 placeholder:text-slate-600">
                    <button id="ytSaveKey" title="儲存金鑰" class="bg-slate-800 hover:bg-indigo-600 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl text-[11px] transition"><i class="fa-solid fa-key"></i></button>
                </div>
                <div class="flex items-center gap-1.5">
                    <input id="ytAddInput" type="text" placeholder="播放清單 URL 或 ID…"
                        class="flex-1 min-w-0 bg-slate-800 border border-slate-700 text-[11px] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-200 placeholder:text-slate-600">
                    <button id="ytAddBtn" title="新增清單" class="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-xl text-[11px] transition"><i class="fa-solid fa-plus"></i></button>
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-500">
                    <label class="flex items-center gap-1.5 cursor-pointer select-none">
                        <input id="ytShowDock" type="checkbox" class="w-3.5 h-3.5 accent-indigo-500">
                        <span>顯示播放器視窗</span>
                    </label>
                    <span id="ytTotal" class="font-mono text-slate-600">0 部</span>
                </div>
                <div id="ytStatus" class="hidden"></div>
                <div id="ytList" class="space-y-1.5 max-h-64 overflow-y-auto pr-0.5"></div>
                <div class="text-[9px] text-slate-600 leading-relaxed">無金鑰時可手動匯入影片 URL / ID；禁止嵌入的影片會自動跳過。</div>
            </div>`;
        const keyInput = body.querySelector('#ytApiKey');
        keyInput.value = store.apiKey;
        body.querySelector('#ytSaveKey').addEventListener('click', () => {
            store.apiKey = keyInput.value.trim();
            saveStore();
            showStatus(store.apiKey ? '金鑰已儲存' : '金鑰已清除', 'success');
        });
        const addInput = body.querySelector('#ytAddInput');
        body.querySelector('#ytAddBtn').addEventListener('click', () => { addPlaylist(addInput.value); addInput.value = ''; });
        addInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addPlaylist(addInput.value); addInput.value = ''; } });
        const dockCb = body.querySelector('#ytShowDock');
        dockCb.checked = store.showDock;
        dockCb.addEventListener('change', () => {
            store.showDock = dockCb.checked;
            saveStore();
            applyDockMode();
        });
        body.querySelector('#ytList').addEventListener('click', onListClick);
        body.querySelector('#ytList').addEventListener('change', onListChange);
        renderList();
    }

    function renderList() {
        const el = document.getElementById('ytList');
        const total = document.getElementById('ytTotal');
        if (total) total.textContent = enabledItems().length + ' 部';
        if (!el) return;
        if (!store.playlists.length) {
            el.innerHTML = '<div class="text-[10px] text-slate-600 text-center py-2">尚未新增任何播放清單</div>';
            return;
        }
        el.innerHTML = store.playlists.map(pl => {
            const count = (pl.items || []).length;
            const on = pl.enabled !== false;
            return `
            <div class="rounded-xl border border-slate-800 bg-slate-950/40 px-2.5 py-2 ${on ? '' : 'opacity-60'}" data-pl-id="${esc(pl.id)}">
                <div class="flex items-center gap-2">
                    <input type="checkbox" data-act="toggle" ${on ? 'checked' : ''} class="w-3.5 h-3.5 accent-indigo-500 shrink-0" title="載入 / 卸載此清單">
                    <div class="min-w-0 flex-1">
                        <div class="text-[11px] text-slate-200 truncate" title="${esc(pl.title || pl.id)}">${esc(pl.title || pl.id)}</div>
                        <div class="text-[9px] text-slate-500 truncate">${count} 部${pl.author ? ' · ' + esc(pl.author) : ''}${fetchBusy ? ' · 讀取中…' : ''}</div>
                    </div>
                    <button data-act="refresh" title="重新整理" class="p-1 text-slate-500 hover:text-indigo-400 shrink-0"><i class="fa-solid fa-rotate text-[9px]"></i></button>
                    <button data-act="import" title="手動匯入影片" class="p-1 text-slate-500 hover:text-indigo-400 shrink-0"><i class="fa-solid fa-file-import text-[9px]"></i></button>
                    <button data-act="rename" title="重新命名" class="p-1 text-slate-500 hover:text-indigo-400 shrink-0"><i class="fa-solid fa-pen text-[9px]"></i></button>
                    <button data-act="remove" title="刪除清單" class="p-1 text-slate-500 hover:text-rose-400 shrink-0"><i class="fa-solid fa-xmark text-[10px]"></i></button>
                </div>
            </div>`;
        }).join('');
    }

    function onListChange(e) {
        const input = e.target;
        if (!input.matches || !input.matches('input[data-act="toggle"]')) return;
        const row = input.closest('[data-pl-id]');
        if (!row) return;
        const pl = store.playlists.find(p => p.id === row.dataset.plId);
        if (!pl) return;
        pl.enabled = input.checked;
        saveStore();
        if (adapter) adapter.refresh().then(renderList).catch(renderList);
        else renderList();
    }
    function onListClick(e) {
        const btn = e.target.closest('button[data-act]');
        if (!btn) return;
        const row = btn.closest('[data-pl-id]');
        if (!row) return;
        const id = row.dataset.plId;
        const act = btn.dataset.act;
        if (act === 'refresh') refreshPlaylist(id);
        else if (act === 'import') importItems(id);
        else if (act === 'rename') renamePlaylist(id);
        else if (act === 'remove') removePlaylist(id);
    }

    // ==================== 生命週期 ====================
    async function init() {
        if (initialized) return;
        ext = window.MP3AppExtension;
        if (!ext) throw new Error('MP3AppExtension 未就緒');
        if (typeof window.MP3RegisterSourceAdapter !== 'function') throw new Error('DataSource Adapter 未就緒');
        initialized = true;
        uiRetry = 0;
        store = loadStore();

        window.MP3SourceRegistry = window.MP3SourceRegistry || {};
        window.MP3SourceRegistry[SOURCE_ID] = {
            label: 'YT', icon: 'fa-brands fa-youtube',
            badgeClass: 'bg-red-950/50 text-red-300 border-red-500/30', dotClass: 'bg-red-500'
        };

        renderUI();
        installWrappers();

        adapter = window.MP3RegisterSourceAdapter({
            id: SOURCE_ID,
            categoryName: CATEGORY_NAME,
            list: async () => ({ files: enabledItems().map(toFile) }),
            resolveMedia: async (file) => ({
                url: file.url,
                mimeType: 'video/mp4',
                play: () => playYouTube(file)
            }),
            delete: async (file) => {
                const vid = file.videoId;
                store.playlists.forEach(pl => { pl.items = (pl.items || []).filter(x => x.videoId !== vid); });
                saveStore();
                renderList();
            },
            reset: () => { try { if (ytPlayer) ytPlayer.pauseVideo(); } catch (e) {} },
            onUnload: () => { try { if (ytPlayer) ytPlayer.stopVideo(); } catch (e) {} stopTicker(); }
        });

        const handler = window.MP3DataSourceHandlers && window.MP3DataSourceHandlers[SOURCE_ID];
        if (handler) {
            handler.togglePlayback = () => { toggleYt(); };
        }

        ext.on('songchange', (file) => {
            if (!file || file._source !== SOURCE_ID) {
                stopTicker();
                if (dockEl) dockEl.style.display = 'none';
            }
        });

        await adapter.refresh();
        renderList();
        console.log('[YouTubePlugin] ready v1.0，清單 ' + store.playlists.length + ' 個');
    }

    async function unload() {
        if (!initialized) return;
        initialized = false;
        stopTicker();
        if (statusTimer) { clearTimeout(statusTimer); statusTimer = null; }
        restoreWrappers();
        try { if (ytPlayer) { ytPlayer.stopVideo(); ytPlayer.destroy(); } } catch (e) {}
        ytPlayer = null;
        ytPending = null;
        currentVideoId = null;
        if (dockEl) { dockEl.remove(); dockEl = null; }
        if (adapter) { try { await adapter.unload(); } catch (e) {} adapter = null; }
        try { delete window.MP3SourceRegistry[SOURCE_ID]; } catch (e) {}
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer(PLUGIN_ID);
        if (body) { body.innerHTML = ''; delete body.dataset.ytReady; }
        if (typeof window.refreshSourceFilterOptions === 'function') window.refreshSourceFilterOptions();
    }

    window.MP3YouTubePlugin = {
        version: '1.0',
        init: init,
        unload: unload,
        getPlaylists: () => store.playlists.slice(),
        refresh: () => adapter ? adapter.refresh() : Promise.resolve()
    };
})();