/**
 * MP3 Core Player Registry v1.0
 *
 * 提供：
 *  - ext.registerPlayer({ id, matcher, play, destroy, isFallback? })
 *  - ext.unregisterPlayer(id)
 *  - ext.listPlayers()
 *  - ext.playMedia(mediaDesc, { onStatus })
 *  - ext.destroyPlayer()
 *
 * mediaDesc 格式：
 *   1) { url, mimeType? }           — 直链（含 Blob URL）
 *   2) { blob: File | Blob, mimeType? } — 本地文件
 *   3) { play: (audioEl) => Promise }   — 兼容自定义
 *
 * matcher 格式：
 *   { mimeTypes?: string[], extensions?: string[], test?: (media) => boolean }
 *
 * 匹配优先级：注册顺序 + isFallback 永远最后
 */
(function () {
    'use strict';

    const ext = window.MP3AppExtension;
    if (!ext) { console.warn('[CorePlayer] MP3AppExtension 未就绪'); return; }

    const PLAYER_REGISTRY = [];
    const HLS_PLAYER_SRC = 'hls-player.js';
    let hlsModulePromise = null;

    /* ==================== 工具 ==================== */

    const EXT_TO_MIME = {
        mp3:  'audio/mpeg',
        m4a:  'audio/mp4',
        aac:  'audio/aac',
        flac: 'audio/flac',
        wav:  'audio/wav',
        ogg:  'audio/ogg',
        opus: 'audio/opus',
        wma:  'audio/x-ms-wma',
        m3u8: 'application/vnd.apple.mpegurl',
        mp4:  'video/mp4',
        webm: 'video/webm',
        mkv:  'video/x-matroska',
        ts:   'video/mp2t',
    };

    function inferMimeFromUrl(url) {
        if (!url) return '';
        const m = /\.([a-z0-9]+)(?:\?|#|$)/i.exec(String(url));
        if (!m) return '';
        return EXT_TO_MIME[m[1].toLowerCase()] || '';
    }

    function getUrlExt(url) {
        if (!url) return '';
        const m = /(\.[a-z0-9]+)(?:\?|#|$)/i.exec(String(url));
        return m ? m[1].toLowerCase() : '';
    }

    function normalizeMedia(media) {
        if (!media) return null;
        if (typeof media === 'string') media = { url: media };

        // 兼容旧式 { type: 'hls' }
        if (media.type && !media.mimeType) {
            const typeMime = media.type === 'hls'
                ? 'application/vnd.apple.mpegurl'
                : (media.type === 'auto' ? '' : media.type);
            if (typeMime) media = Object.assign({}, media, { mimeType: typeMime });
        }

        // 补全 mimeType
        if (!media.mimeType) {
            if (media.url) {
                const mime = inferMimeFromUrl(media.url);
                if (mime) media = Object.assign({}, media, { mimeType: mime });
            } else if (media.blob && media.blob.type) {
                media = Object.assign({}, media, { mimeType: media.blob.type });
            }
        }

        return media;
    }

    function matches(player, media) {
        const { matcher } = player;
        if (!matcher) return false;

        if (typeof matcher.test === 'function') {
            try { if (matcher.test(media)) return true; } catch (e) {}
        }
        if (matcher.mimeTypes && matcher.mimeTypes.length) {
            const mt = (media.mimeType || '').toLowerCase();
            if (mt) {
                const baseMime = mt.split(';')[0].trim();
                if (matcher.mimeTypes.some(m => m.toLowerCase() === baseMime)) return true;
                // 通配 audio/* / video/*
                if (matcher.mimeTypes.some(m => m.endsWith('/*') && baseMime.startsWith(m.slice(0, -1)))) return true;
            }
        }
        if (matcher.extensions && matcher.extensions.length && media.url) {
            const urlExt = getUrlExt(media.url);
            if (urlExt && matcher.extensions.some(e => e.toLowerCase() === urlExt)) return true;
        }
        return false;
    }

    function selectPlayer(media) {
        let fallback = null;
        for (const p of PLAYER_REGISTRY) {
            if (p.isFallback) { if (!fallback) fallback = p; continue; }
            if (matches(p, media)) return p;
        }
        return fallback;
    }

    /* ==================== 注册 API ==================== */

    ext.registerPlayer = function (opts) {
        if (!opts || !opts.id || typeof opts.play !== 'function') {
            throw new Error('registerPlayer: 需要 id 和 play');
        }
        const idx = PLAYER_REGISTRY.findIndex(p => p.id === opts.id);
        if (idx >= 0) PLAYER_REGISTRY.splice(idx, 1, opts);
        else PLAYER_REGISTRY.push(opts);
        console.log('[CorePlayer] 注册播放器：', opts.id,
            opts.matcher ? JSON.stringify({ mime: opts.matcher.mimeTypes, ext: opts.matcher.extensions }) : '');
    };

    ext.unregisterPlayer = function (id) {
        const idx = PLAYER_REGISTRY.findIndex(p => p.id === id);
        if (idx >= 0) PLAYER_REGISTRY.splice(idx, 1);
    };

    ext.listPlayers = () => PLAYER_REGISTRY.map(p => p.id);

    /* ==================== HLS 模块懒加载 ==================== */

    function ensureHlsPlayer() {
        if (window.MP3HlsPlayer) return Promise.resolve(window.MP3HlsPlayer);
        if (hlsModulePromise) return hlsModulePromise;

        hlsModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-mp3-hls-player]');
            if (existing) {
                if (window.MP3HlsPlayer) { resolve(window.MP3HlsPlayer); return; }
                existing.addEventListener('load', () => {
                    if (window.MP3HlsPlayer) resolve(window.MP3HlsPlayer);
                    else reject(new Error('hls-player 加载后未注册 API'));
                });
                existing.addEventListener('error', () => reject(new Error('hls-player 加载失败')));
                return;
            }
            const s = document.createElement('script');
            s.src = HLS_PLAYER_SRC;
            s.dataset.mp3HlsPlayer = '1';
            s.onload = () => {
                if (window.MP3HlsPlayer) resolve(window.MP3HlsPlayer);
                else reject(new Error('hls-player 未注册 API'));
            };
            s.onerror = () => reject(new Error('hls-player 加载失败（路径：' + HLS_PLAYER_SRC + '）'));
            document.head.appendChild(s);
        }).catch(e => {
            hlsModulePromise = null;
            throw e;
        });

        return hlsModulePromise;
    }

    /* ==================== 内置播放器 1：HLS ==================== */

    ext.registerPlayer({
        id: 'hls',
        matcher: {
            mimeTypes: ['application/vnd.apple.mpegurl', 'audio/mpegurl', 'audio/x-mpegurl'],
            extensions: ['.m3u8']
        },
        play: async (audioEl, media, opts = {}) => {
            if (!media.url) throw new Error('HLS 播放器需要 url');
            const onStatus = opts.onStatus || (() => {});
            onStatus('正在加载 HLS 播放器…');
            let hls;
            try { hls = await ensureHlsPlayer(); }
            catch (e) {
                onStatus('HLS 播放器加载失败：' + e.message, 'error');
                throw e;
            }
            await hls.play(audioEl, media.url, { onStatus });
        },
        destroy: () => {
            if (window.MP3HlsPlayer) {
                try { window.MP3HlsPlayer.destroy(); } catch (e) {}
            }
        }
    });

    /* ==================== 内置播放器 2：native（兜底） ==================== */

    ext.registerPlayer({
        id: 'native',
        isFallback: true,   // 最后匹配，任何未被其它 player 匹配的媒体
        matcher: { test: () => true },
        play: async (audioEl, media, opts = {}) => {
            const onStatus = opts.onStatus || (() => {});

            // 若之前是 HLS，先销毁
            if (window.MP3HlsPlayer) {
                try { window.MP3HlsPlayer.destroy(); } catch (e) {}
            }
            try { audioEl.loop = false; } catch (e) {}
            try {
                if (navigator.audioSession) navigator.audioSession.type = 'playback';
            } catch (e) {}

            // 决定 src
            let src;
            if (media.blob) {
                src = URL.createObjectURL(media.blob);
                const prevUrl = audioEl._lastBlobUrl;
                if (prevUrl && prevUrl !== src) {
                    setTimeout(() => { try { URL.revokeObjectURL(prevUrl); } catch (e) {} }, 30000);
                }
                audioEl._lastBlobUrl = src;
            } else if (media.url) {
                src = media.url;
            } else {
                throw new Error('media 无 url / blob');
            }

            audioEl.removeAttribute('crossorigin');
            audioEl.src = src;
            await audioEl.play().catch(e => {
                onStatus('播放失败：' + e.message, 'error');
                throw new Error('播放失败：' + e.message);
            });
        },
        destroy: (audioEl) => {
            try { audioEl.pause(); } catch (e) {}
            try {
                audioEl.removeAttribute('src');
                audioEl.load();
            } catch (e) {}
            if (audioEl._lastBlobUrl) {
                setTimeout(() => {
                    try { URL.revokeObjectURL(audioEl._lastBlobUrl); } catch (e) {}
                }, 3000);
                audioEl._lastBlobUrl = null;
            }
        }
    });

    /* ==================== 核心：playMedia ==================== */

    ext.playMedia = async function (mediaOrUrl, opts = {}) {
        const ap = ext.audioPlayer;
        if (!ap) throw new Error('playMedia: audioPlayer 未就绪');

        // 兼容字符串 / { type: 'hls' } 旧写法
        const media = normalizeMedia(mediaOrUrl);
        if (!media) throw new Error('playMedia: media 为空');

        // 兼容自定义 { play: fn }
        if (typeof media.play === 'function') {
            await media.play(ap);
            return;
        }

        const player = selectPlayer(media);
        if (!player) {
            throw new Error('找不到匹配的播放器（' + (media.mimeType || media.url || media.blob?.type || '?') + '）');
        }

        // 切换 player 时先 destroy 旧的
        if (ap._currentPlayerId && ap._currentPlayerId !== player.id) {
            const oldPlayer = PLAYER_REGISTRY.find(p => p.id === ap._currentPlayerId);
            if (oldPlayer && typeof oldPlayer.destroy === 'function') {
                try { oldPlayer.destroy(ap); } catch (e) { console.warn('[CorePlayer] destroy 失败:', e); }
            }
        }

        ap._currentPlayerId = player.id;
        await player.play(ap, media, opts);
    };

    /* ==================== destroyPlayer ==================== */

    ext.destroyPlayer = function () {
        const ap = ext.audioPlayer;
        if (!ap) return;
        if (ap._currentPlayerId) {
            const player = PLAYER_REGISTRY.find(p => p.id === ap._currentPlayerId);
            if (player && typeof player.destroy === 'function') {
                try { player.destroy(ap); } catch (e) {}
            }
            ap._currentPlayerId = null;
        }
    };

    console.log('[CorePlayer] v1.0 ready（native + hls 内置，支持动态注册）');
})();