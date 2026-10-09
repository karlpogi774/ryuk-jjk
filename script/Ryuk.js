const fs = require("fs");
const path = require("path");

// ==========================================================
// 👑 RYUK POGI ON TOP — V7.6 ✅ AYOS NA ANG PAGPILI NG SASAGOT!
// ==========================================================
// ✅ SA GC — IKAW LANG ANG SASAGOT! IBANG TAO = WALANG SAGOT!
// ✅ "RYUK" SA GC MULA SA IBA → TAHIMIK LANG, WALANG LUMALABAS!
// ✅ AUTO-RESTORE GC NAME + NICKNAME — GUMAGANA PALAGI!
// ✅ LAHAT NG MAHABANG LINYA MO — NANDITO PA RIN! ✅
// ==========================================================
const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

let TARGET_USER_ID = "";
let targetNickname = "RYUK POGI";
let targetGCName = "RYUK POGI ON TOP";

const SELF_REACT_EMOJIS = ["😭"];
const ALL_REACT_EMOJIS = ["🔥", "💪", "👑", "⚡", "😎", "✅", "💯"];

const NICK_DELAY_MIN = 3000;
const NICK_DELAY_MAX = 9000;
const REPLY_DELAY_MIN = 7000;
const REPLY_DELAY_MAX = 7000;
const AUTO_RESTORE_DELAY = 90000;
const COOLDOWN = 7000;

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: true,
  silentMode: false,
  autoReact: false,
  selfReact: true,
  totalReplies: 0,
  totalMentions: 0,
  totalRestores: 0,
  targetNickname: "RYUK POGI",
  targetGCName: "RYUK POGI ON TOP",
  targetUserID: "",
  lastActive: null,
  createdVersion: "7.6.0"
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN_MESSAGES = 5000;
const RESTORE_LOG = [];

function isAdmin(senderID) {
  const id = String(senderID).trim();
  return ADMIN_IDS.includes(id);
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomEmoji() {
  return SELF_REACT_EMOJIS[Math.floor(Math.random() * SELF_REACT_EMOJIS.length)];
}

function getRandomAutoReactEmoji() {
  return ALL_REACT_EMOJIS[Math.floor(Math.random() * ALL_REACT_EMOJIS.length)];
}

function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      targetNickname = saved.targetNickname || targetNickname;
      targetGCName = saved.targetGCName || targetGCName;
      TARGET_USER_ID = String(saved.targetUserID || "").trim();
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (error) {
    console.error("[RYUK LOAD ERROR] —", error.message);
  }
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    data.targetNickname = targetNickname;
    data.targetGCName = targetGCName;
    data.targetUserID = String(TARGET_USER_ID).trim();
    data.lastActive = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[RYUK SAVE ERROR] —", error.message);
    return false;
  }
}

function addRestoreLog(type, oldValue, newValue) {
  RESTORE_LOG.unshift({
    time: new Date().toISOString(),
    type: type,
    old: oldValue,
    new: newValue
  });
  if (RESTORE_LOG.length > 20) RESTORE_LOG.pop();
}

function send(api, message, threadID, messageID, doSelfReact = false) {
  return api.sendMessage(message, threadID, (err, info) => {
    if (!err && doSelfReact && info) {
      setTimeout(() => {
        try {
          api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
        } catch (e) {
          console.log("[RYUK REACT ERROR] —", e.message);
        }
      }, getRandomDelay(4000, 8000));
    }
  }, messageID);
}

function sendMention(api, text, threadID, mentionsList = [], doSelfReact = false) {
  const msgBody = mentionsList.length > 0 
    ? { body: text, mentions: mentionsList } 
    : text;
  return api.sendMessage(msgBody, threadID, (err, info) => {
    if (!err && doSelfReact && info) {
      setTimeout(() => {
        try {
          api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
        } catch (e) {
          console.log("[RYUK REACT ERROR] —", e.message);
        }
      }, getRandomDelay(4000, 8000));
    }
  });
}

async function sendEveryone(api, text, threadID, doSelfReact = false) {
  return new Promise((resolve) => {
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        console.log("[RYUK EVERYONE ERROR] — Hindi makuha ang impormasyon ng GC");
        resolve(send(api, text, threadID, null, doSelfReact));
        return;
      }
      const members = info.participantIDs || [];
      const mentions = members.map(id => ({ tag: "@everyone", id: id }));
      api.sendMessage({ body: text, mentions: mentions }, threadID, (err, info) => {
        if (!err && doSelfReact && info) {
          setTimeout(() => {
            try {
              api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
            } catch (e) {
              console.log("[RYUK REACT ERROR] —", e.message);
            }
          }, getRandomDelay(4000, 8000));
        }
        resolve();
      });
    });
  });
}

function rememberMessage(messageID) {
  const id = String(messageID);
  if (SEEN_MESSAGES.has(id)) return false;
  SEEN_MESSAGES.add(id);
  if (SEEN_MESSAGES.size > MAX_SEEN_MESSAGES) {
    SEEN_MESSAGES.delete(SEEN_MESSAGES.values().next().value);
  }
  return true;
}

