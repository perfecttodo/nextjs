/* ================================================================
 *  HK Quick Actions  v2.0.1
 *  右侧快捷按钮 + 左侧快捷抽屉（可插拔，零侵入）
 *
 *  用法：<script src="./quick-actions.js"></script>
 *  放在 loader.js 之后加载即可，不改任何原有文件。
 *
 *  v2.0.1 修复：
 *    - #quick-sub-page-container 加 min-height:0，解决 flex 子项被内容撑高、
 *      底部内容被抽屉裁剪的问题（flexbox 经典陷阱）
 *    - shadow 内 .quick-subpage-body 补 padding-bottom（含 iOS 安全区）
 *    - 覆盖子页面可能写死的 100vh / min-h-screen / overflow:hidden
 *    - 覆盖子页面底部 fixed 底栏，避免相对 viewport 定位后被抽屉裁剪
 *
 *  v2.0.0 核心：
 *    - Shadow DOM 隔离，解决 const ICONS 冲突 + var 污染
 *    - 假 window/document，解决 DOMContentLoaded 永不触发
 *    - on* → data-on-* → eval，解决内联函数找不到（支持任意嵌套）
 * ================================================================ */
(function () {
  'use strict';

  var VERSION         = '2.0.1';
  var STORAGE_KEY     = 'taxi_quick_actions';
  var DEFAULT_ACTIONS = [];

  var EVENT_ATTRS = [
    'click','input','change','blur','focus','keydown','keyup','keypress',
    'submit','reset','mouseover','mouseout','mousedown','mouseup','mousemove',
    'touchstart','touchend','touchmove','wheel','scroll',
    'paste','copy','cut','select','load','error','animationend','transitionend'
  ];

  function dbg() {
    if (window.HKQuickActions && window.HKQuickActions.debug) {
      console.log.apply(console, ['[quick-actions]'].concat([].slice.call(arguments)));
    }
  }

  /* ================================================================
   * 1. CSS 注入
   * ================================================================ */
  function injectCSS() {
    if (document.getElementById('quick-actions-css')) return;
    var style = document.createElement('style');
    style.id = 'quick-actions-css';
    style.textContent = [
      /* 右侧浮动按钮栏 */
      '#quick-action-bar{position:fixed;right:0;top:50%;transform:translateY(-50%);',
      'z-index:40;display:flex;flex-direction:column;gap:8px;padding-right:8px;pointer-events:none;}',
      '#quick-action-bar:empty{display:none;}',
      '#quick-action-bar .quick-btn{pointer-events:auto;width:44px;height:44px;border-radius:9999px;',
      'background:rgba(255,255,255,.96);box-shadow:0 2px 10px rgba(0,0,0,.16);',
      'display:flex;align-items:center;justify-content:center;color:#b45309;',
      'border:1px solid #fcd34d;cursor:pointer;transition:transform .15s,box-shadow .15s;}',
      '#quick-action-bar .quick-btn:active{transform:scale(.9);}',

      /* 遮罩 */
      '#quick-page-overlay{position:fixed;top:0;left:0;right:0;bottom:0;',
      'background:rgba(15,23,42,.6);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);',
      'z-index:60;opacity:0;pointer-events:none;transition:opacity .25s;}',
      '#quick-page-overlay.visible{opacity:1;pointer-events:auto;}',

      /* 左侧抽屉 */
      '#quick-page-drawer{position:fixed;top:0;left:0;height:100%;width:85vw;max-width:24rem;',
      'background:#f8fafc;z-index:70;display:flex;flex-direction:column;transform:translateX(-100%);',
      'transition:transform .28s cubic-bezier(.4,0,.2,1);}',
      '#quick-page-drawer.open{transform:translateX(0);}',

      /* ★ 关键：min-height:0 让 flex 子项能被内容压缩，overflow 才能生效 */
      '#quick-sub-page-container{',
      '  position:relative;',
      '  flex:1 1 auto;',
      '  min-height:0;',
      '  overflow-y:auto;',
      '  overflow-x:hidden;',
      '  -webkit-overflow-scrolling:touch;',
      '  overscroll-behavior:contain;',
      '}',

      '#quick-sub-page-container .quick-subpage-host{width:100%;display:block;}',
      '#quick-sub-page-container .quick-loading{',
      '  padding:5rem 1rem;text-align:center;color:#94a3b8;font-size:13px;}'
    ].join('');
    document.head.appendChild(style);
  }

  /* ================================================================
   * 2. HTML 注入
   * ================================================================ */
  function injectHTML() {
    if (document.getElementById('quick-page-drawer')) return;
    var html =
      '<div id="quick-action-bar"></div>' +
      '<div id="quick-page-overlay" onclick="window.HKQuickActions.closePage()"></div>' +
      '<aside id="quick-page-drawer">' +
        '<div class="bg-slate-900 text-white px-4 py-3 flex justify-between items-center shrink-0" ' +
             'style="padding-top:calc(var(--safe-area-top,0px) + 0.75rem)">' +
          '<span class="font-bold flex items-center gap-2">' +
            '<span id="quick-page-title-icon" class="ico w-5 h-5 text-amber-400" data-icon="map-pin"></span>' +
            '<span id="quick-page-title">快捷功能</span>' +
          '</span>' +
          '<button type="button" onclick="window.HKQuickActions.closePage()" ' +
                  'class="p-1 text-slate-300 hover:text-white active:scale-[0.95] transition">' +
            '<span class="ico w-5 h-5" data-icon="x"></span>' +
          '</button>' +
        '</div>' +
        '<div id="quick-sub-page-container" class="flex-1 overflow-y-auto w-full"></div>' +
      '</aside>';
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

  /* ================================================================
   * 3. 工具
   * ================================================================ */
  function getConfig() {
    try {
      var c = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (c && Array.isArray(c.enabled)) return c;
    } catch (e) {}
    return { enabled: DEFAULT_ACTIONS.slice() };
  }
  function saveConfig(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }
  function getDrawerItems() {
    return Array.isArray(window.DRAWER_ITEMS) ? window.DRAWER_ITEMS : [];
  }
  function icoHtml(name, cls) {
    return (typeof window.ico === 'function') ? window.ico(name || 'layers', cls || 'w-4 h-4') : '';
  }
  function esc(s) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(s);
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function toast(msg) { if (typeof window.showToast === 'function') window.showToast(msg); }
  function hydrate(el) { if (typeof window.hydrateIcons === 'function') window.hydrateIcons(el); }

  /* ================================================================
   * 4. 渲染右侧按钮
   * ================================================================ */
  function renderBar() {
    var bar = document.getElementById('quick-action-bar');
    if (!bar) return;
    var cfg = getConfig();
    var items = getDrawerItems();
    var active = cfg.enabled
      .map(function (id) { return items.find(function (x) { return x.id === id; }); })
      .filter(Boolean);
    bar.innerHTML = active.map(function (item) {
      return '<button type="button" class="quick-btn" ' +
               'onclick="window.HKQuickActions.openAction(\'' + item.id + '\')" ' +
               'title="' + esc(item.label) + '">' +
               icoHtml(item.icon, 'w-5 h-5') +
             '</button>';
    }).join('');
    hydrate(bar);
  }

  /* ================================================================
   * 5. 点击快捷按钮
   * ================================================================ */
  function openAction(id) {
    var item = getDrawerItems().find(function (x) { return x.id === id; });
    if (!item) return;
    if (item.tab) {
      closePage();
      if (typeof window.closeDrawer === 'function') window.closeDrawer();
      if (typeof window.switchTab === 'function') window.switchTab(item.tab);
      return;
    }
    if (item.href) { openPage(item); return; }
    toast('此功能開發中');
  }

  /* ================================================================
   * 6. 打开 / 关闭快捷抽屉
   * ================================================================ */
  function openPage(item) {
    var overlay  = document.getElementById('quick-page-overlay');
    var drawer   = document.getElementById('quick-page-drawer');
    var title    = document.getElementById('quick-page-title');
    var titleIco = document.getElementById('quick-page-title-icon');
    var host     = document.getElementById('quick-sub-page-container');
    if (!overlay || !drawer || !host) return;

    if (typeof window.closeDrawer === 'function')     window.closeDrawer();
    if (typeof window.closeTripDrawer === 'function') window.closeTripDrawer();

    if (title) title.textContent = item.label;
    if (titleIco) {
      titleIco.setAttribute('data-icon', item.icon || 'layers');
      delete titleIco.dataset.done;
      hydrate(titleIco.parentElement);
    }

    if (!drawer.classList.contains('open')) {
      void overlay.offsetWidth;
      overlay.classList.add('visible');
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    loadSubPageInto(host, item.href);
  }

  function closePage() {
    var overlay = document.getElementById('quick-page-overlay');
    var drawer  = document.getElementById('quick-page-drawer');
    var host    = document.getElementById('quick-sub-page-container');
    if (!overlay || !drawer) return;
    overlay.classList.remove('visible');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () {
      if (host) {
        host.innerHTML = '';
        host.scrollTop = 0;
      }
    }, 300);
  }

  /* ================================================================
   * 7. 加载子页面
   * ================================================================ */
  async function loadSubPageInto(container, href) {
    if (!container || !href) return;

    container.scrollTop = 0;
    container.innerHTML =
      '<div class="quick-loading">' +
        '<div style="width:32px;height:32px;margin:0 auto;border:3px solid #fcd34d;' +
             'border-top-color:transparent;border-radius:50%;animation:qs-spin .8s linear infinite"></div>' +
        '<p style="margin-top:.75rem">載入中…</p>' +
        '<style>@keyframes qs-spin{to{transform:rotate(360deg)}}</style>' +
      '</div>';

    try {
      var res = await fetch(href, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var html = await res.text();
      var baseUrl = new URL(href, location.href);
      mountSubPageInto(container, html, baseUrl);
    } catch (err) {
      container.innerHTML =
        '<div style="padding:2rem 1rem;text-align:center;color:#e11d48;font-size:13px">' +
          '載入失敗：' + esc(err && err.message ? err.message : '未知錯誤') +
        '</div>';
    }
  }

  /* ================================================================
   * 8. ★ 把 HTML 挂到 Shadow DOM
   * ================================================================ */
  function mountSubPageInto(container, html, baseUrl) {
    var doc = new DOMParser().parseFromString(html, 'text/html');

    /* 1. 移除 header / nav / 各种 drawer 骨架 */
    doc.querySelectorAll('header').forEach(function (el) { el.remove(); });
    doc.querySelectorAll('nav').forEach(function (el) { el.remove(); });
    ['#side-drawer', '#drawer-overlay', '#trip-drawer', '#trip-drawer-overlay',
     '#quick-page-drawer', '#quick-page-overlay'].forEach(function (sel) {
      var el = doc.querySelector(sel);
      if (el) el.remove();
    });

    /* 2. 重写相对路径 */
    doc.querySelectorAll('[href]').forEach(function (el) {
      var v = el.getAttribute('href');
      if (v && !/^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(v)) {
        try { el.setAttribute('href', new URL(v, baseUrl).href); } catch (e) {}
      }
    });
    doc.querySelectorAll('[src]').forEach(function (el) {
      var v = el.getAttribute('src');
      if (v && !/^(https?:|data:|blob:)/i.test(v)) {
        try { el.setAttribute('src', new URL(v, baseUrl).href); } catch (e) {}
      }
    });

    /* 3. 创建 Shadow host */
    container.innerHTML = '';
    var host = document.createElement('div');
    host.className = 'quick-subpage-host';
    var shadow = host.attachShadow({ mode: 'open' });

    /* 4. 样式 */
    var styleText = Array.prototype.map.call(
      doc.querySelectorAll('head style'),
      function (s) { return s.textContent; }
    ).join('\n');
    var linkTags = Array.prototype.map.call(
      doc.querySelectorAll('head link[rel="stylesheet"]'),
      function (l) { return '@import url("' + l.getAttribute('href') + '");'; }
    ).join('\n');

    var styleEl = document.createElement('style');
    styleEl.textContent =
      linkTags + '\n' + styleText + '\n' +
      /* host 与 body：不继承 100vh，随内容高度 */
      ':host{display:block;height:auto;min-height:0;}\n' +
      '.quick-subpage-body{' +
        'padding-bottom:calc(env(safe-area-inset-bottom, 0px) + 16px);' +
        'min-height:0;' +
        'height:auto;' +
        'box-sizing:border-box;' +
      '}\n' +
      /* 覆盖子页面可能写死的满屏类，避免挤压滚动区 */
      '.quick-subpage-body [class*="h-screen"],' +
      '.quick-subpage-body [class*="min-h-screen"]{' +
        'height:auto !important;min-height:0 !important;}\n' +
      '.quick-subpage-body [style*="100vh"]{' +
        'height:auto !important;min-height:0 !important;}\n' +
      /* body 本身：清零 padding、禁用溢出 */
      'body{' +
        'padding:0 !important;' +
        'min-height:auto !important;' +
        'height:auto !important;' +
        'overflow:visible !important;' +
        'background:transparent !important;' +
      '}\n' +
      /* 底部 fixed 底栏：转 static，避免相对 viewport 定位后被抽屉裁剪
       * 若某元素确实需要保持 fixed，加 class="subpage-allow-fixed" 即可 */
      '.quick-subpage-body [class*="fixed"][class*="bottom-0"]:not(.subpage-allow-fixed),' +
      '.quick-subpage-body [class*="fixed"][class*="bottom-["]:not(.subpage-allow-fixed){' +
        'position:static !important;' +
      '}';
    shadow.appendChild(styleEl);

    /* 5. body 节点整体搬入 */
    var bodyDiv = document.createElement('div');
    bodyDiv.className = 'quick-subpage-body';
    var srcNodes = Array.prototype.slice.call(doc.body.childNodes);
    srcNodes.forEach(function (n) { bodyDiv.appendChild(n); });
    shadow.appendChild(bodyDiv);

    /* 6. on* → data-on-* */
    bodyDiv.querySelectorAll('*').forEach(extractInlineEvents);
    extractInlineEvents(bodyDiv);

    /* 7. 收集 script */
    var inlineScripts = '';
    var externalScripts = [];
    bodyDiv.querySelectorAll('script').forEach(function (s) {
      var srcAttr = s.getAttribute('src');
      if (srcAttr) {
        try { externalScripts.push(new URL(srcAttr, baseUrl).href); }
        catch (e) { externalScripts.push(srcAttr); }
      } else {
        inlineScripts += '\n' + s.textContent;
      }
      s.remove();
    });

    /* 8. 挂到容器 */
    container.appendChild(host);

    /* 9. 加载外部脚本 → 执行内联脚本 */
    var ns = 'qs_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    window.__QUICK_POOL__ = window.__QUICK_POOL__ || {};
    window.__QUICK_POOL__[ns] = shadow;

    var run = function () { runScripts(inlineScripts, ns); };

    if (externalScripts.length) {
      var chain = Promise.resolve();
      externalScripts.forEach(function (src) {
        chain = chain.then(function () { return loadExternalScript(src); });
      });
      chain.then(run).catch(function (err) {
        console.error('[quick-actions] external script error:', err);
        run();
      });
    } else {
      run();
    }
  }

  /* on* → data-on-* */
  function extractInlineEvents(el) {
    if (!el || !el.getAttributeNames) return;
    EVENT_ATTRS.forEach(function (evt) {
      var attr = 'on' + evt;
      if (el.hasAttribute && el.hasAttribute(attr)) {
        try {
          var code = el.getAttribute(attr);
          if (code) el.setAttribute('data-on-' + evt, code);
        } catch (e) {}
        el.removeAttribute(attr);
      }
    });
  }

  /* 外部脚本加载（去重） */
  function loadExternalScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src.replace(/"/g, '\\"') + '"]')) {
        resolve(); return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload  = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed: ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* ================================================================
   * 9. ★ 执行子页面脚本（假 window/document + IIFE + eval）
   * ================================================================ */
  function runScripts(inlineScripts, ns) {
    var wrapped =
      '(function(__realWin__, __realDoc__){\n' +
      '  var __shadow__ = __realWin__.__QUICK_POOL__["' + ns + '"];\n' +
      '  var __bodyDiv__ = __shadow__.querySelector(".quick-subpage-body");\n' +
      '  var window = __realWin__;\n' +
      '  var __captured__ = [];\n' +

      /* ---- 假 document ---- */
      '  var document = {\n' +
      '    getElementById: function(id){ return __shadow__.getElementById(id); },\n' +
      '    querySelector:  function(sel){ return __shadow__.querySelector(sel); },\n' +
      '    querySelectorAll:function(sel){ return __shadow__.querySelectorAll(sel); },\n' +
      '    addEventListener: function(type, handler, opts){\n' +
      '      if (type === "DOMContentLoaded" || type === "load"){\n' +
      '        __captured__.push({ type: type, handler: handler });\n' +
      '        return;\n' +
      '      }\n' +
      '      __shadow__.addEventListener(type, handler, opts);\n' +
      '    },\n' +
      '    removeEventListener: function(t,h,o){ __shadow__.removeEventListener(t,h,o); },\n' +
      '    createElement: function(tag){ return __realDoc__.createElement(tag); },\n' +
      '    createTextNode: function(t){ return __realDoc__.createTextNode(t); },\n' +
      '    body: __bodyDiv__, head: __shadow__,\n' +
      '    documentElement: __realDoc__.documentElement,\n' +
      '    readyState: "complete", hidden: __realDoc__.hidden,\n' +
      '    activeElement: __realDoc__.activeElement\n' +
      '  };\n' +

      /* ---- 常用全局 ---- */
      '  var localStorage   = __realWin__.localStorage;\n' +
      '  var navigator      = __realWin__.navigator;\n' +
      '  var location       = __realWin__.location;\n' +
      '  var fetch          = __realWin__.fetch.bind(__realWin__);\n' +
      '  var setTimeout     = __realWin__.setTimeout.bind(__realWin__);\n' +
      '  var clearTimeout   = __realWin__.clearTimeout.bind(__realWin__);\n' +
      '  var setInterval    = __realWin__.setInterval.bind(__realWin__);\n' +
      '  var clearInterval  = __realWin__.clearInterval.bind(__realWin__);\n' +
      '  var console        = __realWin__.console;\n' +
      '  var URL            = __realWin__.URL;\n' +
      '  var URLSearchParams= __realWin__.URLSearchParams;\n' +
      '  var Date = __realWin__.Date, Math = __realWin__.Math, JSON = __realWin__.JSON;\n' +
      '  var Object = __realWin__.Object, Array = __realWin__.Array;\n' +
      '  var String = __realWin__.String, Number = __realWin__.Number;\n' +
      '  var isNaN = __realWin__.isNaN, parseInt = __realWin__.parseInt,\n' +
      '      parseFloat = __realWin__.parseFloat, RegExp = __realWin__.RegExp;\n' +
      '  var Promise = __realWin__.Promise, Error = __realWin__.Error;\n' +
      '  var encodeURIComponent = __realWin__.encodeURIComponent;\n' +
      '  var decodeURIComponent = __realWin__.decodeURIComponent;\n' +
      '  var MutationObserver = __realWin__.MutationObserver;\n' +
      '  function confirm(m){ return __realWin__.confirm(m); }\n' +
      '  function alert(m){ return __realWin__.alert(m); }\n' +

      /* ---- 拦截 window.addEventListener 捕获 DOMContentLoaded / load ---- */
      '  var __origAdd__ = __realWin__.addEventListener;\n' +
      '  __realWin__.addEventListener = function(type, handler, opts){\n' +
      '    if (type === "DOMContentLoaded" || type === "load"){\n' +
      '      __captured__.push({ type: type, handler: handler });\n' +
      '      return;\n' +
      '    }\n' +
      '    return __origAdd__.call(__realWin__, type, handler, opts);\n' +
      '  };\n' +

      '  var __EVENT_ATTRS__ = ' + JSON.stringify(EVENT_ATTRS) + ';\n' +
      '  var __bindDone__ = false;\n' +

      '  try {\n' +
      '    var __bindAll__ = function(el){\n' +
      '      if (!el || el.nodeType !== 1) return;\n' +
      '      var names; try { names = el.getAttributeNames ? el.getAttributeNames() : []; } catch(e){ return; }\n' +
      '      if (!names.length) return;\n' +
      '      for (var i = 0; i < names.length; i++){\n' +
      '        var name = names[i], evt = null;\n' +
      '        if (name.indexOf("data-on-") === 0){ evt = name.slice(8); }\n' +
      '        else if (name.indexOf("on") === 0 && __EVENT_ATTRS__.indexOf(name.slice(2)) !== -1){\n' +
      '          evt = name.slice(2);\n' +
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
      '                  new __realWin__.Function("event", evtCode).call(__self__, event);\n' +
      '                  return;\n' +
      '                } catch(_e){}\n' +
      '              }\n' +
      '              console.error("[quick-actions] on" + evtName + " error:", err, evtCode);\n' +
      '            }\n' +
      '          });\n' +
      '        })(evt, code);\n' +
      '      }\n' +
      '    };\n' +

      inlineScripts + '\n' +

      '    (function __bindInit__(){\n' +
      '      __shadow__.querySelectorAll("*").forEach(__bindAll__);\n' +
      '      var mo = new MutationObserver(function(muts){\n' +
      '        muts.forEach(function(m){\n' +
      '          m.addedNodes.forEach(function(node){\n' +
      '            if (node && node.nodeType === 1){\n' +
      '              __bindAll__(node);\n' +
      '              if (node.querySelectorAll) node.querySelectorAll("*").forEach(__bindAll__);\n' +
      '            }\n' +
      '          });\n' +
      '        });\n' +
      '      });\n' +
      '      mo.observe(__shadow__, { childList: true, subtree: true });\n' +
      '    })();\n' +
      '    __bindDone__ = true;\n' +

      /* 立即执行捕获的 DOMContentLoaded / load */
      '    __captured__.forEach(function(item){\n' +
      '      try { item.handler.call(__realWin__, { type: item.type }); }\n' +
      '      catch(e){ console.error("[quick-actions] " + item.type + " handler error:", e); }\n' +
      '    });\n' +
      '  } catch(e) {\n' +
      '    console.error("[quick-actions] script error:", e);\n' +
      '  } finally {\n' +
      '    __realWin__.addEventListener = __origAdd__;\n' +
      '  }\n' +

      /* 提供返回按钮 */
      '  try {\n' +
      '    window.goBack = function(){ if (__realWin__.HKQuickActions) __realWin__.HKQuickActions.closePage(); };\n' +
      '    window.goHome = window.goBack;\n' +
      '  } catch(e){}\n' +

      '})(window, document);\n';

    var scriptEl = document.createElement('script');
    scriptEl.textContent = wrapped;
    document.head.appendChild(scriptEl);
    scriptEl.remove();
  }

  /* ================================================================
   * 10. 管理快捷欄弹窗
   * ================================================================ */
  function openSettings() {
    if (typeof window.closeDrawer === 'function') window.closeDrawer();

    setTimeout(function () {
      var cfg = getConfig();
      var items = getDrawerItems();
      if (!items.length) { toast('功能選單尚未就緒'); return; }

      var html =
        '<div class="space-y-2">' +
          '<p class="text-[11px] text-slate-500 mb-1 leading-relaxed">勾選要顯示在右側快捷欄的功能，即時生效。</p>' +
          items.map(function (item) {
            var checked = cfg.enabled.indexOf(item.id) !== -1;
            return '<label class="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition ' +
                     (checked ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:bg-slate-50') + '">' +
                     '<input type="checkbox" data-quick-id="' + item.id + '"' + (checked ? ' checked' : '') +
                       ' onchange="window.HKQuickActions.onCheckChange(this)" ' +
                       'class="w-4 h-4 accent-amber-500 shrink-0">' +
                     '<span class="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">' +
                       icoHtml(item.icon, 'w-4 h-4') +
                     '</span>' +
                     '<span class="flex-1 min-w-0">' +
                       '<div class="text-sm font-bold text-slate-800 truncate">' + esc(item.label) + '</div>' +
                       '<div class="text-[11px] text-slate-500 truncate">' + esc(item.desc) + '</div>' +
                     '</span>' +
                   '</label>';
          }).join('') +
        '</div>';

      var titleEl  = document.getElementById('modal-title');
      var bodyEl   = document.getElementById('modal-body');
      var footerEl = document.getElementById('modal-footer');
      var modalEl  = document.getElementById('trip-modal');
      if (!titleEl || !bodyEl || !footerEl || !modalEl) { toast('找不到彈窗容器'); return; }

      titleEl.textContent = '管理右側快捷欄';
      bodyEl.innerHTML    = html;
      footerEl.innerHTML  =
        '<button onclick="window.closeModal()" ' +
                'class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs transition">完成</button>';

      modalEl.classList.remove('hidden');
      modalEl.classList.add('flex');
      hydrate(modalEl);
    }, 280);
  }

  function onCheckChange(checkbox) {
    var id = checkbox.dataset.quickId;
    var cfg = getConfig();
    var idx = cfg.enabled.indexOf(id);
    if (checkbox.checked && idx === -1)       cfg.enabled.push(id);
    else if (!checkbox.checked && idx !== -1) cfg.enabled.splice(idx, 1);
    saveConfig(cfg);
    renderBar();
    var label = checkbox.closest('label');
    if (label) {
      label.className = 'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition ' +
        (checkbox.checked ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:bg-slate-50');
    }
  }

  /* ================================================================
   * 11. 注入「管理右側快捷欄」按钮
   * ================================================================ */
  function injectSettingsButton() {
    if (document.getElementById('quick-actions-manage-btn')) return;
    var content = document.getElementById('drawer-content');
    if (!content) return;
    var btn = document.createElement('button');
    btn.id = 'quick-actions-manage-btn';
    btn.type = 'button';
    btn.onclick = openSettings;
    btn.className = 'mx-3 mb-1 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 ' +
                    'text-slate-700 border border-slate-200 text-xs font-semibold ' +
                    'flex items-center justify-center gap-1.5 transition shrink-0';
    btn.innerHTML =
      '<span class="ico w-3.5 h-3.5" data-icon="settings"></span>' +
      '<span>管理右側快捷欄</span>';
    content.insertAdjacentElement('afterend', btn);
    hydrate(btn);
  }

  /* ================================================================
   * 12. 抽屉互斥 / 手势
   * ================================================================ */
  function setupDrawerSync() {
    var sideDrawer = document.getElementById('side-drawer');
    var tripDrawer = document.getElementById('trip-drawer');
    if (!sideDrawer || !tripDrawer) return;
    var mo = new MutationObserver(function () {
      if (sideDrawer.classList.contains('open') || tripDrawer.classList.contains('open')) {
        var qd = document.getElementById('quick-page-drawer');
        if (qd && qd.classList.contains('open')) closePage();
      }
    });
    mo.observe(sideDrawer, { attributes: true, attributeFilter: ['class'] });
    mo.observe(tripDrawer, { attributes: true, attributeFilter: ['class'] });
  }

  function setupTouchGuard() {
    document.addEventListener('touchmove', function (e) {
      var qd = document.getElementById('quick-page-drawer');
      if (qd && qd.classList.contains('open') && !qd.contains(e.target)) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  /* ================================================================
   * 13. 初始化
   * ================================================================ */
  function init() {
    injectCSS();
    injectHTML();
    setupDrawerSync();
    setupTouchGuard();

    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (getDrawerItems().length > 0) {
        clearInterval(timer);
        renderBar();
        injectSettingsButton();
        hydrate(document.body);
      } else if (tries > 40) {
        clearInterval(timer);
        console.warn('[HKQuickActions] DRAWER_ITEMS 未就緒，插件停用');
      }
    }, 50);
  }

  /* ================================================================
   * 14. 对外 API
   * ================================================================ */
  window.HKQuickActions = {
    version:         VERSION,
    debug:           false,
    openAction:      openAction,
    openPage:        openPage,
    closePage:       closePage,
    openSettings:    openSettings,
    onCheckChange:   onCheckChange,
    renderBar:       renderBar,
    loadSubPageInto: loadSubPageInto
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();