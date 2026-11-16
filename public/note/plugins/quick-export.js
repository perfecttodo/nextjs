(function () {
  'use strict';
  if (window.__sfQuickExportLoaded) return; window.__sfQuickExportLoaded = true;
  function boot() {
    if (typeof appState === 'undefined' || !window.SparkFlowSDK) return;
    if (!appState.plugins.some(p => p.id === 'quick-export')) {
      SparkFlowSDK.register({ id: 'quick-export', emoji: '📋', name: 'Markdown 笔记导出', desc: '在思考详情页挂载一键复制或下载 .md 文件', actionType: 'export', actionText: '导出 Markdown' });
    }
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else setTimeout(boot, 0);
})();