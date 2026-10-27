/* ═══════════════════════════════════════════════════════════
   loader.js — Shadow DOM 子页面加载器（支持所有 on* 内联事件）
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

var loadedSubPages = {};
var pendingLoads = {};
var currentSubPageHref = null;

/* ★ 预取的 HTML 缓存 ★ */
var htmlCache = Object.create(null);

/* ★ 共享的 constructed stylesheet 缓存（按 CSS 文本去重） ★ */
var sheetCache = (typeof Map !== 'undefined') ? new Map() : null;

/* 需要处理的内联事件类型（onclick / oninput / onchange ...） */
var EVENT_ATTRS = [
  'click','input','change','blur','focus','keydown','keyup','keypress',
  'submit','reset','mouseover','mouseout','mousedown','mouseup','mousemove',
  'touchstart','touchend','touchmove','wheel','scroll',
  'paste','copy','cut','select','load','error','animationend','transitionend'
];

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

/* ★ 空闲时预取抽屉里的子页面 HTML ★ */
function prefetchSubPage(href){
  if (!href || htmlCache[href] || loadedSubPages[href] || pendingLoads[href]) return;
  fetch(href).then(function(r){
    if (!r.ok) return null;
    return r.text();
  }).then(function(t){
    if (t && !htmlCache[href]) htmlCache[href] = t;
  }).catch(function(){});
}

function prefetchAllDrawerPages(){
  var hrefs = (window.DRAWER_ITEMS || [])
    .map(function(x){ return x.href; })
    .filter(function(h){ return h && isSubPageHref(h); });
  var i = 0;
  function next(){
    if (i >= hrefs.length) return;
    prefetchSubPage(hrefs[i++]);
    setTimeout(next, 60); // 串行、错峰，避免抢占首屏带宽
  }
  if ('requestIdleCallback' in window){
    requestIdleCallback(next, { timeout: 2500 });
  } else {
    setTimeout(next, 800);
  }
}

