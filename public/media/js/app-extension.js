(function () {
    'use strict';
    const S = window.MP3State;
    const U = window.MP3Utils;
    const MS = window.MP3MediaSession;

    const call = (name, ...args) => {
        const fn = window[name];
        if (typeof fn === 'function') return fn.apply(window, args);
    };

    window.MP3AppExtension = (function () {
        return {
            version: '3.6',
            get allFiles() { return S.allFiles; },
            set allFiles(v) { S.allFiles = v; },
            get categories() { return S.categories; },
            set categories(v) { S.categories = v; },
            get currentPlayingFile() { return S.currentPlayingFile; },
            set currentPlayingFile(v) { S.currentPlayingFile = v; },
            get currentCategory() { return S.currentCategory; },
            set currentCategory(v) { S.currentCategory = v; },
            get currentPage() { return S.currentPage; },
            set currentPage(v) { S.currentPage = v; },
            get pageSize() { return S.pageSize; },
            get audioPlayer() { return document.getElementById('audioPlayer'); },
            get playbackLoadingKey() { return S.playbackLoadingKey; },

            setPlaybackLoading: (key) => { S.playbackLoadingKey = key; },
            getPlaybackLoading: () => S.playbackLoadingKey,

            on: (event, cb) => S.on(event, cb),
            off: (event, cb) => S.off(event, cb),

            playNext: (...a) => window.MP3Player.playNext(...a),
            playPrev: (...a) => window.MP3Player.playPrev(...a),

            setTimerText: (msg, tone) => {
                const el = document.getElementById('autoTimerText');
                if (!el) return;
                if (!msg) { el.classList.add('hidden'); el.innerText = ''; return; }
                el.classList.remove('hidden');
                el.innerText = msg;
                el.className = 'text-[11px] font-mono whitespace-nowrap ' + (
                    tone === 'warn' ? 'text-amber-400' :
                    tone === 'success' ? 'text-emerald-400' :
                    'text-amber-400'
                );
            },

            renderAll() {
                window.MP3Categories.renderCategories();
                window.MP3Categories.renderTagCloud();
                window.MP3Table.renderTable();
            },
            renderTable: (...a) => window.MP3Table.renderTable(...a),
            renderCategories: (...a) => window.MP3Categories.renderCategories(...a),
            renderTagCloud: (...a) => window.MP3Categories.renderTagCloud(...a),
            updatePlayButton: (...a) => window.MP3Player.updatePlayButton(...a),
            updatePlayerLikeState: (...a) => window.MP3Categories.updatePlayerLikeState(...a),
            updatePlayerDislikeState: (...a) => window.MP3Categories.updatePlayerDislikeState(...a),

            saveCategories: (cats) => U.storage.saveCategories(cats),
            getLikedMap: () => U.storage.getLikedMap(),
            getDislikedMap: () => U.storage.getDislikedMap(),
            getTagsMap: () => U.storage.getTagsMap(),
            saveLikedMap: (m) => U.storage.saveLikedMap(m),
            saveDislikedMap: (m) => U.storage.saveDislikedMap(m),
            saveTagsMap: (m) => U.storage.saveTagsMap(m),

            parseLikedAt: U.parseLikedAt,
            formatLikedAtDate: U.formatLikedAtDate,
            formatLikedAtFull: U.formatLikedAtFull,
            getFileKey: U.getFileKey,
            getFileRequestParams: S.getFileRequestParams,
            getCurrentDir: window.MP3GetCurrentDir,
            getMp3ApiBase: window.MP3GetMp3ApiBase,

            syncMediaSession: () => MS.syncMediaSessionFromCurrent(),
            updateMediaSessionMetadata: (title, artist) => MS.updateMediaSessionMetadata(title, artist),
            updateDocumentTitle: (name) => MS.updateDocumentTitle(name),
            resetMediaSession: () => MS.resetMediaSession(),

            cleanupFileMetadata: (key) => {
                const likedMap = U.storage.getLikedMap();
                if (likedMap[key]) { delete likedMap[key]; U.storage.saveLikedMap(likedMap); }
                const dislikedMap = U.storage.getDislikedMap();
                if (dislikedMap[key]) { delete dislikedMap[key]; U.storage.saveDislikedMap(dislikedMap); }
                const tagsMap = U.storage.getTagsMap();
                if (tagsMap[key]) { delete tagsMap[key]; U.storage.saveTagsMap(tagsMap); }
            },
            showCustomModal: (...a) => window.showCustomModal(...a),

            playSong: (...a) => window.MP3Player.playSong(...a),
            togglePlaySong: (...a) => window.MP3Player.togglePlaySong(...a),
            applyPlaybackUI: (key, file, name, opts) => window.MP3Player.applyPlaybackUI(key, file, name || (file && file.displayName), opts),

            setupSidebarCards: () => window.MP3Categories.setupSidebarCards(),
            toggleSidebarCard: (key) => window.MP3Categories.toggleSidebarCard(key)
        };
    })();
    console.log('[MP3AppExtension] ready v' + window.MP3AppExtension.version);
})();