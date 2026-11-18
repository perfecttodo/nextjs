/**
 * categories.js
 * 职责：分类 / 标签 / 我的最愛 / 已隱藏 / 侧栏折叠 / 移动端抽屉
 * 依赖：MP3Utils、MP3State、MP3Modal（window.showCustomModal）
 * 导出：window.MP3Categories + 兼容旧版 window.xxx
 */
(function () {
    'use strict';

    const U = window.MP3Utils;
    const S = window.MP3State;

    if (!U || !S) {
        console.error('[categories.js] 缺少 MP3Utils 或 MP3State，请检查脚本加载顺序');
        return;
    }

    /* ============================================================
     * 一、存储辅助
     * ============================================================ */
    function getTagsMap() { return U.storage.getTagsMap(); }
    function saveTagsMap(m) { U.storage.saveTagsMap(m); }
    function getLikedMap() { return U.storage.getLikedMap(); }
    function saveLikedMap(m) { U.storage.saveLikedMap(m); }
    function getDislikedMap() { return U.storage.getDislikedMap(); }
    function saveDislikedMap(m) { U.storage.saveDislikedMap(m); }
    function saveCategories(cats) {
        S.categories = cats;
        U.storage.saveCategories(cats);
    }

    /* ============================================================
     * 二、侧栏折叠卡片
     * ============================================================ */
    function setupSidebarCards() {
        document.querySelectorAll('.sidebar-card[data-collapse-key]').forEach(card => {
            if (card.dataset.collapseReady === '1') return;
            card.dataset.collapseReady = '1';
            const storageKey = 'mp3_sidebar_collapsed_' + card.dataset.collapseKey;
            const collapsed = localStorage.getItem(storageKey) === '1';
            card.classList.toggle('is-collapsed', collapsed);
            const header = card.querySelector('.sidebar-card-header');
            if (header) header.setAttribute('aria-expanded', String(!collapsed));
            requestAnimationFrame(() => card.classList.add('is-ready'));
        });
    }

    function toggleSidebarCard(collapseKey) {
        const card = document.querySelector(`.sidebar-card[data-collapse-key="${collapseKey}"]`);
        if (!card) return;
        const nowCollapsed = !card.classList.contains('is-collapsed');
        card.classList.toggle('is-collapsed', nowCollapsed);
        const header = card.querySelector('.sidebar-card-header');
        if (header) header.setAttribute('aria-expanded', String(!nowCollapsed));
        try {
            localStorage.setItem('mp3_sidebar_collapsed_' + collapseKey, nowCollapsed ? '1' : '0');
        } catch (e) {}
    }

    /* ============================================================
     * 三、移动端抽屉
     * ============================================================ */
    function toggleMobileDrawer(forceOpen) {
        const drawer = document.getElementById('mobileDrawer');
        const backdrop = document.getElementById('mobileDrawerBackdrop');
        const toggleBtn = document.getElementById('mobileDrawerToggle');
        if (!drawer || !backdrop) return;
        const isCurrentlyOpen = !drawer.classList.contains('-translate-x-full');
        const shouldOpen = (typeof forceOpen === 'boolean') ? forceOpen : !isCurrentlyOpen;
        if (shouldOpen) {
            drawer.classList.remove('-translate-x-full');
            backdrop.classList.remove('hidden');
            requestAnimationFrame(() => backdrop.classList.remove('opacity-0'));
            if (toggleBtn) toggleBtn.classList.add('is-open');
        } else {
            drawer.classList.add('-translate-x-full');
            backdrop.classList.add('opacity-0');
            setTimeout(() => backdrop.classList.add('hidden'), 300);
            if (toggleBtn) toggleBtn.classList.remove('is-open');
        }
    }

    function closeDrawerIfMobile() {
        if (window.innerWidth < 1024) toggleMobileDrawer(false);
    }

    /* ============================================================
     * 四、空分类折叠
     * ============================================================ */
    function toggleEmptyCategories() {
        S.showEmptyCategories = !S.showEmptyCategories;
        try {
            localStorage.setItem('mp3_show_empty_categories', S.showEmptyCategories ? '1' : '0');
        } catch (e) {}
        renderCategories();
    }

    /* ============================================================
     * 五、分类增删
     * ============================================================ */
    function addNewCategory() {
        const inputEl = document.getElementById('newCategoryInput');
        if (!inputEl) return;
        const catName = inputEl.value.trim();
        if (!catName) return;
        if (S.categories.includes(catName)) {
            window.showCustomModal({ title: '提示', message: '此分類名稱已存在！', type: 'info' });
            return;
        }
        S.categories.push(catName);
        saveCategories(S.categories);
        inputEl.value = '';
        // 新建分类必为空，自动展开空分类组
        S.showEmptyCategories = true;
        try { localStorage.setItem('mp3_show_empty_categories', '1'); } catch (e) {}
        renderCategories();
        window.MP3Table.renderTable();
    }

    async function deleteCategory(encodedCat) {
        const catName = U.safeDecodeURI(encodedCat);
        if (catName === '未分類' || catName === '全部' || catName === '我的最愛') return;
        const confirmed = await window.showCustomModal({
            title: '刪除分類',
            message: `確定要刪除分類「${catName}」嗎？\n原先屬於此分類的媒體將自動歸為「未分類」。`,
            type: 'danger',
            confirmText: '確認刪除'
        });
        if (!confirmed) return;
        S.allFiles.forEach(f => { if (f.category === catName) f.category = '未分類'; });
        S.categories = S.categories.filter(c => c !== catName);
        saveCategories(S.categories);
        if (S.currentCategory === catName) S.currentCategory = '全部';
        renderCategories();
        window.MP3Table.renderTable();
    }

    /* ============================================================
     * 六、分类渲染
     * ============================================================ */
    function renderCategories() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;

        const totalLikedCount = S.allFiles.filter(f => f.isLiked).length;
        const totalDislikedCount = S.allFiles.filter(f => f.isDisliked).length;
        const validFilesCount = S.allFiles.filter(f => !f.isDisliked).length;

        let html = `
            <button onclick="filterCategory('全部')" class="cat-btn w-full text-left px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition flex items-center justify-between ${S.currentCategory === '全部' && !S.currentTagFilter ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'}">
                <span>全部</span><span class="ml-2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">${validFilesCount}</span>
            </button>
            <button onclick="filterCategory('我的最愛')" class="cat-btn w-full text-left px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition flex items-center justify-between ${S.currentCategory === '我的最愛' && !S.currentTagFilter ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'}">
                <span class="flex items-center"><i class="fa-solid fa-heart text-rose-500 mr-2"></i> 我的最愛</span><span class="ml-2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">${totalLikedCount}</span>
            </button>
            <button onclick="filterCategory('Dislike')" class="cat-btn w-full text-left px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition flex items-center justify-between ${S.currentCategory === 'Dislike' && !S.currentTagFilter ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'}">
                <span class="flex items-center"><i class="fa-solid fa-thumbs-down text-amber-400 mr-2"></i> 已隱藏</span><span class="ml-2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">${totalDislikedCount}</span>
            </button>`;

        // 分「有內容 / 空」两组；当前选中的分类即使为 0 也始终显示
        const nonEmpty = [];
        const empty = [];
        S.categories.forEach(cat => {
            const count = S.allFiles.filter(f => f.category === cat && !f.isDisliked).length;
            const isActive = (S.currentCategory === cat && !S.currentTagFilter);
            if (count > 0 || isActive) nonEmpty.push({ cat, count, isActive });
            else empty.push({ cat, count, isActive });
        });

        const renderCatRow = (cat, count, isActive, dimmed) => {
            const canDelete = (cat !== '未分類');
            const encCat = U.encodeInlineArg(cat);
            return `
                <div class="flex items-center space-x-1 w-full group ${dimmed ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}">
                    <button onclick="filterCategory('${encCat}')" class="cat-btn flex-1 text-left px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition flex items-center justify-between ${isActive ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'}">
                        <span>${U.escapeHtmlAttr(cat)}</span><span class="ml-2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">${count}</span>
                    </button>
                    ${canDelete ? `<button onclick="deleteCategory('${encCat}')" class="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 text-xs transition"><i class="fa-solid fa-xmark"></i></button>` : ''}
                </div>`;
        };

        nonEmpty.forEach(({ cat, count, isActive }) => {
            html += renderCatRow(cat, count, isActive, false);
        });

        // 空分类折叠成一行入口
        if (empty.length > 0) {
            html += `
                <button onclick="toggleEmptyCategories()" class="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl text-[10px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition" title="展開 / 收合空分類">
                    <span class="flex items-center gap-1.5">
                        <i class="fa-solid ${S.showEmptyCategories ? 'fa-chevron-down' : 'fa-chevron-right'} text-[8px]"></i>
                        空分類
                    </span>
                    <span class="text-[9px] bg-slate-800/80 px-1.5 py-0.5 rounded-full font-mono">${empty.length}</span>
                </button>`;
            if (S.showEmptyCategories) {
                empty.forEach(({ cat, count, isActive }) => {
                    html += renderCatRow(cat, count, isActive, true);
                });
            }
        }

        container.innerHTML = html;
        const badge = document.getElementById('count-badge');
        if (badge) badge.innerText = `${validFilesCount} 筆`;
        updateMobileFilterBadge();
    }

    function updateMobileFilterBadge() {
        const badge = document.getElementById('mobileFilterBadge');
        if (!badge) return;
        badge.innerText = S.currentTagFilter ? '#' + S.currentTagFilter : S.currentCategory;
    }

    /* ============================================================
     * 七、分类 / 标签过滤
     * ============================================================ */
    function filterCategory(encodedCat) {
        S.currentCategory = U.safeDecodeURI(encodedCat);
        S.currentTagFilter = null;
        S.currentPage = 1;
        S.pendingScrollToCurrentSong = false;
        window.updateUrlParams();
        renderCategories();
        renderTagCloud();
        window.MP3Table.renderTable();
        closeDrawerIfMobile();
    }

    function renderTagCloud() {
        const container = document.getElementById('tagCloudContainer');
        if (!container) return;
        const tagsMap = getTagsMap();
        const tagCounts = {};
        Object.values(tagsMap).forEach(tags => {
            tags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
        });
        const uniqueTags = Object.keys(tagCounts);
        if (uniqueTags.length === 0) {
            container.innerHTML = `<span class="text-[11px] text-slate-500 px-1">尚無任何標籤</span>`;
            return;
        }
        let html = `<span onclick="filterByTag(null)" class="cursor-pointer px-2 py-1 rounded-lg text-[11px] transition ${!S.currentTagFilter ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">全部標籤</span>`;
        uniqueTags.forEach(tag => {
            const isActive = (S.currentTagFilter === tag);
            const encTag = U.encodeInlineArg(tag);
            html += `<span onclick="filterByTag('${encTag}')" class="cursor-pointer px-2 py-1 rounded-lg text-[11px] transition flex items-center space-x-1 ${isActive ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"><span>#${U.escapeHtmlAttr(tag)}</span><span class="text-[9px] opacity-70">(${tagCounts[tag]})</span></span>`;
        });
        container.innerHTML = html;
    }

    function filterByTag(encodedTag) {
        S.currentTagFilter = encodedTag === null ? null : U.safeDecodeURI(encodedTag);
        S.currentPage = 1;
        S.pendingScrollToCurrentSong = false;
        renderCategories();
        renderTagCloud();
        window.MP3Table.renderTable();
        updateMobileFilterBadge();
        closeDrawerIfMobile();
    }

    /* ============================================================
     * 八、标签编辑
     * ============================================================ */
    async function editSongTags(encodedKey, encodedName) {
        const uniqueKey = U.safeDecodeURI(encodedKey);
        const file = S.allFiles.find(f => U.getFileKey(f) === uniqueKey);
        if (!file) return;
        const displayName = U.safeDecodeURI(encodedName);
        const tagsMap = getTagsMap();
        const currentTags = tagsMap[uniqueKey] || [];
        const inputTags = await window.showCustomModal({
            title: '管理媒體標籤',
            subtitle: displayName,
            message: '請輸入標籤（多個標籤請用半形逗號 , 隔開）：',
            type: 'confirm',
            isPrompt: true,
            defaultValue: currentTags.join(', '),
            confirmText: '儲存標籤'
        });
        if (inputTags === null) return;
        const newTags = inputTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
        if (newTags.length > 0) tagsMap[uniqueKey] = [...new Set(newTags)];
        else delete tagsMap[uniqueKey];
        saveTagsMap(tagsMap);
        window.loadFiles(false);
    }

    function manageTagsPrompt() {
        window.showCustomModal({
            title: '標籤管理提示',
            message: '點擊每個媒體右側的「+標籤」按鈕可新增或修改標籤，點擊左側標籤即可過濾。',
            type: 'info'
        });
    }

    /* ============================================================
     * 九、喜欢 / 隐藏
     * ============================================================ */
    function toggleLike(encodedKey, event) {
        if (event) event.stopPropagation();
        const uniqueKey = U.safeDecodeURI(encodedKey);
        const file = S.allFiles.find(f => U.getFileKey(f) === uniqueKey);
        if (!file) return;
        file.isLiked = !file.isLiked;
        if (file.isLiked && file.isDisliked) {
            file.isDisliked = false;
            const dislikedMap = getDislikedMap();
            delete dislikedMap[uniqueKey];
            saveDislikedMap(dislikedMap);
        }
        const likedMap = getLikedMap();
        if (file.isLiked) {
            const existing = likedMap[uniqueKey];
            const existingTs = (existing && typeof existing === 'object' && typeof existing.ts === 'number') ? existing.ts : null;
            const ts = existingTs || Date.now();
            likedMap[uniqueKey] = { ts };
            file.likedAt = ts;
        } else {
            delete likedMap[uniqueKey];
            file.likedAt = null;
        }
        saveLikedMap(likedMap);
        if (S.currentPlayingFile === uniqueKey) {
            updatePlayerLikeState();
            updatePlayerDislikeState();
        }
        renderCategories();
        window.MP3Table.renderTable();
        S.emit(file.isLiked ? 'liked' : 'unliked', file);
    }

    function toggleFileDislike(encodedKey) {
        const uniqueKey = U.safeDecodeURI(encodedKey);
        const file = S.allFiles.find(f => U.getFileKey(f) === uniqueKey);
        if (!file) return;
        file.isDisliked = !file.isDisliked;
        const dislikedMap = getDislikedMap();
        if (file.isDisliked) {
            dislikedMap[uniqueKey] = true;
            if (file.isLiked) {
                file.isLiked = false;
                file.likedAt = null;
                const likedMap = getLikedMap();
                delete likedMap[uniqueKey];
                saveLikedMap(likedMap);
            }
        } else {
            delete dislikedMap[uniqueKey];
        }
        saveDislikedMap(dislikedMap);
        if (S.currentPlayingFile === uniqueKey) {
            updatePlayerLikeState();
            updatePlayerDislikeState();
            const audioPlayer = document.getElementById('audioPlayer');
            if (file.isDisliked && audioPlayer && !audioPlayer.paused) window.MP3Player.playNext();
        }
        renderCategories();
        window.MP3Table.renderTable();
    }

    function togglePlayerLike() {
        if (!S.currentPlayingFile) return;
        toggleLike(U.encodeInlineArg(S.currentPlayingFile));
    }
    function togglePlayerDislike() {
        if (!S.currentPlayingFile) return;
        toggleFileDislike(U.encodeInlineArg(S.currentPlayingFile));
    }

    function updatePlayerLikeState() {
        const btn = document.getElementById('playerLikeBtn');
        const icon = document.getElementById('playerLikeIcon');
        if (!btn || !icon) return;
        if (!S.currentPlayingFile) { btn.classList.add('hidden'); return; }
        btn.classList.remove('hidden');
        const file = S.allFiles.find(f => U.getFileKey(f) === S.currentPlayingFile);
        if (file && file.isLiked) {
            icon.className = 'fa-solid fa-heart text-rose-500';
            btn.title = file.likedAt
                ? `取消最愛（收藏于 ${U.formatLikedAtDate(file.likedAt)}）`
                : '取消最愛 (L)';
        } else {
            icon.className = 'fa-regular fa-heart text-slate-500 hover:text-slate-300';
            btn.title = '加入最愛 (L)';
        }
    }

    function updatePlayerDislikeState() {
        const btn = document.getElementById('playerDislikeBtn');
        const icon = document.getElementById('playerDislikeIcon');
        if (!btn || !icon) return;
        if (!S.currentPlayingFile) { btn.classList.add('hidden'); return; }
        btn.classList.remove('hidden');
        const file = S.allFiles.find(f => U.getFileKey(f) === S.currentPlayingFile);
        if (file && file.isDisliked) {
            icon.className = 'fa-solid fa-thumbs-down text-amber-400';
            btn.title = '取消隱藏';
        } else {
            icon.className = 'fa-regular fa-thumbs-down text-slate-500 hover:text-amber-400';
            btn.title = '隱藏此媒體';
        }
    }

    /* ============================================================
     * 十、对外导出
     * ============================================================ */
    window.MP3Categories = {
        // 侧栏 / 抽屉
        setupSidebarCards,
        toggleSidebarCard,
        toggleMobileDrawer,
        closeDrawerIfMobile,
        toggleEmptyCategories,
        // 分类
        renderCategories,
        renderTagCloud,
        filterCategory,
        filterByTag,
        addNewCategory,
        deleteCategory,
        saveCategories,
        // 标签
        editSongTags,
        manageTagsPrompt,
        getTagsMap,
        saveTagsMap,
        // 喜欢 / 隐藏
        toggleLike,
        toggleFileDislike,
        togglePlayerLike,
        togglePlayerDislike,
        updatePlayerLikeState,
        updatePlayerDislikeState,
        getLikedMap,
        saveLikedMap,
        getDislikedMap,
        saveDislikedMap
    };

    /* ---------- 兼容既有 HTML onclick / 插件直接调用 ---------- */
    window.setupSidebarCards = setupSidebarCards;
    window.toggleSidebarCard = toggleSidebarCard;
    window.toggleMobileDrawer = toggleMobileDrawer;
    window.toggleEmptyCategories = toggleEmptyCategories;

    window.renderCategories = renderCategories;
    window.renderTagCloud = renderTagCloud;
    window.filterCategory = filterCategory;
    window.filterByTag = filterByTag;
    window.addNewCategory = addNewCategory;
    window.deleteCategory = deleteCategory;
    window.editSongTags = editSongTags;
    window.manageTagsPrompt = manageTagsPrompt;

    window.toggleLike = toggleLike;
    window.toggleFileDislike = toggleFileDislike;
    window.togglePlayerLike = togglePlayerLike;
    window.togglePlayerDislike = togglePlayerDislike;
    window.updatePlayerLikeState = updatePlayerLikeState;
    window.updatePlayerDislikeState = updatePlayerDislikeState;

    console.log('[MP3Categories] ready');
})();