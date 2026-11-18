(function () {
    'use strict';
    const U = window.MP3Utils;

    const _listeners = {};
    const State = window.MP3State = {
        allFiles: [],
        categories: U.storage.getCategories(),
        currentCategory: '全部',
        currentTagFilter: null,
        currentPlayingFile: null,
        currentPage: 1,
        pageSize: 20,
        playMode: 'loop',
        playbackLoadingKey: null,
        pendingScrollToCurrentSong: false,
        showEmptyCategories: localStorage.getItem('mp3_show_empty_categories') === '1',
        wasPlayingBeforeHidden: false,
        lastPauseTime: 0,
    };
    window.PAUSE_TO_PLAY_DELAY = 900;

    State.emit = function (event, ...args) {
        const list = _listeners[event];
        if (!list) return;
        for (const cb of list.slice()) {
            try { cb(...args); } catch (e) { console.error(`[Event:${event}]`, e); }
        }
    };
    State.on = function (event, cb) {
        if (typeof cb !== 'function') return;
        if (!_listeners[event]) _listeners[event] = [];
        if (!_listeners[event].includes(cb)) _listeners[event].push(cb);
    };
    State.off = function (event, cb) {
        const list = _listeners[event];
        if (!list) return;
        const idx = list.indexOf(cb);
        if (idx >= 0) list.splice(idx, 1);
    };

    State.getFileRequestParams = function (file) {
        const apiBase = (file && file._apiBase) || window.MP3GetMp3ApiBase();
        const dir = (file && file._dir) || window.MP3GetCurrentDir();
        const originalKey = (file && file._originalKey) || (file && (file.relativePath || file.filename)) || '';
        return { apiBase, dir, originalKey };
    };

    window.MP3GetCurrentDir = function () { return localStorage.getItem('mp3_last_dir') || ''; };
    window.MP3GetMp3ApiBase = function () {
        let base = localStorage.getItem('mp3_api_base') || '/api/mp3';
        return String(base).trim().replace(/\/+$/, '') || '/api/mp3';
    };
    window.mp3_showLikedDate = localStorage.getItem('mp3_show_liked_date') === 'true';

    window.MP3SetPlaybackLoading = function (key) { State.playbackLoadingKey = key; };
    window.MP3GetPlaybackLoading = function () { return State.playbackLoadingKey; };
})();