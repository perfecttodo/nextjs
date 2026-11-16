/**
 * SparkFlow 灵流插件：语音速记捕获（独立文件）
 * 路径：./plugins/voice-capture.js
 * 能力：麦克风录音 + 实时语音转文字 + 声波可视化 + 卡片/详情语音渲染与模拟回放
 */
(function () {
  'use strict';

  const PLUGIN_ID = 'voice-capture', MODE = 'voice', NS = 'SparkFlowVoiceCapture', VERSION = '1.0.0';
  if (window[NS] && typeof window[NS].__teardown === 'function') { try { window[NS].__teardown(); } catch (e) {} }

  const S = { recording:false, sec:0, timer:null, recorder:null, chunks:[], stream:null, audioCtx:null, analyser:null, raf:null, speech:null, url:'' };
  const sim = {};

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const fmt = s => pad(Math.floor(s / 60)) + ':' + pad(s % 60);
  const parseDur = d => { const m = /^(\d+):(\d+)$/.exec(String(d || '')); return m ? (+m[1]) * 60 + (+m[2]) : 0; };
  const say = (m, o) => { if (typeof toast === 'function') toast(m, o); };
  const icons = () => { if (window.lucide) lucide.createIcons(); };
  const bars = () => document.querySelectorAll('#vcWaves span');

  /* ==================== 录制 ==================== */
  function flush() {
    if (S.chunks.length) { try { return URL.createObjectURL(new Blob(S.chunks, { type:'audio/webm' })); } catch (e) {} }
    return '';
  }

  function stopStreams() {
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; }
    if (S.speech) { try { S.speech.stop(); } catch (e) {} S.speech = null; }
    if (S.recorder && S.recorder.state !== 'inactive') { try { S.recorder.stop(); } catch (e) {} }
    if (S.stream) { S.stream.getTracks().forEach(t => t.stop()); S.stream = null; }
    if (S.audioCtx) { try { S.audioCtx.close(); } catch (e) {} S.audioCtx = null; }
    S.analyser = null;
  }

  async function start() {
    if (S.recording) return;
    S.recording = true; S.sec = 0;
    if (S.url) { try { URL.revokeObjectURL(S.url); } catch (e) {} S.url = ''; }
    S.chunks = [];
    const timerEl = $('vcTimer'), preview = $('vcPreview'), btn = $('vcRecBtn'), badge = $('vcBadge'), hint = $('vcHint');
    if (timerEl) timerEl.textContent = '00:00';
    if (preview) { preview.classList.add('hidden'); preview.removeAttribute('src'); }
    if (btn) btn.classList.add('animate-pulse', 'scale-105');
    if (badge) badge.textContent = '🎙️ 正在启动…';

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      try {
        const r = new SR();
        r.lang = 'zh-CN'; r.continuous = true; r.interimResults = true;
        r.onresult = ev => {
          let text = '';
          for (let i = 0; i < ev.results.length; i++) text += ev.results[i][0].transcript;
          const note = $('vcNote');
          if (note && text.trim()) note.value = text.trim();
        };
        r.onerror = () => {};
        r.start(); S.speech = r;
      } catch (e) {}
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no getUserMedia');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!S.recording) { stream.getTracks().forEach(t => t.stop()); return; }
      S.stream = stream;
      if (badge) badge.textContent = '🎙️ 真实麦克风采集';
      if (hint) hint.textContent = '正在录音与识别… 再次点击完成';
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC(), src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser();
        an.fftSize = 64; src.connect(an);
        S.audioCtx = ctx; S.analyser = an;
        const data = new Uint8Array(an.frequencyBinCount);
        const draw = () => {
          if (!S.recording) return;
          an.getByteFrequencyData(data);
          bars().forEach((b, i) => {
            const v = data[i % data.length] || 20;
            b.classList.add('bg-rose-500');
            b.style.height = Math.max(22, Math.min(100, Math.round(v / 255 * 100))) + '%';
          });
          S.raf = requestAnimationFrame(draw);
        };
        draw();
      }
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = e => { if (e.data && e.data.size) S.chunks.push(e.data); };
      rec.onstop = () => {
        if (!S.url) S.url = flush();
        const p = $('vcPreview');
        if (p && S.url) { p.src = S.url; p.classList.remove('hidden'); }
      };
      rec.start(); S.recorder = rec;
    } catch (err) {
      if (badge) badge.textContent = '✨ 智能声波模拟';
      if (hint) hint.textContent = '未获得麦克风权限，正在模拟录制… 再次点击完成';
      bars().forEach((b, i) => { b.classList.add('wave-active', 'bg-rose-500'); b.style.height = (45 + ((i * 19) % 55)) + '%'; });
    }

    S.timer = setInterval(() => { S.sec++; const t = $('vcTimer'); if (t) t.textContent = fmt(S.sec); }, 1000);
  }

  function stop() {
    if (!S.recording) return;
    S.recording = false;
    clearInterval(S.timer); S.timer = null;
    if (!S.url) S.url = flush();
    stopStreams();
    const btn = $('vcRecBtn'), badge = $('vcBadge'), hint = $('vcHint'), preview = $('vcPreview');
    if (btn) btn.classList.remove('animate-pulse', 'scale-105');
    bars().forEach(b => { b.classList.remove('wave-active', 'bg-rose-500'); b.style.height = '32%'; });
    if (preview && S.url) { preview.src = S.url; preview.classList.remove('hidden'); }
    if (badge) badge.textContent = S.url ? '✅ 录音已就绪' : '✅ 录制完成（无音频文件）';
    if (hint) hint.textContent = S.url ? '可试听并微调转写文字，然后存入线索' : '补一句这条语音的核心要点，然后存入线索';
    const note = $('vcNote');
    if (note && !note.value.trim()) note.focus();
  }

  /* ==================== 模拟回放（演练样本无真实音频时） ==================== */
  function paintSim(id, pct, playing) {
    document.querySelectorAll(`[data-vc-sim="${id}"]`).forEach(w => {
      const bar = w.querySelector('[data-vc-prog]'); if (bar) bar.style.width = pct + '%';
      const lbl = w.querySelector('[data-vc-label]'); if (lbl) lbl.textContent = playing ? '⏸ 模拟回放中' : '▶ 模拟回放';
      w.querySelectorAll('[data-vc-bars] span').forEach(b => b.classList.toggle('wave-active', playing));
    });
  }

  function stopSim(id) {
    const s = sim[id]; if (!s) return;
    clearInterval(s.timer); delete sim[id]; paintSim(id, 0, false);
  }

  function simulate(id) {
    if (sim[id]) { stopSim(id); return; }
    Object.keys(sim).forEach(stopSim);
    const item = (typeof appState !== 'undefined' ? appState.items : []).find(i => i.id === id);
    const total = parseDur(item && item.mediaMeta && item.mediaMeta.duration) || 24;
    const st = { elapsed: 0, timer: null };
    sim[id] = st;
    say('▶ 模拟回放：该条为演练样本，无真实音频文件');
    paintSim(id, 0, true);
    st.timer = setInterval(() => {
      st.elapsed += 0.25;
      if (!document.querySelector(`[data-vc-sim="${id}"]`)) { stopSim(id); return; }
      paintSim(id, Math.min(100, Math.round(st.elapsed / total * 100)), true);
      if (st.elapsed >= total) { stopSim(id); say('⏹ 模拟回放结束'); }
    }, 250);
  }

  /* ==================== 捕获面板 ==================== */
  function mount(panel) {
    panel.innerHTML = `
      <div class="rounded-2xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200/70 dark:border-violet-500/20 p-4 flex flex-col items-center text-center gap-2.5">
        <div class="flex items-center justify-between w-full text-[11px]">
          <span id="vcBadge" class="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-semibold">🎙️ 准备就绪</span>
          <span id="vcTimer" class="font-mono font-bold text-violet-700 dark:text-violet-300">00:00</span>
        </div>
        <div id="vcWaves" class="flex items-center gap-1.5 h-9 w-full justify-center">${Array.from({ length: 18 }).map((_, i) => `<span class="w-1.5 rounded-full bg-violet-400/50 transition-all duration-100" style="height:32%;animation-delay:${(i % 5) * 0.1}s"></span>`).join('')}</div>
        <button type="button" id="vcRecBtn" onclick="SparkFlowVoiceCapture.toggle()" aria-label="开始或停止录音" class="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition-all"><i data-lucide="mic" class="w-7 h-7"></i></button>
        <p id="vcHint" class="text-xs text-slate-500 dark:text-slate-400">点击麦克风开始录音，支持实时语音转文字</p>
        <audio id="vcPreview" controls class="hidden w-full h-9 mt-1"></audio>
      </div>
      <input id="vcNote" type="text" placeholder="语音转写文字（说话时实时识别，也可手动微调）..." class="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-violet-500" />
      <div class="flex items-center gap-1.5 flex-wrap">
        <button type="button" onclick="SparkFlowVoiceCapture.insertTimestamp()" class="h-8 px-2.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[11px] font-bold active:scale-95">⏱ 插入时间戳</button>
        <button type="button" onclick="SparkFlowVoiceCapture.clear()" class="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold active:scale-95">🧹 清空</button>
        <span class="text-[11px] text-slate-400">未授权麦克风时自动切换为声波模拟</span>
      </div>`;
    icons();
  }

  function activate() {
    const badge = $('vcBadge'), hint = $('vcHint');
    if (S.recording) {
      if (hint) hint.textContent = '正在录音与识别… 再次点击完成';
    } else if (S.url) {
      if (badge) badge.textContent = '✅ 录音已就绪';
      if (hint) hint.textContent = '可试听并微调转写文字，然后存入线索';
    } else {
      if (badge) badge.textContent = '🎙️ 准备就绪';
      if (hint) hint.textContent = '点击麦克风开始录音，支持实时语音转文字';
    }
  }

  function deactivate() { if (S.recording) stop(); }

  function collect() {
    if (S.recording) stop();
    const note = $('vcNote');
    const content = note ? note.value.trim() : '';
    if (!content) { if (note) note.focus(); return null; }
    if (!S.url && S.sec === 0) return { content, mediaType: 'text', mediaMeta: {} };
    return { content, mediaMeta: { duration: fmt(S.sec), audioUrl: S.url || '' } };
  }

  function reset() {
    S.sec = 0; S.url = ''; S.chunks = [];
    const note = $('vcNote'), preview = $('vcPreview'), timer = $('vcTimer'), badge = $('vcBadge'), hint = $('vcHint');
    if (note) note.value = '';
    if (preview) { preview.classList.add('hidden'); preview.removeAttribute('src'); }
    if (timer) timer.textContent = '00:00';
    if (badge) badge.textContent = '🎙️ 准备就绪';
    if (hint) hint.textContent = '点击麦克风开始录音，支持实时语音转文字';
    bars().forEach(b => { b.classList.remove('wave-active', 'bg-rose-500'); b.style.height = '32%'; });
  }

  /* ==================== 媒体渲染 ==================== */
  function badge(item) { return `🎙️ 语音 ${(item.mediaMeta && item.mediaMeta.duration) || '00:20'}`; }

  function waveStrip(item, big) {
    const m = item.mediaMeta || {};
    const count = big ? 32 : 20;
    return `<div data-vc-sim="${item.id}" onclick="event.stopPropagation(); SparkFlowVoiceCapture.simulate('${item.id}')" class="${big ? '' : 'mt-2.5 '}px-3 py-2.5 rounded-xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-500/20 space-y-1.5 active:scale-[0.99] cursor-pointer">
      <div class="flex items-center gap-2.5">
        <span class="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white flex items-center justify-center text-xs shrink-0">▶</span>
        <div data-vc-bars class="flex-1 flex items-center gap-1 h-4 overflow-hidden">${Array.from({ length: count }).map((_, i) => `<span class="flex-1 bg-violet-400/70 rounded-full" style="height:${28 + ((i * 23) % 68)}%;animation-delay:${(i % 5) * 0.08}s"></span>`).join('')}</div>
        <span class="text-[11px] font-mono text-violet-700 dark:text-violet-300 shrink-0">${esc(m.duration || '00:28')}</span>
      </div>
      <div class="flex items-center gap-2">
        <span data-vc-label class="text-[10px] font-semibold text-violet-600 dark:text-violet-300 shrink-0">▶ 模拟回放</span>
        <div class="flex-1 h-1 rounded-full bg-violet-100 dark:bg-slate-800 overflow-hidden"><div data-vc-prog class="h-full bg-violet-500 transition-all duration-200" style="width:0%"></div></div>
      </div>
    </div>`;
  }

  function card(item) {
    const m = item.mediaMeta || {};
    if (m.audioUrl) return `<div onclick="event.stopPropagation()" class="mt-2.5"><audio src="${esc(m.audioUrl)}" controls class="w-full h-9 rounded-xl"></audio></div>`;
    if (m.expired) return `<div onclick="event.stopPropagation()" class="mt-2.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">🎙️ 录音文件仅存于录制会话，转写文字已保留</div>`;
    return waveStrip(item, false);
  }

  function detail(item) {
    const m = item.mediaMeta || {};
    if (m.audioUrl) return `<audio src="${esc(m.audioUrl)}" controls class="w-full h-9"></audio>`;
    if (m.expired) return `<div class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">🎙️ 录音文件仅存于录制时的会话，转写文字已完整保留${m.duration ? ' · ' + esc(m.duration) : ''}</div>`;
    return waveStrip(item, true);
  }

  /* ==================== 注册 ==================== */
  function boot() {
    if (typeof appState === 'undefined' || !window.SparkFlowSDK || !window.SparkFlowSDK.registerCaptureMode) { console.warn('[语音捕获] 未检测到 SparkFlow 宿主'); return; }
    if (!appState.plugins.some(p => p.id === PLUGIN_ID)) {
      appState.plugins.push({ id: PLUGIN_ID, emoji: '🎙️', name: '语音速记捕获', desc: '麦克风录音 + 实时语音转文字，卡片内声波回放', enabled: true, builtin: false, actionType: 'capture', actionText: '打开语音捕获', actionMode: MODE, cardAction: false });
      persist();
    }
    SparkFlowSDK.registerCaptureMode({ id: MODE, pluginId: PLUGIN_ID, emoji: '🎙️', label: '语音', emptyHint: '请补一句这条语音的核心要点', mount, activate, deactivate, collect, reset });
    SparkFlowSDK.registerMediaRenderer({ mediaType: MODE, pluginId: PLUGIN_ID, badge, card, detail });
    console.info(`🎙️ SparkFlow 插件已加载：语音速记捕获 v${VERSION}`);
  }

  window[NS] = {
    version: VERSION,
    toggle() { S.recording ? stop() : start(); },
    start, stop, simulate,
    open() { if (typeof quickCapture === 'function') quickCapture(MODE); },
    insertTimestamp() {
      const note = $('vcNote'); if (!note) return;
      const stamp = `[${fmt(S.sec)}] `;
      const pos = note.selectionStart || note.value.length;
      note.value = note.value.slice(0, pos) + stamp + note.value.slice(pos);
      note.focus(); note.setSelectionRange(pos + stamp.length, pos + stamp.length);
    },
    clear() { reset(); say('已清空当前语音草稿'); },
    __teardown() {
      S.recording = false;
      clearInterval(S.timer); S.timer = null;
      stopStreams();
      Object.keys(sim).forEach(stopSim);
      if (S.url && !(typeof appState !== 'undefined' && appState.items.some(i => i.mediaMeta && i.mediaMeta.audioUrl === S.url))) {
        try { URL.revokeObjectURL(S.url); } catch (e) {}
      }
      S.url = ''; S.chunks = [];
    }
  };

  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
  else setTimeout(boot, 0);
})();