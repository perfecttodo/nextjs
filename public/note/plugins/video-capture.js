/**
 * SparkFlow 灵流插件：视频灵感捕获（独立文件）
 * 路径：./plugins/video-capture.js
 * 能力：摄像头取景 + 前后镜头切换 + 视频录制 + 卡片/详情视频渲染与模拟回放
 */
(function () {
  'use strict';

  const PLUGIN_ID = 'video-capture', MODE = 'video', NS = 'SparkFlowVideoCapture', VERSION = '1.0.0';
  if (window[NS] && typeof window[NS].__teardown === 'function') { try { window[NS].__teardown(); } catch (e) {} }

  const S = { recording:false, sec:0, timer:null, recorder:null, chunks:[], stream:null, facing:'environment', url:'', simulated:false };
  const sim = {};

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const fmt = s => pad(Math.floor(s / 60)) + ':' + pad(s % 60);
  const parseDur = d => { const m = /^(\d+):(\d+)$/.exec(String(d || '')); return m ? (+m[1]) * 60 + (+m[2]) : 0; };
  const say = (m, o) => { if (typeof toast === 'function') toast(m, o); };
  const icons = () => { if (window.lucide) lucide.createIcons(); };

  /* ==================== 录制 ==================== */
  function flush() {
    if (S.chunks.length) { try { return URL.createObjectURL(new Blob(S.chunks, { type:'video/webm' })); } catch (e) {} }
    return '';
  }

  function stopStream() {
    if (S.recorder && S.recorder.state !== 'inactive') { try { S.recorder.stop(); } catch (e) {} }
    if (S.stream) { S.stream.getTracks().forEach(t => t.stop()); S.stream = null; }
  }

  async function start() {
    if (S.recording) return;
    S.recording = true; S.sec = 0; S.simulated = false; S.chunks = [];
    if (S.url) { try { URL.revokeObjectURL(S.url); } catch (e) {} S.url = ''; }
    const video = $('vdPreview'), ph = $('vdPlaceholder'), simBox = $('vdSim'), rec = $('vdRec'), btn = $('vdRecBtn'), timer = $('vdTimer'), engine = $('vdEngine');
    if (timer) timer.textContent = '00:00';
    if (btn) btn.textContent = '点击停止录制';
    if (rec) rec.classList.remove('hidden');
    if (video) { video.controls = false; video.muted = true; video.removeAttribute('src'); video.srcObject = null; }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no camera');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: S.facing }, audio: true });
      if (!S.recording) { stream.getTracks().forEach(t => t.stop()); return; }
      S.stream = stream;
      if (video) { video.srcObject = stream; video.classList.remove('hidden'); try { await video.play(); } catch (e) {} }
      if (ph) ph.classList.add('hidden');
      if (simBox) simBox.classList.add('hidden');
      if (engine) engine.textContent = '🎥 真实摄像头采集';
      const r = new MediaRecorder(stream);
      r.ondataavailable = e => { if (e.data && e.data.size) S.chunks.push(e.data); };
      r.onstop = () => {
        if (!S.url) S.url = flush();
        const v = $('vdPreview');
        if (v && S.url) { v.srcObject = null; v.src = S.url; v.muted = false; v.controls = true; v.classList.remove('hidden'); }
      };
      r.start(); S.recorder = r;
    } catch (err) {
      S.simulated = true;
      if (video) video.classList.add('hidden');
      if (ph) ph.classList.add('hidden');
      if (simBox) simBox.classList.remove('hidden');
      if (engine) engine.textContent = '✨ 模拟取景器（未获得摄像头权限）';
    }

    S.timer = setInterval(() => { S.sec++; const t = $('vdTimer'); if (t) t.textContent = fmt(S.sec); }, 1000);
  }

  function stop() {
    if (!S.recording) return;
    S.recording = false;
    clearInterval(S.timer); S.timer = null;
    if (!S.url) S.url = flush();
    stopStream();
    const btn = $('vdRecBtn'), rec = $('vdRec'), video = $('vdPreview'), simBox = $('vdSim'), ph = $('vdPlaceholder'), engine = $('vdEngine');
    if (btn) btn.textContent = '重新录制画面';
    if (rec) rec.classList.add('hidden');
    if (simBox) simBox.classList.add('hidden');
    if (S.url && video) {
      video.srcObject = null; video.src = S.url; video.muted = false; video.controls = true; video.classList.remove('hidden');
      if (ph) ph.classList.add('hidden');
      if (engine) engine.textContent = '✅ 视频片段已就绪，可回放';
    } else {
      if (video) video.classList.add('hidden');
      if (ph) ph.classList.remove('hidden');
      const hint = $('vdHint'); if (hint) hint.textContent = '✅ 录制完成（无视频文件），补充画面要点即可存入';
      if (engine) engine.textContent = '模拟录制结束';
    }
    const note = $('vdNote'); if (note && !note.value.trim()) note.focus();
  }

  /* ==================== 模拟回放 ==================== */
  function paintSim(id, pct, playing) {
    document.querySelectorAll(`[data-vd-sim="${id}"]`).forEach(w => {
      const head = w.querySelector('[data-vd-head]'); if (head) head.style.left = `calc(${pct}% - 1px)`;
      const lbl = w.querySelector('[data-vd-label]'); if (lbl) lbl.textContent = playing ? '⏸ 模拟回放中' : '▶ 模拟回放';
      const sweep = w.querySelector('[data-vd-sweep]'); if (sweep) sweep.classList.toggle('film-sweep', playing);
    });
  }

  function stopSim(id) { const s = sim[id]; if (!s) return; clearInterval(s.timer); delete sim[id]; paintSim(id, 0, false); }

  function simulate(id) {
    if (sim[id]) { stopSim(id); return; }
    Object.keys(sim).forEach(stopSim);
    const item = (typeof appState !== 'undefined' ? appState.items : []).find(i => i.id === id);
    const total = parseDur(item && item.mediaMeta && item.mediaMeta.duration) || 30;
    const st = { elapsed: 0, timer: null };
    sim[id] = st;
    say('▶ 模拟回放：该条为演练样本，无真实视频文件');
    paintSim(id, 0, true);
    st.timer = setInterval(() => {
      st.elapsed += 0.25;
      if (!document.querySelector(`[data-vd-sim="${id}"]`)) { stopSim(id); return; }
      paintSim(id, Math.min(100, Math.round(st.elapsed / total * 100)), true);
      if (st.elapsed >= total) { stopSim(id); say('⏹ 模拟回放结束'); }
    }, 250);
  }

  /* ==================== 捕获面板 ==================== */
  function mount(panel) {
    panel.innerHTML = `
      <div class="rounded-2xl bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden aspect-video max-h-48 w-full border border-slate-800">
        <video id="vdPreview" playsinline muted class="hidden w-full h-full object-cover"></video>
        <div id="vdPlaceholder" class="flex flex-col items-center justify-center gap-2 p-4 text-center">
          <div class="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><i data-lucide="video" class="w-6 h-6"></i></div>
          <p id="vdHint" class="text-xs text-slate-300">点击下方按钮调用摄像头，或体验模拟取景器</p>
        </div>
        <div id="vdSim" class="hidden absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-fuchsia-900 overflow-hidden">
          <div class="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent film-sweep"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <span class="text-2xl">🎥</span>
            <span class="text-[11px] font-semibold text-slate-200">模拟取景器正在录制画面片段</span>
            <span class="text-[10px] text-slate-400">授权摄像头后可录制真实视频</span>
          </div>
        </div>
        <div id="vdRec" class="hidden absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-rose-600 text-[10px] font-bold flex items-center gap-1.5 shadow"><span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> REC <span id="vdTimer">00:00</span></div>
        <button type="button" onclick="SparkFlowVideoCapture.switchCamera()" aria-label="切换前后摄像头" class="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center active:scale-90"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
        <div class="absolute bottom-3 inset-x-0 flex justify-center">
          <button type="button" id="vdRecBtn" onclick="SparkFlowVideoCapture.toggle()" class="px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:brightness-110 active:scale-95 text-xs font-bold text-white shadow-lg transition-all">开始录制视频灵感</button>
        </div>
      </div>
      <input id="vdNote" type="text" placeholder="一句话补充视频画面核心内容..." class="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-sky-500" />
      <div class="flex items-center gap-1.5 flex-wrap">
        <button type="button" onclick="SparkFlowVideoCapture.switchCamera()" class="h-8 px-2.5 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[11px] font-bold active:scale-95">🔄 切换镜头</button>
        <button type="button" onclick="SparkFlowVideoCapture.clear()" class="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold active:scale-95">🧹 清空</button>
        <span id="vdEngine" class="text-[11px] text-slate-400">准备就绪</span>
      </div>`;
    icons();
  }

  function activate() {
    const engine = $('vdEngine');
    if (engine && !S.recording) engine.textContent = S.url ? '✅ 视频片段已就绪，可回放' : '准备就绪';
  }

  function deactivate() { if (S.recording) stop(); }

  function collect() {
    if (S.recording) stop();
    const note = $('vdNote');
    const content = note ? note.value.trim() : '';
    if (!content) { if (note) note.focus(); return null; }
    if (!S.url && S.sec === 0) return { content, mediaType: 'text', mediaMeta: {} };
    return { content, mediaMeta: { duration: fmt(S.sec), videoUrl: S.url || '' } };
  }

  function reset() {
    S.sec = 0; S.url = ''; S.chunks = []; S.simulated = false;
    const note = $('vdNote'), video = $('vdPreview'), ph = $('vdPlaceholder'), simBox = $('vdSim'), timer = $('vdTimer'), btn = $('vdRecBtn'), engine = $('vdEngine'), hint = $('vdHint');
    if (note) note.value = '';
    if (video) { video.classList.add('hidden'); video.controls = false; video.removeAttribute('src'); video.srcObject = null; }
    if (ph) ph.classList.remove('hidden');
    if (simBox) simBox.classList.add('hidden');
    if (timer) timer.textContent = '00:00';
    if (btn) btn.textContent = '开始录制视频灵感';
    if (engine) engine.textContent = '准备就绪';
    if (hint) hint.textContent = '点击下方按钮调用摄像头，或体验模拟取景器';
  }

  /* ==================== 媒体渲染 ==================== */
  function badge(item) { return `🎬 视频 ${(item.mediaMeta && item.mediaMeta.duration) || '00:35'}`; }

  function filmStrip(item, big) {
    const m = item.mediaMeta || {};
    const cells = big ? 10 : 6;
    return `<div data-vd-sim="${item.id}" onclick="event.stopPropagation(); SparkFlowVideoCapture.simulate('${item.id}')" class="${big ? '' : 'mt-2.5 '}rounded-xl overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 text-white active:scale-[0.99] cursor-pointer">
      <div class="relative px-3 py-2.5 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 text-xs min-w-0"><span class="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center shrink-0">🎬</span><span data-vd-label class="font-semibold truncate">▶ 模拟回放</span></div>
          <span class="text-[11px] font-mono text-slate-300 shrink-0">${esc(m.duration || '00:35')}</span>
        </div>
        <div class="relative flex items-center gap-1 h-6 overflow-hidden rounded-md bg-black/40 px-1">
          ${Array.from({ length: cells }).map((_, i) => `<span class="flex-1 h-4 rounded-sm" style="background:linear-gradient(135deg,hsl(${(230 + i * 16) % 360} 70% 45%),hsl(${(280 + i * 12) % 360} 70% 32%))"></span>`).join('')}
          <span data-vd-sweep class="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/25 to-transparent"></span>
          <span data-vd-head class="absolute inset-y-0 w-[2px] bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,.9)]" style="left:0%"></span>
        </div>
      </div>
    </div>`;
  }

  function card(item) {
    const m = item.mediaMeta || {};
    if (m.videoUrl) return `<div onclick="event.stopPropagation()" class="mt-2.5 rounded-2xl overflow-hidden bg-black aspect-video max-h-44"><video src="${esc(m.videoUrl)}" controls playsinline class="w-full h-full object-cover"></video></div>`;
    if (m.expired) return `<div onclick="event.stopPropagation()" class="mt-2.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">🎬 视频文件仅存于录制会话，画面描述已保留</div>`;
    return filmStrip(item, false);
  }

  function detail(item) {
    const m = item.mediaMeta || {};
    if (m.videoUrl) return `<video src="${esc(m.videoUrl)}" controls playsinline class="w-full max-h-44 rounded-xl bg-black"></video>`;
    if (m.expired) return `<div class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">🎬 视频文件仅存于录制时的会话，画面描述已完整保留${m.duration ? ' · ' + esc(m.duration) : ''}</div>`;
    return filmStrip(item, true);
  }

  /* ==================== 注册 ==================== */
  function boot() {
    if (typeof appState === 'undefined' || !window.SparkFlowSDK || !window.SparkFlowSDK.registerCaptureMode) { console.warn('[视频捕获] 未检测到 SparkFlow 宿主'); return; }
    if (!appState.plugins.some(p => p.id === PLUGIN_ID)) {
      appState.plugins.push({ id: PLUGIN_ID, emoji: '🎬', name: '视频灵感捕获', desc: '摄像头取景与录制、前后镜头切换，卡片内胶片回放', enabled: true, builtin: false, actionType: 'capture', actionText: '打开视频捕获', actionMode: MODE, cardAction: false });
      persist();
    }
    SparkFlowSDK.registerCaptureMode({ id: MODE, pluginId: PLUGIN_ID, emoji: '🎬', label: '视频', emptyHint: '请用一句话补充视频画面的核心内容', mount, activate, deactivate, collect, reset });
    SparkFlowSDK.registerMediaRenderer({ mediaType: MODE, pluginId: PLUGIN_ID, badge, card, detail });
    console.info(`🎬 SparkFlow 插件已加载：视频灵感捕获 v${VERSION}`);
  }

  window[NS] = {
    version: VERSION,
    toggle() { S.recording ? stop() : start(); },
    start, stop, simulate,
    open() { if (typeof quickCapture === 'function') quickCapture(MODE); },
    switchCamera() {
      S.facing = S.facing === 'environment' ? 'user' : 'environment';
      say(S.facing === 'environment' ? '已切换至后置摄像头' : '已切换至前置摄像头');
      if (S.recording) { stop(); setTimeout(start, 200); }
    },
    clear() { reset(); say('已清空当前视频草稿'); },
    __teardown() {
      S.recording = false;
      clearInterval(S.timer); S.timer = null;
      stopStream();
      Object.keys(sim).forEach(stopSim);
      if (S.url && !(typeof appState !== 'undefined' && appState.items.some(i => i.mediaMeta && i.mediaMeta.videoUrl === S.url))) {
        try { URL.revokeObjectURL(S.url); } catch (e) {}
      }
      S.url = ''; S.chunks = [];
    }
  };

  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
  else setTimeout(boot, 0);
})();