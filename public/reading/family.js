const FamilyManager = (() => {
  const STORAGE_KEY = 'reading_family_members_v1';
  const ACTIVE_KEY = 'reading_active_member_id';

  const DEFAULT_MEMBERS = [
    { id: 'm_dad', name: '爸爸', avatar: '👨', canTutor: true, level: 0, voiceIdx: 0, scriptIdx: 0, isDefault: true },
    { id: 'm_mom', name: '媽媽', avatar: '👩', canTutor: true, level: 0, voiceIdx: 0, scriptIdx: 0, isDefault: true }
  ];

  function getMembers() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch (e) {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEMBERS));
    return DEFAULT_MEMBERS;
  }

  function saveMembers(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function getActiveMember() {
    const list = getMembers();
    const activeId = localStorage.getItem(ACTIVE_KEY);
    return list.find(m => m.id === activeId) || list.at(0);
  }

  function setActiveMember(id) {
    localStorage.setItem(ACTIVE_KEY, id);
    return getActiveMember();
  }

  function updateActiveMemberPrefs(patch) {
    const list = getMembers();
    const cur = getActiveMember();
    const idx = list.findIndex(m => m.id === cur.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...patch };
      saveMembers(list);
    }
  }

  async function addCustomMember() {
    const res = await CustomUI.showMemberEditor({ isEdit: false });
    if (!res || res.action !== 'save') return null;
    const list = getMembers();
    const newMember = {
      id: 'm_' + Date.now(),
      name: res.name,
      avatar: res.avatar,
      canTutor: res.canTutor,
      level: res.canTutor ? 0 : 1,
      voiceIdx: 0,
      scriptIdx: 0,
      isDefault: false
    };
    list.push(newMember);
    saveMembers(list);
    setActiveMember(newMember.id);
    CustomUI.showToast(`🎉 已新增成員：${newMember.avatar} ${newMember.name}`);
    return newMember;
  }

  async function editCurrentMember() {
    const list = getMembers();
    const cur = getActiveMember();
    const idx = list.findIndex(m => m.id === cur.id);
    if (idx === -1) return null;

    const res = await CustomUI.showMemberEditor({ isEdit: true, member: cur, canDelete: list.length > 1 });
    if (!res) return null;

    if (res.action === 'delete') {
      list.splice(idx, 1);
      saveMembers(list);
      CustomUI.showToast(`🗑️ 已刪除成員：${cur.name}`);
      return setActiveMember(list.at(0).id);
    }

    if (res.action === 'save') {
      list[idx] = { ...list[idx], name: res.name, avatar: res.avatar, canTutor: res.canTutor };
      saveMembers(list);
      CustomUI.showToast(`✅ 已更新：${res.avatar} ${res.name}`);
      return list[idx];
    }
    return null;
  }

  return {
    getMembers,
    getActiveMember,
    setActiveMember,
    updateActiveMemberPrefs,
    addCustomMember,
    editCurrentMember
  };
})();
