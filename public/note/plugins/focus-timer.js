(function () {
  'use strict';
  if (window.__sfFocusTimerLoaded) return; window.__sfFocusTimerLoaded = true;
  function boot() {
    if (typeof appState === 'undefined' || !window.SparkFlowSDK) return;
    if (!appState.plugins.some(p => p.id === 'focus-timer')) {
      SparkFlowSDK.register({ id: 'focus-timer', emoji: '🍅', name: '极简番茄专注钟', desc: '在工作目标卡片挂载 25 分钟倒计时', actionType: 'timer', actionText: '专注 25 分钟' });
    }
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else setTimeout(boot, 0);
})();