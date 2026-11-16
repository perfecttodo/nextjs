(function () {
  'use strict';
  if (window.__sfDailyReviewLoaded) return; window.__sfDailyReviewLoaded = true;
  function boot() {
    if (typeof appState === 'undefined' || !window.SparkFlowSDK) return;
    if (!appState.plugins.some(p => p.id === 'daily-review')) {
      SparkFlowSDK.register({ id: 'daily-review', emoji: '📊', name: '每日灵感复盘', desc: '在顶部导航栏挂载今日数据复盘入口', actionType: 'review', actionText: '打开复盘' });
    }
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else setTimeout(boot, 0);
})();