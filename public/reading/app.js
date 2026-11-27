const btnFontSize = document.getElementById('btn-font-size');
const FONT_SIZES = [
  { scale: 1.0, zh_hant: '🔠 標準', zh_hans: '🔠 标准', en: '🔠 Normal' },
  { scale: 1.25, zh_hant: '🔠 大字', zh_hans: '🔠 大字', en: '🔠 Large' },
  { scale: 1.5, zh_hant: '🔠 特大', zh_hans: '🔠 特大', en: '🔠 Extra Large' },
  { scale: 0.85, zh_hant: '🔠 適中', zh_hans: '🔠 适中', en: '🔠 Compact' }
];
let fontSizeIdx = Number(localStorage.getItem('reading_fontSizeIdx')) || 0;
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
const SPEEDS = [
  { rate: 1.0, label: '🐇 1.0x' },
  { rate: 0.8, label: '🐢 0.8x' },
  { rate: 0.7, label: '🐌 0.7x' },
  { rate: 0.5, label: '🦥 0.5x' },
  { rate: 1.2, label: '🚀 1.2x' }
];
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
  const timeTag = curRec ? new Date(curRec.createdAt).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  if (useParentVoice && curRec) {
    btnParentPlay.textContent = `👨‍👩‍👧 ${curRec.label} ${timeTag}(開)`;
    btnParentPlay.style.background = '#F59E0B';
    btnParentPlay.style.color = '#FFF';
  } else {
    btnParentPlay.textContent = hasRec ? `👨‍👩‍👧 ${curRec.label} ${timeTag}` : '👨‍👩‍👧 陪讀聲';
    btnParentPlay.style.background = '#FEF3C7';
    btnParentPlay.style.color = '#B45309';
  }
  updateHeaderStatusPill();
  applyUiLanguage();
  if (typeof applyFontSize === 'function') applyFontSize();
  if (typeof syncQuickButtonsState === 'function') syncQuickButtonsState();
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
  if (typeof syncQuickButtonsState === 'function') syncQuickButtonsState();
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
      renderQuickTutorTags();
      const curTutor = FamilyManager.getActiveMember();
      const fallbackTutorLabel = VOICE_PREFS.at(voiceIdx).id === 'en' ? `${curTutor.avatar} ${curTutor.name}'s Voice` : `${curTutor.avatar} ${curTutor.name}的聲音`;
      previewLabelInput.value = localStorage.getItem('reading_lastTutorRecLabel') || fallbackTutorLabel;
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
  if (previewLabelInput.value.trim()) localStorage.setItem('reading_lastTutorRecLabel', previewLabelInput.value.trim());
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
document.getElementById('btn-open-manager').addEventListener('click', () => {
  if (typeof GDriveSync !== 'undefined') GDriveSync.renderPanel();
  openManagerModal();
});
modalManager.addEventListener('click', (e) => { if (e.target === modalManager) { managerList.querySelectorAll('audio').forEach(a => a.pause()); modalManager.classList.add('hidden'); } });
document.getElementById('btn-close-manager-bottom').addEventListener('click', () => document.getElementById('btn-close-manager').click());
document.getElementById('btn-close-manager').addEventListener('click', () => {
  managerList.querySelectorAll('audio').forEach(a => a.pause());
  modalManager.classList.add('hidden');
});

async function openManagerModal() {
  modalManager.classList.remove('hidden');
  await renderManagerList();
}

