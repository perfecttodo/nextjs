/**
 * ============================================================
 *  url-media-plugin.js — 「URL 媒體」獨立插件 v1.2
 *  功能：貼上一或多筆媒體 URL，直接加入影音列表（媒體庫）。
 *        ．輸入支援「換行 / 逗號（含全形，）/ 空白」分隔，可批次。
 *        ．「從剪貼簿貼上」與「加入媒體庫」都會先彈出確認清單，
 *          清單顯示序號，可逐筆修改顯示名稱、勾選後再新增。
 *        ．支援音訊 / 影片直連與 m3u8 串流（自動啟用 hls.js）。
 *        ．可播放、重新命名、複製 URL、移除、清空；
 *          清單持久化於 localStorage，重新啟用插件後自動恢復。
 *  掛載：插件中心（MP3PluginManager）
 *  依賴：MP3AppExtension / MP3RegisterSourceAdapter / MP3SourceRegistry
 *
 *  安裝：
 *    1) 將本文件放在與其他插件相同的目錄。
 *    2) 在主頁插件註冊表 REGISTRY 中加入（若尚未加入）：
 *       urlMedia: { id: 'urlMedia', name: 'URL 媒體', description: '貼上 URL 加入媒體庫（音訊/影片/串流）',
 *           icon: 'fa-solid fa-link', iconClass: 'text-fuchsia-400',
 *           scriptSrc: 'url-media-plugin.js', globalVar: 'MP3UrlMediaPlugin',
 *           autoEnable: true, dataSourceKeys: ['urlmedia'] },
 *    3) 重新整理頁面，於「插件中心」開啟「URL 媒體」。
 * ============================================================
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'urlMedia';
    const SOURCE_ID = 'urlmedia';
    const CATEGORY_NAME = '連結媒體';
    const KEY_PREFIX = 'urlmedia:';
    const STORAGE_KEY = 'mp3_url_media_items';
    const HLS_MIME = 'application/vnd.apple.mpegurl';
    const HLS_CDN = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';

    const AUDIO_EXTS = ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'oga', 'opus', 'flac', 'wma', 'aiff', 'ape'];
    const VIDEO_EXTS = ['mp4', 'm4v', 'webm', 'mov', 'mkv', 'avi', 'ts', 'flv', 'wmv', 'mpg', 'mpeg', '3gp'];
    const STREAM_EXTS = ['m3u8', 'mpd'];
    const MIME_MAP = {
        mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav',
        ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', flac: 'audio/flac',
        wma: 'audio/x-ms-wma', aiff: 'audio/aiff', ape: 'audio/x-ape',
        mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
        mkv: 'video/x-matroska', avi: 'video/x-msvideo', ts: 'video/mp2t', flv: 'video/x-flv',
        wmv: 'video/x-ms-wmv', mpg: 'video/mpeg', mpeg: 'video/mpeg', '3gp': 'video/3gpp',
        m3u8: HLS_MIME, mpd: 'application/dash+xml'
    };

    let ext = null;
    let adapter = null;
    let items = [];
    let initialized = false;
    let hlsInstance = null;
    let hlsLoadPromise = null;
    let statusTimer = null;
    let uiRetry = 0;
    let previewBusy = false;
    let modalOverlay = null;
    let modalResolve = null;
    let modalKeyHandler = null;
    const boundEvents = [];

    // ==================== 儲存 ====================
    function loadStore() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return Array.isArray(raw) ? raw.filter(x => x && x.url && x.id) : [];
        } catch (e) { return []; }
    }
    function saveStore() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
    }

    // ==================== 小工具 ====================
    function safeDecode(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }
    function esc(s) {
        return typeof window.escapeHtmlAttr === 'function'
            ? window.escapeHtmlAttr(s)
            : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function keyOf(item) { return KEY_PREFIX + item.url; }
    function uid() { return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
    function isValidUrl(url) {
        if (!/^https?:\/\//i.test(url)) return false;
        try { new URL(url); return true; } catch (e) { return false; }
    }
    function extOf(url) {
        try {
            const m = new URL(url).pathname.match(/\.([a-z0-9]{2,5})$/i);
            return m ? m[1].toLowerCase() : '';
        } catch (e) { return ''; }
    }
    function kindOf(e) {
        if (STREAM_EXTS.indexOf(e) !== -1) return 'stream';
        if (VIDEO_EXTS.indexOf(e) !== -1) return 'video';
        if (AUDIO_EXTS.indexOf(e) !== -1) return 'audio';
        return 'media';
    }
    function kindIcon(kind) {
        if (kind === 'video') return 'fa-solid fa-film text-purple-400';
        if (kind === 'stream') return 'fa-solid fa-tower-broadcast text-amber-400';
        if (kind === 'audio') return 'fa-solid fa-music text-indigo-400';
        return 'fa-solid fa-photo-film text-slate-400';
    }
    function basenameOf(url) {
        try { return safeDecode(new URL(url).pathname.split('/').filter(Boolean).pop() || ''); }
        catch (e) { return ''; }
    }
    function hostOf(url) { try { return new URL(url).hostname; } catch (e) { return ''; } }
    function shortUrl(url) {
        try {
            const u = new URL(url);
            return u.hostname + (u.pathname !== '/' ? u.pathname : '') + (u.search ? '?…' : '');
        } catch (e) { return url; }
    }
    function deriveName(url) {
        const base = basenameOf(url);
        if (base) {
            const stripped = base.replace(/\.[a-z0-9]{2,5}$/i, '');
            if (stripped) return stripped;
        }
        try {
            const u = new URL(url);
            return u.hostname + (u.pathname !== '/' ? u.pathname : '') + (u.search || '');
        } catch (e) {}
        return url || '未命名媒體';
    }

    /**
     * 解析輸入：支援「換行 / 逗號（含全形，）/ 空白」分隔，可批次。
     * 「URL | 名稱」可自訂名稱（名稱內可含空白與逗號）。
     * 逗號僅在「後面接著新 URL」時才視為分隔符，避免誤斷 URL 內部的逗號（如 ?ids=1,2）。
     */
    function parseInput(text) {
        const out = [];
        String(text || '').split(/[\r\n]+/).forEach(line => {
            line = line.trim();
            if (!line) return;
            let name = '';
            const bar = line.indexOf('|');
            if (bar > -1) { name = line.slice(bar + 1).trim(); line = line.slice(0, bar).trim(); }
            line.split(/[,，](?=\s*https?:\/\/)/i).forEach(part => {
                part.split(/\s+/).forEach(u => {
                    u = u.replace(/[,，]+$/, '');
                    if (u) out.push({ url: u, name: name });
                });
            });
        });
        return out;
    }

    /** 整理候選清單：驗證、批次內去重、標記媒體庫已存在者、預填名稱 */
    function collectCandidates(text) {
        const entries = parseInput(text);
        const seen = new Set(items.map(it => it.url));
        const candidates = [];
        let invalid = 0;
        entries.forEach(entry => {
            if (!isValidUrl(entry.url)) { invalid++; return; }
            const isDup = seen.has(entry.url);
            seen.add(entry.url);
            const e = extOf(entry.url);
            candidates.push({
                url: entry.url,
                name: entry.name || deriveName(entry.url),
                ext: e,
                kind: kindOf(e),
                isDup: isDup
            });
        });
        return { candidates: candidates, invalid: invalid };
    }

    function toFile(item) {
        return {
            _key: keyOf(item),
            url: item.url,
            filename: basenameOf(item.url) || item.name,
            displayName: item.name,
            relativePath: item.url,
            category: CATEGORY_NAME,
            size: 0,
            ext: item.ext,
            kind: item.kind,
            mime: item.mime,
            addedAt: item.addedAt
        };
    }

    // ==================== HLS（m3u8）支援 ====================
    function destroyHls() {
        if (hlsInstance) { try { hlsInstance.destroy(); } catch (e) {} hlsInstance = null; }
    }
    function nativeHlsSupported() {
        const p = ext && ext.audioPlayer;
        return !!(p && p.canPlayType && p.canPlayType(HLS_MIME));
    }
    function ensureHlsLib() {
        if (window.Hls) return Promise.resolve(window.Hls);
        if (hlsLoadPromise) return hlsLoadPromise;
        hlsLoadPromise = new Promise((resolve) => {
            let settled = false;
            const done = (lib) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                if (!lib) hlsLoadPromise = null; // 失敗允許下次重試
                resolve(lib || null);
            };
            const s = document.createElement('script');
            s.src = HLS_CDN;
            const timer = setTimeout(() => done(null), 8000);
            s.onload = () => done(window.Hls || null);
            s.onerror = () => done(null);
            document.head.appendChild(s);
        });
        return hlsLoadPromise;
    }
    async function playHlsUrl(player, url) {
        const Hls = await ensureHlsLib();
        if (!Hls || !Hls.isSupported()) {
            // 無 hls.js → 交給播放器原生嘗試（Safari 等）
            destroyHls();
            player.src = url;
            await player.play();
            return;
        }
        destroyHls();
        const hls = new Hls();
        hlsInstance = hls;
        await new Promise((resolve, reject) => {
            let settled = false;
            const finish = (err) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                if (err) { destroyHls(); reject(err); } else resolve();
            };
            const timer = setTimeout(() => finish(new Error('串流載入逾時')), 20000);
            hls.on(Hls.Events.ERROR, (_evt, data) => {
                if (data && data.fatal) finish(new Error('串流錯誤：' + (data.details || data.type || 'unknown')));
            });
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                player.play().then(() => finish()).catch(finish);
            });
            hls.loadSource(url);
            hls.attachMedia(player);
        });
    }

    async function resolveMedia(file) {
        const url = file.url;
        if (!url) throw new Error('缺少 URL');
        const e = file.ext || extOf(url);
        const isHls = e === 'm3u8' || /\.m3u8(\?|#|$)/i.test(url);
        if (isHls && !nativeHlsSupported()) {
            return { url: url, mimeType: HLS_MIME, play: (player) => playHlsUrl(player, url) };
        }
        return { url: url, mimeType: file.mime || MIME_MAP[e] || undefined };
    }

    // ==================== 來源徽章 ====================
    function registerSourceMeta() {
        window.MP3SourceRegistry = window.MP3SourceRegistry || {};
        window.MP3SourceRegistry[SOURCE_ID] = {
            label: '連結',
            icon: 'fa-solid fa-link',
            badgeClass: 'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-500/30',
            dotClass: 'bg-fuchsia-400'
        };
    }

    // ==================== 名稱確認彈窗（含序號） ====================
    function closeNameModal(result) {
        if (modalKeyHandler) {
            document.removeEventListener('keydown', modalKeyHandler, true);
            modalKeyHandler = null;
        }
        if (modalOverlay) { modalOverlay.remove(); modalOverlay = null; }
        if (modalResolve) {
            const r = modalResolve;
            modalResolve = null;
            r(result == null ? null : result);
        }
    }

    /** 彈出候選清單：顯示序號、可逐筆改名、勾選；resolve 選中的 {url, name}[]，取消 resolve null */
    function openNameConfirmModal(candidates) {
        return new Promise((resolve) => {
            closeNameModal(null);
            modalResolve = resolve;
            const freshCount = candidates.filter(c => !c.isDup).length;
            let rowsHtml = '';
            candidates.forEach((c, i) => {
                const dupBadge = c.isDup
                    ? '<span class="ml-1 px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] shrink-0">已存在</span>'
                    : '';
                rowsHtml += `
                    <div class="flex items-start gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800 ${c.isDup ? 'opacity-50' : ''}" data-idx="${i}">
                        <span class="mt-1.5 min-w-[1.25rem] text-right text-[10px] font-mono text-slate-500 shrink-0 select-none">${i + 1}</span>
                        <input type="checkbox" data-role="pick" class="mt-2 w-3.5 h-3.5 accent-fuchsia-500 shrink-0" ${c.isDup ? 'disabled' : 'checked'}>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1 text-[10px] text-slate-500 mb-1 min-w-0">
                                <i class="${kindIcon(c.kind)} text-[9px] shrink-0"></i>
                                <span class="truncate" title="${esc(c.url)}">${esc(shortUrl(c.url))}</span>
                                ${dupBadge}
                            </div>
                            <input type="text" data-role="name" value="${esc(c.name)}" ${c.isDup ? 'disabled' : ''} placeholder="顯示名稱…"
                                class="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-fuchsia-500">
                        </div>
                    </div>`;
            });
            const overlay = document.createElement('div');
            modalOverlay = overlay;
            overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4';
            overlay.innerHTML = `
                <div role="dialog" aria-modal="true" aria-label="確認新增媒體"
                     class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[82vh]">
                    <div class="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-slate-800 shrink-0">
                        <div class="w-9 h-9 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-link text-sm"></i>
                        </div>
                        <div class="min-w-0">
                            <h3 class="text-sm font-bold text-slate-100">確認新增媒體</h3>
                            <p class="text-[11px] text-slate-400">可修改顯示名稱、取消勾選不想新增的項目</p>
                        </div>
                    </div>
                    <div data-role="rows" class="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2">${rowsHtml}</div>
                    <div class="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-800 shrink-0">
                        <span data-role="count" class="text-[11px] text-slate-400"></span>
                        <div class="flex items-center gap-2">
                            <button data-role="cancel" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition">取消</button>
                            <button data-role="ok" class="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-medium text-white transition shadow-lg shadow-fuchsia-600/30"></button>
                        </div>
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            const rowsEl = overlay.querySelector('[data-role="rows"]');
            const countEl = overlay.querySelector('[data-role="count"]');
            const okBtn = overlay.querySelector('[data-role="ok"]');
            const cancelBtn = overlay.querySelector('[data-role="cancel"]');

            function pickedEntries() {
                const out = [];
                rowsEl.querySelectorAll('[data-idx]').forEach(row => {
                    const c = candidates[parseInt(row.dataset.idx, 10)];
                    const pick = row.querySelector('[data-role="pick"]');
                    if (!c || c.isDup || !pick.checked) return;
                    const nameInput = row.querySelector('[data-role="name"]');
                    const name = (nameInput.value || '').trim();
                    out.push({ url: c.url, name: name || c.name });
                });
                return out;
            }
            function refreshCount() {
                const n = pickedEntries().length;
                countEl.textContent = '已選 ' + n + ' / ' + freshCount + ' 筆';
                okBtn.textContent = '確認新增 ' + n + ' 筆';
                okBtn.disabled = n === 0;
                okBtn.classList.toggle('opacity-40', n === 0);
                okBtn.classList.toggle('cursor-not-allowed', n === 0);
            }
            modalKeyHandler = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault(); e.stopPropagation();
                    closeNameModal(null);
                } else if (e.key === 'Enter' && e.target && e.target.matches && e.target.matches('input[data-role="name"]')) {
                    e.preventDefault(); e.stopPropagation();
                    if (!okBtn.disabled) closeNameModal(pickedEntries());
                }
            };
            document.addEventListener('keydown', modalKeyHandler, true);
            rowsEl.addEventListener('change', refreshCount);
            cancelBtn.addEventListener('click', () => closeNameModal(null));
            okBtn.addEventListener('click', () => { if (!okBtn.disabled) closeNameModal(pickedEntries()); });
            overlay.addEventListener('click', (e) => { if (e.target === overlay) closeNameModal(null); });
            refreshCount();
            const first = rowsEl.querySelector('input[data-role="name"]:not([disabled])');
            if (first) { first.focus(); first.select(); }
        });
    }

    // ==================== 新增 / 移除 ====================
    /** 實際入庫（不彈窗）：entries = [{url, name}] */
    async function addEntries(entries) {
        let added = 0, dup = 0;
        const seen = new Set(items.map(it => it.url));
        entries.forEach(entry => {
            if (!isValidUrl(entry.url) || seen.has(entry.url)) { dup++; return; }
            seen.add(entry.url);
            const e = extOf(entry.url);
            items.push({
                id: uid(),
                url: entry.url,
                name: (entry.name || '').trim() || deriveName(entry.url),
                ext: e,
                kind: kindOf(e),
                mime: MIME_MAP[e] || '',
                addedAt: Date.now()
            });
            added++;
        });
        if (added > 0) {
            saveStore();
            if (adapter) { try { await adapter.refresh(); } catch (e) { console.warn('[UrlMedia] refresh 失败:', e); } }
        }
        renderList();
        return { added: added, dup: dup };
    }

    /** 「加入媒體庫」與「從剪貼簿貼上」共用：先彈出確認清單再入庫 */
    async function previewAndAdd() {
        if (previewBusy) return;
        const input = document.getElementById('urlMediaInput');
        if (!input) return;
        if (!input.value.trim()) { showStatus('請先貼上媒體 URL', 'warn'); return; }
        const res = collectCandidates(input.value);
        const fresh = res.candidates.filter(c => !c.isDup);
        if (res.candidates.length === 0) {
            showStatus('沒有有效的 URL' + (res.invalid ? '（無效 ' + res.invalid + ' 筆）' : ''), 'warn');
            return;
        }
        if (fresh.length === 0) {
            showStatus('全部 ' + res.candidates.length + ' 筆 URL 已存在於媒體庫', 'warn');
            return;
        }
        previewBusy = true;
        try {
            const picked = await openNameConfirmModal(res.candidates);
            if (!picked) return; // 取消：保留輸入框內容
            const r = await addEntries(picked);
            // 未勾選的項目留在輸入框，方便稍後再新增
            const remaining = fresh.filter(c => !picked.some(p => p.url === c.url));
            input.value = remaining.map(c => c.url + ' | ' + c.name).join('\n');
            const skipped = res.candidates.length - r.added;
            const parts = ['新增 ' + r.added + ' 筆'];
            if (skipped > 0) parts.push('略過 ' + skipped + ' 筆');
            if (res.invalid > 0) parts.push('無效 ' + res.invalid + ' 筆');
            showStatus(parts.join('，'), r.added > 0 ? 'success' : 'warn');
        } finally { previewBusy = false; }
    }

    /** 程式化直接新增（不彈窗），供 console / 其他插件調用 */
    async function addFromText(text) {
        const res = collectCandidates(text);
        const fresh = res.candidates.filter(c => !c.isDup).map(c => ({ url: c.url, name: c.name }));
        const r = await addEntries(fresh);
        return { added: r.added, dup: res.candidates.length - fresh.length + r.dup, bad: res.invalid };
    }

    async function removeItem(item) {
        const key = keyOf(item);
        const handler = window.MP3DataSourceHandlers && window.MP3DataSourceHandlers[SOURCE_ID];
        const file = ext.allFiles.find(f => ext.getFileKey(f) === key);
        if (handler && file) {
            try { await handler.delete(file); return; }
            catch (e) { console.warn('[UrlMedia] handler.delete 失败，改用後備清理:', e); }
        }
        if (ext.currentPlayingFile === key) destroyHls();
        items = items.filter(it => it.id !== item.id);
        saveStore();
        ext.cleanupFileMetadata(key);
        ext.allFiles = ext.allFiles.filter(f => ext.getFileKey(f) !== key);
        ext.stopIfPlayingFrom(SOURCE_ID);
        ext.renderAll();
        renderList();
    }

    async function handleClearAll() {
        if (items.length === 0) { showStatus('清單已是空的', 'info'); return; }
        const ok = await ext.showCustomModal({
            title: '清空 URL 媒體',
            message: '確定要移除全部 ' + items.length + ' 筆 URL 媒體嗎？\n（只移除清單記錄，不會刪除遠端檔案）',
            type: 'danger', confirmText: '全部移除'
        });
        if (!ok) return;
        items.forEach(it => ext.cleanupFileMetadata(keyOf(it)));
        items = [];
        saveStore();
        destroyHls();
        ext.stopIfPlayingFrom(SOURCE_ID);
        if (adapter) { try { await adapter.refresh(); } catch (e) {} }
        renderList();
        showStatus('已清空全部 URL 媒體', 'success');
    }

    async function handlePaste() {
        const input = document.getElementById('urlMediaInput');
        if (!input) return;
        let text = '';
        try { text = await navigator.clipboard.readText(); }
        catch (e) {
            input.focus();
            showStatus('無法讀取剪貼簿，請直接 Ctrl+V 貼上', 'warn');
            return;
        }
        if (!text || !text.trim()) { showStatus('剪貼簿是空的', 'warn'); return; }
        input.value = (input.value ? input.value.replace(/\s+$/, '') + '\n' : '') + text.trim();
        await previewAndAdd(); // 貼上後直接彈出確認清單
    }

    // ==================== 插件 UI ====================
    function showStatus(msg, tone) {
        const el = document.getElementById('urlMediaStatus');
        if (!el) return;
        el.textContent = msg;
        el.className = 'text-[10px] leading-relaxed ' + (
            tone === 'success' ? 'text-emerald-400' :
            tone === 'warn' ? 'text-amber-400' :
            tone === 'error' ? 'text-rose-400' : 'text-slate-400');
        if (statusTimer) clearTimeout(statusTimer);
        statusTimer = setTimeout(() => { el.classList.add('hidden'); }, 4000);
    }

    function renderUI() {
        if (!initialized) return;
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer(PLUGIN_ID);
        if (!body) { if (uiRetry++ < 25) setTimeout(renderUI, 200); return; }
        if (body.dataset.urlMediaReady === '1') { renderList(); return; }
        body.dataset.urlMediaReady = '1';
        body.innerHTML = `
            <div class="space-y-2 pt-1">
                <textarea id="urlMediaInput" rows="2" spellcheck="false"
                    placeholder="貼上媒體 URL（支援換行、逗號、空白分隔，可批次）…"
                    class="w-full bg-slate-800 border border-slate-700 text-[11px] rounded-xl px-2.5 py-2 focus:outline-none focus:border-fuchsia-500 text-slate-200 placeholder:text-slate-600 resize-y"></textarea>
                <div class="text-[9px] text-slate-600 leading-relaxed">支援 mp3 / mp4 / webm / m3u8 等直連；「URL | 名稱」可自訂名稱；加入前會彈出清單供確認與改名</div>
                <div class="flex items-center gap-1.5">
                    <button id="urlMediaAddBtn" class="flex-1 bg-fuchsia-600/80 hover:bg-fuchsia-600 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-plus text-[10px]"></i> 加入媒體庫
                    </button>
                    <button id="urlMediaPasteBtn" title="從剪貼簿貼上並確認" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-xl text-[11px] transition">
                        <i class="fa-solid fa-paste"></i>
                    </button>
                    <button id="urlMediaClearBtn" title="清空全部" class="bg-slate-800 hover:bg-rose-600/80 border border-slate-700 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl text-[11px] transition">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <div id="urlMediaStatus" class="hidden"></div>
                <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800">
                    <span>已收藏 <span id="urlMediaCount" class="text-fuchsia-400 font-mono">0</span> 筆</span>
                    <span class="text-slate-600">點擊 ▶ 直接播放</span>
                </div>
                <div id="urlMediaList" class="space-y-1 max-h-60 overflow-y-auto pr-0.5"></div>
            </div>
        `;
        body.querySelector('#urlMediaAddBtn').addEventListener('click', previewAndAdd);
        body.querySelector('#urlMediaPasteBtn').addEventListener('click', handlePaste);
        body.querySelector('#urlMediaClearBtn').addEventListener('click', handleClearAll);
        body.querySelector('#urlMediaList').addEventListener('click', onListClick);
        body.querySelector('#urlMediaInput').addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); previewAndAdd(); }
        });
        renderList();
    }

    function renderList() {
        const countEl = document.getElementById('urlMediaCount');
        if (countEl) countEl.textContent = String(items.length);
        const listEl = document.getElementById('urlMediaList');
        if (!listEl || !ext) return;
        if (items.length === 0) {
            listEl.innerHTML = '<div class="text-[10px] text-slate-600 px-1 py-2 text-center">尚未新增任何 URL 媒體</div>';
            return;
        }
        const curKey = ext.currentPlayingFile;
        const playing = !!(ext.audioPlayer && !ext.audioPlayer.paused);
        const loadingKey = ext.getPlaybackLoading ? ext.getPlaybackLoading() : null;
        let html = '';
        items.slice().reverse().forEach(it => {
            const k = keyOf(it);
            const isCur = curKey === k;
            const isLoading = isCur && loadingKey === k;
            const icon = isLoading ? 'fa-solid fa-spinner fa-spin' : (isCur && playing ? 'fa-solid fa-pause' : 'fa-solid fa-play');
            const rowCls = isCur ? 'bg-indigo-950/40 border-indigo-500/40' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70';
            const playCls = isCur ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white';
            html += `
                <div class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 border transition ${rowCls}" data-item-id="${it.id}">
                    <button data-act="play" title="${isCur && playing ? '暫停' : '播放'}" class="w-6 h-6 rounded-md ${playCls} flex items-center justify-center shrink-0 transition">
                        <i class="${icon} text-[9px]"></i>
                    </button>
                    <i class="${kindIcon(it.kind)} text-[10px] shrink-0"></i>
                    <div class="min-w-0 flex-1">
                        <div class="text-[11px] text-slate-200 truncate" title="${esc(it.name)}">${esc(it.name)}</div>
                        <div class="text-[9px] text-slate-500 truncate" title="${esc(it.url)}">${esc(hostOf(it.url))}${it.ext ? ' · ' + esc(it.ext) : ''}</div>
                    </div>
                    <button data-act="rename" title="重新命名" class="p-1 text-slate-500 hover:text-indigo-400 shrink-0"><i class="fa-solid fa-pen text-[9px]"></i></button>
                    <button data-act="copy" title="複製 URL" class="p-1 text-slate-500 hover:text-slate-300 shrink-0"><i class="fa-regular fa-copy text-[9px]"></i></button>
                    <button data-act="remove" title="從媒體庫移除" class="p-1 text-slate-500 hover:text-rose-400 shrink-0"><i class="fa-solid fa-xmark text-[10px]"></i></button>
                </div>`;
        });
        listEl.innerHTML = html;
    }

    async function onListClick(e) {
        const btn = e.target.closest('button[data-act]');
        if (!btn) return;
        const row = btn.closest('[data-item-id]');
        if (!row) return;
        const item = items.find(it => it.id === row.dataset.itemId);
        if (!item) return;
        const act = btn.dataset.act;
        if (act === 'play') {
            ext.togglePlaySong(encodeInlineArg(keyOf(item)), encodeInlineArg(item.name));
        } else if (act === 'rename') {
            const val = await ext.showCustomModal({
                title: '重新命名', subtitle: hostOf(item.url),
                message: '請輸入新的顯示名稱：',
                type: 'confirm', isPrompt: true, defaultValue: item.name, confirmText: '儲存'
            });
            if (val === null) return;
            const name = String(val).trim();
            if (!name || name === item.name) return;
            item.name = name;
            saveStore();
            if (adapter) { try { await adapter.refresh(); } catch (err) {} }
            renderList();
            if (ext.currentPlayingFile === keyOf(item)) {
                const t = document.getElementById('currentSongTitle');
                if (t) t.innerText = name;
                try { ext.syncMediaSession(); } catch (err) {}
            }
        } else if (act === 'copy') {
            try { await navigator.clipboard.writeText(item.url); showStatus('已複製 URL', 'success'); }
            catch (err) { showStatus('複製失敗，請手動複製', 'warn'); }
        } else if (act === 'remove') {
            await removeItem(item);
        }
    }

    // ==================== 生命週期 ====================
    function bindEvents() {
        const refresh = () => renderList();
        ['songchange', 'play', 'pause', 'ended'].forEach(ev => {
            ext.on(ev, refresh);
            boundEvents.push([ev, refresh]);
        });
    }
    function unbindEvents() {
        boundEvents.forEach(pair => { try { ext.off(pair[0], pair[1]); } catch (e) {} });
        boundEvents.length = 0;
    }

    async function init() {
        if (initialized) return;
        ext = window.MP3AppExtension;
        if (!ext) throw new Error('MP3AppExtension 未就緒');
        if (typeof window.MP3RegisterSourceAdapter !== 'function') throw new Error('DataSource Adapter 未就緒');
        initialized = true;
        uiRetry = 0;
        items = loadStore();
        registerSourceMeta();

        // 移除 URL 記錄是非破壞性操作（不刪遠端檔案），
        // 跳過主程序針對外部來源的「永久刪除」確認框，避免誤導。
        try {
            const skipMap = JSON.parse(localStorage.getItem('mp3_skip_delete_prompt') || '{}');
            if (!skipMap[SOURCE_ID]) {
                skipMap[SOURCE_ID] = true;
                localStorage.setItem('mp3_skip_delete_prompt', JSON.stringify(skipMap));
            }
        } catch (e) {}

        renderUI();
        bindEvents();

        adapter = window.MP3RegisterSourceAdapter({
            id: SOURCE_ID,
            categoryName: CATEGORY_NAME,
            list: async () => ({ files: items.map(toFile), total: items.length }),
            resolveMedia: resolveMedia,
            delete: async (file) => {
                const key = ext.getFileKey(file);
                if (ext.currentPlayingFile === key) destroyHls();
                const url = file.url || String(key).slice(KEY_PREFIX.length);
                items = items.filter(it => it.url !== url);
                saveStore();
                renderList();
            },
            reset: () => { destroyHls(); },
            onUnload: () => { destroyHls(); }
        });
        await adapter.refresh();
        renderList();
        console.log('[UrlMediaPlugin] ready v1.2，已恢復 ' + items.length + ' 筆 URL 媒體');
    }

    async function unload() {
        if (!initialized) return;
        initialized = false;
        closeNameModal(null);
        unbindEvents();
        destroyHls();
        if (statusTimer) { clearTimeout(statusTimer); statusTimer = null; }
        if (adapter) { try { await adapter.unload(); } catch (e) {} adapter = null; }
        try { delete window.MP3SourceRegistry[SOURCE_ID]; } catch (e) {}
        const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer(PLUGIN_ID);
        if (body) { body.innerHTML = ''; delete body.dataset.urlMediaReady; }
        if (typeof window.refreshSourceFilterOptions === 'function') window.refreshSourceFilterOptions();
        // localStorage 清單保留，重新啟用插件時自動恢復
    }

    window.MP3UrlMediaPlugin = {
        version: '1.2',
        init: init,
        unload: unload,
        addUrls: addFromText,
        getItems: () => items.slice()
    };
})();