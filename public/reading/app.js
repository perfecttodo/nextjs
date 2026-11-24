const LIST_API = './stories/index.json';
const DETAIL_API = (id) => `./stories/${id}.json`;

let currentStory = null, audioCtx = null, storyAudioBuffer = null, activeSingleSource = null;
let ttsAudioEl = new Audio(), rafId = null, wakeLock = null;
let isReadingAlong = false, recognition = null, mediaRecorder = null, audioChunks = [], readCursor = 0;

const SPEEDS = [{ rate: 1.0, label: '🐇 1.0x' }, { rate: 0.8, label: '🐢 0.8x' }, { rate: 1.2, label: '🚀 1.2x' }];
let speedIdx = 0;

const viewList = document.getElementById('view-list');
const viewReader = document.getElementById('view-reader');
const storyGrid = document.getElementById('story-grid');
const storyContent = document.getElementById('story-content');
const btnPlayTts = document.getElementById('btn-play-tts');
const btnReadAlong = document.getElementById('btn-read-along');
const btnSpeed = document.getElementById('btn-speed');
const recordPanel = document.getElementById('record-panel');
const recordedAudioEl = document.getElementById('recorded-audio');

btnSpeed.addEventListener('click', () => {
  speedIdx = (speedIdx + 1) % SPEEDS.length;
  btnSpeed.textContent = SPEEDS[speedIdx].label;
  ttsAudioEl.playbackRate = SPEEDS[speedIdx].rate;
});

async function init() {
  try {
    const res = await fetch(`${LIST_API}?t=${Date.now()}`);
    renderStoryList(await res.json());
  } catch (e) { storyGrid.innerHTML = '<p style="text-align:center;width:100%;">請先執行 generate_tts.py 生成故事書</p>'; }
}

function renderStoryList(stories) {
  const svg = 'data:image/svg+xml,<svg xmlns=%22http://w3.org viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23FFE066%22/><text x=%2250%22 y=%2262%22 font-size=%2245%22 text-anchor=%22middle%22>📖</text></svg>';
  storyGrid.innerHTML = stories.map(s => `
    <div class="story-card" onclick="openStory('${s.id}')">
      <img src="${s.cover || svg}" alt="${s.title}">
      <h3>${s.title}</h3>
      <span class="lang-tag">${s.langLabel || s.lang}</span>
    </div>`).join('');
}

async function openStory(id) {
  viewList.classList.remove('active'); viewReader.classList.add('active'); recordPanel.classList.add('hidden');
  storyContent.innerHTML = '載入故事中...';
  const res = await fetch(`${DETAIL_API(id)}?t=${Date.now()}`);
  currentStory = await res.json();
  document.getElementById('reader-title').textContent = currentStory.title;
  renderTokens(currentStory.tokens, currentStory.lang);

  const freshUrl = `${currentStory.audioUrl}?t=${Date.now()}`;
  ttsAudioEl.src = freshUrl; ttsAudioEl.playbackRate = SPEEDS[speedIdx].rate; ttsAudioEl.load();
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioRes = await fetch(freshUrl);
  storyAudioBuffer = await audioCtx.decodeAudioData(await audioRes.arrayBuffer());
}

function renderTokens(tokens, lang) {
  const isEn = (lang || '').startsWith('en');
  let html = `<p class="story-para ${isEn ? 'en-para' : ''}">`;
  tokens.forEach((t, idx) => {
    if (t.isBreak) html += `</p><p class="story-para ${isEn ? 'en-para' : ''}">`;
    else {
      const space = (!t.isPunct && /^[A-Za-z0-9]/.test(t.text)) ? ' ' : '';
      html += `<span class="token ${t.isPunct ? 'punct' : ''}" data-idx="${idx}">${t.text}${space}</span>`;
    }
  });
  storyContent.innerHTML = html + '</p>';
  storyContent.querySelectorAll('.token:not(.punct)').forEach(el => el.addEventListener('click', () => playSingleToken(Number(el.dataset.idx), el)));
}

