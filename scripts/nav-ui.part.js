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
    ? { menu: "Menu", home: "Home", hide: "Hide", mute: "Mute UI Sounds", dockedHint: "Docked here (Alt+M)", showTip: "Click to restore menu (Alt+M)", dragTip: "Click to open / Drag to move" }
    : { menu: "导航", home: "返回首页", hide: "隐藏", mute: "开关交互音效", dockedHint: "已收起至此 (Alt+M)", showTip: "点击恢复导航菜单 (Alt+M)", dragTip: "点击展开 / 按住拖动" };

  function formatTitle(raw) {
    if (!isEn || !/^[a-z0-9_-]+$/i.test(raw)) return raw;
    return raw.replace(/[-_]+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // 零依赖 Web Audio API 程序合成微交互音效引擎
  var MUTE_KEY = "__float_nav_muted", isMuted = false, audioCtx = null, lastHoverT = 0;
  try { isMuted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}
  function playFx(type) {
    if (isMuted) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var now = audioCtx.currentTime;
      if (type === "hover") {
        if (now - lastHoverT < 0.045) return;
        lastHoverT = now;
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(1150, now); o.frequency.exponentialRampToValueAtTime(850, now + 0.022);
        g.gain.setValueAtTime(0.018, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
        o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.024);
      } else if (type === "open" || type === "close") {
        var freqs = type === "open" ? [523.25, 783.99] : [659.25, 440];
        freqs.forEach(function (f, idx) {
          var o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = "sine"; o.frequency.setValueAtTime(f, now + idx * 0.035);
          g.gain.setValueAtTime(0.0001, now + idx * 0.035);
          g.gain.linearRampToValueAtTime(0.042, now + idx * 0.035 + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + 0.14);
          o.connect(g); g.connect(audioCtx.destination); o.start(now + idx * 0.035); o.stop(now + idx * 0.035 + 0.15);
        });
      } else if (type === "dock" || type === "undock") {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(type === "dock" ? 540 : 280, now);
        o.frequency.exponentialRampToValueAtTime(type === "dock" ? 240 : 640, now + 0.11);
        g.gain.setValueAtTime(0.045, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.125);
      }
    } catch (e) {}
  }

  var style = document.createElement("style");
  style.textContent = [
    "*{box-sizing:border-box;font:13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}",
    ":host{--bg:rgba(255,255,255,.78);--btn-bg:rgba(255,255,255,.86);--fg:#1e293b;--fg-muted:#64748b;--border-outer:rgba(15,23,42,.13);--hover-bg:rgba(15,23,42,.06);--active-bg:rgba(37,99,235,.12);--accent:#2563eb;--shadow:0 14px 36px rgba(15,23,42,.16),inset 0 1px 0 rgba(255,255,255,.8)}",
    ":host(.dark){--bg:rgba(17,24,39,.82);--btn-bg:rgba(30,41,59,.86);--fg:#f1f5f9;--fg-muted:#94a3b8;--border-outer:rgba(255,255,255,.15);--hover-bg:rgba(255,255,255,.09);--active-bg:rgba(96,165,250,.18);--accent:#60a5fa;--shadow:0 18px 44px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.14)}",
    ".wrap{position:relative;display:inline-flex;align-items:center;opacity:1;transform:translateX(0) scale(1);transition:opacity .28s ease,transform .36s cubic-bezier(.34,1.56,.64,1)}",
    ".wrap.hidden{opacity:0;pointer-events:none;transform:translateX(26px) scale(.45)}",
    ".wrap.hidden.from-left{transform:translateX(-26px) scale(.45)}",
    ".b{position:relative;height:36px;min-width:36px;padding:0 10px;border-radius:999px;background:var(--btn-bg);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);color:var(--fg);border:1px solid var(--border-outer);box-shadow:0 4px 14px rgba(0,0,0,.15);cursor:grab;font-size:13px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:0;opacity:.88;user-select:none;transition:all .3s cubic-bezier(.34,1.56,.64,1)}",
    ".b::after{content:'';position:absolute;top:1px;right:1px;width:8px;height:8px;border-radius:50%;background:var(--accent);animation:dotPing 2.2s infinite}",
    "@keyframes dotPing{0%{box-shadow:0 0 0 0 var(--accent)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}",
    ".b.seen::after,.wrap:hover .b::after{animation:none;opacity:0}",
    ".wrap:hover .b,.b.open{opacity:1;gap:6px;padding:0 13px;border-color:var(--accent);box-shadow:0 8px 22px rgba(0,0,0,.2)}",
    ".b.open{background:var(--accent);color:#fff}",
    ".b-ico{display:inline-block;font-size:15px;line-height:1;transition:transform .3s cubic-bezier(.34,1.56,.64,1)}.b.open .b-ico{transform:rotate(90deg) scale(1.05)}",
    ".b-lbl{max-width:0;overflow:hidden;white-space:nowrap;opacity:0;transition:max-width .3s cubic-bezier(.16,1,.3,1),opacity .22s ease}",
    ".wrap:hover .b-lbl,.b.open .b-lbl{max-width:54px;opacity:1}",
    ".x-btn{position:absolute;top:-5px;right:-4px;width:16px;height:16px;border-radius:50%;background:var(--fg);color:var(--bg);border:none;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transform:scale(.5) rotate(-90deg);transition:all .24s cubic-bezier(.34,1.56,.64,1);z-index:2;padding:0}",
    ".wrap:hover .x-btn{opacity:.88;transform:scale(1) rotate(0deg)}.x-btn:hover{opacity:1;transform:scale(1.18);background:#ef4444;color:#fff}",
    ".dock{position:fixed;right:0;bottom:32px;height:42px;min-width:24px;padding:0 6px;border-radius:12px 0 0 12px;background:var(--btn-bg);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);color:var(--fg);border:1px solid var(--border-outer);border-right:none;box-shadow:-4px 6px 18px rgba(0,0,0,.16);cursor:pointer;display:inline-flex;align-items:center;gap:4px;opacity:0;pointer-events:none;transform:translateX(100%);user-select:none;transition:transform .38s cubic-bezier(.34,1.56,.64,1),opacity .26s ease,padding .25s ease,border-color .2s}",
    ".dock.show{opacity:.82;pointer-events:auto;transform:translateX(0)}",
    ".dock.left-edge{right:auto;left:0;border-radius:0 12px 12px 0;border-right:1px solid var(--border-outer);border-left:none;box-shadow:4px 6px 18px rgba(0,0,0,.16);flex-direction:row-reverse;transform:translateX(-100%)}",
    ".dock.left-edge.show{transform:translateX(0)}",
    ".dock:hover{opacity:1;padding:0 11px;border-color:var(--accent);color:var(--accent)}",
    ".dock.pulse{animation:dockBeacon 1.1s ease-out 2}",
    "@keyframes dockBeacon{0%{box-shadow:0 0 0 0 var(--accent);opacity:1}70%{box-shadow:0 0 0 10px transparent;opacity:1}100%{box-shadow:0 0 0 0 transparent}}",
    ".dock-arr{font-size:14px;font-weight:700;line-height:1;color:var(--accent);transition:transform .25s ease}.dock:hover .dock-arr{transform:scale(1.2)}",
    ".dock-txt{max-width:0;overflow:hidden;white-space:nowrap;font-size:12px;font-weight:600;opacity:0;transition:max-width .26s ease,opacity .2s ease}.dock:hover .dock-txt{max-width:48px;opacity:1}",
    ".toast{position:fixed;padding:5px 11px;border-radius:8px;background:var(--fg);color:var(--bg);font-size:12px;font-weight:500;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.22);opacity:0;pointer-events:none;transform:translateY(6px) scale(.94);transition:opacity .26s ease,transform .28s cubic-bezier(.16,1,.3,1);z-index:2147483647}",
    ".toast.show{opacity:.94;transform:translateY(0) scale(1)}",
    ".p{position:absolute;right:0;bottom:48px;width:248px;max-height:68vh;overflow-y:auto;background:var(--bg);backdrop-filter:blur(22px) saturate(180%);-webkit-backdrop-filter:blur(22px) saturate(180%);border:1px solid var(--border-outer);border-radius:15px;box-shadow:var(--shadow);padding:7px;opacity:0;visibility:hidden;transform:translateY(12px) scale(.92);transform-origin:bottom right;transition:opacity .24s ease,transform .32s cubic-bezier(.34,1.4,.64,1),visibility .24s}",
    ".p.o{opacity:1;visibility:visible;transform:translateY(0) scale(1)}",
    ".p.down{bottom:auto;top:48px;transform-origin:top right}.p.down:not(.o){transform:translateY(-12px) scale(.92)}",
    ".p.left{right:auto;left:0;transform-origin:bottom left}.p.down.left{transform-origin:top left}",
    ".t{display:flex;align-items:center;gap:3px;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid var(--hover-bg)}.t a.i{flex:1}",
    ".tool-btn{padding:6px 7px;border-radius:8px;border:none;background:transparent;color:var(--fg-muted);font-size:12px;cursor:pointer;transition:all .18s;white-space:nowrap}",
    ".tool-btn:hover{background:var(--hover-bg);color:var(--fg)}.tool-btn.danger:hover{color:#ef4444}",
    "a.i{position:relative;display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:9px;color:var(--fg);text-decoration:none;font-weight:500;white-space:nowrap;overflow:hidden;opacity:0;transform:translateY(6px);transition:opacity .26s ease,transform .26s cubic-bezier(.16,1,.3,1),background .18s,color .18s}",
    ".p.o a.i{opacity:1;transform:translateY(0)}",