let managerFilterLabel = 'ALL';
async function renderManagerList() {
  if (typeof GDriveSync !== 'undefined') GDriveSync.renderPanel();
  if (typeof GDriveSync !== 'undefined') GDriveSync.renderPanel();
  const allList = await ParentVoice.getAllRecordings();
  const filterBar = document.getElementById('manager-filter-bar');
  if (filterBar) {
    const uniqueLabels = Array.from(new Set(allList.map(r => r.label)));
    filterBar.innerHTML = `<button class="btn-mini" style="background:${managerFilterLabel === 'ALL' ? '#F59E0B' : '#F1F5F9'};color:${managerFilterLabel === 'ALL' ? '#fff' : '#334155'};" onclick="setManagerFilter('ALL')">📚 全部 (${allList.length})</button>` +
      uniqueLabels.map(lbl => {
        const cnt = allList.filter(r => r.label === lbl).length;
        const active = managerFilterLabel === lbl;
        return `<button class="btn-mini" style="background:${active ? '#F59E0B' : '#FEF3C7'};color:${active ? '#fff' : '#92400E'};" onclick="setManagerFilter('${lbl.replace(/'/g, "\'")}')">${lbl} (${cnt})</button>`;
      }).join('');
  }
  const list = managerFilterLabel === 'ALL' ? allList : allList.filter(r => r.label === managerFilterLabel);
  if (list.length === 0) {
    managerList.innerHTML = '<p style="color:#64748B;padding:24px 0;">目前還沒有保存任何錄音喔！<br>打開任一故事點擊「🎤 自己讀」或「🎙️ 開始錄製」即可保存。</p>';
    return;
  }
  const batchBar = document.getElementById('manager-batch-bar');
  if (batchBar) batchBar.style.display = list.length > 0 ? 'flex' : 'none';
  managerList.innerHTML = list.map((rec, idx) => {
    const url = URL.createObjectURL(rec.blob);
    const dateStr = new Date(rec.createdAt).toLocaleString('zh-HK', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    const ext = (rec.blob && rec.blob.type && rec.blob.type.includes('mp4')) ? 'm4a' : 'webm';
    return `
      <div class="rec-item">
        <div class="rec-item-header">
          <label class="rec-item-title" style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" class="rec-batch-chk" value="${rec.id}" onchange="syncBatchDeleteUI()" style="width:19px;height:19px;accent-color:#F59E0B;flex-shrink:0;" /><span>#${list.length - idx} 📖 ${rec.storyTitle} · <span style="color:#D97706;">${rec.label}</span></span></label>
          <div class="rec-item-meta">語言：${rec.langLabel} ｜ 時長：<span id="dur-${rec.id}">${getRecEstimatedDuration(rec) || '--:--'}</span> ｜ ${dateStr}</div>
        </div>
        <audio controls playsinline src="${url}" style="width:100%;height:40px;" onloadedmetadata="if(isFinite(this.duration)){const el=document.getElementById('dur-${rec.id}');if(el)el.textContent=formatSecMMSS(this.duration);}"></audio>
        <div class="rec-item-btns">
          <button class="btn-mini" style="background:#FEF3C7;color:#B45309;border:1px solid #F59E0B;" onclick="playRecInStory('${rec.id}')">▶️ 故事播放</button>
          <a class="btn-mini" style="background:#DCFCE7;color:#15803D;text-decoration:none;display:inline-flex;align-items:center;" href="${url}" download="${rec.storyTitle}_${rec.label}.${ext}">⬇️ 下載</a>
          <button class="btn-mini" style="background:#E0F2FE;color:#0369A1;" onclick="handleRenameRec('${rec.id}', '${rec.label.replace(/'/g, "\'")}')">✏️ 改名</button>
          <button class="btn-mini" style="background:#FEE2E2;color:#B91C1C;" onclick="handleDeleteRec('${rec.id}')">🗑️ 刪除</button>
        </div>
      </div>`;
  }).join('');
  if (typeof syncBatchDeleteUI === 'function') syncBatchDeleteUI();
}

window.setManagerFilter = async (lbl) => {
  managerFilterLabel = lbl;
  await renderManagerList();
};


window.playRecInStory = async (recId) => {
  if (typeof GDriveSync !== 'undefined') GDriveSync.renderPanel();
  const allList = await ParentVoice.getAllRecordings();
  const targetRec = allList.find(r => r.id === recId);
  if (!targetRec) return;

  // 1. 關閉錄音庫彈窗並暫停試聽音頻
  managerList.querySelectorAll('audio').forEach(a => a.pause());
  modalManager.classList.add('hidden');

  // 2. 自動切換到該錄音錄製時的語音（如粵語/國語/普通話/英文）
  const vIdx = VOICE_PREFS.findIndex(v => v.id === targetRec.langId);
  if (vIdx !== -1 && vIdx !== voiceIdx) {
    voiceIdx = vIdx;
    localStorage.setItem('reading_voiceIdx', voiceIdx);
    FamilyManager.updateActiveMemberPrefs({ voiceIdx });
    syncPrefButtons();
    renderFamilyBar();
  }

  // 3. 啟用陪讀/家庭錄音模式，並開啟對應的故事書
  useParentVoice = true;
  localStorage.setItem('reading_useParentVoice', 'true');
  await openStory(targetRec.storyId, false);

  // 4. 精準定位到這一筆錄音（即使同一個人錄了多次也能選中對應那一筆）并開始同步高亮播放
  const foundIdx = storyParentRecs.findIndex(r => r.id === recId);
  if (foundIdx !== -1) {
    selectedParentRecIdx = foundIdx;
    await ParentVoice.activateRecord(storyParentRecs[foundIdx]);
    updateParentButtonsUI();
    ttsAudioEl.src = storyParentRecs[foundIdx].url;
    applyCurrentPlaybackRate();
    ttsAudioEl.load();
  }

  // 保持待播就緒狀態，讓底部按鈕明確顯示「🎧 聽XX講故事」，由用戶點擊開始播放
  stopTtsPlayback();
  clearHighlight();
  const playLbl = btnPlayTts.querySelector('.label');
  if (playLbl) playLbl.textContent = getListenButtonLabel();
};

window.handleRenameRec = async (id, oldName) => {
  const nextName = await CustomUI.showPrompt({ title: '✏️ 修改錄音名稱', desc: '請輸入新的錄音標籤名稱：', defaultValue: oldName, okText: '保存' });
  if (nextName && nextName.trim()) {
    await ParentVoice.renameRecording(id, nextName.trim());
    await renderManagerList();
    CustomUI.showToast('✅ 錄音名稱已更新');
  }
};

window.handleDeleteRec = async (id) => {
  const ok = await CustomUI.showConfirm({ title: '🗑️ 刪除錄音', desc: '確定要刪除這段錄音嗎？刪除後無法恢復喔。', okText: '確定刪除', isDanger: true });
  if (ok) {
    await ParentVoice.deleteRecording(id);
    await renderManagerList();
    CustomUI.showToast('🗑️ 錄音已刪除');
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



const QUICK_PAIRS = [
  ['q-voice', 'btn-reader-voice'],
  ['q-speed', 'btn-speed'],
  ['q-font', 'btn-font-size'],
  ['q-repeat', 'btn-repeat'],
  ['q-parent', 'btn-parent-play']
];

QUICK_PAIRS.forEach(([qId, targetId]) => {
  const qBtn = document.getElementById(qId);
  const tBtn = document.getElementById(targetId);
  if (qBtn && tBtn) {
    qBtn.addEventListener('click', () => tBtn.click());
  }
});

function syncQuickButtonsState() {
  QUICK_PAIRS.forEach(([qId, targetId]) => {
    const qBtn = document.getElementById(qId);
    const tBtn = document.getElementById(targetId);
    if (!qBtn || !tBtn) return;
    qBtn.textContent = tBtn.textContent;
    qBtn.disabled = tBtn.disabled;
    if (qId === 'q-parent') {
      const hasRec = storyParentRecs.length > 0;
      qBtn.style.setProperty('display', hasRec ? '' : 'none', hasRec ? '' : 'important');
      qBtn.style.background = tBtn.style.background;
      qBtn.style.color = tBtn.style.color;
    }
  });
}


function getListenButtonLabel() {
  if (!ttsAudioEl.paused) return tUI('pause');
  const curRec = storyParentRecs.at(selectedParentRecIdx);
  if (useParentVoice && curRec && curRec.label) {
    const isEn = VOICE_PREFS.at(voiceIdx).id === 'en';
    const sId = SCRIPT_PREFS.at(scriptIdx).id;
    let speaker = curRec.label
      .replace(/的聲音|的声音|的朗讀|的朗读|'s Voice|'s Reading/gi, '')
      .trim();
    if (speaker.length > 8) speaker = speaker.slice(0, 8) + '…';
    if (isEn) return `🎧 Listen to ${speaker}`;
    return sId === 'cn' ? `🎧 听${speaker}讲故事` : `🎧 聽${speaker}講故事`;
  }
  return tUI('listen');
}


function formatSecMMSS(sec) {
  if (!isFinite(sec) || isNaN(sec) || sec < 0) return '00:00';
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function getRecEstimatedDuration(rec) {
  if (rec && rec.timings) {
    const vals = Object.values(rec.timings);
    if (vals.length > 0) {
      const maxEnd = Math.max(...vals.map(pair => Number(pair.at(1)) || 0));
      if (maxEnd > 0) return formatSecMMSS(maxEnd);
    }
  }
  return '';
}


function syncSoundFxUI() {
  const btn = document.getElementById('btn-sound-fx');
  const lbl = document.getElementById('lbl-sound-fx');
  if (lbl) lbl.textContent = tUI('lblSoundFx');
  if (!btn || typeof SoundFX === 'undefined') return;
  const on = SoundFX.isEnabled();
  btn.textContent = on ? tUI('sfxOn') : tUI('sfxOff');
  btn.style.background = on ? '#0284C7' : '#F1F5F9';
  btn.style.color = on ? '#FFF' : '#64748B';
}
document.getElementById('btn-sound-fx')?.addEventListener('click', () => {
  if (typeof SoundFX !== 'undefined') SoundFX.toggle();
  syncSoundFxUI();
});

function applyUiLanguage() {
  if (typeof syncSoundFxUI === 'function') syncSoundFxUI();
  const setTxt = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };
  setTxt('#view-list .top-bar h1', tUI('appTitle'));
  setTxt('#btn-open-guide', tUI('guideBtn')); setTxt('#modal-guide h3', tUI('guideTitle')); setTxt('#modal-guide .btn-manager-bottom-close', tUI('guideBtnStart')); setTxt('#btn-open-manager', tUI('recLibrary'));
  setTxt('#btn-back', tUI('back'));
  setTxt('#btn-open-settings', tUI('settings'));
  const isTapOn = typeof tapToJump !== 'undefined' ? tapToJump : (localStorage.getItem('reading_tapToJump') === 'true');
  setTxt('#btn-tap-jump', isTapOn ? tUI('tapJumpOn') : tUI('tapJumpOff'));
  setTxt('#btn-play-tts .label', getListenButtonLabel());
  setTxt('#btn-read-along .label', isReadingAlong ? tUI('finishRead') : tUI('readAlong'));

  setTxt('#modal-settings h3', tUI('settingsTitle'));
  setTxt('#btn-close-settings', tUI('done'));
  const rows = document.querySelectorAll('#modal-settings .setting-row label');
  const lblKeys = ['lblVoice', 'lblScript', 'lblFontSize', 'lblSpeed', 'lblMode', 'lblRepeat', 'lblReadMode', 'lblSoundFx', 'lblParentPlay', 'lblParentRec'];
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
  setTxt('#btn-close-manager-bottom', tUI('done'));
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
  if (typeof applyFontSize === 'function') applyFontSize();
  if (typeof syncQuickButtonsState === 'function') syncQuickButtonsState();
}
syncPrefButtons();

function cycleVoice() {
  voiceIdx = (voiceIdx + 1) % VOICE_PREFS.length;
  localStorage.setItem('reading_voiceIdx', voiceIdx); FamilyManager.updateActiveMemberPrefs({ voiceIdx }); renderFamilyBar();
  syncPrefButtons();
  if (allStories.length) renderStoryList(allStories);
  if (currentStory && viewReader.classList.contains('active')) applyTrackToReader(false);
}

function cycleScript() {
  scriptIdx = (scriptIdx + 1) % SCRIPT_PREFS.length;
  localStorage.setItem('reading_scriptIdx', scriptIdx); FamilyManager.updateActiveMemberPrefs({ scriptIdx });
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


function applyCurrentPlaybackRate() {
  const rate = SPEEDS.at(speedIdx).rate;
  ttsAudioEl.defaultPlaybackRate = rate;
  ttsAudioEl.playbackRate = rate;
}
ttsAudioEl.addEventListener('loadedmetadata', applyCurrentPlaybackRate);
ttsAudioEl.addEventListener('playing', applyCurrentPlaybackRate);



function applyFontSize() {
  const item = FONT_SIZES.at(fontSizeIdx) || FONT_SIZES.at(0);
  document.documentElement.style.setProperty('--story-font-scale', item.scale);
  if (btnFontSize) {
    const langKey = getUiLangKey(VOICE_PREFS.at(voiceIdx).id, SCRIPT_PREFS.at(scriptIdx).id);
    btnFontSize.textContent = item[langKey] || item.zh_hant;
  }
  const lbl = document.getElementById('lbl-font-size');
  if (lbl) lbl.textContent = tUI('lblFontSize');
}
applyFontSize();

if (btnFontSize) {
  btnFontSize.addEventListener('click', () => {
    fontSizeIdx = (fontSizeIdx + 1) % FONT_SIZES.length;
    localStorage.setItem('reading_fontSizeIdx', fontSizeIdx);
    applyFontSize();
    syncQuickButtonsState();
  });
}

btnSpeed.addEventListener('click', () => {
  speedIdx = (speedIdx + 1) % SPEEDS.length;
  localStorage.setItem('reading_speedIdx', speedIdx);
  syncPrefButtons();
  applyCurrentPlaybackRate();
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


function renderFamilyBar() {
  const bar = document.getElementById('family-bar');
  if (!bar) return;
  const members = FamilyManager.getMembers();
  const active = FamilyManager.getActiveMember();
  const tutorTag = VOICE_PREFS.at(voiceIdx).id === 'en' ? 'Tutor' : '輔導';

  bar.innerHTML = members.map(m => `
    <button class="member-chip ${m.id === active.id ? 'active' : ''}" onclick="switchFamilyMember('${m.id}')">
      <span>${m.avatar} ${m.name}</span>
      ${m.canTutor ? `<span class="role-tag">${tutorTag}</span>` : ''}
    </button>
  `).join('') + `
    <button class="member-chip" style="border-style:dashed;color:#0284C7;" onclick="handleAddMember()">➕ 新增成員</button>
    <button class="member-chip" style="border-style:dashed;color:#64748B;" onclick="handleEditMember()">✏️ 改名/刪除</button>
  `;

  // 根據當前成員是否為輔導者（父母/兄姊），自動顯示或隱藏設定面板中的「陪讀示範錄音」
  const recBtn = document.getElementById('btn-parent-rec');
  if (recBtn && recBtn.parentElement) {
    recBtn.parentElement.style.display = active.canTutor ? 'flex' : 'none';
  }
}

window.switchFamilyMember = (id) => {
  const m = FamilyManager.setActiveMember(id);
  selectedLevel = m.level !== undefined ? m.level : 0;
  voiceIdx = m.voiceIdx !== undefined ? m.voiceIdx : 0;
  scriptIdx = m.scriptIdx !== undefined ? m.scriptIdx : 0;
  localStorage.setItem('reading_selectedLevel', selectedLevel); FamilyManager.updateActiveMemberPrefs({ level: selectedLevel });
  localStorage.setItem('reading_voiceIdx', voiceIdx); FamilyManager.updateActiveMemberPrefs({ voiceIdx }); renderFamilyBar();
  localStorage.setItem('reading_scriptIdx', scriptIdx); FamilyManager.updateActiveMemberPrefs({ scriptIdx });
  syncPrefButtons();
  renderFamilyBar();
  renderStoryList(allStories);
};


window.handleEditMember = async () => {
  const updated = await FamilyManager.editCurrentMember();
  if (updated) switchFamilyMember(updated.id);
};

function renderQuickTutorTags() {
  const box = document.getElementById('quick-tutor-tags');
  if (!box) return;
  const isEn = VOICE_PREFS.at(voiceIdx).id === 'en';
  const tutors = FamilyManager.getMembers().filter(m => m.canTutor);
  box.innerHTML = tutors.map(m => {
    const tagTxt = isEn ? `${m.avatar} ${m.name}'s Voice` : `${m.avatar} ${m.name}的聲音`;
    return `<button type="button" class="btn-mini" style="background:#FEF3C7;color:#92400E;border:1px solid #F59E0B;" onclick="document.getElementById('preview-label-input').value='${tagTxt.replace(/'/g, "\'")}'">${m.avatar} ${m.name}</button>`;
  }).join('') + `<button type="button" class="btn-mini" style="background:#F1F5F9;color:#334155;border:1px solid #CBD5E1;" onclick="const inp=document.getElementById('preview-label-input');inp.value='';inp.focus();">✏️ 自定義</button>`;
}

window.handleAddMember = async () => {
  const added = await FamilyManager.addCustomMember();
  if (added) switchFamilyMember(added.id);
};

async function init() {
  const activeM = FamilyManager.getActiveMember();
  selectedLevel = activeM.level !== undefined ? activeM.level : selectedLevel;
  voiceIdx = activeM.voiceIdx !== undefined ? activeM.voiceIdx : voiceIdx;
  scriptIdx = activeM.scriptIdx !== undefined ? activeM.scriptIdx : scriptIdx;
  syncPrefButtons();
  renderFamilyBar();
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


let selectedLevel = Number(localStorage.getItem('reading_selectedLevel')) || 0;

function getLevelTagText(lvl) {
  const vId = VOICE_PREFS.at(voiceIdx).id;
  const sId = SCRIPT_PREFS.at(scriptIdx).id;
  if (vId === 'en') return lvl === 1 ? 'Lv.1 Starter' : (lvl === 2 ? 'Lv.2 Growing' : 'Lv.3 Explorer');
  if (sId === 'cn') return lvl === 1 ? '🌱 启蒙 Lv.1' : (lvl === 2 ? '🌿 进阶 Lv.2' : '🌳 挑战 Lv.3');
  return lvl === 1 ? '🌱 啟蒙 Lv.1' : (lvl === 2 ? '🌿 進階 Lv.2' : '🌳 挑戰 Lv.3');
}

function updateLevelTabsUI() {
  const vId = VOICE_PREFS.at(voiceIdx).id;
  const sId = SCRIPT_PREFS.at(scriptIdx).id;
  const labels = vId === 'en'
    ? ['📚 All', '🌱 Lv.1 Starter', '🌿 Lv.2 Growing', '🌳 Lv.3 Explorer']
    : (sId === 'cn' ? ['📚 全部', '🌱 启蒙 Lv.1', '🌿 进阶 Lv.2', '🌳 挑战 Lv.3'] : ['📚 全部', '🌱 啟蒙 Lv.1', '🌿 進階 Lv.2', '🌳 挑戰 Lv.3']);
  document.querySelectorAll('#level-tabs .level-tab').forEach((btn, idx) => {
    btn.textContent = labels.at(idx);
    btn.classList.toggle('active', Number(btn.dataset.lvl) === selectedLevel);
  });
}

document.querySelectorAll('#level-tabs .level-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedLevel = Number(btn.dataset.lvl);
    localStorage.setItem('reading_selectedLevel', selectedLevel); FamilyManager.updateActiveMemberPrefs({ level: selectedLevel });
    updateLevelTabsUI();
    renderStoryList(allStories);
  });
});

function renderStoryList(stories) {
  updateLevelTabsUI();
  const filtered = selectedLevel === 0 ? stories : stories.filter(s => (s.level || 1) === selectedLevel);
  const svg = 'data:image/svg+xml,<svg xmlns=%22http://w3.org viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23FFE066%22/><text x=%2250%22 y=%2262%22 font-size=%2245%22 text-anchor=%22middle%22>📖</text></svg>';
  storyGrid.innerHTML = filtered.map(s => {
    const lvl = s.level || 1;
    return `
    <div class="story-card" onclick="openStory('${s.id}')">
      <img src="${s.cover || svg}" alt="${getDisplayTitle(s)}">
      <h3>${getDisplayTitle(s)}</h3>
      <div>
        <span class="lvl-badge lvl-${lvl}">${getLevelTagText(lvl)}</span>
        <span class="lang-tag">${VOICE_PREFS.at(voiceIdx).label.replace('🗣️ ', '')}</span>
      </div>
    </div>`;
  }).join('');
  if (typeof syncBatchDeleteUI === 'function') syncBatchDeleteUI();
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
  applyCurrentPlaybackRate();
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
      el.textContent = disp;
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
      html += `<span class="token ${t.isPunct ? 'punct' : ''}" data-idx="${idx}">${disp}</span>`;
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
  if (typeof applyFontSize === 'function') applyFontSize();
  if (typeof syncQuickButtonsState === 'function') syncQuickButtonsState();
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
  if (typeof applyFontSize === 'function') applyFontSize();
  if (typeof syncQuickButtonsState === 'function') syncQuickButtonsState();
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
    applyCurrentPlaybackRate();
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
  clearHighlight();
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
  else { stopReadAlong(); requestWakeLock(); applyCurrentPlaybackRate(); ttsAudioEl.play(); btnPlayTts.querySelector('.label').textContent = tUI('pause'); syncHighlightLoop(); }
});

function stopTtsPlayback() {
  clearTimeout(window._autoNextStoryTimer); ttsAudioEl.pause(); cancelAnimationFrame(rafId); btnPlayTts.querySelector('.label').textContent = getListenButtonLabel(); }


function triggerStarCelebration() {
  if (typeof SoundFX !== "undefined") SoundFX.play("celebrate");
  // 移除舊的未結束動畫層
  const old = document.querySelector('.star-celebration-layer');
  if (old) old.remove();

  const layer = document.createElement('div');
  layer.className = 'star-celebration-layer';

  // 僅保留滿屏星星雨，不顯示中央文字橫幅以免遮擋故事正文

  // 2. 生成 36 顆滿屏隨機飄落的星星與彩帶
  const icons = ['⭐', '🌟', '✨', '🎉', '🏆', '💫'];
  for (let i = 0; i < 36; i++) {
    const star = document.createElement('span');
    star.className = 'falling-star';
    star.textContent = icons[i % icons.length];
    star.style.left = Math.random() * 96 + 'vw';
    star.style.fontSize = (22 + Math.random() * 24) + 'px';
    const dur = 2.0 + Math.random() * 1.4;
    const delay = Math.random() * 0.55;
    star.style.animationDuration = dur + 's';
    star.style.animationDelay = delay + 's';
    layer.appendChild(star);
  }

  document.body.appendChild(layer);
  setTimeout(() => { if (layer.parentNode) layer.remove(); }, 3600);
}

function handleStoryEnded() {
  triggerStarCelebration();
  clearHighlight();
  const mode = REPEAT_MODES[repeatIdx].id;
  const playLbl = btnPlayTts.querySelector('.label');
  const isEn = VOICE_PREFS.at(voiceIdx).id === 'en';
  const sId = SCRIPT_PREFS.at(scriptIdx).id;

  // 1. 單篇循環 (single)：停頓 2.2 秒後重播本篇
  if (mode === 'single') {
    ttsAudioEl.currentTime = 0;
    if (playLbl) playLbl.textContent = isEn ? '⏳ Replaying...' : (sId === 'cn' ? '⏳ 即将重播...' : '⏳ 即將重播...');
    clearTimeout(window._autoNextStoryTimer);
    window._autoNextStoryTimer = setTimeout(() => {
      if (!viewReader.classList.contains('active')) return;
      ttsAudioEl.play().then(() => {
        if (playLbl) playLbl.textContent = tUI('pause');
        syncHighlightLoop();
      }).catch(() => {});
    }, 2200);
    return;
  }

  // 2. 連續循環 (list) 或 隨機循環 (random)：先翻頁顯示新故事標題，停頓 2.8 秒再溫和開讀
  if ((mode === 'list' || mode === 'random') && allStories.length > 0) {
    let nextIdx = 0;
    if (mode === 'random' && allStories.length > 1) {
      const curIdx = allStories.findIndex(s => s.id === currentStory.id);
      do { nextIdx = Math.floor(Math.random() * allStories.length); } while (nextIdx === curIdx);
    } else {
      const curIdx = allStories.findIndex(s => s.id === currentStory.id);
      nextIdx = (curIdx + 1) % allStories.length;
    }
    const nextStory = allStories[nextIdx];
    openStory(nextStory.id, false).then(() => {
      const lbl = btnPlayTts.querySelector('.label');
      if (lbl) lbl.textContent = isEn ? '⏳ Next story...' : (sId === 'cn' ? '⏳ 即将开始...' : '⏳ 即將開始...');
      clearTimeout(window._autoNextStoryTimer);
      window._autoNextStoryTimer = setTimeout(() => {
        if (!viewReader.classList.contains('active') || !currentStory || currentStory.id !== nextStory.id) return;
        requestWakeLock();
        ttsAudioEl.play().then(() => {
          if (lbl) lbl.textContent = tUI('pause');
          syncHighlightLoop();
        }).catch(() => {});
      }, 2800);
    });
    return;
  }

  // 3. 單篇不循環：停留在結尾並恢復按鈕
  if (playLbl) playLbl.textContent = getListenButtonLabel();
  releaseWakeLock();
}

function syncHighlightLoop() {
  const t = ttsAudioEl.currentTime;
  const playLbl = btnPlayTts.querySelector('.label');
  if (playLbl && !ttsAudioEl.paused) {
    let totalDur = ttsAudioEl.duration;
    if ((!isFinite(totalDur) || isNaN(totalDur)) && useParentVoice && ParentVoice.getActiveData()) {
      const vals = Object.values(ParentVoice.getActiveData().timings || {});
      if (vals.length) totalDur = Math.max(...vals.map(p => Number(p.at(1)) || 0));
    }
    const durSuffix = (isFinite(totalDur) && totalDur > 0) ? ` ${formatSecMMSS(t)}/${formatSecMMSS(totalDur)}` : ` ${formatSecMMSS(t)}`;
    playLbl.textContent = tUI('pause') + durSuffix;
  }
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
  btnReadAlong.classList.add('recording');
  btnReadAlong.disabled = true;
  btnReadAlong.querySelector('.label').textContent = '準備中...';
  setRecordingLock('kid');

  let stream;
  try {
    stream = await ParentVoice.getCleanMicStream();
  } catch (err) {
    btnReadAlong.disabled = false;
    CustomUI.showToast('⚠️ 請允許使用麥克風權限');
    stopReadAlong();
    return;
  }

  const banner = document.getElementById('parent-rec-banner');
  const statusText = document.getElementById('rec-status-text');
  banner.style.display = 'block';
  ParentVoice.startWaveformMeter(stream);
  statusText.textContent = '🎤 倒數結束後才正式開始錄音喔...';

  const hintMsg = VOICE_PREFS.at(voiceIdx).id === 'en'
    ? '🎤 Get ready! Start reading after countdown...'
    : '🎤 小朋友請準備，倒數結束後開始自己讀...';
  const okToStart = await ParentVoice.runVisualCountdown(hintMsg, () => !isReadingAlong);
  btnReadAlong.disabled = false;

  if (!okToStart) {
    ParentVoice.stopWaveformMeter();
    banner.style.display = 'none';
    stream.getTracks().forEach(track => track.stop());
    return;
  }

  btnReadAlong.querySelector('.label').textContent = tUI('finishRead');
  if (readAlongMode === 'timed') {
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
    if (peak < 3) CustomUI.showToast('⚠️ 偵測不到麥克風聲音，請檢查上方麥克風選項');
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
        triggerStarCelebration();
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
  const isEn = VOICE_PREFS.at(voiceIdx).id === 'en';
  const curReader = FamilyManager.getActiveMember();
  const fallbackKidLabel = isEn ? `${curReader.avatar} ${curReader.name}'s Reading` : `${curReader.avatar} ${curReader.name}的朗讀`;
  const defaultKidLabel = localStorage.getItem('reading_lastKidRecLabel') || fallbackKidLabel;
  const memberLabels = FamilyManager.getMembers().map(m => isEn ? `${m.avatar} ${m.name}'s Reading` : `${m.avatar} ${m.name}的朗讀`);
  const historyLabels = (await ParentVoice.getAllRecordings()).map(r => r.label);
  const suggestions = Array.from(new Set([defaultKidLabel, ...memberLabels, ...historyLabels]));
  const customName = await CustomUI.showPrompt({
    title: '💾 保存朗讀錄音',
    desc: '可直接點選已有名稱，或在下方輸入自定義名稱：',
    defaultValue: defaultKidLabel,
    okText: '✅ 保存',
    suggestions
  });
  if (customName === null) return;
  if (customName.trim()) localStorage.setItem('reading_lastKidRecLabel', customName.trim());
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



document.addEventListener('click', (e) => {
  if (!recordPanel || recordPanel.classList.contains('hidden')) return;
  const dlgModal = document.getElementById('modal-dialog');
  if (dlgModal && !dlgModal.classList.contains('hidden')) return;
  if (!recordPanel.contains(e.target) && !btnReadAlong.contains(e.target)) {
    recordedAudioEl.pause();
    recordPanel.classList.add('hidden');
  }
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


function enableDesktopDragScroll(el) {
  if (!el || el.dataset.dragReady) return;
  el.dataset.dragReady = '1';
  let isDown = false, startX = 0, scrollLeft = 0, moved = false;

  el.addEventListener('mousedown', (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
  });
  window.addEventListener('mouseup', () => { isDown = false; });
  el.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - startX;
    if (Math.abs(walk) > 5) moved = true;
    el.scrollLeft = scrollLeft - walk;
  });
  // 若剛才進行了拖拽動作，攔截隨後的按鈕 click 避免誤觸
  el.addEventListener('click', (e) => {
    if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
  }, true);
  // 滑鼠滾輪直接轉為橫向滾動
  el.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });
}

['manager-filter-bar', 'family-bar', 'level-tabs'].forEach(id => {
  enableDesktopDragScroll(document.getElementById(id));
});
document.getElementById('btn-open-guide')?.addEventListener('click',()=>document.getElementById('modal-guide')?.classList.remove('hidden'));


(function autoAdjustStoryPaddingForBanner() {
  const banner = document.getElementById('parent-rec-banner');
  const content = document.getElementById('story-content');
  if (!banner || !content) return;

  const syncPad = () => {
    const isVisible = banner.style.display !== 'none' && banner.offsetHeight > 0;
    const topOffset = isVisible ? (62 + banner.offsetHeight + 22) : 82;
    content.style.setProperty('padding-top', topOffset + 'px', 'important');
  };

  if (window.ResizeObserver) {
    new ResizeObserver(syncPad).observe(banner);
  }
  new MutationObserver(syncPad).observe(banner, { attributes: true, attributeFilter: ['style'] });
  window.addEventListener('resize', syncPad);
})();


window.syncBatchDeleteUI = () => {
  const allChks = Array.from(document.querySelectorAll('.rec-batch-chk'));
  const checked = allChks.filter(c => c.checked);
  const selAll = document.getElementById('chk-select-all-recs');
  const delBtn = document.getElementById('btn-batch-delete-recs');
  if (selAll) {
    selAll.checked = allChks.length > 0 && checked.length === allChks.length;
    selAll.indeterminate = checked.length > 0 && checked.length < allChks.length;
  }
  if (delBtn) {
    delBtn.textContent = `🗑️ 批量刪除 (${checked.length})`;
    delBtn.disabled = checked.length === 0;
    delBtn.style.opacity = checked.length === 0 ? '0.5' : '1';
  }
};

document.getElementById('chk-select-all-recs')?.addEventListener('change', (e) => {
  document.querySelectorAll('.rec-batch-chk').forEach(c => { c.checked = e.target.checked; });
  syncBatchDeleteUI();
});

document.getElementById('btn-batch-delete-recs')?.addEventListener('click', async () => {
  const ids = Array.from(document.querySelectorAll('.rec-batch-chk:checked')).map(c => c.value);
  if (ids.length === 0) return;
  const ok = await CustomUI.showConfirm({
    title: '🗑️ 批量刪除錄音',
    desc: `確定要永久刪除已選中的 ${ids.length} 筆錄音嗎？刪除後無法恢復喔。`,
    okText: `刪除 ${ids.length} 筆`,
    isDanger: true
  });
  if (!ok) return;
  for (const id of ids) {
    await ParentVoice.deleteRecording(id);
  }
  if (typeof SoundFX !== 'undefined') SoundFX.play('back', true);
  CustomUI.showToast(`🗑️ 已成功刪除 ${ids.length} 筆錄音`);
  await renderManagerList();
});
