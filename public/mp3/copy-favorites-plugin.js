/**
 * 複製我的最愛插件 v1.0
 * 
 * 功能：
 *  - 把「我的最愛」里的歌曲複製到指定本地目錄
 *  - 多來源（多 API / 多目錄）自動分組，各自調用對應的 /copy-favorites
 *  - 每 30 秒刷新一次「已收藏 N 首」顯示（輕量）
 * 
 * 依賴：
 *  - window.MP3AppExtension.allFiles
 *  - window.MP3AppExtension.getLikedMap()
 *  - window.MP3AppExtension.getFileKey / getFileRequestParams
 *  - window.MP3AppExtension.showCustomModal
 * 
 * 不註冊 dataSource，不往 allFiles 塞數據。
 */
(function () {
    'use strict';

    let uiRoot = null;
    let countInterval = null;

    // ==================== 工具 ====================
    function getExt() {
        return window.MP3AppExtension || null;
    }

    function showModal(opts) {
        const ext = getExt();
        if (ext && typeof ext.showCustomModal === 'function') {
            return ext.showCustomModal(opts);
        }
        if (typeof window.showCustomModal === 'function') {
            return window.showCustomModal(opts);
        }
        // 最后兜底：原生 prompt
        if (opts.isPrompt) {
            const v = window.prompt(opts.title || '', opts.defaultValue || '');
            return Promise.resolve(v);
        }
        window.alert(opts.message || opts.title || '');
        return Promise.resolve(true);
    }

    function setStatus(msg, tone) {
        if (!uiRoot) return;
        const el = uiRoot.querySelector('.cf-status');
        if (!el) return;
        el.textContent = msg || '';
        el.className = 'cf-status text-[10px] min-h-[0.75rem] break-all ' + (
            tone === 'error' ? 'text-rose-400' :
            tone === 'success' ? 'text-emerald-400' :
            tone === 'warn' ? 'text-amber-400' :
            'text-slate-500'
        );
    }

    function countLiked() {
        const ext = getExt();
        if (!ext || typeof ext.getLikedMap !== 'function') return 0;
        try {
            const map = ext.getLikedMap() || {};
            return Object.keys(map).length;
        } catch (e) { return 0; }
    }

    function updateCountUI() {
        if (!uiRoot) return;
        const el = uiRoot.querySelector('.cf-count');
        if (el) el.textContent = `${countLiked()} 首`;
    }

    // ==================== 核心：复制我的最愛 ====================
    async function copyFavorites() {
        const ext = getExt();
        if (!ext) { setStatus('主应用未就绪', 'error'); return; }

        // 点击前刷新一次计数
        updateCountUI();

        let likedMap = {};
        try {
            likedMap = ext.getLikedMap ? ext.getLikedMap() : {};
        } catch (e) { likedMap = {}; }
        const likedKeys = Object.keys(likedMap || {});

        if (likedKeys.length === 0) {
            await showModal({
                title: '提示',
                message: '目前沒有任何「我的最愛」歌曲可供複製！',
                type: 'info'
            });
            return;
        }

        const allFiles = ext.allFiles || [];
        const getFileKey = typeof ext.getFileKey === 'function'
            ? ext.getFileKey
            : (f) => (f && (f._key || f.relativePath || f.filename)) || '';

        const getParams = typeof ext.getFileRequestParams === 'function'
            ? ext.getFileRequestParams
            : (f) => ({
                apiBase: (typeof ext.getMp3ApiBase === 'function' ? ext.getMp3ApiBase() : '/api/mp3'),
                dir: (typeof ext.getCurrentDir === 'function' ? ext.getCurrentDir() : ''),
                originalKey: (f && (f.relativePath || f.filename)) || ''
            });

        // 按 (apiBase, dir) 分组
        const groups = new Map();
        let mappedCount = 0;
        likedKeys.forEach(uniqueKey => {
            const file = allFiles.find(f => getFileKey(f) === uniqueKey);
            if (!file) return;
            const { apiBase, dir, originalKey } = getParams(file);
            if (!dir || !originalKey) return;
            mappedCount++;
            const gKey = apiBase + '\x00' + dir;
            if (!groups.has(gKey)) groups.set(gKey, { apiBase, dir, filenames: [] });
            groups.get(gKey).filenames.push(originalKey);
        });

        if (groups.size === 0) {
            await showModal({
                title: '无法复制',
                message:
                    `「我的最愛」有 ${likedKeys.length} 首，` +
                    `但当前列表里找不到对应的本地来源。\n\n` +
                    `可能原因：\n` +
                    `• 这些歌是云端来源（Google Drive / News 等），本身不在本地\n` +
                    `• 「本地目錄」插件未启用或未加载对应目录\n\n` +
                    `请先加载对应的本地目录，再回到这里复制。`,
                type: 'warning'
            });
            return;
        }

        // 询问目标目录
        const savedTargetDir = localStorage.getItem('mp3_copy_target_dir') || '';
        const subtitleParts = [`共選定 ${likedKeys.length} 首`];
        if (groups.size > 1) subtitleParts.push(`分屬 ${groups.size} 個來源`);
        if (mappedCount < likedKeys.length) subtitleParts.push(`${likedKeys.length - mappedCount} 首找不到本地来源`);

        const targetDir = await showModal({
            title: '複製我的最愛',
            subtitle: subtitleParts.join('，'),
            message: '請輸入要複製過去的目標資料夾絕對路徑：',
            type: 'confirm',
            isPrompt: true,
            defaultValue: savedTargetDir,
            confirmText: '開始複製'
        });

        if (!targetDir || !String(targetDir).trim()) return;
        const trimmedTargetDir = String(targetDir).trim();
        localStorage.setItem('mp3_copy_target_dir', trimmedTargetDir);

        setStatus(`正在複製 ${mappedCount} 首到 ${trimmedTargetDir}…`);

        let totalSuccess = 0;
        const errors = [];
        let groupIndex = 0;
        const totalGroups = groups.size;

        for (const { apiBase, dir, filenames } of groups.values()) {
            groupIndex++;
            if (totalGroups > 1) {
                setStatus(`(${groupIndex}/${totalGroups}) ${dir} — 复制 ${filenames.length} 首…`);
            }
            try {
                const res = await fetch(`${apiBase}/copy-favorites`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sourceDir: dir,
                        targetDir: trimmedTargetDir,
                        filenames
                    })
                });
                const data = await res.json();
                if (data.success) {
                    totalSuccess += (data.successCount || 0);
                } else {
                    errors.push(`${dir}: ${data.error || '未知错误'}`);
                }
            } catch (e) {
                errors.push(`${dir}: ${e.message}`);
            }
        }

        if (errors.length === 0) {
            setStatus(`✅ 已複製 ${totalSuccess} 首到 ${trimmedTargetDir}`, 'success');
            await showModal({
                title: '複製完成',
                message: `已成功複製 ${totalSuccess} 首到 ${trimmedTargetDir}`,
                type: 'success'
            });
        } else {
            setStatus(`⚠️ 部分失败：成功 ${totalSuccess} 首`, 'warn');
            await showModal({
                title: '部分失敗',
                message:
                    `成功 ${totalSuccess} 首\n` +
                    `错误来源：\n${errors.join('\n')}`,
                type: 'error'
            });
        }
    }

    // ==================== UI ====================
    function injectUI() {
        return new Promise((resolve) => {
            function tryInject() {
                const body = window.MP3PluginManager && window.MP3PluginManager.getBodyContainer
                    ? window.MP3PluginManager.getBodyContainer('copyFav')
                    : null;
                if (!body) { setTimeout(tryInject, 300); return; }
                if (uiRoot) { resolve(); return; }

                uiRoot = document.createElement('div');
                uiRoot.className = 'space-y-1.5';
                uiRoot.innerHTML = `
                    <p class="text-[10px] text-slate-500 leading-relaxed">
                        把「我的最愛」里的歌曲複製到指定本地目錄。多來源自動分組，各自呼叫對應的 API。
                    </p>
                    <div class="flex items-center justify-between gap-2">
                        <span class="text-[11px] text-slate-400">
                            已收藏 <b class="cf-count text-rose-400">0 首</b>
                        </span>
                        <button class="cf-copy-btn bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fa-solid fa-copy mr-1"></i>複製到目錄…
                        </button>
                    </div>
                    <p class="cf-status text-[10px] text-slate-500 min-h-[0.75rem] break-all"></p>
                `;
                body.appendChild(uiRoot);

                uiRoot.querySelector('.cf-copy-btn').addEventListener('click', () => {
                    copyFavorites().catch((e) => setStatus('复制失败：' + e.message, 'error'));
                });

                updateCountUI();
                resolve();
            }
            tryInject();
        });
    }

    // ==================== 对外 API ====================
    window.MP3CopyFavoritesPlugin = {
        version: '1.0.0',
        async init() {
            await injectUI();
            updateCountUI();
            // 每 30 秒刷新一次计数（轻量，避免过度轮询）
            countInterval = setInterval(updateCountUI, 30000);
        },
        async unload() {
            if (countInterval) { clearInterval(countInterval); countInterval = null; }
            if (uiRoot) { uiRoot.remove(); uiRoot = null; }
        },
        // 供外部调用（可选）
        copyFavorites,
        refreshCount: updateCountUI
    };
})();