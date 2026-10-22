/* ═══════════════════════════════════════════════════════════
   loader.js — Shadow DOM 子页面加载器（作用域修复版）
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

var loadedSubPages = {};
var currentSubPageHref = null;

function isSubPageHref(href){
  if (!href) return false;
  if (/^https?:\/\//i.test(href)) return false;
  if (href.charAt(0) === '#') return false;
  if (!/\.html?(\?|#|$)/i.test(href)) return false;
  var cur = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var tgt = href.split('?')[0].split('#')[0].replace(/^\.\//, '').split('/').pop().toLowerCase();
  if (cur === tgt) return false;
  return true;
}

function loadSubPage(href){
  currentSubPageHref = href;
  window.__CURRENT_SUB_PAGE__ = href;

  var TAB_NAMES = ['trip','list','places','stats','airport'];
  TAB_NAMES.forEach(function(t){
    var tabEl = document.getElementById('tab-' + t);
    if (tabEl) tabEl.classList.add('hidden');
    var btn = document.getElementById('nav-' + t);
    if (btn){
      btn.className = 'flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition';
      var label = btn.querySelector('span:last-child');
      if (label) label.className = 'text-[11px] font-medium mt-1';
    }
  });

  document.getElementById('main-tab-content').classList.add('hidden');
  var container = document.getElementById('sub-page-container');
  container.classList.remove('hidden');

  window.__SUB_PAGE_BACK__ = function(){
    if (typeof window.switchTabOriginal === 'function'){
      window.switchTabOriginal(window.currentTab || 'trip');
    }
    window.scrollTo(0, 0);
  };

  if (loadedSubPages[href]){
    Object.keys(loadedSubPages).forEach(function(k){
      loadedSubPages[k].host.style.display = 'none';
    });
    loadedSubPages[href].host.style.display = 'block';
    window.scrollTo(0, 0);
    return;
  }

  var loadingEl = document.createElement('div');
  loadingEl.className = 'py-20 text-center';
  loadingEl.innerHTML = '<div class="ico w-8 h-8 mx-auto text-amber-500 animate-spin" data-icon="loader"></div><p class="text-xs text-slate-500 mt-2">載入中...</p>';
  container.appendChild(loadingEl);
  if (typeof window.hydrateIcons === 'function') window.hydrateIcons();
  window.scrollTo(0, 0);

  fetch(href)
    .then(function(res){ if (!res.ok) throw new Error('HTTP ' + res.status); return res.text(); })
    .then(function(html){ if (loadingEl.parentNode) loadingEl.remove(); mountSubPage(href, html, container); })
    .catch(function(err){
      if (loadingEl.parentNode) loadingEl.remove();
      var errEl = document.createElement('div');
      errEl.className = 'max-w-md mx-auto p-4';
      var msg = (err && err.message) ? err.message : '未知錯誤';
      errEl.innerHTML = '<div class="bg-white rounded-2xl p-8 text-center border border-rose-200 text-rose-500 space-y-2"><div class="ico w-10 h-10 mx-auto text-rose-300" data-icon="alert-triangle"></div><p class="text-sm font-medium">載入失敗</p><p class="text-xs">' + msg + '</p><button onclick="window.__SUB_PAGE_BACK__ && window.__SUB_PAGE_BACK__()" class="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg text-xs">返回首頁</button></div>';
      container.appendChild(errEl);
      if (typeof window.hydrateIcons === 'function') window.hydrateIcons();
    });
}

function loadExternalScript(src){
  return new Promise(function(resolve, reject){
    if (document.querySelector('script[src="' + src + '"]')){
      resolve(); return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = function(){ resolve(); };
    s.onerror = function(){ reject(new Error('Failed: ' + src)); };
    document.head.appendChild(s);
  });
}

function mountSubPage(href, html, container){
  var doc = new DOMParser().parseFromString(html, 'text/html');

  doc.querySelectorAll('header').forEach(function(el){ el.remove(); });
  ['#side-drawer', '#drawer-overlay'].forEach(function(sel){
    var el = doc.querySelector(sel);
    if (el) el.remove();
  });

  var host = document.createElement('div');
  host.className = 'subpage-host';
  host.style.cssText = 'width:100%;display:block;';
  var shadow = host.attachShadow({ mode: 'open' });
  container.appendChild(host);

  var styleContent = Array.prototype.map.call(doc.querySelectorAll('head style'), function(s){ return s.textContent; }).join('\n');
  var styleEl = document.createElement('style');
  styleEl.textContent = styleContent + '\n:host{display:block;}\n.subpage-body{padding-bottom:4rem;}\nbody{padding-bottom:0 !important;min-height:auto !important;}';
  shadow.appendChild(styleEl);

  var bodyDiv = document.createElement('div');
  bodyDiv.className = 'subpage-body';
  bodyDiv.innerHTML = doc.body.innerHTML;
  shadow.appendChild(bodyDiv);

  bodyDiv.querySelectorAll('[onclick]').forEach(function(el){
    el.dataset.onclick = el.getAttribute('onclick');
    el.removeAttribute('onclick');
  });

  var inlineScripts = '';
  var externalScripts = [];

  bodyDiv.querySelectorAll('script').forEach(function(s){
    if (s.src){ externalScripts.push(s.src); }
    else { inlineScripts += '\n' + s.textContent; }
    s.remove();
  });

  var ns = 'page_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  window.__SHADOW_POOL__ = window.__SHADOW_POOL__ || {};
  window.__SHADOW_POOL__[ns] = shadow;

  var run = function(){
    /* ★★★ 关键：click 绑定定义在 inlineScripts 同一个 try 块内 ★★★ */
    var wrapped =
      '(function(__realWin__, __realDoc__){\n' +
      '  var __shadow__ = __realWin__.__SHADOW_POOL__["' + ns + '"];\n' +
      '  var __bodyDiv__ = __shadow__.querySelector(".subpage-body");\n' +
      '  var window = __realWin__;\n' +
      '  var document = {\n' +
      '    getElementById: function(id){ return __shadow__.getElementById(id); },\n' +
      '    querySelector: function(sel){ return __shadow__.querySelector(sel); },\n' +
      '    querySelectorAll: function(sel){ return __shadow__.querySelectorAll(sel); },\n' +
      '    addEventListener: function(type, handler, opts){\n' +
      '      if (type === "DOMContentLoaded"){\n' +
      '        setTimeout(function(){ try { handler.call(window, {type:"DOMContentLoaded"}); } catch(e){ console.error("[' + ns + '] DOMContentLoaded", e); } }, 0);\n' +
      '        return;\n' +
      '      }\n' +
      '      __shadow__.addEventListener(type, handler, opts);\n' +
      '    },\n' +
      '    removeEventListener: function(t,h,o){ __shadow__.removeEventListener(t,h,o); },\n' +
      '    createElement: function(tag){ return __realDoc__.createElement(tag); },\n' +
      '    createTextNode: function(t){ return __realDoc__.createTextNode(t); },\n' +
      '    body: __bodyDiv__, head: __shadow__,\n' +
      '    documentElement: __realDoc__.documentElement,\n' +
      '    readyState: "complete", hidden: __realDoc__.hidden, activeElement: __realDoc__.activeElement\n' +
      '  };\n' +
      '  var localStorage = __realWin__.localStorage;\n' +
      '  var navigator = __realWin__.navigator;\n' +
      '  var location = __realWin__.location;\n' +
      '  var fetch = __realWin__.fetch.bind(__realWin__);\n' +
      '  var setTimeout = __realWin__.setTimeout.bind(__realWin__);\n' +
      '  var clearTimeout = __realWin__.clearTimeout.bind(__realWin__);\n' +
      '  var setInterval = __realWin__.setInterval.bind(__realWin__);\n' +
      '  var clearInterval = __realWin__.clearInterval.bind(__realWin__);\n' +
      '  var console = __realWin__.console;\n' +
      '  var URL = __realWin__.URL;\n' +
      '  var URLSearchParams = __realWin__.URLSearchParams;\n' +
      '  var encodeURIComponent = __realWin__.encodeURIComponent;\n' +
      '  var decodeURIComponent = __realWin__.decodeURIComponent;\n' +
      '  var Date = __realWin__.Date;\n' +
      '  var Math = __realWin__.Math;\n' +
      '  var JSON = __realWin__.JSON;\n' +
      '  var Object = __realWin__.Object;\n' +
      '  var Array = __realWin__.Array;\n' +
      '  var String = __realWin__.String;\n' +
      '  var Number = __realWin__.Number;\n' +
      '  var isNaN = __realWin__.isNaN;\n' +
      '  var parseInt = __realWin__.parseInt;\n' +
      '  var parseFloat = __realWin__.parseFloat;\n' +
      '  var RegExp = __realWin__.RegExp;\n' +
      '  var Promise = __realWin__.Promise;\n' +
      '  var Error = __realWin__.Error;\n' +
      '  var Blob = __realWin__.Blob;\n' +
      '  var File = __realWin__.File;\n' +
      '  var FormData = __realWin__.FormData;\n' +
      '  var TextEncoder = __realWin__.TextEncoder;\n' +
      '  var crypto = __realWin__.crypto;\n' +
      '  var btoa = __realWin__.btoa;\n' +
      '  var atob = __realWin__.atob;\n' +
      '  var Uint8Array = __realWin__.Uint8Array;\n' +
      '  function confirm(msg){ return __realWin__.confirm(msg); }\n' +
      '  function alert(msg){ return __realWin__.alert(msg); }\n' +
      '\n' +
      /* ── try 块：inlineScripts 与 click 绑定同在此作用域内 ── */
      '  var __bindDone__ = false;\n' +
      '  try {\n' +
      inlineScripts + '\n' +
      '\n' +
      /* 关键：绑定函数定义在 try 块内，所以闭包能访问 try 块里 const/let 声明的所有函数 */
      '    (function __bindClick__(){\n' +
      '      function __bind__(el){\n' +
      '        if (!el || !el.dataset || !el.dataset.onclick || el.__subBound__) return;\n' +
      '        el.__subBound__ = true;\n' +
      '        var __code__ = el.dataset.onclick;\n' +
      '        el.addEventListener("click", function(e){\n' +
      '          e.stopPropagation();\n' +
      '          try { eval(__code__); }\n' +
      '          catch(err){ console.error("[' + ns + '] onclick error:", err, __code__); }\n' +
      '        });\n' +
      '      }\n' +
      '      __shadow__.querySelectorAll("[data-onclick]").forEach(__bind__);\n' +
      '      var mo = new MutationObserver(function(muts){\n' +
      '        muts.forEach(function(m){\n' +
      '          m.addedNodes.forEach(function(node){\n' +
      '            if (!node || node.nodeType !== 1) return;\n' +
      '            if (node.matches && node.matches("[data-onclick]")) __bind__(node);\n' +
      '            if (node.querySelectorAll) node.querySelectorAll("[data-onclick]").forEach(__bind__);\n' +
      '          });\n' +
      '        });\n' +
      '      });\n' +
      '      mo.observe(__shadow__, { childList:true, subtree:true });\n' +
      '    })();\n' +
      '    __bindDone__ = true;\n' +
      '  } catch(e){ console.error("[' + ns + '] script error:", e); }\n' +
      '\n' +
      /* ── fallback：如果 try 块抛错（bindDone=false），用 IIFE 顶层绑定 ── */
      '  if (!__bindDone__){\n' +
      '    console.warn("[' + ns + '] using fallback binding (only function-declared handlers will work)");\n' +
      '    (function __bindFallback__(){\n' +
      '      function __bind__(el){\n' +
      '        if (!el || !el.dataset || !el.dataset.onclick || el.__subBound__) return;\n' +
      '        el.__subBound__ = true;\n' +
      '        var __code__ = el.dataset.onclick;\n' +
      '        el.addEventListener("click", function(e){\n' +
      '          e.stopPropagation();\n' +
      '          try { eval(__code__); }\n' +
      '          catch(err){ console.error("[' + ns + '] onclick fallback error:", err, __code__); }\n' +
      '        });\n' +
      '      }\n' +
      '      __shadow__.querySelectorAll("[data-onclick]").forEach(__bind__);\n' +
      '      var mo2 = new MutationObserver(function(muts){\n' +
      '        muts.forEach(function(m){\n' +
      '          m.addedNodes.forEach(function(node){\n' +
      '            if (!node || node.nodeType !== 1) return;\n' +
      '            if (node.matches && node.matches("[data-onclick]")) __bind__(node);\n' +
      '            if (node.querySelectorAll) node.querySelectorAll("[data-onclick]").forEach(__bind__);\n' +
      '          });\n' +
      '        });\n' +
      '      });\n' +
      '      mo2.observe(__shadow__, { childList:true, subtree:true });\n' +
      '    })();\n' +
      '  }\n' +
      '\n' +
      '  try { window.goBack = function(){ if (__realWin__.__SUB_PAGE_BACK__) __realWin__.__SUB_PAGE_BACK__(); }; } catch(e){}\n' +
      '  try { window.goHome = function(){ if (__realWin__.__SUB_PAGE_BACK__) __realWin__.__SUB_PAGE_BACK__(); }; } catch(e){}\n' +
      '})(window, document);\n';

    var scriptEl = document.createElement('script');
    scriptEl.textContent = wrapped;
    document.head.appendChild(scriptEl);
  };

  if (externalScripts.length){
    var chain = Promise.resolve();
    externalScripts.forEach(function(src){
      chain = chain.then(function(){ return loadExternalScript(src); });
    });
    chain.then(run).catch(function(err){
      console.error('[loader] external script error:', err);
      run();
    });
  } else {
    run();
  }

  loadedSubPages[href] = { host: host, shadow: shadow, ns: ns };
}

