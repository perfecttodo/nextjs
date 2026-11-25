const LIST_API = './stories/index.json';
const DETAIL_API = (id) => `./stories/${id}.json`;

let allStories = [], currentStory = null;
let ttsAudioEl = new Audio(), rafId = null, wakeLock = null;
let isReadingAlong = false, recognition = null, mediaRecorder = null, audioChunks = [], readCursor = 0;

// 語音偏好：hk(粵語) / tw(國語) / cn(普通話) / en(English)
const VOICE_PREFS = [
  { id: 'hk', label: '🗣️ 粵語' },
  { id: 'tw', label: '🗣️ 國語' },
  { id: 'cn', label: '🗣️ 普通話' },
  { id: 'en', label: '🗣️ English' }
];
// 字形偏好：hk(港澳繁體) / tw(台灣繁體) / cn(簡體中文)
const SCRIPT_PREFS = [
  { id: 'hk', label: '🔤 港澳繁', fullLabel: '🔤 港澳繁體' },
  { id: 'tw', label: '🔤 台灣繁', fullLabel: '🔤 台灣繁體' },
  { id: 'cn', label: '🔤 简体', fullLabel: '🔤 简体中文' }
];
const SPEEDS = [{ rate: 1.0, label: '🐇 1.0x' }, { rate: 0.8, label: '🐢 0.8x' }, { rate: 1.2, label: '🚀 1.2x' }];
const REPEAT_MODES = [
  { id: 'none', label: '⏹️ 單篇' },
  { id: 'single', label: '🔂 單篇循環' },
  { id: 'list', label: '🔁 連續循環' },
  { id: 'random', label: '🔀 隨機循環' }
];

let voiceIdx = Number(localStorage.getItem('reading_voiceIdx')) || 0;
let scriptIdx = Number(localStorage.getItem('reading_scriptIdx')) || 0;
let speedIdx = Number(localStorage.getItem('reading_speedIdx')) || 0;
let playMode = localStorage.getItem('reading_playMode') || 'exact';
let repeatIdx = Number(localStorage.getItem('reading_repeatIdx')) || 0;

const viewList = document.getElementById('view-list');
const viewReader = document.getElementById('view-reader');
const storyGrid = document.getElementById('story-grid');
const storyContent = document.getElementById('story-content');
const btnPlayTts = document.getElementById('btn-play-tts');
const btnReadAlong = document.getElementById('btn-read-along');
const btnSpeed = document.getElementById('btn-speed');
const btnMode = document.getElementById('btn-mode');
const btnRepeat = document.getElementById('btn-repeat');
const recordPanel = document.getElementById('record-panel');
const recordedAudioEl = document.getElementById('recorded-audio');

function syncPrefButtons() {
  document.getElementById('btn-pref-voice').textContent = VOICE_PREFS[voiceIdx].label;
  document.getElementById('btn-pref-script').textContent = SCRIPT_PREFS[scriptIdx].fullLabel;
  document.getElementById('btn-reader-voice').textContent = VOICE_PREFS[voiceIdx].label;
  document.getElementById('btn-reader-script').textContent = SCRIPT_PREFS[scriptIdx].label;
  btnSpeed.textContent = SPEEDS[speedIdx].label;
  btnMode.textContent = playMode === 'exact' ? '🎯 精讀' : '📖 故事';
  btnRepeat.textContent = REPEAT_MODES[repeatIdx].label;
}
syncPrefButtons();

function cycleVoice() {
  voiceIdx = (voiceIdx + 1) % VOICE_PREFS.length;
  localStorage.setItem('reading_voiceIdx', voiceIdx);
  syncPrefButtons();
  if (allStories.length) renderStoryList(allStories);
  if (currentStory && viewReader.classList.contains('active')) applyTrackToReader(false);
}

function cycleScript() {
  scriptIdx = (scriptIdx + 1) % SCRIPT_PREFS.length;
  localStorage.setItem('reading_scriptIdx', scriptIdx);
  syncPrefButtons();
  if (allStories.length) renderStoryList(allStories);
  if (currentStory && viewReader.classList.contains('active')) {
    updateTitleAndTokensText();
  }
}

document.getElementById('btn-pref-voice').addEventListener('click', cycleVoice);
document.getElementById('btn-reader-voice').addEventListener('click', cycleVoice);
document.getElementById('btn-pref-script').addEventListener('click', cycleScript);
document.getElementById('btn-reader-script').addEventListener('click', cycleScript);

