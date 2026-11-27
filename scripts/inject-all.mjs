import fs from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const GTM_ID = "GTM-T48L745D";
const GA_ID = "G-ML143PPJZH";
const M_START = "<!-- GLOBAL_INJECT_START -->";
const M_END = "<!-- GLOBAL_INJECT_END -->";

const MENU_CONFIG = {
  PRINT_MENU: false,
  INCLUDE_DIRS: [],
  EXCLUDE_ITEMS: ["404.html", "500.html", "google", /^_/, /^test-/i],
  // 支持按书写顺序排列，并配置所属分类 group
  CUSTOM_ITEMS: {
    "resume": { label: "Alex's CV", icon: "👨‍💻", group: "個人" },
    "reading": { label: "快樂小讀者", icon: "📚", group: "學習" },
    "hktaxi": { label: "香港的士考試", icon: "🚕", group: "學習" },
    "exam": { label: "模擬測驗", icon: "📝", group: "學習" },
    "abc": { label: "ABC 英語學習", icon: "🔤", group: "學習" },
    "3ddrive": { label: "3D 駕駛模擬", icon: "🏎️", group: "遊戲" },
    "brickG2.html": { label: "打磚塊 G2", icon: "🧱", group: "遊戲" },
    "coyball.html": { label: "彈力球大作戰", icon: "⚽", group: "遊戲" },
    "wordgame.html": { label: "單字拼寫挑戰", icon: "🧩", group: "遊戲" },
    "game3.html": { label: "趣味小遊戲 3", icon: "🕹️", group: "遊戲" },
    "note": { label: "隨手筆記", icon: "📒", group: "工具" },
    "media": { label: "影音媒體庫", icon: "🎬", group: "工具" },
  },
  EXTRA_LINKS: [],
};

function isExcluded(name, rel) {
  return MENU_CONFIG.EXCLUDE_ITEMS.some((r) =>
    typeof r === "string" ? name === r || rel === r || name.includes(r) : r.test(name) || r.test(rel)
  );
}

function getMeta(name, rel, isDir, defaultHref) {
  const k = rel.replace(/^\//, "");
  const c = MENU_CONFIG.CUSTOM_ITEMS[k] || MENU_CONFIG.CUSTOM_ITEMS[name];
  if (c) return { label: c.label || name, icon: c.icon || "🔗", href: c.href || defaultHref, group: c.group || "其他" };
  let icon = isDir ? "🔗" : "📄", group = "其他";
  if (/game|play|park|ball|brick|drive/i.test(name)) { icon = "🎮"; group = "遊戲"; }
  else if (/doc|guide|help|read|abc|exam|taxi/i.test(name)) { icon = "📘"; group = "學習"; }
  else if (/tool|calc|note|media/i.test(name)) { icon = "🛠️"; group = "工具"; }
  return { label: isDir ? name : name.replace(/\.html$/i, ""), icon, href: defaultHref, group };
}

function hasHtml(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isFile() && e.name.endsWith(".html")) return true;
    if (e.isDirectory() && hasHtml(p)) return true;
  }
  return false;
}