// ==========================================================
// ✅ ITO ANG HINDI BABAGUHIN — LAHAT NG MAHABANG LINYA MO!
// ==========================================================
function getReplyText(fullName, isPM) {
  const pmReplies = [
    `@${fullName} — RYUK POGI ON TOP! Wala nang tatalo sa akin 😡😂`,
    `@${fullName} — Tignan mo sarili mo, tapos ako... kita mo yung pagkakaiba? 😡😂`,
    `@${fullName} — Inggit ka lang aminin mo na! Walang masama doon 😡😂`,
    `@${fullName} — Pinanganak ako nasa taas na... ikaw pilit pa rin umaakyat 😡😂`,
    `@${fullName} — Ako yung hindi mo kayang gayahin kahit anong gawin mo 😡😂`,
    `@${fullName} — Sila nag-aagawan sa pwesto ko... ako nakaupo lang kumportable 😡😂`,
    `@${fullName} — Wag ka nang umasa... hindi ka makakaabot kahit habangbuhay 😡😂`,
    `@${fullName} — Akala mo lang kaya mo... hanggang akala ka lang pala 😡😂`,
    `@${fullName} — Dito sa taas tahimik lang... kayo sa baba maingay pa 😡😂`,
    `@${fullName} — Hindi ako nagbago... kayo lang pala bumaba 😡😂`,
    `@${fullName} — Maganda ang tanawin dito no? Kaya hindi ako bababa 😡😂`,
    `@${fullName} — Ako yung pangarap nila... ikaw yung hindi susundin 😡😂`,
    `@${fullName} — Kaya nandito ako... kasi hindi ako tumigil katulad mo 😡😂`,
    `@${fullName} — Subukan mo bumaba... hindi kita hahabol, wag kang mag-alala 😡😂`,
    `@${fullName} — Sayang ka... kung magiging katulad mo ako sayang 😡😂`,
    `@${fullName} — Hindi kailangang magsalita... presensya ko pa lang sapat na 😡😂`,
    `@${fullName} — Sila magkakasama... ako mag-isa pero panalo pa rin 😡😂`,
    `@${fullName} — Wag mo nang ituloy... alam ko na talo ka na naman 😡😂`,
    `@${fullName} — Pinagpala ako... ikaw pinagpabayaan lang 😡😂`,
    `@${fullName} — Kaya nila ako gusto... kasi hindi nila kayang maging ako 😡😂`,
    `@${fullName} — Kahit anong gawin mo... nandito pa rin ako sa taas 😡😂`,
    `@${fullName} — Hindi ako nang-agaw... akin na bago ka pa dumating 😡😂`,
    `@${fullName} — Ang taas ng tingin mo sa sarili mo... mas mababa ka pa rin 😡😂`,
    `@${fullName} — Ganyan talaga kapag tunay... hindi kailangang magyabang 😡😂`,
    `@${fullName} — Ako yung sinasabi nilang "yung iba" 😡😂`,
    `@${fullName} — Hingang malalim... tanggapin mo na hindi mo kaya 😡😂`,
    `@${fullName} — Kahit sino pa lumaban... ako pa rin mananalo 😡😂`,
    `@${fullName} — Wag mo nang itago... gusto mo rin maging ako alam ko 😡😂`,
    `@${fullName} — Simple lang... mas maganda, mas matalino, MAS AKO 😡😂`,
    `@${fullName} — Nandito lang ako... ikaw pa rin naghahanap 😡😂`,
    `@${fullName} — Hindi ako nagyayabang... totoo lang naman eh 😡😂`,
    `@${fullName} — Kaya tahimik sila... alam nila walang tatalo sa akin 😡😂`,
    `@${fullName} — Isipin mo na lang... yan ang pinakamalapit na mararanasan mo 😡😂`,
    `@${fullName} — Kahit anong gawin nila... ako pa rin nasa isip nila 😡😂`,
    `@${fullName} — Hindi ako pinili... ako ang TINAKDA 😡😂`,
    `@${fullName} — Sayang talaga... hindi ka mali, hindi ka lang AKO 😡😂`,
    `@${fullName} — Masakit no? Pero ganoon talaga 😡😂`,
    `@${fullName} — Kaya ka nandito... gusto mong makita kung paano talaga 😡😂`,
    `@${fullName} — Walang may kaya... ako lang talaga 😡😂`,
    `@${fullName} — May darating din sayo... hindi katulad ko 😡😂`,
    `@${fullName} — Sila marami... ako sapat na 😡😂`,
    `@${fullName} — Ang pagiging ako... hindi natututunan ipinapanganak 😡😂`,
    `@${fullName} — Ramdam mo na? Yan yung hindi mo kayang abutin 😡😂`,
    `@${fullName} — Hindi ako lumalaban... sila lumalaban sa kahinaan nila 😡😂`,
    `@${fullName} — Hindi ito pwesto... ito KARAPATAN 😡😂`,
    `@${fullName} — Wag mo nang subukan... nakakapagod magturo eh 😡😂`,
    `@${fullName} — Ako lang mag-isa... tapos ko na bago pa sila magsimula 😡😂`,
    `@${fullName} — Bakit ka pa lumapit? Alam mo naman sagot na ako eh 😡😂`,
    `@${fullName} — Sila umaasa sa pagkakataon... ako gumagawa ng tadhana 😡😂`,
    `@${fullName} — Pagsama-samahin mo pa sila... di pa rin sila aabot 😡😂`,
    `@${fullName} — Dito sa taas walang kaagaw... kayo doon sa baba mag-away 😡😂`,
    `@${fullName} — Akin na bago pa kayo ipinanganak 😡😂`,
    `@${fullName} — Hindi ako nagbago... sila ang hindi makasabay 😡😂`,
    `@${fullName} — Ako yung standard... sila yung pilit umaabot 😡😂`,
    `@${fullName} — Yan yung pagkakaiba... hindi matututunan sa school 😡😂`,
    `@${fullName} — Sila titingin sa akin... ako titingin sa harap 😡😂`,
    `@${fullName} — Hindi mabibili, hindi maiaagaw... AKIN ITO 😡😂`,
    `@${fullName} — Tignan mo sila... puro salita walang gawa 😡😂`,
    `@${fullName} — Ako... puro gawa walang kailangang sabihin 😡😂`,
    `@${fullName} — Masakit tanggapin no? Pero ako talaga 😡😂`,
    `@${fullName} — Hindi ako humahabol... sila ang humahabol 😡😂`,
    `@${fullName} — Tapos na usapan... tanggapin na lang 😡😂`,
    `@${fullName} — Sila magtulungan... ako mag-isa pero panalo 😡😂`,
    `@${fullName} — Bakit ka pa nagtatanong? Alam mo naman sagot eh 😡😂`,
    `@${fullName} — Ako inaasahan... sila umaasa 😡😂`,
    `@${fullName} — Kahit saan... ako pa rin pinag-uusapan 😡😂`,
    `@${fullName} — Sila gusto maging ako... ako lang AKO 😡😂`,
    `@${fullName} — Kilala na ako kahit tahimik lang 😡😂`,
    `@${fullName} — Hindi maiaagaw kahit sinong lumaban 😡😂`,
    `@${fullName} — Nakaupo lang... sila pagod na pagod pa rin 😡😂`,
    `@${fullName} — Sila halimbawa na wag tularan... ako yung tularan 😡😂`,
    `@${fullName} — Pareho pa rin ako... sila nagpapalit-palit 😡😂`,
    `@${fullName} — Sila nagbabago... ako nananatili 😡😂`,
    `@${fullName} — Ganyan talaga kapag TUNAY 😡😂`,
    `@${fullName} — Walang katulad, walang kapalit 😡😂`,
    `@${fullName} — Sila marami... ako lang ang TOTOO 😡😂`,
    `@${fullName} — Sila kailangan ako... hindi ko sila kailangan 😡😂`,
    `@${fullName} — Kaya sila nagsisikap... alam nila di aabot 😡😂`,
    `@${fullName} — Gets mo na yung pagkakaiba? 😡😂`,
    `@${fullName} — Hindi ito pagyayabang... ITO ANG KATOTOHANAN 😡😂`,
    `@${fullName} — Wag ka nang umasa... di ka makakasabay 😡😂`,
    `@${fullName} — Ako yung sinasabi nilang "iba siya" 😡😂`,
    `@${fullName} — Sila pilit umaakyat... ako nasa taas na 😡😂`,
    `@${fullName} — Hindi ako nagpapalit... di ko kailangan 😡😂`,
    `@${fullName} — Kaya nila ako tinitingnan... wala silang makitang katulad 😡😂`,
    `@${fullName} — RYUK POGI ON TOP... di na kailangang ipaliwanag 😡😂`,
    `@${fullName} — Sila puro plano... ako tapos na bago sila magsimula 😡😂`,
    `@${fullName} — Hindi ako nangangako... ginagawa ko na agad 😡😂`,
    `@${fullName} — Kahit anong mangyari... ako pa rin 😡😂`,
    `@${fullName} — Sila nagtago... ako kilala na 😡😂`,
    `@${fullName} — Hindi ako nanghihingi... ibinibigay nila kasi nararapat 😡😂`,
    `@${fullName} — Sayang oras mo sa akin... di ka makakakuha 😡😂`,
    `@${fullName} — Dito walang ikalawa... ISA LANG 😡😂`,
    `@${fullName} — Sila sumusunod... ako ang sinusunod 😡😂`,
    `@${fullName} — Hindi ako natatakot... sila ang takot 😡😂`,
    `@${fullName} — Walang makakatumbas... kahit pagsama-samahin 😡😂`,
    `@${fullName} — Tignan mo sila... hirap na hirap pa rin 😡😂`,
    `@${fullName} — Ako lang sapat na... sila marami pero kulang 😡😂`,
    `@${fullName} — Hindi ako naghihintay... ako ang hinihintay 😡😂`,
    `@${fullName} — Sila umaasa sa swerte... ako gumagawa ng sarili 😡😂`,
    `@${fullName} — Kahit sa dilim... ako ang liwanag 😡😂`,
    `@${fullName} — Hindi ako yumuyuko... kahit kanino 😡😂`,
    `@${fullName} — Kung saan ako naroon... doon ang pinakamataas 😡😂`,
    `@${fullName} — Sila titingin pataas... ako titingin pababa 😡😂`,
    `@${fullName} — Hindi ako nagpapanggap... kung sino ako ITO NA 😡😂`,
    `@${fullName} — Mas matibay kaysa bato... ganoon ako 😡😂`,
    `@${fullName} — Bakit sa akin ka lumapit? Kasi alam mo wala nang iba 😡😂`,
    `@${fullName} — RYUK POGI ON TOP... di magbabago kailanman 😡😂`,
    `@${fullName} — Sila nag-away... ako nananalo 😡😂`,
    `@${fullName} — Hindi ako kailangan ng marami... isa lang sapat na 😡😂`,
    `@${fullName} — Akin ang lahat... hindi ko kailangang hiramin 😡😂`,
    `@${fullName} — Sila walang sariling tindig... ako nakatayo mag-isa 😡😂`,
    `@${fullName} — Kahit gumuho ang lahat... ako pa rin nakatayo 😡😂`,
    `@${fullName} — Hindi ako magkakamali... alam ko ang tama 😡😂`,
    `@${fullName} — Sila nagpapalit ng kulay... ako pareho pa rin 😡😂`,
    `@${fullName} — Kung gusto nila... sariling sikap wag ako hakbangan 😡😂`,
    `@${fullName} — Mas matibay ako bukas... kaysa ngayon 😡😂`,
    `@${fullName} — Tapos na ang usapan... ito na ang huling salita 😡😂`,
    `@${fullName} — Hindi ako kailangan nila... sila ang kailangan ako 😡😂`,
    `@${fullName} — Sila naghahanap ng kahinaan... wala silang makita 😡😂`,
    `@${fullName} — Hindi ako nabibili... kaya di nila makukuha 😡😂`,
    `@${fullName} — Wag kang mag-alala... di ko iiwan ang nagtitiwala 😡😂`,
    `@${fullName} — Pwesto ko akin na... di ko ibibigay 😡😂`,
    `@${fullName} — Sila pilit umaakyat... di aabot kahit umakyat pa 😡😂`,
    `@${fullName} — Nandito na ako bago sila dumating... di ako aalis 😡😂`,
    `@${fullName} — Kung sinabi ko... gagawin ko agad 😡😂`,
    `@${fullName} — Hayaan mo sila... di nila maintindihan 😡😂`,
    `@${fullName} — Walang susunod... isa lang 😡😂`,
    `@${fullName} — Hindi ako sumusuko... hanggang dulo ako mananalo 😡😂`,
    `@${fullName} — Sila puro pag-asa... ako TOTOO 😡😂`,
    `@${fullName} — Hindi ako nagbago... itinakda na 😡😂`,
    `@${fullName} — Walang katulad, walang kapalit 😡😂`,
    `@${fullName} — Sila gumagawa ng kwento... ako kwento mismo 😡😂`,
    `@${fullName} — Ako ang simula... ako ang dulo 😡😂`,
    `@${fullName} — Sila marami... ako sapat na 😡😂`,
    `@${fullName} — Hindi ako nangangailangan... sila ang kailangan 😡😂`,
    `@${fullName} — Kaya nila akong tularan... di nila magaya 😡😂`,
    `@${fullName} — Tignan mo sarili mo... tapos ako... DI NA KAILANGANG SABIHIN 😡😂`,
    `@${fullName} — Akala mo ba nakakalimot sila? Ako ang laging nasa isip 😡😂`,
    `@${fullName} — Sila nagtutulungan pero kulang pa rin... ako mag-isa sapat na 😡😂`,
    `@${fullName} — Hindi ako nagpapakitang-gilas... kilala na ako bago ka pa dumating 😡😂`,
    `@${fullName} — Kahit anong gawin nila... di nila kayang abutin 😡😂`,
    `@${fullName} — Sila puro ingay... ako tahimik pero naririnig ng lahat 😡😂`,
    `@${fullName} — Ako yung dahilan kung bakit sila nagsisikap... pero di aabot 😡😂`,
    `@${fullName} — Wag kang magtaka... ganyan talaga kapag tunay na RYUK 😡😂`,
    `@${fullName} — Hindi ako nangangako... ginagawa ko bago pa man magtanong 😡😂`,
    `@${fullName} — Sila umaasa sa pagkakataon... ako gumagawa ng sarili kong tadhana 😡😂`,
    `@${fullName} — Kahit saan ka pumunta... parehas lang — ako pa rin ang nasa taas 😡😂`,
    `@${fullName} — Hindi ako nakikipagkumpitensya... walang kalaban eh 😡😂`,
    `@${fullName} — Sila pilit umaangat... ako nakaupo na sa tuktok 😡😂`,
    `@${fullName} — Ang pagiging ako... hindi ito pwesto, ito ay KARAPATAN 😡😂`,
    `@${fullName} — Sila nag-aagawan sa pira-pirasong pwesto... akin na ang buong itaas 😡😂`,
    `@${fullName} — Hindi ako nagbago... sila ang bumaba 😡😂`,
    `@${fullName} — Kung saan ako naroon... doon ang pamantayan 😡😂`,
    `@${fullName} — Sila titingin sa akin... ako titingin sa hinaharap 😡😂`,
    `@${fullName} — Hindi ako nangangailangan ng papuri... kilala ako sa gawa 😡😂`,
    `@${fullName} — Sila gusto maging ako... ako gusto maging AKO 😡😂`,
    `@${fullName} — Kahit anong mangyari... hindi ako bababa 😡😂`,
    `@${fullName} — Sila nagpapalit ng kulay... ako nananatili 😡😂`,
    `@${fullName} — Ako yung hindi mo kayang kalimutan 😡😂`,
    `@${fullName} — Hindi ako nakikipaglaro... hindi ito laro 😡😂`,
    `@${fullName} — Sila marami... kulang pa rin kahit magsama-sama 😡😂`,
    `@${fullName} — Ako lang... sapat na para sa lahat 😡😂`,
    `@${fullName} — Wag kang mag-alala... di ka makakalimot sa pangalan ko 😡😂`,
    `@${fullName} — Sila puro plano... ako naging katotohanan na 😡😂`,
    `@${fullName} — Hindi ako nanghihingi ng respeto... ibinibigay nila kasi alam nila 😡😂`,
    `@${fullName} — Kung hindi mo kaya... wag mo nang pilitin 😡😂`,
    `@${fullName} — RYUK POGI ON TOP — hindi ito tanong, ito ay UTOS 😡😂`,
    `@${fullName} — Sila sumusunod sa agos... ako ang nagtuturo ng direksyon 😡😂`,
    `@${fullName} — Hindi ako natatakot sa hamon... hamon ang natatakot sa akin 😡😂`,
    `@${fullName} — Kahit sino pa ang lumabas... ako pa rin ang pipiliin 😡😂`,
    `@${fullName} — Sila nagtago sa dilim... ako ang liwanag na hindi nila kayang tignan 😡😂`,
    `@${fullName} — Hindi ako yumuyuko... kahit kanino, kahit kailan 😡😂`,
    `@${fullName} — Kung saan ako tumayo... doon ang pinakamataas 😡😂`,
    `@${fullName} — Sila pilit umaakyat... ako nandoon na bago pa sila magsimula 😡😂`,
    `@${fullName} — Hindi ako nagpapanggap... kung sino ako, ITO NA 😡😂`,
    `@${fullName} — Mas matibay kaysa bato... mas matalim kaysa tabak 😡😂`,
    `@${fullName} — Bakit sa akin ka lumapit? Kasi alam mo wala nang iba 😡😂`,
    `@${fullName} — RYUK POGI ON TOP — di magbabago kailanman 😡😂`,
    `@${fullName} — Sila nag-away sa pwesto... ako nakaupo na 😡😂`,
    `@${fullName} — Hindi ako kailangan ng marami... isa lang sapat na 😡😂`,
    `@${fullName} — Akin ang lahat... hindi ko kailangang hiramin 😡😂`,
    `@${fullName} — Sila walang sariling tindig... ako nakatayo mag-isa 😡😂`,
    `@${fullName} — Kahit gumuho ang mundo... ako pa rin nakatayo 😡😂`,
    `@${fullName} — Hindi ako magkakamali... alam ko ang tama 😡😂`,
    `@${fullName} — Sila nagpapalit ng kulay... ako pareho pa rin mula noon 😡😂`,
    `@${fullName} — Kung gusto nila... sariling sikap wag ako hakbangan 😡😂`,
    `@${fullName} — Mas matibay ako bukas... kaysa ngayon 😡😂`,
    `@${fullName} — Tapos na ang usapan... ito na ang huling salita 😡😂`,
    `@${fullName} — Hindi ako kailangan nila... sila ang kailangan ako 😡😂`,
    `@${fullName} — Sila naghahanap ng kahinaan... wala silang makita 😡😂`,
    `@${fullName} — Hindi ako nabibili... kaya di nila makukuha kailanman 😡😂`,
    `@${fullName} — Wag kang mag-alala... di ko iiwan ang nagtitiwala sa akin 😡😂`,
    `@${fullName} — Pwesto ko akin na... di ko ibibigay sa kanino 😡😂`,
    `@${fullName} — Sila pilit umaakyat... di aabot kahit umakyat pa ng libong hakbang 😡😂`,
    `@${fullName} — Nandito na ako bago sila dumating... di ako aalis kahit umalis sila 😡😂`,
    `@${fullName} — Kung sinabi ko... gagawin ko agad 😡😂`,
    `@${fullName} — Hayaan mo sila... di nila maintindihan ang pagiging TUNAY 😡😂`,
    `@${fullName} — Walang susunod... isa lang 😡😂`,
    `@${fullName} — Hindi ako sumusuko... hanggang dulo ako mananalo 😡😂`,
    `@${fullName} — Sila puro pag-asa... ako TOTOO 😡😂`,
    `@${fullName} — Hindi ako nagbago... itinakda na bago pa ako ipinanganak 😡😂`,
    `@${fullName} — Walang katulad, walang kapalit 😡😂`,
    `@${fullName} — Sila gumagawa ng kwento... ako kwento mismo 😡😂`,
    `@${fullName} — Ako ang simula... ako ang dulo 😡😂`,
    `@${fullName} — Sila marami... ako sapat na 😡😂`,
    `@${fullName} — Hindi ako nangangailangan... sila ang kailangan 😡😂`,
    `@${fullName} — Kaya nila akong tularan... di nila magaya 😡😂`,
    `@${fullName} — Tignan mo sarili mo... tapos ako... DI NA KAILANGANG SABIHIN 😡😂`
  ];
   const gcReplies = [
  `@${fullName} — RYUK POGI ON TOP! 💢😡`,
  `@${fullName} — dito, ako ang hari. 👿😡`,
  `@${fullName} — sila? puro salita lang! 😠💢`,
  `@${fullName} — hindi ka makakatalo sa akin! 😡🔥`,
  `@${fullName} — alam na ng lahat kung sino ako! 👿💢`,
  `@${fullName} — umakyat sila, bumagsak din! 😠😡`,
  `@${fullName} — akin ang itaas, mananatili! 💢🔥`,
  `@${fullName} — kaya nila? hanggang daldal lang! 😡👿`,
  `@${fullName} — hindi ako aalis, hindi ako bababa! 😠💢`,
  `@${fullName} — galit sila? inggit lang 'yan! 😡💢`,
  `@${fullName} — subukan nila, makikita nila! 👿🔥`,
  `@${fullName} — ako pa rin, walang nagbago! 😠😡`,
  `@${fullName} — puro plano, walang gawa! 💢😡`,
  `@${fullName} — dito, walang makakalamang! 😡🔥`,
  `@${fullName} — nagtago sila pag wala nakatingin! 👿💢`,
  `@${fullName} — RYUK POGI lang, walang kapalit! 😠😡`,
  `@${fullName} — madali bang maging katulad ko? HINDI! 💢🔥`,
  `@${fullName} — umakyat sila, di kaya. Bumaba agad! 😡👿`,
  `@${fullName} — akin ang pwesto, akin na bago pa! 💢😡`,
  `@${fullName} — ingay sila ngayon, tahimik bukas! 😠💢`,
  `@${fullName} — hindi ko kailangang magyabang. ALAM NIYO! 😡🔥`,
  `@${fullName} — sila, nagpapalit kulay. Ako, HINDI! 👿💢`,
  `@${fullName} — sabi nila tapos na ako. HETO PA RIN! 😠😡`,
  `@${fullName} — magsama pa sila, KULANG PA RIN! 💢🔥`,
  `@${fullName} — hindi pantay? WALA SILANG LABAN! 😡👿`,
  `@${fullName} — ako ang tunay, sila ay PEKE! 💢😡`,
  `@${fullName} — dahan-dahan ako, kaya HINDI BUMABAGSAK! 😠🔥`,
  `@${fullName} — sumuko sila? DUWAG LANG PALA! 😡💢`,
  `@${fullName} — hindi ako sumusuko KAILANMAN! 👿🔥`,
  `@${fullName} — puro reklamo, WALANG GINAGAWA! 💢😡`,
  `@${fullName} — akin ang itaas, DI KO IBIBIGAY! 😠💢`,
  `@${fullName} — sabi nila kaya nila. NASAAN NA SILA?! 😡👿`,
  `@${fullName} — hindi ako nakikipaglaro sa kanila! 👿💢`,
  `@${fullName} — nagmadali sila, NADAPA AGAD! 😠🔥`,
  `@${fullName} — ang totoo, HINDI KAILANGANG SUMIGAW! 💢😡`,
  `@${fullName} — sila, takot magkamali. Ako, TUMATAYO! 😡🔥`,
  `@${fullName} — lumipas na daw? BUHAY PA RIN AKO! 👿💢`,
  `@${fullName} — WALANG MAKAKABABA SA AKIN! 😠😡`,
  `@${fullName} — akin ang pwesto, HINDI HIHIRAM! 💢🔥`,
  `@${fullName} — magaling sila KAPAG MAY NAKATINGIN! 😡👿`,
  `@${fullName} — pag wala na, TAHIMIK NA SILA! 👿💢`,
  `@${fullName} — hindi ko kailangang patunayan sarili. ALAM NIYO! 😠🔥`,
  `@${fullName} — sila, puro pangako. Ako, GAGAWA AGAD! 💢😡`,
  `@${fullName} — nagbago sila? HINDI KILALA. Ako, PAREHO! 😡💢`,
  `@${fullName} — habang sila nag-aaway, AKO NASA ITAAS! 👿🔥`,
  `@${fullName} — subukan nila, LALO AKONG TUMITIBAY! 😠😡`,
  `@${fullName} — hindi nila kaya, KAYA PURO DAHILAN! 💢🔥`,
  `@${fullName} — wala silang makita kahinaan ko. WALA KASI! 😡👿`,
  `@${fullName} — mauuwi sa WALA lahat ng ingay nila! 👿💢`,
  `@${fullName} — mananatili ako, SILA AY MAGLAHALO! 😠🔥`,
  `@${fullName} — hindi dami ang panalo. KATOTOHANAN AKO! 💢😡`,
  `@${fullName} — sila, sumusunod kung sino malakas. Ako, SINUSUNDAN! 😡🔥`,
  `@${fullName} — bakit ako bababa? AKIN ANG PWESTO! 👿💢`,
  `@${fullName} — umakyat sa HINDI SA KANILA, kaya BAGSAK! 😠😡`,
  `@${fullName} — HINDI NABIBILI ang pagiging RYUK POGI! 💢🔥`,
  `@${fullName} — puro daldal, WALANG MAIPAKITA! 😡👿`,
  `@${fullName} — kung totoo sila, NASAAN SILA?! 👿💢`,
  `@${fullName} — ako dito lang. Sila, PARANG ULAP! 😠🔥`,
  `@${fullName} — HINDI AKO MAGBABAGO PARA SA INYO! 💢😡`,
  `@${fullName} — mabilis magsalita, MALI NAMAN! 😡🔥`,
  `@${fullName} — dahan-dahan ako, SIGURADO BAWAT HAKBANG! 👿💢`,
  `@${fullName} — sumuko agad? DUWAG TALAGA! 😠😡`,
  `@${fullName} — HINDI AKO AALIS HANGGA'T KAILANGAN NIYO! 💢🔥`,
  `@${fullName} — akala nila kapag wala ako, SILA NA. MALI! 😡👿`,
  `@${fullName} — kilala na ako, HINDI KAILANGANG MAGYABANG! 👿💢`,
  `@${fullName} — sila, nagtutulungan PERO NAGTATRAYURAN! 😠🔥`,
  `@${fullName} — tapat ako sa lahat, KAYA WALA AKONG TAKOT! 💢😡`,
  `@${fullName} — mas matibay ako KAYSA KAHAPON! 😡🔥`,
  `@${fullName} — walang kalaban, SARILI KO LANG! 👿💢`,
  `@${fullName} — palagi akong PANALO sa sarili ko! 😠😡`,
  `@${fullName} — nagpapanggap sila, KILALA AGAD! 💢🔥`,
  `@${fullName} — hindi ko kailangang magbago PARA TANGGAPIN! 😡👿`,
  `@${fullName} — akin na ito BAGO PA MAN SILA DUMATING! 👿💢`,
  `@${fullName} — puro plano, WALANG SIMULA! 😠🔥`,
  `@${fullName} — habang sila nag-iisip, TAPOS NA AKO! 💢😡`,
  `@${fullName} — kung kaya nila, BAKIT HINDI PA?! 😡🔥`,
  `@${fullName} — hindi pantay? OO, MAS MALAKAS AKO! 👿💢`,
  `@${fullName} — naghahanap butas, WALA SILANG MAKITA! 😠😡`,
  `@${fullName} — mauuwi sa WALA lahat pagsisikap nila! 💢🔥`,
  `@${fullName} — mananatili ako, SILA AY MABUBURA! 😡👿`,
  `@${fullName} — hindi dami ang panalo, KATOTOHANAN AKO! 👿💢`,
  `@${fullName} — sila, sumusunod. Ako, SINUSUNDAN! 😠🔥`,
  `@${fullName} — bakit ako bababa? AKIN ANG PWESTO! 💢😡`,
  `@${fullName} — umakyat sa hindi sa kanila, KAYA BUMAGSAK! 😡🔥`,
  `@${fullName} — HINDI NABIBILI ang pangalang ito! 👿💢`,
  `@${fullName} — puro daldal, WALANG GAGAWA! 😠😡`,
  `@${fullName} — kung totoo sila, NASAAN NA SILA?! 💢🔥`,
  `@${fullName} — ako dito lang. Sila, NAWALA AGAD! 😡👿`,
  `@${fullName} — HINDI AKO MAGBABAGO KAILANMAN! 👿💢`,
  `@${fullName} — mabilis magsalita, MALI PALA! 😠🔥`,
  `@${fullName} — dahan-dahan, sigurado, HINDI NADADAPA! 💢😡`,
  `@${fullName} — sumuko agad? INASAHAN KO NA! 😡🔥`,
  `@${fullName} — nandito ako HANGGA'T HINDI TAPOS! 👿💢`,
  `@${fullName} — akala nila sila na. MALI SILA! 😠😡`,
  `@${fullName} — kilala na ako, HINDI KAILANGANG IPAGSIGAWAN! 💢🔥`,
  `@${fullName} — sila, magkakasama PERO WALANG TIWALA! 😡👿`,
  `@${fullName} — tapat ako, WALA AKONG ITINATAGO! 👿💢`,
  `@${fullName} — mas malakas ako KAYSA DATI! 😠🔥`,
  `@${fullName} — walang kalaban, SARILI KO LANG! 💢😡`,
  `@${fullName} — palagi akong PANALO! 😡🔥`,
  `@${fullName} — nagpapanggap sila, ALAM NG LAHAT! 👿💢`,
  `@${fullName} — akin na ito BAGO PA MAN SILA ISIPIN! 😠😡`,
  `@${fullName} — puro daldal, WALANG MAIPAKITA! 💢🔥`,
  `@${fullName} — habang sila nagtatalo, AKO NASA ITAAS! 😡👿`,
  `@${fullName} — kung kaya nila, GAWIN NA NILA! 👿💢`,
  `@${fullName} — RYUK POGI ON TOP — TAPOS NA ANG USAPAN! 😠💢🔥`
];
  const list = isPM ? pmReplies : gcReplies;
  return list[Math.floor(Math.random() * list.length)];
}

