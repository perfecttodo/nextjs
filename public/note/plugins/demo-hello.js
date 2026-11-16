(function () {
  'use strict';
  if (window.__sfDemoHelloLoaded) return; window.__sfDemoHelloLoaded = true;
  function boot() {
    if (typeof appState === 'undefined' || !window.SparkFlowSDK) return;
    if (!appState.plugins.some(p => p.id === 'demo-hello')) {
      SparkFlowSDK.register({ id: 'demo-hello', emoji: '🧪', name: '一键鼓励', desc: '内置示例：体验动态安装一个自定义卡片动作按钮', actionType: 'toast', actionText: '🎉 这条灵感很棒，继续推进！' });
    }
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else setTimeout(boot, 0);
})();