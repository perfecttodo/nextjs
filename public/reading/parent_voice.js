const ParentVoice = (() => {
  const DB_NAME = 'KidsReadingParentDB_V2';
  const STORE_NAME = 'recordings';
  let db = null, isRecording = false, recTimer = null, mediaRecorder = null, recChunks = [];
  let pendingDraft = null, activeParentData = null, parentAudioBuffer = null, parentAudioCtx = null, activeSliceSource = null;
  let waveRaf = null, meterCtx = null, peakLevel = 0;

  // 共用即時聲波繪製器（同時給「父母錄音」與「自己讀」使用）
  let selectedMicId = localStorage.getItem('reading_micDeviceId') || '';

  async function refreshMicDevices() {
    const sel = document.getElementById('mic-device-select');
    if (!sel || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');
      sel.innerHTML = mics.map((m, idx) => {
        const label = m.label || `麥克風 ${idx + 1}`;
        return `<option value="${m.deviceId}" ${m.deviceId === selectedMicId ? 'selected' : ''}>🎙️ ${label}</option>`;
      }).join('');
      if (!selectedMicId && mics.length > 0) {
        selectedMicId = mics.deviceId;
      }
    } catch (e) {}
  }

  async function getCleanMicStream() {
    const constraints = selectedMicId
      ? { audio: { deviceId: { exact: selectedMicId } } }
      : { audio: true };
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    await refreshMicDevices();
    return stream;
  }

  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'mic-device-select') {
      selectedMicId = e.target.value;
      localStorage.setItem('reading_micDeviceId', selectedMicId);
      CustomUI.showToast('✅ 已切換麥克風設備！');
    }
  });

  function unlockAudioContext() {
    if (!meterCtx) meterCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (meterCtx.state === 'suspended') meterCtx.resume().catch(() => {});
  }

  async function runVisualCountdown(hintMsg, shouldAbort) {
    const overlay = document.getElementById('countdown-overlay');
    const numEl = document.getElementById('countdown-num');
    const hintEl = document.getElementById('countdown-hint');
    if (!overlay || !numEl) return true;

    if (hintEl) hintEl.textContent = hintMsg;
    overlay.classList.remove('hidden');

    for (let c = 3; c >= 1; c--) {
      if (shouldAbort && shouldAbort()) {
        overlay.classList.add('hidden');
        return false;
      }
      numEl.textContent = String(c);
      // 重新觸發彈跳動畫
      numEl.style.animation = 'none';
      void numEl.offsetWidth;
      numEl.style.animation = '';
      await new Promise(r => setTimeout(r, 950));
    }

    if (shouldAbort && shouldAbort()) {
      overlay.classList.add('hidden');
      return false;
    }

    numEl.textContent = 'GO!';
    numEl.style.fontSize = '46px';
    await new Promise(r => setTimeout(r, 350));
    numEl.style.fontSize = '';
    overlay.classList.add('hidden');
    return true;
  }

  function startWaveformMeter(stream) {
    peakLevel = 0;
    const canvas = document.getElementById('mic-waveform');
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    unlockAudioContext();
    if (meterCtx.state === 'suspended') meterCtx.resume();

    if (currentSourceNode) { try { currentSourceNode.disconnect(); } catch (e) {} }
    const src = meterCtx.createMediaStreamSource(stream);
    currentSourceNode = src;
    const analyser = meterCtx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    const timeData = new Uint8Array(analyser.fftSize);

    function draw() {
      if (!meterCtx) return;
      if (meterCtx.state === 'suspended') meterCtx.resume();
      analyser.getByteTimeDomainData(timeData);

      // 計算相對於中心線 128 的真實聲波振幅 (0 ~ 128)
      let maxAmp = 0;
      for (let i = 0; i < timeData.length; i++) {
        const amp = Math.abs(timeData[i] - 128);
        if (amp > maxAmp) maxAmp = amp;
      }
      if (maxAmp > peakLevel) peakLevel = maxAmp;

      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      const barW = 5, gap = 3, bars = Math.floor(canvas.width / (barW + gap));
      const step = Math.floor(timeData.length / bars);
      for (let i = 0; i < bars; i++) {
        const amp = Math.abs(timeData[i * step] - 128);
        // 放大 3 倍視覺靈敏度，輕聲說話也能看到明顯波形
        const norm = Math.min(1, (amp * 3.0) / 128);
        const h = Math.max(4, norm * (canvas.height - 6));
        ctx2d.fillStyle = amp > 3 ? '#F43F5E' : '#94A3B8';
        ctx2d.fillRect(i * (barW + gap) + 4, (canvas.height - h) / 2, barW, h);
      }
      waveRaf = requestAnimationFrame(draw);
    }
    draw();
  }

  let currentSourceNode = null;
  function stopWaveformMeter() {
    cancelAnimationFrame(waveRaf);
    if (currentSourceNode) { try { currentSourceNode.disconnect(); } catch (e) {} currentSourceNode = null; }
    return peakLevel;
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const store = e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('storyLang', ['storyId', 'langId'], { unique: false });
      };
      req.onsuccess = (e) => { db = e.target.result; resolve(db); };
      req.onerror = (e) => reject(e);
    });
  }

  async function saveDirectRecording({ storyId, storyTitle, langId, langLabel, label, blob, timings }) {
    const database = await openDB();
    const record = {
      id: 'rec_' + Date.now(),
      storyId, storyTitle, langId, langLabel,
      label: (label || '').trim() || '寶寶的朗讀',
      blob, timings: timings || {}, createdAt: Date.now()
    };
    await new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e);
    });
    return record;
  }

  async function confirmSavePending(customLabel) {
    if (!pendingDraft) return null;
    const database = await openDB();
    const record = {
      id: 'rec_' + Date.now(),
      storyId: pendingDraft.storyId, storyTitle: pendingDraft.storyTitle,
      langId: pendingDraft.langId, langLabel: pendingDraft.langLabel,
      label: (customLabel || '').trim() || '父母的聲音',
      blob: pendingDraft.blob, timings: pendingDraft.timings, createdAt: Date.now()
    };
    await new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e);
    });
    discardPending();
    return record;
  }

  function discardPending() {
    if (pendingDraft && pendingDraft.previewUrl) URL.revokeObjectURL(pendingDraft.previewUrl);
    pendingDraft = null;
  }

  async function getAllRecordings() {
    const database = await openDB();
    return new Promise((resolve) => {
      const req = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.createdAt - a.createdAt));
      req.onerror = () => resolve([]);
    });
  }

  async function getRecordingsForStory(storyId, langId) {
    const all = await getAllRecordings();
    return all.filter(r => r.storyId === storyId && r.langId === langId);
  }

  async function importRawRecord(record) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = (e) => reject(e);
    });
  }

  async function deleteRecording(id) {
    const database = await openDB();
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
    });
  }

  async function renameRecording(id, newLabel) {
    const database = await openDB();
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) { getReq.result.label = newLabel.trim() || getReq.result.label; store.put(getReq.result); }
      };
      tx.oncomplete = () => resolve();
    });
  }

  async function activateRecord(record) {
    if (activeParentData && activeParentData.url) URL.revokeObjectURL(activeParentData.url);
    activeParentData = null; parentAudioBuffer = null;
    if (!record || !record.blob) return null;
    const url = URL.createObjectURL(record.blob);
    activeParentData = { ...record, url };
    try {
      if (!parentAudioCtx) parentAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      parentAudioBuffer = await parentAudioCtx.decodeAudioData(await record.blob.arrayBuffer());
    } catch (e) {}
    return activeParentData;
  }

  function playParentSingleWord(idx, rate, onDone) {
    if (!activeParentData || !activeParentData.timings || !activeParentData.timings[idx]) return false;
    const [st, ed] = activeParentData.timings[idx];
    const dur = Math.max(0.15, ed - st);
    if (parentAudioBuffer && parentAudioCtx) {
      if (parentAudioCtx.state === 'suspended') parentAudioCtx.resume();
      if (activeSliceSource) { try { activeSliceSource.stop(); } catch (e) {} }
      const src = parentAudioCtx.createBufferSource();
      src.buffer = parentAudioBuffer; src.playbackRate.value = rate;
      src.connect(parentAudioCtx.destination);
      src.start(0, st, dur);
      setTimeout(() => { if (onDone) onDone(); }, (dur / rate) * 1000 + 80);
      return true;
    }
    return false;
  }

  async function startGuidedRecording({ storyId, storyTitle, langId, langLabel, tokens, speedRate, onHighlight, onPreviewReady, onCancel }) {
    if (isRecording) return;
    unlockAudioContext();
    const banner = document.getElementById('parent-rec-banner');
    const statusText = document.getElementById('rec-status-text');
    const btnRec = document.getElementById('btn-parent-rec');

    let stream;
    try {
      stream = await getCleanMicStream();
    } catch (e) {
      CustomUI.showToast('⚠️ 無法存取麥克風，請允許瀏覽器權限');
      if (onCancel) onCancel();
      return;
    }

    isRecording = true;
    btnRec.textContent = '⏹️ 停止錄音';
    btnRec.style.background = '#EF4444';
    btnRec.style.color = '#FFF';
    banner.style.display = 'block';
    startWaveformMeter(stream);

    statusText.textContent = '🎙️ 請準備，倒數結束後開始錄音...';
    const ready = await runVisualCountdown('🎙️ 陪讀錄音準備中，倒數結束後開始...', () => !isRecording);
    if (!ready) { stopWaveformMeter(); banner.style.display = 'none'; stream.getTracks().forEach(t => t.stop()); return; }
    statusText.textContent = '🔴 正在錄音中... 請跟著高亮字詞慢慢讀（下方紅條跳動代表收音正常）';

    // 使用瀏覽器原生最相容的預設編碼，並每 250ms 寫入一次音頻塊
    mediaRecorder = new MediaRecorder(stream);
    recChunks = [];
    const timings = {};

    mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const peak = stopWaveformMeter();
      stream.getTracks().forEach(t => t.stop());
      banner.style.display = 'none';
      btnRec.textContent = '🎙️ 父母錄音';
      btnRec.style.background = '#FFF1F2';
      btnRec.style.color = '#BE123C';

      if (peak < 3) {
        CustomUI.showToast('⚠️ 麥克風幾乎沒收到聲音，請檢查上方麥克風選項');
      }

      if (recChunks.length > 0 && Object.keys(timings).length > 0) {
        discardPending();
        const blob = new Blob(recChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        const previewUrl = URL.createObjectURL(blob);
        pendingDraft = { storyId, storyTitle, langId, langLabel, blob, timings, previewUrl };
        if (onPreviewReady) onPreviewReady(previewUrl);
      } else {
        if (onCancel) onCancel();
      }
    };

    let recStartTime = performance.now();
    mediaRecorder.onstart = () => { recStartTime = performance.now(); };
    mediaRecorder.start(250);
    const readableIndices = [];
    tokens.forEach((t, i) => { if (!t.isBreak && !t.isPunct) readableIndices.push(i); });

    let step = 0;
    function stepNextWord() {
      if (!isRecording) return;
      if (step >= readableIndices.length) {
        setTimeout(() => stopGuidedRecording(), 450);
        return;
      }
      const tokIdx = readableIndices[step];
      const tokText = tokens[tokIdx].text || '';
      const nowSec = (performance.now() - recStartTime) / 1000;
      const charCount = Math.max(1, tokText.trim().length);
      const baseMs = /^[A-Za-z0-9]/.test(tokText) ? 950 : (650 + charCount * 240);
      const stepMs = Math.round(baseMs / speedRate);

      timings[tokIdx] = [Math.max(0, Math.round((nowSec - 0.05) * 1000) / 1000), Math.round((nowSec + stepMs / 1000 + 0.05) * 1000) / 1000];
      if (onHighlight) onHighlight(tokIdx);
      step++;
      recTimer = setTimeout(stepNextWord, stepMs);
    }
    stepNextWord();
  }

  function stopGuidedRecording() {
    if (!isRecording) return;
    isRecording = false;
    clearTimeout(recTimer);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  }

  return {
    isRecording: () => isRecording,
    unlockAudioContext, runVisualCountdown, getCleanMicStream, startWaveformMeter, stopWaveformMeter,
    saveDirectRecording, confirmSavePending, discardPending, getAllRecordings, getRecordingsForStory,
    importRawRecord, deleteRecording, renameRecording, activateRecord,
    getActiveData: () => activeParentData,
    playParentSingleWord, startGuidedRecording, stopGuidedRecording
  };
})();
