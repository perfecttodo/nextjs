import{r as d,_ as z,u as Mt}from"./vendor-5459011e.js";import{S as Be,C as Ve,a as De,V as Je,P as jt,b as $t,X as je,c as it,d as Ft,A as zt,e as Ht,H as Ut,L as Wt,f as qt,g as Gt,B as Qt,h as Bt,i as Yt,j as Kt,k as Vt,G as Jt,T as Xe,F as ct,l as Xt,m as dt,M as Se,n as Zt,D as en,R as ut,o as tn,p as nn,q as an,r as We,s as mt,t as rn,u as sn,v as on,I as qe,w as ln,x as cn,y as dn}from"./icons-464fafae.js";import{m as un}from"./maps-8801abd4.js";import{c as mn}from"./utils-4ea7c3f0.js";var gt={exports:{}},$e={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var gn=d,pn=Symbol.for("react.element"),hn=Symbol.for("react.fragment"),fn=Object.prototype.hasOwnProperty,bn=gn.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,xn={key:!0,ref:!0,__self:!0,__source:!0};function pt(e,n,a){var r,o={},l=null,c=null;a!==void 0&&(l=""+a),n.key!==void 0&&(l=""+n.key),n.ref!==void 0&&(c=n.ref);for(r in n)fn.call(n,r)&&!xn.hasOwnProperty(r)&&(o[r]=n[r]);if(e&&e.defaultProps)for(r in n=e.defaultProps,n)o[r]===void 0&&(o[r]=n[r]);return{$$typeof:pn,type:e,key:l,ref:c,props:o,_owner:bn.current}}$e.Fragment=hn;$e.jsx=pt;$e.jsxs=pt;gt.exports=$e;var Ye=gt.exports;const ce=Ye.Fragment,t=Ye.jsx,s=Ye.jsxs;function yn(e,n){let a;try{a=e()}catch{return}return{getItem:o=>{var l;const c=u=>u===null?null:JSON.parse(u,n==null?void 0:n.reviver),i=(l=a.getItem(o))!=null?l:null;return i instanceof Promise?i.then(c):c(i)},setItem:(o,l)=>a.setItem(o,JSON.stringify(l,n==null?void 0:n.replacer)),removeItem:o=>a.removeItem(o)}}const Ge=e=>n=>{try{const a=e(n);return a instanceof Promise?a:{then(r){return Ge(r)(a)},catch(r){return this}}}catch(a){return{then(r){return this},catch(r){return Ge(r)(a)}}}},vn=(e,n)=>(a,r,o)=>{let l={storage:yn(()=>window.localStorage),partialize:b=>b,version:0,merge:(b,L)=>({...L,...b}),...n},c=!1,i=0;const u=new Set,h=new Set;let N=l.storage;if(!N)return e((...b)=>{console.warn(`[zustand persist middleware] Unable to update item '${l.name}', the given storage is currently unavailable.`),a(...b)},r,o);const w=()=>{const b=l.partialize({...r()});return N.setItem(l.name,{state:b,version:l.version})},S=o.setState;o.setState=(b,L)=>(S(b,L),w());const y=e((...b)=>(a(...b),w()),r,o);o.getInitialState=()=>y;let f;const x=()=>{var b,L;if(!N)return;const D=++i;c=!1,u.forEach(E=>{var j;return E((j=r())!=null?j:y)});const R=((L=l.onRehydrateStorage)==null?void 0:L.call(l,(b=r())!=null?b:y))||void 0;return Ge(N.getItem.bind(N))(l.name).then(E=>{if(E)if(typeof E.version=="number"&&E.version!==l.version){if(l.migrate){const j=l.migrate(E.state,E.version);return j instanceof Promise?j.then(V=>[!0,V]):[!0,j]}console.error("State loaded from storage couldn't be migrated since no migrate function was provided")}else return[!1,E.state];return[!1,void 0]}).then(E=>{var j;if(D!==i)return;const[V,Q]=E;if(f=l.merge(Q,(j=r())!=null?j:y),a(f,!0),V)return w()}).then(()=>{D===i&&(R==null||R(r(),void 0),f=r(),c=!0,h.forEach(E=>E(f)))}).catch(E=>{D===i&&(R==null||R(void 0,E))})};return o.persist={setOptions:b=>{l={...l,...b},b.storage&&(N=b.storage)},clearStorage:()=>{N==null||N.removeItem(l.name)},getOptions:()=>l,rehydrate:()=>x(),hasHydrated:()=>c,onHydrate:b=>(u.add(b),()=>{u.delete(b)}),onFinishHydration:b=>(h.add(b),()=>{h.delete(b)})},l.skipHydration||x(),f||y},wn=vn,rr=(e="img[data-src]")=>{const n=document.querySelectorAll(e),a=new IntersectionObserver((r,o)=>{r.forEach(l=>{if(l.isIntersecting){const c=l.target,i=c.getAttribute("data-src");i&&(c.src=i,c.removeAttribute("data-src"),o.unobserve(c))}})});n.forEach(r=>a.observe(r))},_e={startTime:null,start(){this.startTime=performance.now()},end(e="Operation"){if(this.startTime){const n=performance.now()-this.startTime;console.log(`${e} took ${n.toFixed(2)}ms`),this.startTime=null}},measure(e,n="Operation"){this.start(),e(),this.end(n)}},Sn=(e,n)=>{const a=e[n];return a?typeof a=="function"?a():Promise.resolve(a):new Promise((r,o)=>{(typeof queueMicrotask=="function"?queueMicrotask:setTimeout)(o.bind(null,new Error("Unknown variable dynamic import: "+n)))})},ht={categoryName:"運輸署官方守則",items:[{name:"《道路使用者守則》",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index.html"},{name:"發出指令的交通標誌",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index/chapter_8_the_language_of_the_road/signs_giving_orders_/index.html"},{name:"〈的士運營小冊子〉",url:"https://www.td.gov.hk/filemanager/sc/publication/taxi%20operation%20booklet_sc_20260320_revised.pdf"}]},ft={categoryName:"互動地圖工具",items:[{name:"地理資訊地圖 (2D)",url:"https://www.map.gov.hk/gm/"},{name:"地理資訊地圖 (3D)",url:"https://3d.map.gov.hk/?lookat=22.30282688529485%2C114.17584194395741&i=false&l=zh-CN"}]},bt={categoryName:"其它備考法規",items:[{name:"違例定額罰款新規",url:"https://gia.info.gov.hk/general/202512/29/P2025122900290_526703_1_1766981772892.pdf"}]},_n={official_guidelines:ht,mapping_tools:ft,regulations:bt},Nn=Object.freeze(Object.defineProperty({__proto__:null,default:_n,mapping_tools:ft,official_guidelines:ht,regulations:bt},Symbol.toStringTag,{value:"Module"})),xt={name:"小學考試模擬測試",description:"小學考試模擬測試",sections:{"Section A":50},totalQuestions:50,timeLimit:30,passingScore:"答对40题或以上",sectionPassing:{"Section A":40},success:"http://localhost:5001/disable"},yt={name:"小學考試(自動答題)",description:"小學考試模擬測試",sections:{},totalQuestions:20,timeLimit:30,passingScore:80,sectionPassing:{},say:"http://127.0.0.1:5001/say?",autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,autoAnswer:!0},Cn={primary:xt,default:{name:"小學考試",description:"小學考試模擬測試",sections:{"Section C":5,"Section B":5,"Section A":5,"Section D":5},totalQuestions:20,timeLimit:30,passingScore:80,sectionPassing:{},success:"http://localhost:5001/disable",say:"http://127.0.0.1:5001/say?",autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,cooldown_minutes:60,daily_limit:2},小學二年級:{name:"小學二年級",description:"小學二年級模擬測試",sections:{小學二年級:20},totalQuestions:20,timeLimit:30,passingScore:80,sectionPassing:{},success:"http://localhost:5001/disable",say:"http://127.0.0.1:5001/say?",autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,cooldown_minutes:60,daily_limit:2},autoAnswer:yt,幼兒園高班:{name:"幼兒園高班",description:"幼兒園高班",sections:{幼兒園高班:20},totalQuestions:20,timeLimit:30,passingScore:80,sectionPassing:{},success:"http://localhost:5001/disable",say:"http://127.0.0.1:5001/say?",autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,cooldown_minutes:60,daily_limit:2}},kn=Object.freeze(Object.defineProperty({__proto__:null,autoAnswer:yt,default:Cn,primary:xt},Symbol.toStringTag,{value:"Module"})),vt="香港的士考試練習APP",wt="按甲、乙部分類練習，助您順利通過的士考試",Tn={siteName:vt,siteDescrition:wt},Rn=Object.freeze(Object.defineProperty({__proto__:null,default:Tn,siteDescrition:wt,siteName:vt},Symbol.toStringTag,{value:"Module"})),St={categoryName:"運輸署官方守則",items:[{name:"《道路使用者守則》",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index.html"},{name:"發出指令的交通標誌",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index/chapter_8_the_language_of_the_road/signs_giving_orders_/index.html"},{name:"〈的士運營小冊子〉",url:"https://www.td.gov.hk/filemanager/sc/publication/taxi%20operation%20booklet_sc_20260320_revised.pdf"}]},_t={categoryName:"互動地圖工具",items:[{name:"地理資訊地圖 (2D)",url:"https://www.map.gov.hk/gm/"},{name:"地理資訊地圖 (3D)",url:"https://3d.map.gov.hk/?lookat=22.30282688529485%2C114.17584194395741&i=false&l=zh-CN"}]},Nt={categoryName:"其它備考法規",items:[{name:"違例定額罰款新規",url:"https://gia.info.gov.hk/general/202512/29/P2025122900290_526703_1_1766981772892.pdf"}]},Ln={official_guidelines:St,mapping_tools:_t,regulations:Nt},An=Object.freeze(Object.defineProperty({__proto__:null,default:Ln,mapping_tools:_t,official_guidelines:St,regulations:Nt},Symbol.toStringTag,{value:"Module"})),Ct={name:"的士筆試模擬2",description:"考生須於指定時間內回答試卷內全部之試題，並於兩個部分均達到及格標準，其總成績才會被視為及格",sections:{甲部:30,"甲部-地方":9,"甲部-路線":1,乙部:35,处罚罚款:2},totalQuestions:77,timeLimit:45,passingScore:"甲部: 答对34题或以上; 乙部: 答对30题或以上",sectionPassing:{"甲部+甲部-地方+甲部-路線":34,乙部:30},success:"http://localhost:5001/disable",autoSay:!1,isPlayOptions:!1,enableSearch:!0},kt={name:"的士筆試模擬(自動)",description:"考生須於指定時間內回答試卷內全部之試題，並於兩個部分均達到及格標準，其總成績才會被視為及格",sections:{甲部:30,"甲部-地方":9,"甲部-路線":1,乙部:35},totalQuestions:75,timeLimit:45,passingScore:"甲部: 答对34题或以上; 乙部: 答对30题或以上",sectionPassing:{"甲部+甲部-地方+甲部-路線":34,乙部:30},success:"http://localhost:5001/disable",say:!0,autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,autoAnswer:!0},On={"section-a":{name:"甲部: 的士營運",description:"答对34题或以上及格",sections:{甲部:40},totalQuestions:40,timeLimit:20,passingScore:"答对34题或以上",sectionPassing:{甲部:34}},"section-b":{name:"乙部: 道路使用者守則",description:"答对30题或以上及格",sections:{乙部:35},totalQuestions:35,timeLimit:25,passingScore:"答对30题或以上",sectionPassing:{乙部:30}},default:{name:"的士筆試模擬",description:"考生須於指定時間內回答試卷內全部之試題，並於兩個部分均達到及格標準，其總成績才會被視為及格",sections:{甲部:30,"甲部-地方":9,"甲部-路線":1,乙部:35},totalQuestions:75,timeLimit:45,passingScore:"甲部: 答对34题或以上; 乙部: 答对30题或以上",sectionPassing:{"甲部+甲部-地方+甲部-路線":34,乙部:30},success:"http://localhost:5001/disable",autoSay:!1,isPlayOptions:!1,enableSearch:!0},default2:Ct,auto:kt},En=Object.freeze(Object.defineProperty({__proto__:null,auto:kt,default:On,default2:Ct},Symbol.toStringTag,{value:"Module"})),Tt="香港認路APP",Rt="",In={siteName:Tt,siteDescrition:Rt},Pn=Object.freeze(Object.defineProperty({__proto__:null,default:In,siteDescrition:Rt,siteName:Tt},Symbol.toStringTag,{value:"Module"})),Lt={categoryName:"運輸署官方守則",items:[{name:"《道路使用者守則》",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index.html"},{name:"發出指令的交通標誌",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index/chapter_8_the_language_of_the_road/signs_giving_orders_/index.html"},{name:"〈的士運營小冊子〉",url:"https://www.td.gov.hk/filemanager/sc/publication/taxi%20operation%20booklet_sc_20260320_revised.pdf"}]},At={categoryName:"互動地圖工具",items:[{name:"地理資訊地圖 (2D)",url:"https://www.map.gov.hk/gm/"},{name:"地理資訊地圖 (3D)",url:"https://3d.map.gov.hk/?lookat=22.30282688529485%2C114.17584194395741&i=false&l=zh-CN"},{name:"石油氣加氣站位置",url:"https://www.emsd.gov.hk/tc/gas_safety/lpg_vehicle_scheme/publications/general/location_of_lpg_filling_station/index.html"},{name:"DC開工資訊分享",url:"https://t.me/s/dc9workinfo/28"}]},Ot={categoryName:"其它備考法規",items:[{name:"違例定額罰款新規",url:"https://gia.info.gov.hk/general/202512/29/P2025122900290_526703_1_1766981772892.pdf"}]},Dn={official_guidelines:Lt,mapping_tools:At,regulations:Ot},Mn=Object.freeze(Object.defineProperty({__proto__:null,default:Dn,mapping_tools:At,official_guidelines:Lt,regulations:Ot},Symbol.toStringTag,{value:"Module"})),jn={default:{name:"(自動)",description:"考生須於指定時間內回答試卷內全部之試題，並於兩個部分均達到及格標準，其總成績才會被視為及格",sections:{},totalQuestions:100,timeLimit:45,passingScore:"",sectionPassing:{},say:!0,autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,autoAnswer:!0}},$n=Object.freeze(Object.defineProperty({__proto__:null,default:jn},Symbol.toStringTag,{value:"Module"})),Ze=[{name:"上水",places:["北區醫院"]},{name:"粉嶺",places:["龍躍頭文物徑","北區政府合署"]},{name:"大埔",places:["雅麗氏何妙齡那打素醫院","林村許願廣場","香港教育大學"]},{name:"元朗",places:["博愛醫院","屏山文物徑","錦綉花園"]},{name:"天水圍",places:["香港濕地公園","嘉湖海逸酒店","嘉湖山莊"]},{name:"屯門",places:["青山醫院","大興政府合署","嶺南大學"]},{name:"屯喜路",places:["屯門政府合署","屯門法院大樓"]},{name:"青松觀路",places:["屯門醫院","小欖醫院"]},{name:"赤鱲角",places:["亞洲國際博覽館","香港天際萬豪酒店","富豪機場酒店會議中心","麗豪航天城酒店"]},{name:"東涌",places:["諾富特東薈城酒店","東薈城名店倉","東堤灣畔"]},{name:"達東路",places:["昂坪纜車 - 東涌纜車站"]},{name:"大嶼山",places:["迪士尼好萊塢酒店","愉景灣"]},{name:"竹篙灣",places:["香港迪士尼樂園","迪士尼探索家度假酒店","香港迪士尼樂園酒店"]},{name:"昂坪",places:["寶蓮禪寺"]},{name:"銀鑛灣路",places:["梅窩政府合署"]},{name:"汀九",places:["帝景酒店"]},{name:"掃管笏",places:["香港黃金海岸酒店"]},{name:"馬灣",places:["珀麗灣"]},{name:"沙田",places:["威爾斯親王醫院","香港文化博物館","麗豪酒店","新城市廣場","香港中文大學"]},{name:"上禾輋路",places:["沙田政府合署"]},{name:"大圍",places:["沙田車公廟"]},{name:"車公廟路",places:["圍方"]},{name:"亞公角街",places:["沙田醫院"]},{name:"澤祥街",places:["香港中文大學醫院"]},{name:"小瀝源",places:["香港恒生大學"]},{name:"馬鞍山",places:["新港城"]},{name:"荃灣",places:["仁濟醫院","如心廣場","綠楊新邨","麗城花園"]},{name:"荃景圍",places:["荃灣港安醫院","荃灣區警署"]},{name:"西樓角路",places:["荃灣政府合署"]},{name:"楊屋道",places:["荃灣西如心酒店"]},{name:"青衣",places:["盈翠半島"]},{name:"荔景",places:["瑪嘉烈醫院","葵涌醫院"]},{name:"興芳路",places:["葵興政府合署"]},{name:"元州街",places:["深水埗政府合署"]},{name:"深水埗",places:["寶血醫院（明愛）"]},{name:"長沙灣",places:["明愛醫院"]},{name:"長沙灣道",places:["長沙灣政府合署"]},{name:"荔枝角",places:["美孚新邨"]},{name:"荔灣道",places:["荔枝角政府合署"]},{name:"九龍塘",places:["香港浸信會醫院","香港城市大學","香港浸會大學"]},{name:"樂富",places:["香港佛教醫院"]},{name:"黃大仙",places:["聖母醫院"]},{name:"沙田坳道",places:["東華三院黃大仙醫院"]},{name:"鑽石山",places:["荷里活廣場"]},{name:"九龍城",places:["九龍醫院","香港眼科醫院","播道醫院","聖德肋撒醫院","九龍寨城公園","富豪東方酒店","醫院管理局大樓"]},{name:"亞皆老街",places:["九龍城法院大樓"]},{name:"何文田",places:["培正道政府合署","香港都會大學"]},{name:"忠孝街",places:["何文田政府合署"]},{name:"土瓜灣",places:["8度海逸酒店"]},{name:"馬頭角道",places:["馬頭角道政府合署"]},{name:"馬頭圍道",places:["土瓜灣政府合署"]},{name:"紅磡",places:["香港體育館","九龍海逸君綽酒店","都會海逸酒店","黃埔新天地","黃埔花園","海逸豪園","香港理工大學"]},{name:"旺角",places:["帝京酒店","朗豪坊"]},{name:"太子道西",places:["旺角區警署"]},{name:"大角咀",places:["香港旺角帝盛酒店"]},{name:"聯運街",places:["旺角政府合署"]},{name:"油麻地",places:["伊利沙伯醫院","廣華醫院","玉器市場","九龍政府合署"]},{name:"加士居道",places:["勞資審裁處","土地審裁處"]},{name:"尖沙咀",places:["星光大道","香港歷史博物館","香港科學館","香港太空館","香港文化中心","尖沙咀天星碼頭","香港藝術館","九龍香格里拉大酒店","千禧新世界香港酒店","帝苑酒店","皇家太平洋酒店","香港半島酒店","香港喜來登酒店","香港百樂酒店","香港金域假日酒店","馬哥孛羅香港酒店","海景嘉福洲際酒店","港威酒店","美麗華酒店","香港瑰麗酒店","美麗華廣場","港威大廈","海港城"]},{name:"柯士甸道西",places:["戲曲中心","香港W酒店","香港麗思卡爾頓酒店"]},{name:"廣東道",places:["1881"]},{name:"博物館道",places:["香港故宮文化博物館"]},{name:"中港道",places:["中區警區總部"]},{name:"通州街",places:["西九龍法院大樓"]},{name:"海庭道",places:["西九龍政府合署"]},{name:"九龍灣",places:["香港兒童醫院","淘大花園"]},{name:"偉業街",places:["德福花園"]},{name:"啟德",places:["AIRSIDE"]},{name:"承啟道",places:["啟德體育園"]},{name:"啟成街",places:["機電工程署總部大樓"]},{name:"觀塘",places:["九龍東如心酒店","東九龍政府合署","裕民坊"]},{name:"鯉魚門道",places:["觀塘區警署","觀塘法院大樓"]},{name:"秀茂坪",places:["基督教聯合醫院"]},{name:"安華街",places:["牛頭角政府合署"]},{name:"清水灣",places:["香港科技大學"]},{name:"將軍澳",places:["靈實醫院","香港九龍東皇冠假日酒店","入境事務處總部","電視廣播有限公司電視廣播城"]},{name:"寶琳北路",places:["將軍澳區警署"]},{name:"寶寧里",places:["將軍澳醫院"]},{name:"翠嶺里",places:["聖方濟各大學"]},{name:"薄扶林",places:["瑪麗醫院","東華三院馮堯敬醫院","大口環根德公爵夫人兒童醫院"]},{name:"香港仔",places:["南灣如心酒店"]},{name:"黃竹坑",places:["葛量洪醫院","港怡醫院","香港海洋公園","奧華酒店 - 南岸"]},{name:"黃竹坑徑",places:["黃竹坑醫院"]},{name:"鴨脷洲",places:["海怡半島"]},{name:"赤柱",places:["美利樓"]},{name:"山頂",places:["明德國際醫院"]},{name:"山頂道",places:["凌霄閣"]},{name:"半山",places:["嘉諾撒醫院"]},{name:"般咸道",places:["香港大學本部大樓"]},{name:"上環",places:["東華醫院","文武廟"]},{name:"皇后大道中",places:["中遠大廈"]},{name:"德輔道中",places:["永安集團大廈"]},{name:"中環",places:["香港大會堂","香港文華東方酒店","終審法院","香港禮賓府","長江集團中心","環球大廈","怡和大廈","香港滙豐總行大廈"]},{name:"金鐘",places:["立法會綜合大樓","力寶中心","統一中心"]},{name:"金鐘道",places:["高等法院"]},{name:"荷李活道",places:["大館"]},{name:"灣仔",places:["鄧肇堅醫院","律敦治醫院","金紫荊廣場","香港會議展覽中心","伊利沙伯體育館","六國酒店","香港萬麗海景酒店","合和中心"]},{name:"皇后大道東",places:["香港灣仔帝盛酒店"]},{name:"港灣道",places:["區域法院"]},{name:"莊士敦道",places:["和昌大押"]},{name:"軒尼詩道",places:["港島皇悅酒店"]},{name:"銅鑼灣",places:["柏寧酒店","香港中央圖書館","利園","時代廣場","利舞臺"]},{name:"東院道",places:["聖保祿醫院"]},{name:"跑馬地",places:["香港港安醫院","養和醫院"]},{name:"大坑",places:["東華東院"]},{name:"北角",places:["香港樹仁大學"]},{name:"渣華道",places:["北角政府合署"]},{name:"英皇道",places:["北角海逸酒店"]},{name:"鰂魚涌",places:["太古城"]},{name:"西灣河",places:["東區法院大樓"]},{name:"柴灣",places:["東區尤德夫人那打素醫院","杏花邨"]}];function Fn(){const[e,n]=d.useState(""),a=d.useMemo(()=>{if(!e.trim())return Ze;const l=e.toLowerCase();return Ze.filter(c=>c.name.toLowerCase().includes(l)?!0:c.places.some(i=>i.toLowerCase().includes(l)))},[e]),r=d.useMemo(()=>{const l=a.reduce((c,i)=>c+i.places.length,0);return{groupCount:a.length,placeCount:l}},[a]),o=(l,c)=>s("div",{className:"location-card",children:[t("div",{className:"card-header",children:s("h3",{children:["📍 ",l.name,t("span",{className:"badge",children:l.places.length})]})}),t("div",{className:"card-body",children:t("ul",{className:"place-list",children:l.places.map((i,u)=>t("li",{children:i},u))})})]},`${l.name}-${c}`);return s("div",{className:"location-map",children:[s("div",{className:"header",children:[s("div",{children:[t("h1",{children:"🗺️ 香港地點索引"}),t("div",{className:"subtitle",children:"📍 由北至南 · 由東至西"})]}),s("div",{className:"header-right",children:[s("div",{className:"stats",children:["📊 ",r.groupCount," 個區域 · ",r.placeCount," 個地點"]}),t("input",{type:"text",className:"search-input",placeholder:"🔍 搜尋區域或地點...",value:e,onChange:l=>n(l.target.value)})]})]}),t("div",{className:"grid",children:a.map((l,c)=>o(l,c))}),a.length===0&&s("div",{className:"no-results",children:["❓ 找不到符合「",e,"」的結果"]}),t("footer",{className:"footer",children:"⚡ 網格佈局模擬地圖排序 | 資料基於原始地址清單 (小組保持一齊)"})]})}const zn=`
  .location-map {
    max-width: 1600px;
    margin: 0 auto;
    background: white;
    border-radius: 24px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    padding: 20px;
    font-family: 'Segoe UI', 'Roboto', 'Noto Sans TC', system-ui, sans-serif;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #cbdbe2;
  }

  .header h1 {
    margin: 0 0 8px 0;
    font-size: 1.8rem;
    color: #1a3e50;
  }

  .subtitle {
    color: #5a6e7a;
    font-size: 0.9rem;
  }

  .header-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .stats {
    font-size: 0.85rem;
    background: #edf2f7;
    padding: 6px 12px;
    border-radius: 40px;
    color: #2c5a6e;
  }

  .search-input {
    padding: 8px 16px;
    font-size: 0.9rem;
    border: 1px solid #cbd5e0;
    border-radius: 40px;
    width: 220px;
    outline: none;
    transition: all 0.2s;
  }

  .search-input:focus {
    border-color: #2c7a5e;
    box-shadow: 0 0 0 3px rgba(44, 122, 94, 0.1);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
  }

  .location-card {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }

  .location-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    border-color: #bdd3e6;
  }

  .card-header {
    background: #f1f6fa;
    padding: 14px 18px;
    border-bottom: 2px solid #cbdde9;
  }

  .card-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #0f3b4c;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .badge {
    background: #2c7a5e;
    color: white;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 20px;
    font-weight: normal;
  }

  .card-body {
    padding: 12px 18px 18px 18px;
    max-height: 280px;
    overflow-y: auto;
  }

  .place-list {
    margin: 0;
    padding-left: 20px;
    font-size: 0.88rem;
    line-height: 1.5;
    color: #1f2f3a;
  }

  .place-list li {
    margin: 6px 0;
    word-break: break-word;
  }

  .no-results {
    text-align: center;
    padding: 60px 20px;
    font-size: 1.1rem;
    color: #7f8c8d;
  }

  .footer {
    margin-top: 30px;
    text-align: center;
    font-size: 0.75rem;
    color: #7f8c8d;
    border-top: 1px solid #dce5ec;
    padding-top: 20px;
  }

  @media (max-width: 640px) {
    .location-map { padding: 12px; }
    .header { flex-direction: column; align-items: stretch; }
    .header-right { align-items: stretch; }
    .search-input { width: 100%; }
    .card-header h3 { font-size: 1.1rem; }
    .place-list { font-size: 0.8rem; }
  }
`;if(typeof document<"u"){const e=document.createElement("style");e.textContent=zn,document.head.appendChild(e)}let we=null,Ie=0;const Hn=(e,n,a,r)=>{we&&(clearInterval(we),we=null);const o=n;return o>2&&a&&e&&typeof e.getPlayerState=="function"&&(Ie=performance.now(),we=setInterval(()=>{try{if(e.getPlayerState()===1){const c=performance.now(),i=(c-Ie)/1e3;if(Ie=c,i>.2)return;const u=e.getCurrentTime(),h=e.getPlaybackRate()||1,N=i*(o-h);N>0&&e.seekTo(u+N,!0)}else Ie=performance.now()}catch(l){console.error("Simulation error:",l)}},100)),()=>{we&&clearInterval(we)}},Un=()=>{const[e,n]=d.useState(""),[a,r]=d.useState(null),[o,l]=d.useState(!1),[c,i]=d.useState(0),[u,h]=d.useState([]),[N,w]=d.useState([]),[S,y]=d.useState({text:"",startTime:0,endTime:5,type:1}),[f,x]=d.useState(!1),[b,L]=d.useState([]),[D,R]=d.useState("input"),[E,j]=d.useState(1),[V,Q]=d.useState(null),[W,le]=d.useState(""),X=d.useRef(null),me=d.useRef(null),B=d.useRef(null),H=d.useRef(null),ee=d.useRef(null),I=d.useRef({});d.useEffect(()=>{if(o&&B.current)return Hn(B.current,E,o)},[E,o,b]);const k={container:{position:"relative",width:"100%",maxWidth:f?"none":"1100px",height:f?"100vh":"auto",margin:f?"0":"20px auto",fontFamily:"sans-serif",background:"#0f0f12",color:"#ffffff",borderRadius:f?"0":"16px",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 10px 30px rgba(0,0,0,0.5)"},videoBox:{position:"relative",width:"100%",flex:1,aspectRatio:f?"auto":"16/9",background:"#000"},speedIndicator:{position:"absolute",top:"20px",left:"20px",zIndex:11,background:"rgba(0, 0, 0, 0.7)",color:"#00e676",fontSize:"14px",fontWeight:"bold",padding:"6px 12px",borderRadius:"20px",border:"1px solid rgba(0, 230, 118, 0.4)",backdropFilter:"blur(5px)",pointerEvents:"none"},overlay:{position:"absolute",top:"30px",right:"30px",zIndex:10,textAlign:"right",pointerEvents:"none",width:"50%"},highlightText:{background:"rgba(255, 230, 0, 0.25)",color:"#fff",fontSize:"clamp(18px, 4vw, 28px)",fontWeight:"800",textShadow:"0 2px 8px rgba(0,0,0,1)",padding:"10px 20px",borderRadius:"4px",display:"inline-block",marginBottom:"10px",backdropFilter:"blur(10px)",borderRight:"6px solid #ff0055"},controlPanel:{padding:"24px",background:f?"rgba(22, 22, 30, 0.95)":"#16161e",borderTop:"1px solid #2a2a35",position:f?"absolute":"relative",bottom:0,left:0,right:0,zIndex:100,backdropFilter:f?"blur(15px)":"none"},tabBar:{display:"flex",gap:"15px",borderBottom:"1px solid #2a2a35",marginBottom:"20px"},tabButton:g=>({padding:"12px 20px",cursor:"pointer",background:"none",border:"none",borderBottom:g?"3px solid #3d5afe":"3px solid transparent",color:g?"#3d5afe":"#888",fontWeight:"700",transition:"all 0.2s ease"}),input:{flex:1,padding:"12px 15px",background:"#252530",color:"#ffffff",border:"1px solid #3f3f50",borderRadius:"8px",outline:"none"},button:{padding:"10px 20px",borderRadius:"8px",border:"none",cursor:"pointer",fontWeight:"600",background:"#3d5afe",color:"white"},itemRow:g=>({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px",marginBottom:"8px",background:g?"#2d2d45":"#1f1f2b",borderRadius:"8px",border:g?"2px solid #3d5afe":"1px solid #2d2d3d",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",transform:g?"translateX(5px)":"translateX(0)"})},Y=g=>{B.current&&(j(g),B.current.setPlaybackRate(g>2?2:g))},te=()=>{document.fullscreenElement?document.exitFullscreen():X.current.requestFullscreen().catch(g=>console.error(g))},q=d.useCallback(g=>{var m;(m=B.current)!=null&&m.destroy&&B.current.destroy(),l(!1),B.current=new window.YT.Player(me.current,{videoId:g,width:"100%",height:"100%",playerVars:{autoplay:1,controls:1,modestbranding:1,rel:0},events:{onReady:v=>{l(!0),j(v.target.getPlaybackRate()),H.current&&clearInterval(H.current),H.current=setInterval(()=>{i(B.current.getCurrentTime())},200)},onPlaybackRateChange:v=>{E<=2&&j(v.data)}}})},[E]),pe=g=>{const m=(g.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/)||[])[1];if(m){r(m),q(m),localStorage.setItem("last_v_url",g);const $=[{id:m,url:g,timestamp:Date.now()},...N.filter(U=>U.id!==m)].slice(0,15);w($),localStorage.setItem("yt_video_history",JSON.stringify($))}},se=g=>{h(g),a&&localStorage.setItem(`yt_notes_v_${a}`,JSON.stringify(g))};d.useEffect(()=>{const g=localStorage.getItem("yt_video_history");g&&w(JSON.parse(g));const m=localStorage.getItem("last_v_url");if(m&&n(m),!window.YT){const $=document.createElement("script");$.src="https://www.youtube.com/iframe_api",document.body.appendChild($)}const v=()=>x(!!document.fullscreenElement);return document.addEventListener("fullscreenchange",v),()=>{clearInterval(H.current),document.removeEventListener("fullscreenchange",v)}},[]),d.useEffect(()=>{if(a){const g=localStorage.getItem(`yt_notes_v_${a}`);h(g?JSON.parse(g):[])}},[a]),d.useEffect(()=>{if(!o)return;const g=u.filter(v=>c>=v.startTime&&c<=v.endTime);L(g);const m=g.find(v=>v.type===0);m&&B.current.seekTo(m.endTime,!0)},[c,u,o,E]);const de=g=>{var P;if(!a||!S.text&&g=="1")return;const m=Math.floor(((P=B.current)==null?void 0:P.getCurrentTime())||c),v=m>S.startTime?m:S.startTime+2,$={...S,endTime:v,id:Date.now(),vid:a};let U=u.length>0?u[u.length-1]:null;U&&g==U.type&&U.text==$.text?($.text=S.text,U.endTime=v,se([...u])):($.type=g,se([...u,$]),y({...S,startTime:v}))},J=g=>{window.open(`https://www.google.com/maps/place/${encodeURIComponent(g)}`,"place")};return s("div",{ref:X,style:k.container,children:[s("div",{style:k.videoBox,children:[t("div",{ref:me,style:{width:"100%",height:"100%"}}),E!==1&&s("div",{style:k.speedIndicator,children:["⚡ ",E,"x Speed"]}),s("div",{style:k.overlay,children:[b.map(g=>s("div",{style:k.highlightText,children:[g.type===0&&"⏭️ SKIP: ",g.text]},g.id)),S.text&&t("div",{style:{...k.highlightText,borderRightColor:"#3d5afe",opacity:.8},children:S.text})]})]}),s("div",{style:k.controlPanel,children:[!f&&s("div",{style:{display:"flex",gap:"10px",marginBottom:"20px"},children:[t("input",{style:k.input,placeholder:"Paste YouTube Link...",value:e,onChange:g=>n(g.target.value)}),t("button",{style:{...k.button,background:"#00c853"},onClick:()=>pe(e),children:"Load"}),t("button",{style:{...k.button,background:"#555"},onClick:te,children:"⛶ FS"})]}),s("div",{style:k.tabBar,children:[s("div",{style:{display:"flex",gap:"8px",marginBottom:"15px"},children:[s("button",{style:k.tabButton(D==="input"),onClick:()=>R("input"),children:["Add Note( ",S.startTime,"s - ",Math.floor(c),"s)"]}),s("button",{style:k.tabButton(D==="list"),onClick:()=>R("list"),children:["Notes (",u.length,")"]}),t("button",{style:k.tabButton(D==="history"),onClick:()=>R("history"),children:"History"})]}),t("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"15px"},children:t("div",{style:{display:"flex",gap:"8px"},children:[1,2,4,8,20].map(g=>s("button",{onClick:()=>Y(g),style:{background:E===g?"#3d5afe":"#333",color:"#fff",border:"none",padding:"5px 10px",borderRadius:"4px",cursor:"pointer",transition:"background 0.2s ease"},onMouseEnter:m=>{m.currentTarget.style.background=E===g?"#5c7cff":"#444"},onMouseLeave:m=>{m.currentTarget.style.background=E===g?"#3d5afe":"#333"},children:[g,"x"]},g))})})]}),D==="input"&&t("div",{style:{background:"#252530",padding:"20px",borderRadius:"12px"},children:s("div",{style:{display:"flex",gap:"10px"},children:[t("input",{style:k.input,value:S.text,onChange:g=>y({...S,text:g.target.value}),placeholder:"Note text..."}),t("button",{onClick:()=>de(1),style:k.button,children:"Normal"}),t("button",{onClick:()=>de(10),style:{...k.button,background:"#ff0055"},children:"2x"}),t("button",{onClick:()=>de(0),style:{...k.button,background:"#555"},children:"Skip"}),t("button",{onClick:()=>y({...S,startTime:Math.floor(c)}),style:{...k.button,background:"#444"},children:"Set Start"})]})}),D==="list"&&t("div",{ref:ee,style:{maxHeight:f?"25vh":"150px",overflowY:"auto"},children:u.sort((g,m)=>g.startTime-m.startTime).map(g=>s("div",{ref:m=>I.current[g.id]=m,style:k.itemRow(b.some(m=>m.id===g.id)),children:[s("div",{style:{flex:1},children:[s("span",{style:{color:g.type===10?"#ff0055":"#00e676",fontWeight:"bold",marginRight:"10px"},children:[g.startTime,"-",g.endTime,"s"]}),V===g.id?t("input",{autoFocus:!0,style:k.input,value:W,onChange:m=>le(m.target.value),onBlur:()=>{se(u.map(m=>m.id===g.id?{...m,text:W}:m)),Q(null)}}):t("span",{onDoubleClick:()=>{Q(g.id),le(g.text)},children:g.text||"(Edit)"}),g.text&&t("button",{style:{...k.button,padding:"5px"},onClick:()=>J(g.text),children:"Go"})]}),s("div",{style:{display:"flex",gap:"8px"},children:[t("button",{style:{...k.button,padding:"5px"},onClick:()=>{const m=g.type===1?2:g.type===2?0:1;se(u.map(v=>v.id===g.id?{...v,type:m}:v))},children:g.type===1?"Normal":g.type===10?"⏩ 2x":"⏭️ Skip"}),t("button",{style:{...k.button,padding:"5px 10px",background:"#333"},onClick:()=>B.current.seekTo(g.startTime,!0),children:"Jump"}),t("button",{style:{...k.button,padding:"5px 10px",background:"#b71c1c"},onClick:()=>se(u.filter(m=>m.id!==g.id)),children:"X"})]})]},g.id))}),D==="history"&&s("div",{style:{maxHeight:f?"25vh":"150px",overflowY:"auto"},children:[N.length===0&&t("div",{style:{textAlign:"center",opacity:.5,padding:"20px"},children:"No history yet"}),N.map(g=>s("div",{style:{...k.itemRow(a===g.id),cursor:"pointer"},onClick:()=>{n(g.url),pe(g.url)},children:[s("div",{style:{display:"flex",gap:"15px",alignItems:"center"},children:[t("img",{src:`https://img.youtube.com/vi/${g.id}/default.jpg`,style:{width:"60px",borderRadius:"4px"},alt:"thumb"}),t("span",{style:{fontSize:"14px"},children:g.id})]}),t("button",{style:{...k.button,background:a===g.id?"#00c853":"#333"},children:a===g.id?"Playing":"Load"})]},g.timestamp))]})]})]})},Wn=()=>{const[e,n]=d.useState("area1"),[a,r]=d.useState(""),[o,l]=d.useState({}),[c,i]=d.useState(!1),[u,h]=d.useState(null),[N,w]=d.useState(!1),[S,y]=d.useState("default"),[f,x]=d.useState(!1),b=d.useRef(null),L=d.useRef(null),D=d.useRef(null),{questions:R}=Fe(),E=R.filter(m=>m.section==="甲部"&&m.sectionName==="地方"),j=R.filter(m=>m.section==="甲部"&&m.sectionName==="路線");let V="";E.forEach(m=>{V+=`${m.question}:${m.options[m.correctAnswer]}
`});const Q=[...E].sort((m,v)=>m.options[m.correctAnswer].localeCompare(v.options[v.correctAnswer]));j.forEach((m,v)=>{V+=`${v+1} ${m.question.replace("，最直接的路線是？","")}:${m.options[m.correctAnswer]}
--------
`}),console.log(V);const W={};Q.forEach(m=>{let v=m.options[m.correctAnswer];W[v]||(W[v]=[]),W[v].push(m)});let le=Object.keys(W);const X=[{id:"default",label:"默認排序",icon:Ft,description:"按問題數量從多到少，數量相同時按地區名稱排序",getSortedKeys:(m,v)=>[...m].sort(($,U)=>v[U].length-v[$].length||$.localeCompare(U,"zh-HK"))},{id:"nameAsc",label:"地區名稱 (A-Z)",icon:zt,description:"按地區名稱正序排列",getSortedKeys:(m,v)=>[...m].sort(($,U)=>$.localeCompare(U,"zh-HK"))},{id:"nameDesc",label:"地區名稱 (Z-A)",icon:Ht,description:"按地區名稱倒序排列",getSortedKeys:(m,v)=>[...m].sort(($,U)=>U.localeCompare($,"zh-HK"))},{id:"countAsc",label:"問題數量 (少到多)",icon:Ut,description:"按問題數量從少到多排列",getSortedKeys:(m,v)=>[...m].sort(($,U)=>v[$].length-v[U].length||$.localeCompare(U,"zh-HK"))},{id:"countDesc",label:"問題數量 (多到少)",icon:Wt,description:"按問題數量從多到少排列",getSortedKeys:(m,v)=>[...m].sort(($,U)=>v[U].length-v[$].length||$.localeCompare(U,"zh-HK"))}],B=(()=>{const m=X.find(v=>v.id===S);return m&&m.getSortedKeys?m.getSortedKeys(le,W):X[0].getSortedKeys(le,W)})(),ee=(()=>X.find(v=>v.id===S)||X[0])(),I=ee.icon,k=B.filter(m=>m.toLowerCase().includes(a.toLowerCase())),Y=m=>{l(v=>({...v,[m]:!v[m]}))},te=()=>{const m={};k.forEach(v=>{m[v]=!0}),l(m)},q=()=>{l({})},pe=m=>{y(m),l({}),x(!1)};d.useEffect(()=>{const m=v=>{L.current&&!L.current.contains(v.target)&&i(!1),D.current&&!D.current.contains(v.target)&&x(!1)};return document.addEventListener("mousedown",m),()=>document.removeEventListener("mousedown",m)},[]);const se=(m,v)=>{b.current&&((u==null?void 0:u.path)===m&&N?(b.current.pause(),b.current.currentTime=0,w(!1),h(null)):(b.current.src=m,b.current.loop=!0,b.current.play().catch($=>{console.error("音頻播放失敗:",$),w(!1),h(null)}),w(!0),h({path:m,label:v})),i(!1))},de=()=>{b.current&&(b.current.pause(),b.current.currentTime=0,w(!1),h(null))},J=()=>{w(!1),h(null)};d.useEffect(()=>()=>{b.current&&(b.current.pause(),b.current.currentTime=0)},[]);const g=[{path:"./area_audio1.mp3",label:"地區音頻 1"},{path:"./area_audio2.mp3",label:"地區音頻 2"},{path:"./n-s-w-e.mp3",label:"南北西東"},{path:"./seq.mp3",label:"順序"},{path:"./route.mp3",label:"路線"}];return s("div",{className:"space-y-6 p-4",children:[t("div",{className:"border-b border-gray-200",children:s("nav",{className:"flex gap-2","aria-label":"Tabs",children:[t("button",{onClick:()=>n("area1"),className:`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${e==="area1"?"bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm":"text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`,children:"📍 地區問題列表"}),t("button",{onClick:()=>n("area2"),className:`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${e==="area2"?"bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm":"text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`,children:"🗺️ 輔助工具 (Area2)"}),t("button",{onClick:()=>n("area3"),className:`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${e==="area3"?"bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm":"text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`,children:"🗺️ 輔助工具 (Area3)"})]})}),s("div",{className:"mt-4",children:[e==="area1"&&s("div",{children:[s("div",{className:"sticky top-0 bg-white z-10 pb-4 border-b",children:[s("div",{className:"flex items-center gap-4 flex-wrap",children:[s("div",{className:"relative flex-1 max-w-md",children:[t(Be,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),t("input",{type:"text",placeholder:"🔍 搜尋地區名稱...",value:a,onChange:m=>r(m.target.value),className:"w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"})]}),s("div",{className:"relative",ref:D,children:[s("button",{onClick:()=>x(!f),className:"flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200",title:"選擇排序方式",children:[t(I,{className:"w-4 h-4"}),t("span",{children:ee.label}),f?t(Ve,{className:"w-4 h-4"}):t(De,{className:"w-4 h-4"})]}),f&&t("div",{className:"absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20",children:s("div",{className:"py-2",children:[t("div",{className:"px-3 py-2 text-xs font-semibold text-gray-500 border-b bg-gray-50",children:"選擇排序方式"}),X.map(m=>{const v=m.icon;return t("button",{onClick:()=>pe(m.id),className:`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${S===m.id?"bg-blue-50 text-blue-600":"text-gray-700"}`,children:s("div",{className:"flex items-start gap-3",children:[t(v,{className:`w-4 h-4 mt-0.5 ${S===m.id?"text-blue-500":"text-gray-400"}`}),s("div",{className:"flex-1",children:[s("div",{className:"text-sm font-medium",children:[m.label,S===m.id&&t("span",{className:"ml-2 text-xs text-blue-500",children:"✓"})]}),t("div",{className:"text-xs text-gray-500 mt-0.5",children:m.description})]})]})},m.id)})]})})]}),s("div",{className:"relative",ref:L,children:[s("button",{onClick:()=>i(!c),className:`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${N?"bg-green-500 text-white hover:bg-green-600":"bg-blue-500 text-white hover:bg-blue-600"}`,children:[N?s(ce,{children:[t(Je,{className:"w-4 h-4"}),s("span",{children:["🎵 ",(u==null?void 0:u.label)||"播放中"]})]}):s(ce,{children:[t(jt,{className:"w-4 h-4"}),t("span",{children:"選擇音頻播放"})]}),c?t(Ve,{className:"w-4 h-4"}):t(De,{className:"w-4 h-4"})]}),c&&t("div",{className:"absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20",children:s("div",{className:"py-2",children:[s("div",{className:"px-3 py-2 text-xs font-semibold text-gray-500 border-b flex justify-between items-center",children:[t("span",{children:"選擇要播放的音頻"}),g.length>1&&s("span",{className:"text-xs text-gray-400",children:["共 ",g.length," 個"]})]}),g.map(m=>s("button",{onClick:()=>se(m.path,m.label),className:`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between ${(u==null?void 0:u.path)===m.path&&N?"bg-green-50 text-green-600":"text-gray-700"}`,children:[s("span",{className:"flex items-center gap-2",children:[(u==null?void 0:u.path)===m.path&&N&&t(Je,{className:"w-4 h-4 text-green-500"}),m.label]}),(u==null?void 0:u.path)===m.path&&N&&t("span",{className:"text-xs text-green-500",children:"播放中"})]},m.path)),N&&s(ce,{children:[t("div",{className:"border-t my-1"}),s("button",{onClick:de,className:"w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2",children:[t($t,{className:"w-4 h-4"}),"停止播放"]})]})]})})]}),a&&s("button",{onClick:()=>r(""),className:"flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100",children:[t(je,{className:"w-4 h-4"}),"清除"]}),s("div",{className:"flex gap-2",children:[t("button",{onClick:te,className:"px-3 py-2 text-sm text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50",children:"全部展開"}),t("button",{onClick:q,className:"px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100",children:"全部收起"})]})]}),s("div",{className:"mt-3 flex gap-4 text-sm text-gray-500 flex-wrap",children:[s("span",{children:["📊 總共 ",le.length," 個地區"]}),a&&s("span",{children:["🔍 符合 ",k.length," 個地區"]}),s("span",{children:["📝 總共 ",Q.length," 條問題"]}),s("span",{className:"flex items-center gap-1 text-blue-600",children:[t(ee.icon,{className:"w-3 h-3"}),"當前排序: ",ee.label]})]})]}),t("audio",{ref:b,onEnded:J,preload:"auto"}),s("div",{className:"space-y-3 mt-4",children:[k.map((m,v)=>{const $=W[m].length,U=o[m];return s("div",{className:"border rounded-lg overflow-hidden",children:[t("div",{className:"flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors",onClick:()=>Y(m),children:s("div",{className:"flex items-center gap-3",children:[U?t(De,{className:"w-5 h-5 text-gray-500"}):t(it,{className:"w-5 h-5 text-gray-500"}),s("div",{children:[s("span",{className:"font-semibold text-lg",children:[v+1,". ",m]}),s("span",{className:"ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800",children:["(",$,")"]})]})]})}),U&&t("div",{className:"divide-y",children:W[m].map((P,ye)=>t("div",{className:"p-4 hover:bg-gray-50",children:s("div",{className:"flex items-start gap-3",children:[t("div",{className:"flex-shrink-0 w-8 h-6 flex items-center justify-center bg-gray-200 rounded text-xs font-medium text-gray-700",children:ye+1}),t("div",{className:"flex-1",children:t("div",{className:"text-gray-800",children:P.question})})]})},P.id))})]},m)}),k.length===0&&s("div",{className:"text-center py-12",children:[t("div",{className:"text-gray-400 text-6xl mb-4",children:"🔍"}),s("div",{className:"text-gray-500 text-lg",children:["找不到符合「",a,"」的地區"]}),t("div",{className:"text-gray-400 text-sm mt-2",children:"請嘗試其他關鍵字"})]})]})]}),e==="area2"&&t("div",{children:t(Fn,{})}),e==="area3"&&t("div",{children:t(Un,{})}),"      "]})]})},qn=Object.freeze(Object.defineProperty({__proto__:null,default:Wn},Symbol.toStringTag,{value:"Module"})),G={HOSPITAL:"hospital",TOURIST_ATTRACTION:"tourist_attraction",HOTEL:"hotel",GOVERNMENT_BUILDING:"government_building",COMMERCIAL_BUILDING:"commercial_building",SHOPPING_MALL:"shopping_mall",RESIDENTIAL_BUILDING:"residential_building",UNIVERSITY:"university"},Ke={[G.HOSPITAL]:"醫院",[G.TOURIST_ATTRACTION]:"旅遊景點",[G.HOTEL]:"酒店",[G.GOVERNMENT_BUILDING]:"政府樓宇",[G.COMMERCIAL_BUILDING]:"商業大厦",[G.SHOPPING_MALL]:"購物商場",[G.RESIDENTIAL_BUILDING]:"住宅樓宇",[G.UNIVERSITY]:"大專院校"},Et={[G.HOSPITAL]:qt,[G.TOURIST_ATTRACTION]:Gt,[G.HOTEL]:Qt,[G.GOVERNMENT_BUILDING]:Bt,[G.COMMERCIAL_BUILDING]:Yt,[G.SHOPPING_MALL]:Kt,[G.RESIDENTIAL_BUILDING]:Vt,[G.UNIVERSITY]:Jt},Gn=[{keywords:["醫院","診所","醫療"],type:G.HOSPITAL},{keywords:["酒店","賓館","旅館"],type:G.HOTEL},{keywords:["大學","學院","學校"],type:G.UNIVERSITY},{keywords:["政府","警署","法院"],type:G.GOVERNMENT_BUILDING},{keywords:["商場","購物","百貨"],type:G.SHOPPING_MALL},{keywords:["住宅","屋苑","邨"],type:G.RESIDENTIAL_BUILDING},{keywords:["商業","大厦","中心","廣場"],type:G.COMMERCIAL_BUILDING},{keywords:["景點","公園","博物館","海灘"],type:G.TOURIST_ATTRACTION}],Qn=["中西區","灣仔區","東區","南區","油尖旺區","深水埗區","九龍城區","黃大仙區","觀塘區","葵青區","沙田區","大埔區","北區","西貢區","荃灣區","屯門區","元朗區","離島區","未分類"],et={港島:["中西區","灣仔區","東區","南區"],九龍東:["黃大仙區","觀塘區"],九龍西:["油尖旺區","深水埗區","九龍城區"],新界東:["沙田區","大埔區","北區","西貢區"],新界西:["葵青區","荃灣區","屯門區","元朗區","離島區"]},Bn={中西區:"bg-red-100 text-red-800",灣仔區:"bg-orange-100 text-orange-800",東區:"bg-amber-100 text-amber-800",南區:"bg-yellow-100 text-yellow-800",油尖旺區:"bg-lime-100 text-lime-800",深水埗區:"bg-green-100 text-green-800",九龍城區:"bg-emerald-100 text-emerald-800",黃大仙區:"bg-teal-100 text-teal-800",觀塘區:"bg-cyan-100 text-cyan-800",葵青區:"bg-slate-100 text-slate-800",沙田區:"bg-sky-100 text-sky-800",大埔區:"bg-blue-100 text-blue-800",北區:"bg-indigo-100 text-indigo-800",西貢區:"bg-violet-100 text-violet-800",荃灣區:"bg-purple-100 text-purple-800",屯門區:"bg-fuchsia-100 text-fuchsia-800",元朗區:"bg-pink-100 text-pink-800",離島區:"bg-rose-100 text-rose-800",未分類:"bg-gray-100 text-gray-800"},It={中西區:["中環","上環","西環","半山","山頂","西營盤","堅尼地城","石塘咀"],灣仔區:["灣仔","銅鑼灣","跑馬地","大坑","掃桿埔","鵝頸"],東區:["北角","鰂魚涌","筲箕灣","柴灣","小西灣","西灣河","太古","杏花邨"],南區:["香港仔","鴨脷洲","黃竹坑","薄扶林","赤柱","淺水灣","深水灣","石澳","大潭"],油尖旺區:["油麻地","尖沙咀","旺角","大角咀","佐敦","太子","何文田"],深水埗區:["深水埗","長沙灣","荔枝角","美孚","石硤尾","南昌"],九龍城區:["九龍城","紅磡","土瓜灣","何文田","黃埔","馬頭圍","啟德"],黃大仙區:["黃大仙","鑽石山","新蒲崗","樂富","橫頭磡","慈雲山"],觀塘區:["觀塘","牛頭角","九龍灣","藍田","油塘","秀茂坪","順利","彩雲"],沙田區:["沙田","大圍","馬鞍山","火炭","小瀝源","石門","第一城","顯徑"],大埔區:["大埔","太和","大埔墟","大埔工業邨","林村","汀角","船灣"],北區:["上水","粉嶺","聯和墟","沙頭角","打鼓嶺","古洞"],西貢區:["西貢","將軍澳","坑口","寶琳","調景嶺","康城","清水灣","科大"],荃灣區:["荃灣","葵涌","青衣","荔景","汀九","深井","馬灣"],屯門區:["屯門","青山灣","小欖","龍鼓灘","蝴蝶灣","兆康","大興"],元朗區:["元朗","天水圍","屏山","錦田","流浮山","廈村","新田"],離島區:["大嶼山","東涌","梅窩","長洲","南丫島","坪洲","愉景灣","迪士尼"]},tt={瑪麗醫院:"中西區",威爾斯親王醫院:"沙田區",贊育醫院:"中西區",東華醫院:"中西區",東華三院馮堯敬醫院:"南區",葛量洪醫院:"南區",東區尤德夫人那打素醫院:"東區",東華東院:"灣仔區",鄧肇堅醫院:"灣仔區",律敦治醫院:"灣仔區",黃竹坑醫院:"南區",伊利沙伯醫院:"油尖旺區",九龍醫院:"九龍城區",香港佛教醫院:"黃大仙區",香港眼科醫院:"九龍城區",東華三院黃大仙醫院:"黃大仙區",聖母醫院:"黃大仙區",廣華醫院:"油尖旺區",明愛醫院:"深水埗區",瑪嘉烈醫院:"葵青區",葵涌醫院:"葵青區",仁濟醫院:"荃灣區",基督教聯合醫院:"觀塘區",靈實醫院:"西貢區",將軍澳醫院:"西貢區",沙田醫院:"沙田區",雅麗氏何妙齡那打素醫院:"大埔區",大埔醫院:"大埔區",北區醫院:"北區",屯門醫院:"屯門區",博愛醫院:"元朗區",嘉諾撒醫院:"中西區",明德國際醫院:"中西區",香港港安醫院:"灣仔區",聖保祿醫院:"灣仔區",養和醫院:"灣仔區","寶血醫院（明愛）":"深水埗區",播道醫院:"九龍城區",聖德肋撒醫院:"九龍城區",香港浸信會醫院:"九龍城區",荃灣港安醫院:"荃灣區",沙田國際醫務中心仁安醫院:"沙田區",青山醫院:"屯門區",小欖醫院:"屯門區",大口環根德公爵夫人兒童醫院:"南區",北大嶼山醫院:"離島區",天水圍醫院:"元朗區",港怡醫院:"南區",香港兒童醫院:"九龍城區",香港中文大學醫院:"沙田區",星光大道:"油尖旺區",金紫荊廣場:"灣仔區",香港迪士尼樂園:"離島區",香港濕地公園:"元朗區",玉器市場:"油尖旺區",九龍寨城公園:"九龍城區","昂坪纜車 - 東涌纜車站":"離島區",香港海洋公園:"南區",寶蓮禪寺:"離島區",凌霄閣:"中西區",亞洲國際博覽館:"離島區",屏山文物徑:"元朗區",香港會議展覽中心:"灣仔區",香港文化博物館:"沙田區",香港歷史博物館:"油尖旺區",香港科學館:"油尖旺區",香港太空館:"油尖旺區",香港大會堂:"中西區",香港體育館:"九龍城區",香港文化中心:"油尖旺區",伊利沙伯體育館:"灣仔區",沙田大會堂:"沙田區",尖沙咀天星碼頭:"油尖旺區",1881:"油尖旺區",沙田車公廟:"沙田區",文武廟:"中西區",林村許願廣場:"大埔區",龍躍頭文物徑:"北區",美利樓:"南區",和昌大押:"灣仔區",大館:"中西區",香港藝術館:"油尖旺區",香港故宮文化博物館:"油尖旺區",戲曲中心:"油尖旺區",啟德體育園:"九龍城區",北角政府合署:"東區",長沙灣政府合署:"深水埗區",何文田政府合署:"九龍城區",東九龍政府合署:"觀塘區",九龍政府合署:"油尖旺區",葵興政府合署:"荃灣區",荔枝角政府合署:"深水埗區",馬頭角道政府合署:"九龍城區",旺角政府合署:"油尖旺區",梅窩政府合署:"離島區",牛頭角政府合署:"觀塘區",北區政府合署:"北區",培正道政府合署:"九龍城區",西貢政府合署:"西貢區",沙田政府合署:"沙田區",深水埗政府合署:"深水埗區",大興政府合署:"屯門區",大埔政府合署:"大埔區",土瓜灣政府合署:"九龍城區",荃灣政府合署:"荃灣區",屯門政府合署:"屯門區",元朗政府合署:"元朗區",香港恒生大學:"沙田區",香港城市大學:"九龍城區",香港浸會大學:"九龍城區",香港樹仁大學:"東區",嶺南大學:"屯門區",香港中文大學:"沙田區",香港教育大學:"大埔區",香港理工大學:"九龍城區",香港科技大學:"西貢區",香港都會大學:"九龍城區",香港大學本部大樓:"中西區",聖方濟各大學:"西貢區"},Me=e=>{if(!e||!e.name)return"未知地區";if(tt[e.name])return tt[e.name];const n=e.name.toLowerCase();for(const[a,r]of Object.entries(It))for(const o of r)if(n.includes(o.toLowerCase()))return a;return Qn.indexOf(e.district)>-1?e.district:"其他地區"},Yn=()=>Object.keys(It),Pt=e=>{const n={};Yn().forEach(r=>{n[r]=[]}),n.其他地區=[],n.未知地區=[],e.forEach(r=>{const o=Me(r.name);n[o]?n[o].push(r):n.其他地區.push(r)});const a={};return Object.entries(n).forEach(([r,o])=>{o.length>0&&(a[r]=o.sort((l,c)=>l.name.localeCompare(c.name)))}),a},Kn=e=>{const n=Pt(e),a={};return Object.entries(n).forEach(([r,o])=>{a[r]={count:o.length,locations:o}}),a},Z={USER_INPUT:"user_input",AREA_SECTION:"area_section",ROUTE_SECTION:"route_section"},He={[Z.USER_INPUT]:"用户输入",[Z.AREA_SECTION]:"地方",[Z.ROUTE_SECTION]:"路線"},Vn=()=>{const{questions:e}=Fe.getState();return e.filter(n=>n.to)},Jn=()=>{const{questions:e}=Fe.getState();return e.filter(n=>n.to&&n.from)},nt=()=>{const e=new Map;return Vn().forEach(a=>{if(a.to&&a.to.trim()){const r=a.to.trim();e.has(r)||e.set(r,{...a,name:r,correctAnswer:a.options?a.options[a.correctAnswer]:"",questionId:a.id})}}),Array.from(e.values()).sort((a,r)=>a.name.localeCompare(r.name))},at=()=>{const e=new Map;return Jn().forEach(a=>{if(a.from&&a.from.trim()){const r=a.from.trim();e.has(r)||e.set(r,{name:r,correctAnswer:a.options?a.options[a.correctAnswer]:"",explanation:a.explanation,questionId:a.id,category:a.category,sectionName:a.sectionName})}if(a.to&&a.to.trim()){const r=a.to.trim();e.has(r)||e.set(r,{name:r,correctAnswer:a.options?a.options[a.correctAnswer]:"",explanation:a.explanation,questionId:a.id,category:a.category,sectionName:a.sectionName})}}),Array.from(e.values()).sort((a,r)=>a.name.localeCompare(r.name))};class Xn{constructor(){this.userLocations=this.loadUserLocations(),this.defaultFromLocation=this.loadDefaultFromLocation()}loadUserLocations(){try{if(typeof localStorage<"u"){const n=localStorage.getItem("hkTaxiUserLocations");if(n)return JSON.parse(n)}}catch(n){console.error("加载用户地点失败:",n)}return[]}saveUserLocations(n){try{if(typeof localStorage<"u")return localStorage.setItem("hkTaxiUserLocations",JSON.stringify(n)),this.userLocations=n,!0}catch(a){console.error("保存用户地点失败:",a)}return!1}loadDefaultFromLocation(){try{if(typeof localStorage<"u"){const n=localStorage.getItem("hkTaxiDefaultFromLocation");if(n)return JSON.parse(n)}}catch(n){console.error("加载默认出发地点失败:",n)}return{type:"random",specificLocation:"",source:Z.USER_INPUT}}saveDefaultFromLocation(n){try{if(typeof localStorage<"u")return localStorage.setItem("hkTaxiDefaultFromLocation",JSON.stringify(n)),this.defaultFromLocation=n,!0}catch(a){console.error("保存默认出发地点失败:",a)}return!1}addUserLocation(n){if(!n||!n.trim())return!1;const a=n.trim();if(this.userLocations.some(l=>l.name===a))return!1;const r={name:a,source:Z.USER_INPUT,createdAt:new Date().toISOString()},o=[...this.userLocations,r];return this.saveUserLocations(o)}removeUserLocation(n){const a=this.userLocations.filter(r=>r.name!==n);return this.saveUserLocations(a)}updateUserLocation(n,a){if(!a||!a.trim())return!1;const r=a.trim(),o=this.userLocations.map(l=>l.name===n?{...l,name:r}:l);return this.saveUserLocations(o)}getAllLocations(){const n=this.userLocations.map(i=>({...i,displayName:i.name,sourceLabel:He[i.source],district:Me(i),correctAnswer:null,explanation:null,questionId:null,category:null,sectionName:null})),a=nt(),r=at(),o=a.map(i=>({...i,source:Z.AREA_SECTION,displayName:i.name,sourceLabel:He[Z.AREA_SECTION],district:Me(i)})),l=r.map(i=>({...i,source:Z.ROUTE_SECTION,displayName:i.name,sourceLabel:He[Z.ROUTE_SECTION],district:Me(i)})),c=new Map;return n.forEach(i=>{c.set(i.name,i)}),[...o,...l].forEach(i=>{c.has(i.name)||c.set(i.name,i)}),Array.from(c.values()).sort((i,u)=>i.name.localeCompare(u.name))}getRandomLocation(){const n=this.getAllLocations();if(n.length===0)return null;const a=Math.floor(Math.random()*n.length);return n[a]}getDefaultFromLocation(){const n=this.defaultFromLocation;if(n.type==="specific"&&n.specificLocation){const o=this.getAllLocations().find(l=>l.name===n.specificLocation);if(o)return{...o,isRandom:!1}}else if(n.type==="current")return{name:"現在位置",isRandom:!1};const a=this.getRandomLocation();return a?{...a,isRandom:!0}:null}setDefaultFromLocationType(n,a=""){const r={...this.defaultFromLocation,type:n,specificLocation:n==="specific"?a:""};return this.saveDefaultFromLocation(r)}setSpecificDefaultLocation(n){return this.setDefaultFromLocationType("specific",n)}setRandomDefaultLocation(){return this.setDefaultFromLocationType("random")}getLocationStats(){const n=this.getAllLocations(),a=this.userLocations,r=nt(),o=at(),l=Kn(n);return{total:n.length,userDefined:a.length,fromAreaSection:r.length,fromRouteSection:o.length,defaultFromLocation:this.defaultFromLocation,districts:Object.keys(l).length,districtStats:l}}searchLocations(n){const a=this.getAllLocations();if(!n)return a;const r=n.toLowerCase();return a.filter(o=>o.name.toLowerCase().includes(r)||o.sourceLabel.toLowerCase().includes(r)||o.district&&o.district.toLowerCase().includes(r))}searchLocationsByDistrict(n,a=""){const o=this.getAllLocations().filter(c=>c.district===n);if(!a)return o;const l=a.toLowerCase();return o.filter(c=>c.name.toLowerCase().includes(l)||c.sourceLabel.toLowerCase().includes(l))}getAllDistricts(){const n=this.getAllLocations(),a=new Set(n.map(r=>r.district));return Array.from(a).sort()}getLocationsGroupedByDistrict(){const n=this.getAllLocations();return Pt(n)}importSystemLocation(n){const r=this.getAllLocations().find(o=>o.name===n);return r?r.source===Z.USER_INPUT?!0:this.addUserLocation(n):!1}importSystemLocations(n){let a=0;return n.forEach(r=>{this.importSystemLocation(r)&&a++}),a}resetAllData(){try{return localStorage.removeItem("hkTaxiUserLocations"),localStorage.removeItem("hkTaxiDefaultFromLocation"),this.userLocations=[],this.defaultFromLocation=this.loadDefaultFromLocation(),!0}catch(n){return console.error("重置地点数据失败:",n),!1}}}const ge=new Xn,ie={SEARCH_TERM:"grouped_filterable_list_search_term",ACTIVE_FILTERS:"grouped_filterable_list_active_filters",VIEW_MODE:"grouped_filterable_list_view_mode",EXPANDED_GROUPS:"grouped_filterable_list_expanded_groups",AUTO_EXPAND_MODE:"grouped_filterable_list_auto_expand_mode",CHAR_GRID_MODE:"grouped_filterable_list_char_grid_mode"},Zn=({filter:e,value:n,onChange:a})=>{const[r,o]=d.useState(""),l=()=>{if(!e.groupOptions||!e.optionGroups)return{所有选项:e.options};const h={};e.optionGroups.forEach(S=>{const y=e.options.filter(f=>S.options.includes(f.value));y.length>0&&(h[S.label]=y)});const N=e.optionGroups.flatMap(S=>S.options),w=e.options.filter(S=>!N.includes(S.value));return w.length>0&&(h.其他=w),h},c=e.searchable&&r.trim()?e.options.filter(h=>h.label.toLowerCase().includes(r.toLowerCase())):e.options,i=l(),u=Object.keys(i).length>1;return s("div",{className:"relative",children:[s("select",{value:n||"all",onChange:h=>a(h.target.value),className:"px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]",children:[t("option",{value:"all",children:e.allLabel||`所有${e.label}`}),u?Object.entries(i).map(([h,N])=>t("optgroup",{label:h,children:N.map(w=>t("option",{value:w.value,children:w.label},w.value))},h)):c.map(h=>t("option",{value:h.value,children:h.label},h.value))]}),e.searchable&&t("div",{className:"absolute top-0 right-0 h-full flex items-center pr-2",children:t(Be,{size:12,className:"text-gray-400"})})]})},ea=({mode:e,onModeChange:n,onClose:a})=>t("div",{className:"absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20",children:s("div",{className:"p-2",children:[t("div",{className:"text-xs font-medium text-gray-500 px-2 py-1",children:"不可用字显示方式"}),s("button",{onClick:()=>n("gray"),className:`w-full text-left px-3 py-2 text-sm rounded transition-colors ${e==="gray"?"bg-green-50 text-green-700":"hover:bg-gray-100 text-gray-700"}`,children:[s("div",{className:"flex items-center justify-between",children:[t("span",{children:"变灰显示"}),e==="gray"&&t("span",{className:"text-green-600",children:"✓"})]}),t("div",{className:"text-xs text-gray-400 mt-0.5",children:"不可用的字显示为灰色"})]}),s("button",{onClick:()=>n("hide"),className:`w-full text-left px-3 py-2 text-sm rounded transition-colors ${e==="hide"?"bg-green-50 text-green-700":"hover:bg-gray-100 text-gray-700"}`,children:[s("div",{className:"flex items-center justify-between",children:[t("span",{children:"隐藏"}),e==="hide"&&t("span",{className:"text-green-600",children:"✓"})]}),t("div",{className:"text-xs text-gray-400 mt-0.5",children:"直接隐藏不可用的字"})]})]})}),ta=({data:e=[],groupBy:n,filters:a=[],renderItem:r,renderGroupHeader:o,searchPlaceholder:l="搜索...",searchOptions:c={},showControls:i=!0,emptyMessage:u="暫無數據",rememberPreferences:h=!0,nameField:N="name"})=>{const w=()=>{if(!h)return null;try{const p=localStorage.getItem(ie.SEARCH_TERM),C=localStorage.getItem(ie.ACTIVE_FILTERS),T=localStorage.getItem(ie.VIEW_MODE),F=localStorage.getItem(ie.EXPANDED_GROUPS),K=localStorage.getItem(ie.AUTO_EXPAND_MODE),re=localStorage.getItem(ie.CHAR_GRID_MODE);return{searchTerm:p||"",activeFilters:C?JSON.parse(C):{},viewMode:T||"grouped",expandedGroups:F?new Set(JSON.parse(F)):new Set,autoExpandMode:K||"all",charGridMode:re||"gray"}}catch(p){return console.warn("加载保存的过滤状态失败:",p),null}},S=p=>{if(h)try{localStorage.setItem(ie.SEARCH_TERM,p.searchTerm),localStorage.setItem(ie.ACTIVE_FILTERS,JSON.stringify(p.activeFilters)),localStorage.setItem(ie.VIEW_MODE,p.viewMode),localStorage.setItem(ie.EXPANDED_GROUPS,JSON.stringify(Array.from(p.expandedGroups))),localStorage.setItem(ie.AUTO_EXPAND_MODE,p.autoExpandMode),localStorage.setItem(ie.CHAR_GRID_MODE,p.charGridMode)}catch(C){console.warn("保存过滤状态失败:",C)}},y=()=>{Object.values(ie).forEach(p=>{localStorage.removeItem(p)})},f=w(),[x,b]=d.useState((f==null?void 0:f.searchTerm)||""),[L,D]=d.useState((f==null?void 0:f.activeFilters)||{}),[R,E]=d.useState((f==null?void 0:f.expandedGroups)||new Set),[j,V]=d.useState((f==null?void 0:f.viewMode)||"grouped"),[Q,W]=d.useState((f==null?void 0:f.autoExpandMode)||"all"),[le,X]=d.useState(!!(f!=null&&f.searchTerm)||Object.keys((f==null?void 0:f.activeFilters)||{}).length>0),[me,B]=d.useState(!1),[H,ee]=d.useState([]),[I,k]=d.useState((f==null?void 0:f.charGridMode)||"gray"),[Y,te]=d.useState(!1),q=d.useRef(!1),pe=d.useRef(""),se=d.useRef(null);d.useEffect(()=>{const p=C=>{se.current&&!se.current.contains(C.target)&&te(!1)};return document.addEventListener("mousedown",p),()=>document.removeEventListener("mousedown",p)},[]);const de=()=>JSON.stringify({searchTerm:x,activeFilters:L,selectedChars:H}),J=p=>typeof N=="function"?N(p):p[N]||"",g=d.useMemo(()=>{let p=e;if(x.trim()){const C=x.toLowerCase();p=p.filter(T=>(c.fields||Object.keys(T)).some(K=>{const re=T[K];return re&&re.toString().toLowerCase().includes(C)}))}return a.forEach(C=>{const T=L[C.key];T&&T!=="all"&&(p=p.filter(F=>C.filterFn(F,T)))}),p},[e,x,L,a,c]),m=d.useMemo(()=>H.length===0?g:g.filter(p=>{const C=J(p);return C?H.every(T=>C.includes(T)):!1}),[g,H]),v=d.useMemo(()=>{if(H.length===0){const T=new Set;return g.forEach(F=>{const K=J(F);if(K)for(let re of K)re.trim()&&/[\u4e00-\u9fa5]/.test(re)&&T.add(re)}),T}const p=new Set,C=new Set;return m.forEach(T=>{const F=J(T);if(F)for(let K of F)K.trim()&&/[\u4e00-\u9fa5]/.test(K)&&C.add(K)}),C.forEach(T=>{if(H.includes(T)){p.add(T);return}const F=[...H,T];g.some(re=>{const ke=J(re);return ke?F.every(_=>ke.includes(_)):!1})&&p.add(T)}),p},[g,m,H]),$=d.useMemo(()=>{const p=new Set;return g.forEach(T=>{const F=J(T);if(F)for(let K of F)K.trim()&&/[\u4e00-\u9fa5]/.test(K)&&p.add(K)}),Array.from(p).sort((T,F)=>T.localeCompare(F,"zh")).map(T=>({char:T,available:v.has(T)}))},[g,v]),U=m,P=d.useMemo(()=>{let p=U;if(n&&j==="grouped"){const C={};return p.forEach(T=>{const F=n(T);C[F]||(C[F]=[]),C[F].push(T)}),C}return p},[U,n,j]);d.useEffect(()=>{if(q.current){q.current=!1;return}if(j!=="grouped"||!n)return;const p=de();if(pe.current!==p&&Object.keys(P).length>0){const T=new Set(Object.keys(P));Q==="all"?E(T):Q==="none"&&E(new Set)}pe.current=p},[x,L,H,P,j,n,Q]);const ye=p=>{const C=new Set(R);C.has(p)?C.delete(p):C.add(p),E(C);const T=Object.keys(P),F=T.length>0&&T.every(re=>C.has(re)),K=C.size===0;F&&Q!=="all"?W("all"):K&&Q!=="none"&&W("none")},Ne=()=>{q.current=!0;let p,C;R.size>0?(p=new Set,C="none"):(p=new Set(Object.keys(P)),C="all"),E(p),W(C)},Te=(p,C)=>{D(T=>({...T,[p]:C}))},Re=()=>{b(""),D({}),ee([]),E(new Set),W("none")},Le=()=>{y(),b(""),D({}),ee([]),E(new Set),V("grouped"),W("all"),k("gray"),X(!1),B(!1)},fe=(p,C)=>{!C&&!H.includes(p)||ee(T=>T.includes(p)?T.filter(F=>F!==p):[...T,p])},Ae=()=>{B(!0)},ue=()=>{B(!1)},be=()=>{ee([])},he=p=>{k(p),te(!1)};d.useEffect(()=>{S({searchTerm:x,activeFilters:L,viewMode:j,expandedGroups:R,autoExpandMode:Q,charGridMode:I});const C=!!x||Object.values(L).some(T=>T&&T!=="all");X(C)},[x,L,j,R,Q,I,h]);const ve=j==="grouped"&&n,Ce=ve?Object.keys(P).length>0:P.length>0,ze=x||Object.values(L).some(p=>p&&p!=="all")||H.length>0,Oe=U.length,Ee=g.length;return s("div",{className:"space-y-4",children:[i&&s("div",{className:"flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between",children:[s("div",{className:"flex-1 min-w-[200px] relative",children:[t(Be,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400",size:16}),t("input",{type:"text",placeholder:l,value:x,onChange:p=>b(p.target.value),className:"w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"})]}),s("div",{className:"flex items-center gap-2",children:[n&&s(ce,{children:[t("button",{onClick:()=>V("flat"),className:`px-3 py-2 text-sm rounded-lg transition-colors ${j==="flat"?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"列表视图"}),t("button",{onClick:()=>V("grouped"),className:`px-3 py-2 text-sm rounded-lg transition-colors ${j==="grouped"?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"分组视图"})]}),s("button",{onClick:Ae,className:`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-1 ${me||H.length>0?"bg-green-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,title:"按名字中的汉字快速过滤",children:[t(Xe,{size:14}),"拆字过滤",H.length>0&&t("span",{className:"ml-1 bg-white text-green-700 rounded-full px-1.5 py-0.5 text-xs font-bold",children:H.length})]})]})]}),i&&a.length>0&&s("div",{className:"flex flex-wrap gap-3 items-center",children:[t(ct,{size:16,className:"text-gray-500"}),a.map(p=>t(Zn,{filter:p,value:L[p.key]||"all",onChange:C=>Te(p.key,C)},p.key)),s("div",{className:"flex gap-2",children:[ze&&t("button",{onClick:Re,className:"px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors",children:"清除所有过滤"}),h&&le&&s("button",{onClick:Le,className:"px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1",title:"清除保存的过滤偏好",children:[t(Xt,{size:14}),"清除保存偏好"]})]})]}),H.length>0&&s("div",{className:"flex flex-wrap items-center gap-2 p-2 bg-blue-50 rounded-lg",children:[t("span",{className:"text-sm text-blue-700 font-medium",children:"当前过滤字："}),H.map(p=>s("span",{className:"inline-flex items-center gap-1 px-2 py-1 bg-blue-200 text-blue-800 rounded-md text-sm",children:[p,t("button",{onClick:()=>fe(p,!0),className:"hover:bg-blue-300 rounded-full p-0.5",children:t(je,{size:12})})]},p)),t("button",{onClick:be,className:"text-xs text-blue-600 hover:text-blue-800 ml-2",children:"清除全部"})]}),me&&s("div",{className:"border border-green-200 rounded-lg bg-green-50 p-3",children:[s("div",{className:"flex justify-between items-center mb-2",children:[s("h3",{className:"text-sm font-medium text-green-800 flex items-center gap-1",children:[t(Xe,{size:14}),"名字汉字过滤"]}),s("div",{className:"flex items-center gap-2",children:[s("div",{className:"relative",ref:se,children:[t("button",{onClick:()=>te(!Y),className:"p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors",title:"显示设置",children:t(dt,{size:16})}),Y&&t(ea,{mode:I,onModeChange:he,onClose:()=>te(!1)})]}),t("button",{onClick:ue,className:"text-gray-500 hover:text-gray-700",children:t(je,{size:16})})]})]}),s("p",{className:"text-xs text-green-600 mb-2",children:["基于当前过滤结果中的名字提取（共 ",$.length," 个不同汉字）",H.length>0&&s("span",{className:"ml-2",children:["当前匹配：",t("strong",{children:Oe})," / ",Ee," 个名字"]}),s("span",{className:"ml-2 text-gray-500",children:["（",I==="gray"?"不可用字变灰":"不可用字隐藏","）"]})]}),$.length===0?t("p",{className:"text-sm text-gray-500 italic",children:"当前过滤结果中没有可提取的名字或汉字"}):t("div",{className:"flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1",children:$.map(({char:p,available:C})=>{if(I==="hide"&&!C&&!H.includes(p))return null;const T=H.includes(p),F=C||T;return t("button",{onClick:()=>fe(p,F),disabled:!F,className:`
                      w-10 h-10 text-base font-medium rounded-lg transition-all
                      flex items-center justify-center
                      ${T?"bg-green-600 text-white shadow-md transform scale-105":F?"bg-white text-gray-700 border border-green-300 hover:bg-green-100 cursor-pointer":"bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50"}
                    `,title:F?"":"选择此字后无匹配结果",children:p},p)})}),s("div",{className:"flex justify-end mt-3 gap-2",children:[t("button",{onClick:be,className:"text-xs px-2 py-1 text-gray-600 hover:text-gray-800",children:"清除选中"}),t("button",{onClick:ue,className:"text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700",children:"完成"})]})]}),i&&ve&&Object.keys(P).length>0&&s("div",{className:"flex justify-between items-center",children:[s("span",{className:"text-sm text-gray-600",children:["共 ",Object.keys(P).length," 个分组"]}),t("button",{onClick:Ne,className:"text-sm text-blue-600 hover:text-blue-800 transition-colors",children:R.size>0?"收起所有":"展开所有"})]}),t("div",{className:"border border-gray-200 rounded-lg overflow-hidden",children:Ce?ve?t("div",{className:"max-h-96 overflow-y-auto",children:Object.entries(P).map(([p,C])=>s("div",{className:"border-b border-gray-100 last:border-b-0",children:[t("div",{className:"p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors",onClick:()=>ye(p),children:t("div",{className:"flex items-center justify-between",children:s("div",{className:"flex items-center gap-2",children:[R.has(p)?t(De,{size:16,className:"text-gray-600"}):t(it,{size:16,className:"text-gray-600"}),o?o(p,C.length,R.has(p)):s("span",{className:"font-semibold",children:[p," (",C.length,")"]})]})})}),R.has(p)&&t("div",{className:"bg-white",children:C.map((T,F)=>t("div",{className:`p-3 border-b border-gray-50 last:border-b-0 ${F%2===0?"bg-gray-50":"bg-white"}`,children:r(T,F)},T.id||F))})]},p))}):t("div",{className:"max-h-96 overflow-y-auto",children:P.map((p,C)=>t("div",{className:`p-3 border-b border-gray-100 last:border-b-0 ${C%2===0?"bg-gray-50":"bg-white"}`,children:r(p,C)},p.id||C))}):t("div",{className:"p-8 text-center text-gray-500",children:u})}),i&&Ce&&s("div",{className:"text-sm text-gray-600 text-center",children:["显示 ",ve?Object.values(P).reduce((p,C)=>p+C.length,0):P.length," 个项目",e.length>0&&s("span",{children:["（共 ",e.length," 个）"]})]})]})},Qe=({displayMode:e="expandable",className:n="",buttonClassName:a="px-4 py-2 text-white rounded-lg transition-colors text-sm",showLabels:r=!0,compact:o=!1,locations:l={from:"",to:"",hasLocationInfo:!1}})=>{const[c,i]=d.useState(!1),u=d.useRef(null);d.useEffect(()=>{const y=f=>{u.current&&!u.current.contains(f.target)&&i(!1)};return c&&document.addEventListener("mousedown",y),()=>{document.removeEventListener("mousedown",y)}},[c]);const h=()=>un.generateMapButtons(l),N=l.hasLocationInfo,w=o&&e==="all"?"compact":e;if(!N)return null;const S=h();if(w==="expandable"){const y=S[0],f=S.slice(1);return t("div",{className:`flex flex-col gap-2 ${n}`,children:s("div",{className:"relative",ref:u,children:[s("div",{className:"flex gap-2",children:[t("button",{onClick:y.onClick,className:`flex items-center flex-1 ${y.className} ${a}`,title:y.title,children:s("div",{className:"flex items-center",children:[t(Se,{size:16,className:"mr-2"}),r&&t("span",{children:y.label})]})}),t("button",{onClick:()=>i(!c),className:`flex items-center justify-center w-10 ${y.className} ${a} hover:bg-opacity-90 transition-all duration-200`,title:c?"收起":"展开更多地图",children:t("span",{className:`inline-block w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white transition-all duration-200 ${c?"transform rotate-180":""}`})})]}),c&&t("div",{className:"absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-10 overflow-hidden",children:f.map(x=>s("button",{onClick:x.onClick,className:`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 hover:bg-gray-100 ${x.className}`,title:x.title,children:[t(Se,{size:16,className:"mr-3 text-gray-600"}),r&&t("span",{className:"font-medium text-gray-800",children:x.label})]},x.key))})]})})}return w==="compact"?t("div",{className:`flex gap-2 ${n}`,children:S.map(y=>s("button",{onClick:y.onClick,className:`flex items-center ${y.className} ${a}`,title:y.title,children:[t(Se,{size:16,className:"mr-1"}),r&&t("span",{children:y.label})]},y.key))}):t("div",{className:`flex flex-wrap gap-2 ${n}`,children:S.map(y=>s("button",{onClick:y.onClick,className:`flex items-center ${y.className} ${a}`,title:y.title,children:[t(Se,{size:16,className:"mr-2"}),r&&t("span",{children:y.label})]},y.key))})},na=()=>{const[e,n]=d.useState([]),[a,r]=d.useState(null),[o,l]=d.useState([]),[c,i]=d.useState(null),u=d.useCallback(()=>{n(ge.getAllLocations()),i(ge.loadDefaultFromLocation()),r(ge.getLocationStats()),l(ge.getAllDistricts())},[]);d.useEffect(()=>{u()},[u]);const h=d.useCallback(x=>ge.addUserLocation(x)?(u(),!0):!1,[u]),N=d.useCallback((x,b)=>ge.updateUserLocation(x,b)?(u(),!0):!1,[u]),w=d.useCallback(x=>ge.removeUserLocation(x)?(u(),!0):!1,[u]),S=d.useCallback((x,b="")=>{ge.setDefaultFromLocationType(x,b),u()},[u]),y=d.useCallback(x=>{const b=ge.importSystemLocations(x);return u(),b},[u]),f=d.useCallback(()=>{ge.resetAllData(),u()},[u]);return{locations:e,stats:a,districts:o,defaultFromSettings:c,addLocation:h,updateLocation:N,deleteLocation:w,setDefaultFrom:S,importSystemLocations:y,resetAll:f,reload:u}},aa=()=>d.useCallback(e=>{const n=e.name.toLowerCase(),a=Gn.find(({keywords:r})=>r.some(o=>n.includes(o)));return(a==null?void 0:a.type)||null},[]),ra=()=>{const e=d.useCallback(a=>({[Z.USER_INPUT]:"bg-green-100 text-green-800",[Z.AREA_SECTION]:"bg-blue-100 text-blue-800",[Z.ROUTE_SECTION]:"bg-purple-100 text-purple-800"})[a]||"bg-gray-100 text-gray-800",[]),n=d.useCallback(a=>Bn[a]||"bg-gray-100 text-gray-800",[]);return{getSourceBadgeStyle:e,getDistrictColor:n}},sa=()=>{const[e,n]=d.useState(null),[a,r]=d.useState(""),o=d.useRef({}),l=d.useCallback(i=>{n(u=>u===i?null:i)},[]),c=d.useCallback(()=>n(null),[]);return{navigationMenu:e,customFromAddress:a,setCustomFromAddress:r,menuRefs:o,toggleMenu:l,closeMenu:c}},oa=(e,n)=>{const[a,r]=d.useState(!1),[o,l]=d.useState([]),c=d.useMemo(()=>e.filter(w=>w.source!==Z.USER_INPUT),[e]),i=d.useCallback(()=>c.length===0?(alert("沒有可導入的系統地點"),!1):(l(c.map(w=>w.name)),r(!0),!0),[c]),u=d.useCallback(()=>{r(!1),l([])},[]),h=d.useCallback(()=>{const w=n(o);alert(`成功導入 ${w} 個地點到用戶自定義列表`),u()},[o,n,u]),N=d.useCallback(w=>{l(S=>S.includes(w)?S.filter(y=>y!==w):[...S,w])},[]);return{showDialog:a,selection:o,systemLocations:c,openDialog:i,closeDialog:u,executeImport:h,toggleSelection:N}},la=(e,n,a)=>{const[r,o]=d.useState(""),l=d.useMemo(()=>{if(!r.trim())return e;const i=r.toLowerCase();return e.filter(u=>u.name.toLowerCase().includes(i)||u.district&&u.district.toLowerCase().includes(i)||u.sourceLabel.toLowerCase().includes(i)||u.correctAnswer&&u.correctAnswer.toLowerCase().includes(i))},[e,r]),c=d.useMemo(()=>[{key:"type",label:"類型",allLabel:"所有類型",options:Object.values(G).map(i=>({value:i,label:Ke[i],icon:Et[i]})),filterFn:(i,u)=>a(i)===u},{key:"source",label:"來源",allLabel:"所有來源",options:[{value:Z.USER_INPUT,label:"用戶輸入"},{value:Z.AREA_SECTION,label:"地方"},{value:Z.ROUTE_SECTION,label:"路線"}],filterFn:(i,u)=>i.source===u},{key:"district",label:"地區",allLabel:"所有地區",options:n.map(i=>({value:i,label:i})),filterFn:(i,u)=>i.district===u,searchable:!0,searchPlaceholder:"搜索地區...",groupOptions:!0,optionGroups:[...Object.keys(et).map(i=>({label:i,options:et[i]})),{label:"其他",options:[]}]}],[n,a]);return{searchTerm:r,setSearchTerm:o,filteredLocations:l,filters:c}},ia=({settings:e,locations:n,onSetDefault:a})=>{d.useCallback(()=>{if((e==null?void 0:e.type)==="current")return"當前位置";if((e==null?void 0:e.type)==="specific"&&(e!=null&&e.specificLocation))return e.specificLocation;if((e==null?void 0:e.type)==="random"&&n.length>0){const c=Math.floor(Math.random()*n.length);return n[c].name}return""},[e,n]);const[r,o]=d.useState({open:!1,search:""}),l=d.useMemo(()=>n.filter(c=>c.name.toLowerCase().includes(r.search.toLowerCase())),[n,r.search]);return s("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4",children:[s("h4",{className:"font-semibold text-blue-800 mb-3 flex items-center",children:[t(Se,{className:"mr-2",size:18}),"默認出發地點設置"]}),s("div",{className:"space-y-3",children:[s("div",{className:"flex items-center gap-4",children:[s("label",{className:"flex items-center",children:[t("input",{type:"radio",checked:(e==null?void 0:e.type)==="random",onChange:()=>a("random"),className:"mr-2"}),s("span",{className:"flex items-center",children:[t(We,{size:16,className:"mr-1"}),"隨機地點"]})]}),s("label",{className:"flex items-center",children:[t("input",{type:"radio",checked:(e==null?void 0:e.type)==="specific",onChange:()=>{var c;return a("specific",(e==null?void 0:e.specificLocation)||((c=n[0])==null?void 0:c.name))},className:"mr-2"}),t("span",{children:"指定地點"})]}),s("label",{className:"flex items-center",children:[t("input",{type:"radio",checked:(e==null?void 0:e.type)==="current",onChange:()=>a("current",""),className:"mr-2"}),t("span",{className:"flex items-center",children:"當前位置"})]})]}),(e==null?void 0:e.type)==="specific"&&t("div",{className:"bg-green-50 border border-green-200 rounded-lg p-3",children:s("div",{className:"flex items-center justify-between",children:[s("div",{className:"flex items-center gap-2",children:[t(mt,{size:16,className:"text-green-500"}),t("span",{className:"text-sm text-green-800 font-medium",children:e!=null&&e.specificLocation?`當前默認: ${e.specificLocation}`:"未設置默認地點"})]}),s("div",{className:"flex gap-2",children:[t("button",{onClick:()=>o({open:!0,search:""}),className:"text-xs text-blue-600 hover:text-blue-800",children:"選擇地點"}),(e==null?void 0:e.specificLocation)&&t("button",{onClick:()=>a("specific",""),className:"text-xs text-red-600 hover:text-red-800",children:"清除"})]})]})}),(e==null?void 0:e.type)==="current"&&t("div",{className:"bg-purple-50 border border-purple-200 rounded-lg p-3",children:t("div",{className:"flex items-center justify-between",children:t("div",{className:"flex items-center gap-2",children:t("span",{className:"text-sm text-purple-800 font-medium",children:"將使用當前設備位置作為出發地點"})})})}),s("div",{className:"text-sm text-gray-700 bg-white p-3 rounded border",children:[t("strong",{children:"當前默認出發地點:"})," ",(e==null?void 0:e.type)==="random"?t("span",{className:"text-blue-600",children:"隨機選擇（每次不同）"}):(e==null?void 0:e.type)==="current"?t("span",{className:"text-purple-600",children:"當前位置（實時獲取）"}):t("span",{className:"text-green-600",children:(e==null?void 0:e.specificLocation)||"未設置"})]})]}),r.open&&t(ca,{locations:l,searchTerm:r.search,onSearchChange:c=>o(i=>({...i,search:c})),onSelect:c=>{a("specific",c.name),o({open:!1,search:""})},onClose:()=>o({open:!1,search:""})})]})},ca=({locations:e,searchTerm:n,onSearchChange:a,onSelect:r,onClose:o})=>{const[l,c]=d.useState(-1);return d.useEffect(()=>{const i=u=>{switch(u.key){case"Escape":o();break}};return document.addEventListener("keydown",i),()=>document.removeEventListener("keydown",i)},[o]),t("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",children:s("div",{className:"bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col",children:[s("div",{className:"p-4 border-b",children:[t("h4",{className:"font-semibold",children:"選擇默認出發地點"}),t("input",{type:"text",placeholder:"搜索地點...",value:n,onChange:i=>a(i.target.value),className:"mt-2 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",autoFocus:!0})]}),t("div",{className:"flex-1 overflow-y-auto p-2",children:e.length===0?t("div",{className:"text-center text-gray-500 py-8",children:"暫無匹配地點"}):e.map((i,u)=>s("button",{onClick:()=>r(i),onMouseEnter:()=>c(u),className:`w-full text-left p-3 rounded transition-colors ${l===u?"bg-blue-50":"hover:bg-gray-50"}`,children:[t("div",{className:"font-medium",children:i.name}),t("div",{className:"text-xs text-gray-500",children:i.district})]},i.name))}),t("div",{className:"p-3 border-t flex justify-end",children:t("button",{onClick:o,className:"px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400",children:"取消"})})]})})},da=({stats:e,locations:n,getLocationType:a})=>{const r=d.useMemo(()=>Object.values(G).filter(i=>n.some(u=>a(u)===i)).length,[n,a]),o=d.useMemo(()=>n.filter(i=>a(i)).length,[n,a]);if(!e)return null;const l=[{label:"總地點數",value:e.total,color:"gray"},{label:"用戶自定義",value:e.userDefined,color:"green"},{label:"甲部-地方",value:e.fromAreaSection,color:"blue"},{label:"甲部-路線",value:e.fromRouteSection,color:"purple"},{label:"地區數量",value:e.districts,color:"orange"},{label:"平均每區",value:(e.total/Math.max(e.districts,1)).toFixed(1),color:"red"},{label:"類型數量",value:r,color:"indigo"},{label:"已分類地點",value:o,color:"cyan"}],c={gray:"bg-gray-50 text-gray-800",green:"bg-green-50 text-green-800",blue:"bg-blue-50 text-blue-800",purple:"bg-purple-50 text-purple-800",orange:"bg-orange-50 text-orange-800",red:"bg-red-50 text-red-800",indigo:"bg-indigo-50 text-indigo-800",cyan:"bg-cyan-50 text-cyan-800"};return t("div",{className:"grid grid-cols-2 md:grid-cols-8 gap-3 mt-4 text-sm",children:l.map((i,u)=>s("div",{className:`${c[i.color]} p-3 rounded text-center`,children:[t("div",{className:"font-semibold",children:i.value}),t("div",{className:"text-xs opacity-75",children:i.label})]},u))})},ua=({location:e,index:n,isDefaultFrom:a,onSetDefault:r,onEdit:o,onDelete:l,getDefaultFrom:c,getSourceBadgeStyle:i,getDistrictColor:u,getLocationType:h,navigationState:N,renderNavigationMenu:w})=>{const S=h(e),y=S?Et[S]:null;return s("div",{className:"flex items-center justify-between",children:[s("div",{className:"flex items-center gap-3",children:[t("div",{className:"flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full text-xs font-medium text-gray-700",children:n+1}),s("div",{children:[s("div",{className:"font-medium text-gray-800 flex items-center gap-2",children:[e.name,e.correctAnswer&&` (${e.correctAnswer})`,y&&t(y,{size:14,className:"text-gray-500"})]}),s("div",{className:"flex gap-2 mt-1 flex-wrap",children:[t("span",{className:`text-xs px-2 py-1 rounded ${i(e.source)}`,children:e.sourceLabel}),e.district&&t("span",{className:`text-xs px-2 py-1 rounded ${u(e.district)}`,children:e.district}),S&&t("span",{className:"text-xs px-2 py-1 rounded bg-gray-100 text-gray-800",children:Ke[S]})]})]})]}),s("div",{className:"flex items-center gap-2",children:[t("div",{className:"w-24",children:t(Qe,{compact:!0,showLabels:!1,locations:{from:c(),to:e.name,hasLocationInfo:!0},buttonClassName:"p-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"})}),t("button",{onClick:()=>r(e.name),className:`p-1 rounded transition-colors ${a?"text-green-600 bg-green-100":"text-blue-600 hover:bg-blue-100"}`,title:"設為默認出發地點",children:t(Se,{size:14})}),e.source===Z.USER_INPUT&&s(ce,{children:[t("button",{onClick:()=>o(e),className:"p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors",title:"編輯",children:t(rn,{size:14})}),t("button",{onClick:()=>l(e.name),className:"p-1 text-red-600 hover:bg-red-100 rounded transition-colors",title:"刪除",children:t(sn,{size:14})})]}),w(e),a&&t(mt,{size:16,className:"text-green-500",title:"當前默認地點"})]})]})},ma=({show:e,locations:n,selection:a,onToggle:r,onConfirm:o,onCancel:l})=>e?t("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",children:s("div",{className:"bg-white rounded-lg max-w-md w-full p-6",children:[t("h4",{className:"font-semibold text-gray-800 mb-3",children:"導入系統地點"}),t("p",{className:"text-sm text-gray-600 mb-4",children:"選擇要導入到用戶自定義列表的系統地點："}),t("div",{className:"max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 mb-4",children:n.map(c=>s("label",{className:"flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer",children:[t("input",{type:"checkbox",checked:a.includes(c.name),onChange:()=>r(c.name),className:"mr-2"}),s("span",{children:[c.name," (",c.sourceLabel,")"]})]},c.name))}),s("div",{className:"flex justify-end gap-3",children:[t("button",{onClick:l,className:"px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400",children:"取消"}),t("button",{onClick:o,disabled:a.length===0,className:"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed",children:"導入選中地點"})]})]})}):null,Dt=()=>{const{locations:e,stats:n,districts:a,defaultFromSettings:r,addLocation:o,updateLocation:l,deleteLocation:c,setDefaultFrom:i,importSystemLocations:u,resetAll:h,reload:N}=na(),w=aa(),{getSourceBadgeStyle:S,getDistrictColor:y}=ra(),f=sa(),[x,b]=d.useState(null),[L,D]=d.useState(""),{searchTerm:R,setSearchTerm:E,filteredLocations:j,filters:V}=la(e,a,w),Q=oa(e,u),W=d.useCallback(()=>{if((r==null?void 0:r.type)==="specific"&&(r!=null&&r.specificLocation))return r.specificLocation;if((r==null?void 0:r.type)==="random"&&e.length>0){const I=Math.floor(Math.random()*e.length);return e[I].name}return""},[r,e]),le=d.useCallback(()=>{L.trim()&&o(L)&&D("")},[L,o]),X=d.useCallback(()=>{!x||!L.trim()||l(x.name,L)&&(b(null),D(""))},[x,L,l]),me=d.useCallback(I=>{window.confirm(`確定要刪除地點 "${I}" 嗎？`)&&c(I)},[c]),B=d.useCallback((I,k="")=>{I==="specific"&&!k||i(I,k)},[i]),H=d.useCallback(()=>{window.confirm("確定要重置所有地點數據嗎？這將刪除所有用戶自定義地點和設置。")&&h()},[h]),ee=d.useCallback(I=>{const k=f.navigationMenu===I.name;return s("div",{className:"relative",ref:Y=>f.menuRefs.current[I.name]=Y,children:[t("button",{onClick:()=>f.toggleMenu(I.name),className:"p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors",title:"導航選項",children:t(Zt,{size:14})}),k&&t("div",{className:"absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]",children:s("div",{className:"p-2",children:[s("div",{className:"text-xs text-gray-500 mb-2",children:["導航到 ",I.name]}),t("div",{className:"mb-2",children:t(Qe,{displayMode:"all",showLabels:!0,locations:{from:W(),to:I.name,hasLocationInfo:!0},className:"flex-col gap-1",buttonClassName:"w-full justify-start px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"})}),t("div",{className:"my-2 border-t border-gray-200"}),t("div",{className:"mb-2",children:t("input",{type:"text",placeholder:"輸入出發地址...",value:f.customFromAddress,onChange:Y=>f.setCustomFromAddress(Y.target.value),className:"w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"})}),t("div",{className:"mb-2",children:t(Qe,{displayMode:"all",showLabels:!0,locations:{from:f.customFromAddress,to:I.name,hasLocationInfo:!!f.customFromAddress.trim()},className:"flex-col gap-1",buttonClassName:"w-full justify-start px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"})})]})})]})},[f,W]);return d.useEffect(()=>{const I=k=>{if(!(k.clientX>document.documentElement.clientWidth||k.clientY>document.documentElement.clientHeight)&&f.navigationMenu){const te=f.menuRefs.current[f.navigationMenu];te&&!te.contains(k.target)&&f.closeMenu()}};return f.navigationMenu&&document.addEventListener("mousedown",I),()=>document.removeEventListener("mousedown",I)},[f]),s("div",{className:"space-y-6",children:[t(ia,{settings:r,locations:e,onSetDefault:B}),s("div",{children:[s("div",{className:"flex items-center justify-between mb-4",children:[t("h4",{className:"font-semibold text-gray-700",children:"地點列表管理"}),s("div",{className:"flex items-center gap-2",children:[s("button",{onClick:Q.openDialog,className:"flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm",children:[t(en,{size:14,className:"mr-1"}),"導入系統地點"]}),s("button",{onClick:H,className:"flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm",children:[t(ut,{size:14,className:"mr-1"}),"重置所有"]})]})]}),n&&s("div",{className:"text-sm text-gray-600 mb-4",children:["共 ",n.total," 個地點，分佈在 ",n.districts," 個地區"]}),s("div",{className:"flex gap-2 mb-4",children:[t("input",{type:"text",placeholder:x?"編輯地點名稱...":"輸入新地點名稱...",value:L,onChange:I=>D(I.target.value),onKeyPress:I=>I.key==="Enter"&&(x?X():le()),className:"flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"}),x?s(ce,{children:[t("button",{onClick:X,className:"px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors","aria-label":"保存",children:t(tn,{size:16})}),t("button",{onClick:()=>{b(null),D("")},className:"px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors","aria-label":"取消",children:t(je,{size:16})})]}):t("button",{onClick:le,className:"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors","aria-label":"添加",children:t(nn,{size:16})})]}),t(ta,{data:j,groupBy:I=>I.district||"未分類",filters:V,rememberPreferences:!0,renderItem:(I,k)=>t(ua,{location:I,index:k,isDefaultFrom:(r==null?void 0:r.type)==="specific"&&(r==null?void 0:r.specificLocation)===I.name,onSetDefault:Y=>B("specific",Y),onEdit:Y=>{b(Y),D(Y.name)},onDelete:me,getDefaultFrom:W,getSourceBadgeStyle:S,getDistrictColor:y,getLocationType:w,navigationState:f,renderNavigationMenu:ee}),renderGroupHeader:(I,k)=>s("div",{className:"flex items-center gap-2",children:[t(an,{size:14}),s("span",{className:"font-semibold",children:[I," (",k," 個地點)"]})]}),searchPlaceholder:"搜索地點、地區...",searchValue:R,onSearchChange:E,searchOptions:{fields:["name","sourceLabel","district"],customFilter:(I,k)=>{const Y=w(I);return(Y?Ke[Y]:"").toLowerCase().includes(k.toLowerCase())}},emptyMessage:"暫無地點數據"}),t(da,{stats:n,locations:e,getLocationType:w})]}),t(ma,{show:Q.showDialog,locations:Q.systemLocations,selection:Q.selection,onToggle:Q.toggleSelection,onConfirm:Q.executeImport,onCancel:Q.closeDialog})]})},ga=Object.freeze(Object.defineProperty({__proto__:null,default:Dt},Symbol.toStringTag,{value:"Module"})),pa=`根据香港运输署及规划署等公开资料，以下是九龙城的主要道路及连接路网口述清单。

九龙城区的道路网络主要分为**对外主干道**和**区内街道路网**两大部分。以下按功能及地理分布进行分类口述：

### 一、 对外主干道（边界与连接）

这些道路通常也是九龙城区的边界线，承担着连接其他区域（如九龙塘、土瓜湾、新蒲岗）的重任，车流量最大。

1.  **太子道西 / 太子道东**：
    -   这是九龙城区北面最重要的一条横向主干道。它西接九龙塘，东连新蒲岗及启德。在九龙城区域内，它不仅是交通大动脉，也是许多住宅区与商业区的分界线。
2.  **马头涌道**：
    -   位于九龙城西侧，是一条重要的南北向连接路。向北连接太子道西，向南通往马头围及土瓜湾方向，是进出九龙城核心区域的关键通道。
3.  **联合道**：
    -   这是一条连接九龙塘、九龙仔与九龙城的弧形道路。它从西边的窝打老道延伸而来，沿途经过香港浸会大学，最终汇入太子道西，是九龙城西侧的重要边界路。

### 二、 区内主要横向街道（鱼骨架构）

九龙城旧区的道路设计非常经典，**衙前围道**是绝对的核心主轴，其他街道像鱼骨一样排列在其两侧。

1.  **衙前围道**：
    -   这是九龙城的心脏地带道路。它贯穿整个旧区，东西走向。路的两旁遍布著名的泰国餐厅、潮州打冷店以及市政大厦。如果把九龙城比作一条鱼，这条路就是那条“脊骨”。
2.  **贾炳达道**：
    -   位于衙前围道北面并与之平行。这里有著名的九龙城街市和九龙寨城公园，是一条非常生活化的道路，常有小巴穿梭。
3.  **界限街**：
    -   虽然主要被视为深水埗区与油尖旺区的分界，但其东段紧邻九龙城，是该区北侧的一条重要横向连接路。

### 三、 区内主要纵向街道（鱼骨架构）

这些道路垂直于衙前围道，连接着衙前围道与太子道西或贾炳达道。其中最著名的包括：

1.  **侯王道**：
    -   从太子道西进入九龙城的第一条主要街道，连接太子道西与衙前围道，商铺林立。
2.  **狮子石道 / 南角道**：
    -   位于侯王道东侧，是九龙城“潮州文化”和“泰国文化”最浓郁的地方，也是游客寻找美食的主要聚集地。
3.  **福佬村道**：
    -   位于衙前围道东段，近年来转型为特色餐厅一条街。
4.  **启德道**：
    -   连接衙前围道与太子道东，靠近昔日启德机场的入口。
5.  **打鼓岭道**：
    -   位于启德道以东，同样是连接太子道东与衙前围道的纵向道路。

### 四、 区内其他重要连接路与街巷

除了上述主干道外，以下道路在连接社区内部及历史地标方面也扮演着重要角色：

-   **东正道**：位于九龙城东侧，连接太子道东与贾炳达道，是进入九龙寨城公园北侧的主要通道。
-   **联合道（南段）**：正如前文所述，它连接了九龙城与乐富，沿途经过九龙城警署。
-   **露明道**：连接太子道西与亚皆老街，位于九龙城与九龙塘的交界处，路旁有多所学校。
-   **龙岗道 / 城南道**：位于侯王道与狮子石道之间的小型纵向街道，也是旧区繁忙的街市延伸部分。
-   **品兰街**：一条相对较短的街道，连接衙前围道与太子道西。

### 总结：口述导览建议

如果你在口述中需要让别人理解九龙城的路网，可以这样描述：

 “想象一下，九龙城的道路像一条鱼的骨架。**太子道西**是这条鱼最外围的轮廓，**衙前围道**是贯穿鱼身中央的**脊骨**。而**侯王道、狮子石道、南角道**这些美食街，就是一根根**鱼刺**，一头连接着主干道的喧嚣，另一头通向宁静的住宅区。如果你想从九龙塘过来，可以通过**联合道**到达；如果你想去土瓜湾，往**马头涌道**走就对了。”`,ha=`根據公開資料，九龍灣的道路網絡可以分為三大類：**東西向的對外快速公路**、**南北向的區內主幹道**，以及**工商業區的密集街道**。

---

### 一、 對外連接快速公路（進出九龍灣的門戶）

這些是九龍灣連接香港各區的快速通道，車流量最大：

1.  **觀塘道**：
    -   九龍灣最重要的東西向動脈，位於九龍灣南側邊界，連接牛頭角與彩虹。這條路上有德福花園、九龍灣港鐵站，是進出九龍灣的主要途徑之一。
2.  **觀塘繞道**：
    -   位於九龍灣東側的快速公路，連接東區海底隧道（往香港島）及將軍澳方向，是前往港島東及新界東的關鍵通道。
3.  **龍翔道**：
    -   位於九龍灣北側，東西走向，連接黃大仙、深水埗等區，是九龍中部橫向交通的主幹道之一。
4.  **啓福道**：
    -   九龍灣西側的重要快速道路，連接啓德隧道（通往紅磡、尖沙咀）及觀塘繞道。九龍灣國際展貿中心就在這條路上。
5.  **中九龍繞道（九龍灣段）**：
    -   這是一條即將全線通車的重要幹道。它的東面出入口接駁九龍灣路網（啓祥道、啓福道等）。通車後，從九龍灣到油麻地的車程將由約30分鐘大幅縮短至僅約5分鐘。
6.  **啓祥道**：
    -   連接啓福道與觀塘道的區內主幹道，同時也是中九龍繞道九龍灣端的主要連接道路。信和停車場、輔警總部等位於此路。

### 二、 區內主要街道（商貿及住宅區核心）

這些是九龍灣商貿區和住宅區的核心道路：

1.  **宏照道**：
    -   九龍灣商貿區的**南北主軸**，貫穿整個工業/商業區。沿途有零碳天地、國際交易中心、多座商業大廈及MegaBox。它是九龍灣最繁忙的區內道路之一。
2.  **臨豐街**：
    -   位於MegaBox正前方，是通往這個大型商場的主要道路，周圍環繞着企業廣場。
3.  **常悅道**：
    -   位於企業廣場及國際交易中心附近，是商貿區的核心道路之一。
4.  **啓興道**：
    -   連接啓福道與海濱道，位於九龍灣的南端，靠近觀塘避風塘。
5.  **海濱道**：
    -   沿着九龍灣海岸線的東西向道路，連接九龍灣與觀塘商貿區。沿途有海濱公園，景觀開揚，可以眺望維港。
6.  **德福花園通道**：
    -   這是連接觀塘道與德福花園（大型港鐵上蓋住宅屋苑）的內部道路。

### 三、 工商業區內部街道（「宏」字頭與「臨」字頭）

九龍灣商貿區的街道命名非常有規律，主要由「宏」字頭和「臨」字頭組成：

**「宏」字頭系列（位於商貿區北面）：**
-   **宏光道**：連接啓祥道與宏照道，是商貿區另一條重要通道。
-   **宏開道**：位於宏照道與宏光道之間。
-   **宏冠道** / **宏基街** / **宏泰道**：這些都是商貿區內較短的街道，兩旁多為工業大廈及寫字樓。

**「臨」字頭系列（位於商貿區南面，靠近海濱）：**
-   **臨澤街** / **臨華街** / **臨樂街**：這些街道位於MegaBox以南的區域，多為商業及工業混合用途。

### 四、 其他輔助道路及公共運輸交匯處

1.  **展貿徑**：
    -   通往九龍灣國際展貿中心（九展）的專用道路。
2.  **啓禮道**：
    -   位於九龍灣警署及輔警總部附近的短小街道。
3.  **九龍灣公共運輸交匯處（德福花園）**：
    -   位於德福廣場下方，是多條巴士及小巴路線的總站。
4.  **九龍灣行動區**：
    -   這是九龍灣正在規劃發展的新區域，位於海濱道附近，未來將新增行車道路連接現有路網。

---

### 口述導覽建議

如果你需要在口述中讓別人理解九龍灣的路網，可以這樣描述：

> 「九龍灣的道路可以分成三個層次來看：
>
> **最外層**是快速公路——**觀塘道**和**龍翔道**是東西向的大動脈，**啓福道**連接隧道和繞道。**中九龍繞道**剛通車，從九龍灣去油麻地現在只要5分鐘，非常快。
>
> **中間層**是區內主幹道——**宏照道**是商貿區的南北主軸，直通MegaBox；**海濱道**沿着海邊走，風景不錯。
>
> **最內層**是工商業區的內部街道——認路有個竅門：**『宏』字頭**（宏光道、宏開道）的街道多在商貿區北面，**『臨』字頭**（臨澤街、臨華街）的則在南面靠海。記住這個規律，在九龍灣找路會容易很多。」`,fa=`元朗的道路网络，可以说是一个“新旧并存、内外有别”的格局。与屯门那种沿海而建的狭长形态不同，元朗平原的广阔地势让这里的路网呈现出**放射状与棋盘式交织**的特点——既有环绕新市镇的快速公路，也有极具辨识度的“大马路”和以“元朗”命名的传统街道。

整个路网可以从以下三个层次来理解：

---

### 🗺️ 一、 对外连接主干道（进出元朗的门户）

元朗地处新界西北腹地，被群山环抱，因此**快速公路和隧道**是与九龙、新界其他地区及深圳连接的生命线。

1.  **元朗公路 (Yuen Long Highway)**：这是元朗连接**屯门及九龙市区**的核心动脉，全长约8.5公里，属于9号干线的一部分。它西起屯门蓝地交汇处，东至博爱交汇处，是元朗居民出城的“必经之路”。近年已扩建至三至四线双程行车，以应对日益增长的交通需求。

2.  **新田公路 (San Tin Highway)**：位于元朗东侧，是连接**上水、粉岭及落马洲（皇岗口岸）** 的主要快速公路，北上前往深圳的重要通道。

3.  **青朗公路 (Tsing Long Highway)**：包含**大榄隧道**，是元朗连接**荃湾及九龙西**的最快捷通道。自2025年5月政府收回大榄隧道经营权后，该路的交通策略地位进一步提升。

4.  **朗天路 (Long Tin Road)**：连接元朗公路与**天水围**的主要幹道，是往返元朗市与天水围的核心通道。

5.  **港深西部公路 (Kong Sham Western Highway)**：连接**深圳湾口岸**的快速公路，经元朗公路可直达，是跨境交通的重要走廊。

6.  **未来的十一号幹線 (Route 11)**：这是一条规划中的策略性幹道，将连接元朗至**北大屿山**（香港国际机场），预计会大大提升元朗西出的效率。


### 🌉 二、 区内主要幹道（连接新市镇各区的骨架）

元朗新市镇内部的道路布局相对规整，主要以几条东西向的平行道路为骨架，连接市中心、工业区和住宅区。

1.  **青山公路－元朗段 (Castle Peak Road - Yuen Long)（俗称“元朗大马路”）**：这是元朗区的**绝对核心道路**，东西走向，横贯整个元朗市中心。这里商铺林立，巴士线路密集，是元朗最繁华的商业地带。

2.  **元朗安寧路 (Yuen Long On Ning Road)**：位于“大马路”北侧并与之平行，是元朗市中心另一条重要的东西向动脉，全长约780米。沿线设有多个巴士及小巴站，是连接朗屏站与市中心的关键通道。

3.  **元朗安樂路 (Yuen Long On Lok Road)**：同样位于“大马路”北侧，与安寧路相邻，是连接元朗工业区和市中心的重要道路。

4.  **教育路 (Kau Yuk Road)**：位于“大马路”南侧并与之平行，是元朗南面的主要商业及住宅街道。

5.  **朗屏路 (Long Ping Road)**：连接元朗市中心与**朗屏邨**及朗屏站的主要道路，是朗屏新市镇部分的交通枢纽。


### 🏘️ 三、 分区内部道路（市中心的毛细血管）

元朗市中心的道路网络极具辨识度，可以分为两类：一类是以“元朗”命名的传统街道，另一类是连接“大马路”与周边区域的密集街巷。

#### 1. 与大马路相交的纵向商业街道（由西向东）

这些街道垂直于青山公路－元朗段，是通往市中心腹地的主要通道，也是美食和购物的集中地：

- **击壤路 (Kik Yeung Road)**：元朗西侧的交通汇集点，有多条巴士线路以此為总站。
- **大棠路 (Tai Tong Road)**：向南延伸至大棠郊区，是通往大棠红叶景区的主要通道。
- **教育路**（如前所述，与大马路平行）。
- **康乐路 (Yuen Long Hong Lok Road)**：元朗市中心的主要商业街道之一。
- **又新街 (Yau San Street)** / **日新街 (Yat San Street)**：著名的“元朗美食街”，食肆林立。
- **凤翔路 (Fung Cheung Road)**：连接元朗站与大马路，周边有大型巴士总站。
- **大桥路 (Tai Kiu Road)** / **宏达路 (Wang Tat Road)**：连接元朗市中心与朗屏工业区，是重型车辆通行的主要路线。

#### 2. 其他重要街巷与屋苑道路

- **元朗炮仗坊 (Yuen Long Pau Cheung Square)** / **元朗新街 (Yuen Long New Street)**：传统市集街道，充满旧区生活气息。
- **阜财街 (Fau Tsoi Street)** / **合益路 (Hop Yick Road)**：邻近街市，是购买粮油杂货的热点。
- **妈庙路 (Ma Miu Road)** / **妈横路 (Ma Wang Road)**：连接朗天路与大马路的重要辅助道路，经常有巴士途经此路进出天水围。
- **朗日路 (Long Yat Road)**：紧邻**元朗站**及新元朗中心，是区内交通枢纽。


### 💡 口述导览建议

> “在元朗认路，最关键的参照物就是**‘大马路’（青山公路－元朗段）**。这是元朗的心臟，所有的商业和交通都围绕它展开。
>
> **进出元朗**有三条主要通道：去屯门/九龙走**元朗公路**；去荃湾/九龙西走**大榄隧道（青朗公路）**；去上水/深圳走**新田公路**。
>
> 到了**元朗区内**，记住三条和‘大马路’平行的路——北面是**安寧路**和**安樂路**，南面是**教育路**。至于连接这些路的纵向街道，像**击壤路、大棠路、又新街、凤翔路**这些，就像鱼骨一样插在‘大马路’两侧，条条都是美食和购物的热点。
>
> 还有个有意思的现象：元朗市中心的很多街名都带‘元朗’二字——**安寧路、安樂路、康樂路**——认准这个规律，你在市中心就不会迷路。而‘元朗’这两个字，在这里不仅是一个地名，更像是路名的‘品牌’。”

希望这份口述能帮助你在脑海中构建起元朗清晰的路网图景。`,ba=`北区的道路网络，可以说是「南北交汇、新旧并存」。与屯门、元朗那种单一新市镇的形态不同，北区由**上水、粉岭、沙头角、打鼓岭**四个分区组成。这里的道路既有贯穿全区的高速公路，也有四条历史悠久的边界公路，以及新市镇内棋盘式的新旧街道。

整个路网可以从以下三个层次来理解：

---

### 🗺️ 一、 对外连接主干道（进出北区的门户）

北区是香港最北面的地区，与深圳只有一河之隔，因此这里的对外交通既有连接香港内部的快速公路，也有通往内地的陆路口岸通道。

1.  **粉岭公路 (Fanling Highway)**：这是北区**南北向的交通脊梁**，属于香港9号干线的核心路段，全长11.2公里，限速100公里/小时。它南接大埔区的吐露港公路，北连元朗区的新田公路，贯穿北区西部，是连接九龙、新界西及深圳的命脉。

    -   **公路构成**：粉岭公路分为三部分——林锦公路至和合石段（南段）、粉岭支路（绕开粉岭/上水新市镇的绕道段）、粉锦公路至新田段（北段）。
    -   **重要交汇处**：粉岭公路通过**粉岭公路交汇处**连接**香园围公路**，可直达莲塘/香园围口岸（2019年通车），从粉岭前往沙头角公路的车程缩短至仅4分钟。

2.  **香园围公路 (Heung Yuen Wai Highway)**：2019年5月通车的策略性公路，全长约11公里，连接粉岭公路与莲塘/香园围口岸，大大改善了北区东部（打鼓岭、坪輋一带）的对外交通。

3.  **四条历史公路（「四岭」通道）**：这是北区最独特的道路遗产，早在粉岭/上水新市镇发展前就已存在，如今仍是连接边境及乡郊的关键通道：
    -   **沙头角公路 (Sha Tau Kok Road)**：连接粉岭与沙头角，全长约10.5公里，分四段（龙跃头段、马尾下段、禾坑段、石涌凹段）。1927年通车，是香港第三条主要公路。
    -   **文锦渡路 (Man Kam To Road)**：连接上水与文锦渡口岸，是跨境货运的重要通道。
    -   **粉锦公路 (Fan Kam Road)**：连接粉岭与锦田，是北区西部通往元朗的辅助通道。
    -   **青山公路－古洞段 (Castle Peak Road - Kwu Tung Section)**：古洞一带的历史道路，现为区内辅助道路。

4.  **未来的粉岭绕道东段 (Fanling Bypass East Section)**：预计2026年1月通车。这条长约2公里的高架公路（双向四车道）是粉岭北新发展区的核心交通工程，采用香港首次使用的**桥梁转体施工工艺**建成。它将有效分流粉岭公路的交通压力，改善粉岭/上水新市镇内部的通达性。


### 🌉 二、 区内主干道（连接上水与粉岭的骨架）

北区新市镇由上水和粉岭两大片区组成，被东铁线分隔为东西两侧。区内主干道主要呈南北走向，连接铁路两侧及各住宅区。

1.  **马会道 (Jockey Club Road)**：这是连接**上水与粉岭**的核心动脉，呈南北走向，贯穿两区。它是新市镇发展前就已存在的道路，至今仍是区内最繁忙的道路之一，沿线设有多个迴旋处连接周边道路。

2.  **新运路 (San Wan Road)**：这是一条**沿着东铁线路轨**而建的东西向道路，连接上水站与粉岭站。它几乎与铁路平行，是铁路两侧通勤的重要通道。新运路的前身是旧大埔公路粉岭段，在粉岭公路通车后被取代。

3.  **百和路 (Pak Wo Road)**：位于粉岭南侧，是一条重要的**东西向连接路**，连接上水、粉岭及华明邨一带。百和路沿线发展较晚，如今是粉岭南（花都广场、牵晴间等）的主要通道。

4.  **扫管埔路 (So Kwun Po Road)**：连接粉岭公路与上水市中心（新运路、马会道）的重要支路，是进出上水的关键通道。

5.  **天平路 (Tin Ping Road)**：位于上水东侧，连接马会道与粉岭公路，是上水东部住宅区（天平邨、奕翠园等）的主要通道。

6.  **宝石湖路 (Po Shek Wu Road)**：连接上水北部（彩园邨、宝石湖邨）与马会道、粉岭公路。


### 🏘️ 三、 分区内部道路（新旧交织的毛细血管）

北区的内部道路可以清晰地分为两类：**新市镇部分**（上水/粉岭）和**乡村/边境部分**（沙头角/打鼓岭）。

#### A. 上水及石湖墟（传统墟市与新市镇的交汇）

上水以石湖墟为核心，街道密集，富有传统市镇气息。

-   **新丰路 (San Fung Road)**：上水旧墟的主要商业街道，连接石湖墟与上水站，商铺林立。
-   **龙琛路 (Lung Sum Avenue)** / **龙运街 (Lung Wan Street)**：上水站周边的核心道路，是巴士总站及小巴站的所在地，人流车流密集。
-   **符兴街 (Fu Hing Street)** / **新康街 (San Hong Street)** / **新祥街 (San Cheung Street)**：石湖墟内的传统街巷，以「新」字和吉祥字命名，是购物和街市的集中地。
-   **彩园路 (Choi Yuen Road)** / **保健路 (Po Kin Road)**：上水西部的公共屋邨道路，连接彩园邨、太平邨及北区医院。

#### B. 粉岭及联和墟（新旧交织的棋盘）

粉岭以联和墟为传统核心，联和道、联安街等「联」字头街道至今仍是粉岭北部的商业中心。

-   **联和道 (Luen Wo Road)** / **联安街 (Luen On Street)**：联和墟的核心街道，充满老香港的市井气息。
-   **一鸣路 (Yat Ming Road)** / **华明路 (Wah Ming Road)**：粉岭南公共屋邨（华明邨、欣盛苑等）周边的道路，呈环状布局。
-   **置福围 (Chi Fuk Circuit)**：粉岭站附近的重要巴士总站及小巴站所在地。

#### C. 打鼓岭及坪輋（边境乡村道路）

打鼓岭和坪輋是北区的边境区域，过去部分属边境禁区，近年禁區范围已缩减。

-   **坪輋路 (Ping Che Road)**：连接沙头角公路与打鼓岭的主要道路，全长约3.7公里，1958年至1960年间分段通车。它曾被称为「孔岭公路」或「打鼓岭内线公路」，是打鼓岭乡村的核心通道。
-   **莲麻坑路 (Lin Ma Hang Road)**：连接打鼓岭与莲麻坑村的边境道路，部分路段仍属禁区。
-   **香园围路 (Heung Yuen Wai Road)**：通往莲塘/香园围口岸的新建道路。

#### D. 沙头角（边境禁区道路）

沙头角是香港主要边境禁区之一，进入须持有边境禁区通行证。

-   **沙头角公路－石涌凹段 (Sha Tau Kok Road - Shek Chung Au Section)**：沙头角公路的最北段，连接沙头角管制站及沙头角邨。
-   **顺隆街 (Shun Lung Street)**：沙头角巴士总站所在地，与沙头角公路交汇。
-   **中英街 (Chung Ying Street)**：位于香港与深圳边界线上的著名街道，只限持有特别通行证的人士进入。


### 🚌 特别提及：香园围公路与口岸

香园围公路于2019年通车，是北区近年最重要的道路基建之一。它通过粉岭公路交汇处连接粉岭公路，设有四个交汇处，分别连接：
-   **粉岭公路**（西行往元朗、九龙）
-   **沙头角公路**（东行往沙头角）
-   **坪輋路**（往打鼓岭）
-   **莲麻坑路**（往莲塘/香园围口岸）

从粉岭公路经香园围公路前往沙头角公路，车程仅需4分钟。


### 💡 口述导览建议

> 「北区的路网，最关键的是分清『**一条高速、四条老路、两个墟市**』。
>
> **一条高速**就是**粉岭公路**，它是北区的交通脊梁，南下九龙、北上深圳、西去元朗都靠它。**香园围公路**是它的新分支，2019年通车后去莲塘口岸非常快。
>
> **四条老路**是**沙头角公路、文锦渡路、粉锦公路、青山公路－古洞段**，它们都是1920-1950年代就已存在的边境公路，如今仍是连接乡村和口岸的要道。
>
> 在**新市镇内部**，上水和粉岭被东铁线分开。**马会道**是连接两个市镇的主脊梁，**新运路**沿着铁路走，**百和路**在粉岭南侧横贯东西。
>
> 认路还有个小窍门：**上水墟市**的街道多带『新』字（新丰路、新康街），**粉岭联和墟**的街道多带『联』字（联和道、联安街）。记着这个规律，在北区找路会容易很多。
>
> 最后提醒一点：**沙头角**和**打鼓岭**部分区域仍是边境禁区，去那边要先办好禁区纸，否则在担水坑就会被请下车。」`,xa=`啟德是新舊交織的區域，道路網絡主要分為**對外連接幹道**和**區內新建道路**兩大類。以下是按功能分類的口述清單：

---

### 一、 對外連接主幹道（進出啟德的門戶）

這些道路是啟德連接九龍各區、香港島及新界的關鍵通道。

1.  **太子道東**：
    -   啟德西側最重要的邊界道路，東西走向，連接九龍城與新蒲崗，是進出啟德的主要途徑之一。
2.  **觀塘繞道**：
    -   位於啟德東側，是一條快速公路，連接東九龍（觀塘、將軍澳）及港島東。
3.  **中九龍幹線**：
    -   這是一條即將通車的重要幹道（預計2025年通車）。它位於啟德隧道地底，連接西九龍（油麻地、旺角）與啟德。通車後，從啟德到西九龍的行車時間將由約30分鐘大幅縮短至約5分鐘。
4.  **啟德隧道**：
    -   東西向行車隧道，連接土瓜灣、紅磡及尖沙咀，是前往油尖旺區的快速通道。
5.  **啟新道**：
    -   一條行車隧道，連接啟德協調道與新蒲崗（太子道東地底），加強了啟德與新蒲崗的連繫。
6.  **宋皇臺道**：
    -   連接土瓜灣道與太子道西，是進出啟德南面（近宋皇臺站一帶）的重要通道。

### 二、 區內主要道路（啟德新區核心網絡）

啟德發展區內的道路大多較新、規劃完善，呈網格狀分佈。以下是幾條主軸線：

#### 南北向主軸（連接各區的「縱貫線」）

1.  **承啟道**：
    -   啟德區的**核心南北大動脈**。它北接九龍灣宏光道/啟祥道，向南貫穿整個啟德發展區，連接體育園區、住宅區，並可通往土瓜灣道。它是區內最重要的主幹道。
2.  **協調道**：
    -   位於啟德北面，連接太子道東與啟德公共運輸交匯處，是一條重要的東西向連接路。

#### 東西向主軸（連接海濱及跑道區）

3.  **承豐道**：
    -   連接啟德城中心與**跑道休閒區**（前啟德跑道）的主要道路，是前往啟德郵輪碼頭和跑道區住宅的必經之路。
4.  **啟德橋道**：
    -   位於跑道區與九龍灣海旁，是連接承豐道與九龍灣的重要橋樑。

#### 其他主要區內道路

5.  **沐安街 / 沐寧街**：
    -   位於啟德北面停機坪住宅區（即「啟德一號」一帶）的主要街道，連接承啟道。
6.  **沐虹街 / 沐翠街**：
    -   位於啟德公共屋邨（啟晴邨、德朗邨）周邊的道路，連接承啟道及協調道。
7.  **啟祥道**：
    -   連接啟德隧道與九龍灣的快速道路，在啟德發展區北側邊界。
8.  **啟東道**：
    -   位於啟德東北面，連接協調道與觀塘繞道，是啟德與九龍灣及東九龍之間的另一條連接路。

---

### 口述導覽建議

如果你需要在口述中讓別人理解啟德的路網，可以這樣描述：

> 「啟德的道路網絡呈『半包圍』格局：
>
> **對外**，西側有**太子道東**連九龍城，東側有**觀塘繞道**連將軍澳，地底還有一條**中九龍幹線**（即將通車），讓啟德可以快速直達西九龍。
>
> **對內**，核心是縱貫南北的**承啟道**，它像一條主脊骨，串聯起整個啟德新區。想從新區去海邊的郵輪碼頭和跑道區，就走**承豐道**；如果想接駁出去，就靠**協調道**或**啟新道**隧道。
>
> 簡單來說，認準『承』字頭的幾條路——**承啟道**、**承豐道**——基本上就不會在啟德迷路了。`,ya=`大埔的道路网络，呈现出“**一脊两翼、内外分层**”的格局。与棋盘式的将军澳或环状放射的屯门不同，大埔依山傍海，由林村河谷冲积平原发展而成，道路布局具有很强的**南北向特征**——一条高速公路贯穿全区，多层区内干道将其与各个住宅区紧密相连。

整个路网可以从以下三个层次来理解：


### 🗺️ 一、 对外连接主干道（进出大埔的门户）

大埔被群山环抱，**快速公路**是与九龙及新界其他地区连接的绝对生命线，这与其他新市镇高度依赖单一公路的情况相似，但大埔的路网结构更加清晰。

1.  **吐露港公路 (Tolo Highway)**：这是大埔的**交通脊梁**，属于香港9号干线（新界环回公路）的核心路段，于1985年通车。它沿大埔新市镇南部和西部海岸线而建，全长约11.3公里，设计时速可达100公里。北接**粉岭公路**通往北区及深圳，南连**大埔公路－沙田段**通往沙田及九龙。几乎所有进出大埔的车辆都必须依赖它。

2.  **粉岭公路 (Fanling Highway)**：同样属于9号干线，位于大埔东北侧，连接吐露港公路与上水、粉岭及落马洲（皇岗口岸），是前往新界北及深圳的快捷通道。

3.  **大埔公路－大埔段 (Tai Po Road - Tai Po)**：这是大埔历史最悠久的道路之一，与大埔太和路、广福道等区内道路相连，如今作为辅助通道，分担部分区内及通往沙田的短途车流。

4.  **未来的沙田绕道 (Shatin Bypass)**：这是一条规划中的新南北向主干道，预计在**2039年或之后**落成。其北端将接驳大埔的**粉岭公路**（近康乐园一带），南端连接九龙西的**长沙湾**附近。建成后将有效分流吐露港公路的压力，为大埔居民往返九龙提供第二条选择。


### 🌉 二、 区内主干道（连接新市镇内部的骨架）

大埔新市镇内部的道路网络呈现“**环状+放射**”的结构，主要由几条东西向及南北向的干道构成骨架，通过**元洲仔**和**大埔北**两个主要交汇处与吐露港公路连接。为疏导交通，当局实施了多项措施，如利用**太和路**和**南运路**分流横过市中心的车辆。

1.  **大埔太和路 (Tai Po Tai Wo Road)**：这是贯穿大埔新市镇北部的一条**重要横向动脉**，连接大埔中心、太和邨及林村河两岸。它西接林锦公路，东连汀角路，是连接大埔东西两侧、分流市中心车流的关键通道。

2.  **南运路 (Nam Wan Road)**：这是大埔新市镇的**南北向中轴线**，长约2公里，连接大埔墟（南）与富亨邨（北）。它与大埔太和路在市中心交汇，共同构成分流吐露港公路车流的核心内环。

3.  **汀角路 (Ting Kok Road)**：位于大埔东侧，连接大埔市中心与**大埔工业邨**、**汀角**及**船湾**，是前往大埔东部及海滨地区的主要道路，沿途也有完善的单车径网络。

4.  **完善路 (Yuen Shin Road)**：这是一条沿海而建的连接路，连接吐露港公路（元洲仔交汇处）与大埔工业邨及汀角路，是吐露港公路的重要补充。

5.  **广福道 (Kwong Fuk Road)**：大埔旧墟的核心道路，连接大埔墟与南运路、大埔公路－元洲仔段，是大埔的传统商业及住宅区中心。

6.  **林锦公路 (Lam Kam Road)**：连接大埔西部与**林村**及**锦田**的主要道路，是前往嘉道理农场及林村许愿树的必经之路。


### 🏘️ 三、 分区内部道路（毛细血管与历史街区）

大埔的区内道路网络大致可分为新市镇部分与大埔墟部分，各具特色。

#### 1. 大埔墟（传统旧区）

这里是大埔的发源地，街道密集，多有单行及环状交通系统。当局在运头街、乡事会街和宝乡街一带实施了单程环回交通系统，以改善拥堵。

-   **宝乡街 (Po Heung Street)** / **广福道 (Kwong Fuk Road)**：大埔墟的核心商业街道，商铺林立。
-   **运头街 (Wan Tau Street)**：连接南运路与大埔墟火车站，是大埔墟的重要出入口。
-   **大明里 (Tai Ming Lane)**：一条著名的行人专用区街道，周边有多条小街巷，是墟内的休闲中心。

#### 2. 大埔中心（新市镇部分）

这里的道路较宽，规划相对规整，连接多个公共屋邨及私人屋苑。

-   **安埔路 (On Po Road)**：环绕大埔中心及大埔超级城的主要道路。
-   **安慈路 (On Chee Road)** / **安泰路 (On Tai Road)**：连接大埔太和路与安埔路，是大埔中心住宅区的核心通道。
-   **颂雅路 (Chung Nga Road)**：连接汀角路与南运路北端，是前往富亨邨、富善邨的主要道路。
-   **晓运路 (Hiu Wan Road)**：连接南运路与汀角路的一条短小连接路。

#### 3. 其他重要道路

-   **达运道 (Tat Wan Road)**：连接吐露港公路与南运路的重要交汇处，是大埔工业区与市中心连接的关键节点。
-   **三门仔路 (Sam Mun Tsai Road)**：通往船湾、三门仔渔民新村及马屎洲的沿海道路。


### 🚴‍♀️ 特别提及：单车径网络

大埔以完善的**单车径网络**闻名，是香港单车爱好者的热门地点。主要路线沿**吐露港公路**及**汀角路**海滨而建，连接沙田、大埔及大美督，形成一条贯穿新界东北的长途单车径。

-   **大埔至马料水段**：沿着吐露港公路海滨，风景开阔，可眺望八仙岭及吐露港。
-   **汀角路沿线**：可骑行至大美督及船湾淡水湖主坝，是周末的热门路线。


### 💡 口述导览建议

> 「大埔的路网，最关键是认准那条**吐露港公路**，它就像一条脊梁骨，从南到北贯穿大埔西侧。所有进出大埔的车都要走这条路。
>
> 在**大埔区内**，最重要的两条分流道路是**大埔太和路**和**南运路**。它们俩形成一个内环，把所有从吐露港公路进来的车流，分别引导到各个住宅区。简单记：**太和路管北边**，**南运路管南边**。
>
> 如果你要去**大埔墟（旧墟）**，就往**广福道**、**宝乡街**那边走，那边是老城区，路窄单行多，开车要小心。
>
> 如果你想去**大埔中心（新市镇）**，就认准**安埔路**，大埔超级城就在那里。
>
> 还有个特色：大埔的**单车径**非常出名。想骑车去沙田，就沿着吐露港公路旁边那条单车径一直向南；想去大美督，就沿着**汀角路**向东骑。
>
> 未来还有一个重要工程——**沙田绕道**，等它通车后，从大埔去九龙就不用再挤吐露港公路了，尤其对于住在康乐园、太和一带的居民，会方便很多。」`,va=`将军澳的道路网络，就像一张层次分明的棋盘，随着新市镇的逐步发展而不断向外延伸。与观塘、九龙湾那些由旧工业区自然生长出来的路网不同，将军澳的道路是经过整体规划的，因此呈现出非常清晰的功能分区和命名规律。

整个路网可以明确地分为以下三个层次来理解：

### 🗺️ 一、 对外连接主干道（进出将军澳的门户）

这些道路是将军澳与九龙市区、香港岛连接的生命线。过去将军澳居民严重依赖将军澳隧道，但随着2022年底将蓝隧道和跨湾连接路的通车，对外交通网络得到了革命性的扩展。

1.  **将军澳隧道及将军澳隧道公路 (Tseung Kwan O Tunnel & Tseung Kwan O Tunnel Road)**：这是将军澳最早期、最经典的对外通道，连接东九龙（观塘）。虽然交通压力因新路通车而有所缓解，但它依然是进出将军澳北面（宝林、坑口）的重要选择。
2.  **将军澳-蓝田隧道 (Tseung Kwan O - Lam Tin Tunnel)**：这是**六号干线**的关键组成部分，于2022年12月通车。它是一条长约3.8公里的快速公路，为往来将军澳和东九龙、港岛东区提供了第二条主干道，有效分流了将军澳隧道的车流。
    *   **路线**：西起自**蓝田交匯處**连接茶果岭道和东区海底隧道，东端在**将军澳交匯處**连接宝顺路和宝邑路。
3.  **宝琳路 (Po Lam Road)**：这是一条通往秀茂坪、安达臣道一带的山路，是连接将军澳与九龙东北面的辅助通道。
4.  **坑口道 (Hang Hau Road)** 和 **影业路 (Ying Yip Road)**：这两条路主要连接清水湾道，是通往西贡及清水湾郊区的必经之路。

### 🌉 二、 区内跨海与环回主干道（新界东的交通枢纽）

这是将军澳近年来最亮眼的路网建设，特别是跨湾连接路，它不仅是一条车行干道，更是一条景观道。

1.  **将军澳跨湾连接路 (Cross Bay Link, Tseung Kwan O)**：这是**全港首条同时设有行车道、单车径和行人路的海上高架桥**。它长约1.8公里，横跨将军澳湾，连接**将军澳-蓝田隧道**和**环保大道**（日出康城旁）。
    *   **特色**：这条路不仅分流了环保大道的车流，还让市民可以步行或骑单车跨海，沿途设有观景台，是将军澳的标志性地标。
2.  **环保大道 (Wan Po Road)**：这是将军澳东/南部的**核心动脉**，贯穿百胜角、日出康城和将军澳工业邨。在跨湾连接路通车前，这里是通往工业邨和堆填区的唯一主干道。
3.  **宝顺路 (Po Shun Road)**：这是将军澳市区（宝林、坑口）的**北环主干道**，连接宝琳北路、宝宁路，并南下接驳将军澳隧道及市中心。未来它也是连接将蓝隧道的重要接口。

### 🏘️ 三、 分区内部道路（居住区的毛细血管）

将军澳被分为几个主要发展区，每个区的内部道路都有其独特的命名和走向规律。

#### A. 宝林 & 坑口（早期发展区，道路较紧凑）
*   **宝林片区**：以 **"宝"** 字头和 **"林"** 字命名居多。
    *   **宝丰路 (Po Fung Road)**、**宝康路 (Po Hong Road)**：连接宝林与坑口的主要横轴。
    *   **欣景路 (Yan King Road)**、**贸业路 (Mau Yip Road)**：环绕新都城中心和宝林站的核心购物区道路。
*   **坑口片区**：以 **"宁"** 字头和 **"明"** 字命名居多，典型的公共屋邨路网。
    *   **常宁路 (Sheung Ning Road)**、**宝宁路 (Po Ning Road)**：坑口的主要环状道路。
    *   **重华路 (Chung Wa Road)**：坑口站的商业中心，东港城所在地。
    *   **昭信路 (Chiu Shun Road)**、**田洲路 (Tin Chau Road)**：连接坑口站与百胜角、清水湾半岛方向。

#### B. 将军澳市中心 & 调景岭（中后期发展，棋盘式路网）
*   这个区域的路网横平竖直，东西向多为 **"街"** ，南北向多为 **"路"** ，且大量使用 **"唐"** 字头。
    *   **宝邑路 (Po Yap Road)**：**核心横轴**，贯穿整个将军澳市中心，连接调景岭、尚德和将军澳站。
    *   **唐明街 (Tong Ming Street)**、**唐俊街 (Tong Chun Street)**：市中心的主要商业和住宅街道，尚德邨、将军澳广场、天晋都在此。
    *   **至善街 (Chi Shin Street)**：近年新发展的住宅区街道，两旁多为高级住宅。
    *   **翠岭路 (Tsui Ling Road)**、**景岭路 (King Ling Road)**：调景岭片区的主要道路，连接维景湾畔及知专学院。

#### C. 日出康城 & 将军澳工业邨（填海区，厂区与豪宅结合）
*   这个区域的路网极具辨识度，**日出康城内部**路名多带 **"澳"** 或 **"环"** ，**工业邨**则全是 **"骏"** 字头。
    *   **康城路 (Lohas Park Road)**：连接环保大道与日出康城各期的唯一通道。
    *   **环澳路 (Wan O Road)**：日出康城与工业邨的分界线，连接环保大道和未来的137区。
    *   **骏日街 (Chun Yat Street)**、**骏宏街 (Chun Wang Street)**：将军澳工业邨的典型"骏"字头街道，呈网格状分布，方便大型车辆进出货柜码头和科技园区。

### 💡 口述导览建议

如果你需要在口述中让别人理解将军澳的路网，可以这样说：

> "将军澳的路网，关键是认准两条**出海的路**：
>
> 如果你想**进出九龙**，以前只能挤**将军澳隧道**，现在有了新选择——走**将蓝隧道**，出来就是东隧口。
>
> 最值得一看的是**跨湾连接路**，那是全港唯一可以**走路或骑单车**过海的大桥，连接了环保大道和调景岭海滨。
>
> 至于认路，记住这几个规律：**宝林**是'宝'字头，**坑口**是'宁'字头，**市中心**是'唐'字头，**工业邨**全是'骏'字头。这样你在将军澳就基本不会迷路了。"

希望这份道路导览能帮助你在脑海中构建起将军澳清晰的路网图景。`,wa=`屯门的道路网络，可以说是「内外有别，新旧分明」。它的核心骨架由**一条横向快速公路**和**一条纵向区内干道**交织而成，而近年来落成的跨海通道，更是彻底改变了屯门对外交通的格局。

整个路网可以从以下三个层次来理解：

---

### 🗺️ 一、 对外连接主干道（进出屯门的门户）

屯门三面环山，一面临海，因此**隧道和跨海大桥**是连接市区和机场的生命线，这也是屯门区别于其他新市镇的显著特点。

1.  **屯门公路 (Tuen Mun Road)**：这是屯门连接**荃湾及九龙市区**的最经典通道，全长约19.3公里，是香港首条限制进入的快速公路。它沿屯门海岸线而建，是屯门居民出城的「必经之路」，但早晚高峰时段交通压力巨大，尤其是**皇珠路**附近的路段，经常出现拥堵。

2.  **屯门至赤鱲角连接路 (Tuen Mun - Chek Lap Kok Link)**：包括**屯门赤鱲角隧道公路 (Tuen Mun Chek Lap Kok Tunnel Road)**，这是一条于2020年底通车的革命性通道。它让屯门往返**香港国际机场及东涌**的车程从约45分钟大幅缩短至约15分钟，同时也成为连接港珠澳大桥的重要走廊。

3.  **元朗公路 (Yuen Long Highway)**：这是屯门**向北**连接**元朗、天水围及新界北**的主要快速公路，在蓝地一带与屯门公路交汇。

4.  **十一号干线 (Route 11)**（规划中）：这是一条未来连接屯门至**北大屿山**的重要干线。建成后将有效分流屯门公路的压力，特别是缓解皇珠路一带的交通瓶颈。

5.  **屯门绕道 (Tuen Mun Bypass)**（规划中）：这是一条长约8公里的双线双程分隔道路，主要以隧道形式连接屯门第40区及屯门赤鱲角隧道至蓝地东交汇处。它将在未来为来往新界西北与机场的车辆提供一条「避开屯门市中心」的快捷通道，预计行车时间约6分钟。


### 🌉 二、 区内主干道（连接各区的骨架）

屯门区内道路布局呈现**环状放射**结构，主要由**皇珠路、屯门乡事会路**等几条干道串联起各个住宅区与商业中心。

1.  **皇珠路 (Wong Chu Road)**：这是一条东西向的高架道路，连接屯门公路与屯门南（龙富路、海荣路一带）。它是屯门区内最繁忙的道路之一，也是交通瓶颈的「重灾区」，尤其在东行方向，经常出现排队车龙。政府已计划进行扩阔工程以增加容量。

2.  **屯门乡事会路 (Tuen Mun Heung Sze Wui Road)**：这是屯门区内**南北向的「中轴线」**。南起海荣路（近三圣邨），北至青山公路新墟段，沿途经过**屯门市中心、屯门站**等核心地带。它不仅是交通动脉，也是轻铁路段之一，沿线设有兆麟、安定及市中心等多个轻铁站。

3.  **龙富路 (Lung Fu Road)**：这是一条位于屯门西侧的高架道路，连接皇珠路与屯门赤鱲角隧道公路。它是往返机场及东涌的**主要分流通道**。政府计划进行扩阔工程，以增加容量。

4.  **海荣路 (Hoi Wing Road)**：位于屯门南端，连接屯门乡事会路与青山公路-青山湾段，是前往三圣邨、黄金海岸一带的主要道路。政府计划通过改善工程，分流部分皇珠路西行的车辆。

5.  **青山公路-青山湾段 (Castle Peak Road - Castle Peak Bay Section)**：这是屯门历史最悠久的道路之一，沿屯门海岸线而行，连接屯门新市镇与青山湾、黄金海岸及小榄一带。它既是红van（红色公共小巴）的主要通道，也是区内居民出行的重要选择。


### 🏘️ 三、 分区内部道路（住宅区与市中心）

屯门各个发展区都有其独特的道路命名规律，尤其是以「屯」字开头的市中心街道，极具辨识度。

#### 1. 屯门市中心（「屯」字头系列）

屯门市中心位于杯渡路与屯兴路之间，这里的道路路名皆以「**屯**」为起首，呈现棋盘式布局：

-   **屯喜路 (Tuen Hi Road)** / **屯发路 (Tuen Fat Road)**：这两条路位于屯门公路两侧，作为辅助道路连接市中心与屯门公路。屯喜路与屯兴路相连，是巴士进出屯门市中心总站的主要通道。
-   **屯兴路 (Tuen Hing Road)**：连接屯喜路与屯门乡事会路，是市中心区域的交通枢纽之一。
-   **屯合街 (Tuen Hop Street)** / **屯隆街 (Tuen Lung Street)** / **屯汇街 (Tuen Wui Street)**：这些街道环绕屯门市广场、屯门大会堂及V City商场，构成屯门的核心商业及文娱区。
-   **屯仁街 (Tuen Yan Street)** / **屯义街 (Tuen Yee Street)**：位于屯门乡事会路西侧，是屯门旧墟一带的主要道路，充满市井生活气息。

#### 2. 其他分区

-   **青田路 (Tsing Tin Road)**：连接屯门公路与良景邨、建生邨一带，是屯门北区的重要通道。未来屯门绕道的北面出入口将连接至此。
-   **震寰路 (Chun Wan Road)**：连接青田路与石排头路，是屯门医院及多个公共屋邨（如大兴邨）周边的核心道路。
-   **龙门路 (Lung Mun Road)**：位于屯门西部的工业区，连接龙富路与屯门内河码头一带，重型货车往来频繁。


### 💡 口述导览建议

> 「屯门的道路格局，关键在于分清『**新旧两条主动脉**』。
>
> 老屯门人走的，是沿海而建的**屯门公路**。如果你想从屯门**出九龙**，就只能走这条路，早晚高峰在**皇珠路**那个路口经常要堵一会儿。不过现在有了新选择——**屯赤隧道**，去机场或者港珠澳大桥，走这条路快得多，十几分钟就到了。
>
> 在屯门**区内**认路，记住一条主脊梁——**屯门乡事会路**。它从屯门南的三圣邨一路向北，穿过市中心和屯门站，直到新墟。所有『**屯**』字头的街道——屯喜路、屯兴路、屯合街——都像是鱼骨一样，分叉在乡事会路的东西两侧。
>
> 未来屯门还有个大的交通项目——**屯门绕道**，它会在山肚子里修一条隧道，让去机场的车从蓝地那边直接穿过去，不用再挤皇珠路了。」

希望这份口述能帮助你在脑海中构建起屯门清晰的路网图景。`,Sa=`新蒲崗的道路網絡，可以說是香港工業區路網的經典範例。與將軍澳那種規劃整齊的新市鎮不同，這裡的街道像一張有規律的棋盤，街道命名不僅極具特色，更有著明確的「數字密碼」和清晰的層次結構。

整個路網可以理解為「**外環包圍、內有乾坤**」的格局：

### 🗺️ 一、 外圍連接主幹道（進出新蒲崗的門戶）

這些是區界的快速公路或主要通道，承載著絕大多數的過境車流。

1.  **彩虹道 (Choi Hung Road)**：這是最重要的**南北界線**，橫貫新蒲崗西側和南側。它連接黃大仙、鑽石山，並通過彩虹迴旋處接駁龍翔道。這條路車流極大，是進出新蒲崗的核心動脈。
2.  **太子道東 (Prince Edward Road East)**：這是新蒲崗的**東南邊界**，是一條通往九龍城、旺角及觀塘的東西向快速公路。
3.  **啟新道 (Kai San Road)**：這是較新的一條**地下行車隧道**，連接新蒲崗七寶街與啟德發展區的協調道。對於前往啟德體育園或郵輪碼頭的人來說，這是一條重要捷徑。

### 🏭 二、 區內核心街道（工貿區的「數字棋盤」）

這是新蒲崗最經典的路網結構。這裡的街道主要集中在爵祿街以東、彩虹道以西的區域，由三組「**數字命名的街道**」組成，呈棋盤狀分佈，極具辨識度。

#### 1. 數字系列街道（由「一」到「八」）
這是最著名的特徵，街道名稱包含數字，且由北向南依次排列，非常好記：
-   **一至三街（北段）**：**仁愛街 (Yan Oi Street)**、**錦榮街 (Kam Wing Street)**、**銀鳳街 (Ngan Fung Street)**。這幾條街較短，靠近彩虹道，周邊多為住宅及小型商鋪。
-   **四至八街（工業心臟）**：這是工廠大廈最集中的區域，東西走向，從北到南依次為：
    -   **四美街 (Sze Mei Street)**
    -   **五芳街 (Ng Fong Street)**
    -   **六合街 (Luk Hop Street)**
    -   **七寶街 (Pat Tat Street)**
    -   **八達街 (Pat Tat Street)**（註：八達街與七寶街位置相近，同屬這一系列）

#### 2. 南北向商業動脈
連接上述數字街道的縱向道路，人流和車流最為密集：
-   **大有街 (Tai Yau Street)**：這絕對是**新蒲崗的「中軸線」**。它是區內最繁忙的街道，貫穿四美街至爵祿街。兩旁盡是工廈和地鋪食肆，是「搵食」的核心區。
-   **三祝街 (Sam Chuk Street)** / **雙喜街 (Sheung Hei Street)**：這兩條街與大有街平行，雙喜街兩旁亦有多座工業大廈，同樣是重要的工貿街道。

### 🚶 三、 住宅及邊緣輔助道路

這些道路主要分佈在靠近太子道東的南面，以及與九龍城接壤的西面。

1.  **爵祿街 (Tseuk Luk Street)** / **康強街 (Hong Keung Street)**：這是新蒲崗**舊住宅區及熟食中心**的核心。專線小巴（如102號線）通常以此為總站或循環點。
2.  **崇齡街 (Sung Ling Street)** / **景福街 (King Fuk Street)**：位於工業區南側，連接太子道東，沿途多為舊式商鋪及住宅。

### 💡 口述導覽與實用建議

如果你需要在口述中讓別人理解新蒲崗的路網，可以這樣說：

> 「新蒲崗的路網非常好認，你只要記住一個口訣——**『三縱八橫』**。
>
> **『三縱』** 就是三條主要的直路：**大有街**、**雙喜街**和**三祝街**，特別是**大有街**，它是這個區的心臟，所有找吃的、找貨運的都走那裡。
>
> **『八橫』** 就是從**四**到**八**的數字街：**四美、五芳、六合、七寶、八達**。只要記住數字越大，就越靠近太子道東。
>
> 進出方面，如果你開車從啟德過來，就走**啟新道**隧道；從觀塘或九龍城來，就走外面的**太子道東**或**彩虹道**。新蒲崗的路窄、貨車多，開車進去要特別留意那些單行道。」

### 📝 重點整理

為了方便你記憶，這裡也整理了一份簡要對照表：

| 道路層級 | 主要街道名稱 | 功能/特色 |
| :--- | :--- | :--- |
| **外圍主幹道** | 彩虹道、太子道東、啟新道 | 連接黃大仙、九龍城、啟德，車流量大 |
| **工業區縱軸** | 大有街、三祝街、雙喜街 | 工廈林立，貨車出入頻繁，大有街最為核心 |
| **工業區橫軸** | 四美街、五芳街、六合街、七寶街、八達街 | 數字命名，呈棋盤狀分佈，物流活動集中 |
| **住宅/舊區** | 爵祿街、康強街、崇齡街 | 小巴總站、熟食中心、民生商店 |

希望這份口述能幫助你建構新蒲崗的路網圖景。`,_a=`沙田的道路网络，就像一张精心编织的「环状蜘蛛网」。与九龙那种棋盘格状的旧区不同，沙田作为香港最大规模的新市镇之一，道路规划围绕著城门河和山谷地形展开，呈现出非常清晰的**环状放射结构**。

整个路网可以理解为一个「**两环 + 多放射 + 三大动脉隧道**」的格局：

### 🗺️ 一、 对外连接主干道与隧道（进出沙田的门户）

沙田被群山环绕，因此**隧道**是连接九龙的生命线。这也是沙田区别于九龙各区最显著的特点。

1.  **狮子山隧道公路 (Lion Rock Tunnel Road)**：这是沙田连接**九龙塘**及九龙西的最经典通道，历史最悠久，也是沙田市中心（新城市广场）的进出命脉。
2.  **大老山公路 (Tate's Cairn Highway)**：连接**钻石山**及东九龙，是通往观塘、将军澳及香港东区的重要选择，与隧道直接相连。
3.  **青沙公路 (Tsing Sha Highway)**：**这是八号干线的一部分**，包含**大围隧道、沙田岭隧道及尖山隧道**。它连接**西九龙及大屿山**（昂船洲大桥方向），是目前去机场或西九龙的快速通道，车流相对较少。
4.  **城门隧道公路 (Shing Mun Tunnel Road)**：连接**荃湾**及新界西北，是前往屯门、元朗方向的必经之路，也是沙田西出的主要通道。
5.  **吐露港公路 (Tolo Highway)**：沙田的**北向大动脉**，紧贴城门河，连接**大埔、粉岭及上水**，是新界东的纵向脊骨。
6.  **大埔公路-沙田段 (Tai Po Road - Sha Tin)**：这是一条极具历史意义的道路，与吐露港公路平行，穿过沙田市中心腹地。近年来该路段经历了大规模的扩宽工程，以缓解交通压力。

### 🌉 二、 区内两大环回主干道（连接新市镇各区的骨架）

沙田被城门河贯穿，道路布局基本上是**环河而建**。

1.  **沙田路 (Sha Tin Road)**：这是一条**绕避市中心**的快速公路（类似外环）。它连接火炭、沙田围，直通大老山公路，用于快速过境或连接东西两侧，避免陷入沙田市中心的拥堵。
2.  **大涌桥路 (Tai Chung Kiu Road)**：这是沙田核心区的**内环**，连接**石门、沙田第一城、富豪花园、乙明邨**，并跨过城门桥通往马鞍山方向。它是区内通勤和巴士线路最密集的道路之一。
3.  **沙田乡事会路 (Sha Tin Rural Committee Road)**：作为市中心核心环线，连接沙田站、新城市广场、排头村，是通往狮子山隧道公路的关键接口。

### 🏘️ 三、 各分区的主要道路（毛细血管）

沙田由多个卫星城市组成，每个区域的路网各有特色。

#### 1. 沙田市中心（繁华商业核心）
这里是交通枢纽，路网密集。
-   **沙田正街 (Sha Tin Centre Street)**：环绕新城市广场和沙田大会堂的主要街道。
-   **担杆莆街 (Tam Kong Po Street)** / **白鹤汀街 (Pak Hok Ting Street)**：连接沙田正街与狮子山隧道公路，是进入新城市广场停车场的常见路线。
-   **排头街 (Pai Tau Street)**：沙田政府合署及巴士总站所在地。

#### 2. 城河东岸（源禾路一带）
这里主要连接禾輋邨、沥源邨及沙田运动场。
-   **源禾路 (Yuen Wo Road)**：连接沙田市中心与火炭的交通动脉，沿途经过沙田公园及多个政府设施。
-   **禾輋街 (Wo Che Street)**：深入禾輋邨内部的主要道路，连接源禾路。

#### 3. 火炭（工业与住宅混合区）
火炭是沙田的工业区，道路命名与九龙湾、新蒲岗的「工业系」类似。
-   **火炭路 (Fo Tan Road)**：火炭的出入大动脉，连接大埔公路与源禾路。
-   **山尾街 (Shan Mei Street)** / **穗禾路 (Sui Wo Road)**：火炭工业区核心，穗禾路则通往半山的穗禾苑。
-   **桂地街 (Kwai Tei Street)**：火炭工业区南侧的主要街道。

#### 4. 马鞍山（东段延伸）
虽然马鞍山是沙田的一部分，但其路网自成体系，主要沿西沙路和馬鞍山路分布。
-   **西沙路 (Sai Sha Road)**：连接沙田与西贡的公路，贯穿马鞍山多个屋苑。
-   **恒德街 (Hang Tak Street)** / **恒泰路 (Hang Tai Road)**：马鞍山与大水坑一带的主要连接路。

### 💡 口述导览建议

> 「在沙田认路，**关键在于分清你是要去『九龙』还是『市中心』**。
>
> 如果你要去**九龙**，走**狮子山隧道**最近市中心，但容易塞车；走**大老山**去东九龙最快；去西九龙或机场，**青沙公路（尖山隧道）** 是最佳选择。
>
> 如果你在**沙田区内**，记住**大涌桥路**是连接石门、第一城到沙田围的内环；**源禾路**是去市中心河边的主路。
>
> 最大的特色是，沙田很多路是**与城门河平行**的，只要你搞清了自己在河的**东岸还是西岸**，就基本不会迷路。像**吐露港公路**和**大埔公路**，一快一慢，都是往北去大埔的。」

希望这份口述能帮助你在脑海中构建起沙田清晰的路网图景。`,Na=`油尖旺区作为九龙半岛的交通中枢，其道路网络主要分为三大板块：**贯通南北的主干道及快速路**、**连接东西的横向道路**，以及**各区的特色街道**。以下为你逐一梳理。

**交通网络格局**：
油尖旺的道路走向受填海历史影响明显，形成了“南北纵深、东西连接”的格局。南北向以**弥敦道、广东道**及**西九龙公路**为骨架；东西向则有**佐敦道、加士居道**等连接九龙东西部。

---

### 一、 主要南北向走廊（连接尖沙咀至旺角/深水埗）

*   **弥敦道 (Nathan Road)**：油尖旺区的核心命脉，贯穿尖沙咀、佐敦、油麻地至旺角，是九龙半岛最著名的大街，沿线商铺、酒店林立。
*   **广东道 (Canton Road)**：与弥敦道平行，南接梳士巴利道，北连荔枝角道。尖沙咀段拥有海港城等大型商场，旺角段则较为老旧，拥有香港最大门牌编号（旺角广东道1239号）。
*   **西九龙公路 (West Kowloon Corridor) / 西九龙走廊 (West Kowloon Corridor)**：区域西侧的快速主干道，连接港岛、九龙及新界，是5号干线的重要组成部分，车流量极大。
*   **渡船街 (Ferry Street)**：位于油麻地西侧的内陆干道，连接塘尾道与佐敦道，其天桥段是连接西九龙走廊与加士居道的枢纽，但在高峰时段较为拥堵。
*   **窝打老道 (Waterloo Road)**：位于油尖旺区东边界附近，连接九龙塘与何文田。
*   **公主道 (Princess Margaret Road)**：区界东侧的快速道路，连接红磡与九龙塘。

### 二、 主要东西向主干道（连接各区及跨海通道）

*   **佐敦道 (Jordan Road)**：连接西九龙填海区、广深港高铁西九龙站、柯士甸站至弥敦道及加士居道的重要枢纽。
*   **加士居道 (Gascoigne Road)**：5号干线一部分，连接渡船街天桥与漆咸道南，是东西过境车流的关键路段。
*   **甘肅街 (Kansu Street) / 欣翔道 (Yan Cheung Road)**：连接油麻地内街与西九龙海泓道、连翔道等新填海区道路。
*   **亚皆老街 (Argyle Street)**：旺角区主要东西向干线，连接大角咀与九龙城。
*   **荔枝角道 (Lai Chi Kok Road)**：连接深水埗与旺角、太子一带。
*   **太子道西 (Prince Edward Road West)**：旺角北边界，连接深水埗与九龙城。

### 三、 重要的连接路与交汇处（枢纽立交）

*   **油麻地交汇处 (Yau Ma Tei Interchange)**：连接**建翔道、丽翔道、海泓道、西九龙公路、海宝路及中九龙绕道**的复杂互通立交，是进出西九龙的核心枢纽。
*   **丽翔道 (Lai Cheung Road) & 海泓道 (Hoi Wang Road)**：连接油麻地内街与西九龙填海区（奥运/九龙站）的重要连接路。
*   **连翔道 (Lin Cheung Road)**：西九龙填海区内的南北向连接路，连接长沙湾、大角咀及九龙站片区。
*   **海辉道 (Hoi Fai Road) & 海帆道 (Hoi Fan Road)**：位于西九龙海滨，连接奥运站一带及维港岸边的道路。

### 四、 各区细分道路（旺角、尖沙咀特色街道）

*   **旺角/大角咀区域**：
    *   **内街市集**：**花园街 (Fa Yuen Street)**、**弼街 (Bute Street)**（俗称金鱼街）、**西洋菜南街 (Sai Yeung Choi Street South)**、**通菜街 (Tung Choi Street)**（俗称女人街）。
    *   **旧区连接路**：**塘尾道 (Tong Mi Road)**、**新填地街 (Reclamation Street)**、**上海街 (Shanghai Street)**、**砵兰街 (Portland Street)**。
*   **尖沙咀区域**：
    *   **购物/酒吧区**：**金巴利道 (Kimberley Road)**、**山林道 (Hillwood Road)**、**诺士佛台 (Knutsford Terrace)**、**漆咸道南 (Chatham Road South)**。
    *   **海旁观光**：**梳士巴利道 (Salisbury Road)**（星光大道及酒店所在地）、**九龙公园径 (Kowloon Park Drive)**、**中间道 (Middle Road)**。
    *   **与弥敦道平行的横街**：**海防道 (Haiphong Road)**、**北京道 (Peking Road)**、**汉口道 (Hankow Road)**。
*   **西九龙填海区（九龙站/奥运）**：
    *   **新开发道路**：**文化道 (Cultural Boulevard)**（连接博物馆道）、**油旺里 (Yau Mong Lane)**（接驳碧街与登打士街的小路）、**海庭道 (Hoi Ting Road)**、**海宝路 (Hoi Po Road)**。

### 总结表格

为了让你看起来更直观，以下将主要道路按片区进行分类：

| 片区 | 主要道路名称 | 备注 |
| :--- | :--- | :--- |
| **南北动脉** | 弥敦道、广东道、西九龙公路、渡船街 | 贯穿全区的主要通道，连接尖沙咀至旺角 |
| **东西干线** | 佐敦道、加士居道、亚皆老街、荔枝角道 | 连接油尖旺与九龙城、深水埗及过海隧道 |
| **主要枢纽** | 油麻地交汇处、丽翔道、连翔道 | 连接高速公路与填海区的立交/干道 |
| **旺角/油麻地** | 花园街、弼街、西洋菜南街、上海街 | 传统购物区、市集及旧区街道 |
| **尖沙咀** | 梳士巴利道、漆咸道南、金巴利道、山林道 | 海滨景观、酒店区、夜生活及商业区 |
| **大角咀/奥运** | 海泓道、樱桃街、深旺道、海辉道 | 西九龙填海区的新发展道路 |

希望这份列表能帮你理清油尖旺区的道路脉络。如果你需要了解某个特定景点（比如海港城或朗豪坊）的周边道路情况，我可以再为你详细介绍。`,Ca=`根据香港运输署、地政总署等官方资料，深水埗的道路网络大致可分为**内街市集**、**主要干道**和**对外连接路**三类。为了让你有个整体的概念，下面按功能分区，以口述的形式为你梳理深水埗的主要道路：

### 🗺️ 深水埗道路网络格局

- **核心购物区与市集（东侧）**：此区域以**桂林街**、**北河街**、**鸭寮街**最为闻名。这里的街道狭窄，两侧布满排挡，是深水埗充满活力的核心区。平行走向的主街包括**长沙湾道**（服饰批发）、**荔枝角道**（建材五金）、**汝州街**（珠仔街）、**基隆街**（钮扣/布料）等。这些街道被**钦州街**、**南昌街**等垂直道路贯穿。

- **公共屋邨与民生区（西侧）**：从钦州街往西至东京街，主要是住宅区，如**丽阁邨**、**富昌邨**。这里的街道如**东京街**、**元州街**、**幸福街**，环境相对清幽，主要服务周边居民。

- **长沙湾/荔枝角工贸区**：再往西过了兴华街，便进入工厂大厦与写字楼区。这里的街道常带“西”字，如**大南西街**、**汝州西街**、**永康街**等，两旁是加装了货台的工业大厦。

- **西北部/新住宅区**：兴华街西以西是较新的私人住宅区，街道规划较新，例如**深盛路**、**海丽街**等。

### 🚗 主要对外连接道路

以下是进出深水埗的关键通道：

- **长沙湾道 (Cheung Sha Wan Road)**：深水埗的核心主干线，贯穿全区，连接旺角及葵涌，地下有地铁荃湾线（深水埗站及长沙湾站）。
- **荔枝角道 (Lai Chi Kok Road)**：与长沙湾道平行，东接旺角，西连美孚，区内路段经南昌街、钦州街等路口。
- **大埔道 (Tai Po Road)**：连接深水埗与沙田及新界东，北接大埔公路，路口复杂但车流快。
- **青山道 (Castle Peak Road)**：青山公路的市区段，连接长沙湾、葵涌及屯门，与元州街形成区内重要的单向交通配对。
- **西九龙走廊 (West Kowloon Corridor)**：途经深水埗西面的快速公路，连接旺角、尖沙咀及新界西，途经的**兴华街西**设有出入口。

### 📜 官方“主要道路”列表

以下是深水埗区内所有具备官方记录的交通干道，覆盖了从横街窄巷到宽阔大道的完整路网：

1.  大埔道
2.  长沙湾道
3.  荔枝角道
4.  青山道
5.  元州街
6.  南昌街
7.  钦州街
8.  东京街
9.  兴华街
10. 福华街
11. 福荣街
12. 鸭寮街
13. 汝州街
14. 基隆街
15. 大南街
16. 海坛街
17. 医局街
18. 通州街
19. 界限街
20. 白杨街
21. 枫树街
22. 西洋菜北街
23. 石硖尾街
24. 北河街
25. 桂林街

> **特别说明**：以上列表聚焦于**深水埗市中心及石硖尾一带**的主要道路。根据行政区划，位于区西的长沙湾、荔枝角一带（如蝴蝶谷道、荔景山路等）未被包含在内，以保持深度游的参考价值。

如果你需要查询某条特定街道的具体位置，或者想了解某个路段附近的特色，随时可以再问我。`,ka=`根据公开资料，红磡区的道路网络主要分为**历史悠久的旧区街道**和**填海发展形成的新区干道**两大板块。

---

### 一、 对外连接主干道（边界与进出通道）

这些道路是红磡与外界联系的生命线，车流量最大，连接尖沙咀、土瓜湾及跨海隧道。

1.  **漆咸道北**：
    -   这是红磡西侧最重要的边界道路，南北走向。它向北连接马头围道通往土瓜湾，向南直达尖沙咀，是红磡与九龙半岛核心区连接的关键通道。
2.  **马头围道**：
    -   位于红磡与土瓜湾交界处，是一条重要的南北向动脉。它北接马头角道，南连漆咸道北，红磡段的沿线分布有红磡商业中心等设施。
3.  **康庄道**：
    -   这是连接**海底隧道（红磡海底隧道）** 的主要道路，直接通往铜锣湾方向，是红磡乃至整个九龙通往香港岛的核心干道。
4.  **公主道连接路**：
    -   连接公主道与红磡区内部，是车辆从何文田方向进入红磡的重要通道。

### 二、 区内主要街道（红磡旧区核心）

这些街道集中在港铁红磡站以东、黄埔站以西的传统红磡区，以“街、里、道”命名，充满了老香港的生活气息。其中，**马头围道**和**蕪湖街**是两大横向轴线。

1.  **蕪湖街**：
    -   红磡旧区的核心横轴，东西走向，连接漆咸道北与红磡道。这里商铺林立，是红磡最繁忙的传统街市和商业地带之一。
2.  **寶其利街**：
    -   与蕪湖街平行的一条著名街道，以多样化的社区小店和餐馆闻名，是红磡老区的生活命脉。
3.  **機利士南路 / 機利士北路**：
    -   连接蕪湖街与畅运道的重要纵向道路，靠近红磡站。南路多旧式住宅，北路则通往佛光街方向。
4.  **佛光街**：
    -   连接红磡与何文田的重要斜坡道路，附近有香港理工大学学生宿舍及何文田公园。
5.  **温思劳街**：
    -   这条街道以其独特的殡仪服务业聚集而闻名，是红磡极具特色的一条街道。
6.  **曲街 / 老龙坑街 / 黄甫街**：
    -   这是红磡旧区内一组纵横交错的密集街道，多为单行线，两旁是年代较久的住宅楼宇。
7.  **差馆里**：
    -   因早期的红磡警署（差馆）坐落于此而得名，连接蕪湖街与机利士南路。

### 三、 填海区与新型道路（黄埔及海滨）

这一区域是在红磡湾填海造地后形成的，道路规划更宽阔，多呈网格状，主要服务于黄埔花园、海逸豪园等大型私人屋苑。

1.  **红磡道**：
    -   红磡填海区的**核心主动脉**，南北走向，贯穿整个黄浦及海滨新区。它连接着红磡湾、黄埔花园及海滨南岸等多个大型屋苑，是区内最重要的通勤道路。
2.  **红磡南道**：
    -   位于红磡站以南，连接红磡道与畅运道，是前往红磡码头及海滨长廊的必经之路。
3.  **红磡绕道**：
    -   这是一条海滨快速连接路，可以快速从红磡道通往尖沙咀方向，避开旧区拥堵路段。
4.  **德民街 / 德安街 / 德丰街**：
    -   这几条“德”字头的街道构成了**黄埔花园**的商业及交通核心。德民街更是著名的饮食街，连接黄埔地铁站与屋苑各期。
5.  **海逸道**：
    -   位于海逸豪园和海名轩（九龙最高住宅之一）旁的海滨道路，环境优美，连接大环道东。
6.  **红乐道 / 红荔道**：
    -   环绕**香港理工大学红磡湾校舍**及海滨绿化带的两条弧形道路。

### 四、 特色及辅助道路（工业与殡仪区）

1.  **畅运道 / 安运道**：
    -   直接连接**红磡站**、都会海逸酒店及**香港体育馆（红馆）** 的核心道路，是交通枢纽地带。
2.  **民裕街 / 民乐街**：
    -   位于红磡工业区，多为单行线，两旁主要是工业大厦及仓储用途。
3.  **大环道 / 大环道东**：
    -   连接红磡旧区与海滨新区（海逸豪园）的过渡性道路，中间经过工业区。
4.  **必嘉街**：
    -   这是旧区一条曲折狭长的街道，连接机利士南路与黄埔街，沿途有著名的“红磡鸡蛋仔”等小吃店。

---

### 总结：口述导览建议

如果你需要在口述中让别人理解红磡的路网，可以这样描述：

> “红磡的路网可以分成新、旧两块来看。**旧区**以**马头围道**和**蕪湖街**为十字骨架，周围密布着**宝其利街**、**机利士南路**这类窄街，那里很有老香港的生活气息，步行可达。**新区**则集中在填海区，**红磡道**是那里的南北大动脉，串联起**黄埔花园**的德民街和**海逸豪园**。如果要去红馆看演唱会，认准**畅运道**就行了；如果想避开塞车，走**红磡绕道**会顺很多。”`,Ta=`荃湾作为新界西的交通枢纽，道路网络大致可以分为两类：一类是像青山公路和荃湾路这样的区域性主干道，负责连接屯门、九龙及机场；另一类则是深入市中心、服务街坊的内街，如众安街、沙咀道等。以下为你分层列出荃湾的主要道路及连接路：

---

### 🛣️ 一、 重要区域性干道与连接路
这些道路通常车速较快，承担着连接荃湾与香港其他地区（如九龙、屯门、沙田、大屿山）的重任。

-   **青山公路（荃湾段）**：这是荃湾最古老和核心的道路之一，呈东北-西南走向贯穿整个荃湾市中心，沿线商舖林立，是荃湾的大动脉。它与大涌道、大河道、西楼角路等多条道路交汇。
-   **荃湾路**：一条高架快速公路，是连接九龙和屯门的重要通道（属5号干线），沿海傍绕过荃湾市中心，设有海兴交汇处、荃青交汇处等出入口。
-   **象鼻山路**：位于荃湾东侧，是连接屯门公路与城门隧道的重要封闭道路，方便车辆往来新界西北与沙田。
-   **德士古道**：一条位于荃湾东南部的繁忙道路，连接荃锦交汇处与荃青交汇处，是通往青衣、沙田及九龙的重要捷径。其北段称为**德士古道北**，连接荃锦交汇处。
-   **大河道**：贯通荃湾南北的重要主干道，连接如心广场、荃湾西站一带与青山公路，设有**大河道北**连接荃锦交汇处。
-   **大涌道**：与大海道平行，同样贯穿荃湾南北，南端连接荃湾路（海兴交汇处），是通往屯门公路的要道之一。
-   **青荃路**：连接荃湾与青衣的快速道路，经担杆山交汇处可通往青衣北岸，也被称为青衣北桥。
-   **屯门公路**：虽主要位于屯门，但其南端起点始于荃湾的柴湾角附近，是连接荃湾与新界西北的生命线。
-   **城门隧道**：连接荃湾与沙田的收费隧道，其荃湾端的出入口连接象鼻山路。

### 🏙️ 二、 市区主要内街与连接路
这些道路构成了荃湾市区的骨架，连接住宅区、商业中心与公共设施。

-   **沙咀道**：荃湾最长的街道之一，横穿市中心，沿线有多个大型屋苑和工业大厦。
-   **西楼角路**：位于荃湾北面，紧邻港铁荃湾站，是前往荃湾市中心的重要通道。
-   **杨屋道**：位于荃湾南面，经过近年发展，已成为新兴的住宅和商业区，连接德士古道与大河道。
-   **蕙荃路**：连接青山公路与石围角、象山等公共屋邨，也是通往荃锦交汇处的重要道路。
-   **海兴路**：连接青山公路与荃湾路（海兴交汇处）的纽带，靠近海滨花园一带。
-   **众安街**：荃湾著名的“购物街”，连接青山公路与荃湾街市街，路面狭窄，车水马龙。
-   **川龙街**：与众安街平行，同样是繁忙的市区街道，也是不少小巴路线的起点或终点。
-   **兆和街**：位于荃湾市中心，连接青山公路与川龙街，是多条专线小巴的起点站。
-   **荃锦公路**：一条蜿蜒曲折的公路，从荃湾市中心的荃锦交汇处开始，一路向东北上山，通往大帽山及锦田。
-   **海安路**：沿荃湾海滨而建，连接青山公路与屯门公路，是通往汀九、深井方向的海傍路段。

### 🚗 三、 重要枢纽交汇处
这些交汇处是连接上述不同道路的关键节点，尤其在进出快速公路时需要注意：

-   **荃青交汇处**：连接荃湾路、青荃路与德士古道的枢纽，是往来青衣、九龙和新界西北的咽喉。
-   **荃锦交汇处**：这是一个复杂的立体交汇处，连接象鼻山路、荃锦公路、德士古道北、大河道北和蕙荃路，是通往新界北（经大帽山）和沙田的起点。
-   **海兴交汇处**：位于荃湾路南端，连接大涌道及海兴路，是进入荃湾市中心西侧的主要出入口。
-   **柴湾角交汇处/迴旋处**：位于青山公路近柴湾角工业区，连接屯门公路及海安路。
-   **和宜合交汇处**：位于象鼻山路附近，连接和宜合道、三栋屋路等，是通往梨木树、石篱及城门水塘的关键路口。

希望这份清单能帮助你更清晰地了解荃湾的道路网络。`,Ra=`好的，根据您的要求，以下是荃湾及青衣地区所有主要道路和连接路的口述列表。

### 🛣️ 荃湾及青衣主要道路与连接路列表

#### 🌉 跨海连接路
这是连接荃湾与青衣，或青衣与外界连接的关键海上通道。

-   **青荃路 (Tsing Tsuen Road)**：俗称“青衣北桥”，是一条连接**荃湾**与**青衣岛**的跨海大桥，双向通车，是两岸交通的骨干。
-   **青衣北岸公路 (Tsing Yi North Coastal Road)**：位于青衣岛北岸的高架路，连接**青荃路**与**青衣西北交汇处**，让车辆可以绕过市中心，快速前往青屿干线及香港国际机场。
-   **青衣大桥 (Tsing Yi Bridge)**：俗称“青衣南桥”，是青衣岛第一条连接 mainland 的跨海大桥，连接**青衣南**与**葵涌**及**荃湾路**。

#### 🔗 主要干道与交汇处
这些是支撑区域交通流量的核心主干道和大型立交桥。

-   **荃湾路 (Tsuen Wan Road)**：一条绕过荃湾市中心的高架快速公路，连接**屯门公路**与**葵涌道**，是通往九龙和新界西北的主要通道。
-   **青山公路－荃湾段 (Castle Peak Road - Tsuen Wan)**：荃湾区的传统主干道，贯穿整个荃湾市中心，沿线商铺及住宅林立。
-   **担杆山交汇处 (Tam Kon Shan Interchange)**：青衣岛北部的交通枢纽，连接**青荃路**、**担杆山路**、**枫树窝路**和**青敬路**。
-   **荃青交汇处 (Tsuen Tsing Interchange)**：位于荃湾海滨，是连接**荃湾路**、**青荃路**与**德士古道**的关键交汇处。
-   **德士古道 (Texaco Road)**：荃湾东部的主要道路，连接**荃青交汇处**与**荃锦交汇处**，是来往沙田及城门隧道的重要通道。

#### 🏙️ 区内主要道路
这些道路主要负责连接岛内或区内的不同社区和设施。

-   **青衣西路 (Tsing Yi Road (West))**：青衣岛西部的南北向大动脉，连接**寮肚路**与**青衣路**，可通往长康及长青邨等住宅区。
-   **枫树窝路 (Fung Shue Wo Road)**：青衣岛中部的主要道路，连接**担杆山交汇处**与**青衣码头**，沿线有青衣邨等公共屋邨。
-   **青敬路 (Tsing King Road)**：连接**担杆山交汇处**与**枫树窝路回旋处**，是青衣站、青衣公园及多个大型屋苑的必经之路。
-   **青衣乡事会路 (Tsing Yi Heung Sze Wui Road)**：连接**枫树窝路回旋处**与**青衣路**（近青衣大桥），是连接青衣中及南部的重要道路。
-   **青康路 (Ching Hong Road)**：**青衣西路**与**青衣路**的连接线，沿途经过长康邨及长青邨等多个大型屋苑。
-   **大河道 (Tai Ho Road)**：荃湾市中心的主要南北道路，连接**青山公路**与**荃湾渡轮码头**，与**大涌道**平行。
-   **大涌道 (Tai Chung Road)**：荃湾西部的南北向主干道，连接**青山公路**与**荃湾路**，是进入荃湾市中心前的重要分流道路。`,La=`根据公开的道路资料，荔枝角（及相邻的美孚）的主要道路和连接路如下。为了方便你口述，已按照**东西向**和**南北向**进行了大致归类：

### 🗺️ 第一类：东西向主干道（连接葵涌、长沙湾方向）

- **荔枝角道**：区内的核心交通动脉，是连接旺角、深水埗至荔枝角的主干线。
- **长沙湾道**：与荔枝角道平行，同样是连接九龙西各区的重要商业和工业地带。
- **青山道**：位于长沙湾及荔枝角一带的传统旧区道路。
- **呈祥道**：位于荔枝角北面边界的主要干道，也是深水埗区与葵青区的分界线。
- **通州街**：靠近海滨（西九龙填海区）的东西走向道路。

### 🗺️ 第二类：南北向及连接路（通往美孚、荔景、货柜码头方向）

- **美荔道**：位于美孚新邨内，连接荔枝角与葵涌方向。
- **荔湾道**：位于美孚新邨内部，连接美荔道与旧荔枝角海滩一带。
- **蝴蝶谷道**：连接长沙湾、荔枝角与青山公路葵涌段的重要通道。
- **兴华街**：贯穿工业区与住宅区的道路。
- **通州西街**：位于长沙湾工业区边缘，连接青山道与荔枝角道。
- **大南西街**：连接荔枝角道与长沙湾道的工业区道路。
- **宝轮街**：位于曼克顿山及九巴车厂旁的小路。
- **荔宝路**：通往荔湾交汇处及连翔道（西隧线）的主要连接路。

### 🗺️ 第三类：快速公路及主要干道（5号干线）

- **西九龍走廊**：穿过荔枝角/长沙湾西部的架空高速道路，连接旺角与荔枝角道。
- **葵涌道（荔枝角大桥段）**：位于荔枝角道末端的公路，连接九龙与新界西。

以上就是荔枝角的主要道路网络。如果你是用于录制视频或现场播报，建议将第一类作为主轴介绍，第二类作为辅助补充。希望对你有帮助！`,Aa=`观塘的道路网络，就像是九龙东的交通枢纽。与规划整齐的启德或九龙湾不同，这里新旧交织，既有早年工业区留下的紧凑街道，也有连接全市的交通大动脉。

整个路网可以清晰地分为以下三个层次来理解：

### 🗺️ 一、 对外连接主干道（进出观塘的门户）

这些道路承载着巨大的车流量，是连接港岛、新界西及东九龙其他地区的生命线。

1.  **观塘道 (Kwun Tong Road)**：这是观塘乃至整个东九龙最核心的横向动脉。它西接九龙湾、彩虹，东连翠屏道和鲤鱼门道，沿线设有多个港铁站（观塘站、牛头角站），是进出观塘的必经之路，全天车流繁忙。
2.  **将军澳道 (Tseung Kwan O Road)**：位于观塘东侧，是连接将军澳与九龙市区的主要快速公路。通过它可接驳东区海底隧道前往香港岛。
3.  **鲤鱼门道 (Lei Yue Mun Road)**：位于观塘东南侧，是连接观塘市中心、翠屏、蓝田及油塘的主要道路，也是通往东隧的又一选择。
4.  **太子道东 (Prince Edward Road East)**：位于观塘区西北角边界，连接九龙城与新蒲岗，是西行出九龙的重要通道（与九龙湾段功能类似）。

### 🏙️ 二、 区内主干道（连接新旧区域的骨架）

这一层级的路网将住宅区、工业区旧址与海滨区域串联起来，是区内出行的主要选择。

#### 南北纵向（连接山上的住宅与山下海滨）

1.  **协和街 (Hip Wo Street)**：作为观塘南北走向的命脉，它从观塘道一直延伸到秀茂坪，沿线和乐邨、祥和苑等住宅林立。
2.  **康宁道 (Hong Ning Road)**：这条著名斜路连接观塘市中心与基督教联合医院，功乐道、康利道等多条支路都从它分支出去。
3.  **翠屏道 (Tsui Ping Road)**：位于观塘东侧，是通往翠屏邨和基督教家庭服务中心的主要道路。

#### 东西横向（横贯商贸与旧区）

1.  **开源道 (Hoi Yuen Road)**：这是从港铁观塘站进入商贸区的“第一街”，人流极大。目前正在进行**伟业街/开源道路口改善工程**，未来通行能力将显著提升。
2.  **伟业街 (Wai Yip Street)**：贯穿观塘商贸区的核心东西向道路，连接九龙湾与观塘海滨，路旁常有上落货活动，是典型的工业区遗留特色。
3.  **海滨道 (Hoi Bun Road)**：位于最南侧沿海地带，环境相对开阔，连接观塘海滨花园，是散步和通往启德邮轮码头方向的景观道路。
4.  **牛头角道 (Ngau Tau Kok Road)**：位于牛头角站以北，穿过旧区街市与住宅，是体验观塘市井生活的典型街道。

### 🏭 三、 工商贸区核心街道（工业肌理的“毛细血管”）

这里是昔日观塘工业的心脏地带，街道多呈方格网状分布，且富有规律。

1.  **六条南北向的“连接线”**：为了改善行人从观塘道去往海滨的体验，规划出了 **6 条主要的南北连接线**（俗称“X业线”），它们是商贸区内的“快速步行通道”：
    *   **开源线**：流量最大，连接观塘站与未来行动区。
    *   **巧明街 (How Ming Street)**：人流密集的典型工贸街。
    *   **敬业街 (King Yip Street)**：未来配合翠屏河改造将变成景观街道。
    *   **励业街 (Lai Yip Street)**：连接牛头角站与海滨的关键点。
    *   **骏业街 (Tsun Yip Street)**：拥有区内少有的小型休憩公园。
    *   **顺业街 (Shun Yip Street)**：通往海滨的最短路径之一。

2.  **“X业街”系列**：除了上述提到的，还有**大业街 (Tai Yip Street)**、**荣业街 (Wing Yip Street)**、**鸿图道 (Hung To Road)** 等。这些街道主要承担着货物装卸、轻工业生产及写字楼通勤的功能。

3.  **“巧”字与“成”字系列**：
    *   **巧明街 (How Ming Street)**、**巧\`\`\`\`里**（已经提及）。
    *   **成业街 (Shing Yip Street)**：连接观塘道与敬\`\`\`\`yip街的核心地带。

### 🧭 口述导览建议

> “在观塘认路，要先抓准**观塘道**这条横线。如果你在山上（秀茂坪、晓丽苑），要通过**协和街**或**康宁道**下来；如果你要去海滨，就认准**开源道**或**巧明街**这些‘南北走廊’，一直往南走。而**伟业街**是横贯东西的大动脉，但路边货车多，走起来要留神。记住，那一堆带‘业’字的街道，就是以前的工厂区核心。”

希望这份口述能帮助你在脑中构建起观塘的路网地图。如果你是想重点了解某一区域（比如观塘市中心重建区、海滨一带）的详细路径，可以随时告诉我，我再为你展开细说。`,Oa=`根据现有资料，香港长沙湾片区的主要道路和连接路如下。需要说明的是，这份列表主要涵盖该区域的核心干道与著名街道，可能无法穷尽所有小巷。

### 🛣️ 主要东西向主干道
- **长沙湾道**：贯穿深水埗、长沙湾及荔枝角，是该区最重要的交通动脉之一，地底下是港铁荃湾线。
- **荔枝角道**：与长沙湾道大致平行，同为连接深水埗、长沙湾至荔枝角的重要道路。
- **青山道**：长沙湾的旧式道路，周边有住宅和工业区混合。在部分路段，青山道位于长沙湾道的高处，两者地势不同。
- **深旺道**：位于长沙湾海滨的填海区域，连接深水埗与旺角西，海达邨等公共屋邨和巴士总站都设于此。

### 🚗 主要南北向连接路
- **东京街/东京街西**：连接李郑屋邨与长沙湾海滨，新填海路段（东京街西）可直达连翔道，是通往西九龙走廊的重要通道。
- **兴华街**：长沙湾工业区与住宅区之间的分界道路，向南延伸可连接兴华街西及西九龙公路。
- **蝴蝶谷道**：位于长沙湾与荔枝角交界处，连接青山道及呈祥道，是往新界西及九龙北的主要干道。
- **通州西街/通州街**：位于长沙湾工业区，靠近海滨，连接荔枝角道及深旺道，也是多条巴士路线的必经之路。

### 🚀 快速公路与高架道路
- **西九龙走廊**：一条贯穿九龙西的快速公路，途经长沙湾，连接油麻地、旺角及新界西，车辆通常经东京街或兴华街上落。
- **西九龙公路**：车速限制较高的快速公路，作为西区海底隧道的连接路，贯穿长沙湾西部，主要应付跨区及过海车流。
- **青沙公路（及荔枝角高架道）**：连接沙田与长沙湾的快速公路（8号干线），车辆可从长沙湾经该路直达沙田及大屿山。
- **连翔道**：西九龙公路的辅助道路，连接长沙湾与尖沙咀及高铁西九龙站一带。

### 🏙️ 著名区内街道
- **保安道、顺宁道、元州街**：主要穿过长沙湾的住宅区（如苏屋邨、元州邨）及街市地带。
- **甘泉街**：位于长沙湾与荔枝角交界处的巴士总站所在地，周边是工业区及商业大厦。
- **长顺街**：靠近长沙湾警署及长沙湾广场，是商业与交通交汇点。

如果想了解其中某条道路的更多细节，或者想知道这些道路附近有什么好去处，都可以告诉我。`,Ea=`青衣岛上纵横交错的道路网络主要分为三个部分：连接全岛的“大动脉”、服务社区内部的“毛细血管”，以及快速出入岛的“连接通道”。下面为你逐一介绍。

### 🗺️ 主要道路一览

为了方便你理解，我把青衣的主要道路按区域和功能整理成了下面的表格：

| 区域/分类 | 道路名称 | 主要特色与连接 |
| :--- | :--- | :--- |
| **南北主骨架** | **青衣西路** | 纵贯青衣西侧，连接青衣北的枫树窝路与青衣南的青衣路，途径寮肚桥。 |
| | **枫树窝路** | 青衣中部的交通动脉，连接担杆山交汇处与青衣码头，北端与青衣西路交汇。 |
| | **青敬路** | 连接担杆山交汇处与枫树窝回旋处，沿途有青衣站、青衣公园等重要地标。 |
| | **青衣乡事会路** | 连接青衣中部与南部，北接枫树窝回旋处，南至青衣路，靠近青衣大桥。 |
| **中部及住宅区** | **青康路** | 青衣南的主要道路，连接青衣西路和青衣路，是早期发展的主干道之一。 |
| | **寮肚路** | 通往寮肚山住宅区（如长亨邨、长宏邨）的唯一行车道路，连接青衣西路。 |
| | **涌美路** | 东西走向，围绕长青邨和长康邨北坡，连接青康路与青衣乡事会路。 |
| | **青衣路** | 青衣南部最长的道路之一，连接青衣交汇处与青衣西路，贯穿工业区。 |
| | **青绿街 / 青叶街** | 位于青衣中部的区内街道，连接青敬路与枫树窝路，服务周边住宅。 |
| **北部及辅助** | **担杆山路** | 位于青衣北，连接担杆山交汇处与樟树头工业区，可通往青衣北岸公路。 |
| | **细山路** | 位于青衣南，是一条短小的道路，连接青衣路，前往美景花园。 |

### 🔗 重要连接路

要让车辆快速进出青衣或往来不同区域，这些连接道路至关重要：

- **青衣北岸公路**：这是**一条东西向的快速公路**，全长约2.2公里，连接东面的青荃路和西面的青衣西北交汇处（青马管制区）。它的主要作用是让车辆避开青衣市中心，直接往返荃湾与大屿山/机场方向，有效缓解了青衣西路的交通压力。
- **青衣至大屿山连接路（规划中）**：**这是一条未来的策略性干道**，计划在现有青屿干线的南侧，新建一条长约5.2公里的连接路，直接连接青衣（青沙公路）与大屿山（北大屿山公路），将成为连接新界西北和市区的重要新通道。

如果想了解某条特定道路的沿线地标或交通状况，可以随时告诉我，我会为你详细介绍。`,Ia=`

## 一、对外连接主干道（进出马鞍山的门户）

马鞍山作为沙田新市镇的延伸部分，被群山环绕，对外连接主要依靠几条放射状主干道：

1. **马鞍山路 (Ma On Shan Road)**：这是马鞍山连接沙田市中心的**核心动脉**，呈南北走向，北端连接西沙路（近乌溪沙），南端连接大老山公路及沙田路。几乎所有进出马鞍山的车辆都必须经过这条路。

2. **大老山公路 (Tate's Cairn Highway)**：位于马鞍山南侧，是一条快速公路，连接沙田路及大老山隧道。经此路可前往钻石山、九龙湾及东九龙各区。

3. **西沙路 (Sai Sha Road)**：这是马鞍山**向西延伸**的主要通道，连接马鞍山与西贡市中心。沿途经过十四乡、企岭下等乡村地带，是前往西贡郊野公园的必经之路。此路在马鞍山段与马鞍山路交会。

4. **马鞍山绕道 (Ma On Shan Bypass)**：这是一条靠近海滨的快速连接路，连接马鞍山路与西沙路（近乌溪沙站），可避开马鞍山市中心（新港城一带）的繁忙路段，方便过境车辆快速通行。


## 二、区内主干道（连接各屋苑的核心道路）

马鞍山新市镇呈**南北狭长**的布局，主要住宅区分佈在马鞍山路两侧。区内道路分为两类：**与马鞍山路平行的南北向道路**和**连接屋苑与主幹道的横向支路**。

### 南北向平行道路

1. **恆明街 (Hang Ming Street)**：位於马鞍山路以东，貫穿恆安邨及耀安邨，是连接恆安站与马鞍山路的重要通道。

2. **恆康街 (Hang Hong Street)**：位於恆安邨南側，连接恆安站与西沙路。

3. **恆錦街 (Hang Kam Street)**：位於恆安邨内部，呈环状佈局。

4. **西沙路 (Sai Sha Road)**：马鞍山东侧的海滨路段，与马鞍山路平行，连接乌溪沙站、雅典居、海典湾等海滨屋苑。

### 横向连接道路

这些道路以「馬鞍山」为轴心，东西向连接马鞍山路与海滨：

- **恆德街 (Hang Tak Street)**：连接马鞍山路与恆安邨，富安花园亦在此区域。
- **恆泰路 (Hang Tai Road)**：恆安邨南侧的主要连接路。
- **寧泰路 (Ning Tai Road)**：连接马鞍山路与大水坑及锦泰苑一带。
- **沙安街 (Sha On Street)**：乌溪沙站附近的连接路，通往翠拥华庭。


## 三、主要屋苑及设施内部道路

马鞍山各大型屋苑均有其内部道路网络：

1. **新港城中心通道 (Sunshine City Access Road)**：新港城是马鞍山最大的购物中心及住宅群，其内部道路连接马鞍山路与西沙路，形成区内交通枢纽。

2. **乌溪沙路 (Wu Kai Sha Road)**：通往乌溪沙站及乌溪沙青年新村。

3. **落禾沙里 (Lok Wo Sha Lane)**：连接西沙路与落禾沙村一带。

4. **迎海路 (Double Cove Road)**：通往迎海大型屋苑的专用道路。


## 四、口述导览建议

> 「马鞍山的路网很简单，核心就是**马鞍山路**这一条南北大動脈——所有进出马鞍山的车都要走这条路。
>
> 马鞍山路**向南**接**大老山公路**，通往九龙东；**向北**在乌溪沙接**西沙路**，通往西贡；中间还有一条**马鞍山绕道**，在海边走，可以避开市中心塞车。
>
> 马鞍山的住宅分佈在马路**两边**——西边是恆安、耀安、马鞍山中心这些旧一点的屋苑，东边是靠着海的雅典居、海典湾、迎海这些新一点的海景楼。认路的话，搞清自己是在**路东还是路西**，方向就基本不会错。
>
> 大水坑、富安花园那一带算马鞍山的**南入口**，乌溪沙算**北尽头**。整个马鞍山就是从大水坑到乌溪沙这一条狭长的地带。」`,Pa=Object.assign({"../texts/九龙城":pa,"../texts/九龙湾":ha,"../texts/元朗":fa,"../texts/北区":ba,"../texts/啟德":xa,"../texts/大埔":ya,"../texts/将军澳":va,"../texts/屯门":wa,"../texts/新蒲岗":Sa,"../texts/沙田":_a,"../texts/油尖旺":Na,"../texts/深水埗":Ca,"../texts/红磡":ka,"../texts/荃湾.txt":Ta,"../texts/荃青.txt":Ra,"../texts/荔枝角":La,"../texts/观塘":Aa,"../texts/长沙湾":Oa,"../texts/青衣.txt":Ea,"../texts/马鞍山":Ia}),Da=()=>{var o,l;const e=d.useMemo(()=>Object.entries(Pa).map(([c,i])=>{const u=c.split("/").pop().replace(/\.[^/.]+$/,"");return{id:c,label:u,content:i}}),[]),[n,a]=d.useState((o=e[0])==null?void 0:o.id),r=(l=e.find(c=>c.id===n))==null?void 0:l.content;return e.length===0?s("div",{className:"p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200",children:["未在 ",t("code",{className:"px-1 py-0.5 bg-gray-100 rounded text-sm",children:"./text/"})," 目录中找到文件。"]}):s("div",{className:"max-w-4xl mx-auto my-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden",children:[t("div",{className:"flex border-b border-gray-200 bg-gray-50 overflow-x-auto scrollbar-none",children:e.map(c=>{const i=n===c.id;return t("button",{onClick:()=>a(c.id),className:`px-6 py-3 text-sm font-medium border-r border-gray-200 transition-colors whitespace-nowrap focus:outline-none
                ${i?"bg-white text-blue-600 border-b-2 border-b-blue-600 font-semibold":"text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`,children:c.label},c.id)})}),t("div",{className:"p-6 bg-white min-h-[300px]",children:t("pre",{className:"text-sm text-gray-800 font-mono whitespace-pre-wrap break-words leading-relaxed",children:r||"请选择一个文件进行查看"})})]})},Ma=Object.freeze(Object.defineProperty({__proto__:null,default:Da},Symbol.toStringTag,{value:"Module"})),ja=Object.freeze(Object.defineProperty({__proto__:null,default:Dt},Symbol.toStringTag,{value:"Module"})),rt=Object.assign({"/src/data/apps/hkele/links.json":Nn,"/src/data/apps/hkele/mock-test-configs.json":kn,"/src/data/apps/hktaxi/config.json":Rn,"/src/data/apps/hktaxi/links.json":An,"/src/data/apps/hktaxi/mock-test-configs.json":En,"/src/data/apps/location/config.json":Pn,"/src/data/apps/location/links.json":Mn,"/src/data/apps/location/mock-test-configs.json":$n}),st=Object.assign({"/src/data/apps/hkele/questions/a.json":()=>z(()=>import("./a-a8ae1c54.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/b.json":()=>z(()=>import("./b-ec98a30e.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/hkelement-data.json":()=>z(()=>import("./hkelement-data-62ef8037.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/小學二年級.json":()=>z(()=>import("./小學二年級-b57b4aa1.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/小學二年級2.json":()=>z(()=>import("./小學二年級2-ca1828b9.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/小學二年級3.json":()=>z(()=>import("./小學二年級3-5453bac3.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/幼兒園高班.json":()=>z(()=>import("./幼兒園高班-89091f9f.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/[乙部][道路使用者守則].json":()=>z(()=>import("./_乙部__道路使用者守則_-31b0a9db.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-[乙部][道路使用者守則]-test-data.json":()=>z(()=>import("./hk-taxi-_乙部__道路使用者守則_-test-data-04029491.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-[甲部][地方]-questions.json":()=>z(()=>import("./hk-taxi-_甲部__地方_-questions-2fb88e81.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-[甲部][的士則例]-question.json":()=>z(()=>import("./hk-taxi-_甲部__的士則例_-question-9cdeaa3b.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-[甲部][的士則例]-question2.json":()=>z(()=>import("./hk-taxi-_甲部__的士則例_-question2-7503acd2.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-[甲部][路線]-questions.json":()=>z(()=>import("./hk-taxi-_甲部__路線_-questions-5a7d0128.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions-penalty.json":()=>z(()=>import("./hk-taxi-area-questions-penalty-029f713c.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions-penalty2.json":()=>z(()=>import("./hk-taxi-area-questions-penalty2-4a56e7d1.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions-penalty3.json":()=>z(()=>import("./hk-taxi-area-questions-penalty3-38fc827a.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions-penalty4.json":()=>z(()=>import("./hk-taxi-area-questions-penalty4-cd590e8e.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions-penalty5.json":()=>z(()=>import("./hk-taxi-area-questions-penalty5-5b634b02.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions.json":()=>z(()=>import("./hk-taxi-area-questions-2fb88e81.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-extra-main-road.json":()=>z(()=>import("./hk-taxi-extra-main-road-72e6a2ce.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-extra-main-road2.json":()=>z(()=>import("./hk-taxi-extra-main-road2-f0165099.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-route-questions.json":()=>z(()=>import("./hk-taxi-route-questions-5a7d0128.js").then(e=>e._),[],import.meta.url),"/src/data/apps/location/questions/專用石油氣站.json":()=>z(()=>import("./專用石油氣站-3df0cd15.js"),[],import.meta.url),"/src/data/apps/location/questions/广场.json":()=>z(()=>import("./广场-1a921051.js"),[],import.meta.url),"/src/data/apps/location/questions/沙田/ 酒店_旅宿.json":()=>z(()=>import("./ 酒店_旅宿-37973800.js"),[],import.meta.url),"/src/data/apps/location/questions/沙田/屋邨_住宅.json":()=>z(()=>import("./屋邨_住宅-bc9463d5.js"),[],import.meta.url),"/src/data/apps/location/questions/荃灣區/屋邨_住宅.json":()=>z(()=>import("./屋邨_住宅-276f3886.js"),[],import.meta.url),"/src/data/apps/location/questions/荃灣區/酒店_地標.json":()=>z(()=>import("./酒店_地標-349ca276.js"),[],import.meta.url),"/src/data/apps/location/questions/酒店_旅宿.json":()=>z(()=>import("./酒店_旅宿-66f19778.js"),[],import.meta.url)}),ot=Object.assign({"/src/data/apps/hktaxi/components/AreasBy.jsx":qn,"/src/data/apps/hktaxi/components/Location.jsx":ga,"/src/data/apps/location/components/FileTabsViewer.jsx":Ma,"/src/data/apps/location/components/Location.jsx":ja}),$a=Object.assign({});async function Fa(e){var S,y,f;const n=((S=rt[`/src/data/apps/${e}/mock-test-configs.json`])==null?void 0:S.default)||{},a=((y=rt[`/src/data/apps/${e}/links.json`])==null?void 0:y.default)||[],r=((f=$a[`/src/data/apps/${e}/config.json`])==null?void 0:f.default)||[],o=`/src/data/apps/${e}/questions/`,c=Object.keys(st).filter(x=>x.startsWith(o)).map(async x=>{const b=await st[x](),D=[...(x.split("/").pop()||"").matchAll(/\[([^\]]+)\]/g)].map(j=>j[1]),R=b.default||b,E={};return D.length>0&&D[0].length>0&&(E.section=D[0]),D.length>1&&D[1].length>0&&(E.sectionName=D[1]),D.length>2&&D[2].length>0&&(E.category=D[2]),Array.isArray(R)?R.map(j=>({...j,...E})):[{...R,...E}]}),u=(await Promise.all(c)).flat().map((x,b)=>({...x,id:`${e}-m${b}-${x.id??b+1}`})),h=`/src/data/apps/${e}/components/`,N=[];Object.keys(ot).forEach(x=>{if(x.startsWith(h)){const b=x.split("/").pop().replace(".jsx","");N[b]=ot[x].default}});const w=u.reduce((x,b)=>(x[b.section]=x[b.section]||{data:[],name:b.sectionName,id:b.section,count:0},x[b.section].data.push(b),x[b.section].count++,x),{});return{questions:u,sections:Object.values(w),mockTestConfigs:n,links:a,components:N,siteConfig:r}}const za=()=>"http://localhost:3002/api",Ha=za();class Ua{constructor(){this.apiUrl=Ha,console.log(`QuestionService initialized with API URL: ${this.apiUrl}`)}async request(n,a={},r=0){const o=`${this.apiUrl}${n}`,c={...{headers:{"Content-Type":"application/json"}},...a};_e.start();try{const i=await fetch(o,c),u=await i.json();if(!i.ok)throw new Error(u.message||`HTTP ${i.status}`);return _e.end(`API request to ${n}`),u}catch(i){if(_e.end(`API request failed to ${n}`),i.name==="TypeError"&&r<3)return console.log(`Retrying request to ${n}, attempt ${r+1}`),await new Promise(u=>setTimeout(u,1e3*(r+1))),this.request(n,a,r+1);throw i}}async loadAppData(n,a=null){const r=await Fa(n);try{const o={};a&&(o.Authorization=`Bearer ${a}`);const l=await this.request(`/questions/${n}`,{method:"GET",headers:o});l&&l.questions&&l.questions.length>0&&(console.log(`Loaded ${l.questions.length} questions from database for appId: ${n}`),r.questions=l)}catch(o){console.error(`Failed to load questions for app ${n} from database:`,o)}return r}async loadQuestionsFromLocalFile(n){try{const a=await Sn(Object.assign({"../data/apps/hkele/index.js":()=>z(()=>import("./index-93b75521.js"),["./index-93b75521.js","./a-a8ae1c54.js","./b-ec98a30e.js","./hkelement-data-62ef8037.js","./小學二年級-b57b4aa1.js","./小學二年級2-ca1828b9.js","./小學二年級3-5453bac3.js","./幼兒園高班-89091f9f.js","./vendor-5459011e.js","./icons-464fafae.js","./maps-8801abd4.js","./utils-4ea7c3f0.js"],import.meta.url),"../data/apps/hktaxi/index.js":()=>z(()=>import("./index-f025467f.js"),["./index-f025467f.js","./_乙部__道路使用者守則_-31b0a9db.js","./hk-taxi-_乙部__道路使用者守則_-test-data-04029491.js","./hk-taxi-_甲部__地方_-questions-2fb88e81.js","./hk-taxi-_甲部__的士則例_-question-9cdeaa3b.js","./hk-taxi-_甲部__的士則例_-question2-7503acd2.js","./hk-taxi-_甲部__路線_-questions-5a7d0128.js","./hk-taxi-area-questions-penalty-029f713c.js","./hk-taxi-area-questions-penalty2-4a56e7d1.js","./hk-taxi-area-questions-penalty3-38fc827a.js","./hk-taxi-area-questions-penalty4-cd590e8e.js","./hk-taxi-area-questions-penalty5-5b634b02.js","./hk-taxi-area-questions-2fb88e81.js","./hk-taxi-extra-main-road-72e6a2ce.js","./hk-taxi-extra-main-road2-f0165099.js","./hk-taxi-route-questions-5a7d0128.js","./vendor-5459011e.js","./icons-464fafae.js","./maps-8801abd4.js","./utils-4ea7c3f0.js"],import.meta.url),"../data/apps/location/index.js":()=>z(()=>import("./index-d1843a2b.js"),["./index-d1843a2b.js","./vendor-5459011e.js","./icons-464fafae.js","./maps-8801abd4.js","./utils-4ea7c3f0.js"],import.meta.url)}),`../data/apps/${n}/index.js`);return{questions:a.hkTaxiQuestions||[],sections:a.sections||[],mockTestConfigs:a.mockTestConfigs||{},links:a.links||[],source:"local"}}catch(a){return console.error(`Failed to load questions for app ${n} from local file:`,a),{questions:[],sections:[],mockTestConfigs:{},links:[],source:"error"}}}async getAvailableApps(n=null){try{const a={};return n&&(a.Authorization=`Bearer ${n}`),await this.request("/questions/apps",{method:"GET",headers:a})}catch(a){return console.error("Failed to load available apps from database:",a),this.getAvailableAppsFromLocal()}}async getAvailableAppsFromLocal(){try{return{apps:[{id:"hkele",name:"香港的小學考試(練習)",description:"香港的小學考試(練習)"},{id:"hktaxi",name:"香港的士考試(備考)",description:"的士常識及地方試題備考"}],source:"local"}}catch(n){return console.error("Failed to load available apps from local:",n),{apps:[],source:"error"}}}async uploadQuestionsToDatabase(n,a,r,o,l,c){try{if(!c)throw new Error("Authentication required for upload");return await this.request(`/questions/${n}/upload`,{method:"POST",headers:{Authorization:`Bearer ${c}`},body:JSON.stringify({questions:a,sections:r,mockTestConfigs:o,links:l})})}catch(i){throw console.error(`Failed to upload questions for app ${n} to database:`,i),i}}async getUserProgress(n,a){try{return a?{...await this.request(`/questions/${n}/progress`,{method:"GET",headers:{Authorization:`Bearer ${a}`}}),source:"database"}:{progress:{},source:"local"}}catch(r){return console.error(`Failed to load progress for app ${n} from database:`,r),{progress:{},source:"error"}}}async syncUserProgress(n,a,r){try{return r?await this.request(`/questions/${n}/progress/sync`,{method:"POST",headers:{Authorization:`Bearer ${r}`},body:JSON.stringify(a)}):{success:!1,message:"Authentication required for sync"}}catch(o){throw console.error(`Failed to sync progress for app ${n} to database:`,o),o}}}const Pe=new Ua,lt=()=>({count:0,lastAnswered:null,completed:!1}),Wa=(e,n,a)=>{const r=(e==null?void 0:e.completed)||!1,o=n>=a;return r!==o||(e==null?void 0:e.count)!==n},Fe=mn(wn((e,n)=>({updateTime:0,questions:[],sections:[],mockTestConfigs:{},config:{siteName:"香港的士考試練習APP",siteDescription:"按甲、乙部分類練習，助您順利通過的士考試"},questionCounters:{},targetCount:3,statistics:{totalAnswered:0,correctAnswers:0,lastPractice:null},wrongAnswers:[],settings:{autoNextEnabled:!1,randomizeOptions:!1,showExplanation:!0,enableGoogleSearch:!0},initializeCounters:()=>{const{questions:a,questionCounters:r}=n();let o=!1;const l={...r};return a.forEach(c=>{l[c.id]||(l[c.id]=lt(),o=!0)}),o&&e({questionCounters:l}),l},updateQuestionCount:async(a,r)=>{var S;const{questionCounters:o,targetCount:l,statistics:c}=n(),i=o[a],u=r?((i==null?void 0:i.count)||0)+1:Math.max(0,((i==null?void 0:i.count)||0)-1);if(!Wa(i,u,l)&&c.totalAnswered===n().statistics.totalAnswered)return;const h={...o};h[a]||(h[a]=lt()),h[a].count=u,h[a].lastAnswered=new Date().toISOString(),h[a].completed=u>=l;const N={totalAnswered:c.totalAnswered+1,correctAnswers:c.correctAnswers+(r?1:0),lastPractice:new Date().toISOString()},w=[...n().wrongAnswers];if(!r)w.includes(a)||w.push(a);else{const y=w.indexOf(a);y>-1&&w.splice(y,1)}e({questionCounters:h,statistics:N,wrongAnswers:w});try{const{currentSite:y,sitesConfig:f}=n(),x=localStorage.getItem("token");if(x&&y&&((S=f[y])!=null&&S.dataPath)){const b=f[y].dataPath,L={[a]:{count:u,completed:u>=l,lastAnswered:new Date().toISOString()}};Pe.syncUserProgress(b,L,x).then(D=>{D.success?console.log(`Progress synced to database for question ${a}`):console.warn(`Failed to sync progress for question ${a}:`,D.message)}).catch(D=>{console.error(`Error syncing progress for question ${a}:`,D)})}}catch(y){console.error("Error in database sync after updateQuestionCount:",y)}},getQuestionCount:a=>{const{questionCounters:r}=n();return r[a]||{count:0,completed:!1}},getIncompleteQuestions:()=>{const{questions:a,questionCounters:r}=n();return a.filter(o=>{var l;return!((l=r[o.id])!=null&&l.completed)})},getCompletedQuestions:()=>{const{questions:a,questionCounters:r}=n();return a.filter(o=>{var l;return(l=r[o.id])==null?void 0:l.completed})},getRandomIncompleteQuestion:()=>{const a=n().getIncompleteQuestions();if(a.length===0)return null;const r=Math.floor(Math.random()*a.length);return a[r]},isAllCompleted:()=>n().getIncompleteQuestions().length===0,isAllCompletedForQuestions:(a=hkTaxiQuestions)=>{const{questionCounters:r}=n();return a.every(o=>{var l;return(l=r[o.id])==null?void 0:l.completed})},getProgressStats:(a=null)=>{const{questions:r,questionCounters:o}=n(),l=a||r,c=l.length,i=l.filter(h=>{var N;return(N=o[h.id])==null?void 0:N.completed}).length,u=c>0?Math.round(i/c*100):0;return{total:c,completed:i,percentage:u,incomplete:c-i}},getProgressBySection:()=>{const{sections:a,questions:r,questionCounters:o}=n(),l={};return a.forEach(c=>{const i=r.filter(u=>u.section===c.id);l[c.id]={name:c.name,total:i.length,completed:i.filter(u=>{var h;return(h=o[u.id])==null?void 0:h.completed}).length,percentage:0},l[c.id].total>0&&(l[c.id].percentage=Math.round(l[c.id].completed/l[c.id].total*100))}),l},getProgressByCategory:()=>{const{questions:a,questionCounters:r}=n(),o={};return a.forEach(l=>{o[l.category]||(o[l.category]={total:0,completed:0,questions:[]}),o[l.category].total++;const c=n().getQuestionCount(l.id);c.completed&&o[l.category].completed++,o[l.category].questions.push({...l,counter:c})}),o},getAllQuestionCounts:()=>{const{questions:a,questionCounters:r}=n(),o={};return a.forEach(l=>{o[l.id]={...l,counter:n().getQuestionCount(l.id)}}),o},resetCounters:()=>{const{questions:a}=n(),r={};return a.forEach(o=>{r[o.id]={count:0,lastAnswered:null,completed:!1}}),e({questionCounters:r,statistics:{totalAnswered:0,correctAnswers:0,lastPractice:null},wrongAnswers:[]}),r},resetCountersForQuestions:a=>{const{questionCounters:r}=n(),o={...r};return a.forEach(l=>{o[l]&&(o[l]={count:0,lastAnswered:null,completed:!1})}),e({questionCounters:o}),o},resetQuestionCounter:a=>{const{questionCounters:r}=n(),o={...r};return o[a]&&(o[a]={count:0,lastAnswered:null,completed:!1}),e({questionCounters:o}),o[a]},resetCompletion:a=>{const{questionCounters:r}=n(),o={...r};return o[a]&&(o[a].completed=!1),e({questionCounters:o}),o[a]},setTargetCount:a=>{const{questionCounters:r}=n(),o={...r};Object.keys(o).forEach(l=>{const c=o[l];c.completed=c.count>=a}),e({questionCounters:o,targetCount:a})},updateSettings:a=>{e({settings:{...n().settings,...a}})},clearWrongAnswers:()=>{e({wrongAnswers:[]})},setConfig:a=>{e({config:a})},setSections:a=>{e({sections:a})},setQuestions:a=>{e({questions:a})},currentSite:null,sitesConfig:{hkele:{siteName:"香港的小學考試(練習)",siteDescription:"香港的小學考試(練習)",logo:"/logo.png",dataPath:"hkele"},hktaxi:{siteName:"香港的士考試(備考)",siteDescription:"的士常識及地方試題備考",logo:"/logo.png",dataPath:"hktaxi"},site:{siteName:"地點",siteDescription:"地點",logo:"/logo.png",dataPath:"location"}},links:{},components:{},setLinks:a=>{e({links:a})},setCurrentSite:a=>{e({currentSite:a})},searchParams:new URLSearchParams,currentView:"home",setSearchParams:a=>{e({searchParams:new URLSearchParams(a)})},setCurrentView:a=>{e({currentView:a})},setSitesConfig:a=>{e({sitesConfig:a})},getCurrentSiteConfig:()=>{const{currentSite:a,sitesConfig:r}=n();return(r==null?void 0:r[a])||null},loadSiteData:async a=>{var o;const{sitesConfig:r}=n();if(!r||!((o=r[a])!=null&&o.dataPath))return null;_e.start();try{const l=localStorage.getItem("token"),c=r[a].dataPath;console.log(`Loading data for appId: ${c} from database`);const i=await Pe.loadAppData(c,l);console.log("dbData",i);const u=i;if(console.log(`Loaded ${u.questions.length} questions from ${u.source} for appId: ${c}`),e({mockTestConfigs:u.mockTestConfigs}),e({links:u.links}),e({components:u.components}),l)try{const h=await Pe.getUserProgress(c,l);if(h&&h.progress){const{questionCounters:N}=n(),w={...N};Object.entries(h.progress).forEach(([S,y])=>{w[S]={count:y.count||0,lastAnswered:y.lastAnswered||null,completed:y.completed||!1}}),e({questionCounters:w}),console.log(`Loaded progress for ${Object.keys(h.progress).length} questions from database`)}}catch(h){console.error(`Failed to load progress from database for appId: ${c}`,h)}return e({updateTime:new Date().getTime()}),_e.end(`Site data loaded for ${a} from ${u.source}`),u}catch(l){return console.error(`Failed to load data for site ${a}:`,l),_e.end(`Site data load failed for ${a}`),null}},getComponentMenuItems:()=>{const{components:a,currentSite:r}=n();return Object.keys(a).length===0?[]:Object.entries(a).map(([l,c])=>{const i=l.split("/").pop().replace(".jsx","");return{id:`component-${i.toLowerCase()}`,label:i,description:"動態組件",component:c.default||c,type:"component"}})},updateViewState:(a,r,o)=>{const l=new URLSearchParams(o);l.set("view",a),r(l)},syncProgressToDatabase:async()=>{var a;try{const{currentSite:r,sitesConfig:o,questionCounters:l}=n(),c=localStorage.getItem("token");if(!c)return console.log("No authentication token found, skipping database sync"),{success:!1,message:"未登錄，跳過數據庫同步"};if(!r||!((a=o[r])!=null&&a.dataPath))return console.log("No current site or dataPath found, skipping database sync"),{success:!1,message:"未找到當前站點配置，跳過數據庫同步"};const i=o[r].dataPath;console.log(`Syncing progress to database for appId: ${i}`);const u={};Object.entries(l).forEach(([N,w])=>{u[N]={count:w.count||0,completed:w.completed||!1,lastAnswered:w.lastAnswered||null}});const h=await Pe.syncUserProgress(i,u,c);return console.log("Progress sync result:",h),h}catch(r){return console.error("Failed to sync progress to database:",r),{success:!1,message:"同步失敗",error:r.message}}},startAutoSyncProgress:(a=3e4)=>{const r=setInterval(()=>{const{syncProgressToDatabase:o}=n();o()},a);return n().syncProgressToDatabase(),()=>clearInterval(r)},updateQuestionCountWithSync:async(a,r)=>{const{updateQuestionCount:o,syncProgressToDatabase:l}=n();await o(a,r);try{await l()}catch(c){console.error("Auto-sync failed after updating question count:",c)}},getMockTestConfigs:()=>{const{mockTestConfigs:a}=n();return a||{}},setMockTestConfigs:a=>{e({mockTestConfigs:a})}}),{name:"exam-app-storage",partialize:e=>({questionCounters:e.questionCounters,statistics:e.statistics,wrongAnswers:e.wrongAnswers,settings:e.settings,targetCount:e.targetCount})})),qa=({practiceSettings:e,onUpdateSetting:n,onResetPractice:a,onToggleSettings:r,mode:o="practice"})=>e?s("div",{className:"flex flex-wrap gap-2 justify-end",children:[s("div",{className:"flex gap-2",children:[s("button",{onClick:()=>n("randomizeOptions",!e.randomizeOptions),className:`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${e.randomizeOptions?"bg-indigo-500 text-white hover:bg-indigo-600":"bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"}`,children:[t(We,{size:14,className:"mr-1"}),e.randomizeOptions?"選項隨機":"選項順序"]}),s("button",{onClick:()=>n("autoNextEnabled",!e.autoNextEnabled),className:`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${e.autoNextEnabled?"bg-purple-500 text-white hover:bg-purple-600":"bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"}`,children:[t(on,{size:14,className:"mr-1"}),e.autoNextEnabled?"自動下一題":"手動操作"]}),s("button",{onClick:()=>n("enableRandom",!e.enableRandom),className:`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${e.enableRandom?"bg-blue-500 text-white hover:bg-blue-600":"bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"}`,children:[t(We,{size:14,className:"mr-1"}),e.enableRandom?"隨機排序":"順序練習"]})]}),s("div",{className:"flex gap-2",children:[o==="practice"&&s("button",{onClick:a,className:"flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm border border-blue-600",children:[t(ut,{size:14,className:"mr-1"}),"重新開始"]}),s("button",{onClick:r,className:"flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm border border-green-600",children:[t(dt,{size:14,className:"mr-1"}),"學習設置"]})]})]}):null,ne={defaultSettings:{randomizeOptions:!0,autoNextEnabled:!0,enableRandom:!0,targetCount:1,enableGoogleSearch:!0,defaultFromLocationType:"random",specificDefaultLocation:""},getSettings:()=>{try{const e=localStorage.getItem("taxiPracticeSettings");if(e){const n=JSON.parse(e);return{...ne.defaultSettings,...n}}}catch(e){console.error("获取设置失败:",e)}return{...ne.defaultSettings}},saveSettings:e=>{try{const a={...ne.getSettings(),...e};return localStorage.setItem("taxiPracticeSettings",JSON.stringify(a)),a}catch(n){return console.error("保存设置失败:",n),ne.getSettings()}},updateSetting:(e,n)=>{try{const r={...ne.getSettings(),[e]:n};return localStorage.setItem("taxiPracticeSettings",JSON.stringify(r)),r}catch(a){return console.error("更新设置失败:",a),ne.getSettings()}},resetSettings:()=>{try{return localStorage.setItem("taxiPracticeSettings",JSON.stringify(ne.defaultSettings)),{...ne.defaultSettings}}catch(e){return console.error("重置设置失败:",e),ne.getSettings()}},listeners:new Set,addListener:e=>{ne.listeners.add(e)},removeListener:e=>{ne.listeners.delete(e)},notifyListeners:e=>{ne.listeners.forEach(n=>{typeof n=="function"&&n(e)})}};typeof window<"u"&&window.addEventListener("storage",e=>{if(e.key==="taxiPracticeSettings")try{const n=e.newValue?JSON.parse(e.newValue):ne.defaultSettings;ne.notifyListeners(n)}catch(n){console.error("处理存储事件失败:",n)}});const Ga=({practiceSettings:e,targetCount:n,questionCounter:a,progressStats:r,wrongQuestions:o=[],onUpdateSetting:l,onUpdateTargetCount:c,onResetQuestionCounters:i,mode:u="practice"})=>s("div",{className:"space-y-6",children:[s("div",{children:[t("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"選項隨機化"}),s("div",{className:"flex items-center gap-4",children:[t("button",{onClick:()=>l("randomizeOptions",!0),className:`px-4 py-2 rounded-lg text-sm ${e.randomizeOptions?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"開啟隨機"}),t("button",{onClick:()=>l("randomizeOptions",!1),className:`px-4 py-2 rounded-lg text-sm ${e.randomizeOptions?"bg-gray-200 text-gray-700 hover:bg-gray-300":"bg-blue-500 text-white"}`,children:"固定順序"})]}),t("p",{className:"text-xs text-gray-500 mt-1",children:"開啟後題目選項將隨機排序，避免記憶答案位置"})]}),s("div",{children:[t("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"自動下一題"}),s("div",{className:"flex items-center gap-4",children:[t("button",{onClick:()=>l("autoNextEnabled",!0),className:`px-4 py-2 rounded-lg text-sm ${e.autoNextEnabled?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"開啟自動"}),t("button",{onClick:()=>l("autoNextEnabled",!1),className:`px-4 py-2 rounded-lg text-sm ${e.autoNextEnabled?"bg-gray-200 text-gray-700 hover:bg-gray-300":"bg-blue-500 text-white"}`,children:"手動操作"})]}),t("p",{className:"text-xs text-gray-500 mt-1",children:"開啟後：答對1秒後自動下一題，答錯3秒後自動下一題"})]}),s("div",{children:[t("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"隨機排序"}),s("div",{className:"flex items-center gap-4",children:[t("button",{onClick:()=>l("enableRandom",!0),className:`px-4 py-2 rounded-lg text-sm ${e.enableRandom?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"開啟隨機"}),t("button",{onClick:()=>l("enableRandom",!1),className:`px-4 py-2 rounded-lg text-sm ${e.enableRandom?"bg-gray-200 text-gray-700 hover:bg-gray-300":"bg-blue-500 text-white"}`,children:"順序練習"})]}),t("p",{className:"text-xs text-gray-500 mt-1",children:"開啟後題目將隨機排序，避免記憶題目順序"})]}),s("div",{children:[s("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:["目標計數: ",n," 次"]}),t("div",{className:"flex gap-2",children:[1,2,3,5,10].map(h=>s("button",{onClick:()=>c(h),className:`px-3 py-1 rounded text-sm ${n===h?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:[h,"次"]},h))}),t("p",{className:"text-xs text-gray-500 mt-1",children:"答對+1，答錯-1，達到目標計數後問題不再出現"})]}),s("div",{children:[t("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Google搜索功能"}),s("div",{className:"flex items-center gap-4",children:[t("button",{onClick:()=>l("enableGoogleSearch",!0),className:`px-4 py-2 rounded-lg text-sm ${e.enableGoogleSearch?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"開啟搜索"}),t("button",{onClick:()=>l("enableGoogleSearch",!1),className:`px-4 py-2 rounded-lg text-sm ${e.enableGoogleSearch?"bg-gray-200 text-gray-700 hover:bg-gray-300":"bg-blue-500 text-white"}`,children:"關閉搜索"})]}),t("p",{className:"text-xs text-gray-500 mt-1",children:"開啟後可在問題卡片中點擊按鈕搜索相關問題答案"})]}),a&&s("div",{className:"space-y-3",children:[s("div",{children:[t("h5",{className:"text-sm font-medium text-gray-700 mb-1",children:u==="wrong"?"當前錯題進度":"當前學習進度"}),s("div",{className:"bg-gray-100 rounded p-2",children:[s("div",{className:"flex justify-between text-sm",children:[s("span",{children:["已完成: ",r.completed," 題"]}),s("span",{children:["未完成: ",r.incomplete," 題"]})]}),t("div",{className:"w-full bg-gray-300 rounded-full h-2 mt-1",children:t("div",{className:"bg-green-500 h-2 rounded-full transition-all duration-300",style:{width:`${r.percentage}%`}})}),s("div",{className:"text-xs text-gray-600 text-center mt-1",children:[r.percentage,"% 完成"]})]})]}),u==="wrong"&&o.length>0&&s("div",{children:[t("h5",{className:"text-sm font-medium text-gray-700 mb-1",children:"錯題統計"}),s("div",{className:"bg-gray-100 rounded p-2 text-sm",children:[s("div",{className:"flex justify-between",children:[s("span",{children:["錯題總數: ",o.length]}),s("span",{children:["已完成: ",o.filter(h=>h.completed).length]})]}),t("div",{className:"w-full bg-gray-300 rounded-full h-2 mt-1",children:t("div",{className:"bg-green-500 h-2 rounded-full transition-all duration-300",style:{width:`${o.length>0?o.filter(h=>h.completed).length/o.length*100:0}%`}})}),s("div",{className:"text-xs text-gray-600 text-center mt-1",children:[o.length>0?Math.round(o.filter(h=>h.completed).length/o.length*100):0,"% 完成"]})]})]}),s("div",{children:[t("button",{onClick:i,className:"px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm",children:"重置所有問題計數"}),t("p",{className:"text-xs text-gray-500 mt-1",children:"清除所有問題的計數記錄，重新開始"})]})]})]}),Qa=({showSettings:e,setShowSettings:n,practiceSettings:a,targetCount:r,questionCounter:o,progressStats:l,wrongQuestions:c=[],onUpdateSetting:i,onUpdateTargetCount:u,onResetQuestionCounters:h,mode:N="practice",title:w="設置",subtitle:S="管理學習和地點設置"})=>{const[y,f]=d.useState("study");return e?t("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",onClick:()=>n(!1),children:s("div",{className:"bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative",onClick:x=>x.stopPropagation(),children:[t("button",{onClick:()=>n(!1),className:"fixed top-6 right-6 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors z-10","aria-label":"關閉對話框",children:t("svg",{className:"w-5 h-5 text-gray-500",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})}),s("div",{className:"p-6 border-b border-gray-200",children:[t("h3",{className:"text-lg font-semibold text-gray-800",children:w}),t("p",{className:"text-sm text-gray-600 mt-1",children:S})]}),t("div",{className:"border-b border-gray-200",children:t("div",{className:"flex",children:t("button",{onClick:()=>f("study"),className:`flex-1 px-6 py-3 text-sm font-medium transition-colors ${y==="study"?"text-blue-600 border-b-2 border-blue-600":"text-gray-500 hover:text-gray-700"}`,children:"學習設置"})})}),t("div",{className:"p-6",children:y==="study"&&t(Ga,{practiceSettings:a,targetCount:r,questionCounter:o,progressStats:l,wrongQuestions:c,onUpdateSetting:i,onUpdateTargetCount:u,onResetQuestionCounters:h,mode:N})}),t("div",{className:"p-6 border-t border-gray-200 flex justify-end",children:t("button",{onClick:()=>n(!1),className:"px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors",children:"關閉"})})]})}):null},Ba=({showSettings:e,setShowSettings:n,practiceSettings:a,targetCount:r,questionCounter:o,progressStats:l,wrongQuestions:c=[],onUpdateSetting:i,onUpdateTargetCount:u,onResetQuestionCounters:h,mode:N="practice",title:w="設置",subtitle:S="管理學習和地點設置"})=>t(Qa,{showSettings:e,setShowSettings:n,practiceSettings:a,targetCount:r,questionCounter:o,progressStats:l,wrongQuestions:c,onUpdateSetting:i,onUpdateTargetCount:u,onResetQuestionCounters:h,mode:N,title:w,subtitle:S}),ae={getWrongAnswers:()=>{try{const e=localStorage.getItem("hkTaxiWrongAnswers");return e?JSON.parse(e):[]}catch{return[]}},getAnsweredQuestions:()=>{try{const e=localStorage.getItem("hkTaxiAnsweredQuestions");return e?JSON.parse(e):{}}catch{return{}}},getAllQuestionsCount(){},recordAnsweredQuestion:(e,n)=>{var a,r,o,l;try{const c=ae.getAnsweredQuestions();c[e]={answered:!0,isCorrect:n,lastAnswered:new Date().toISOString(),correctCount:n?(((a=c[e])==null?void 0:a.correctCount)||0)+1:((r=c[e])==null?void 0:r.correctCount)||0,wrongCount:n?((l=c[e])==null?void 0:l.wrongCount)||0:(((o=c[e])==null?void 0:o.wrongCount)||0)+1},localStorage.setItem("hkTaxiAnsweredQuestions",JSON.stringify(c))}catch(c){console.error("记录答题失败:",c)}},getQuestionStrategy:()=>{try{return localStorage.getItem("hkTaxiQuestionStrategy")||"random"}catch{return"random"}},saveQuestionStrategy:e=>{try{localStorage.setItem("hkTaxiQuestionStrategy",e)}catch(n){console.error("保存出题策略失败:",n)}},getWrongAnswerCounts:()=>{try{const e=localStorage.getItem("hkTaxiWrongAnswerCounts");return e?JSON.parse(e):{}}catch{return{}}},saveWrongAnswer:e=>{try{const n=ae.getWrongAnswers();n.includes(e)||(n.push(e),localStorage.setItem("hkTaxiWrongAnswers",JSON.stringify(n)));const a=ae.getWrongAnswerCounts();a[e]=(a[e]||0)+1,localStorage.setItem("hkTaxiWrongAnswerCounts",JSON.stringify(a))}catch(n){console.error("保存错题失败:",n)}},removeWrongAnswer:e=>{try{const a=ae.getWrongAnswers().filter(o=>o!==e);localStorage.setItem("hkTaxiWrongAnswers",JSON.stringify(a));const r=ae.getWrongAnswerCounts();delete r[e],localStorage.setItem("hkTaxiWrongAnswerCounts",JSON.stringify(r))}catch(n){console.error("移除错题失败:",n)}},getStatistics:()=>{try{const e=localStorage.getItem("hkTaxiStatistics");return e?JSON.parse(e):{totalAnswered:0,correctAnswers:0,wrongAnswers:0,lastPractice:null}}catch{return{totalAnswered:0,correctAnswers:0,wrongAnswers:0,lastPractice:null}}},updateStatistics:e=>{try{const n=ae.getStatistics();n.totalAnswered++,e?n.correctAnswers++:n.wrongAnswers++,n.lastPractice=new Date().toISOString(),localStorage.setItem("hkTaxiStatistics",JSON.stringify(n))}catch(n){console.error("更新统计失败:",n)}},resetStatistics:()=>{try{const e={totalAnswered:0,correctAnswers:0,wrongAnswers:0,lastPractice:null};localStorage.setItem("hkTaxiStatistics",JSON.stringify(e))}catch(e){console.error("重置统计失败:",e)}},resetAllData:()=>{try{localStorage.removeItem("hkTaxiWrongAnswers"),localStorage.removeItem("hkTaxiWrongAnswerCounts"),ae.resetStatistics(),localStorage.removeItem("taxiTargetCount"),console.log("所有数据已重置")}catch(e){console.error("重置所有数据失败:",e)}},resetWrongAnswers:()=>{try{localStorage.removeItem("hkTaxiWrongAnswers"),localStorage.removeItem("hkTaxiWrongAnswerCounts")}catch(e){console.error("重置错题记录失败:",e)}},resetWrongAnswerCount:e=>{try{const n=ae.getWrongAnswerCounts();n[e]&&(n[e]=0,localStorage.setItem("hkTaxiWrongAnswerCounts",JSON.stringify(n)))}catch(n){console.error("重置错误次数失败:",n)}},saveMockTestRecords:e=>{try{localStorage.setItem("hkTaxiMockTestRecords",JSON.stringify(e))}catch(n){console.error("保存模擬測試記錄失敗:",n)}},getMockTestRecords:()=>{try{const e=localStorage.getItem("hkTaxiMockTestRecords");if(e)return JSON.parse(e)}catch(e){console.error("獲取模擬測試記錄失敗:",e)}return[]},clearMockTestRecords:()=>{try{localStorage.removeItem("hkTaxiMockTestRecords"),localStorage.removeItem("hkTaxiAnsweredQuestions"),localStorage.removeItem("hkTaxiWrongAnswers"),localStorage.removeItem("hkTaxiWrongAnswerCounts")}catch(e){console.error("清除模擬測試記錄失敗:",e)}},saveCategoryFilter:(e,n,a)=>{try{const r={mode:e,section:n,category:a,timestamp:Date.now()};localStorage.setItem("hkTaxiCategoryFilter",JSON.stringify(r))}catch(r){console.error("保存类别过滤状态失败:",r)}},getCategoryFilter:()=>{try{const e=localStorage.getItem("hkTaxiCategoryFilter");if(e){const n=JSON.parse(e);if(Date.now()-n.timestamp<24*60*60*1e3)return n}}catch(e){console.error("获取类别过滤状态失败:",e)}return null},clearCategoryFilter:()=>{try{localStorage.removeItem("hkTaxiCategoryFilter")}catch(e){console.error("清除类别过滤状态失败:",e)}}},Ya=({showCompletion:e,completionTime:n,onResetPractice:a,onReviewWrongAnswers:r})=>e?t("div",{className:"mt-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-6 text-white shadow-lg",children:s("div",{className:"text-center",children:[t("div",{className:"animate-bounce mb-4",children:t("svg",{className:"w-16 h-16 mx-auto",fill:"currentColor",viewBox:"0 0 24 24",children:t("path",{d:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"})})}),t("h3",{className:"text-2xl font-bold mb-2",children:"🎉 恭喜！所有题目已完成 🎉"}),t("p",{className:"text-lg mb-4",children:"您已经成功掌握所有题目知识！"}),t("div",{className:"bg-white bg-opacity-20 rounded-lg p-4 mb-4",children:s("div",{className:"grid grid-cols-2 gap-4 text-sm",children:[s("div",{children:[t("span",{className:"font-semibold",children:"完成时间:"}),t("br",{}),(n==null?void 0:n.toLocaleTimeString("zh-HK"))||"刚刚"]}),s("div",{children:[t("span",{className:"font-semibold",children:"正确率:"}),t("br",{}),ae.getStatistics().total>0?Math.round(ae.getStatistics().correct/ae.getStatistics().total*100)+"%":"100%"]}),s("div",{children:[t("span",{className:"font-semibold",children:"总答题数:"}),t("br",{}),ae.getStatistics().total||0]}),s("div",{children:[t("span",{className:"font-semibold",children:"正确题数:"}),t("br",{}),ae.getStatistics().correct||0]})]})}),s("div",{className:"space-y-3 text-sm",children:[t("p",{className:"font-medium",children:"🎯 下一步建议："}),s("ul",{className:"space-y-1",children:[t("li",{children:"• 复习错题本加强薄弱环节"}),t("li",{children:"• 挑战更高难度的随机测试"}),t("li",{children:"• 分享您的学习成果"})]})]}),s("div",{className:"flex justify-center gap-3 mt-6",children:[t("button",{onClick:a,className:"px-6 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold shadow-md",children:"🔄 重新开始"}),t("button",{onClick:r,className:"px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold shadow-md",children:"📚 复习错题"})]})]})}):null,Ka=({showTooltip:e,setShowTooltip:n,tooltipType:a,getQuestionCount:r,targetCount:o})=>e?t("div",{className:"fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40 p-4",onClick:()=>n(!1),children:s("div",{className:"bg-white rounded-lg p-6 max-w-md w-full shadow-xl relative",onClick:l=>l.stopPropagation(),children:[t("button",{onClick:()=>n(!1),className:"fixed top-6 right-6 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors z-10","aria-label":"关闭对话框",children:t("svg",{className:"w-5 h-5 text-gray-500",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})}),s("div",{className:"flex items-center mb-4",children:[t(qe,{className:"text-blue-500 mr-3",size:24}),t("h3",{className:"text-lg font-semibold text-gray-800",children:"进度说明"})]}),s("div",{className:"space-y-3 text-sm text-gray-600",children:[a==="progress"&&s("div",{children:[t("p",{className:"font-medium text-blue-800 mb-2",children:"进度说明"}),r?s(ce,{children:[t("p",{children:"• 显示已完成问题数量/总问题数量"}),s("p",{children:["• 每个问题需要答对",o,"次才算完成"]}),t("p",{children:"• 答对+1，答错-1，达到目标计数后问题不再出现"})]}):s(ce,{children:[t("p",{children:"• 显示当前题号/总题数"}),t("p",{children:"• 按顺序练习所有题目"}),t("p",{children:"• 适合初次学习和全面复习"})]})]}),a==="mode"&&s("div",{children:[t("p",{className:"font-medium text-blue-800 mb-2",children:"模式说明"}),r?s(ce,{children:[s("p",{children:[t("strong",{children:"学习模式："}),"每个问题需要答对",o,"次才算完成"]}),t("p",{children:"• 答对+1，答错-1，达到目标计数后问题不再出现"}),t("p",{children:"• 所有问题完成后会自动重置重新开始"}),t("p",{children:"• 适合强化记忆和重点突破"})]}):s(ce,{children:[s("p",{children:[t("strong",{children:"练习模式："}),"按顺序练习所有题目"]}),t("p",{children:"• 答错题目会自动加入错题本"}),t("p",{children:"• 适合初次学习和全面复习"}),t("p",{children:"• 可以随时切换为学习模式"})]})]})]}),t("div",{className:"flex justify-end mt-4",children:t("button",{onClick:()=>n(!1),className:"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm",children:"知道了"})})]})}):null,Va=({mode:e="all",section:n=null,sections:a=[],getQuestionCount:r=!1,targetCount:o=3})=>s("div",{className:"mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4",children:[t("h4",{className:"font-semibold text-blue-800 mb-2",children:"练习模式说明"}),s("ul",{className:"text-blue-700 text-sm space-y-1",children:[s("li",{children:["• ",(()=>{var c;switch(e){case"wrong":return"专注于答错的题目，加强薄弱环节";case"section":return`系统学习${((c=a.find(u=>u.id===n))==null?void 0:c.name)||n}章节的所有题目，全面掌握知识`;default:return"系统学习所有题目，全面掌握知识"}})()]}),t("li",{children:"• 答错题目会自动加入错题本，方便后续针对性练习"}),t("li",{children:"• 开启随机排序可以打乱题目顺序，避免记忆顺序"}),r?s(ce,{children:[t("li",{children:"• 每个问题都有独立的计数属性（答对+1，答错-1）"}),s("li",{children:["• 达到目标计数（",o,"次）的问题不再出现在练习中"]}),t("li",{children:"• 未完成的问题会继续出现，直到达到目标计数"}),t("li",{children:"• 所有问题都完成后可以手动重置重新开始"})]}):s(ce,{children:[t("li",{children:"• 按顺序练习所有题目，系统学习知识"}),t("li",{children:"• 完成所有题目后可以重新开始练习"})]})]})]}),Ja=d.lazy(()=>z(()=>import("./QuestionCardWithRecording-610753ca.js"),["./QuestionCardWithRecording-610753ca.js","./vendor-5459011e.js","./QuestionCard-291a3a80.js","./maps-8801abd4.js","./icons-464fafae.js","./utils-4ea7c3f0.js","./index-4e039fa8.js","./index-2cfe82b8.css"],import.meta.url)),Ue={QUESTION_ORDER:"questionOrder",CATEGORY_FILTER:"categoryFilter"},Xa=5*60*1e3,Za=({mode:e="all",section:n=null,showExplanation:a=!0})=>{var re,ke;const[r,o]=Mt(),[l,c]=d.useState([]),[i,u]=d.useState(0),[h,N]=d.useState(0),[w,S]=d.useState(!1),[y,f]=d.useState(new Set),[x,b]=d.useState(!1),[L,D]=d.useState({total:0,completed:0,percentage:0,incomplete:0}),[R,E]=d.useState(null),[j,V]=d.useState([]),[Q,W]=d.useState(!1),[le,X]=d.useState(!1),[me,B]=d.useState(""),[H,ee]=d.useState(null),[I,k]=d.useState(!1),[Y,te]=d.useState(null),[q,pe]=d.useState(r.get("category")||""),[se,de]=d.useState(!1),{questions:J,sections:g,wrongAnswers:m,settings:v,targetCount:$,updateQuestionCount:U,getQuestionCount:P,getProgressStats:ye,resetCountersForQuestions:Ne,setTargetCount:Te,updateSettings:Re}=Fe(),Le=d.useRef(!0),fe=d.useCallback((_=i)=>{try{const A=new URLSearchParams(window.location.search),O=Object.fromEntries(A.entries());O.index=_.toString(),o(O,{replace:!0})}catch(A){console.error("Error saving state:",A)}},[i,o]),Ae=d.useCallback(_=>{try{_!=null&&_.length&&localStorage.setItem(Ue.QUESTION_ORDER,JSON.stringify({timestamp:Date.now(),questionOrder:_}))}catch(A){console.error("Error saving question order:",A)}},[]),ue=d.useCallback((_,A,O)=>{let M=[];switch(_){case"wrong":const oe=ae.getWrongAnswers();M=J.filter(xe=>oe.includes(xe.id));break;case"section":M=J.filter(xe=>xe.section===A);break;default:M=[...J]}return O&&(M=M.filter(oe=>oe.category===O)),M},[J]),be=d.useMemo(()=>{const _=new Map;let A=[];switch(e){case"wrong":A=J.filter(O=>m.includes(O.id));break;case"section":A=J.filter(O=>O.section===n);break;default:A=[...J]}return A.forEach(O=>{var M;(M=O.category)!=null&&M.trim()&&_.set(O.category,(_.get(O.category)||0)+1)}),Array.from(_.entries()).map(([O,M])=>({category:O,count:M})).sort((O,M)=>O.category.localeCompare(M.category))},[e,n,J,m]),he=d.useCallback((_=null)=>{const A=_||{getQuestionCount:P};let O=ue(e,n,q);if(R!=null&&R.enableRandom&&A.getQuestionCount){const M=O.filter(oe=>{var xe;return!((xe=A.getQuestionCount(oe.id))!=null&&xe.completed)});M.length>0&&(O=M)}if(j.length===O.length&&j.every(M=>O.some(oe=>oe.id===M))){const M=j.map(oe=>O.find(xe=>xe.id===oe)).filter(Boolean);M.length===O.length&&(O=M)}else if(R!=null&&R.enableRandom){O=[...O].sort(()=>Math.random()-.5);const M=O.map(oe=>oe.id);V(M),Ae(M),S(!0)}else S(!1);if(c(O),f(new Set),A.getProgressStats){const M=A.getProgressStats(O);D(M)}return O},[e,n,q,J,R,j,Ae,P]),ve=d.useCallback(async _=>{if(!l[i])return;const A=l[i].id;if(ae.updateStatistics(_),P){await U(A,_);const O=ue(e,n,q),M=ye(O);D(M)}N(O=>O+1),_||ae.saveWrongAnswer(A),f(O=>new Set([...O,A]))},[i,l,e,n,q,U,P,ye,ue]),Ce=d.useCallback(()=>{if(l.length===0)return;let _;if(R!=null&&R.enableRandom&&P){const A=l.filter(O=>{var M;return!((M=P(O.id))!=null&&M.completed)});if(A.length>0){const O=A[Math.floor(Math.random()*A.length)];_=l.findIndex(M=>M.id===O.id)}else _=i<l.length-1?i+1:0}else _=i<l.length-1?i+1:0;u(_),fe(_)},[l,i,R,P,fe]),ze=d.useCallback(()=>{if(i>0){const _=i-1;u(_),fe(_)}},[i,fe]),Oe=d.useCallback(()=>{if(P){const _=ue(e,n,q).map(A=>A.id);Ne(_)}k(!1),ee(null),te(null),N(0),f(new Set),V([]),S(!1),he(),W(!1)},[e,n,q,P,Ne,ue,he]),Ee=d.useCallback((_,A)=>{const O=ne.updateSetting(_,A);Re({[_]:A}),E(O)},[Re]),p=d.useCallback(_=>{Te(_),ne.updateSetting("targetCount",_),P&&he()},[Te,P,he]),C=d.useCallback(()=>{try{const _=localStorage.getItem(Ue.QUESTION_ORDER);if(_){const A=JSON.parse(_);if(Date.now()-A.timestamp<Xa&&Array.isArray(A.questionOrder))return V(A.questionOrder),!0}}catch(_){console.error("Error restoring question order:",_)}return!1},[]),T=d.useCallback(_=>{pe(_),de(!1);const A=new URLSearchParams(r);_?A.set("category",_):A.delete("category"),A.set("index","0"),o(A,{replace:!0}),V([]),localStorage.removeItem(Ue.QUESTION_ORDER),u(0)},[r,o]);d.useEffect(()=>{if(Le.current){Le.current=!1;return}he(),u(0),fe(0)},[e,n,q]),d.useEffect(()=>{E(v)},[v]),d.useEffect(()=>{C()||he();const A=ue(e,n,q);A.every(M=>{var oe;return(oe=P(M.id))==null?void 0:oe.completed})&&A.length>0&&(k(!0),te(new Date))},[]),d.useEffect(()=>{if(!P||I||H!==null)return;if(ue(e,n,q).every(O=>{var M;return(M=P(O.id))==null?void 0:M.completed})&&L.percentage===100){ee(3),te(new Date);const O=setInterval(()=>{ee(M=>M<=1?(clearInterval(O),k(!0),null):M-1)},1e3);return()=>clearInterval(O)}},[L.percentage,I,H,P,e,n,q,ue]);const F=d.useMemo(()=>P?L.total>0?L.completed/L.total*100:0:l.length>0?(i+1)/l.length*100:0,[P,L,l.length,i]),K=l[i];return J.length===0?t("div",{className:"text-center py-12",children:s("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto",children:[t("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"}),t("h3",{className:"text-lg font-semibold text-blue-800 mb-2",children:"正在加载题目..."}),t("p",{className:"text-blue-700",children:"请稍候，正在准备学习内容"})]})}):s("div",{className:"max-w-4xl mx-auto",children:[s("div",{className:"bg-white rounded-lg shadow-sm p-4 mb-6",children:[s("div",{className:"flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:[t("div",{className:"flex-1 min-w-0",children:s("h2",{className:"text-xl font-bold text-gray-800 truncate",children:[e==="all"&&"全部题目练习",e==="wrong"&&"错题练习",e==="section"&&`${n} ${(re=g.find(_=>_.id===n))==null?void 0:re.name}练习`,(R==null?void 0:R.enableRandom)&&" (随机排序)",q&&` - ${q}`]})}),s("div",{className:"flex items-center gap-2",children:[t(qa,{practiceSettings:R,onUpdateSetting:Ee,onResetPractice:()=>W(!0),onToggleSettings:()=>b(!0),mode:"practice"}),be.length>0&&s("button",{onClick:()=>de(!se),className:`flex items-center px-3 py-2 rounded-lg transition-colors ${q?"bg-blue-500 text-white hover:bg-blue-600":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,title:"按类别过滤题目",children:[t(ct,{size:16,className:"mr-1"}),"过滤",q&&s("span",{className:"ml-1 bg-white bg-opacity-20 px-1 rounded text-xs",children:[q," (",((ke=be.find(_=>_.category===q))==null?void 0:ke.count)||0,")"]})]})]})]}),s("div",{className:"mt-3",children:[t("div",{className:"w-full bg-gray-200 rounded-full h-2 mb-2",children:t("div",{className:"bg-blue-500 h-2 rounded-full transition-all duration-300",style:{width:`${F}%`}})}),s("div",{className:"flex justify-between items-center text-sm text-gray-600",children:[s("div",{className:"flex items-center gap-1 cursor-help",onClick:()=>{X(!0),B("progress")},children:[t("span",{children:P?`进度: ${L.completed}/${L.total} 题 (${L.percentage}%)`:`进度: ${i+1}/${l.length} 题`}),s("span",{children:["已答: ",h," 题"]}),t(qe,{size:12,className:"text-blue-500"})]}),s("div",{className:"flex items-center gap-1 cursor-help",onClick:()=>{X(!0),B("mode")},children:[t("span",{children:P?`学习模式: 目标${$}次`:"练习模式: 顺序练习"}),t(qe,{size:12,className:"text-blue-500"})]})]})]})]}),se&&be.length>0&&s(ce,{children:[t("div",{className:"fixed inset-0 z-10",onClick:()=>de(!1)}),s("div",{className:"fixed lg:absolute top-20 lg:top-16 right-4 lg:right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-48",children:[s("div",{className:"flex justify-between items-center mb-3",children:[t("h3",{className:"font-semibold text-gray-800",children:"按类别过滤"}),t("button",{onClick:()=>de(!1),className:"text-gray-500 hover:text-gray-700",children:"×"})]}),s("div",{className:"flex flex-wrap gap-2 max-h-60 overflow-y-auto",children:[s("button",{onClick:()=>T(""),className:`text-left px-3 py-2 rounded transition-colors ${q===""?"bg-blue-100 text-blue-700":"hover:bg-gray-100"}`,children:["全部类别 (",be.reduce((_,{count:A})=>_+A,0),")"]}),be.map(({category:_,count:A})=>s("button",{onClick:()=>T(_),className:`text-left px-3 py-2 rounded transition-colors ${q===_?"bg-blue-100 text-blue-700":"hover:bg-gray-100"}`,children:[_," (",A,")"]},_))]})]})]}),K&&t(d.Suspense,{fallback:t("div",{className:"bg-white rounded-lg shadow-sm p-6 mb-6",children:s("div",{className:"animate-pulse",children:[t("div",{className:"h-4 bg-gray-200 rounded mb-4"}),t("div",{className:"h-8 bg-gray-200 rounded mb-4"}),s("div",{className:"space-y-2",children:[t("div",{className:"h-6 bg-gray-200 rounded"}),t("div",{className:"h-6 bg-gray-200 rounded"}),t("div",{className:"h-6 bg-gray-200 rounded"})]})]})}),children:t(Ja,{question:K,onAnswer:ve,showExplanation:a,autoNextEnabled:R==null?void 0:R.autoNextEnabled,onAutoNext:Ce,randomizeOptions:R==null?void 0:R.randomizeOptions,questionCounter:{getQuestionCount:P,updateQuestionCount:U},enableGoogleSearch:R==null?void 0:R.enableGoogleSearch,mode:e==="wrong"?"wrong-answers":e==="section"?"section-practice":"practice",section:e==="section"?n:null},K.id)}),l.length===0&&t("div",{className:"text-center py-12",children:s("div",{className:"bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto",children:[t("h3",{className:"text-lg font-semibold text-yellow-800 mb-2",children:e==="wrong"?"暂无错题记录":"暂无题目"}),t("p",{className:"text-yellow-700",children:e==="wrong"?"您还没有答错的题目，继续努力！":"当前模式下没有可用的题目"})]})}),s("div",{className:"flex justify-between items-center mt-6",children:[s("button",{onClick:ze,disabled:i===0,className:"flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors",children:[t(ln,{size:16,className:"mr-1"}),"上一题"]}),t("span",{className:"text-gray-600 text-sm font-medium",children:P?L.percentage===100?`✅ 已完成 (${L.completed}/${L.total})`:`第${i+1}题 | 剩${l.length-i-1}题 | 完成${L.completed}/${L.total}`:`第${i+1}题 | 剩${l.length-i-1}题`}),s("button",{onClick:Ce,disabled:l.length===0,className:"flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors",children:["下一题",t(cn,{size:16,className:"ml-1"})]})]}),t(Ba,{showSettings:x,setShowSettings:b,practiceSettings:R,targetCount:$,questionCounter:{getQuestionCount:P,getProgressStats:ye},progressStats:L,onUpdateSetting:Ee,onUpdateTargetCount:p,onResetQuestionCounters:()=>{const _=ue(e,n,q).map(A=>A.id);Ne(_),he()},mode:"practice",title:"学习设置",subtitle:"自定义您的学习体验"}),t(Ya,{showCompletion:I,completionTime:Y,onResetPractice:Oe,onReviewWrongAnswers:()=>window.location.href="/wrong"}),t(Va,{mode:e,section:n,sections:g,getQuestionCount:P,targetCount:$}),t(Ka,{showTooltip:le,setShowTooltip:X,tooltipType:me,getQuestionCount:P,targetCount:$}),Q&&t("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",onClick:()=>W(!1),children:s("div",{className:"bg-white rounded-lg p-6 max-w-md w-full shadow-xl relative",onClick:_=>_.stopPropagation(),children:[t("button",{onClick:()=>W(!1),className:"fixed top-6 right-6 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors z-10","aria-label":"关闭对话框",children:t("svg",{className:"w-5 h-5 text-gray-500",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})}),s("div",{className:"flex items-center mb-4",children:[t(dn,{className:"text-yellow-500 mr-3",size:24}),t("h3",{className:"text-lg font-semibold text-gray-800",children:"确认重新开始"})]}),t("p",{className:"text-gray-600 mb-6",children:"确定要重新开始吗？这将清除所有进度和计数，无法恢复。"}),s("div",{className:"flex justify-end gap-3",children:[t("button",{onClick:()=>W(!1),className:"px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors",children:"取消"}),t("button",{onClick:Oe,className:"px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors",children:"确定重新开始"})]})]})})]})},sr=Object.freeze(Object.defineProperty({__proto__:null,default:Za},Symbol.toStringTag,{value:"Module"}));export{ce as F,Qe as M,sr as P,qa as S,s as a,wn as b,Ba as c,ge as d,ne as e,_n as f,On as g,Hn as h,Ln as i,t as j,jn as k,rr as l,Cn as m,Dn as n,_e as p,ae as s,Fe as u};