async function setAllNicknamesWithDelay(api, threadID, members, name, botID) {
  let success = 0, skip = 0, fail = 0;
  if (name.length > 25) {
    return { success, skip, fail, total: members.length, error: "❌ Masyadong mahaba ang pangalan! Pinakamataas: 25 letra." };
  }
  for (const uid of members) {
    if (String(uid) === String(botID)) {
      skip++;
      continue;
    }
    await new Promise(resolve => setTimeout(resolve, getRandomDelay(NICK_DELAY_MIN, NICK_DELAY_MAX)));
    try {
      const result = await new Promise((resolve) => {
        api.changeNickname(name, threadID, uid, (err) => {
          if (err) {
            console.log(`[RYUK NICK FAIL] — ID: ${uid} | Error: ${err.message}`);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
      if (result) {
        success++;
      } else {
        fail++;
      }
    } catch (error) {
      console.log(`[RYUK NICK ERROR] — ID: ${uid} | ${error.message}`);
      fail++;
    }
  }
  return { success, skip, fail, total: members.length };
}

module.exports.config = {
  name: "ryuk",
  version: "7.6.0",
  hasPermission: 1,
  credits: "RYUK — IKAW LANG ANG SASAGOT SA GC ✅",
  description: "✅ SA GC IKAW LANG — IBA = WALANG SAGOT | Auto-Restore | Makunat",
  usePrefix: true,
  cooldowns: 7
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData, isGroup, body } = event;
    if (!threadID || !senderID) return;

    const data = loadSystemData();
    const botID = String(api.getCurrentUserID());
    const isPM = !isGroup;
    const sender = String(senderID).trim();
    const msg = String(body || "").trim().toLowerCase();

    if (!data.active) return;

    // ✅ AUTO-RESTORE GC NAME AT NICKNAME — GUMAGANA PALAGI
    if (!isPM) {
      if (logMessageType === "log:user-nickname") {
        const uid = String(logMessageData.participant_id).trim();
        const curr = String(logMessageData.nickname || "").trim();
        if (curr !== targetNickname && uid !== botID) {
          setTimeout(() => {
            api.changeNickname(targetNickname, threadID, uid, (err) => {
              if (err) {
                console.log(`[RYUK RESTORE NICK FAIL] — ${uid} | ${err.message}`);
              } else {
                data.totalRestores = (data.totalRestores || 0) + 1;
                saveSystemData(data);
              }
            });
          }, AUTO_RESTORE_DELAY);
        }
        return;
      }
      if (logMessageType === "log:thread-name") {
        const currName = String(logMessageData.name || "").trim();
        if (currName !== targetGCName) {
          setTimeout(() => {
            api.setTitle(targetGCName, threadID, (err) => {
              if (err) {
                console.log(`[RYUK RESTORE GC FAIL] — ${err.message}`);
              } else {
                data.totalRestores = (data.totalRestores || 0) + 1;
                saveSystemData(data);
              }
            });
          }, AUTO_RESTORE_DELAY);
        }
        return;
      }
    }

    // ==========================================================
    // ✅ PINAKAIMPORTANTENG AYUS: SA GC — IKAW LANG ANG SASAGOT!
    // ==========================================================
    if (!isPM && !isAdmin(sender)) {
      // May nag-chat ng "ryuk" o command sa GC na hindi ikaw → WALANG SAGOT!
      if (msg === "ryuk" || msg.startsWith("ryuk ") || msg.startsWith("/ryuk")) {
        // Magre-react lang kung gusto mo, pero WALANG SAGOT!
        if (data.autoReact) {
          setTimeout(() => {
            try {
              api.setMessageReaction("🐕‍🦺", messageID, () => {}, true);
            } catch {}
          }, getRandomDelay(4000, 8000));
        }
        return; // ❌ TUMIGIL — WALANG LUMALABAS NA MENSAHE!
      }

      // Ibang mensahe sa GC mula sa hindi ikaw → magre-react lang kung naka-ON
      if (data.autoReact && rememberMessage(messageID)) {
        setTimeout(() => {
          try {
            api.setMessageReaction(getRandomAutoReactEmoji(), messageID, () => {}, true);
          } catch (e) {
            console.log("[RYUK AUTOREACT ERROR] —", e.message);
          }
        }, getRandomDelay(4000, 8000));
      }
      return; // ❌ HINDI SASAGOT SA IBANG TAO SA GC!
    }

    // ✅ DITO LANG SASAGOT — IKAW O SA PM
    if (sender === botID) return;

    const targetIDClean = String(TARGET_USER_ID).trim();
    if (targetIDClean && sender !== targetIDClean && !isAdmin(sender)) {
      return;
    }

    if (!rememberMessage(messageID)) return;
    if (data.silentMode) return;

    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const last = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - last < COOLDOWN) return;
    USER_COOLDOWN.set(cooldownKey, now);

    let fullName = "Kaibigan";
    try {
      const info = await api.getUserInfo(senderID);
      if (info && info[senderID]) {
        fullName = info[senderID].name || info[senderID].firstName || "Kaibigan";
      }
    } catch (e) {
      console.log("[RYUK NAME FETCH ERROR] —", e.message);
    }

    setTimeout(() => {
      const latest = loadSystemData();
      if (!latest.active || latest.silentMode) return;
      const replyText = getReplyText(fullName, isPM);
      const mentions = isPM ? [] : [{ tag: `@${fullName}`, id: senderID }];
      sendMention(api, replyText, threadID, mentions, latest.selfReact);
      latest.totalReplies = (latest.totalReplies || 0) + 1;
      latest.totalMentions = (latest.totalMentions || 0) + 1;
      saveSystemData(latest);
    }, getRandomDelay(REPLY_DELAY_MIN, REPLY_DELAY_MAX));

  } catch (error) {
    console.error("[RYUK HANDLE EVENT ERROR] —", error);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID, isGroup } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();
  const botID = String(api.getCurrentUserID());
  const isPM = !isGroup;
  const sender = String(senderID).trim();

  // ✅ SA GC — KUNG HINDI IKAW ANG NAG-COMMAND → WALANG SAGOT!
  if (isGroup && !isAdmin(sender)) {
    setTimeout(() => {
      try { api.setMessageReaction("🤢", messageID, () => {}, true); } catch {}
    }, 1000);
    return; // TAHIMIK LANG — WALANG LUMALABAS!
  }

  if (action === "help") {
    return send(api,
`👑 RYUK POGI ON TOP — V7.6 ✅ IKAW LANG ANG SASAGOT SA GC!

✅ SA GC — IKAW LANG ANG RERESPINDAHAN! IBA = WALANG SAGOT!
✅ "RYUK" MULA SA IBA SA GC → TAHIMIK LANG!
✅ AUTO-RESTORE — IBABALIK AGAD ANG PANGALAN!
✅ LAHAT NG MAHABANG LINYA — NANDITO PA RIN! ✅

📋 LAHAT NG UTOS:

/ryuk help — Ipakita ang listahan ng utos
/ryuk status — Tingnan ang kalagayan ng bot
/ryuk on — Buhayin ang bot, simula ng pagbabantay
/ryuk off — Patayin ang bot, itigil ang lahat
/ryuk silent — Tahimik na, hindi magre-reply pero BANTAY PA RIN
/ryuk unsilent — Magre-reply na ulit, hindi na tahimik
/ryuk target [ID] — Ikaw lang ang rerespindahan ng bot
/ryuk target off — Alisin ang target, rerespindahan na ang lahat
/ryuk everyone [mensahe] — I-mention ang LAHAT ng miyembro sa GC
/ryuk setgname [pangalan] — Palitan ang pangalan ng GC at i-lock
/ryuk setnick [pangalan] — Itakda ang nickname na ilalapat sa lahat
/ryuk lock — Ilapat ang nickname sa LAHAT ng miyembro
/ryuk selfreacton — I-on ang reaksyon sa sariling mensahe
/ryuk selfreactoff — I-off ang reaksyon sa sariling mensahe
/ryuk reacton — I-on ang reaksyon sa mensahe ng iba (GC lang)
/ryuk reactoff — I-off ang reaksyon sa mensahe ng iba

🔒 ADMIN LIST: 4 na nakarehistro
👑 GC NAME: ${targetGCName}
👤 NICKNAME: ${targetNickname}
📌 VERSION: 7.6.0 — IKAW LANG SA GC ✅`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`👑 RYUK STATUS — V7.6

📊 KASALUKUYANG KALAGAYAN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ AKTIBO:          ${data.active ? "OO — NAKABUHAY" : "HINDI — NAKAPATAY"}
🔇 SILENT MODE:    ${data.silentMode ? "OO — TAHIMIK, BANTAY PA RIN" : "HINDI — NAKA-REPLY"}
🎯 TARGET:          ${TARGET_USER_ID || "WALA — RERESPINDAHAN LAHAT"}
💬 SELF-REACT:      ${data.selfReact ? "OO — AKTIBO" : "HINDI — NAKA-OFF"}
🔥 AUTO-REACT:      ${data.autoReact ? "OO — AKTIBO" : "HINDI — NAKA-OFF"}
👑 GC NAME:        ${targetGCName}
👤 NICKNAME:       ${targetNickname}
📤 KABUUANG REPLY:  ${data.totalReplies || 0}
🔄 KABUUANG RESTORE: ${data.totalRestores || 0}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ PROTEKSIYON:    AKTIBO — IBABALIK AGAD ANG PANGALAN
⚡ BILIS:           TAMA — HINDI MA-DETECT
📌 VERSION:        7.6.0 — IKAW LANG SA GC ✅`,
      threadID, messageID
    );
  }

  const adminActions = ["on", "off", "silent", "unsilent", "target", "selfreacton", "selfreactoff"];
  const gcOnlyActions = ["lock", "setgname", "setnick", "reacton", "reactoff", "everyone"];
  
  if (gcOnlyActions.includes(action) && isPM) {
    return send(api, "❌ HINDI PWEDENG DITO!\nAng utos na ito ay para sa GROUP CHAT lamang.\nPumunta sa GC kung saan aktibo ang bot at subukan ulit.", threadID, messageID);
  }
  if ([...adminActions, ...gcOnlyActions].includes(action) && !isAdmin(senderID)) {
    return send(api, "❌ HINDI IKAW ANG ADMIN!\nAng utos na ito ay para sa ADMIN lamang.\nIkaw ay walang pahintulot na gamitin ito.", threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`✅ RYUK NAKABUHAY — V7.6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ AKTIBO:     OO — GUMAGANA NA!
🎯 TARGET:     ${TARGET_USER_ID || "WALA — RERESPINDAHAN LAHAT"}
🔇 SILENT:     HINDI — NAKA-REPLY
🛡️ BANTAY:     AKTIBO — IBABALIK AGAD!
⚡ BILIS:      TAMA — HINDI MA-DETECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nandito na ako. RYUK POGI ON TOP! 👑`,
      threadID, messageID
    );
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api,
`❌ RYUK NAKAPATAY — V7.6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ AKTIBO:     HINDI — NAKATIGIL NA
🔇 SILENT:     HINDI — NAKA-OFF
🛡️ BANTAY:     HINDI — HINDI NA MAGBABANTAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nakatigil na ang lahat. I-type /ryuk on para buhayin ulit.`,
      threadID, messageID
    );
  }

  if (action === "silent") {
    data.silentMode = true;
    saveSystemData(data);
    return send(api,
`✅ SILENT MODE — NAKA-ON

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔇 TAHIMIK:    OO — HINDI NA MAGRE-REPLY
🛡️ BANTAY:     OO — BANTAY PA RIN ANG PANGALAN!
🔄 IBABALIK:   OO — KAPAG NAPALITAN, IBABALIK AGAD!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hindi ako magpapakita ng sagot, pero narito pa rin ako.
I-type /ryuk unsilent para magsalita ulit. 🤫`,
      threadID, messageID
    );
  }

  if (action === "unsilent") {
    data.silentMode = false;
    saveSystemData(data);
    return send(api,
`✅ SILENT MODE — NAKA-OFF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔇 TAHIMIK:    HINDI — MAGRE-REPLY NA ULIT!
🛡️ BANTAY:     OO — BANTAY PA RIN ANG PANGALAN!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nagsasalita na ulit ako. RYUK POGI ON TOP! 👑`,
      threadID, messageID
    );
  }

  if (action === "target") {
    const target = args.slice(1).join(" ").trim();
    
    if (!target) {
      return send(api,
`🎯 GAMITIN ANG TARGET — V7.6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARA MAG-SET:
/ryuk target [ID NG TAO]

Halimbawa:
/ryuk target 61594055835097

PARA ALISIN:
/ryuk target off

KASALUKUYANG TARGET:
${TARGET_USER_ID || "WALA — RERESPINDAHAN ANG LAHAT NG MAG-CHAT"}

PAANO MAKUHA ANG ID:
👉 I-chat ang tao sa bot
👉 Kunin ang kanyang ID mula sa log
👉 Siguraduhing WALANG space, walang letra, numero lang
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        threadID, messageID
      );
    }

    if (target === "off" || target === "wala") {
      TARGET_USER_ID = "";
      saveSystemData(data);
      return send(api,
`✅ TARGET TINANGGAL — V7.6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TARGET:     WALA NA
💬 RERESPINDAHAN: LAHAT NG MAG-CHAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lahat ay rerespindahan na ulit.`,
        threadID, messageID
     );
     }
     if (!/^\d+$/.test(target)) {
       return send(api,
 `❌ MALI ANG ID — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ang ID ay DAPAT numero lamang!
 ❌ May letra — HINDI PWEDI
 ❌ May space — HINDI PWEDI
 ✅ Numero lang — PWEDI!
 Halimbawa: 61594055835097
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
     }
     TARGET_USER_ID = target;
     saveSystemData(data);
     return send(api,
 `✅ TARGET NAKA-SET — GUMAGANA NA! ✅
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🎯 TARGET ID:   ${TARGET_USER_ID}
 💬 RERESPINDAHAN: LANG ITO — IBA HINDI
 🔒 SIGURADO:    TUMUTUGMA NA ANG ID!
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 I-chat mo ako para subukan! ✅
 Ipa-chat sa iba — HINDI RERESPINDAHAN ✅
 I-type /ryuk target off para alisin`,
       threadID, messageID
     );
   }
   if (action === "everyone") {
     const msg = args.slice(1).join(" ").trim() || "Paalala sa lahat!";
     return sendEveryone(api, `📢 @everyone — ${msg}`, threadID, data.selfReact);
   }
   if (action === "selfreacton") {
     data.selfReact = true;
     saveSystemData(data);
     return send(api,
 `✅ SELF-REACT — NAKA-ON
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 💬 Magre-react na ako sa sarili kong mensahe
 🔥 Emoji: Awtomatikong nag-iiba
 ⏱️ Oras: Tama — HINDI MA-DETECT
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   if (action === "selfreactoff") {
     data.selfReact = false;
     saveSystemData(data);
     return send(api,
 `❌ SELF-REACT — NAKA-OFF
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hindi na ako magre-react sa sarili kong mensahe
 I-type /ryuk selfreacton para ibalik
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   if (action === "setgname") {
     const newName = args.slice(1).join(" ").trim();
     if (!newName) {
       return send(api,
 `📋 GAMITIN ANG SETGNAME — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 /ryuk setgname [bagong pangalan ng GC]
 Halimbawa:
 /ryuk setgname RYUK POGI ON TOP
 Pinakamataas na haba: 30 letra
 Kasalukuyan: ${targetGCName}
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
     }
     if (newName.length > 30) {
       return send(api,
 `❌ MASYADONG MAHABA — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Pinakamataas: 30 letra
 Ang inilagay mo: ${newName.length} letra
 Masyadong mahaba! Paikliin mo.
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
     }
     targetGCName = newName;
     saveSystemData(data);
     api.setTitle(targetGCName, threadID, () => {});
     return send(api,
 `✅ GC NAME NAPALITAN — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 LUMANG PANGALAN: ${targetGCName !== newName ? targetGCName : "(walang pagbabago)"}
 BAGONG PANGALAN: ${targetGCName}
 🔒 LOCKED — IBABALIK AGAD KAPAG NAPALITAN!
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   if (action === "setnick") {
     const newName = args.slice(1).join(" ").trim();
     if (!newName) {
       return send(api,
 `📋 GAMITIN ANG SETNICK — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 /ryuk setnick [bagong nickname]
 Halimbawa:
 /ryuk setnick RYUK POGI
 Pinakamataas na haba: 25 letra
 Kasalukuyan: ${targetNickname}
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
     }
     if (newName.length > 25) {
       return send(api,
 `❌ MASYADONG MAHABA — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Pinakamataas: 25 letra
 Ang inilagay mo: ${newName.length} letra
 Masyadong mahaba! Paikliin mo.
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
     }
     targetNickname = newName;
     saveSystemData(data);
     return send(api,
 `✅ NICKNAME NAKA-SET — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BAGONG NICKNAME: ${targetNickname}
 🔒 LOCKED — IBABALIK AGAD KAPAG NAPALITAN!
 I-type /ryuk lock para ilapat sa lahat ng miyembro
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   if (action === "lock") {
     api.getThreadInfo(threadID, async (err, info) => {
       if (err || !info) {
         return send(api,
 `❌ HINDI MAKUHA ANG GC — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hindi makukuha ang impormasyon ng GC.
 Subukan ulit mamaya.
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
           threadID, messageID
         );
       }
       const members = info.participantIDs || [];
       const estMin = Math.floor(members.length * NICK_DELAY_MIN / 60000);
       const estMax = Math.ceil(members.length * NICK_DELAY_MAX / 60000);
       
       send(api,
 `🔒 NAGSISIMULA ANG LOCK — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 👑 GC NAME:    ${targetGCName}
 👤 NICKNAME:   ${targetNickname}
 👥 MIYEMBRO:   ${members.length} katao
 ⏱️ TINATAYA:   ${estMin} - ${estMax} minuto
 ⚠️ HUWAG ISARA ANG CHAT!
 Maghihintay tayo hanggang matapos ang lahat.
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
       
       api.setTitle(targetGCName, threadID, () => {});
       const result = await setAllNicknamesWithDelay(api, threadID, members, targetNickname, botID);
       
       if (result.error) {
         return send(api, result.error, threadID, messageID);
       }
       
       send(api,
 `✅ LOCK TAPOS NA! — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 📊 KABUUANG REPLY:     ${result.total}
 ✅ NAPALITAN:   ${result.success}
 ⏭️ NILAKTASAN:  ${result.skip} (kasama ang sarili ko)
 ❌ NABIGO:     ${result.fail}
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🔒 PROTEKSIYON: AKTIBO — IBABALIK AGAD KAPAG NAPALITAN!
 RYUK POGI ON TOP! 👑
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID
       );
     });
     return;
   }
   if (action === "reacton") {
     data.autoReact = true;
     saveSystemData(data);
     return send(api,
 `✅ AUTO-REACT — NAKA-ON
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Magre-react na ako sa mensahe ng iba sa GC lang
 Hindi gagana sa pribadong usapan
 I-type /ryuk reactoff para patayin
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   if (action === "reactoff") {
     data.autoReact = false;
     saveSystemData(data);
     return send(api,
 `❌ AUTO-REACT — NAKA-OFF
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hindi na ako magre-react sa mensahe ng iba
 I-type /ryuk reacton para ibalik
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   return send(api,
 `❌ HINDI KILALANG UTOS — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ang inilagay mo: /ryuk ${args[0] || "(walang utos)"}
 Hindi ito kilala.
 I-type /ryuk help para makita ang lahat ng utos.
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
     threadID, messageID
   );
 };
