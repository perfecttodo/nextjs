var Qs=Object.defineProperty;var Ks=(e,t,r)=>t in e?Qs(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var we=(e,t,r)=>(Ks(e,typeof t!="symbol"?t+"":t,r),r);import{r as m,R as Js,_ as me,u as Xs}from"./vendor-5459011e.js";import{S as Dn,C as cr,a as Kt,V as Tn,P as Ur,b as Zs,X as Xt,c as Hr,d as ea,A as ta,e as na,H as ra,L as sa,f as aa,g as oa,B as la,h as ia,i as ca,j as ua,k as da,G as pa,T as ur,F as Br,l as ha,m as Wr,M as Rt,n as ma,D as ga,R as Gr,o as fa,p as ba,q as xa,r as Nn,s as qr,t as ya,u as wa,v as Sa,w as ka,x as _a,y as va,I as Cn,z as Ta,E as Na,J as Ca}from"./icons-879ffb6b.js";import{m as Ra}from"./maps-3d542140.js";import{c as Yr}from"./utils-4ea7c3f0.js";var Vr={exports:{}},rn={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Ea=m,Aa=Symbol.for("react.element"),La=Symbol.for("react.fragment"),Oa=Object.prototype.hasOwnProperty,Ia=Ea.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,Pa={key:!0,ref:!0,__self:!0,__source:!0};function Qr(e,t,r){var s,a={},l=null,c=null;r!==void 0&&(l=""+r),t.key!==void 0&&(l=""+t.key),t.ref!==void 0&&(c=t.ref);for(s in t)Oa.call(t,s)&&!Pa.hasOwnProperty(s)&&(a[s]=t[s]);if(e&&e.defaultProps)for(s in t=e.defaultProps,t)a[s]===void 0&&(a[s]=t[s]);return{$$typeof:Aa,type:e,key:l,ref:c,props:a,_owner:Ia.current}}rn.Fragment=La;rn.jsx=Qr;rn.jsxs=Qr;Vr.exports=rn;var Mn=Vr.exports;const qe=Mn.Fragment,o=Mn.jsx,d=Mn.jsxs;function Da(e,t){let r;try{r=e()}catch{return}return{getItem:a=>{var l;const c=i=>i===null?null:JSON.parse(i,t==null?void 0:t.reviver),u=(l=r.getItem(a))!=null?l:null;return u instanceof Promise?u.then(c):c(u)},setItem:(a,l)=>r.setItem(a,JSON.stringify(l,t==null?void 0:t.replacer)),removeItem:a=>r.removeItem(a)}}const Rn=e=>t=>{try{const r=e(t);return r instanceof Promise?r:{then(s){return Rn(s)(r)},catch(s){return this}}}catch(r){return{then(s){return this},catch(s){return Rn(s)(r)}}}},Ma=(e,t)=>(r,s,a)=>{let l={storage:Da(()=>window.localStorage),partialize:k=>k,version:0,merge:(k,I)=>({...I,...k}),...t},c=!1,u=0;const i=new Set,g=new Set;let f=l.storage;if(!f)return e((...k)=>{console.warn(`[zustand persist middleware] Unable to update item '${l.name}', the given storage is currently unavailable.`),r(...k)},s,a);const w=()=>{const k=l.partialize({...s()});return f.setItem(l.name,{state:k,version:l.version})},y=a.setState;a.setState=(k,I)=>(y(k,I),w());const T=e((...k)=>(r(...k),w()),s,a);a.getInitialState=()=>T;let h;const v=()=>{var k,I;if(!f)return;const U=++u;c=!1,i.forEach(z=>{var Q;return z((Q=s())!=null?Q:T)});const P=((I=l.onRehydrateStorage)==null?void 0:I.call(l,(k=s())!=null?k:T))||void 0;return Rn(f.getItem.bind(f))(l.name).then(z=>{if(z)if(typeof z.version=="number"&&z.version!==l.version){if(l.migrate){const Q=l.migrate(z.state,z.version);return Q instanceof Promise?Q.then(H=>[!0,H]):[!0,Q]}console.error("State loaded from storage couldn't be migrated since no migrate function was provided")}else return[!1,z.state];return[!1,void 0]}).then(z=>{var Q;if(U!==u)return;const[H,te]=z;if(h=l.merge(te,(Q=s())!=null?Q:T),r(h,!0),H)return w()}).then(()=>{U===u&&(P==null||P(s(),void 0),h=s(),c=!0,g.forEach(z=>z(h)))}).catch(z=>{U===u&&(P==null||P(void 0,z))})};return a.persist={setOptions:k=>{l={...l,...k},k.storage&&(f=k.storage)},clearStorage:()=>{f==null||f.removeItem(l.name)},getOptions:()=>l,rehydrate:()=>v(),hasHydrated:()=>c,onHydrate:k=>(i.add(k),()=>{i.delete(k)}),onFinishHydration:k=>(g.add(k),()=>{g.delete(k)})},l.skipHydration||v(),h||T},$a=Ma,rc=(e="img[data-src]")=>{const t=document.querySelectorAll(e),r=new IntersectionObserver((s,a)=>{s.forEach(l=>{if(l.isIntersecting){const c=l.target,u=c.getAttribute("data-src");u&&(c.src=u,c.removeAttribute("data-src"),a.unobserve(c))}})});t.forEach(s=>r.observe(s))},Et={startTime:null,start(){this.startTime=performance.now()},end(e="Operation"){if(this.startTime){const t=performance.now()-this.startTime;console.log(`${e} took ${t.toFixed(2)}ms`),this.startTime=null}},measure(e,t="Operation"){this.start(),e(),this.end(t)}},za=(e,t)=>{const r=e[t];return r?typeof r=="function"?r():Promise.resolve(r):new Promise((s,a)=>{(typeof queueMicrotask=="function"?queueMicrotask:setTimeout)(a.bind(null,new Error("Unknown variable dynamic import: "+t)))})},Kr={categoryName:"運輸署官方守則",items:[{name:"《道路使用者守則》",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index.html"},{name:"發出指令的交通標誌",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index/chapter_8_the_language_of_the_road/signs_giving_orders_/index.html"},{name:"〈的士運營小冊子〉",url:"https://www.td.gov.hk/filemanager/sc/publication/taxi%20operation%20booklet_sc_20260320_revised.pdf"}]},Jr={categoryName:"互動地圖工具",items:[{name:"地理資訊地圖 (2D)",url:"https://www.map.gov.hk/gm/"},{name:"地理資訊地圖 (3D)",url:"https://3d.map.gov.hk/?lookat=22.30282688529485%2C114.17584194395741&i=false&l=zh-CN"}]},Xr={categoryName:"其它備考法規",items:[{name:"違例定額罰款新規",url:"https://gia.info.gov.hk/general/202512/29/P2025122900290_526703_1_1766981772892.pdf"}]},Fa={official_guidelines:Kr,mapping_tools:Jr,regulations:Xr},ja=Object.freeze(Object.defineProperty({__proto__:null,default:Fa,mapping_tools:Jr,official_guidelines:Kr,regulations:Xr},Symbol.toStringTag,{value:"Module"})),Zr={name:"小學考試模擬測試",description:"小學考試模擬測試",sections:{"Section A":50},totalQuestions:50,timeLimit:30,passingScore:"答对40题或以上",sectionPassing:{"Section A":40},success:"http://localhost:5001/disable"},es={name:"小學考試(自動答題)",description:"小學考試模擬測試",sections:{},totalQuestions:20,timeLimit:30,passingScore:80,sectionPassing:{},say:"http://127.0.0.1:5001/say?",autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,autoAnswer:!0},Ua={primary:Zr,default:{name:"小學考試",description:"小學考試模擬測試",sections:{"Section C":5,"Section B":5,"Section A":5,"Section D":5},totalQuestions:20,timeLimit:30,passingScore:80,sectionPassing:{},success:"http://localhost:5001/disable",say:"http://127.0.0.1:5001/say?",autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,cooldown_minutes:60,daily_limit:2},小學二年級:{name:"小學二年級",description:"小學二年級模擬測試",sections:{小學二年級:20},totalQuestions:20,timeLimit:30,passingScore:80,sectionPassing:{},success:"http://localhost:5001/disable",say:"http://127.0.0.1:5001/say?",autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,cooldown_minutes:60,daily_limit:2},autoAnswer:es,幼兒園高班:{name:"幼兒園高班",description:"幼兒園高班",sections:{幼兒園高班:20},totalQuestions:20,timeLimit:30,passingScore:80,sectionPassing:{},success:"http://localhost:5001/disable",say:"http://127.0.0.1:5001/say?",autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,cooldown_minutes:60,daily_limit:2}},Ha=Object.freeze(Object.defineProperty({__proto__:null,autoAnswer:es,default:Ua,primary:Zr},Symbol.toStringTag,{value:"Module"})),ts="香港的士考試練習APP",ns="按甲、乙部分類練習，助您順利通過的士考試",Ba={siteName:ts,siteDescrition:ns},Wa=Object.freeze(Object.defineProperty({__proto__:null,default:Ba,siteDescrition:ns,siteName:ts},Symbol.toStringTag,{value:"Module"})),rs={categoryName:"運輸署官方守則",items:[{name:"《道路使用者守則》",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index.html"},{name:"發出指令的交通標誌",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index/chapter_8_the_language_of_the_road/signs_giving_orders_/index.html"},{name:"〈的士運營小冊子〉",url:"https://www.td.gov.hk/filemanager/sc/publication/taxi%20operation%20booklet_sc_20260320_revised.pdf"}]},ss={categoryName:"互動地圖工具",items:[{name:"地理資訊地圖 (2D)",url:"https://www.map.gov.hk/gm/"},{name:"地理資訊地圖 (3D)",url:"https://3d.map.gov.hk/?lookat=22.30282688529485%2C114.17584194395741&i=false&l=zh-CN"}]},as={categoryName:"其它備考法規",items:[{name:"違例定額罰款新規",url:"https://gia.info.gov.hk/general/202512/29/P2025122900290_526703_1_1766981772892.pdf"}]},Ga={official_guidelines:rs,mapping_tools:ss,regulations:as},qa=Object.freeze(Object.defineProperty({__proto__:null,default:Ga,mapping_tools:ss,official_guidelines:rs,regulations:as},Symbol.toStringTag,{value:"Module"})),os={name:"的士筆試模擬2",description:"考生須於指定時間內回答試卷內全部之試題，並於兩個部分均達到及格標準，其總成績才會被視為及格",sections:{甲部:30,"甲部-地方":9,"甲部-路線":1,乙部:35,处罚罚款:2},totalQuestions:77,timeLimit:45,passingScore:"甲部: 答对34题或以上; 乙部: 答对30题或以上",sectionPassing:{"甲部+甲部-地方+甲部-路線":34,乙部:30},success:"http://localhost:5001/disable",autoSay:!1,isPlayOptions:!1,enableSearch:!0},ls={name:"的士筆試模擬(自動)",description:"考生須於指定時間內回答試卷內全部之試題，並於兩個部分均達到及格標準，其總成績才會被視為及格",sections:{甲部:30,"甲部-地方":9,"甲部-路線":1,乙部:35},totalQuestions:75,timeLimit:45,passingScore:"甲部: 答对34题或以上; 乙部: 答对30题或以上",sectionPassing:{"甲部+甲部-地方+甲部-路線":34,乙部:30},success:"http://localhost:5001/disable",say:!0,autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,autoAnswer:!0},Ya={"section-a":{name:"甲部: 的士營運",description:"答对34题或以上及格",sections:{甲部:40},totalQuestions:40,timeLimit:20,passingScore:"答对34题或以上",sectionPassing:{甲部:34}},"section-b":{name:"乙部: 道路使用者守則",description:"答对30题或以上及格",sections:{乙部:35},totalQuestions:35,timeLimit:25,passingScore:"答对30题或以上",sectionPassing:{乙部:30}},default:{name:"的士筆試模擬",description:"考生須於指定時間內回答試卷內全部之試題，並於兩個部分均達到及格標準，其總成績才會被視為及格",sections:{甲部:30,"甲部-地方":9,"甲部-路線":1,乙部:35},totalQuestions:75,timeLimit:45,passingScore:"甲部: 答对34题或以上; 乙部: 答对30题或以上",sectionPassing:{"甲部+甲部-地方+甲部-路線":34,乙部:30},success:"http://localhost:5001/disable",autoSay:!1,isPlayOptions:!1,enableSearch:!0},default2:os,auto:ls},Va=Object.freeze(Object.defineProperty({__proto__:null,auto:ls,default:Ya,default2:os},Symbol.toStringTag,{value:"Module"})),is="香港認路APP",cs="",Qa={siteName:is,siteDescrition:cs},Ka=Object.freeze(Object.defineProperty({__proto__:null,default:Qa,siteDescrition:cs,siteName:is},Symbol.toStringTag,{value:"Module"})),us={categoryName:"運輸署官方守則",items:[{name:"《道路使用者守則》",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index.html"},{name:"發出指令的交通標誌",url:"https://www.td.gov.hk/tc/road_safety/road_users_code/index/chapter_8_the_language_of_the_road/signs_giving_orders_/index.html"},{name:"〈的士運營小冊子〉",url:"https://www.td.gov.hk/filemanager/sc/publication/taxi%20operation%20booklet_sc_20260320_revised.pdf"}]},ds={categoryName:"互動地圖工具",items:[{name:"地理資訊地圖 (2D)",url:"https://www.map.gov.hk/gm/"},{name:"地理資訊地圖 (3D)",url:"https://3d.map.gov.hk/?lookat=22.30282688529485%2C114.17584194395741&i=false&l=zh-CN"},{name:"石油氣加氣站位置",url:"https://www.emsd.gov.hk/tc/gas_safety/lpg_vehicle_scheme/publications/general/location_of_lpg_filling_station/index.html"},{name:"DC開工資訊分享",url:"https://t.me/s/dc9workinfo/28"}]},ps={categoryName:"其它備考法規",items:[{name:"違例定額罰款新規",url:"https://gia.info.gov.hk/general/202512/29/P2025122900290_526703_1_1766981772892.pdf"}]},Ja={official_guidelines:us,mapping_tools:ds,regulations:ps},Xa=Object.freeze(Object.defineProperty({__proto__:null,default:Ja,mapping_tools:ds,official_guidelines:us,regulations:ps},Symbol.toStringTag,{value:"Module"})),Za={default:{name:"(自動)",description:"考生須於指定時間內回答試卷內全部之試題，並於兩個部分均達到及格標準，其總成績才會被視為及格",sections:{},totalQuestions:100,timeLimit:45,passingScore:"",sectionPassing:{},say:!0,autoSay:!0,isPlayOptions:!0,enableSearch:!1,showOptionsAfterPlay:!0,autoAnswer:!0}},eo=Object.freeze(Object.defineProperty({__proto__:null,default:Za},Symbol.toStringTag,{value:"Module"})),dr=[{name:"上水",places:["北區醫院"]},{name:"粉嶺",places:["龍躍頭文物徑","北區政府合署"]},{name:"大埔",places:["雅麗氏何妙齡那打素醫院","林村許願廣場","香港教育大學"]},{name:"元朗",places:["博愛醫院","屏山文物徑","錦綉花園"]},{name:"天水圍",places:["香港濕地公園","嘉湖海逸酒店","嘉湖山莊"]},{name:"屯門",places:["青山醫院","大興政府合署","嶺南大學"]},{name:"屯喜路",places:["屯門政府合署","屯門法院大樓"]},{name:"青松觀路",places:["屯門醫院","小欖醫院"]},{name:"赤鱲角",places:["亞洲國際博覽館","香港天際萬豪酒店","富豪機場酒店會議中心","麗豪航天城酒店"]},{name:"東涌",places:["諾富特東薈城酒店","東薈城名店倉","東堤灣畔"]},{name:"達東路",places:["昂坪纜車 - 東涌纜車站"]},{name:"大嶼山",places:["迪士尼好萊塢酒店","愉景灣"]},{name:"竹篙灣",places:["香港迪士尼樂園","迪士尼探索家度假酒店","香港迪士尼樂園酒店"]},{name:"昂坪",places:["寶蓮禪寺"]},{name:"銀鑛灣路",places:["梅窩政府合署"]},{name:"汀九",places:["帝景酒店"]},{name:"掃管笏",places:["香港黃金海岸酒店"]},{name:"馬灣",places:["珀麗灣"]},{name:"沙田",places:["威爾斯親王醫院","香港文化博物館","麗豪酒店","新城市廣場","香港中文大學"]},{name:"上禾輋路",places:["沙田政府合署"]},{name:"大圍",places:["沙田車公廟"]},{name:"車公廟路",places:["圍方"]},{name:"亞公角街",places:["沙田醫院"]},{name:"澤祥街",places:["香港中文大學醫院"]},{name:"小瀝源",places:["香港恒生大學"]},{name:"馬鞍山",places:["新港城"]},{name:"荃灣",places:["仁濟醫院","如心廣場","綠楊新邨","麗城花園"]},{name:"荃景圍",places:["荃灣港安醫院","荃灣區警署"]},{name:"西樓角路",places:["荃灣政府合署"]},{name:"楊屋道",places:["荃灣西如心酒店"]},{name:"青衣",places:["盈翠半島"]},{name:"荔景",places:["瑪嘉烈醫院","葵涌醫院"]},{name:"興芳路",places:["葵興政府合署"]},{name:"元州街",places:["深水埗政府合署"]},{name:"深水埗",places:["寶血醫院（明愛）"]},{name:"長沙灣",places:["明愛醫院"]},{name:"長沙灣道",places:["長沙灣政府合署"]},{name:"荔枝角",places:["美孚新邨"]},{name:"荔灣道",places:["荔枝角政府合署"]},{name:"九龍塘",places:["香港浸信會醫院","香港城市大學","香港浸會大學"]},{name:"樂富",places:["香港佛教醫院"]},{name:"黃大仙",places:["聖母醫院"]},{name:"沙田坳道",places:["東華三院黃大仙醫院"]},{name:"鑽石山",places:["荷里活廣場"]},{name:"九龍城",places:["九龍醫院","香港眼科醫院","播道醫院","聖德肋撒醫院","九龍寨城公園","富豪東方酒店","醫院管理局大樓"]},{name:"亞皆老街",places:["九龍城法院大樓"]},{name:"何文田",places:["培正道政府合署","香港都會大學"]},{name:"忠孝街",places:["何文田政府合署"]},{name:"土瓜灣",places:["8度海逸酒店"]},{name:"馬頭角道",places:["馬頭角道政府合署"]},{name:"馬頭圍道",places:["土瓜灣政府合署"]},{name:"紅磡",places:["香港體育館","九龍海逸君綽酒店","都會海逸酒店","黃埔新天地","黃埔花園","海逸豪園","香港理工大學"]},{name:"旺角",places:["帝京酒店","朗豪坊"]},{name:"太子道西",places:["旺角區警署"]},{name:"大角咀",places:["香港旺角帝盛酒店"]},{name:"聯運街",places:["旺角政府合署"]},{name:"油麻地",places:["伊利沙伯醫院","廣華醫院","玉器市場","九龍政府合署"]},{name:"加士居道",places:["勞資審裁處","土地審裁處"]},{name:"尖沙咀",places:["星光大道","香港歷史博物館","香港科學館","香港太空館","香港文化中心","尖沙咀天星碼頭","香港藝術館","九龍香格里拉大酒店","千禧新世界香港酒店","帝苑酒店","皇家太平洋酒店","香港半島酒店","香港喜來登酒店","香港百樂酒店","香港金域假日酒店","馬哥孛羅香港酒店","海景嘉福洲際酒店","港威酒店","美麗華酒店","香港瑰麗酒店","美麗華廣場","港威大廈","海港城"]},{name:"柯士甸道西",places:["戲曲中心","香港W酒店","香港麗思卡爾頓酒店"]},{name:"廣東道",places:["1881"]},{name:"博物館道",places:["香港故宮文化博物館"]},{name:"中港道",places:["中區警區總部"]},{name:"通州街",places:["西九龍法院大樓"]},{name:"海庭道",places:["西九龍政府合署"]},{name:"九龍灣",places:["香港兒童醫院","淘大花園"]},{name:"偉業街",places:["德福花園"]},{name:"啟德",places:["AIRSIDE"]},{name:"承啟道",places:["啟德體育園"]},{name:"啟成街",places:["機電工程署總部大樓"]},{name:"觀塘",places:["九龍東如心酒店","東九龍政府合署","裕民坊"]},{name:"鯉魚門道",places:["觀塘區警署","觀塘法院大樓"]},{name:"秀茂坪",places:["基督教聯合醫院"]},{name:"安華街",places:["牛頭角政府合署"]},{name:"清水灣",places:["香港科技大學"]},{name:"將軍澳",places:["靈實醫院","香港九龍東皇冠假日酒店","入境事務處總部","電視廣播有限公司電視廣播城"]},{name:"寶琳北路",places:["將軍澳區警署"]},{name:"寶寧里",places:["將軍澳醫院"]},{name:"翠嶺里",places:["聖方濟各大學"]},{name:"薄扶林",places:["瑪麗醫院","東華三院馮堯敬醫院","大口環根德公爵夫人兒童醫院"]},{name:"香港仔",places:["南灣如心酒店"]},{name:"黃竹坑",places:["葛量洪醫院","港怡醫院","香港海洋公園","奧華酒店 - 南岸"]},{name:"黃竹坑徑",places:["黃竹坑醫院"]},{name:"鴨脷洲",places:["海怡半島"]},{name:"赤柱",places:["美利樓"]},{name:"山頂",places:["明德國際醫院"]},{name:"山頂道",places:["凌霄閣"]},{name:"半山",places:["嘉諾撒醫院"]},{name:"般咸道",places:["香港大學本部大樓"]},{name:"上環",places:["東華醫院","文武廟"]},{name:"皇后大道中",places:["中遠大廈"]},{name:"德輔道中",places:["永安集團大廈"]},{name:"中環",places:["香港大會堂","香港文華東方酒店","終審法院","香港禮賓府","長江集團中心","環球大廈","怡和大廈","香港滙豐總行大廈"]},{name:"金鐘",places:["立法會綜合大樓","力寶中心","統一中心"]},{name:"金鐘道",places:["高等法院"]},{name:"荷李活道",places:["大館"]},{name:"灣仔",places:["鄧肇堅醫院","律敦治醫院","金紫荊廣場","香港會議展覽中心","伊利沙伯體育館","六國酒店","香港萬麗海景酒店","合和中心"]},{name:"皇后大道東",places:["香港灣仔帝盛酒店"]},{name:"港灣道",places:["區域法院"]},{name:"莊士敦道",places:["和昌大押"]},{name:"軒尼詩道",places:["港島皇悅酒店"]},{name:"銅鑼灣",places:["柏寧酒店","香港中央圖書館","利園","時代廣場","利舞臺"]},{name:"東院道",places:["聖保祿醫院"]},{name:"跑馬地",places:["香港港安醫院","養和醫院"]},{name:"大坑",places:["東華東院"]},{name:"北角",places:["香港樹仁大學"]},{name:"渣華道",places:["北角政府合署"]},{name:"英皇道",places:["北角海逸酒店"]},{name:"鰂魚涌",places:["太古城"]},{name:"西灣河",places:["東區法院大樓"]},{name:"柴灣",places:["東區尤德夫人那打素醫院","杏花邨"]}];function hs(){const[e,t]=m.useState(""),r=m.useMemo(()=>{if(!e.trim())return dr;const l=e.toLowerCase();return dr.filter(c=>c.name.toLowerCase().includes(l)?!0:c.places.some(u=>u.toLowerCase().includes(l)))},[e]),s=m.useMemo(()=>{const l=r.reduce((c,u)=>c+u.places.length,0);return{groupCount:r.length,placeCount:l}},[r]),a=(l,c)=>d("div",{className:"location-card",children:[o("div",{className:"card-header",children:d("h3",{children:["📍 ",l.name,o("span",{className:"badge",children:l.places.length})]})}),o("div",{className:"card-body",children:o("ul",{className:"place-list",children:l.places.map((u,i)=>o("li",{children:u},i))})})]},`${l.name}-${c}`);return d("div",{className:"location-map",children:[d("div",{className:"header",children:[d("div",{children:[o("h1",{children:"🗺️ 香港地點索引"}),o("div",{className:"subtitle",children:"📍 由北至南 · 由東至西"})]}),d("div",{className:"header-right",children:[d("div",{className:"stats",children:["📊 ",s.groupCount," 個區域 · ",s.placeCount," 個地點"]}),o("input",{type:"text",className:"search-input",placeholder:"🔍 搜尋區域或地點...",value:e,onChange:l=>t(l.target.value)})]})]}),o("div",{className:"grid",children:r.map((l,c)=>a(l,c))}),r.length===0&&d("div",{className:"no-results",children:["❓ 找不到符合「",e,"」的結果"]}),o("footer",{className:"footer",children:"⚡ 網格佈局模擬地圖排序 | 資料基於原始地址清單 (小組保持一齊)"})]})}const to=`
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
`;if(typeof document<"u"){const e=document.createElement("style");e.textContent=to,document.head.appendChild(e)}const no=Object.freeze(Object.defineProperty({__proto__:null,default:hs},Symbol.toStringTag,{value:"Module"}));let _t=null,Gt=0;const ro=(e,t,r,s)=>{_t&&(clearInterval(_t),_t=null);const a=t;return a>2&&r&&e&&typeof e.getPlayerState=="function"&&(Gt=performance.now(),_t=setInterval(()=>{try{if(e.getPlayerState()===1){const c=performance.now(),u=(c-Gt)/1e3;if(Gt=c,u>.2)return;const i=e.getCurrentTime(),g=e.getPlaybackRate()||1,f=u*(a-g);f>0&&e.seekTo(i+f,!0)}else Gt=performance.now()}catch(l){console.error("Simulation error:",l)}},100)),()=>{_t&&clearInterval(_t)}},ms=()=>{const[e,t]=m.useState(""),[r,s]=m.useState(null),[a,l]=m.useState(!1),[c,u]=m.useState(0),[i,g]=m.useState([]),[f,w]=m.useState([]),[y,T]=m.useState({text:"",startTime:0,endTime:5,type:1}),[h,v]=m.useState(!1),[k,I]=m.useState([]),[U,P]=m.useState("input"),[z,Q]=m.useState(1),[H,te]=m.useState(null),[$,Ce]=m.useState(""),ye=m.useRef(null),Te=m.useRef(null),ie=m.useRef(null),re=m.useRef(null),be=m.useRef(null),V=m.useRef({});m.useEffect(()=>{if(a&&ie.current)return ro(ie.current,z,a)},[z,a,k]);const F={container:{position:"relative",width:"100%",maxWidth:h?"none":"1100px",height:h?"100vh":"auto",margin:h?"0":"20px auto",fontFamily:"sans-serif",background:"#0f0f12",color:"#ffffff",borderRadius:h?"0":"16px",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 10px 30px rgba(0,0,0,0.5)"},videoBox:{position:"relative",width:"100%",flex:1,aspectRatio:h?"auto":"16/9",background:"#000"},speedIndicator:{position:"absolute",top:"20px",left:"20px",zIndex:11,background:"rgba(0, 0, 0, 0.7)",color:"#00e676",fontSize:"14px",fontWeight:"bold",padding:"6px 12px",borderRadius:"20px",border:"1px solid rgba(0, 230, 118, 0.4)",backdropFilter:"blur(5px)",pointerEvents:"none"},overlay:{position:"absolute",top:"30px",right:"30px",zIndex:10,textAlign:"right",pointerEvents:"none",width:"50%"},highlightText:{background:"rgba(255, 230, 0, 0.25)",color:"#fff",fontSize:"clamp(18px, 4vw, 28px)",fontWeight:"800",textShadow:"0 2px 8px rgba(0,0,0,1)",padding:"10px 20px",borderRadius:"4px",display:"inline-block",marginBottom:"10px",backdropFilter:"blur(10px)",borderRight:"6px solid #ff0055"},controlPanel:{padding:"24px",background:h?"rgba(22, 22, 30, 0.95)":"#16161e",borderTop:"1px solid #2a2a35",position:h?"absolute":"relative",bottom:0,left:0,right:0,zIndex:100,backdropFilter:h?"blur(15px)":"none"},tabBar:{display:"flex",gap:"15px",borderBottom:"1px solid #2a2a35",marginBottom:"20px"},tabButton:_=>({padding:"12px 20px",cursor:"pointer",background:"none",border:"none",borderBottom:_?"3px solid #3d5afe":"3px solid transparent",color:_?"#3d5afe":"#888",fontWeight:"700",transition:"all 0.2s ease"}),input:{flex:1,padding:"12px 15px",background:"#252530",color:"#ffffff",border:"1px solid #3f3f50",borderRadius:"8px",outline:"none"},button:{padding:"10px 20px",borderRadius:"8px",border:"none",cursor:"pointer",fontWeight:"600",background:"#3d5afe",color:"white"},itemRow:_=>({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px",marginBottom:"8px",background:_?"#2d2d45":"#1f1f2b",borderRadius:"8px",border:_?"2px solid #3d5afe":"1px solid #2d2d3d",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",transform:_?"translateX(5px)":"translateX(0)"})},xe=_=>{ie.current&&(Q(_),ie.current.setPlaybackRate(_>2?2:_))},_e=()=>{document.fullscreenElement?document.exitFullscreen():ye.current.requestFullscreen().catch(_=>console.error(_))},ce=m.useCallback(_=>{var x;(x=ie.current)!=null&&x.destroy&&ie.current.destroy(),l(!1),ie.current=new window.YT.Player(Te.current,{videoId:_,width:"100%",height:"100%",playerVars:{autoplay:1,controls:1,modestbranding:1,rel:0},events:{onReady:D=>{l(!0),Q(D.target.getPlaybackRate()),re.current&&clearInterval(re.current),re.current=setInterval(()=>{u(ie.current.getCurrentTime())},200)},onPlaybackRateChange:D=>{z<=2&&Q(D.data)}}})},[z]),C=_=>{const x=(_.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/)||[])[1];if(x){s(x),ce(x),localStorage.setItem("last_v_url",_);const ne=[{id:x,url:_,timestamp:Date.now()},...f.filter(Z=>Z.id!==x)].slice(0,15);w(ne),localStorage.setItem("yt_video_history",JSON.stringify(ne))}},R=_=>{g(_),r&&localStorage.setItem(`yt_notes_v_${r}`,JSON.stringify(_))};m.useEffect(()=>{const _=localStorage.getItem("yt_video_history");_&&w(JSON.parse(_));const x=localStorage.getItem("last_v_url");if(x&&t(x),!window.YT){const ne=document.createElement("script");ne.src="https://www.youtube.com/iframe_api",document.body.appendChild(ne)}const D=()=>v(!!document.fullscreenElement);return document.addEventListener("fullscreenchange",D),()=>{clearInterval(re.current),document.removeEventListener("fullscreenchange",D)}},[]),m.useEffect(()=>{if(r){const _=localStorage.getItem(`yt_notes_v_${r}`);g(_?JSON.parse(_):[])}},[r]),m.useEffect(()=>{if(!a)return;const _=i.filter(D=>c>=D.startTime&&c<=D.endTime);I(_);const x=_.find(D=>D.type===0);x&&ie.current.seekTo(x.endTime,!0)},[c,i,a,z]);const B=_=>{var W;if(!r||!y.text&&_=="1")return;const x=Math.floor(((W=ie.current)==null?void 0:W.getCurrentTime())||c),D=x>y.startTime?x:y.startTime+2,ne={...y,endTime:D,id:Date.now(),vid:r};let Z=i.length>0?i[i.length-1]:null;Z&&_==Z.type&&Z.text==ne.text?(ne.text=y.text,Z.endTime=D,R([...i])):(ne.type=_,R([...i,ne]),T({...y,startTime:D}))},X=_=>{window.open(`https://www.google.com/maps/place/${encodeURIComponent(_)}`,"place")};return d("div",{ref:ye,style:F.container,children:[d("div",{style:F.videoBox,children:[o("div",{ref:Te,style:{width:"100%",height:"100%"}}),z!==1&&d("div",{style:F.speedIndicator,children:["⚡ ",z,"x Speed"]}),d("div",{style:F.overlay,children:[k.map(_=>d("div",{style:F.highlightText,children:[_.type===0&&"⏭️ SKIP: ",_.text]},_.id)),y.text&&o("div",{style:{...F.highlightText,borderRightColor:"#3d5afe",opacity:.8},children:y.text})]})]}),d("div",{style:F.controlPanel,children:[!h&&d("div",{style:{display:"flex",gap:"10px",marginBottom:"20px"},children:[o("input",{style:F.input,placeholder:"Paste YouTube Link...",value:e,onChange:_=>t(_.target.value)}),o("button",{style:{...F.button,background:"#00c853"},onClick:()=>C(e),children:"Load"}),o("button",{style:{...F.button,background:"#555"},onClick:_e,children:"⛶ FS"})]}),d("div",{style:F.tabBar,children:[d("div",{style:{display:"flex",gap:"8px",marginBottom:"15px"},children:[d("button",{style:F.tabButton(U==="input"),onClick:()=>P("input"),children:["Add Note( ",y.startTime,"s - ",Math.floor(c),"s)"]}),d("button",{style:F.tabButton(U==="list"),onClick:()=>P("list"),children:["Notes (",i.length,")"]}),o("button",{style:F.tabButton(U==="history"),onClick:()=>P("history"),children:"History"})]}),o("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"15px"},children:o("div",{style:{display:"flex",gap:"8px"},children:[1,2,4,8,20].map(_=>d("button",{onClick:()=>xe(_),style:{background:z===_?"#3d5afe":"#333",color:"#fff",border:"none",padding:"5px 10px",borderRadius:"4px",cursor:"pointer",transition:"background 0.2s ease"},onMouseEnter:x=>{x.currentTarget.style.background=z===_?"#5c7cff":"#444"},onMouseLeave:x=>{x.currentTarget.style.background=z===_?"#3d5afe":"#333"},children:[_,"x"]},_))})})]}),U==="input"&&o("div",{style:{background:"#252530",padding:"20px",borderRadius:"12px"},children:d("div",{style:{display:"flex",gap:"10px"},children:[o("input",{style:F.input,value:y.text,onChange:_=>T({...y,text:_.target.value}),placeholder:"Note text..."}),o("button",{onClick:()=>B(1),style:F.button,children:"Normal"}),o("button",{onClick:()=>B(10),style:{...F.button,background:"#ff0055"},children:"2x"}),o("button",{onClick:()=>B(0),style:{...F.button,background:"#555"},children:"Skip"}),o("button",{onClick:()=>T({...y,startTime:Math.floor(c)}),style:{...F.button,background:"#444"},children:"Set Start"})]})}),U==="list"&&o("div",{ref:be,style:{maxHeight:h?"25vh":"150px",overflowY:"auto"},children:i.sort((_,x)=>_.startTime-x.startTime).map(_=>d("div",{ref:x=>V.current[_.id]=x,style:F.itemRow(k.some(x=>x.id===_.id)),children:[d("div",{style:{flex:1},children:[d("span",{style:{color:_.type===10?"#ff0055":"#00e676",fontWeight:"bold",marginRight:"10px"},children:[_.startTime,"-",_.endTime,"s"]}),H===_.id?o("input",{autoFocus:!0,style:F.input,value:$,onChange:x=>Ce(x.target.value),onBlur:()=>{R(i.map(x=>x.id===_.id?{...x,text:$}:x)),te(null)}}):o("span",{onDoubleClick:()=>{te(_.id),Ce(_.text)},children:_.text||"(Edit)"}),_.text&&o("button",{style:{...F.button,padding:"5px"},onClick:()=>X(_.text),children:"Go"})]}),d("div",{style:{display:"flex",gap:"8px"},children:[o("button",{style:{...F.button,padding:"5px"},onClick:()=>{const x=_.type===1?2:_.type===2?0:1;R(i.map(D=>D.id===_.id?{...D,type:x}:D))},children:_.type===1?"Normal":_.type===10?"⏩ 2x":"⏭️ Skip"}),o("button",{style:{...F.button,padding:"5px 10px",background:"#333"},onClick:()=>ie.current.seekTo(_.startTime,!0),children:"Jump"}),o("button",{style:{...F.button,padding:"5px 10px",background:"#b71c1c"},onClick:()=>R(i.filter(x=>x.id!==_.id)),children:"X"})]})]},_.id))}),U==="history"&&d("div",{style:{maxHeight:h?"25vh":"150px",overflowY:"auto"},children:[f.length===0&&o("div",{style:{textAlign:"center",opacity:.5,padding:"20px"},children:"No history yet"}),f.map(_=>d("div",{style:{...F.itemRow(r===_.id),cursor:"pointer"},onClick:()=>{t(_.url),C(_.url)},children:[d("div",{style:{display:"flex",gap:"15px",alignItems:"center"},children:[o("img",{src:`https://img.youtube.com/vi/${_.id}/default.jpg`,style:{width:"60px",borderRadius:"4px"},alt:"thumb"}),o("span",{style:{fontSize:"14px"},children:_.id})]}),o("button",{style:{...F.button,background:r===_.id?"#00c853":"#333"},children:r===_.id?"Playing":"Load"})]},_.timestamp))]})]})]})},so=Object.freeze(Object.defineProperty({__proto__:null,default:ms},Symbol.toStringTag,{value:"Module"})),ao=()=>{const[e,t]=m.useState("area1"),[r,s]=m.useState(""),[a,l]=m.useState({}),[c,u]=m.useState(!1),[i,g]=m.useState(null),[f,w]=m.useState(!1),[y,T]=m.useState("default"),[h,v]=m.useState(!1),k=m.useRef(null),I=m.useRef(null),U=m.useRef(null),{questions:P}=on(),z=P.filter(x=>x.section==="甲部"&&x.sectionName==="地方"),Q=P.filter(x=>x.section==="甲部"&&x.sectionName==="路線");let H="";z.forEach(x=>{H+=`${x.question}:${x.options[x.correctAnswer]}
`});const te=[...z].sort((x,D)=>x.options[x.correctAnswer].localeCompare(D.options[D.correctAnswer]));Q.forEach((x,D)=>{H+=`${D+1} ${x.question.replace("，最直接的路線是？","")}:${x.options[x.correctAnswer]}
--------
`}),console.log(H);const $={};te.forEach(x=>{let D=x.options[x.correctAnswer];$[D]||($[D]=[]),$[D].push(x)});let Ce=Object.keys($);const ye=[{id:"default",label:"默認排序",icon:ea,description:"按問題數量從多到少，數量相同時按地區名稱排序",getSortedKeys:(x,D)=>[...x].sort((ne,Z)=>D[Z].length-D[ne].length||ne.localeCompare(Z,"zh-HK"))},{id:"nameAsc",label:"地區名稱 (A-Z)",icon:ta,description:"按地區名稱正序排列",getSortedKeys:(x,D)=>[...x].sort((ne,Z)=>ne.localeCompare(Z,"zh-HK"))},{id:"nameDesc",label:"地區名稱 (Z-A)",icon:na,description:"按地區名稱倒序排列",getSortedKeys:(x,D)=>[...x].sort((ne,Z)=>Z.localeCompare(ne,"zh-HK"))},{id:"countAsc",label:"問題數量 (少到多)",icon:ra,description:"按問題數量從少到多排列",getSortedKeys:(x,D)=>[...x].sort((ne,Z)=>D[ne].length-D[Z].length||ne.localeCompare(Z,"zh-HK"))},{id:"countDesc",label:"問題數量 (多到少)",icon:sa,description:"按問題數量從多到少排列",getSortedKeys:(x,D)=>[...x].sort((ne,Z)=>D[Z].length-D[ne].length||ne.localeCompare(Z,"zh-HK"))}],ie=(()=>{const x=ye.find(D=>D.id===y);return x&&x.getSortedKeys?x.getSortedKeys(Ce,$):ye[0].getSortedKeys(Ce,$)})(),be=(()=>ye.find(D=>D.id===y)||ye[0])(),V=be.icon,F=ie.filter(x=>x.toLowerCase().includes(r.toLowerCase())),xe=x=>{l(D=>({...D,[x]:!D[x]}))},_e=()=>{const x={};F.forEach(D=>{x[D]=!0}),l(x)},ce=()=>{l({})},C=x=>{T(x),l({}),v(!1)};m.useEffect(()=>{const x=D=>{I.current&&!I.current.contains(D.target)&&u(!1),U.current&&!U.current.contains(D.target)&&v(!1)};return document.addEventListener("mousedown",x),()=>document.removeEventListener("mousedown",x)},[]);const R=(x,D)=>{k.current&&((i==null?void 0:i.path)===x&&f?(k.current.pause(),k.current.currentTime=0,w(!1),g(null)):(k.current.src=x,k.current.loop=!0,k.current.play().catch(ne=>{console.error("音頻播放失敗:",ne),w(!1),g(null)}),w(!0),g({path:x,label:D})),u(!1))},B=()=>{k.current&&(k.current.pause(),k.current.currentTime=0,w(!1),g(null))},X=()=>{w(!1),g(null)};m.useEffect(()=>()=>{k.current&&(k.current.pause(),k.current.currentTime=0)},[]);const _=[{path:"./area_audio1.mp3",label:"地區音頻 1"},{path:"./area_audio2.mp3",label:"地區音頻 2"},{path:"./n-s-w-e.mp3",label:"南北西東"},{path:"./seq.mp3",label:"順序"},{path:"./route.mp3",label:"路線"}];return d("div",{className:"space-y-6 p-4",children:[o("div",{className:"border-b border-gray-200",children:d("nav",{className:"flex gap-2","aria-label":"Tabs",children:[o("button",{onClick:()=>t("area1"),className:`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${e==="area1"?"bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm":"text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`,children:"📍 地區問題列表"}),o("button",{onClick:()=>t("area2"),className:`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${e==="area2"?"bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm":"text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`,children:"🗺️ 輔助工具 (Area2)"}),o("button",{onClick:()=>t("area3"),className:`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${e==="area3"?"bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm":"text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`,children:"🗺️ 輔助工具 (Area3)"})]})}),d("div",{className:"mt-4",children:[e==="area1"&&d("div",{children:[d("div",{className:"sticky top-0 bg-white z-10 pb-4 border-b",children:[d("div",{className:"flex items-center gap-4 flex-wrap",children:[d("div",{className:"relative flex-1 max-w-md",children:[o(Dn,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),o("input",{type:"text",placeholder:"🔍 搜尋地區名稱...",value:r,onChange:x=>s(x.target.value),className:"w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"})]}),d("div",{className:"relative",ref:U,children:[d("button",{onClick:()=>v(!h),className:"flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200",title:"選擇排序方式",children:[o(V,{className:"w-4 h-4"}),o("span",{children:be.label}),h?o(cr,{className:"w-4 h-4"}):o(Kt,{className:"w-4 h-4"})]}),h&&o("div",{className:"absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20",children:d("div",{className:"py-2",children:[o("div",{className:"px-3 py-2 text-xs font-semibold text-gray-500 border-b bg-gray-50",children:"選擇排序方式"}),ye.map(x=>{const D=x.icon;return o("button",{onClick:()=>C(x.id),className:`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${y===x.id?"bg-blue-50 text-blue-600":"text-gray-700"}`,children:d("div",{className:"flex items-start gap-3",children:[o(D,{className:`w-4 h-4 mt-0.5 ${y===x.id?"text-blue-500":"text-gray-400"}`}),d("div",{className:"flex-1",children:[d("div",{className:"text-sm font-medium",children:[x.label,y===x.id&&o("span",{className:"ml-2 text-xs text-blue-500",children:"✓"})]}),o("div",{className:"text-xs text-gray-500 mt-0.5",children:x.description})]})]})},x.id)})]})})]}),d("div",{className:"relative",ref:I,children:[d("button",{onClick:()=>u(!c),className:`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${f?"bg-green-500 text-white hover:bg-green-600":"bg-blue-500 text-white hover:bg-blue-600"}`,children:[f?d(qe,{children:[o(Tn,{className:"w-4 h-4"}),d("span",{children:["🎵 ",(i==null?void 0:i.label)||"播放中"]})]}):d(qe,{children:[o(Ur,{className:"w-4 h-4"}),o("span",{children:"選擇音頻播放"})]}),c?o(cr,{className:"w-4 h-4"}):o(Kt,{className:"w-4 h-4"})]}),c&&o("div",{className:"absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20",children:d("div",{className:"py-2",children:[d("div",{className:"px-3 py-2 text-xs font-semibold text-gray-500 border-b flex justify-between items-center",children:[o("span",{children:"選擇要播放的音頻"}),_.length>1&&d("span",{className:"text-xs text-gray-400",children:["共 ",_.length," 個"]})]}),_.map(x=>d("button",{onClick:()=>R(x.path,x.label),className:`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between ${(i==null?void 0:i.path)===x.path&&f?"bg-green-50 text-green-600":"text-gray-700"}`,children:[d("span",{className:"flex items-center gap-2",children:[(i==null?void 0:i.path)===x.path&&f&&o(Tn,{className:"w-4 h-4 text-green-500"}),x.label]}),(i==null?void 0:i.path)===x.path&&f&&o("span",{className:"text-xs text-green-500",children:"播放中"})]},x.path)),f&&d(qe,{children:[o("div",{className:"border-t my-1"}),d("button",{onClick:B,className:"w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2",children:[o(Zs,{className:"w-4 h-4"}),"停止播放"]})]})]})})]}),r&&d("button",{onClick:()=>s(""),className:"flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100",children:[o(Xt,{className:"w-4 h-4"}),"清除"]}),d("div",{className:"flex gap-2",children:[o("button",{onClick:_e,className:"px-3 py-2 text-sm text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50",children:"全部展開"}),o("button",{onClick:ce,className:"px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100",children:"全部收起"})]})]}),d("div",{className:"mt-3 flex gap-4 text-sm text-gray-500 flex-wrap",children:[d("span",{children:["📊 總共 ",Ce.length," 個地區"]}),r&&d("span",{children:["🔍 符合 ",F.length," 個地區"]}),d("span",{children:["📝 總共 ",te.length," 條問題"]}),d("span",{className:"flex items-center gap-1 text-blue-600",children:[o(be.icon,{className:"w-3 h-3"}),"當前排序: ",be.label]})]})]}),o("audio",{ref:k,onEnded:X,preload:"auto"}),d("div",{className:"space-y-3 mt-4",children:[F.map((x,D)=>{const ne=$[x].length,Z=a[x];return d("div",{className:"border rounded-lg overflow-hidden",children:[o("div",{className:"flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors",onClick:()=>xe(x),children:d("div",{className:"flex items-center gap-3",children:[Z?o(Kt,{className:"w-5 h-5 text-gray-500"}):o(Hr,{className:"w-5 h-5 text-gray-500"}),d("div",{children:[d("span",{className:"font-semibold text-lg",children:[D+1,". ",x]}),d("span",{className:"ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800",children:["(",ne,")"]})]})]})}),Z&&o("div",{className:"divide-y",children:$[x].map((W,We)=>o("div",{className:"p-4 hover:bg-gray-50",children:d("div",{className:"flex items-start gap-3",children:[o("div",{className:"flex-shrink-0 w-8 h-6 flex items-center justify-center bg-gray-200 rounded text-xs font-medium text-gray-700",children:We+1}),o("div",{className:"flex-1",children:o("div",{className:"text-gray-800",children:W.question})})]})},W.id))})]},x)}),F.length===0&&d("div",{className:"text-center py-12",children:[o("div",{className:"text-gray-400 text-6xl mb-4",children:"🔍"}),d("div",{className:"text-gray-500 text-lg",children:["找不到符合「",r,"」的地區"]}),o("div",{className:"text-gray-400 text-sm mt-2",children:"請嘗試其他關鍵字"})]})]})]}),e==="area2"&&o("div",{children:o(hs,{})}),e==="area3"&&o("div",{children:o(ms,{})}),"      "]})]})},oo=Object.freeze(Object.defineProperty({__proto__:null,default:ao},Symbol.toStringTag,{value:"Module"})),ke={HOSPITAL:"hospital",TOURIST_ATTRACTION:"tourist_attraction",HOTEL:"hotel",GOVERNMENT_BUILDING:"government_building",COMMERCIAL_BUILDING:"commercial_building",SHOPPING_MALL:"shopping_mall",RESIDENTIAL_BUILDING:"residential_building",UNIVERSITY:"university"},$n={[ke.HOSPITAL]:"醫院",[ke.TOURIST_ATTRACTION]:"旅遊景點",[ke.HOTEL]:"酒店",[ke.GOVERNMENT_BUILDING]:"政府樓宇",[ke.COMMERCIAL_BUILDING]:"商業大厦",[ke.SHOPPING_MALL]:"購物商場",[ke.RESIDENTIAL_BUILDING]:"住宅樓宇",[ke.UNIVERSITY]:"大專院校"},gs={[ke.HOSPITAL]:aa,[ke.TOURIST_ATTRACTION]:oa,[ke.HOTEL]:la,[ke.GOVERNMENT_BUILDING]:ia,[ke.COMMERCIAL_BUILDING]:ca,[ke.SHOPPING_MALL]:ua,[ke.RESIDENTIAL_BUILDING]:da,[ke.UNIVERSITY]:pa},lo=[{keywords:["醫院","診所","醫療"],type:ke.HOSPITAL},{keywords:["酒店","賓館","旅館"],type:ke.HOTEL},{keywords:["大學","學院","學校"],type:ke.UNIVERSITY},{keywords:["政府","警署","法院"],type:ke.GOVERNMENT_BUILDING},{keywords:["商場","購物","百貨"],type:ke.SHOPPING_MALL},{keywords:["住宅","屋苑","邨"],type:ke.RESIDENTIAL_BUILDING},{keywords:["商業","大厦","中心","廣場"],type:ke.COMMERCIAL_BUILDING},{keywords:["景點","公園","博物館","海灘"],type:ke.TOURIST_ATTRACTION}],io=["中西區","灣仔區","東區","南區","油尖旺區","深水埗區","九龍城區","黃大仙區","觀塘區","葵青區","沙田區","大埔區","北區","西貢區","荃灣區","屯門區","元朗區","離島區","未分類"],pr={港島:["中西區","灣仔區","東區","南區"],九龍東:["黃大仙區","觀塘區"],九龍西:["油尖旺區","深水埗區","九龍城區"],新界東:["沙田區","大埔區","北區","西貢區"],新界西:["葵青區","荃灣區","屯門區","元朗區","離島區"]},co={中西區:"bg-red-100 text-red-800",灣仔區:"bg-orange-100 text-orange-800",東區:"bg-amber-100 text-amber-800",南區:"bg-yellow-100 text-yellow-800",油尖旺區:"bg-lime-100 text-lime-800",深水埗區:"bg-green-100 text-green-800",九龍城區:"bg-emerald-100 text-emerald-800",黃大仙區:"bg-teal-100 text-teal-800",觀塘區:"bg-cyan-100 text-cyan-800",葵青區:"bg-slate-100 text-slate-800",沙田區:"bg-sky-100 text-sky-800",大埔區:"bg-blue-100 text-blue-800",北區:"bg-indigo-100 text-indigo-800",西貢區:"bg-violet-100 text-violet-800",荃灣區:"bg-purple-100 text-purple-800",屯門區:"bg-fuchsia-100 text-fuchsia-800",元朗區:"bg-pink-100 text-pink-800",離島區:"bg-rose-100 text-rose-800",未分類:"bg-gray-100 text-gray-800"},fs={中西區:["中環","上環","西環","半山","山頂","西營盤","堅尼地城","石塘咀"],灣仔區:["灣仔","銅鑼灣","跑馬地","大坑","掃桿埔","鵝頸"],東區:["北角","鰂魚涌","筲箕灣","柴灣","小西灣","西灣河","太古","杏花邨"],南區:["香港仔","鴨脷洲","黃竹坑","薄扶林","赤柱","淺水灣","深水灣","石澳","大潭"],油尖旺區:["油麻地","尖沙咀","旺角","大角咀","佐敦","太子","何文田"],深水埗區:["深水埗","長沙灣","荔枝角","美孚","石硤尾","南昌"],九龍城區:["九龍城","紅磡","土瓜灣","何文田","黃埔","馬頭圍","啟德"],黃大仙區:["黃大仙","鑽石山","新蒲崗","樂富","橫頭磡","慈雲山"],觀塘區:["觀塘","牛頭角","九龍灣","藍田","油塘","秀茂坪","順利","彩雲"],沙田區:["沙田","大圍","馬鞍山","火炭","小瀝源","石門","第一城","顯徑"],大埔區:["大埔","太和","大埔墟","大埔工業邨","林村","汀角","船灣"],北區:["上水","粉嶺","聯和墟","沙頭角","打鼓嶺","古洞"],西貢區:["西貢","將軍澳","坑口","寶琳","調景嶺","康城","清水灣","科大"],荃灣區:["荃灣","葵涌","青衣","荔景","汀九","深井","馬灣"],屯門區:["屯門","青山灣","小欖","龍鼓灘","蝴蝶灣","兆康","大興"],元朗區:["元朗","天水圍","屏山","錦田","流浮山","廈村","新田"],離島區:["大嶼山","東涌","梅窩","長洲","南丫島","坪洲","愉景灣","迪士尼"]},hr={瑪麗醫院:"中西區",威爾斯親王醫院:"沙田區",贊育醫院:"中西區",東華醫院:"中西區",東華三院馮堯敬醫院:"南區",葛量洪醫院:"南區",東區尤德夫人那打素醫院:"東區",東華東院:"灣仔區",鄧肇堅醫院:"灣仔區",律敦治醫院:"灣仔區",黃竹坑醫院:"南區",伊利沙伯醫院:"油尖旺區",九龍醫院:"九龍城區",香港佛教醫院:"黃大仙區",香港眼科醫院:"九龍城區",東華三院黃大仙醫院:"黃大仙區",聖母醫院:"黃大仙區",廣華醫院:"油尖旺區",明愛醫院:"深水埗區",瑪嘉烈醫院:"葵青區",葵涌醫院:"葵青區",仁濟醫院:"荃灣區",基督教聯合醫院:"觀塘區",靈實醫院:"西貢區",將軍澳醫院:"西貢區",沙田醫院:"沙田區",雅麗氏何妙齡那打素醫院:"大埔區",大埔醫院:"大埔區",北區醫院:"北區",屯門醫院:"屯門區",博愛醫院:"元朗區",嘉諾撒醫院:"中西區",明德國際醫院:"中西區",香港港安醫院:"灣仔區",聖保祿醫院:"灣仔區",養和醫院:"灣仔區","寶血醫院（明愛）":"深水埗區",播道醫院:"九龍城區",聖德肋撒醫院:"九龍城區",香港浸信會醫院:"九龍城區",荃灣港安醫院:"荃灣區",沙田國際醫務中心仁安醫院:"沙田區",青山醫院:"屯門區",小欖醫院:"屯門區",大口環根德公爵夫人兒童醫院:"南區",北大嶼山醫院:"離島區",天水圍醫院:"元朗區",港怡醫院:"南區",香港兒童醫院:"九龍城區",香港中文大學醫院:"沙田區",星光大道:"油尖旺區",金紫荊廣場:"灣仔區",香港迪士尼樂園:"離島區",香港濕地公園:"元朗區",玉器市場:"油尖旺區",九龍寨城公園:"九龍城區","昂坪纜車 - 東涌纜車站":"離島區",香港海洋公園:"南區",寶蓮禪寺:"離島區",凌霄閣:"中西區",亞洲國際博覽館:"離島區",屏山文物徑:"元朗區",香港會議展覽中心:"灣仔區",香港文化博物館:"沙田區",香港歷史博物館:"油尖旺區",香港科學館:"油尖旺區",香港太空館:"油尖旺區",香港大會堂:"中西區",香港體育館:"九龍城區",香港文化中心:"油尖旺區",伊利沙伯體育館:"灣仔區",沙田大會堂:"沙田區",尖沙咀天星碼頭:"油尖旺區",1881:"油尖旺區",沙田車公廟:"沙田區",文武廟:"中西區",林村許願廣場:"大埔區",龍躍頭文物徑:"北區",美利樓:"南區",和昌大押:"灣仔區",大館:"中西區",香港藝術館:"油尖旺區",香港故宮文化博物館:"油尖旺區",戲曲中心:"油尖旺區",啟德體育園:"九龍城區",北角政府合署:"東區",長沙灣政府合署:"深水埗區",何文田政府合署:"九龍城區",東九龍政府合署:"觀塘區",九龍政府合署:"油尖旺區",葵興政府合署:"荃灣區",荔枝角政府合署:"深水埗區",馬頭角道政府合署:"九龍城區",旺角政府合署:"油尖旺區",梅窩政府合署:"離島區",牛頭角政府合署:"觀塘區",北區政府合署:"北區",培正道政府合署:"九龍城區",西貢政府合署:"西貢區",沙田政府合署:"沙田區",深水埗政府合署:"深水埗區",大興政府合署:"屯門區",大埔政府合署:"大埔區",土瓜灣政府合署:"九龍城區",荃灣政府合署:"荃灣區",屯門政府合署:"屯門區",元朗政府合署:"元朗區",香港恒生大學:"沙田區",香港城市大學:"九龍城區",香港浸會大學:"九龍城區",香港樹仁大學:"東區",嶺南大學:"屯門區",香港中文大學:"沙田區",香港教育大學:"大埔區",香港理工大學:"九龍城區",香港科技大學:"西貢區",香港都會大學:"九龍城區",香港大學本部大樓:"中西區",聖方濟各大學:"西貢區"},Jt=e=>{if(!e||!e.name)return"未知地區";if(hr[e.name])return hr[e.name];const t=e.name.toLowerCase();for(const[r,s]of Object.entries(fs))for(const a of s)if(t.includes(a.toLowerCase()))return r;return io.indexOf(e.district)>-1?e.district:"其他地區"},uo=()=>Object.keys(fs),bs=e=>{const t={};uo().forEach(s=>{t[s]=[]}),t.其他地區=[],t.未知地區=[],e.forEach(s=>{const a=Jt(s.name);t[a]?t[a].push(s):t.其他地區.push(s)});const r={};return Object.entries(t).forEach(([s,a])=>{a.length>0&&(r[s]=a.sort((l,c)=>l.name.localeCompare(c.name)))}),r},po=e=>{const t=bs(e),r={};return Object.entries(t).forEach(([s,a])=>{r[s]={count:a.length,locations:a}}),r},Ie={USER_INPUT:"user_input",AREA_SECTION:"area_section",ROUTE_SECTION:"route_section"},xn={[Ie.USER_INPUT]:"用户输入",[Ie.AREA_SECTION]:"地方",[Ie.ROUTE_SECTION]:"路線"},ho=()=>{const{questions:e}=on.getState();return e.filter(t=>t.to)},mo=()=>{const{questions:e}=on.getState();return e.filter(t=>t.to&&t.from)},mr=()=>{const e=new Map;return ho().forEach(r=>{if(r.to&&r.to.trim()){const s=r.to.trim();e.has(s)||e.set(s,{...r,name:s,correctAnswer:r.options?r.options[r.correctAnswer]:"",questionId:r.id})}}),Array.from(e.values()).sort((r,s)=>r.name.localeCompare(s.name))},gr=()=>{const e=new Map;return mo().forEach(r=>{if(r.from&&r.from.trim()){const s=r.from.trim();e.has(s)||e.set(s,{name:s,correctAnswer:r.options?r.options[r.correctAnswer]:"",explanation:r.explanation,questionId:r.id,category:r.category,sectionName:r.sectionName})}if(r.to&&r.to.trim()){const s=r.to.trim();e.has(s)||e.set(s,{name:s,correctAnswer:r.options?r.options[r.correctAnswer]:"",explanation:r.explanation,questionId:r.id,category:r.category,sectionName:r.sectionName})}}),Array.from(e.values()).sort((r,s)=>r.name.localeCompare(s.name))};class go{constructor(){this.userLocations=this.loadUserLocations(),this.defaultFromLocation=this.loadDefaultFromLocation()}loadUserLocations(){try{if(typeof localStorage<"u"){const t=localStorage.getItem("hkTaxiUserLocations");if(t)return JSON.parse(t)}}catch(t){console.error("加载用户地点失败:",t)}return[]}saveUserLocations(t){try{if(typeof localStorage<"u")return localStorage.setItem("hkTaxiUserLocations",JSON.stringify(t)),this.userLocations=t,!0}catch(r){console.error("保存用户地点失败:",r)}return!1}loadDefaultFromLocation(){try{if(typeof localStorage<"u"){const t=localStorage.getItem("hkTaxiDefaultFromLocation");if(t)return JSON.parse(t)}}catch(t){console.error("加载默认出发地点失败:",t)}return{type:"random",specificLocation:"",source:Ie.USER_INPUT}}saveDefaultFromLocation(t){try{if(typeof localStorage<"u")return localStorage.setItem("hkTaxiDefaultFromLocation",JSON.stringify(t)),this.defaultFromLocation=t,!0}catch(r){console.error("保存默认出发地点失败:",r)}return!1}addUserLocation(t){if(!t||!t.trim())return!1;const r=t.trim();if(this.userLocations.some(l=>l.name===r))return!1;const s={name:r,source:Ie.USER_INPUT,createdAt:new Date().toISOString()},a=[...this.userLocations,s];return this.saveUserLocations(a)}removeUserLocation(t){const r=this.userLocations.filter(s=>s.name!==t);return this.saveUserLocations(r)}updateUserLocation(t,r){if(!r||!r.trim())return!1;const s=r.trim(),a=this.userLocations.map(l=>l.name===t?{...l,name:s}:l);return this.saveUserLocations(a)}getAllLocations(){const t=this.userLocations.map(u=>({...u,displayName:u.name,sourceLabel:xn[u.source],district:Jt(u),correctAnswer:null,explanation:null,questionId:null,category:null,sectionName:null})),r=mr(),s=gr(),a=r.map(u=>({...u,source:Ie.AREA_SECTION,displayName:u.name,sourceLabel:xn[Ie.AREA_SECTION],district:Jt(u)})),l=s.map(u=>({...u,source:Ie.ROUTE_SECTION,displayName:u.name,sourceLabel:xn[Ie.ROUTE_SECTION],district:Jt(u)})),c=new Map;return t.forEach(u=>{c.set(u.name,u)}),[...a,...l].forEach(u=>{c.has(u.name)||c.set(u.name,u)}),Array.from(c.values()).sort((u,i)=>u.name.localeCompare(i.name))}getRandomLocation(){const t=this.getAllLocations();if(t.length===0)return null;const r=Math.floor(Math.random()*t.length);return t[r]}getDefaultFromLocation(){const t=this.defaultFromLocation;if(t.type==="specific"&&t.specificLocation){const a=this.getAllLocations().find(l=>l.name===t.specificLocation);if(a)return{...a,isRandom:!1}}else if(t.type==="current")return{name:"現在位置",isRandom:!1};const r=this.getRandomLocation();return r?{...r,isRandom:!0}:null}setDefaultFromLocationType(t,r=""){const s={...this.defaultFromLocation,type:t,specificLocation:t==="specific"?r:""};return this.saveDefaultFromLocation(s)}setSpecificDefaultLocation(t){return this.setDefaultFromLocationType("specific",t)}setRandomDefaultLocation(){return this.setDefaultFromLocationType("random")}getLocationStats(){const t=this.getAllLocations(),r=this.userLocations,s=mr(),a=gr(),l=po(t);return{total:t.length,userDefined:r.length,fromAreaSection:s.length,fromRouteSection:a.length,defaultFromLocation:this.defaultFromLocation,districts:Object.keys(l).length,districtStats:l}}searchLocations(t){const r=this.getAllLocations();if(!t)return r;const s=t.toLowerCase();return r.filter(a=>a.name.toLowerCase().includes(s)||a.sourceLabel.toLowerCase().includes(s)||a.district&&a.district.toLowerCase().includes(s))}searchLocationsByDistrict(t,r=""){const a=this.getAllLocations().filter(c=>c.district===t);if(!r)return a;const l=r.toLowerCase();return a.filter(c=>c.name.toLowerCase().includes(l)||c.sourceLabel.toLowerCase().includes(l))}getAllDistricts(){const t=this.getAllLocations(),r=new Set(t.map(s=>s.district));return Array.from(r).sort()}getLocationsGroupedByDistrict(){const t=this.getAllLocations();return bs(t)}importSystemLocation(t){const s=this.getAllLocations().find(a=>a.name===t);return s?s.source===Ie.USER_INPUT?!0:this.addUserLocation(t):!1}importSystemLocations(t){let r=0;return t.forEach(s=>{this.importSystemLocation(s)&&r++}),r}resetAllData(){try{return localStorage.removeItem("hkTaxiUserLocations"),localStorage.removeItem("hkTaxiDefaultFromLocation"),this.userLocations=[],this.defaultFromLocation=this.loadDefaultFromLocation(),!0}catch(t){return console.error("重置地点数据失败:",t),!1}}}const st=new go,Ge={SEARCH_TERM:"grouped_filterable_list_search_term",ACTIVE_FILTERS:"grouped_filterable_list_active_filters",VIEW_MODE:"grouped_filterable_list_view_mode",EXPANDED_GROUPS:"grouped_filterable_list_expanded_groups",AUTO_EXPAND_MODE:"grouped_filterable_list_auto_expand_mode",CHAR_GRID_MODE:"grouped_filterable_list_char_grid_mode"},fo=({filter:e,value:t,onChange:r})=>{const[s,a]=m.useState(""),l=()=>{if(!e.groupOptions||!e.optionGroups)return{所有选项:e.options};const g={};e.optionGroups.forEach(y=>{const T=e.options.filter(h=>y.options.includes(h.value));T.length>0&&(g[y.label]=T)});const f=e.optionGroups.flatMap(y=>y.options),w=e.options.filter(y=>!f.includes(y.value));return w.length>0&&(g.其他=w),g},c=e.searchable&&s.trim()?e.options.filter(g=>g.label.toLowerCase().includes(s.toLowerCase())):e.options,u=l(),i=Object.keys(u).length>1;return d("div",{className:"relative",children:[d("select",{value:t||"all",onChange:g=>r(g.target.value),className:"px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]",children:[o("option",{value:"all",children:e.allLabel||`所有${e.label}`}),i?Object.entries(u).map(([g,f])=>o("optgroup",{label:g,children:f.map(w=>o("option",{value:w.value,children:w.label},w.value))},g)):c.map(g=>o("option",{value:g.value,children:g.label},g.value))]}),e.searchable&&o("div",{className:"absolute top-0 right-0 h-full flex items-center pr-2",children:o(Dn,{size:12,className:"text-gray-400"})})]})},bo=({mode:e,onModeChange:t,onClose:r})=>o("div",{className:"absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20",children:d("div",{className:"p-2",children:[o("div",{className:"text-xs font-medium text-gray-500 px-2 py-1",children:"不可用字显示方式"}),d("button",{onClick:()=>t("gray"),className:`w-full text-left px-3 py-2 text-sm rounded transition-colors ${e==="gray"?"bg-green-50 text-green-700":"hover:bg-gray-100 text-gray-700"}`,children:[d("div",{className:"flex items-center justify-between",children:[o("span",{children:"变灰显示"}),e==="gray"&&o("span",{className:"text-green-600",children:"✓"})]}),o("div",{className:"text-xs text-gray-400 mt-0.5",children:"不可用的字显示为灰色"})]}),d("button",{onClick:()=>t("hide"),className:`w-full text-left px-3 py-2 text-sm rounded transition-colors ${e==="hide"?"bg-green-50 text-green-700":"hover:bg-gray-100 text-gray-700"}`,children:[d("div",{className:"flex items-center justify-between",children:[o("span",{children:"隐藏"}),e==="hide"&&o("span",{className:"text-green-600",children:"✓"})]}),o("div",{className:"text-xs text-gray-400 mt-0.5",children:"直接隐藏不可用的字"})]})]})}),xo=({data:e=[],groupBy:t,filters:r=[],renderItem:s,renderGroupHeader:a,searchPlaceholder:l="搜索...",searchOptions:c={},showControls:u=!0,emptyMessage:i="暫無數據",rememberPreferences:g=!0,nameField:f="name"})=>{const w=()=>{if(!g)return null;try{const S=localStorage.getItem(Ge.SEARCH_TERM),N=localStorage.getItem(Ge.ACTIVE_FILTERS),O=localStorage.getItem(Ge.VIEW_MODE),q=localStorage.getItem(Ge.EXPANDED_GROUPS),J=localStorage.getItem(Ge.AUTO_EXPAND_MODE),oe=localStorage.getItem(Ge.CHAR_GRID_MODE);return{searchTerm:S||"",activeFilters:N?JSON.parse(N):{},viewMode:O||"grouped",expandedGroups:q?new Set(JSON.parse(q)):new Set,autoExpandMode:J||"all",charGridMode:oe||"gray"}}catch(S){return console.warn("加载保存的过滤状态失败:",S),null}},y=S=>{if(g)try{localStorage.setItem(Ge.SEARCH_TERM,S.searchTerm),localStorage.setItem(Ge.ACTIVE_FILTERS,JSON.stringify(S.activeFilters)),localStorage.setItem(Ge.VIEW_MODE,S.viewMode),localStorage.setItem(Ge.EXPANDED_GROUPS,JSON.stringify(Array.from(S.expandedGroups))),localStorage.setItem(Ge.AUTO_EXPAND_MODE,S.autoExpandMode),localStorage.setItem(Ge.CHAR_GRID_MODE,S.charGridMode)}catch(N){console.warn("保存过滤状态失败:",N)}},T=()=>{Object.values(Ge).forEach(S=>{localStorage.removeItem(S)})},h=w(),[v,k]=m.useState((h==null?void 0:h.searchTerm)||""),[I,U]=m.useState((h==null?void 0:h.activeFilters)||{}),[P,z]=m.useState((h==null?void 0:h.expandedGroups)||new Set),[Q,H]=m.useState((h==null?void 0:h.viewMode)||"grouped"),[te,$]=m.useState((h==null?void 0:h.autoExpandMode)||"all"),[Ce,ye]=m.useState(!!(h!=null&&h.searchTerm)||Object.keys((h==null?void 0:h.activeFilters)||{}).length>0),[Te,ie]=m.useState(!1),[re,be]=m.useState([]),[V,F]=m.useState((h==null?void 0:h.charGridMode)||"gray"),[xe,_e]=m.useState(!1),ce=m.useRef(!1),C=m.useRef(""),R=m.useRef(null);m.useEffect(()=>{const S=N=>{R.current&&!R.current.contains(N.target)&&_e(!1)};return document.addEventListener("mousedown",S),()=>document.removeEventListener("mousedown",S)},[]);const B=()=>JSON.stringify({searchTerm:v,activeFilters:I,selectedChars:re}),X=S=>typeof f=="function"?f(S):S[f]||"",_=m.useMemo(()=>{let S=e;if(v.trim()){const N=v.toLowerCase();S=S.filter(O=>(c.fields||Object.keys(O)).some(J=>{const oe=O[J];return oe&&oe.toString().toLowerCase().includes(N)}))}return r.forEach(N=>{const O=I[N.key];O&&O!=="all"&&(S=S.filter(q=>N.filterFn(q,O)))}),S},[e,v,I,r,c]),x=m.useMemo(()=>re.length===0?_:_.filter(S=>{const N=X(S);return N?re.every(O=>N.includes(O)):!1}),[_,re]),D=m.useMemo(()=>{if(re.length===0){const O=new Set;return _.forEach(q=>{const J=X(q);if(J)for(let oe of J)oe.trim()&&/[\u4e00-\u9fa5]/.test(oe)&&O.add(oe)}),O}const S=new Set,N=new Set;return x.forEach(O=>{const q=X(O);if(q)for(let J of q)J.trim()&&/[\u4e00-\u9fa5]/.test(J)&&N.add(J)}),N.forEach(O=>{if(re.includes(O)){S.add(O);return}const q=[...re,O];_.some(oe=>{const Se=X(oe);return Se?q.every(A=>Se.includes(A)):!1})&&S.add(O)}),S},[_,x,re]),ne=m.useMemo(()=>{const S=new Set;return _.forEach(O=>{const q=X(O);if(q)for(let J of q)J.trim()&&/[\u4e00-\u9fa5]/.test(J)&&S.add(J)}),Array.from(S).sort((O,q)=>O.localeCompare(q,"zh")).map(O=>({char:O,available:D.has(O)}))},[_,D]),Z=x,W=m.useMemo(()=>{let S=Z;if(t&&Q==="grouped"){const N={};return S.forEach(O=>{const q=t(O);N[q]||(N[q]=[]),N[q].push(O)}),N}return S},[Z,t,Q]);m.useEffect(()=>{if(ce.current){ce.current=!1;return}if(Q!=="grouped"||!t)return;const S=B();if(C.current!==S&&Object.keys(W).length>0){const O=new Set(Object.keys(W));te==="all"?z(O):te==="none"&&z(new Set)}C.current=S},[v,I,re,W,Q,t,te]);const We=S=>{const N=new Set(P);N.has(S)?N.delete(S):N.add(S),z(N);const O=Object.keys(W),q=O.length>0&&O.every(oe=>N.has(oe)),J=N.size===0;q&&te!=="all"?$("all"):J&&te!=="none"&&$("none")},ge=()=>{ce.current=!0;let S,N;P.size>0?(S=new Set,N="none"):(S=new Set(Object.keys(W)),N="all"),z(S),$(N)},tt=(S,N)=>{U(O=>({...O,[S]:N}))},se=()=>{k(""),U({}),be([]),z(new Set),$("none")},it=()=>{T(),k(""),U({}),be([]),z(new Set),H("grouped"),$("all"),F("gray"),ye(!1),ie(!1)},pe=(S,N)=>{!N&&!re.includes(S)||be(O=>O.includes(S)?O.filter(q=>q!==S):[...O,S])},Ye=()=>{ie(!0)},Pe=()=>{ie(!1)},Ae=()=>{be([])},Be=S=>{F(S),_e(!1)};m.useEffect(()=>{y({searchTerm:v,activeFilters:I,viewMode:Q,expandedGroups:P,autoExpandMode:te,charGridMode:V});const N=!!v||Object.values(I).some(O=>O&&O!=="all");ye(N)},[v,I,Q,P,te,V,g]);const Ve=Q==="grouped"&&t,Je=Ve?Object.keys(W).length>0:W.length>0,M=v||Object.values(I).some(S=>S&&S!=="all")||re.length>0,ee=Z.length,ae=_.length;return d("div",{className:"space-y-4",children:[u&&d("div",{className:"flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between",children:[d("div",{className:"flex-1 min-w-[200px] relative",children:[o(Dn,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400",size:16}),o("input",{type:"text",placeholder:l,value:v,onChange:S=>k(S.target.value),className:"w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"})]}),d("div",{className:"flex items-center gap-2",children:[t&&d(qe,{children:[o("button",{onClick:()=>H("flat"),className:`px-3 py-2 text-sm rounded-lg transition-colors ${Q==="flat"?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"列表视图"}),o("button",{onClick:()=>H("grouped"),className:`px-3 py-2 text-sm rounded-lg transition-colors ${Q==="grouped"?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"分组视图"})]}),d("button",{onClick:Ye,className:`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-1 ${Te||re.length>0?"bg-green-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,title:"按名字中的汉字快速过滤",children:[o(ur,{size:14}),"拆字过滤",re.length>0&&o("span",{className:"ml-1 bg-white text-green-700 rounded-full px-1.5 py-0.5 text-xs font-bold",children:re.length})]})]})]}),u&&r.length>0&&d("div",{className:"flex flex-wrap gap-3 items-center",children:[o(Br,{size:16,className:"text-gray-500"}),r.map(S=>o(fo,{filter:S,value:I[S.key]||"all",onChange:N=>tt(S.key,N)},S.key)),d("div",{className:"flex gap-2",children:[M&&o("button",{onClick:se,className:"px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors",children:"清除所有过滤"}),g&&Ce&&d("button",{onClick:it,className:"px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1",title:"清除保存的过滤偏好",children:[o(ha,{size:14}),"清除保存偏好"]})]})]}),re.length>0&&d("div",{className:"flex flex-wrap items-center gap-2 p-2 bg-blue-50 rounded-lg",children:[o("span",{className:"text-sm text-blue-700 font-medium",children:"当前过滤字："}),re.map(S=>d("span",{className:"inline-flex items-center gap-1 px-2 py-1 bg-blue-200 text-blue-800 rounded-md text-sm",children:[S,o("button",{onClick:()=>pe(S,!0),className:"hover:bg-blue-300 rounded-full p-0.5",children:o(Xt,{size:12})})]},S)),o("button",{onClick:Ae,className:"text-xs text-blue-600 hover:text-blue-800 ml-2",children:"清除全部"})]}),Te&&d("div",{className:"border border-green-200 rounded-lg bg-green-50 p-3",children:[d("div",{className:"flex justify-between items-center mb-2",children:[d("h3",{className:"text-sm font-medium text-green-800 flex items-center gap-1",children:[o(ur,{size:14}),"名字汉字过滤"]}),d("div",{className:"flex items-center gap-2",children:[d("div",{className:"relative",ref:R,children:[o("button",{onClick:()=>_e(!xe),className:"p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors",title:"显示设置",children:o(Wr,{size:16})}),xe&&o(bo,{mode:V,onModeChange:Be,onClose:()=>_e(!1)})]}),o("button",{onClick:Pe,className:"text-gray-500 hover:text-gray-700",children:o(Xt,{size:16})})]})]}),d("p",{className:"text-xs text-green-600 mb-2",children:["基于当前过滤结果中的名字提取（共 ",ne.length," 个不同汉字）",re.length>0&&d("span",{className:"ml-2",children:["当前匹配：",o("strong",{children:ee})," / ",ae," 个名字"]}),d("span",{className:"ml-2 text-gray-500",children:["（",V==="gray"?"不可用字变灰":"不可用字隐藏","）"]})]}),ne.length===0?o("p",{className:"text-sm text-gray-500 italic",children:"当前过滤结果中没有可提取的名字或汉字"}):o("div",{className:"flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1",children:ne.map(({char:S,available:N})=>{if(V==="hide"&&!N&&!re.includes(S))return null;const O=re.includes(S),q=N||O;return o("button",{onClick:()=>pe(S,q),disabled:!q,className:`
                      w-10 h-10 text-base font-medium rounded-lg transition-all
                      flex items-center justify-center
                      ${O?"bg-green-600 text-white shadow-md transform scale-105":q?"bg-white text-gray-700 border border-green-300 hover:bg-green-100 cursor-pointer":"bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50"}
                    `,title:q?"":"选择此字后无匹配结果",children:S},S)})}),d("div",{className:"flex justify-end mt-3 gap-2",children:[o("button",{onClick:Ae,className:"text-xs px-2 py-1 text-gray-600 hover:text-gray-800",children:"清除选中"}),o("button",{onClick:Pe,className:"text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700",children:"完成"})]})]}),u&&Ve&&Object.keys(W).length>0&&d("div",{className:"flex justify-between items-center",children:[d("span",{className:"text-sm text-gray-600",children:["共 ",Object.keys(W).length," 个分组"]}),o("button",{onClick:ge,className:"text-sm text-blue-600 hover:text-blue-800 transition-colors",children:P.size>0?"收起所有":"展开所有"})]}),o("div",{className:"border border-gray-200 rounded-lg overflow-hidden",children:Je?Ve?o("div",{className:"max-h-96 overflow-y-auto",children:Object.entries(W).map(([S,N])=>d("div",{className:"border-b border-gray-100 last:border-b-0",children:[o("div",{className:"p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors",onClick:()=>We(S),children:o("div",{className:"flex items-center justify-between",children:d("div",{className:"flex items-center gap-2",children:[P.has(S)?o(Kt,{size:16,className:"text-gray-600"}):o(Hr,{size:16,className:"text-gray-600"}),a?a(S,N.length,P.has(S)):d("span",{className:"font-semibold",children:[S," (",N.length,")"]})]})})}),P.has(S)&&o("div",{className:"bg-white",children:N.map((O,q)=>o("div",{className:`p-3 border-b border-gray-50 last:border-b-0 ${q%2===0?"bg-gray-50":"bg-white"}`,children:s(O,q)},O.id||q))})]},S))}):o("div",{className:"max-h-96 overflow-y-auto",children:W.map((S,N)=>o("div",{className:`p-3 border-b border-gray-100 last:border-b-0 ${N%2===0?"bg-gray-50":"bg-white"}`,children:s(S,N)},S.id||N))}):o("div",{className:"p-8 text-center text-gray-500",children:i})}),u&&Je&&d("div",{className:"text-sm text-gray-600 text-center",children:["显示 ",Ve?Object.values(W).reduce((S,N)=>S+N.length,0):W.length," 个项目",e.length>0&&d("span",{children:["（共 ",e.length," 个）"]})]})]})},En=({displayMode:e="expandable",className:t="",buttonClassName:r="px-4 py-2 text-white rounded-lg transition-colors text-sm",showLabels:s=!0,compact:a=!1,locations:l={from:"",to:"",hasLocationInfo:!1}})=>{const[c,u]=m.useState(!1),i=m.useRef(null);m.useEffect(()=>{const T=h=>{i.current&&!i.current.contains(h.target)&&u(!1)};return c&&document.addEventListener("mousedown",T),()=>{document.removeEventListener("mousedown",T)}},[c]);const g=()=>Ra.generateMapButtons(l),f=l.hasLocationInfo,w=a&&e==="all"?"compact":e;if(!f)return null;const y=g();if(w==="expandable"){const T=y[0],h=y.slice(1);return o("div",{className:`flex flex-col gap-2 ${t}`,children:d("div",{className:"relative",ref:i,children:[d("div",{className:"flex gap-2",children:[o("button",{onClick:T.onClick,className:`flex items-center flex-1 ${T.className} ${r}`,title:T.title,children:d("div",{className:"flex items-center",children:[o(Rt,{size:16,className:"mr-2"}),s&&o("span",{children:T.label})]})}),o("button",{onClick:()=>u(!c),className:`flex items-center justify-center w-10 ${T.className} ${r} hover:bg-opacity-90 transition-all duration-200`,title:c?"收起":"展开更多地图",children:o("span",{className:`inline-block w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white transition-all duration-200 ${c?"transform rotate-180":""}`})})]}),c&&o("div",{className:"absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-10 overflow-hidden",children:h.map(v=>d("button",{onClick:v.onClick,className:`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 hover:bg-gray-100 ${v.className}`,title:v.title,children:[o(Rt,{size:16,className:"mr-3 text-gray-600"}),s&&o("span",{className:"font-medium text-gray-800",children:v.label})]},v.key))})]})})}return w==="compact"?o("div",{className:`flex gap-2 ${t}`,children:y.map(T=>d("button",{onClick:T.onClick,className:`flex items-center ${T.className} ${r}`,title:T.title,children:[o(Rt,{size:16,className:"mr-1"}),s&&o("span",{children:T.label})]},T.key))}):o("div",{className:`flex flex-wrap gap-2 ${t}`,children:y.map(T=>d("button",{onClick:T.onClick,className:`flex items-center ${T.className} ${r}`,title:T.title,children:[o(Rt,{size:16,className:"mr-2"}),s&&o("span",{children:T.label})]},T.key))})},yo=()=>{const[e,t]=m.useState([]),[r,s]=m.useState(null),[a,l]=m.useState([]),[c,u]=m.useState(null),i=m.useCallback(()=>{t(st.getAllLocations()),u(st.loadDefaultFromLocation()),s(st.getLocationStats()),l(st.getAllDistricts())},[]);m.useEffect(()=>{i()},[i]);const g=m.useCallback(v=>st.addUserLocation(v)?(i(),!0):!1,[i]),f=m.useCallback((v,k)=>st.updateUserLocation(v,k)?(i(),!0):!1,[i]),w=m.useCallback(v=>st.removeUserLocation(v)?(i(),!0):!1,[i]),y=m.useCallback((v,k="")=>{st.setDefaultFromLocationType(v,k),i()},[i]),T=m.useCallback(v=>{const k=st.importSystemLocations(v);return i(),k},[i]),h=m.useCallback(()=>{st.resetAllData(),i()},[i]);return{locations:e,stats:r,districts:a,defaultFromSettings:c,addLocation:g,updateLocation:f,deleteLocation:w,setDefaultFrom:y,importSystemLocations:T,resetAll:h,reload:i}},wo=()=>m.useCallback(e=>{const t=e.name.toLowerCase(),r=lo.find(({keywords:s})=>s.some(a=>t.includes(a)));return(r==null?void 0:r.type)||null},[]),So=()=>{const e=m.useCallback(r=>({[Ie.USER_INPUT]:"bg-green-100 text-green-800",[Ie.AREA_SECTION]:"bg-blue-100 text-blue-800",[Ie.ROUTE_SECTION]:"bg-purple-100 text-purple-800"})[r]||"bg-gray-100 text-gray-800",[]),t=m.useCallback(r=>co[r]||"bg-gray-100 text-gray-800",[]);return{getSourceBadgeStyle:e,getDistrictColor:t}},ko=()=>{const[e,t]=m.useState(null),[r,s]=m.useState(""),a=m.useRef({}),l=m.useCallback(u=>{t(i=>i===u?null:u)},[]),c=m.useCallback(()=>t(null),[]);return{navigationMenu:e,customFromAddress:r,setCustomFromAddress:s,menuRefs:a,toggleMenu:l,closeMenu:c}},_o=(e,t)=>{const[r,s]=m.useState(!1),[a,l]=m.useState([]),c=m.useMemo(()=>e.filter(w=>w.source!==Ie.USER_INPUT),[e]),u=m.useCallback(()=>c.length===0?(alert("沒有可導入的系統地點"),!1):(l(c.map(w=>w.name)),s(!0),!0),[c]),i=m.useCallback(()=>{s(!1),l([])},[]),g=m.useCallback(()=>{const w=t(a);alert(`成功導入 ${w} 個地點到用戶自定義列表`),i()},[a,t,i]),f=m.useCallback(w=>{l(y=>y.includes(w)?y.filter(T=>T!==w):[...y,w])},[]);return{showDialog:r,selection:a,systemLocations:c,openDialog:u,closeDialog:i,executeImport:g,toggleSelection:f}},vo=(e,t,r)=>{const[s,a]=m.useState(""),l=m.useMemo(()=>{if(!s.trim())return e;const u=s.toLowerCase();return e.filter(i=>i.name.toLowerCase().includes(u)||i.district&&i.district.toLowerCase().includes(u)||i.sourceLabel.toLowerCase().includes(u)||i.correctAnswer&&i.correctAnswer.toLowerCase().includes(u))},[e,s]),c=m.useMemo(()=>[{key:"type",label:"類型",allLabel:"所有類型",options:Object.values(ke).map(u=>({value:u,label:$n[u],icon:gs[u]})),filterFn:(u,i)=>r(u)===i},{key:"source",label:"來源",allLabel:"所有來源",options:[{value:Ie.USER_INPUT,label:"用戶輸入"},{value:Ie.AREA_SECTION,label:"地方"},{value:Ie.ROUTE_SECTION,label:"路線"}],filterFn:(u,i)=>u.source===i},{key:"district",label:"地區",allLabel:"所有地區",options:t.map(u=>({value:u,label:u})),filterFn:(u,i)=>u.district===i,searchable:!0,searchPlaceholder:"搜索地區...",groupOptions:!0,optionGroups:[...Object.keys(pr).map(u=>({label:u,options:pr[u]})),{label:"其他",options:[]}]}],[t,r]);return{searchTerm:s,setSearchTerm:a,filteredLocations:l,filters:c}},To=({settings:e,locations:t,onSetDefault:r})=>{m.useCallback(()=>{if((e==null?void 0:e.type)==="current")return"當前位置";if((e==null?void 0:e.type)==="specific"&&(e!=null&&e.specificLocation))return e.specificLocation;if((e==null?void 0:e.type)==="random"&&t.length>0){const c=Math.floor(Math.random()*t.length);return t[c].name}return""},[e,t]);const[s,a]=m.useState({open:!1,search:""}),l=m.useMemo(()=>t.filter(c=>c.name.toLowerCase().includes(s.search.toLowerCase())),[t,s.search]);return d("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4",children:[d("h4",{className:"font-semibold text-blue-800 mb-3 flex items-center",children:[o(Rt,{className:"mr-2",size:18}),"默認出發地點設置"]}),d("div",{className:"space-y-3",children:[d("div",{className:"flex items-center gap-4",children:[d("label",{className:"flex items-center",children:[o("input",{type:"radio",checked:(e==null?void 0:e.type)==="random",onChange:()=>r("random"),className:"mr-2"}),d("span",{className:"flex items-center",children:[o(Nn,{size:16,className:"mr-1"}),"隨機地點"]})]}),d("label",{className:"flex items-center",children:[o("input",{type:"radio",checked:(e==null?void 0:e.type)==="specific",onChange:()=>{var c;return r("specific",(e==null?void 0:e.specificLocation)||((c=t[0])==null?void 0:c.name))},className:"mr-2"}),o("span",{children:"指定地點"})]}),d("label",{className:"flex items-center",children:[o("input",{type:"radio",checked:(e==null?void 0:e.type)==="current",onChange:()=>r("current",""),className:"mr-2"}),o("span",{className:"flex items-center",children:"當前位置"})]})]}),(e==null?void 0:e.type)==="specific"&&o("div",{className:"bg-green-50 border border-green-200 rounded-lg p-3",children:d("div",{className:"flex items-center justify-between",children:[d("div",{className:"flex items-center gap-2",children:[o(qr,{size:16,className:"text-green-500"}),o("span",{className:"text-sm text-green-800 font-medium",children:e!=null&&e.specificLocation?`當前默認: ${e.specificLocation}`:"未設置默認地點"})]}),d("div",{className:"flex gap-2",children:[o("button",{onClick:()=>a({open:!0,search:""}),className:"text-xs text-blue-600 hover:text-blue-800",children:"選擇地點"}),(e==null?void 0:e.specificLocation)&&o("button",{onClick:()=>r("specific",""),className:"text-xs text-red-600 hover:text-red-800",children:"清除"})]})]})}),(e==null?void 0:e.type)==="current"&&o("div",{className:"bg-purple-50 border border-purple-200 rounded-lg p-3",children:o("div",{className:"flex items-center justify-between",children:o("div",{className:"flex items-center gap-2",children:o("span",{className:"text-sm text-purple-800 font-medium",children:"將使用當前設備位置作為出發地點"})})})}),d("div",{className:"text-sm text-gray-700 bg-white p-3 rounded border",children:[o("strong",{children:"當前默認出發地點:"})," ",(e==null?void 0:e.type)==="random"?o("span",{className:"text-blue-600",children:"隨機選擇（每次不同）"}):(e==null?void 0:e.type)==="current"?o("span",{className:"text-purple-600",children:"當前位置（實時獲取）"}):o("span",{className:"text-green-600",children:(e==null?void 0:e.specificLocation)||"未設置"})]})]}),s.open&&o(No,{locations:l,searchTerm:s.search,onSearchChange:c=>a(u=>({...u,search:c})),onSelect:c=>{r("specific",c.name),a({open:!1,search:""})},onClose:()=>a({open:!1,search:""})})]})},No=({locations:e,searchTerm:t,onSearchChange:r,onSelect:s,onClose:a})=>{const[l,c]=m.useState(-1);return m.useEffect(()=>{const u=i=>{switch(i.key){case"Escape":a();break}};return document.addEventListener("keydown",u),()=>document.removeEventListener("keydown",u)},[a]),o("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",children:d("div",{className:"bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col",children:[d("div",{className:"p-4 border-b",children:[o("h4",{className:"font-semibold",children:"選擇默認出發地點"}),o("input",{type:"text",placeholder:"搜索地點...",value:t,onChange:u=>r(u.target.value),className:"mt-2 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",autoFocus:!0})]}),o("div",{className:"flex-1 overflow-y-auto p-2",children:e.length===0?o("div",{className:"text-center text-gray-500 py-8",children:"暫無匹配地點"}):e.map((u,i)=>d("button",{onClick:()=>s(u),onMouseEnter:()=>c(i),className:`w-full text-left p-3 rounded transition-colors ${l===i?"bg-blue-50":"hover:bg-gray-50"}`,children:[o("div",{className:"font-medium",children:u.name}),o("div",{className:"text-xs text-gray-500",children:u.district})]},u.name))}),o("div",{className:"p-3 border-t flex justify-end",children:o("button",{onClick:a,className:"px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400",children:"取消"})})]})})},Co=({stats:e,locations:t,getLocationType:r})=>{const s=m.useMemo(()=>Object.values(ke).filter(u=>t.some(i=>r(i)===u)).length,[t,r]),a=m.useMemo(()=>t.filter(u=>r(u)).length,[t,r]);if(!e)return null;const l=[{label:"總地點數",value:e.total,color:"gray"},{label:"用戶自定義",value:e.userDefined,color:"green"},{label:"甲部-地方",value:e.fromAreaSection,color:"blue"},{label:"甲部-路線",value:e.fromRouteSection,color:"purple"},{label:"地區數量",value:e.districts,color:"orange"},{label:"平均每區",value:(e.total/Math.max(e.districts,1)).toFixed(1),color:"red"},{label:"類型數量",value:s,color:"indigo"},{label:"已分類地點",value:a,color:"cyan"}],c={gray:"bg-gray-50 text-gray-800",green:"bg-green-50 text-green-800",blue:"bg-blue-50 text-blue-800",purple:"bg-purple-50 text-purple-800",orange:"bg-orange-50 text-orange-800",red:"bg-red-50 text-red-800",indigo:"bg-indigo-50 text-indigo-800",cyan:"bg-cyan-50 text-cyan-800"};return o("div",{className:"grid grid-cols-2 md:grid-cols-8 gap-3 mt-4 text-sm",children:l.map((u,i)=>d("div",{className:`${c[u.color]} p-3 rounded text-center`,children:[o("div",{className:"font-semibold",children:u.value}),o("div",{className:"text-xs opacity-75",children:u.label})]},i))})},Ro=({location:e,index:t,isDefaultFrom:r,onSetDefault:s,onEdit:a,onDelete:l,getDefaultFrom:c,getSourceBadgeStyle:u,getDistrictColor:i,getLocationType:g,navigationState:f,renderNavigationMenu:w})=>{const y=g(e),T=y?gs[y]:null;return d("div",{className:"flex items-center justify-between",children:[d("div",{className:"flex items-center gap-3",children:[o("div",{className:"flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full text-xs font-medium text-gray-700",children:t+1}),d("div",{children:[d("div",{className:"font-medium text-gray-800 flex items-center gap-2",children:[e.name,e.correctAnswer&&` (${e.correctAnswer})`,T&&o(T,{size:14,className:"text-gray-500"})]}),d("div",{className:"flex gap-2 mt-1 flex-wrap",children:[o("span",{className:`text-xs px-2 py-1 rounded ${u(e.source)}`,children:e.sourceLabel}),e.district&&o("span",{className:`text-xs px-2 py-1 rounded ${i(e.district)}`,children:e.district}),y&&o("span",{className:"text-xs px-2 py-1 rounded bg-gray-100 text-gray-800",children:$n[y]})]})]})]}),d("div",{className:"flex items-center gap-2",children:[o("div",{className:"w-24",children:o(En,{compact:!0,showLabels:!1,locations:{from:c(),to:e.name,hasLocationInfo:!0},buttonClassName:"p-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"})}),o("button",{onClick:()=>s(e.name),className:`p-1 rounded transition-colors ${r?"text-green-600 bg-green-100":"text-blue-600 hover:bg-blue-100"}`,title:"設為默認出發地點",children:o(Rt,{size:14})}),e.source===Ie.USER_INPUT&&d(qe,{children:[o("button",{onClick:()=>a(e),className:"p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors",title:"編輯",children:o(ya,{size:14})}),o("button",{onClick:()=>l(e.name),className:"p-1 text-red-600 hover:bg-red-100 rounded transition-colors",title:"刪除",children:o(wa,{size:14})})]}),w(e),r&&o(qr,{size:16,className:"text-green-500",title:"當前默認地點"})]})]})},Eo=({show:e,locations:t,selection:r,onToggle:s,onConfirm:a,onCancel:l})=>e?o("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",children:d("div",{className:"bg-white rounded-lg max-w-md w-full p-6",children:[o("h4",{className:"font-semibold text-gray-800 mb-3",children:"導入系統地點"}),o("p",{className:"text-sm text-gray-600 mb-4",children:"選擇要導入到用戶自定義列表的系統地點："}),o("div",{className:"max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 mb-4",children:t.map(c=>d("label",{className:"flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer",children:[o("input",{type:"checkbox",checked:r.includes(c.name),onChange:()=>s(c.name),className:"mr-2"}),d("span",{children:[c.name," (",c.sourceLabel,")"]})]},c.name))}),d("div",{className:"flex justify-end gap-3",children:[o("button",{onClick:l,className:"px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400",children:"取消"}),o("button",{onClick:a,disabled:r.length===0,className:"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed",children:"導入選中地點"})]})]})}):null,zn=()=>{const{locations:e,stats:t,districts:r,defaultFromSettings:s,addLocation:a,updateLocation:l,deleteLocation:c,setDefaultFrom:u,importSystemLocations:i,resetAll:g,reload:f}=yo(),w=wo(),{getSourceBadgeStyle:y,getDistrictColor:T}=So(),h=ko(),[v,k]=m.useState(null),[I,U]=m.useState(""),{searchTerm:P,setSearchTerm:z,filteredLocations:Q,filters:H}=vo(e,r,w),te=_o(e,i),$=m.useCallback(()=>{if((s==null?void 0:s.type)==="specific"&&(s!=null&&s.specificLocation))return s.specificLocation;if((s==null?void 0:s.type)==="random"&&e.length>0){const V=Math.floor(Math.random()*e.length);return e[V].name}return""},[s,e]),Ce=m.useCallback(()=>{I.trim()&&a(I)&&U("")},[I,a]),ye=m.useCallback(()=>{!v||!I.trim()||l(v.name,I)&&(k(null),U(""))},[v,I,l]),Te=m.useCallback(V=>{window.confirm(`確定要刪除地點 "${V}" 嗎？`)&&c(V)},[c]),ie=m.useCallback((V,F="")=>{V==="specific"&&!F||u(V,F)},[u]),re=m.useCallback(()=>{window.confirm("確定要重置所有地點數據嗎？這將刪除所有用戶自定義地點和設置。")&&g()},[g]),be=m.useCallback(V=>{const F=h.navigationMenu===V.name;return d("div",{className:"relative",ref:xe=>h.menuRefs.current[V.name]=xe,children:[o("button",{onClick:()=>h.toggleMenu(V.name),className:"p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors",title:"導航選項",children:o(ma,{size:14})}),F&&o("div",{className:"absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]",children:d("div",{className:"p-2",children:[d("div",{className:"text-xs text-gray-500 mb-2",children:["導航到 ",V.name]}),o("div",{className:"mb-2",children:o(En,{displayMode:"all",showLabels:!0,locations:{from:$(),to:V.name,hasLocationInfo:!0},className:"flex-col gap-1",buttonClassName:"w-full justify-start px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"})}),o("div",{className:"my-2 border-t border-gray-200"}),o("div",{className:"mb-2",children:o("input",{type:"text",placeholder:"輸入出發地址...",value:h.customFromAddress,onChange:xe=>h.setCustomFromAddress(xe.target.value),className:"w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"})}),o("div",{className:"mb-2",children:o(En,{displayMode:"all",showLabels:!0,locations:{from:h.customFromAddress,to:V.name,hasLocationInfo:!!h.customFromAddress.trim()},className:"flex-col gap-1",buttonClassName:"w-full justify-start px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"})})]})})]})},[h,$]);return m.useEffect(()=>{const V=F=>{if(!(F.clientX>document.documentElement.clientWidth||F.clientY>document.documentElement.clientHeight)&&h.navigationMenu){const _e=h.menuRefs.current[h.navigationMenu];_e&&!_e.contains(F.target)&&h.closeMenu()}};return h.navigationMenu&&document.addEventListener("mousedown",V),()=>document.removeEventListener("mousedown",V)},[h]),d("div",{className:"space-y-6",children:[o(To,{settings:s,locations:e,onSetDefault:ie}),d("div",{children:[d("div",{className:"flex items-center justify-between mb-4",children:[o("h4",{className:"font-semibold text-gray-700",children:"地點列表管理"}),d("div",{className:"flex items-center gap-2",children:[d("button",{onClick:te.openDialog,className:"flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm",children:[o(ga,{size:14,className:"mr-1"}),"導入系統地點"]}),d("button",{onClick:re,className:"flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm",children:[o(Gr,{size:14,className:"mr-1"}),"重置所有"]})]})]}),t&&d("div",{className:"text-sm text-gray-600 mb-4",children:["共 ",t.total," 個地點，分佈在 ",t.districts," 個地區"]}),d("div",{className:"flex gap-2 mb-4",children:[o("input",{type:"text",placeholder:v?"編輯地點名稱...":"輸入新地點名稱...",value:I,onChange:V=>U(V.target.value),onKeyPress:V=>V.key==="Enter"&&(v?ye():Ce()),className:"flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"}),v?d(qe,{children:[o("button",{onClick:ye,className:"px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors","aria-label":"保存",children:o(fa,{size:16})}),o("button",{onClick:()=>{k(null),U("")},className:"px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors","aria-label":"取消",children:o(Xt,{size:16})})]}):o("button",{onClick:Ce,className:"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors","aria-label":"添加",children:o(ba,{size:16})})]}),o(xo,{data:Q,groupBy:V=>V.district||"未分類",filters:H,rememberPreferences:!0,renderItem:(V,F)=>o(Ro,{location:V,index:F,isDefaultFrom:(s==null?void 0:s.type)==="specific"&&(s==null?void 0:s.specificLocation)===V.name,onSetDefault:xe=>ie("specific",xe),onEdit:xe=>{k(xe),U(xe.name)},onDelete:Te,getDefaultFrom:$,getSourceBadgeStyle:y,getDistrictColor:T,getLocationType:w,navigationState:h,renderNavigationMenu:be}),renderGroupHeader:(V,F)=>d("div",{className:"flex items-center gap-2",children:[o(xa,{size:14}),d("span",{className:"font-semibold",children:[V," (",F," 個地點)"]})]}),searchPlaceholder:"搜索地點、地區...",searchValue:P,onSearchChange:z,searchOptions:{fields:["name","sourceLabel","district"],customFilter:(V,F)=>{const xe=w(V);return(xe?$n[xe]:"").toLowerCase().includes(F.toLowerCase())}},emptyMessage:"暫無地點數據"}),o(Co,{stats:t,locations:e,getLocationType:w})]}),o(Eo,{show:te.showDialog,locations:te.systemLocations,selection:te.selection,onToggle:te.toggleSelection,onConfirm:te.executeImport,onCancel:te.closeDialog})]})},Ao=Object.freeze(Object.defineProperty({__proto__:null,default:zn},Symbol.toStringTag,{value:"Module"})),Lo=()=>{const[e,t]=m.useState(""),[r,s]=m.useState(null),[a,l]=m.useState(null),[c,u]=m.useState(0),[i,g]=m.useState([]),[f,w]=m.useState({text:"",startTime:0,endTime:5,type:"1"}),[y,T]=m.useState(!1),[h,v]=m.useState([]),[k,I]=m.useState(null),[U,P]=m.useState(""),z=m.useRef(null),Q=m.useRef(null),H=m.useRef(null),te=m.useRef(null),$={container:{position:"relative",width:"100%",maxWidth:y?"none":"1100px",margin:y?"0":"20px auto",fontFamily:"sans-serif",background:"#0f0f12",color:"#ffffff",borderRadius:y?"0":"16px",overflow:"hidden",boxShadow:"0 10px 30px rgba(0,0,0,0.5)"},videoBox:{position:"relative",width:"100%",aspectRatio:y?"auto":"16/9",height:y?"100vh":"auto",background:"#000"},overlay:{position:"absolute",top:"30px",right:"30px",zIndex:2147483647,textAlign:"right",pointerEvents:"none",width:"50%"},highlightText:{background:"rgba(255, 230, 0, 0.25)",color:"#fff",fontSize:"clamp(18px, 4vw, 28px)",fontWeight:"800",textShadow:"0 2px 8px rgba(0,0,0,1)",padding:"10px 20px",borderRadius:"4px",display:"inline-block",marginBottom:"10px",backdropFilter:"blur(10px)",borderRight:"6px solid #ff0055",letterSpacing:"0.5px"},controlPanel:{padding:"24px",background:"#16161e",borderTop:"1px solid #2a2a35"},input:{flex:1,padding:"12px 15px",background:"#252530",color:"#ffffff",border:"1px solid #3f3f50",borderRadius:"8px",fontSize:"14px",outline:"none"},button:{padding:"10px 20px",borderRadius:"8px",border:"none",cursor:"pointer",fontWeight:"600",background:"#3d5afe",color:"white"},noteItem:C=>({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px",marginBottom:"8px",background:C?"#2d2d45":"#1f1f2b",borderRadius:"8px",border:C?"1px solid #3d5afe":"1px solid #2d2d3d",transition:"all 0.3s ease",transform:C?"scale(1.02)":"scale(1)",boxShadow:C?"0 4px 12px rgba(61, 90, 254, 0.3)":"none"})},Ce=C=>{const R=C.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);return R?R[1]:null},ye=C=>`yt_notes_v_${C}`,Te=C=>{g(C),r&&localStorage.setItem(ye(r),JSON.stringify(C))},ie=m.useCallback(()=>{te.current&&clearInterval(te.current),te.current=setInterval(()=>{if(H.current&&H.current.getCurrentTime){const C=H.current.getCurrentTime();u(C)}},200)},[]),re=m.useCallback(()=>{te.current&&clearInterval(te.current)},[]);m.useEffect(()=>{if(!r)return;const C=i.filter(R=>c>=R.startTime&&c<=R.endTime);if(v(C),H.current){const R=C.find(B=>B.type==="skip"||B.type==="0");if(R){H.current.seekTo?H.current.seekTo(R.endTime,!0):setTimeout(()=>{H.current.seekTo(R.endTime,!0)},1e3),u(R.endTime);return}if(H.current.setPlaybackRate){const B=C.some(X=>X.type==="fast");H.current.setPlaybackRate(B?10:1)}}},[c,i,r]),m.useEffect(()=>{if(r){const C=localStorage.getItem(ye(r));g(C?JSON.parse(C):[])}},[r]),m.useEffect(()=>{if(h.length>0&&_e.current){const C=h[0].id,R=document.getElementById(`note-${C}`),B=_e.current;if(R){const X=R.offsetTop,_=R.offsetHeight,x=B.offsetHeight,D=B.scrollTop,ne=X+_>D+x,Z=X<D;(ne||Z)&&B.scrollTo({top:X-10,behavior:"smooth"})}}},[h]);const be=m.useCallback(C=>{H.current&&H.current.destroy(),H.current=new window.YT.Player(Q.current,{videoId:C,width:"100%",height:"100%",playerVars:{autoplay:1,controls:1,modestbranding:1},events:{onReady:R=>{l(R.target),ie()},onStateChange:R=>{R.data===window.YT.PlayerState.PLAYING?ie():R.data===window.YT.PlayerState.PAUSED&&re()}}})},[ie,re]),V=C=>{var x;if(!r||!f.text&&C=="1")return;const R=Math.floor(((x=H.current)==null?void 0:x.getCurrentTime())||c),B=R>f.startTime?R:f.startTime+2,X={...f,endTime:B,id:Date.now(),vid:r};let _=i.length>0?i[i.length-1]:null;_&&C==_.type&&_.text==X.text?(X.text=f.text,_.endTime=B,Te([...i])):(X.type=C,Te([...i,X]),w({...f,startTime:B}))},F=C=>{const R=i.map(B=>B.id===C?{...B,text:U}:B);Te(R),I(null)},xe=C=>{Te(i.filter(R=>R.id!==C))};m.useEffect(()=>{const C=localStorage.getItem("last_v_url");if(C&&t(C),!window.YT){const R=document.createElement("script");R.src="https://www.youtube.com/iframe_api",document.body.appendChild(R)}return()=>re()},[re]),m.useLayoutEffect(()=>{const C=()=>T(!!document.fullscreenElement);return document.addEventListener("fullscreenchange",C),()=>document.removeEventListener("fullscreenchange",C)},[]);const _e=m.useRef(null),ce=C=>{const R=i.map(B=>{if(B.id===C){let X;return B.type=="1"?X=10:B.type==10?X=0:X="1",{...B,type:X}}return B});Te(R)};return d("div",{ref:z,style:$.container,children:[d("div",{style:$.videoBox,children:[o("div",{ref:Q,style:{width:"100%",height:"100%"}}),d("div",{style:$.overlay,children:[h.map(C=>d("div",{style:$.highlightText,children:[(C.type==="fast"||C.type==10)&&"⏩ 10X: ",(C.type==="skip"||C.type=="0")&&"⏭️ SKIP: ",C.text]},C.id)),f.text&&d("div",{style:{...$.highlightText,borderRightColor:"#3d5afe",opacity:.8},children:[(n.type==="fast"||n.type==10)&&"⏩ ",(n.type==="skip"||n.type=="0")&&"⏭️ ",f.text]})]})]}),d("div",{style:$.controlPanel,children:[!y&&d("div",{style:{display:"flex",gap:"10px",marginBottom:"20px"},children:[o("input",{style:$.input,placeholder:"Paste YouTube Link...",value:e,onChange:C=>t(C.target.value)}),o("button",{style:{...$.button,background:"#00c853"},onClick:()=>{const C=Ce(e);C&&(s(C),be(C),localStorage.setItem("last_v_url",e))},children:"Load Video"}),o("button",{style:{...$.button,background:"#555"},onClick:()=>z.current.requestFullscreen(),children:"⛶ Fullscreen"})]}),d("div",{style:{background:"#252530",padding:"20px",borderRadius:"12px",border:"1px solid #333"},children:[d("h4",{style:{margin:"0 0 15px 0",color:"#3d5afe"},children:["✎ Video specific Note (",f.startTime,"-",Math.floor(c),")s"]}),d("div",{style:{display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"flex-end"},children:[o("input",{style:$.input,value:f.text,onChange:C=>w({...f,text:C.target.value}),placeholder:"Note Content",onFocus:C=>w({...f,text:""})}),o("button",{onClick:()=>V(1),style:{...$.button,background:"#3d5afe",minWidth:"20px"},children:"1x"}),o("button",{onClick:()=>V(10),style:{...$.button,background:"#3d5afe",minWidth:"20px"},children:"10x"}),o("button",{onClick:()=>V(0),style:{...$.button,background:"#3d5afe",minWidth:"20px"},children:"Skip"}),d("button",{onClick:()=>w({...f,startTime:Math.floor(c)}),style:{...$.button,background:"#444"},children:["Mark Start(",Math.floor(c),")"]})]})]}),d("div",{style:{marginTop:"25px"},children:[d("h4",{style:{borderBottom:"1px solid #333",paddingBottom:"10px"},children:["Notes for: ",o("span",{style:{color:"#00c853"},children:r||"No video loaded"})]}),o("div",{ref:_e,style:{maxHeight:"400px",overflowY:"auto",paddingRight:"5px",position:"relative",overscrollBehavior:"contain"},children:i.sort((C,R)=>C.startTime-R.startTime).map(C=>{const R=h.some(B=>B.id===C.id);return d("div",{id:`note-${C.id}`,style:$.noteItem(R),children:[d("div",{style:{flex:1},children:[d("span",{style:{color:C.type==="fast"?"#ff0055":C.type==="skip"?"#3d5afe":"#00e676",fontWeight:"bold",marginRight:"10px"},children:[C.startTime,"s - ",C.endTime,"s ",C.type==="skip"&&"⏭️"]}),k===C.id?o("input",{autoFocus:!0,style:{...$.input,padding:"4px"},value:U,onChange:B=>P(B.target.value),onBlur:()=>F(C.id),onKeyDown:B=>B.key==="Enter"&&F(C.id)}):o("span",{style:{color:"#eee"},onDoubleClick:()=>{I(C.id),P(C.text)},children:C.text})]}),d("div",{style:{display:"flex",gap:"8px"},children:[o("button",{onClick:()=>ce(C.id),children:C.type==1?"Normal":C.type==10?"⏩ 10x":"⏭️ Skip"}),o("button",{style:{...$.button,padding:"5px 10px",background:"#333",display:"flex",alignItems:"center",justifyContent:"center"},onClick:()=>{H.current.seekTo(C.startTime,!0),u(C.startTime)},title:"跳转到该时间点",children:o("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:o("polygon",{points:"5 3 19 12 5 21 5 3"})})}),o("button",{style:{...$.button,padding:"5px 10px",background:"#b71c1c",display:"flex",alignItems:"center",justifyContent:"center"},onClick:()=>xe(C.id),title:"删除笔记",children:d("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[o("path",{d:"M3 6h18"}),o("path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"}),o("line",{x1:"10",y1:"11",x2:"10",y2:"17"}),o("line",{x1:"14",y1:"11",x2:"14",y2:"17"})]})})]})]},C.id)})})]})]}),o("style",{children:`
        input:-webkit-autofill { -webkit-text-fill-color: #ffffff !important; -webkit-box-shadow: 0 0 0px 1000px #252530 inset !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #444; borderRadius: 3px; }
      `})]})},Oo=Object.freeze(Object.defineProperty({__proto__:null,default:Lo},Symbol.toStringTag,{value:"Module"})),Io=`根据香港运输署及规划署等公开资料，以下是九龙城的主要道路及连接路网口述清单。

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

 “想象一下，九龙城的道路像一条鱼的骨架。**太子道西**是这条鱼最外围的轮廓，**衙前围道**是贯穿鱼身中央的**脊骨**。而**侯王道、狮子石道、南角道**这些美食街，就是一根根**鱼刺**，一头连接着主干道的喧嚣，另一头通向宁静的住宅区。如果你想从九龙塘过来，可以通过**联合道**到达；如果你想去土瓜湾，往**马头涌道**走就对了。”`,Po=`根據公開資料，九龍灣的道路網絡可以分為三大類：**東西向的對外快速公路**、**南北向的區內主幹道**，以及**工商業區的密集街道**。

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
> **最內層**是工商業區的內部街道——認路有個竅門：**『宏』字頭**（宏光道、宏開道）的街道多在商貿區北面，**『臨』字頭**（臨澤街、臨華街）的則在南面靠海。記住這個規律，在九龍灣找路會容易很多。」`,Do=`元朗的道路网络，可以说是一个“新旧并存、内外有别”的格局。与屯门那种沿海而建的狭长形态不同，元朗平原的广阔地势让这里的路网呈现出**放射状与棋盘式交织**的特点——既有环绕新市镇的快速公路，也有极具辨识度的“大马路”和以“元朗”命名的传统街道。

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

希望这份口述能帮助你在脑海中构建起元朗清晰的路网图景。`,Mo=`北区的道路网络，可以说是「南北交汇、新旧并存」。与屯门、元朗那种单一新市镇的形态不同，北区由**上水、粉岭、沙头角、打鼓岭**四个分区组成。这里的道路既有贯穿全区的高速公路，也有四条历史悠久的边界公路，以及新市镇内棋盘式的新旧街道。

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
> 最后提醒一点：**沙头角**和**打鼓岭**部分区域仍是边境禁区，去那边要先办好禁区纸，否则在担水坑就会被请下车。」`,$o=`啟德是新舊交織的區域，道路網絡主要分為**對外連接幹道**和**區內新建道路**兩大類。以下是按功能分類的口述清單：

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
> 簡單來說，認準『承』字頭的幾條路——**承啟道**、**承豐道**——基本上就不會在啟德迷路了。`,zo=`大埔的道路网络，呈现出“**一脊两翼、内外分层**”的格局。与棋盘式的将军澳或环状放射的屯门不同，大埔依山傍海，由林村河谷冲积平原发展而成，道路布局具有很强的**南北向特征**——一条高速公路贯穿全区，多层区内干道将其与各个住宅区紧密相连。

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
> 未来还有一个重要工程——**沙田绕道**，等它通车后，从大埔去九龙就不用再挤吐露港公路了，尤其对于住在康乐园、太和一带的居民，会方便很多。」`,Fo=`将军澳的道路网络，就像一张层次分明的棋盘，随着新市镇的逐步发展而不断向外延伸。与观塘、九龙湾那些由旧工业区自然生长出来的路网不同，将军澳的道路是经过整体规划的，因此呈现出非常清晰的功能分区和命名规律。

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

希望这份道路导览能帮助你在脑海中构建起将军澳清晰的路网图景。`,jo=`屯门的道路网络，可以说是「内外有别，新旧分明」。它的核心骨架由**一条横向快速公路**和**一条纵向区内干道**交织而成，而近年来落成的跨海通道，更是彻底改变了屯门对外交通的格局。

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

希望这份口述能帮助你在脑海中构建起屯门清晰的路网图景。`,Uo=`新蒲崗的道路網絡，可以說是香港工業區路網的經典範例。與將軍澳那種規劃整齊的新市鎮不同，這裡的街道像一張有規律的棋盤，街道命名不僅極具特色，更有著明確的「數字密碼」和清晰的層次結構。

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

希望這份口述能幫助你建構新蒲崗的路網圖景。`,Ho=`沙田的道路网络，就像一张精心编织的「环状蜘蛛网」。与九龙那种棋盘格状的旧区不同，沙田作为香港最大规模的新市镇之一，道路规划围绕著城门河和山谷地形展开，呈现出非常清晰的**环状放射结构**。

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

希望这份口述能帮助你在脑海中构建起沙田清晰的路网图景。`,Bo=`油尖旺区作为九龙半岛的交通中枢，其道路网络主要分为三大板块：**贯通南北的主干道及快速路**、**连接东西的横向道路**，以及**各区的特色街道**。以下为你逐一梳理。

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

希望这份列表能帮你理清油尖旺区的道路脉络。如果你需要了解某个特定景点（比如海港城或朗豪坊）的周边道路情况，我可以再为你详细介绍。`,Wo=`根据香港运输署、地政总署等官方资料，深水埗的道路网络大致可分为**内街市集**、**主要干道**和**对外连接路**三类。为了让你有个整体的概念，下面按功能分区，以口述的形式为你梳理深水埗的主要道路：

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

如果你需要查询某条特定街道的具体位置，或者想了解某个路段附近的特色，随时可以再问我。`,Go=`根据公开资料，红磡区的道路网络主要分为**历史悠久的旧区街道**和**填海发展形成的新区干道**两大板块。

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

> “红磡的路网可以分成新、旧两块来看。**旧区**以**马头围道**和**蕪湖街**为十字骨架，周围密布着**宝其利街**、**机利士南路**这类窄街，那里很有老香港的生活气息，步行可达。**新区**则集中在填海区，**红磡道**是那里的南北大动脉，串联起**黄埔花园**的德民街和**海逸豪园**。如果要去红馆看演唱会，认准**畅运道**就行了；如果想避开塞车，走**红磡绕道**会顺很多。”`,qo=`荃湾作为新界西的交通枢纽，道路网络大致可以分为两类：一类是像青山公路和荃湾路这样的区域性主干道，负责连接屯门、九龙及机场；另一类则是深入市中心、服务街坊的内街，如众安街、沙咀道等。以下为你分层列出荃湾的主要道路及连接路：

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

希望这份清单能帮助你更清晰地了解荃湾的道路网络。`,Yo=`好的，根据您的要求，以下是荃湾及青衣地区所有主要道路和连接路的口述列表。

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
-   **大涌道 (Tai Chung Road)**：荃湾西部的南北向主干道，连接**青山公路**与**荃湾路**，是进入荃湾市中心前的重要分流道路。`,Vo=`根据公开的道路资料，荔枝角（及相邻的美孚）的主要道路和连接路如下。为了方便你口述，已按照**东西向**和**南北向**进行了大致归类：

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

以上就是荔枝角的主要道路网络。如果你是用于录制视频或现场播报，建议将第一类作为主轴介绍，第二类作为辅助补充。希望对你有帮助！`,Qo=`观塘的道路网络，就像是九龙东的交通枢纽。与规划整齐的启德或九龙湾不同，这里新旧交织，既有早年工业区留下的紧凑街道，也有连接全市的交通大动脉。

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

希望这份口述能帮助你在脑中构建起观塘的路网地图。如果你是想重点了解某一区域（比如观塘市中心重建区、海滨一带）的详细路径，可以随时告诉我，我再为你展开细说。`,Ko=`根据现有资料，香港长沙湾片区的主要道路和连接路如下。需要说明的是，这份列表主要涵盖该区域的核心干道与著名街道，可能无法穷尽所有小巷。

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

如果想了解其中某条道路的更多细节，或者想知道这些道路附近有什么好去处，都可以告诉我。`,Jo=`青衣岛上纵横交错的道路网络主要分为三个部分：连接全岛的“大动脉”、服务社区内部的“毛细血管”，以及快速出入岛的“连接通道”。下面为你逐一介绍。

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

如果想了解某条特定道路的沿线地标或交通状况，可以随时告诉我，我会为你详细介绍。`,Xo=`

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
> 大水坑、富安花园那一带算马鞍山的**南入口**，乌溪沙算**北尽头**。整个马鞍山就是从大水坑到乌溪沙这一条狭长的地带。」`;function Fn(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var xt=Fn();function xs(e){xt=e}var ft={exec:()=>null};function vt(e){let t=[];return r=>{let s=Math.max(0,Math.min(3,r-1)),a=t[s];return a||(a=e(s),t[s]=a),a}}function de(e,t=""){let r=typeof e=="string"?e:e.source,s={replace:(a,l)=>{let c=typeof l=="string"?l:l.source;return c=c.replace(je.caret,"$1"),r=r.replace(a,c),s},getRegex:()=>new RegExp(r,t)};return s}var Zo=((e="")=>{try{return!!new RegExp("(?<=1)(?<!1)"+e)}catch{return!1}})(),je={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] +\S/,listReplaceTask:/^\[[ xX]\] +/,listTaskCheckbox:/\[[ xX]\]/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:e=>new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:vt(e=>new RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),hrRegex:vt(e=>new RegExp(`^ {0,${e}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)),fencesBeginRegex:vt(e=>new RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),headingBeginRegex:vt(e=>new RegExp(`^ {0,${e}}#`)),htmlBeginRegex:vt(e=>new RegExp(`^ {0,${e}}<(?:[a-z].*>|!--)`,"i")),blockquoteBeginRegex:vt(e=>new RegExp(`^ {0,${e}}>`))},el=/^(?:[ \t]*(?:\n|$))+/,tl=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,nl=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,Ft=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,rl=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,jn=/ {0,3}(?:[*+-]|\d{1,9}[.)])/,ys=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,ws=de(ys).replace(/bull/g,jn).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),sl=de(ys).replace(/bull/g,jn).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),Un=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,al=/^[^\n]+/,Hn=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,ol=de(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",Hn).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),ll=de(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g,jn).getRegex(),sn="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",Bn=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,il=de("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",Bn).replace("tag",sn).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),Ss=de(Un).replace("hr",Ft).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",sn).getRegex(),cl=de(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",Ss).getRegex(),Wn={blockquote:cl,code:tl,def:ol,fences:nl,heading:rl,hr:Ft,html:il,lheading:ws,list:ll,newline:el,paragraph:Ss,table:ft,text:al},fr=de("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",Ft).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",sn).getRegex(),ul={...Wn,lheading:sl,table:fr,paragraph:de(Un).replace("hr",Ft).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",fr).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",sn).getRegex()},dl={...Wn,html:de(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",Bn).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:ft,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:de(Un).replace("hr",Ft).replace("heading",` *#{1,6} *[^
]`).replace("lheading",ws).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},pl=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,hl=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,ks=/^( {2,}|\\)\n(?!\s*$)/,ml=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,At=/[\p{P}\p{S}]/u,an=/[\s\p{P}\p{S}]/u,Gn=/[^\s\p{P}\p{S}]/u,gl=de(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,an).getRegex(),_s=/(?!~)[\p{P}\p{S}]/u,fl=/(?!~)[\s\p{P}\p{S}]/u,bl=/(?:[^\s\p{P}\p{S}]|~)/u,xl=de(/link|precode-code|html/,"g").replace("link",/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-",Zo?"(?<!`)()":"(^^|[^`])").replace("code",/(?<b>`+)[^`]+\k<b>(?!`)/).replace("html",/<(?! )[^<>]*?>/).getRegex(),vs=/^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/,yl=de(vs,"u").replace(/punct/g,At).getRegex(),wl=de(vs,"u").replace(/punct/g,_s).getRegex(),Ts="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",Sl=de(Ts,"gu").replace(/notPunctSpace/g,Gn).replace(/punctSpace/g,an).replace(/punct/g,At).getRegex(),kl=de(Ts,"gu").replace(/notPunctSpace/g,bl).replace(/punctSpace/g,fl).replace(/punct/g,_s).getRegex(),_l=de("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,Gn).replace(/punctSpace/g,an).replace(/punct/g,At).getRegex(),vl=de(/^~~?(?:((?!~)punct)|[^\s~])/,"u").replace(/punct/g,At).getRegex(),Tl="^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)",Nl=de(Tl,"gu").replace(/notPunctSpace/g,Gn).replace(/punctSpace/g,an).replace(/punct/g,At).getRegex(),Cl=de(/\\(punct)/,"gu").replace(/punct/g,At).getRegex(),Rl=de(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),El=de(Bn).replace("(?:-->|$)","-->").getRegex(),Al=de("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",El).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),Zt=/(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/,Ll=de(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label",Zt).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),Ns=de(/^!?\[(label)\]\[(ref)\]/).replace("label",Zt).replace("ref",Hn).getRegex(),Cs=de(/^!?\[(ref)\](?:\[\])?/).replace("ref",Hn).getRegex(),Ol=de("reflink|nolink(?!\\()","g").replace("reflink",Ns).replace("nolink",Cs).getRegex(),br=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,qn={_backpedal:ft,anyPunctuation:Cl,autolink:Rl,blockSkip:xl,br:ks,code:hl,del:ft,delLDelim:ft,delRDelim:ft,emStrongLDelim:yl,emStrongRDelimAst:Sl,emStrongRDelimUnd:_l,escape:pl,link:Ll,nolink:Cs,punctuation:gl,reflink:Ns,reflinkSearch:Ol,tag:Al,text:ml,url:ft},Il={...qn,link:de(/^!?\[(label)\]\((.*?)\)/).replace("label",Zt).getRegex(),reflink:de(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",Zt).getRegex()},An={...qn,emStrongRDelimAst:kl,emStrongLDelim:wl,delLDelim:vl,delRDelim:Nl,url:de(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol",br).replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:de(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol",br).getRegex()},Pl={...An,br:de(ks).replace("{2,}","*").getRegex(),text:de(An.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},qt={normal:Wn,gfm:ul,pedantic:dl},It={normal:qn,gfm:An,breaks:Pl,pedantic:Il},Dl={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},xr=e=>Dl[e];function ot(e,t){if(t){if(je.escapeTest.test(e))return e.replace(je.escapeReplace,xr)}else if(je.escapeTestNoEncode.test(e))return e.replace(je.escapeReplaceNoEncode,xr);return e}function yr(e){try{e=encodeURI(e).replace(je.percentDecode,"%")}catch{return null}return e}function wr(e,t){var l;let r=e.replace(je.findPipe,(c,u,i)=>{let g=!1,f=u;for(;--f>=0&&i[f]==="\\";)g=!g;return g?"|":" |"}),s=r.split(je.splitPipe),a=0;if(s[0].trim()||s.shift(),s.length>0&&!((l=s.at(-1))!=null&&l.trim())&&s.pop(),t)if(s.length>t)s.splice(t);else for(;s.length<t;)s.push("");for(;a<s.length;a++)s[a]=s[a].trim().replace(je.slashPipe,"|");return s}function dt(e,t,r){let s=e.length;if(s===0)return"";let a=0;for(;a<s;){let l=e.charAt(s-a-1);if(l===t&&!r)a++;else if(l!==t&&r)a++;else break}return e.slice(0,s-a)}function Sr(e){let t=e.split(`
`),r=t.length-1;for(;r>=0&&je.blankLine.test(t[r]);)r--;return t.length-r<=2?e:t.slice(0,r+1).join(`
`)}function Ml(e,t){if(e.indexOf(t[1])===-1)return-1;let r=0;for(let s=0;s<e.length;s++)if(e[s]==="\\")s++;else if(e[s]===t[0])r++;else if(e[s]===t[1]&&(r--,r<0))return s;return r>0?-2:-1}function $l(e,t=0){let r=t,s="";for(let a of e)if(a==="	"){let l=4-r%4;s+=" ".repeat(l),r+=l}else s+=a,r++;return s}function kr(e,t,r,s,a){let l=t.href,c=t.title||null,u=e[1].replace(a.other.outputLinkReplace,"$1");s.state.inLink=!0;let i={type:e[0].charAt(0)==="!"?"image":"link",raw:r,href:l,title:c,text:u,tokens:s.inlineTokens(u)};return s.state.inLink=!1,i}function zl(e,t,r){let s=e.match(r.other.indentCodeCompensation);if(s===null)return t;let a=s[1];return t.split(`
`).map(l=>{let c=l.match(r.other.beginningSpace);if(c===null)return l;let[u]=c;return u.length>=a.length?l.slice(a.length):l}).join(`
`)}var en=class{constructor(e){we(this,"options");we(this,"rules");we(this,"lexer");this.options=e||xt}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:"space",raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let r=this.options.pedantic?t[0]:Sr(t[0]),s=r.replace(this.rules.other.codeRemoveIndent,"");return{type:"code",raw:r,codeBlockStyle:"indented",text:s}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let r=t[0],s=zl(r,t[3]||"",this.rules);return{type:"code",raw:r,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):t[2],text:s}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let r=t[2].trim();if(this.rules.other.endingHash.test(r)){let s=dt(r,"#");(this.options.pedantic||!s||this.rules.other.endingSpaceChar.test(s))&&(r=s.trim())}return{type:"heading",raw:dt(t[0],`
`),depth:t[1].length,text:r,tokens:this.lexer.inline(r)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return{type:"hr",raw:dt(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let r=dt(t[0],`
`).split(`
`),s="",a="",l=[];for(;r.length>0;){let c=!1,u=[],i;for(i=0;i<r.length;i++)if(this.rules.other.blockquoteStart.test(r[i]))u.push(r[i]),c=!0;else if(!c)u.push(r[i]);else break;r=r.slice(i);let g=u.join(`
`),f=g.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");s=s?`${s}
${g}`:g,a=a?`${a}
${f}`:f;let w=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(f,l,!0),this.lexer.state.top=w,r.length===0)break;let y=l.at(-1);if((y==null?void 0:y.type)==="code")break;if((y==null?void 0:y.type)==="blockquote"){let T=y,h=T.raw+`
`+r.join(`
`),v=this.blockquote(h);l[l.length-1]=v,s=s.substring(0,s.length-T.raw.length)+v.raw,a=a.substring(0,a.length-T.text.length)+v.text;break}else if((y==null?void 0:y.type)==="list"){let T=y,h=T.raw+`
`+r.join(`
`),v=this.list(h);l[l.length-1]=v,s=s.substring(0,s.length-y.raw.length)+v.raw,a=a.substring(0,a.length-T.raw.length)+v.raw,r=h.substring(l.at(-1).raw.length).split(`
`);continue}}return{type:"blockquote",raw:s,tokens:l,text:a}}}list(e){let t=this.rules.block.list.exec(e);if(t){let r=t[1].trim(),s=r.length>1,a={type:"list",raw:"",ordered:s,start:s?+r.slice(0,-1):"",loose:!1,items:[]};r=s?`\\d{1,9}\\${r.slice(-1)}`:`\\${r}`,this.options.pedantic&&(r=s?r:"[*+-]");let l=this.rules.other.listItemRegex(r),c=!1;for(;e;){let i=!1,g="",f="";if(!(t=l.exec(e))||this.rules.block.hr.test(e))break;g=t[0],e=e.substring(g.length);let w=$l(t[2].split(`
`,1)[0],t[1].length),y=e.split(`
`,1)[0],T=!w.trim(),h=0;if(this.options.pedantic?(h=2,f=w.trimStart()):T?h=t[1].length+1:(h=w.search(this.rules.other.nonSpaceChar),h=h>4?1:h,f=w.slice(h),h+=t[1].length),T&&this.rules.other.blankLine.test(y)&&(g+=y+`
`,e=e.substring(y.length+1),i=!0),!i){let v=this.rules.other.nextBulletRegex(h),k=this.rules.other.hrRegex(h),I=this.rules.other.fencesBeginRegex(h),U=this.rules.other.headingBeginRegex(h),P=this.rules.other.htmlBeginRegex(h),z=this.rules.other.blockquoteBeginRegex(h);for(;e;){let Q=e.split(`
`,1)[0],H;if(y=Q,this.options.pedantic?(y=y.replace(this.rules.other.listReplaceNesting,"  "),H=y):H=y.replace(this.rules.other.tabCharGlobal,"    "),I.test(y)||U.test(y)||P.test(y)||z.test(y)||v.test(y)||k.test(y))break;if(H.search(this.rules.other.nonSpaceChar)>=h||!y.trim())f+=`
`+H.slice(h);else{if(T||w.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||I.test(w)||U.test(w)||k.test(w))break;f+=`
`+y}T=!y.trim(),g+=Q+`
`,e=e.substring(Q.length+1),w=H.slice(h)}}a.loose||(c?a.loose=!0:this.rules.other.doubleBlankLine.test(g)&&(c=!0)),a.items.push({type:"list_item",raw:g,task:!!this.options.gfm&&this.rules.other.listIsTask.test(f),loose:!1,text:f,tokens:[]}),a.raw+=g}let u=a.items.at(-1);if(u)u.raw=u.raw.trimEnd(),u.text=u.text.trimEnd();else return;a.raw=a.raw.trimEnd();for(let i of a.items){this.lexer.state.top=!1,i.tokens=this.lexer.blockTokens(i.text,[]);let g=i.tokens[0];if(i.task&&((g==null?void 0:g.type)==="text"||(g==null?void 0:g.type)==="paragraph")){i.text=i.text.replace(this.rules.other.listReplaceTask,""),g.raw=g.raw.replace(this.rules.other.listReplaceTask,""),g.text=g.text.replace(this.rules.other.listReplaceTask,"");for(let w=this.lexer.inlineQueue.length-1;w>=0;w--)if(this.rules.other.listIsTask.test(this.lexer.inlineQueue[w].src)){this.lexer.inlineQueue[w].src=this.lexer.inlineQueue[w].src.replace(this.rules.other.listReplaceTask,"");break}let f=this.rules.other.listTaskCheckbox.exec(i.raw);if(f){let w={type:"checkbox",raw:f[0]+" ",checked:f[0]!=="[ ]"};i.checked=w.checked,a.loose?i.tokens[0]&&["paragraph","text"].includes(i.tokens[0].type)&&"tokens"in i.tokens[0]&&i.tokens[0].tokens?(i.tokens[0].raw=w.raw+i.tokens[0].raw,i.tokens[0].text=w.raw+i.tokens[0].text,i.tokens[0].tokens.unshift(w)):i.tokens.unshift({type:"paragraph",raw:w.raw,text:w.raw,tokens:[w]}):i.tokens.unshift(w)}}else i.task&&(i.task=!1);if(!a.loose){let f=i.tokens.filter(y=>y.type==="space"),w=f.length>0&&f.some(y=>this.rules.other.anyLine.test(y.raw));a.loose=w}}if(a.loose)for(let i of a.items){i.loose=!0;for(let g of i.tokens)g.type==="text"&&(g.type="paragraph")}return a}}html(e){let t=this.rules.block.html.exec(e);if(t){let r=Sr(t[0]);return{type:"html",block:!0,raw:r,pre:t[1]==="pre"||t[1]==="script"||t[1]==="style",text:r}}}def(e){let t=this.rules.block.def.exec(e);if(t){let r=t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),s=t[2]?t[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",a=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):t[3];return{type:"def",tag:r,raw:dt(t[0],`
`),href:s,title:a}}}table(e){var c;let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let r=wr(t[1]),s=t[2].replace(this.rules.other.tableAlignChars,"").split("|"),a=(c=t[3])!=null&&c.trim()?t[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],l={type:"table",raw:dt(t[0],`
`),header:[],align:[],rows:[]};if(r.length===s.length){for(let u of s)this.rules.other.tableAlignRight.test(u)?l.align.push("right"):this.rules.other.tableAlignCenter.test(u)?l.align.push("center"):this.rules.other.tableAlignLeft.test(u)?l.align.push("left"):l.align.push(null);for(let u=0;u<r.length;u++)l.header.push({text:r[u],tokens:this.lexer.inline(r[u]),header:!0,align:l.align[u]});for(let u of a)l.rows.push(wr(u,l.header.length).map((i,g)=>({text:i,tokens:this.lexer.inline(i),header:!1,align:l.align[g]})));return l}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t){let r=t[1].trim();return{type:"heading",raw:dt(t[0],`
`),depth:t[2].charAt(0)==="="?1:2,text:r,tokens:this.lexer.inline(r)}}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let r=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return{type:"paragraph",raw:t[0],text:r,tokens:this.lexer.inline(r)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return{type:"text",raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return{type:"escape",raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){let t=this.rules.inline.link.exec(e);if(t){let r=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(r)){if(!this.rules.other.endAngleBracket.test(r))return;let l=dt(r.slice(0,-1),"\\");if((r.length-l.length)%2===0)return}else{let l=Ml(t[2],"()");if(l===-2)return;if(l>-1){let c=(t[0].indexOf("!")===0?5:4)+t[1].length+l;t[2]=t[2].substring(0,l),t[0]=t[0].substring(0,c).trim(),t[3]=""}}let s=t[2],a="";if(this.options.pedantic){let l=this.rules.other.pedanticHrefTitle.exec(s);l&&(s=l[1],a=l[3])}else a=t[3]?t[3].slice(1,-1):"";return s=s.trim(),this.rules.other.startAngleBracket.test(s)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(r)?s=s.slice(1):s=s.slice(1,-1)),kr(t,{href:s&&s.replace(this.rules.inline.anyPunctuation,"$1"),title:a&&a.replace(this.rules.inline.anyPunctuation,"$1")},t[0],this.lexer,this.rules)}}reflink(e,t){let r;if((r=this.rules.inline.reflink.exec(e))||(r=this.rules.inline.nolink.exec(e))){let s=(r[2]||r[1]).replace(this.rules.other.multipleSpaceGlobal," "),a=t[s.toLowerCase()];if(!a){let l=r[0].charAt(0);return{type:"text",raw:l,text:l}}return kr(r,a,r[0],this.lexer,this.rules)}}emStrong(e,t,r=""){let s=this.rules.inline.emStrongLDelim.exec(e);if(!(!s||!s[1]&&!s[2]&&!s[3]&&!s[4]||s[4]&&r.match(this.rules.other.unicodeAlphaNumeric))&&(!(s[1]||s[3])||!r||this.rules.inline.punctuation.exec(r))){let a=[...s[0]].length-1,l,c,u=a,i=0,g=s[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(g.lastIndex=0,t=t.slice(-1*e.length+a);(s=g.exec(t))!==null;){if(l=s[1]||s[2]||s[3]||s[4]||s[5]||s[6],!l)continue;if(c=[...l].length,s[3]||s[4]){u+=c;continue}else if((s[5]||s[6])&&a%3&&!((a+c)%3)){i+=c;continue}if(u-=c,u>0)continue;c=Math.min(c,c+u+i);let f=[...s[0]][0].length,w=e.slice(0,a+s.index+f+c);if(Math.min(a,c)%2){let T=w.slice(1,-1);return{type:"em",raw:w,text:T,tokens:this.lexer.inlineTokens(T)}}let y=w.slice(2,-2);return{type:"strong",raw:w,text:y,tokens:this.lexer.inlineTokens(y)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let r=t[2].replace(this.rules.other.newLineCharGlobal," "),s=this.rules.other.nonSpaceChar.test(r),a=this.rules.other.startingSpaceChar.test(r)&&this.rules.other.endingSpaceChar.test(r);return s&&a&&(r=r.substring(1,r.length-1)),{type:"codespan",raw:t[0],text:r}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return{type:"br",raw:t[0]}}del(e,t,r=""){let s=this.rules.inline.delLDelim.exec(e);if(s&&(!s[1]||!r||this.rules.inline.punctuation.exec(r))){let a=[...s[0]].length-1,l,c,u=a,i=this.rules.inline.delRDelim;for(i.lastIndex=0,t=t.slice(-1*e.length+a);(s=i.exec(t))!==null;){if(l=s[1]||s[2]||s[3]||s[4]||s[5]||s[6],!l||(c=[...l].length,c!==a))continue;if(s[3]||s[4]){u+=c;continue}if(u-=c,u>0)continue;c=Math.min(c,c+u);let g=[...s[0]][0].length,f=e.slice(0,a+s.index+g+c),w=f.slice(a,-a);return{type:"del",raw:f,text:w,tokens:this.lexer.inlineTokens(w)}}}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let r,s;return t[2]==="@"?(r=t[1],s="mailto:"+r):(r=t[1],s=r),{type:"link",raw:t[0],text:r,href:s,tokens:[{type:"text",raw:r,text:r}]}}}url(e){var r;let t;if(t=this.rules.inline.url.exec(e)){let s,a;if(t[2]==="@")s=t[0],a="mailto:"+s;else{let l;do l=t[0],t[0]=((r=this.rules.inline._backpedal.exec(t[0]))==null?void 0:r[0])??"";while(l!==t[0]);s=t[0],t[1]==="www."?a="http://"+t[0]:a=t[0]}return{type:"link",raw:t[0],text:s,href:a,tokens:[{type:"text",raw:s,text:s}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let r=this.lexer.state.inRawBlock;return{type:"text",raw:t[0],text:t[0],escaped:r}}}},Ze=class Ln{constructor(t){we(this,"tokens");we(this,"options");we(this,"state");we(this,"inlineQueue");we(this,"tokenizer");this.tokens=[],this.tokens.links=Object.create(null),this.options=t||xt,this.options.tokenizer=this.options.tokenizer||new en,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};let r={other:je,block:qt.normal,inline:It.normal};this.options.pedantic?(r.block=qt.pedantic,r.inline=It.pedantic):this.options.gfm&&(r.block=qt.gfm,this.options.breaks?r.inline=It.breaks:r.inline=It.gfm),this.tokenizer.rules=r}static get rules(){return{block:qt,inline:It}}static lex(t,r){return new Ln(r).lex(t)}static lexInline(t,r){return new Ln(r).inlineTokens(t)}lex(t){t=t.replace(je.carriageReturn,`
`),this.blockTokens(t,this.tokens);for(let r=0;r<this.inlineQueue.length;r++){let s=this.inlineQueue[r];this.inlineTokens(s.src,s.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(t,r=[],s=!1){var l,c,u;this.tokenizer.lexer=this,this.options.pedantic&&(t=t.replace(je.tabCharGlobal,"    ").replace(je.spaceLine,""));let a=1/0;for(;t;){if(t.length<a)a=t.length;else{this.infiniteLoopError(t.charCodeAt(0));break}let i;if((c=(l=this.options.extensions)==null?void 0:l.block)!=null&&c.some(f=>(i=f.call({lexer:this},t,r))?(t=t.substring(i.raw.length),r.push(i),!0):!1))continue;if(i=this.tokenizer.space(t)){t=t.substring(i.raw.length);let f=r.at(-1);i.raw.length===1&&f!==void 0?f.raw+=`
`:r.push(i);continue}if(i=this.tokenizer.code(t)){t=t.substring(i.raw.length);let f=r.at(-1);(f==null?void 0:f.type)==="paragraph"||(f==null?void 0:f.type)==="text"?(f.raw+=(f.raw.endsWith(`
`)?"":`
`)+i.raw,f.text+=`
`+i.text,this.inlineQueue.at(-1).src=f.text):r.push(i);continue}if(i=this.tokenizer.fences(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.heading(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.hr(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.blockquote(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.list(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.html(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.def(t)){t=t.substring(i.raw.length);let f=r.at(-1);(f==null?void 0:f.type)==="paragraph"||(f==null?void 0:f.type)==="text"?(f.raw+=(f.raw.endsWith(`
`)?"":`
`)+i.raw,f.text+=`
`+i.raw,this.inlineQueue.at(-1).src=f.text):this.tokens.links[i.tag]||(this.tokens.links[i.tag]={href:i.href,title:i.title},r.push(i));continue}if(i=this.tokenizer.table(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.lheading(t)){t=t.substring(i.raw.length),r.push(i);continue}let g=t;if((u=this.options.extensions)!=null&&u.startBlock){let f=1/0,w=t.slice(1),y;this.options.extensions.startBlock.forEach(T=>{y=T.call({lexer:this},w),typeof y=="number"&&y>=0&&(f=Math.min(f,y))}),f<1/0&&f>=0&&(g=t.substring(0,f+1))}if(this.state.top&&(i=this.tokenizer.paragraph(g))){let f=r.at(-1);s&&(f==null?void 0:f.type)==="paragraph"?(f.raw+=(f.raw.endsWith(`
`)?"":`
`)+i.raw,f.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=f.text):r.push(i),s=g.length!==t.length,t=t.substring(i.raw.length);continue}if(i=this.tokenizer.text(t)){t=t.substring(i.raw.length);let f=r.at(-1);(f==null?void 0:f.type)==="text"?(f.raw+=(f.raw.endsWith(`
`)?"":`
`)+i.raw,f.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=f.text):r.push(i);continue}if(t){this.infiniteLoopError(t.charCodeAt(0));break}}return this.state.top=!0,r}inline(t,r=[]){return this.inlineQueue.push({src:t,tokens:r}),r}inlineTokens(t,r=[]){var g,f,w,y,T;this.tokenizer.lexer=this;let s=t,a=null;if(this.tokens.links){let h=Object.keys(this.tokens.links);if(h.length>0)for(;(a=this.tokenizer.rules.inline.reflinkSearch.exec(s))!==null;)h.includes(a[0].slice(a[0].lastIndexOf("[")+1,-1))&&(s=s.slice(0,a.index)+"["+"a".repeat(a[0].length-2)+"]"+s.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(a=this.tokenizer.rules.inline.anyPunctuation.exec(s))!==null;)s=s.slice(0,a.index)+"++"+s.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);let l;for(;(a=this.tokenizer.rules.inline.blockSkip.exec(s))!==null;)l=a[2]?a[2].length:0,s=s.slice(0,a.index+l)+"["+"a".repeat(a[0].length-l-2)+"]"+s.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);s=((f=(g=this.options.hooks)==null?void 0:g.emStrongMask)==null?void 0:f.call({lexer:this},s))??s;let c=!1,u="",i=1/0;for(;t;){if(t.length<i)i=t.length;else{this.infiniteLoopError(t.charCodeAt(0));break}c||(u=""),c=!1;let h;if((y=(w=this.options.extensions)==null?void 0:w.inline)!=null&&y.some(k=>(h=k.call({lexer:this},t,r))?(t=t.substring(h.raw.length),r.push(h),!0):!1))continue;if(h=this.tokenizer.escape(t)){t=t.substring(h.raw.length),r.push(h);continue}if(h=this.tokenizer.tag(t)){t=t.substring(h.raw.length),r.push(h);continue}if(h=this.tokenizer.link(t)){t=t.substring(h.raw.length),r.push(h);continue}if(h=this.tokenizer.reflink(t,this.tokens.links)){t=t.substring(h.raw.length);let k=r.at(-1);h.type==="text"&&(k==null?void 0:k.type)==="text"?(k.raw+=h.raw,k.text+=h.text):r.push(h);continue}if(h=this.tokenizer.emStrong(t,s,u)){t=t.substring(h.raw.length),r.push(h);continue}if(h=this.tokenizer.codespan(t)){t=t.substring(h.raw.length),r.push(h);continue}if(h=this.tokenizer.br(t)){t=t.substring(h.raw.length),r.push(h);continue}if(h=this.tokenizer.del(t,s,u)){t=t.substring(h.raw.length),r.push(h);continue}if(h=this.tokenizer.autolink(t)){t=t.substring(h.raw.length),r.push(h);continue}if(!this.state.inLink&&(h=this.tokenizer.url(t))){t=t.substring(h.raw.length),r.push(h);continue}let v=t;if((T=this.options.extensions)!=null&&T.startInline){let k=1/0,I=t.slice(1),U;this.options.extensions.startInline.forEach(P=>{U=P.call({lexer:this},I),typeof U=="number"&&U>=0&&(k=Math.min(k,U))}),k<1/0&&k>=0&&(v=t.substring(0,k+1))}if(h=this.tokenizer.inlineText(v)){t=t.substring(h.raw.length),h.raw.slice(-1)!=="_"&&(u=h.raw.slice(-1)),c=!0;let k=r.at(-1);(k==null?void 0:k.type)==="text"?(k.raw+=h.raw,k.text+=h.text):r.push(h);continue}if(t){this.infiniteLoopError(t.charCodeAt(0));break}}return r}infiniteLoopError(t){let r="Infinite loop on byte: "+t;if(this.options.silent)console.error(r);else throw new Error(r)}},tn=class{constructor(e){we(this,"options");we(this,"parser");this.options=e||xt}space(e){return""}code({text:e,lang:t,escaped:r}){var l;let s=(l=(t||"").match(je.notSpaceStart))==null?void 0:l[0],a=e.replace(je.endingNewline,"")+`
`;return s?'<pre><code class="language-'+ot(s)+'">'+(r?a:ot(a,!0))+`</code></pre>
`:"<pre><code>"+(r?a:ot(a,!0))+`</code></pre>
`}blockquote({tokens:e}){return`<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return""}heading({tokens:e,depth:t}){return`<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return`<hr>
`}list(e){let t=e.ordered,r=e.start,s="";for(let c=0;c<e.items.length;c++){let u=e.items[c];s+=this.listitem(u)}let a=t?"ol":"ul",l=t&&r!==1?' start="'+r+'"':"";return"<"+a+l+`>
`+s+"</"+a+`>
`}listitem(e){return`<li>${this.parser.parse(e.tokens)}</li>
`}checkbox({checked:e}){return"<input "+(e?'checked="" ':"")+'disabled="" type="checkbox"> '}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>
`}table(e){let t="",r="";for(let a=0;a<e.header.length;a++)r+=this.tablecell(e.header[a]);t+=this.tablerow({text:r});let s="";for(let a=0;a<e.rows.length;a++){let l=e.rows[a];r="";for(let c=0;c<l.length;c++)r+=this.tablecell(l[c]);s+=this.tablerow({text:r})}return s&&(s=`<tbody>${s}</tbody>`),`<table>
<thead>
`+t+`</thead>
`+s+`</table>
`}tablerow({text:e}){return`<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),r=e.header?"th":"td";return(e.align?`<${r} align="${e.align}">`:`<${r}>`)+t+`</${r}>
`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${ot(e,!0)}</code>`}br(e){return"<br>"}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,tokens:r}){let s=this.parser.parseInline(r),a=yr(e);if(a===null)return s;e=a;let l='<a href="'+e+'"';return t&&(l+=' title="'+ot(t)+'"'),l+=">"+s+"</a>",l}image({href:e,title:t,text:r,tokens:s}){s&&(r=this.parser.parseInline(s,this.parser.textRenderer));let a=yr(e);if(a===null)return ot(r);e=a;let l=`<img src="${e}" alt="${ot(r)}"`;return t&&(l+=` title="${ot(t)}"`),l+=">",l}text(e){return"tokens"in e&&e.tokens?this.parser.parseInline(e.tokens):"escaped"in e&&e.escaped?e.text:ot(e.text)}},Yn=class{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return""+e}image({text:e}){return""+e}br(){return""}checkbox({raw:e}){return e}},et=class On{constructor(t){we(this,"options");we(this,"renderer");we(this,"textRenderer");this.options=t||xt,this.options.renderer=this.options.renderer||new tn,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new Yn}static parse(t,r){return new On(r).parse(t)}static parseInline(t,r){return new On(r).parseInline(t)}parse(t){var s,a;this.renderer.parser=this;let r="";for(let l=0;l<t.length;l++){let c=t[l];if((a=(s=this.options.extensions)==null?void 0:s.renderers)!=null&&a[c.type]){let i=c,g=this.options.extensions.renderers[i.type].call({parser:this},i);if(g!==!1||!["space","hr","heading","code","table","blockquote","list","html","def","paragraph","text"].includes(i.type)){r+=g||"";continue}}let u=c;switch(u.type){case"space":{r+=this.renderer.space(u);break}case"hr":{r+=this.renderer.hr(u);break}case"heading":{r+=this.renderer.heading(u);break}case"code":{r+=this.renderer.code(u);break}case"table":{r+=this.renderer.table(u);break}case"blockquote":{r+=this.renderer.blockquote(u);break}case"list":{r+=this.renderer.list(u);break}case"checkbox":{r+=this.renderer.checkbox(u);break}case"html":{r+=this.renderer.html(u);break}case"def":{r+=this.renderer.def(u);break}case"paragraph":{r+=this.renderer.paragraph(u);break}case"text":{r+=this.renderer.text(u);break}default:{let i='Token with "'+u.type+'" type was not found.';if(this.options.silent)return console.error(i),"";throw new Error(i)}}}return r}parseInline(t,r=this.renderer){var a,l;this.renderer.parser=this;let s="";for(let c=0;c<t.length;c++){let u=t[c];if((l=(a=this.options.extensions)==null?void 0:a.renderers)!=null&&l[u.type]){let g=this.options.extensions.renderers[u.type].call({parser:this},u);if(g!==!1||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(u.type)){s+=g||"";continue}}let i=u;switch(i.type){case"escape":{s+=r.text(i);break}case"html":{s+=r.html(i);break}case"link":{s+=r.link(i);break}case"image":{s+=r.image(i);break}case"checkbox":{s+=r.checkbox(i);break}case"strong":{s+=r.strong(i);break}case"em":{s+=r.em(i);break}case"codespan":{s+=r.codespan(i);break}case"br":{s+=r.br(i);break}case"del":{s+=r.del(i);break}case"text":{s+=r.text(i);break}default:{let g='Token with "'+i.type+'" type was not found.';if(this.options.silent)return console.error(g),"";throw new Error(g)}}}return s}},Qt,$t=(Qt=class{constructor(e){we(this,"options");we(this,"block");this.options=e||xt}preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(e=this.block){return e?Ze.lex:Ze.lexInline}provideParser(e=this.block){return e?et.parse:et.parseInline}},we(Qt,"passThroughHooks",new Set(["preprocess","postprocess","processAllTokens","emStrongMask"])),we(Qt,"passThroughHooksRespectAsync",new Set(["preprocess","postprocess","processAllTokens"])),Qt),Fl=class{constructor(...e){we(this,"defaults",Fn());we(this,"options",this.setOptions);we(this,"parse",this.parseMarkdown(!0));we(this,"parseInline",this.parseMarkdown(!1));we(this,"Parser",et);we(this,"Renderer",tn);we(this,"TextRenderer",Yn);we(this,"Lexer",Ze);we(this,"Tokenizer",en);we(this,"Hooks",$t);this.use(...e)}walkTokens(e,t){var s,a;let r=[];for(let l of e)switch(r=r.concat(t.call(this,l)),l.type){case"table":{let c=l;for(let u of c.header)r=r.concat(this.walkTokens(u.tokens,t));for(let u of c.rows)for(let i of u)r=r.concat(this.walkTokens(i.tokens,t));break}case"list":{let c=l;r=r.concat(this.walkTokens(c.items,t));break}default:{let c=l;(a=(s=this.defaults.extensions)==null?void 0:s.childTokens)!=null&&a[c.type]?this.defaults.extensions.childTokens[c.type].forEach(u=>{let i=c[u].flat(1/0);r=r.concat(this.walkTokens(i,t))}):c.tokens&&(r=r.concat(this.walkTokens(c.tokens,t)))}}return r}use(...e){let t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(r=>{let s={...r};if(s.async=this.defaults.async||s.async||!1,r.extensions&&(r.extensions.forEach(a=>{if(!a.name)throw new Error("extension name required");if("renderer"in a){let l=t.renderers[a.name];l?t.renderers[a.name]=function(...c){let u=a.renderer.apply(this,c);return u===!1&&(u=l.apply(this,c)),u}:t.renderers[a.name]=a.renderer}if("tokenizer"in a){if(!a.level||a.level!=="block"&&a.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let l=t[a.level];l?l.unshift(a.tokenizer):t[a.level]=[a.tokenizer],a.start&&(a.level==="block"?t.startBlock?t.startBlock.push(a.start):t.startBlock=[a.start]:a.level==="inline"&&(t.startInline?t.startInline.push(a.start):t.startInline=[a.start]))}"childTokens"in a&&a.childTokens&&(t.childTokens[a.name]=a.childTokens)}),s.extensions=t),r.renderer){let a=this.defaults.renderer||new tn(this.defaults);for(let l in r.renderer){if(!(l in a))throw new Error(`renderer '${l}' does not exist`);if(["options","parser"].includes(l))continue;let c=l,u=r.renderer[c],i=a[c];a[c]=(...g)=>{let f=u.apply(a,g);return f===!1&&(f=i.apply(a,g)),f||""}}s.renderer=a}if(r.tokenizer){let a=this.defaults.tokenizer||new en(this.defaults);for(let l in r.tokenizer){if(!(l in a))throw new Error(`tokenizer '${l}' does not exist`);if(["options","rules","lexer"].includes(l))continue;let c=l,u=r.tokenizer[c],i=a[c];a[c]=(...g)=>{let f=u.apply(a,g);return f===!1&&(f=i.apply(a,g)),f}}s.tokenizer=a}if(r.hooks){let a=this.defaults.hooks||new $t;for(let l in r.hooks){if(!(l in a))throw new Error(`hook '${l}' does not exist`);if(["options","block"].includes(l))continue;let c=l,u=r.hooks[c],i=a[c];$t.passThroughHooks.has(l)?a[c]=g=>{if(this.defaults.async&&$t.passThroughHooksRespectAsync.has(l))return(async()=>{let w=await u.call(a,g);return i.call(a,w)})();let f=u.call(a,g);return i.call(a,f)}:a[c]=(...g)=>{if(this.defaults.async)return(async()=>{let w=await u.apply(a,g);return w===!1&&(w=await i.apply(a,g)),w})();let f=u.apply(a,g);return f===!1&&(f=i.apply(a,g)),f}}s.hooks=a}if(r.walkTokens){let a=this.defaults.walkTokens,l=r.walkTokens;s.walkTokens=function(c){let u=[];return u.push(l.call(this,c)),a&&(u=u.concat(a.call(this,c))),u}}this.defaults={...this.defaults,...s}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return Ze.lex(e,t??this.defaults)}parser(e,t){return et.parse(e,t??this.defaults)}parseMarkdown(e){return(t,r)=>{let s={...r},a={...this.defaults,...s},l=this.onError(!!a.silent,!!a.async);if(this.defaults.async===!0&&s.async===!1)return l(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof t>"u"||t===null)return l(new Error("marked(): input parameter is undefined or null"));if(typeof t!="string")return l(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(t)+", string expected"));if(a.hooks&&(a.hooks.options=a,a.hooks.block=e),a.async)return(async()=>{let c=a.hooks?await a.hooks.preprocess(t):t,u=await(a.hooks?await a.hooks.provideLexer(e):e?Ze.lex:Ze.lexInline)(c,a),i=a.hooks?await a.hooks.processAllTokens(u):u;a.walkTokens&&await Promise.all(this.walkTokens(i,a.walkTokens));let g=await(a.hooks?await a.hooks.provideParser(e):e?et.parse:et.parseInline)(i,a);return a.hooks?await a.hooks.postprocess(g):g})().catch(l);try{a.hooks&&(t=a.hooks.preprocess(t));let c=(a.hooks?a.hooks.provideLexer(e):e?Ze.lex:Ze.lexInline)(t,a);a.hooks&&(c=a.hooks.processAllTokens(c)),a.walkTokens&&this.walkTokens(c,a.walkTokens);let u=(a.hooks?a.hooks.provideParser(e):e?et.parse:et.parseInline)(c,a);return a.hooks&&(u=a.hooks.postprocess(u)),u}catch(c){return l(c)}}}onError(e,t){return r=>{if(r.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let s="<p>An error occurred:</p><pre>"+ot(r.message+"",!0)+"</pre>";return t?Promise.resolve(s):s}if(t)return Promise.reject(r);throw r}}},bt=new Fl;function fe(e,t){return bt.parse(e,t)}fe.options=fe.setOptions=function(e){return bt.setOptions(e),fe.defaults=bt.defaults,xs(fe.defaults),fe};fe.getDefaults=Fn;fe.defaults=xt;fe.use=function(...e){return bt.use(...e),fe.defaults=bt.defaults,xs(fe.defaults),fe};fe.walkTokens=function(e,t){return bt.walkTokens(e,t)};fe.parseInline=bt.parseInline;fe.Parser=et;fe.parser=et.parse;fe.Renderer=tn;fe.TextRenderer=Yn;fe.Lexer=Ze;fe.lexer=Ze.lex;fe.Tokenizer=en;fe.Hooks=$t;fe.parse=fe;fe.options;fe.setOptions;fe.use;fe.walkTokens;fe.parseInline;et.parse;Ze.lex;/*! @license DOMPurify 3.4.11 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.11/LICENSE */function _r(e,t){(t==null||t>e.length)&&(t=e.length);for(var r=0,s=Array(t);r<t;r++)s[r]=e[r];return s}function jl(e){if(Array.isArray(e))return e}function Ul(e,t){var r=e==null?null:typeof Symbol<"u"&&e[Symbol.iterator]||e["@@iterator"];if(r!=null){var s,a,l,c,u=[],i=!0,g=!1;try{if(l=(r=r.call(e)).next,t!==0)for(;!(i=(s=l.call(r)).done)&&(u.push(s.value),u.length!==t);i=!0);}catch(f){g=!0,a=f}finally{try{if(!i&&r.return!=null&&(c=r.return(),Object(c)!==c))return}finally{if(g)throw a}}return u}}function Hl(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Bl(e,t){return jl(e)||Ul(e,t)||Wl(e,t)||Hl()}function Wl(e,t){if(e){if(typeof e=="string")return _r(e,t);var r={}.toString.call(e).slice(8,-1);return r==="Object"&&e.constructor&&(r=e.constructor.name),r==="Map"||r==="Set"?Array.from(e):r==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?_r(e,t):void 0}}const Rs=Object.entries,vr=Object.setPrototypeOf,Gl=Object.isFrozen,ql=Object.getPrototypeOf,Yl=Object.getOwnPropertyDescriptor;let Me=Object.freeze,$e=Object.seal,Ct=Object.create,Es=typeof Reflect<"u"&&Reflect,In=Es.apply,Pn=Es.construct;Me||(Me=function(t){return t});$e||($e=function(t){return t});In||(In=function(t,r){for(var s=arguments.length,a=new Array(s>2?s-2:0),l=2;l<s;l++)a[l-2]=arguments[l];return t.apply(r,a)});Pn||(Pn=function(t){for(var r=arguments.length,s=new Array(r>1?r-1:0),a=1;a<r;a++)s[a-1]=arguments[a];return new t(...s)});const Pt=Ee(Array.prototype.forEach),Vl=Ee(Array.prototype.lastIndexOf),Tr=Ee(Array.prototype.pop),Tt=Ee(Array.prototype.push),Ql=Ee(Array.prototype.splice),ht=Array.isArray,zt=Ee(String.prototype.toLowerCase),yn=Ee(String.prototype.toString),Nr=Ee(String.prototype.match),Dt=Ee(String.prototype.replace),Cr=Ee(String.prototype.indexOf),Kl=Ee(String.prototype.trim),Jl=Ee(Number.prototype.toString),Xl=Ee(Boolean.prototype.toString),Rr=typeof BigInt>"u"?null:Ee(BigInt.prototype.toString),Er=typeof Symbol>"u"?null:Ee(Symbol.prototype.toString),Oe=Ee(Object.prototype.hasOwnProperty),Mt=Ee(Object.prototype.toString),De=Ee(RegExp.prototype.test),gt=Zl(TypeError);function Ee(e){return function(t){t instanceof RegExp&&(t.lastIndex=0);for(var r=arguments.length,s=new Array(r>1?r-1:0),a=1;a<r;a++)s[a-1]=arguments[a];return In(e,t,s)}}function Zl(e){return function(){for(var t=arguments.length,r=new Array(t),s=0;s<t;s++)r[s]=arguments[s];return Pn(e,r)}}function ue(e,t){let r=arguments.length>2&&arguments[2]!==void 0?arguments[2]:zt;if(vr&&vr(e,null),!ht(t))return e;let s=t.length;for(;s--;){let a=t[s];if(typeof a=="string"){const l=r(a);l!==a&&(Gl(t)||(t[s]=l),a=l)}e[a]=!0}return e}function ei(e){for(let t=0;t<e.length;t++)Oe(e,t)||(e[t]=null);return e}function He(e){const t=Ct(null);for(const s of Rs(e)){var r=Bl(s,2);const a=r[0],l=r[1];Oe(e,a)&&(ht(l)?t[a]=ei(l):l&&typeof l=="object"&&l.constructor===Object?t[a]=He(l):t[a]=l)}return t}function ti(e){switch(typeof e){case"string":return e;case"number":return Jl(e);case"boolean":return Xl(e);case"bigint":return Rr?Rr(e):"0";case"symbol":return Er?Er(e):"Symbol()";case"undefined":return Mt(e);case"function":case"object":{if(e===null)return Mt(e);const t=e,r=lt(t,"toString");if(typeof r=="function"){const s=r(t);return typeof s=="string"?s:Mt(s)}return Mt(e)}default:return Mt(e)}}function lt(e,t){for(;e!==null;){const s=Yl(e,t);if(s){if(s.get)return Ee(s.get);if(typeof s.value=="function")return Ee(s.value)}e=ql(e)}function r(){return null}return r}function ni(e){try{return De(e,""),!0}catch{return!1}}const Ar=Me(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","search","section","select","shadow","slot","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),wn=Me(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","enterkeyhint","exportparts","filter","font","g","glyph","glyphref","hkern","image","inputmode","line","lineargradient","marker","mask","metadata","mpath","part","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),Sn=Me(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),ri=Me(["animate","color-profile","cursor","discard","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),kn=Me(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover","mprescripts"]),si=Me(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),Lr=Me(["#text"]),Or=Me(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","command","commandfor","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","exportparts","face","for","headers","height","hidden","high","href","hreflang","id","inert","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","part","pattern","placeholder","playsinline","popover","popovertarget","popovertargetaction","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","slot","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","wrap","xmlns"]),_n=Me(["accent-height","accumulate","additive","alignment-baseline","amplitude","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dur","edgemode","elevation","end","exponent","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","intercept","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","mask-type","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","slope","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","tablevalues","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-rendering","textlength","type","u1","u2","unicode","values","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),Ir=Me(["accent","accentunder","align","bevelled","close","columnalign","columnlines","columnspacing","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lquote","lspace","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),Yt=Me(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),ai=$e(/{{[\w\W]*|^[\w\W]*}}/g),oi=$e(/<%[\w\W]*|^[\w\W]*%>/g),li=$e(/\${[\w\W]*/g),ii=$e(/^data-[\-\w.\u00B7-\uFFFF]+$/),ci=$e(/^aria-[\-\w]+$/),Pr=$e(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),ui=$e(/^(?:\w+script|data):/i),di=$e(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),pi=$e(/^html$/i),hi=$e(/^[a-z][.\w]*(-[.\w]+)+$/i),Dr=$e(/<[/\w!]/g),mi=$e(/<[/\w]/g),gi=$e(/<\/no(script|embed|frames)/i),fi=$e(/\/>/i),at={element:1,attribute:2,text:3,cdataSection:4,entityReference:5,entityNode:6,processingInstruction:7,comment:8,document:9,documentType:10,documentFragment:11,notation:12},bi=function(){return typeof window>"u"?null:window},xi=function(t,r){if(typeof t!="object"||typeof t.createPolicy!="function")return null;let s=null;const a="data-tt-policy-suffix";r&&r.hasAttribute(a)&&(s=r.getAttribute(a));const l="dompurify"+(s?"#"+s:"");try{return t.createPolicy(l,{createHTML(c){return c},createScriptURL(c){return c}})}catch{return console.warn("TrustedTypes policy "+l+" could not be created."),null}},Mr=function(){return{afterSanitizeAttributes:[],afterSanitizeElements:[],afterSanitizeShadowDOM:[],beforeSanitizeAttributes:[],beforeSanitizeElements:[],beforeSanitizeShadowDOM:[],uponSanitizeAttribute:[],uponSanitizeElement:[],uponSanitizeShadowNode:[]}},pt=function(t,r,s,a){return Oe(t,r)&&ht(t[r])?ue(a.base?He(a.base):{},t[r],a.transform):s};function As(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:bi();const t=L=>As(L);if(t.version="3.4.11",t.removed=[],!e||!e.document||e.document.nodeType!==at.document||!e.Element)return t.isSupported=!1,t;let r=e.document;const s=r,a=s.currentScript;e.DocumentFragment;const l=e.HTMLTemplateElement,c=e.Node,u=e.Element,i=e.NodeFilter,g=e.NamedNodeMap;g===void 0&&(e.NamedNodeMap||e.MozNamedAttrMap),e.HTMLFormElement;const f=e.DOMParser,w=e.trustedTypes,y=u.prototype,T=lt(y,"cloneNode"),h=lt(y,"remove"),v=lt(y,"nextSibling"),k=lt(y,"childNodes"),I=lt(y,"parentNode"),U=lt(y,"shadowRoot"),P=lt(y,"attributes"),z=c&&c.prototype?lt(c.prototype,"nodeType"):null,Q=c&&c.prototype?lt(c.prototype,"nodeName"):null;if(typeof l=="function"){const L=r.createElement("template");L.content&&L.content.ownerDocument&&(r=L.content.ownerDocument)}let H,te="",$,Ce=!1,ye=0;const Te=function(){if(ye>0)throw gt('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.')},ie=function(p){Te(),ye++;try{return H.createHTML(p)}finally{ye--}},re=function(p){Te(),ye++;try{return H.createScriptURL(p)}finally{ye--}},be=function(){return Ce||($=xi(w,a),Ce=!0),$},V=r,F=V.implementation,xe=V.createNodeIterator,_e=V.createDocumentFragment,ce=V.getElementsByTagName,C=s.importNode;let R=Mr();t.isSupported=typeof Rs=="function"&&typeof I=="function"&&F&&F.createHTMLDocument!==void 0;const B=ai,X=oi,_=li,x=ii,D=ci,ne=ui,Z=di,W=hi;let We=Pr,ge=null;const tt=ue({},[...Ar,...wn,...Sn,...kn,...Lr]);let se=null;const it=ue({},[...Or,..._n,...Ir,...Yt]);let pe=Object.seal(Ct(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),Ye=null,Pe=null;const Ae=Object.seal(Ct(null,{tagCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeCheck:{writable:!0,configurable:!1,enumerable:!0,value:null}}));let Be=!0,Ve=!0,Je=!1,M=!0,ee=!1,ae=!0,S=!1,N=!1,O=null,q=null,J=!1,oe=!1,Se=!1,A=!1,G=!0,Y=!1;const K="user-content-";let ve=!0,Qe=!1,yt={},nt=null;const ln=ue({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","selectedcontent","style","svg","template","thead","title","video","xmp"]);let Vn=null;const Qn=ue({},["audio","video","img","source","image","track"]);let cn=null;const Kn=ue({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),jt="http://www.w3.org/1998/Math/MathML",Ut="http://www.w3.org/2000/svg",rt="http://www.w3.org/1999/xhtml";let wt=rt,un=!1,dn=null;const Is=ue({},[jt,Ut,rt],yn),Jn=Me(["mi","mo","mn","ms","mtext"]);let pn=ue({},Jn);const Xn=Me(["annotation-xml"]);let hn=ue({},Xn);const Ps=ue({},["title","style","font","a","script"]);let Lt=null;const Ds=["application/xhtml+xml","text/html"],Ms="text/html";let Ne=null,St=null;const $s=r.createElement("form"),Zn=function(p){return p instanceof RegExp||p instanceof Function},mn=function(){let p=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};if(St&&St===p)return;(!p||typeof p!="object")&&(p={}),p=He(p),Lt=Ds.indexOf(p.PARSER_MEDIA_TYPE)===-1?Ms:p.PARSER_MEDIA_TYPE,Ne=Lt==="application/xhtml+xml"?yn:zt,ge=pt(p,"ALLOWED_TAGS",tt,{transform:Ne}),se=pt(p,"ALLOWED_ATTR",it,{transform:Ne}),dn=pt(p,"ALLOWED_NAMESPACES",Is,{transform:yn}),cn=pt(p,"ADD_URI_SAFE_ATTR",Kn,{transform:Ne,base:Kn}),Vn=pt(p,"ADD_DATA_URI_TAGS",Qn,{transform:Ne,base:Qn}),nt=pt(p,"FORBID_CONTENTS",ln,{transform:Ne}),Ye=pt(p,"FORBID_TAGS",He({}),{transform:Ne}),Pe=pt(p,"FORBID_ATTR",He({}),{transform:Ne}),yt=Oe(p,"USE_PROFILES")?p.USE_PROFILES&&typeof p.USE_PROFILES=="object"?He(p.USE_PROFILES):p.USE_PROFILES:!1,Be=p.ALLOW_ARIA_ATTR!==!1,Ve=p.ALLOW_DATA_ATTR!==!1,Je=p.ALLOW_UNKNOWN_PROTOCOLS||!1,M=p.ALLOW_SELF_CLOSE_IN_ATTR!==!1,ee=p.SAFE_FOR_TEMPLATES||!1,ae=p.SAFE_FOR_XML!==!1,S=p.WHOLE_DOCUMENT||!1,oe=p.RETURN_DOM||!1,Se=p.RETURN_DOM_FRAGMENT||!1,A=p.RETURN_TRUSTED_TYPE||!1,J=p.FORCE_BODY||!1,G=p.SANITIZE_DOM!==!1,Y=p.SANITIZE_NAMED_PROPS||!1,ve=p.KEEP_CONTENT!==!1,Qe=p.IN_PLACE||!1,We=ni(p.ALLOWED_URI_REGEXP)?p.ALLOWED_URI_REGEXP:Pr,wt=typeof p.NAMESPACE=="string"?p.NAMESPACE:rt,pn=Oe(p,"MATHML_TEXT_INTEGRATION_POINTS")&&p.MATHML_TEXT_INTEGRATION_POINTS&&typeof p.MATHML_TEXT_INTEGRATION_POINTS=="object"?He(p.MATHML_TEXT_INTEGRATION_POINTS):ue({},Jn),hn=Oe(p,"HTML_INTEGRATION_POINTS")&&p.HTML_INTEGRATION_POINTS&&typeof p.HTML_INTEGRATION_POINTS=="object"?He(p.HTML_INTEGRATION_POINTS):ue({},Xn);const b=Oe(p,"CUSTOM_ELEMENT_HANDLING")&&p.CUSTOM_ELEMENT_HANDLING&&typeof p.CUSTOM_ELEMENT_HANDLING=="object"?He(p.CUSTOM_ELEMENT_HANDLING):Ct(null);if(pe=Ct(null),Oe(b,"tagNameCheck")&&Zn(b.tagNameCheck)&&(pe.tagNameCheck=b.tagNameCheck),Oe(b,"attributeNameCheck")&&Zn(b.attributeNameCheck)&&(pe.attributeNameCheck=b.attributeNameCheck),Oe(b,"allowCustomizedBuiltInElements")&&typeof b.allowCustomizedBuiltInElements=="boolean"&&(pe.allowCustomizedBuiltInElements=b.allowCustomizedBuiltInElements),$e(pe),ee&&(Ve=!1),Se&&(oe=!0),yt&&(ge=ue({},Lr),se=Ct(null),yt.html===!0&&(ue(ge,Ar),ue(se,Or)),yt.svg===!0&&(ue(ge,wn),ue(se,_n),ue(se,Yt)),yt.svgFilters===!0&&(ue(ge,Sn),ue(se,_n),ue(se,Yt)),yt.mathMl===!0&&(ue(ge,kn),ue(se,Ir),ue(se,Yt))),Ae.tagCheck=null,Ae.attributeCheck=null,Oe(p,"ADD_TAGS")&&(typeof p.ADD_TAGS=="function"?Ae.tagCheck=p.ADD_TAGS:ht(p.ADD_TAGS)&&(ge===tt&&(ge=He(ge)),ue(ge,p.ADD_TAGS,Ne))),Oe(p,"ADD_ATTR")&&(typeof p.ADD_ATTR=="function"?Ae.attributeCheck=p.ADD_ATTR:ht(p.ADD_ATTR)&&(se===it&&(se=He(se)),ue(se,p.ADD_ATTR,Ne))),Oe(p,"ADD_URI_SAFE_ATTR")&&ht(p.ADD_URI_SAFE_ATTR)&&ue(cn,p.ADD_URI_SAFE_ATTR,Ne),Oe(p,"FORBID_CONTENTS")&&ht(p.FORBID_CONTENTS)&&(nt===ln&&(nt=He(nt)),ue(nt,p.FORBID_CONTENTS,Ne)),Oe(p,"ADD_FORBID_CONTENTS")&&ht(p.ADD_FORBID_CONTENTS)&&(nt===ln&&(nt=He(nt)),ue(nt,p.ADD_FORBID_CONTENTS,Ne)),ve&&(ge["#text"]=!0),S&&ue(ge,["html","head","body"]),ge.table&&(ue(ge,["tbody"]),delete Ye.tbody),p.TRUSTED_TYPES_POLICY){if(typeof p.TRUSTED_TYPES_POLICY.createHTML!="function")throw gt('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');if(typeof p.TRUSTED_TYPES_POLICY.createScriptURL!="function")throw gt('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');const E=H;H=p.TRUSTED_TYPES_POLICY;try{te=ie("")}catch(j){throw H=E,j}}else p.TRUSTED_TYPES_POLICY===null?(H=void 0,te=""):(H===void 0&&(H=be()),H&&typeof te=="string"&&(te=ie("")));Me&&Me(p),St=p},er=ue({},[...wn,...Sn,...ri]),tr=ue({},[...kn,...si]),zs=function(p,b,E){return b.namespaceURI===rt?p==="svg":b.namespaceURI===jt?p==="svg"&&(E==="annotation-xml"||pn[E]):!!er[p]},Fs=function(p,b,E){return b.namespaceURI===rt?p==="math":b.namespaceURI===Ut?p==="math"&&hn[E]:!!tr[p]},js=function(p,b,E){return b.namespaceURI===Ut&&!hn[E]||b.namespaceURI===jt&&!pn[E]?!1:!tr[p]&&(Ps[p]||!er[p])},Us=function(p){let b=I(p);(!b||!b.tagName)&&(b={namespaceURI:wt,tagName:"template"});const E=zt(p.tagName),j=zt(b.tagName);return dn[p.namespaceURI]?p.namespaceURI===Ut?zs(E,b,j):p.namespaceURI===jt?Fs(E,b,j):p.namespaceURI===rt?js(E,b,j):!!(Lt==="application/xhtml+xml"&&dn[p.namespaceURI]):!1},ut=function(p){Tt(t.removed,{element:p});try{I(p).removeChild(p)}catch{if(h(p),!I(p))throw gt("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place")}},nr=function(p){const b=k(p);if(b){const j=[];Pt(b,le=>{Tt(j,le)}),Pt(j,le=>{try{h(le)}catch{}})}const E=P(p);if(E)for(let j=E.length-1;j>=0;--j){const le=E[j],he=le&&le.name;if(typeof he=="string")try{p.removeAttribute(he)}catch{}}},mt=function(p,b){try{Tt(t.removed,{attribute:b.getAttributeNode(p),from:b})}catch{Tt(t.removed,{attribute:null,from:b})}if(b.removeAttribute(p),p==="is")if(oe||Se)try{ut(b)}catch{}else try{b.setAttribute(p,"")}catch{}},Hs=function(p){const b=P(p);if(b)for(let E=b.length-1;E>=0;--E){const j=b[E],le=j&&j.name;if(!(typeof le!="string"||se[Ne(le)]))try{p.removeAttribute(le)}catch{}}},Bs=function(p){const b=[p];for(;b.length>0;){const E=b.pop();(z?z(E):E.nodeType)===at.element&&Hs(E);const le=k(E);if(le)for(let he=le.length-1;he>=0;--he)b.push(le[he])}},rr=function(p){let b=null,E=null;if(J)p="<remove></remove>"+p;else{const he=Nr(p,/^[\r\n\t ]+/);E=he&&he[0]}Lt==="application/xhtml+xml"&&wt===rt&&(p='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+p+"</body></html>");const j=H?ie(p):p;if(wt===rt)try{b=new f().parseFromString(j,Lt)}catch{}if(!b||!b.documentElement){b=F.createDocument(wt,"template",null);try{b.documentElement.innerHTML=un?te:j}catch{}}const le=b.body||b.documentElement;return p&&E&&le.insertBefore(r.createTextNode(E),le.childNodes[0]||null),wt===rt?ce.call(b,S?"html":"body")[0]:S?b.documentElement:le},sr=function(p){return xe.call(p.ownerDocument||p,p,i.SHOW_ELEMENT|i.SHOW_COMMENT|i.SHOW_TEXT|i.SHOW_PROCESSING_INSTRUCTION|i.SHOW_CDATA_SECTION,null)},Ht=function(p){return p=Dt(p,B," "),p=Dt(p,X," "),p=Dt(p,_," "),p},gn=function(p){var b;p.normalize();const E=xe.call(p.ownerDocument||p,p,i.SHOW_TEXT|i.SHOW_COMMENT|i.SHOW_CDATA_SECTION|i.SHOW_PROCESSING_INSTRUCTION,null);let j=E.nextNode();for(;j;)j.data=Ht(j.data),j=E.nextNode();const le=(b=p.querySelectorAll)===null||b===void 0?void 0:b.call(p,"template");le&&Pt(le,he=>{kt(he.content)&&gn(he.content)})},Bt=function(p){const b=Q?Q(p):null;return typeof b!="string"||Ne(b)!=="form"?!1:typeof p.nodeName!="string"||typeof p.textContent!="string"||typeof p.removeChild!="function"||p.attributes!==P(p)||typeof p.removeAttribute!="function"||typeof p.setAttribute!="function"||typeof p.namespaceURI!="string"||typeof p.insertBefore!="function"||typeof p.hasChildNodes!="function"||p.nodeType!==z(p)||p.childNodes!==k(p)},kt=function(p){if(!z||typeof p!="object"||p===null)return!1;try{return z(p)===at.documentFragment}catch{return!1}},Ot=function(p){if(!z||typeof p!="object"||p===null)return!1;try{return typeof z(p)=="number"}catch{return!1}};function ct(L,p,b){L.length!==0&&Pt(L,E=>{E.call(t,p,b,St)})}const Ws=function(p,b){return!!(ae&&p.hasChildNodes()&&!Ot(p.firstElementChild)&&De(Dr,p.textContent)&&De(Dr,p.innerHTML)||ae&&p.namespaceURI===rt&&b==="style"&&Ot(p.firstElementChild)||p.nodeType===at.processingInstruction||ae&&p.nodeType===at.comment&&De(mi,p.data))},Gs=function(p,b){if(!Ye[b]&&lr(b)&&(pe.tagNameCheck instanceof RegExp&&De(pe.tagNameCheck,b)||pe.tagNameCheck instanceof Function&&pe.tagNameCheck(b)))return!1;if(ve&&!nt[b]){const E=I(p),j=k(p);if(j&&E){const le=j.length;for(let he=le-1;he>=0;--he){const Le=Qe?j[he]:T(j[he],!0);E.insertBefore(Le,v(p))}}}return ut(p),!0},ar=function(p){if(ct(R.beforeSanitizeElements,p,null),Bt(p))return ut(p),!0;const b=Ne(Q?Q(p):p.nodeName);if(ct(R.uponSanitizeElement,p,{tagName:b,allowedTags:ge}),Ws(p,b))return ut(p),!0;if(Ye[b]||!(Ae.tagCheck instanceof Function&&Ae.tagCheck(b))&&!ge[b])return Gs(p,b);if((z?z(p):p.nodeType)===at.element&&!Us(p)||(b==="noscript"||b==="noembed"||b==="noframes")&&De(gi,p.innerHTML))return ut(p),!0;if(ee&&p.nodeType===at.text){const j=Ht(p.textContent);p.textContent!==j&&(Tt(t.removed,{element:p.cloneNode()}),p.textContent=j)}return ct(R.afterSanitizeElements,p,null),!1},or=function(p,b,E){if(Pe[b]||G&&(b==="id"||b==="name")&&(E in r||E in $s))return!1;const j=se[b]||Ae.attributeCheck instanceof Function&&Ae.attributeCheck(b,p);if(!(Ve&&De(x,b))){if(!(Be&&De(D,b))){if(j){if(!cn[b]){if(!De(We,Dt(E,Z,""))){if(!((b==="src"||b==="xlink:href"||b==="href")&&p!=="script"&&Cr(E,"data:")===0&&Vn[p])){if(!(Je&&!De(ne,Dt(E,Z,"")))){if(E)return!1}}}}}else if(!(lr(p)&&(pe.tagNameCheck instanceof RegExp&&De(pe.tagNameCheck,p)||pe.tagNameCheck instanceof Function&&pe.tagNameCheck(p))&&(pe.attributeNameCheck instanceof RegExp&&De(pe.attributeNameCheck,b)||pe.attributeNameCheck instanceof Function&&pe.attributeNameCheck(b,p))||b==="is"&&pe.allowCustomizedBuiltInElements&&(pe.tagNameCheck instanceof RegExp&&De(pe.tagNameCheck,E)||pe.tagNameCheck instanceof Function&&pe.tagNameCheck(E))))return!1}}return!0},qs=ue({},["annotation-xml","color-profile","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","missing-glyph"]),lr=function(p){return!qs[zt(p)]&&De(W,p)},Ys=function(p,b,E,j){if(H&&typeof w=="object"&&typeof w.getAttributeType=="function"&&!E)switch(w.getAttributeType(p,b)){case"TrustedHTML":return ie(j);case"TrustedScriptURL":return re(j)}return j},Vs=function(p,b,E,j){try{E?p.setAttributeNS(E,b,j):p.setAttribute(b,j),Bt(p)?ut(p):Tr(t.removed)}catch{mt(b,p)}},ir=function(p){ct(R.beforeSanitizeAttributes,p,null);const b=p.attributes;if(!b||Bt(p))return;const E={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:se,forceKeepAttr:void 0};let j=b.length;const le=Ne(p.nodeName);for(;j--;){const he=b[j],Le=he.name,Re=he.namespaceURI,Ke=he.value,Xe=Ne(Le),bn=Ke;let Ue=Le==="value"?bn:Kl(bn);if(E.attrName=Xe,E.attrValue=Ue,E.keepAttr=!0,E.forceKeepAttr=void 0,ct(R.uponSanitizeAttribute,p,E),Ue=E.attrValue,Y&&(Xe==="id"||Xe==="name")&&Cr(Ue,K)!==0&&(mt(Le,p),Ue=K+Ue),ae&&De(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i,Ue)){mt(Le,p);continue}if(Xe==="attributename"&&Nr(Ue,"href")){mt(Le,p);continue}if(!E.forceKeepAttr){if(!E.keepAttr){mt(Le,p);continue}if(!M&&De(fi,Ue)){mt(Le,p);continue}if(ee&&(Ue=Ht(Ue)),!or(le,Xe,Ue)){mt(Le,p);continue}Ue=Ys(le,Xe,Re,Ue),Ue!==bn&&Vs(p,Le,Re,Ue)}}ct(R.afterSanitizeAttributes,p,null)},Wt=function(p){let b=null;const E=sr(p);for(ct(R.beforeSanitizeShadowDOM,p,null);b=E.nextNode();)if(ct(R.uponSanitizeShadowNode,b,null),ar(b),ir(b),kt(b.content)&&Wt(b.content),(z?z(b):b.nodeType)===at.element){const le=U(b);kt(le)&&(fn(le),Wt(le))}ct(R.afterSanitizeShadowDOM,p,null)},fn=function(p){const b=[{node:p,shadow:null}];for(;b.length>0;){const E=b.pop();if(E.shadow){Wt(E.shadow);continue}const j=E.node,he=(z?z(j):j.nodeType)===at.element,Le=k(j);if(Le)for(let Re=Le.length-1;Re>=0;--Re)b.push({node:Le[Re],shadow:null});if(he){const Re=Q?Q(j):null;if(typeof Re=="string"&&Ne(Re)==="template"){const Ke=j.content;kt(Ke)&&b.push({node:Ke,shadow:null})}}if(he){const Re=U(j);kt(Re)&&b.push({node:null,shadow:Re},{node:Re,shadow:null})}}};return t.sanitize=function(L){let p=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},b=null,E=null,j=null,le=null;if(un=!L,un&&(L="<!-->"),typeof L!="string"&&!Ot(L)&&(L=ti(L),typeof L!="string"))throw gt("dirty is not a string, aborting");if(!t.isSupported)return L;N?(ge=O,se=q):mn(p),(R.uponSanitizeElement.length>0||R.uponSanitizeAttribute.length>0)&&(ge=He(ge)),R.uponSanitizeAttribute.length>0&&(se=He(se)),t.removed=[];const he=Qe&&typeof L!="string"&&Ot(L);if(he){const Ke=Q?Q(L):L.nodeName;if(typeof Ke=="string"){const Xe=Ne(Ke);if(!ge[Xe]||Ye[Xe])throw gt("root node is forbidden and cannot be sanitized in-place")}if(Bt(L))throw gt("root node is clobbered and cannot be sanitized in-place");try{fn(L)}catch(Xe){throw nr(L),Xe}}else if(Ot(L))b=rr("<!---->"),E=b.ownerDocument.importNode(L,!0),E.nodeType===at.element&&E.nodeName==="BODY"||E.nodeName==="HTML"?b=E:b.appendChild(E),fn(E);else{if(!oe&&!ee&&!S&&L.indexOf("<")===-1)return H&&A?ie(L):L;if(b=rr(L),!b)return oe?null:A?te:""}b&&J&&ut(b.firstChild);const Le=sr(he?L:b);try{for(;j=Le.nextNode();)ar(j),ir(j),kt(j.content)&&Wt(j.content)}catch(Ke){throw he&&nr(L),Ke}if(he)return Pt(t.removed,Ke=>{Ke.element&&Bs(Ke.element)}),ee&&gn(L),L;if(oe){if(ee&&gn(b),Se)for(le=_e.call(b.ownerDocument);b.firstChild;)le.appendChild(b.firstChild);else le=b;return(se.shadowroot||se.shadowrootmode)&&(le=C.call(s,le,!0)),le}let Re=S?b.outerHTML:b.innerHTML;return S&&ge["!doctype"]&&b.ownerDocument&&b.ownerDocument.doctype&&b.ownerDocument.doctype.name&&De(pi,b.ownerDocument.doctype.name)&&(Re="<!DOCTYPE "+b.ownerDocument.doctype.name+`>
`+Re),ee&&(Re=Ht(Re)),H&&A?ie(Re):Re},t.setConfig=function(){let L=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};mn(L),N=!0,O=ge,q=se},t.clearConfig=function(){St=null,N=!1,O=null,q=null,H=$,te=""},t.isValidAttribute=function(L,p,b){St||mn({});const E=Ne(L),j=Ne(p);return or(E,j,b)},t.addHook=function(L,p){typeof p=="function"&&Oe(R,L)&&Tt(R[L],p)},t.removeHook=function(L,p){if(Oe(R,L)){if(p!==void 0){const b=Vl(R[L],p);return b===-1?void 0:Ql(R[L],b,1)[0]}return Tr(R[L])}},t.removeHooks=function(L){Oe(R,L)&&(R[L]=[])},t.removeAllHooks=function(){R=Mr()},t}var yi=As();const wi=Yr((e,t)=>({activeUtterance:null,playbackStatus:"idle",currentSegment:null,playRate:(()=>{try{const r=localStorage.getItem("audio_player_speed");return r?Number(r):1}catch{return 1}})(),selectedLanguage:(()=>{try{return localStorage.getItem("audio_player_language")||null}catch{return null}})(),say:null,isPlayingExternal:!1,playMode:(()=>{try{return localStorage.getItem("audio_player_play_mode")||"auto-next"}catch{return"auto-next"}})(),setPlayRate:r=>{e({playRate:r});try{localStorage.setItem("audio_player_speed",r.toString())}catch(s){console.error("儲存語速設定失敗:",s)}},setSelectedLanguage:r=>{e({selectedLanguage:r});try{r?localStorage.setItem("audio_player_language",r):localStorage.removeItem("audio_player_language")}catch(s){console.error("儲存語言設定失敗:",s)}},setPlayMode:r=>{e({playMode:r});try{localStorage.setItem("audio_player_play_mode",r)}catch(s){console.error("儲存播放模式設定失敗:",s)}},createUtterance:(r,s,a)=>{const l=new SpeechSynthesisUtterance(r);let c=s;if(typeof window<"u"&&window.speechSynthesis){const u=window.speechSynthesis.getVoices();if(s==="zh-HK"){const g=["zh-HK","yue","zh-yue","zh-Hant-HK","zh-HK-Hant"].find(f=>u.some(w=>w.lang.toLowerCase().includes(f.toLowerCase().replace("-",""))));if(g)c=g,console.log(`粵語語言代碼調整: ${s} -> ${c}`);else{const w=["zh-CN","zh","cmn","zh-cmn"].find(y=>u.some(T=>T.lang.toLowerCase().includes(y.toLowerCase().replace("-",""))));w&&(c=w,console.log(`粵語語音不可用，使用普通話備用: ${s} -> ${c}`))}}if(s==="zh-CN"){const g=["zh-CN","zh","cmn","zh-cmn"].find(f=>u.some(w=>w.lang.toLowerCase().includes(f.toLowerCase().replace("-",""))));g&&(c=g)}}return l.lang=c,l.rate=a,console.log(`創建 utterance: text="${r.substring(0,30)}...", lang=${c} (原始: ${s}), rate=${a}`),l},setActiveUtterance:r=>{const{activeUtterance:s}=t();s&&(s.onstart=null,s.onend=null,s.onerror=null),e({activeUtterance:r})},clearActiveUtterance:()=>{const{activeUtterance:r}=t();r&&(r.onstart=null,r.onend=null,r.onerror=null),e({activeUtterance:null})},setPlaybackStatus:r=>{e({playbackStatus:r})},setCurrentSegment:r=>{e({currentSegment:r})},stopAllSpeech:()=>{const{activeUtterance:r}=t();if(r&&(r.onstart=null,r.onend=null,r.onerror=null),typeof window<"u"&&window.speechSynthesis)try{window.speechSynthesis.cancel()}catch(s){console.warn("Speech cancel failed:",s)}e({activeUtterance:null,playbackStatus:"idle",currentSegment:null})},cleanupTTS:()=>{const{activeUtterance:r,isPlayingExternal:s}=t();if(r&&(r.onstart=null,r.onend=null,r.onerror=null),typeof window<"u"&&window.speechSynthesis)try{window.speechSynthesis.cancel()}catch(a){console.warn("Speech cancel failed:",a)}e({activeUtterance:null,playbackStatus:"idle",currentSegment:null,isPlayingExternal:!1})},pauseSpeech:()=>{if(typeof window<"u"&&window.speechSynthesis)try{window.speechSynthesis.pause(),e({playbackStatus:"paused"})}catch(r){console.warn("Pause failed:",r)}},resumeSpeech:()=>{if(typeof window<"u"&&window.speechSynthesis)try{window.speechSynthesis.resume(),e({playbackStatus:"playing"})}catch(r){console.warn("Resume failed:",r)}},isPlaying:()=>t().playbackStatus==="playing",isPaused:()=>t().playbackStatus==="paused",hasActiveUtterance:()=>t().activeUtterance!==null,getCurrentProgress:()=>{const{currentSegment:r,playbackStatus:s}=t();return{currentSegment:r,playbackStatus:s,isPlaying:s==="playing",isPaused:s==="paused",isIdle:s==="idle",isCompleted:s==="completed"}},resetAll:()=>{t().cleanupTTS()},isSpeechSynthesisSupported:()=>typeof window<"u"&&"speechSynthesis"in window,getAvailableVoices:()=>typeof window<"u"&&window.speechSynthesis?window.speechSynthesis.getVoices():[],setVoice:r=>{const{activeUtterance:s}=t();if(s&&r){const l=window.speechSynthesis.getVoices().find(c=>c.name===r);l&&(s.voice=l)}},setSay:r=>{e({say:r})},setIsPlayingExternal:r=>{e({isPlayingExternal:r})},playWithExternalTTS:async(r,s,a)=>new Promise((l,c)=>{const u=new URL(r);s&&u.searchParams.set("text",s),a&&u.searchParams.set("lang",a),u.searchParams.set("rate",t().playRate);const i=u.toString();fetch(i,{method:"GET",headers:{"Content-Type":"application/json"}}).then(g=>{if(!g.ok)throw new Error(`HTTP error! status: ${g.status}`);return g.json()}).then(g=>{l(g)}).catch(g=>{c(g)})}),playWithMacOSSay:async r=>new Promise((s,a)=>{if(typeof window>"u"||navigator.platform.indexOf("Mac")===-1){a(new Error("macOS say command is only available on macOS"));return}if(!window.__TAURI__){console.log(`macOS say command text: ${r}`);let c=r,u="";if(r.startsWith("[[voice ")){const g=r.indexOf("]]");g!==-1&&(u=r.substring(0,g+2).replace("[[voice ","-v ").replace("]]",""),c=r.substring(g+2).trim())}const i=u?`say ${u} "${c}"`:`say "${c}"`;alert(`macOS say 命令需要外部執行。

語音: ${u||"默認"}
文本: ${c}

請在終端中運行：${i}`),setTimeout(()=>{s()},1e3);return}const{invoke:l}=window.__TAURI__.tauri;l("say_command",{text:r}).then(()=>{s()}).catch(c=>{a(c)})}),getMacOSVoiceByLang:r=>r?r.includes("zh")&&(r.includes("HK")||r.includes("yue")||r.includes("Hant"))?"Sin-Ji":r.includes("zh")||r.includes("CN")||r.includes("cmn")?"Ting-Ting":(r.includes("en"),"Samantha"):"Samantha"})),Ls=/[\u4e00-\u9fa5]/,Os=/[\u4e2a\u4eec\u4e3a\u8fd9\u56fd\u65f6\u6765\u53d1\u4e1a\u4e1c\u4e66\u4e70]/,Si=/^[A-Za-z0-9\s!@#$%^&*()_+\-=[\]{};':",./<>?|\\~`]*$/,ki=/^[^A-Za-z0-9\u4e00-\u9fa5]+$/,_i=/[\/+\-×]/,vi=[{value:.8,label:"0.8x"},{value:1,label:"1.0x"},{value:1.2,label:"1.2x"},{value:1.5,label:"1.5x"},{value:2,label:"2.0x"}],$r=[{value:null,label:"自動檢測"},{value:"zh-CN",label:"普通話 (zh-CN)"},{value:"zh-HK",label:"香港粵語 (zh-HK)"},{value:"en-US",label:"英語 (en-US)"}],Ti=[{value:"loop-current",label:"循環播放當前 tab"},{value:"auto-next",label:"自動播放下一個 tab"},{value:"single",label:"單次播放"}],Nt=new Map,Ni=(e,t,r,s)=>{if(s)return s;if(Nt.has(e))return Nt.get(e);let a;if(Ls.test(e)?a=Os.test(e)?"zh-CN":"zh-HK":Si.test(e)?/^[A-Za-z]$/.test(e.trim())?a="en-US":t?a=r?"zh-CN":"zh-HK":a="en-US":a="zh-HK",Nt.size>=200){const l=Nt.keys();for(let c=0;c<100;c++){const u=l.next().value;if(u!==void 0)Nt.delete(u);else break}}return Nt.set(e,a),a},Ci=({texts:e=[],autoPlay:t=!1,onPlayStart:r,onPlayComplete:s,onPlayError:a,showOptionsAfterPlay:l=!1,onOptionPlayComplete:c,onProgress:u,say:i=null,showPlayModeSelector:g=!1})=>{var Je;const[f,w]=m.useState(!0),[y,T]=m.useState(!1),{playbackStatus:h,playRate:v,setPlayRate:k,selectedLanguage:I,setSelectedLanguage:U,playMode:P,setPlayMode:z,createUtterance:Q,setActiveUtterance:H,clearActiveUtterance:te,setPlaybackStatus:$,setCurrentSegment:Ce,stopAllSpeech:ye,pauseSpeech:Te,resumeSpeech:ie,isSpeechSynthesisSupported:re,setIsPlayingExternal:be,playWithExternalTTS:V,playWithMacOSSay:F,getMacOSVoiceByLang:xe,cleanupTTS:_e}=wi(),ce=m.useRef([]),C=m.useMemo(()=>((e.length!==ce.current.length||e.some((ee,ae)=>ee!==ce.current[ae]))&&(ce.current=e),{}),[e]),R=m.useRef(!0),B=m.useRef(0),X=m.useRef(null),_=m.useRef(0),x=m.useRef(null),D=m.useRef([]),ne=m.useMemo(()=>{if(!e||e.length===0)return D.current=[],[];const M=e.join(" "),ee=Ls.test(M),ae=Os.test(M),S=e.map((N,O)=>{if(!N||!N.trim()||ki.test(N))return null;const q=Ni(N,ee,ae,I);let J=N.includes("_")?N.replace(/_+/g," ").trim():N.trim();return q.startsWith("zh")&&_i.test(J)&&(J=J.replace(/\//g,"或").replace(/\+/g,"加").replace(/-/g,"減").replace(/×/g,"乘")),{text:N,originalIndex:O,lang:q,cleanedText:J}}).filter(Boolean);return D.current=S,S},[C,I]),Z=m.useRef({});m.useEffect(()=>{Z.current={onPlayStart:r,onPlayComplete:s,onPlayError:a,onOptionPlayComplete:c,onProgress:u}},[r,s,a,c,u]);const W=m.useCallback(()=>{B.current+=1,X.current&&(clearInterval(X.current),X.current=null),x.current&&(x.current.onstart=null,x.current.onend=null,x.current.onerror=null,x.current=null),_e()},[_e]),We=m.useCallback((M,ee,ae,S,N,O)=>new Promise((q,J)=>{var oe,Se,A,G;if(!R.current||S!==B.current)return J(new Error("Session interrupted"));be(!0),$("playing"),ee===0&&((Se=(oe=Z.current).onPlayStart)==null||Se.call(oe)),(G=(A=Z.current).onProgress)==null||G.call(A,ee,ae),V(M,N,O).then(()=>{S===B.current&&(be(!1),q())}).catch(Y=>{be(!1),J(Y)})}),[$,be,V]),ge=m.useCallback((M,ee,ae,S)=>new Promise((N,O)=>{var q,J,oe,Se;if(!R.current||S!==B.current)return O(new Error("Session interrupted"));be(!0),$("playing"),ee===0&&((J=(q=Z.current).onPlayStart)==null||J.call(q)),(Se=(oe=Z.current).onProgress)==null||Se.call(oe,ee,ae),F(M).then(()=>{S===B.current&&(be(!1),N())}).catch(A=>{be(!1),O(A)})}),[$,be,F]),tt=m.useCallback((M,ee,ae,S)=>new Promise((N,O)=>{if(!R.current||S!==B.current)return O(new Error("Session interrupted"));if(i){if(typeof i=="string"&&(i.startsWith("http://")||i.startsWith("https://")))return We(i,ee,ae,S,M.cleanedText,M.lang||"en").then(N).catch(O);if(i==="macos-say"||typeof i=="object"&&i.type==="macos-say"){const J=M.lang||"en",oe=xe(J),Se=typeof i=="object"&&i.text?i.text:M.cleanedText,A=`[[voice ${oe}]] ${Se}`;return ge(A,ee,ae,S).then(N).catch(O)}}const q=Q(M.cleanedText,M.lang,v);x.current=q,H(q),Ce(M),_.current=ee,q.onstart=()=>{var J,oe,Se,A;!R.current||S!==B.current||($("playing"),ee===0&&((oe=(J=Z.current).onPlayStart)==null||oe.call(J)),(A=(Se=Z.current).onProgress)==null||A.call(Se,ee,ae))},q.onend=()=>{var J,oe;if(S===B.current){if(l&&M.originalIndex>0){const Se=String.fromCharCode(65+(M.originalIndex-1));(oe=(J=Z.current).onOptionPlayComplete)==null||oe.call(J,Se)}te(),x.current=null,N()}},q.onerror=J=>{te(),x.current=null,J.error==="interrupted"||J.error==="canceled"||S!==B.current?N():O(J.error)},window.speechSynthesis.speak(q)}),[i,v,l,Q,H,Ce,te,$,We,ge,xe]),se=m.useCallback(async(M=0,ee=!1)=>{var J,oe,Se,A,G,Y;if(!f)return;const ae=D.current;if(ae.length===0){$("completed"),(oe=(J=Z.current).onPlayComplete)==null||oe.call(J,P);return}T(!0),W();const S=B.current;if(await new Promise(K=>setTimeout(K,60)),S!==B.current){T(!1);return}const N=ae.length;let O=0;const q=ee?1/0:1;for(;O<q;){for(let K=M;K<N;K++){if(S!==B.current||!R.current){T(!1);return}try{await tt(ae[K],K,N,S)}catch(ve){if(R.current&&S===B.current&&($("idle"),(A=(Se=Z.current).onPlayError)==null||A.call(Se,ve),ve!=="interrupted"&&ve!=="canceled")){console.warn("播放錯誤，嘗試恢復:",ve),setTimeout(()=>{R.current&&S===B.current&&se(K,ee)},1e3);return}T(!1);return}}if(O++,!ee)break;M=0}R.current&&S===B.current&&(T(!1),$("completed"),(Y=(G=Z.current).onPlayComplete)==null||Y.call(G,P),_.current=0)},[W,tt,$,f]);m.useCallback(M=>{if(!re()){console.error("瀏覽器不支持語音合成");return}const ee=M==="zh-CN"?"這是一個普通話測試":M==="zh-HK"?"呢個係一個廣東話測試":"This is an English test",ae=new SpeechSynthesisUtterance(ee);ae.lang=M,ae.rate=v;const S=window.speechSynthesis.getVoices();console.log(`測試語音 ${M}:`,S.filter(O=>O.lang.includes(M.replace("-",""))));const N=S.find(O=>O.lang.includes(M.replace("-","")));N?(ae.voice=N,console.log(`使用語音: ${N.name} (${N.lang})`)):console.warn(`未找到 ${M} 語音，使用默認語音`),ae.onstart=()=>console.log(`開始播放 ${M} 測試`),ae.onend=()=>console.log(`完成播放 ${M} 測試`),ae.onerror=O=>console.error(`播放錯誤 ${M}:`,O),window.speechSynthesis.speak(ae)},[v,re]);const it=m.useCallback(()=>{h==="playing"?Te():h==="paused"?ie():h!=="loading"&&se(0,P==="loop-current")},[h,Te,ie,se,P]),pe=m.useCallback(M=>{const ee=Number(M.target.value);if(k(ee),h==="playing"||h==="paused"){const ae=P==="loop-current";se(_.current,ae)}else W(),$("idle")},[h,W,k,se,$,P]),Ye=m.useCallback(M=>{const ee=M.target.value==="null"?null:M.target.value;W(),U(ee),$("idle"),_.current=0,(h==="playing"||h==="paused")&&setTimeout(()=>{se(0,P==="loop-current")},100)},[h,W,U,se,$,P]),Pe=m.useCallback(M=>{const ee=M.target.value;W(),z(ee),$("idle"),_.current=0,(h==="playing"||h==="paused")&&setTimeout(()=>{se(0,ee==="loop-current")},100)},[h,W,z,se,$]);m.useEffect(()=>(h==="playing"?X.current=setInterval(()=>{var M;typeof window<"u"&&((M=window.speechSynthesis)!=null&&M.speaking)&&(window.speechSynthesis.pause(),window.speechSynthesis.resume())},1e4):X.current&&(clearInterval(X.current),X.current=null),()=>{X.current&&clearInterval(X.current)}),[h]),m.useEffect(()=>{if(!re())w(!1);else{const M=()=>{const ee=window.speechSynthesis.getVoices();console.log("可用語音列表:",ee.map(N=>({name:N.name,lang:N.lang})));const ae=ee.filter(N=>N.lang.includes("zh-HK")||N.lang.includes("yue")||N.name.toLowerCase().includes("cantonese"));console.log("粵語語音:",ae);const S=ee.filter(N=>N.lang.includes("zh-CN")||N.lang.includes("cmn")||N.name.toLowerCase().includes("mandarin"));console.log("普通話語音:",S)};window.speechSynthesis.getVoices().length===0?window.speechSynthesis.onvoiceschanged=M:M()}},[re]),m.useEffect(()=>(R.current=!0,()=>{R.current=!1,W()}),[W]),m.useEffect(()=>{$("idle"),_.current=0,W()},[C,W,$]),m.useEffect(()=>{let M;return t&&ne.length>0&&h==="idle"&&(M=setTimeout(()=>{se(0).catch(()=>{})},150)),()=>{M&&clearTimeout(M)}},[C,t,ne.length,h,se]);const Ae=m.useMemo(()=>y?o("div",{className:"w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"}):h==="playing"?o(Sa,{size:18}):h==="paused"?o(Ur,{size:18}):o(Tn,{size:18}),[h,y]),Be=m.useMemo(()=>i?typeof i=="string"&&(i.startsWith("http://")||i.startsWith("https://"))?"外部 TTS URL":i==="macos-say"||typeof i=="object"&&i.type==="macos-say"?"macOS say 命令":"外部播放":"瀏覽器語音合成",[i]);if(!f)return o("div",{className:"mb-4",children:o("div",{className:"p-3 bg-yellow-50 border border-yellow-200 rounded-lg",children:d("div",{className:"flex items-center justify-between",children:[o("span",{className:"text-yellow-700 font-medium",children:"語音播放:"}),o("span",{className:"text-sm text-yellow-600",children:"您的瀏覽器不支持語音合成功能"})]})})});const Ve=I?((Je=$r.find(M=>M.value===I))==null?void 0:Je.label)||I:"自動檢測";return o("div",{className:"mb-4",children:o("div",{className:"p-3 bg-purple-50 border border-purple-200 rounded-lg",children:d("div",{className:"flex items-center justify-between flex-wrap gap-2",children:[d("div",{className:"flex items-center",children:[o("button",{onClick:it,disabled:y,className:`p-2 rounded-full transition-colors mr-3 ${y?"bg-gray-200 text-gray-400 cursor-not-allowed":h==="playing"?"bg-blue-100 text-blue-600 hover:bg-blue-200":h==="paused"?"bg-yellow-100 text-yellow-600 hover:bg-yellow-200":"bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"}`,type:"button",children:Ae}),d("div",{className:"flex flex-col",children:[o("span",{className:"text-purple-700 font-medium",children:"語音播放:"}),o("span",{className:"text-xs text-gray-500",children:Be}),d("span",{className:"text-xs text-gray-500",children:["語言: ",Ve]})]}),d("span",{className:"text-sm font-medium ml-2",children:[y&&o("span",{className:"text-blue-600",children:"加載中..."}),!y&&h==="playing"&&o("span",{className:"text-purple-600",children:"播放中..."}),!y&&h==="paused"&&o("span",{className:"text-yellow-600",children:"已暫停"}),!y&&h==="completed"&&d("span",{className:"text-green-600 flex items-center",children:[o(ka,{size:14,className:"inline mr-1"}),"完成"]}),!y&&h==="idle"&&o("span",{className:"text-gray-500",children:"未播放"})]})]}),d("div",{className:"flex items-center gap-3 text-xs",children:[d("div",{className:"flex items-center gap-1",children:[o(_a,{size:12,className:"text-purple-700"}),o("label",{htmlFor:"language-select",className:"text-purple-700",children:"語言:"}),o("select",{id:"language-select",value:I||"null",onChange:Ye,className:"bg-white border border-purple-300 rounded px-1 py-0.5 text-purple-700 cursor-pointer",children:$r.map(M=>o("option",{value:M.value||"null",children:M.label},M.value||"auto"))})]}),d("div",{className:"flex items-center gap-1",children:[o("label",{htmlFor:"rate-select",className:"text-purple-700",children:"語速:"}),o("select",{id:"rate-select",value:v,onChange:pe,className:"bg-white border border-purple-300 rounded px-1 py-0.5 text-purple-700 cursor-pointer",children:vi.map(M=>o("option",{value:M.value,children:M.label},M.value))})]}),g&&d("div",{className:"flex items-center gap-1",children:[o("label",{htmlFor:"play-mode-select",className:"text-purple-700",children:"播放模式:"}),o("select",{id:"play-mode-select",value:P,onChange:Pe,className:"bg-white border border-purple-300 rounded px-1 py-0.5 text-purple-700 cursor-pointer",children:Ti.map(M=>o("option",{value:M.value,children:M.label},M.value))})]}),o("button",{onClick:()=>{se(0,P==="loop-current")},disabled:h==="playing",className:"text-purple-600 underline disabled:opacity-50 disabled:no-underline",type:"button",children:"重新播放"})]})]})})})},Ri=Js.memo(Ci),Ei=Object.assign({"../texts/九龙城":Io,"../texts/九龙湾":Po,"../texts/元朗":Do,"../texts/北区":Mo,"../texts/啟德":$o,"../texts/大埔":zo,"../texts/将军澳":Fo,"../texts/屯门":jo,"../texts/新蒲岗":Uo,"../texts/沙田":Ho,"../texts/油尖旺":Bo,"../texts/深水埗":Wo,"../texts/红磡":Go,"../texts/荃湾.txt":qo,"../texts/荃青.txt":Yo,"../texts/荔枝角":Vo,"../texts/观塘":Qo,"../texts/长沙湾":Ko,"../texts/青衣.txt":Jo,"../texts/马鞍山":Xo}),Ai=e=>{if(!e)return"";try{const t=fe.parse(e,{gfm:!0}),r=new DOMParser().parseFromString(t,"text/html");return r.querySelectorAll("pre, code, style, script").forEach(a=>a.remove()),r.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, tr").forEach(a=>{const l=a.textContent?a.textContent.trim():"";l&&!/[。！？!?.;；]/.test(l.slice(-1))&&(a.textContent=l+"。"),a.after(`

`)}),(r.body.textContent||"").replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F9FF}\u{2600}-\u{27BF}]/gu,"").replace(/\n{3,}/g,`

`).replace(/ +/g," ").trim()}catch(t){return console.error("語音文本清理髮生錯誤:",t),e.replace(/\n\s*\n/g,`。 

`).replace(/[#*`|\[\]()\-+>]/g,"").trim()}},Li=e=>{if(!e)return"";const t=new fe.Renderer;t.strong=s=>{const a=typeof s=="object"&&s.text?s.text:typeof s=="string"?s:"",l=a.replace(/[:：]/g,"").trim();return l.length>=2&&l.length<=12?`<a href="${`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l)}`}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5 font-bold mx-0.5">
        ${a}🗺️
      </a>`:`<strong>${a}</strong>`};const r=fe.parse(e,{gfm:!0,breaks:!0,renderer:t});return yi.sanitize(r,{USE_PROFILES:{html:!0},ADD_ATTR:["target","rel"]})},Oi=()=>{const e=m.useMemo(()=>Object.entries(Ei).map(([h,v])=>{const k=h.split("/").pop().replace(/\.[^/.]+$/,"");return{id:h,label:k,content:v,cleanContent:Ai(v),displayContent:Li(v)}}),[]),[t,r]=m.useState(()=>{var h;if(typeof window<"u"){const k=new URLSearchParams(window.location.search).get("tab");if(k&&e.some(I=>I.id===k))return k}return(h=e[0])==null?void 0:h.id}),[s,a]=m.useState(!1),l=m.useRef(!1),c=e.find(h=>h.id===t),u=(c==null?void 0:c.cleanContent)||"",i=(c==null?void 0:c.displayContent)||"";m.useEffect(()=>{const h=()=>{const k=new URLSearchParams(window.location.search).get("tab");k&&e.some(I=>I.id===k)?r(k):e[0]&&r(e[0].id),a(!1)};return window.addEventListener("popstate",h),()=>window.removeEventListener("popstate",h)},[e]);const g=m.useCallback(h=>{const v=new URL(window.location.href);v.searchParams.set("tab",h),window.history.pushState({},"",v.toString())},[]),f=m.useCallback((h="auto-next")=>{if(console.log("播放完成，播放模式:",h),h==="auto-next"){const v=e.findIndex(k=>k.id===t);if(v!==-1&&v<e.length-1){const k=e[v+1].id;l.current=!0,a(!0),r(k),g(k)}else a(!1),l.current=!1}else a(!1),l.current=!1},[t,e,g]),w=m.useCallback(()=>{l.current||a(!1),l.current=!1},[]),y=m.useCallback(h=>{console.error("播放錯誤:",h),a(!1),l.current=!1},[]),T=m.useCallback(h=>{r(h),g(h),a(!1),l.current=!1},[g]);return e.length===0?d("div",{className:"p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200",children:["未在 ",o("code",{className:"px-1 py-0.5 bg-gray-100 rounded text-sm",children:"./text/"})," 目錄中找到文件。"]}):d("div",{className:"max-w-4xl mx-auto my-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden",children:[o("div",{className:"flex border-b border-gray-200 bg-gray-50 overflow-x-auto scrollbar-none",children:e.map(h=>{const v=t===h.id;return o("button",{onClick:()=>T(h.id),className:`px-6 py-3 text-sm font-medium border-r border-gray-200 transition-colors whitespace-nowrap focus:outline-none
                ${v?"bg-white text-blue-600 border-b-2 border-b-blue-600 font-semibold":"text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`,children:h.label},h.id)})}),o("div",{className:"px-6 pt-4 bg-white border-b border-gray-100",children:o(Ri,{texts:u?[u]:[],autoPlay:s,onPlayStart:w,onPlayComplete:f,onPlayError:y,showPlayModeSelector:!0})}),o("div",{className:"p-6 bg-white min-h-[300px]",children:i?o("div",{className:`text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none 
                       prose-headings:font-semibold prose-table:border prose-th:bg-gray-50 prose-th:p-2 prose-td:p-2`,dangerouslySetInnerHTML:{__html:i}}):o("div",{className:"text-gray-500 italic",children:"請選擇一個文件進行查看"})})]})},Ii=Object.freeze(Object.defineProperty({__proto__:null,default:Oi},Symbol.toStringTag,{value:"Module"})),Pi=Object.freeze(Object.defineProperty({__proto__:null,default:zn},Symbol.toStringTag,{value:"Module"})),Di=Object.freeze(Object.defineProperty({__proto__:null,default:zn},Symbol.toStringTag,{value:"Module"})),zr=Object.assign({"/src/data/apps/hkele/links.json":ja,"/src/data/apps/hkele/mock-test-configs.json":Ha,"/src/data/apps/hktaxi/config.json":Wa,"/src/data/apps/hktaxi/links.json":qa,"/src/data/apps/hktaxi/mock-test-configs.json":Va,"/src/data/apps/site/config.json":Ka,"/src/data/apps/site/links.json":Xa,"/src/data/apps/site/mock-test-configs.json":eo}),Fr=Object.assign({"/src/data/apps/hkele/questions/a.json":()=>me(()=>import("./a-a8ae1c54.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/b.json":()=>me(()=>import("./b-ec98a30e.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/hkelement-data.json":()=>me(()=>import("./hkelement-data-62ef8037.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/小學二年級.json":()=>me(()=>import("./小學二年級-b57b4aa1.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/小學二年級2.json":()=>me(()=>import("./小學二年級2-ca1828b9.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/小學二年級3.json":()=>me(()=>import("./小學二年級3-5453bac3.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hkele/questions/幼兒園高班.json":()=>me(()=>import("./幼兒園高班-89091f9f.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/[乙部][道路使用者守則].json":()=>me(()=>import("./_乙部__道路使用者守則_-31b0a9db.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-[乙部][道路使用者守則]-test-data.json":()=>me(()=>import("./hk-taxi-_乙部__道路使用者守則_-test-data-04029491.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-[甲部][地方]-questions.json":()=>me(()=>import("./hk-taxi-_甲部__地方_-questions-2fb88e81.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-[甲部][的士則例]-question.json":()=>me(()=>import("./hk-taxi-_甲部__的士則例_-question-9cdeaa3b.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-[甲部][的士則例]-question2.json":()=>me(()=>import("./hk-taxi-_甲部__的士則例_-question2-7503acd2.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-[甲部][路線]-questions.json":()=>me(()=>import("./hk-taxi-_甲部__路線_-questions-5a7d0128.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions-penalty.json":()=>me(()=>import("./hk-taxi-area-questions-penalty-029f713c.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions-penalty2.json":()=>me(()=>import("./hk-taxi-area-questions-penalty2-4a56e7d1.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions-penalty3.json":()=>me(()=>import("./hk-taxi-area-questions-penalty3-38fc827a.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions-penalty4.json":()=>me(()=>import("./hk-taxi-area-questions-penalty4-cd590e8e.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions-penalty5.json":()=>me(()=>import("./hk-taxi-area-questions-penalty5-5b634b02.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-area-questions.json":()=>me(()=>import("./hk-taxi-area-questions-2fb88e81.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-extra-main-road.json":()=>me(()=>import("./hk-taxi-extra-main-road-72e6a2ce.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-extra-main-road2.json":()=>me(()=>import("./hk-taxi-extra-main-road2-f0165099.js").then(e=>e._),[],import.meta.url),"/src/data/apps/hktaxi/questions/hk-taxi-route-questions.json":()=>me(()=>import("./hk-taxi-route-questions-5a7d0128.js").then(e=>e._),[],import.meta.url),"/src/data/apps/site/questions/專用石油氣站.json":()=>me(()=>import("./專用石油氣站-3df0cd15.js"),[],import.meta.url),"/src/data/apps/site/questions/广场.json":()=>me(()=>import("./广场-1a921051.js"),[],import.meta.url),"/src/data/apps/site/questions/沙田/ 酒店_旅宿.json":()=>me(()=>import("./ 酒店_旅宿-37973800.js"),[],import.meta.url),"/src/data/apps/site/questions/沙田/屋邨_住宅.json":()=>me(()=>import("./屋邨_住宅-bc9463d5.js"),[],import.meta.url),"/src/data/apps/site/questions/荃灣區/屋邨_住宅.json":()=>me(()=>import("./屋邨_住宅-276f3886.js"),[],import.meta.url),"/src/data/apps/site/questions/荃灣區/酒店_地標.json":()=>me(()=>import("./酒店_地標-349ca276.js"),[],import.meta.url),"/src/data/apps/site/questions/酒店_旅宿.json":()=>me(()=>import("./酒店_旅宿-66f19778.js"),[],import.meta.url)}),nn=Object.assign({"/src/data/apps/hktaxi/components/AreasBy.jsx":oo,"/src/data/apps/hktaxi/components/Location.jsx":Ao,"/src/data/apps/hktaxi/components/area/Area2.jsx":no,"/src/data/apps/hktaxi/components/area/Area3.jsx":so,"/src/data/apps/hktaxi/components/area/Area4.jsx":Oo,"/src/data/apps/site/components/FileTabsViewer.jsx":Ii,"/src/data/apps/site/components/Location.jsx":Pi,"/src/data/apps/site/components/views/location.jsx":Di}),Mi=Object.assign({});async function $i(e){var y,T,h;const t=((y=zr[`/src/data/apps/${e}/mock-test-configs.json`])==null?void 0:y.default)||{},r=((T=zr[`/src/data/apps/${e}/links.json`])==null?void 0:T.default)||[],s=((h=Mi[`/src/data/apps/${e}/config.json`])==null?void 0:h.default)||[],a=`/src/data/apps/${e}/questions/`,c=Object.keys(Fr).filter(v=>v.startsWith(a)).map(async v=>{const k=await Fr[v](),U=[...(v.split("/").pop()||"").matchAll(/\[([^\]]+)\]/g)].map(Q=>Q[1]),P=k.default||k,z={};return U.length>0&&U[0].length>0&&(z.section=U[0]),U.length>1&&U[1].length>0&&(z.sectionName=U[1]),U.length>2&&U[2].length>0&&(z.category=U[2]),Array.isArray(P)?P.map(Q=>({...Q,...z})):[{...P,...z}]}),i=(await Promise.all(c)).flat().map((v,k)=>({...v,id:`${e}-m${k}-${v.id??k+1}`})),g=`/src/data/apps/${e}/components/`,f=[];Object.keys(nn).forEach(v=>{if(v.startsWith(g)){const k=v.split("/").pop().replace(".jsx","");f[k]=nn[v].default}});const w=i.reduce((v,k)=>(v[k.section]=v[k.section]||{data:[],name:k.sectionName,id:k.section,count:0},v[k.section].data.push(k),v[k.section].count++,v),{});return{questions:i,sections:Object.values(w),mockTestConfigs:t,links:r,components:f,siteConfig:s}}function sc(e,t){const r=`/src/data/apps/${e}/components/${t}.jsx`;let s=Object.keys(nn).find(a=>a===r);return s?nn[s].default:null}const zi=()=>"http://localhost:3002/api",Fi=zi();class ji{constructor(){this.apiUrl=Fi,console.log(`QuestionService initialized with API URL: ${this.apiUrl}`)}async request(t,r={},s=0){const a=`${this.apiUrl}${t}`,c={...{headers:{"Content-Type":"application/json"}},...r};Et.start();try{const u=await fetch(a,c),i=await u.json();if(!u.ok)throw new Error(i.message||`HTTP ${u.status}`);return Et.end(`API request to ${t}`),i}catch(u){if(Et.end(`API request failed to ${t}`),u.name==="TypeError"&&s<3)return console.log(`Retrying request to ${t}, attempt ${s+1}`),await new Promise(i=>setTimeout(i,1e3*(s+1))),this.request(t,r,s+1);throw u}}async loadAppData(t,r=null){const s=await $i(t);try{const a={};r&&(a.Authorization=`Bearer ${r}`);const l=await this.request(`/questions/${t}`,{method:"GET",headers:a});l&&l.questions&&l.questions.length>0&&(console.log(`Loaded ${l.questions.length} questions from database for appId: ${t}`),s.questions=l)}catch(a){console.error(`Failed to load questions for app ${t} from database:`,a)}return s}async loadQuestionsFromLocalFile(t){try{const r=await za(Object.assign({"../data/apps/hkele/index.js":()=>me(()=>import("./index-0ff576d8.js"),["./index-0ff576d8.js","./a-a8ae1c54.js","./b-ec98a30e.js","./hkelement-data-62ef8037.js","./小學二年級-b57b4aa1.js","./小學二年級2-ca1828b9.js","./小學二年級3-5453bac3.js","./幼兒園高班-89091f9f.js","./vendor-5459011e.js","./icons-879ffb6b.js","./maps-3d542140.js","./utils-4ea7c3f0.js"],import.meta.url),"../data/apps/hktaxi/index.js":()=>me(()=>import("./index-7283624d.js"),["./index-7283624d.js","./_乙部__道路使用者守則_-31b0a9db.js","./hk-taxi-_乙部__道路使用者守則_-test-data-04029491.js","./hk-taxi-_甲部__地方_-questions-2fb88e81.js","./hk-taxi-_甲部__的士則例_-question-9cdeaa3b.js","./hk-taxi-_甲部__的士則例_-question2-7503acd2.js","./hk-taxi-_甲部__路線_-questions-5a7d0128.js","./hk-taxi-area-questions-penalty-029f713c.js","./hk-taxi-area-questions-penalty2-4a56e7d1.js","./hk-taxi-area-questions-penalty3-38fc827a.js","./hk-taxi-area-questions-penalty4-cd590e8e.js","./hk-taxi-area-questions-penalty5-5b634b02.js","./hk-taxi-area-questions-2fb88e81.js","./hk-taxi-extra-main-road-72e6a2ce.js","./hk-taxi-extra-main-road2-f0165099.js","./hk-taxi-route-questions-5a7d0128.js","./vendor-5459011e.js","./icons-879ffb6b.js","./maps-3d542140.js","./utils-4ea7c3f0.js"],import.meta.url),"../data/apps/site/index.js":()=>me(()=>import("./index-d25f1384.js"),["./index-d25f1384.js","./vendor-5459011e.js","./icons-879ffb6b.js","./maps-3d542140.js","./utils-4ea7c3f0.js"],import.meta.url)}),`../data/apps/${t}/index.js`);return{questions:r.hkTaxiQuestions||[],sections:r.sections||[],mockTestConfigs:r.mockTestConfigs||{},links:r.links||[],source:"local"}}catch(r){return console.error(`Failed to load questions for app ${t} from local file:`,r),{questions:[],sections:[],mockTestConfigs:{},links:[],source:"error"}}}async getAvailableApps(t=null){try{const r={};return t&&(r.Authorization=`Bearer ${t}`),await this.request("/questions/apps",{method:"GET",headers:r})}catch(r){return console.error("Failed to load available apps from database:",r),this.getAvailableAppsFromLocal()}}async getAvailableAppsFromLocal(){try{return{apps:[{id:"hkele",name:"香港的小學考試(練習)",description:"香港的小學考試(練習)"},{id:"hktaxi",name:"香港的士考試(備考)",description:"的士常識及地方試題備考"}],source:"local"}}catch(t){return console.error("Failed to load available apps from local:",t),{apps:[],source:"error"}}}async uploadQuestionsToDatabase(t,r,s,a,l,c){try{if(!c)throw new Error("Authentication required for upload");return await this.request(`/questions/${t}/upload`,{method:"POST",headers:{Authorization:`Bearer ${c}`},body:JSON.stringify({questions:r,sections:s,mockTestConfigs:a,links:l})})}catch(u){throw console.error(`Failed to upload questions for app ${t} to database:`,u),u}}async getUserProgress(t,r){try{return r?{...await this.request(`/questions/${t}/progress`,{method:"GET",headers:{Authorization:`Bearer ${r}`}}),source:"database"}:{progress:{},source:"local"}}catch(s){return console.error(`Failed to load progress for app ${t} from database:`,s),{progress:{},source:"error"}}}async syncUserProgress(t,r,s){try{return s?await this.request(`/questions/${t}/progress/sync`,{method:"POST",headers:{Authorization:`Bearer ${s}`},body:JSON.stringify(r)}):{success:!1,message:"Authentication required for sync"}}catch(a){throw console.error(`Failed to sync progress for app ${t} to database:`,a),a}}}const Vt=new ji,jr=()=>({count:0,lastAnswered:null,completed:!1}),Ui=(e,t,r)=>{const s=(e==null?void 0:e.completed)||!1,a=t>=r;return s!==a||(e==null?void 0:e.count)!==t},on=Yr($a((e,t)=>({updateTime:0,questions:[],sections:[],mockTestConfigs:{},config:{siteName:"香港的士考試練習APP",siteDescription:"按甲、乙部分類練習，助您順利通過的士考試"},questionCounters:{},targetCount:3,statistics:{totalAnswered:0,correctAnswers:0,lastPractice:null},wrongAnswers:[],settings:{autoNextEnabled:!1,randomizeOptions:!1,showExplanation:!0,enableGoogleSearch:!0},initializeCounters:()=>{const{questions:r,questionCounters:s}=t();let a=!1;const l={...s};return r.forEach(c=>{l[c.id]||(l[c.id]=jr(),a=!0)}),a&&e({questionCounters:l}),l},updateQuestionCount:async(r,s)=>{var y;const{questionCounters:a,targetCount:l,statistics:c}=t(),u=a[r],i=s?((u==null?void 0:u.count)||0)+1:Math.max(0,((u==null?void 0:u.count)||0)-1);if(!Ui(u,i,l)&&c.totalAnswered===t().statistics.totalAnswered)return;const g={...a};g[r]||(g[r]=jr()),g[r].count=i,g[r].lastAnswered=new Date().toISOString(),g[r].completed=i>=l;const f={totalAnswered:c.totalAnswered+1,correctAnswers:c.correctAnswers+(s?1:0),lastPractice:new Date().toISOString()},w=[...t().wrongAnswers];if(!s)w.includes(r)||w.push(r);else{const T=w.indexOf(r);T>-1&&w.splice(T,1)}e({questionCounters:g,statistics:f,wrongAnswers:w});try{const{currentSite:T,sitesConfig:h}=t(),v=localStorage.getItem("token");if(v&&T&&((y=h[T])!=null&&y.dataPath)){const k=h[T].dataPath,I={[r]:{count:i,completed:i>=l,lastAnswered:new Date().toISOString()}};Vt.syncUserProgress(k,I,v).then(U=>{U.success?console.log(`Progress synced to database for question ${r}`):console.warn(`Failed to sync progress for question ${r}:`,U.message)}).catch(U=>{console.error(`Error syncing progress for question ${r}:`,U)})}}catch(T){console.error("Error in database sync after updateQuestionCount:",T)}},getQuestionCount:r=>{const{questionCounters:s}=t();return s[r]||{count:0,completed:!1}},getIncompleteQuestions:()=>{const{questions:r,questionCounters:s}=t();return r.filter(a=>{var l;return!((l=s[a.id])!=null&&l.completed)})},getCompletedQuestions:()=>{const{questions:r,questionCounters:s}=t();return r.filter(a=>{var l;return(l=s[a.id])==null?void 0:l.completed})},getRandomIncompleteQuestion:()=>{const r=t().getIncompleteQuestions();if(r.length===0)return null;const s=Math.floor(Math.random()*r.length);return r[s]},isAllCompleted:()=>t().getIncompleteQuestions().length===0,isAllCompletedForQuestions:(r=hkTaxiQuestions)=>{const{questionCounters:s}=t();return r.every(a=>{var l;return(l=s[a.id])==null?void 0:l.completed})},getProgressStats:(r=null)=>{const{questions:s,questionCounters:a}=t(),l=r||s,c=l.length,u=l.filter(g=>{var f;return(f=a[g.id])==null?void 0:f.completed}).length,i=c>0?Math.round(u/c*100):0;return{total:c,completed:u,percentage:i,incomplete:c-u}},getProgressBySection:()=>{const{sections:r,questions:s,questionCounters:a}=t(),l={};return r.forEach(c=>{const u=s.filter(i=>i.section===c.id);l[c.id]={name:c.name,total:u.length,completed:u.filter(i=>{var g;return(g=a[i.id])==null?void 0:g.completed}).length,percentage:0},l[c.id].total>0&&(l[c.id].percentage=Math.round(l[c.id].completed/l[c.id].total*100))}),l},getProgressByCategory:()=>{const{questions:r,questionCounters:s}=t(),a={};return r.forEach(l=>{a[l.category]||(a[l.category]={total:0,completed:0,questions:[]}),a[l.category].total++;const c=t().getQuestionCount(l.id);c.completed&&a[l.category].completed++,a[l.category].questions.push({...l,counter:c})}),a},getAllQuestionCounts:()=>{const{questions:r,questionCounters:s}=t(),a={};return r.forEach(l=>{a[l.id]={...l,counter:t().getQuestionCount(l.id)}}),a},resetCounters:()=>{const{questions:r}=t(),s={};return r.forEach(a=>{s[a.id]={count:0,lastAnswered:null,completed:!1}}),e({questionCounters:s,statistics:{totalAnswered:0,correctAnswers:0,lastPractice:null},wrongAnswers:[]}),s},resetCountersForQuestions:r=>{const{questionCounters:s}=t(),a={...s};return r.forEach(l=>{a[l]&&(a[l]={count:0,lastAnswered:null,completed:!1})}),e({questionCounters:a}),a},resetQuestionCounter:r=>{const{questionCounters:s}=t(),a={...s};return a[r]&&(a[r]={count:0,lastAnswered:null,completed:!1}),e({questionCounters:a}),a[r]},resetCompletion:r=>{const{questionCounters:s}=t(),a={...s};return a[r]&&(a[r].completed=!1),e({questionCounters:a}),a[r]},setTargetCount:r=>{const{questionCounters:s}=t(),a={...s};Object.keys(a).forEach(l=>{const c=a[l];c.completed=c.count>=r}),e({questionCounters:a,targetCount:r})},updateSettings:r=>{e({settings:{...t().settings,...r}})},clearWrongAnswers:()=>{e({wrongAnswers:[]})},setConfig:r=>{e({config:r})},setSections:r=>{e({sections:r})},setQuestions:r=>{e({questions:r})},currentSite:null,sitesConfig:{hkele:{siteName:"香港的小學考試(練習)",siteDescription:"香港的小學考試(練習)",logo:"/logo.png",dataPath:"hkele"},hktaxi:{siteName:"香港的士考試(備考)",siteDescription:"的士常識及地方試題備考",logo:"/logo.png",dataPath:"hktaxi"},site:{siteName:"地點",siteDescription:"地點",logo:"/logo.png",dataPath:"site"}},links:{},components:{},setLinks:r=>{e({links:r})},setCurrentSite:r=>{e({currentSite:r})},searchParams:new URLSearchParams,currentView:"home",setSearchParams:r=>{e({searchParams:new URLSearchParams(r)})},setCurrentView:r=>{e({currentView:r})},setSitesConfig:r=>{e({sitesConfig:r})},getCurrentSiteConfig:()=>{const{currentSite:r,sitesConfig:s}=t();return(s==null?void 0:s[r])||null},loadSiteData:async r=>{var a;const{sitesConfig:s}=t();if(!s||!((a=s[r])!=null&&a.dataPath))return null;Et.start();try{const l=localStorage.getItem("token"),c=s[r].dataPath;console.log(`Loading data for appId: ${c} from database`);const u=await Vt.loadAppData(c,l);console.log("dbData",u);const i=u;if(console.log(`Loaded ${i.questions.length} questions from ${i.source} for appId: ${c}`),e({mockTestConfigs:i.mockTestConfigs}),e({links:i.links}),e({components:i.components}),l)try{const g=await Vt.getUserProgress(c,l);if(g&&g.progress){const{questionCounters:f}=t(),w={...f};Object.entries(g.progress).forEach(([y,T])=>{w[y]={count:T.count||0,lastAnswered:T.lastAnswered||null,completed:T.completed||!1}}),e({questionCounters:w}),console.log(`Loaded progress for ${Object.keys(g.progress).length} questions from database`)}}catch(g){console.error(`Failed to load progress from database for appId: ${c}`,g)}return e({updateTime:new Date().getTime()}),Et.end(`Site data loaded for ${r} from ${i.source}`),i}catch(l){return console.error(`Failed to load data for site ${r}:`,l),Et.end(`Site data load failed for ${r}`),null}},getComponentMenuItems:()=>{const{components:r,currentSite:s}=t();return Object.keys(r).length===0?[]:Object.entries(r).map(([l,c])=>{const u=l.split("/").pop().replace(".jsx","");return{id:`component-${u.toLowerCase()}`,label:u,description:"動態組件",component:c.default||c,type:"component"}})},updateViewState:(r,s,a)=>{const l=new URLSearchParams(a);l.set("view",r),s(l)},syncProgressToDatabase:async()=>{var r;try{const{currentSite:s,sitesConfig:a,questionCounters:l}=t(),c=localStorage.getItem("token");if(!c)return console.log("No authentication token found, skipping database sync"),{success:!1,message:"未登錄，跳過數據庫同步"};if(!s||!((r=a[s])!=null&&r.dataPath))return console.log("No current site or dataPath found, skipping database sync"),{success:!1,message:"未找到當前站點配置，跳過數據庫同步"};const u=a[s].dataPath;console.log(`Syncing progress to database for appId: ${u}`);const i={};Object.entries(l).forEach(([f,w])=>{i[f]={count:w.count||0,completed:w.completed||!1,lastAnswered:w.lastAnswered||null}});const g=await Vt.syncUserProgress(u,i,c);return console.log("Progress sync result:",g),g}catch(s){return console.error("Failed to sync progress to database:",s),{success:!1,message:"同步失敗",error:s.message}}},startAutoSyncProgress:(r=3e4)=>{const s=setInterval(()=>{const{syncProgressToDatabase:a}=t();a()},r);return t().syncProgressToDatabase(),()=>clearInterval(s)},updateQuestionCountWithSync:async(r,s)=>{const{updateQuestionCount:a,syncProgressToDatabase:l}=t();await a(r,s);try{await l()}catch(c){console.error("Auto-sync failed after updating question count:",c)}},getMockTestConfigs:()=>{const{mockTestConfigs:r}=t();return r||{}},setMockTestConfigs:r=>{e({mockTestConfigs:r})}}),{name:"exam-app-storage",partialize:e=>({questionCounters:e.questionCounters,statistics:e.statistics,wrongAnswers:e.wrongAnswers,settings:e.settings,targetCount:e.targetCount})})),Hi=({practiceSettings:e,onUpdateSetting:t,onResetPractice:r,onToggleSettings:s,mode:a="practice"})=>e?d("div",{className:"flex flex-wrap gap-2 justify-end",children:[d("div",{className:"flex gap-2",children:[d("button",{onClick:()=>t("randomizeOptions",!e.randomizeOptions),className:`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${e.randomizeOptions?"bg-indigo-500 text-white hover:bg-indigo-600":"bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"}`,children:[o(Nn,{size:14,className:"mr-1"}),e.randomizeOptions?"選項隨機":"選項順序"]}),d("button",{onClick:()=>t("autoNextEnabled",!e.autoNextEnabled),className:`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${e.autoNextEnabled?"bg-purple-500 text-white hover:bg-purple-600":"bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"}`,children:[o(va,{size:14,className:"mr-1"}),e.autoNextEnabled?"自動下一題":"手動操作"]}),d("button",{onClick:()=>t("enableRandom",!e.enableRandom),className:`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${e.enableRandom?"bg-blue-500 text-white hover:bg-blue-600":"bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"}`,children:[o(Nn,{size:14,className:"mr-1"}),e.enableRandom?"隨機排序":"順序練習"]})]}),d("div",{className:"flex gap-2",children:[a==="practice"&&d("button",{onClick:r,className:"flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm border border-blue-600",children:[o(Gr,{size:14,className:"mr-1"}),"重新開始"]}),d("button",{onClick:s,className:"flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm border border-green-600",children:[o(Wr,{size:14,className:"mr-1"}),"學習設置"]})]})]}):null,ze={defaultSettings:{randomizeOptions:!0,autoNextEnabled:!0,enableRandom:!0,targetCount:1,enableGoogleSearch:!0,defaultFromLocationType:"random",specificDefaultLocation:""},getSettings:()=>{try{const e=localStorage.getItem("taxiPracticeSettings");if(e){const t=JSON.parse(e);return{...ze.defaultSettings,...t}}}catch(e){console.error("获取设置失败:",e)}return{...ze.defaultSettings}},saveSettings:e=>{try{const r={...ze.getSettings(),...e};return localStorage.setItem("taxiPracticeSettings",JSON.stringify(r)),r}catch(t){return console.error("保存设置失败:",t),ze.getSettings()}},updateSetting:(e,t)=>{try{const s={...ze.getSettings(),[e]:t};return localStorage.setItem("taxiPracticeSettings",JSON.stringify(s)),s}catch(r){return console.error("更新设置失败:",r),ze.getSettings()}},resetSettings:()=>{try{return localStorage.setItem("taxiPracticeSettings",JSON.stringify(ze.defaultSettings)),{...ze.defaultSettings}}catch(e){return console.error("重置设置失败:",e),ze.getSettings()}},listeners:new Set,addListener:e=>{ze.listeners.add(e)},removeListener:e=>{ze.listeners.delete(e)},notifyListeners:e=>{ze.listeners.forEach(t=>{typeof t=="function"&&t(e)})}};typeof window<"u"&&window.addEventListener("storage",e=>{if(e.key==="taxiPracticeSettings")try{const t=e.newValue?JSON.parse(e.newValue):ze.defaultSettings;ze.notifyListeners(t)}catch(t){console.error("处理存储事件失败:",t)}});const Bi=({practiceSettings:e,targetCount:t,questionCounter:r,progressStats:s,wrongQuestions:a=[],onUpdateSetting:l,onUpdateTargetCount:c,onResetQuestionCounters:u,mode:i="practice"})=>d("div",{className:"space-y-6",children:[d("div",{children:[o("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"選項隨機化"}),d("div",{className:"flex items-center gap-4",children:[o("button",{onClick:()=>l("randomizeOptions",!0),className:`px-4 py-2 rounded-lg text-sm ${e.randomizeOptions?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"開啟隨機"}),o("button",{onClick:()=>l("randomizeOptions",!1),className:`px-4 py-2 rounded-lg text-sm ${e.randomizeOptions?"bg-gray-200 text-gray-700 hover:bg-gray-300":"bg-blue-500 text-white"}`,children:"固定順序"})]}),o("p",{className:"text-xs text-gray-500 mt-1",children:"開啟後題目選項將隨機排序，避免記憶答案位置"})]}),d("div",{children:[o("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"自動下一題"}),d("div",{className:"flex items-center gap-4",children:[o("button",{onClick:()=>l("autoNextEnabled",!0),className:`px-4 py-2 rounded-lg text-sm ${e.autoNextEnabled?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"開啟自動"}),o("button",{onClick:()=>l("autoNextEnabled",!1),className:`px-4 py-2 rounded-lg text-sm ${e.autoNextEnabled?"bg-gray-200 text-gray-700 hover:bg-gray-300":"bg-blue-500 text-white"}`,children:"手動操作"})]}),o("p",{className:"text-xs text-gray-500 mt-1",children:"開啟後：答對1秒後自動下一題，答錯3秒後自動下一題"})]}),d("div",{children:[o("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"隨機排序"}),d("div",{className:"flex items-center gap-4",children:[o("button",{onClick:()=>l("enableRandom",!0),className:`px-4 py-2 rounded-lg text-sm ${e.enableRandom?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"開啟隨機"}),o("button",{onClick:()=>l("enableRandom",!1),className:`px-4 py-2 rounded-lg text-sm ${e.enableRandom?"bg-gray-200 text-gray-700 hover:bg-gray-300":"bg-blue-500 text-white"}`,children:"順序練習"})]}),o("p",{className:"text-xs text-gray-500 mt-1",children:"開啟後題目將隨機排序，避免記憶題目順序"})]}),d("div",{children:[d("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:["目標計數: ",t," 次"]}),o("div",{className:"flex gap-2",children:[1,2,3,5,10].map(g=>d("button",{onClick:()=>c(g),className:`px-3 py-1 rounded text-sm ${t===g?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:[g,"次"]},g))}),o("p",{className:"text-xs text-gray-500 mt-1",children:"答對+1，答錯-1，達到目標計數後問題不再出現"})]}),d("div",{children:[o("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Google搜索功能"}),d("div",{className:"flex items-center gap-4",children:[o("button",{onClick:()=>l("enableGoogleSearch",!0),className:`px-4 py-2 rounded-lg text-sm ${e.enableGoogleSearch?"bg-blue-500 text-white":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,children:"開啟搜索"}),o("button",{onClick:()=>l("enableGoogleSearch",!1),className:`px-4 py-2 rounded-lg text-sm ${e.enableGoogleSearch?"bg-gray-200 text-gray-700 hover:bg-gray-300":"bg-blue-500 text-white"}`,children:"關閉搜索"})]}),o("p",{className:"text-xs text-gray-500 mt-1",children:"開啟後可在問題卡片中點擊按鈕搜索相關問題答案"})]}),r&&d("div",{className:"space-y-3",children:[d("div",{children:[o("h5",{className:"text-sm font-medium text-gray-700 mb-1",children:i==="wrong"?"當前錯題進度":"當前學習進度"}),d("div",{className:"bg-gray-100 rounded p-2",children:[d("div",{className:"flex justify-between text-sm",children:[d("span",{children:["已完成: ",s.completed," 題"]}),d("span",{children:["未完成: ",s.incomplete," 題"]})]}),o("div",{className:"w-full bg-gray-300 rounded-full h-2 mt-1",children:o("div",{className:"bg-green-500 h-2 rounded-full transition-all duration-300",style:{width:`${s.percentage}%`}})}),d("div",{className:"text-xs text-gray-600 text-center mt-1",children:[s.percentage,"% 完成"]})]})]}),i==="wrong"&&a.length>0&&d("div",{children:[o("h5",{className:"text-sm font-medium text-gray-700 mb-1",children:"錯題統計"}),d("div",{className:"bg-gray-100 rounded p-2 text-sm",children:[d("div",{className:"flex justify-between",children:[d("span",{children:["錯題總數: ",a.length]}),d("span",{children:["已完成: ",a.filter(g=>g.completed).length]})]}),o("div",{className:"w-full bg-gray-300 rounded-full h-2 mt-1",children:o("div",{className:"bg-green-500 h-2 rounded-full transition-all duration-300",style:{width:`${a.length>0?a.filter(g=>g.completed).length/a.length*100:0}%`}})}),d("div",{className:"text-xs text-gray-600 text-center mt-1",children:[a.length>0?Math.round(a.filter(g=>g.completed).length/a.length*100):0,"% 完成"]})]})]}),d("div",{children:[o("button",{onClick:u,className:"px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm",children:"重置所有問題計數"}),o("p",{className:"text-xs text-gray-500 mt-1",children:"清除所有問題的計數記錄，重新開始"})]})]})]}),Wi=({showSettings:e,setShowSettings:t,practiceSettings:r,targetCount:s,questionCounter:a,progressStats:l,wrongQuestions:c=[],onUpdateSetting:u,onUpdateTargetCount:i,onResetQuestionCounters:g,mode:f="practice",title:w="設置",subtitle:y="管理學習和地點設置"})=>{const[T,h]=m.useState("study");return e?o("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",onClick:()=>t(!1),children:d("div",{className:"bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative",onClick:v=>v.stopPropagation(),children:[o("button",{onClick:()=>t(!1),className:"fixed top-6 right-6 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors z-10","aria-label":"關閉對話框",children:o("svg",{className:"w-5 h-5 text-gray-500",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})}),d("div",{className:"p-6 border-b border-gray-200",children:[o("h3",{className:"text-lg font-semibold text-gray-800",children:w}),o("p",{className:"text-sm text-gray-600 mt-1",children:y})]}),o("div",{className:"border-b border-gray-200",children:o("div",{className:"flex",children:o("button",{onClick:()=>h("study"),className:`flex-1 px-6 py-3 text-sm font-medium transition-colors ${T==="study"?"text-blue-600 border-b-2 border-blue-600":"text-gray-500 hover:text-gray-700"}`,children:"學習設置"})})}),o("div",{className:"p-6",children:T==="study"&&o(Bi,{practiceSettings:r,targetCount:s,questionCounter:a,progressStats:l,wrongQuestions:c,onUpdateSetting:u,onUpdateTargetCount:i,onResetQuestionCounters:g,mode:f})}),o("div",{className:"p-6 border-t border-gray-200 flex justify-end",children:o("button",{onClick:()=>t(!1),className:"px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors",children:"關閉"})})]})}):null},Gi=({showSettings:e,setShowSettings:t,practiceSettings:r,targetCount:s,questionCounter:a,progressStats:l,wrongQuestions:c=[],onUpdateSetting:u,onUpdateTargetCount:i,onResetQuestionCounters:g,mode:f="practice",title:w="設置",subtitle:y="管理學習和地點設置"})=>o(Wi,{showSettings:e,setShowSettings:t,practiceSettings:r,targetCount:s,questionCounter:a,progressStats:l,wrongQuestions:c,onUpdateSetting:u,onUpdateTargetCount:i,onResetQuestionCounters:g,mode:f,title:w,subtitle:y}),Fe={getWrongAnswers:()=>{try{const e=localStorage.getItem("hkTaxiWrongAnswers");return e?JSON.parse(e):[]}catch{return[]}},getAnsweredQuestions:()=>{try{const e=localStorage.getItem("hkTaxiAnsweredQuestions");return e?JSON.parse(e):{}}catch{return{}}},getAllQuestionsCount(){},recordAnsweredQuestion:(e,t)=>{var r,s,a,l;try{const c=Fe.getAnsweredQuestions();c[e]={answered:!0,isCorrect:t,lastAnswered:new Date().toISOString(),correctCount:t?(((r=c[e])==null?void 0:r.correctCount)||0)+1:((s=c[e])==null?void 0:s.correctCount)||0,wrongCount:t?((l=c[e])==null?void 0:l.wrongCount)||0:(((a=c[e])==null?void 0:a.wrongCount)||0)+1},localStorage.setItem("hkTaxiAnsweredQuestions",JSON.stringify(c))}catch(c){console.error("记录答题失败:",c)}},getQuestionStrategy:()=>{try{return localStorage.getItem("hkTaxiQuestionStrategy")||"random"}catch{return"random"}},saveQuestionStrategy:e=>{try{localStorage.setItem("hkTaxiQuestionStrategy",e)}catch(t){console.error("保存出题策略失败:",t)}},getWrongAnswerCounts:()=>{try{const e=localStorage.getItem("hkTaxiWrongAnswerCounts");return e?JSON.parse(e):{}}catch{return{}}},saveWrongAnswer:e=>{try{const t=Fe.getWrongAnswers();t.includes(e)||(t.push(e),localStorage.setItem("hkTaxiWrongAnswers",JSON.stringify(t)));const r=Fe.getWrongAnswerCounts();r[e]=(r[e]||0)+1,localStorage.setItem("hkTaxiWrongAnswerCounts",JSON.stringify(r))}catch(t){console.error("保存错题失败:",t)}},removeWrongAnswer:e=>{try{const r=Fe.getWrongAnswers().filter(a=>a!==e);localStorage.setItem("hkTaxiWrongAnswers",JSON.stringify(r));const s=Fe.getWrongAnswerCounts();delete s[e],localStorage.setItem("hkTaxiWrongAnswerCounts",JSON.stringify(s))}catch(t){console.error("移除错题失败:",t)}},getStatistics:()=>{try{const e=localStorage.getItem("hkTaxiStatistics");return e?JSON.parse(e):{totalAnswered:0,correctAnswers:0,wrongAnswers:0,lastPractice:null}}catch{return{totalAnswered:0,correctAnswers:0,wrongAnswers:0,lastPractice:null}}},updateStatistics:e=>{try{const t=Fe.getStatistics();t.totalAnswered++,e?t.correctAnswers++:t.wrongAnswers++,t.lastPractice=new Date().toISOString(),localStorage.setItem("hkTaxiStatistics",JSON.stringify(t))}catch(t){console.error("更新统计失败:",t)}},resetStatistics:()=>{try{const e={totalAnswered:0,correctAnswers:0,wrongAnswers:0,lastPractice:null};localStorage.setItem("hkTaxiStatistics",JSON.stringify(e))}catch(e){console.error("重置统计失败:",e)}},resetAllData:()=>{try{localStorage.removeItem("hkTaxiWrongAnswers"),localStorage.removeItem("hkTaxiWrongAnswerCounts"),Fe.resetStatistics(),localStorage.removeItem("taxiTargetCount"),console.log("所有数据已重置")}catch(e){console.error("重置所有数据失败:",e)}},resetWrongAnswers:()=>{try{localStorage.removeItem("hkTaxiWrongAnswers"),localStorage.removeItem("hkTaxiWrongAnswerCounts")}catch(e){console.error("重置错题记录失败:",e)}},resetWrongAnswerCount:e=>{try{const t=Fe.getWrongAnswerCounts();t[e]&&(t[e]=0,localStorage.setItem("hkTaxiWrongAnswerCounts",JSON.stringify(t)))}catch(t){console.error("重置错误次数失败:",t)}},saveMockTestRecords:e=>{try{localStorage.setItem("hkTaxiMockTestRecords",JSON.stringify(e))}catch(t){console.error("保存模擬測試記錄失敗:",t)}},getMockTestRecords:()=>{try{const e=localStorage.getItem("hkTaxiMockTestRecords");if(e)return JSON.parse(e)}catch(e){console.error("獲取模擬測試記錄失敗:",e)}return[]},clearMockTestRecords:()=>{try{localStorage.removeItem("hkTaxiMockTestRecords"),localStorage.removeItem("hkTaxiAnsweredQuestions"),localStorage.removeItem("hkTaxiWrongAnswers"),localStorage.removeItem("hkTaxiWrongAnswerCounts")}catch(e){console.error("清除模擬測試記錄失敗:",e)}},saveCategoryFilter:(e,t,r)=>{try{const s={mode:e,section:t,category:r,timestamp:Date.now()};localStorage.setItem("hkTaxiCategoryFilter",JSON.stringify(s))}catch(s){console.error("保存类别过滤状态失败:",s)}},getCategoryFilter:()=>{try{const e=localStorage.getItem("hkTaxiCategoryFilter");if(e){const t=JSON.parse(e);if(Date.now()-t.timestamp<24*60*60*1e3)return t}}catch(e){console.error("获取类别过滤状态失败:",e)}return null},clearCategoryFilter:()=>{try{localStorage.removeItem("hkTaxiCategoryFilter")}catch(e){console.error("清除类别过滤状态失败:",e)}}},qi=({showCompletion:e,completionTime:t,onResetPractice:r,onReviewWrongAnswers:s})=>e?o("div",{className:"mt-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-6 text-white shadow-lg",children:d("div",{className:"text-center",children:[o("div",{className:"animate-bounce mb-4",children:o("svg",{className:"w-16 h-16 mx-auto",fill:"currentColor",viewBox:"0 0 24 24",children:o("path",{d:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"})})}),o("h3",{className:"text-2xl font-bold mb-2",children:"🎉 恭喜！所有题目已完成 🎉"}),o("p",{className:"text-lg mb-4",children:"您已经成功掌握所有题目知识！"}),o("div",{className:"bg-white bg-opacity-20 rounded-lg p-4 mb-4",children:d("div",{className:"grid grid-cols-2 gap-4 text-sm",children:[d("div",{children:[o("span",{className:"font-semibold",children:"完成时间:"}),o("br",{}),(t==null?void 0:t.toLocaleTimeString("zh-HK"))||"刚刚"]}),d("div",{children:[o("span",{className:"font-semibold",children:"正确率:"}),o("br",{}),Fe.getStatistics().total>0?Math.round(Fe.getStatistics().correct/Fe.getStatistics().total*100)+"%":"100%"]}),d("div",{children:[o("span",{className:"font-semibold",children:"总答题数:"}),o("br",{}),Fe.getStatistics().total||0]}),d("div",{children:[o("span",{className:"font-semibold",children:"正确题数:"}),o("br",{}),Fe.getStatistics().correct||0]})]})}),d("div",{className:"space-y-3 text-sm",children:[o("p",{className:"font-medium",children:"🎯 下一步建议："}),d("ul",{className:"space-y-1",children:[o("li",{children:"• 复习错题本加强薄弱环节"}),o("li",{children:"• 挑战更高难度的随机测试"}),o("li",{children:"• 分享您的学习成果"})]})]}),d("div",{className:"flex justify-center gap-3 mt-6",children:[o("button",{onClick:r,className:"px-6 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold shadow-md",children:"🔄 重新开始"}),o("button",{onClick:s,className:"px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold shadow-md",children:"📚 复习错题"})]})]})}):null,Yi=({showTooltip:e,setShowTooltip:t,tooltipType:r,getQuestionCount:s,targetCount:a})=>e?o("div",{className:"fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40 p-4",onClick:()=>t(!1),children:d("div",{className:"bg-white rounded-lg p-6 max-w-md w-full shadow-xl relative",onClick:l=>l.stopPropagation(),children:[o("button",{onClick:()=>t(!1),className:"fixed top-6 right-6 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors z-10","aria-label":"关闭对话框",children:o("svg",{className:"w-5 h-5 text-gray-500",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})}),d("div",{className:"flex items-center mb-4",children:[o(Cn,{className:"text-blue-500 mr-3",size:24}),o("h3",{className:"text-lg font-semibold text-gray-800",children:"进度说明"})]}),d("div",{className:"space-y-3 text-sm text-gray-600",children:[r==="progress"&&d("div",{children:[o("p",{className:"font-medium text-blue-800 mb-2",children:"进度说明"}),s?d(qe,{children:[o("p",{children:"• 显示已完成问题数量/总问题数量"}),d("p",{children:["• 每个问题需要答对",a,"次才算完成"]}),o("p",{children:"• 答对+1，答错-1，达到目标计数后问题不再出现"})]}):d(qe,{children:[o("p",{children:"• 显示当前题号/总题数"}),o("p",{children:"• 按顺序练习所有题目"}),o("p",{children:"• 适合初次学习和全面复习"})]})]}),r==="mode"&&d("div",{children:[o("p",{className:"font-medium text-blue-800 mb-2",children:"模式说明"}),s?d(qe,{children:[d("p",{children:[o("strong",{children:"学习模式："}),"每个问题需要答对",a,"次才算完成"]}),o("p",{children:"• 答对+1，答错-1，达到目标计数后问题不再出现"}),o("p",{children:"• 所有问题完成后会自动重置重新开始"}),o("p",{children:"• 适合强化记忆和重点突破"})]}):d(qe,{children:[d("p",{children:[o("strong",{children:"练习模式："}),"按顺序练习所有题目"]}),o("p",{children:"• 答错题目会自动加入错题本"}),o("p",{children:"• 适合初次学习和全面复习"}),o("p",{children:"• 可以随时切换为学习模式"})]})]})]}),o("div",{className:"flex justify-end mt-4",children:o("button",{onClick:()=>t(!1),className:"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm",children:"知道了"})})]})}):null,Vi=({mode:e="all",section:t=null,sections:r=[],getQuestionCount:s=!1,targetCount:a=3})=>d("div",{className:"mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4",children:[o("h4",{className:"font-semibold text-blue-800 mb-2",children:"练习模式说明"}),d("ul",{className:"text-blue-700 text-sm space-y-1",children:[d("li",{children:["• ",(()=>{var c;switch(e){case"wrong":return"专注于答错的题目，加强薄弱环节";case"section":return`系统学习${((c=r.find(i=>i.id===t))==null?void 0:c.name)||t}章节的所有题目，全面掌握知识`;default:return"系统学习所有题目，全面掌握知识"}})()]}),o("li",{children:"• 答错题目会自动加入错题本，方便后续针对性练习"}),o("li",{children:"• 开启随机排序可以打乱题目顺序，避免记忆顺序"}),s?d(qe,{children:[o("li",{children:"• 每个问题都有独立的计数属性（答对+1，答错-1）"}),d("li",{children:["• 达到目标计数（",a,"次）的问题不再出现在练习中"]}),o("li",{children:"• 未完成的问题会继续出现，直到达到目标计数"}),o("li",{children:"• 所有问题都完成后可以手动重置重新开始"})]}):d(qe,{children:[o("li",{children:"• 按顺序练习所有题目，系统学习知识"}),o("li",{children:"• 完成所有题目后可以重新开始练习"})]})]})]}),Qi=m.lazy(()=>me(()=>import("./QuestionCardWithRecording-152fc348.js"),["./QuestionCardWithRecording-152fc348.js","./vendor-5459011e.js","./QuestionCard-8d5d58ad.js","./maps-3d542140.js","./icons-879ffb6b.js","./index-ace84cd6.js","./utils-4ea7c3f0.js","./index-7f56b1c5.css"],import.meta.url)),vn={QUESTION_ORDER:"questionOrder",CATEGORY_FILTER:"categoryFilter"},Ki=5*60*1e3,Ji=({mode:e="all",section:t=null,showExplanation:r=!0})=>{var oe,Se;const[s,a]=Xs(),[l,c]=m.useState([]),[u,i]=m.useState(0),[g,f]=m.useState(0),[w,y]=m.useState(!1),[T,h]=m.useState(new Set),[v,k]=m.useState(!1),[I,U]=m.useState({total:0,completed:0,percentage:0,incomplete:0}),[P,z]=m.useState(null),[Q,H]=m.useState([]),[te,$]=m.useState(!1),[Ce,ye]=m.useState(!1),[Te,ie]=m.useState(""),[re,be]=m.useState(null),[V,F]=m.useState(!1),[xe,_e]=m.useState(null),[ce,C]=m.useState(s.get("category")||""),[R,B]=m.useState(!1),{questions:X,sections:_,wrongAnswers:x,settings:D,targetCount:ne,updateQuestionCount:Z,getQuestionCount:W,getProgressStats:We,resetCountersForQuestions:ge,setTargetCount:tt,updateSettings:se}=on(),it=m.useRef(!0),pe=m.useCallback((A=u)=>{try{const G=new URLSearchParams(window.location.search),Y=Object.fromEntries(G.entries());Y.index=A.toString(),a(Y,{replace:!0})}catch(G){console.error("Error saving state:",G)}},[u,a]),Ye=m.useCallback(A=>{try{A!=null&&A.length&&localStorage.setItem(vn.QUESTION_ORDER,JSON.stringify({timestamp:Date.now(),questionOrder:A}))}catch(G){console.error("Error saving question order:",G)}},[]),Pe=m.useCallback((A,G,Y)=>{let K=[];switch(A){case"wrong":const ve=Fe.getWrongAnswers();K=X.filter(Qe=>ve.includes(Qe.id));break;case"section":K=X.filter(Qe=>Qe.section===G);break;default:K=[...X]}return Y&&(K=K.filter(ve=>ve.category===Y)),K},[X]),Ae=m.useMemo(()=>{const A=new Map;let G=[];switch(e){case"wrong":G=X.filter(Y=>x.includes(Y.id));break;case"section":G=X.filter(Y=>Y.section===t);break;default:G=[...X]}return G.forEach(Y=>{var K;(K=Y.category)!=null&&K.trim()&&A.set(Y.category,(A.get(Y.category)||0)+1)}),Array.from(A.entries()).map(([Y,K])=>({category:Y,count:K})).sort((Y,K)=>Y.category.localeCompare(K.category))},[e,t,X,x]),Be=m.useCallback((A=null)=>{const G=A||{getQuestionCount:W};let Y=Pe(e,t,ce);if(P!=null&&P.enableRandom&&G.getQuestionCount){const K=Y.filter(ve=>{var Qe;return!((Qe=G.getQuestionCount(ve.id))!=null&&Qe.completed)});K.length>0&&(Y=K)}if(Q.length===Y.length&&Q.every(K=>Y.some(ve=>ve.id===K))){const K=Q.map(ve=>Y.find(Qe=>Qe.id===ve)).filter(Boolean);K.length===Y.length&&(Y=K)}else if(P!=null&&P.enableRandom){Y=[...Y].sort(()=>Math.random()-.5);const K=Y.map(ve=>ve.id);H(K),Ye(K),y(!0)}else y(!1);if(c(Y),h(new Set),G.getProgressStats){const K=G.getProgressStats(Y);U(K)}return Y},[e,t,ce,X,P,Q,Ye,W]),Ve=m.useCallback(async A=>{if(!l[u])return;const G=l[u].id;if(Fe.updateStatistics(A),W){await Z(G,A);const Y=Pe(e,t,ce),K=We(Y);U(K)}f(Y=>Y+1),A||Fe.saveWrongAnswer(G),h(Y=>new Set([...Y,G]))},[u,l,e,t,ce,Z,W,We,Pe]),Je=m.useCallback(()=>{if(l.length===0)return;let A;if(P!=null&&P.enableRandom&&W){const G=l.filter(Y=>{var K;return!((K=W(Y.id))!=null&&K.completed)});if(G.length>0){const Y=G[Math.floor(Math.random()*G.length)];A=l.findIndex(K=>K.id===Y.id)}else A=u<l.length-1?u+1:0}else A=u<l.length-1?u+1:0;i(A),pe(A)},[l,u,P,W,pe]),M=m.useCallback(()=>{if(u>0){const A=u-1;i(A),pe(A)}},[u,pe]),ee=m.useCallback(()=>{if(W){const A=Pe(e,t,ce).map(G=>G.id);ge(A)}F(!1),be(null),_e(null),f(0),h(new Set),H([]),y(!1),Be(),$(!1)},[e,t,ce,W,ge,Pe,Be]),ae=m.useCallback((A,G)=>{const Y=ze.updateSetting(A,G);se({[A]:G}),z(Y)},[se]),S=m.useCallback(A=>{tt(A),ze.updateSetting("targetCount",A),W&&Be()},[tt,W,Be]),N=m.useCallback(()=>{try{const A=localStorage.getItem(vn.QUESTION_ORDER);if(A){const G=JSON.parse(A);if(Date.now()-G.timestamp<Ki&&Array.isArray(G.questionOrder))return H(G.questionOrder),!0}}catch(A){console.error("Error restoring question order:",A)}return!1},[]),O=m.useCallback(A=>{C(A),B(!1);const G=new URLSearchParams(s);A?G.set("category",A):G.delete("category"),G.set("index","0"),a(G,{replace:!0}),H([]),localStorage.removeItem(vn.QUESTION_ORDER),i(0)},[s,a]);m.useEffect(()=>{if(it.current){it.current=!1;return}Be(),i(0),pe(0)},[e,t,ce]),m.useEffect(()=>{z(D)},[D]),m.useEffect(()=>{N()||Be();const G=Pe(e,t,ce);G.every(K=>{var ve;return(ve=W(K.id))==null?void 0:ve.completed})&&G.length>0&&(F(!0),_e(new Date))},[]),m.useEffect(()=>{if(!W||V||re!==null)return;if(Pe(e,t,ce).every(Y=>{var K;return(K=W(Y.id))==null?void 0:K.completed})&&I.percentage===100){be(3),_e(new Date);const Y=setInterval(()=>{be(K=>K<=1?(clearInterval(Y),F(!0),null):K-1)},1e3);return()=>clearInterval(Y)}},[I.percentage,V,re,W,e,t,ce,Pe]);const q=m.useMemo(()=>W?I.total>0?I.completed/I.total*100:0:l.length>0?(u+1)/l.length*100:0,[W,I,l.length,u]),J=l[u];return X.length===0?o("div",{className:"text-center py-12",children:d("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto",children:[o("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"}),o("h3",{className:"text-lg font-semibold text-blue-800 mb-2",children:"正在加载题目..."}),o("p",{className:"text-blue-700",children:"请稍候，正在准备学习内容"})]})}):d("div",{className:"max-w-4xl mx-auto",children:[d("div",{className:"bg-white rounded-lg shadow-sm p-4 mb-6",children:[d("div",{className:"flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:[o("div",{className:"flex-1 min-w-0",children:d("h2",{className:"text-xl font-bold text-gray-800 truncate",children:[e==="all"&&"全部题目练习",e==="wrong"&&"错题练习",e==="section"&&`${t} ${(oe=_.find(A=>A.id===t))==null?void 0:oe.name}练习`,(P==null?void 0:P.enableRandom)&&" (随机排序)",ce&&` - ${ce}`]})}),d("div",{className:"flex items-center gap-2",children:[o(Hi,{practiceSettings:P,onUpdateSetting:ae,onResetPractice:()=>$(!0),onToggleSettings:()=>k(!0),mode:"practice"}),Ae.length>0&&d("button",{onClick:()=>B(!R),className:`flex items-center px-3 py-2 rounded-lg transition-colors ${ce?"bg-blue-500 text-white hover:bg-blue-600":"bg-gray-200 text-gray-700 hover:bg-gray-300"}`,title:"按类别过滤题目",children:[o(Br,{size:16,className:"mr-1"}),"过滤",ce&&d("span",{className:"ml-1 bg-white bg-opacity-20 px-1 rounded text-xs",children:[ce," (",((Se=Ae.find(A=>A.category===ce))==null?void 0:Se.count)||0,")"]})]})]})]}),d("div",{className:"mt-3",children:[o("div",{className:"w-full bg-gray-200 rounded-full h-2 mb-2",children:o("div",{className:"bg-blue-500 h-2 rounded-full transition-all duration-300",style:{width:`${q}%`}})}),d("div",{className:"flex justify-between items-center text-sm text-gray-600",children:[d("div",{className:"flex items-center gap-1 cursor-help",onClick:()=>{ye(!0),ie("progress")},children:[o("span",{children:W?`进度: ${I.completed}/${I.total} 题 (${I.percentage}%)`:`进度: ${u+1}/${l.length} 题`}),d("span",{children:["已答: ",g," 题"]}),o(Cn,{size:12,className:"text-blue-500"})]}),d("div",{className:"flex items-center gap-1 cursor-help",onClick:()=>{ye(!0),ie("mode")},children:[o("span",{children:W?`学习模式: 目标${ne}次`:"练习模式: 顺序练习"}),o(Cn,{size:12,className:"text-blue-500"})]})]})]})]}),R&&Ae.length>0&&d(qe,{children:[o("div",{className:"fixed inset-0 z-10",onClick:()=>B(!1)}),d("div",{className:"fixed lg:absolute top-20 lg:top-16 right-4 lg:right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-48",children:[d("div",{className:"flex justify-between items-center mb-3",children:[o("h3",{className:"font-semibold text-gray-800",children:"按类别过滤"}),o("button",{onClick:()=>B(!1),className:"text-gray-500 hover:text-gray-700",children:"×"})]}),d("div",{className:"flex flex-wrap gap-2 max-h-60 overflow-y-auto",children:[d("button",{onClick:()=>O(""),className:`text-left px-3 py-2 rounded transition-colors ${ce===""?"bg-blue-100 text-blue-700":"hover:bg-gray-100"}`,children:["全部类别 (",Ae.reduce((A,{count:G})=>A+G,0),")"]}),Ae.map(({category:A,count:G})=>d("button",{onClick:()=>O(A),className:`text-left px-3 py-2 rounded transition-colors ${ce===A?"bg-blue-100 text-blue-700":"hover:bg-gray-100"}`,children:[A," (",G,")"]},A))]})]})]}),J&&o(m.Suspense,{fallback:o("div",{className:"bg-white rounded-lg shadow-sm p-6 mb-6",children:d("div",{className:"animate-pulse",children:[o("div",{className:"h-4 bg-gray-200 rounded mb-4"}),o("div",{className:"h-8 bg-gray-200 rounded mb-4"}),d("div",{className:"space-y-2",children:[o("div",{className:"h-6 bg-gray-200 rounded"}),o("div",{className:"h-6 bg-gray-200 rounded"}),o("div",{className:"h-6 bg-gray-200 rounded"})]})]})}),children:o(Qi,{question:J,onAnswer:Ve,showExplanation:r,autoNextEnabled:P==null?void 0:P.autoNextEnabled,onAutoNext:Je,randomizeOptions:P==null?void 0:P.randomizeOptions,questionCounter:{getQuestionCount:W,updateQuestionCount:Z},enableGoogleSearch:P==null?void 0:P.enableGoogleSearch,mode:e==="wrong"?"wrong-answers":e==="section"?"section-practice":"practice",section:e==="section"?t:null},J.id)}),l.length===0&&o("div",{className:"text-center py-12",children:d("div",{className:"bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto",children:[o("h3",{className:"text-lg font-semibold text-yellow-800 mb-2",children:e==="wrong"?"暂无错题记录":"暂无题目"}),o("p",{className:"text-yellow-700",children:e==="wrong"?"您还没有答错的题目，继续努力！":"当前模式下没有可用的题目"})]})}),d("div",{className:"flex justify-between items-center mt-6",children:[d("button",{onClick:M,disabled:u===0,className:"flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors",children:[o(Ta,{size:16,className:"mr-1"}),"上一题"]}),o("span",{className:"text-gray-600 text-sm font-medium",children:W?I.percentage===100?`✅ 已完成 (${I.completed}/${I.total})`:`第${u+1}题 | 剩${l.length-u-1}题 | 完成${I.completed}/${I.total}`:`第${u+1}题 | 剩${l.length-u-1}题`}),d("button",{onClick:Je,disabled:l.length===0,className:"flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors",children:["下一题",o(Na,{size:16,className:"ml-1"})]})]}),o(Gi,{showSettings:v,setShowSettings:k,practiceSettings:P,targetCount:ne,questionCounter:{getQuestionCount:W,getProgressStats:We},progressStats:I,onUpdateSetting:ae,onUpdateTargetCount:S,onResetQuestionCounters:()=>{const A=Pe(e,t,ce).map(G=>G.id);ge(A),Be()},mode:"practice",title:"学习设置",subtitle:"自定义您的学习体验"}),o(qi,{showCompletion:V,completionTime:xe,onResetPractice:ee,onReviewWrongAnswers:()=>window.location.href="/wrong"}),o(Vi,{mode:e,section:t,sections:_,getQuestionCount:W,targetCount:ne}),o(Yi,{showTooltip:Ce,setShowTooltip:ye,tooltipType:Te,getQuestionCount:W,targetCount:ne}),te&&o("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",onClick:()=>$(!1),children:d("div",{className:"bg-white rounded-lg p-6 max-w-md w-full shadow-xl relative",onClick:A=>A.stopPropagation(),children:[o("button",{onClick:()=>$(!1),className:"fixed top-6 right-6 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors z-10","aria-label":"关闭对话框",children:o("svg",{className:"w-5 h-5 text-gray-500",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:o("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})}),d("div",{className:"flex items-center mb-4",children:[o(Ca,{className:"text-yellow-500 mr-3",size:24}),o("h3",{className:"text-lg font-semibold text-gray-800",children:"确认重新开始"})]}),o("p",{className:"text-gray-600 mb-6",children:"确定要重新开始吗？这将清除所有进度和计数，无法恢复。"}),d("div",{className:"flex justify-end gap-3",children:[o("button",{onClick:()=>$(!1),className:"px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors",children:"取消"}),o("button",{onClick:ee,className:"px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors",children:"确定重新开始"})]})]})})]})},ac=Object.freeze(Object.defineProperty({__proto__:null,default:Ji},Symbol.toStringTag,{value:"Module"}));export{Ri as A,qe as F,En as M,ac as P,Hi as S,d as a,$a as b,Gi as c,st as d,ze as e,Fa as f,sc as g,ro as h,Ya as i,o as j,Ga as k,rc as l,Ua as m,Za as n,Ja as o,Et as p,Fe as s,on as u};
