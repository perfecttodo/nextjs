/**
 * 本地文件插件 v1.0（独立文件版）
 * 
 * - 从 /api/mp3 加载本地文件夹
 * - 通过 init/unload 生命周期管理
 * - 主应用 loadFiles 转发到本插件
 */
(function () {
    'use strict';

    let isActive = false;

    async function loadLocalFiles(resetPage = false) {
        if (!isActive) return;

        const dirInput = document.getElementById('dirInput');
        const dir = dirInput ? dirInput.value.trim() : '';

        const ext = window.MP3AppExtension;
        if (!ext) return;

        if (resetPage) ext.currentPage = 1;
        if (typeof window.updateUrlParams === 'function') window.updateUrlParams();

        if (!dir) {
            // 无路径：清空本地文件，保留外部源
            ext.allFiles = ext.allFiles.filter(f => f._source !== 'local');
            ext.renderAll();
            return;
        }

        try {
            const res = await fetch(`/api/mp3?dir=${encodeURIComponent(dir)}`);
            const data = await res.json();
            if (!data.success) {
                if (typeof window.showCustomModal === 'function') {
                    await window.showCustomModal({ title: '載入失敗', message: data.error || '未知錯誤', type: 'error' });
                }
                return;
            }

            const likedMap = (typeof window.getLikedMap === 'function') ? window.getLikedMap() : {};
            const dislikedMap = (typeof window.getDislikedMap === 'function') ? window.getDislikedMap() : {};
            let tagsMap = {};
            try { tagsMap = JSON.parse(localStorage.getItem('mp3_tags_map') || '{}'); } catch (e) {}

            const parseTs = typeof window.parseLikedAt === 'function'
                ? window.parseLikedAt
                : (raw) => (raw && typeof raw === 'object' && typeof raw.ts === 'number') ? raw.ts : null;

            const localFiles = data.files.map(f => {
                const key = f.relativePath || f.filename;
                const rawLike = likedMap[key];
                return {
                    ...f,
                    _source: 'local',
                    isLiked: !!rawLike,
                    likedAt: parseTs(rawLike),
                    isDisliked: !!dislikedMap[key],
                    tags: tagsMap[key] || []
                };
            });

            const existingExternal = ext.allFiles.filter(f => f._source && f._source !== 'local');
            ext.allFiles = [...localFiles, ...existingExternal];

            ext.renderAll();
            if (typeof window.updatePlayerLikeState === 'function') window.updatePlayerLikeState();
            if (typeof window.updatePlayerDislikeState === 'function') window.updatePlayerDislikeState();
            if (typeof window.restoreLastPlayedSong === 'function') window.restoreLastPlayedSong();
        } catch (err) {
            if (typeof window.showCustomModal === 'function') {
                await window.showCustomModal({ title: '連線錯誤', message: '無法連線至 API 伺服器', type: 'error' });
            }
        }
    }

    window.MP3LocalPlugin = {
        version: '1.0.0',
        async init() {
            isActive = true;
            // 首次加载（如果 dirInput 已有值，会自动加载）
            await loadLocalFiles(false);
        },
        async unload() {
            isActive = false;
            const ext = window.MP3AppExtension;
            if (!ext) return;

            // 停止播放本地文件（如果正在播放）
            const playingKey = ext.currentPlayingFile;
            let isPlayingLocal = false;
            if (playingKey) {
                const playingFile = ext.allFiles.find(f => (f.relativePath || f.filename) === playingKey);
                isPlayingLocal = playingFile && (playingFile._source === 'local');
            }

            ext.allFiles = ext.allFiles.filter(f => f._source !== 'local');

            if (isPlayingLocal) {
                try { ext.audioPlayer.pause(); } catch (e) {}
                ext.audioPlayer.removeAttribute('src');
                try { ext.audioPlayer.load(); } catch (e) {}
                ext.currentPlayingFile = null;

                const titleEl = document.getElementById('currentSongTitle');
                const catEl = document.getElementById('currentSongCategory');
                if (titleEl) titleEl.innerText = '尚未選擇播放歌曲';
                if (catEl) catEl.innerText = '就緒';
                if (typeof window.MP3SetPlayerSourceBadge === 'function') {
                    window.MP3SetPlayerSourceBadge(null);
                }
                if (typeof window.updatePlayButton === 'function') window.updatePlayButton();
                if (typeof window.updatePlayerLikeState === 'function') window.updatePlayerLikeState();
                if (typeof window.updatePlayerDislikeState === 'function') window.updatePlayerDislikeState();
            }

            ext.renderAll();
        },
        loadLocalFiles
    };
})();