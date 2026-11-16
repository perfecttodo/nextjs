(function () {
  'use strict';
  if (window.__sfAiSummaryLoaded) return; window.__sfAiSummaryLoaded = true;
  function boot() {
    if (typeof appState === 'undefined' || !window.SparkFlowSDK) return;
    if (!appState.plugins.some(p => p.id === 'ai-summary')) {
      SparkFlowSDK.register({ id: 'ai-summary', emoji: '✨', name: 'AI 灵感提炼', desc: '自动归纳核心要点并生成可执行行动项', actionType: 'toast', actionText: '✨ AI 已提炼核心要点与行动建议' });
    }
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else setTimeout(boot, 0);
})();