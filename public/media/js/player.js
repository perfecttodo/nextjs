(function () {
    'use strict';
    const U = window.MP3Utils;
    const S = window.MP3State;
    const MS = window.MP3MediaSession;
    const audioPlayer = document.getElementById('audioPlayer');

    const modeIconsSVG = {
        'loop': `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`,
        'shuffle': `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.45 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
        'single': `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/><path d="M13 15h-1.5v-3.5H10V10h3v5z"/></svg>`,
        'sequence': `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M5 12h11.17l-4.58-4.59L13 6l6 6-6 6-1.41-1.41L16.17 13H5v-2z"/></svg>`
    };
    const modeNames = { 'loop': '循環', 'shuffle': '隨機', 'single': '單曲', 'sequence': '順序' };

    /* ---------- 播放 UI ---------- */
    function updatePlayButton() {
        const btn = document.getElementById('playPauseBtn');
        if (!btn) return;
        if (S.playbackLoadingKey && S.playbackLoadingKey === S.currentPlayingFile) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i>';
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            return;
        }
        btn.innerHTML = audioPlayer.paused
            ? '<i class="fa-solid fa-play text-xs"></i>'
            : '<i class="fa-solid fa-pause text-xs"></i>';
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = audioPlayer.paused ? 'paused' : 'playing';
    }

    function updateProgress() {
        if (isNaN(audioPlayer.duration)) return;
        document.getElementById('progressBar').value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        document.getElementById('currentTime').innerText = U.formatTime(audioPlayer.currentTime);
        document.getElementById('durationTime').innerText = U.formatTime(audioPlayer.duration);
        if (S.currentPlayingFile && !audioPlayer.paused) sessionStorage.setItem('mp3_last_played_time', audioPlayer.currentTime);
        MS.syncMediaSessionPosition();
    }
    function seekAudio(val) {
        if (!isNaN(audioPlayer.duration)) {
            audioPlayer.currentTime = (val / 100) * audioPlayer.duration;
            sessionStorage.setItem('mp3_last_played_time', audioPlayer.currentTime);
            MS.syncMediaSessionPosition();
        }
    }
    function changeVolume(val) {
        audioPlayer.volume = val;
        localStorage.setItem('mp3_last_volume', val);
    }
    function togglePlayMode() {
        const modes = ['loop', 'shuffle', 'single', 'sequence'];
        let idx = modes.indexOf(S.playMode);
        if (idx === -1) idx = 0;
        S.playMode = modes[(idx + 1) % modes.length];
        localStorage.setItem('mp3_last_play_mode', S.playMode);
        document.getElementById('playModeBtn').innerHTML = modeIconsSVG[S.playMode];
        document.getElementById('modeText').innerText = modeNames[S.playMode];
    }

    /* ---------- 播放器交互 ---------- */
    function togglePlay() {
        if (!audioPlayer.src) {
            const list = window.MP3SearchFilter.getFilteredFiles();
            if (list.length > 0) {
                const f = list[0];
                playSong(U.encodeInlineArg(U.getFileKey(f)), U.encodeInlineArg(f.displayName || ''));
            }
            return;
        }
        if (audioPlayer.paused) audioPlayer.play(); else audioPlayer.pause();
        updatePlayButton();
        window.MP3Table.renderTable();
    }

    function applyPlaybackUI(uniqueKey, file, displayName, opts) {
        if (!file) return;
        const prevKey = S.currentPlayingFile;
        const scroll = !opts || opts.scroll !== false;
        S.currentPlayingFile = uniqueKey;
        if (scroll) { S.pendingScrollToCurrentSong = true; syncPageToFile(uniqueKey); }

        const titleEl = document.getElementById('currentSongTitle');
        const catEl = document.getElementById('currentSongCategory');
        if (titleEl) titleEl.innerText = displayName;
        if (catEl) catEl.innerText = file.category || '';

        MS.updateDocumentTitle(displayName);
        MS.updateMediaSessionMetadata(displayName, MS.getSourceArtist(file));
        localStorage.setItem('mp3_last_played_key', uniqueKey);
        localStorage.setItem('mp3_last_played_title', displayName);

        if (typeof window.MP3SetPlayerSourceBadge === 'function') window.MP3SetPlayerSourceBadge(file);

        window.MP3Categories.updatePlayerLikeState();
        window.MP3Categories.updatePlayerDislikeState();
        window.MP3Table.renderTable();
        updatePlayButton();

        if (prevKey !== uniqueKey) S.emit('songchange', file, prevKey);
    }

    function syncPageToFile(uniqueKey) {
        const filtered = window.MP3SearchFilter.getFilteredFiles();
        const idx = filtered.findIndex(f => U.getFileKey(f) === uniqueKey);
        if (idx === -1) return;
        const targetPage = Math.floor(idx / S.pageSize) + 1;
        if (targetPage !== S.currentPage) {
            S.currentPage = targetPage;
            window.updateUrlParams();
        }
    }

    async function playSong(encodedKey, encodedName) {
        const uniqueKey = U.safeDecodeURI(encodedKey);
        const file = S.allFiles.find(f => U.getFileKey(f) === uniqueKey);
        if (!file) return;

        const displayName = encodedName
            ? U.safeDecodeURI(encodedName)
            : ((file.displayName || file.filename) || uniqueKey);

        const prevKey = S.currentPlayingFile;

        if (prevKey !== uniqueKey) {
            S.currentPlayingFile = uniqueKey;
            S.playbackLoadingKey = uniqueKey;
            S.pendingScrollToCurrentSong = true;
            syncPageToFile(uniqueKey);
            try { window.MP3Table.renderTable(); } catch (e) { console.warn('[playSong] renderTable:', e); }
            try { updatePlayButton(); } catch (e) {}
            try { window.MP3Categories.updatePlayerLikeState(); } catch (e) {}
            try { window.MP3Categories.updatePlayerDislikeState(); } catch (e) {}
            try { S.emit('songchange', file, prevKey); } catch (e) {}
        }

        if (window.MP3DataSourceHandlers) {
            Object.entries(window.MP3DataSourceHandlers).forEach(([k, h]) => {
                if (h && typeof h.reset === 'function') { try { h.reset(); } catch (e) {} }
            });
        }

        try {
            if (file._source && file._source !== 'local'
                && window.MP3DataSourceHandlers
                && window.MP3DataSourceHandlers[file._source]) {

                const wasCurrentSong = (prevKey === uniqueKey);
                try {
                    await window.MP3DataSourceHandlers[file._source].play(file);
                } catch (e) {
                    if (prevKey !== uniqueKey) {
                        S.currentPlayingFile = prevKey || null;
                        S.pendingScrollToCurrentSong = false;
                        try { window.MP3Table.renderTable(); } catch (err) {}
                        try { updatePlayButton(); } catch (err) {}
                        try { window.MP3Categories.updatePlayerLikeState(); } catch (err) {}
                        try { window.MP3Categories.updatePlayerDislikeState(); } catch (err) {}
                    }
                    console.error(`[DataSource] ${file._source}.play 失败:`, e);
                    window.showCustomModal({
                        title: '播放失敗',
                        message: `「${file._source}」插件無法播放該媒體：\n${e.message || '未知錯誤'}`,
                        type: 'error'
                    });
                    return;
                }

                if (wasCurrentSong) {
                    window.MP3Categories.updatePlayerLikeState();
                    window.MP3Categories.updatePlayerDislikeState();
                    window.MP3Table.renderTable();
                    updatePlayButton();
                    return;
                }

                const refreshed = S.allFiles.find(f => U.getFileKey(f) === uniqueKey) || file;
                applyPlaybackUI(uniqueKey, refreshed, displayName, { scroll: false });
                return;
            }

            const { apiBase, dir, originalKey } = S.getFileRequestParams(file);
            const streamUrl = `${apiBase}?dir=${encodeURIComponent(dir)}&action=stream&filename=${encodeURIComponent(originalKey)}`;

            if (prevKey !== uniqueKey) {
                try {
                    await window.MP3AppExtension.playMedia(
                        { url: streamUrl, mimeType: 'audio/mpeg' },
                        {
                            onStatus: (msg, tone) => {
                                if (tone === 'error') {
                                    window.showCustomModal({ title: '播放失敗', message: msg, type: 'error' });
                                }
                            }
                        }
                    );
                } catch (e) {
                    S.currentPlayingFile = prevKey || null;
                    S.pendingScrollToCurrentSong = false;
                    try { window.MP3Table.renderTable(); } catch (err) {}
                    try { updatePlayButton(); } catch (err) {}
                    try { window.MP3Categories.updatePlayerLikeState(); } catch (err) {}
                    try { window.MP3Categories.updatePlayerDislikeState(); } catch (err) {}
                    window.showCustomModal({ title: '播放失敗', message: e.message, type: 'error' });
                    return;
                }
                applyPlaybackUI(uniqueKey, file, displayName, { scroll: false });
            } else {
                if (audioPlayer.paused) audioPlayer.play(); else audioPlayer.pause();
                window.MP3Categories.updatePlayerLikeState();
                window.MP3Categories.updatePlayerDislikeState();
                window.MP3Table.renderTable();
                updatePlayButton();
            }
        } finally {
            if (S.playbackLoadingKey === uniqueKey) {
                S.playbackLoadingKey = null;
                try { updatePlayButton(); } catch (e) {}
                try { window.MP3Table.renderTable(); } catch (e) {}
            }
        }
    }

    function togglePlaySong(encodedKey, encodedName) {
        const uniqueKey = U.safeDecodeURI(encodedKey);
        if (!uniqueKey) return;
        if (S.playbackLoadingKey === uniqueKey) { console.log('[togglePlaySong] 加载中，忽略点击'); return; }

        if (S.currentPlayingFile === uniqueKey) {
            const file = S.allFiles.find(f => U.getFileKey(f) === uniqueKey);
            const src = (file && file._source) || 'local';
            const handler = window.MP3DataSourceHandlers && window.MP3DataSourceHandlers[src];

            if (handler && typeof handler.togglePlayback === 'function') {
                try { handler.togglePlayback(file); }
                catch (e) { console.warn('[togglePlaySong] handler.togglePlayback 失败:', e); }
            } else if (audioPlayer.src) {
                if (audioPlayer.paused) audioPlayer.play().catch(err => console.warn('[togglePlaySong] play 失败:', err));
                else audioPlayer.pause();
            } else {
                playSong(encodedKey, encodedName);
                return;
            }
            updatePlayButton();
            window.MP3Categories.updatePlayerLikeState();
            window.MP3Categories.updatePlayerDislikeState();
            window.MP3Table.renderTable();
            return;
        }
        playSong(encodedKey, encodedName);
    }

    function playPrev() {
        const list = window.MP3SearchFilter.getFilteredFiles();
        if (list.length === 0) return;
        const currentIndex = list.findIndex(f => U.getFileKey(f) === S.currentPlayingFile);
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = list.length - 1;
        const target = list[prevIndex];
        playSong(U.encodeInlineArg(U.getFileKey(target)), U.encodeInlineArg(target.displayName || ''));
    }

    function playNext() {
        const list = window.MP3SearchFilter.getFilteredFiles();
        if (list.length === 0) return;
        if (S.playMode === 'shuffle') {
            let randomIndex = Math.floor(Math.random() * list.length);
            if (list.length > 1 && U.getFileKey(list[randomIndex]) === S.currentPlayingFile) {
                randomIndex = (randomIndex + 1) % list.length;
            }
            const target = list[randomIndex];
            playSong(U.encodeInlineArg(U.getFileKey(target)), U.encodeInlineArg(target.displayName || ''));
            return;
        }
        const currentIndex = list.findIndex(f => U.getFileKey(f) === S.currentPlayingFile);
        let nextIndex = currentIndex + 1;
        if (nextIndex >= list.length) {
            if (S.playMode === 'sequence') {
                audioPlayer.pause();
                S.currentPlayingFile = null;
                window.MP3Categories.updatePlayerLikeState();
                window.MP3Categories.updatePlayerDislikeState();
                window.MP3Table.renderTable();
                updatePlayButton();
                return;
            }
            nextIndex = 0;
        }
        const target = list[nextIndex];
        playSong(U.encodeInlineArg(U.getFileKey(target)), U.encodeInlineArg(target.displayName || ''));
    }

    function onAudioEnded() {
        S.emit('ended');
        if (S.playMode === 'single') { audioPlayer.currentTime = 0; audioPlayer.play(); return; }
        playNext();
    }
    function onAudioError() {
        const titleEl = document.getElementById('currentSongTitle');
        if (titleEl) titleEl.innerText = "⚠️ 媒體損毀或無法播放，自動跳過...";
        setTimeout(() => playNext(), 1000);
    }

    function restoreLastPlayedSong() {
        const lastKey = localStorage.getItem('mp3_last_played_key');
        const lastTitle = localStorage.getItem('mp3_last_played_title');
        const lastTime = parseFloat(sessionStorage.getItem('mp3_last_played_time') || localStorage.getItem('mp3_last_played_time') || '0');
        if (!lastKey || S.allFiles.length === 0) return;
        const targetFile = S.allFiles.find(f => U.getFileKey(f) === lastKey);
        if (!targetFile) return;

        S.currentPlayingFile = lastKey;
        S.pendingScrollToCurrentSong = true;
        syncPageToFile(lastKey);

        const src = targetFile._source || 'local';
        if (src === 'local') {
            const { apiBase, dir, originalKey } = S.getFileRequestParams(targetFile);
            if (!dir) return;
            const streamUrl = `${apiBase}?dir=${encodeURIComponent(dir)}&action=stream&filename=${encodeURIComponent(originalKey)}`;
            audioPlayer.src = streamUrl;
            audioPlayer.addEventListener('loadedmetadata', function onMeta() {
                if (!isNaN(audioPlayer.duration) && lastTime < audioPlayer.duration) audioPlayer.currentTime = lastTime;
                audioPlayer.removeEventListener('loadedmetadata', onMeta);
            });
        }

        const displayName = targetFile.displayName || lastTitle;
        document.getElementById('currentSongTitle').innerText = displayName;
        document.getElementById('currentSongCategory').innerText = targetFile.category || '';
        MS.updateDocumentTitle(displayName);
        MS.updateMediaSessionMetadata(displayName, MS.getSourceArtist(targetFile));
        if (typeof window.MP3SetPlayerSourceBadge === 'function') window.MP3SetPlayerSourceBadge(targetFile);
        window.MP3Categories.updatePlayerLikeState();
        window.MP3Categories.updatePlayerDislikeState();
        window.MP3Table.renderTable();
        updatePlayButton();
    }

    /* ---------- 绑定 audio 事件（替代内联 ontimeupdate/onended/onerror） ---------- */
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', onAudioEnded);
    audioPlayer.addEventListener('error', onAudioError);
    audioPlayer.addEventListener('play', () => S.emit('play'));
    audioPlayer.addEventListener('pause', () => S.emit('pause'));

    window.MP3Player = {
        audioPlayer, modeIconsSVG, modeNames,
        updatePlayButton, updateProgress, seekAudio, changeVolume, togglePlayMode,
        togglePlay, playSong, togglePlaySong, playPrev, playNext,
        applyPlaybackUI, syncPageToFile, restoreLastPlayedSong,
        onAudioEnded, onAudioError
    };

    // 兼容既有 HTML onclick / 插件
    window.togglePlay = togglePlay;
    window.togglePlayMode = togglePlayMode;
    window.playPrev = playPrev;
    window.playNext = playNext;
    window.togglePlaySong = togglePlaySong;
    window.playSong = playSong;
    window.seekAudio = seekAudio;
    window.changeVolume = changeVolume;
    window.updateProgress = updateProgress;
    window.onAudioEnded = onAudioEnded;
    window.onAudioError = onAudioError;
    window.updatePlayButton = updatePlayButton;
    window.restoreLastPlayedSong = restoreLastPlayedSong;
})();