const CustomUI = (() => {
  let toastTimer = null;

  function showToast(msg, duration = 2600) {
    const el = document.getElementById('custom-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  function showConfirm({ title = '確認操作', desc = '', okText = '確定', cancelText = '取消', isDanger = false }) {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-dialog');
      const dlgTitle = document.getElementById('dlg-title');
      const dlgDesc = document.getElementById('dlg-desc');
      const dlgExtra = document.getElementById('dlg-extra');
      const dlgInput = document.getElementById('dlg-input');
      const btnOk = document.getElementById('dlg-btn-ok');
      const btnCancel = document.getElementById('dlg-btn-cancel');
      const btnDel = document.getElementById('dlg-btn-delete');

      dlgTitle.textContent = title;
      dlgDesc.textContent = desc;
      dlgExtra.innerHTML = '';
      dlgInput.classList.add('hidden');
      btnDel.classList.add('hidden');
      btnCancel.classList.remove('hidden');
      btnOk.textContent = okText;
      btnCancel.textContent = cancelText;
      btnOk.style.background = isDanger ? '#EF4444' : '';

      modal.classList.remove('hidden');

      const cleanup = (val) => {
        modal.classList.add('hidden');
        btnOk.style.background = '';
        btnOk.onclick = null;
        btnCancel.onclick = null;
        resolve(val);
      };

      btnOk.onclick = () => cleanup(true);
      btnCancel.onclick = () => cleanup(false);
    });
  }

  function showPrompt({ title = '請輸入', desc = '', defaultValue = '', placeholder = '', okText = '確定', suggestions = [] }) {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-dialog');
      const dlgTitle = document.getElementById('dlg-title');
      const dlgDesc = document.getElementById('dlg-desc');
      const dlgExtra = document.getElementById('dlg-extra');
      const dlgInput = document.getElementById('dlg-input');
      const btnOk = document.getElementById('dlg-btn-ok');
      const btnCancel = document.getElementById('dlg-btn-cancel');
      const btnDel = document.getElementById('dlg-btn-delete');

      dlgTitle.textContent = title;
      dlgDesc.textContent = desc;
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        dlgExtra.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:12px;">` +
          suggestions.map(s => `<button type="button" class="btn-mini quick-sug-btn" style="background:#FEF3C7;color:#92400E;border:1px solid #F59E0B;">${s}</button>`).join('') +
          `</div>`;
        dlgExtra.querySelectorAll('.quick-sug-btn').forEach(btn => {
          btn.onclick = () => { dlgInput.value = btn.textContent; };
        });
      } else {
        dlgExtra.innerHTML = '';
      }
      dlgInput.classList.remove('hidden');
      dlgInput.value = defaultValue;
      dlgInput.placeholder = placeholder;
      btnDel.classList.add('hidden');
      btnCancel.classList.remove('hidden');
      btnOk.textContent = okText;
      btnCancel.textContent = '取消';

      modal.classList.remove('hidden');
      setTimeout(() => dlgInput.focus(), 50);

      const cleanup = (val) => {
        modal.classList.add('hidden');
        btnOk.onclick = null;
        btnCancel.onclick = null;
        resolve(val);
      };

      btnOk.onclick = () => cleanup(dlgInput.value);
      btnCancel.onclick = () => cleanup(null);
    });
  }

  // 專屬：新增或編輯家庭成員的自定義圖形化彈窗（選頭像 + 選輔導者/小朋友角色 + 改名/刪除）
  function showMemberEditor({ isEdit = false, member = null, canDelete = false }) {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-dialog');
      const dlgTitle = document.getElementById('dlg-title');
      const dlgDesc = document.getElementById('dlg-desc');
      const dlgExtra = document.getElementById('dlg-extra');
      const dlgInput = document.getElementById('dlg-input');
      const btnOk = document.getElementById('dlg-btn-ok');
      const btnCancel = document.getElementById('dlg-btn-cancel');
      const btnDel = document.getElementById('dlg-btn-delete');

      let selectedAvatar = member ? member.avatar : '👦';
      let selectedTutor = member ? member.canTutor : true;

      dlgTitle.textContent = isEdit ? '✏️ 編輯家庭成員' : '➕ 新增家庭成員';
      dlgDesc.textContent = '選擇代表頭像與角色身份：';
      dlgInput.classList.remove('hidden');
      dlgInput.value = member ? member.name : '';
      dlgInput.placeholder = '輸入名稱（例如：大哥哥、二寶、婆婆）';

      const avatars = ['👨', '👩', '👦', '👧', '👶', '🧒', '👴', '👵', '🧑‍🏫', '🐣'];
      dlgExtra.innerHTML = `
        <div class="avatar-picker">
          ${avatars.map(av => `<button type="button" class="avatar-opt ${av === selectedAvatar ? 'selected' : ''}" data-av="${av}">${av}</button>`).join('')}
        </div>
        <div class="role-toggle-group">
          <button type="button" id="role-opt-tutor" class="role-opt-btn ${selectedTutor ? 'selected' : ''}">🎙️ 陪讀輔導者<br><span style="font-size:12px;font-weight:normal;">(父母/兄姊，可錄示範)</span></button>
          <button type="button" id="role-opt-kid" class="role-opt-btn ${!selectedTutor ? 'selected' : ''}">📖 學習小朋友<br><span style="font-size:12px;font-weight:normal;">(聽故事與跟讀練習)</span></button>
        </div>
      `;

      dlgExtra.querySelectorAll('.avatar-opt').forEach(btn => {
        btn.onclick = () => {
          selectedAvatar = btn.dataset.av;
          dlgExtra.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        };
      });

      const btnTutor = dlgExtra.querySelector('#role-opt-tutor');
      const btnKid = dlgExtra.querySelector('#role-opt-kid');
      btnTutor.onclick = () => { selectedTutor = true; btnTutor.classList.add('selected'); btnKid.classList.remove('selected'); };
      btnKid.onclick = () => { selectedTutor = false; btnKid.classList.add('selected'); btnTutor.classList.remove('selected'); };

      if (isEdit && canDelete) {
        btnDel.classList.remove('hidden');
      } else {
        btnDel.classList.add('hidden');
      }

      btnOk.textContent = '✅ 保存';
      btnCancel.textContent = '取消';
      modal.classList.remove('hidden');
      setTimeout(() => dlgInput.focus(), 50);

      const cleanup = (res) => {
        modal.classList.add('hidden');
        dlgExtra.innerHTML = '';
        btnDel.classList.add('hidden');
        btnOk.onclick = null;
        btnCancel.onclick = null;
        btnDel.onclick = null;
        resolve(res);
      };

      btnOk.onclick = () => {
        const name = dlgInput.value.trim();
        if (!name) { showToast('⚠️ 請輸入成員名稱喔！'); return; }
        cleanup({ action: 'save', name, avatar: selectedAvatar, canTutor: selectedTutor });
      };
      btnDel.onclick = () => cleanup({ action: 'delete' });
      btnCancel.onclick = () => cleanup(null);
    });
  }

  return { showToast, showConfirm, showPrompt, showMemberEditor };
})();
