/**
 * ============================================================
 *  storage-registry.js — 媒体存储提供者注册表与统一读写 API
 *  v1.1.0
 *
 *  全局对象：
 *    window.MP3StorageRegistry — 注册表 / 生命周期 / 事件
 *    window.MP3Storage         — 统一读写 API
 *
 *  变更（v1.1.0）：
 *    - 新增可选能力 mkdir；storage.mkdir() 封装
 *    - write() 不再强制 toBlob，数据原样交给 provider，由 provider 自行转换
 *    - 内置 idb / opfs 各自在内部完成 Blob 转换
 *
 *  Provider 协议（全部可选，按 capabilities 声明）：
 *   {
 *     id, name, icon?, description?,
 *     capabilities: { read, write, delete, list, stat, range, publicUrl, streaming, quota, mkdir },
 *     init?(), unload?(),
 *
 *     put?(key, data, { onProgress, signal, meta })     -> { key, size, meta? }
 *     get?(key, { onProgress })                         -> Blob | ArrayBuffer
 *     getStream?(key)                                   -> ReadableStream
 *     getUrl?(key)                                      -> string
 *     createWriteStream?(key, opts)                     -> { write(chunk), close(), abort() }
 *     delete?(key)                                      -> boolean
 *     list?(prefix)                                     -> [{ key, size, lastModified, meta }]
 *     stat?(key)                                        -> { key, size, lastModified, meta } | null
 *     exists?(key)                                      -> boolean
 *     getQuota?()                                       -> { usage, quota }
 *     mkdir?(prefix)                                    -> boolean
 *   }
 *
 *  内置 Provider：idb（IndexedDB）、opfs（Origin Private File System）
 *
 *  事件：provider:registered / provider:unregistered / default:changed
 *        write:done / delete:done
 *
 *  存储键：mp3_storage_default_provider
 * ============================================================
 */
