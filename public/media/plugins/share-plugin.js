/**
 * ============================================================
 *  share-plugin.js — 「分享與接受分享」獨立插件 v1.0.3
 *
 *  v1.0.3 新增：
 *   - 接收分享按鈕（mp3ShareReceiveBtn）於輸入框留空時，自動讀取剪貼簿；
 *     若剪貼簿含有分享連結即直接使用，否則提示手動貼上。
 *     讀取過程顯示 spinner，權限失敗 / 無連結 / 瀏覽器不支援皆有狀態提示。
 *
 *  v1.0.2 修復：
 *   - 複製連結按鈕在 await 之後使用 e.currentTarget（事件派發結束後為 null），
 *     導致 TypeError。改為在 await 前捕獲按鈕引用並檢查 isConnected。
 *   - 所有非同步流程補上彈窗已關閉保護，匯入狀態一律在 finally 復位。
 *
 *  v1.0.1 修復：
 *   - selectionEntries() 誤用未定義變數 file，導致勾選媒體時 ReferenceError。
 *
 *  功能：
 *   ．在影音列表多選媒體（支援本頁全選、全選可分享、反選、清除）
 *   ．可選設定「問題 + 答案」保護：以答案加密媒體清單（HTTPS 下 AES-GCM）
 *   ．產生分享 URL（資料置於 #hash，不上傳伺服器）
 *   ．對方開啟該 URL 自動彈出接收畫面；有問題保護時需先答對
 *   ．接收畫面列出媒體（序號、可勾選、可改名、標記已存在）供確認後匯入
 *   ．亦可手動貼上分享連結接收；保留最近分享紀錄可複製 / 預覽 / 刪除
 *
 *  依賴：
 *   - MP3AppExtension / MP3PluginManager（主程序）
 *   - 「URL 媒體」插件（urlMedia）：匯入目標，接收匯入時會自動啟用
 *
 *  安裝：
 *   1) 本文件與其他插件同目錄。
 *   2) 主頁 REGISTRY 加入（若尚未加入）：
 *      share: { id: 'share', name: '分享與接受分享', description: '多選媒體、問題保護、URL 分享與接收',
 *          icon: 'fa-solid fa-share-nodes', iconClass: 'text-sky-400',
 *          scriptSrc: 'share-plugin.js', globalVar: 'MP3SharePlugin',
 *          autoEnable: true, dataSourceKeys: [] },
 *   3) 重新整理頁面，於插件中心開啟「分享與接受分享」。
 *
 *  注意：
 *   - urlmedia 項目直接分享其 URL；local 項目轉成目前主機的絕對串流連結，
 *     對方必須能存取你的伺服器；其他來源（Drive / News / 本機檔案等）無法
 *     轉成可攜連結，會標示為「不可分享」並排除。
 *   - 問題保護的答案會做「trim + 小寫 + 空白正規化」，不分大小寫。
 * ============================================================
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'share';
    const VERSION = '1.0.3';
    const HASH_KEY = 'mp3share';
    const RECENT_KEY = 'mp3_share_recent';
    const FROM_KEY = 'mp3_share_from';
    const URL_MEDIA_STORE = 'mp3_url_media_items';
    const MAGIC = 'MP3S1';
    const PBKDF2_ITER = 150000;
    const MAX_ITEMS = 500;
    const MAX_NAME_LEN = 200;
    const MAX_URL_LEN = 4000;

    let ext = null;
    let initialized = false;
    let selectMode = false;
    const selection = new Set();
    let observer = null;
    let decorateRaf = 0;
    let tbodyChangeHandler = null;
    let hashHandler = null;
    let styleEl = null;
    let selectionBar = null;
    let statusTimer = null;
    let uiRetry = 0;

    let activeOverlay = null;
    let activeKeyHandler = null;
    let activeResolve = null;
    let shareBusy = false;
    let importBusy = false;
    let receiveBusy = false;

    // ==================== 基礎工具 ====================
    function esc(s) {
        return typeof window.escapeHtmlAttr === 'function'
            ? window.escapeHtmlAttr(s)
            : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function encArg(s) {
        return typeof window.encodeInlineArg === 'function'
            ? window.encodeInlineArg(s)
            : encodeURIComponent(String(s == null ? '' : s)).replace(/'/g, '%27');
    }
    function shortUrl(url) {
        try {
            const u = new URL(url);
            return u.hostname + (u.pathname !== '/' ? u.pathname : '') + (u.search ? '?…' : '');
        } catch (e) { return url; }
    }
    function isValidHttpUrl(url) {
        if (!/^https?:\/\//i.test(String(url || ''))) return false;
        try { new URL(url); return true; } catch (e) { return false; }
    }
    function kindIcon(kind) {
        if (kind === 'video') return 'fa-solid fa-film text-purple-400';
        if (kind === 'stream') return 'fa-solid fa-tower-broadcast text-amber-400';
        if (kind === 'audio') return 'fa-solid fa-music text-indigo-400';
        return 'fa-solid fa-photo-film text-slate-400';
    }
    function viaLabel(via) { return via === 'local' ? '本地' : '連結'; }
    function viaBadge(via) {
        const cls = via === 'local'
            ? 'bg-slate-800 text-slate-300 border-slate-600/60'
            : 'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-500/30';
        return '<span class="px-1 py-0.5 rounded border text-[9px] ' + cls + '">' + viaLabel(via) + '</span>';
    }
    function fmtDate(ts) {
        const d = new Date(ts);
        const p = n => String(n).padStart(2, '0');
        return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    }
    function defaultTitle(n) {
        const d = new Date();
        return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' 音樂分享 · ' + n + ' 首';
    }
    async function copyText(text) {
        try { await navigator.clipboard.writeText(text); return true; }
        catch (e) {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
                document.body.appendChild(ta);
                ta.focus(); ta.select();
                const ok = document.execCommand('copy');
                ta.remove();
                return ok;
            } catch (e2) { return false; }
        }
    }

    // ==================== 編碼 / 壓縮 / 加密 ====================
    const te = new TextEncoder();
    const td = new TextDecoder();

    function b64url(bytes) {
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function unb64url(str) {
        let s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
        while (s.length % 4) s += '=';
        const bin = atob(s);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }
    function concatBytes(a, b) {
        const out = new Uint8Array(a.length + b.length);
        out.set(a, 0); out.set(b, a.length);
        return out;
    }
    function normalizeAnswer(a) {
        return String(a || '').trim().toLowerCase().replace(/\s+/g, ' ');
    }
    function hasWebCrypto() {
        return !!(window.crypto && window.crypto.subtle && window.crypto.getRandomValues);
    }
    async function compressBytes(bytes) {
        if (typeof CompressionStream === 'undefined') return { bytes: bytes, z: 0 };
        try {
            const cs = new CompressionStream('gzip');
            const buf = await new Response(new Blob([bytes]).stream().pipeThrough(cs)).arrayBuffer();
            const out = new Uint8Array(buf);
            return out.length < bytes.length ? { bytes: out, z: 1 } : { bytes: bytes, z: 0 };
        } catch (e) { return { bytes: bytes, z: 0 }; }
    }
    async function decompressBytes(bytes, z) {
        if (!z) return bytes;
        if (typeof DecompressionStream === 'undefined') throw new Error('此瀏覽器不支援解壓縮，請改用新版 Chrome / Edge / Safari / Firefox');
        const ds = new DecompressionStream('gzip');
        const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
        return new Uint8Array(buf);
    }
    async function deriveAesKey(answer, salt) {
        const base = await crypto.subtle.importKey('raw', te.encode(normalizeAnswer(answer)), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITER, hash: 'SHA-256' },
            base,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }
    async function aesEncrypt(bytes, answer, salt, iv) {
        const key = await deriveAesKey(answer, salt);
        const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, bytes);
        return new Uint8Array(ct);
    }
    async function aesDecrypt(bytes, answer, salt, iv) {
        const key = await deriveAesKey(answer, salt);
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, bytes);
        return new Uint8Array(pt);
    }
    function xorCrypt(bytes, answer, saltB64) {
        // 非 HTTPS 環境的後備簡易加密（仍需要正確答案才能還原）
        let h = 2166136261 >>> 0;
        const src = normalizeAnswer(answer) + '|' + saltB64;
        for (let i = 0; i < src.length; i++) {
            h ^= src.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        let s = h || 1;
        const out = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            s ^= s << 13; s >>>= 0;
            s ^= s >>> 17;
            s ^= s << 5; s >>>= 0;
            out[i] = bytes[i] ^ (s & 255);
        }
        return out;
    }
    function randomBytes(n) {
        const out = new Uint8Array(n);
        if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(out);
        else for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
        return out;
    }

    async function packPayload(meta, items, answer) {
        const raw = concatBytes(te.encode(MAGIC), te.encode(JSON.stringify(items)));
        const packed = await compressBytes(raw);
        const payload = {
            v: 1, app: HASH_KEY,
            title: meta.title, from: meta.from, q: meta.q,
            at: meta.at, count: items.length,
            enc: 'n', z: packed.z, data: ''
        };
        if (answer) {
            const salt = randomBytes(16);
            const saltB64 = b64url(salt);
            if (hasWebCrypto()) {
                const iv = randomBytes(12);
                payload.enc = 'a';
                payload.salt = saltB64;
                payload.iv = b64url(iv);
                payload.data = b64url(await aesEncrypt(packed.bytes, answer, salt, iv));
            } else {
                payload.enc = 'x';
                payload.salt = saltB64;
                payload.data = b64url(xorCrypt(packed.bytes, answer, saltB64));
            }
        } else {
            payload.data = b64url(packed.bytes);
        }
        return payload;
    }

    async function unpackPayload(payload, answer) {
        let bytes = unb64url(payload.data);
        if (payload.enc === 'a') {
            if (!hasWebCrypto()) throw new Error('此分享使用 AES 加密，需要 HTTPS 環境才能解鎖');
            try { bytes = await aesDecrypt(bytes, answer, unb64url(payload.salt), unb64url(payload.iv)); }
            catch (e) { throw new Error('答案不正確，請再試一次'); }
        } else if (payload.enc === 'x') {
            bytes = xorCrypt(bytes, answer, payload.salt);
        } else if (payload.enc !== 'n') {
            throw new Error('不支援的加密格式');
        }
        bytes = await decompressBytes(bytes, payload.z ? 1 : 0);
        const text = td.decode(bytes);
        if (!text.startsWith(MAGIC)) throw new Error(payload.enc === 'n' ? '分享資料損毀' : '答案不正確，請再試一次');
        let items;
        try { items = JSON.parse(text.slice(MAGIC.length)); }
        catch (e) { throw new Error('分享資料格式錯誤'); }
        if (!Array.isArray(items)) throw new Error('分享資料格式錯誤');
        return items.slice(0, MAX_ITEMS).map(it => ({
            n: String(it.n || '').slice(0, MAX_NAME_LEN) || '未命名媒體',
            u: String(it.u || '').slice(0, MAX_URL_LEN),
            k: ['audio', 'video', 'stream', 'media'].indexOf(it.k) !== -1 ? it.k : 'media',
            m: String(it.m || '').slice(0, 100),
            s: it.s === 'local' ? 'local' : 'url'
        })).filter(it => isValidHttpUrl(it.u));
    }

    function tokenFromInput(input) {
        const s = String(input || '').trim();
        if (!s) return null;
        const m = s.match(/[#&?]mp3share=([A-Za-z0-9\-_]+)/);
        if (m) return m[1];
        if (/^[A-Za-z0-9\-_]+$/.test(s)) return s;
        return null;
    }
    function payloadFromToken(token) {
        let obj;
        try { obj = JSON.parse(td.decode(unb64url(token))); }
        catch (e) { throw new Error('分享連結格式錯誤或已損毀'); }
        if (!obj || obj.app !== HASH_KEY || obj.v !== 1 || !obj.data) throw new Error('不是有效的分享連結');
        return obj;
    }
    function shareUrlFromPayload(payload) {
        return location.origin + location.pathname + '#' + HASH_KEY + '=' + b64url(te.encode(JSON.stringify(payload)));
    }

    // ==================== 可分享性 / 選取 ====================
    function resolveShareUrl(file) {
        const src = (file && file._source) || 'local';
        if (file && file.url && isValidHttpUrl(file.url)) {
            return { url: file.url, via: src === 'local' ? 'local' : 'url' };
        }
        if (src === 'local') {
            const p = ext.getFileRequestParams(file);
            if (!p.dir || !p.originalKey) return null;
            let base = String(p.apiBase || '');
            if (!/^https?:\/\//i.test(base)) base = location.origin + (base.charAt(0) === '/' ? base : '/' + base);
            return {
                url: base + '?dir=' + encodeURIComponent(p.dir) + '&action=stream&filename=' + encodeURIComponent(p.originalKey),
                via: 'local'
            };
        }
        return null;
    }
    function fileKind(file) {
        if (file.kind) return file.kind;
        const name = file.filename || file.displayName || '';
        if (/\.(mp4|m4v|webm|mov|mkv|avi|flv|wmv|mpg|mpeg|3gp)$/i.test(name)) return 'video';
        if (/\.m3u8(\?|#|$)/i.test(file.url || '') || /\.mpd(\?|#|$)/i.test(file.url || '')) return 'stream';
        return 'audio';
    }
    function fileMime(file) {
        if (file.mime) return file.mime;
        return fileKind(file) === 'video' ? 'video/mp4' : 'audio/mpeg';
    }
    function selectionEntries() {
        const map = new Map(ext.allFiles.map(f => [ext.getFileKey(f), f]));
        const out = [];
        selection.forEach(key => {
            const f = map.get(key);
            if (!f) { selection.delete(key); return; }
            const share = resolveShareUrl(f);
            out.push({
                key: key,
                name: f.displayName || f.filename || key,
                source: f._source || 'local',
                share: share,
                kind: fileKind(f),
                mime: fileMime(f)
            });
        });
        return out;
    }
    function selectionStats() {
        const entries = selectionEntries();
        const ok = entries.filter(e => !!e.share);
        return { entries: entries, ok: ok, total: entries.length, portable: ok.length, blocked: entries.length - ok.length };
    }

    function injectStyle() {
        if (styleEl) return;
        styleEl = document.createElement('style');
        styleEl.textContent = `
            tr.mp3share-selected { background: rgba(217,70,239,.12) !important; box-shadow: inset 3px 0 0 0 #d946ef; }
            tr.mp3share-selected:hover { background: rgba(217,70,239,.18) !important; }
            .mp3share-pick input { width: 1rem; height: 1rem; }
            .mp3share-overlay { animation: mp3shareFade .18s ease-out; }
            .mp3share-panel { animation: mp3sharePop .22s cubic-bezier(.2,.9,.3,1.2); }
            .mp3share-shake { animation: mp3shareShake .32s ease; }
            .mp3share-scroll { scrollbar-width: thin; scrollbar-color: rgba(56,189,248,.55) rgba(15,23,42,.6); }
            .mp3share-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
            .mp3share-scroll::-webkit-scrollbar-track { background: rgba(15,23,42,.6); border-radius: 999px; }
            .mp3share-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#38bdf8,#d946ef); border-radius: 999px; }
            .mp3share-scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#7dd3fc,#f0abfc); }
            @keyframes mp3shareFade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes mp3sharePop { from { opacity: 0; transform: translateY(10px) scale(.97) } to { opacity: 1; transform: none } }
            @keyframes mp3shareShake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-6px) } 75% { transform: translateX(6px) } }
        `;
        document.head.appendChild(styleEl);
    }

    function injectSelectionBar() {
        const tc = document.getElementById('tableContainer');
        if (!tc || !tc.parentNode) { if (uiRetry++ < 25) setTimeout(injectSelectionBar, 200); return; }
        if (selectionBar) return;
        selectionBar = document.createElement('div');
        selectionBar.id = 'mp3ShareSelectionBar';
        selectionBar.className = 'px-4 md:px-6 py-2 border-b border-slate-800 bg-gradient-to-r from-slate-950/70 via-sky-950/20 to-fuchsia-950/20 flex items-center gap-2 flex-wrap shrink-0';
        selectionBar.innerHTML = `
            <button id="mp3ShareModeBtn" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:border-sky-500/50">
                <i class="fa-solid fa-square-check text-[10px]"></i><span>選取分享</span>
            </button>
            <div id="mp3ShareModeTools" class="hidden items-center gap-1.5 flex-wrap">
                <button id="mp3ShareSelPage" class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">全選本頁</button>
                <button id="mp3ShareSelPortable" class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition" title="選取整個媒體庫中所有可轉為連結的媒體（不含已隱藏）">全選可分享</button>
                <button id="mp3ShareInvert" class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">反選本頁</button>
                <button id="mp3ShareClear" class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-rose-600/70 text-slate-400 hover:text-white border border-slate-700 transition">清除</button>
            </div>
            <div class="ml-auto flex items-center gap-2 flex-wrap">
                <span id="mp3ShareSelCount" class="text-[10px] text-slate-500">勾選媒體後可建立分享連結</span>
                <button id="mp3ShareCreateTop" disabled class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium text-white bg-gradient-to-r from-sky-600 to-fuchsia-600 hover:from-sky-500 hover:to-fuchsia-500 transition shadow disabled:opacity-40 disabled:cursor-not-allowed">
                    <i class="fa-solid fa-share-nodes text-[10px]"></i><span>分享所選</span>
                </button>
            </div>
        `;
        tc.parentNode.insertBefore(selectionBar, tc);
        selectionBar.querySelector('#mp3ShareModeBtn').addEventListener('click', () => setSelectMode(!selectMode));
        selectionBar.querySelector('#mp3ShareSelPage').addEventListener('click', selectAllPage);
        selectionBar.querySelector('#mp3ShareSelPortable').addEventListener('click', selectAllPortable);
        selectionBar.querySelector('#mp3ShareInvert').addEventListener('click', invertPage);
        selectionBar.querySelector('#mp3ShareClear').addEventListener('click', () => { selection.clear(); syncSelection(); });
        selectionBar.querySelector('#mp3ShareCreateTop').addEventListener('click', openShareModal);
        updateSelectionUI();
    }

    function setSelectMode(on) {
        selectMode = !!on;
        if (!selectMode) selection.clear();
        const btn = selectionBar && selectionBar.querySelector('#mp3ShareModeBtn');
        const tools = selectionBar && selectionBar.querySelector('#mp3ShareModeTools');
        if (btn) {
            btn.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ' +
                (selectMode
                    ? 'bg-sky-600/30 border-sky-500/60 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,.25)]'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:border-sky-500/50');
            btn.querySelector('span').textContent = selectMode ? '結束選取' : '選取分享';
        }
        if (tools) tools.className = selectMode ? 'flex items-center gap-1.5 flex-wrap' : 'hidden items-center gap-1.5 flex-wrap';
        syncSelection();
    }

    function currentPageKeys() {
        const tbody = document.getElementById('fileTableBody');
        if (!tbody) return [];
        const out = [];
        tbody.querySelectorAll('tr[data-share-key]').forEach(tr => out.push(tr.dataset.shareKey));
        return out;
    }
    function selectAllPage() { currentPageKeys().forEach(k => selection.add(k)); syncSelection(); }
    function invertPage() { currentPageKeys().forEach(k => { if (selection.has(k)) selection.delete(k); else selection.add(k); }); syncSelection(); }
    function selectAllPortable() {
        ext.allFiles.forEach(f => {
            if (f.isDisliked) return;
            if (resolveShareUrl(f)) selection.add(ext.getFileKey(f));
        });
        syncSelection();
    }
    function syncSelection() {
        decorateRows();
        updateSelectionUI();
    }

    function updateSelectionUI() {
        if (!initialized || !ext) return;
        const stats = selectionStats();
        const countEl = document.getElementById('mp3ShareSelCount');
        const topBtn = document.getElementById('mp3ShareCreateTop');
        const panelBtn = document.getElementById('mp3SharePanelCreate');
        const panelHint = document.getElementById('mp3SharePanelHint');
        if (countEl) {
            countEl.innerHTML = stats.total === 0
                ? (selectMode ? '尚未勾選任何媒體' : '勾選媒體後可建立分享連結')
                : '已選 <b class="text-sky-300">' + stats.total + '</b> 筆（可分享 <b class="text-emerald-300">' + stats.portable + '</b>' +
                  (stats.blocked ? '，不可 <b class="text-amber-300">' + stats.blocked + '</b>' : '') + '）';
        }
        if (topBtn) topBtn.disabled = stats.portable === 0;
        if (panelBtn) {
            panelBtn.disabled = stats.portable === 0;
            panelBtn.innerHTML = '<i class="fa-solid fa-share-nodes text-[10px]"></i> 建立分享連結（' + stats.portable + ' 筆）';
        }
        if (panelHint) {
            panelHint.textContent = stats.blocked
                ? '另有 ' + stats.blocked + ' 筆來源無法轉成公開連結，將自動排除'
                : '於影音列表按「選取分享」勾選媒體';
        }
    }

    function decorateRows() {
        const tbody = document.getElementById('fileTableBody');
        if (!tbody || !ext) return;
        const byRowId = new Map();
        ext.allFiles.forEach(f => {
            const k = ext.getFileKey(f);
            byRowId.set('row-' + encArg(k).replace(/[%._-]/g, '_'), k);
        });
        tbody.querySelectorAll('tr[id^="row-"]').forEach(tr => {
            const key = byRowId.get(tr.id);
            if (!key) return;
            tr.dataset.shareKey = key;
            let pick = tr.querySelector('input[data-share-pick]');
            if (selectMode) {
                if (!pick) {
                    const host = tr.querySelector('td > div > div');
                    if (host) {
                        const label = document.createElement('label');
                        label.className = 'mp3share-pick shrink-0 flex items-center justify-center cursor-pointer';
                        label.title = '勾選以分享';
                        label.innerHTML = '<input type="checkbox" data-share-pick class="accent-fuchsia-500 cursor-pointer" aria-label="勾選以分享">';
                        host.insertBefore(label, host.firstChild);
                        pick = label.querySelector('input');
                    }
                }
                if (pick) {
                    pick.checked = selection.has(key);
                    tr.classList.toggle('mp3share-selected', selection.has(key));
                }
            } else if (pick) {
                const label = pick.closest('label');
                if (label) label.remove();
                tr.classList.remove('mp3share-selected');
            }
        });
    }
    function scheduleDecorate() {
        if (decorateRaf) return;
        decorateRaf = requestAnimationFrame(() => { decorateRaf = 0; decorateRows(); });
    }
    function startObserving() {
        const tbody = document.getElementById('fileTableBody');
        if (!tbody) { if (uiRetry++ < 25) setTimeout(startObserving, 200); return; }
        if (observer) observer.disconnect();
        observer = new MutationObserver(scheduleDecorate);
        observer.observe(tbody, { childList: true, subtree: true });
        tbodyChangeHandler = (e) => {
            const input = e.target;
            if (!input || !input.matches || !input.matches('input[data-share-pick]')) return;
            if (!selectMode) return;
            const tr = input.closest('tr[data-share-key]');
            if (!tr) return;
            if (input.checked) selection.add(tr.dataset.shareKey);
            else selection.delete(tr.dataset.shareKey);
            tr.classList.toggle('mp3share-selected', input.checked);
            updateSelectionUI();
        };
        tbody.addEventListener('change', tbodyChangeHandler);
        decorateRows();
    }

    // ==================== 最近分享 ====================
    function loadRecent() {
        try {
            const arr = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
            return Array.isArray(arr) ? arr.filter(x => x && x.url).slice(0, 6) : [];
        } catch (e) { return []; }
    }
    function saveRecent(arr) {
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0, 6))); } catch (e) {}
    }
    function pushRecent(entry) {
        const arr = loadRecent().filter(x => x.url !== entry.url);
        arr.unshift(entry);
        saveRecent(arr);
        renderRecent();
    }
    function renderRecent() {
        const el = document.getElementById('mp3ShareRecentList');
        if (!el) return;
        const arr = loadRecent();
        if (arr.length === 0) {
            el.innerHTML = '<div class="text-[10px] text-slate-600 text-center py-2">尚無分享紀錄</div>';
            return;
        }
        el.innerHTML = arr.map(r => `
            <div class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 bg-slate-800/40 border border-slate-800" data-recent-id="${esc(r.id)}">
                <i class="fa-solid ${r.protected ? 'fa-lock text-amber-400' : 'fa-link text-sky-400'} text-[10px] shrink-0"></i>
                <div class="min-w-0 flex-1">
                    <div class="text-[11px] text-slate-200 truncate" title="${esc(r.title)}">${esc(r.title)}</div>
                    <div class="text-[9px] text-slate-500">${r.count} 首 · ${fmtDate(r.at)}</div>
                </div>
                <button data-recent-act="copy" title="複製連結" class="p-1 text-slate-500 hover:text-sky-300"><i class="fa-regular fa-copy text-[9px]"></i></button>
                <button data-recent-act="preview" title="預覽接收畫面" class="p-1 text-slate-500 hover:text-fuchsia-300"><i class="fa-solid fa-eye text-[9px]"></i></button>
                <button data-recent-act="remove" title="刪除紀錄" class="p-1 text-slate-500 hover:text-rose-400"><i class="fa-solid fa-xmark text-[10px]"></i></button>
            </div>
        `).join('');
    }
    function onRecentClick(e) {
        const btn = e.target.closest('button[data-recent-act]');
        if (!btn) return;
        const row = btn.closest('[data-recent-id]');
        if (!row) return;
        const arr = loadRecent();
        const r = arr.find(x => x.id === row.dataset.recentId);
        if (!r) return;
        const act = btn.dataset.recentAct;
        if (act === 'copy') {
            copyText(r.url).then(ok => showStatus(ok ? '已複製分享連結' : '複製失敗，請手動複製', ok ? 'success' : 'warn'));
        } else if (act === 'preview') {
            const token = tokenFromInput(r.url);
            if (token) handleToken(token);
        } else if (act === 'remove') {
            saveRecent(arr.filter(x => x.id !== r.id));
            renderRecent();
        }
    }

    // ==================== 通用彈窗 ====================
    function closeActiveModal(result) {
        if (activeKeyHandler) {
            document.removeEventListener('keydown', activeKeyHandler, true);
            activeKeyHandler = null;
        }
        if (activeOverlay) { activeOverlay.remove(); activeOverlay = null; }
        if (activeResolve) {
            const r = activeResolve;
            activeResolve = null;
            r(result === undefined ? null : result);
        }
    }
    function mountOverlay(panelHtml) {
        closeActiveModal(null);
        const overlay = document.createElement('div');
        overlay.className = 'mp3share-overlay fixed inset-0 bg-black/75 backdrop-blur-sm z-[75] flex items-center justify-center p-3 md:p-6';
        overlay.innerHTML = `<div class="mp3share-panel bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl shadow-sky-950/40 flex flex-col max-h-[88vh]" role="dialog" aria-modal="true">${panelHtml}</div>`;
        document.body.appendChild(overlay);
        activeOverlay = overlay;
        overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeActiveModal(null); });
        activeKeyHandler = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeActiveModal(null); } };
        document.addEventListener('keydown', activeKeyHandler, true);
        return overlay;
    }
    function modalHeader(iconClass, iconBg, title, subtitle) {
        return `
            <div class="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-slate-800 shrink-0">
                <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 shadow-lg">
                    <i class="${iconClass} text-base"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <h3 class="text-sm md:text-base font-bold text-slate-100 truncate">${esc(title)}</h3>
                    <p class="text-[11px] text-slate-400 truncate">${esc(subtitle)}</p>
                </div>
                <button data-close class="p-1.5 text-slate-500 hover:text-white transition" title="關閉"><i class="fa-solid fa-xmark"></i></button>
            </div>`;
    }
    function bindCloseButtons(root) {
        root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeActiveModal(null)));
    }

    // ==================== 建立分享 ====================
    function openShareModal() {
        if (shareBusy) return;
        const stats = selectionStats();
        if (stats.portable === 0) { showStatus('請先在影音列表勾選可分享的媒體', 'warn'); return; }
        return new Promise((resolve) => {
            const overlay = mountOverlay('');
            activeResolve = resolve;
            const panel = overlay.querySelector('.mp3share-panel');
            const savedFrom = localStorage.getItem(FROM_KEY) || '';
            const cfg = {
                title: defaultTitle(stats.portable),
                from: savedFrom,
                protect: false,
                q: '',
                a: ''
            };

            function renderConfig(errorMsg) {
                if (!panel.isConnected) return;
                const listHtml = stats.entries.map((en, i) => {
                    const ok = !!en.share;
                    const meta = window.MP3GetSourceMeta ? window.MP3GetSourceMeta({ _source: en.source }) : { label: en.source };
                    return `
                        <div class="flex items-start gap-2 px-2.5 py-2 rounded-xl border ${ok ? 'bg-slate-950/50 border-slate-800' : 'bg-amber-950/10 border-amber-500/20 opacity-70'}">
                            <span class="mt-0.5 min-w-[1.25rem] text-right text-[10px] font-mono text-slate-500 select-none">${i + 1}</span>
                            <i class="${kindIcon(en.kind)} text-[10px] mt-1 shrink-0"></i>
                            <div class="min-w-0 flex-1">
                                <div class="text-xs text-slate-200 truncate" title="${esc(en.name)}">${esc(en.name)}</div>
                                <div class="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                    <span class="px-1 py-0.5 rounded border border-slate-700 bg-slate-800/70 text-[9px]">${esc(meta.label)}</span>
                                    ${ok ? '<span class="truncate">' + esc(shortUrl(en.share.url)) + '</span>' : '<span class="text-amber-400">此來源無法轉成公開連結，將排除</span>'}
                                </div>
                            </div>
                            <i class="fa-solid ${ok ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-amber-400'} text-[11px] mt-1 shrink-0"></i>
                        </div>`;
                }).join('');
                panel.innerHTML = `
                    ${modalHeader('fa-solid fa-share-nodes text-white', 'bg-gradient-to-br from-sky-500 to-fuchsia-600', '建立分享連結', '已選 ' + stats.total + ' 筆，可分享 ' + stats.portable + ' 筆' + (stats.blocked ? '，排除 ' + stats.blocked + ' 筆' : ''))}
                    <div class="mp3share-scroll flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label class="block">
                                <span class="text-[11px] text-slate-400 mb-1 block">分享標題</span>
                                <input id="mp3ShareTitle" type="text" value="${esc(cfg.title)}" maxlength="120"
                                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
                            </label>
                            <label class="block">
                                <span class="text-[11px] text-slate-400 mb-1 block">分享者（選填）</span>
                                <input id="mp3ShareFrom" type="text" value="${esc(cfg.from)}" maxlength="60" placeholder="你的名字 / 暱稱"
                                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
                            </label>
                        </div>
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">媒體清單</span>
                                <span class="text-[10px] text-slate-500">${stats.portable} 筆納入 · ${stats.blocked} 筆排除</span>
                            </div>
                            <div class="space-y-1.5 max-h-48 overflow-y-auto mp3share-scroll pr-1">${listHtml}</div>
                        </div>
                        <div class="rounded-2xl border ${cfg.protect ? 'border-amber-500/40 bg-amber-950/15' : 'border-slate-800 bg-slate-950/40'} p-3.5 transition">
                            <label class="flex items-center gap-2.5 cursor-pointer select-none">
                                <input id="mp3ShareProtect" type="checkbox" ${cfg.protect ? 'checked' : ''} class="w-4 h-4 accent-amber-500">
                                <span class="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                    <i class="fa-solid fa-lock text-amber-400 text-xs"></i> 以問題保護
                                </span>
                                <span class="text-[10px] text-slate-500 ml-auto hidden sm:inline">對方需答對才能檢視與匯入</span>
                            </label>
                            <div id="mp3ShareQA" class="${cfg.protect ? '' : 'hidden'} mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label class="block">
                                    <span class="text-[11px] text-slate-400 mb-1 block">問題</span>
                                    <input id="mp3ShareQ" type="text" value="${esc(cfg.q)}" maxlength="160" placeholder="例如：我們第一次聽的歌是哪首？"
                                        class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500">
                                </label>
                                <label class="block">
                                    <span class="text-[11px] text-slate-400 mb-1 block">答案</span>
                                    <input id="mp3ShareA" type="text" value="${esc(cfg.a)}" maxlength="120" placeholder="答案（不分大小寫）"
                                        class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500">
                                    <span class="text-[9px] text-slate-600 mt-1 block">答案會用於加密；遺失答案無法復原媒體清單</span>
                                </label>
                            </div>
                        </div>
                        <div class="text-[10px] text-slate-500 leading-relaxed rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                            <i class="fa-solid fa-circle-info text-sky-400 mr-1"></i>
                            連結內含媒體清單，不上傳伺服器。「本地」項目會轉成 <b class="text-slate-300">${esc(location.host)}</b> 的絕對連結，對方需能存取此伺服器。
                        </div>
                        ${errorMsg ? '<div class="text-[11px] text-rose-400"><i class="fa-solid fa-triangle-exclamation mr-1"></i>' + esc(errorMsg) + '</div>' : ''}
                    </div>
                    <div class="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-800 shrink-0">
                        <span class="text-[10px] text-slate-500">${hasWebCrypto() ? 'HTTPS 安全加密就緒' : '非 HTTPS：問題保護採簡易加密'}</span>
                        <div class="flex items-center gap-2">
                            <button data-close class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition">取消</button>
                            <button id="mp3ShareGenerate" class="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-fuchsia-600 hover:from-sky-500 hover:to-fuchsia-500 text-xs font-medium text-white transition shadow-lg shadow-sky-900/40">
                                <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>產生連結
                            </button>
                        </div>
                    </div>`;
                bindCloseButtons(panel);
                const protectEl = panel.querySelector('#mp3ShareProtect');
                const qaEl = panel.querySelector('#mp3ShareQA');
                protectEl.addEventListener('change', () => {
                    cfg.protect = protectEl.checked;
                    qaEl.classList.toggle('hidden', !cfg.protect);
                    qaEl.parentNode.classList.toggle('border-amber-500/40', cfg.protect);
                    qaEl.parentNode.classList.toggle('bg-amber-950/15', cfg.protect);
                    qaEl.parentNode.classList.toggle('border-slate-800', !cfg.protect);
                    qaEl.parentNode.classList.toggle('bg-slate-950/40', !cfg.protect);
                });
                panel.querySelector('#mp3ShareGenerate').addEventListener('click', generate);
                setTimeout(() => {
                    if (!panel.isConnected) return;
                    const t = panel.querySelector('#mp3ShareTitle');
                    if (t) { t.focus(); t.select(); }
                }, 30);
            }

            async function generate() {
                if (shareBusy || !panel.isConnected) return;
                const titleInput = panel.querySelector('#mp3ShareTitle');
                const fromInput = panel.querySelector('#mp3ShareFrom');
                const protectInput = panel.querySelector('#mp3ShareProtect');
                const qInput = panel.querySelector('#mp3ShareQ');
                const aInput = panel.querySelector('#mp3ShareA');
                if (!titleInput || !fromInput || !protectInput || !qInput || !aInput) return;
                cfg.title = (titleInput.value || '').trim() || defaultTitle(stats.portable);
                cfg.from = (fromInput.value || '').trim();
                cfg.protect = protectInput.checked;
                cfg.q = (qInput.value || '').trim();
                cfg.a = (aInput.value || '').trim();
                if (cfg.protect && (!cfg.q || !cfg.a)) { renderConfig('開啟問題保護時，問題與答案都必須填寫'); return; }
                shareBusy = true;
                const btn = panel.querySelector('#mp3ShareGenerate');
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>產生中…';
                }
                try {
                    try { localStorage.setItem(FROM_KEY, cfg.from); } catch (e) {}
                    const items = stats.ok.map(en => ({
                        n: en.name.slice(0, MAX_NAME_LEN),
                        u: en.share.url,
                        k: en.kind,
                        m: en.mime,
                        s: en.share.via
                    }));
                    const payload = await packPayload({ title: cfg.title, from: cfg.from, q: cfg.protect ? cfg.q : '', at: Date.now(), count: items.length }, items, cfg.protect ? cfg.a : '');
                    const url = shareUrlFromPayload(payload);
                    pushRecent({ id: 's' + Date.now().toString(36), title: cfg.title, count: items.length, url: url, at: Date.now(), protected: cfg.protect });
                    if (panel.isConnected) renderResult(url, payload, items.length);
                } catch (e) {
                    if (panel.isConnected) renderConfig(e.message || '產生失敗');
                } finally {
                    shareBusy = false;
                }
            }

            function renderResult(url, payload, count) {
                if (!panel.isConnected) return;
                const longWarn = url.length > 30000 ? '<div class="text-[10px] text-amber-400 mt-2"><i class="fa-solid fa-triangle-exclamation mr-1"></i>連結較長，部分通訊軟體可能截斷，建議減少分享筆數</div>' : '';
                panel.innerHTML = `
                    ${modalHeader('fa-solid fa-circle-check text-white', 'bg-gradient-to-br from-emerald-500 to-sky-600', '分享連結已產生', count + ' 首 · ' + (payload.q ? '問題保護' : '公開連結') + ' · ' + url.length.toLocaleString() + ' 字元')}
                    <div class="mp3share-scroll flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
                        ${payload.q ? `<div class="rounded-xl bg-amber-950/20 border border-amber-500/30 p-3 text-xs text-amber-200"><i class="fa-solid fa-lock mr-1.5"></i>問題：<b>${esc(payload.q)}</b><br><span class="text-[10px] text-amber-400/80">請把答案另行告知對方（答案不會出現在連結中）</span></div>` : ''}
                        <textarea id="mp3ShareUrlOut" readonly rows="5" spellcheck="false"
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-[11px] font-mono text-sky-200 focus:outline-none focus:border-sky-500 mp3share-scroll">${esc(url)}</textarea>
                        ${longWarn}
                        <div class="flex flex-wrap gap-2">
                            <button id="mp3ShareCopyUrl" class="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-fuchsia-600 hover:from-sky-500 hover:to-fuchsia-500 text-xs font-semibold text-white transition shadow-lg shadow-sky-900/40">
                                <i class="fa-regular fa-copy mr-1.5"></i>複製連結
                            </button>
                            <button id="mp3SharePreview" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition">
                                <i class="fa-solid fa-eye mr-1.5"></i>預覽接收畫面
                            </button>
                            <button id="mp3ShareOpenNow" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"><i class="fa-solid fa-arrow-up-right-from-square mr-1.5"></i>開啟連結</button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-800 shrink-0">
                        <button id="mp3ShareBackEdit" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"><i class="fa-solid fa-arrow-left mr-1"></i>返回編輯</button>
                        <button data-close class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition shadow-lg shadow-emerald-900/40">完成</button>
                    </div>`;
                bindCloseButtons(panel);
                const out = panel.querySelector('#mp3ShareUrlOut');
                const copyBtn = panel.querySelector('#mp3ShareCopyUrl');
                const previewBtn = panel.querySelector('#mp3SharePreview');
                const openBtn = panel.querySelector('#mp3ShareOpenNow');
                const backBtn = panel.querySelector('#mp3ShareBackEdit');
                out.addEventListener('focus', () => out.select());

                copyBtn.addEventListener('click', async () => {
                    const ok = await copyText(url);
                    if (!copyBtn.isConnected) return;
                    copyBtn.innerHTML = ok
                        ? '<i class="fa-solid fa-check mr-1.5"></i>已複製'
                        : '<i class="fa-solid fa-triangle-exclamation mr-1.5"></i>複製失敗';
                    setTimeout(() => {
                        if (!copyBtn.isConnected) return;
                        copyBtn.innerHTML = '<i class="fa-regular fa-copy mr-1.5"></i>複製連結';
                    }, 1600);
                });
                previewBtn.addEventListener('click', () => {
                    closeActiveModal(null);
                    const token = tokenFromInput(url);
                    if (token) handleToken(token);
                });
                openBtn.addEventListener('click', () => { window.open(url, '_blank', 'noopener'); });
                backBtn.addEventListener('click', () => renderConfig());
            }

            renderConfig();
        });
    }

    // ==================== 接收分享 ====================
    function existingUrlSet() {
        try {
            const arr = JSON.parse(localStorage.getItem(URL_MEDIA_STORE) || '[]');
            return new Set(Array.isArray(arr) ? arr.map(x => x && x.url).filter(Boolean) : []);
        } catch (e) { return new Set(); }
    }
    function handleToken(token) {
        let payload;
        try { payload = payloadFromToken(token); }
        catch (e) {
            ext.showCustomModal({ title: '接收分享失敗', message: e.message, type: 'error' });
            return;
        }
        return openReceiveModal(payload);
    }
    function openReceiveModal(payload) {
        return new Promise((resolve) => {
            const overlay = mountOverlay('');
            activeResolve = resolve;
            const panel = overlay.querySelector('.mp3share-panel');
            const title = String(payload.title || '媒體分享').slice(0, 120);
            const from = String(payload.from || '').slice(0, 60);
            const question = String(payload.q || '').slice(0, 160);
            let items = null;

            function renderLocked(errorMsg) {
                if (!panel.isConnected) return;
                panel.innerHTML = `
                    ${modalHeader('fa-solid fa-lock text-white', 'bg-gradient-to-br from-amber-500 to-rose-600', '受保護的分享', title + (from ? ' · 來自 ' + from : ''))}
                    <div class="px-5 py-5 space-y-4">
                        <div class="rounded-2xl bg-gradient-to-br from-amber-950/30 to-rose-950/20 border border-amber-500/30 p-4">
                            <div class="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-1.5"><i class="fa-solid fa-circle-question mr-1"></i>請回答問題以解鎖</div>
                            <div class="text-sm text-slate-100 leading-relaxed">${esc(question)}</div>
                        </div>
                        <label class="block">
                            <span class="text-[11px] text-slate-400 mb-1 block">你的答案</span>
                            <input id="mp3ShareAnswer" type="text" autocomplete="off" maxlength="120" placeholder="輸入答案（不分大小寫）"
                                class="w-full bg-slate-800 border ${errorMsg ? 'border-rose-500' : 'border-slate-700'} rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 ${errorMsg ? 'mp3share-shake' : ''}">
                        </label>
                        ${errorMsg ? '<div class="text-[11px] text-rose-400"><i class="fa-solid fa-triangle-exclamation mr-1"></i>' + esc(errorMsg) + '</div>' : ''}
                        <div class="text-[10px] text-slate-600">答案僅用於解鎖，不會上傳；媒體清單在答對前保持加密。</div>
                    </div>
                    <div class="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-800">
                        <button data-close class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition">取消</button>
                        <button id="mp3ShareUnlock" class="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-xs font-medium text-white transition shadow-lg shadow-amber-900/40">
                            <i class="fa-solid fa-unlock-keyhole mr-1"></i>解鎖並檢視
                        </button>
                    </div>`;
                bindCloseButtons(panel);
                const input = panel.querySelector('#mp3ShareAnswer');
                const btn = panel.querySelector('#mp3ShareUnlock');
                const originalBtnHtml = btn.innerHTML;
                async function unlock() {
                    const ans = (input.value || '').trim();
                    if (!ans) {
                        input.classList.add('mp3share-shake', 'border-rose-500');
                        input.focus();
                        setTimeout(() => { if (input.isConnected) input.classList.remove('mp3share-shake'); }, 350);
                        return;
                    }
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>解鎖中…';
                    try {
                        items = await unpackPayload(payload, ans);
                        if (items.length === 0) throw new Error('分享內沒有可匯入的媒體');
                        if (panel.isConnected) renderList();
                    } catch (e) {
                        if (panel.isConnected) renderLocked(e.message || '解鎖失敗');
                        else if (btn.isConnected) { btn.disabled = false; btn.innerHTML = originalBtnHtml; }
                    }
                }
                btn.addEventListener('click', unlock);
                input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); unlock(); } });
                setTimeout(() => { if (input.isConnected) input.focus(); }, 30);
            }

            function renderList(errorMsg) {
                if (!panel.isConnected || !items) return;
                const existing = existingUrlSet();
                const rows = items.map((it, i) => ({ it: it, dup: existing.has(it.u), idx: i }));
                const freshCount = rows.filter(r => !r.dup).length;
                panel.innerHTML = `
                    ${modalHeader('fa-solid fa-inbox text-white', 'bg-gradient-to-br from-fuchsia-500 to-sky-600', '確認接收媒體', title + (from ? ' · 來自 ' + from : '') + ' · ' + rows.length + ' 筆')}
                    <div class="mp3share-scroll flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-2">
                        <div class="text-[11px] text-slate-400 rounded-xl bg-slate-950/50 border border-slate-800 px-3 py-2">
                            <i class="fa-solid fa-circle-info text-sky-400 mr-1"></i>勾選要匯入的項目，可直接修改名稱；匯入後會加入「URL 媒體 / 連結媒體」。
                        </div>
                        ${rows.map(r => `
                            <div class="flex items-start gap-2 p-2.5 rounded-xl border ${r.dup ? 'bg-slate-950/30 border-slate-800 opacity-50' : 'bg-slate-950/50 border-slate-800'}" data-recv-idx="${r.idx}">
                                <span class="mt-2 min-w-[1.25rem] text-right text-[10px] font-mono text-slate-500 select-none">${r.idx + 1}</span>
                                <input type="checkbox" data-recv-pick ${r.dup ? 'disabled' : 'checked'} class="mt-2.5 w-4 h-4 accent-fuchsia-500 shrink-0">
                                <i class="${kindIcon(itKind(r.it))} text-[10px] mt-3 shrink-0"></i>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-1 text-[10px] text-slate-500 mb-1 min-w-0">
                                        ${viaBadge(r.it.s)}
                                        <span class="truncate" title="${esc(r.it.u)}">${esc(shortUrl(r.it.u))}</span>
                                        ${r.dup ? '<span class="px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] shrink-0">已存在</span>' : ''}
                                    </div>
                                    <input type="text" data-recv-name value="${esc(r.it.n)}" ${r.dup ? 'disabled' : ''} maxlength="200"
                                        class="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-fuchsia-500">
                                </div>
                            </div>`).join('')}
                        ${errorMsg ? '<div class="text-[11px] text-rose-400 pt-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i>' + esc(errorMsg) + '</div>' : ''}
                    </div>
                    <div class="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-800 shrink-0">
                        <span id="mp3ShareRecvCount" class="text-[11px] text-slate-400"></span>
                        <div class="flex items-center gap-2">
                            <button data-close class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition">取消</button>
                            <button id="mp3ShareImport" class="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-sky-600 hover:from-fuchsia-500 hover:to-sky-500 text-xs font-medium text-white transition shadow-lg shadow-fuchsia-900/40"></button>
                        </div>
                    </div>`;
                bindCloseButtons(panel);
                const countEl = panel.querySelector('#mp3ShareRecvCount');
                const importBtn = panel.querySelector('#mp3ShareImport');
                function picked() {
                    const out = [];
                    panel.querySelectorAll('[data-recv-idx]').forEach(row => {
                        const r = rows[parseInt(row.dataset.recvIdx, 10)];
                        const pick = row.querySelector('[data-recv-pick]');
                        if (!r || r.dup || !pick.checked) return;
                        const nameInput = row.querySelector('[data-recv-name]');
                        const name = (nameInput && nameInput.value || '').trim();
                        out.push({ n: name || r.it.n, u: r.it.u });
                    });
                    return out;
                }
                function refresh() {
                    if (!panel.isConnected) return;
                    const n = picked().length;
                    countEl.textContent = '已選 ' + n + ' / ' + freshCount + ' 筆新項目';
                    importBtn.textContent = '匯入所選 ' + n + ' 筆';
                    importBtn.disabled = n === 0 || importBusy;
                    importBtn.classList.toggle('opacity-40', importBtn.disabled);
                    importBtn.classList.toggle('cursor-not-allowed', importBtn.disabled);
                }
                panel.querySelectorAll('[data-recv-pick]').forEach(p => p.addEventListener('change', refresh));
                importBtn.addEventListener('click', async () => {
                    if (!panel.isConnected) return;
                    const pickedItems = picked();
                    if (pickedItems.length === 0 || importBusy) return;
                    importBusy = true;
                    importBtn.disabled = true;
                    importBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>匯入中…';
                    try {
                        const result = await importItems(pickedItems);
                        if (panel.isConnected) renderDone(result);
                    } catch (e) {
                        if (panel.isConnected) {
                            const scroll = panel.querySelector('.mp3share-scroll');
                            if (scroll) {
                                const err = document.createElement('div');
                                err.className = 'text-[11px] text-rose-400 pt-1';
                                err.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1"></i>' + esc(e.message || '匯入失敗');
                                scroll.appendChild(err);
                            }
                        }
                    } finally {
                        importBusy = false;
                        if (panel.isConnected && importBtn.isConnected) refresh();
                    }
                });
                refresh();
                if (freshCount === 0) {
                    const scroll = panel.querySelector('.mp3share-scroll');
                    if (scroll) {
                        const note = document.createElement('div');
                        note.className = 'text-[11px] text-amber-400 rounded-xl bg-amber-950/20 border border-amber-500/30 px-3 py-2';
                        note.innerHTML = '<i class="fa-solid fa-circle-info mr-1"></i>這份分享的所有媒體都已在你的媒體庫中';
                        scroll.prepend(note);
                    }
                }
            }

            function renderDone(result) {
                if (!panel.isConnected) return;
                panel.innerHTML = `
                    ${modalHeader('fa-solid fa-circle-check text-white', 'bg-gradient-to-br from-emerald-500 to-sky-600', '匯入完成', title)}
                    <div class="px-5 py-6 text-center space-y-3">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
                            <i class="fa-solid fa-check text-2xl"></i>
                        </div>
                        <div class="text-2xl font-bold text-slate-100">${result.added} <span class="text-sm font-normal text-slate-400">筆已匯入</span></div>
                        <div class="text-[11px] text-slate-500">
                            ${result.dup ? '重複略過 ' + result.dup + ' 筆' : ''}${result.dup && result.bad ? ' · ' : ''}${result.bad ? '無效 ' + result.bad + ' 筆' : ''}
                            ${!result.dup && !result.bad ? '全部項目成功加入媒體庫' : ''}
                        </div>
                        <div class="text-[11px] text-slate-400 rounded-xl bg-slate-950/50 border border-slate-800 px-3 py-2 inline-block">
                            <i class="fa-solid fa-link text-fuchsia-400 mr-1"></i>已加入「URL 媒體 / 連結媒體」，可直接播放、收藏與管理
                        </div>
                    </div>
                    <div class="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-800">
                        <button id="mp3ShareViewImported" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"><i class="fa-solid fa-list-music mr-1"></i>檢視匯入結果</button>
                        <button data-close class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition shadow-lg shadow-emerald-900/40">完成</button>
                    </div>`;
                bindCloseButtons(panel);
                panel.querySelector('#mp3ShareViewImported').addEventListener('click', () => {
                    if (typeof window.handleSourceFilterChange === 'function') window.handleSourceFilterChange('urlmedia');
                    if (typeof window.filterCategory === 'function') window.filterCategory(encodeURIComponent('連結媒體'));
                    closeActiveModal(null);
                });
            }

            if (payload.enc === 'a' || payload.enc === 'x') renderLocked();
            else {
                (async () => {
                    try {
                        items = await unpackPayload(payload, '');
                        if (items.length === 0) throw new Error('分享內沒有可匯入的媒體');
                        if (panel.isConnected) renderList();
                    } catch (e) {
                        if (panel.isConnected) {
                            panel.innerHTML = `${modalHeader('fa-solid fa-triangle-exclamation text-white', 'bg-rose-600', '無法讀取分享', title)}
                                <div class="px-5 py-5 text-sm text-rose-300">${esc(e.message)}</div>
                                <div class="flex justify-end px-5 py-3.5 border-t border-slate-800"><button data-close class="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200">關閉</button></div>`;
                            bindCloseButtons(panel);
                        }
                    }
                })();
            }
        });
    }

    function itKind(it) { return it.k || 'media'; }

    async function ensureUrlMediaPlugin() {
        if (window.MP3UrlMediaPlugin && typeof window.MP3UrlMediaPlugin.addUrls === 'function') return window.MP3UrlMediaPlugin;
        if (window.MP3PluginManager && typeof window.MP3PluginManager.enable === 'function') {
            await window.MP3PluginManager.enable('urlMedia');
            if (window.MP3UrlMediaPlugin && typeof window.MP3UrlMediaPlugin.addUrls === 'function') return window.MP3UrlMediaPlugin;
        }
        throw new Error('找不到「URL 媒體」插件，請先在插件中心啟用');
    }
    async function importItems(pickedItems) {
        const plugin = await ensureUrlMediaPlugin();
        const text = pickedItems.map(p => p.u + ' | ' + p.n).join('\n');
        const result = await plugin.addUrls(text);
        return { added: result.added || 0, dup: result.dup || 0, bad: result.bad || 0 };
    }

    // ==================== 插件面板 ====================
    function showStatus(msg, tone) {
        const el = document.getElementById('mp3ShareStatus');
        if (!el) return;
        el.textContent = msg;
        el.className = 'text-[10px] leading-relaxed ' + (
            tone === 'success' ? 'text-emerald-400' :
            tone === 'warn' ? 'text-amber-400' :
            tone === 'error' ? 'text-rose-400' : 'text-slate-400');
        if (statusTimer) clearTimeout(statusTimer);
        statusTimer = setTimeout(() => {
            const current = document.getElementById('mp3ShareStatus');
            if (current) current.classList.add('hidden');
        }, 4000);
    }
    function renderPanel() {
        if (!initialized) return;
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer(PLUGIN_ID);
        if (!body) { if (uiRetry++ < 25) setTimeout(renderPanel, 200); return; }
        if (body.dataset.mp3ShareReady === '1') { renderRecent(); updateSelectionUI(); return; }
        body.dataset.mp3ShareReady = '1';
        body.innerHTML = `
            <div class="space-y-2.5 pt-1">
                <div class="grid grid-cols-3 gap-1 text-center">
                    <div class="rounded-lg bg-slate-800/50 border border-slate-800 py-1.5">
                        <i class="fa-solid fa-square-check text-sky-400 text-[10px]"></i>
                        <div class="text-[9px] text-slate-500 mt-0.5">1 勾選</div>
                    </div>
                    <div class="rounded-lg bg-slate-800/50 border border-slate-800 py-1.5">
                        <i class="fa-solid fa-lock text-amber-400 text-[10px]"></i>
                        <div class="text-[9px] text-slate-500 mt-0.5">2 設定問題</div>
                    </div>
                    <div class="rounded-lg bg-slate-800/50 border border-slate-800 py-1.5">
                        <i class="fa-solid fa-link text-fuchsia-400 text-[10px]"></i>
                        <div class="text-[9px] text-slate-500 mt-0.5">3 複製連結</div>
                    </div>
                </div>
                <button id="mp3SharePanelCreate" disabled class="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-sky-600 to-fuchsia-600 hover:from-sky-500 hover:to-fuchsia-500 text-white text-[11px] font-medium px-2.5 py-2 rounded-xl transition shadow-lg shadow-sky-950/40 disabled:opacity-40 disabled:cursor-not-allowed">
                    <i class="fa-solid fa-share-nodes text-[10px]"></i> 建立分享連結（0 筆）
                </button>
                <div id="mp3SharePanelHint" class="text-[9px] text-slate-600 leading-relaxed">於影音列表按「選取分享」勾選媒體</div>
                <div class="pt-2 border-t border-slate-800">
                    <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5"><i class="fa-solid fa-inbox text-fuchsia-400 mr-1"></i>接收分享</div>
                    <div class="flex items-center gap-1.5">
                        <input id="mp3ShareReceiveInput" type="text" placeholder="貼上分享連結（留空＝讀取剪貼簿）…"
                            class="flex-1 min-w-0 bg-slate-800 border border-slate-700 text-[11px] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-fuchsia-500 text-slate-200 placeholder:text-slate-600">
                        <button id="mp3ShareReceiveBtn" class="bg-slate-800 hover:bg-fuchsia-600 border border-slate-700 hover:border-fuchsia-500 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl text-[11px] transition" title="接收分享（輸入框留空時讀取剪貼簿）">
                            <i class="fa-solid fa-arrow-right-to-bracket"></i>
                        </button>
                    </div>
                    <div class="text-[9px] text-slate-600 mt-1 leading-relaxed"><i class="fa-regular fa-clipboard mr-1"></i>輸入框留空時，按鈕會自動讀取剪貼簿中的分享連結</div>
                </div>
                <div id="mp3ShareStatus" class="hidden"></div>
                <div class="pt-2 border-t border-slate-800">
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider"><i class="fa-solid fa-clock-rotate-left text-sky-400 mr-1"></i>最近分享</span>
                        <span class="text-[9px] text-slate-600">最多 6 筆</span>
                    </div>
                    <div id="mp3ShareRecentList" class="space-y-1 max-h-40 overflow-y-auto mp3share-scroll pr-0.5"></div>
                </div>
            </div>`;
        body.querySelector('#mp3SharePanelCreate').addEventListener('click', openShareModal);
        body.querySelector('#mp3ShareReceiveBtn').addEventListener('click', receiveFromInput);
        body.querySelector('#mp3ShareReceiveInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); receiveFromInput(); } });
        body.querySelector('#mp3ShareRecentList').addEventListener('click', onRecentClick);
        renderRecent();
        updateSelectionUI();
    }

    /**
     * 接收分享：
     * 1) 輸入框有內容 → 直接解析；
     * 2) 輸入框留空 → 讀取剪貼簿，若含分享連結則直接使用；
     *    剪貼簿無連結 / 權限失敗 / 瀏覽器不支援 → 提示手動貼上。
     */
    async function receiveFromInput() {
        if (receiveBusy) return;
        const input = document.getElementById('mp3ShareReceiveInput');
        const btn = document.getElementById('mp3ShareReceiveBtn');
        if (!input) return;

        const raw = (input.value || '').trim();
        if (raw) {
            const token = tokenFromInput(raw);
            if (!token) { showStatus('請貼上有效的分享連結', 'warn'); input.focus(); return; }
            input.value = '';
            handleToken(token);
            return;
        }

        if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
            showStatus('此瀏覽器無法讀取剪貼簿，請手動貼上分享連結', 'warn');
            input.focus();
            return;
        }

        receiveBusy = true;
        const originalBtnHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        }
        try {
            let clipText = '';
            try {
                clipText = await navigator.clipboard.readText();
            } catch (err) {
                showStatus('無法讀取剪貼簿（權限或瀏覽器限制），請手動貼上分享連結', 'warn');
                input.focus();
                return;
            }
            const token = tokenFromInput(clipText);
            if (!token) {
                showStatus('剪貼簿中沒有分享連結，請手動貼上', 'warn');
                input.focus();
                return;
            }
            showStatus('已從剪貼簿讀取分享連結', 'success');
            handleToken(token);
        } finally {
            receiveBusy = false;
            if (btn && btn.isConnected) {
                btn.disabled = false;
                btn.innerHTML = originalBtnHtml;
            }
        }
    }
    function receiveFromInputOld() { /* 保留空殼，避免舊引用報錯 */ }

    // ==================== Hash 自動接收 ====================
    function consumeHash() {
        if (!initialized) return;
        const m = location.hash.match(/mp3share=([A-Za-z0-9\-_]+)/);
        if (!m) return;
        const token = m[1];
        try { history.replaceState({}, '', location.pathname + location.search); } catch (e) {}
        handleToken(token);
    }
    function startHashWatching() {
        hashHandler = () => consumeHash();
        window.addEventListener('hashchange', hashHandler);
        setTimeout(consumeHash, 600);
    }

    // ==================== 生命週期 ====================
    async function init() {
        if (initialized) return;
        ext = window.MP3AppExtension;
        if (!ext) throw new Error('MP3AppExtension 未就緒');
        initialized = true;
        uiRetry = 0;
        injectStyle();
        renderPanel();
        injectSelectionBar();
        startObserving();
        startHashWatching();
        updateSelectionUI();
        console.log('[SharePlugin] ready v' + VERSION);
    }
    async function unload() {
        if (!initialized) return;
        initialized = false;
        closeActiveModal(null);
        if (observer) { observer.disconnect(); observer = null; }
        if (decorateRaf) { cancelAnimationFrame(decorateRaf); decorateRaf = 0; }
        const tbody = document.getElementById('fileTableBody');
        if (tbody && tbodyChangeHandler) tbody.removeEventListener('change', tbodyChangeHandler);
        tbodyChangeHandler = null;
        if (hashHandler) window.removeEventListener('hashchange', hashHandler);
        hashHandler = null;
        if (statusTimer) { clearTimeout(statusTimer); statusTimer = null; }
        selection.clear();
        selectMode = false;
        decorateRows();
        if (selectionBar) { selectionBar.remove(); selectionBar = null; }
        if (styleEl) { styleEl.remove(); styleEl = null; }
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer(PLUGIN_ID);
        if (body) { body.innerHTML = ''; delete body.dataset.mp3ShareReady; }
        shareBusy = false;
        importBusy = false;
        receiveBusy = false;
    }

    window.MP3SharePlugin = {
        version: VERSION,
        init: init,
        unload: unload,
        getSelectedKeys: () => Array.from(selection),
        createShare: openShareModal,
        receive: (urlOrToken) => {
            const token = tokenFromInput(urlOrToken);
            if (!token) throw new Error('無效的分享連結');
            return handleToken(token);
        }
    };
})();