(function () {
    'use strict';
    const U = window.MP3Utils;
    const S = window.MP3State;

    function getFilteredFiles() {
        const searchInputEl = document.getElementById('searchInput');
        const keyword = (searchInputEl && searchInputEl.value || '').toLowerCase();
        const sourceFilter = window.currentSourceFilter || 'all';
        const result = S.allFiles.filter(f => {
            const key = U.getFileKey(f);
            const matchKey = (f.displayName || f.filename || '').toLowerCase().includes(keyword) || key.toLowerCase().includes(keyword);
            const matchTag = !S.currentTagFilter || (f.tags && f.tags.includes(S.currentTagFilter));
            const matchSource = sourceFilter === 'all' || ((f._source || 'local') === sourceFilter);
            if (S.currentCategory === 'Dislike') return f.isDisliked && matchKey && matchTag && matchSource;
            if (f.isDisliked) return false;
            if (S.currentCategory === '我的最愛') return f.isLiked && matchKey && matchTag && matchSource;
            if (S.currentCategory !== '全部') return f.category === S.currentCategory && matchKey && matchTag && matchSource;
            return matchKey && matchTag && matchSource;
        });
        if (S.currentCategory === '我的最愛') result.sort((a, b) => (b.likedAt || 0) - (a.likedAt || 0));
        return result;
    }

    function updateUrlParams() {
        const params = new URLSearchParams(window.location.search);
        params.delete('dir');
        params.set('page', S.currentPage);
        params.set('pageSize', S.pageSize);
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }

    function handleSearch() { S.currentPage = 1; S.pendingScrollToCurrentSong = false; updateUrlParams(); window.MP3Table.renderTable(); }
    function goToPage(p) { S.currentPage = p; S.pendingScrollToCurrentSong = false; updateUrlParams(); window.MP3Table.renderTable(); }
    function changePageSize(sz) { S.pageSize = parseInt(sz); S.currentPage = 1; S.pendingScrollToCurrentSong = false; updateUrlParams(); window.MP3Table.renderTable(); }

    async function loadFiles(resetPage = false) {
        if (resetPage) S.currentPage = 1;
        if (window.MP3LocalPlugin && typeof window.MP3LocalPlugin.loadAllSources === 'function') {
            return window.MP3LocalPlugin.loadAllSources();
        }
        S.allFiles = S.allFiles.filter(f => f._source && f._source !== 'local');
        window.MP3Categories.renderCategories();
        window.MP3Categories.renderTagCloud();
        window.MP3Table.renderTable();
    }

    window.MP3SearchFilter = { getFilteredFiles };
    window.updateUrlParams = updateUrlParams;
    window.handleSearch = handleSearch;
    window.goToPage = goToPage;
    window.changePageSize = changePageSize;
    window.loadFiles = loadFiles;
})();