(function () {
    'use strict';

    const LOG = '[Storage]';
    const DEFAULT_PROVIDER_KEY = 'mp3_storage_default_provider';

    // ============================================================
    // §1 工具函数
    // ============================================================
    function normalizeCapabilities(c) {
        return Object.assign({
            read: false, write: false, delete: false, list: false,
            stat: false, range: false, publicUrl: false, streaming: false,
            quota: false, mkdir: false
        }, c || {});
    }

    function normalizeKey(key) {
        if (typeof key !== 'string' || !key.trim()) {
            throw new Error('key 必须是非空字符串');
        }
        const k = key.replace(/^\/+/, '');
        if (k.split('/').some(seg => seg === '..')) {
            throw new Error('key 不能包含 ".." 路径段：' + key);
        }
        return k;
    }

    function toBlob(data) {
        if (typeof Blob !== 'undefined' && data instanceof Blob) return data;
        if (data instanceof ArrayBuffer) return new Blob([data]);
        if (ArrayBuffer.isView(data)) return new Blob([data.buffer]);
        if (typeof data === 'string') return new Blob([data]);
        return null;
    }

    function reqToPromise(req) {
        return new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error || new Error('IndexedDB 请求失败'));
        });
    }

    function isReadableStream(v) {
        return typeof ReadableStream !== 'undefined' && v instanceof ReadableStream;
    }

    // ============================================================
    // §2 事件总线
    // ============================================================
    const listeners = new Map();

    function on(event, cb) {
        if (typeof cb !== 'function') return () => {};
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event).push(cb);
        return () => off(event, cb);
    }
    function off(event, cb) {
        const arr = listeners.get(event);
        if (!arr) return;
        const i = arr.indexOf(cb);
        if (i >= 0) arr.splice(i, 1);
    }
    function emit(event, payload) {
        const arr = listeners.get(event);
        if (!arr || arr.length === 0) return;
        arr.slice().forEach(cb => {
            try { cb(payload); } catch (e) { console.error(LOG + '[' + event + ']', e); }
        });
    }

    // ============================================================
    // §3 注册表
    // ============================================================
    const providers = new Map(); // id -> record

    function validateProvider(p) {
        if (!p || typeof p !== 'object') throw new Error('provider 必须是对象');
        if (!p.id || typeof p.id !== 'string') throw new Error('provider.id 必填');
        if (!p.name) throw new Error('provider.name 必填');

        const caps = normalizeCapabilities(p.capabilities);

        if (!caps.read && !caps.write) {
            throw new Error('provider 至少需声明 read 或 write 能力');
        }
        if (caps.read &&
            typeof p.get !== 'function' &&
            typeof p.getStream !== 'function' &&
            typeof p.getUrl !== 'function') {
            throw new Error('声明 read 但未实现 get / getStream / getUrl');
        }
        if (caps.write &&
            typeof p.put !== 'function' &&
            typeof p.createWriteStream !== 'function') {
            throw new Error('声明 write 但未实现 put / createWriteStream');
        }
        if (caps.delete && typeof p.delete !== 'function') throw new Error('声明 delete 但未实现 delete');
        if (caps.list && typeof p.list !== 'function') throw new Error('声明 list 但未实现 list');
        if (caps.stat && typeof p.stat !== 'function') throw new Error('声明 stat 但未实现 stat');
        if (caps.mkdir && typeof p.mkdir !== 'function') throw new Error('声明 mkdir 但未实现 mkdir');

        return caps;
    }

    function getDefaultId() {
        try {
            const stored = localStorage.getItem(DEFAULT_PROVIDER_KEY);
            if (stored && providers.has(stored)) return stored;
        } catch (e) {}
        for (const [id, r] of providers) if (r.capabilities.write) return id;
        const first = providers.keys().next();
        return first.done ? '' : first.value;
    }

    function setDefaultId(id) {
        if (id && !providers.has(id)) throw new Error('provider 不存在：' + id);
        try { localStorage.setItem(DEFAULT_PROVIDER_KEY, id || ''); } catch (e) {}
        emit('default:changed', { id });
    }

    const registry = {
        register(provider) {
            const caps = validateProvider(provider);
            if (providers.has(provider.id)) {
                throw new Error('provider 已存在：' + provider.id);
            }
            const record = {
                id: provider.id,
                name: provider.name,
                icon: provider.icon || 'fa-solid fa-database',
                description: provider.description || '',
                capabilities: caps,
                provider,
                registeredAt: Date.now(),
                source: provider._pluginId || ''
            };
            providers.set(record.id, record);
            emit('provider:registered', {
                id: record.id, name: record.name, capabilities: { ...caps }
            });
            console.log(LOG, 'registered provider:', record.id);
            return {
                ok: true,
                id: record.id,
                async unregister() { return registry.unregister(record.id); }
            };
        },

        async unregister(id) {
            const record = providers.get(id);
            if (!record) return false;
            try {
                if (typeof record.provider.unload === 'function') {
                    await record.provider.unload();
                }
            } catch (e) {
                console.warn(LOG, 'unload error:', e);
            }
            providers.delete(id);
            if (getDefaultId() === id) setDefaultId('');
            emit('provider:unregistered', { id });
            console.log(LOG, 'unregistered provider:', id);
            return true;
        },

        get(id) {
            const r = providers.get(id);
            return r ? r.provider : null;
        },
        getRecord(id) { return providers.get(id) || null; },
        has(id) { return providers.has(id); },

        list() {
            return [...providers.values()].map(r => ({
                id: r.id,
                name: r.name,
                icon: r.icon,
                description: r.description,
                capabilities: { ...r.capabilities },
                registeredAt: r.registeredAt,
                source: r.source
            }));
        },

        getDefaultId,
        setDefaultId,
        on, off, emit
    };

    // ============================================================
    // §4 统一操作 API
    // ============================================================
    function requireProvider(idOrEmpty) {
        const id = idOrEmpty || getDefaultId();
        if (!id) throw new Error('尚未注册任何存储提供者');
        const record = providers.get(id);
        if (!record) throw new Error('provider 不存在：' + id);
        return record;
    }

    const storage = {
        // ---------- 写入 ----------
        async write(providerId, key, data, opts = {}) {
            const { provider, capabilities } = requireProvider(providerId);
            if (!capabilities.write) throw new Error('provider 不支持写入：' + provider.id);
            const k = normalizeKey(key);

            // 原样透传：Blob / ArrayBuffer / Stream / string 交给 provider 自行转换
            const result = await provider.put(k, data, {
                onProgress: typeof opts.onProgress === 'function' ? opts.onProgress : null,
                signal: opts.signal,
                meta: opts.meta || {}
            });
            emit('write:done', { providerId: provider.id, key: k, result });
            return result;
        },

        // ---------- 读取 ----------
        async read(providerId, key, opts = {}) {
            const { provider } = requireProvider(providerId);
            const k = normalizeKey(key);
            if (typeof provider.get === 'function') {
                return provider.get(k, opts);
            }
            if (typeof provider.getStream === 'function') {
                const stream = await provider.getStream(k);
                return await new Response(stream).blob();
            }
            if (typeof provider.getUrl === 'function') {
                const url = await provider.getUrl(k, opts);
                const resp = await fetch(url);
                if (!resp.ok) throw new Error('通过 URL 读取失败：' + resp.status);
                return await resp.blob();
            }
            throw new Error('provider 不支持读取：' + provider.id);
        },

        async getUrl(providerId, key, opts = {}) {
            const { provider } = requireProvider(providerId);
            const k = normalizeKey(key);
            if (typeof provider.getUrl === 'function') {
                return provider.getUrl(k, opts);
            }
            const blob = await storage.read(provider.id, k, opts);
            return URL.createObjectURL(blob);
        },

        async readStream(providerId, key) {
            const { provider } = requireProvider(providerId);
            const k = normalizeKey(key);
            if (typeof provider.getStream === 'function') {
                return provider.getStream(k);
            }
            const blob = await storage.read(provider.id, k);
            return blob.stream();
        },

        openWriteStream(providerId, key, opts = {}) {
            const { provider } = requireProvider(providerId);
            const k = normalizeKey(key);

            if (typeof provider.createWriteStream === 'function') {
                return provider.createWriteStream(k, opts);
            }

            const chunks = [];
            let closed = false;
            return {
                async write(chunk) {
                    if (closed) throw new Error('stream 已关闭');
                    chunks.push(chunk);
                },
                async close() {
                    if (closed) return null;
                    closed = true;
                    const blob = new Blob(chunks);
                    chunks.length = 0;
                    const result = await provider.put(k, blob, opts);
                    emit('write:done', { providerId: provider.id, key: k, result });
                    return result;
                },
                abort() {
                    closed = true;
                    chunks.length = 0;
                }
            };
        },

        // ---------- 元信息 ----------
        async exists(providerId, key) {
            const { provider } = requireProvider(providerId);
            const k = normalizeKey(key);
            if (typeof provider.exists === 'function') return provider.exists(k);
            if (typeof provider.stat === 'function') return !!(await provider.stat(k));
            return !!(await storage.read(provider.id, k).catch(() => null));
        },

        async stat(providerId, key) {
            const { provider } = requireProvider(providerId);
            const k = normalizeKey(key);
            if (typeof provider.stat !== 'function') throw new Error('provider 不支持 stat');
            return provider.stat(k);
        },

        async list(providerId, prefix = '') {
            const { provider, capabilities } = requireProvider(providerId);
            if (!capabilities.list) throw new Error('provider 不支持 list');
            return provider.list(prefix);
        },

        async getQuota(providerId) {
            const { provider } = requireProvider(providerId);
            if (typeof provider.getQuota === 'function') return provider.getQuota();
            return { usage: 0, quota: 0 };
        },

        // ---------- 目录 ----------
        async mkdir(providerId, prefix) {
            const { provider, capabilities } = requireProvider(providerId);
            if (!capabilities.mkdir || typeof provider.mkdir !== 'function') {
                return false;
            }
            const k = normalizeKey(prefix).replace(/\/+$/, '');
            if (!k) return false;
            return provider.mkdir(k);
        },

        // ---------- 删除 ----------
        async delete(providerId, key) {
            const { provider, capabilities } = requireProvider(providerId);
            if (!capabilities.delete) throw new Error('provider 不支持删除');
            const k = normalizeKey(key);
            const ok = await provider.delete(k);
            if (ok) emit('delete:done', { providerId: provider.id, key: k });
            return ok;
        },

        // ---------- 跨 provider 直传 ----------
        async copy(fromProviderId, fromKey, toProviderId, toKey, opts = {}) {
            const from = requireProvider(fromProviderId);
            const to = requireProvider(toProviderId);
            const fromK = normalizeKey(fromKey);
            const toK = normalizeKey(toKey);

            const canStream =
                typeof from.provider.getStream === 'function' &&
                typeof to.provider.createWriteStream === 'function';

            if (canStream) {
                const rs = await from.provider.getStream(fromK);
                const ws = to.provider.createWriteStream(toK, opts);
                try {
                    const reader = rs.getReader();
                    for (;;) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        await ws.write(value);
                    }
                    return await ws.close();
                } catch (e) {
                    try { await ws.abort?.(); } catch (_) {}
                    throw e;
                }
            }

            const blob = await storage.read(from.provider.id, fromK, opts);
            return storage.write(to.provider.id, toK, blob, opts);
        },

        // ---------- 工具 ----------
        revokeUrl(url) {
            if (typeof url === 'string' && url.startsWith('blob:')) {
                try { URL.revokeObjectURL(url); } catch (e) {}
            }
        }
    };

    // ============================================================
    // §5 内置 Provider：IndexedDB
    // ============================================================
    function createIndexedDBProvider() {
        const DB_NAME = 'mp3_storage_idb';
        const DB_VERSION = 1;
        const STORE = 'media';
        let dbPromise = null;

        function openDB() {
            if (dbPromise) return dbPromise;
            dbPromise = new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(STORE)) {
                        db.createObjectStore(STORE, { keyPath: 'key' });
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || new Error('无法打开 IndexedDB'));
            });
            return dbPromise;
        }

        async function withStore(mode, fn) {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, mode);
                const store = tx.objectStore(STORE);
                let out;
                try { out = fn(store); } catch (e) { reject(e); return; }
                tx.oncomplete = () => resolve(out);
                tx.onerror = () => reject(tx.error || new Error('IDB 事务失败'));
                tx.onabort = () => reject(tx.error || new Error('IDB 事务中止'));
            });
        }

        async function statFn(key) {
            const rec = await withStore('readonly', store => reqToPromise(store.get(key)));
            if (!rec) return null;
            return {
                key: rec.key,
                size: rec.size,
                lastModified: rec.lastModified,
                meta: rec.meta || {}
            };
        }

        return {
            id: 'idb',
            name: '浏览器内置存储',
            icon: 'fa-solid fa-database',
            description: 'IndexedDB 持久化，适合数百 MB 内的媒体',

            capabilities: {
                read: true, write: true, delete: true, list: true,
                stat: true, range: false, publicUrl: false, streaming: false,
                quota: true, mkdir: false
            },

            async mkdir() { return false; },

            async put(key, data, opts = {}) {
                // provider 内部负责 Blob 转换
                let blob = toBlob(data);
                if (!blob && isReadableStream(data)) {
                    blob = await new Response(data).blob();
                }
                if (!blob) throw new Error('IDB put: 不支持的数据类型');
                const record = {
                    key,
                    blob,
                    size: blob.size,
                    lastModified: Date.now(),
                    meta: opts.meta || {}
                };
                await withStore('readwrite', store => reqToPromise(store.put(record)));
                return { key, size: blob.size, meta: record.meta };
            },

            async get(key) {
                const rec = await withStore('readonly', store => reqToPromise(store.get(key)));
                if (!rec) throw new Error('找不到文件：' + key);
                return rec.blob;
            },

            async delete(key) {
                const existed = !!(await statFn(key));
                await withStore('readwrite', store => reqToPromise(store.delete(key)));
                return existed;
            },

            async list(prefix = '') {
                const db = await openDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(STORE, 'readonly');
                    const store = tx.objectStore(STORE);
                    const req = store.openCursor();
                    const out = [];
                    req.onsuccess = () => {
                        const cursor = req.result;
                        if (!cursor) return;
                        const rec = cursor.value;
                        if (!prefix || rec.key.startsWith(prefix)) {
                            out.push({
                                key: rec.key,
                                size: rec.size,
                                lastModified: rec.lastModified,
                                meta: rec.meta || {}
                            });
                        }
                        cursor.continue();
                    };
                    tx.oncomplete = () => resolve(out);
                    tx.onerror = () => reject(tx.error);
                    tx.onabort = () => reject(tx.error || new Error('list 中止'));
                });
            },

            stat: statFn,

            async exists(key) { return !!(await statFn(key)); },

            async getQuota() {
                if (navigator.storage && navigator.storage.estimate) {
                    return await navigator.storage.estimate();
                }
                return { usage: 0, quota: 0 };
            }
        };
    }

    // ============================================================
    // §6 内置 Provider：OPFS
    // ============================================================
    function createOPFSProvider() {
        if (!(navigator.storage && navigator.storage.getDirectory)) return null;

        let rootPromise = null;
        function getRoot() {
            if (!rootPromise) rootPromise = navigator.storage.getDirectory();
            return rootPromise;
        }

        async function getHandle(key, create) {
            const root = await getRoot();
            const segs = key.split('/').filter(Boolean);
            const name = segs.pop();
            if (!name) throw new Error('无效 key：' + key);
            let dir = root;
            for (const s of segs) dir = await dir.getDirectoryHandle(s, { create });
            return dir.getFileHandle(name, { create });
        }

        async function statFn(key) {
            try {
                const fh = await getHandle(key, false);
                const f = await fh.getFile();
                return {
                    key,
                    size: f.size,
                    lastModified: f.lastModified,
                    meta: {}
                };
            } catch (e) { return null; }
        }

        return {
            id: 'opfs',
            name: '本机文件系统 (OPFS)',
            icon: 'fa-solid fa-hard-drive',
            description: '浏览器源私有文件系统，支持真正流式与大文件',

            capabilities: {
                read: true, write: true, delete: true, list: true,
                stat: true, range: false, publicUrl: false, streaming: true,
                quota: true, mkdir: true
            },

            async mkdir(key) {
                const segs = key.split('/').filter(Boolean);
                let dir = await getRoot();
                for (const s of segs) dir = await dir.getDirectoryHandle(s, { create: true });
                return true;
            },

            async put(key, data, opts = {}) {
                const fh = await getHandle(key, true);
                const w = await fh.createWritable({ keepExistingData: false });
                try {
                    if (isReadableStream(data)) {
                        await data.pipeTo(w, { preventClose: true });
                        await w.close();
                    } else {
                        const blob = toBlob(data);
                        await w.write(blob || new Blob([data]));
                        await w.close();
                    }
                } catch (e) {
                    try { await w.abort(); } catch (_) {}
                    throw e;
                }
                const file = await (await getHandle(key, false)).getFile();
                return { key, size: file.size };
            },

            async get(key) {
                const fh = await getHandle(key, false);
                return await fh.getFile();
            },

            async getStream(key) {
                const fh = await getHandle(key, false);
                const file = await fh.getFile();
                return file.stream();
            },

            async getUrl(key) {
                const blob = await this.get(key);
                return URL.createObjectURL(blob);
            },

            createWriteStream(key, opts = {}) {
                let wPromise = null;
                const getW = () => {
                    if (wPromise) return wPromise;
                    wPromise = (async () => {
                        const fh = await getHandle(key, true);
                        return fh.createWritable({ keepExistingData: false });
                    })();
                    return wPromise;
                };
                return {
                    async write(chunk) { const w = await getW(); await w.write(chunk); },
                    async close() {
                        const w = await getW();
                        await w.close();
                        const f = await (await getHandle(key, false)).getFile();
                        return { key, size: f.size };
                    },
                    async abort() {
                        try { const w = await getW(); await w.abort(); } catch (e) {}
                    }
                };
            },

            async delete(key) {
                const segs = key.split('/').filter(Boolean);
                const name = segs.pop();
                try {
                    let dir = await getRoot();
                    for (const s of segs) dir = await dir.getDirectoryHandle(s, { create: false });
                    await dir.removeEntry(name);
                    return true;
                } catch (e) {
                    return false;
                }
            },

            async list(prefix = '') {
                const root = await getRoot();
                const out = [];
                async function walk(dir, path) {
                    for await (const [name, handle] of dir.entries()) {
                        const full = path ? path + '/' + name : name;
                        if (handle.kind === 'directory') {
                            await walk(handle, full);
                        } else if (!prefix || full.startsWith(prefix)) {
                            const f = await handle.getFile();
                            out.push({
                                key: full,
                                size: f.size,
                                lastModified: f.lastModified,
                                meta: {}
                            });
                        }
                    }
                }
                await walk(root, '');
                return out;
            },

            stat: statFn,

            async exists(key) { return !!(await statFn(key)); },

            async getQuota() {
                if (navigator.storage && navigator.storage.estimate) {
                    return await navigator.storage.estimate();
                }
                return { usage: 0, quota: 0 };
            }
        };
    }

    // ============================================================
    // §7 自动注册内置 Provider
    // ============================================================
    try {
        registry.register(createIndexedDBProvider());
    } catch (e) {
        console.error(LOG, 'IDB provider 注册失败：', e);
    }

    try {
        const opfs = createOPFSProvider();
        if (opfs) {
            registry.register(opfs);
            console.log(LOG, 'OPFS provider registered');
        } else {
            console.warn(LOG, '当前浏览器不支持 OPFS，已跳过');
        }
    } catch (e) {
        console.warn(LOG, 'OPFS provider 注册失败：', e);
    }

    // ============================================================
    // §8 导出
    // ============================================================
    window.MP3StorageRegistry = registry;
    window.MP3Storage = storage;

    console.log(
        LOG, '✅ ready. providers =',
        registry.list().map(p => p.id).join(', '),
        '| default =',
        registry.getDefaultId() || '(none)'
    );
})();