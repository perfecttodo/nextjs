(function () {
  'use strict';
  if (window.__sfAIVideoStepsLoaded) return;
  window.__sfAIVideoStepsLoaded = true;
  const PLUGIN_ID = 'ai-video-steps';
  const generating = {};
  const TYPES = { demo: { label: '产品演示', emoji: '🖥️', hook: '痛点场景开场，3秒内亮出解决方案', shots: '界面录屏+特写', bgm: '轻快电子', shoot: '录屏演示核心流程' }, talk: { label: '口播知识', emoji: '🗣️', hook: '抛出反常识结论或扎心提问', shots: '真人口播+字卡', bgm: '低保真轻音乐', shoot: '录制口播机位，备2个B-roll' }, process: { label: '过程记录', emoji: '✏️', hook: '成品先行展示，倒叙制作过程', shots: '俯拍手部/屏幕加速', bgm: 'Lo-fi节奏', shoot: '俯拍或屏录创作过程' }, story: { label: '创意短片', emoji: '🎭', hook: '悬念画面+一句旁白钩子', shots: 'AI生成场景+氛围转场', bgm: '氛围感配乐', shoot: '收集3个空镜转场素材' } };
  const STAGES = ['🔍 解析灵感主题…', '🧠 匹配视频类型与风格…', '🎞️ 生成分镜与提示词…', '📋 编排制作步骤…'];
  const STYLE_OPTS = [['auto', '🪄 智能匹配'], ['demo', '🖥️ 产品演示'], ['talk', '🗣️ 口播知识'], ['process', '✏️ 过程记录'], ['story', '🎭 创意短片']];
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const findItem = id => appState.items.find(i => i.id === id);
  const icons = () => window.lucide && lucide.createIcons();
  function copyText(text, msg) { const ok = () => toast(msg || '📋 已复制'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok).catch(() => { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); ok(); }); else { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); ok(); } }
  function detectType(text) { const hit = kws => kws.some(k => text.includes(k)); if (hit(['产品', '工具', '功能', '界面', 'App', '网站', 'MVP'])) return 'demo'; if (hit(['周报', '复盘', '总结', '管理', '效率', '知识'])) return 'talk'; if (hit(['设计', '原型', '草图', '排版', '案例'])) return 'process'; return 'story'; }
  function buildPlan(item, opts) {
    const text = (item.content || '').replace(/^语音速记：/, '').trim();
    const snippet = text.length > 42 ? text.slice(0, 42) + '…' : (text || '这条灵感');
    const typeKey = opts.style === 'auto' ? detectType(text) : opts.style;
    const t = TYPES[typeKey] || TYPES.story; const dur = parseInt(opts.duration, 10) || 30; const shots = dur <= 15 ? 3 : dur <= 30 ? 5 : 8; const ratio = opts.ratio || '9:16';
    const raw = [
      { icon: '📌', title: '定主题与前 3 秒钩子', eta: 10, desc: `围绕「${snippet}」提炼一句话卖点；开场策略：${t.hook}`, prompt: `你是短视频编导。请围绕主题「${snippet}」写 5 个 3 秒内的开场钩子文案，视频风格：${t.label}，目标时长 ${dur} 秒。` },
      { icon: '✍️', title: '写脚本与分镜表', eta: 15, desc: `按「钩子 → 痛点 → 方案 → 行动号召」四段结构，输出 ${shots} 个分镜`, prompt: `为主题「${snippet}」撰写 ${dur} 秒短视频分镜脚本，共 ${shots} 个镜头。每个镜头包含：画面描述、台词/字幕、时长、运镜方式。画幅 ${ratio}，风格：${t.label}。` },
      { icon: '🎞️', title: 'AI 生成画面素材', eta: 20, desc: `${t.shots}；推荐工具：即梦 / 可灵 / Runway`, prompt: `${t.label}风格，${ratio} 画幅：${snippet}。电影感光影，镜头缓慢推进，画面干净留白用于叠加字幕，单镜头时长 ${Math.min(dur, 10)} 秒。` },
      { icon: '🎬', title: '录制补充素材', eta: 15, desc: t.shoot, prompt: `为「${snippet}」的 ${t.label}视频列一份拍摄/录屏清单：机位、景别、每条素材时长与拍摄要点，控制在 30 分钟内可完成。` },
      { icon: '🎙️', title: 'AI 配音与字幕', eta: 10, desc: '用 TTS 生成口播，自动识别字幕并逐句校对', prompt: `将以下脚本转为口播配音稿：口语化、每句不超过 18 字，标注停顿与重音，结尾加一句行动号召。\n{粘贴第 2 步脚本}` },
      { icon: '✂️', title: '剪辑合成与节奏', eta: 20, desc: `按分镜拼接，BGM：${t.bgm}；卡点转场，前 3 秒不加片头`, prompt: `给出 ${dur} 秒短视频的剪辑节奏表：BGM 风格为${t.bgm}，画幅 ${ratio}，标注每个转场时间点、字幕弹出时机与音效位置。` },
      { icon: '🚀', title: '发布与复盘', eta: 10, desc: '生成 3 版标题 + 封面文案，发布 24h 后记录完播率', prompt: `为「${snippet}」生成 3 版短视频标题（≤20 字，悬念/数字/利益点各一版）+ 5 个话题标签 + 封面大字文案（≤8 字）。` }
    ];
    return { createdAt: Date.now(), typeKey, opts: { style: opts.style, duration: String(dur), ratio }, steps: raw.map((s, i) => ({ id: 'vs-' + Date.now() + '-' + i, done: false, ...s })) };
  }
  const totalEta = p => p.steps.reduce((n, s) => n + (s.eta || 0), 0);
  function planMarkdown(item) {
    const p = item.aiVideoPlan; if (!p) return '';
    const t = TYPES[p.typeKey] || TYPES.story, done = p.steps.filter(s => s.done).length;
    const lines = [`## 🎬 AI 视频制作步骤（${t.label} · ${p.opts.duration}s · ${p.opts.ratio}）`, `> 进度 ${done}/${p.steps.length} · 预计总耗时 ≈ ${totalEta(p)} 分钟`, ''];
    p.steps.forEach((s, i) => { lines.push(`- [${s.done ? 'x' : ' '}] **${i + 1}. ${s.icon} ${s.title}**（⏱ ${s.eta} 分钟）`); lines.push(`  - ${s.desc}`); lines.push(`  - 🪄 提示词：${s.prompt.replace(/\s*\n\s*/g, ' ')}`); });
    return lines.join('\n');
  }
  function cardChip(item) {
    const p = item.aiVideoPlan, total = p.steps.length, done = p.steps.filter(s => s.done).length, pct = Math.round(done / total * 100);
    return `<div onclick="event.stopPropagation(); SparkFlowAIVideo.openFor('${item.id}')" class="mt-2.5 px-3 py-2 rounded-xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-500/20 flex items-center gap-2.5 active:scale-[0.99] cursor-pointer"><span class="text-xs font-semibold text-violet-700 dark:text-violet-300 shrink-0">🎬 视频步骤 ${done}/${total}</span><div class="flex-1 h-1.5 rounded-full bg-violet-100 dark:bg-slate-800 overflow-hidden"><div class="h-full bg-violet-500 transition-all duration-300" style="width:${pct}%"></div></div><span class="text-[11px] font-mono text-violet-600 dark:text-violet-300 shrink-0">${pct}%</span></div>`;
  }
  function panelHTML(item) {
    const g = generating[item.id], p = item.aiVideoPlan;
    const opts = (p && p.opts) || { style: 'auto', duration: '30', ratio: '9:16' };
    const selCls = 'h-9 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold focus:outline-none focus:border-violet-500 disabled:opacity-50';
    const head = `<div class="flex items-center justify-between gap-2"><h4 class="text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5"><span>🎬</span><span>AI 视频制作步骤</span>${p ? `<span class="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-[10px] font-semibold">${(TYPES[p.typeKey] || TYPES.story).emoji} ${(TYPES[p.typeKey] || TYPES.story).label}</span>` : ''}</h4>${p && !g ? `<button type="button" onclick="SparkFlowAIVideo.generate('${item.id}')" title="按当前设置重新生成" class="w-7 h-7 rounded-lg flex items-center justify-center text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/40 active:scale-90"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i></button>` : ''}</div>`;
    const controls = `<div class="grid grid-cols-3 gap-2"><select id="avsStyle" onchange="SparkFlowAIVideo.saveOpts('${item.id}')" ${g ? 'disabled' : ''} class="${selCls}">${STYLE_OPTS.map(([v, l]) => `<option value="${v}" ${opts.style === v ? 'selected' : ''}>${l}</option>`).join('')}</select><select id="avsDur" onchange="SparkFlowAIVideo.saveOpts('${item.id}')" ${g ? 'disabled' : ''} class="${selCls}">${['15', '30', '60'].map(v => `<option value="${v}" ${opts.duration === v ? 'selected' : ''}>⏱ ${v} 秒</option>`).join('')}</select><select id="avsRatio" onchange="SparkFlowAIVideo.saveOpts('${item.id}')" ${g ? 'disabled' : ''} class="${selCls}">${[['9:16', '📱 9:16 竖屏'], ['16:9', '🖥 16:9 横屏'], ['1:1', '⬜ 1:1 方形']].map(([v, l]) => `<option value="${v}" ${opts.ratio === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
    let body;
    if (g) body = `<div class="flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300"><i data-lucide="sparkles" class="w-4 h-4 animate-pulse"></i><span>${STAGES[g.stage]}</span></div><div class="w-full h-1.5 rounded-full bg-violet-100 dark:bg-slate-800 overflow-hidden"><div class="h-full bg-violet-500 transition-all duration-300" style="width:${Math.round((g.stage + 1) / STAGES.length * 100)}%"></div></div>`;
    else if (!p) body = `<p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">将这条灵感拆解为可执行的视频制作流程，每一步附带可直接投喂给 AI 工具的提示词。</p><button type="button" onclick="SparkFlowAIVideo.generate('${item.id}')" class="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-violet-500/25 transition-all">✨ 生成视频制作步骤</button>`;
    else {
      const total = p.steps.length, done = p.steps.filter(s => s.done).length, pct = Math.round(done / total * 100);
      body = `<div class="flex items-center justify-between text-[11px]"><span class="font-semibold text-slate-500 dark:text-slate-400">${p.opts.duration}s · ${p.opts.ratio} · 预计 ≈ ${totalEta(p)} 分钟</span><span class="font-bold text-violet-600 dark:text-violet-300">${done}/${total} 步已完成</span></div><div class="w-full h-1.5 rounded-full bg-violet-100 dark:bg-slate-800 overflow-hidden"><div class="h-full bg-violet-500 transition-all duration-300" style="width:${pct}%"></div></div><div class="space-y-2">${p.steps.map((s, i) => `<div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5"><div class="flex items-start gap-2.5"><input type="checkbox" ${s.done ? 'checked' : ''} onchange="SparkFlowAIVideo.toggleStep('${item.id}','${s.id}')" class="mt-0.5 w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer" /><div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-2"><span class="text-xs font-bold ${s.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}">${s.icon} ${i + 1}. ${s.title}</span><span class="text-[10px] text-slate-400 shrink-0">⏱ ${s.eta} 分钟</span></div><p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${esc(s.desc)}</p><details class="mt-1"><summary class="text-[10px] font-semibold text-violet-600 dark:text-violet-300 cursor-pointer select-none">🪄 AI 提示词</summary><div class="mt-1 p-2 rounded-lg bg-violet-50/70 dark:bg-violet-950/30 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">${esc(s.prompt)}</div><button type="button" onclick="SparkFlowAIVideo.copyPrompt('${item.id}','${s.id}')" class="mt-1.5 h-7 px-2.5 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-[10px] font-bold active:scale-95">📋 复制提示词</button></details></div></div></div>`).join('')}</div><div class="flex items-center gap-2 pt-1"><button type="button" onclick="SparkFlowAIVideo.applyToGoal('${item.id}')" class="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold active:scale-[0.98] transition-all">🎯 写入目标 KR</button><button type="button" onclick="SparkFlowAIVideo.copyPlan('${item.id}')" class="flex-1 h-10 rounded-xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-slate-700 text-violet-600 dark:text-violet-300 text-xs font-bold active:scale-[0.98] transition-all">📋 复制完整方案</button></div>`;
    }
    return `<div id="aiVideoStepsSection" class="rounded-2xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/70 dark:border-violet-500/20 p-4 space-y-3">${head}${controls}${body}</div>`;
  }
  function refreshDetailPanel() {
    const backdrop = $('detailSheetBackdrop'), existing = $('aiVideoStepsSection');
    const enabled = typeof isPluginOn === 'function' && isPluginOn(PLUGIN_ID);
    const item = enabled && appState.editingItemId ? findItem(appState.editingItemId) : null;
    if (!enabled || !item || !backdrop || backdrop.classList.contains('hidden')) { existing && existing.remove(); return; }
    const host = document.querySelector('#detailSheetPanel .overflow-y-auto'); if (!host) return;
    const prev = existing && $('avsStyle') ? { style: $('avsStyle').value, duration: $('avsDur').value, ratio: $('avsRatio').value } : null;
    if (existing) existing.outerHTML = panelHTML(item); else host.insertAdjacentHTML('beforeend', panelHTML(item));
    if (prev && !item.aiVideoPlan && !generating[item.id]) { $('avsStyle').value = prev.style; $('avsDur').value = prev.duration; $('avsRatio').value = prev.ratio; }
    icons();
  }
  function readOpts(item) { const s = $('avsStyle'); if (s) return { style: s.value, duration: $('avsDur').value, ratio: $('avsRatio').value }; return (item.aiVideoPlan && item.aiVideoPlan.opts) || { style: 'auto', duration: '30', ratio: '9:16' }; }
  function generate(id) {
    const item = findItem(id); if (!item || generating[id] || !isPluginOn(PLUGIN_ID)) return;
    const opts = readOpts(item); generating[id] = { stage: 0, timer: null }; refreshDetailPanel();
    const tick = () => {
      const g = generating[id]; if (!g) return; g.stage++;
      if (g.stage < STAGES.length) { refreshDetailPanel(); g.timer = setTimeout(tick, 430); }
      else {
        delete generating[id]; const it = findItem(id);
        if (!it || !isPluginOn(PLUGIN_ID)) { refreshDetailPanel(); return; }
        it.aiVideoPlan = buildPlan(it, opts); persist(); renderAll(); toast(`🎬 已生成 ${it.aiVideoPlan.steps.length} 步视频制作方案`);
      }
    };
    generating[id].timer = setTimeout(tick, 430);
  }
  function openFor(id) { if (!isPluginOn(PLUGIN_ID)) { toast('请先在侧栏开启「AI 视频步骤」插件'); return; } window.openDetailSheet(id); const sec = $('aiVideoStepsSection'); sec && sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); const item = findItem(id); if (item && !item.aiVideoPlan && !generating[id]) generate(id); }
  function toggleStep(id, stepId) { const item = findItem(id), s = item?.aiVideoPlan?.steps.find(x => x.id === stepId); if (!s) return; s.done = !s.done; persist(); renderAll(); }
  function applyToGoal(id) {
    const item = findItem(id), p = item?.aiVideoPlan; if (!p) return;
    item.goal = item.goal || { priority: 'P1', deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), tasks: [] };
    item.goal.tasks = (item.goal.tasks || []).filter(t => t.src !== 'ai-video-steps');
    p.steps.forEach((s, i) => item.goal.tasks.push({ id: 't-' + Date.now() + '-' + i, text: `${s.icon} 视频${i+1}·${s.title}`, done: !!s.done, src: 'ai-video-steps' }));
    item.stage = 'goal'; if (item.thinking && !item.thinking.nextStep) item.thinking.nextStep = p.steps[0].title;
    persist(); if (appState.editingItemId === id) { appState.editingIsGoal = true; if (typeof syncGoalSwitchUI === 'function') syncGoalSwitchUI(); if (typeof renderDetailKrList === 'function') renderDetailKrList(item); const badge = $('detailStageBadge'); if (badge) badge.textContent = '🎯 工作目标'; }
    renderAll(); toast(`🎯 已把 ${p.steps.length} 个步骤同步到工作目标 KR`);
  }
  function patch() {
    if (window.__sfAIVideoPatched) return; window.__sfAIVideoPatched = true;
    const origCard = window.renderMobileCard; window.renderMobileCard = function (item) { const html = origCard.apply(this, arguments); if (!isPluginOn(PLUGIN_ID) || !item.aiVideoPlan) return html; const chip = cardChip(item), marker = '<div class="mt-3.5 pt-3 border-t', idx = html.lastIndexOf(marker); return idx > -1 ? html.slice(0, idx) + chip + html.slice(idx) : html.replace('</article>', chip + '</article>'); };
    const origOpen = window.openDetailSheet; window.openDetailSheet = function () { const r = origOpen.apply(this, arguments); refreshDetailPanel(); return r; };
    const origRenderAll = window.renderAll; window.renderAll = function () { const r = origRenderAll.apply(this, arguments); refreshDetailPanel(); return r; };
    const origRun = window.runCustomPlugin; window.runCustomPlugin = function (pluginId, itemId) { if (pluginId === PLUGIN_ID) { openFor(itemId); return; } return origRun.apply(this, arguments); };
    const origMd = window.buildCurrentItemMarkdown; window.buildCurrentItemMarkdown = function () { let md = origMd.apply(this, arguments); try { if (isPluginOn(PLUGIN_ID)) { const it = findItem(appState.editingItemId); if (it?.aiVideoPlan) md += '\n\n' + planMarkdown(it); } } catch (e) {} return md; };
    const origDelete = window.deleteCustomPlugin; window.deleteCustomPlugin = function (id) { if (id === PLUGIN_ID) { try { localStorage.setItem('sparkflow_ai_video_steps_uninstalled_v1', '1'); } catch (e) {} } return origDelete.apply(this, arguments); };
  }
  function register() { if (!appState.plugins.some(p => p.id === PLUGIN_ID)) { appState.plugins.push({ id: PLUGIN_ID, emoji: '🎬', name: 'AI 视频步骤', desc: '把灵感一键拆成 7 步制作流程，附 AI 提示词', enabled: true, builtin: false, actionType: 'video-steps', actionText: '打开 AI 视频步骤工作台' }); persist(); } }
  function bootstrap() {
    const required = ['renderMobileCard', 'openDetailSheet', 'renderAll', 'runCustomPlugin', 'buildCurrentItemMarkdown', 'deleteCustomPlugin', 'persist', 'toast', 'isPluginOn'];
    if (typeof appState === 'undefined' || required.some(k => typeof window[k] !== 'function')) return;
    let uninstalled = false; try { uninstalled = localStorage.getItem('sparkflow_ai_video_steps_uninstalled_v1') === '1'; } catch (e) {}
    if (!uninstalled) register(); patch(); renderAll(); console.info('🎬 SparkFlow 插件已加载：AI 视频步骤生成');
  }
  window.SparkFlowAIVideo = { version: '1.0.0', openFor, generate, toggleStep, applyToGoal, saveOpts(id) { const it = findItem(id); if (it?.aiVideoPlan && !generating[id]) { it.aiVideoPlan.opts = readOpts(it); persist(); } }, copyPrompt(id, stepId) { const s = findItem(id)?.aiVideoPlan?.steps.find(x => x.id === stepId); if (s) copyText(s.prompt, '🪄 提示词已复制'); }, copyPlan(id) { const it = findItem(id); if (it?.aiVideoPlan) copyText(planMarkdown(it), '📋 完整视频制作方案已复制'); }, reinstall() { try { localStorage.removeItem('sparkflow_ai_video_steps_uninstalled_v1'); } catch (e) {} register(); renderAll(); toast('🎬 已重新安装「AI 视频步骤」'); } };
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(bootstrap, 0)); else setTimeout(bootstrap, 0);
})();