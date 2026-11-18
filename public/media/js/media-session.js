(function () {
    'use strict';
    const S = window.MP3State;
    const U = window.MP3Utils;

    const APP_TITLE = (window.MediaBrand && window.MediaBrand.fullTitle) || '影音雲端管理';
    const APP_ARTIST_FALLBACK = (window.MediaBrand && window.MediaBrand.artistFallback) || '影音雲端管理';
    const ARTWORK_URL = 'https://cdn-icons-png.flaticon.com/512/3388/3388823.png';

    function updateDocumentTitle(songName) {
        document.title = (songName && String(songName).trim())
            ? `${songName} - ${APP_TITLE}`
            : APP_TITLE;
    }
    function getSourceArtist(file) {
        if (!file) return APP_ARTIST_FALLBACK;
        const meta = window.MP3GetSourceMeta(file);
        return meta.artist || APP_ARTIST_FALLBACK;
    }
    function updateMediaSessionMetadata(title, artist) {
        if (!('mediaSession' in navigator)) return;
        try {
            const albumEl = document.getElementById('currentSongCategory');
            const albumText = (albumEl && albumEl.innerText) ? albumEl.innerText.trim() : '';
            navigator.mediaSession.metadata = new MediaMetadata({
                title: (title && String(title).trim()) || '未知曲目',
                artist: (artist && String(artist).trim()) || APP_ARTIST_FALLBACK,
                album: albumText || APP_TITLE,
                artwork: [
                    { src: ARTWORK_URL, sizes: '96x96', type: 'image/png' },
                    { src: ARTWORK_URL, sizes: '512x512', type: 'image/png' }
                ]
            });
        } catch (e) {}
    }
    function syncMediaSessionPosition() {
        if (!('mediaSession' in navigator)) return;
        if (typeof navigator.mediaSession.setPositionState !== 'function') return;
        const ap = document.getElementById('audioPlayer');
        const dur = ap.duration;
        if (!isFinite(dur) || dur <= 0) return;
        try {
            navigator.mediaSession.setPositionState({
                duration: dur,
                playbackRate: ap.playbackRate || 1,
                position: Math.max(0, Math.min(dur, ap.currentTime || 0))
            });
        } catch (e) {}
    }
    function syncMediaSessionFromCurrent() {
        if (!S.currentPlayingFile) return;
        const file = S.allFiles.find(f => U.getFileKey(f) === S.currentPlayingFile);
        if (!file) return;
        const displayName = file.displayName || file.filename || '';
        updateDocumentTitle(displayName);
        updateMediaSessionMetadata(displayName, getSourceArtist(file));
        syncMediaSessionPosition();
    }
    function resetMediaSession() {
        updateDocumentTitle(null);
        if (!('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: APP_TITLE, artist: APP_ARTIST_FALLBACK, album: '就緒',
                artwork: [{ src: ARTWORK_URL, sizes: '512x512', type: 'image/png' }]
            });
            navigator.mediaSession.playbackState = 'none';
        } catch (e) {}
    }

    function handleGlobalVisibilityChange() {
        const ap = document.getElementById('audioPlayer');
        if (document.visibilityState === 'hidden') {
            S.wasPlayingBeforeHidden = !ap.paused;
        } else if (document.visibilityState === 'visible') {
            if (S.currentPlayingFile) {
                syncMediaSessionFromCurrent();
                if (S.wasPlayingBeforeHidden && ap.paused) ap.play().catch(() => {});
            }
        }
    }

    function initMediaSession() {
        const ap = document.getElementById('audioPlayer');
        if (!('mediaSession' in navigator)) {
            document.addEventListener('visibilitychange', handleGlobalVisibilityChange);
            return;
        }
        const ms = navigator.mediaSession;
        ms.setActionHandler('pause', () => {
            S.lastPauseTime = Date.now();
            if (!ap.paused) { ap.pause(); window.MP3Player.updatePlayButton(); }
        });
        ms.setActionHandler('play', () => {
            const now = Date.now();
            if (S.lastPauseTime > 0 && (now - S.lastPauseTime < window.PAUSE_TO_PLAY_DELAY)) {
                S.lastPauseTime = 0;
                if (S.currentPlayingFile) {
                    const file = S.allFiles.find(f => U.getFileKey(f) === S.currentPlayingFile);
                    if (file && !file.isLiked) window.MP3Categories.togglePlayerLike();
                }
                if (ap.paused) { ap.play(); window.MP3Player.updatePlayButton(); }
                return;
            }
            S.lastPauseTime = 0;
            if (ap.paused) { ap.play(); window.MP3Player.updatePlayButton(); }
        });
        ms.setActionHandler('previoustrack', () => window.MP3Player.playPrev());
        ms.setActionHandler('nexttrack', () => window.MP3Player.playNext());
        try {
            ms.setActionHandler('seekbackward', (d) => {
                const skip = (d && d.seekOffset) || 10;
                ap.currentTime = Math.max(0, ap.currentTime - skip);
                syncMediaSessionPosition();
            });
            ms.setActionHandler('seekforward', (d) => {
                const skip = (d && d.seekOffset) || 10;
                ap.currentTime = Math.min(ap.duration || 0, ap.currentTime + skip);
                syncMediaSessionPosition();
            });
            ms.setActionHandler('seekto', (d) => {
                if (typeof d.seekTime === 'number' && isFinite(ap.duration)) {
                    ap.currentTime = Math.min(ap.duration, Math.max(0, d.seekTime));
                    syncMediaSessionPosition();
                }
            });
            ms.setActionHandler('stop', () => {
                ap.pause(); ap.currentTime = 0;
                window.MP3Player.updatePlayButton();
            });
        } catch (e) {}
        ap.addEventListener('play', () => syncMediaSessionFromCurrent());
        ap.addEventListener('loadedmetadata', () => { syncMediaSessionFromCurrent(); syncMediaSessionPosition(); });
        ap.addEventListener('durationchange', () => syncMediaSessionPosition());
        document.addEventListener('visibilitychange', handleGlobalVisibilityChange);
    }

    window.MP3MediaSession = {
        APP_TITLE, ARTWORK_URL,
        updateDocumentTitle, getSourceArtist,
        updateMediaSessionMetadata, syncMediaSessionFromCurrent,
        syncMediaSessionPosition, resetMediaSession, initMediaSession
    };
})();