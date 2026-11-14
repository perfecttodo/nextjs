/**
 * ============================================================
 *  brand.js — 應用品牌單一設定（唯一改名入口）
 *
 *  改名只需修改 BRAND，其餘全部自動套用：
 *   - 瀏覽器分頁標題、頁面主標題、副標
 *   - Media Session 專輯 / 演出者 fallback
 *   - 播放中歌曲的分頁標題格式
 *
 *  刻意保留（確保相容性）：
 *   - 內部 API：MP3AppExtension / MP3PluginManager /
 *     MP3RegisterSourceAdapter / window.MP3*
 *   - localStorage 鍵：mp3_* 全部保留，舊資料無縫沿用
 *   - 插件檔名與 plugins/ 目錄結構
 * ============================================================
 */
(function () {
    'use strict';

    const BRAND = Object.freeze({
        name: '影音雲端管理',
        en: 'MediaCloud',
        tagline: '影音串流・分類・標籤・分享',
        fullTitle: '影音雲端管理',
        artistFallback: '影音雲端管理',
        mediaNoun: '媒體'
    });

    function applyDom() {
        try { document.title = BRAND.fullTitle; } catch (e) {}
        document.querySelectorAll('[data-brand]').forEach(el => {
            const key = el.getAttribute('data-brand');
            if (key && BRAND[key] != null) el.textContent = BRAND[key];
        });
    }

    window.MediaBrand = Object.freeze(Object.assign({}, BRAND, {
        songTitle: (song) => {
            const s = (song == null ? '' : String(song)).trim();
            return s ? (s + ' - ' + BRAND.fullTitle) : BRAND.fullTitle;
        },
        apply: applyDom
    }));

    try { document.title = BRAND.fullTitle; } catch (e) {}
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyDom, { once: true });
    } else {
        applyDom();
    }
})();