function hideAllSubPages(){
  currentSubPageHref = null;
  window.__CURRENT_SUB_PAGE__ = null;
  Object.keys(loadedSubPages).forEach(function(k){
    loadedSubPages[k].host.style.display = 'none';
  });
  var container = document.getElementById('sub-page-container');
  if (container) container.classList.add('hidden');
  var main = document.getElementById('main-tab-content');
  if (main) main.classList.remove('hidden');
}

function reloadMainData(){
  try {
    if (typeof window.trips !== 'undefined' && Array.isArray(window.trips)){
      window.trips = JSON.parse(localStorage.getItem('taxi_trips')) || [];
    }
    if (typeof window.shiftSettings !== 'undefined'){
      window.shiftSettings = JSON.parse(localStorage.getItem('taxi_shift_settings')) || {};
    }
    if (typeof window.places !== 'undefined'){
      window.places = JSON.parse(localStorage.getItem('taxi_places')) || [];
    }
    if (typeof window.renderTripList === 'function') window.renderTripList();
    if (typeof window.renderPlacesList === 'function') window.renderPlacesList();
    if (typeof window.updateStatsAndNet === 'function') window.updateStatsAndNet();
    if (typeof window.initSettingsForm === 'function') window.initSettingsForm();
    if (typeof window.updateHeaderWorked === 'function') window.updateHeaderWorked();
    if (typeof window.updateDateTimePreview === 'function') window.updateDateTimePreview();
  } catch(e){ console.warn('[reloadMainData]', e); }
}

window.handleDrawerItem = function(id){
  var items = window.DRAWER_ITEMS || [];
  var item = items.find(function(x){ return x.id === id; });
  if (typeof window.closeDrawer === 'function') window.closeDrawer();
  if (!item) return;

  setTimeout(function(){
    if (item.href){
      if (isSubPageHref(item.href)){
        loadSubPage(item.href);
      } else {
        var from = encodeURIComponent(window.location.href);
        var sep = item.href.indexOf('?') === -1 ? '?' : '&';
        window.location.href = item.href + sep + 'from=' + from;
      }
      return;
    }
    if (item.tab) window.switchTab(item.tab);
    else if (typeof window.showToast === 'function') window.showToast('此功能開發中');
  }, 280);
};

if (typeof window.switchTab === 'function'){
  window.switchTabOriginal = window.switchTab;
}

window.switchTab = function(tabName){
  if (currentSubPageHref){
    hideAllSubPages();
    reloadMainData();
  }
  if (typeof window.switchTabOriginal === 'function'){
    window.switchTabOriginal(tabName);
  }
};

})();