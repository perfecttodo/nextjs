/**
 * recording-storage.js
 * 职责：录音存储的统一抽象层
 * 存储实现需暴露：
 *   capabilities(): { deletable: boolean }
 *   list(): Promise<Array<{ id, name, blob?, url?, size, createdAt, mimeType }>>
 *   getBlob(id): Promise<Blob | null>
 *   delete?(id): Promise<void>      // 可选；不存在即表示不支持删除
 */
(function () {
    'use strict';

    /* ============================================================
     * 实现 A：IndexedDB 存储（浏览器内录音，可删除）
     * ============================================================ */
    function createIndexedDBStorage({ dbName = 'mp3_recordings', storeName = 'recordings' } = {}) {
        let _dbPromise = null;
        function openDB() {
            if (_dbPromise) return _dbPromise;
            _dbPromise = new Promise((resolve, reject) => {
                const req = indexedDB.open(dbName, 1);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id' });
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            return _dbPromise;
        }
        function tx(mode, fn) {
            return openDB().then(db => new Promise((resolve, reject) => {
                const t = db.transaction(storeName, mode);
                const store = t.objectStore(storeName);
                let result;
                try { result = fn(store); } catch (e) { reject(e); return; }
                t.oncomplete = () => resolve(result);
                t.onerror = () => reject(t.error);
            }));
        }
        return {
            capabilities() { return { deletable: true }; },
            async list() {
                const all = await tx('readonly', store => {
                    const req = store.getAll();
                    return new Promise((res, rej) => {
                        req.onsuccess = () => res(req.result || []);
                        req.onerror = () => rej(req.error);
                    });
                });
                const arr = await all;
                return arr.map(r => ({
                    id: r.id,
                    name: r.name || `錄音-${r.id}.webm`,
                    blob: r.blob,
                    size: r.blob ? r.blob.size : (r.size || 0),
                    createdAt: r.createdAt || 0,
                    mimeType: r.mimeType || (r.blob && r.blob.type) || 'audio/webm'
                }));
            },
            async getBlob(id) {
                return tx('readonly', store => {
                    const req = store.get(id);
                    return new Promise((res, rej) => {
                        req.onsuccess = () => res(req.result ? req.result.blob : null);
                        req.onerror = () => rej(req.error);
                    });
                });
            },
            async delete(id) {
                return tx('readwrite', store => {
                    const req = store.delete(id);
                    return new Promise((res, rej) => {
                        req.onsuccess = () => res();
                        req.onerror = () => rej(req.error);
                    });
                });
            }
        };
    }

    /* ============================================================
     * 实现 B：后端 API 存储（可删除）
     * ============================================================ */
    function createApiStorage({ apiBase, deleteMethod = 'DELETE' } = {}) {
        return {
            capabilities() { return { deletable: true }; },
            async list() {
                const res = await fetch(`${apiBase}?action=list-recordings`);
                const data = await res.json();
                return (data.files || []).map(f => ({
                    id: f.id || f.filename,
                    name: f.displayName || f.filename,
                    size: f.size || 0,
                    createdAt: f.createdAt || 0,
                    mimeType: f.mimeType || 'audio/webm',
                    _url: f.url || `${apiBase}?action=stream-recording&id=${encodeURIComponent(f.id || f.filename)}`
                }));
            },
            async getBlob(id) { return null; }, // 播放走 URL
            async delete(id) {
                const res = await fetch(`${apiBase}?action=delete-recording&id=${encodeURIComponent(id)}`, { method: deleteMethod });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.success === false) {
                    throw new Error(data.error || `删除失败 HTTP ${res.status}`);
                }
            }
        };
    }

    /* ============================================================
     * 实现 C：只读存储（不可删除，演示 deletable:false 效果）
     * ============================================================ */
    function createReadOnlyStorage({ listFn, urlFn } = {}) {
        return {
            capabilities() { return { deletable: false }; },
            async list() { return listFn ? listFn() : []; },
            async getBlob(id) { return null; },
            // 故意不提供 delete 方法
            _urlFor(id) { return urlFn ? urlFn(id) : null; }
        };
    }

    window.MP3RecordingStorage = {
        createIndexedDBStorage,
        createApiStorage,
        createReadOnlyStorage
    };
})();