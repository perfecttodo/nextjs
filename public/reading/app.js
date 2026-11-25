let tapToJump = localStorage.getItem('reading_tapToJump') === 'true';
let readAlongMode = localStorage.getItem('reading_readAlongMode') || 'timed';
let lastKidBlob = null, lastKidTimings = {};
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
let useParentVoice = localStorage.getItem('reading_useParentVoice') === 'true';
let storyParentRecs = [];
let selectedParentRecIdx = 0;

const btnParentRec = document.getElementById('btn-parent-rec');
const btnParentPlay = document.getElementById('btn-parent-play');
const modalPreview = document.getElementById('modal-preview');
const previewAudio = document.getElementById('preview-audio');
const previewLabelInput = document.getElementById('preview-label-input');
const modalManager = document.getElementById('modal-manager');
const managerList = document.getElementById('manager-list');

function updateParentButtonsUI() {
  const hasRec = storyParentRecs.length > 0;
  btnParentPlay.style.display = hasRec ? 'inline-block' : 'none';
  const rowP = document.getElementById('row-parent-play'); if (rowP) rowP.style.display = hasRec ? 'flex' : 'none';
  if (!hasRec) useParentVoice = false;
  const curRec = storyParentRecs[selectedParentRecIdx];
  if (useParentVoice && curRec) {
    btnParentPlay.textContent = `👨‍👩‍👧 ${curRec.label}(開)`;
    btnParentPlay.style.background = '#F59E0B';
    btnParentPlay.style.color = '#FFF';
  } else {
    btnParentPlay.textContent = hasRec ? `👨‍👩‍👧 ${curRec.label}` : '👨‍👩‍👧 父母聲';
    btnParentPlay.style.background = '#FEF3C7';
    btnParentPlay.style.color = '#B45309';
  }
  updateHeaderStatusPill();
  applyUiLanguage();
}

// 點擊「👨‍👩‍👧 父母聲」：在「關閉 -> 錄音1 -> 錄音2...」之間循環切換
btnParentPlay.addEventListener('click', async () => {
  if (storyParentRecs.length === 0) return;
  if (!useParentVoice) {
    useParentVoice = true;
    selectedParentRecIdx = 0;
  } else if (selectedParentRecIdx + 1 < storyParentRecs.length) {
    selectedParentRecIdx++;
  } else {
    useParentVoice = false;
  }
  localStorage.setItem('reading_useParentVoice', useParentVoice);
  if (useParentVoice) await ParentVoice.activateRecord(storyParentRecs[selectedParentRecIdx]);
  updateParentButtonsUI();
  applyTrackToReader(false);
});


function setRecordingLock(mode) {
  // mode: 'parent' (父母錄音中) | 'kid' (小朋友跟讀中) | 'none' (解除鎖定)
  const lockIdsForParent = ['btn-back', 'btn-open-settings', 'btn-parent-play', 'btn-reader-voice', 'btn-reader-script', 'btn-repeat', 'btn-read-mode', 'btn-tap-jump', 'btn-mode', 'btn-speed', 'btn-play-tts', 'btn-read-along'];
  const lockIdsForKid = ['btn-parent-rec', 'btn-parent-play', 'btn-reader-voice', 'btn-reader-script', 'btn-repeat', 'btn-read-mode', 'btn-tap-jump', 'btn-mode', 'btn-speed', 'btn-play-tts'];

  const allIds = Array.from(new Set([...lockIdsForParent, ...lockIdsForKid]));
  allIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });

  if (mode === 'parent') {
    lockIdsForParent.forEach(id => { const el = document.getElementById(id); if (el) el.disabled = true; });
  } else if (mode === 'kid') {
    lockIdsForKid.forEach(id => { const el = document.getElementById(id); if (el) el.disabled = true; });
  }
}

btnParentRec.addEventListener('click', () => {
  modalSettings.classList.add('hidden');
  if (ParentVoice.isRecording()) { ParentVoice.stopGuidedRecording(); return; }
  stopTtsPlayback(); stopReadAlong(); clearHighlight(); requestWakeLock(); setRecordingLock('parent');
  const vPref = VOICE_PREFS[voiceIdx];
  ParentVoice.startGuidedRecording({
    storyId: currentStory.id,
    storyTitle: getDisplayTitle(currentStory),
    langId: vPref.id,
    langLabel: vPref.label.replace('🗣️ ', ''),
    tokens: getCurrentTrack().tokens,
    speedRate: SPEEDS[speedIdx].rate,
    onHighlight: (idx) => highlightToken(idx),
    onPreviewReady: (previewUrl) => {
      setRecordingLock('none'); releaseWakeLock(); clearHighlight();
      previewAudio.src = previewUrl;
      previewLabelInput.value = tUI('defaultMom');
      modalPreview.classList.remove('hidden');
    },
    onCancel: () => { setRecordingLock('none'); releaseWakeLock(); clearHighlight(); }
  });
});

