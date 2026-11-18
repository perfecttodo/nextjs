(function () {
    'use strict';
    const NS = window.MP3Utils = window.MP3Utils || {};

    NS.encodeInlineArg = function (s) {
        return encodeURIComponent(String(s == null ? '' : s)).replace(/'/g, '%27');
    };
    NS.safeDecodeURI = function (s) {
        try { return decodeURIComponent(s); } catch (e) { return s; }
    };
    NS.escapeHtmlAttr = function (s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    NS.formatBytesShort = function (bytes) {
        if (!bytes || bytes < 0) return '';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    };
    NS.formatTime = function (seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    NS.getFileKey = function (f) {
        if (!f) return '';
        return f._key || f.relativePath || f.filename || '';
    };
    NS.parseLikedAt = function (raw) {
        if (!raw) return null;
        if (raw === true) return null;
        if (typeof raw === 'object' && typeof raw.ts === 'number') return raw.ts;
        return null;
    };
    NS.formatLikedAtDate = function (ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    NS.formatLikedAtFull = function (ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return `${NS.formatLikedAtDate(ts)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // 存储读写（保留原语义）
    NS.storage = {
        getCategories() {
            try {
                const saved = localStorage.getItem('mp3_custom_categories');
                return saved ? JSON.parse(saved) : ['未分類', '流行', '輕音樂', '工作', '其他'];
            } catch (e) { return ['未分類', '流行', '輕音樂', '工作', '其他']; }
        },
        saveCategories: (cats) => localStorage.setItem('mp3_custom_categories', JSON.stringify(cats)),
        getTagsMap() { try { return JSON.parse(localStorage.getItem('mp3_tags_map') || '{}'); } catch (e) { return {}; } },
        saveTagsMap: (m) => localStorage.setItem('mp3_tags_map', JSON.stringify(m)),
        getLikedMap() { try { return JSON.parse(localStorage.getItem('mp3_liked_map') || '{}'); } catch (e) { return {}; } },
        saveLikedMap: (m) => localStorage.setItem('mp3_liked_map', JSON.stringify(m)),
        getDislikedMap() { try { return JSON.parse(localStorage.getItem('mp3_disliked_map') || '{}'); } catch (e) { return {}; } },
        saveDislikedMap: (m) => localStorage.setItem('mp3_disliked_map', JSON.stringify(m)),
    };
    /* ============================================================
     * 兼容别名（关键修复）
     * ============================================================ */
    window.escapeHtmlAttr   = NS.escapeHtmlAttr;
    window.encodeInlineArg  = NS.encodeInlineArg;
    window.safeDecodeURI    = NS.safeDecodeURI;
    window.formatBytesShort = NS.formatBytesShort;
    window.formatTime       = NS.formatTime;
    window.getFileKey       = NS.getFileKey;
    window.parseLikedAt     = NS.parseLikedAt;
    window.formatLikedAtDate = NS.formatLikedAtDate;
    window.formatLikedAtFull = NS.formatLikedAtFull;

})();