btnSpeed.addEventListener('click', () => {
  speedIdx = (speedIdx + 1) % SPEEDS.length;
  localStorage.setItem('reading_speedIdx', speedIdx);
  syncPrefButtons();
  ttsAudioEl.playbackRate = SPEEDS[speedIdx].rate;
});

btnMode.addEventListener('click', () => {
  playMode = playMode === 'exact' ? 'fluent' : 'exact';
  localStorage.setItem('reading_playMode', playMode);
  syncPrefButtons();
  if (currentStory) applyTrackToReader(false);
});

btnRepeat.addEventListener('click', () => {
  repeatIdx = (repeatIdx + 1) % REPEAT_MODES.length;
  localStorage.setItem('reading_repeatIdx', repeatIdx);
  syncPrefButtons();
});

async function init() {
  try {
    const res = await fetch(`${LIST_API}?t=${Date.now()}`);
    allStories = await res.json();
    renderStoryList(allStories);
  } catch (e) { storyGrid.innerHTML = '<p style="text-align:center;width:100%;">請先執行 generate_multilang.py</p>'; }
}

function getDisplayTitle(storyObj) {
  const vId = VOICE_PREFS[voiceIdx].id;
  const sId = SCRIPT_PREFS[scriptIdx].id;
  if (!storyObj.titles) return storyObj.title || '';
  return vId === 'en' ? storyObj.titles.en : (storyObj.titles[sId] || storyObj.titles.hk);
}

function renderStoryList(stories) {
  const svg = 'data:image/svg+xml,<svg xmlns=%22http://w3.org viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23FFE066%22/><text x=%2250%22 y=%2262%22 font-size=%2245%22 text-anchor=%22middle%22>📖</text></svg>';
  storyGrid.innerHTML = stories.map(s => `
    <div class="story-card" onclick="openStory('${s.id}')">
      <img src="${s.cover || svg}" alt="${getDisplayTitle(s)}">
      <h3>${getDisplayTitle(s)}</h3>
      <span class="lang-tag">${VOICE_PREFS[voiceIdx].label.replace('🗣️ ', '')} ${VOICE_PREFS[voiceIdx].id !== 'en' ? '· ' + SCRIPT_PREFS[scriptIdx].label.replace('🔤 ', '') : ''}</span>
    </div>`).join('');
}

async function openStory(id, autoPlay = false) {
  viewList.classList.remove('active'); viewReader.classList.add('active'); recordPanel.classList.add('hidden');
  storyContent.innerHTML = '載入故事中...';
  const res = await fetch(`${DETAIL_API(id)}?t=${Date.now()}`);
  currentStory = await res.json();
  applyTrackToReader(autoPlay);
}

function getCurrentTrack() {
  const vId = VOICE_PREFS[voiceIdx].id;
  return currentStory.tracks[vId] || currentStory.tracks.hk;
}

function applyTrackToReader(autoPlay) {
  stopTtsPlayback(); clearHighlight();
  const track = getCurrentTrack();
  document.getElementById('reader-title').textContent = getDisplayTitle(currentStory);
  renderTokens(track.tokens, track.lang);

  const rawAudio = (playMode === 'exact' && track.exactAudioUrl) ? track.exactAudioUrl : track.audioUrl;
  ttsAudioEl.src = `${rawAudio}?t=${Date.now()}`;
  ttsAudioEl.playbackRate = SPEEDS[speedIdx].rate;
  ttsAudioEl.load();

  if (autoPlay) {
    requestWakeLock();
    ttsAudioEl.play();
    btnPlayTts.querySelector('.label').textContent = '暫停';
    syncHighlightLoop();
  }
}

function updateTitleAndTokensText() {
  document.getElementById('reader-title').textContent = getDisplayTitle(currentStory);
  const track = getCurrentTrack();
  const sKey = `text_${SCRIPT_PREFS[scriptIdx].id}`;
  storyContent.querySelectorAll('.token').forEach(el => {
    const tok = track.tokens[Number(el.dataset.idx)];
    if (tok && !tok.isBreak) {
      const disp = tok[sKey] || tok.text;
      const space = (!tok.isPunct && /^[A-Za-z0-9]/.test(disp)) ? ' ' : '';
      el.textContent = disp + space;
    }
  });
}

