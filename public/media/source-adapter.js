/**
 * ============================================================
 *  source-adapter.js — 数据源适配器
 *
 *  职责：
 *    - 把数据源插件（local / gdrive / news / filesystem / urlmedia / ...）
 *      转成主应用可识别的 { _source, _key, isLiked, tags, ... } 形态
 *    - 注册到 window.MP3DataSourceHandlers，供 playSong() 分派
 *    - 提供 window.MP3RegisterSourceAdapter() 给插件使用
 *
 *  依赖：
 *    - app-extension.js（必须先加载）
 *
 *  导出（挂在 window 上）：
 *    window.MP3RegisterSourceAdapter
 *    window.MP3DataSourceHandlers          ← 由插件 register 时填充
 *    ext.ensureSourceCategory / removeSourceData / stopIfPlayingFrom / decorateFiles
 *
 *  加载顺序：
 *    core-player.js → app-extension.js → 本文件 → plugins/plugin-center.js
 * ============================================================
 */
(function () {
    'use strict';

    const ext = window.MP3AppExtension;
    if (!ext) {
        console.warn('[SourceAdapter] MP3AppExtension 未就绪，适配器未安装');
        return;
    }

    // ============================================================
    // §1 扩展 MP3AppExtension：分类 / 清理 / 停止播放
    // ============================================================
    ext.ensureSourceCategory = function (name) {
        if (!name) return;
        const cats = ext.categories;
        if (!cats.includes(name)) {
            cats.push(name);
            ext.saveCategories(cats);
        }
    };

    ext.removeSourceData = function ({ sourceKeys = [], categoryNames = [] } = {}) {
        if (sourceKeys.length) {
            ext.allFiles = ext.allFiles.filter(f => !sourceKeys.includes(f._source));
        }
        if (categoryNames.length) {
            const cats = ext.categories.filter(c => !categoryNames.includes(c));
            ext.categories = cats;
            ext.saveCategories(cats);
            if (categoryNames.includes(ext.currentCategory)) ext.currentCategory = '全部';
        }
    };

    ext.stopIfPlayingFrom = function (sourceKeys) {
        const keys = [].concat(sourceKeys);
        const cur = ext.currentPlayingFile;
        if (!cur) return false;
        const file = ext.allFiles.find(f => ext.getFileKey(f) === cur);
        if (!file || !keys.includes(file._source)) return false;

        if (typeof ext.destroyPlayer === 'function') {
            try { ext.destroyPlayer(); }
            catch (e) { console.warn('[stopIfPlayingFrom] destroyPlayer 失败:', e); }
        } else {
            const ap = ext.audioPlayer;
            ap.pause();
            ap.removeAttribute('src');
            try { ap.load(); } catch (e) {}
        }

        ext.currentPlayingFile = null;
        const t = document.getElementById('currentSongTitle');
        const c = document.getElementById('currentSongCategory');
        if (t) t.innerText = '尚未選擇播放媒體';
        if (c) c.innerText = '就緒';
        if (typeof window.MP3SetPlayerSourceBadge === 'function') window.MP3SetPlayerSourceBadge(null);

        ext.updatePlayButton();
        ext.updatePlayerLikeState();
        ext.updatePlayerDislikeState();
        ext.resetMediaSession();
        return true;
    };

    // ============================================================
    // §2 装饰器：把原始文件记录补全主应用需要的元数据
    // ============================================================
    ext.decorateFiles = function (rawList, opts) {
        const { getKey, sourceKey = '' } = opts || {};
        const keyFn = typeof getKey === 'function' ? getKey : (f) => ext.getFileKey(f);
        const likedMap = ext.getLikedMap();
        const dislikedMap = ext.getDislikedMap();
        const tagsMap = ext.getTagsMap();
        let lk = false, dk = false, tk = false;

        const out = (rawList || []).map(raw => {
            const key = keyFn(raw);
            const fallbackKey = raw.relativePath || raw.filename || '';

            let rawLike = likedMap[key];
            if (!rawLike && fallbackKey && likedMap[fallbackKey]) {
                rawLike = likedMap[fallbackKey];
                likedMap[key] = rawLike;
                lk = true;
            }
            let rawDislike = dislikedMap[key];
            if (!rawDislike && fallbackKey && dislikedMap[fallbackKey]) {
                rawDislike = dislikedMap[fallbackKey];
                dislikedMap[key] = rawDislike;
                dk = true;
            }
            let tags = tagsMap[key];
            if (!tags && fallbackKey && tagsMap[fallbackKey]) {
                tags = tagsMap[fallbackKey];
                tagsMap[key] = tags;
                tk = true;
            }

            return Object.assign({}, raw, {
                _key: key,
                _source: sourceKey || raw._source,
                isLiked: !!rawLike,
                likedAt: ext.parseLikedAt(rawLike),
                isDisliked: !!rawDislike,
                tags: tags || []
            });
        });

        if (lk) ext.saveLikedMap(likedMap);
        if (dk) ext.saveDislikedMap(dislikedMap);
        if (tk) ext.saveTagsMap(tagsMap);
        return out;
    };

    // ============================================================
    // §3 插件公开 API：注册数据源适配器
    // ============================================================
    window.MP3RegisterSourceAdapter = function ({
        id, categoryName, list, resolveMedia, delete: del,
        onStatusChange, onPlaying, reset, onUnload
    }) {
        if (!id || typeof list !== 'function' || typeof resolveMedia !== 'function') {
            throw new Error('MP3RegisterSourceAdapter: id / list / resolveMedia 必填');
        }
        window.MP3DataSourceHandlers = window.MP3DataSourceHandlers || {};

        async function refreshList() {
            const res = await list({ page: 1, pageSize: 999999 });
            const decorated = ext.decorateFiles(res.files || [], {
                getKey: (f) => ext.getFileKey(f),
                sourceKey: id
            });
            ext.allFiles = ext.allFiles.filter(f => f._source !== id).concat(decorated);
            ext.ensureSourceCategory(categoryName);
            ext.renderAll();
            return { files: decorated, total: decorated.length, totalPages: 1 };
        }

        window.MP3DataSourceHandlers[id] = {
            reset() {
                try { reset?.(); }
                catch (e) { console.warn(`[${id}] reset 失败:`, e); }
            },

            async play(file) {
                const key = ext.getFileKey(file);
                try {
                    if (typeof ext.setPlaybackLoading === 'function') ext.setPlaybackLoading(key);
                    try { ext.applyPlaybackUI(key, file, file.displayName, { scroll: false }); }
                    catch (e) { console.warn('[SourceAdapter.play] applyPlaybackUI 失败:', e); }
                    try { ext.updatePlayButton(); } catch (e) {}

                    const media = await resolveMedia(file);
                    if (!media) throw new Error('resolveMedia 返回空');

                    if (typeof media.play === 'function') {
                        await media.play(ext.audioPlayer);
                    } else {
                        await ext.playMedia(media, {
                            onStatus: (msg, tone) => onStatusChange?.(msg, tone)
                        });
                    }

                    if (typeof ext.setPlaybackLoading === 'function') ext.setPlaybackLoading(null);
                    try { ext.updatePlayButton(); } catch (e) {}
                    try { ext.renderTable(); } catch (e) {}

                    onPlaying?.(file);
                } catch (e) {
                    if (typeof ext.setPlaybackLoading === 'function') ext.setPlaybackLoading(null);
                    try { ext.updatePlayButton(); } catch (err) {}
                    try { ext.renderTable(); } catch (err) {}
                    onStatusChange?.('播放失败：' + e.message, 'error');
                    throw e;
                }
            },

            async delete(file) {
                if (!del) throw new Error('此来源不支援删除');
                await del(file);
                const key = ext.getFileKey(file);
                const wasPlaying = ext.currentPlayingFile === key;
                ext.cleanupFileMetadata(key);
                ext.allFiles = ext.allFiles.filter(f => ext.getFileKey(f) !== key);
                if (wasPlaying) ext.stopIfPlayingFrom(id);
                ext.renderAll();
            }
        };

        return {
            async refresh() { return refreshList(); },
            async unload() {
                try { onUnload?.(); }
                catch (e) { console.warn(`[${id}] onUnload 异常:`, e); }
                ext.stopIfPlayingFrom(id);
                ext.removeSourceData({ sourceKeys: [id], categoryNames: [categoryName] });
                ext.renderAll();
                delete window.MP3DataSourceHandlers[id];
            }
        };
    };

    console.log('[SourceAdapter] ready v1.7');
})();