document.getElementById('btn-discard-rec').addEventListener('click', () => {
  previewAudio.pause();
  ParentVoice.discardPending();
  modalPreview.classList.add('hidden');
});

document.getElementById('btn-confirm-save').addEventListener('click', async () => {
  previewAudio.pause();
  const saved = await ParentVoice.confirmSavePending(previewLabelInput.value);
  modalPreview.classList.add('hidden');
  if (saved) {
    useParentVoice = true;
    selectedParentRecIdx = 0;
    localStorage.setItem('reading_useParentVoice', 'true');
    await applyTrackToReader(false);
  }
});

// 父母錄音管理中心邏輯
document.getElementById('btn-open-manager').addEventListener('click', openManagerModal);
modalManager.addEventListener('click', (e) => { if (e.target === modalManager) { managerList.querySelectorAll('audio').forEach(a => a.pause()); modalManager.classList.add('hidden'); } });
document.getElementById('btn-close-manager').addEventListener('click', () => {
  managerList.querySelectorAll('audio').forEach(a => a.pause());
  modalManager.classList.add('hidden');
});

async function openManagerModal() {
  modalManager.classList.remove('hidden');
  await renderManagerList();
}

async function renderManagerList() {
  const list = await ParentVoice.getAllRecordings();
  if (list.length === 0) {
    managerList.innerHTML = '<p style="color:#64748B;padding:24px 0;">目前還沒有保存任何父母陪讀錄音喔！<br>打開任一故事點擊「🎙️ 父母錄音」即可開始錄製。</p>';
    return;
  }
  managerList.innerHTML = list.map(rec => {
    const url = URL.createObjectURL(rec.blob);
    const dateStr = new Date(rec.createdAt).toLocaleString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="rec-item">
        <div class="rec-item-top">
          <div>
            <div class="rec-item-title">📖 ${rec.storyTitle} · <span style="color:#D97706;">${rec.label}</span></div>
            <div class="rec-item-meta">語言：${rec.langLabel} ｜ 錄製時間：${dateStr}</div>
          </div>
          <div class="rec-item-btns">
            <button class="btn-mini" style="background:#E0F2FE;color:#0369A1;" onclick="handleRenameRec('${rec.id}', '${rec.label.replace(/'/g, "\'")}')">✏️ 改名</button>
            <button class="btn-mini" style="background:#FEE2E2;color:#B91C1C;" onclick="handleDeleteRec('${rec.id}')">🗑️ 刪除</button>
          </div>
        </div>
        <audio controls playsinline src="${url}" style="width:100%;height:38px;"></audio>
      </div>`;
  }).join('');
}

window.handleRenameRec = async (id, oldName) => {
  const nextName = prompt('請輸入新的錄音名稱（例如：爸爸的聲音）：', oldName);
  if (nextName && nextName.trim()) {
    await ParentVoice.renameRecording(id, nextName.trim());
    await renderManagerList();
  }
};

window.handleDeleteRec = async (id) => {
  if (confirm('確定要刪除這段父母陪讀錄音嗎？')) {
    await ParentVoice.deleteRecording(id);
    await renderManagerList();
  }
};

const recordPanel = document.getElementById('record-panel');
const recordedAudioEl = document.getElementById('recorded-audio');


const modalSettings = document.getElementById('modal-settings');
document.getElementById('btn-open-settings').addEventListener('click', () => modalSettings.classList.remove('hidden'));
document.getElementById('btn-close-settings').addEventListener('click', () => modalSettings.classList.add('hidden'));
modalSettings.addEventListener('click', (e) => { if (e.target === modalSettings) modalSettings.classList.add('hidden'); });
document.getElementById('btn-stop-rec-inline').addEventListener('click', () => ParentVoice.stopGuidedRecording());

function updateHeaderStatusPill() {
  const pill = document.getElementById('header-status-pill');
  if (!pill) return;
  const vName = VOICE_PREFS.at(voiceIdx).label.replace('🗣️ ', '');
  const spName = SPEEDS.at(speedIdx).rate + 'x';
  const curRec = storyParentRecs.at(selectedParentRecIdx);
  const pTag = (useParentVoice && curRec) ? ` · 👨‍👩‍👧${curRec.label}` : '';
  pill.textContent = `${vName} · ${spName}${pTag}`;
}


function applyUiLanguage() {
  const setTxt = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };
  setTxt('#view-list .top-bar h1', tUI('appTitle'));
  setTxt('#btn-open-manager', tUI('recLibrary'));
  setTxt('#btn-back', tUI('back'));
  setTxt('#btn-open-settings', tUI('settings'));
  const isTapOn = typeof tapToJump !== 'undefined' ? tapToJump : (localStorage.getItem('reading_tapToJump') === 'true');
  setTxt('#btn-tap-jump', isTapOn ? tUI('tapJumpOn') : tUI('tapJumpOff'));
  setTxt('#btn-play-tts .label', ttsAudioEl.paused ? tUI('listen') : tUI('pause'));
  setTxt('#btn-read-along .label', isReadingAlong ? tUI('finishRead') : tUI('readAlong'));

  setTxt('#modal-settings h3', tUI('settingsTitle'));
  setTxt('#btn-close-settings', tUI('done'));
  const rows = document.querySelectorAll('#modal-settings .setting-row label');
  const lblKeys = ['lblVoice', 'lblScript', 'lblSpeed', 'lblMode', 'lblRepeat', 'lblReadMode', 'lblParentPlay', 'lblParentRec'];
  rows.forEach((lbl, idx) => { if (lblKeys.at(idx)) lbl.textContent = tUI(lblKeys.at(idx)); });

  setTxt('#btn-mode', playMode === 'exact' ? tUI('modeExact') : tUI('modeFluent'));
  const repMap = ['repNone', 'repSingle', 'repList', 'repRandom'];
  setTxt('#btn-repeat', tUI(repMap.at(repeatIdx)));
  const curReadMode = typeof readAlongMode !== 'undefined' ? readAlongMode : (localStorage.getItem('reading_readAlongMode') || 'timed');
  setTxt('#btn-read-mode', curReadMode === 'timed' ? tUI('readTimed') : tUI('readSpeech'));
  if (!ParentVoice.isRecording()) setTxt('#btn-parent-rec', tUI('startRec'));

  setTxt('#record-panel span', tUI('kidRecTitle'));
  setTxt('#btn-close-record', tUI('close'));
  setTxt('#btn-loop', recordedAudioEl.loop ? tUI('loopOn') : tUI('loopPlay'));
  const btnSaveDb = document.getElementById('btn-save-kid-db');
  if (btnSaveDb && !btnSaveDb.disabled) btnSaveDb.textContent = tUI('saveToSys');
  setTxt('#btn-download', tUI('download'));

  setTxt('#modal-preview h3', tUI('previewTitle'));
  setTxt('#modal-preview p', tUI('previewDesc'));
  setTxt('#modal-preview label', tUI('previewLabel'));
  setTxt('#btn-discard-rec', tUI('discardRec'));
  setTxt('#btn-confirm-save', tUI('confirmSave'));
  setTxt('#modal-manager h3', tUI('managerTitle'));
  setTxt('#btn-close-manager', tUI('close'));
}

function syncPrefButtons() {
  document.getElementById('btn-pref-voice').textContent = VOICE_PREFS[voiceIdx].label;
  document.getElementById('btn-pref-script').textContent = SCRIPT_PREFS[scriptIdx].fullLabel;
  document.getElementById('btn-reader-voice').textContent = VOICE_PREFS[voiceIdx].label;
  document.getElementById('btn-reader-script').textContent = SCRIPT_PREFS[scriptIdx].label;
  btnSpeed.textContent = SPEEDS[speedIdx].label;
  btnMode.textContent = playMode === 'exact' ? '🎯 精讀' : '📖 故事';
  btnRepeat.textContent = REPEAT_MODES[repeatIdx].label;
  updateHeaderStatusPill();
  applyUiLanguage();
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


function updateMediaSession() {
  if (!('mediaSession' in navigator) || !currentStory) return;
  const meta = allStories.find(s => s.id === currentStory.id);
  const coverUrl = meta && meta.cover ? new URL(meta.cover, window.location.href).href : '';
  navigator.mediaSession.metadata = new MediaMetadata({
    title: getDisplayTitle(currentStory),
    artist: '快樂小讀者 · ' + VOICE_PREFS[voiceIdx].label.replace('🗣️ ', ''),
    album: '兒童有聲故事書',
    artwork: coverUrl ? [{ src: coverUrl, sizes: '512x512', type: 'image/png' }] : []
  });
  navigator.mediaSession.setActionHandler('play', () => {
    ttsAudioEl.play();
    btnPlayTts.querySelector('.label').textContent = tUI('pause');
    syncHighlightLoop();
  });
  navigator.mediaSession.setActionHandler('pause', () => stopTtsPlayback());
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    if (allStories.length > 0) {
      const curIdx = allStories.findIndex(s => s.id === currentStory.id);
      openStory(allStories[(curIdx + 1) % allStories.length].id, true);
    }
  });
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    if (allStories.length > 0) {
      const curIdx = allStories.findIndex(s => s.id === currentStory.id);
      openStory(allStories[(curIdx - 1 + allStories.length) % allStories.length].id, true);
    }
  });
}

async function applyTrackToReader(autoPlay) {
  stopTtsPlayback(); clearHighlight();
  const track = getCurrentTrack();
  const rt = document.getElementById('reader-title'); if (rt) rt.textContent = getDisplayTitle(currentStory);
  renderTokens(track.tokens, track.lang);

  storyParentRecs = await ParentVoice.getRecordingsForStory(currentStory.id, VOICE_PREFS[voiceIdx].id);
  if (selectedParentRecIdx >= storyParentRecs.length) selectedParentRecIdx = 0;
  if (storyParentRecs.length > 0) {
    await ParentVoice.activateRecord(storyParentRecs[selectedParentRecIdx]);
  } else {
    await ParentVoice.activateRecord(null);
  }
  updateParentButtonsUI();

  const pData = ParentVoice.getActiveData();
  if (useParentVoice && pData) {
    ttsAudioEl.src = pData.url;
  } else {
    const rawAudio = (playMode === 'exact' && track.exactAudioUrl) ? track.exactAudioUrl : track.audioUrl;
    ttsAudioEl.src = `${rawAudio}?t=${Date.now()}`;
  }
  ttsAudioEl.playbackRate = SPEEDS[speedIdx].rate;
  ttsAudioEl.load();

  updateMediaSession();
  if (autoPlay) {
    requestWakeLock();
    ttsAudioEl.play();
    btnPlayTts.querySelector('.label').textContent = tUI('pause');
    syncHighlightLoop();
  }
}

function updateTitleAndTokensText() {
  const rt = document.getElementById('reader-title'); if (rt) rt.textContent = getDisplayTitle(currentStory);
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





let kidGuidedTimer = null;
const btnReadMode = document.getElementById('btn-read-mode');

function syncReadModeUI() {
  btnReadMode.textContent = readAlongMode === 'timed' ? '⏱️ 提詞跟讀' : '🗣️ 識別跟讀';
}
syncReadModeUI();
  applyUiLanguage();

btnReadMode.addEventListener('click', () => {
  readAlongMode = readAlongMode === 'timed' ? 'speech' : 'timed';
  localStorage.setItem('reading_readAlongMode', readAlongMode);
  syncReadModeUI();
  applyUiLanguage();
});

const btnTapJump = document.getElementById('btn-tap-jump');

function syncTapJumpUI() {
  if (tapToJump) {
    btnTapJump.textContent = '👆 點哪讀哪(開)';
    btnTapJump.style.background = '#0284C7';
    btnTapJump.style.color = '#FFF';
  } else {
    btnTapJump.textContent = '👆 點哪讀哪';
    btnTapJump.style.background = '#F0F9FF';
    btnTapJump.style.color = '#0369A1';
  }
}
syncTapJumpUI();
  applyUiLanguage();

btnTapJump.addEventListener('click', () => {
  tapToJump = !tapToJump;
  localStorage.setItem('reading_tapToJump', tapToJump);
  syncTapJumpUI();
  applyUiLanguage();
});

function getTokenStartTime(idx) {
  const track = getCurrentTrack();
  const tok = track.tokens[idx];
  if (!tok) return 0;
  const pData = ParentVoice.getActiveData();
  if (useParentVoice && pData && pData.timings && pData.timings[idx]) {
    return Number(pData.timings[idx][0]) || 0;
  }
  if (playMode === 'exact' && tok.exactStart !== undefined) {
    return Number(tok.exactStart) || 0;
  }
  return Number(tok.start) || 0;
}

let wordPlayer = new Audio();
function playSingleToken(idx, el) {
  if (!currentStory) return;
  // 若「👆 點哪讀哪」開啟且正在聽故事（或父母錄音中未鎖定），直接跳轉到該字詞繼續連播
  if (tapToJump && !isReadingAlong && !ParentVoice.isRecording()) {
    wordPlayer.pause();
    stopReadAlong();
    requestWakeLock();
    const targetSec = getTokenStartTime(idx);
    ttsAudioEl.playbackRate = SPEEDS[speedIdx].rate;
    btnPlayTts.querySelector('.label').textContent = tUI('pause');
    highlightToken(idx);

    const startFromTarget = () => {
      try { ttsAudioEl.currentTime = targetSec; } catch (e) {}
      ttsAudioEl.play().then(() => syncHighlightLoop()).catch(() => {});
    };

    if (ttsAudioEl.readyState >= 1) {
      startFromTarget();
    } else {
      ttsAudioEl.addEventListener('loadedmetadata', startFromTarget, { once: true });
      ttsAudioEl.load();
    }
    return;
  }
  stopTtsPlayback();
  wordPlayer.pause();
  const token = getCurrentTrack().tokens[idx], rate = SPEEDS[speedIdx].rate;
  storyContent.querySelectorAll('.token.tapped').forEach(x => x.classList.remove('tapped'));
  el.classList.add('tapped');

  if (useParentVoice && ParentVoice.playParentSingleWord(idx, rate, () => el.classList.remove('tapped'))) {
    return;
  }
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
  else { stopReadAlong(); requestWakeLock(); ttsAudioEl.playbackRate = SPEEDS[speedIdx].rate; ttsAudioEl.play(); btnPlayTts.querySelector('.label').textContent = tUI('pause'); syncHighlightLoop(); }
});

function stopTtsPlayback() { ttsAudioEl.pause(); cancelAnimationFrame(rafId); btnPlayTts.querySelector('.label').textContent = tUI('listen'); }

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
    btnPlayTts.querySelector('.label').textContent = tUI('listen');
  }
}

function syncHighlightLoop() {
  const t = ttsAudioEl.currentTime;
  const tokens = getCurrentTrack().tokens;

  const pData = ParentVoice.getActiveData();
  if (useParentVoice && pData && pData.timings) {
    let activeIdx = -1;
    for (const [idxStr, range] of Object.entries(pData.timings)) {
      const [st, ed] = range; if (t >= st && t <= ed) { activeIdx = Number(idxStr); break; }
    }
    if (activeIdx !== -1) highlightToken(activeIdx);
  } else if (playMode === 'exact') {
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
}
ttsAudioEl.addEventListener('ended', handleStoryEnded);

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
  ParentVoice.unlockAudioContext();
  stopTtsPlayback(); clearHighlight(); recordPanel.classList.add('hidden');
  readCursor = 0; isReadingAlong = true; requestWakeLock();
  btnReadAlong.classList.add('recording'); btnReadAlong.querySelector('.label').textContent = tUI('finishRead'); setRecordingLock('kid');

  let stream;
  try {
    stream = await ParentVoice.getCleanMicStream();
  } catch (err) {
    alert('請允許使用麥克風權限！');
    stopReadAlong();
    return;
  }

  const banner = document.getElementById('parent-rec-banner');
  const statusText = document.getElementById('rec-status-text');
  banner.style.display = 'block';
  ParentVoice.startWaveformMeter(stream);

  // 如果是「⏱️ 提詞跟讀」模式，先倒數 3 秒讓小朋友準備
  if (readAlongMode === 'timed') {
    for (let c = 3; c >= 1; c--) {
      if (!isReadingAlong) {
        ParentVoice.stopWaveformMeter();
        banner.style.display = 'none';
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      statusText.textContent = `🎤 小朋友請準備，${c} 秒後跟著黃色高亮一起讀...`;
      await new Promise(r => setTimeout(r, 900));
    }
    if (!isReadingAlong) {
      ParentVoice.stopWaveformMeter();
      banner.style.display = 'none';
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    statusText.textContent = '🔴 正在跟讀錄音... 跟著黃色高亮慢慢讀（讀完自動結束）';
  } else {
    statusText.textContent = '🎤 語音識別跟讀中... 讀出高亮字詞會自動跳下一個';
    advanceToNextReadableToken(0);
  }

  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];
  mediaRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) audioChunks.push(e.data); };
  mediaRecorder.onstop = () => {
    const peak = ParentVoice.stopWaveformMeter();
    banner.style.display = 'none';
    const actualMime = mediaRecorder.mimeType || 'audio/webm';
    lastKidBlob = new Blob(audioChunks, { type: actualMime });
    const url = URL.createObjectURL(lastKidBlob);
    recordedAudioEl.src = url;
    const dl = document.getElementById('btn-download');
    dl.href = url; dl.download = `${getDisplayTitle(currentStory)}_我的朗讀.${actualMime.includes('mp4') ? 'm4a' : 'webm'}`;
    const btnSaveDb = document.getElementById('btn-save-kid-db');
    btnSaveDb.disabled = false;
    btnSaveDb.textContent = '✅ 保存到系統';
    recordPanel.classList.remove('hidden');
    stream.getTracks().forEach(track => track.stop());
    if (peak < 3) alert('⚠️ 偵測不到麥克風聲音！請在上方下拉選單確認麥克風設備。');
  };
  mediaRecorder.start(250);

  if (readAlongMode === 'timed') {
    // 定速提詞跟讀（與父母錄音相同的平滑高亮節奏）
    const tokens = getCurrentTrack().tokens;
    const readableIndices = [];
    tokens.forEach((t, i) => { if (!t.isBreak && !t.isPunct) readableIndices.push(i); });
    const rate = SPEEDS[speedIdx].rate;
    lastKidTimings = {};
    const kidStartTime = performance.now();
    let step = 0;

    function stepKidHighlight() {
      if (!isReadingAlong) return;
      if (step >= readableIndices.length) {
        setTimeout(() => stopReadAlong(), 450);
        return;
      }
      const tokIdx = readableIndices.at(step);
      const tokText = tokens.at(tokIdx).text || '';
      const charCount = Math.max(1, tokText.trim().length);
      const baseMs = /^[A-Za-z0-9]/.test(tokText) ? 950 : (650 + charCount * 240);
      const stepMs = Math.round(baseMs / rate);

      const nowSec = (performance.now() - kidStartTime) / 1000;
      lastKidTimings[tokIdx] = [Math.max(0, Math.round((nowSec - 0.05) * 1000) / 1000), Math.round((nowSec + stepMs / 1000 + 0.05) * 1000) / 1000];
      highlightToken(tokIdx);
      step++;
      kidGuidedTimer = setTimeout(stepKidHighlight, stepMs);
    }
    stepKidHighlight();
  } else {
    // 語音識別追蹤跟讀
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
  isReadingAlong = false;
  clearTimeout(kidGuidedTimer);
  releaseWakeLock();
  clearHighlight();
  btnReadAlong.classList.remove('recording'); btnReadAlong.querySelector('.label').textContent = tUI('readAlong'); setRecordingLock('none');
  if (recognition) { recognition.onend = null; recognition.stop(); }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
}


document.getElementById('btn-save-kid-db').addEventListener('click', async () => {
  if (!lastKidBlob || !currentStory) return;
  const customName = prompt('請輸入錄音名稱（方便在錄音庫查看）：', '寶寶的朗讀');
  if (customName === null) return; // 用戶按取消
  const vPref = VOICE_PREFS.at(voiceIdx);
  await ParentVoice.saveDirectRecording({
    storyId: currentStory.id,
    storyTitle: getDisplayTitle(currentStory),
    langId: vPref.id,
    langLabel: vPref.label.replace('🗣️ ', ''),
    label: customName.trim() || '寶寶的朗讀',
    blob: lastKidBlob,
    timings: lastKidTimings
  });
  const btnSaveDb = document.getElementById('btn-save-kid-db');
  btnSaveDb.textContent = '🎉 已保存至系統';
  btnSaveDb.disabled = true;
  // 若當前正在該故事頁，刷新頂部錄音切換列表，讓小朋友也能用自己的聲音播故事！
  storyParentRecs = await ParentVoice.getRecordingsForStory(currentStory.id, vPref.id);
  updateParentButtonsUI();
});


document.getElementById('btn-close-record').addEventListener('click', () => {
  recordedAudioEl.pause();
  recordPanel.classList.add('hidden');
});

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
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (!ttsAudioEl.paused) { requestWakeLock(); syncHighlightLoop(); }
    else if (isReadingAlong) { requestWakeLock(); }
  }
});
document.getElementById('btn-back').addEventListener('click', () => { ParentVoice.stopGuidedRecording(); stopTtsPlayback(); stopReadAlong(); recordedAudioEl.pause(); viewReader.classList.remove('active'); viewList.classList.add('active'); });

init();
