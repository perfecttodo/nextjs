/* =========================================================
   app.js — 的士助手主業務邏輯
   （從原 index.html 的 <script> 內容原樣提取）
   ========================================================= */

const ICONS = {
  'car-taxi-front':'<path d="M5 17h14M3.5 13.5l1.4-4.2A2.2 2.2 0 0 1 7 7.8h10a2.2 2.2 0 0 1 2.1 1.5l1.4 4.2v3.5h-2M3.5 17v-3.5H21"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>',
  'receipt':'<path d="M5 3h14v18l-2.3-1.6L14.4 21l-2.4-1.6L9.6 21 7.3 19.4 5 21V3z"/><path d="M9 8h6M9 12h6"/>',
  'flag':'<path d="M5 21V4M5 5h11l-2 4 2 4H5"/>',
  'smartphone':'<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
  'layers':'<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  'coins':'<circle cx="9" cy="9" r="6"/><path d="M15.6 4.4A6 6 0 0 1 15 16M7 19h10"/>',
  'alert-triangle':'<path d="m10.3 3.6-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.4l-8-14a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.3 2.3 4.7-5"/>',
  'search':'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  'settings':'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  'wallet':'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16.5 14.5h1"/>',
  'credit-card':'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  'bar-chart-3':'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  'trending-up':'<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  'database':'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  'calendar-x':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M10 14l4 4M14 14l-4 4"/>',
  'calendar-minus':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15h6"/>',
  'calendar-clock':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v3l2 1.5"/>',
  'trash-2':'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
  'history':'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4M12 8v5l3.5 2"/>',
  'info':'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  'plus-circle':'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  'list-bullet':'<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  'pie-chart':'<path d="M12 3a9 9 0 1 0 9 9h-9V3z"/>',
  'x':'<path d="M6 6l12 12M18 6 6 18"/>',
  'file-question':'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5M10 13a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.3v.5M12 18h.01"/>',
  'eye':'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  'edit-3':'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  'droplet':'<path d="M12 2.7s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11z"/>',
  'plus':'<path d="M12 5v14M5 12h14"/>',
  'road':'<path d="M4 21 6 3M20 21 18 3M12 3v3M12 12v3M12 21v-2"/>',
  'map-pin':'<path d="M12 21s-7-6-7-11a7 7 0 1 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  'chevron-right':'<path d="m9 6 6 6-6 6"/>',
  'clock':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'play':'<path d="M6 3 20 12 6 21V3z"/>',
  'square':'<rect x="5" y="5" width="14" height="14" rx="2"/>',
  'edit-2':'<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  'arrow-left':'<path d="M19 12H5M12 19l-7-7 7-7"/>',
  'navigation':'<polygon points="3 11 22 2 13 21 11 13 3 11" fill="none"/>',
  'utensils':'<path d="M4 2v7c0 1.1.9 2 2 2h3V2M7 11v11M17 2c-1.5 0-3 2.2-3 5s1.5 5 3 5v9"/>',
  'toilet':'<circle cx="9" cy="5.5" r="1.8"/><path d="M6.5 9h5v4.5a2.5 2.5 0 0 1-5 0V9z"/><path d="M9 16v5"/><circle cx="16" cy="5.5" r="1.8"/><path d="M14 9h4l-0.5 4h-3L14 9z"/><path d="M16 13v8"/>',
  'star':'<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  'fuel':'<path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M3 10h12"/><path d="M13 6h2l3 3v10a2 2 0 0 1-4 0v-4h-1"/><path d="M6 14h6"/>',
  'crosshair':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  'loader':'<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  'link':'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  'clipboard':'<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  'external-link':'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/>',
  'plane-takeoff':'<path d="M2 22h20M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l1-.5c.3-.2.7-.2 1 0l5.5 3.5 3-3c.5-.5 1.3-.7 2-.5l2.1.7c.6.2 1 .8 1 1.4v.1c0 .4-.2.8-.5 1L16 14l-2 .5c-.3.1-.7.1-1 0l-3.7-1.8-2.1 2.1c-.2.2-.5.3-.8.3l-.1.1c-.3 0-.5-.1-.7-.2l-.6-.4a1.5 1.5 0 0 0-1.7-.1z"/>',
  'plane-landing':'<path d="M2 22h20M3.77 10.35l-.6-.6a2 2 0 0 1 0-2.83l.7-.7 4.7 1.2 2.8-2.8a2 2 0 0 1 2.4-.35l1.6.8-3.3 3.3 4.7 1.2 3.2-1.6a2 2 0 0 1 2.4.35l1.4 1.4-4.2 4.2-4 1c-1.1.27-2.2-.07-3-.9l-4.3-4.3-4.5 1.15c-.3.08-.6-.05-.75-.3l-.35-.6a.75.75 0 0 1 .25-1l3.4-1.7z"/>',
  'home':'<path d="M3 12 12 3l9 9v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z"/>',
  'rotate-cw':'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'
};

function ico(name, cls){
  cls = cls || 'w-4 h-4';
  return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
       + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
       + (ICONS[name] || '') + '</svg>';
}

function hydrateIcons(root){
  (root || document).querySelectorAll('[data-icon]').forEach(function(el){
    if (el.dataset.done) return;
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
                 + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
                 + 'style="width:100%;height:100%">' + (ICONS[el.dataset.icon] || '') + '</svg>';
    el.dataset.done = '1';
  });
}

var TRIP_TYPE_CONFIG = [
  { name:'街客',       icon:'flag',       color:'emerald',  hot:true  },
  { name:'Uber',       icon:'smartphone', color:'blue',     hot:true  },
  { name:'HKTaxi',     icon:'smartphone', color:'cyan',     hot:true  },
  { name:'飛的',       icon:'smartphone', color:'orange',   hot:false },
  { name:'滴滴',       icon:'smartphone', color:'amber',    hot:false },
  { name:'其他',       icon:'layers',     color:'purple',   hot:false },
  { name:'高德打車',   icon:'smartphone', color:'rose',     hot:false },
  { name:'星群',       icon:'smartphone', color:'cyan',     hot:false },
  { name:'BigBoss',    icon:'smartphone', color:'blue',     hot:false }
];

var TRIP_TYPE_THEME = {
  emerald: { card:'bg-emerald-50 border-emerald-200', text:'text-emerald-700' },
  blue:    { card:'bg-blue-50 border-blue-200',       text:'text-blue-700' },
  cyan:    { card:'bg-cyan-50 border-cyan-200',       text:'text-cyan-700' },
  orange:  { card:'bg-orange-50 border-orange-200',   text:'text-orange-700' },
  amber:   { card:'bg-amber-50 border-amber-200',     text:'text-amber-700' },
  purple:  { card:'bg-purple-50 border-purple-200',   text:'text-purple-700' },
  rose:    { card:'bg-rose-50 border-rose-200',       text:'text-rose-700' },
  indigo:  { card:'bg-indigo-50 border-indigo-200',   text:'text-indigo-700' },
  slate:   { card:'bg-slate-50 border-slate-200',     text:'text-slate-700' }
};

function getAllTripTypes(){ return TRIP_TYPE_CONFIG.map(function(t){ return t.name; }); }
function getTripTypeConfig(type){
  var cfg = TRIP_TYPE_CONFIG.find(function(t){ return t.name === type; });
  if (cfg) return cfg;
  return { name: type, icon:'layers', color:'purple', hot:false };
}

var PAYMENT_METHOD_CONFIG = [
  { name:'現金',   icon:'coins',       color:'emerald', hot:true },
  { name:'八達通', icon:'credit-card', color:'blue',    hot:true },
  { name:'其他',   icon:'wallet',      color:'purple',  hot:true }
];

function getAllPaymentMethods(){ return PAYMENT_METHOD_CONFIG.map(function(p){ return p.name; }); }
function getPaymentMethodConfig(name){
  var cfg = PAYMENT_METHOD_CONFIG.find(function(p){ return p.name === name; });
  if (cfg) return cfg;
  return { name: name, icon:'wallet', color:'slate' };
}

var trips         = JSON.parse(localStorage.getItem('taxi_trips')) || [];
var shiftSettings = JSON.parse(localStorage.getItem('taxi_shift_settings')) || {};
var places        = JSON.parse(localStorage.getItem('taxi_places')) || [];
var DEFAULT_SHIFT = {
  startedAt: null, endedAt: null, startTime: '', endTime: '',
  rental: 0, fuelEntries: [], mileage: { start: null, end: null },
  note: ''
};

/* ========== 修改：保留 REGIONS / DISTRICT_KEYWORDS 以兼容舊資料（不再用於 UI） ========== */
var REGIONS = {
  '港島': ['中西區', '灣仔區', '東區', '南區'],
  '九龍': ['油尖旺區', '深水埗區', '九龍城區', '黃大仙區', '觀塘區'],
  '新界': ['元朗區', '屯門區', '沙田區', '大埔區', '北區', '西貢區', '葵青區', '荃灣區', '離島區']
};