function playSingleToken(idx, el) {
  if (!storyAudioBuffer || !currentStory) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  stopTtsPlayback();
  if (activeSingleSource) { try { activeSingleSource.stop(); } catch (e) {} }

  const token = currentStory.tokens[idx], rate = SPEEDS[speedIdx].rate;
  const rawDur = Math.max(0.08, token.end - token.start), actualDur = rawDur / rate;
  const source = audioCtx.createBufferSource(), gainNode = audioCtx.createGain();
  source.buffer = storyAudioBuffer; source.playbackRate.value = rate; activeSingleSource = source;

  const now = audioCtx.currentTime;
  gainNode.gain.setValueAtTime(1, now);
  gainNode.gain.setValueAtTime(1, now + Math.max(0, actualDur - 0.02));
  gainNode.gain.linearRampToValueAtTime(0.001, now + actualDur);
  source.connect(gainNode); gainNode.connect(audioCtx.destination);
  source.start(0, token.start, rawDur);

  storyContent.querySelectorAll('.token.tapped').forEach(x => x.classList.remove('tapped'));
  el.classList.add('tapped');
  setTimeout(() => el.classList.remove('tapped'), actualDur * 1000 + 100);
}

btnPlayTts.addEventListener('click', () => {
  if (!ttsAudioEl.paused) stopTtsPlayback();
  else { stopReadAlong(); requestWakeLock(); ttsAudioEl.playbackRate = SPEEDS[speedIdx].rate; ttsAudioEl.play(); btnPlayTts.querySelector('.label').textContent = '暫停'; syncHighlightLoop(); }
});

function stopTtsPlayback() { ttsAudioEl.pause(); cancelAnimationFrame(rafId); btnPlayTts.querySelector('.label').textContent = '聽故事'; }

function syncHighlightLoop() {
  const t = ttsAudioEl.currentTime;
  const activeIdx = currentStory.tokens.findIndex(item => !item.isBreak && t >= (item.start - 0.03) && t <= (item.end + 0.03));
  if (activeIdx !== -1) highlightToken(activeIdx);
  if (!ttsAudioEl.paused && !ttsAudioEl.ended) rafId = requestAnimationFrame(syncHighlightLoop);
  else if (ttsAudioEl.ended) { clearHighlight(); releaseWakeLock(); btnPlayTts.querySelector('.label').textContent = '聽故事'; }
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
      dl.href = url; dl.download = `${currentStory.title}_我的朗讀.${mimeType.includes('mp4') ? 'm4a' : 'webm'}`;
      recordPanel.classList.remove('hidden');
      stream.getTracks().forEach(track => track.stop());
    };
    mediaRecorder.start();
  } catch (err) { alert('請允許使用麥克風權限！'); stopReadAlong(); return; }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition(); recognition.lang = currentStory.lang || 'zh-HK';
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
  const tokens = currentStory.tokens; let checked = 0;
  for (let i = readCursor; i < tokens.length && checked < 3; i++) {
    if (tokens[i].isPunct || tokens[i].isBreak) continue;
    checked++;
    if (spoken.includes(tokens[i].text.toLowerCase().trim())) { highlightToken(i); advanceToNextReadableToken(i + 1); break; }
  }
}

function advanceToNextReadableToken(startIdx) {
  const tokens = currentStory.tokens; let next = startIdx;
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
  storyContent.querySelectorAll('.token.active').forEach(el => el.classList.remove('active'));
  const target = storyContent.querySelector(`.token[data-idx="${idx}"]`);
  if (target) { target.classList.add('active'); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}
function clearHighlight() { storyContent.querySelectorAll('.token').forEach(el => el.classList.remove('active')); }
async function requestWakeLock() { try { if ('wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen'); document.getElementById('wake-badge').style.display = 'inline-block'; } } catch (e) {} }
function releaseWakeLock() { if (wakeLock) { wakeLock.release(); wakeLock = null; } document.getElementById('wake-badge').style.display = 'none'; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (!ttsAudioEl.paused || isReadingAlong)) requestWakeLock(); });
document.getElementById('btn-back').addEventListener('click', () => { stopTtsPlayback(); stopReadAlong(); recordedAudioEl.pause(); viewReader.classList.remove('active'); viewList.classList.add('active'); });

init();
