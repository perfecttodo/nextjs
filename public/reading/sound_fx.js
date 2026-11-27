const SoundFX = (() => {
  let ctx = null;
  let enabled = localStorage.getItem('reading_soundFx') !== 'false';

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function pluck(freq, duration = 0.28, gainVal = 0.16, delay = 0, slideTo = 0) {
    if (!enabled) return;
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime + delay;

    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1650, now);
    filter.Q.setValueAtTime(2.2, now);

    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(gainVal, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const delayNode = ac.createDelay();
    delayNode.delayTime.setValueAtTime(0.09, now);
    const fbGain = ac.createGain();
    fbGain.gain.setValueAtTime(0.22, now);

    const osc1 = ac.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    if (slideTo) osc1.frequency.exponentialRampToValueAtTime(slideTo, now + duration * 0.75);

    const osc2 = ac.createOscillator();
    const harmGain = ac.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);
    harmGain.gain.setValueAtTime(0.18, now);

    osc1.connect(filter);
    osc2.connect(harmGain);
    harmGain.connect(filter);
    filter.connect(env);

    env.connect(ac.destination);
    env.connect(delayNode);
    delayNode.connect(fbGain);
    fbGain.connect(delayNode);
    fbGain.connect(ac.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  function play(kind = 'pop', force = false) {
    if (!enabled) return;
    if (!force) {
      if (typeof ParentVoice !== 'undefined' && ParentVoice.isRecording && ParentVoice.isRecording()) return;
      if (typeof isReadingAlong !== 'undefined' && isReadingAlong) return;
    }

    if (kind === 'open_story') {
      pluck(523.25, 0.32, 0.14, 0);
      pluck(783.99, 0.35, 0.14, 0.055);
      pluck(1318.51, 0.45, 0.12, 0.11);
    } else if (kind === 'rec_start') {
      // 準備錄音雙音提示（在 3 秒倒計時開始前響起，不進錄音）
      pluck(587.33, 0.18, 0.14, 0);
      pluck(880.00, 0.25, 0.15, 0.07);
    } else if (kind === 'pop') {
      pluck(698.46, 0.22, 0.15, 0, 740);
    } else if (kind === 'back') {
      pluck(783.99, 0.18, 0.12, 0);
      pluck(523.25, 0.24, 0.12, 0.06);
    } else if (kind === 'success') {
      pluck(523.25, 0.24, 0.14, 0);
      pluck(659.25, 0.24, 0.14, 0.065);
      pluck(783.99, 0.34, 0.15, 0.13);
    } else if (kind === 'celebrate') {
      [523.25, 659.25, 783.99, 987.77, 1046.50].forEach((f, i) => {
        pluck(f, i === 4 ? 0.55 : 0.28, 0.15, i * 0.085);
      });
    }
  }

  // 全域事件委派：覆蓋 100% 所有按鈕、卡片、選項與下載連結（僅排除故事單字 .token）
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.token')) return;
    const target = e.target.closest('.story-card, button, a.btn-pill, a.btn-mini, .member-chip, .level-tab, .avatar-opt, .role-opt-btn');
    if (!target || target.disabled) return;
    if (target.id === 'btn-sound-fx') return;

    // 1. 「自己讀 / 完成朗讀」與「陪讀錄音 / 停止錄音」
    if (target.id === 'btn-read-along' || target.id === 'btn-parent-rec' || target.id === 'btn-stop-rec-inline') {
      const isStopping = target.classList.contains('recording') || target.id === 'btn-stop-rec-inline';
      if (isStopping) {
        // 延遲 90ms 等麥克風徹底停止後再播放完成音效，絕不污染錄音
        setTimeout(() => play('success', true), 90);
      } else {
        play('rec_start', true);
      }
      return;
    }

    // 2. 「聽故事 / 暫停」按鈕
    if (target.id === 'btn-play-tts') {
      play('pop', true);
      return;
    }

    // 3. 所有返回與關閉按鈕（包含試聽框關閉、設定完成、管理庫關閉、彈窗取消）
    if (target.id === 'btn-back' || target.id.includes('close') || target.id.includes('cancel') || target.id.includes('discard') || target.classList.contains('btn-close-circle') || target.classList.contains('btn-manager-bottom-close')) {
      play('back', true);
      return;
    }

    // 4. 保存、確認與下載按鈕
    if (target.id.includes('save') || target.id.includes('confirm') || target.id === 'btn-download' || target.hasAttribute('download')) {
      play('success', true);
      return;
    }

    // 5. 進入故事卡片
    if (target.classList.contains('story-card')) {
      play('open_story', true);
      return;
    }

    // 6. 其餘所有切換開關、成員頭像、篩選標籤
    play('pop', true);
  }, { passive: true });

  return {
    play,
    isEnabled: () => enabled,
    toggle: () => {
      enabled = !enabled;
      localStorage.setItem('reading_soundFx', enabled);
      if (enabled) play('success', true);
      return enabled;
    }
  };
})();
