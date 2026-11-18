/**
 * plugins/webdav-storage-plugin.js  (v2.1.0)
 *
 * 设计要点：
 *  - webdav 客户端库由本插件内部按需动态 import，未被 enable 时完全零加载
 *  - 独立 CDN 回退 + 全局覆盖点（window.MP3_WEBDAV_CDN）
 *  - init() 成功后注册到 MP3StorageRegistry；unload() 时注销
 *  - 顶层 try/catch + 占位导出：崩溃也能让 plugin-center 给出可读错误
 *
 * v2.1.0 变更：
 *  - put(): Blob / TypedArray / string 统一转 ArrayBuffer（流式除外），显式传 contentLength，
 *           修复 "Layerr: Cannot calculate data length: Invalid type"
 *  - capabilities 新增 mkdir；实现 mkdir()（逐段 MKCOL，405/409 视为已存在）
 *
 * 分区：
 *  §0 占位导出           §1 常量与工具
 *  §2 webdav 库加载器     §3 配置与 client 工厂
 *  §4 Provider 协议       §5 生命周期
 *  §6 插件对象导出         §7 设置 UI
 *  §8 兜底升级
 */
(function () {
    'use strict';

    // ============================================================
    // §0 占位导出：保证 window.MP3WebDAVStoragePlugin 一定存在
    // ============================================================
    const PLACEHOLDER = {
        __version: '2.1.0',
        __loading: true,
        __loadedAt: Date.now(),
        __error: null
    };
    window.MP3WebDAVStoragePlugin = PLACEHOLDER;

    try {
        // ============================================================
        // §1 常量与工具
        // ============================================================
        const STORAGE_ID = 'webdav';
        const CONFIG_KEY = 'mp3_webdav_config';
        const LIB_LOAD_TIMEOUT_MS = 15000;

        const WEBDAV_CDN_CANDIDATES = (() => {
            const list = [];
            if (typeof window !== 'undefined' && window.MP3_WEBDAV_CDN) {
                list.push(String(window.MP3_WEBDAV_CDN));
            }
            list.push(
                'https://cdn.jsdelivr.net/npm/webdav@5.9.0/dist/web/index.js',
                'https://esm.sh/webdav@5.9.0/web',
                'https://cdn.skypack.dev/webdav@5.9.0/web'
            );
            return list;
        })();

        function normalizeKey(key) {
            return String(key || '').replace(/^\/+/, '');
        }
        function escapeAttr(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                .replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        function withTimeout(promise, ms, msg) {
            let timer;
            return Promise.race([
                Promise.resolve(promise),
                new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(msg)), ms); })
            ]).finally(() => clearTimeout(timer));
        }

        /**
         * 把任意输入转成 webdav 库能计算长度的形式。
         * 返回 { body, contentLength }；流式时 contentLength 为 undefined。
         */
        async function toWebdavBody(data) {
            if (typeof Blob !== 'undefined' && data instanceof Blob) {
                const buf = await data.arrayBuffer();
                return { body: buf, contentLength: buf.byteLength };
            }
            if (data instanceof ArrayBuffer) {
                return { body: data, contentLength: data.byteLength };
            }
            if (ArrayBuffer.isView(data)) {
                // 取独立 ArrayBuffer，避免 byteOffset 非 0 时长度算错
                const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
                return { body: buf, contentLength: buf.byteLength };
            }
            if (typeof data === 'string') {
                const enc = new TextEncoder().encode(data);
                return { body: enc.buffer, contentLength: enc.byteLength };
            }
            if (typeof ReadableStream !== 'undefined' && data instanceof ReadableStream) {
                return { body: data, contentLength: undefined };
            }
            throw new Error('WebDAV put: 不支持的 data 类型：' +
                (data && data.constructor && data.constructor.name));
        }

        // ============================================================
        // §2 webdav 库加载器（懒加载 + 单例 + CDN 回退）
        // ============================================================
        let webdavLibPromise = null;

        function loadWebdavLib() {
            if (webdavLibPromise) return webdavLibPromise;

            webdavLibPromise = (async () => {
                if (window.WebDAV && typeof window.WebDAV.createClient === 'function') {
                    console.log('[WebDAV Storage Plugin] 使用已存在的 window.WebDAV');
                    return window.WebDAV;
                }

                const errors = [];
                for (const url of WEBDAV_CDN_CANDIDATES) {
                    try {
                        console.log('[WebDAV Storage Plugin] 尝试加载 webdav:', url);
                        const mod = await withTimeout(
                            import(/* @vite-ignore */ url),
                            LIB_LOAD_TIMEOUT_MS,
                            '加载超时：' + url
                        );
                        const createClient =
                            mod.createClient ||
                            (mod.default && mod.default.createClient);
                        if (typeof createClient !== 'function') {
                            throw new Error('createClient 未在模块中导出');
                        }
                        const api = { createClient, __src: url };
                        window.WebDAV = api;
                        console.log('[WebDAV Storage Plugin] ✅ webdav 已加载:', url);
                        return api;
                    } catch (e) {
                        console.warn('[WebDAV Storage Plugin] ❌', url, '->', e.message || e);
                        errors.push(`${url} (${e.message || e})`);
                    }
                }
                webdavLibPromise = null;
                throw new Error('webdav 客户端库加载失败（已尝试所有 CDN）：\n' + errors.join('\n'));
            })();

            return webdavLibPromise;
        }

        // ============================================================
        // §3 配置与 client 工厂
        // ============================================================
        function loadConfig() {
            try {
                const raw = localStorage.getItem(CONFIG_KEY);
                if (raw) return JSON.parse(raw);
            } catch (e) {}
            return { baseUrl: '/api/webdav', username: '', password: '', remoteBase: '' };
        }
        function saveConfig(cfg) {
            try { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch (e) {}
        }

        let client = null;
        let currentConfig = loadConfig();

        function buildClient(cfg) {
            if (!window.WebDAV || typeof window.WebDAV.createClient !== 'function') {
                throw new Error('webdav 库尚未加载');
            }
            const remoteBase = (cfg.remoteBase || '').replace(/^\/+|\/+$/g, '');
            return window.WebDAV.createClient(cfg.baseUrl || '/api/webdav', {
                username: cfg.username || '',
                password: cfg.password || '',
                remoteBase: remoteBase ? '/' + remoteBase : ''
            });
        }
        function ensureClient() {
            if (!client) client = buildClient(currentConfig);
            return client;
        }

        // ============================================================
        // §4 Provider 协议实现
        // ============================================================
        const webdavProvider = {
            id: STORAGE_ID,
            name: 'WebDAV 存储',
            icon: 'fa-solid fa-cloud',
            description: '通过 WebDAV 协议读写远程媒体文件',
            capabilities: {
                read: true, write: true, delete: true, list: true,
                stat: true, range: true, publicUrl: false, streaming: false,
                quota: false, mkdir: true
            },

            async put(key, data, { meta, onProgress } = {}) {
                const c = ensureClient();
                const k = normalizeKey(key);

                const { body, contentLength } = await toWebdavBody(data);

                await c.putFileContents(k, body, {
                    overwrite: true,
                    ...(contentLength != null ? { contentLength } : {}),
                    onUploadProgress: typeof onProgress === 'function' ? onProgress : undefined
                });

                let size = contentLength || 0;
                if (!size) {
                    try { const st = await c.stat(k); size = st.size || 0; } catch (e) {}
                }
                return { key: k, size, meta: meta || {} };
            },

            async get(key) {
                const buf = await ensureClient().getFileContents(normalizeKey(key));
                if (buf instanceof ArrayBuffer) return new Blob([buf]);
                if (ArrayBuffer.isView(buf)) return new Blob([buf.buffer]);
                return new Blob([buf]);
            },

            async getStream(key) {
                return (await this.get(key)).stream();
            },

            async getUrl(key) {
                return ensureClient().getFileDownloadLink(normalizeKey(key));
            },

            async delete(key) {
                try { await ensureClient().deleteFile(normalizeKey(key)); return true; }
                catch (e) { if (e.status === 404) return false; throw e; }
            },

            async list(prefix = '') {
                const dir = prefix ? normalizeKey(prefix).replace(/\/?$/, '/') : '/';
                const items = await ensureClient().getDirectoryContents(dir);
                return items.map((item) => ({
                    key: String(item.filename).replace(/^\/+/, ''),
                    size: item.size || 0,
                    lastModified: item.lastmod ? Date.parse(item.lastmod) : 0,
                    meta: { type: item.type }
                }));
            },

            async stat(key) {
                const k = normalizeKey(key);
                try {
                    const st = await ensureClient().stat(k);
                    return {
                        key: k,
                        size: st.size || 0,
                        lastModified: st.lastmod ? Date.parse(st.lastmod) : 0,
                        meta: { type: st.type, mime: st.mime }
                    };
                } catch (e) { if (e.status === 404) return null; throw e; }
            },

            async exists(key) { return !!(await this.stat(key)); },

            async mkdir(prefix) {
                const c = ensureClient();
                const segs = normalizeKey(prefix).split('/').filter(Boolean);
                let path = '';
                for (const s of segs) {
                    path += '/' + encodeURIComponent(s);
                    try {
                        if (typeof c.createDirectory === 'function') {
                            await c.createDirectory(path);
                        } else if (typeof c.customRequest === 'function') {
                            await c.customRequest(path, { method: 'MKCOL' });
                        } else {
                            throw new Error('webdav 库不支持创建目录');
                        }
                    } catch (e) {
                        // 405 = 已存在；409 = 父目录不存在（逐段建理论上不会发生）
                        if (e.status !== 405 && e.status !== 409) throw e;
                    }
                }
                return true;
            },

            createWriteStream(key, opts = {}) {
                const chunks = [];
                let closed = false;
                const self = this;
                return {
                    async write(chunk) {
                        if (closed) throw new Error('stream 已关闭');
                        chunks.push(chunk);
                    },
                    async close() {
                        if (closed) return null;
                        closed = true;
                        return self.put(key, new Blob(chunks), opts);
                    },
                    abort() { closed = true; chunks.length = 0; }
                };
            }
        };

        // ============================================================
        // §5 生命周期（注册 / 注销）
        // ============================================================
        let registration = null;

        function registerProvider() {
            if (!window.MP3StorageRegistry) {
                throw new Error(
                    'window.MP3StorageRegistry 不存在。' +
                    '请确认 storage-registry.js 已引入且早于 plugin-center.js。'
                );
            }
            if (registration) return;
            registration = window.MP3StorageRegistry.register(webdavProvider);
            console.log('[WebDAV Storage Plugin] provider registered:', STORAGE_ID);
        }
        function unregisterProvider() {
            if (registration) {
                try { registration.unregister(); } catch (e) {}
                registration = null;
                client = null;
                console.log('[WebDAV Storage Plugin] provider unregistered');
            }
        }

        // ============================================================
        // §6 插件对象
        // ============================================================
        let initPromise = null;

        const plugin = {
            __version: '2.1.0',
            __loading: false,
            __error: null,

            async init() {
                if (initPromise) return initPromise;
                initPromise = (async () => {
                    console.log('[WebDAV Storage Plugin] init() begin');
                    await loadWebdavLib();
                    currentConfig = loadConfig();
                    client = buildClient(currentConfig);
                    registerProvider();
                    renderSettingsUI();
                    console.log('[WebDAV Storage Plugin] ✅ init() done');
                })().catch((err) => {
                    initPromise = null;
                    console.error('[WebDAV Storage Plugin] init() 失败:', err);
                    throw err;
                });
                return initPromise;
            },

            async unload() {
                unregisterProvider();
                const el = document.getElementById('webdavSettingsCard');
                if (el) el.remove();
                initPromise = null;
            },

            getClient: () => ensureClient(),
            getConfig: () => Object.assign({}, currentConfig),

            updateConfig(cfg) {
                currentConfig = Object.assign({}, currentConfig, cfg);
                saveConfig(currentConfig);
                client = buildClient(currentConfig);
            },

            async __selfTest() {
                const out = {
                    version: this.__version,
                    storageRegistry: !!window.MP3StorageRegistry,
                    webdavLib: !!(window.WebDAV && window.WebDAV.createClient),
                    webdavLibSrc: window.WebDAV && window.WebDAV.__src,
                    registered: !!registration,
                    config: currentConfig
                };
                console.table(out);
                if (!out.storageRegistry) return console.error('❌ 缺少 storage-registry.js');
                if (!out.webdavLib) return console.error('❌ webdav 库未加载（请先 enable 插件）');
                try {
                    const items = await ensureClient().getDirectoryContents('/');
                    console.log('✅ WebDAV 连接正常，根目录项数 =', items.length);
                } catch (e) {
                    console.error('❌ WebDAV 连接失败:', e);
                }
            }
        };

        // ============================================================
        // §7 设置 UI
        // ============================================================
        function renderSettingsUI() {
            const slot = document.getElementById('pluginSlot');
            if (!slot || document.getElementById('webdavSettingsCard')) return;

            const card = document.createElement('div');
            card.id = 'webdavSettingsCard';
            card.className = 'sidebar-card bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-3';
            card.innerHTML = `
                <div class="px-4 py-3 border-b border-slate-800">
                    <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <i class="fa-solid fa-cloud text-indigo-400 text-xs mr-1"></i> WebDAV 存储设置
                    </span>
                </div>
                <div class="px-4 py-3 space-y-2">
                    <input id="webdavBaseUrl" placeholder="服务器地址（如 /api/webdav）"
                        class="w-full bg-slate-800 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                        value="${escapeAttr(currentConfig.baseUrl || '')}">
                    <input id="webdavUser" placeholder="用户名"
                        class="w-full bg-slate-800 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                        value="${escapeAttr(currentConfig.username || '')}">
                    <input id="webdavPass" type="password" placeholder="密码"
                        class="w-full bg-slate-800 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                        value="${escapeAttr(currentConfig.password || '')}">
                    <input id="webdavRemoteBase" placeholder="远端子目录（可选，如 media）"
                        class="w-full bg-slate-800 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                        value="${escapeAttr(currentConfig.remoteBase || '')}">
                    <button id="webdavSaveBtn" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl px-3 py-1.5 transition">
                        保存并测试
                    </button>
                    <p id="webdavStatus" class="text-[10px] text-slate-500"></p>
                </div>`;
            slot.appendChild(card);

            card.querySelector('#webdavSaveBtn').addEventListener('click', async () => {
                plugin.updateConfig({
                    baseUrl: card.querySelector('#webdavBaseUrl').value.trim(),
                    username: card.querySelector('#webdavUser').value.trim(),
                    password: card.querySelector('#webdavPass').value,
                    remoteBase: card.querySelector('#webdavRemoteBase').value.trim()
                });
                const s = card.querySelector('#webdavStatus');
                s.textContent = '测试中…';
                s.className = 'text-[10px] text-slate-400';
                try {
                    await plugin.getClient().getDirectoryContents('/');
                    s.textContent = '✅ 连接成功';
                    s.className = 'text-[10px] text-emerald-400';
                } catch (e) {
                    s.textContent = '❌ ' + (e.message || e);
                    s.className = 'text-[10px] text-rose-400';
                }
            });
        }

        // ============================================================
        // §8 把占位对象升级为真正的插件对象
        // ============================================================
        Object.assign(PLACEHOLDER, plugin);
        PLACEHOLDER.__loading = false;
        console.log('[WebDAV Storage Plugin] ✅ exposed as window.MP3WebDAVStoragePlugin v' + plugin.__version);

    } catch (err) {
        console.error('[WebDAV Storage Plugin] ❌ IIFE 初始化异常:', err);
        PLACEHOLDER.__loading = false;
        PLACEHOLDER.__error = (err && err.message) || String(err);
        PLACEHOLDER.__stack = err && err.stack;
        PLACEHOLDER.init = async function () {
            throw new Error('[WebDAV Storage Plugin] 加载异常: ' + PLACEHOLDER.__error);
        };
        PLACEHOLDER.unload = async function () {};
    }
})();