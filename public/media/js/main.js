(function () {
    'use strict';
    const U = window.MP3Utils;
    const S = window.MP3State;

    window.addEventListener('DOMContentLoaded', () => {
        // 1) 分类初始化
        S.categories = U.storage.getCategories();

        // 2) URL 参数处理
        const params = new URLSearchParams(window.location.search);
        const dirParam = params.get('dir');
        if (dirParam) {
            let sources = [];
            try { sources = JSON.parse(localStorage.getItem('mp3_local_sources') || '[]'); } catch (e) {}
            if (sources.length === 0) {
                sources.push({ id: 'src_default', name: '本地媒體', apiBase: '/api/mp3', dir: dirParam, enabled: true });
                localStorage.setItem('mp3_local_sources', JSON.stringify(sources));
            }
        }
        const pageParam = parseInt(params.get('page'));
        if (!isNaN(pageParam) && pageParam > 0) S.currentPage = pageParam;
        const sizeParam = parseInt(params.get('pageSize'));
        if (!isNaN(sizeParam) && sizeParam > 0) {
            S.pageSize = sizeParam;
            const sizeSelectEl = document.getElementById('pageSizeSelect');
            if (sizeSelectEl) sizeSelectEl.value = S.pageSize;
        }

        // 3) 播放模式 / 音量恢复
        const savedPlayMode = localStorage.getItem('mp3_last_play_mode');
        if (savedPlayMode && window.MP3Player.modeNames[savedPlayMode]) {
            S.playMode = savedPlayMode;
            document.getElementById('playModeBtn').innerHTML = window.MP3Player.modeIconsSVG[S.playMode];
            document.getElementById('modeText').innerText = window.MP3Player.modeNames[savedPlayMode];
        }
        const savedVolume = localStorage.getItem('mp3_last_volume');
        if (savedVolume !== null) {
            const vol = parseFloat(savedVolume);
            const ap = document.getElementById('audioPlayer');
            ap.volume = vol;
            const volEl = document.getElementById('volumeControl');
            if (volEl) volEl.value = vol;
        }

        // 4) 收藏日期开关
        const showToggle = document.getElementById('showLikedDateToggle');
        if (showToggle) {
            showToggle.checked = window.mp3_showLikedDate;
            showToggle.addEventListener('change', (e) => {
                window.mp3_showLikedDate = e.target.checked;
                localStorage.setItem('mp3_show_liked_date', String(window.mp3_showLikedDate));
                window.MP3Table.renderTable();
            });
        }

        // 5) Media Session
        window.MP3MediaSession.initMediaSession();

        // 6) 侧栏折叠
        window.MP3Categories.setupSidebarCards();
    });
})();