var PLACE_TYPE_CONFIG = {
  '餐廳':   { icon: 'utensils',       cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  '的士站': { icon: 'car-taxi-front', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  '廁所':   { icon: 'toilet',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  '氣站':   { icon: 'fuel',           cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  '重要':   { icon: 'star',           cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  '其他':   { icon: 'map-pin',        cls: 'bg-purple-50 text-purple-700 border-purple-200' }
};
var PLACE_TYPES = Object.keys(PLACE_TYPE_CONFIG);
var PLACE_TYPE_FALLBACK = { icon: 'map-pin', cls: 'bg-purple-50 text-purple-700 border-purple-200' };

var PLACE_TYPE_HOT_LIMIT = 5;
var placeTypeExpanded = localStorage.getItem('taxi_place_type_expanded') === '1';

function getPlaceTypeStyle(type){ return PLACE_TYPE_CONFIG[type] || PLACE_TYPE_FALLBACK; }

/* 保留：用於舊資料兼容 / 反向地理編碼內部參考 */
var DISTRICT_KEYWORDS = {
  '中西區': ['central and western', 'central & western', '中西區', '中環', '上環', '西環', '西營盤', '半山', '山頂', '金鐘', '石塘咀', '堅尼地城'],
  '灣仔區': ['wan chai', '灣仔', '銅鑼灣', '跑馬地', '大坑', '掃桿埔', '天后'],
  '東區': ['eastern district', 'eastern', '東區', '北角', '鰂魚涌', '太古', '西灣河', '筲箕灣', '柴灣', '小西灣'],
  '南區': ['southern district', 'southern', '南區', '香港仔', '鴨脷洲', '薄扶林', '赤柱', '淺水灣', '石澳', '黃竹坑', '田灣'],
  '油尖旺區': ['yau tsim mong', '油尖旺', '尖沙咀', '油麻地', '旺角', '大角咀', '佐敦', '太子'],
  '深水埗區': ['sham shui po', '深水埗', '長沙灣', '荔枝角', '石硤尾', '美孚', '南昌'],
  '九龍城區': ['kowloon city', '九龍城', '土瓜灣', '紅磡', '何文田', '啟德', '九龍塘'],
  '黃大仙區': ['wong tai sin', '黃大仙', '慈雲山', '鑽石山', '樂富', '新蒲崗', '彩虹'],
  '觀塘區': ['kwun tong', '觀塘', '牛頭角', '九龍灣', '藍田', '油塘', '順利'],
  '元朗區': ['yuen long', '元朗', '天水圍', '錦田', '八鄉', '流浮山', '廈村'],
  '屯門區': ['tuen mun', '屯門', '蝴蝶灣', '掃管笏', '大興'],
  '沙田區': ['sha tin', '沙田', '大圍', '馬鞍山', '火炭', '沙田圍', '石門'],
  '大埔區': ['tai po', '大埔', '太和', '汀角', '大尾篤'],
  '北區': ['north district', 'north', '北區', '粉嶺', '上水', '沙頭角', '打鼓嶺'],
  '西貢區': ['sai kung', '西貢', '將軍澳', '坑口', '調景嶺', '寶琳'],
  '葵青區': ['kwai tsing', '葵青', '葵涌', '青衣', '荔景'],
  '荃灣區': ['tsuen wan', '荃灣', '深井', '汀九', '馬灣'],
  '離島區': ['islands district', 'islands', '離島', '東涌', '長洲', '大嶼山', '南丫島', '坪洲']
};

function getRegionByDistrict(district){
  if (!district) return null;
  if (['中西區','灣仔區','東區','南區'].indexOf(district) !== -1) return '港島';
  if (['油尖旺區','深水埗區','九龍城區','黃大仙區','觀塘區'].indexOf(district) !== -1) return '九龍';
  if (['元朗區','屯門區','沙田區','大埔區','北區','西貢區','葵青區','荃灣區','離島區'].indexOf(district) !== -1) return '新界';
  return null;
}

var placeFilterRegion   = '';
var placeFilterDistrict = '';
var placeFilterType     = '';
var placeNearbyMode     = false;
var userLat = null;
var userLng = null;
var currentEditingPlaceId = null;
var _pendingPlaceAddr = null;   // 依座標解析出的暫存地址（預覽用）

var activeTripType   = localStorage.getItem('taxi_last_type') || '街客';
var tripTypeExpanded = false;
var activePaymentMethod = localStorage.getItem('taxi_last_payment') || '現金';
var advancedSettingsOpen = localStorage.getItem('taxi_advanced_open') === '1';

var statsPeriod      = 'day';
var currentEditingId = null;
var lastDeletedTrips = null;
var lastDeletedShiftSettings = null;
var fareSign         = 1;
var noteTagsOpen     = false;
var manualShiftKey   = null;
var manualTripTime   = null;
var shiftTimeMode    = 'quick';

var cachedLocation    = null;
var locationTrackTimer = null;

var NOTE_TAGS = {
  income:  ['過海', '機場', '隧道口', '加一', '行李', '預約', '長途'],
  expense: ['隧道費', '入氣', '入油', '租車費', '維修', '賠償', '罰款', '泊車','吃飯']
};

var currentTab = 'trip';

var CARD_STATES_KEY = 'taxi_card_states';
var ALL_CARD_IDS = ['card-settings','card-chart','card-combined','card-data'];

function getCardStates(){
  try { return JSON.parse(localStorage.getItem(CARD_STATES_KEY)) || {}; }
  catch(e){ return {}; }
}
function saveCardStates(states){ localStorage.setItem(CARD_STATES_KEY, JSON.stringify(states)); }
function applyCardState(id, collapsed){
  var body = document.querySelector('[data-card-body="' + id + '"]');
  var chev = document.querySelector('[data-card-chevron="' + id + '"]');
  if (body){ if (collapsed) body.classList.add('hidden'); else body.classList.remove('hidden'); }
  if (chev){ if (collapsed) chev.classList.add('collapsed'); else chev.classList.remove('collapsed'); }
}
function toggleCard(id){
  var states = getCardStates();
  states[id] = !states[id];
  saveCardStates(states);
  applyCardState(id, states[id]);
  if (id === 'card-chart' && !states[id]) renderTrendChart();
}
function applyAllCardStates(){
  var states = getCardStates();
  ALL_CARD_IDS.forEach(function(id){ applyCardState(id, !!states[id]); });
}

function pad2(n){ return String(n).padStart(2, '0'); }
function localDateStr(d){ return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

function toLocalISOString(d){
  var tzOffset = -d.getTimezoneOffset();
  var sign     = tzOffset >= 0 ? '+' : '-';
  var abs      = Math.abs(tzOffset);
  var tzHH     = pad2(Math.floor(abs / 60));
  var tzMM     = pad2(abs % 60);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
         'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()) +
         '.' + String(d.getMilliseconds()).padStart(3, '0') + sign + tzHH + ':' + tzMM;
}

function calcShiftDate(timestamp, cfg){
  var activeKey = getActiveShiftKey();
  if (activeKey) return activeKey;
  return localDateStr(new Date(timestamp));
}

function getActiveShiftKey(){
  var keys = Object.keys(shiftSettings).sort().reverse();
  for (var i = 0; i < keys.length; i++){
    var k = keys[i];
    var c = shiftSettings[k];
    if (c && c.startedAt && !c.endedAt) return k;
  }
  return null;
}

function getLastShiftKey(){
  var keysWithStart = Object.keys(shiftSettings).filter(function(k){
    var c = shiftSettings[k];
    return c && c.startedAt;
  }).sort().reverse();
  if (keysWithStart.length) return keysWithStart[0];

  var latestTrip = null;
  trips.forEach(function(t){
    if (t.shiftDate && (!latestTrip || t.shiftDate > latestTrip)) latestTrip = t.shiftDate;
  });
  if (latestTrip) return latestTrip;

  return localDateStr(new Date());
}

function getCurrentShiftKey(){
  var activeKey = getActiveShiftKey();
  if (activeKey) return activeKey;
  return localDateStr(new Date());
}

function getShiftStatus(){
  var activeKey = getActiveShiftKey();
  if (activeKey) return 'working';

  var lastKey = getLastShiftKey();
  if (lastKey && shiftSettings[lastKey] && shiftSettings[lastKey].startedAt){
    if (shiftSettings[lastKey].endedAt) return 'ended';
  }
  return 'idle';
}

function ensureShiftFields(cfg){
  if (!cfg) return;
  if (cfg.startedAt === undefined) cfg.startedAt = null;
  if (cfg.endedAt   === undefined) cfg.endedAt   = null;
  if (cfg.startTime === undefined) cfg.startTime = '';
  if (cfg.endTime   === undefined) cfg.endTime   = '';
  if (cfg.note      === undefined) cfg.note      = '';

  if (!Array.isArray(cfg.fuelEntries)){
    var oldFuel = parseFloat(cfg.fuel) || 0;
    cfg.fuelEntries = oldFuel > 0
      ? [{ id: 'fuel_legacy_' + Date.now(), amount: oldFuel, unitPrice: null, liters: null, station: '', timestamp: Date.now() }]
      : [];
    delete cfg.fuel;
  }
  cfg.fuelEntries.forEach(function(e){
    if (e.unitPrice === undefined) e.unitPrice = null;
    if (e.liters    === undefined) e.liters    = null;
    if (e.station   === undefined) e.station   = '';
  });
  if (!cfg.mileage || typeof cfg.mileage !== 'object'){
    cfg.mileage = { start: null, end: null };
  } else {
    if (cfg.mileage.start === undefined) cfg.mileage.start = null;
    if (cfg.mileage.end   === undefined) cfg.mileage.end   = null;
  }
}

function getFuelTotal(cfg){
  if (!cfg) return 0;
  if (Array.isArray(cfg.fuelEntries)){
    return cfg.fuelEntries.reduce(function(s, e){ return s + (parseFloat(e.amount) || 0); }, 0);
  }
  return parseFloat(cfg.fuel) || 0;
}

function getShiftMileage(cfg){
  if (!cfg || !cfg.mileage) return null;
  var s = cfg.mileage.start;
  var e = cfg.mileage.end;
  if (s === null || s === undefined || s === '' || e === null || e === undefined || e === '') return null;
  var sv = parseFloat(s);
  var ev = parseFloat(e);
  if (isNaN(sv) || isNaN(ev)) return null;
  var diff = ev - sv;
  return diff >= 0 ? diff : null;
}

function getShiftDuration(cfg){
  if (!cfg || !cfg.startedAt) return null;
  var end = cfg.endedAt || Date.now();
  var diff = end - cfg.startedAt;
  if (diff < 0) return null;
  return diff / 3600000;
}

function getWorkedMs(cfg){
  if (!cfg || !cfg.startedAt) return null;
  var end = cfg.endedAt || Date.now();
  var diff = end - cfg.startedAt;
  return diff >= 0 ? diff : null;
}

function formatDuration(ms){
  if (ms === null || ms === undefined || ms < 0) return '--';
  var totalMin = Math.floor(ms / 60000);
  var h = Math.floor(totalMin / 60);
  var m = totalMin % 60;
  if (h >= 100) return h + 'h';
  return h + 'h' + pad2(m) + 'm';
}

function getShiftFinance(key){
  var cfg = shiftSettings[key];
  if (cfg) ensureShiftFields(cfg);

  var list = trips.filter(function(t){ return t.shiftDate === key; });
  var gross = 0, expenseTrip = 0;
  var incomeCount = 0, expenseCount = 0;
  list.forEach(function(t){
    var v = parseFloat(t.fare) || 0;
    if (v < 0){ expenseTrip += -v; expenseCount++; }
    else { gross += v; incomeCount++; }
  });

  var rental = cfg ? (parseFloat(cfg.rental) || 0) : 0;
  var fuel   = cfg ? getFuelTotal(cfg) : 0;
  var totalCost = rental + fuel + expenseTrip;
  var profit    = gross - totalCost;

  return {
    list: list, gross: gross,
    incomeCount: incomeCount, expenseTrip: expenseTrip, expenseCount: expenseCount,
    rental: rental, fuel: fuel, totalCost: totalCost, profit: profit
  };
}

function getSettingsByKey(key, createIfMissing){
  if (createIfMissing === undefined) createIfMissing = true;
  if (!key) return null;

  if (!shiftSettings[key]){
    if (!createIfMissing) return null;
    var keys = Object.keys(shiftSettings).sort().reverse();
    var base = keys.length ? shiftSettings[keys[0]] : DEFAULT_SHIFT;
    shiftSettings[key] = {
      startedAt: null, endedAt: null, startTime: '', endTime: '',
      rental:      parseFloat(base.rental) || 0,
      fuelEntries: [],
      mileage:     { start: null, end: null },
      note:        ''
    };
    localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));
  }
  ensureShiftFields(shiftSettings[key]);
  return shiftSettings[key];
}

function getCurrentSettings(createIfMissing){ return getSettingsByKey(getCurrentShiftKey(), createIfMissing); }
function getLastSettings(createIfMissing){ return getSettingsByKey(getLastShiftKey(), createIfMissing); }

(function migrateLegacy(){
  var legacy = JSON.parse(localStorage.getItem('taxi_settings'));
  if (legacy && Object.keys(shiftSettings).length === 0){
    var oldFuel = parseFloat(legacy.fuel) || 0;
    shiftSettings[localDateStr(new Date())] = {
      startedAt: null, endedAt: null, startTime: '', endTime: '',
      rental:      parseFloat(legacy.rental) || 0,
      fuelEntries: oldFuel > 0
        ? [{ id: 'fuel_legacy_' + Date.now(), amount: oldFuel, unitPrice: null, liters: null, station: '', timestamp: Date.now() }]
        : [],
      mileage:   { start: null, end: null },
      note:      ''
    };
    localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));
  }
  var settingsChanged = false;
  Object.keys(shiftSettings).forEach(function(k){
    var before = JSON.stringify(shiftSettings[k]);
    ensureShiftFields(shiftSettings[k]);
    if (JSON.stringify(shiftSettings[k]) !== before) settingsChanged = true;
  });
  if (settingsChanged) localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  var tripsChanged = false;
  trips.forEach(function(t){
    if (t.payment === undefined || t.payment === null || t.payment === ''){ t.payment = '現金'; tripsChanged = true; }
    if (!t.shiftDate){ t.shiftDate = localDateStr(new Date(t.timestamp)); tripsChanged = true; }
    if (t.dateStr && typeof t.dateStr === 'string' && /Z$/.test(t.dateStr)){
      var d = new Date(t.dateStr);
      if (!isNaN(d.getTime())){ t.dateStr = toLocalISOString(d); tripsChanged = true; }
    }
    if (!t.dateStr && t.timestamp){ t.dateStr = toLocalISOString(new Date(t.timestamp)); tripsChanged = true; }
  });
  if (tripsChanged) localStorage.setItem('taxi_trips', JSON.stringify(trips));
})();

function initLocationTracking(){
  if (!navigator.geolocation) return;
  if (navigator.permissions && navigator.permissions.query){
    navigator.permissions.query({ name: 'geolocation' }).then(function(result){
      if (result.state === 'granted') refreshLocation();
      result.onchange = function(){ if (result.state === 'granted') refreshLocation(); };
    }).catch(function(){});
  }
  if (locationTrackTimer) clearInterval(locationTrackTimer);
  locationTrackTimer = setInterval(function(){
    if (!document.hidden && cachedLocation) refreshLocation();
  }, 120000);
}

function refreshLocationManual(){ refreshLocation(true); }

function refreshLocation(manual){
  if (!navigator.geolocation){ if (manual) showToast('此瀏覽器不支援定位功能'); return; }

  var chip = document.getElementById('trip-location-chip');
  if (chip && manual){
    chip.className = 'w-6 h-6 rounded-full border flex items-center justify-center transition shrink-0 bg-blue-50 text-blue-500 border-blue-200 animate-pulse';
  }

  navigator.geolocation.getCurrentPosition(
    function(pos){
      cachedLocation = {
        lat: pos.coords.latitude, lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy || 0, timestamp: Date.now()
      };
      updateLocationChip();
      if (manual) showToast('已取得位置（誤差約 ' + Math.round(cachedLocation.accuracy) + ' m）');
    },
    function(err){
      updateLocationChip();
      if (manual){
        var msg = err && err.code === 1 ? '定位權限被拒絕（可在瀏覽器設定開啟）' : ('定位失敗：' + (err.message || '未知錯誤'));
        showToast(msg);
      }
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
  );
}

function updateLocationChip(){
  var chip = document.getElementById('trip-location-chip');
  if (!chip) return;

  if (cachedLocation){
    chip.className = 'w-6 h-6 rounded-full border flex items-center justify-center transition shrink-0 bg-emerald-50 text-emerald-600 border-emerald-200';
    chip.title = '位置已記錄（點擊刷新）';
  } else {
    chip.className = 'w-6 h-6 rounded-full border flex items-center justify-center transition shrink-0 bg-slate-50 text-slate-300 border-slate-200';
    chip.title = '未取得位置（點擊重試）';
  }

  chip.querySelectorAll('[data-icon]').forEach(function(el){ el.dataset.done = ''; });
  hydrateIcons(chip);
}

/* =========================================================
   阻塞式定位工具
   ========================================================= */

function getFreshLocation(opts){
  opts = opts || {};
  var timeoutMs    = opts.timeoutMs    || 6000;
  var highAccuracy = !!opts.highAccuracy;

  return new Promise(function(resolve, reject){
    if (!navigator.geolocation){ reject(new Error('NO_GEOLOCATION')); return; }
    if (!window.isSecureContext){ reject(new Error('INSECURE_CONTEXT')); return; }

    var done = false;
    var timer = setTimeout(function(){
      if (done) return;
      done = true;
      reject(new Error('TIMEOUT'));
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      function(pos){
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 0,
          timestamp: Date.now()
        });
      },
      function(err){
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(new Error(err && err.code === 1 ? 'PERMISSION_DENIED' : 'POSITION_UNAVAILABLE'));
      },
      { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: 0 }
    );
  });
}

async function getLocationBestEffort(){
  try {
    return await getFreshLocation({ timeoutMs: 3500, highAccuracy: true });
  } catch (e1){
    return await getFreshLocation({ timeoutMs: 3500, highAccuracy: false });
  }
}

function locationErrorText(e){
  var m = e && e.message;
  if (m === 'TIMEOUT')            return '定位逾時';
  if (m === 'PERMISSION_DENIED')  return '定位權限被拒';
  if (m === 'NO_GEOLOCATION')     return '此瀏覽器不支援定位';
  if (m === 'INSECURE_CONTEXT')   return '非安全連線（需 HTTPS）';
  return '定位失敗';
}

function setSaveBtnLoading(btn, loading){
  if (!btn) return;
  if (loading){
    if (!btn.dataset.origHtml){
      btn.dataset.origHtml     = btn.innerHTML;
      btn.dataset.origDisabled = btn.disabled ? '1' : '0';
    }
    btn.disabled = true;
    btn.classList.add('opacity-60','cursor-wait');
    btn.innerHTML =
      '<span class="inline-flex items-center gap-1.5">' +
        '<span class="ico w-4 h-4 animate-spin">' + ico('loader','w-4 h-4') + '</span>定位中…' +
      '</span>';
  } else {
    if (btn.dataset.origHtml){
      btn.innerHTML = btn.dataset.origHtml;
      delete btn.dataset.origHtml;
    }
    btn.disabled = btn.dataset.origDisabled === '1';
    delete btn.dataset.origDisabled;
    btn.classList.remove('opacity-60','cursor-wait');
    btn.querySelectorAll('[data-icon]').forEach(function(el){ delete el.dataset.done; });
    hydrateIcons(btn);
  }
}

function buildTripLocation(){
  if (!cachedLocation) return null;
  return {
    lat: cachedLocation.lat,
    lng: cachedLocation.lng,
    accuracy: cachedLocation.accuracy,
    timestamp: cachedLocation.timestamp || null
  };
}

function openTripLocationInMaps(tripId){
  var t = trips.find(function(x){ return x.id === tripId; });
  if (!t || !t.location || typeof t.location.lat !== 'number') return;

  var lat = t.location.lat;
  var lng = t.location.lng;
  var d = new Date(t.timestamp);
  var label = d.toLocaleString('zh-HK', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit',hour12: false });
  var pointName = '行程 ' + label;
  var encName = encodeURIComponent(pointName);

  var webUrl = 'https://uri.amap.com/marker' +
               '?position=' + lng + ',' + lat +
               '&name=' + encName +
               '&coordinate=wgs84&src=hk-taxi-helper&callnative=1';

  var ua = navigator.userAgent || '';
  var isMobile = /iPhone|iPad|iPod|Android|HarmonyOS|Mobile|Windows Phone/i.test(ua);

  if (!isMobile){
    window.open(webUrl, '_blank');
    return;
  }

  var appScheme = 'amapuri://viewMap' +
                  '?sourceApplication=hk-taxi-helper' +
                  '&poiname=' + encName +
                  '&lat=' + lat +
                  '&lon=' + lng +
                  '&dev=0';

  var startTime = Date.now();
  var fallbackTriggered = false;

  var fallbackTimer = setTimeout(function(){
    if (fallbackTriggered) return;
    if (!document.hidden && (Date.now() - startTime) < 3000){
      fallbackTriggered = true;
      window.location.href = webUrl;
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('pagehide', onPageHide);
  }, 2000);

  function onVisibilityChange(){
    if (document.hidden){
      fallbackTriggered = true;
      clearTimeout(fallbackTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('pagehide', onPageHide);
    }
  }
  function onPageHide(){
    fallbackTriggered = true;
    clearTimeout(fallbackTimer);
  }
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onPageHide, { once: true });

  try {
    window.location.href = appScheme;
  } catch (err){
    fallbackTriggered = true;
    clearTimeout(fallbackTimer);
    window.location.href = webUrl;
  }
}

function getFuelPrefs(){
  var prefs;
  try { prefs = JSON.parse(localStorage.getItem('taxi_fuel_prefs')) || {}; }
  catch(e){ prefs = {}; }
  if (!Array.isArray(prefs.stationHistory)) prefs.stationHistory = [];
  if (!Array.isArray(prefs.priceHistory))   prefs.priceHistory   = [];
  if (prefs.lastUnitPrice === undefined)    prefs.lastUnitPrice  = null;
  if (prefs.lastStation   === undefined)    prefs.lastStation    = '';
  return prefs;
}
function saveFuelPrefs(prefs){ localStorage.setItem('taxi_fuel_prefs', JSON.stringify(prefs)); }

function rebuildFuelPrefsFromHistory(){
  var prefs = getFuelPrefs();
  var stationMap = {};
  var priceMap   = {};

  Object.keys(shiftSettings).forEach(function(k){
    var cfg = shiftSettings[k];
    (cfg.fuelEntries || []).forEach(function(e){
      if (e.station && String(e.station).trim()){
        var s = String(e.station).trim();
        stationMap[s] = (stationMap[s] || 0) + 1;
      }
      var p = parseFloat(e.unitPrice);
      if (!isNaN(p) && p > 0){
        var key = p.toFixed(2);
        priceMap[key] = (priceMap[key] || 0) + 1;
      }
    });
  });

  var stations = Object.keys(stationMap).sort(function(a,b){
    if (stationMap[b] !== stationMap[a]) return stationMap[b] - stationMap[a];
    return a.localeCompare(b);
  });
  var prices = Object.keys(priceMap).sort(function(a,b){
    if (priceMap[b] !== priceMap[a]) return priceMap[b] - priceMap[a];
    return parseFloat(b) - parseFloat(a);
  });

  prefs.stationHistory = stations.slice(0, 8);
  prefs.priceHistory   = prices.slice(0, 6);
  saveFuelPrefs(prefs);
  return prefs;
}

function openShiftPickerModal(){
  var currentKey = getCurrentShiftKey();
  var candidates = Object.keys(shiftSettings).sort().reverse();
  var html = '<div class="space-y-2 max-h-80 overflow-y-auto pr-1">';

  var autoActive = manualShiftKey === null;
  html +=
    '<button type="button" onclick="selectManualShift(null)" ' +
    'class="w-full text-left px-3 py-2.5 rounded-xl border-2 ' +
    (autoActive ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:bg-slate-50') +
    ' transition flex justify-between items-center gap-2">' +
      '<span class="flex items-center gap-2 min-w-0">' +
        '<span class="ico w-5 h-5 shrink-0 ' + (autoActive ? 'text-amber-600' : 'text-slate-400') + '" data-icon="history"></span>' +
        '<span class="min-w-0">' +
          '<div class="text-sm font-bold ' + (autoActive ? 'text-amber-900' : 'text-slate-700') + '">自動（跟隨現在時間）</div>' +
          '<div class="text-[11px] text-slate-500 mt-0.5 truncate">當前更次：' + currentKey + '</div>' +
        '</span>' +
      '</span>' +
      (autoActive ? '<span class="text-amber-600 font-bold shrink-0 text-base">✓</span>' : '') +
    '</button>';

  if (!candidates.length){
    html += '<div class="text-center text-slate-400 text-xs py-6 leading-relaxed">目前沒有任何已建立的更次<br><span class="text-[11px]">可用下方「其他日期」新增</span></div>';
  } else {
    candidates.forEach(function(k){
      var cfg = shiftSettings[k];
      if (cfg) ensureShiftFields(cfg);

      var list = trips.filter(function(t){ return t.shiftDate === k; });
      var isSelected = manualShiftKey === k;
      var isCurrent = k === currentKey;
      var timeRange = (cfg && cfg.startTime) ? (cfg.startTime + ' - ' + (cfg.endTime || '工作中')) : '未開工';

      var wkDay = '';
      var dd = new Date(k + 'T12:00:00');
      if (!isNaN(dd.getTime())){ wkDay = dd.toLocaleDateString('zh-HK', { weekday:'short' }); }

      var noteLine = (cfg && cfg.note)
        ? '<div class="text-[11px] text-amber-700 mt-0.5 truncate flex items-center gap-1">' + ico('edit-3','w-3 h-3') + escapeHtml(cfg.note) + '</div>'
        : '';

      html +=
        '<button type="button" onclick="selectManualShift(\'' + k + '\')" ' +
        'class="w-full text-left px-3 py-2.5 rounded-xl border-2 ' +
        (isSelected ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:bg-slate-50') +
        ' transition flex justify-between items-center gap-2">' +
          '<span class="min-w-0">' +
            '<div class="text-sm font-bold ' + (isSelected ? 'text-amber-900' : 'text-slate-700') + '">' + k +
              ' <span class="text-[10px] text-slate-400 font-normal">' + wkDay + '</span>' +
              (isCurrent ? ' <span class="text-[10px] text-amber-600 font-bold">當前</span>' : '') +
            '</div>' +
            '<div class="text-[11px] text-slate-500 mt-0.5">' + timeRange + '　·　' + list.length + ' 筆</div>' +
            noteLine +
          '</span>' +
          (isSelected ? '<span class="text-amber-600 font-bold shrink-0 text-base">✓</span>' : '') +
        '</button>';
    });
  }
  html += '</div>';

  html +=
    '<div class="mt-3 pt-3 border-t border-slate-200">' +
      '<label class="block text-xs font-semibold text-slate-600 mb-1.5">或選擇其他日期</label>' +
      '<div class="flex gap-2">' +
        '<input type="date" id="shift-picker-date" value="' + (manualShiftKey || currentKey) + '" ' +
          'class="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500">' +
        '<button type="button" onclick="applyCustomShiftDate()" ' +
          'class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs transition shrink-0">確定</button>' +
      '</div>' +
      '<p class="text-[11px] text-slate-400 mt-1.5 leading-relaxed">補錄模式下，新儲存的紀錄將歸入所選更次；不影響成本設定與其他統計。</p>' +
    '</div>';

  document.getElementById('modal-title').innerText = '選擇更次（補錄用）';
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition">關閉</button>';

  var m = document.getElementById('trip-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  hydrateIcons();
}

function applyCustomShiftDate(){
  var input = document.getElementById('shift-picker-date');
  if (!input || !input.value) return;
  selectManualShift(input.value);
}

function selectManualShift(key){
  manualShiftKey = key;
  manualTripTime = null;

  if (key && !shiftSettings[key]){
    var keys = Object.keys(shiftSettings).sort().reverse();
    var base = keys.length ? shiftSettings[keys[0]] : DEFAULT_SHIFT;
    shiftSettings[key] = {
      startedAt: null, endedAt: null, startTime: '', endTime: '',
      rental:      parseFloat(base.rental) || 0,
      fuelEntries: [],
      mileage:     { start: null, end: null },
      note:        ''
    };
    localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));
  }

  closeModal();
  updateDateTimePreview();
  updateTripTimeChip();
  initSettingsForm();
  updateStatsAndNet();
  renderTripList();

  if (key) showToast('已切換至補錄模式：' + key);
  else showToast('已回復自動模式');
}

function startShift(){
  var activeKey = getActiveShiftKey();
  if (activeKey){ showToast('已在工作中，請先收工'); return; }

  var now = new Date();
  var today = localDateStr(now);

  if (shiftSettings[today] && shiftSettings[today].startedAt && shiftSettings[today].endedAt){
    if (!confirm('今日已收工，是否要重新開工？\n\n將覆蓋今日的開工/收工時間（行程紀錄與成本保留）。')) return;
  }

  var cfg = getSettingsByKey(today, true);
  cfg.startedAt = now.getTime();
  cfg.endedAt   = null;
  cfg.startTime = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
  cfg.endTime   = '';

  shiftSettings[today] = cfg;
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  closeModal();
  initSettingsForm();
  updateDateTimePreview();
  updateTripTimeChip();
  updateStatsAndNet();
  renderTripList();
  updateHeaderWorked();

  showToast('已開工：' + cfg.startTime);
}

function endShift(){
  var activeKey = getActiveShiftKey();
  if (!activeKey){ showToast('尚未開工'); return; }

  var now = new Date();
  var cfg = shiftSettings[activeKey];
  cfg.endedAt = now.getTime();
  cfg.endTime = pad2(now.getHours()) + ':' + pad2(now.getMinutes());

  shiftSettings[activeKey] = cfg;
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  closeModal();
  initSettingsForm();
  updateDateTimePreview();
  updateTripTimeChip();
  updateStatsAndNet();
  renderTripList();
  updateHeaderWorked();

  var duration = (cfg.endedAt - cfg.startedAt) / 3600000;
  showToast('已收工：' + cfg.endTime + '（工時 ' + duration.toFixed(1) + 'h）');
}

function openShiftTimeModal(){
  shiftTimeMode = 'quick';
  renderShiftTimeModal();
  var m = document.getElementById('trip-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
}

function closeShiftTimeModal(){ closeModal(); shiftTimeMode = 'quick'; }

function renderShiftTimeModal(){
  if (shiftTimeMode === 'manual') renderManualShiftTimePanel();
  else renderQuickShiftTimePanel();
}

function renderQuickShiftTimePanel(){
  var activeKey = getActiveShiftKey();
  var lastKey   = getLastShiftKey();
  var targetKey = activeKey || lastKey;

  var wkDay = '';
  if (targetKey){
    var dd = new Date(targetKey + 'T12:00:00');
    if (!isNaN(dd.getTime())){ wkDay = dd.toLocaleDateString('zh-HK', { weekday:'long' }); }
  }

  var html = '<div class="space-y-3">';
  html +=
    '<div class="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex justify-between items-center">' +
      '<span class="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">' +
        '<span class="ico w-3.5 h-3.5 text-amber-600" data-icon="clock"></span>更次日期' +
      '</span>' +
      '<span class="font-bold text-amber-900 font-mono text-xs">' + (targetKey || '--') +
        (wkDay ? ' <span class="text-[10px] text-amber-600 font-normal">' + wkDay + '</span>' : '') +
      '</span>' +
    '</div>';

  html += '<div id="shift-status-panel"></div>';
  html += '<div id="shift-action-panel"></div>';
  html += '<div id="shift-duration-panel"></div>';

  html +=
    '<div class="border-t border-slate-200 pt-3">' +
      '<label class="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">' +
        '<span class="ico w-3.5 h-3.5 text-amber-500" data-icon="edit-3"></span> 更次備註 (選填)' +
      '</label>' +
      '<div class="flex gap-1.5">' +
        '<input type="text" id="quick-shift-note" autocomplete="off" ' +
          'placeholder="例如：早更、紅日、雨天、旺角開工..." ' +
          'class="flex-1 min-w-0 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500">' +
        '<button type="button" onclick="saveQuickShiftNote()" ' +
          'class="px-3 py-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-900 font-bold rounded-xl text-xs transition shrink-0">保存</button>' +
      '</div>' +
      '<p class="text-[11px] text-slate-400 mt-1 leading-relaxed">備註會跟隨此更次保存，日後可在歷史更次中查看。</p>' +
    '</div>';

  html +=
    '<button type="button" onclick="switchShiftTimeMode(\'manual\')" ' +
    'class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-semibold rounded-xl transition flex items-center justify-center gap-1.5 text-xs border border-slate-200">' +
      '<span class="ico w-3.5 h-3.5" data-icon="edit-2"></span> 忘記打卡？手動輸入時間' +
    '</button>';

  html +=
    '<p class="text-[11px] text-slate-400 leading-relaxed">' +
      '※ 點「開工」記錄當前時間為開工時間<br>' +
      '※ 點「收工」記錄當前時間為收工時間<br>' +
      '※ 若忘記打卡，可點上方按鈕手動輸入' +
    '</p>';
  html += '</div>';

  document.getElementById('modal-title').innerText = '更次時間';
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeShiftTimeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition">關閉</button>';

  hydrateIcons();
  updateQuickShiftStatus();
}

function updateQuickShiftStatus(){
  var panel  = document.getElementById('shift-status-panel');
  var action = document.getElementById('shift-action-panel');
  var durP   = document.getElementById('shift-duration-panel');
  if (!panel || !action || !durP) return;

  var status    = getShiftStatus();
  var activeKey = getActiveShiftKey();
  var lastKey   = getLastShiftKey();
  var targetKey = activeKey || lastKey;
  var cfg       = targetKey ? getSettingsByKey(targetKey, false) : null;

  if (status === 'idle'){
    panel.innerHTML =
      '<div class="bg-slate-100 rounded-xl p-4 text-center border-2 border-slate-200">' +
        '<div class="ico w-8 h-8 mx-auto text-slate-400">' + ico('clock','w-8 h-8') + '</div>' +
        '<div class="text-sm font-bold text-slate-600 mt-2">未開工</div>' +
        '<div class="text-[11px] text-slate-400 mt-1">點擊下方按鈕開始</div>' +
      '</div>';
  } else if (status === 'working'){
    var workedMs = getWorkedMs(cfg);
    panel.innerHTML =
      '<div class="bg-emerald-50 rounded-xl p-4 text-center border-2 border-emerald-300">' +
        '<div class="flex items-center justify-center gap-2">' +
          '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>' +
          '<span class="text-[11px] font-bold text-emerald-700">工作中</span>' +
        '</div>' +
        '<div class="text-3xl font-black text-emerald-700 mt-2 font-mono">' + formatDuration(workedMs) + '</div>' +
        '<div class="text-[11px] text-emerald-600 mt-1">開工時間：' + (cfg.startTime || '--') + '</div>' +
      '</div>';
  } else {
    var durationMs = cfg && cfg.startedAt && cfg.endedAt ? (cfg.endedAt - cfg.startedAt) : null;
    panel.innerHTML =
      '<div class="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-300">' +
        '<div class="ico w-8 h-8 mx-auto text-blue-500">' + ico('check-circle','w-8 h-8') + '</div>' +
        '<div class="text-sm font-bold text-blue-700 mt-2">已收工</div>' +
        '<div class="text-2xl font-black text-blue-700 mt-1 font-mono">' + formatDuration(durationMs) + '</div>' +
      '</div>';
  }

  if (status === 'working'){
    action.innerHTML =
      '<button type="button" onclick="endShift()" ' +
      'class="w-full py-4 bg-rose-500 hover:bg-rose-700 active:scale-[0.98] text-white font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 text-base">' +
        '<span class="ico w-5 h-5">' + ico('square','w-5 h-5') + '</span> 收工' +
      '</button>';
  } else {
    var btnText = status === 'ended' ? '重新開工' : '開工';
    action.innerHTML =
      '<button type="button" onclick="startShift()" ' +
      'class="w-full py-4 bg-emerald-500 hover:bg-emerald-700 active:scale-[0.98] text-white font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 text-base">' +
        '<span class="ico w-5 h-5">' + ico('play','w-5 h-5') + '</span> ' + btnText +
      '</button>';
  }

  if (cfg && cfg.startedAt){
    var startStr = new Date(cfg.startedAt).toLocaleString('zh-HK', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
    var endStr = cfg.endedAt
      ? new Date(cfg.endedAt).toLocaleString('zh-HK', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })
      : '（工作中）';
    durP.innerHTML =
      '<div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 space-y-1.5 text-xs">' +
        '<div class="flex justify-between"><span class="text-slate-500">開工</span><span class="font-bold font-mono text-slate-800">' + startStr + '</span></div>' +
        '<div class="flex justify-between"><span class="text-slate-500">收工</span><span class="font-bold font-mono ' + (cfg.endedAt ? 'text-slate-800' : 'text-emerald-700') + '">' + endStr + '</span></div>' +
      '</div>';
  } else {
    durP.innerHTML = '';
  }

  var quickNoteEl = document.getElementById('quick-shift-note');
  if (quickNoteEl && document.activeElement !== quickNoteEl){
    quickNoteEl.value = (cfg && cfg.note) ? cfg.note : '';
  }
}

function saveQuickShiftNote(){
  var noteEl = document.getElementById('quick-shift-note');
  if (!noteEl) return;

  var note = noteEl.value.trim();
  var activeKey = getActiveShiftKey();
  var lastKey   = getLastShiftKey();
  var targetKey = activeKey || lastKey;

  if (!targetKey){ showToast('請先開工或建立更次'); return; }

  var cfg = getSettingsByKey(targetKey, true);
  cfg.note = note;
  shiftSettings[targetKey] = cfg;
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  initSettingsForm();
  updateStatsAndNet();
  renderTripList();

  showToast(note ? '更次備註已保存' : '更次備註已清除');
}

function switchShiftTimeMode(mode){ shiftTimeMode = mode; renderShiftTimeModal(); }

function renderManualShiftTimePanel(){
  var activeKey = getActiveShiftKey();
  var lastKey   = getLastShiftKey();
  var targetKey = activeKey || lastKey || localDateStr(new Date());
  var cfg       = getSettingsByKey(targetKey, false);

  var startVal = '';
  var endVal   = '';
  if (cfg && cfg.startedAt){ var s = new Date(cfg.startedAt); startVal = pad2(s.getHours()) + ':' + pad2(s.getMinutes()); }
  if (cfg && cfg.endedAt){ var e = new Date(cfg.endedAt); endVal = pad2(e.getHours()) + ':' + pad2(e.getMinutes()); }
  var noteVal = (cfg && cfg.note) ? cfg.note : '';
  var todayStr = localDateStr(new Date());

  var html = '<div class="space-y-3">';

  html +=
    '<div class="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-[11px] text-amber-800 leading-relaxed flex items-start gap-1.5">' +
      '<span class="ico w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" data-icon="info"></span>' +
      '<span>用於補錄忘記打卡的更次。選擇日期並填入開工／收工時間即可。</span>' +
    '</div>';

  html +=
    '<div>' +
      '<label class="block text-xs font-semibold text-slate-600 mb-1">日期</label>' +
      '<input type="date" id="manual-shift-date" value="' + targetKey + '" max="' + todayStr + '" oninput="onManualDateChange()" ' +
        'class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono">' +
    '</div>';

  html +=
    '<div class="grid grid-cols-2 gap-3">' +
      '<div><label class="block text-xs font-semibold text-slate-600 mb-1">開工時間</label>' +
        '<div class="flex gap-1">' +
          '<input type="time" id="manual-shift-start" value="' + startVal + '" oninput="updateManualPreview()" ' +
            'class="flex-1 min-w-0 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono">' +
          '<button type="button" onclick="setManualTimeNow(\'start\')" ' +
            'class="px-2 py-1 text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg transition shrink-0">現在</button>' +
        '</div>' +
      '</div>' +
      '<div><label class="block text-xs font-semibold text-slate-600 mb-1">收工時間</label>' +
        '<div class="flex gap-1">' +
          '<input type="time" id="manual-shift-end" value="' + endVal + '" oninput="updateManualPreview()" ' +
            'class="flex-1 min-w-0 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono">' +
          '<button type="button" onclick="setManualTimeNow(\'end\')" ' +
            'class="px-2 py-1 text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg transition shrink-0">現在</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  html +=
    '<div>' +
      '<label class="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">' +
        '<span class="ico w-3.5 h-3.5 text-amber-500" data-icon="edit-3"></span> 更次備註 (選填)' +
      '</label>' +
      '<input type="text" id="manual-shift-note" autocomplete="off" value="' + escapeHtml(noteVal) + '" ' +
        'placeholder="例如：早更、紅日、雨天、旺角開工..." ' +
        'class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500">' +
      '<p class="text-[11px] text-slate-400 mt-1 leading-relaxed">備註會跟隨時段一起保存。</p>' +
    '</div>';

  html +=
    '<div class="grid grid-cols-2 gap-2">' +
      '<button type="button" onclick="fillManualOnlyStart()" ' +
        'class="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-lg transition border border-emerald-200">只填開工（忘記收工）</button>' +
      '<button type="button" onclick="clearManualEnd()" ' +
        'class="py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-lg transition border border-slate-200">清空收工時間</button>' +
    '</div>';

  html += '<div id="manual-preview" class="bg-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-700"></div>';

  html +=
    '<p class="text-[11px] text-slate-400 leading-relaxed">' +
      '※ 收工留空 = 工作中<br>' +
      '※ 若收工時間早於開工時間，視為跨日更次' +
    '</p>';
  html += '</div>';

  document.getElementById('modal-title').innerText = '手動輸入時間';
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="switchShiftTimeMode(\'quick\')" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1">' +
      '<span class="ico w-3.5 h-3.5">' + ico('arrow-left','w-3.5 h-3.5') + '</span> 返回' +
    '</button>' +
    '<button onclick="saveManualShiftTime()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs transition">保存</button>';

  hydrateIcons();
  updateManualPreview();
}

function onManualDateChange(){
  var dateEl = document.getElementById('manual-shift-date');
  if (!dateEl) return;
  var key = dateEl.value;
  var cfg = shiftSettings[key];

  var startEl = document.getElementById('manual-shift-start');
  var endEl   = document.getElementById('manual-shift-end');
  var noteEl  = document.getElementById('manual-shift-note');

  if (cfg && cfg.startedAt){ var s = new Date(cfg.startedAt); startEl.value = pad2(s.getHours()) + ':' + pad2(s.getMinutes()); }
  else { startEl.value = ''; }
  if (cfg && cfg.endedAt){ var e = new Date(cfg.endedAt); endEl.value = pad2(e.getHours()) + ':' + pad2(e.getMinutes()); }
  else { endEl.value = ''; }
  if (noteEl){ noteEl.value = (cfg && cfg.note) ? cfg.note : ''; }
  updateManualPreview();
}

function setManualTimeNow(which){
  var id = which === 'start' ? 'manual-shift-start' : 'manual-shift-end';
  var el = document.getElementById(id);
  if (!el) return;
  var now = new Date();
  el.value = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
  updateManualPreview();
}

function fillManualOnlyStart(){
  var startEl = document.getElementById('manual-shift-start');
  var endEl   = document.getElementById('manual-shift-end');
  if (!startEl || !endEl) return;
  if (!startEl.value){ var now = new Date(); startEl.value = pad2(now.getHours()) + ':' + pad2(now.getMinutes()); }
  endEl.value = '';
  updateManualPreview();
}

function clearManualEnd(){
  var endEl = document.getElementById('manual-shift-end');
  if (endEl) endEl.value = '';
  updateManualPreview();
}

function updateManualPreview(){
  var previewEl = document.getElementById('manual-preview');
  var dateEl    = document.getElementById('manual-shift-date');
  var startEl   = document.getElementById('manual-shift-start');
  var endEl     = document.getElementById('manual-shift-end');
  if (!previewEl || !dateEl || !startEl || !endEl) return;

  var dateVal = dateEl.value;
  var s = startEl.value;
  var e = endEl.value;

  if (!dateVal || !s){
    previewEl.innerHTML = '<div class="text-slate-400 text-center text-[11px]">請填入日期與開工時間</div>';
    return;
  }

  var base = new Date(dateVal + 'T00:00:00');
  var sD = new Date(base);
  var sParts = s.split(':');
  sD.setHours(parseInt(sParts[0], 10), parseInt(sParts[1], 10), 0, 0);

  var eD = null;
  if (e){
    eD = new Date(base);
    var eParts = e.split(':');
    eD.setHours(parseInt(eParts[0], 10), parseInt(eParts[1], 10), 0, 0);
    if (eD.getTime() <= sD.getTime()) eD.setDate(eD.getDate() + 1);
  }

  var now = new Date();
  var endMs = eD ? eD.getTime() : now.getTime();
  var durationMs = endMs - sD.getTime();

  var modeText = !eD ? '工作中' : (sD.toDateString() === eD.toDateString() ? '同日更次' : '跨午夜更次');
  var modeColor = !eD ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : (sD.toDateString() === eD.toDateString() ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-purple-700 bg-purple-50 border-purple-200');

  previewEl.innerHTML =
    '<div class="flex items-center justify-between gap-2">' +
      '<span class="font-mono text-slate-700 text-[11px]">' + s + ' → ' + (e || '工作中') + '</span>' +
      '<span class="px-2 py-0.5 rounded-full border text-[11px] font-bold ' + modeColor + '">' + modeText + '</span>' +
    '</div>' +
    '<div class="text-[11px] text-slate-500 mt-1.5">時長：<span class="font-bold text-slate-700 font-mono">' + formatDuration(durationMs) + '</span></div>';
}

function saveManualShiftTime(){
  var dateEl  = document.getElementById('manual-shift-date');
  var startEl = document.getElementById('manual-shift-start');
  var endEl   = document.getElementById('manual-shift-end');
  var noteEl  = document.getElementById('manual-shift-note');
  if (!dateEl || !startEl || !endEl) return;

  var dateVal = dateEl.value;
  var s = startEl.value;
  var e = endEl.value;

  if (!dateVal){ showToast('請選擇日期'); return; }
  if (!s){ showToast('請填入開工時間'); return; }

  var activeKey = getActiveShiftKey();
  if (activeKey && activeKey !== dateVal && !e){
    if (!confirm('你目前在「' + activeKey + '」更次工作中。\n\n確定要在 ' + dateVal + ' 開啟新更次（不填收工時間）嗎？\n這會讓 ' + activeKey + ' 變為進行中狀態，並同時存在兩個進行中更次。')) return;
  }

  var cfg = getSettingsByKey(dateVal, true);
  var base = new Date(dateVal + 'T00:00:00');
  var sD = new Date(base);
  var sParts = s.split(':');
  sD.setHours(parseInt(sParts[0], 10), parseInt(sParts[1], 10), 0, 0);
  cfg.startedAt = sD.getTime();
  cfg.startTime = s;

  if (e){
    var eD = new Date(base);
    var eParts = e.split(':');
    eD.setHours(parseInt(eParts[0], 10), parseInt(eParts[1], 10), 0, 0);
    if (eD.getTime() <= sD.getTime()) eD.setDate(eD.getDate() + 1);
    cfg.endedAt = eD.getTime();
    cfg.endTime = e;
  } else {
    cfg.endedAt = null;
    cfg.endTime = '';
  }

  if (noteEl) cfg.note = noteEl.value.trim();

  shiftSettings[dateVal] = cfg;
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  closeModal();
  initSettingsForm();
  updateDateTimePreview();
  updateTripTimeChip();
  updateStatsAndNet();
  renderTripList();
  updateHeaderWorked();

  var msg = '已設定 ' + dateVal + '：' + s;
  if (e) msg += ' - ' + e;
  else   msg += '（工作中）';
  showToast(msg);
}

document.addEventListener('gesturestart', function(e){ e.preventDefault(); }, { passive:false });
var lastTouchEnd = 0;
document.addEventListener('touchend', function(e){
  var now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, { passive:false });

(function setupTapToDismiss(){
  function isFormField(el){ if (!el) return false; var tag = el.tagName; return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA'; }
  function dismissKeyboard(e){
    var target = e.target;
    if (target.closest && target.closest('input, select, textarea, button, a, label')) return;
    var active = document.activeElement;
    if (isFormField(active)) active.blur();
  }
  document.addEventListener('touchstart', dismissKeyboard, { passive: true });
  document.addEventListener('mousedown', dismissKeyboard);
})();

window.addEventListener('DOMContentLoaded', function(){
  hydrateIcons();
  applyAllCardStates();
  initSettingsForm();

  var allTypes = getAllTripTypes();
  if (allTypes.indexOf(activeTripType) === -1){ activeTripType = '街客'; localStorage.setItem('taxi_last_type', activeTripType); }
  renderTripTypeButtons();

  var allPayments = getAllPaymentMethods();
  if (allPayments.indexOf(activePaymentMethod) === -1){ activePaymentMethod = '現金'; localStorage.setItem('taxi_last_payment', activePaymentMethod); }
  renderPaymentMethodButtons();

  applyAdvancedSettingsState();

  updateFareSignUI();
  renderNoteTags();
  updateDateTimePreview();
  updateTripTimeChip();
  setInterval(updateDateTimePreview, 1000);
  updateHeaderTime();
  setInterval(updateHeaderTime, 1000);
  renderTripList();

  applyChartUIState();
  updateStatsAndNet();

  renderPlaceFilters();
  renderPlacesList();

  initLocationTracking();
  updateLocationChip();

  renderDrawerMenu();
  var logoBtn = document.getElementById('header-logo-btn');
  if (logoBtn){
    logoBtn.addEventListener('click', function(e){ e.stopPropagation(); openDrawer(); });
  }

});

function toggleAdvancedSettings(){
  advancedSettingsOpen = !advancedSettingsOpen;
  localStorage.setItem('taxi_advanced_open', advancedSettingsOpen ? '1' : '0');
  applyAdvancedSettingsState();
}

function applyAdvancedSettingsState(){
  var panel = document.getElementById('advanced-settings');
  var btnText = document.getElementById('advanced-toggle-text');
  var chev = document.getElementById('advanced-toggle-chevron');

  if (panel){ if (advancedSettingsOpen) panel.classList.remove('hidden'); else panel.classList.add('hidden'); }
  if (btnText){ btnText.innerText = advancedSettingsOpen ? '收起設置' : '更多設置（付款方式、備註）'; }
  if (chev){ chev.style.transform = advancedSettingsOpen ? 'rotate(180deg)' : ''; }
}

function updateDateTimePreview(){
  var now = new Date();
  var dateStr = now.toLocaleDateString('zh-HK', { month:'2-digit', day:'2-digit' });
  var weekStr = now.toLocaleDateString('zh-HK', { weekday:'long' });
  var el = document.getElementById('current-date-time-preview');
  if (el){
    if (manualShiftKey){
      el.className = 'text-xs font-bold text-right leading-tight text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg cursor-pointer select-none transition';
      el.innerHTML = '<span class="block">📌 補錄模式</span><span class="block text-[10px] text-amber-600 font-mono">' + manualShiftKey + '</span>';
    } else {
      var status = getShiftStatus();
      var rangeText;
      if (status === 'working')   rangeText = '工作中';
      else if (status === 'ended') rangeText = '已收工';
      else                         rangeText = '未開工';

      el.className = 'text-xs text-slate-400 font-medium text-right leading-tight cursor-pointer select-none hover:text-slate-600 transition';
      el.innerHTML = '<span class="block">' + dateStr + ' ' + weekStr + '</span><span class="block text-[10px] text-slate-400">' + rangeText + '</span>';
    }
  }
  updateTripTimeChip();
}

function updateHeaderTime(){
  var now = new Date();
  var timeStr = now.toLocaleTimeString('zh-HK', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false });
  var timeEl = document.getElementById('header-current-time');
  if (timeEl) timeEl.innerText = timeStr;
  updateHeaderWorked();
}

function updateHeaderWorked(){
  var el = document.getElementById('header-worked');
  if (!el) return;

  var status = getShiftStatus();
  if (status === 'idle'){ el.innerText = '未開工'; return; }

  var activeKey = getActiveShiftKey();
  var lastKey   = getLastShiftKey();
  var cfg       = shiftSettings[activeKey || lastKey];
  if (!cfg || !cfg.startedAt){ el.innerText = '未開工'; return; }

  var workedMs = getWorkedMs(cfg);
  if (status === 'working'){ el.innerText = '工作 ' + formatDuration(workedMs); }
  else { var totalMs = cfg.endedAt - cfg.startedAt; el.innerText = '已收工 ' + formatDuration(totalMs); }
}

function escapeHtml(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

var TAB_NAMES = ['trip','list','places','stats'];

function switchTab(tabName){
  currentTab = tabName;

  TAB_NAMES.forEach(function(t){
    var tabEl = document.getElementById('tab-' + t);
    if (tabEl) tabEl.classList.add('hidden');

    var btn = document.getElementById('nav-' + t);
    if (btn){
      btn.className = 'flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition';
      var label = btn.querySelector('span:last-child');
      if (label) label.className = 'text-[11px] font-medium mt-1';
    }
  });

  var targetTab = document.getElementById('tab-' + tabName);
  if (targetTab) targetTab.classList.remove('hidden');

  var activeNav = document.getElementById('nav-' + tabName);
  if (activeNav){
    activeNav.className = 'flex flex-col items-center justify-center text-amber-500 transition';
    var activeLabel = activeNav.querySelector('span:last-child');
    if (activeLabel) activeLabel.className = 'text-[11px] font-bold mt-1';
  }

  if (tabName === 'list')  renderTripList();
  if (tabName === 'places'){ renderPlaceFilters(); renderPlacesList(); }
  if (tabName === 'stats'){ initSettingsForm(); applyChartUIState(); updateStatsAndNet(); }
  hydrateIcons();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderTripTypeButtons(){
  var container = document.getElementById('trip-type-buttons');
  if (!container) return;

  var list = tripTypeExpanded ? TRIP_TYPE_CONFIG : TRIP_TYPE_CONFIG.filter(function(t){ return t.hot; });

  container.innerHTML = list.map(function(t){
    var active = (activeTripType === t.name);
    var cls = active
      ? 'py-2.5 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 transition bg-amber-500 text-slate-900 border-amber-600 shadow-sm'
      : 'py-2.5 px-2.5 rounded-xl border font-medium text-xs flex items-center justify-center gap-1 transition bg-white text-slate-700 border-slate-200 hover:bg-slate-100';
    return '<button type="button" onclick="setTripType(\'' + escapeHtml(t.name) + '\')" class="' + cls + '">' +
      ico(t.icon, 'w-3.5 h-3.5 shrink-0') + '<span class="truncate">' + escapeHtml(t.name) + '</span>' +
    '</button>';
  }).join('');

  var toggleText = document.getElementById('trip-type-toggle-text');
  var chev = document.getElementById('trip-type-toggle-chevron');
  var hiddenCount = TRIP_TYPE_CONFIG.filter(function(t){ return !t.hot; }).length;

  if (toggleText){ toggleText.innerText = tripTypeExpanded ? '收起' : (hiddenCount > 0 ? '更多網約車平台（+' + hiddenCount + '）' : '更多'); }
  if (chev){ chev.style.transform = tripTypeExpanded ? 'rotate(180deg)' : ''; }
}

function toggleTripTypeExpanded(){ tripTypeExpanded = !tripTypeExpanded; renderTripTypeButtons(); }

function setTripType(type){
  activeTripType = type;
  localStorage.setItem('taxi_last_type', type);
  renderTripTypeButtons();
}

function renderPaymentMethodButtons(){
  var container = document.getElementById('trip-payment-buttons');
  if (!container) return;

  var list = PAYMENT_METHOD_CONFIG.filter(function(p){ return p.hot; });

  container.innerHTML = list.map(function(p){
    var active = (activePaymentMethod === p.name);
    var cls = active
      ? 'py-2.5 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 transition bg-amber-500 text-slate-900 border-amber-600 shadow-sm'
      : 'py-2.5 px-2.5 rounded-xl border font-medium text-xs flex items-center justify-center gap-1 transition bg-white text-slate-700 border-slate-200 hover:bg-slate-100';
    return '<button type="button" onclick="setPaymentMethod(\'' + escapeHtml(p.name) + '\')" class="' + cls + '">' +
      ico(p.icon, 'w-3.5 h-3.5 shrink-0') + '<span class="truncate">' + escapeHtml(p.name) + '</span>' +
    '</button>';
  }).join('');
}

function setPaymentMethod(name){
  activePaymentMethod = name;
  localStorage.setItem('taxi_last_payment', name);
  renderPaymentMethodButtons();
}

function toggleAllTripTypes(checked){
  document.getElementById('chk-type-street').checked = checked;
  document.getElementById('chk-type-uber').checked = checked;
  document.getElementById('chk-type-other').checked = checked;
  renderTripList();
}

function onTripTypeFilterChange(){
  var s = document.getElementById('chk-type-street').checked;
  var u = document.getElementById('chk-type-uber').checked;
  var o = document.getElementById('chk-type-other').checked;
  document.getElementById('chk-type-all').checked = (s && u && o);
  renderTripList();
}

function toggleAllPaymentMethods(checked){
  document.getElementById('chk-pay-cash').checked = checked;
  document.getElementById('chk-pay-octopus').checked = checked;
  document.getElementById('chk-pay-other').checked = checked;
  renderTripList();
}

function onPaymentFilterChange(){
  var c = document.getElementById('chk-pay-cash').checked;
  var o = document.getElementById('chk-pay-octopus').checked;
  var t = document.getElementById('chk-pay-other').checked;
  document.getElementById('chk-pay-all').checked = (c && o && t);
  renderTripList();
}

function parseNoteParts(val){
  if (!val) return [];
  return val.split(/[、,]\s*/).map(function(s){ return s.trim(); }).filter(Boolean);
}

function expandNoteTags(){
  noteTagsOpen = true;
  var box = document.getElementById('note-quick-tags');
  var btn = document.getElementById('note-tags-toggle');
  var btnText = document.getElementById('note-tags-toggle-text');
  if (box) box.style.display = 'flex';
  if (btn) btn.className = 'text-[11px] px-2 py-0.5 rounded-full border font-bold transition bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1';
  if (btnText) btnText.innerText = '收起標籤';
}

function collapseNoteTags(){
  noteTagsOpen = false;
  var box = document.getElementById('note-quick-tags');
  var btn = document.getElementById('note-tags-toggle');
  var btnText = document.getElementById('note-tags-toggle-text');
  if (box) box.style.display = 'none';
  if (btn) btn.className = 'text-[11px] px-2 py-0.5 rounded-full border font-medium transition bg-white text-slate-600 border-slate-200 hover:bg-slate-100 flex items-center gap-1';
  if (btnText) btnText.innerText = '快速標籤';
}

function toggleNoteTagsPanel(){ if (noteTagsOpen) collapseNoteTags(); else expandNoteTags(); }

function renderNoteTags(){
  var box = document.getElementById('note-quick-tags');
  var input = document.getElementById('trip-note');
  var clearBtn = document.getElementById('note-clear-btn');
  if (!box || !input) return;

  var tags = fareSign === -1 ? NOTE_TAGS.expense : NOTE_TAGS.income;
  var parts = parseNoteParts(input.value);

  box.innerHTML = tags.map(function(tag){
    var active = parts.indexOf(tag) !== -1;
    var cls = active
      ? 'px-2.5 py-1 rounded-full text-[11px] font-bold border transition bg-amber-500 text-slate-900 border-amber-600 shadow-xs'
      : 'px-2.5 py-1 rounded-full text-[11px] font-medium border transition bg-white text-slate-600 border-slate-200 hover:bg-slate-100';
    return '<button type="button" data-note-tag="' + escapeHtml(tag) + '" class="' + cls + '">' + escapeHtml(tag) + '</button>';
  }).join('');

  if (clearBtn){
    if (input.value.trim()) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }
}

function toggleNoteTag(tag){
  var input = document.getElementById('trip-note');
  if (!input) return;
  var parts = parseNoteParts(input.value);
  var idx = parts.indexOf(tag);
  if (idx === -1) parts.push(tag);
  else parts.splice(idx, 1);
  input.value = parts.join('、');
  renderNoteTags();
}

function clearNote(){
  var input = document.getElementById('trip-note');
  if (!input) return;
  if (!input.value) return;
  input.value = '';
  renderNoteTags();
  input.focus();
}

document.addEventListener('click', function(e){
  var btn = e.target.closest ? e.target.closest('[data-note-tag]') : null;
  if (!btn) return;
  toggleNoteTag(btn.dataset.noteTag);
});

function updateFareSignUI(){
  var btn = document.getElementById('fare-sign-toggle');
  if (!btn) return;
  if (fareSign === -1){
    btn.innerText = '支出';
    btn.className = 'text-[11px] px-2.5 py-1 rounded-full border font-bold transition bg-rose-50 text-rose-700 border-rose-300';
  } else {
    btn.innerText = '收入';
    btn.className = 'text-[11px] px-2.5 py-1 rounded-full border font-bold transition bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  renderNoteTags();
}

function toggleFareSign(){
  var input = document.getElementById('trip-fare');
  var v = parseFloat(input.value);
  if (!isNaN(v) && v < 0) input.value = Math.abs(v);
  fareSign = -fareSign;
  updateFareSignUI();
  calculateChange();
}

function getFareValue(){
  var v = parseFloat(document.getElementById('trip-fare').value);
  if (isNaN(v)) return 0;
  return Math.abs(v) * fareSign;
}

function clearFare(){
  document.getElementById('trip-fare').value = '';
  document.getElementById('trip-received').value = '';
  fareSign = 1;
  updateFareSignUI();
  calculateChange();
  document.getElementById('trip-fare').focus();
}
function clearReceived(){
  var r = document.getElementById('trip-received');
  r.value = '';
  calculateChange();
  r.focus();
}
function setReceived(amount){
  document.getElementById('trip-received').value = amount;
  calculateChange();
}

function calculateChange(){
  var fareEl     = document.getElementById('trip-fare');
  var receivedEl = document.getElementById('trip-received');
  var box        = document.getElementById('change-box');
  var labelEl    = document.getElementById('change-label');
  var iconEl     = document.getElementById('change-icon');
  var display    = document.getElementById('change-display');
  var payBlock   = document.getElementById('payment-block');
  var fareClearBtn = document.getElementById('fare-clear-btn');

  if (fareClearBtn){
    if (fareEl.value.trim()) fareClearBtn.classList.remove('hidden');
    else fareClearBtn.classList.add('hidden');
  }

  var rawFareVal = parseFloat(fareEl.value);
  if (!isNaN(rawFareVal) && rawFareVal < 0 && fareSign !== -1){ fareSign = -1; updateFareSignUI(); }

  var fare        = getFareValue();
  var receivedRaw = receivedEl.value;
  var received    = parseFloat(receivedRaw) || 0;

  if (fare < 0){
    if (payBlock) payBlock.style.opacity = '0.45';
    receivedEl.disabled = true;
    box.className = 'flex justify-between items-center bg-rose-50 px-3.5 py-3 rounded-xl border-2 border-rose-400 shadow-sm transition';
    labelEl.innerText = '支出記錄';
    labelEl.className = 'text-sm font-bold text-rose-700 flex items-center gap-1.5';
    iconEl.className = 'ico w-5 h-5 text-rose-600';
    iconEl.dataset.icon = 'alert-triangle';
    iconEl.dataset.done = '';
    hydrateIcons(iconEl.parentElement);
    display.innerText = '-$' + Math.abs(fare).toFixed(1);
    display.className = 'text-3xl font-black text-rose-600 font-mono tracking-tight debt-shadow';
    return;
  }

  if (payBlock) payBlock.style.opacity = '1';
  receivedEl.disabled = false;
  if (iconEl.dataset.icon !== 'coins'){
    iconEl.dataset.icon = 'coins';
    iconEl.dataset.done = '';
    hydrateIcons(iconEl.parentElement);
  }
  iconEl.className = 'ico w-5 h-5 text-amber-700';

  if (receivedRaw === '' || received <= 0){
    box.className = 'flex justify-between items-center bg-gradient-to-r px-3.5 py-3 rounded-xl border-2 border-amber-400 shadow-sm transition';
    labelEl.innerText = '應找零錢';
    labelEl.className = 'text-sm font-bold text-amber-900 flex items-center gap-1.5';
    display.innerText = '$0.0';
    display.className = 'text-3xl font-black text-emerald-800 font-mono tracking-tight change-shadow';
    return;
  }

  if (fare > 0 && received < fare){
    var debt = fare - received;
    box.className = 'flex justify-between items-center bg-rose-50 px-3.5 py-3 rounded-xl border-2 border-rose-400 shadow-sm transition';
    labelEl.innerText = '還欠車資';
    labelEl.className = 'text-sm font-bold text-rose-700 flex items-center gap-1.5';
    display.innerText = '$' + debt.toFixed(1);
    display.className = 'text-3xl font-black text-rose-600 font-mono tracking-tight debt-shadow';
  } else {
    var change = received - fare;
    box.className = 'flex justify-between items-center bg-gradient-to-r px-3.5 py-3 rounded-xl border-2 border-amber-400 shadow-sm transition';
    labelEl.innerText = '應找零錢';
    labelEl.className = 'text-sm font-bold text-amber-900 flex items-center gap-1.5';
    display.innerText = '$' + change.toFixed(1);
    display.className = 'text-3xl font-black text-emerald-800 font-mono tracking-tight change-shadow';
  }
}

function confirmFareInput(){
  var input = document.getElementById('trip-fare');
  var v = parseFloat(input.value);
  if (!isNaN(v) && v !== 0){
    if (v < 0) fareSign = -1;
    updateFareSignUI();
    input.value = Math.abs(v).toFixed(1).replace(/\.0$/, '');
  } else { input.value = ''; }
  calculateChange();
}
function confirmReceivedInput(){
  var input = document.getElementById('trip-received');
  var v = parseFloat(input.value);
  if (!isNaN(v) && v > 0) input.value = v.toFixed(1).replace(/\.0$/, '');
  else input.value = '';
  calculateChange();
}

function getTargetShiftKey(){
  if (manualShiftKey) return manualShiftKey;
  var activeKey = getActiveShiftKey();
  if (activeKey) return activeKey;
  return localDateStr(new Date());
}

function updateTripTimeChip(){
  var textEl = document.getElementById('trip-time-chip-text');
  var chip   = document.getElementById('trip-time-chip');
  if (!textEl || !chip) return;

  if (manualTripTime){
    textEl.innerText = manualTripTime;
    chip.className = 'text-[11px] px-2 py-0.5 rounded-full border font-bold transition bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 flex items-center gap-1 shrink-0';
  } else {
    var now = new Date();
    textEl.innerText = '現在 ' + pad2(now.getHours()) + ':' + pad2(now.getMinutes());
    chip.className = 'text-[11px] px-2 py-0.5 rounded-full border font-medium transition bg-white text-slate-600 border-slate-200 hover:bg-slate-100 flex items-center gap-1 shrink-0';
  }
}

function resolveTripTimestamp(hh, mm){
  var shiftKey = getTargetShiftKey();
  var cfg = shiftSettings[shiftKey];
  if (cfg) ensureShiftFields(cfg);

  var base = new Date(shiftKey + 'T00:00:00');
  if (isNaN(base.getTime())) return null;

  var d = new Date(base);
  d.setHours(hh, mm, 0, 0);
  var ts = d.getTime();

  if (!cfg || !cfg.startedAt) return ts;

  var start = cfg.startedAt;
  var end   = cfg.endedAt || Date.now();

  if (ts >= start && ts <= end) return ts;

  var d2 = new Date(base);
  d2.setDate(d2.getDate() + 1);
  d2.setHours(hh, mm, 0, 0);
  var ts2 = d2.getTime();
  if (ts2 >= start && ts2 <= end) return ts2;

  return null;
}

function openTripTimeModal(){
  var shiftKey = getTargetShiftKey();
  var cfg = shiftSettings[shiftKey];
  if (cfg) ensureShiftFields(cfg);

  var now = new Date();
  var currentVal = manualTripTime || (pad2(now.getHours()) + ':' + pad2(now.getMinutes()));

  var rangeText;
  if (cfg && cfg.startedAt){
    var s = new Date(cfg.startedAt);
    var startStr = pad2(s.getHours()) + ':' + pad2(s.getMinutes());
    if (cfg.endedAt){ var e = new Date(cfg.endedAt); rangeText = startStr + ' - ' + pad2(e.getHours()) + ':' + pad2(e.getMinutes()); }
    else { rangeText = startStr + ' - 工作中'; }
  } else { rangeText = '此更次尚未開工，時間不限'; }

  var wkDay = '';
  var dd = new Date(shiftKey + 'T12:00:00');
  if (!isNaN(dd.getTime())){ wkDay = dd.toLocaleDateString('zh-HK', { weekday:'short' }); }

  var html = '<div class="space-y-3">';
  html +=
    '<div class="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 space-y-1">' +
      '<div class="flex justify-between items-center">' +
        '<span class="text-[11px] font-semibold text-amber-800">所屬更次</span>' +
        '<span class="font-bold text-amber-900 font-mono text-xs">' + shiftKey + (wkDay ? ' <span class="text-[10px] text-amber-600 font-normal">' + wkDay + '</span>' : '') + '</span>' +
      '</div>' +
      '<div class="flex justify-between items-center pt-1 border-t border-amber-200/60">' +
        '<span class="text-[11px] text-amber-700">可用時間範圍</span>' +
        '<span class="text-xs text-amber-900 font-mono font-semibold">' + rangeText + '</span>' +
      '</div>' +
    '</div>';

  html +=
    '<div>' +
      '<label class="block text-xs font-semibold text-slate-600 mb-1">行程時間（小時：分鐘）</label>' +
      '<input type="time" id="trip-time-input" value="' + currentVal + '" ' +
        'class="w-full px-3 py-3 text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center">' +
    '</div>';

  html +=
    '<div class="grid grid-cols-4 gap-1.5">' +
      '<button type="button" onclick="setTripTimeQuickNow()" class="py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] transition border border-blue-200">現在</button>' +
      '<button type="button" onclick="setTripTimeQuick(-5)" class="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px] transition border border-slate-200">-5 分</button>' +
      '<button type="button" onclick="setTripTimeQuick(-15)" class="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px] transition border border-slate-200">-15 分</button>' +
      '<button type="button" onclick="setTripTimeQuick(-30)" class="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px] transition border border-slate-200">-30 分</button>' +
    '</div>';

  html += '<div id="trip-time-error" class="hidden text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-2 leading-relaxed"></div>';

  html +=
    '<p class="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5">' +
      '<span class="ico w-3.5 h-3.5 mt-0.5 shrink-0" data-icon="info"></span>' +
      '<span>時間必須落在上述更次範圍內。儲存後只影響這一筆紀錄；不設即為現在時間。</span>' +
    '</p>';
  html += '</div>';

  document.getElementById('modal-title').innerText = '設定行程時間';
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition">取消</button>' +
    '<button onclick="saveTripTime()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs transition">確定</button>';

  var m = document.getElementById('trip-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  hydrateIcons();
}

function setTripTimeQuickNow(){
  var input = document.getElementById('trip-time-input');
  if (!input) return;
  var now = new Date();
  input.value = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
  hideTripTimeError();
}

function setTripTimeQuick(deltaMin){
  var input = document.getElementById('trip-time-input');
  if (!input) return;
  var base;
  if (input.value){
    var parts = input.value.split(':');
    base = new Date();
    base.setHours(parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0, 0, 0);
  } else { base = new Date(); }
  base.setMinutes(base.getMinutes() + deltaMin);
  input.value = pad2(base.getHours()) + ':' + pad2(base.getMinutes());
  hideTripTimeError();
}

function showTripTimeError(msg){
  var el = document.getElementById('trip-time-error');
  if (!el) return;
  el.innerText = msg;
  el.classList.remove('hidden');
}
function hideTripTimeError(){
  var el = document.getElementById('trip-time-error');
  if (el) el.classList.add('hidden');
}

function saveTripTime(){
  var input = document.getElementById('trip-time-input');
  if (!input || !input.value){ showTripTimeError('請選擇時間'); return; }

  var parts = input.value.split(':');
  var hh = parseInt(parts[0], 10);
  var mm = parseInt(parts[1], 10);
  if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59){
    showTripTimeError('時間格式不正確');
    return;
  }

  var resolved = resolveTripTimestamp(hh, mm);
  if (resolved === null){
    var sk = getTargetShiftKey();
    var cfg = shiftSettings[sk];
    var rangeStr = '';
    if (cfg && cfg.startTime){ rangeStr = cfg.startTime + ' - ' + (cfg.endTime || '工作中'); }
    showTripTimeError('所選時間不在更次範圍內' + (rangeStr ? '（' + rangeStr + '）' : '') + '，請重新選擇。');
    return;
  }

  var now = new Date();
  if (hh === now.getHours() && mm === now.getMinutes()) manualTripTime = null;
  else manualTripTime = pad2(hh) + ':' + pad2(mm);

  closeModal();
  updateTripTimeChip();
  showToast(manualTripTime ? '行程時間已設為 ' + manualTripTime : '行程時間已重置為現在');
}

var tripSaving = false;

async function saveTrip(){
  // ---- 防重入（雙擊 / 連點） ----
  if (tripSaving) return;

  var fareInput     = document.getElementById('trip-fare');
  var receivedInput = document.getElementById('trip-received');
  var noteInput     = document.getElementById('trip-note');

  // ---- 開頭即快照：以「點保存那一刻」為記錄時間 ----
  var clickNow        = new Date();
  var snapFare        = getFareValue();
  var snapReceivedRaw = receivedInput.value;
  var snapNote        = noteInput.value.trim();
  var snapManualTime  = manualTripTime;

  if (isNaN(snapFare) || snapFare === 0){
    showToast('請輸入有效的車資金額！');
    fareInput.focus();
    return;
  }

  tripSaving = true;
  var saveBtn = document.getElementById('save-trip-btn') ||
                document.querySelector('[onclick="saveTrip()"]');
  setSaveBtnLoading(saveBtn, true);

  try {
    /* ============================================================
       步驟 1：阻塞式取得「當下位置」
       失敗時由使用者決定：用舊位置 / 不帶位置 / 取消保存
       ============================================================ */
    var tripLocation = null;
    showToast('正在取得位置...');

    try {
      tripLocation = await getLocationBestEffort();
      cachedLocation = {
        lat: tripLocation.lat, lng: tripLocation.lng,
        accuracy: tripLocation.accuracy, timestamp: tripLocation.timestamp
      };
      updateLocationChip();
    } catch (locErr){
      var reason = locationErrorText(locErr);
      var cached = buildTripLocation();

      if (cached){
        var ageSec = cached.timestamp
          ? Math.round((Date.now() - cached.timestamp) / 1000)
          : null;
        var useCached = confirm(
          '未能取得當下位置（' + reason + '）。\n\n' +
          '是否改用最近一次記錄的位置' +
          (ageSec !== null ? '（約 ' + ageSec + ' 秒前）' : '') + '？'
        );
        if (!useCached){ showToast('已取消保存'); return; }
        tripLocation = cached;
      } else {
        var saveAnyway = confirm(
          '未能取得位置（' + reason + '）。\n\n' +
          '仍要保存這筆記錄（不帶位置）嗎？'
        );
        if (!saveAnyway){ showToast('已取消保存'); return; }
      }
    }

    /* ============================================================
       步驟 2：寫入記錄
       ============================================================ */
    var isExpense = snapFare < 0;
    var received  = isExpense ? snapFare : (parseFloat(snapReceivedRaw) || snapFare);
    var changeVal = isExpense ? 0 : (received - snapFare);

    var cfg      = getCurrentSettings();
    var isManual = !!manualShiftKey;

    // 記錄時間：預設為點擊保存時刻；手動指定時間則用其解析結果
    var tripTimestamp = clickNow.getTime();
    if (snapManualTime){
      var tp = snapManualTime.split(':');
      var hh = parseInt(tp[0], 10);
      var mm = parseInt(tp[1], 10);
      var resolved = resolveTripTimestamp(hh, mm);
      if (resolved !== null) tripTimestamp = resolved;
    }

    var tripDateObj = new Date(tripTimestamp);
    var shiftDate   = isManual ? manualShiftKey : calcShiftDate(tripTimestamp, cfg);

    var newTrip = {
      id: 'trip_' + tripTimestamp + '_' + Math.floor(Math.random() * 1000),
      timestamp:  tripTimestamp,
      shiftDate:  shiftDate,
      dateStr:    toLocalISOString(tripDateObj),
      fare:       snapFare,
      type:       activeTripType,
      payment:    activePaymentMethod,
      received:   received,
      change:     changeVal,
      note:       snapNote,
      isExpense:  isExpense,
      location:   tripLocation   // ← 當下取得的真實位置
    };

    trips.push(newTrip);
    trips.sort(function(a, b){ return b.timestamp - a.timestamp; });
    localStorage.setItem('taxi_trips', JSON.stringify(trips));

    /* ============================================================
       步驟 3：清空表單、更新 UI
       ============================================================ */
    fareInput.value     = '';
    receivedInput.value = '';
    noteInput.value     = '';
    fareSign = 1;
    manualTripTime = null;
    updateTripTimeChip();
    updateFareSignUI();
    collapseNoteTags();
    calculateChange();

    var prefix = isManual ? '【補錄 ' + shiftDate + '】' : '';
    var payTag = isExpense ? '' : '[' + activePaymentMethod + '] ';
    var locTag = tripLocation ? '📍 ' : '';

    if (isExpense){
      showToast(prefix + locTag + '支出記錄已保存：-$' + Math.abs(snapFare).toFixed(1));
    } else if (changeVal < 0){
      showToast(prefix + locTag + payTag + '行程已保存，客戶尚欠 $' + Math.abs(changeVal).toFixed(1));
    } else {
      showToast(prefix + locTag + payTag + '行程已成功保存！');
    }

    updateStatsAndNet();

  } finally {
    tripSaving = false;
    setSaveBtnLoading(saveBtn, false);
  }
}

function renderTripList(){
  var container = document.getElementById('trip-list-container');
  if (!container) return;

  var keyword          = document.getElementById('search-keyword').value.toLowerCase();
  var onlyCurrentShift = document.getElementById('filter-current-shift').checked;
  var allowStreet      = document.getElementById('chk-type-street').checked;
  var allowUber        = document.getElementById('chk-type-uber').checked;
  var allowOther       = document.getElementById('chk-type-other').checked;
  var allowIncome      = document.getElementById('chk-flow-income').checked;
  var allowExpense     = document.getElementById('chk-flow-expense').checked;
  var allowCash    = document.getElementById('chk-pay-cash').checked;
  var allowOctopus = document.getElementById('chk-pay-octopus').checked;
  var allowPayOther= document.getElementById('chk-pay-other').checked;
  var lastShiftKey  = getLastShiftKey();

  var filtered = trips.filter(function(t){
    var matchKeyword = (t.note || '').toLowerCase().indexOf(keyword) !== -1 || t.fare.toString().indexOf(keyword) !== -1;
    var matchType = false;
    if (t.type === '街客' && allowStreet) matchType = true;
    else if (t.type === 'Uber' && allowUber) matchType = true;
    else if (t.type !== '街客' && t.type !== 'Uber' && allowOther) matchType = true;

    var fareNum   = parseFloat(t.fare) || 0;
    var isExpense = fareNum < 0;
    var matchFlow = (isExpense && allowExpense) || (!isExpense && allowIncome);

    var pay = t.payment || '現金';
    var matchPayment = false;
    if (pay === '現金' && allowCash) matchPayment = true;
    else if (pay === '八達通' && allowOctopus) matchPayment = true;
    else if (pay !== '現金' && pay !== '八達通' && allowPayOther) matchPayment = true;

    var matchShift = !onlyCurrentShift || (t.shiftDate === lastShiftKey);
    return matchKeyword && matchType && matchFlow && matchPayment && matchShift;
  });

  document.getElementById('trip-count-badge').innerText = '共 ' + filtered.length + ' 筆';

  if (filtered.length === 0){
    container.innerHTML =
      '<div class="bg-white rounded-2xl p-8 text-center border border-slate-100 text-slate-400 space-y-2">' +
        '<div class="ico w-10 h-10 mx-auto text-slate-300">' + ico('file-question','w-10 h-10') + '</div>' +
        '<p class="text-sm font-medium">沒有找到符合的記錄</p>' +
      '</div>';
    return;
  }

  container.innerHTML = filtered.map(function(t){
    var dateObj  = new Date(t.timestamp);
    var timeStr  = dateObj.toLocaleTimeString('zh-HK', { hour:'2-digit', minute:'2-digit', hour12: false });
    var dateStr  = dateObj.toLocaleDateString('zh-HK', { month:'2-digit', day:'2-digit' });

    var fareNum   = parseFloat(t.fare) || 0;
    var isExpense = fareNum < 0;
    var fareAbs   = Math.abs(fareNum);
    var fareText  = (isExpense ? '-$' : '$') + fareAbs;

    var typeCfg = getTripTypeConfig(t.type);
    var theme = TRIP_TYPE_THEME[typeCfg.color] || TRIP_TYPE_THEME.slate;
    var typeColor = theme.card + ' ' + theme.text;

    var urgentBadge = '';
    if (isExpense){
      urgentBadge = '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-300 font-bold flex items-center gap-0.5">' + ico('alert-triangle','w-2.5 h-2.5') + '支出</span>';
    } else if (typeof t.change === 'number' && t.change < 0){
      urgentBadge = '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-300 font-bold flex items-center gap-0.5">' + ico('alert-triangle','w-2.5 h-2.5') + '欠 $' + Math.abs(t.change).toFixed(1) + '</span>';
    }

    var payBadge = '';
    if (!isExpense){
      var payCfg = getPaymentMethodConfig(t.payment || '現金');
      var payTheme = TRIP_TYPE_THEME[payCfg.color] || TRIP_TYPE_THEME.slate;
      payBadge = '<span class="text-[10px] px-1.5 py-0.5 rounded-md border font-medium flex items-center gap-0.5 shrink-0 ' + payTheme.card + ' ' + payTheme.text + '">' + ico(payCfg.icon, 'w-2.5 h-2.5') + escapeHtml(payCfg.name) + '</span>';
    }

    var hasLocation = t.location && typeof t.location.lat === 'number';
    var locationBadge = hasLocation
      ? '<span class="text-[10px] px-1 py-0.5 rounded-md border font-medium flex items-center bg-blue-50 text-blue-700 border-blue-200 shrink-0" title="已記錄位置">' + ico('map-pin','w-2.5 h-2.5') + '</span>'
      : '';

    var cardBorder = isExpense ? 'border-rose-200' : (urgentBadge ? 'border-rose-200' : 'border-slate-100');

    var locationBtn = hasLocation
      ? '<button onclick="event.stopPropagation(); openTripLocationInMaps(\'' + t.id + '\')" class="p-1.5 text-slate-400 hover:text-blue-500 transition" title="查看位置">' + ico('map-pin','w-3.5 h-3.5') + '</button>'
      : '';

    return '' +
    '<div class="bg-white rounded-2xl border ' + cardBorder + ' shadow-sm">' +
      '<div class="p-3 flex items-start gap-2.5">' +
        '<div class="w-11 shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center py-1.5">' +
          '<span class="font-mono font-bold text-slate-800 text-[11px] leading-none">' + timeStr + '</span>' +
          '<span class="font-mono text-slate-400 text-[9px] leading-none mt-1">' + dateStr + '</span>' +
        '</div>' +
        '<div class="min-w-0 flex-1">' +
          '<div class="flex items-center gap-1.5 flex-wrap">' +
            '<span class="text-base font-black ' + (isExpense ? 'text-rose-600' : 'text-slate-900') + ' leading-tight tracking-tight">' + fareText + '</span>' +
            '<span class="text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ' + typeColor + '">' + escapeHtml(t.type) + '</span>' +
            urgentBadge +
          '</div>' +
          '<div class="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 min-w-0">' +
            payBadge + locationBadge +
            (t.note ? '<span class="truncate">' + escapeHtml(t.note) + '</span>' : '<span class="text-slate-300">無備注</span>') +
          '</div>' +
        '</div>' +
        '<div class="flex items-center shrink-0 -mr-1">' +
          locationBtn +
          '<button onclick="openDetailModal(\'' + t.id + '\')" class="p-1.5 text-slate-400 hover:text-amber-500 transition" title="詳情">' + ico('eye','w-3.5 h-3.5') + '</button>' +
          '<button onclick="openEditModal(\'' + t.id + '\')" class="p-1.5 text-slate-400 hover:text-blue-500 transition" title="編輯">' + ico('edit-3','w-3.5 h-3.5') + '</button>' +
          '<button onclick="deleteTrip(\'' + t.id + '\')" class="p-1.5 text-slate-400 hover:text-rose-500 transition" title="刪除">' + ico('trash-2','w-3.5 h-3.5') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}



function toggleManualInput(show){
  var wrap = document.getElementById('manual-input-wrap');
  if (!wrap) return;
  if (show === undefined) show = wrap.classList.contains('hidden');
  if (show){
    wrap.classList.remove('hidden');
    setTimeout(function(){
      var input = document.getElementById('amap-paste-input');
      if (input) input.focus();
    }, 50);
  } else {
    wrap.classList.add('hidden');
    hidePasteFallback();
  }
}

function showPasteFallback(input){
  var wrap = document.getElementById('paste-fallback-wrap');
  var ta   = document.getElementById('paste-fallback');
  if (!wrap || !ta) return;

  wrap.classList.remove('hidden');
  ta.value = '';
  setTimeout(function(){ ta.focus(); }, 50);

  if (!ta._bound){
    ta._bound = true;
    ta.addEventListener('paste', function(){
      setTimeout(function(){ consumeFallback(input, ta, wrap); }, 10);
    });
    ta.addEventListener('input', function(){
      consumeFallback(input, ta, wrap);
    });
  }
}

function consumeFallback(input, ta, wrap){
  var v = ta.value.trim();
  if (!v) return;
  input.value = v;
  ta.value = '';
  wrap.classList.add('hidden');
  applyAmapPaste();
}

function hidePasteFallback(){
  var wrap = document.getElementById('paste-fallback-wrap');
  var ta   = document.getElementById('paste-fallback');
  if (wrap) wrap.classList.add('hidden');
  if (ta) ta.value = '';
}

async function applyAmapPaste(rawText){
  var input = document.getElementById('amap-paste-input');
  var raw = rawText !== undefined
    ? String(rawText).trim()
    : (input ? input.value.trim() : '');

  if (!raw){
    showToast('請先貼上連結、座標，或輸入地名');
    if (input) input.focus();
    return;
  }

  showToast('正在解析...');

  try {
    var result = await resolveAmapPlace(raw);

    var latEl = document.getElementById('place-lat');
    var lngEl = document.getElementById('place-lng');
    if (latEl) latEl.value = result.lat.toFixed(6);
    if (lngEl) lngEl.value = result.lng.toFixed(6);

    var nameEl = document.getElementById('place-name');
    var nameFilled = false;
    if (nameEl && result.name && !nameEl.value.trim()){
      nameEl.value = result.name;
      nameFilled = true;
    }

    var addrEl = document.getElementById('place-address');
    var addrFilled = false;
    if (addrEl && result.address && !addrEl.value.trim()){
      addrEl.value = result.address;
      addrFilled = true;
    }

    var sourceText = { geocode: '地理編碼', expand: '短連結展開', shortlink: '連結解析', direct: '連結解析' }[result.source] || result.source;

    var parts = ['座標'];
    if (nameFilled) parts.push('名稱');
    if (addrFilled) parts.push('地址');
    showToast('已透過' + sourceText + '填入：' + parts.join('、'));

    /* ========== 修改：改用 addrEl 判斷是否需反向地理編碼補地址 ========== */
    if (addrEl && !addrEl.value.trim()){
      reverseGeocode(result.lat, result.lng, function(err, data){
        if (err) return;
        applyGeocodeResult(data);
      });
    }
  } catch (e) {
    showToast('解析失敗：' + (e.message || '未知錯誤'));
  }
}

/* ========== 修改：表單移除區域 / 分區 ========== */
/* ========== 修改：表單移除區域 / 分區，座標區加入「依座標解析地址」 ========== */
function openAddPlaceModal(){
  currentEditingPlaceId = null;
  _pendingPlaceAddr = null;

  var typeOptions = PLACE_TYPES.map(function(t){
    return '<option value="' + t + '">' + t + '</option>';
  }).join('');

  var html = '<div class="space-y-3 text-sm">' +
    '<button type="button" onclick="quickPasteAndParse()" id="quick-paste-btn" class="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-900 font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"><span class="ico w-5 h-5" data-icon="clipboard"></span><span id="quick-paste-btn-text">📋 一鍵貼上並解析</span></button>' +
    '<button type="button" onclick="toggleManualInput()" class="w-full text-center text-xs text-slate-500 hover:text-amber-600 underline transition py-1">或手動輸入連結、座標、地名</button>' +
    '<div id="manual-input-wrap" class="hidden space-y-2"><div class="flex gap-1.5"><input type="text" id="amap-paste-input" autocomplete="off" onfocus="this.value=\'\'" placeholder="貼上連結、座標，或輸入地名（如：香港国际机场）" class="flex-1 min-w-0 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"><button type="button" onclick="applyAmapPaste()" class="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-900 font-bold rounded-xl text-xs transition shrink-0">解析</button></div><div id="paste-fallback-wrap" class="hidden"><textarea id="paste-fallback" rows="2" autocomplete="off" placeholder="長按此處粘貼（系統菜單 → 粘貼）" class="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea><p class="text-[11px] text-blue-600 mt-1">粘貼後會自動解析；若無反應，請手動點上方「解析」。</p></div></div>' +
    '<button type="button" id="place-autofill-btn" onclick="autoFillPlaceByLocation()" class="w-full py-2.5 bg-blue-50 hover:bg-blue-100 active:scale-[0.98] text-blue-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-blue-200"><span class="ico w-3.5 h-3.5" data-icon="navigation"></span> 使用當前位置自動填寫</button>' +
    '<div><label class="block text-xs font-semibold text-slate-600 mb-1">地點名稱 *</label><input type="text" id="place-name" autocomplete="off" placeholder="例如：翠華餐廳（中環）" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"></div>' +
    '<div><label class="block text-xs font-semibold text-slate-600 mb-1">類型 *</label><select id="place-type" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2">' + typeOptions + '</select></div>' +
    '<div><label class="block text-xs font-semibold text-slate-600 mb-1">地址 (選填)</label><input type="text" id="place-address" autocomplete="off" placeholder="例如：中環威靈頓街15號" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2"><div id="place-address-preview" class="mt-1.5"></div></div>' +
    '<div><label class="block text-xs font-semibold text-slate-600 mb-1">備注 (選填)</label><input type="text" id="place-note" autocomplete="off" placeholder="例如：24小時、有停車位" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2"></div>' +
    '<div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">' +
      '<div class="flex justify-between items-center gap-2">' +
        '<span class="text-xs font-bold text-slate-700">座標（用於導航與附近排序）</span>' +
        '<div class="flex items-center gap-1.5 shrink-0">' +
          '<button type="button" id="place-regeo-btn" onclick="reverseGeocodePlaceCoords()" class="text-[11px] px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg transition flex items-center gap-1"><span class="ico w-3 h-3" data-icon="rotate-cw"></span> 依座標解析地址</button>' +
          '<button type="button" onclick="useCurrentLocationForPlace()" class="text-[11px] px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg transition flex items-center gap-1"><span class="ico w-3 h-3" data-icon="crosshair"></span> 只填座標</button>' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-2">' +
        '<div><label class="block text-[11px] font-semibold text-slate-500 mb-1">緯度 Lat</label><input type="number" id="place-lat" step="0.000001" inputmode="decimal" autocomplete="off" placeholder="22.xxxxxx" class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"></div>' +
        '<div><label class="block text-[11px] font-semibold text-slate-500 mb-1">經度 Lng</label><input type="number" id="place-lng" step="0.000001" inputmode="decimal" autocomplete="off" placeholder="114.xxxxxx" class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"></div>' +
      '</div>' +
      '<p class="text-[11px] text-slate-400 leading-relaxed">填入座標後，點「依座標解析地址」可自動反查地址；點列表的 <span class="ico w-3 h-3 align-middle" style="display:inline-flex;vertical-align:middle">' + ico('navigation','w-3 h-3') + '</span> 即用高德 App 導航（手機）。</p>' +
    '</div>' +
  '</div>';

  document.getElementById('modal-title').innerText = '新增收藏地點';
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition">取消</button>' +
    '<button onclick="savePlace()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs transition">保存</button>';

  var m = document.getElementById('trip-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  hydrateIcons();
}

/* 保留但加防禦：區域 / 分區 select 已不存在，不會再被呼叫 */
function onPlaceRegionChange(){
  var regionEl   = document.getElementById('place-region');
  var districtEl = document.getElementById('place-district');
  if (!regionEl || !districtEl) return;

  var region = regionEl.value;
  if (!region){
    districtEl.innerHTML = '<option value="">請先選區域</option>';
    return;
  }
  var districts = REGIONS[region] || [];
  districtEl.innerHTML = '<option value="">請選擇</option>' +
    districts.map(function(d){ return '<option value="' + d + '">' + d + '</option>'; }).join('');
}

function useCurrentLocationForPlace(){
  if (!navigator.geolocation){ showToast('此瀏覽器不支援定位功能'); return; }
  showToast('正在取得位置...');
  navigator.geolocation.getCurrentPosition(
    function(pos){
      var latEl = document.getElementById('place-lat');
      var lngEl = document.getElementById('place-lng');
      if (latEl) latEl.value = pos.coords.latitude.toFixed(6);
      if (lngEl) lngEl.value = pos.coords.longitude.toFixed(6);
      showToast('已填入當前位置座標');
    },
    function(err){ showToast('定位失敗：' + (err.message || '請檢查定位權限')); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

/* ========== 修改：自動填寫後不再要求「請確認區域／分區」 ========== */
function autoFillPlaceByLocation(){
  var btn = document.getElementById('place-autofill-btn');
  if (!navigator.geolocation){ showToast('此瀏覽器不支援定位功能'); return; }

  if (btn){
    btn.disabled = true;
    btn.classList.remove('bg-blue-50','hover:bg-blue-100','text-blue-700','border-blue-200');
    btn.classList.add('bg-blue-100','text-blue-600','border-blue-300','cursor-wait');
    btn.innerHTML = '<span class="ico w-3.5 h-3.5 animate-pulse">' + ico('loader','w-3.5 h-3.5') + '</span> 定位並解析地址中...';
  }

  showToast('正在取得位置...');

  navigator.geolocation.getCurrentPosition(
    function(pos){
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      var accuracy = pos.coords.accuracy || 0;

      var latEl = document.getElementById('place-lat');
      var lngEl = document.getElementById('place-lng');
      if (latEl) latEl.value = lat.toFixed(6);
      if (lngEl) lngEl.value = lng.toFixed(6);

      reverseGeocode(lat, lng, function(err, data){
        resetAutoFillButton();
        if (err){ showToast('已填入座標，但地址解析失敗：' + err); return; }
        var filled = applyGeocodeResult(data);
        if (filled) showToast('已自動填寫位置資訊（誤差約 ' + Math.round(accuracy) + ' m）');
        else showToast('已填入座標（誤差約 ' + Math.round(accuracy) + ' m）');
      });
    },
    function(err){ resetAutoFillButton(); showToast('定位失敗：' + (err.message || '請檢查定位權限')); },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function resetAutoFillButton(){
  var btn = document.getElementById('place-autofill-btn');
  if (!btn) return;
  btn.disabled = false;
  btn.classList.remove('bg-blue-100','text-blue-600','border-blue-300','cursor-wait');
  btn.classList.add('bg-blue-50','hover:bg-blue-100','text-blue-700','border-blue-200');
  btn.innerHTML = '<span class="ico w-3.5 h-3.5" data-icon="navigation"></span> 使用當前位置自動填寫';
  btn.querySelectorAll('[data-icon]').forEach(function(el){ el.dataset.done = ''; });
  hydrateIcons(btn);
}

function reverseGeocode(lat, lng, callback) {
  function fetchNominatimFallback(reasonMsg) {
    var nominatimUrl = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lng + '&accept-language=zh-HK,zh-TW,zh,en&zoom=18&addressdetails=1';
    var nomFinished = false;
    var nomTimer = setTimeout(function() {
      if (!nomFinished) {
        nomFinished = true;
        callback('所有地圖服務均失敗 (高德失敗: ' + reasonMsg + '，且 Nominatim 逾時)');
      }
    }, 10000);

    fetch(nominatimUrl, { method: 'GET', headers: { 'Accept': 'application/json' } })
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data) {
        if (nomFinished) return;
        nomFinished = true;
        clearTimeout(nomTimer);
        if (!data || !data.address) {
          callback('高德與 Nominatim 後備均無法解析地址');
          return;
        }
        var addr = data.address || {};
        var building = addr.building || addr.amenity || addr.building_name || addr.house_name || addr.office || '';
        var road = addr.road || addr.pedestrian || addr.footway || '';
        data.provider = 'nominatim';
        data.extracted_building = building;
        data.display_name = data.display_name;
        callback(null, data);
      })
      .catch(function(err) {
        if (nomFinished) return;
        nomFinished = true;
        clearTimeout(nomTimer);
        callback('高德失敗 (' + reasonMsg + ') 且 Nominatim 後備失敗: ' + (err && err.message ? err.message : '網絡錯誤'));
      });
  }

  var amapApiUrl = '/api/amap-regeo?lat=' + lat + '&lng=' + lng;
  var amapFinished = false;
  var amapTimer = setTimeout(function() {
    if (!amapFinished) {
      amapFinished = true;
      fetchNominatimFallback('高德請求逾時');
    }
  }, 10000);

  fetch(amapApiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      if (amapFinished) return;
      if (!data || !data.success) {
        amapFinished = true;
        clearTimeout(amapTimer);
        fetchNominatimFallback(data && data.error ? data.error : '高德解析失敗');
        return;
      }
      amapFinished = true;
      clearTimeout(amapTimer);
      var normalizedData = {
        provider: 'amap',
        display_name: data.formatted_address,
        address: {
          building: data.building,
          road: data.road,
          formatted_address: data.formatted_address
        },
        raw: data.raw
      };
      callback(null, normalizedData);
    })
    .catch(function(err) {
      if (amapFinished) return;
      amapFinished = true;
      clearTimeout(amapTimer);
      fetchNominatimFallback(err && err.message ? err.message : '高德網絡錯誤');
    });
}
/* =========================================================
   收藏地點：依座標反查地址（完整實作）
   ========================================================= */

/* 從 geocode 結果中取出最合適的地址文字（兼容高德 / Nominatim） */
function pickAddressText(data){
  if (!data) return '';
  var addr = data.address || {};
  return data.display_name
      || addr.formatted_address
      || [addr.road, addr.building, addr.district].filter(Boolean).join(' ')
      || '';
}

/* 統一填寫：支援「只在空時填」與「強制覆蓋」 */
function fillPlaceAddressFromGeocode(data, opts){
  opts = opts || {};
  var filled = false;
  var addr = data.address || {};

  var addrEl = document.getElementById('place-address');
  var text = pickAddressText(data);
  if (addrEl && text && (opts.overwrite || !addrEl.value.trim())){
    addrEl.value = text;
    filled = true;
  }

  var nameEl = document.getElementById('place-name');
  if (nameEl && (opts.overwriteName || !nameEl.value.trim())){
    var autoName = addr.amenity || addr.shop || addr.building || addr.tourism
                || addr.office || addr.road || '';
    if (autoName){ nameEl.value = autoName; filled = true; }
  }
  return filled;
}

/* 按鈕 loading 狀態 */
function setPlaceRegeoBtnLoading(btn, loading){
  if (!btn) return;
  if (loading){
    if (!btn.dataset.origHtml) btn.dataset.origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('opacity-60','cursor-wait');
    btn.innerHTML = '<span class="inline-flex items-center gap-1"><span class="ico w-3 h-3 animate-spin">' + ico('loader','w-3 h-3') + '</span>解析中…</span>';
  } else {
    if (btn.dataset.origHtml){
      btn.innerHTML = btn.dataset.origHtml;
      delete btn.dataset.origHtml;
    }
    btn.disabled = false;
    btn.classList.remove('opacity-60','cursor-wait');
    btn.querySelectorAll('[data-icon]').forEach(function(el){ delete el.dataset.done; });
    hydrateIcons(btn);
  }
}

/* 依當前表單座標重新反查地址
   opts.silent     : 靜默模式（編輯自動補全用），只填空、不覆蓋、不彈 Toast、不顯示預覽
   opts.overwrite  : 明確要求直接覆蓋（略過預覽）
*/
function reverseGeocodePlaceCoords(opts){
  opts = opts || {};
  var latEl  = document.getElementById('place-lat');
  var lngEl  = document.getElementById('place-lng');
  var addrEl = document.getElementById('place-address');
  if (!latEl || !lngEl) return;

  var lat = parseFloat(latEl.value);
  var lng = parseFloat(lngEl.value);

  if (isNaN(lat) || isNaN(lng)){
    if (!opts.silent) showToast('請先填入有效的緯度與經度');
    return;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180){
    if (!opts.silent) showToast('座標超出有效範圍');
    return;
  }

  var reqLat = lat, reqLng = lng;
  var btn = document.getElementById('place-regeo-btn');
  setPlaceRegeoBtnLoading(btn, true);
  if (!opts.silent) showToast('正在依座標解析地址...');

  reverseGeocode(lat, lng, function(err, data){
    setPlaceRegeoBtnLoading(btn, false);

    if (err){
      if (!opts.silent) showToast('地址解析失敗：' + err);
      return;
    }

    // 若等待期間表單座標已被改動，放棄這次結果
    var nowLat = parseFloat(latEl.value);
    var nowLng = parseFloat(lngEl.value);
    if (nowLat !== reqLat || nowLng !== reqLng){
      if (!opts.silent) showToast('座標已變更，請重新解析');
      return;
    }

    var text = pickAddressText(data);
    if (!text){
      if (!opts.silent) showToast('解析成功，但沒有可用的地址資訊');
      return;
    }

    var isEmpty = !(addrEl && addrEl.value.trim());

    // 空地址：直接填
    if (isEmpty){
      if (addrEl) addrEl.value = text;
      if (!opts.silent) showToast('已填入地址');
      return;
    }

    // silent 模式：不覆蓋已有地址
    if (opts.silent) return;

    // 明確要求直接覆蓋
    if (opts.overwrite){
      if (addrEl) addrEl.value = text;
      showToast('已更新地址');
      return;
    }

    // 地址非空：顯示預覽，讓使用者決定是否覆蓋
    showPlaceAddressPreview(text);
  });
}

/* 地址預覽條：套用 / 取消 */
function showPlaceAddressPreview(text){
  _pendingPlaceAddr = text;
  var wrap = document.getElementById('place-address-preview');
  if (!wrap) return;
  wrap.innerHTML =
    '<div class="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">' +
      '<div class="text-[11px] text-amber-800 font-semibold mb-1">解析到的新地址（可選擇是否套用）</div>' +
      '<div class="text-[11px] text-slate-700 mb-1.5 break-all leading-relaxed">' + escapeHtml(text) + '</div>' +
      '<div class="flex gap-1.5">' +
        '<button type="button" onclick="applyPendingPlaceAddr()" class="flex-1 py-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-md text-[11px] transition">套用</button>' +
        '<button type="button" onclick="cancelPendingPlaceAddr()" class="flex-1 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-md text-[11px] transition">取消</button>' +
      '</div>' +
    '</div>';
}

function applyPendingPlaceAddr(){
  if (_pendingPlaceAddr){
    var addrEl = document.getElementById('place-address');
    if (addrEl) addrEl.value = _pendingPlaceAddr;
    showToast('已更新地址');
  }
  cancelPendingPlaceAddr();
}

function cancelPendingPlaceAddr(){
  _pendingPlaceAddr = null;
  var wrap = document.getElementById('place-address-preview');
  if (wrap) wrap.innerHTML = '';
}
function matchDistrictFromAddress(addr){
  var hay = [
    addr.state || '', addr.state_district || '', addr.region || '',
    addr.city || '', addr.city_district || '', addr.county || '',
    addr.district || '', addr.suburb || '', addr.quarter || '',
    addr.neighbourhood || '', addr.road || '', addr.display_name || ''
  ].join(' ').toLowerCase();

  for (var district in DISTRICT_KEYWORDS){
    var keys = DISTRICT_KEYWORDS[district];
    for (var i = 0; i < keys.length; i++){
      if (hay.indexOf(keys[i].toLowerCase()) !== -1) return district;
    }
  }
  return null;
}

/* ========== 修改：不再自動填區域 / 分區，只填名稱與地址（只填空、不覆蓋） ========== */
function applyGeocodeResult(data){
  return fillPlaceAddressFromGeocode(data, { overwrite: false, overwriteName: false });
}


function openDetailModal(id){
  var t = trips.find(function(item){ return item.id === id; });
  if (!t) return;
  var dateObj = new Date(t.timestamp);

  var fareNum   = parseFloat(t.fare) || 0;
  var isExpense = fareNum < 0;
  var fareAbs   = Math.abs(fareNum);
  var fareText  = (isExpense ? '-$' : '$') + fareAbs;
  var fareCls   = isExpense ? 'font-bold text-rose-600' : 'font-bold text-amber-600';

  var payRows = '';
  if (!isExpense){
    var changeVal = typeof t.change === 'number' ? t.change : 0;
    var changeRow = changeVal >= 0
      ? '<div class="flex justify-between py-1 border-b border-slate-100"><span class="text-slate-500">找零</span><span class="font-medium">$' + changeVal + '</span></div>'
      : '<div class="flex justify-between py-1 border-b border-slate-100"><span class="text-slate-500">客戶欠款</span><span class="font-bold text-rose-600">$' + Math.abs(changeVal).toFixed(1) + '</span></div>';

    payRows =
      '<div class="flex justify-between py-1 border-b border-slate-100"><span class="text-slate-500">客戶付款</span><span class="font-medium">$' + t.received + '</span></div>' + changeRow;
  }

  var kindRow = isExpense
    ? '<div class="flex justify-between py-1 border-b border-slate-100"><span class="text-slate-500">性質</span><span class="font-bold text-rose-600">支出</span></div>'
    : '<div class="flex justify-between py-1 border-b border-slate-100"><span class="text-slate-500">性質</span><span class="font-medium text-emerald-700">收入</span></div>';

  var payMethodRow = '';
  if (!isExpense){
    var payCfg = getPaymentMethodConfig(t.payment || '現金');
    payMethodRow = '<div class="flex justify-between py-1 border-b border-slate-100">' +
      '<span class="text-slate-500">付款方式</span>' +
      '<span class="font-medium flex items-center gap-1">' + ico(payCfg.icon,'w-3.5 h-3.5') + escapeHtml(payCfg.name) + '</span></div>';
  }

  var hasLocation = t.location && typeof t.location.lat === 'number';
  var locationRow;
  if (hasLocation){
    var latStr = t.location.lat.toFixed(6);
    var lngStr = t.location.lng.toFixed(6);
    var accStr = t.location.accuracy ? '±' + Math.round(t.location.accuracy) + 'm' : '';
    locationRow =
      '<div class="py-1.5 border-b border-slate-100">' +
        '<div class="flex justify-between items-center mb-1">' +
          '<span class="text-slate-500">記錄位置</span>' +
          '<button onclick="openTripLocationInMaps(\'' + t.id + '\')" class="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">' +
            ico('navigation','w-3 h-3') + '查看地圖' +
          '</button>' +
        '</div>' +
        '<div class="text-[11px] text-slate-500 font-mono bg-slate-50 rounded px-2 py-1 text-center">' + latStr + ', ' + lngStr + (accStr ? ' <span class="text-slate-400">' + accStr + '</span>' : '') + '</div>' +
      '</div>';
  } else {
    locationRow =
      '<div class="flex justify-between py-1 border-b border-slate-100"><span class="text-slate-500">記錄位置</span><span class="font-medium text-slate-400">未記錄</span></div>';
  }

  document.getElementById('modal-title').innerText = '行程詳細內容';
  document.getElementById('modal-body').innerHTML =
    '<div class="space-y-2 text-sm">' +
      '<div class="flex justify-between py-1 border-b border-slate-100"><span class="text-slate-500">時間</span><span class="font-medium">' + dateObj.toLocaleString('zh-HK', { hour12: false }) + '</span></div>' +
      '<div class="flex justify-between py-1 border-b border-slate-100"><span class="text-slate-500">所屬更次</span><span class="font-medium font-mono">' + (t.shiftDate || '--') + '</span></div>' +
      kindRow +
      '<div class="flex justify-between py-1 border-b border-slate-100"><span class="text-slate-500">車資</span><span class="' + fareCls + '">' + fareText + '</span></div>' +
      '<div class="flex justify-between py-1 border-b border-slate-100"><span class="text-slate-500">類型</span><span class="font-medium">' + escapeHtml(t.type) + '</span></div>' +
      payMethodRow + payRows + locationRow +
      '<div class="flex justify-between py-1"><span class="text-slate-500">備注</span><span class="font-medium text-slate-700">' + (t.note ? escapeHtml(t.note) : '無') + '</span></div>' +
    '</div>';

  document.getElementById('modal-footer').innerHTML =
    (hasLocation
      ? '<button onclick="openTripLocationInMaps(\'' + t.id + '\')" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1">' + ico('navigation','w-3.5 h-3.5') + '位置</button>'
      : '') +
    '<button onclick="closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition">關閉</button>';

  var m = document.getElementById('trip-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  hydrateIcons();
}

function openEditModal(id){
  var t = trips.find(function(item){ return item.id === id; });
  if (!t) return;
  currentEditingId = id;

  var fareNum = parseFloat(t.fare) || 0;
  var isExp = fareNum < 0;

  var shiftCfg = null;
  if (t.shiftDate && shiftSettings[t.shiftDate]){ shiftCfg = shiftSettings[t.shiftDate]; ensureShiftFields(shiftCfg); }
  var shiftDateText = t.shiftDate || '--';
  var shiftTimeText = (shiftCfg && shiftCfg.startTime) ? (shiftCfg.startTime + ' - ' + (shiftCfg.endTime || '工作中')) : '未設定';

  var wkDay = '';
  if (t.shiftDate){
    var dd = new Date(t.shiftDate + 'T12:00:00');
    if (!isNaN(dd.getTime())) wkDay = dd.toLocaleDateString('zh-HK', { weekday:'short' });
  }

  var typeOptionsHtml = TRIP_TYPE_CONFIG.map(function(c){
    return '<option value="' + escapeHtml(c.name) + '"' + (t.type === c.name ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>';
  }).join('');
  if (getAllTripTypes().indexOf(t.type) === -1){
    typeOptionsHtml += '<option value="' + escapeHtml(t.type) + '" selected>' + escapeHtml(t.type) + '（舊）</option>';
  }

  var currentPay = t.payment || '現金';
  var payOptionsHtml = PAYMENT_METHOD_CONFIG.map(function(p){
    return '<option value="' + escapeHtml(p.name) + '"' + (currentPay === p.name ? ' selected' : '') + '>' + escapeHtml(p.name) + '</option>';
  }).join('');
  if (getAllPaymentMethods().indexOf(currentPay) === -1){
    payOptionsHtml += '<option value="' + escapeHtml(currentPay) + '" selected>' + escapeHtml(currentPay) + '（舊）</option>';
  }

  var tripTimeVal = '';
  var tDateObj = new Date(t.timestamp);
  if (!isNaN(tDateObj.getTime())) tripTimeVal = pad2(tDateObj.getHours()) + ':' + pad2(tDateObj.getMinutes());

  var hasLocation = t.location && typeof t.location.lat === 'number';
  var locationEditHtml;
  if (hasLocation){
    locationEditHtml =
      '<div>' +
        '<label class="block text-xs font-semibold text-slate-600 mb-1">記錄位置</label>' +
        '<div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">' +
          '<span class="text-[11px] text-slate-500 font-mono truncate">' + t.location.lat.toFixed(6) + ', ' + t.location.lng.toFixed(6) + '</span>' +
          '<button type="button" onclick="clearTripLocation(\'' + t.id + '\')" class="text-[11px] px-2 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-medium transition shrink-0">清除</button>' +
        '</div>' +
      '</div>';
  } else {
    locationEditHtml =
      '<div>' +
        '<label class="block text-xs font-semibold text-slate-600 mb-1">記錄位置</label>' +
        '<button type="button" onclick="attachTripLocation(\'' + t.id + '\')" class="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition border border-blue-200 flex items-center justify-center gap-1.5">' +
          ico('map-pin','w-3.5 h-3.5') + '加上當前位置' +
        '</button>' +
      '</div>';
  }

  document.getElementById('modal-title').innerText = '修改記錄';
  document.getElementById('modal-body').innerHTML =
    '<div class="space-y-3 text-sm">' +
      '<div class="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">' +
        '<div class="flex justify-between items-center">' +
          '<span class="text-[11px] font-semibold text-amber-800 flex items-center gap-1">' + ico('history','w-3.5 h-3.5') + '所屬更次</span>' +
          '<span class="font-bold text-amber-900 font-mono text-xs">' + shiftDateText + (wkDay ? ' <span class="text-[10px] text-amber-600 font-normal">' + wkDay + '</span>' : '') + '</span>' +
        '</div>' +
        '<div class="flex justify-between items-center mt-1 pt-1 border-t border-amber-200/60">' +
          '<span class="text-[11px] text-amber-700">時段</span>' +
          '<span class="text-xs text-amber-900 font-mono font-semibold">' + shiftTimeText + '</span>' +
        '</div>' +
      '</div>' +
      '<div><label class="block text-xs font-semibold text-slate-600 mb-1">行程時間</label>' +
        '<input type="time" id="edit-trip-time" value="' + tripTimeVal + '" ' +
          'class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 font-mono font-bold">' +
        '<p class="text-[11px] text-slate-400 mt-1">修改後會更新該筆記錄的時間（限該更次範圍內）。</p>' +
      '</div>' +
      '<div><label class="block text-xs font-semibold text-slate-600 mb-1">車資金額（負數＝支出）</label>' +
        '<input type="number" id="edit-fare" value="' + fareNum + '" step="0.5" inputmode="decimal" autocomplete="off" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 font-bold">' +
        '<p class="text-[11px] ' + (isExp ? 'text-rose-600' : 'text-slate-400') + ' mt-1">' + (isExp ? '目前為支出記錄（負數）' : '輸入負數可改為支出記錄') + '</p>' +
      '</div>' +
      '<div><label class="block text-xs font-semibold text-slate-600 mb-1">類型</label>' +
        '<select id="edit-type" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2">' + typeOptionsHtml + '</select>' +
      '</div>' +
      '<div><label class="block text-xs font-semibold text-slate-600 mb-1">付款方式</label>' +
        '<select id="edit-payment" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2">' + payOptionsHtml + '</select>' +
      '</div>' +
      '<div><label class="block text-xs font-semibold text-slate-600 mb-1">備注</label>' +
        '<input type="text" id="edit-note" value="' + escapeHtml(t.note || '') + '" autocomplete="off" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2">' +
      '</div>' + locationEditHtml +
    '</div>';

  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition">取消</button>' +
    '<button onclick="saveEditedTrip()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs transition">保存修改</button>';

  var m = document.getElementById('trip-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  hydrateIcons();
}

function clearTripLocation(id){
  var idx = trips.findIndex(function(item){ return item.id === id; });
  if (idx === -1) return;
  trips[idx].location = null;
  localStorage.setItem('taxi_trips', JSON.stringify(trips));
  showToast('已清除位置');
  openEditModal(id);
}

function attachTripLocation(id){
  var idx = trips.findIndex(function(item){ return item.id === id; });
  if (idx === -1) return;
  if (!navigator.geolocation){ showToast('此瀏覽器不支援定位功能'); return; }
  showToast('正在取得位置...');
  navigator.geolocation.getCurrentPosition(
    function(pos){
      trips[idx].location = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy || 0 };
      localStorage.setItem('taxi_trips', JSON.stringify(trips));
      showToast('已加上當前位置');
      openEditModal(id);
    },
    function(err){ showToast('定位失敗：' + (err.message || '請檢查定位權限')); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function saveEditedTrip(){
  var fareRaw = document.getElementById('edit-fare').value;
  var fare = parseFloat(fareRaw);
  var type = document.getElementById('edit-type').value;
  var payment = document.getElementById('edit-payment').value;
  var note = document.getElementById('edit-note').value.trim();
  var timeInput = document.getElementById('edit-trip-time');

  if (isNaN(fare) || fare === 0){ showToast('請輸入有效車資（可為負數）！'); return; }

  var index = trips.findIndex(function(item){ return item.id === currentEditingId; });
  if (index === -1) return;

  var targetTrip = trips[index];

  if (timeInput && timeInput.value){
    var tp = timeInput.value.split(':');
    var hh = parseInt(tp[0], 10);
    var mm = parseInt(tp[1], 10);
    if (!isNaN(hh) && !isNaN(mm)){
      var shiftKey = targetTrip.shiftDate || getLastShiftKey();
      var cfgS = shiftSettings[shiftKey];
      if (cfgS) ensureShiftFields(cfgS);

      var base = new Date(shiftKey + 'T00:00:00');
      if (!isNaN(base.getTime())){
        var d = new Date(base);
        d.setHours(hh, mm, 0, 0);
        var ts = d.getTime();

        var valid = true;
        if (cfgS && cfgS.startedAt){
          var endMs = cfgS.endedAt || Date.now();
          if (ts < cfgS.startedAt || ts > endMs){
            var d2 = new Date(base);
            d2.setDate(d2.getDate() + 1);
            d2.setHours(hh, mm, 0, 0);
            var ts2 = d2.getTime();
            if (ts2 >= cfgS.startedAt && ts2 <= endMs) ts = ts2;
            else valid = false;
          }
        }
        if (!valid){ showToast('所選時間不在該更次範圍內，請重新選擇'); return; }
        targetTrip.timestamp = ts;
        targetTrip.dateStr = toLocalISOString(new Date(ts));
      }
    }
  }

  var isExpense = fare < 0;
  targetTrip.fare      = fare;
  targetTrip.type      = type;
  targetTrip.payment   = payment;
  targetTrip.note      = note;
  targetTrip.isExpense = isExpense;

  if (isExpense){
    targetTrip.received = fare;
    targetTrip.change   = 0;
  } else {
    var rec = parseFloat(targetTrip.received);
    if (isNaN(rec) || rec === 0) rec = fare;
    targetTrip.received = rec;
    targetTrip.change   = rec - fare;
  }

  trips.sort(function(a, b){ return b.timestamp - a.timestamp; });
  localStorage.setItem('taxi_trips', JSON.stringify(trips));
  closeModal();
  renderTripList();
  updateStatsAndNet();
  showToast('行程已更新！');
}

function deleteTrip(id){
  if (confirm('確定要刪除這筆記錄嗎？')){
    trips = trips.filter(function(item){ return item.id !== id; });
    localStorage.setItem('taxi_trips', JSON.stringify(trips));
    renderTripList();
    updateStatsAndNet();
    showToast('記錄已刪除');
  }
}

function closeModal(){
  var m = document.getElementById('trip-modal');
  m.classList.add('hidden');
  m.classList.remove('flex');
  currentEditingId = null;
  currentEditingPlaceId = null;
  shiftTimeMode    = 'quick';
  hidePasteFallback();
}

function openShiftHistoryModal(){
  var keys = Object.keys(shiftSettings).sort().reverse();
  var lastKey = getLastShiftKey();

  var html = '<div class="space-y-2 max-h-80 overflow-y-auto pr-1">';
  if (!keys.length){
    html += '<p class="text-center text-slate-400 text-sm py-6">暫無更次記錄</p>';
  } else {
    keys.forEach(function(key){
      var fin = getShiftFinance(key);
      var cfg = shiftSettings[key];
      if (cfg) ensureShiftFields(cfg);

      var km = getShiftMileage(cfg);
      var duration = getShiftDuration(cfg);
      var fuelCount = (cfg.fuelEntries || []).length;
      var isLast = (key === lastKey);

      var timeRangeText;
      if (!cfg || !cfg.startedAt) timeRangeText = '未開工';
      else if (!cfg.endedAt) timeRangeText = '工作中 ' + formatDuration(getWorkedMs(cfg));
      else timeRangeText = (cfg.startTime || '--') + ' - ' + (cfg.endTime || '--');

      var unpaidTotal = fin.list.reduce(function(s,t){
        var c = typeof t.change === 'number' ? t.change : 0;
        return s + (c < 0 ? -c : 0);
      }, 0);

      var profitPerKm = (km && km > 0) ? (fin.profit / km) : null;
      var profitPerHour = (duration && duration > 0) ? (fin.profit / duration) : null;
      var fuelPerKm = (km && km > 0) ? (fin.fuel / km) : null;

      var noteHtml = (cfg && cfg.note)
        ? '<div class="mt-1 pt-1 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed flex items-start gap-1">' +
            '<span class="ico w-3 h-3 text-amber-500 mt-0.5 shrink-0">' + ico('edit-3','w-3 h-3') + '</span>' +
            '<span class="truncate">' + escapeHtml(cfg.note) + '</span>' +
          '</div>'
        : '';

      html +=
        '<div class="border ' + (isLast ? 'border-amber-400 bg-amber-50/60' : 'border-slate-200 bg-white') + ' rounded-xl p-3">' +
          '<div class="flex justify-between items-center mb-1.5 gap-2">' +
            '<span class="font-bold text-sm text-slate-800 min-w-0 truncate">' + key +
              (isLast ? ' <span class="text-[10px] text-amber-700 font-medium ml-1">最後一更</span>' : '') +
            '</span>' +
            '<div class="flex items-center gap-1.5 shrink-0">' +
              '<span class="text-[11px] text-slate-500 font-mono">' + timeRangeText + '</span>' +
              '<button type="button" onclick="event.stopPropagation(); openShiftEditModal(\'' + key + '\')" class="p-1 text-slate-300 hover:text-blue-500 transition" title="編輯此更次">' + ico('edit-3','w-3.5 h-3.5') + '</button>' +
              '<button type="button" onclick="event.stopPropagation(); deleteShift(\'' + key + '\')" class="p-1 -mr-1 text-slate-300 hover:text-rose-500 transition" title="刪除此更次">' + ico('trash-2','w-3.5 h-3.5') + '</button>' +
            '</div>' +
          '</div>' +
          noteHtml +
          '<div class="grid grid-cols-2 gap-y-1 text-[11px] mt-1.5">' +
            '<span class="text-slate-500">營業額：<b class="text-emerald-700">$' + fin.gross.toFixed(1) + '</b></span>' +
            '<span class="text-slate-500">行程：<b class="text-slate-700">' + fin.list.length + ' 筆' +
              (fin.incomeCount + fin.expenseCount > 0 ? ' <span class="text-slate-400">(收 ' + fin.incomeCount + ' / 支 ' + fin.expenseCount + ')</span>' : '') +
            '</b></span>' +
            '<span class="text-slate-500">租車：<b class="text-rose-600">$' + fin.rental.toFixed(1) + '</b></span>' +
            '<span class="text-slate-500">油費：<b class="text-rose-600">$' + fin.fuel.toFixed(1) + '</b>' + (fuelCount > 1 ? ' <span class="text-slate-400">(' + fuelCount + '筆)</span>' : '') + '</span>' +
            '<span class="text-slate-500">行程支出：<b class="text-rose-600">$' + fin.expenseTrip.toFixed(1) + '</b></span>' +
            '<span class="text-slate-500">總成本：<b class="text-rose-600">$' + fin.totalCost.toFixed(1) + '</b></span>' +
            '<span class="text-slate-500">里程：<b class="text-slate-700">' + (km !== null ? km.toFixed(1) + ' km' : '未填') + '</b></span>' +
            '<span class="text-slate-500">時長：<b class="text-slate-700">' + (duration !== null ? duration.toFixed(1) + ' 小時' : '未設定') + '</b></span>' +
            '<span class="text-slate-500">每公里油費：<b class="text-rose-600">' + (fuelPerKm !== null ? '$' + fuelPerKm.toFixed(2) + '/km' : '--') + '</b></span>' +
            '<span class="text-slate-500">每公里成本：<b class="text-rose-600">' + (km && km > 0 ? '$' + (fin.totalCost / km).toFixed(2) + '/km' : '--') + '</b></span>' +
          '</div>' +
          (unpaidTotal > 0 ? '<div class="mt-1 pt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">' + ico('alert-triangle','w-3 h-3') + '客戶未收足總額 $' + unpaidTotal.toFixed(1) + '</div>' : '') +
          '<div class="mt-1.5 pt-1.5 border-t border-slate-100 flex justify-between text-[11px]">' +
            '<span class="text-slate-500">淨利（營業額 - 總成本）' + (profitPerKm !== null ? ' <span class="text-slate-400">（$' + profitPerKm.toFixed(2) + '/km）</span>' : '') + '</span>' +
            '<span class="font-bold ' + (fin.profit >= 0 ? 'text-emerald-700' : 'text-rose-600') + '">$' + fin.profit.toFixed(1) + '</span>' +
          '</div>' +
          (profitPerHour !== null ? '<div class="mt-1 text-[11px] text-right text-slate-500">時薪：<b class="' + (profitPerHour >= 0 ? 'text-emerald-700' : 'text-rose-600') + ' font-mono">$' + profitPerHour.toFixed(2) + ' / 小時</b></div>' : '') +
        '</div>';
    });
  }
  html += '</div>';

  document.getElementById('modal-title').innerText = '歷史更次設定';
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition">關閉</button>';

  var m = document.getElementById('trip-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  hydrateIcons();
}

function openShiftEditModal(key){
  var cfg = shiftSettings[key];
  if (!cfg){ showToast('此更次已不存在'); openShiftHistoryModal(); return; }
  ensureShiftFields(cfg);

  var wkDay = '';
  var dd = new Date(key + 'T12:00:00');
  if (!isNaN(dd.getTime())) wkDay = dd.toLocaleDateString('zh-HK', { weekday:'long' });

  var startTimeStr = '';
  var endTimeStr   = '';
  if (cfg.startedAt){ var s = new Date(cfg.startedAt); startTimeStr = pad2(s.getHours()) + ':' + pad2(s.getMinutes()); }
  if (cfg.endedAt){ var e = new Date(cfg.endedAt); endTimeStr = pad2(e.getHours()) + ':' + pad2(e.getMinutes()); }

  var fuelListHtml = '';
  if (!cfg.fuelEntries || cfg.fuelEntries.length === 0){
    fuelListHtml = '<p class="text-[11px] text-slate-400 text-center py-3">尚無加油記錄</p>';
  } else {
    fuelListHtml = '<div class="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">';
    cfg.fuelEntries.forEach(function(e){
      fuelListHtml +=
        '<div class="flex justify-between items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 gap-2">' +
          '<div class="min-w-0 flex-1">' +
            '<div class="text-xs font-bold text-slate-800">$' + (parseFloat(e.amount)||0).toFixed(1) +
              (e.unitPrice ? ' <span class="text-[10px] text-slate-400 font-normal font-mono">@ $' + parseFloat(e.unitPrice).toFixed(2) + '/L</span>' : '') +
            '</div>' +
            (e.station ? '<div class="text-[10px] text-slate-500 truncate mt-0.5">' + escapeHtml(e.station) + '</div>' : '') +
          '</div>' +
          '<button type="button" onclick="deleteFuelInline(\'' + key + '\',\'' + e.id + '\')" class="p-1 text-slate-300 hover:text-rose-500 transition shrink-0">' + ico('trash-2','w-3.5 h-3.5') + '</button>' +
        '</div>';
    });
    fuelListHtml += '</div>';
  }

  document.getElementById('modal-title').innerText = '修改歷史更次';
  document.getElementById('modal-body').innerHTML =
    '<div class="space-y-3 text-sm">' +
      '<div class="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex justify-between items-center">' +
        '<span class="text-[11px] font-semibold text-amber-800">更次日期</span>' +
        '<span class="font-bold text-amber-900 font-mono text-xs">' + key + (wkDay ? ' <span class="text-[10px] text-amber-600 font-normal">' + wkDay + '</span>' : '') + '</span>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-2">' +
        '<div><label class="block text-xs font-semibold text-slate-600 mb-1">開工時間</label>' +
          '<input type="time" id="edit-shift-start" value="' + startTimeStr + '" class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono">' +
        '</div>' +
        '<div><label class="block text-xs font-semibold text-slate-600 mb-1">收工時間</label>' +
          '<input type="time" id="edit-shift-end" value="' + endTimeStr + '" class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono">' +
        '</div>' +
      '</div>' +
      '<p class="text-[11px] text-slate-400 leading-relaxed">手動修改時間會保留更次日期，只改時分。</p>' +
      '<div><label class="block text-xs font-semibold text-slate-600 mb-1">租車費 (HKD)</label>' +
        '<input type="number" id="edit-shift-rental" step="1" inputmode="decimal" value="' + (parseFloat(cfg.rental) || 0) + '" class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold">' +
      '</div>' +
      '<div><label class="block text-xs font-semibold text-slate-600 mb-1">更次備註 (選填)</label>' +
        '<input type="text" id="edit-shift-note" value="' + escapeHtml(cfg.note || '') + '" autocomplete="off" placeholder="例如：早更、紅日、雨天..." class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500">' +
      '</div>' +
      '<div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">' +
        '<div class="text-xs font-bold text-slate-700">行駛里程</div>' +
        '<div class="grid grid-cols-2 gap-2">' +
          '<div><label class="block text-[11px] font-semibold text-slate-500 mb-1">開始咪錶 (km)</label>' +
            '<input type="number" id="edit-shift-mileage-start" step="0.1" inputmode="decimal" value="' + (cfg.mileage && cfg.mileage.start != null ? cfg.mileage.start : '') + '" class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono">' +
          '</div>' +
          '<div><label class="block text-[11px] font-semibold text-slate-500 mb-1">結束咪錶 (km)</label>' +
            '<input type="number" id="edit-shift-mileage-end" step="0.1" inputmode="decimal" value="' + (cfg.mileage && cfg.mileage.end != null ? cfg.mileage.end : '') + '" class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono">' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">' +
        '<div class="flex justify-between items-center">' +
          '<span class="text-xs font-bold text-slate-700">加油記錄</span>' +
          '<button type="button" onclick="showAddFuelInline(\'' + key + '\')" class="text-[11px] px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition">+ 加入</button>' +
        '</div>' +
        fuelListHtml +
        '<div id="add-fuel-inline-panel" class="hidden mt-2 p-2.5 bg-white border border-amber-200 rounded-lg space-y-1.5">' +
          '<input type="number" id="inline-fuel-amount" step="1" inputmode="decimal" placeholder="加油金額 (HKD)" class="w-full px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold">' +
          '<input type="number" id="inline-fuel-price" step="0.1" inputmode="decimal" placeholder="油價 HKD/L（選填）" class="w-full px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono">' +
          '<input type="text" id="inline-fuel-station" autocomplete="off" placeholder="地點（選填）" class="w-full px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">' +
          '<div class="flex gap-1.5 pt-0.5">' +
            '<button type="button" onclick="hideAddFuelInline()" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg text-xs transition">取消</button>' +
            '<button type="button" onclick="confirmAddFuelInline(\'' + key + '\')" class="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg text-xs transition">確認加入</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('modal-footer').innerHTML =
    '<button onclick="openShiftHistoryModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition">返回列表</button>' +
    '<button onclick="saveShiftEdit(\'' + key + '\')" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs transition">保存修改</button>';

  var m = document.getElementById('trip-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  hydrateIcons();
}

function readShiftEditForm(key){
  var cfg = shiftSettings[key];
  if (!cfg) return null;

  var startEl = document.getElementById('edit-shift-start');
  var endEl   = document.getElementById('edit-shift-end');
  var rentEl  = document.getElementById('edit-shift-rental');
  var noteEl  = document.getElementById('edit-shift-note');
  var msEl    = document.getElementById('edit-shift-mileage-start');
  var meEl    = document.getElementById('edit-shift-mileage-end');

  if (!startEl) return cfg;

  var baseDate = new Date(key + 'T00:00:00');

  var sVal = startEl.value;
  if (sVal){
    var sParts = sVal.split(':');
    var sD = new Date(baseDate);
    sD.setHours(parseInt(sParts[0], 10), parseInt(sParts[1], 10), 0, 0);
    cfg.startedAt = sD.getTime();
    cfg.startTime = sVal;
  } else { cfg.startedAt = null; cfg.startTime = ''; }

  var eVal = endEl.value;
  if (eVal){
    var eParts = eVal.split(':');
    var eD = new Date(baseDate);
    eD.setHours(parseInt(eParts[0], 10), parseInt(eParts[1], 10), 0, 0);
    if (cfg.startedAt && eD.getTime() <= cfg.startedAt) eD.setDate(eD.getDate() + 1);
    cfg.endedAt = eD.getTime();
    cfg.endTime = eVal;
  } else { cfg.endedAt = null; cfg.endTime = ''; }

  cfg.rental = parseFloat(rentEl.value) || 0;
  if (noteEl) cfg.note = noteEl.value.trim();

  var msVal = msEl.value === '' ? null : parseFloat(msEl.value);
  var meVal = meEl.value === '' ? null : parseFloat(meEl.value);
  cfg.mileage = {
    start: (msVal === null || isNaN(msVal)) ? null : msVal,
    end:   (meVal === null || isNaN(meVal)) ? null : meVal
  };

  return cfg;
}

function saveShiftEdit(key){
  var cfg = readShiftEditForm(key);
  if (!cfg){ showToast('更次不存在'); return; }

  shiftSettings[key] = cfg;
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  renderTripList();
  updateStatsAndNet();
  initSettingsForm();
  updateHeaderWorked();

  showToast('更次 ' + key + ' 已更新');
  openShiftHistoryModal();
}

function showAddFuelInline(key){
  var panel = document.getElementById('add-fuel-inline-panel');
  if (!panel) return;
  panel.classList.remove('hidden');
  setTimeout(function(){ var el = document.getElementById('inline-fuel-amount'); if (el) el.focus(); }, 50);
}

function hideAddFuelInline(){
  var panel = document.getElementById('add-fuel-inline-panel');
  if (!panel) return;
  panel.classList.add('hidden');
  var amountEl  = document.getElementById('inline-fuel-amount');
  var priceEl   = document.getElementById('inline-fuel-price');
  var stationEl = document.getElementById('inline-fuel-station');
  if (amountEl)  amountEl.value  = '';
  if (priceEl)   priceEl.value   = '';
  if (stationEl) stationEl.value = '';
}

function confirmAddFuelInline(key){
  var amountEl  = document.getElementById('inline-fuel-amount');
  var priceEl   = document.getElementById('inline-fuel-price');
  var stationEl = document.getElementById('inline-fuel-station');
  if (!amountEl) return;

  var amount = parseFloat(amountEl.value);
  if (isNaN(amount) || amount <= 0){ showToast('請輸入有效金額'); amountEl.focus(); return; }

  var cfg = readShiftEditForm(key);
  if (!cfg){ showToast('更次不存在'); return; }

  var unitPrice = priceEl.value.trim() ? parseFloat(priceEl.value) : null;
  if (isNaN(unitPrice) || unitPrice <= 0) unitPrice = null;

  var station = stationEl.value.trim();
  var liters  = (unitPrice !== null) ? (amount / unitPrice) : null;

  if (!Array.isArray(cfg.fuelEntries)) cfg.fuelEntries = [];
  cfg.fuelEntries.push({
    id: 'fuel_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    amount: amount, unitPrice: unitPrice, liters: liters,
    station: station, timestamp: Date.now()
  });

  shiftSettings[key] = cfg;
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  renderTripList();
  updateStatsAndNet();
  initSettingsForm();

  var msg = '已加入加油 $' + amount;
  if (unitPrice !== null && liters !== null) msg += '（' + liters.toFixed(2) + ' L）';
  showToast(msg);
  openShiftEditModal(key);
}

function deleteFuelInline(key, id){
  var cfg = shiftSettings[key];
  if (!cfg){ showToast('更次不存在'); return; }
  if (!confirm('確定要刪除這筆加油記錄嗎？')) return;

  readShiftEditForm(key);
  cfg.fuelEntries = (cfg.fuelEntries || []).filter(function(e){ return e.id !== id; });
  shiftSettings[key] = cfg;
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  renderTripList();
  updateStatsAndNet();
  initSettingsForm();

  showToast('已刪除加油記錄');
  openShiftEditModal(key);
}

function deleteShift(key){
  var cfg  = shiftSettings[key];
  var list = trips.filter(function(t){ return t.shiftDate === key; });
  var isActive = (key === getActiveShiftKey());
  var warnActive = isActive ? '⚠️ 這是「進行中」的更次（尚未收工）。\n\n' : '';

  var confirmMsg =
    warnActive + '確定要刪除更次「' + key + '」嗎？\n\n' +
    '將一併刪除：\n' +
    '• ' + list.length + ' 筆行程紀錄\n' +
    '• 該更次設定（含租車費、油費、里程、時間、備註）\n\n' +
    '此操作可於「數據管理」按「撤銷」還原。';

  if (!confirm(confirmMsg)) return;

  lastDeletedTrips = list.slice();
  lastDeletedShiftSettings = {};
  if (cfg) lastDeletedShiftSettings[key] = JSON.parse(JSON.stringify(cfg));

  var tripIdSet = {};
  list.forEach(function(t){ tripIdSet[t.id] = true; });
  trips = trips.filter(function(t){ return !tripIdSet[t.id]; });

  delete shiftSettings[key];

  if (manualShiftKey === key){ manualShiftKey = null; manualTripTime = null; }

  localStorage.setItem('taxi_trips', JSON.stringify(trips));
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  renderTripList();
  updateStatsAndNet();
  initSettingsForm();
  updateHeaderWorked();
  updateTripTimeChip();

  var bannerText = '已刪除更次 ' + key + '（' + list.length + ' 筆）';
  showUndoBanner(bannerText);
  showToast(bannerText);

  var remaining = Object.keys(shiftSettings);
  if (remaining.length > 0) openShiftHistoryModal();
  else closeModal();
}

function calcFuelLiters(){
  var amountEl = document.getElementById('fuel-add-amount');
  var priceEl  = document.getElementById('fuel-add-price');
  var el       = document.getElementById('fuel-add-liters');
  if (!el || !amountEl || !priceEl) return;

  var amount = parseFloat(amountEl.value) || 0;
  var price  = parseFloat(priceEl.value)  || 0;

  if (amount > 0 && price > 0){
    el.innerText = (amount / price).toFixed(2) + ' L';
    el.className = 'font-bold text-emerald-700 font-mono';
  } else {
    el.innerText = '-- L';
    el.className = 'font-bold text-slate-400 font-mono';
  }
}

function openAddFuelModal(){
  var prefs = rebuildFuelPrefsFromHistory();
  var lastPrice   = (prefs.lastUnitPrice !== null && prefs.lastUnitPrice !== undefined) ? parseFloat(prefs.lastUnitPrice) : null;
  var lastStation = prefs.lastStation || '';

  var priceQuick = (prefs.priceHistory || []).filter(function(p){ return Math.abs(parseFloat(p) - (lastPrice || -1)) > 0.0001; }).slice(0, 5);
  var stationQuick = (prefs.stationHistory || []).filter(function(s){ return s !== lastStation; }).slice(0, 3);

  var html = '<div class="space-y-3">';

  html += '<div>' +
    '<label class="block text-xs font-semibold text-slate-600 mb-1">本次加油金額 (HKD)</label>' +
    '<div class="relative">' +
      '<span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">$</span>' +
      '<input type="number" id="fuel-add-amount" step="1" inputmode="decimal" autocomplete="off" placeholder="0" oninput="calcFuelLiters()" class="w-full pl-8 pr-3 py-3 text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500">' +
    '</div>' +
    '<div class="grid grid-cols-5 gap-1.5 mt-2">' +
      [100,200,300,500,600].map(function(v){
        return '<button type="button" data-fuel-quick="amount" data-val="' + v + '" class="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition">' + v + '</button>';
      }).join('') +
    '</div>' +
  '</div>';

  var priceLabelExtra = (lastPrice !== null)
    ? '<button type="button" data-fuel-quick="price" data-val="' + lastPrice + '" class="text-[11px] text-amber-700 hover:text-amber-800 font-medium underline">最近 $' + lastPrice.toFixed(2) + '</button>'
    : '';

  html += '<div>' +
    '<div class="flex justify-between items-center mb-1">' +
      '<label class="block text-xs font-semibold text-slate-600">油價 (HKD/L) <span class="text-slate-400 font-normal">(選填)</span></label>' + priceLabelExtra +
    '</div>' +
    '<div class="relative">' +
      '<span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">$</span>' +
      '<input type="number" id="fuel-add-price" step="0.1" inputmode="decimal" autocomplete="off" placeholder="0.00" value="' + (lastPrice !== null ? lastPrice : '') + '" oninput="calcFuelLiters()" class="w-full pl-8 pr-3 py-2.5 text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500">' +
    '</div>' +
    (priceQuick.length ?
      '<div class="flex flex-wrap gap-1.5 mt-2">' +
        priceQuick.map(function(p){
          return '<button type="button" data-fuel-quick="price" data-val="' + escapeHtml(p) + '" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md text-[11px] transition font-mono">$' + escapeHtml(p) + '</button>';
        }).join('') +
      '</div>' : '') +
  '</div>';

  var stationLabelExtra = lastStation
    ? '<button type="button" data-fuel-quick="station" data-val="' + escapeHtml(lastStation) + '" class="text-[11px] text-amber-700 hover:text-amber-800 font-medium underline truncate max-w-[9rem]">最近 ' + escapeHtml(lastStation) + '</button>'
    : '';

  html += '<div>' +
    '<div class="flex justify-between items-center mb-1">' +
      '<label class="block text-xs font-semibold text-slate-600">加油地點 <span class="text-slate-400 font-normal">(選填)</span></label>' + stationLabelExtra +
    '</div>' +
    '<input type="text" id="fuel-add-station" autocomplete="off" placeholder="例如：中石化-旺角" value="' + escapeHtml(lastStation) + '" class="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500">' +
    (stationQuick.length ?
      '<div class="flex flex-wrap gap-1.5 mt-2">' +
        stationQuick.map(function(s){
          return '<button type="button" data-fuel-quick="station" data-val="' + escapeHtml(s) + '" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md text-[11px] transition">' + escapeHtml(s) + '</button>';
        }).join('') +
      '</div>' : '') +
  '</div>';

  html += '<div class="bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 flex justify-between items-center">' +
    '<span class="text-xs font-semibold text-amber-800 flex items-center gap-1.5">' +
      '<span class="ico w-3.5 h-3.5 text-amber-700" data-icon="droplet"></span>自動計算升數' +
    '</span>' +
    '<span id="fuel-add-liters" class="font-bold text-slate-400 font-mono">-- L</span>' +
  '</div>';

  html += '<p class="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5">' +
    '<span class="ico w-3.5 h-3.5 mt-0.5 shrink-0" data-icon="info"></span>' +
    '<span>單價與地點會自動記憶，下次加油免重複輸入。金額會累加至最後一更總油費。</span>' +
  '</p>';
  html += '</div>';

  document.getElementById('modal-title').innerText = '新增加油記錄';
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition">取消</button>' +
    '<button onclick="addFuelEntry()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs transition">確認加入</button>';

  var m = document.getElementById('trip-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  hydrateIcons();

  var modalBody = document.getElementById('modal-body');
  modalBody.onclick = function(e){
    var btn = e.target.closest ? e.target.closest('[data-fuel-quick]') : null;
    if (!btn) return;
    var field = btn.dataset.fuelQuick;
    var val = btn.dataset.val;
    var idMap = { amount: 'fuel-add-amount', price: 'fuel-add-price', station: 'fuel-add-station' };
    var el = document.getElementById(idMap[field]);
    if (!el) return;
    el.value = val;
    if (field === 'amount' || field === 'price') calcFuelLiters();
  };

  calcFuelLiters();
  setTimeout(function(){ var el = document.getElementById('fuel-add-amount'); if (el) el.focus(); }, 100);
}

function addFuelEntry(){
  var amountEl  = document.getElementById('fuel-add-amount');
  var priceEl   = document.getElementById('fuel-add-price');
  var stationEl = document.getElementById('fuel-add-station');

  var amount = parseFloat(amountEl.value);
  if (!amount || isNaN(amount) || amount <= 0){ showToast('請輸入有效金額！'); amountEl.focus(); return; }

  var unitPrice = priceEl ? parseFloat(priceEl.value) : NaN;
  if (isNaN(unitPrice) || unitPrice <= 0) unitPrice = null;

  var station = stationEl ? stationEl.value.trim() : '';
  var liters  = (unitPrice !== null) ? (amount / unitPrice) : null;

  var key = getLastShiftKey();
  var cfg = getLastSettings();
  if (!Array.isArray(cfg.fuelEntries)) cfg.fuelEntries = [];

  cfg.fuelEntries.push({
    id: 'fuel_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    amount: amount, unitPrice: unitPrice, liters: liters,
    station: station, timestamp: Date.now()
  });
  shiftSettings[key] = cfg;
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  var prefs = getFuelPrefs();
  if (unitPrice !== null) prefs.lastUnitPrice = unitPrice;
  if (station)            prefs.lastStation   = station;
  saveFuelPrefs(prefs);

  closeModal();
  initSettingsForm();
  updateStatsAndNet();

  var toastMsg = '已加入加油 $' + amount;
  if (unitPrice !== null && liters !== null) toastMsg += '（' + liters.toFixed(2) + ' L）';
  showToast(toastMsg);
}

function openFuelHistoryModal(){
  var cfg = getLastSettings(false);
  var entries = (cfg && Array.isArray(cfg.fuelEntries)) ? cfg.fuelEntries.slice() : [];
  entries.sort(function(a,b){ return b.timestamp - a.timestamp; });
  var total = getFuelTotal(cfg);
  var key = getLastShiftKey();

  var html = '<div class="space-y-3">';
  html +=
    '<div class="bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 flex justify-between items-center">' +
      '<div>' +
        '<div class="text-[11px] text-amber-800 font-medium">最後一更總油費</div>' +
        '<div class="text-xl font-extrabold text-amber-900 mt-0.5">$' + total.toFixed(1) + '</div>' +
      '</div>' +
      '<div class="text-right text-[11px] text-slate-500 font-mono">' + key + '<br>共 ' + entries.length + ' 筆</div>' +
    '</div>';

  if (entries.length === 0){
    html += '<p class="text-center text-slate-400 text-sm py-6">尚未有加油記錄</p>';
  } else {
    html += '<div class="space-y-1.5 max-h-64 overflow-y-auto pr-1">';
    entries.forEach(function(e){
      var d = new Date(e.timestamp);
      var timeStr = d.toLocaleString('zh-HK', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });

      var priceLine = '';
      if (e.unitPrice){
        priceLine = '<div class="text-[11px] text-slate-500 font-mono">' +
          parseFloat(e.unitPrice).toFixed(2) + ' HKD/L' +
          (e.liters ? ' × ' + parseFloat(e.liters).toFixed(2) + ' L' : '') +
        '</div>';
      }

      var stationLine = '';
      if (e.station){
        stationLine = '<div class="text-[11px] text-slate-600 mt-0.5 truncate flex items-center gap-1">' +
          '<span class="ico w-3 h-3 text-slate-400 shrink-0">' + ico('map-pin','w-3 h-3') + '</span>' +
          escapeHtml(e.station) +
        '</div>';
      }

      html +=
        '<div class="flex justify-between items-start bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 gap-2">' +
          '<div class="min-w-0 flex-1">' +
            '<div class="flex items-baseline gap-2 flex-wrap"><div class="font-bold text-slate-800 text-base">$' + e.amount + '</div></div>' +
            priceLine + stationLine +
            '<div class="text-[11px] text-slate-400 font-mono mt-0.5">' + timeStr + '</div>' +
          '</div>' +
          '<button onclick="deleteFuelEntry(\'' + e.id + '\')" class="p-2 text-slate-400 hover:text-rose-500 transition shrink-0">' + ico('trash-2','w-4 h-4') + '</button>' +
        '</div>';
    });
    html += '</div>';
  }
  html += '</div>';

  document.getElementById('modal-title').innerText = '加油記錄';
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition">關閉</button>' +
    '<button onclick="openAddFuelModal()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs transition">+ 新增加油</button>';

  var m = document.getElementById('trip-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  hydrateIcons();
}

function deleteFuelEntry(id){
  if (!confirm('確定要刪除這筆加油記錄嗎？')) return;
  var key = getLastShiftKey();
  var cfg = getLastSettings(false);
  if (!cfg) return;
  cfg.fuelEntries = (cfg.fuelEntries || []).filter(function(e){ return e.id !== id; });
  shiftSettings[key] = cfg;
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  initSettingsForm();
  updateStatsAndNet();
  showToast('加油記錄已刪除，總油費 $' + getFuelTotal(cfg).toFixed(1));
  openFuelHistoryModal();
}

var DELETE_PERIODS = {
  day:   { daysBack: 1,  label: '一天前',   desc: '昨天及之前的更次' },
  week:  { daysBack: 7,  label: '一星期前', desc: '7 天前的更次' },
  month: { daysBack: 30, label: '一個月前', desc: '30 天前的更次' }
};

function deleteOldTrips(period){
  var keysToDelete = [];

  if (period === 'all'){
    keysToDelete = Object.keys(shiftSettings);
  } else {
    var conf = DELETE_PERIODS[period];
    if (!conf) return;

    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - conf.daysBack);
    cutoffDate.setHours(0, 0, 0, 0);
    var cutoffKey = localDateStr(cutoffDate);

    keysToDelete = Object.keys(shiftSettings).filter(function(k){ return k <= cutoffKey; });
  }

  var keySet = {};
  keysToDelete.forEach(function(k){ keySet[k] = true; });

  var tripTargets;
  if (period === 'all') tripTargets = trips.slice();
  else tripTargets = trips.filter(function(t){ return keySet[t.shiftDate]; });

  var totalCount = tripTargets.length + keysToDelete.length;
  if (totalCount === 0){
    showToast(period === 'all' ? '目前沒有任何數據可刪除' : '沒有 ' + DELETE_PERIODS[period].label + ' 的數據');
    return;
  }

  var periodDesc = period === 'all' ? '全部' : DELETE_PERIODS[period].label + '（' + DELETE_PERIODS[period].desc + '）';
  var confirmMsg = period === 'all'
    ? '⚠️ 確定要刪除「全部」數據嗎？\n\n將一併刪除：\n• ' + tripTargets.length + ' 筆行程紀錄\n• ' + keysToDelete.length + ' 個更次設定（含成本、油費、里程）\n\n此操作無法復原！'
    : '確定要刪除「' + periodDesc + '」的數據嗎？\n\n將一併刪除：\n• ' + tripTargets.length + ' 筆行程紀錄\n• ' + keysToDelete.length + ' 個更次設定（含成本、油費、里程）\n\n此操作無法復原！';

  if (!confirm(confirmMsg)) return;

  lastDeletedTrips = tripTargets.slice();
  lastDeletedShiftSettings = {};
  keysToDelete.forEach(function(k){
    if (shiftSettings[k]) lastDeletedShiftSettings[k] = JSON.parse(JSON.stringify(shiftSettings[k]));
  });

  var tripIdSet = {};
  tripTargets.forEach(function(t){ tripIdSet[t.id] = true; });
  trips = trips.filter(function(t){ return !tripIdSet[t.id]; });

  keysToDelete.forEach(function(k){ delete shiftSettings[k]; });

  localStorage.setItem('taxi_trips', JSON.stringify(trips));
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  renderTripList();
  updateStatsAndNet();
  initSettingsForm();

  var bannerText = '已刪除 ' + tripTargets.length + ' 筆紀錄、' + keysToDelete.length + ' 個更次';
  showUndoBanner(bannerText);
  showToast(bannerText);
}

function showUndoBanner(text){
  var banner = document.getElementById('undo-banner');
  document.getElementById('undo-text').innerText = text;
  banner.classList.remove('hidden');
}
function hideUndoBanner(){ document.getElementById('undo-banner').classList.add('hidden'); }

function undoDelete(){
  var hasTrips  = lastDeletedTrips && lastDeletedTrips.length > 0;
  var hasShifts = lastDeletedShiftSettings && Object.keys(lastDeletedShiftSettings).length > 0;
  if (!hasTrips && !hasShifts) return;

  var existingTripIds = {};
  trips.forEach(function(t){ existingTripIds[t.id] = true; });
  var restoredTrips = (lastDeletedTrips || []).filter(function(t){ return !existingTripIds[t.id]; });
  trips = trips.concat(restoredTrips).sort(function(a,b){ return b.timestamp - a.timestamp; });

  var restoredShiftCount = 0;
  if (lastDeletedShiftSettings){
    Object.keys(lastDeletedShiftSettings).forEach(function(k){
      if (!shiftSettings[k]){ shiftSettings[k] = lastDeletedShiftSettings[k]; restoredShiftCount++; }
    });
  }

  localStorage.setItem('taxi_trips', JSON.stringify(trips));
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  var restoredTripCount = restoredTrips.length;
  lastDeletedTrips = null;
  lastDeletedShiftSettings = null;

  hideUndoBanner();
  renderTripList();
  updateStatsAndNet();
  initSettingsForm();

  var msg = '已復原 ' + restoredTripCount + ' 筆紀錄';
  if (restoredShiftCount > 0) msg += '、' + restoredShiftCount + ' 個更次';
  showToast(msg);
}

function updateTripCount(){
  var el = document.getElementById('total-trip-count');
  if (el) el.innerText = trips.length;
}

function initSettingsForm(){
  var lastKey = getLastShiftKey();
  var cfg     = getLastSettings(false);

  if (!cfg){
    document.getElementById('setting-rental').value        = '';
    document.getElementById('setting-fuel').value          = '0';
    document.getElementById('setting-mileage-start').value = '';
    document.getElementById('setting-mileage-end').value   = '';
    var settingNote = document.getElementById('setting-note');
    if (settingNote) settingNote.value = '';
    updateSettingNoteClearBtn();

    document.getElementById('current-shift-time-range').innerText = '';
    var badge = document.getElementById('current-shift-date-badge');
    if (badge) badge.innerText = lastKey;
    var timeDisplay = document.getElementById('setting-shift-time-display');
    if (timeDisplay) timeDisplay.innerText = '未設定';
    var btnText = document.getElementById('fuel-history-btn-text');
    if (btnText) btnText.innerText = '查看加油記錄 (0 筆)';
    updateMileagePanel(null);
    updateDateTimePreview();
    return;
  }

  document.getElementById('setting-rental').value = cfg.rental;
  document.getElementById('setting-fuel').value   = getFuelTotal(cfg);

  document.getElementById('setting-mileage-start').value = (cfg.mileage && cfg.mileage.start != null) ? cfg.mileage.start : '';
  document.getElementById('setting-mileage-end').value   = (cfg.mileage && cfg.mileage.end   != null) ? cfg.mileage.end   : '';

  var settingNote = document.getElementById('setting-note');
  if (settingNote && document.activeElement !== settingNote){ settingNote.value = cfg.note || ''; }
  updateSettingNoteClearBtn();

  var timeRangeText;
  if (cfg.startedAt && cfg.endedAt) timeRangeText = (cfg.startTime || '--') + ' - ' + (cfg.endTime || '--');
  else if (cfg.startedAt) timeRangeText = (cfg.startTime || '--') + ' - 工作中';
  else timeRangeText = '未設定';

  document.getElementById('current-shift-time-range').innerText = (cfg.startedAt && cfg.endedAt) ? timeRangeText : '';

  var timeDisplay = document.getElementById('setting-shift-time-display');
  if (timeDisplay) timeDisplay.innerText = timeRangeText;

  var badge = document.getElementById('current-shift-date-badge');
  if (badge) badge.innerText = lastKey;

  var btnText = document.getElementById('fuel-history-btn-text');
  if (btnText) btnText.innerText = '查看加油記錄 (' + (cfg.fuelEntries || []).length + ' 筆)';

  updateMileagePanel(cfg);
  updateDateTimePreview();
}

function onSettingNoteInput(){ updateSettingNoteClearBtn(); }

function updateSettingNoteClearBtn(){
  var input = document.getElementById('setting-note');
  var btn   = document.getElementById('setting-note-clear-btn');
  if (!input || !btn) return;
  if (input.value.trim()) btn.classList.remove('hidden');
  else btn.classList.add('hidden');
}

function clearSettingNote(){
  var input = document.getElementById('setting-note');
  if (!input) return;
  if (!input.value) return;
  input.value = '';
  updateSettingNoteClearBtn();
  saveSettings();
  input.focus();
}

function updateMileagePanel(cfg){
  var summaryEl = document.getElementById('mileage-summary');
  var detailEl  = document.getElementById('mileage-detail');
  if (!summaryEl || !detailEl) return;

  if (!cfg){
    summaryEl.innerText = '未完成';
    summaryEl.className = 'text-[11px] text-slate-400 font-medium';
    detailEl.innerHTML = '填入開始與結束咪錶讀數即可自動計算行駛里程。';
    return;
  }

  var km = getShiftMileage(cfg);
  if (km === null){
    summaryEl.innerText = '未完成';
    summaryEl.className = 'text-[11px] text-slate-400 font-medium';
    detailEl.innerHTML = '填入開始與結束咪錶讀數即可自動計算行駛里程。';
  } else {
    summaryEl.innerText = km.toFixed(1) + ' km';
    summaryEl.className = 'text-[11px] text-emerald-700 font-bold font-mono';
    detailEl.innerHTML = '開始 <b class="font-mono">' + cfg.mileage.start + '</b> → 結束 <b class="font-mono">' + cfg.mileage.end + '</b>';
  }
}

function saveSettings(){
  var key = getLastShiftKey();
  var cfg = getLastSettings();

  cfg.rental = parseFloat(document.getElementById('setting-rental').value) || 0;

  var msRaw = document.getElementById('setting-mileage-start').value;
  var meRaw = document.getElementById('setting-mileage-end').value;
  var msVal = msRaw === '' ? null : parseFloat(msRaw);
  var meVal = meRaw === '' ? null : parseFloat(meRaw);
  cfg.mileage = {
    start: (msVal === null || isNaN(msVal)) ? null : msVal,
    end:   (meVal === null || isNaN(meVal)) ? null : meVal
  };

  var settingNote = document.getElementById('setting-note');
  if (settingNote) cfg.note = settingNote.value.trim();

  if (!Array.isArray(cfg.fuelEntries)) cfg.fuelEntries = [];

  shiftSettings[key] = cfg;
  localStorage.setItem('taxi_shift_settings', JSON.stringify(shiftSettings));

  initSettingsForm();
  renderTripList();
  updateStatsAndNet();
  updateHeaderWorked();
  showToast('設定已保存');
}

function setStatsPeriod(period){
  statsPeriod = period;
  ['day','week','month'].forEach(function(p){
    var btn = document.getElementById('period-btn-' + p);
    if (!btn) return;
    if (p === period) btn.className = 'py-1.5 rounded-lg bg-white shadow-xs text-slate-800 transition font-bold';
    else btn.className = 'py-1.5 rounded-lg text-slate-600 transition font-medium';
  });
  updateStatsAndNet();
}

function shiftKeyInPeriod(key, period, now, currentShiftKey){
  if (!key) return false;
  var d = new Date(key + 'T12:00:00');
  if (isNaN(d.getTime())) return false;

  if (currentShiftKey === undefined) currentShiftKey = getLastShiftKey();
  var endRef = new Date(currentShiftKey + 'T12:00:00');
  if (isNaN(endRef.getTime())) return false;

  if (period === 'day') return key === currentShiftKey;
  else if (period === 'week'){
    var start = new Date(endRef);
    start.setDate(start.getDate() - 6);
    return d >= start && d <= endRef;
  } else if (period === 'month'){
    var start2 = new Date(endRef);
    start2.setDate(start2.getDate() - 29);
    return d >= start2 && d <= endRef;
  }
  return false;
}

function setText(id, text){
  var el = document.getElementById(id);
  if (el) el.innerText = text;
}

function updateMileageMetrics(km, data){
  var metricKm         = document.getElementById('metric-mileage');
  var metricRevPerKm   = document.getElementById('metric-rev-per-km');
  var metricProfPerKm  = document.getElementById('metric-profit-per-km');
  var metricFuelPerKm  = document.getElementById('metric-fuel-per-km');
  var metricCostPerKm  = document.getElementById('metric-cost-per-km');

  if (!km || km <= 0){
    if (metricKm)        metricKm.innerText        = '-- km';
    if (metricRevPerKm)  metricRevPerKm.innerText  = '--';
    if (metricProfPerKm) metricProfPerKm.innerText = '--';
    if (metricFuelPerKm) metricFuelPerKm.innerText = '--';
    if (metricCostPerKm) metricCostPerKm.innerText = '--';
  } else {
    if (metricKm)        metricKm.innerText        = km.toFixed(1) + ' km';
    if (metricRevPerKm)  metricRevPerKm.innerText  = '$' + (data.gross / km).toFixed(2);
    if (metricProfPerKm) metricProfPerKm.innerText = '$' + (data.profit / km).toFixed(2);
    if (metricFuelPerKm) metricFuelPerKm.innerText = '$' + (data.fuel / km).toFixed(2);
    if (metricCostPerKm) metricCostPerKm.innerText = '$' + (data.totalCost / km).toFixed(2);
  }
}

function updateDurationMetrics(duration, profit){
  var metricDuration      = document.getElementById('metric-duration');
  var metricProfitPerHour = document.getElementById('metric-profit-per-hour');
  if (!metricDuration || !metricProfitPerHour) return;

  if (!duration || duration <= 0){
    metricDuration.innerText = '-- 小時';
    metricProfitPerHour.innerText = '--';
  } else {
    metricDuration.innerText = duration.toFixed(1) + ' 小時';
    metricProfitPerHour.innerText = '$' + (profit / duration).toFixed(2);
    metricProfitPerHour.className = (profit / duration) >= 0
      ? 'text-amber-800 font-extrabold font-mono mt-0.5'
      : 'text-rose-600 font-extrabold font-mono mt-0.5';
  }
}

function renderTypeBreakdown(typeRev){
  var container = document.getElementById('stats-type-breakdown');
  if (!container) return;

  var entries = Object.keys(typeRev).filter(function(k){ return typeRev[k] > 0.001; });

  var orderMap = {};
  TRIP_TYPE_CONFIG.forEach(function(t, i){ orderMap[t.name] = i; });
  entries.sort(function(a, b){
    var ia = (orderMap[a] === undefined) ? 999 : orderMap[a];
    var ib = (orderMap[b] === undefined) ? 999 : orderMap[b];
    return ia - ib;
  });

  if (entries.length === 0){
    container.style.gridTemplateColumns = '';
    container.innerHTML = '<div class="col-span-3 text-slate-400 text-[11px] py-1">暫無收入記錄</div>';
    return;
  }

  var cols = Math.min(entries.length, 3);
  container.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0,1fr))';

  container.innerHTML = entries.map(function(name){
    var cfg = getTripTypeConfig(name);
    var theme = TRIP_TYPE_THEME[cfg.color] || TRIP_TYPE_THEME.slate;
    return '<div class="rounded-lg py-2 border ' + theme.card + '">' +
      '<div class="' + theme.text + ' font-medium truncate px-1">' + escapeHtml(name) + '</div>' +
      '<div class="' + theme.text + ' font-bold font-mono mt-0.5">$' + typeRev[name].toFixed(1) + '</div>' +
    '</div>';
  }).join('');
}

function renderPaymentBreakdown(paymentRev){
  var container = document.getElementById('stats-payment-breakdown');
  if (!container) return;

  var entries = Object.keys(paymentRev).filter(function(k){ return paymentRev[k] > 0.001; });

  var orderMap = {};
  PAYMENT_METHOD_CONFIG.forEach(function(p, i){ orderMap[p.name] = i; });
  entries.sort(function(a, b){
    var ia = (orderMap[a] === undefined) ? 999 : orderMap[a];
    var ib = (orderMap[b] === undefined) ? 999 : orderMap[b];
    return ia - ib;
  });

  if (entries.length === 0){
    container.style.gridTemplateColumns = '';
    container.innerHTML = '<div class="col-span-3 text-slate-400 text-[11px] py-1">暫無收入記錄</div>';
    return;
  }

  var cols = Math.min(entries.length, 3);
  container.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0,1fr))';

  container.innerHTML = entries.map(function(name){
    var cfg = getPaymentMethodConfig(name);
    var theme = TRIP_TYPE_THEME[cfg.color] || TRIP_TYPE_THEME.slate;
    return '<div class="rounded-lg py-2 border ' + theme.card + ' flex flex-col items-center">' +
      '<div class="' + theme.text + ' font-medium truncate px-1 flex items-center gap-0.5">' + ico(cfg.icon, 'w-3 h-3') + escapeHtml(name) + '</div>' +
      '<div class="' + theme.text + ' font-bold font-mono mt-0.5">$' + paymentRev[name].toFixed(1) + '</div>' +
    '</div>';
  }).join('');
}

function renderDayStatsView(lastKey, lastCfg){
  var fin = getShiftFinance(lastKey);

  setText('stats-period-title', '最近一更利潤（' + lastKey + '）');
  setText('stats-period-shift-count-badge', '1 更');

  setText('net-gross', '$' + fin.gross.toFixed(1));
  setText('net-cost', '$' + fin.totalCost.toFixed(1));
  var profitElem = document.getElementById('net-profit');
  if (profitElem){
    profitElem.innerText = '$' + fin.profit.toFixed(1);
    profitElem.className = fin.profit >= 0
      ? 'text-base font-extrabold text-amber-800 mt-0.5 font-mono'
      : 'text-base font-extrabold text-rose-600 mt-0.5 font-mono';
  }

  setText('net-cost-breakdown',
    '租 $' + fin.rental.toFixed(1) +
    '　·　油 $' + fin.fuel.toFixed(1) +
    '　·　行程支出 $' + fin.expenseTrip.toFixed(1));

  setText('net-income-count', fin.incomeCount);
  setText('net-expense-count', fin.expenseCount);

  var km = lastCfg ? getShiftMileage(lastCfg) : null;
  updateMileageMetrics(km, fin);

  var duration = lastCfg ? getShiftDuration(lastCfg) : null;
  updateDurationMetrics(duration, fin.profit);

  var durRow = document.getElementById('duration-metrics-row');
  if (durRow) durRow.style.display = 'grid';

  var typeRev = {};
  TRIP_TYPE_CONFIG.forEach(function(t){ typeRev[t.name] = 0; });
  var paymentRev = {};
  PAYMENT_METHOD_CONFIG.forEach(function(p){ paymentRev[p.name] = 0; });

  fin.list.forEach(function(t){
    var v = parseFloat(t.fare) || 0;
    if (v <= 0) return;
    if (typeRev[t.type] !== undefined) typeRev[t.type] += v;
    else typeRev['其他'] += v;

    var pay = t.payment || '現金';
    if (paymentRev[pay] !== undefined) paymentRev[pay] += v;
    else paymentRev['其他'] += v;
  });
  renderTypeBreakdown(typeRev);
  renderPaymentBreakdown(paymentRev);
}

function renderPeriodStatsView(period, now, lastKey){
  var totalRev         = 0;
  var totalExpenseTrip = 0;
  var periodProfit     = 0;
  var periodRental     = 0;
  var periodFuel       = 0;
  var periodMileage    = 0;
  var periodShiftCount = 0;
  var periodIncomeCount  = 0;
  var periodExpenseCount = 0;
  var typeRev = {};
  TRIP_TYPE_CONFIG.forEach(function(t){ typeRev[t.name] = 0; });
  var paymentRev = {};
  PAYMENT_METHOD_CONFIG.forEach(function(p){ paymentRev[p.name] = 0; });

  Object.keys(shiftSettings).forEach(function(k){
    if (!shiftKeyInPeriod(k, period, now, lastKey)) return;
    periodShiftCount++;

    var finK = getShiftFinance(k);
    periodProfit += finK.profit;
    periodRental += finK.rental;
    periodFuel   += finK.fuel;

    finK.list.forEach(function(t){
      var v = parseFloat(t.fare) || 0;
      if (v < 0){
        totalExpenseTrip += -v;
        periodExpenseCount++;
        return;
      }
      totalRev += v;
      periodIncomeCount++;
      if (typeRev[t.type] !== undefined) typeRev[t.type] += v;
      else typeRev['其他'] += v;

      var pay = t.payment || '現金';
      if (paymentRev[pay] !== undefined) paymentRev[pay] += v;
      else paymentRev['其他'] += v;
    });

    var shiftKm = getShiftMileage(shiftSettings[k]);
    if (shiftKm !== null && shiftKm > 0) periodMileage += shiftKm;
  });

  var periodTotalCost = periodRental + periodFuel + totalExpenseTrip;

  var titleMap = { week: '最近一星期利潤', month: '最近一個月利潤' };
  setText('stats-period-title', titleMap[period] || '期間利潤');
  setText('stats-period-shift-count-badge', periodShiftCount + ' 更');

  setText('net-gross', '$' + totalRev.toFixed(1));
  setText('net-cost', '$' + periodTotalCost.toFixed(1));
  var profitElem = document.getElementById('net-profit');
  if (profitElem){
    profitElem.innerText = '$' + periodProfit.toFixed(1);
    profitElem.className = periodProfit >= 0
      ? 'text-base font-extrabold text-amber-800 mt-0.5 font-mono'
      : 'text-base font-extrabold text-rose-600 mt-0.5 font-mono';
  }

  setText('net-cost-breakdown',
    '租 $' + periodRental.toFixed(1) +
    '　·　油 $' + periodFuel.toFixed(1) +
    '　·　行程支出 $' + totalExpenseTrip.toFixed(1));

  setText('net-income-count', periodIncomeCount);
  setText('net-expense-count', periodExpenseCount);

  updateMileageMetrics(periodMileage, {
    gross: totalRev,
    profit: periodProfit,
    fuel: periodFuel,
    totalCost: periodTotalCost
  });

  var durRow = document.getElementById('duration-metrics-row');
  if (durRow) durRow.style.display = 'none';

  renderTypeBreakdown(typeRev);
  renderPaymentBreakdown(paymentRev);
}

var chartMode   = localStorage.getItem('taxi_chart_mode')   || 'daily';
var chartMetric = localStorage.getItem('taxi_chart_metric') || 'gross';
var chartRange  = parseInt(localStorage.getItem('taxi_chart_range'), 10);
if (!chartRange || [7,14,30].indexOf(chartRange) === -1) chartRange = 7;

function setChartMode(m){
  if (chartMode === m) return;
  chartMode = m;
  localStorage.setItem('taxi_chart_mode', m);
  if (m === 'hourly' && chartMetric === 'profit') chartMetric = 'gross';
  applyChartUIState();
  renderTrendChart();
}

function setChartMetric(m){
  if (chartMode === 'hourly' && m === 'profit') return;
  chartMetric = m;
  localStorage.setItem('taxi_chart_metric', m);
  applyChartUIState();
  renderTrendChart();
}

function setChartRange(r){
  chartRange = r;
  localStorage.setItem('taxi_chart_range', String(r));
  applyChartUIState();
  renderTrendChart();
}

function applyChartUIState(){
  var segOn  = 'py-1.5 rounded-lg bg-white shadow-xs text-slate-800 transition font-bold';
  var segOff = 'py-1.5 rounded-lg text-slate-600 transition font-medium';
  var segDis = 'py-1.5 rounded-lg text-slate-300 transition font-medium cursor-not-allowed';

  [7,14,30].forEach(function(r){
    var b = document.getElementById('chart-range-' + r);
    if (b) b.className = (r === chartRange) ? segOn : segOff;
  });

  var bd = document.getElementById('chart-mode-daily');
  var bh = document.getElementById('chart-mode-hourly');
  if (bd) bd.className = (chartMode === 'daily') ? segOn : segOff;
  if (bh) bh.className = (chartMode === 'hourly') ? segOn : segOff;

  var mg = document.getElementById('chart-metric-gross');
  var mp = document.getElementById('chart-metric-profit');
  var mc = document.getElementById('chart-metric-count');

  if (mg) mg.className = (chartMetric === 'gross') ? segOn : segOff;
  if (mc) mc.className = (chartMetric === 'count') ? segOn : segOff;
  if (mp){
    if (chartMode === 'hourly'){ mp.className = segDis; mp.disabled = true; }
    else { mp.disabled = false; mp.className = (chartMetric === 'profit') ? segOn : segOff; }
  }
}

function buildDailySeries(days){
  var now = new Date();
  var agg = {};
  trips.forEach(function(t){
    var k = t.shiftDate;
    if (!k) return;
    if (!agg[k]) agg[k] = { gross: 0, expense: 0, incomeCount: 0 };
    var v = parseFloat(t.fare) || 0;
    if (v < 0) agg[k].expense += -v;
    else { agg[k].gross += v; agg[k].incomeCount += 1; }
  });

  var wd = ['日','一','二','三','四','五','六'];
  var out = [];
  for (var i = days - 1; i >= 0; i--){
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    var key = localDateStr(d);
    var a = agg[key] || { gross: 0, expense: 0, incomeCount: 0 };

    var cfg = shiftSettings[key];
    if (cfg) ensureShiftFields(cfg);
    var rental = cfg ? (parseFloat(cfg.rental) || 0) : 0;
    var fuel   = cfg ? getFuelTotal(cfg) : 0;
    var cost   = rental + fuel + a.expense;

    out.push({
      key: key,
      label: (d.getMonth() + 1) + '/' + d.getDate(),
      fullLabel: key + '（週' + wd[d.getDay()] + '）',
      gross: a.gross, profit: a.gross - cost, count: a.incomeCount,
      isToday: i === 0
    });
  }
  return out;
}

function buildHourlySeries(days){
  var now = new Date();
  var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  var startMs = start.getTime();

  var buckets = [];
  for (var h = 0; h < 24; h++){
    var hh = (h < 10 ? '0' : '') + h;
    buckets.push({ hour: h, label: hh + ':00', fullLabel: hh + ':00 - ' + hh + ':59', gross: 0, profit: 0, count: 0 });
  }

  trips.forEach(function(t){
    if (!t.timestamp || t.timestamp < startMs) return;
    var v = parseFloat(t.fare) || 0;
    if (v <= 0) return;
    var hIdx = new Date(t.timestamp).getHours();
    buckets[hIdx].gross += v;
    buckets[hIdx].count += 1;
  });

  return buckets;
}

function buildSmoothPath(pts, minY, maxY){
  var n = pts.length;
  if (n === 0) return '';
  if (n === 1) return 'M' + pts[0].x.toFixed(2) + ',' + pts[0].y.toFixed(2);
  if (n === 2) return 'M' + pts[0].x.toFixed(2) + ',' + pts[0].y.toFixed(2) + 'L' + pts[1].x.toFixed(2) + ',' + pts[1].y.toFixed(2);

  var d = 'M' + pts[0].x.toFixed(2) + ',' + pts[0].y.toFixed(2);
  for (var i = 0; i < n - 1; i++){
    var p0 = pts[i - 1] || pts[i];
    var p1 = pts[i];
    var p2 = pts[i + 1];
    var p3 = pts[i + 2] || p2;

    var c1x = p1.x + (p2.x - p0.x) / 6;
    var c1y = p1.y + (p2.y - p0.y) / 6;
    var c2x = p2.x - (p3.x - p1.x) / 6;
    var c2y = p2.y - (p3.y - p1.y) / 6;

    if (c1y < minY) c1y = minY;
    if (c1y > maxY) c1y = maxY;
    if (c2y < minY) c2y = minY;
    if (c2y > maxY) c2y = maxY;

    d += ' C' + c1x.toFixed(2) + ',' + c1y.toFixed(2) + ' ' + c2x.toFixed(2) + ',' + c2y.toFixed(2) + ' ' + p2.x.toFixed(2) + ',' + p2.y.toFixed(2);
  }
  return d;
}

function fmtChartVal(v, isMoney){
  if (!isMoney) return (Math.round(v * 10) / 10) + ' 筆';
  return '$' + v.toFixed(1);
}

function renderTrendChart(){
  var container = document.getElementById('chart-container');
  if (!container) return;

  var isHourly = (chartMode === 'hourly');
  var data = isHourly ? buildHourlySeries(chartRange) : buildDailySeries(chartRange);

  var metric = chartMetric;
  if (isHourly && metric === 'profit') metric = 'gross';
  var isMoney = (metric !== 'count');

  var series = data.map(function(d){
    if (metric === 'profit') return d.profit;
    if (metric === 'count')  return d.count;
    return d.gross;
  });

  var total = 0, maxV = 0, minV = 0;
  series.forEach(function(v){
    total += v;
    if (v > maxV) maxV = v;
    if (v < minV) minV = v;
  });
  var nonZeroCount = series.filter(function(v){ return Math.abs(v) > 0.0001; }).length;
  var avg = nonZeroCount ? total / nonZeroCount : 0;

  setText('chart-sum', fmtChartVal(total, isMoney));
  setText('chart-avg', fmtChartVal(avg, isMoney));
  setText('chart-max', fmtChartVal(maxV, isMoney));

  var peakTag = document.getElementById('chart-peak-tag');
  if (peakTag){
    if (maxV > 0) peakTag.innerText = '峰值 ' + fmtChartVal(maxV, isMoney);
    else peakTag.innerText = '';
  }

  setText('chart-hint', isHourly
    ? '最近 ' + chartRange + ' 天內，每個時段的累計' + (isMoney ? '金額' : '筆數') + '（滑動／點擊曲線查看）'
    : '最近 ' + chartRange + ' 天的每日' + (isMoney ? '金額' : '筆數') + '走勢（滑動／點擊曲線查看）');

  if (maxV <= 0 && minV >= 0 && nonZeroCount === 0){
    container.innerHTML =
      '<div class="py-10 text-center text-slate-300 text-xs leading-relaxed">' +
        '此期間暫無' + (isMoney ? '收入' : '行程') + '數據<br>' +
        '<span class="text-[11px] text-slate-300">新增紀錄後即會顯示走勢</span>' +
      '</div>';
    return;
  }

  var n = data.length;
  var W = 340, H = 172;
  var padL = 8, padR = 8, padT = 22, padB = 26;
  var plotW = W - padL - padR;
  var plotH = H - padT - padB;

  var topV = maxV;
  var botV = minV;
  if (topV < 0) topV = 0;
  if (botV > 0) botV = 0;
  var span = topV - botV;
  if (span <= 0) span = 1;

  function px(i){ if (n <= 1) return padL + plotW / 2; return padL + (plotW * i) / (n - 1); }
  function py(v){ return padT + plotH - ((v - botV) / span) * plotH; }

  var pts = series.map(function(v, i){ return { x: px(i), y: py(v), v: v }; });
  var pathD = buildSmoothPath(pts, padT - 6, padT + plotH + 6);

  var zeroY = py(0);
  var fillD = pathD +
    ' L' + pts[n - 1].x.toFixed(2) + ',' + zeroY.toFixed(2) +
    ' L' + pts[0].x.toFixed(2) + ',' + zeroY.toFixed(2) + ' Z';

  var gridHtml = '';
  for (var g = 0; g <= 3; g++){
    var gy = padT + (plotH * g) / 3;
    gridHtml += '<line x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - padR) +
                '" y2="' + gy.toFixed(1) + '" stroke="#e2e8f0" stroke-width="1"' +
                (g === 3 ? '' : ' stroke-dasharray="3 4"') + '/>';
  }

  var step = 1;
  if (n > 20) step = 4;
  else if (n > 12) step = 3;
  else if (n > 7) step = 2;

  var labelHtml = '';
  for (var li = 0; li < n; li++){
    var isLast = (li === n - 1);
    if (!isLast){
      if (li % step !== 0) continue;
      if ((n - 1 - li) < step) continue;
    }
    var lx = px(li);
    var anchor = 'middle';
    if (li === 0) anchor = 'start';
    if (isLast) anchor = 'end';
    labelHtml += '<text x="' + lx.toFixed(1) + '" y="' + (H - 8) +
                 '" font-size="9" fill="#94a3b8" text-anchor="' + anchor +
                 '" font-family="ui-monospace,Menlo,monospace">' + escapeHtml(data[li].label) + '</text>';
  }

  var dotsHtml = '';
  if (n <= 16){
    for (var di = 0; di < n; di++){
      var isLastDot = (di === n - 1);
      var isToday = !isHourly && data[di].isToday;
      var hi = (isLastDot || isToday);
      dotsHtml += '<circle cx="' + pts[di].x.toFixed(1) + '" cy="' + pts[di].y.toFixed(1) +
                  '" r="' + (hi ? 4 : 3) + '" fill="' + (hi ? '#f59e0b' : '#ffffff') +
                  '" stroke="#f59e0b" stroke-width="2"/>';
    }
  } else {
    var lastIdx = n - 1;
    dotsHtml += '<circle cx="' + pts[lastIdx].x.toFixed(1) + '" cy="' + pts[lastIdx].y.toFixed(1) +
                '" r="4" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>';
  }

  container.innerHTML =
    '<svg id="trend-svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="auto" ' +
      'preserveAspectRatio="xMidYMid meet" style="display:block;touch-action:none;overflow:visible">' +
      '<defs>' +
        '<linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35"/>' +
          '<stop offset="100%" stop-color="#f59e0b" stop-opacity="0.02"/>' +
        '</linearGradient>' +
        '<linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0%" stop-color="#fbbf24"/>' +
          '<stop offset="100%" stop-color="#d97706"/>' +
        '</linearGradient>' +
      '</defs>' +
      gridHtml +
      '<path d="' + fillD + '" fill="url(#trendFill)" stroke="none"/>' +
      '<path d="' + pathD + '" fill="none" stroke="url(#trendStroke)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      dotsHtml + labelHtml +
      '<line id="trend-cursor-line" x1="0" y1="' + padT + '" x2="0" y2="' + (padT + plotH) + '" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>' +
      '<circle id="trend-cursor-dot" cx="0" cy="0" r="5" fill="#f59e0b" stroke="#ffffff" stroke-width="2" opacity="0"/>' +
      '<rect id="trend-hit" x="' + padL + '" y="' + padT + '" width="' + plotW + '" height="' + plotH + '" fill="transparent" pointer-events="all" style="touch-action:none;cursor:crosshair"/>' +
    '</svg>' +
    '<div id="trend-tip" class="hidden absolute pointer-events-none bg-slate-900 text-white text-[10px] rounded-lg px-2 py-1 shadow-lg leading-tight whitespace-nowrap z-10"></div>';

  var svgEl      = document.getElementById('trend-svg');
  var tipEl      = document.getElementById('trend-tip');
  var cursorLine = document.getElementById('trend-cursor-line');
  var cursorDot  = document.getElementById('trend-cursor-dot');
  var hit        = document.getElementById('trend-hit');
  if (!hit || n === 0) return;

  function showAt(clientX){
    var rect = svgEl.getBoundingClientRect();
    if (!rect.width) return;
    var vx = ((clientX - rect.left) / rect.width) * W;

    var idx;
    if (n <= 1) idx = 0;
    else {
      idx = Math.round(((vx - padL) / plotW) * (n - 1));
      if (idx < 0) idx = 0;
      if (idx > n - 1) idx = n - 1;
    }

    var p = pts[idx];
    var d = data[idx];

    var extra = '';
    if (isMoney && metric !== 'count' && d.count > 0) extra = '　·　' + d.count + ' 筆';
    tipEl.innerHTML = escapeHtml(d.fullLabel) + '　' + fmtChartVal(p.v, isMoney) + extra;
    tipEl.classList.remove('hidden');

    var leftPct = (p.x / W) * 100;
    if (leftPct < 14) leftPct = 14;
    if (leftPct > 86) leftPct = 86;

    tipEl.style.left = leftPct + '%';
    tipEl.style.top  = ((p.y / H) * 100) + '%';
    tipEl.style.transform = 'translate(-50%, calc(-100% - 10px))';

    cursorLine.setAttribute('x1', p.x.toFixed(2));
    cursorLine.setAttribute('x2', p.x.toFixed(2));
    cursorLine.setAttribute('opacity', '1');
    cursorDot.setAttribute('cx', p.x.toFixed(2));
    cursorDot.setAttribute('cy', p.y.toFixed(2));
    cursorDot.setAttribute('opacity', '1');
  }

  function hideTip(){
    tipEl.classList.add('hidden');
    cursorLine.setAttribute('opacity', '0');
    cursorDot.setAttribute('opacity', '0');
  }

  hit.addEventListener('pointerdown', function(e){ showAt(e.clientX); });
  hit.addEventListener('pointermove', function(e){ showAt(e.clientX); });
  hit.addEventListener('pointerleave', hideTip);
  hit.addEventListener('pointercancel', hideTip);
}

function updateStatsAndNet(){
  var now = new Date();
  updateTripCount();

  var lastKey    = getLastShiftKey();
  var currentKey = getCurrentShiftKey();
  var lastCfg    = getLastSettings(false);

  var shiftTagEl = document.getElementById('net-shift-tag');
  if (shiftTagEl){
    if (lastKey !== currentKey){ shiftTagEl.innerText = '（' + lastKey + '）'; }
    else { shiftTagEl.innerText = ''; }
    shiftTagEl.className = 'text-[10px] text-amber-600 font-mono ml-1';
  }

  var timeRangeText = '';
  if (lastCfg && lastCfg.startedAt){
    if (lastCfg.endedAt) timeRangeText = (lastCfg.startTime || '--') + ' - ' + (lastCfg.endTime || '--');
    else timeRangeText = (lastCfg.startTime || '--') + ' - 工作中';
  }
  setText('current-shift-time-range', timeRangeText);

  var badge = document.getElementById('current-shift-date-badge');
  if (badge) badge.innerText = lastKey;

  var timeDisplay = document.getElementById('setting-shift-time-display');
  if (timeDisplay) timeDisplay.innerText = timeRangeText || '未設定';

  var fuelInput = document.getElementById('setting-fuel');
  if (fuelInput && document.activeElement !== fuelInput) fuelInput.value = lastCfg ? getFuelTotal(lastCfg) : '0';

  updateMileagePanel(lastCfg);

  if (statsPeriod === 'day') renderDayStatsView(lastKey, lastCfg);
  else renderPeriodStatsView(statsPeriod, now, lastKey);

  renderTrendChart();

  updateDateTimePreview();
  updateHeaderWorked();
}

function showToast(message){
  var toast = document.getElementById('toast');
  toast.innerText = message;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function(){ toast.style.opacity = '0'; }, 2800);
}

var DRAWER_ITEMS = [
  { id: 'home',    label: '首頁',       desc: '返回記帳主頁',        icon: 'home',          tab: 'trip' },
  { id: 'airport', label: '機場航班', desc: '查詢香港國際機場航班', icon: 'plane-takeoff', href: './airport.html' },
  { id: 'places',  label: '收藏地點',    desc: '管理常用地點、一鍵導航',     icon: 'map-pin',       href: './places.html' },  // ★ 新增
  { id: 'gdrive',  label: 'Google Drive',  desc: '一鍵上傳／下載備份',      icon: 'database',      href: './backup.html' },
  { id: 'cash',     label: '現金盤點',    desc: '核對現金收入並記錄提取留存', icon: 'coins',         href: './cash-audit.html' },
  { id: 'other',   label: '其他',       desc: '更多功能（開發中）',    icon: 'settings',      tab: null }
];

function renderDrawerMenu(){
  var container = document.getElementById('drawer-content');
  if (!container) return;

  container.innerHTML = DRAWER_ITEMS.map(function(item){
    return '<button type="button" onclick="handleDrawerItem(\'' + item.id + '\')" ' +
      'class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-amber-50 active:bg-amber-100 transition text-left border border-transparent hover:border-amber-200">' +
        '<span class="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">' + ico(item.icon, 'w-5 h-5') + '</span>' +
        '<span class="flex-1 min-w-0">' +
          '<div class="text-sm font-bold text-slate-800 truncate">' + escapeHtml(item.label) + '</div>' +
          '<div class="text-[11px] text-slate-500 truncate mt-0.5">' + escapeHtml(item.desc) + '</div>' +
        '</span>' +
        '<span class="ico w-4 h-4 text-slate-300 shrink-0">' + ico('chevron-right', 'w-4 h-4') + '</span>' +
      '</button>';
  }).join('');

  hydrateIcons(container);
}

function handleDrawerItem(id){
  var item = DRAWER_ITEMS.find(function(x){ return x.id === id; });
  closeDrawer();
  if (!item) return;

  setTimeout(function(){
    if (item.href){
      var from = encodeURIComponent(window.location.href);
      var sep = item.href.indexOf('?') === -1 ? '?' : '&';
      window.location.href = item.href + sep + 'from=' + from;
      return;
    }
    if (item.tab) switchTab(item.tab);
    else showToast('此功能開發中');
  }, 280);
}

var drawerOpen = false;

function openDrawer(){
  if (drawerOpen) return;
  drawerOpen = true;
  var overlay = document.getElementById('drawer-overlay');
  var drawer  = document.getElementById('side-drawer');
  if (!overlay || !drawer) return;
  void overlay.offsetWidth;
  overlay.classList.add('visible');
  drawer.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer(){
  if (!drawerOpen) return;
  drawerOpen = false;
  var overlay = document.getElementById('drawer-overlay');
  var drawer  = document.getElementById('side-drawer');
  if (!overlay || !drawer) return;
  overlay.classList.remove('visible');
  drawer.classList.remove('open');
  document.body.style.overflow = '';
}



if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./sw.js')
      .then(function(reg){ console.log('[PWA] Service Worker 已註冊：', reg.scope); })
      .catch(function(err){ console.warn('[PWA] Service Worker 註冊失敗：', err); });
  });
}

document.addEventListener('touchmove', function(e){
  var tripModal = document.getElementById('trip-modal');
  var drawer    = document.getElementById('side-drawer');

  if (tripModal && !tripModal.classList.contains('hidden')){
    if (!tripModal.contains(e.target)) e.preventDefault();
    return;
  }
  if (drawer && drawer.classList.contains('open')){
    if (!drawer.contains(e.target)) e.preventDefault();
  }
}, { passive:false });