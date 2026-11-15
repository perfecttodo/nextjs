/**
 * ============================================================
 *  plugins/youtube-plugin.js — YouTube 播放清單插件 v2.2
 *
 *  v2.2 變更：
 *   - 移除畫中畫（Document PiP）全部邏輯與按鈕
 *   - 移除插件面板的小窗大小滑桿
 *   - 視頻窗口：標題欄拖拽移動；四邊 + 四角（8 手柄）拖拽調整大小
 *   - 位置 / 尺寸持久化，自動限制在可視區域內；雙擊標題欄重設
 *   - 保留 v2.1：輸入框留空時「+」自動讀剪貼簿
 *
 *  匯入（金鑰可選）：自動免金鑰 / API 金鑰 / 手動貼上 / 檔案匯入
 *  播放：官方 YouTube IFrame Player API，接管進度 / 播放鍵 / 鎖屏 / 切歌
 * ============================================================
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'youtube';
    const SOURCE_ID = 'youtube';
    const CATEGORY_NAME = 'YouTube';
    const KEY_PREFIX = 'youtube:';
    const STORE_KEY = 'mp3_youtube_plugin_v2';
    const LEGACY_KEY = 'mp3_youtube_plugin_v1';
    const API_BASE = 'https://www.googleapis.com/youtube/v3';
    const OEMBED = 'https://www.youtube.com/oembed?format=json&url=';
    const MAX_ITEMS = 1000;

    const HEADER_H = 36;
    const MIN_W = 260, MIN_H = 180, MARGIN = 8;
    const HANDLES = [
        ['n', 'top:0;left:14px;right:14px;height:7px;cursor:ns-resize;'],
        ['s', 'bottom:0;left:14px;right:14px;height:7px;cursor:ns-resize;'],
        ['e', 'right:0;top:14px;bottom:14px;width:7px;cursor:ew-resize;'],
        ['w', 'left:0;top:14px;bottom:14px;width:7px;cursor:ew-resize;'],
        ['ne', 'top:0;right:0;width:15px;height:15px;cursor:nesw-resize;'],
        ['nw', 'top:0;left:0;width:15px;height:15px;cursor:nwse-resize;'],
        ['se', 'bottom:0;right:0;width:15px;height:15px;cursor:nwse-resize;'],
        ['sw', 'bottom:0;left:0;width:15px;height:15px;cursor:nesw-resize;']
    ];

    const DEFAULT_PIPED = ['https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de'];
    const DEFAULT_INVIDIOUS = ['https://inv.nadeko.net', 'https://invidious.nerdvpn.de'];
    const DEFAULT_PROXIES = ['https://api.allorigins.win/raw?url=', 'https://corsproxy.io/?url='];

    let ext = null, adapter = null, initialized = false;
    let store = null;
    let ytPlayer = null, ytApiPromise = null, ytPending = null;
    let currentVideoId = null, endedGuard = false, ticker = null;
    let busy = false, statusTimer = null, uiRetry = 0, dockEl = null;
    let clipboardBusy = false, dockStyleInjected = false, windowResizeBound = false;
    const orig = {};

    // ==================== 儲存 ====================
    function defaultStore() {
        return {
            apiKey: '', mode: 'auto', enrich: true, showDock: true,
            dockRect: null,
            piped: DEFAULT_PIPED.slice(), invidious: DEFAULT_INVIDIOUS.slice(),
            proxies: DEFAULT_PROXIES.slice(), lastGood: '', playlists: []
        };
    }
    function loadStore() {
        try {
            const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_KEY);
            const s = raw ? JSON.parse(raw) : {};
            const d = defaultStore();
            let rect = null;
            if (s.dockRect && typeof s.dockRect === 'object') rect = s.dockRect;
            else if (s.dockWidth) {
                const w = parseInt(s.dockWidth, 10) || 360;
                rect = { width: w, height: Math.round(w * 9 / 16) + HEADER_H, left: 12, top: 12 };
            }
            return {
                apiKey: String(s.apiKey || ''),
                mode: ['auto', 'api', 'manual', 'file'].indexOf(s.mode) > -1 ? s.mode : 'auto',
                enrich: s.enrich !== false,
                showDock: s.showDock !== false,
                dockRect: rect,
                piped: Array.isArray(s.piped) && s.piped.length ? s.piped : d.piped,
                invidious: Array.isArray(s.invidious) && s.invidious.length ? s.invidious : d.invidious,
                proxies: Array.isArray(s.proxies) && s.proxies.length ? s.proxies : d.proxies,
                lastGood: String(s.lastGood || ''),
                playlists: Array.isArray(s.playlists) ? s.playlists.filter(p => p && p.id) : []
            };
        } catch (e) { return defaultStore(); }
    }
    function saveStore() { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {} }

    // ==================== 工具 ====================
    function esc(s) {
        return typeof window.escapeHtmlAttr === 'function' ? window.escapeHtmlAttr(s)
            : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function fmtTime(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
        const p = n => String(n).padStart(2, '0');
        return h > 0 ? h + ':' + p(m) + ':' + p(s) : p(m) + ':' + p(s);
    }
    function isYtCurrent() { return !!(ext && ext.currentPlayingFile && String(ext.currentPlayingFile).indexOf(KEY_PREFIX) === 0); }
    function extractListId(input) {
        const s = String(input || '').trim();
        const m = s.match(/[?&]list=([A-Za-z0-9_-]+)/);
        if (m) return m[1];
        return /^[A-Za-z0-9_-]{10,}$/.test(s) ? s : '';
    }
    function extractVideoId(line) {
        const s = String(line || '').trim();
        let m = s.match(/[?&]v=([A-Za-z0-9_-]{11})/); if (m) return m[1];
        m = s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/); if (m) return m[1];
        m = s.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/); if (m) return m[1];
        return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : '';
    }
    function parseDur(iso) {
        if (!iso) return 0;
        const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
        return m ? (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0)) : 0;
    }
    function showStatus(msg, tone) {
        const el = document.getElementById('ytStatus');
        if (!el) return;
        el.textContent = msg;
        el.className = 'text-[10px] leading-relaxed ' + (
            tone === 'success' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' :
            tone === 'error' ? 'text-rose-400' : 'text-slate-400');
        el.classList.remove('hidden');
        if (statusTimer) clearTimeout(statusTimer);
        statusTimer = setTimeout(() => { const c = document.getElementById('ytStatus'); if (c) c.classList.add('hidden'); }, 6000);
    }
    async function rawFetch(url, ms) {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), ms || 9000);
        try {
            const res = await fetch(url, { signal: ctl.signal, credentials: 'omit' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.text();
        } finally { clearTimeout(t); }
    }
    async function jsonFetch(url, ms) {
        const txt = await rawFetch(url, ms);
        try { return JSON.parse(txt); } catch (e) { throw new Error('回應非 JSON'); }
    }

    // ==================== 剪貼簿新增 ====================
    async function readClipboardText() {
        if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') return '';
        try { return await navigator.clipboard.readText(); } catch (e) { return ''; }
    }
    async function handleAddFromInput() {
        const input = document.getElementById('ytAddInput');
        const btn = document.getElementById('ytAddBtn');
        if (!input || busy || clipboardBusy) return;

        if (store.mode === 'file') {
            const f = document.getElementById('ytFile');
            if (f) { f.dataset.target = ''; f.dataset.name = input.value.trim(); f.click(); }
            input.value = '';
            return;
        }

        let value = input.value.trim();
        if (!value) {
            clipboardBusy = true;
            const old = btn ? btn.innerHTML : '';
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
            try {
                const clip = await readClipboardText();
                if (!extractListId(clip)) {
                    showStatus('剪貼簿中沒有播放清單連結，請手動貼上', 'warn');
                    input.focus();
                    return;
                }
                value = clip.trim();
                input.value = value;
                showStatus('已從剪貼簿讀取播放清單', 'success');
            } finally {
                clipboardBusy = false;
                if (btn) { btn.disabled = false; btn.innerHTML = old; }
            }
        }
        await addPlaylist(value);
        input.value = '';
    }

    // ==================== oEmbed 補標題 ====================
    async function enrichTitles(items) {
        const need = items.filter(x => !x.title);
        if (!need.length) return;
        let idx = 0;
        async function worker() {
            while (idx < need.length) {
                const it = need[idx++];
                try {
                    const d = await jsonFetch(OEMBED + encodeURIComponent('https://www.youtube.com/watch?v=' + it.videoId), 7000);
                    if (d && d.title) { it.title = d.title; if (!it.author && d.author_name) it.author = d.author_name; }
                } catch (e) { it.title = it.title || ('YouTube ' + it.videoId); }
            }
        }
        await Promise.all([worker(), worker(), worker()]);
    }

    // ==================== 來源 ====================
    async function viaPiped(base, listId) {
        const d = await jsonFetch(base.replace(/\/+$/, '') + '/playlists/' + encodeURIComponent(listId), 9000);
        if (!d || !Array.isArray(d.videos)) throw new Error('Piped 回應格式不符');
        const items = d.videos.map(v => {
            const id = extractVideoId(v.url || v.videoId || '');
            return id ? { videoId: id, title: v.title || '', author: v.uploaderName || d.uploader || '', duration: v.duration || 0 } : null;
        }).filter(Boolean);
        if (!items.length) throw new Error('Piped 無可用影片');
        return { title: d.name || listId, author: d.uploader || '', items };
    }
    async function viaInvidious(base, listId) {
        const d = await jsonFetch(base.replace(/\/+$/, '') + '/api/v1/playlists/' + encodeURIComponent(listId), 9000);
        if (!d || !Array.isArray(d.videos)) throw new Error('Invidious 回應格式不符');
        const items = d.videos.map(v => ({ videoId: v.videoId, title: v.title || '', author: v.author || d.author || '', duration: v.lengthSeconds || 0 })).filter(x => x.videoId);
        if (!items.length) throw new Error('Invidious 無可用影片');
        return { title: d.title || listId, author: d.author || '', items };
    }
    function balancedJson(text, startIdx) {
        let depth = 0, inStr = false, escp = false;
        for (let i = startIdx; i < text.length; i++) {
            const c = text[i];
            if (inStr) {
                if (escp) escp = false;
                else if (c === '\\') escp = true;
                else if (c === '"') inStr = false;
                continue;
            }
            if (c === '"') inStr = true;
            else if (c === '{') depth++;
            else if (c === '}') { depth--; if (depth === 0) return text.slice(startIdx, i + 1); }
        }
        return null;
    }
    function collectKey(obj, key, out, depth) {
        if (!obj || typeof obj !== 'object' || (depth || 0) > 40) return;
        if (Array.isArray(obj)) { for (const o of obj) collectKey(o, key, out, (depth || 0) + 1); return; }
        if (obj[key]) out.push(obj[key]);
        for (const k in obj) collectKey(obj[k], key, out, (depth || 0) + 1);
    }
    async function viaProxyPage(prefix, listId) {
        const target = 'https://www.youtube.com/playlist?list=' + encodeURIComponent(listId) + '&hl=en';
        const html = await rawFetch(prefix + encodeURIComponent(target), 13000);
        const at = html.indexOf('ytInitialData');
        if (at < 0) throw new Error('Proxy 頁面無 ytInitialData');
        const json = balancedJson(html, html.indexOf('{', at));
        if (!json) throw new Error('ytInitialData 解析失敗');
        const data = JSON.parse(json);
        const rows = []; collectKey(data, 'playlistVideoRenderer', rows);
        if (!rows.length) throw new Error('清單頁無影片（可能為私人清單）');
        const items = rows.map(r => ({
            videoId: r.videoId,
            title: (r.title && (r.title.simpleText || (r.title.runs && r.title.runs[0].text))) || '',
            author: (r.shortBylineText && r.shortBylineText.runs && r.shortBylineText.runs[0].text) || '',
            duration: parseInt(r.lengthSeconds || '0', 10) || 0
        })).filter(x => x.videoId);
        const heads = []; collectKey(data, 'playlistHeaderRenderer', heads);
        const meta = []; collectKey(data, 'playlistMetadataRenderer', meta);
        const title = (heads[0] && heads[0].title && (heads[0].title.simpleText || (heads[0].title.runs && heads[0].title.runs[0].text))) || (meta[0] && meta[0].title) || listId;
        return { title, author: '', items, partial: true };
    }
    async function viaProxyRss(prefix, listId) {
        const target = 'https://www.youtube.com/feeds/videos.xml?playlist_id=' + encodeURIComponent(listId);
        const xml = await rawFetch(prefix + encodeURIComponent(target), 11000);
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const entries = Array.from(doc.getElementsByTagName('entry'));
        if (!entries.length) throw new Error('RSS 無項目');
        const items = entries.map(en => {
            const vidEl = en.getElementsByTagName('yt:videoId')[0] || en.getElementsByTagName('videoId')[0];
            const tEl = en.getElementsByTagName('title')[0];
            return { videoId: vidEl ? vidEl.textContent.trim() : '', title: tEl ? tEl.textContent.trim() : '', author: '', duration: 0 };
        }).filter(x => x.videoId);
        const feedTitle = doc.querySelector('feed > title');
        return { title: feedTitle ? feedTitle.textContent.trim() : listId, author: '', items, partial: true };
    }
    async function viaApi(listId) {
        if (!store.apiKey) throw new Error('尚未設定 API 金鑰');
        const get = async (path, params) => {
            const q = new URLSearchParams(Object.assign({}, params, { key: store.apiKey }));
            return jsonFetch(API_BASE + '/' + path + '?' + q.toString(), 12000);
        };
        const meta = await get('playlists', { part: 'snippet,contentDetails', id: listId });
        if (!meta.items || !meta.items.length) throw new Error('找不到清單（可能為私人清單）');
        const title = meta.items[0].snippet.title, author = meta.items[0].snippet.channelTitle || '';
        const items = []; let pageToken = '';
        do {
            const p = { part: 'snippet,contentDetails', playlistId: listId, maxResults: 50 };
            if (pageToken) p.pageToken = pageToken;
            const res = await get('playlistItems', p);
            (res.items || []).forEach(it => {
                const vid = (it.contentDetails && it.contentDetails.videoId) || (it.snippet && it.snippet.resourceId && it.snippet.resourceId.videoId);
                const t = it.snippet ? it.snippet.title : '';
                if (!vid || t === 'Private video' || t === 'Deleted video') return;
                items.push({ videoId: vid, title: t || '', author: (it.snippet && it.snippet.videoOwnerChannelTitle) || author, duration: 0 });
            });
            pageToken = res.nextPageToken || '';
        } while (pageToken && items.length < MAX_ITEMS);
        for (let i = 0; i < items.length; i += 50) {
            const chunk = items.slice(i, i + 50);
            try {
                const res = await get('videos', { part: 'contentDetails', id: chunk.map(x => x.videoId).join(',') });
                const map = {}; (res.items || []).forEach(v => { map[v.id] = parseDur(v.contentDetails && v.contentDetails.duration); });
                chunk.forEach(x => { if (map[x.videoId]) x.duration = map[x.videoId]; });
            } catch (e) {}
        }
        return { title, author, items };
    }
    async function resolvePlaylist(listId, onProgress) {
        if (store.mode === 'api') {
            onProgress('使用 API 金鑰讀取…');
            const r = await viaApi(listId); r.source = 'API 金鑰'; return r;
        }
        const chain = [];
        const push = (label, fn) => chain.push({ label, fn });
        if (store.lastGood) {
            const lg = store.lastGood;
            if (lg.indexOf('piped:') === 0) push(lg.slice(6), () => viaPiped(lg.slice(6), listId));
            else if (lg.indexOf('inv:') === 0) push(lg.slice(4), () => viaInvidious(lg.slice(4), listId));
            else if (lg.indexOf('page:') === 0) push('Proxy 清單頁', () => viaProxyPage(lg.slice(5), listId));
            else if (lg.indexOf('rss:') === 0) push('Proxy RSS', () => viaProxyRss(lg.slice(4), listId));
        }
        store.piped.slice(0, 2).forEach(b => push(b, () => viaPiped(b, listId)));
        store.invidious.slice(0, 2).forEach(b => push(b, () => viaInvidious(b, listId)));
        if (store.proxies[0]) push('Proxy 清單頁', () => viaProxyPage(store.proxies[0], listId));
        if (store.proxies[0]) push('Proxy RSS', () => viaProxyRss(store.proxies[0], listId));
        const errors = [];
        for (let i = 0; i < chain.length; i++) {
            const c = chain[i];
            onProgress('免金鑰來源 ' + (i + 1) + '/' + chain.length + '：' + c.label.replace(/^https?:\/\//, '') + '…');
            try {
                const r = await c.fn();
                if (r && r.items && r.items.length) {
                    r.source = c.label.replace(/^https?:\/\//, '');
                    if (c.label.indexOf('Proxy') === 0) store.lastGood = (c.label === 'Proxy RSS' ? 'rss:' : 'page:') + store.proxies[0];
                    else if (store.piped.indexOf(c.label) > -1) store.lastGood = 'piped:' + c.label;
                    else if (store.invidious.indexOf(c.label) > -1) store.lastGood = 'inv:' + c.label;
                    saveStore();
                    return r;
                }
            } catch (e) { errors.push(c.label.replace(/^https?:\/\//, '') + '：' + e.message); }
        }
        throw new Error('免金鑰來源皆失敗。建議改用「檔案匯入」（Takeout CSV）或設定 API 金鑰。\n' + errors.slice(0, 3).join('\n'));
    }

    // ==================== 檔案 / 文字解析 ====================
    function parseCsv(text) {
        const rows = []; let row = [], field = '', inQ = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (inQ) {
                if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
                else field += c;
            } else if (c === '"') inQ = true;
            else if (c === ',') { row.push(field); field = ''; }
            else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
            else if (c !== '\r') field += c;
        }
        if (field || row.length) { row.push(field); rows.push(row); }
        return rows.filter(r => r.some(x => String(x).trim()));
    }
    function itemsFromText(text) {
        const out = [], seen = new Set();
        String(text).split(/[\r\n]+/).forEach(line => {
            line = line.trim(); if (!line) return;
            let title = '';
            const bar = line.indexOf('|');
            if (bar > -1) { title = line.slice(bar + 1).trim(); line = line.slice(0, bar).trim(); }
            line.split(/[,\s]+/).forEach(tok => {
                const id = extractVideoId(tok);
                if (id && !seen.has(id)) { seen.add(id); out.push({ videoId: id, title, author: '', duration: 0 }); }
            });
        });
        return out;
    }
    function itemsFromCsv(text) {
        const rows = parseCsv(text);
        if (!rows.length) return [];
        const head = rows[0].map(h => String(h).trim().toLowerCase());
        let idIdx = head.findIndex(h => /video\s*id|^id$/.test(h));
        let titleIdx = head.findIndex(h => /^(title|video title|name|影片標題|標題)$/.test(h));
        let body = rows.slice(1);
        if (idIdx < 0) { idIdx = -1; titleIdx = -1; body = rows; }
        const out = [], seen = new Set();
        body.forEach(r => {
            let id = '', title = '';
            if (idIdx >= 0) { id = extractVideoId(r[idIdx] || ''); title = titleIdx >= 0 ? String(r[titleIdx] || '').trim() : ''; }
            if (!id) { for (const cell of r) { const v = extractVideoId(cell); if (v) { id = v; break; } } }
            if (id && !seen.has(id)) { seen.add(id); out.push({ videoId: id, title, author: '', duration: 0 }); }
        });
        return out;
    }
    function itemsFromJson(text) {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.videos) ? data.videos : []));
        const out = [], seen = new Set();
        arr.forEach(v => {
            const id = extractVideoId(v.videoId || v.id || v.url || '');
            if (id && !seen.has(id)) { seen.add(id); out.push({ videoId: id, title: v.title || v.name || '', author: v.author || v.uploader || '', duration: v.duration || v.lengthSeconds || 0 }); }
        });
        return out;
    }

    // ==================== 清單資料 ====================
    function enabledItems() {
        const seen = new Set(), out = [];
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
            _key: KEY_PREFIX + it.videoId, videoId: it.videoId,
            url: 'https://www.youtube.com/watch?v=' + it.videoId,
            filename: it.title || ('YouTube ' + it.videoId),
            displayName: it.title || ('YouTube ' + it.videoId),
            relativePath: 'YouTube · ' + (it.playlistTitle || '') + (it.duration ? ' · ' + fmtTime(it.duration) : ''),
            category: CATEGORY_NAME, size: 0, duration: it.duration || 0, author: it.author || ''
        };
    }
    async function commitPlaylist(pl, data, note) {
        pl.title = data.title || pl.title || pl.id;
        pl.author = data.author || pl.author || '';
        pl.items = (data.items || []).slice(0, MAX_ITEMS);
        pl.source = data.source || pl.source || '';
        if (store.enrich) { showStatus('補齊影片標題（oEmbed，免金鑰）…', 'info'); await enrichTitles(pl.items); }
        pl.items.forEach(x => { if (!x.title) x.title = 'YouTube ' + x.videoId; });
        saveStore();
        if (adapter) await adapter.refresh();
        renderList();
        showStatus(note + '「' + pl.title + '」（' + pl.items.length + ' 部' + (data.partial ? '，部分' : '') + '）', 'success');
    }
    async function addPlaylist(input) {
        if (busy) return;
        const listId = extractListId(input);
        if (!listId) { showStatus('無效的清單 URL / ID', 'warn'); return; }
        if (store.playlists.some(p => p.id === listId)) { showStatus('此清單已存在', 'warn'); return; }
        if (store.mode === 'manual' || store.mode === 'file') {
            const pl = { id: listId, title: listId, author: '', items: [], enabled: true, addedAt: Date.now(), source: store.mode === 'file' ? '檔案匯入' : '手動貼上' };
            store.playlists.push(pl); saveStore(); renderList();
            if (store.mode === 'manual') await manualImport(pl.id);
            else { const f = document.getElementById('ytFile'); if (f) { f.dataset.target = pl.id; f.click(); } }
            return;
        }
        busy = true; renderList();
        const pl = { id: listId, title: listId, author: '', items: [], enabled: true, addedAt: Date.now() };
        try {
            const data = await resolvePlaylist(listId, m => showStatus(m, 'info'));
            pl.source = data.source;
            store.playlists.push(pl);
            await commitPlaylist(pl, data, '已新增 ');
        } catch (e) { showStatus(e.message, 'error'); }
        finally { busy = false; renderList(); }
    }
    async function refreshPlaylist(id) {
        const pl = store.playlists.find(p => p.id === id);
        if (!pl || busy) return;
        if (store.mode === 'manual' || store.mode === 'file') { showStatus('此模式請用「匯入」更新內容', 'warn'); return; }
        busy = true; renderList();
        try { const data = await resolvePlaylist(id, m => showStatus(m, 'info')); await commitPlaylist(pl, data, '已更新 '); }
        catch (e) { showStatus(e.message, 'error'); }
        finally { busy = false; renderList(); }
    }
    async function manualImport(id) {
        const pl = store.playlists.find(p => p.id === id);
        if (!pl) return;
        const text = await ext.showCustomModal({
            title: '手動匯入影片', subtitle: pl.title || pl.id,
            message: '每行一個影片 URL 或 ID，可用「URL | 名稱」自訂標題：',
            type: 'confirm', isPrompt: true, defaultValue: '', confirmText: '匯入'
        });
        if (text === null) return;
        const items = itemsFromText(text);
        if (!items.length) { showStatus('沒有解析到影片', 'warn'); return; }
        const seen = new Set((pl.items || []).map(x => x.videoId));
        const add = items.filter(x => !seen.has(x.videoId));
        pl.items = (pl.items || []).concat(add);
        if (store.enrich) { showStatus('補齊標題中…', 'info'); await enrichTitles(pl.items); }
        pl.items.forEach(x => { if (!x.title) x.title = 'YouTube ' + x.videoId; });
        saveStore(); if (adapter) await adapter.refresh(); renderList();
        showStatus('已匯入 ' + add.length + ' 部', 'success');
    }
    async function handleFiles(files, targetId) {
        if (!files || !files.length) return;
        busy = true; renderList();
        let total = 0;
        try {
            for (const file of Array.from(files)) {
                const text = await file.text();
                const name = file.name.replace(/\.[^.]+$/, '').replace(/-videos$/i, '');
                let items = [];
                try {
                    if (/\.json$/i.test(file.name)) items = itemsFromJson(text);
                    else if (/\.csv$/i.test(file.name)) items = itemsFromCsv(text);
                    else items = itemsFromText(text);
                } catch (e) { items = itemsFromCsv(text); }
                if (!items.length) continue;
                let pl = targetId ? store.playlists.find(p => p.id === targetId) : null;
                if (!pl) {
                    pl = store.playlists.find(p => p.title === name);
                    if (!pl) { pl = { id: 'local:' + name + ':' + Date.now().toString(36), title: name, author: '', items: [], enabled: true, addedAt: Date.now(), source: '檔案匯入' }; store.playlists.push(pl); }
                }
                const seen = new Set((pl.items || []).map(x => x.videoId));
                const add = items.filter(x => !seen.has(x.videoId));
                pl.items = (pl.items || []).concat(add).slice(0, MAX_ITEMS);
                total += add.length;
                targetId = null;
            }
            if (total && store.enrich) {
                showStatus('補齊標題（oEmbed，免金鑰）…', 'info');
                for (const pl of store.playlists) await enrichTitles(pl.items || []);
            }
            store.playlists.forEach(pl => (pl.items || []).forEach(x => { if (!x.title) x.title = 'YouTube ' + x.videoId; }));
            saveStore(); if (adapter) await adapter.refresh();
            showStatus(total ? '已從檔案匯入 ' + total + ' 部' : '檔案中沒有新的影片', total ? 'success' : 'warn');
        } catch (e) { showStatus('檔案處理失敗：' + e.message, 'error'); }
        finally { busy = false; renderList(); }
    }
    async function renamePlaylist(id) {
        const pl = store.playlists.find(p => p.id === id); if (!pl) return;
        const val = await ext.showCustomModal({ title: '重新命名清單', message: '請輸入新名稱：', type: 'confirm', isPrompt: true, defaultValue: pl.title || pl.id, confirmText: '儲存' });
        if (val === null) return;
        const n = String(val).trim(); if (!n) return;
        pl.title = n; saveStore(); if (adapter) await adapter.refresh(); renderList();
    }
    async function removePlaylist(id) {
        const pl = store.playlists.find(p => p.id === id); if (!pl) return;
        const ok = await ext.showCustomModal({ title: '刪除清單', message: '確定刪除「' + (pl.title || id) + '」？\n（只移除本機記錄）', type: 'danger', confirmText: '刪除' });
        if (!ok) return;
        store.playlists = store.playlists.filter(p => p.id !== id);
        saveStore(); if (adapter) await adapter.refresh(); renderList();
        showStatus('已刪除清單', 'success');
    }

    // ==================== 視窗幾何（拖拽 / 縮放） ====================
    function clampRect(r) {
        const maxW = Math.max(160, window.innerWidth - MARGIN * 2);
        const maxH = Math.max(HEADER_H + 60, window.innerHeight - MARGIN * 2);
        const minW = Math.min(MIN_W, maxW);
        const minH = Math.min(MIN_H, maxH);
        const width = Math.max(minW, Math.min(maxW, Math.round(r.width)));
        const height = Math.max(minH, Math.min(maxH, Math.round(r.height)));
        const left = Math.max(MARGIN, Math.min(window.innerWidth - MARGIN - width, Math.round(r.left)));
        const top = Math.max(MARGIN, Math.min(window.innerHeight - MARGIN - height, Math.round(r.top)));
        return { left, top, width, height };
    }
    function defaultDockRect() {
        const w = Math.min(380, window.innerWidth - 24);
        const h = Math.round(w * 9 / 16) + HEADER_H;
        return clampRect({ left: window.innerWidth - w - 12, top: window.innerHeight - h - 108, width: w, height: h });
    }
    function ensureDockRect() {
        if (!store.dockRect) store.dockRect = defaultDockRect();
        else store.dockRect = clampRect(store.dockRect);
    }
    function injectDockStyle() {
        if (dockStyleInjected) return;
        dockStyleInjected = true;
        const s = document.createElement('style');
        s.id = 'ytDockStyles';
        s.textContent = `
            #ytDock{transition:box-shadow .18s ease}
            #ytDockHeader{touch-action:none;height:${HEADER_H}px}
            #ytDock [data-resize]{touch-action:none;z-index:6}
            #ytDock [data-resize]:hover{background:rgba(99,102,241,.45)}
            #ytDock.is-interacting{box-shadow:0 24px 60px rgba(2,6,23,.75),0 0 0 1px rgba(99,102,241,.55)}
            #ytDock.is-interacting #ytDockHeader{background:rgba(49,46,129,.35)}
        `;
        document.head.appendChild(s);
    }
    function applyDockRect() {
        if (!dockEl) return;
        ensureDockRect();
        const r = store.dockRect;
        dockEl.style.left = r.left + 'px';
        dockEl.style.top = r.top + 'px';
        dockEl.style.width = r.width + 'px';
        dockEl.style.height = (store.showDock ? r.height : HEADER_H) + 'px';
        dockEl.querySelectorAll('[data-resize]').forEach(h => { h.style.display = store.showDock ? '' : 'none'; });
        const wrap = dockEl.querySelector('#ytPlayerWrap');
        if (wrap) {
            if (store.showDock) wrap.style.cssText = 'position:absolute;left:0;right:0;bottom:0;top:' + HEADER_H + 'px;background:#000;z-index:1;';
            else wrap.style.cssText = 'position:fixed;left:-10000px;top:0;width:200px;height:200px;background:#000;';
        }
        const toggleIcon = dockEl.querySelector('#ytDockToggle i');
        if (toggleIcon) toggleIcon.className = store.showDock ? 'fa-solid fa-eye-slash text-[10px]' : 'fa-solid fa-eye text-[10px]';
    }
    function resetDock() {
        store.dockRect = defaultDockRect();
        store.showDock = true;
        saveStore();
        applyDockRect();
        const cb = document.getElementById('ytShowDock'); if (cb) cb.checked = true;
        showStatus('已重設視窗位置與大小', 'success');
    }
    function bindDockInteractions() {
        const header = dockEl.querySelector('#ytDockHeader');
        header.addEventListener('pointerdown', e => {
            if (e.target.closest('button')) return;
            if (e.button !== undefined && e.button !== 0) return;
            e.preventDefault();
            ensureDockRect();
            const start = Object.assign({}, store.dockRect);
            const sx = e.clientX, sy = e.clientY;
            dockEl.classList.add('is-interacting');
            try { header.setPointerCapture(e.pointerId); } catch (x) {}
            const move = ev => {
                store.dockRect = clampRect(Object.assign({}, start, { left: start.left + ev.clientX - sx, top: start.top + ev.clientY - sy }));
                applyDockRect();
            };
            const up = ev => {
                try { header.releasePointerCapture(ev.pointerId); } catch (x) {}
                header.removeEventListener('pointermove', move);
                header.removeEventListener('pointerup', up);
                header.removeEventListener('pointercancel', up);
                dockEl.classList.remove('is-interacting');
                saveStore();
            };
            header.addEventListener('pointermove', move);
            header.addEventListener('pointerup', up);
            header.addEventListener('pointercancel', up);
        });
        header.addEventListener('dblclick', e => { if (!e.target.closest('button')) resetDock(); });

        dockEl.querySelectorAll('[data-resize]').forEach(handle => {
            handle.addEventListener('pointerdown', e => {
                if (!store.showDock) return;
                if (e.button !== undefined && e.button !== 0) return;
                e.preventDefault(); e.stopPropagation();
                ensureDockRect();
                const dir = handle.dataset.resize;
                const start = Object.assign({}, store.dockRect);
                const sx = e.clientX, sy = e.clientY;
                dockEl.classList.add('is-interacting');
                try { handle.setPointerCapture(e.pointerId); } catch (x) {}
                const move = ev => {
                    const dx = ev.clientX - sx, dy = ev.clientY - sy;
                    let left = start.left, top = start.top, width = start.width, height = start.height;
                    if (dir.indexOf('e') > -1) width = start.width + dx;
                    if (dir.indexOf('s') > -1) height = start.height + dy;
                    if (dir.indexOf('w') > -1) { width = start.width - dx; left = start.left + start.width - width; }
                    if (dir.indexOf('n') > -1) { height = start.height - dy; top = start.top + start.height - height; }
                    store.dockRect = clampRect({ left, top, width, height });
                    applyDockRect();
                };
                const up = ev => {
                    try { handle.releasePointerCapture(ev.pointerId); } catch (x) {}
                    handle.removeEventListener('pointermove', move);
                    handle.removeEventListener('pointerup', up);
                    handle.removeEventListener('pointercancel', up);
                    dockEl.classList.remove('is-interacting');
                    saveStore();
                };
                handle.addEventListener('pointermove', move);
                handle.addEventListener('pointerup', up);
                handle.addEventListener('pointercancel', up);
            });
        });

        if (!windowResizeBound) {
            windowResizeBound = true;
            window.addEventListener('resize', () => { if (dockEl) applyDockRect(); });
        }
    }

    // ==================== IFrame 播放器 ====================
    function loadYtApi() {
        if (window.YT && window.YT.Player) return Promise.resolve();
        if (ytApiPromise) return ytApiPromise;
        ytApiPromise = new Promise((resolve, reject) => {
            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => { try { if (typeof prev === 'function') prev(); } catch (e) {} resolve(); };
            const s = document.createElement('script');
            s.src = 'https://www.youtube.com/iframe_api';
            s.onerror = () => reject(new Error('無法載入 YouTube IFrame API'));
            document.head.appendChild(s);
            setTimeout(() => { if (!(window.YT && window.YT.Player)) reject(new Error('YouTube API 逾時')); }, 15000);
        }).catch(e => { ytApiPromise = null; throw e; });
        return ytApiPromise;
    }
    function buildDock() {
        if (dockEl) return;
        injectDockStyle();
        ensureDockRect();
        dockEl = document.createElement('div');
        dockEl.id = 'ytDock';
        dockEl.className = 'fixed z-[45] rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur shadow-2xl overflow-hidden';
        const handles = HANDLES.map(h => '<div data-resize="' + h[0] + '" style="position:absolute;' + h[1] + '" title="拖拽調整大小"></div>').join('');
        dockEl.innerHTML = `
            <div id="ytDockHeader" class="absolute left-0 right-0 top-0 flex items-center gap-2 px-3 border-b border-slate-800 cursor-move select-none" style="z-index:3;">
                <i class="fa-solid fa-grip-vertical text-slate-600 text-[10px] shrink-0"></i>
                <i class="fa-brands fa-youtube text-red-500 text-sm shrink-0"></i>
                <div id="ytDockTitle" class="flex-1 min-w-0 text-[11px] text-slate-200 truncate">YouTube</div>
                <button id="ytDockPlay" class="p-1 text-slate-400 hover:text-white shrink-0" title="播放 / 暫停"><i class="fa-solid fa-play text-[10px]"></i></button>
                <button id="ytDockToggle" class="p-1 text-slate-400 hover:text-white shrink-0" title="顯示 / 隱藏畫面"><i class="fa-solid fa-eye-slash text-[10px]"></i></button>
                <button id="ytDockClose" class="p-1 text-slate-400 hover:text-rose-400 shrink-0" title="停止並關閉"><i class="fa-solid fa-xmark text-[11px]"></i></button>
            </div>
            <div id="ytPlayerWrap"><div id="ytPlayerHost" style="position:absolute;inset:0;"></div></div>
            ${handles}
            <div class="pointer-events-none absolute bottom-[3px] right-[4px] text-slate-500" style="z-index:7"><i class="fa-solid fa-grip-lines-vertical rotate-45 text-[9px]"></i></div>`;
        document.body.appendChild(dockEl);
        applyDockRect();
        dockEl.querySelector('#ytDockPlay').addEventListener('click', toggleYt);
        dockEl.querySelector('#ytDockToggle').addEventListener('click', () => {
            store.showDock = !store.showDock; saveStore(); applyDockRect();
            const cb = document.getElementById('ytShowDock'); if (cb) cb.checked = store.showDock;
        });
        dockEl.querySelector('#ytDockClose').addEventListener('click', () => {
            try { if (ytPlayer) ytPlayer.stopVideo(); } catch (e) {}
            stopTicker();
            if (dockEl) dockEl.style.display = 'none';
            try { ext.stopIfPlayingFrom(SOURCE_ID); } catch (e) {}
        });
        bindDockInteractions();
    }
    async function ensurePlayer() {
        await loadYtApi();
        if (ytPlayer) return ytPlayer;
        buildDock();
        dockEl.style.display = '';
        ytPlayer = await new Promise((resolve, reject) => {
            let done = false;
            const timer = setTimeout(() => { if (!done) { done = true; reject(new Error('播放器初始化逾時')); } }, 20000);
            const vars = { playsinline: 1, controls: 1, rel: 0, modestbranding: 1 };
            if (/^https?:$/.test(location.protocol)) vars.origin = location.origin;
            try {
                new window.YT.Player('ytPlayerHost', {
                    width: '100%', height: '100%', playerVars: vars,
                    events: {
                        onReady: e => {
                            if (done) return;
                            done = true; clearTimeout(timer);
                            try {
                                const iframe = e.target.getIframe && e.target.getIframe();
                                if (iframe) {
                                    iframe.style.width = '100%'; iframe.style.height = '100%';
                                    iframe.allow = 'autoplay; encrypted-media; fullscreen';
                                }
                            } catch (x) {}
                            resolve(e.target);
                        },
                        onStateChange: onYtState,
                        onError: onYtError,
                        onAutoplayBlocked: () => {
                            showStatus('自動播放被阻擋，請點擊播放器開始', 'warn');
                            store.showDock = true; saveStore(); applyDockRect();
                            const cb = document.getElementById('ytShowDock'); if (cb) cb.checked = true;
                            if (ytPending) { ytPending.finish(); ytPending = null; }
                        }
                    }
                });
            } catch (e) { clearTimeout(timer); reject(e); }
        });
        try { ytPlayer.setVolume(Math.round(Math.max(0, Math.min(1, parseFloat(localStorage.getItem('mp3_last_volume') || '1'))) * 100)); } catch (e) {}
        return ytPlayer;
    }
    async function playYouTube(file) {
        const player = await ensurePlayer();
        try { ext.audioPlayer.pause(); } catch (e) {}
        try { if (typeof ext.destroyPlayer === 'function') ext.destroyPlayer(); } catch (e) {}
        currentVideoId = file.videoId; endedGuard = false;
        if (dockEl) { dockEl.style.display = ''; applyDockRect(); }
        const t = document.getElementById('ytDockTitle'); if (t) t.textContent = file.displayName;
        installYtMediaSession();
        await new Promise((resolve, reject) => {
            let settled = false;
            const finish = err => { if (settled) return; settled = true; clearTimeout(timer); err ? reject(err) : resolve(); };
            const timer = setTimeout(() => finish(new Error('YouTube 載入逾時')), 20000);
            ytPending = { finish };
            try { player.loadVideoById({ videoId: file.videoId, startSeconds: 0 }); } catch (e) { finish(e); }
        });
        ytPending = null; startTicker(); renderYtControls();
    }
    function onYtState(e) {
        const st = e.data;
        if (ytPending && (st === 1 || st === 2)) { ytPending.finish(); ytPending = null; }
        if (st === 0) {
            if (!endedGuard) {
                endedGuard = true; stopTicker(); renderYtControls(st);
                const mode = localStorage.getItem('mp3_last_play_mode') || 'loop';
                if (mode === 'single') { try { ytPlayer.seekTo(0, true); ytPlayer.playVideo(); } catch (x) {} }
                else { try { window.playNext(); } catch (x) {} }
            }
            return;
        }
        if (st === 1) { endedGuard = false; startTicker(); }
        renderYtControls(st);
    }
    function onYtError(e) {
        const c = e && e.data;
        const msg = (c === 101 || c === 150) ? '此影片禁止嵌入' : c === 100 ? '影片不存在或已移除' : 'YouTube 錯誤（' + c + '）';
        if (ytPending) { ytPending.finish(new Error(msg)); ytPending = null; return; }
        showStatus(msg + '，自動跳過', 'warn');
        const vid = currentVideoId;
        setTimeout(() => { if (currentVideoId === vid && isYtCurrent()) { try { window.playNext(); } catch (x) {} } }, 1200);
    }
    function toggleYt() {
        if (!ytPlayer) return;
        try { ytPlayer.getPlayerState() === 1 ? ytPlayer.pauseVideo() : ytPlayer.playVideo(); } catch (e) {}
        renderYtControls();
    }
    function renderYtControls(st) {
        if (!isYtCurrent()) return;
        let s = st;
        if (s === undefined && ytPlayer) { try { s = ytPlayer.getPlayerState(); } catch (e) { s = -1; } }
        const playing = s === 1;
        const b = document.getElementById('playPauseBtn');
        if (b) b.innerHTML = playing ? '<i class="fa-solid fa-pause text-xs"></i>' : '<i class="fa-solid fa-play text-xs"></i>';
        const d = document.querySelector('#ytDockPlay i');
        if (d) d.className = playing ? 'fa-solid fa-pause text-[10px]' : 'fa-solid fa-play text-[10px]';
        try { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; } catch (e) {}
    }
    function startTicker() { if (!ticker) ticker = setInterval(tick, 500); }
    function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }
    function tick() {
        if (!isYtCurrent() || !ytPlayer) { stopTicker(); return; }
        let dur = 0, cur = 0, st = -1;
        try { dur = ytPlayer.getDuration() || 0; cur = ytPlayer.getCurrentTime() || 0; st = ytPlayer.getPlayerState(); } catch (e) { return; }
        const pb = document.getElementById('progressBar'); if (pb && dur > 0) pb.value = (cur / dur) * 100;
        const ct = document.getElementById('currentTime'); if (ct) ct.innerText = fmtTime(cur);
        const dt = document.getElementById('durationTime'); if (dt) dt.innerText = fmtTime(dur);
        renderYtControls(st);
        try { if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && dur > 0) navigator.mediaSession.setPositionState({ duration: dur, playbackRate: 1, position: Math.min(cur, dur) }); } catch (e) {}
        if (st === 1) { try { sessionStorage.setItem('mp3_last_played_time', String(cur)); } catch (e) {} }
    }

    // ==================== 主介面接管 ====================
    function installWrappers() {
        orig.togglePlay = window.togglePlay; orig.seekAudio = window.seekAudio;
        orig.changeVolume = window.changeVolume; orig.updatePlayButton = window.updatePlayButton;
        window.togglePlay = function () { if (isYtCurrent() && ytPlayer) { toggleYt(); return; } return orig.togglePlay.apply(this, arguments); };
        window.seekAudio = function (v) {
            if (isYtCurrent() && ytPlayer) { try { ytPlayer.seekTo((v / 100) * (ytPlayer.getDuration() || 0), true); } catch (e) {} return; }
            return orig.seekAudio.apply(this, arguments);
        };
        window.changeVolume = function (v) {
            try { if (ytPlayer) ytPlayer.setVolume(Math.round(Math.max(0, Math.min(1, v)) * 100)); } catch (e) {}
            return orig.changeVolume.apply(this, arguments);
        };
        window.updatePlayButton = function () { const r = orig.updatePlayButton.apply(this, arguments); if (isYtCurrent()) renderYtControls(); return r; };
    }
    function restoreWrappers() { Object.keys(orig).forEach(k => { if (typeof orig[k] === 'function') window[k] = orig[k]; }); }
    function installYtMediaSession() {
        if (!('mediaSession' in navigator)) return;
        const ms = navigator.mediaSession;
        try {
            ms.setActionHandler('play', () => { if (isYtCurrent() && ytPlayer) ytPlayer.playVideo(); else { try { ext.audioPlayer.play(); } catch (e) {} } });
            ms.setActionHandler('pause', () => { if (isYtCurrent() && ytPlayer) ytPlayer.pauseVideo(); else { try { ext.audioPlayer.pause(); } catch (e) {} } });
            ms.setActionHandler('previoustrack', () => window.playPrev());
            ms.setActionHandler('nexttrack', () => window.playNext());
            ms.setActionHandler('seekto', d => { if (isYtCurrent() && ytPlayer && d && typeof d.seekTime === 'number') ytPlayer.seekTo(d.seekTime, true); else { try { ext.audioPlayer.currentTime = d.seekTime; } catch (e) {} } });
            ms.setActionHandler('seekbackward', d => { const s = (d && d.seekOffset) || 10; if (isYtCurrent() && ytPlayer) { try { ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime() - s), true); } catch (e) {} } else { try { ext.audioPlayer.currentTime = Math.max(0, ext.audioPlayer.currentTime - s); } catch (e) {} } });
            ms.setActionHandler('seekforward', d => { const s = (d && d.seekOffset) || 10; if (isYtCurrent() && ytPlayer) { try { ytPlayer.seekTo(ytPlayer.getCurrentTime() + s, true); } catch (e) {} } else { try { ext.audioPlayer.currentTime += s; } catch (e) {} } });
            ms.setActionHandler('stop', () => { try { if (ytPlayer) ytPlayer.stopVideo(); } catch (e) {} });
        } catch (e) {}
    }

    // ==================== UI ====================
    const MODE_HINT = {
        auto: '免金鑰：自動嘗試公開實例與 Proxy；失敗時請改用檔案匯入。',
        api: '最穩定：需 YouTube Data API v3 金鑰，可取完整清單與時長。',
        manual: '免金鑰：新增清單後貼上影片 URL / ID，標題以 oEmbed 補齊。',
        file: '免金鑰・離線：匯入 Google Takeout 的清單 CSV / JSON / TXT。'
    };
    function renderUI() {
        if (!initialized) return;
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer(PLUGIN_ID);
        if (!body) { if (uiRetry++ < 25) setTimeout(renderUI, 200); return; }
        if (body.dataset.ytReady === '1') { renderList(); return; }
        body.dataset.ytReady = '1';
        body.innerHTML = `
            <div class="space-y-2 pt-1">
                <div id="ytModes" class="grid grid-cols-4 gap-1"></div>
                <div id="ytModeHint" class="text-[9px] text-slate-500 leading-relaxed"></div>
                <div id="ytKeyRow" class="hidden flex items-center gap-1.5">
                    <input id="ytApiKey" type="password" placeholder="YouTube Data API v3 金鑰"
                        class="flex-1 min-w-0 bg-slate-800 border border-slate-700 text-[11px] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-200 placeholder:text-slate-600">
                    <button id="ytSaveKey" title="儲存金鑰" class="bg-slate-800 hover:bg-indigo-600 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl text-[11px] transition"><i class="fa-solid fa-key"></i></button>
                </div>
                <div class="flex items-center gap-1.5">
                    <input id="ytAddInput" type="text" placeholder="播放清單 URL 或 ID…"
                        class="flex-1 min-w-0 bg-slate-800 border border-slate-700 text-[11px] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-200 placeholder:text-slate-600">
                    <button id="ytAddBtn" title="新增（輸入框留空時讀取剪貼簿）" class="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-xl text-[11px] transition"><i class="fa-solid fa-plus"></i></button>
                    <button id="ytFileBtn" title="匯入 CSV / JSON / TXT" class="bg-slate-800 hover:bg-indigo-600 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl text-[11px] transition"><i class="fa-solid fa-file-import"></i></button>
                </div>
                <input id="ytFile" type="file" accept=".csv,.json,.txt" multiple class="hidden">
                <div class="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                    <label class="flex items-center gap-1.5 cursor-pointer select-none"><input id="ytShowDock" type="checkbox" class="w-3.5 h-3.5 accent-indigo-500"><span>顯示畫面</span></label>
                    <label class="flex items-center gap-1.5 cursor-pointer select-none"><input id="ytEnrich" type="checkbox" class="w-3.5 h-3.5 accent-indigo-500"><span>補齊標題</span></label>
                    <button id="ytResetDock" title="重設視窗位置與大小" class="px-2 py-0.5 rounded border border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white transition"><i class="fa-solid fa-arrows-to-dot text-[9px]"></i></button>
                    <span id="ytTotal" class="font-mono text-slate-600">0 部</span>
                </div>
                <div class="text-[9px] text-slate-600 leading-relaxed">拖拽標題欄移動視窗；拖拽四邊 / 四角調整大小；雙擊標題欄重設。</div>
                <div id="ytStatus" class="hidden"></div>
                <div id="ytList" class="space-y-1.5 max-h-64 overflow-y-auto pr-0.5"></div>
                <button id="ytAdvToggle" class="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[10px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition">
                    <span class="flex items-center gap-1.5"><i id="ytAdvChevron" class="fa-solid fa-chevron-right text-[8px]"></i>進階：免金鑰來源</span>
                    <i class="fa-solid fa-network-wired text-[9px]"></i>
                </button>
                <div id="ytAdv" class="hidden space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/40 p-2">
                    <label class="block"><span class="text-[9px] text-slate-500">Piped 實例（每行一個）</span>
                        <textarea id="ytPiped" rows="2" class="w-full bg-slate-800 border border-slate-700 text-[10px] rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"></textarea></label>
                    <label class="block"><span class="text-[9px] text-slate-500">Invidious 實例（每行一個）</span>
                        <textarea id="ytInv" rows="2" class="w-full bg-slate-800 border border-slate-700 text-[10px] rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"></textarea></label>
                    <label class="block"><span class="text-[9px] text-slate-500">CORS Proxy 前綴（每行一個）</span>
                        <textarea id="ytProxy" rows="2" class="w-full bg-slate-800 border border-slate-700 text-[10px] rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"></textarea></label>
                    <div class="flex items-center gap-1.5">
                        <button id="ytAdvSave" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] py-1 rounded-lg transition">儲存來源</button>
                        <button id="ytAdvReset" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] rounded-lg transition">還原預設</button>
                    </div>
                </div>
            </div>`;

        const modes = body.querySelector('#ytModes');
        [['auto', '自動'], ['api', '金鑰'], ['manual', '貼上'], ['file', '檔案']].forEach(pair => {
            const b = document.createElement('button');
            b.type = 'button'; b.dataset.mode = pair[0];
            b.textContent = pair[1];
            b.addEventListener('click', () => { store.mode = pair[0]; saveStore(); syncMode(); });
            modes.appendChild(b);
        });
        function syncMode() {
            body.querySelectorAll('#ytModes button').forEach(b => {
                const on = b.dataset.mode === store.mode;
                b.className = 'px-1 py-1 rounded-lg border text-[10px] transition ' +
                    (on ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-300' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200');
            });
            body.querySelector('#ytModeHint').textContent = MODE_HINT[store.mode];
            body.querySelector('#ytKeyRow').classList.toggle('hidden', store.mode !== 'api');
            body.querySelector('#ytAddInput').placeholder = store.mode === 'file' ? '清單名稱（可留空，用檔名）…' : '播放清單 URL 或 ID（留空＝讀取剪貼簿）…';
        }
        syncMode();

        const keyInput = body.querySelector('#ytApiKey');
        keyInput.value = store.apiKey;
        body.querySelector('#ytSaveKey').addEventListener('click', () => { store.apiKey = keyInput.value.trim(); saveStore(); showStatus(store.apiKey ? '金鑰已儲存' : '金鑰已清除', 'success'); });

        const addInput = body.querySelector('#ytAddInput');
        body.querySelector('#ytAddBtn').addEventListener('click', handleAddFromInput);
        addInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFromInput(); } });
        body.querySelector('#ytFileBtn').addEventListener('click', () => { const f = body.querySelector('#ytFile'); f.dataset.target = ''; f.dataset.name = ''; f.click(); });
        body.querySelector('#ytFile').addEventListener('change', e => {
            const files = e.target.files, target = e.target.dataset.target || '';
            handleFiles(files, target); e.target.value = '';
        });

        const dockCb = body.querySelector('#ytShowDock'); dockCb.checked = store.showDock;
        dockCb.addEventListener('change', () => { store.showDock = dockCb.checked; saveStore(); if (dockEl) applyDockRect(); });
        const enCb = body.querySelector('#ytEnrich'); enCb.checked = store.enrich;
        enCb.addEventListener('change', () => { store.enrich = enCb.checked; saveStore(); });
        body.querySelector('#ytResetDock').addEventListener('click', resetDock);

        body.querySelector('#ytList').addEventListener('click', onListClick);
        body.querySelector('#ytList').addEventListener('change', onListChange);

        const adv = body.querySelector('#ytAdv');
        body.querySelector('#ytAdvToggle').addEventListener('click', () => {
            const open = adv.classList.toggle('hidden') === false;
            body.querySelector('#ytAdvChevron').className = 'fa-solid ' + (open ? 'fa-chevron-down' : 'fa-chevron-right') + ' text-[8px]';
        });
        const lines = a => a.join('\n');
        const parse = t => String(t).split(/[\r\n]+/).map(x => x.trim()).filter(Boolean);
        body.querySelector('#ytPiped').value = lines(store.piped);
        body.querySelector('#ytInv').value = lines(store.invidious);
        body.querySelector('#ytProxy').value = lines(store.proxies);
        body.querySelector('#ytAdvSave').addEventListener('click', () => {
            store.piped = parse(body.querySelector('#ytPiped').value);
            store.invidious = parse(body.querySelector('#ytInv').value);
            store.proxies = parse(body.querySelector('#ytProxy').value);
            store.lastGood = ''; saveStore(); showStatus('來源已儲存', 'success');
        });
        body.querySelector('#ytAdvReset').addEventListener('click', () => {
            store.piped = DEFAULT_PIPED.slice(); store.invidious = DEFAULT_INVIDIOUS.slice(); store.proxies = DEFAULT_PROXIES.slice();
            store.lastGood = ''; saveStore();
            body.querySelector('#ytPiped').value = lines(store.piped);
            body.querySelector('#ytInv').value = lines(store.invidious);
            body.querySelector('#ytProxy').value = lines(store.proxies);
            showStatus('已還原預設來源', 'success');
        });
        renderList();
    }
    function renderList() {
        const el = document.getElementById('ytList'), total = document.getElementById('ytTotal');
        if (total) total.textContent = enabledItems().length + ' 部';
        if (!el) return;
        if (!store.playlists.length) { el.innerHTML = '<div class="text-[10px] text-slate-600 text-center py-2">尚未新增任何播放清單</div>'; return; }
        el.innerHTML = store.playlists.map(pl => {
            const on = pl.enabled !== false, n = (pl.items || []).length;
            return `
            <div class="rounded-xl border border-slate-800 bg-slate-950/40 px-2.5 py-2 ${on ? '' : 'opacity-60'}" data-pl-id="${esc(pl.id)}">
                <div class="flex items-center gap-2">
                    <input type="checkbox" data-act="toggle" ${on ? 'checked' : ''} class="w-3.5 h-3.5 accent-indigo-500 shrink-0" title="載入 / 卸載">
                    <div class="min-w-0 flex-1">
                        <div class="text-[11px] text-slate-200 truncate" title="${esc(pl.title || pl.id)}">${esc(pl.title || pl.id)}</div>
                        <div class="text-[9px] text-slate-500 truncate">${n} 部${pl.source ? ' · ' + esc(pl.source) : ''}${busy ? ' · 處理中…' : ''}</div>
                    </div>
                    <button data-act="refresh" title="重新讀取" class="p-1 text-slate-500 hover:text-indigo-400 shrink-0"><i class="fa-solid fa-rotate text-[9px]"></i></button>
                    <button data-act="import" title="貼上匯入" class="p-1 text-slate-500 hover:text-indigo-400 shrink-0"><i class="fa-solid fa-paste text-[9px]"></i></button>
                    <button data-act="file" title="檔案匯入" class="p-1 text-slate-500 hover:text-indigo-400 shrink-0"><i class="fa-solid fa-file-import text-[9px]"></i></button>
                    <button data-act="rename" title="重新命名" class="p-1 text-slate-500 hover:text-indigo-400 shrink-0"><i class="fa-solid fa-pen text-[9px]"></i></button>
                    <button data-act="remove" title="刪除" class="p-1 text-slate-500 hover:text-rose-400 shrink-0"><i class="fa-solid fa-xmark text-[10px]"></i></button>
                </div>
            </div>`;
        }).join('');
    }
    function onListChange(e) {
        const i = e.target;
        if (!i.matches || !i.matches('input[data-act="toggle"]')) return;
        const row = i.closest('[data-pl-id]'); if (!row) return;
        const pl = store.playlists.find(p => p.id === row.dataset.plId); if (!pl) return;
        pl.enabled = i.checked; saveStore();
        if (adapter) adapter.refresh().then(renderList).catch(renderList); else renderList();
    }
    function onListClick(e) {
        const b = e.target.closest('button[data-act]'); if (!b) return;
        const row = b.closest('[data-pl-id]'); if (!row) return;
        const id = row.dataset.plId, act = b.dataset.act;
        if (act === 'refresh') refreshPlaylist(id);
        else if (act === 'import') manualImport(id);
        else if (act === 'file') { const f = document.getElementById('ytFile'); if (f) { f.dataset.target = id; f.click(); } }
        else if (act === 'rename') renamePlaylist(id);
        else if (act === 'remove') removePlaylist(id);
    }

    // ==================== 生命週期 ====================
    async function init() {
        if (initialized) return;
        ext = window.MP3AppExtension;
        if (!ext) throw new Error('MP3AppExtension 未就緒');
        if (typeof window.MP3RegisterSourceAdapter !== 'function') throw new Error('DataSource Adapter 未就緒');
        initialized = true; uiRetry = 0; store = loadStore();

        window.MP3SourceRegistry = window.MP3SourceRegistry || {};
        window.MP3SourceRegistry[SOURCE_ID] = { label: 'YT', icon: 'fa-brands fa-youtube', badgeClass: 'bg-red-950/50 text-red-300 border-red-500/30', dotClass: 'bg-red-500' };

        renderUI(); installWrappers();

        adapter = window.MP3RegisterSourceAdapter({
            id: SOURCE_ID, categoryName: CATEGORY_NAME,
            list: async () => ({ files: enabledItems().map(toFile) }),
            resolveMedia: async file => ({ url: file.url, mimeType: 'video/mp4', play: () => playYouTube(file) }),
            delete: async file => {
                store.playlists.forEach(pl => { pl.items = (pl.items || []).filter(x => x.videoId !== file.videoId); });
                saveStore(); renderList();
            },
            reset: () => { try { if (ytPlayer) ytPlayer.pauseVideo(); } catch (e) {} },
            onUnload: () => { try { if (ytPlayer) ytPlayer.stopVideo(); } catch (e) {} stopTicker(); }
        });
        const h = window.MP3DataSourceHandlers && window.MP3DataSourceHandlers[SOURCE_ID];
        if (h) h.togglePlayback = () => toggleYt();

        ext.on('songchange', file => {
            if (!file || file._source !== SOURCE_ID) { stopTicker(); if (dockEl) dockEl.style.display = 'none'; }
        });

        await adapter.refresh(); renderList();
        console.log('[YouTubePlugin] v2.2 ready，模式：' + store.mode + '，清單 ' + store.playlists.length + ' 個');
    }
    async function unload() {
        if (!initialized) return;
        initialized = false; stopTicker();
        if (statusTimer) { clearTimeout(statusTimer); statusTimer = null; }
        restoreWrappers();
        try { if (ytPlayer) { ytPlayer.stopVideo(); ytPlayer.destroy(); } } catch (e) {}
        ytPlayer = null; ytPending = null; currentVideoId = null;
        if (dockEl) { dockEl.remove(); dockEl = null; }
        const style = document.getElementById('ytDockStyles'); if (style) style.remove();
        dockStyleInjected = false;
        if (adapter) { try { await adapter.unload(); } catch (e) {} adapter = null; }
        try { delete window.MP3SourceRegistry[SOURCE_ID]; } catch (e) {}
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer(PLUGIN_ID);
        if (body) { body.innerHTML = ''; delete body.dataset.ytReady; }
        if (typeof window.refreshSourceFilterOptions === 'function') window.refreshSourceFilterOptions();
    }

    window.MP3YouTubePlugin = {
        version: '2.2', init, unload,
        getPlaylists: () => store.playlists.slice(),
        refresh: () => adapter ? adapter.refresh() : Promise.resolve(),
        resetDock
    };
})();