function getMenu() {
  const items = [];
  const orderKeys = Object.keys(MENU_CONFIG.CUSTOM_ITEMS);
  if (fs.existsSync(PUBLIC_DIR)) {
    const entries = fs.readdirSync(PUBLIC_DIR, { withFileTypes: true })
      .filter((e) => !e.name.startsWith("."))
      .filter((e) => !(e.isDirectory() && MENU_CONFIG.INCLUDE_DIRS.length > 0 && !MENU_CONFIG.INCLUDE_DIRS.includes(e.name)));
    for (const e of entries) {
      const url = "/" + e.name;
      if (isExcluded(e.name, url)) continue;
      if (e.isDirectory() && hasHtml(path.join(PUBLIC_DIR, e.name))) {
        const m = getMeta(e.name, url, true, url + "/");
        items.push({ key: e.name, type: "dir", name: m.label, icon: m.icon, path: m.href, group: m.group });
      } else if (e.isFile() && e.name.endsWith(".html") && e.name.toLowerCase() !== "index.html") {
        const m = getMeta(e.name, url, false, url);
        items.push({ key: e.name, type: "file", name: m.label, icon: m.icon, path: m.href, group: m.group });
      }
    }
  }
  for (const ex of MENU_CONFIG.EXTRA_LINKS) {
    items.push({ key: ex.label, type: "extra", name: ex.label, icon: ex.icon || "🔗", path: ex.href, group: ex.group || "其他" });
  }
  items.sort((a, b) => {
    const ia = orderKeys.indexOf(a.key), ib = orderKeys.indexOf(b.key);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
  return items;
}

function clientMount(items) {
  if (window.__navOk) return;
  window.__navOk = 1;
  var cur = decodeURIComponent(location.pathname);
  var host = document.getElementById("__nav_host");
  if (!host) return;
  var s = host.attachShadow({ mode: "open" });

  var docLang = (document.documentElement.lang || "").toLowerCase();
  var isEn = docLang ? !docLang.startsWith("zh") : !/[\u4e00-\u9fa5]/.test((document.title || "") + ((document.body && document.body.innerText) || "").slice(0, 300));
  var L = isEn
    ? { menu: "Menu", home: "Home", hide: "Hide", mute: "Sound", all: "All", recent: "Recent", search: "Search...", empty: "No match", dockedHint: "Docked here (Alt+M)", showTip: "Restore Menu (Alt+M)", dragTip: "Click / Drag" }
    : { menu: "导航", home: "首頁", hide: "隱藏", mute: "音效", all: "全部", recent: "最近訪問", search: "搜尋頁面...", empty: "未找到匹配項目", dockedHint: "已收起至此 (Alt+M)", showTip: "點擊恢復導航 (Alt+M)", dragTip: "點擊展開 / 按住拖動" };

  function formatTitle(raw) {
    if (!isEn || !/^[a-z0-9_-]+$/i.test(raw)) return raw;
    return raw.replace(/[-_]+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  var MUTE_KEY = "__float_nav_muted", isMuted = false, audioCtx = null, lastHoverT = 0;
  try { isMuted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}

  function playFx(type) {
    if (isMuted) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      var run = function () {
        var now = audioCtx.currentTime;
        if (type === "hover") {
          if (now - lastHoverT < 0.05) return;
          lastHoverT = now;
          var o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = "triangle"; o.frequency.setValueAtTime(1050, now); o.frequency.exponentialRampToValueAtTime(720, now + 0.04);
          g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
          o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.05);
        } else if (type === "open" || type === "close") {
          var freqs = type === "open" ? [523.25, 659.25, 783.99, 1046.5] : [783.99, 587.33, 440];
          freqs.forEach(function (f, idx) {
            var o = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = now + idx * 0.045;
            o.type = "triangle"; o.frequency.setValueAtTime(f, t0);
            g.gain.setValueAtTime(0.001, t0); g.gain.linearRampToValueAtTime(0.26, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
            o.connect(g); g.connect(audioCtx.destination); o.start(t0); o.stop(t0 + 0.21);
          });
        } else if (type === "dock" || type === "undock") {
          var o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = "triangle"; o.frequency.setValueAtTime(type === "dock" ? 660 : 280, now); o.frequency.exponentialRampToValueAtTime(type === "dock" ? 220 : 720, now + 0.16);
          g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
          o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.18);
        }
      };
      if (audioCtx.state === "suspended") audioCtx.resume().then(run); else run();
    } catch (e) {}
  }

  var style = document.createElement("style");
  style.textContent = [
    "*{box-sizing:border-box;font:13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}",
    ":host{--bg:rgba(255,255,255,.84);--btn-bg:rgba(255,255,255,.88);--card-bg:rgba(15,23,42,.035);--fg:#1e293b;--fg-muted:#64748b;--border-outer:rgba(15,23,42,.13);--hover-bg:rgba(15,23,42,.07);--active-bg:rgba(37,99,235,.13);--accent:#2563eb;--shadow:0 16px 42px rgba(15,23,42,.18),inset 0 1px 0 rgba(255,255,255,.85)}",
    ":host(.dark){--bg:rgba(17,24,39,.86);--btn-bg:rgba(30,41,59,.88);--card-bg:rgba(255,255,255,.045);--fg:#f1f5f9;--fg-muted:#94a3b8;--border-outer:rgba(255,255,255,.15);--hover-bg:rgba(255,255,255,.1);--active-bg:rgba(96,165,250,.2);--accent:#60a5fa;--shadow:0 20px 48px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.14)}",
    ".wrap{position:relative;display:inline-flex;align-items:center;opacity:1;transform:translateX(0) scale(1);transition:opacity .28s ease,transform .36s cubic-bezier(.34,1.56,.64,1)}",
    ".wrap.hidden{opacity:0;pointer-events:none;transform:translateX(26px) scale(.45)}.wrap.hidden.from-left{transform:translateX(-26px) scale(.45)}",
    ".b{position:relative;height:36px;min-width:36px;padding:0 10px;border-radius:999px;background:var(--btn-bg);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);color:var(--fg);border:1px solid var(--border-outer);box-shadow:0 4px 14px rgba(0,0,0,.15);cursor:grab;font-size:13px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:0;opacity:.88;user-select:none;transition:all .3s cubic-bezier(.34,1.56,.64,1)}",
    ".b::after{content:'';position:absolute;top:1px;right:1px;width:8px;height:8px;border-radius:50%;background:var(--accent);animation:dotPing 2.2s infinite}",
    "@keyframes dotPing{0%{box-shadow:0 0 0 0 var(--accent)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}",
    ".b.seen::after,.wrap:hover .b::after{animation:none;opacity:0}",
    ".wrap:hover .b,.b.open{opacity:1;gap:6px;padding:0 13px;border-color:var(--accent);box-shadow:0 8px 22px rgba(0,0,0,.2)}.b.open{background:var(--accent);color:#fff}",
    ".b-ico{display:inline-block;font-size:15px;line-height:1;transition:transform .3s cubic-bezier(.34,1.56,.64,1)}.b.open .b-ico{transform:rotate(90deg) scale(1.05)}",
    ".b-lbl{max-width:0;overflow:hidden;white-space:nowrap;opacity:0;transition:max-width .3s cubic-bezier(.16,1,.3,1),opacity .22s ease}.wrap:hover .b-lbl,.b.open .b-lbl{max-width:54px;opacity:1}",
    ".x-btn{position:absolute;top:-5px;right:-4px;width:16px;height:16px;border-radius:50%;background:var(--fg);color:var(--bg);border:none;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transform:scale(.5) rotate(-90deg);transition:all .24s cubic-bezier(.34,1.56,.64,1);z-index:2;padding:0}",
    ".wrap:hover .x-btn{opacity:.88;transform:scale(1) rotate(0deg)}.x-btn:hover{opacity:1;transform:scale(1.18);background:#ef4444;color:#fff}",
    ".dock{position:fixed;right:0;bottom:32px;height:42px;min-width:24px;padding:0 6px;border-radius:12px 0 0 12px;background:var(--btn-bg);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);color:var(--fg);border:1px solid var(--border-outer);border-right:none;box-shadow:-4px 6px 18px rgba(0,0,0,.16);cursor:pointer;display:inline-flex;align-items:center;gap:4px;opacity:0;pointer-events:none;transform:translateX(100%);user-select:none;transition:transform .38s cubic-bezier(.34,1.56,.64,1),opacity .26s ease,padding .25s ease,border-color .2s}",
    ".dock.show{opacity:.82;pointer-events:auto;transform:translateX(0)}",
    ".dock.left-edge{right:auto;left:0;border-radius:0 12px 12px 0;border-right:1px solid var(--border-outer);border-left:none;box-shadow:4px 6px 18px rgba(0,0,0,.16);flex-direction:row-reverse;transform:translateX(-100%)}.dock.left-edge.show{transform:translateX(0)}",
    ".dock:hover{opacity:1;padding:0 11px;border-color:var(--accent);color:var(--accent)}",
    ".dock.pulse{animation:dockBeacon 1.1s ease-out 2}@keyframes dockBeacon{0%{box-shadow:0 0 0 0 var(--accent);opacity:1}70%{box-shadow:0 0 0 10px transparent;opacity:1}100%{box-shadow:0 0 0 0 transparent}}",
    ".dock-arr{font-size:14px;font-weight:700;line-height:1;color:var(--accent)}.dock-txt{max-width:0;overflow:hidden;white-space:nowrap;font-size:12px;font-weight:600;opacity:0;transition:max-width .26s ease,opacity .2s ease}.dock:hover .dock-txt{max-width:48px;opacity:1}",
    ".toast{position:fixed;padding:5px 11px;border-radius:8px;background:var(--fg);color:var(--bg);font-size:12px;font-weight:500;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.22);opacity:0;pointer-events:none;transform:translateY(6px) scale(.94);transition:opacity .26s ease,transform .28s cubic-bezier(.16,1,.3,1);z-index:2147483647}.toast.show{opacity:.94;transform:translateY(0) scale(1)}",
    ".p{position:absolute;right:0;bottom:48px;width:336px;max-width:calc(100vw - 16px);max-height:70dvh;overflow-y:auto;background:var(--bg);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border:1px solid var(--border-outer);border-radius:16px;box-shadow:var(--shadow);padding:10px;opacity:0;visibility:hidden;transform:translateY(12px) scale(.93);transform-origin:bottom right;transition:opacity .24s ease,transform .32s cubic-bezier(.34,1.4,.64,1),visibility .24s}.p.o{opacity:1;visibility:visible;transform:translateY(0) scale(1)}",
    ".p.down{bottom:auto;top:48px;transform-origin:top right}.p.down:not(.o){transform:translateY(-12px) scale(.93)}.p.left{right:auto;left:0;transform-origin:bottom left}.p.down.left{transform-origin:top left}",
    ".p::-webkit-scrollbar{width:4px}.p::-webkit-scrollbar-thumb{background:var(--hover-bg);border-radius:4px}",
    ".top-bar{display:flex;align-items:center;gap:6px;margin-bottom:8px}.home-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border-radius:9px;background:var(--card-bg);color:var(--fg);text-decoration:none;font-weight:600;font-size:12.5px;white-space:nowrap;transition:all .18s}.home-btn:hover,.home-btn.a{background:var(--active-bg);color:var(--accent)}",
    ".search-wrap{flex:1;min-width:0;position:relative;display:flex;align-items:center}.search-in{width:100%;height:30px;padding:0 24px 0 26px;border-radius:9px;border:1px solid var(--border-outer);background:var(--card-bg);color:var(--fg);font-size:12.5px;outline:none}.search-in::placeholder{color:var(--fg-muted)}.search-in:focus{border-color:var(--accent)}",
    ".search-ico{position:absolute;left:8px;font-size:12px;color:var(--fg-muted);pointer-events:none}.search-clr{position:absolute;right:6px;border:none;background:none;color:var(--fg-muted);font-size:12px;cursor:pointer;display:none;padding:2px}.search-clr.show{display:block}",
    ".tool-btn{padding:6px 7px;border-radius:8px;border:none;background:transparent;color:var(--fg-muted);font-size:12px;cursor:pointer;transition:all .18s}.tool-btn:hover{background:var(--hover-bg);color:var(--fg)}.tool-btn.danger:hover{color:#ef4444}",
    ".recent-box{margin-bottom:8px;padding-bottom:7px;border-bottom:1px dashed var(--border-outer)}.sec-lbl{font-size:11px;font-weight:600;color:var(--fg-muted);margin-bottom:5px}.recent-row{display:flex;flex-wrap:wrap;gap:5px}",
    ".rec-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;background:var(--card-bg);color:var(--fg);text-decoration:none;font-size:12px;font-weight:500;max-width:148px;transition:all .18s}.rec-chip:hover{background:var(--active-bg);color:var(--accent)}.rec-chip span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".tabs{display:flex;gap:5px;overflow-x:auto;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid var(--hover-bg);scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}",
    ".tab{padding:4px 10px;border-radius:999px;border:1px solid transparent;background:var(--card-bg);color:var(--fg-muted);font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;transition:all .2s}.tab:hover{color:var(--fg);background:var(--hover-bg)}.tab.act{background:var(--accent);color:#fff;font-weight:600}",
    ".grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}",
    "a.card{position:relative;display:flex;align-items:center;gap:8px;padding:8px 9px;border-radius:10px;background:var(--card-bg);border:1px solid transparent;color:var(--fg);text-decoration:none;font-weight:500;font-size:12.5px;overflow:hidden;opacity:0;transform:translateY(6px);transition:opacity .24s ease,transform .24s cubic-bezier(.16,1,.3,1),background .18s,border-color .18s,color .18s}",
    ".p.o a.card{opacity:1;transform:translateY(0)}.p.o a.card:hover{background:var(--hover-bg);border-color:var(--accent);color:var(--accent);transform:translateY(-1.5px)}a.card.a{background:var(--active-bg);border-color:var(--accent);color:var(--accent);font-weight:600}",
    ".ico{flex-shrink:0;font-size:15px;line-height:1;transition:transform .24s cubic-bezier(.34,1.56,.64,1)}a.card:hover .ico{transform:scale(1.2) rotate(-6deg)}",
    ".txt{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.empty{grid-column:1/-1;text-align:center;padding:18px 0;color:var(--fg-muted);font-size:12.5px}"
  ].join("");

  var wrap = document.createElement("div"); wrap.className = "wrap";
  var panel = document.createElement("div"); panel.className = "p";
  panel.innerHTML = [
    '<div class="top-bar"><a class="home-btn" id="home" href="/">🏠 ' + L.home + '</a>',
    '<div class="search-wrap"><span class="search-ico">🔍</span><input class="search-in" id="qIn" type="text" placeholder="' + L.search + '" /><button class="search-clr" id="qClr">✕</button></div>',
    '<button class="tool-btn" id="muteBtn" title="' + L.mute + '">' + (isMuted ? "🔇" : "🔊") + '</button>',
    '<button class="tool-btn danger" id="hideBtn" title="' + L.hide + '">✕</button></div>',
    '<div class="recent-box" id="recBox" style="display:none"><div class="sec-lbl">🕒 ' + L.recent + '</div><div class="recent-row" id="recRow"></div></div>',
    '<div class="tabs" id="tabBox"></div><div class="grid" id="gridBox"></div>'
  ].join("");

  var btn = document.createElement("button"); btn.className = "b"; btn.title = L.dragTip;
  btn.innerHTML = '<span class="b-ico">☰</span><span class="b-lbl">' + L.menu + '</span>';
  var xBtn = document.createElement("button"); xBtn.className = "x-btn"; xBtn.title = L.hide; xBtn.textContent = "×";
  var dock = document.createElement("div"); dock.className = "dock"; dock.title = L.showTip;
  dock.innerHTML = '<span class="dock-arr">‹</span><span class="dock-txt">' + L.menu + '</span>';
  var toast = document.createElement("div"); toast.className = "toast"; toast.textContent = L.dockedHint;

  wrap.appendChild(panel); wrap.appendChild(btn); wrap.appendChild(xBtn);
  s.appendChild(style); s.appendChild(wrap); s.appendChild(dock); s.appendChild(toast);

  var muteBtn = s.getElementById("muteBtn"), qIn = s.getElementById("qIn"), qClr = s.getElementById("qClr");
  var recBox = s.getElementById("recBox"), recRow = s.getElementById("recRow");
  var tabBox = s.getElementById("tabBox"), gridBox = s.getElementById("gridBox");
  if (cur === "/" || cur === "/index.html") s.getElementById("home").classList.add("a");

  muteBtn.onclick = function (e) {
    e.stopPropagation(); isMuted = !isMuted; muteBtn.textContent = isMuted ? "🔇" : "🔊";
    try { localStorage.setItem(MUTE_KEY, isMuted ? "1" : "0"); } catch (err) {}
    if (!isMuted) playFx("open");
  };

  var REC_KEY = "__float_nav_recent";
  function recordVisit(pathVal) {
    try {
      var list = JSON.parse(localStorage.getItem(REC_KEY) || "[]").filter(function (p) { return p !== pathVal; });
      list.unshift(pathVal); localStorage.setItem(REC_KEY, JSON.stringify(list.slice(0, 4)));
    } catch (e) {}
  }
  var matchedCur = items.find(function (n) { return n.type === "dir" ? cur.startsWith(n.path) : cur === n.path; });
  if (matchedCur) recordVisit(matchedCur.path);

  function renderRecent() {
    try {
      var list = JSON.parse(localStorage.getItem(REC_KEY) || "[]");
      var recItems = list.map(function (p) { return items.find(function (n) { return n.path === p; }); }).filter(Boolean).slice(0, 3);
      if (!recItems.length) { recBox.style.display = "none"; return; }
      recBox.style.display = "block"; recRow.innerHTML = "";
      recItems.forEach(function (n) {
        var a = document.createElement("a"); a.className = "rec-chip"; a.href = n.path;
        a.innerHTML = '<span>' + (n.icon || "🔗") + '</span><span>' + formatTitle(n.name) + '</span>';
        a.addEventListener("mouseenter", function () { playFx("hover"); });
        a.addEventListener("click", function () { recordVisit(n.path); });
        recRow.appendChild(a);
      });
    } catch (e) {}
  }
  renderRecent();

  var activeGroup = "ALL", groups = ["ALL"];
  items.forEach(function (n) { if (n.group && groups.indexOf(n.group) === -1) groups.push(n.group); });

  function renderTabs() {
    if (groups.length <= 2) { tabBox.style.display = "none"; return; }
    tabBox.innerHTML = "";
    groups.forEach(function (g) {
      var b = document.createElement("button"); b.className = "tab" + (activeGroup === g ? " act" : "");
      b.textContent = g === "ALL" ? L.all : g;
      b.onclick = function (e) { e.stopPropagation(); activeGroup = g; playFx("hover"); renderTabs(); renderGrid(); };
      tabBox.appendChild(b);
    });
  }

  function renderGrid() {
    var kw = qIn.value.trim().toLowerCase();
    qClr.classList.toggle("show", kw.length > 0);
    var filtered = items.filter(function (n) {
      var matchGroup = activeGroup === "ALL" || n.group === activeGroup;
      var dispName = formatTitle(n.name).toLowerCase();
      return matchGroup && (!kw || dispName.indexOf(kw) !== -1 || n.path.toLowerCase().indexOf(kw) !== -1 || (n.group || "").toLowerCase().indexOf(kw) !== -1);
    });
    gridBox.innerHTML = "";
    if (!filtered.length) { gridBox.innerHTML = '<div class="empty">' + L.empty + '</div>'; return; }
    filtered.forEach(function (n, idx) {
      var a = document.createElement("a");
      var isAct = n.type === "dir" ? cur.startsWith(n.path) : cur === n.path;
      a.className = "card" + (isAct ? " a" : ""); a.href = n.path;
      a.style.transitionDelay = Math.min(idx * 20, 200) + "ms";
      if (/^https?:\/\//.test(n.path)) a.target = "_blank";
      a.innerHTML = '<span class="ico">' + (n.icon || "🔗") + '</span><span class="txt">' + formatTitle(n.name) + '</span>';
      a.addEventListener("mouseenter", function () { playFx("hover"); });
      a.addEventListener("click", function () { recordVisit(n.path); });
      gridBox.appendChild(a);
    });
  }
  renderTabs(); renderGrid();
  qIn.addEventListener("input", renderGrid);
  qIn.addEventListener("click", function (e) { e.stopPropagation(); });
  qClr.addEventListener("click", function (e) { e.stopPropagation(); qIn.value = ""; renderGrid(); qIn.focus(); });

  function syncTheme() {
    function parseRgb(str) {
      var m = (str || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
      return { r: +m[1], g: +m[2], b: +m[3] };
    }
    var bg = parseRgb(getComputedStyle(document.body).backgroundColor) || parseRgb(getComputedStyle(document.documentElement).backgroundColor);
    var isDark = bg ? (0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b) / 255 < 0.48 : (document.documentElement.classList.contains("dark") || document.documentElement.getAttribute("data-theme") === "dark" || matchMedia("(prefers-color-scheme: dark)").matches);
    host.classList.toggle("dark", isDark);
    var el = document.querySelector("a, button, [class*='primary']");
    if (el && !host.contains(el)) {
      var ac = parseRgb(getComputedStyle(el).backgroundColor) || parseRgb(getComputedStyle(el).color);
      if (ac && !(ac.r === ac.g && ac.g === ac.b)) {
        host.style.setProperty("--accent", "rgb(" + ac.r + "," + ac.g + "," + ac.b + ")");
        host.style.setProperty("--active-bg", "rgba(" + ac.r + "," + ac.g + "," + ac.b + "," + (isDark ? "0.2" : "0.12") + ")");
      }
    }
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
  if (document.body) new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });

  function updateDockPosition() {
    var rc = host.getBoundingClientRect(), isLeft = (rc.left + rc.width / 2) < innerWidth / 2;
    var topY = Math.max(20, Math.min(rc.top, innerHeight - 62));
    wrap.classList.toggle("from-left", isLeft); dock.classList.toggle("left-edge", isLeft);
    dock.querySelector(".dock-arr").textContent = isLeft ? "›" : "‹";
    dock.style.top = topY + "px"; dock.style.bottom = "auto";
    toast.style.top = (topY + 6) + "px"; toast.style.left = isLeft ? "34px" : "auto"; toast.style.right = isLeft ? "auto" : "34px";
  }

  var HIDE_KEY = "__float_nav_hidden", toastTimer = null;
  function setHidden(hidden, withCue) {
    if (hidden) { updateDockPosition(); toggle(false, true); }
    else { var rc = host.getBoundingClientRect(); wrap.classList.toggle("from-left", (rc.left + rc.width / 2) < innerWidth / 2); }
    wrap.classList.toggle("hidden", hidden); dock.classList.toggle("show", hidden);
    if (withCue) playFx(hidden ? "dock" : "undock");
    if (hidden && withCue) {
      dock.classList.remove("pulse"); void dock.offsetWidth; dock.classList.add("pulse");
      toast.classList.add("show"); clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2500);
    } else toast.classList.remove("show");
    try { localStorage.setItem(HIDE_KEY, hidden ? "1" : "0"); } catch (e) {}
  }

  var K = "__float_nav_pos";
  function setP(x, y) {
    var cl = Math.max(6, Math.min(x, innerWidth - 44)), ct = Math.max(6, Math.min(y, innerHeight - 44));
    host.style.left = cl + "px"; host.style.top = ct + "px"; host.style.right = "auto"; host.style.bottom = "auto";
    panel.classList.toggle("down", ct < innerHeight / 2); panel.classList.toggle("left", cl < innerWidth / 2);
  }
  try { var sv = JSON.parse(localStorage.getItem(K) || "null"); if (sv && typeof sv.x === "number") setP(sv.x, sv.y); } catch (e) {}
  try { if (localStorage.getItem(HIDE_KEY) === "1") setHidden(true, false); } catch (e) {}

  xBtn.onclick = function (e) { e.stopPropagation(); setHidden(true, true); };
  s.getElementById("hideBtn").onclick = function (e) { e.stopPropagation(); setHidden(true, true); };
  dock.onclick = function (e) { e.stopPropagation(); setHidden(false, true); };
  window.addEventListener("keydown", function (e) { if (e.altKey && (e.key === "m" || e.key === "M")) { e.preventDefault(); var w = !wrap.classList.contains("hidden"); setHidden(w, true); } });

  var dg = 0, mv = 0, sx = 0, sy = 0, ox = 0, oy = 0;
  function getPt(e) { return (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e; }
  function dn(e) { var t = getPt(e), rc = host.getBoundingClientRect(); dg = 1; mv = 0; sx = t.clientX; sy = t.clientY; ox = rc.left; oy = rc.top; }
  function mm(e) { if (!dg) return; var t = getPt(e), dx = t.clientX - sx, dy = t.clientY - sy; if (Math.abs(dx) > 4 || Math.abs(dy) > 4) mv = 1; if (mv) { e.preventDefault(); setP(ox + dx, oy + dy); } }
  function up() { if (!dg) return; dg = 0; if (mv) { var rc = host.getBoundingClientRect(); try { localStorage.setItem(K, JSON.stringify({ x: rc.left, y: rc.top })); } catch (e) {} } }
  btn.addEventListener("mousedown", dn); window.addEventListener("mousemove", mm); window.addEventListener("mouseup", up);
  btn.addEventListener("touchstart", dn, { passive: true }); window.addEventListener("touchmove", mm, { passive: false }); window.addEventListener("touchend", up);

  function fitPanel() {
    var rc = btn.getBoundingClientRect();
    var pw = Math.min(336, innerWidth - 16);
    var targetLeft = Math.max(8, Math.min(rc.right - pw, innerWidth - pw - 8));
    panel.style.left = (targetLeft - rc.left) + "px";
    panel.style.right = "auto";
    var openDown = rc.top < innerHeight / 2;
    panel.classList.toggle("down", openDown);
    var availH = openDown ? (innerHeight - rc.bottom - 14) : (rc.top - 14);
    panel.style.maxHeight = Math.max(180, Math.min(innerHeight * 0.72, availH)) + "px";
  }
  window.addEventListener("resize", function () {
    var rc = host.getBoundingClientRect();
    if (host.style.left) setP(rc.left, rc.top);
    if (panel.classList.contains("o")) fitPanel();
  });
  function toggle(show, silent) {
    var wasOpen = panel.classList.contains("o"), open = show !== undefined ? show : !wasOpen;
    if (open !== wasOpen && !silent) playFx(open ? "open" : "close");
    if (open) { syncTheme(); fitPanel(); }
    panel.classList.toggle("o", open); btn.classList.toggle("open", open);
    if (open) btn.classList.add("seen");
  }
  btn.onclick = function (e) { e.stopPropagation(); if (mv) { mv = 0; return; } toggle(); };
  document.addEventListener("click", function (e) { if (!host.contains(e.target)) toggle(false); });
}

function buildSnippet() {
  const menuList = getMenu();
  const fnCode = ("(" + clientMount.toString() + ")(" + JSON.stringify(menuList) + ");").replace(/<\/script/gi, "<\\/script");
  return [
    "",
    M_START,
    '<script async src="https://www.googletagmanager.com/gtm.js?id=' + GTM_ID + '"></script>',
    '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","' + GA_ID + '");</script>',
    '<div id="__nav_host" style="position:fixed;z-index:2147483647;right:22px;bottom:22px;touch-action:none;"></div>',
    '<script>' + fnCode + '</script>',
    M_END
  ].join("\n");
}

function run(dir, snippet) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) run(p, snippet);
    else if (e.isFile() && e.name.endsWith(".html")) {
      if (dir === PUBLIC_DIR && ["index.html", "privacy.html", "terms.html"].includes(e.name.toLowerCase())) continue;
      const raw = fs.readFileSync(p, "utf8");
      const sIdx = raw.indexOf(M_START), eIdx = raw.indexOf(M_END);
      const clean = (sIdx !== -1 && eIdx !== -1) ? raw.slice(0, sIdx).trimEnd() + "\n" + raw.slice(eIdx + M_END.length).trimStart() : raw;
      const next = /<\/body>/i.test(clean) ? clean.replace(/<\/body>/i, snippet + "\n</body>") : clean.trimEnd() + "\n" + snippet + "\n";
      fs.writeFileSync(p, next, "utf8");
      console.log("✔ 已注入:", path.relative(process.cwd(), p));
    }
  }
}

run(PUBLIC_DIR, buildSnippet());