function renderTokens(tokens, lang) {
  const isEn = (lang || '').startsWith('en');
  const sKey = `text_${SCRIPT_PREFS[scriptIdx].id}`;
  let isFirstPara = true;
  let html = `<h2 class="story-title-heading">`;
  tokens.forEach((t, idx) => {
    if (t.isBreak) {
      if (isFirstPara) {
        html += `</h2><p class="story-para ${isEn ? 'en-para' : ''}">`;
        isFirstPara = false;
      } else {
        html += `</p><p class="story-para ${isEn ? 'en-para' : ''}">`;
      }
    } else {
      const disp = t[sKey] || t.text;
      const space = (!t.isPunct && /^[A-Za-z0-9]/.test(disp)) ? ' ' : '';
      html += `<span class="token ${t.isPunct ? 'punct' : ''}" data-idx="${idx}">${disp}${space}</span>`;
    }
  });
  storyContent.innerHTML = html + (isFirstPara ? '</h2>' : '</p>');
  storyContent.querySelectorAll('.token:not(.punct)').forEach(el => el.addEventListener('click', () => playSingleToken(Number(el.dataset.idx), el)));
}

let wordPlayer = new Audio();
function playSingleToken(idx, el) {
  if (!currentStory) return;
  stopTtsPlayback();
  wordPlayer.pause();
  const token = getCurrentTrack().tokens[idx], rate = SPEEDS[speedIdx].rate;
  storyContent.querySelectorAll('.token.tapped').forEach(x => x.classList.remove('tapped'));
  el.classList.add('tapped');

  if (token && token.wordAudio) {
    wordPlayer.src = token.wordAudio;
    wordPlayer.playbackRate = rate;
    wordPlayer.onended = () => el.classList.remove('tapped');
    wordPlayer.onerror = () => el.classList.remove('tapped');
    wordPlayer.play().catch(() => el.classList.remove('tapped'));
  }
}

btnPlayTts.addEventListener('click', () => {
  if (!ttsAudioEl.paused) stopTtsPlayback();
  else { stopReadAlong(); requestWakeLock(); ttsAudioEl.playbackRate = SPEEDS[speedIdx].rate; ttsAudioEl.play(); btnPlayTts.querySelector('.label').textContent = '暫停'; syncHighlightLoop(); }
});

function stopTtsPlayback() { ttsAudioEl.pause(); cancelAnimationFrame(rafId); btnPlayTts.querySelector('.label').textContent = '聽故事'; }

function handleStoryEnded() {
  clearHighlight();
  const mode = REPEAT_MODES[repeatIdx].id;
  if (mode === 'single') {
    ttsAudioEl.currentTime = 0;
    ttsAudioEl.play();
    syncHighlightLoop();
  } else if (mode === 'list' && allStories.length > 0) {
    const curIdx = allStories.findIndex(s => s.id === currentStory.id);
    const nextStory = allStories[(curIdx + 1) % allStories.length];
    openStory(nextStory.id, true);
  } else if (mode === 'random' && allStories.length > 0) {
    const candidates = allStories.length > 1 ? allStories.filter(s => s.id !== currentStory.id) : allStories;
    const nextStory = candidates[Math.floor(Math.random() * candidates.length)];
    openStory(nextStory.id, true);
  } else {
    releaseWakeLock();
    btnPlayTts.querySelector('.label').textContent = '聽故事';
  }
}

function syncHighlightLoop() {
  const t = ttsAudioEl.currentTime;
  const tokens = getCurrentTrack().tokens;

  if (playMode === 'exact') {
    const activeIdx = tokens.findIndex(item => !item.isBreak && t >= (item.exactStart - 0.02) && t <= (item.exactEnd + 0.02));
    if (activeIdx !== -1) highlightToken(activeIdx);
  } else {
    let activeIdx = tokens.findIndex(item => !item.isBreak && !item.isPunct && t >= item.start && t <= item.end);
    if (activeIdx === -1) {
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (!tokens[i].isBreak && !tokens[i].isPunct && t >= tokens[i].start) { activeIdx = i; break; }
      }
    }
    if (activeIdx !== -1) {
      let sStart = activeIdx, sEnd = activeIdx;
      while (sStart > 0 && !tokens[sStart - 1].isBreak && !tokens[sStart - 1].isPunct) sStart--;
      while (sEnd < tokens.length - 1 && !tokens[sEnd + 1].isBreak && !tokens[sEnd + 1].isPunct) sEnd++;
      highlightSentenceRange(sStart, sEnd, activeIdx);
    }
  }

  if (!ttsAudioEl.paused && !ttsAudioEl.ended) rafId = requestAnimationFrame(syncHighlightLoop);
  else if (ttsAudioEl.ended) handleStoryEnded();
}