function loadSubPage(href,tabName){
  if (currentSubPageHref === href && loadedSubPages[href]) return;

  currentSubPageHref = href;
  window.__CURRENT_SUB_PAGE__ = href;

  var TAB_NAMES = ['trip','list','places','stats'];
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

  if(tabName){
    var activeNav = document.getElementById('nav-' + tabName);
    if (activeNav){
      activeNav.className = 'flex flex-col items-center justify-center text-amber-500 transition';
      var activeLabel = activeNav.querySelector('span:last-child');
      if (activeLabel) activeLabel.className = 'text-[11px] font-bold mt-1';
    }
  }

  document.getElementById('main-tab-content').classList.add('hidden');
  var container = document.getElementById('sub-page-container');
  container.classList.remove('hidden');

  window.__SUB_PAGE_BACK__ = function(){
    if (typeof window.switchTabOriginal === 'function'){
      window.switchTabOriginal(window.currentTab || 'trip');
    }
    window.scrollTo(0, 0);
  };

  Object.keys(loadedSubPages).forEach(function(k){
    loadedSubPages[k].host.style.display = 'none';
  });
  Object.keys(pendingLoads).forEach(function(k){
    if (pendingLoads[k].loadingEl && pendingLoads[k].loadingEl.parentNode){
      pendingLoads[k].loadingEl.style.display = 'none';
    }
  });

  /* ── 已缓存：直接显示，并用 View Transition 包住刷新 ── */
  if (loadedSubPages[href]){
    var rec = loadedSubPages[href];
    rec.host.style.display = 'block';
    rec.host.style.opacity = '1';

    var entry = window.__PAGE_CAPTURED__ && window.__PAGE_CAPTURED__[rec.ns];
    if (entry){
      var doUpdate = function(){
        try {
          if (entry.showList && entry.showList.length){
            entry.show();                 // 有 pageshow 监听：轻量刷新
          } else if (typeof entry.run === 'function'){
            entry.run();                  // 否则退回全量重跑
          }
        } catch(e){ console.error('[loader] refresh error:', e); }
      };
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (document.startViewTransition && !reduceMotion){
        document.startViewTransition(doUpdate);
      } else {
        doUpdate();
      }
    }
    window.scrollTo(0, 0);
    return;
  }

  /* ── 正在加载：显示 loading，等它完成 ── */
  if (pendingLoads[href]){
    if (pendingLoads[href].loadingEl){
      pendingLoads[href].loadingEl.style.display = 'block';
    }
    window.scrollTo(0, 0);
    return;
  }

  var loadingEl = document.createElement('div');
  loadingEl.className = 'py-20 text-center subpage-loading';
  loadingEl.innerHTML = '<div class="ico w-8 h-8 mx-auto text-amber-500 animate-spin" data-icon="loader"></div><p class="text-xs text-slate-500 mt-2">載入中...</p>';
  container.appendChild(loadingEl);
  if (typeof window.hydrateIcons === 'function') window.hydrateIcons();
  window.scrollTo(0, 0);

  pendingLoads[href] = { loadingEl: loadingEl };

  var htmlPromise;
  if (htmlCache[href]){
    htmlPromise = Promise.resolve(htmlCache[href]);
  } else {
    htmlPromise = fetch(href)
      .then(function(res){
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function(t){
        htmlCache[href] = t;
        return t;
      });
  }

  htmlPromise
    .then(function(html){
      delete pendingLoads[href];
      if (loadedSubPages[href] && loadedSubPages[href].host){
        loadedSubPages[href].host.remove();
        /* 清理旧 ns 的 captured 记录，避免内存泄漏 */
        if (window.__PAGE_CAPTURED__ && loadedSubPages[href].ns){
          delete window.__PAGE_CAPTURED__[loadedSubPages[href].ns];
        }
        delete loadedSubPages[href];
      }
      var shouldShow = (currentSubPageHref === href);
      mountSubPage(href, html, container, shouldShow, loadingEl);
    })
    .catch(function(err){
      delete pendingLoads[href];
      if (loadingEl.parentNode) loadingEl.remove();
      if (currentSubPageHref !== href) return;

      var errEl = document.createElement('div');
      errEl.className = 'max-w-md mx-auto p-4 subpage-error';
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

/* ★ 把元素的所有 on* 内联属性转成 data-on-* ★ */
function extractInlineEvents(el){
  if (!el || !el.getAttributeNames) return;
  EVENT_ATTRS.forEach(function(evt){
    var attr = 'on' + evt;
    if (el.hasAttribute && el.hasAttribute(attr)){
      try {
        var code = el.getAttribute(attr);
        if (code){
          el.setAttribute('data-on-' + evt, code);
        }
      } catch(e){}
      el.removeAttribute(attr);
    }
  });
}

/* ★ 取/缓存 constructed stylesheet ★ */
function getAdoptedSheet(css){
  if (!sheetCache || typeof CSSStyleSheet === 'undefined') return null;
  var s = sheetCache.get(css);
  if (s) return s;
  try {
    s = new CSSStyleSheet();
    s.replaceSync(css);
    sheetCache.set(css, s);
    return s;
  } catch(e){
    return null;
  }
}

function mountSubPage(href, html, container, shouldShow, loadingEl){
  var doc = new DOMParser().parseFromString(html, 'text/html');

  doc.querySelectorAll('header').forEach(function(el){ el.remove(); });
  ['#side-drawer', '#drawer-overlay'].forEach(function(sel){
    var el = doc.querySelector(sel);
    if (el) el.remove();
  });

  var host = document.createElement('div');
  host.className = 'subpage-host';
  /* 统一从 display:none + opacity:0 开始，等 ready 再淡入，避免"空壳闪现" */
  host.style.cssText = 'width:100%;display:none;opacity:0;transition:opacity .2s ease;';
  var shadow = host.attachShadow({ mode: 'open' });
  container.appendChild(host);

  /* ── 样式：优先 adoptedStyleSheets，重复内容只解析一次 ── */
  var styleContent = Array.prototype.map.call(doc.querySelectorAll('head style'), function(s){ return s.textContent; }).join('\n');
  var fullCss = styleContent + '\n:host{display:block;}\n.subpage-body{padding-bottom:4rem;}\nbody{padding-bottom:0 !important;min-height:auto !important;}';
  var adopted = getAdoptedSheet(fullCss);
  if (adopted){
    shadow.adoptedStyleSheets = [adopted];
  } else {
    var styleEl = document.createElement('style');
    styleEl.textContent = fullCss;
    shadow.appendChild(styleEl);
  }

  /* ── body 节点直接搬，不再二次 innerHTML ── */
  var bodyDiv = document.createElement('div');
  bodyDiv.className = 'subpage-body';
  var srcNodes = Array.prototype.slice.call(doc.body.childNodes);
  srcNodes.forEach(function(n){ bodyDiv.appendChild(n); });
  shadow.appendChild(bodyDiv);

  /* ★ 提取所有元素的 on* 属性（不只是 onclick） ★ */
  bodyDiv.querySelectorAll('*').forEach(extractInlineEvents);
  extractInlineEvents(bodyDiv);

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
    var wrapped =
      '(function(__realWin__, __realDoc__){\n' +
      '  var __shadow__ = __realWin__.__SHADOW_POOL__["' + ns + '"];\n' +
      '  var __bodyDiv__ = __shadow__.querySelector(".subpage-body");\n' +
      '  var window = __realWin__;\n' +
      /* ★ 两个收集池：DOMContentLoaded/load 与 pageshow 分开 ★ */
      '  var __captured__ = [];\n' +
      '  var __capturedShow__ = [];\n' +
      '  var document = {\n' +
      '    getElementById: function(id){ return __shadow__.getElementById(id); },\n' +
      '    querySelector: function(sel){ return __shadow__.querySelector(sel); },\n' +
      '    querySelectorAll: function(sel){ return __shadow__.querySelectorAll(sel); },\n' +
      '    addEventListener: function(type, handler, opts){\n' +
      '      if (type === "DOMContentLoaded" || type === "load"){\n' +
      '        __captured__.push({ type: type, handler: handler });\n' +
      '        return;\n' +
      '      }\n' +
      '      if (type === "pageshow"){\n' +
      '        __capturedShow__.push({ type: type, handler: handler });\n' +
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
      '  var MutationObserver = __realWin__.MutationObserver;\n' +
      '  function confirm(msg){ return __realWin__.confirm(msg); }\n' +
      '  function alert(msg){ return __realWin__.alert(msg); }\n' +
      '\n' +
      /* 拦截 window.addEventListener：DOMContentLoaded/load 与 pageshow 分开收集 */
      '  var __origAdd__ = __realWin__.addEventListener;\n' +
      '  __realWin__.addEventListener = function(type, handler, opts){\n' +
      '    if (type === "DOMContentLoaded" || type === "load"){\n' +
      '      __captured__.push({ type: type, handler: handler });\n' +
      '      return;\n' +
      '    }\n' +
      '    if (type === "pageshow"){\n' +
      '      __capturedShow__.push({ type: type, handler: handler });\n' +
      '      return;\n' +
      '    }\n' +
      '    return __origAdd__.call(__realWin__, type, handler, opts);\n' +
      '  };\n' +
      '\n' +
      /* ★★★ 通用事件绑定：处理所有 data-on-* 属性 ★★★ */
      '  var __EVENT_ATTRS__ = ' + JSON.stringify(EVENT_ATTRS) + ';\n' +
      '\n' +
      '  var __bindDone__ = false;\n' +
      '  var __pendingBind__ = [];\n' +
      '  var __bindScheduled__ = false;\n' +
      '  var __flushBind__ = function(){\n' +
      '    __bindScheduled__ = false;\n' +
      '    var list = __pendingBind__;\n' +
      '    __pendingBind__ = [];\n' +
      '    list.forEach(function(node){\n' +
      '      if (!node || node.nodeType !== 1) return;\n' +
      '      __bindAll__(node);\n' +
      '      if (node.querySelectorAll) node.querySelectorAll("*").forEach(__bindAll__);\n' +
      '    });\n' +
      '  };\n' +
      '\n' +
      '  try {\n' +
      /* ★ __bindAll__ 定义在 try 内，eval(code) 作用域链：
         事件回调(含 event 参数) → __bindAll__ → try 块 → IIFE → 全局。
         1) inlineScripts 里 const/let 声明的 download 等函数能被找到；
         2) 回调参数命名为 event，eval 里的 event.stopPropagation() 解析到真实事件对象。 */
      '    var __bindAll__ = function(el){\n' +
      '      if (!el || el.nodeType !== 1) return;\n' +
      '      var names;\n' +
      '      try { names = el.getAttributeNames ? el.getAttributeNames() : []; } catch(e){ return; }\n' +
      '      if (!names.length) return;\n' +
      '      for (var i = 0; i < names.length; i++){\n' +
      '        var name = names[i];\n' +
      '        var evt = null;\n' +
      '        if (name.indexOf("data-on-") === 0){\n' +
      '          evt = name.slice(8);\n' +
      '        } else if (name.indexOf("on") === 0 && __EVENT_ATTRS__.indexOf(name.slice(2)) !== -1){\n' +
      '          evt = name.slice(2);\n' +
      /* 动态节点：先把原生 on* 属性搬到 data-on-*，否则 MutationObserver 只能看到 data-on-* */
      '          try { el.setAttribute("data-on-" + evt, el.getAttribute(name)); } catch(e){}\n' +
      '          try { el.removeAttribute(name); } catch(e){}\n' +
      '        }\n' +
      '        if (!evt) continue;\n' +
      '        var flag = "__bound_" + evt;\n' +
      '        if (el[flag]) continue;\n' +
      '        var code = el.getAttribute("data-on-" + evt);\n' +
      '        if (!code) continue;\n' +
      '        el[flag] = true;\n' +
      '        (function(evtName, evtCode){\n' +
      '          el.addEventListener(evtName, function(event){\n' +
      '            var __self__ = this;\n' +
      '            try {\n' +
      '              var __ret__ = eval(evtCode);\n' +
      '              if (__ret__ === false){\n' +
      '                if (event && event.preventDefault) event.preventDefault();\n' +
      '                if (event && event.stopPropagation) event.stopPropagation();\n' +
      '              }\n' +
      '            } catch(err){\n' +
      '              if (err && err.name === "ReferenceError"){\n' +
      '                try {\n' +
      '                  var __r2__ = new __realWin__.Function("event", evtCode).call(__self__, event);\n' +
      '                  if (__r2__ === false){\n' +
      '                    if (event && event.preventDefault) event.preventDefault();\n' +
      '                    if (event && event.stopPropagation) event.stopPropagation();\n' +
      '                  }\n' +
      '                  return;\n' +
      '                } catch(_e){}\n' +
      '              }\n' +
      '              console.error("[' + ns + '] on" + evtName + " error:", err, evtCode);\n' +
      '            }\n' +
      '          });\n' +
      '        })(evt, code);\n' +
      '      }\n' +
      '    };\n' +
      '\n' +
      inlineScripts + '\n' +
      '\n' +
      /* 初始扫描全部元素并绑定；动态节点用 rAF 合并，避免长列表卡顿 */
      '    (function __bindInit__(){\n' +
      '      __shadow__.querySelectorAll("*").forEach(__bindAll__);\n' +
      '      var mo = new MutationObserver(function(muts){\n' +
      '        muts.forEach(function(m){\n' +
      '          m.addedNodes.forEach(function(node){\n' +
      '            if (node && node.nodeType === 1) __pendingBind__.push(node);\n' +
      '          });\n' +
      '        });\n' +
      '        if (!__pendingBind__.length || __bindScheduled__) return;\n' +
      '        __bindScheduled__ = true;\n' +
      '        var raf = __realWin__.requestAnimationFrame || function(f){ return __realWin__.setTimeout(f, 16); };\n' +
      '        raf(__flushBind__);\n' +
      '      });\n' +
      '      mo.observe(__shadow__, { childList:true, subtree:true });\n' +
      '    })();\n' +
      '    __bindDone__ = true;\n' +
      '\n' +
      /* ★ 把捕获的 handler 存到全局池，供 loader 切回时再次调用 ★ */
      '    __realWin__.__PAGE_CAPTURED__ = __realWin__.__PAGE_CAPTURED__ || {};\n' +
      '    __realWin__.__PAGE_CAPTURED__["' + ns + '"] = {\n' +
      '      list: __captured__,\n' +
      '      showList: __capturedShow__,\n' +
      '      run: function(){\n' +
      '        __captured__.forEach(function(item){\n' +
      '          try { item.handler.call(__realWin__, { type: item.type }); }\n' +
      '          catch(e){ console.error("[' + ns + '] " + item.type + " handler error:", e); }\n' +
      '        });\n' +
      '      },\n' +
      '      show: function(){\n' +
      '        __capturedShow__.forEach(function(item){\n' +
      '          try { item.handler.call(__realWin__, { type: "pageshow" }); }\n' +
      '          catch(e){ console.error("[' + ns + '] pageshow error:", e); }\n' +
      '        });\n' +
      '      }\n' +
      '    };\n' +
      '  } catch(e){ console.error("[' + ns + '] script error:", e); }\n' +
      '  finally {\n' +
      '    __realWin__.addEventListener = __origAdd__;\n' +
      '  }\n' +
      '\n' +
      /* 首次执行：与切回时的刷新共用 entry.run()；无论如何都派发 ready，让 loader 淡入 */
      '  setTimeout(function(){\n' +
      '    var __entry__ = __realWin__.__PAGE_CAPTURED__ && __realWin__.__PAGE_CAPTURED__["' + ns + '"];\n' +
      '    var __origAdd2__ = __realWin__.addEventListener;\n' +
      '    __realWin__.addEventListener = function(type, handler, opts){\n' +
      '      if (type === "DOMContentLoaded" || type === "load"){\n' +
      '        setTimeout(function(){\n' +
      '          try { handler.call(__realWin__, { type: type }); }\n' +
      '          catch(e){ console.error("[' + ns + '] " + type + " handler error:", e); }\n' +
      '        }, 0);\n' +
      '        return;\n' +
      '      }\n' +
      '      return __origAdd2__.call(__realWin__, type, handler, opts);\n' +
      '    };\n' +
      '    try {\n' +
      '      if (__entry__ && __entry__.list && __entry__.list.length) __entry__.run();\n' +
      '    } catch(e){\n' +
      '      console.error("[' + ns + '] run error:", e);\n' +
      '    } finally {\n' +
      '      __realWin__.addEventListener = __origAdd2__;\n' +
      '      try {\n' +
      '        __realWin__.dispatchEvent(new __realWin__.CustomEvent("subpage:ready", { detail: { ns: "' + ns + '" } }));\n' +
      '      } catch(e){}\n' +
      '    }\n' +
      '  }, 0);\n' +
      '\n' +
      /* fallback（try 块抛错时，只处理 onclick），参数名同样为 event */
      '  if (!__bindDone__){\n' +
      '    console.warn("[' + ns + '] using fallback binding");\n' +
      '    (function __bindFallback__(){\n' +
      '      __shadow__.querySelectorAll("[data-on-click]").forEach(function(el){\n' +
      '        if (el.__subBoundC) return;\n' +
      '        el.__subBoundC = true;\n' +
      '        var code = el.getAttribute("data-on-click");\n' +
      '        el.addEventListener("click", function(event){\n' +
      '          try { eval(code); } catch(err){ console.error("[' + ns + '] fallback error:", err, code); }\n' +
      '        });\n' +
      '      });\n' +
      '    })();\n' +
      '  }\n' +
      '\n' +
      '  try { window.goBack = function(){ if (__realWin__.__SUB_PAGE_BACK__) __realWin__.__SUB_PAGE_BACK__(); }; } catch(e){}\n' +
      '  try { window.goHome = function(){ if (__realWin__.__SUB_PAGE_BACK__) __realWin__.__SUB_PAGE_BACK__(); }; } catch(e){}\n' +
      '})(window, document);\n';

    var scriptEl = document.createElement('script');
    scriptEl.textContent = wrapped;
    document.head.appendChild(scriptEl);
    /* 同步执行完毕，立即移除，避免 head 里堆积 */
    scriptEl.remove();
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

  /* ── ready 后淡入 ── */
  var revealed = false;
  function revealHost(){
    if (revealed) return;
    revealed = true;
    if (loadingEl && loadingEl.parentNode) loadingEl.remove();
    if (!shouldShow) return;
    if (currentSubPageHref !== href) return;
    host.style.display = 'block';
    void host.offsetHeight; // 强制 reflow，确保 opacity 过渡生效
    host.style.opacity = '1';
  }

  var onReady = function(e){
    if (!e || !e.detail || e.detail.ns !== ns) return;
    window.removeEventListener('subpage:ready', onReady);
    revealHost();
  };
  window.addEventListener('subpage:ready', onReady);
  /* 兜底：script 解析失败等极端情况，2s 后强制显示 */
  setTimeout(revealHost, 2000);
}

function hideAllSubPages(){
  currentSubPageHref = null;
  window.__CURRENT_SUB_PAGE__ = null;

  Object.keys(loadedSubPages).forEach(function(k){
    loadedSubPages[k].host.style.display = 'none';
  });

  /* ★ 不再 abort pending：让请求完成、挂到隐藏 host，下次切回秒开 ★ */
  Object.keys(pendingLoads).forEach(function(k){
    if (pendingLoads[k].loadingEl && pendingLoads[k].loadingEl.parentNode){
      pendingLoads[k].loadingEl.style.display = 'none';
    }
  });

  var container = document.getElementById('sub-page-container');
  if (container){
    Array.prototype.slice.call(container.children).forEach(function(child){
      /* 保留已挂载的 host 和 pending 的 loading，其他（error 等）清理掉 */
      if (child.classList.contains('subpage-host')) return;
      if (child.classList.contains('subpage-loading')) return;
      child.remove();
    });
    container.classList.add('hidden');
  }

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

  /* ★ 子页面：立即开始加载，不再等抽屉动画 280ms ★ */
  if (item.href && isSubPageHref(item.href)){
    loadSubPage(item.href, id);
    return;
  }

  setTimeout(function(){
    if (item.href){
      var from = encodeURIComponent(window.location.href);
      var sep = item.href.indexOf('?') === -1 ? '?' : '&';
      window.location.href = item.href + sep + 'from=' + from;
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

/* 启动空闲预取（放到下一轮事件循环，避免影响主页面首屏） */
setTimeout(prefetchAllDrawerPages, 0);

})();