/**
 * plugins/recording-plugin.js
 * 录音插件：麦克风录音 → 可选存储 provider → 通过 source-adapter 注册到播放列表
 * 依赖：window.MP3Storage / window.MP3StorageRegistry（storage-registry.js）
 *       window.MP3RegisterSourceAdapter（source-adapter.js）
 * 全局：window.MP3RecordingPlugin
 *
 * 设计：
 *  - provider 选择：listWritableProviders() 实时读 MP3StorageRegistry，不缓存
 *  - 目录保证：ensurePrefix() → mkdir → list → .keep 哨兵
 *  - 数据源：注册 id='recording'，list() 遍历所有可写 provider 的 recordings/
 *             relativePath 用 "pid::key" 保证跨 provider 唯一
 *  - 播放：resolveMedia() 从对应 provider 读回 Blob → blob URL
 *  - 删除：delete() 删存储 → 适配器自动从 allFiles 移除
 *  - 停用：adapter.unload() 自动 stopIfPlayingFrom + removeSourceData
 *  - 时序：MutationObserver 监听面板展开，每次展开重建下拉框
 */
(function () {
    'use strict';

    const LOG = '[Recording]';
    const SOURCE = 'recording';
    const CATEGORY = '錄音';
    const PREFIX = 'recordings/';
    const SENTINEL = PREFIX + '.keep';
    const PROVIDER_KEY = 'mp3_recording_provider';
    const KEY_SEP = '::';

    let bodyEl = null;
    let mediaRecorder = null;
    let chunks = [];
    let stream = null;
    let timer = null;
    let startedAt = 0;
    let recordings = [];        // 当前 provider 的列表（仅用于 UI）
    let objectUrls = [];
    let panelObserver = null;
    let sourceAdapter = null;

    // ---------- 工具 ----------
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function fmtSize(n) {
        if (!n && n !== 0) return '-';
        if (n < 1024) return n + ' B';
        if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
        return (n / 1048576).toFixed(2) + ' MB';
    }
    function fmtTime(ms) {
        const s = Math.floor(ms / 1000);
        return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }
    function extFromMime(mime) {
        if (!mime) return 'webm';
        if (mime.indexOf('ogg') !== -1) return 'ogg';
        if (mime.indexOf('mp4') !== -1) return 'm4a';
        if (mime.indexOf('mpeg') !== -1) return 'mp3';
        if (mime.indexOf('wav') !== -1) return 'wav';
        return 'webm';
    }
    function pickMime() {
        const cands = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
        for (const m of cands) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
        }
        return '';
    }

    // ---------- provider 选择 ----------
    function listWritableProviders() {
        try {
            return window.MP3StorageRegistry.list()
                .filter(p => p.capabilities && p.capabilities.write);
        } catch (e) { return []; }
    }
    function hasProvider(id) {
        try { return window.MP3StorageRegistry.has(id); } catch (e) { return false; }
    }
    function getSelectedProvider() {
        let saved = '';
        try { saved = localStorage.getItem(PROVIDER_KEY) || ''; } catch (e) {}
        if (saved && hasProvider(saved)) {
            const rec = window.MP3StorageRegistry.getRecord(saved);
            if (rec && rec.capabilities && rec.capabilities.write) return saved;
        }
        let def = '';
        try { def = window.MP3StorageRegistry.getDefaultId() || ''; } catch (e) {}
        if (def && hasProvider(def)) {
            const rec = window.MP3StorageRegistry.getRecord(def);
            if (rec && rec.capabilities && rec.capabilities.write) return def;
        }
        const first = listWritableProviders()[0];
        return first ? first.id : '';
    }
    function setSelectedProvider(id) {
        try { localStorage.setItem(PROVIDER_KEY, id || ''); } catch (e) {}
    }

    // ---------- 目录保证 ----------
    async function ensurePrefix(providerId, prefix) {
        if (!window.MP3Storage || !providerId) return false;
        const rec = window.MP3StorageRegistry.getRecord(providerId);
        if (!rec) return false;

        if (rec.capabilities.mkdir) {
            try {
                await window.MP3Storage.mkdir(providerId, prefix);
                return true;
            } catch (e) {
                console.warn(LOG, 'mkdir failed, fallback', e);
            }
        }
        if (rec.capabilities.list) {
            try {
                await window.MP3Storage.list(providerId, prefix);
                return true;
            } catch (e) { /* 落到哨兵 */ }
        }
        if (rec.capabilities.write) {
            try {
                await window.MP3Storage.write(
                    providerId, SENTINEL,
                    new Blob([''], { type: 'text/plain' }),
                    { meta: { name: '.keep', source: SOURCE, sentinel: true } }
                );
                return true;
            } catch (e) {
                console.warn(LOG, 'ensurePrefix sentinel failed', e);
                return false;
            }
        }
        return false;
    }

    // ---------- UI ----------
    function render() {
        if (!bodyEl) return;
        const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
        const rec = !!mediaRecorder && mediaRecorder.state === 'recording';
        const paused = !!mediaRecorder && mediaRecorder.state === 'paused';
        const selected = getSelectedProvider();
        const providers = listWritableProviders();

        const optionsHtml = providers.length
            ? providers.map(p => `<option value="${esc(p.id)}" ${p.id === selected ? 'selected' : ''}>${esc(p.name)}</option>`).join('')
            : `<option value="">（無可寫入存儲）</option>`;

        bodyEl.innerHTML = `
        <div class="space-y-2">
            <div class="flex items-center gap-1.5">
                <label class="text-[10px] text-slate-500 shrink-0">存儲</label>
                <select class="rec-provider flex-1 bg-slate-800/70 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500" ${rec || paused ? 'disabled' : ''}>
                    ${optionsHtml}
                </select>
                <span class="rec-timer text-[11px] font-mono text-indigo-300 shrink-0">00:00</span>
            </div>
            ${supported ? '' : `<div class="text-[10px] text-rose-400 leading-relaxed">当前浏览器不支持录音（需要 MediaRecorder + getUserMedia，且须 https 或 localhost）。</div>`}
            ${providers.length ? '' : `<div class="text-[10px] text-rose-400 leading-relaxed">沒有可寫入的存儲 provider，請先啟用 storage 插件。</div>`}
            <div class="flex items-center gap-1.5">
                <button type="button" class="rec-start flex-1 px-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] transition" ${supported && !rec && providers.length ? '' : 'disabled'}>
                    <i class="fa-solid fa-circle text-[9px] mr-1"></i>開始錄音
                </button>
                <button type="button" class="rec-pause px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-[11px] transition" ${rec ? '' : 'disabled'}>
                    <i class="fa-solid ${paused ? 'fa-play' : 'fa-pause'} text-[9px] mr-1"></i>${paused ? '繼續' : '暫停'}
                </button>
                <button type="button" class="rec-stop px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[11px] transition" ${rec || paused ? '' : 'disabled'}>
                    <i class="fa-solid fa-stop text-[9px] mr-1"></i>停止
                </button>
            </div>
            <div class="rec-status text-[10px] text-slate-500 min-h-[14px]"></div>
            <div class="border-t border-slate-800/60 pt-2">
                <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] text-slate-400">已存錄音（當前存儲）</span>
                    <button type="button" class="rec-refresh text-[10px] text-indigo-400 hover:text-indigo-300 underline">重新整理</button>
                </div>
                <div class="rec-list space-y-1 max-h-40 overflow-y-auto pc-scroll"></div>
            </div>
        </div>`;

        const sel = bodyEl.querySelector('.rec-provider');
        sel.addEventListener('change', async () => {
            setSelectedProvider(sel.value);
            const name = (providers.find(p => p.id === sel.value) || {}).name || sel.value;
            setStatus('已切換存儲：' + name);
            recordings = [];
            renderList();
            await ensurePrefix(sel.value, PREFIX);
            await refreshList(true);
        });

        bodyEl.querySelector('.rec-start').addEventListener('click', startRecording);
        bodyEl.querySelector('.rec-pause').addEventListener('click', togglePause);
        bodyEl.querySelector('.rec-stop').addEventListener('click', stopRecording);
        bodyEl.querySelector('.rec-refresh').addEventListener('click', () => refreshList(true));
        renderList();
    }

    function setStatus(msg, isErr) {
        if (!bodyEl) return;
        const el = bodyEl.querySelector('.rec-status');
        if (!el) return;
        el.textContent = msg || '';
        el.classList.toggle('text-rose-400', !!isErr);
        el.classList.toggle('text-slate-500', !isErr);
    }

    function renderList() {
        if (!bodyEl) return;
        const listEl = bodyEl.querySelector('.rec-list');
        if (!listEl) return;
        if (!recordings.length) {
            listEl.innerHTML = `<div class="text-[10px] text-slate-600 italic py-2">尚無錄音</div>`;
            return;
        }
        listEl.innerHTML = recordings.map(r => {
            const name = (r.meta && r.meta.name) || r.key.split('/').pop();
            return `
            <div class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50" data-key="${esc(r.key)}">
                <i class="fa-solid fa-file-audio text-rose-400 text-[11px] shrink-0"></i>
                <div class="min-w-0 flex-1">
                    <div class="text-[11px] text-slate-200 truncate">${esc(name)}</div>
                    <div class="text-[9px] text-slate-500">${fmtSize(r.size)} · ${new Date(r.lastModified).toLocaleString()}</div>
                </div>
                <button type="button" class="rec-play p-1 text-indigo-400 hover:text-indigo-300" title="試聽"><i class="fa-solid fa-play text-[10px]"></i></button>
                <button type="button" class="rec-add p-1 text-emerald-400 hover:text-emerald-300" title="加入播放列表"><i class="fa-solid fa-plus text-[10px]"></i></button>
                <button type="button" class="rec-del p-1 text-rose-400 hover:text-rose-300" title="刪除"><i class="fa-solid fa-trash text-[10px]"></i></button>
            </div>`;
        }).join('');

        listEl.querySelectorAll('[data-key]').forEach(row => {
            const key = row.dataset.key;
            row.querySelector('.rec-play').addEventListener('click', () => previewItem(key));
            row.querySelector('.rec-add').addEventListener('click', () => addToPlaylist(key));
            row.querySelector('.rec-del').addEventListener('click', () => removeItem(key));
        });
    }

    // ---------- 录音 ----------
    async function startRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') return;
        const providerId = getSelectedProvider();
        if (!providerId) { setStatus('沒有可寫入的存儲', true); return; }
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || !window.MediaRecorder) {
            setStatus('瀏覽器不支援錄音', true);
            return;
        }
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mime = pickMime();
            mediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
            chunks = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
            mediaRecorder.onstop = onRecorderStop;
            mediaRecorder.onerror = (e) => setStatus('錄音錯誤：' + (e.error && e.error.name || '未知'), true);
            mediaRecorder.start(1000);
            startedAt = Date.now();
            timer = setInterval(() => {
                const t = bodyEl && bodyEl.querySelector('.rec-timer');
                if (t) t.textContent = fmtTime(Date.now() - startedAt);
            }, 250);
            setStatus('錄音中…（存儲：' + providerId + '）');
            render();
        } catch (e) {
            setStatus('無法取得麥克風：' + (e && e.message || e), true);
            cleanupStream();
        }
    }

    function togglePause() {
        if (!mediaRecorder) return;
        try {
            if (mediaRecorder.state === 'recording') {
                mediaRecorder.pause();
                setStatus('已暫停');
            } else if (mediaRecorder.state === 'paused') {
                mediaRecorder.resume();
                setStatus('錄音中…');
            }
            render();
        } catch (e) { setStatus('暫停失敗：' + e.message, true); }
    }

    function stopRecording() {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
        try { mediaRecorder.stop(); } catch (e) { setStatus('停止失敗：' + e.message, true); }
        if (timer) { clearInterval(timer); timer = null; }
        cleanupStream();
    }

    function cleanupStream() {
        if (stream) {
            stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
            stream = null;
        }
    }

    async function onRecorderStop() {
        const mime = (mediaRecorder && mediaRecorder.mimeType) || 'audio/webm';
        const blob = new Blob(chunks, { type: mime });
        chunks = [];
        mediaRecorder = null;
        if (!blob.size) { setStatus('沒有錄到音頻資料', true); render(); return; }

        const providerId = getSelectedProvider();
        if (!providerId) { setStatus('沒有可寫入的存儲', true); render(); return; }

        const ts = new Date();
        const stamp = ts.getFullYear() + String(ts.getMonth() + 1).padStart(2, '0') + String(ts.getDate()).padStart(2, '0')
            + '-' + String(ts.getHours()).padStart(2, '0') + String(ts.getMinutes()).padStart(2, '0') + String(ts.getSeconds()).padStart(2, '0');
        const name = '錄音-' + stamp + '.' + extFromMime(mime);
        const key = PREFIX + name;

        setStatus('正在儲存到 ' + providerId + ' …');
        try {
            if (!window.MP3Storage) throw new Error('MP3Storage 未載入');
            await ensurePrefix(providerId, PREFIX);
            await window.MP3Storage.write(providerId, key, blob, {
                meta: { name, source: SOURCE, mime, durationMs: Date.now() - startedAt }
            });
            setStatus('已儲存：' + name);
            await refreshList(true);
            if (sourceAdapter) await sourceAdapter.refresh();
        } catch (e) {
            console.error(LOG, e);
            setStatus('儲存失敗：' + (e && e.message || e), true);
        }
        startedAt = 0;
        if (bodyEl) {
            const t = bodyEl.querySelector('.rec-timer');
            if (t) t.textContent = '00:00';
        }
        render();
    }

    // ---------- 列表 / 试听 ----------
    async function refreshList(force) {
        const providerId = getSelectedProvider();
        if (!providerId) { recordings = []; renderList(); return; }
        try {
            if (!window.MP3Storage) return;
            const list = await window.MP3Storage.list(providerId, PREFIX);
            recordings = list
                .filter(r => r.key !== SENTINEL)
                .sort((a, b) => b.lastModified - a.lastModified);
            renderList();
        } catch (e) {
            console.warn(LOG, 'list failed', e);
            recordings = [];
            renderList();
            if (force) setStatus('讀取列表失敗：' + e.message, true);
        }
    }

    async function previewItem(key) {
        const providerId = getSelectedProvider();
        try {
            const blob = await window.MP3Storage.read(providerId, key);
            const url = URL.createObjectURL(blob);
            objectUrls.push(url);
            const audio = new Audio(url);
            audio.addEventListener('ended', () => {
                try { URL.revokeObjectURL(url); } catch (e) {}
                objectUrls = objectUrls.filter(u => u !== url);
            });
            await audio.play();
            setStatus('試聽中：' + key.split('/').pop());
        } catch (e) {
            setStatus('試聽失敗：' + e.message, true);
        }
    }

    async function addToPlaylist(key) {
        try {
            if (sourceAdapter) {
                await sourceAdapter.refresh();
                setStatus('已加入播放列表');
            } else {
                setStatus('數據源未註冊，無法加入播放列表', true);
            }
        } catch (e) {
            setStatus('加入播放列表失敗：' + e.message, true);
        }
    }

    async function removeItem(key) {
        const providerId = getSelectedProvider();
        try {
            await window.MP3Storage.delete(providerId, key);
            recordings = recordings.filter(r => r.key !== key);
            renderList();
            if (sourceAdapter) await sourceAdapter.refresh();
            setStatus('已刪除');
        } catch (e) {
            setStatus('刪除失敗：' + e.message, true);
        }
    }

    // ---------- 面板展开监听 ----------
    function observePanelOpen() {
        const row = document.querySelector('#pluginManagerCard .pc-item[data-plugin-id="recording"]');
        if (!row) { setTimeout(observePanelOpen, 300); return; }
        panelObserver = new MutationObserver(() => {
            if (!row.classList.contains('is-open') || !bodyEl) return;
            render();
            const pid = getSelectedProvider();
            if (pid) refreshList(false);
        });
        panelObserver.observe(row, { attributes: true, attributeFilter: ['class'] });
    }

    // ---------- 数据源适配器注册 ----------
    function registerSourceAdapter() {
        if (typeof window.MP3RegisterSourceAdapter !== 'function') {
            console.warn(LOG, 'MP3RegisterSourceAdapter 不存在，无法注册到播放列表');
            return null;
        }
        return window.MP3RegisterSourceAdapter({
            id: SOURCE,
            categoryName: CATEGORY,

            async list() {
                const providerIds = listWritableProviders().map(p => p.id);
                const files = [];
                for (const pid of providerIds) {
                    try {
                        const rec = window.MP3StorageRegistry.getRecord(pid);
                        if (!rec || !rec.capabilities || !rec.capabilities.list) continue;
                        const items = await window.MP3Storage.list(pid, PREFIX);
                        for (const r of items) {
                            if (r.key === SENTINEL) continue;
                            const name = (r.meta && r.meta.name) || r.key.split('/').pop();
                            files.push({
                                filename: name,
                                // 跨 provider 唯一：pid::recordings/xxx.webm
                                relativePath: pid + KEY_SEP + r.key,
                                displayName: name,
                                size: r.size,
                                lastModified: r.lastModified,
                                _providerId: pid,
                                _storageKey: r.key
                            });
                        }
                    } catch (e) {
                        console.warn(LOG, 'list provider', pid, 'failed:', e);
                    }
                }
                files.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
                return { files };
            },

            async resolveMedia(file) {
                const rel = file.relativePath || '';
                const idx = rel.indexOf(KEY_SEP);
                const pid = file._providerId || (idx >= 0 ? rel.slice(0, idx) : getSelectedProvider());
                const key = file._storageKey || (idx >= 0 ? rel.slice(idx + KEY_SEP.length) : rel);
                const blob = await window.MP3Storage.read(pid, key);
                const url = URL.createObjectURL(blob);
                objectUrls.push(url);
                return { url, type: blob.type || 'audio/webm' };
            },

            async delete(file) {
                const rel = file.relativePath || '';
                const idx = rel.indexOf(KEY_SEP);
                const pid = file._providerId || (idx >= 0 ? rel.slice(0, idx) : getSelectedProvider());
                const key = file._storageKey || (idx >= 0 ? rel.slice(idx + KEY_SEP.length) : rel);
                await window.MP3Storage.delete(pid, key);
                recordings = recordings.filter(r => r.key !== key);
                renderList();
            },

            onStatusChange(msg, tone) {
                setStatus(msg, tone === 'error');
            },

            onPlaying(file) {
                // 可选：高亮当前录音；此处仅更新状态栏
                const name = file.displayName || file.filename || '';
                if (name) setStatus('播放：' + name);
            },

            onUnload() {
                // 适配器会自动 stopIfPlayingFrom + removeSourceData
            }
        });
    }

    // ---------- 生命周期 ----------
    const plugin = {
        id: SOURCE,
        name: '录音',

        async init() {
            for (let i = 0; i < 30 && !window.MP3StorageRegistry; i++) {
                await new Promise(r => setTimeout(r, 100));
            }
            if (!window.MP3StorageRegistry) {
                console.error(LOG, 'MP3StorageRegistry 未就绪，插件无法工作');
                return;
            }

            let tries = 0;
            while (!bodyEl && tries++ < 20) {
                bodyEl = window.MP3PluginManager.getBodyContainer(SOURCE);
                if (!bodyEl) await new Promise(r => setTimeout(r, 150));
            }
            if (!bodyEl) { console.warn(LOG, 'no body container'); return; }

            render();
            const pid = getSelectedProvider();
            if (pid) {
                const ok = await ensurePrefix(pid, PREFIX);
                if (!ok) setStatus('存儲前綴 ' + PREFIX + ' 不可用，請檢查 provider', true);
            }
            await refreshList(false);

            // ★ 注册数据源适配器
            sourceAdapter = registerSourceAdapter();
            if (sourceAdapter) {
                try { await sourceAdapter.refresh(); }
                catch (e) { console.warn(LOG, 'initial refresh failed', e); }
            }

            observePanelOpen();

            plugin._offReg = window.MP3StorageRegistry.on('provider:registered', () => {
                if (!bodyEl) return;
                render();
                if (sourceAdapter) sourceAdapter.refresh().catch(() => {});
            });
            plugin._offUnreg = window.MP3StorageRegistry.on('provider:unregistered', () => {
                if (!bodyEl) return;
                render();
                const npid = getSelectedProvider();
                if (npid) refreshList(false);
                else { recordings = []; renderList(); }
                if (sourceAdapter) sourceAdapter.refresh().catch(() => {});
            });
            plugin._offDefault = window.MP3StorageRegistry.on('default:changed', async () => {
                if (!localStorage.getItem(PROVIDER_KEY) && bodyEl) {
                    const npid = getSelectedProvider();
                    if (npid) await ensurePrefix(npid, PREFIX);
                    render();
                    recordings = [];
                    renderList();
                    refreshList(false);
                    if (sourceAdapter) sourceAdapter.refresh().catch(() => {});
                }
            });

            setTimeout(() => {
                if (!bodyEl) return;
                render();
                const npid = getSelectedProvider();
                if (npid) refreshList(false);
            }, 1000);

            console.log(LOG, 'init ok');
        },

        async unload() {
            if (sourceAdapter) {
                try { await sourceAdapter.unload(); } catch (e) {}
                sourceAdapter = null;
            }
            if (panelObserver) { panelObserver.disconnect(); panelObserver = null; }
            ['_offReg', '_offUnreg', '_offDefault'].forEach(k => {
                if (typeof plugin[k] === 'function') { try { plugin[k](); } catch (e) {} }
                plugin[k] = null;
            });

            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                try { mediaRecorder.stop(); } catch (e) {}
            }
            if (timer) { clearInterval(timer); timer = null; }
            cleanupStream();
            objectUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
            objectUrls = [];
            if (bodyEl) bodyEl.innerHTML = '';
            bodyEl = null;
            recordings = [];
            console.log(LOG, 'unloaded');
        }
    };

    window.MP3RecordingPlugin = plugin;
})();