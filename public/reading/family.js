const FamilyManager = (() => {
  const STORAGE_KEY = 'reading_family_members_v1';
  const ACTIVE_KEY = 'reading_active_member_id';

  const DEFAULT_MEMBERS = [
    { id: 'm_dad', name: '爸爸', avatar: '👨', canTutor: true, level: 0, voiceIdx: 0, scriptIdx: 0, isDefault: true },
    { id: 'm_mom', name: '媽媽', avatar: '👩', canTutor: true, level: 0, voiceIdx: 0, scriptIdx: 0, isDefault: true }
  ];

  const DEFAULT_NAME_MAP = {
    '爸爸': { hk: '爸爸', tw: '爸爸', cn: '爸爸', en: 'Dad' },
    '媽媽': { hk: '媽媽', tw: '媽媽', cn: '妈妈', en: 'Mom' },
    '妈妈': { hk: '媽媽', tw: '媽媽', cn: '妈妈', en: 'Mom' },
    'Dad':  { hk: '爸爸', tw: '爸爸', cn: '爸爸', en: 'Dad' },
    'Mom':  { hk: '媽媽', tw: '媽媽', cn: '妈妈', en: 'Mom' },
    '哥哥': { hk: '哥哥', tw: '哥哥', cn: '哥哥', en: 'Brother' },
    'Brother': { hk: '哥哥', tw: '哥哥', cn: '哥哥', en: 'Brother' },
    '姊姊': { hk: '姊姊', tw: '姊姊', cn: '姐姐', en: 'Sister' },
    '姐姐': { hk: '姊姊', tw: '姊姊', cn: '姐姐', en: 'Sister' },
    'Sister': { hk: '姊姊', tw: '姊姊', cn: '姐姐', en: 'Sister' },
    '弟弟': { hk: '弟弟', tw: '弟弟', cn: '弟弟', en: 'Little Bro' },
    '妹妹': { hk: '妹妹', tw: '妹妹', cn: '妹妹', en: 'Little Sis' },
    '寶寶': { hk: '寶寶', tw: '寶寶', cn: '宝宝', en: 'Baby' },
    '宝宝': { hk: '寶寶', tw: '寶寶', cn: '宝宝', en: 'Baby' },
    'Baby': { hk: '寶寶', tw: '寶寶', cn: '宝宝', en: 'Baby' }
  };

  function getDisplayName(member, langKey) {
    if (!member || !member.name) return '';
    const entry = DEFAULT_NAME_MAP[member.name.trim()];
    if (!entry) return member.name;
    const key = langKey || (typeof VOICE_PREFS !== 'undefined' && typeof voiceIdx !== 'undefined' && VOICE_PREFS.at(voiceIdx)?.id === 'en'
      ? 'en'
      : (typeof SCRIPT_PREFS !== 'undefined' && typeof scriptIdx !== 'undefined' ? SCRIPT_PREFS.at(scriptIdx)?.id : 'hk'));
    return entry[key] || member.name;
  }

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

  return { getDisplayName, 
    getMembers,
    getActiveMember,
    setActiveMember,
    updateActiveMemberPrefs,
    addCustomMember,
    editCurrentMember
  };
})();
