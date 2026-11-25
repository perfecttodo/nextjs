const ParentVoice = (() => {
  const DB_NAME = 'KidsReadingParentDB_V2';
  const STORE_NAME = 'recordings';
  let db = null, isRecording = false, recTimer = null, mediaRecorder = null, recChunks = [];
  let pendingDraft = null, activeParentData = null, parentAudioBuffer = null, parentAudioCtx = null, activeSliceSource = null;
  let waveRaf = null, meterCtx = null, peakLevel = 0;

  // 共用即時聲波繪製器（同時給「父母錄音」與「自己讀」使用）
  function startWaveformMeter(stream) {
    peakLevel = 0;
    const canvas = document.getElementById('mic-waveform');
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    meterCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = meterCtx.createMediaStreamSource(stream);
    const analyser = meterCtx.createAnalyser();
    analyser.fftSize = 128;
    src.connect(analyser);
    const dataArr = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      if (!meterCtx) return;
      analyser.getByteFrequencyData(dataArr);
      let maxVal = 0;
      for (let i = 0; i < dataArr.length; i++) if (dataArr[i] > maxVal) maxVal = dataArr[i];
      if (maxVal > peakLevel) peakLevel = maxVal;

      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      const barW = 6, gap = 4, bars = Math.floor(canvas.width / (barW + gap));
      for (let i = 0; i < bars; i++) {
        const val = dataArr[i % dataArr.length] || 0;
        const h = Math.max(4, (val / 255) * (canvas.height - 8));
        ctx2d.fillStyle = val > 25 ? '#F43F5E' : '#CBD5E1';
        ctx2d.fillRect(i * (barW + gap) + 4, (canvas.height - h) / 2, barW, h);
      }
      waveRaf = requestAnimationFrame(draw);
    }
    draw();
  }

  function stopWaveformMeter() {
    cancelAnimationFrame(waveRaf);
    if (meterCtx) { meterCtx.close().catch(() => {}); meterCtx = null; }
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
    const banner = document.getElementById('parent-rec-banner');
    const statusText = document.getElementById('rec-status-text');
    const btnRec = document.getElementById('btn-parent-rec');

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      alert('無法存取麥克風！請檢查瀏覽器麥克風權限。');
      if (onCancel) onCancel();
      return;
    }

    isRecording = true;
    btnRec.textContent = '⏹️ 停止錄音';
    btnRec.style.background = '#EF4444';
    btnRec.style.color = '#FFF';
    banner.style.display = 'block';
    startWaveformMeter(stream);

    for (let c = 3; c >= 1; c--) {
      if (!isRecording) { stopWaveformMeter(); stream.getTracks().forEach(t => t.stop()); return; }
      statusText.textContent = `🎙️ 對著話筒說話測試波形，${c} 秒後開始錄音...`;
      await new Promise(r => setTimeout(r, 900));
    }

    if (!isRecording) { stopWaveformMeter(); stream.getTracks().forEach(t => t.stop()); return; }
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

      if (peak < 15) {
        alert('⚠️ 警告：麥克風幾乎沒有收到聲音（聲波無跳動）！\n請檢查電腦/iPad 的「系統設定 -> 聲音 -> 輸入」是否選對麥克風或被靜音。');
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

    mediaRecorder.start(250);
    const recStartTime = performance.now();
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
    startWaveformMeter, stopWaveformMeter,
    confirmSavePending, discardPending, getAllRecordings, getRecordingsForStory,
    deleteRecording, renameRecording, activateRecord,
    getActiveData: () => activeParentData,
    playParentSingleWord, startGuidedRecording, stopGuidedRecording
  };
})();
