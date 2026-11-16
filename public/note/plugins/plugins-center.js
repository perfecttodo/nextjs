/**
 * SparkFlow 灵流插件：插件中心 Plugins Center
 * 路径：./plugins/plugins-center.js
 * 能力：推荐目录一键安装 / URL·本地文件·源码安装 / 持久化自动加载 / 重载与卸载
 *      首次运行自动预装「语音速记捕获」「视频灵感捕获」
 */
(function () {
  'use strict';

  const CENTER_KEY = 'sparkflow_plugins_center_v1';
  const VERSION = '1.2.0';
  const PREINSTALL = ['voice-capture', 'video-capture'];

  if (window.__sparkflowPluginsCenterLoaded) return;
  window.__sparkflowPluginsCenterLoaded = true;

  let store = { version: 1, initialized: false, entries: [] };
  const ui = { open: false, tab: 'catalog' };

  const CATALOG = [
    { id:'voice-capture', emoji:'🎙️', name:'语音速记捕获', version:'1.0.0', provides:'捕获模式 · 语音', desc:'麦克风录音 + 实时语音转文字 + 声波可视化，卡片与详情页语音回放', sourceType:'url', url:'./plugins/voice-capture.js' },
    { id:'video-capture', emoji:'🎬', name:'视频灵感捕获', version:'1.0.0', provides:'捕获模式 · 视频', desc:'摄像头取景录制、前后镜头切换，卡片与详情页胶片式回放', sourceType:'url', url:'./plugins/video-capture.js' },
    { id:'ai-video-steps', emoji:'🎞️', name:'AI 视频步骤生成', version:'1.0.0', provides:'详情工作台', desc:'把灵感拆成「钩子→脚本→分镜→配音→剪辑→发布」7 步流程，附 AI 提示词，可写入目标 KR', sourceType:'url', url:'./plugins/ai-video-steps.js', lsFlagsToClear:['sparkflow_ai_video_steps_uninstalled_v1'] },
    { id:'ai-summary', emoji:'✨', name:'AI 灵感提炼', version:'1.0.0', provides:'卡片动作', desc:'自动归纳核心要点并生成可执行行动项', sourceType:'url', url:'./plugins/ai-summary.js' },
    { id:'focus-timer', emoji:'🍅', name:'极简番茄专注钟', version:'1.0.0', provides:'目标卡片', desc:'在工作目标卡片挂载专注倒计时', sourceType:'url', url:'./plugins/focus-timer.js' },
    { id:'auto-tagger', emoji:'🏷️', name:'智能关键词自动归类', version:'1.0.0', provides:'保存流程', desc:'保存灵感时自动扫描关键词并补充分类标签', sourceType:'url', url:'./plugins/auto-tagger.js' },
    { id:'quick-export', emoji:'📋', name:'Markdown 笔记导出', version:'1.0.0', provides:'详情工作台', desc:'在思考详情页挂载一键复制或下载 .md 文件', sourceType:'url', url:'./plugins/quick-export.js' },
    { id:'daily-review', emoji:'📊', name:'每日灵感复盘', version:'1.0.0', provides:'顶部导航', desc:'在顶部导航栏挂载今日数据复盘入口', sourceType:'url', url:'./plugins/daily-review.js' },
    { id:'demo-hello', emoji:'🧪', name:'演示插件 · 一键鼓励', version:'1.0.0', provides:'卡片动作', desc:'示例：体验动态安装一个自定义卡片动作按钮', sourceType:'url', url:'./plugins/demo-hello.js' }
  ];

  const TEMPLATE = `/** SparkFlow 插件开发模板 */\n(function () {\n  'use strict';\n  function boot() {\n    if (typeof appState === 'undefined' || !window.SparkFlowSDK) return;\n    // 1) 卡片动作插件\n    SparkFlowSDK.register({ id: 'my-plugin', emoji: '⚡', name: '我的插件', actionType: 'toast', actionText: 'Hello SparkFlow!' });\n    // 2) 捕获模式插件（可选）\n    // SparkFlowSDK.registerCaptureMode({ id:'sketch', pluginId:'my-plugin', emoji:'✏️', label:'手绘',\n    //   mount(panel){ panel.innerHTML = '<textarea id="sk" class="w-full h-24 rounded-xl border p-3"></textarea>'; },\n    //   collect(){ const v = document.getElementById('sk').value.trim(); return v ? { content:v, mediaMeta:{} } : null; },\n    //   reset(){ document.getElementById('sk').value=''; } });\n    // 3) 媒体渲染插件（可选）\n    // SparkFlowSDK.registerMediaRenderer({ mediaType:'sketch', pluginId:'my-plugin', badge:()=>'✏️ 手绘', card:()=>'' });\n  }\n  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));\n  else setTimeout(boot, 0);\n})();`;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const icons = () => window.lucide && lucide.createIcons();

  function copyText(text, msg) {
    const ok = () => toast(msg || '📋 已复制');
    const legacy = () => { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('复制失败'); } ta.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok).catch(legacy); else legacy();
  }

  function loadStore() { try { const raw = localStorage.getItem(CENTER_KEY); if (raw) { const p = JSON.parse(raw); if (p && Array.isArray(p.entries)) store = Object.assign({ version:1, initialized:false }, p); } } catch (e) {} }
  function saveStore() { try { localStorage.setItem(CENTER_KEY, JSON.stringify(store)); } catch (e) { toast('⚠️ 插件中心存储失败（可能超出容量）'); } }

  /* ==================== 动态加载 ==================== */
  function loadScript(src, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      let done = false;
      const timer = setTimeout(() => { if (done) return; done = true; s.remove(); reject(new Error('加载超时')); }, timeout);
      s.onload = () => { if (done) return; done = true; clearTimeout(timer); resolve(); };
      s.onerror = () => { if (done) return; done = true; clearTimeout(timer); s.remove(); reject(new Error('脚本加载失败')); };
      document.body.appendChild(s);
    });
  }

  async function execEntry(entry, { bust = false } = {}) {
    entry.status = 'loading'; entry.error = ''; saveStore(); renderCenter();
    const before = new Set(appState.plugins.map(p => p.id));
    try {
      (entry.lsFlagsToClear || []).forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
      if (entry.sourceType === 'inline') {
        if (!entry.code || !entry.code.trim()) throw new Error('插件源码为空');
        const blobUrl = URL.createObjectURL(new Blob([entry.code], { type: 'text/javascript' }));
        try { await loadScript(blobUrl); } finally { URL.revokeObjectURL(blobUrl); }
      } else {
        if (!entry.url) throw new Error('插件地址为空');
        await loadScript(entry.url + (bust ? (entry.url.includes('?') ? '&' : '?') + '_pc=' + Date.now() : ''));
      }
      await new Promise(r => setTimeout(r, 160));
      const added = appState.plugins.map(p => p.id).filter(id => !before.has(id));
      if (!added.length && entry.catalogId && appState.plugins.some(p => p.id === entry.catalogId)) added.push(entry.catalogId);
      entry.pluginIds = Array.from(new Set([...(entry.pluginIds || []), ...added]));
      entry.status = 'loaded'; entry.loadedAt = Date.now();
    } catch (err) {
      entry.status = 'error'; entry.error = String((err && err.message) || err);
    }
    saveStore(); renderCenter(); renderAll();
    return entry.status === 'loaded';
  }

  function makeEntry(meta) {
    return {
      id: meta.id || 'pc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      catalogId: meta.catalogId || '', name: meta.name || '未命名插件', emoji: meta.emoji || '🧩',
      desc: meta.desc || '', version: meta.version || '', provides: meta.provides || '',
      sourceType: meta.sourceType, url: meta.url || '', code: meta.code || '',
      lsFlagsToClear: meta.lsFlagsToClear || [], pluginIds: [], status: 'pending', addedAt: Date.now()
    };
  }

  async function addEntry(meta) {
    if (store.entries.some(e => e.status === 'loading')) { toast('有插件正在加载，请稍候'); return; }
    if (meta.sourceType === 'url' && store.entries.some(e => e.sourceType === 'url' && e.url === meta.url)) { toast('该 URL 已安装'); return; }
    const entry = makeEntry(meta);
    store.entries.push(entry); saveStore(); renderCenter();
    const ok = await execEntry(entry);
    toast(ok ? `🧩 已安装「${entry.name}」` : `⚠️「${entry.name}」加载失败：${entry.error}`, { type: ok ? 'success' : 'danger' });
  }

  async function installCatalog(cid) {
    const c = CATALOG.find(x => x.id === cid); if (!c) return;
    if (store.entries.some(e => e.catalogId === cid)) { toast('该插件已安装'); return; }
    await addEntry(Object.assign({}, c, { catalogId: c.id, id: 'pc-' + c.id }));
  }

  async function reload(id) {
    const e = store.entries.find(x => x.id === id); if (!e || e.status === 'loading') return;
    const ok = await execEntry(e, { bust: true });
    toast(ok ? `🔄「${e.name}」已重新加载` : `⚠️ 重载失败：${e.error}`, { type: ok ? 'success' : 'danger' });
  }

  function uninstall(entryId) {
    const entry = store.entries.find(e => e.id === entryId); if (!entry) return;
    if (entry.status === 'loading') { toast('加载中，暂不能卸载'); return; }
    (entry.pluginIds || []).slice().forEach(pid => {
      if (appState.plugins.some(p => p.id === pid) && typeof window.deleteCustomPlugin === 'function') window.deleteCustomPlugin(pid);
    });
    if (store.entries.some(e => e.id === entryId)) { store.entries = store.entries.filter(e => e.id !== entryId); saveStore(); }
    renderCenter(); renderAll();
    toast(`🗑 已卸载「${entry.name}」，刷新后不再加载`);
  }

  function firstRunSetup() {
    if (store.initialized) return false;
    store.initialized = true;
    PREINSTALL.forEach(cid => {
      const c = CATALOG.find(x => x.id === cid);
      if (c && !store.entries.some(e => e.catalogId === cid)) store.entries.push(makeEntry(Object.assign({}, c, { catalogId: c.id, id: 'pc-' + c.id })));
    });
    saveStore();
    return true;
  }

  async function autoload(firstRun) {
    if (!store.entries.length) return;
    store.entries.forEach(e => { e.status = 'pending'; }); saveStore();
    toast(firstRun ? '🧩 正在初始化插件：语音 / 视频捕获…' : `🧩 插件中心：正在加载 ${store.entries.length} 个已安装插件…`);
    for (const e of store.entries) {
      await execEntry(e);
      if (e.status === 'error') toast(`⚠️「${e.name}」加载失败，可在插件中心重试`, { type: 'danger' });
    }
    renderAll();
    if (firstRun) toast('🎙️🎬 语音与视频捕获已就绪，点底部「+」试试', { type: 'success', duration: 3600 });
  }

  /* ==================== 自定义安装 ==================== */
  async function installFromUrl() {
    const url = ($('pcCustomUrl')?.value || '').trim();
    if (!url) { toast('请输入插件 URL'); return; }
    try { new URL(url, location.href); } catch (e) { toast('URL 格式不正确'); return; }
    if (!confirm(`即将从以下地址加载并执行脚本：\n${url}\n\n插件拥有页面全部权限，仅安装可信来源。继续？`)) return;
    const name = ($('pcCustomName')?.value || '').trim() || decodeURIComponent(url.split('/').pop().split('?')[0]).replace(/\.js$/i, '') || 'URL 插件';
    await addEntry({ name, desc: '从 URL 安装', sourceType: 'url', url });
    if ($('pcCustomUrl')) $('pcCustomUrl').value = '';
  }

  function installFromFile(ev) {
    const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast('文件过大（>2MB）'); return; }
    const reader = new FileReader();
    reader.onload = async e => {
      const code = String(e.target.result || '');
      if (!code.trim()) { toast('文件内容为空'); return; }
      if (!confirm(`即将安装并执行本地脚本「${f.name}」（${Math.max(1, Math.round(f.size / 1024))}KB）。\n仅安装可信来源，继续？`)) return;
      const name = ($('pcCustomName')?.value || '').trim() || f.name.replace(/\.js$/i, '');
      await addEntry({ name, desc: '本地文件安装', sourceType: 'inline', code });
    };
    reader.readAsText(f);
  }

  async function installFromCode() {
    const code = ($('pcCustomCode')?.value || '').trim();
    if (!code) { toast('请先粘贴插件源码'); return; }
    if (!confirm(`即将安装并执行粘贴的源码（${code.length} 字符）。\n仅安装可信来源，继续？`)) return;
    const name = ($('pcCustomName')?.value || '').trim() || '粘贴源码插件';
    await addEntry({ name, desc: '粘贴源码安装', sourceType: 'inline', code });
    if ($('pcCustomCode')) $('pcCustomCode').value = '';
  }

  /* ==================== UI ==================== */
  function injectModal() {
    if ($('pluginsCenterBackdrop')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="pluginsCenterBackdrop" class="fixed inset-0 z-50 hidden bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4" onclick="SparkFlowPluginsCenter.close()">
        <div id="pluginsCenterBox" onclick="event.stopPropagation()" class="w-full max-w-lg max-h-[86vh] rounded-3xl bg-white dark:bg-[#141926] border border-slate-200 dark:border-slate-800 shadow-2xl animate-pop-in flex flex-col overflow-hidden"></div>
      </div>`);
  }

  function patchSidebarHeader() {
    const list = $('sidebarPluginsList'), header = list && list.previousElementSibling;
    if (!header || header.dataset.pcPatched) return;
    header.dataset.pcPatched = '1';
    header.classList.add('flex', 'items-center', 'justify-between');
    header.insertAdjacentHTML('beforeend', `<button type="button" onclick="SparkFlowPluginsCenter.open()" class="h-7 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"><span>🧩</span><span>插件中心</span></button>`);
  }

  function catalogCard(c) {
    const inst = store.entries.find(e => e.catalogId === c.id);
    const external = !inst && appState.plugins.some(p => p.id === c.id);
    let action;
    if (inst && inst.status === 'loading') action = `<span class="h-8 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-[11px] font-bold inline-flex items-center shrink-0">⏳ 加载中</span>`;
    else if (inst && inst.status === 'error') action = `<button type="button" onclick="SparkFlowPluginsCenter.reload('${inst.id}')" class="h-8 px-3 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[11px] font-bold active:scale-95 shrink-0">重试</button>`;
    else if (inst) action = `<span class="h-8 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-[11px] font-bold inline-flex items-center shrink-0">✅ 已安装</span>`;
    else action = `<button type="button" onclick="SparkFlowPluginsCenter.installCatalog('${c.id}')" class="h-8 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold active:scale-95 shrink-0 transition-all">${external ? '纳入管理' : '安装'}</button>`;
    return `<div class="rounded-2xl bg-slate-50 dark:bg-[#131824] border border-slate-200/90 dark:border-slate-800 p-3.5 flex items-start gap-3">
      <div class="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 shadow-sm">${c.emoji}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <h4 class="font-bold text-sm">${esc(c.name)}</h4>
          <span class="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[9px] font-mono">v${esc(c.version)}</span>
          ${c.provides ? `<span class="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-300 text-[9px] font-bold">${esc(c.provides)}</span>` : ''}
          ${external ? '<span class="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[9px] font-bold">已外部引入</span>' : ''}
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">${esc(c.desc)}</p>
        <p class="text-[10px] text-slate-400 mt-1 truncate">${c.sourceType === 'url' ? '🔗 ' + esc(c.url) : '📄 内置源码'}</p>
      </div>${action}</div>`;
  }

  function installedBody() {
    if (!store.entries.length) return `<div class="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-2.5"><div class="text-3xl">📦</div><p class="text-sm font-semibold text-slate-700 dark:text-slate-300">还没有安装任何插件</p><button type="button" onclick="SparkFlowPluginsCenter.setTab('catalog')" class="h-9 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold active:scale-95">去推荐页逛逛</button></div>`;
    return store.entries.map(e => {
      const st = e.status === 'loaded' ? '<span class="text-emerald-500 font-semibold">✅ 已加载</span>' : e.status === 'loading' ? '<span class="text-slate-400 font-semibold">⏳ 加载中</span>' : '<span class="text-amber-500 font-semibold">⚠️ 加载失败</span>';
      const names = (e.pluginIds || []).map(id => appState.plugins.find(p => p.id === id)?.name || id).join('、');
      const off = (e.pluginIds || []).length && (e.pluginIds || []).every(id => { const p = appState.plugins.find(x => x.id === id); return p && !p.enabled; });
      return `<div class="rounded-2xl bg-slate-50 dark:bg-[#131824] border border-slate-200/90 dark:border-slate-800 p-3.5 space-y-1.5">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-lg shrink-0 shadow-sm">${e.emoji}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap"><h4 class="font-bold text-sm truncate">${esc(e.name)}</h4><span class="text-[10px] text-slate-400 shrink-0">${e.sourceType === 'url' ? '🔗 URL' : '📄 本地源码'}</span>${off ? '<span class="px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-500 text-[9px] font-bold">已停用</span>' : ''}</div>
            <div class="text-[11px] mt-0.5">${st}${names ? `<span class="text-slate-400 ml-1.5">· 开关见侧栏「${esc(names)}」</span>` : ''}</div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button type="button" onclick="SparkFlowPluginsCenter.reload('${e.id}')" title="重新加载" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i></button>
            <button type="button" onclick="SparkFlowPluginsCenter.uninstall('${e.id}')" title="卸载" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
        </div>
        ${e.status === 'error' && e.error ? `<p class="text-[10px] text-amber-600 dark:text-amber-300">${esc(e.error)}${e.sourceType === 'url' ? '（请检查地址是否可访问）' : ''}</p>` : ''}
      </div>`;
    }).join('');
  }

  function customBody(prev) {
    const inputCls = 'w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-indigo-500';
    return `
      <div class="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 p-3 text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">⚠️ 插件脚本拥有页面全部权限，请仅安装可信来源的代码。</div>
      <div><label class="block text-[11px] text-slate-500 mb-1">插件名称（可选）</label><input id="pcCustomName" value="${esc(prev.name || '')}" placeholder="例如：我的效率插件" class="${inputCls}" /></div>
      <div><label class="block text-[11px] text-slate-500 mb-1">从 URL 安装</label><div class="flex gap-2"><input id="pcCustomUrl" value="${esc(prev.url || '')}" placeholder="./plugins/my-plugin.js 或 https://..." class="${inputCls} flex-1" /><button type="button" onclick="SparkFlowPluginsCenter.installFromUrl()" class="h-10 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 active:scale-95">安装</button></div></div>
      <label class="w-full h-11 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-between cursor-pointer"><span>📄 选择本地 .js 文件安装</span><span>选择文件</span><input type="file" accept=".js,text/javascript" class="hidden" onchange="SparkFlowPluginsCenter.installFromFile(event)" /></label>
      <details class="group"><summary class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer select-none">📝 直接粘贴源码安装</summary><div class="mt-2 space-y-2"><textarea id="pcCustomCode" rows="5" placeholder="(function(){ ... })()" class="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 text-[11px] font-mono focus:outline-none focus:border-indigo-500 resize-none">${esc(prev.code || '')}</textarea><button type="button" onclick="SparkFlowPluginsCenter.installFromCode()" class="w-full h-9 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white text-xs font-bold active:scale-[0.98]">安装源码</button></div></details>
      <button type="button" onclick="SparkFlowPluginsCenter.copyTemplate()" class="w-full h-9 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-300 text-xs font-bold active:scale-[0.98]">📋 复制插件开发模板（含捕获模式示例）</button>`;
  }

  function renderCenter() {
    if (!ui.open) return;
    const box = $('pluginsCenterBox'); if (!box) return;
    const sc = $('pcBody') ? $('pcBody').scrollTop : 0;
    const prev = { name: $('pcCustomName')?.value, url: $('pcCustomUrl')?.value, code: $('pcCustomCode')?.value };
    const modes = (window.SparkFlowSDK && SparkFlowSDK.captureModes) ? SparkFlowSDK.captureModes() : [];
    const tabs = [['catalog', '🛍 推荐'], ['installed', `📦 已安装 ${store.entries.length}`], ['custom', '🔧 自定义']];
    const tabHtml = tabs.map(([k, l]) => `<button type="button" onclick="SparkFlowPluginsCenter.setTab('${k}')" class="h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${ui.tab === k ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs' : 'text-slate-500 dark:text-slate-400'}">${l}</button>`).join('');
    let body = '';
    if (ui.tab === 'catalog') {
      body = `<div class="rounded-xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200/70 dark:border-indigo-500/20 p-3 text-[11px] text-indigo-700 dark:text-indigo-300">当前捕获能力：📝 文字${modes.map(m => ' · ' + m.emoji + ' ' + esc(m.label)).join('')}</div>` +
        CATALOG.map(catalogCard).join('') +
        `<p class="text-[11px] text-slate-400 text-center pt-1">更多插件可在「自定义」页从 URL 或本地 .js 文件安装</p>`;
    } else if (ui.tab === 'installed') body = installedBody();
    else body = customBody(prev);
    box.innerHTML = `
      <div class="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-lg shadow-sm">🧩</div>
          <div><h3 class="font-bold text-base leading-tight">插件中心</h3><p class="text-[11px] text-slate-400">按需动态加载 · 本地持久化 · v${VERSION}</p></div>
        </div>
        <button type="button" onclick="SparkFlowPluginsCenter.close()" class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
      </div>
      <div class="px-5 pt-3 shrink-0"><div class="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900">${tabHtml}</div></div>
      <div id="pcBody" class="sf-scroll p-5 overflow-y-auto space-y-3 flex-1">${body}</div>
      <div class="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 shrink-0 pb-safe">插件源保存在本机 localStorage，刷新自动加载；卸载后刷新即彻底移除。</div>`;
    const nb = $('pcBody'); if (nb) nb.scrollTop = sc;
    icons();
  }

  function open() { injectModal(); ui.open = true; if (typeof closeSidebar === 'function') closeSidebar(); $('pluginsCenterBackdrop').classList.remove('hidden'); renderCenter(); }
  function close() { ui.open = false; const b = $('pluginsCenterBackdrop'); b && b.classList.add('hidden'); }

  /* ==================== 宿主挂载 ==================== */
  function patchFns() {
    if (window.__sparkflowPCPatched) return;
    window.__sparkflowPCPatched = true;

    const origTop = window.renderTopPluginSlot;
    window.renderTopPluginSlot = function () {
      const r = origTop.apply(this, arguments);
      const slot = $('topPluginSlot');
      if (slot) slot.insertAdjacentHTML('beforeend', `<button type="button" onclick="SparkFlowPluginsCenter.open()" title="插件中心" class="h-8 px-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 active:scale-95 shrink-0">🧩</button>`);
      return r;
    };

    const origAll = window.renderAll;
    window.renderAll = function () { const r = origAll.apply(this, arguments); if (ui.open) renderCenter(); return r; };

    const origDel = window.deleteCustomPlugin;
    window.deleteCustomPlugin = function (id) {
      const hit = store.entries.filter(e => (e.pluginIds || []).includes(id));
      const r = origDel.apply(this, arguments);
      if (hit.length) { store.entries = store.entries.filter(e => !hit.includes(e)); saveStore(); renderCenter(); }
      return r;
    };
  }

  function bootstrap() {
    const required = ['renderAll', 'renderTopPluginSlot', 'deleteCustomPlugin', 'persist', 'toast'];
    if (typeof appState === 'undefined' || required.some(k => typeof window[k] !== 'function')) { console.warn('[插件中心] 未检测到 SparkFlow 宿主，插件未启动'); return; }
    loadStore(); injectModal(); patchSidebarHeader(); patchFns();
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.open) close(); });
    const firstRun = firstRunSetup();
    renderAll();
    autoload(firstRun);
    console.info(`🧩 SparkFlow 插件已加载：插件中心 v${VERSION}`);
  }

  const api = {
    version: VERSION, open, close,
    setTab(t) { ui.tab = t; renderCenter(); },
    installCatalog, installFromUrl, installFromFile, installFromCode, reload, uninstall,
    copyTemplate() { copyText(TEMPLATE, '📋 插件开发模板已复制'); },
    list() { return store.entries.slice(); }
  };
  window.SparkFlowPluginsCenter = api;
  if (window.SparkFlowSDK) window.SparkFlowSDK.center = api;

  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(bootstrap, 0));
  else setTimeout(bootstrap, 0);
})();