function highlightSentenceRange(startIdx, endIdx, focusIdx) {
  storyContent.querySelectorAll('.token.active, .token.sentence-active').forEach(el => el.classList.remove('active', 'sentence-active'));
  for (let i = startIdx; i <= endIdx; i++) {
    const el = storyContent.querySelector(`.token[data-idx="${i}"]`);
    if (el) el.classList.add('sentence-active');
  }
  const focusEl = storyContent.querySelector(`.token[data-idx="${focusIdx}"]`);
  if (focusEl) focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

btnReadAlong.addEventListener('click', () => { isReadingAlong ? stopReadAlong() : startReadAlong(); });

async function startReadAlong() {
  stopTtsPlayback(); clearHighlight(); recordPanel.classList.add('hidden');
  readCursor = 0; isReadingAlong = true; requestWakeLock();
  btnReadAlong.classList.add('recording'); btnReadAlong.querySelector('.label').textContent = '完成朗讀';
  advanceToNextReadableToken(0);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
    mediaRecorder = new MediaRecorder(stream, { mimeType }); audioChunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const url = URL.createObjectURL(new Blob(audioChunks, { type: mimeType }));
      recordedAudioEl.src = url;
      const dl = document.getElementById('btn-download');
      dl.href = url; dl.download = `${getDisplayTitle(currentStory)}_我的朗讀.${mimeType.includes('mp4') ? 'm4a' : 'webm'}`;
      recordPanel.classList.remove('hidden');
      stream.getTracks().forEach(track => track.stop());
    };
    mediaRecorder.start();
  } catch (err) { alert('請允許使用麥克風權限！'); stopReadAlong(); return; }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = getCurrentTrack().lang || 'zh-HK';
    recognition.continuous = true; recognition.interimResults = true;
    recognition.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i].transcript;
      matchSpokenText(text.toLowerCase());
    };
    recognition.onend = () => { if (isReadingAlong) recognition.start(); };
    recognition.start();
  }
}

function matchSpokenText(spoken) {
  const tokens = getCurrentTrack().tokens; let checked = 0;
  const sKey = `text_${SCRIPT_PREFS[scriptIdx].id}`;
  for (let i = readCursor; i < tokens.length && checked < 3; i++) {
    if (tokens[i].isPunct || tokens[i].isBreak) continue;
    checked++;
    const targetWord = (tokens[i][sKey] || tokens[i].text).toLowerCase().trim();
    if (spoken.includes(targetWord) || spoken.includes(tokens[i].text.toLowerCase().trim())) {
      highlightToken(i); advanceToNextReadableToken(i + 1); break;
    }
  }
}

function advanceToNextReadableToken(startIdx) {
  const tokens = getCurrentTrack().tokens; let next = startIdx;
  while (next < tokens.length && (tokens[next].isPunct || tokens[next].isBreak)) next++;
  readCursor = next;
  if (readCursor < tokens.length) highlightToken(readCursor);
}

function stopReadAlong() {
  if (!isReadingAlong) return;
  isReadingAlong = false; releaseWakeLock();
  btnReadAlong.classList.remove('recording'); btnReadAlong.querySelector('.label').textContent = '自己讀';
  if (recognition) { recognition.onend = null; recognition.stop(); }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
}

const btnLoop = document.getElementById('btn-loop');
btnLoop.addEventListener('click', () => {
  recordedAudioEl.loop = !recordedAudioEl.loop;
  btnLoop.classList.toggle('active', recordedAudioEl.loop);
  btnLoop.textContent = recordedAudioEl.loop ? '🔁 循環開啟中' : '🔁 循環播放錄音';
});

function highlightToken(idx) {
  storyContent.querySelectorAll('.token.active, .token.sentence-active').forEach(el => el.classList.remove('active', 'sentence-active'));
  const target = storyContent.querySelector(`.token[data-idx="${idx}"]`);
  if (target) { target.classList.add('active'); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}
function clearHighlight() { storyContent.querySelectorAll('.token').forEach(el => el.classList.remove('active', 'sentence-active')); }
async function requestWakeLock() { try { if ('wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen'); document.getElementById('wake-badge').style.display = 'inline-block'; } } catch (e) {} }
function releaseWakeLock() { if (wakeLock) { wakeLock.release(); wakeLock = null; } document.getElementById('wake-badge').style.display = 'none'; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (!ttsAudioEl.paused || isReadingAlong)) requestWakeLock(); });
document.getElementById('btn-back').addEventListener('click', () => { stopTtsPlayback(); stopReadAlong(); recordedAudioEl.pause(); viewReader.classList.remove('active'); viewList.classList.add('active'); });

init();
