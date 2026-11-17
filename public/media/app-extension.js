/**
 * ============================================================
 *  app-extension.js — 应用对插件的公共 API（Facade）
 *
 *  职责：
 *    - 把 index.html 顶层的内部状态（allFiles / categories / ...）以
 *      稳定、版本化的 getter/setter 暴露给插件
 *    - 提供受控的方法调用入口（playSong / playNext / renderAll / ...）
 *    - 提供事件订阅（on / off）
 *
 *  依赖：
 *    - 主应用脚本（在 index.html 中先于此文件加载）
 *    - core-player.js（在插件真正调用 playMedia 等时延迟使用）
 *
 *  加载顺序：
 *    <script>/* 主应用 *\/</script>
 *    <script src="core-player.js"></script>
 *    <script src="app-extension.js"></script>   ← 本文件
 *
 *  版本：
 *    遵循 semver；新增 API 递增 minor，移除/不兼容递增 major。
 * ============================================================
 */
(function () {
    'use strict';

    const call = (name, ...args) => {
        const fn = window[name];
        if (typeof fn === 'function') return fn.apply(window, args);
    };

    window.MP3AppExtension = {
        version: '3.6',

        get allFiles() { return allFiles; },
        set allFiles(v) { allFiles = v; },
        get categories() { return categories; },
        set categories(v) { categories = v; },
        get currentPlayingFile() { return currentPlayingFile; },
        set currentPlayingFile(v) { currentPlayingFile = v; },
        get currentCategory() { return currentCategory; },
        set currentCategory(v) { currentCategory = v; },
        get currentPage() { return currentPage; },
        set currentPage(v) { currentPage = v; },
        get pageSize() { return pageSize; },
        get audioPlayer() { return audioPlayer; },
        get playbackLoadingKey() { return playbackLoadingKey; },

        setPlaybackLoading: (key) => { playbackLoadingKey = key; },
        getPlaybackLoading: () => playbackLoadingKey,

        on: (event, cb) => {
            if (typeof cb !== 'function') return;
            if (!_eventListeners[event]) _eventListeners[event] = [];
            if (!_eventListeners[event].includes(cb)) _eventListeners[event].push(cb);
        },
        off: (event, cb) => {
            const list = _eventListeners[event];
            if (!list) return;
            const idx = list.indexOf(cb);
            if (idx >= 0) list.splice(idx, 1);
        },

        playNext: (...a) => call('playNext', ...a),
        playPrev: (...a) => call('playPrev', ...a),

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

        renderAll() { call('renderCategories'); call('renderTagCloud'); call('renderTable'); },
        renderTable: (...a) => call('renderTable', ...a),
        renderCategories: (...a) => call('renderCategories', ...a),
        renderTagCloud: (...a) => call('renderTagCloud', ...a),
        updatePlayButton: (...a) => call('updatePlayButton', ...a),
        updatePlayerLikeState: (...a) => call('updatePlayerLikeState', ...a),
        updatePlayerDislikeState: (...a) => call('updatePlayerDislikeState', ...a),

        saveCategories: (...a) => call('saveCategories', ...a),
        getLikedMap: () => (typeof getLikedMap === 'function' ? getLikedMap() : {}),
        getDislikedMap: () => (typeof getDislikedMap === 'function' ? getDislikedMap() : {}),
        getTagsMap: () => (typeof getTagsMap === 'function' ? getTagsMap() : {}),
        saveLikedMap: (...a) => call('saveLikedMap', ...a),
        saveDislikedMap: (...a) => call('saveDislikedMap', ...a),
        saveTagsMap: (...a) => call('saveTagsMap', ...a),

        parseLikedAt, formatLikedAtDate, formatLikedAtFull, getFileKey, getFileRequestParams,
        getCurrentDir: window.MP3GetCurrentDir,
        getMp3ApiBase: window.MP3GetMp3ApiBase,

        syncMediaSession: () => syncMediaSessionFromCurrent(),
        updateMediaSessionMetadata: (title, artist) => updateMediaSessionMetadata(title, artist),
        updateDocumentTitle: (name) => updateDocumentTitle(name),
        resetMediaSession: () => resetMediaSession(),

        cleanupFileMetadata: (key) => cleanupFileMetadata(key),
        showCustomModal: (...a) => call('showCustomModal', ...a),

        playSong: (...a) => call('playSong', ...a),
        togglePlaySong: (...a) => call('togglePlaySong', ...a),
        applyPlaybackUI: (key, file, name, opts) => applyPlaybackUI(key, file, name || (file && file.displayName), opts),

        setupSidebarCards: () => call('setupSidebarCards'),
        toggleSidebarCard: (key) => call('toggleSidebarCard', key)
    };

    console.log('[MP3AppExtension] ready v' + window.MP3AppExtension.version);
})();