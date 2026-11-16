(function () {
  'use strict';
  if (window.__sfAutoTaggerLoaded) return; window.__sfAutoTaggerLoaded = true;
  function boot() {
    if (typeof appState === 'undefined' || !window.SparkFlowSDK) return;
    if (!appState.plugins.some(p => p.id === 'auto-tagger')) {
      SparkFlowSDK.register({ id: 'auto-tagger', emoji: '🏷️', name: '智能关键词自动归类', desc: '保存灵感时自动扫描关键词并补充分类标签', actionType: 'tag', actionText: '自动归类' });
    }
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else setTimeout(boot, 0);
})();