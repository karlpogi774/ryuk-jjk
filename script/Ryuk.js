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

const SELF_REACT_EMOJIS = ["😆"];
const ALL_REACT_EMOJIS = ["🔥", "💪", "👑", "⚡", "😎", "✅", "💯"];

const NICK_DELAY_MIN = 1;
const NICK_DELAY_MAX = 1;
const REPLY_DELAY_MIN = 15000;
const REPLY_DELAY_MAX = 15000;
const AUTO_RESTORE_DELAY = 10;
const COOLDOWN = 15000;

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
      }, getRandomDelay(10, 10));
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
      }, getRandomDelay(10, 10));
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
          }, getRandomDelay(10, 10));
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
    `@${fullName} — RYUK POGI ON TOP — hindi ito sabi, ito ay TALAGA! 😡💢`,
    `@${fullName} — walang makakapantay, wala pang ipinanganak na katulad ko! 👿🔥`,
    `@${fullName} — ako ang batas, ako ang desisyon — walang makakabago! 😠💢`,
    `@${fullName} — bakit maghahanap ka ng iba kung nandito na ang PINAKAMAHUSAY? 😡🔥`,
    `@${fullName} — sila? nag-aagawan. Ako? HINDI KO KAILANGAN — akin na lahat! 👿💢`,
    `@${fullName} — hindi ako sumusunod — AKO ANG SINUSUNOD! 😠😡`,
    `@${fullName} — mas mataas pa sa inaasahan mo — GANOON AKO! 💢🔥`,
    `@${fullName} — huwag kang magtaka, simula pa lang AKO NA! 😡👿`,
    `@${fullName} — hindi ako nakikipagpaligsahan — WALA NAMANG KALABAN! 👿💢`,
    `@${fullName} — ang pagiging RYUK POGI — hindi ito natututunan, IPINANGANAK DITO! 😠🔥`,
    `@${fullName} — sila, umaasa sa swerte. Ako, gumagawa ng sarili kong kapalaran! 💢😡`,
    `@${fullName} — kahit sino pa ang lumitaw — AKO PA RIN ANG PIPILIIN! 😡🔥`,
    `@${fullName} — hindi ako nagpapakilala — kilala na ako bago ka pa dumating! 👿💢`,
    `@${fullName} — pwesto ko? HINDI IBIBIGAY — HINDI IBEBENTA — AKIN TALAGA! 😠😡`,
    `@${fullName} — sabihin mo sa kanila — huwag nang sumubok, SAYANG LANG SILA! 💢🔥`,
    `@${fullName} — dito, walang pangalawa — UNA AT HULI AKO! 😡👿`,
    `@${fullName} — sila, tumitingin sa itaas. Ako — NAKATINGIN SA IBABA SA KANILA! 👿💢`,
    `@${fullName} — hindi ako nagpapanggap — kung sino ako, ITO NA! 😠🔥`,
    `@${fullName} — mas matibay kaysa bato, mas matalas kaysa talim — GANOON AKO! 💢😡`,
    `@${fullName} — bakit sa akin ka lumapit? Kasi alam mong WALA NANG IBA! 😡🔥`,
    `@${fullName} — hindi ako naghahabol — SILA ANG NAGHIHABOL SA AKIN! 👿💢`,
    `@${fullName} — RYUK POGI — hindi ito titulo, ITO ANG KATOTOHANAN! 😠😡`,
    `@${fullName} — kahit sa dilim, ako ang liwanag — SILA ANG NAGTATAGO SA ANINO! 💢🔥`,
    `@${fullName} — hindi ako yumuyuko — KAHIT KANINO! 😡👿`,
    `@${fullName} — kung saan ako naroon — DOON ANG PINAKAMATAAS! 👿💢`,
    `@${fullName} — sila, puro salita. Ako — GINAGAWA BAGO PA MAN SILA MAGISIP! 😠🔥`,
    `@${fullName} — huwag kang mag-alala — HINDI AKO BABABA! 💢😡`,
    `@${fullName} — ang pwestong ito — HINDI NILA KAYANG ABUTAN! 😡🔥`,
    `@${fullName} — hindi ako nagpapaliwanag — KILALA NILA ANG GAWA KO! 👿💢`,
    `@${fullName} — sabihin mo sa kanila — HINDI AKO KAKALAHOK SA LARO NILA! 😠😡`,
    `@${fullName} — ako ang simula, ako ang dulo — WALANG KASUNOD! 💢🔥`,
    `@${fullName} — sila, nagtutulungan pero nagtatrayuran. Ako — MAG-ISA PERO PANALO! 😡👿`,
    `@${fullName} — hindi ko kailangan ng kasama — SARILI KO LANG SAPAT NA! 👿💢`,
    `@${fullName} — RYUK POGI — hindi ito nabibili, HINDI NAMAN IPINAGBILI! 😠🔥`,
    `@${fullName} — kung gusto nila makalaban — MAGHANAP SILANG KAPANTAY NILA! 💢😡`,
    `@${fullName} — hindi ako nagbago — SILA ANG NAGBAGO KASI HINDI NILA AKO KAYA! 😡🔥`,
    `@${fullName} — mas mataas ang tingin ko sa sarili ko kaysa sa tingin niyo sa akin — TOTOO NAMAN! 👿💢`,
    `@${fullName} — huwag mo akong ikumpara — WALA NAMANG KATULAD KO! 😠😡`,
    `@${fullName} — sila, umaasa sa pagkakataon. Ako — GUMAGAWA NG PAGKAKATAON! 💢🔥`,
    `@${fullName} — kahit anong mangyari — AKO PA RIN ANG NANGUNGUNA! 😡👿`,
    `@${fullName} — hindi ako sumusuko — HANGGANG DULO, AKO ANG MANANALO! 👿💢`,
    `@${fullName} — bakit magtatanong ka pa? ALAM MO NAMAN ANG SAGOT! 😠🔥`,
    `@${fullName} — ang pangalang RYUK POGI — HINDI MAKAKALIMUTAN KAILANMAN! 💢😡`,
    `@${fullName} — sila, nagsisikap umakyat. Ako — NAKAUPO NA SA ITAAS! 😡🔥`,
    `@${fullName} — hindi ako nangangako — GINAGAWA KO AGAD! 👿💢`,
    `@${fullName} — sabihin mo sa kanila — HUWAG NANG SUMAUBOS NG ORAS, HINDI NILA AKO KAYA! 😠😡`,
    `@${fullName} — dito sa atin — TAYO ANG PANALO, SILA ANG TUMATALO! 💢🔥`,
    `@${fullName} — hindi ako nagpapabuti — PINAPATUNAYAN KO PALAGI! 😡👿`,
    `@${fullName} — kahit walang nakatingin — AKO PA RIN ANG HARI! 👿💢`,
    `@${fullName} — sila, nagpapanggap na malakas. Ako — MALAKAS TALAGA! 😠🔥`,
    `@${fullName} — hindi ako nang-aagaw — AKIN NA ITO BAGO PA MAN SILA ISIPIN! 💢😡`,
    `@${fullName} — kung may gusto sila — KAYANG-KAYA NAMAN KUNG TALAGANG KAYA! 😡🔥`,
    `@${fullName} — RYUK POGI — hindi ito ipinipilit, TINATANGGAP NILA KASI ALAM NILA TOTOO! 👿💢`,
    `@${fullName} — hindi ako natatakot sa hamon — SILA ANG TAKOT SA AKIN! 😠😡`,
    `@${fullName} — mas matagal pa akong nasa itaas kaysa sa buhay nila! 💢🔥`,
    `@${fullName} — huwag kang mag-alala — HINDI AKO BABABA PARA SA KANILA! 😡👿`,
    `@${fullName} — sila, puro pangarap. Ako — NABUBUHAY NA ANG PANGARAP NILA! 👿💢`,
    `@${fullName} — hindi ako naghihintay — AKO ANG HINIHINTAY NG LAHAT! 😠🔥`,
    `@${fullName} — sabihin mo sa kanila — SIMPLENG BAGAY: RYUK POGI ON TOP, TAPOS NA ANG USAPAN! 💢😡`,
    `@${fullName} — walang susunod, walang papalit — AKO ANG HULI! 😡🔥`,
    `@${fullName} — hindi ako nagpapalit — SILA ANG NAGPAPALIT KASI HINDI NILA AKO MAHANAP! 👿💢`,
    `@${fullName} — kung may duda sila — HAYAAN MO SILA, MASAKIT TANGGAPIN ANG KATOTOHANAN! 😠😡`,
    `@${fullName} — akin ang itaas, akin ang baba — AKO ANG BUONG MUNDO! 💢🔥`,
    `@${fullName} — sila, nagtutulungan pero kulang. Ako — MAG-ISA PERO SOBRA-SOBRA! 😡👿`,
    `@${fullName} — hindi ako naghahangad — KASI NANDITO NA ANG LAHAT KAILANGAN KO! 👿💢`,
    `@${fullName} — RYUK POGI — hindi ito pangalan lang — ITO ANG TANDA NG PANALO! 😠🔥`,
    `@${fullName} — kahit saan, kahit kailan — HINDI MAGBABAGO ANG KATOTOHANAN! 💢😡`,
    `@${fullName} — sila, nagpapanggap na kilala ako. HINDI NILA AKO KILALA TALAGA! 😡🔥`,
    `@${fullName} — hindi ako nagpapababa — KASI HINDI AKO BAGAY SA IBABA! 👿💢`,
    `@${fullName} — kung gusto nila makalaban — MAGHANAP SILANG KAPANTAY NILA, HINDI AKO! 😠😡`,
    `@${fullName} — huwag kang mag-alala — HINDI AKO TITIGIL HANGGA'T HINDI PA RIN AKO ANG NANGUNGUNA! 💢🔥`,
    `@${fullName} — ang tunay na hari — HINDI KAILANGANG SIGAWAN, NARIRINIG KAHIT TAHIMIK! 😡👿`,
    `@${fullName} — sila, puro daldal kung gaano kalakas. AKO, TAHIMIK PERO PANALO! 👿💢`,
    `@${fullName} — hindi ako nakikipaglaro — KASI HINDI ITO LARO! 😠🔥`,
    `@${fullName} — RYUK POGI ON TOP — HINDI ITO MAGBABAGO KAILANMAN! 💢😡`,
    `@${fullName} — kahit anong mangyari — AKO PA RIN ANG NASA ITAAS! 😡🔥`,
    `@${fullName} — sila, nag-aagawan sa pwestong AKIN NA! 👿💢`,
    `@${fullName} — hindi ako nanghihingi — IBINIBIGAY NILA KASI ALAM NILA NARARAPAT AKO! 😠😡`,
    `@${fullName} — kung may gusto sila sabihin — SABIHIN MO SA AKIN, DITO DADAAN LAHAT! 💢🔥`,
    `@${fullName} — dito sa atin — WALANG KAPANTAY, ISA LANG ANG TUNAY! 😡👿`,
    `@${fullName} — sila, sumusunod sa agos. Ako — AKO ANG NAGTUTURO NG DIREKSYON! 👿💢`,
    `@${fullName} — hindi ako natatakot — SILA ANG DAPAT MATAKOT SA KANILANG SARILI! 😠🔥`,
    `@${fullName} — RYUK POGI — HINDI ITO PWEDE PALITAN, HINDI ITO PWEDE KUHAIN! 💢😡`,
    `@${fullName} — huwag kang maghanap ng iba — WALA NANG HIGIT PA SA AKIN! 😡🔥`,
    `@${fullName} — sila, puro plano. Ako — TAPOS NA BAGO PA MAN SILA MAGSIMULA! 👿💢`,
    `@${fullName} — hindi ako nagpapaliwanag — KASI ALAM NILA ANG TOTOO! 😠😡`,
    `@${fullName} — kung gusto nila umakyat — SARILING HAKBANG ANG GAWIN, HUWAG AKO HAKBANGIN! 💢🔥`,
    `@${fullName} — mas matibay ako kaysa kahapon — BUKAS PA LALO TUMITIBAY! 😡👿`,
    `@${fullName} — RYUK POGI ON TOP — TAPOS NA ANG USAPAN, WALANG DAGDAG! 👿💢`,
    `@${fullName} — hindi ako nangangailangan — KAILANGAN NILA AKO! 😠🔥`,
    `@${fullName} — sila, naghahanap ng kahinaan — WALA SILANG MAKITA! 💢😡`,
    `@${fullName} — ako ang pundasyon — KAHIT GUMUHO ANG LAHAT, TUMATAYO PA RIN AKO! 😡🔥`,
    `@${fullName} — huwag kang mag-alala — HINDI AKO MAGKAKAMALI! 👿💢`,
    `@${fullName} — RYUK POGI — HINDI ITO NABABAGO NG KANINO! 😠😡`,
    `@${fullName} — sila, puro pangako — AKO ANG TUMUTUPAD! 💢🔥`,
    `@${fullName} — hindi ako nagpapalit-palit — PAREHO PA RIN AKO MULA NOON! 😡👿`,
    `@${fullName} — kung may gusto sila — DAPAT KAYA NILA, HINDI UMAASA SA IBA! 👿💢`,
    `@${fullName} — akin ang lahat — HINDI KO KAILANGANG HIRAMIN KANINO! 😠🔥`,
    `@${fullName} — sila, nagpapanggap na malakas — KAPAG TINIGILAN, BUMABAGSAK! 💢😡`,
    `@${fullName} — ako, sarili ko ang lakas ko — KAYA HINDI BUMABAGSAK! 😡🔥`,
    `@${fullName} — RYUK POGI — HINDI ITO PINAGTATAGO, KILALA NG LAHAT! 👿💢`,
    `@${fullName} — huwag kang magtanong kung bakit ako — KASI AKO ANG NARARAPAT! 😠😡`,
    `@${fullName} — sila, puro ingay — TAHIMIK NA KAPAG NANDITO AKO! 💢🔥`,
    `@${fullName} — hindi ako nakikipagkumpitensya — WALA NAMANG KALABAN! 😡👿`,
    `@${fullName} — kung may gusto sila — SABIHIN MO SA AKIN, HINDI SA IBA! 👿💢`,
    `@${fullName} — RYUK POGI ON TOP — HINDI ITO MAGBABAGO! 😠🔥`,
    `@${fullName} — sila, sumusunod sa kung sino malakas — AKO ANG SINUSUNOD NG LAHAT! 💢😡`,
    `@${fullName} — hindi ako naghahangad ng papuri — KILALA NAMAN AKO! 😡🔥`,
    `@${fullName} — kung gusto nila maging katulad ko — MAGSIMULA SILA SA PAGIGING TOTOO! 👿💢`,
    `@${fullName} — akin ang pwesto — HINDI KO IBIBIGAY SA KANINO! 😠😡`,
    `@${fullName} — sila, puro salita — AKO ANG MAY GAGAWA! 💢🔥`,
    `@${fullName} — hindi ako natatakot sa hamon — LALO LANG AKONG TUMITIBAY! 😡👿`,
    `@${fullName} — RYUK POGI — HINDI ITO NABIBILI NG PERA! 👿💢`,
    `@${fullName} — huwag kang mag-alala — HINDI AKO IIWAN! 😠🔥`,
    `@${fullName} — sila, nag-aagawan sa pwestong HINDI SA KANILA! 💢😡`,
    `@${fullName} — ako, nandito na bago pa man sila dumating — AT HINDI AKO AALIS! 😡🔥`,
    `@${fullName} — hindi ako nangangako — KUNG SINABI KO, GINAGAWA KO AGAD! 👿💢`,
    `@${fullName} — kung may duda sila — HAYAAN MO SILA, HINDI NILA MAINTINDIHAN! 😠😡`,
    `@${fullName} — RYUK POGI ON TOP — TAPOS NA ANG USAPAN! 💢🔥`,
    `@${fullName} — sila, puro plano — HINDI NAGSISIMULA! 😡👿`,
    `@${fullName} — ako, tapos na bago pa man sila magsimula! 👿💢`,
    `@${fullName} — huwag kang maghanap ng iba — WALA NANG HIGIT PA! 😠🔥`,
    `@${fullName} — hindi ako nagpapanggap — KUNG SINO AKO, ITO NA! 💢😡`,
    `@${fullName} — sila, nagpapalit-palit — AKO PAREHO PALAGI! 😡🔥`,
    `@${fullName} — RYUK POGI — HINDI ITO PWEDE KUHAIN! 👿💢`,
    `@${fullName} — kung gusto nila — KAYA NAMAN KUNG TALAGANG GUSTO! 😠😡`,
    `@${fullName} — akin ang lahat — HINDI KO KAILANGANG HIRAMIN! 💢🔥`,
    `@${fullName} — sila, puro daldal — WALANG MAIPAKITA! 😡👿`,
    `@${fullName} — ako, may gawa — KAYA KILALA AKO! 👿💢`,
    `@${fullName} — huwag kang mag-alala — HINDI AKO BABABA! 😠🔥`,
    `@${fullName} — RYUK POGI ON TOP — WALANG KATULAD! 💢😡`,
    `@${fullName} — sila, sumusunod — AKO ANG SINUSUNOD! 😡🔥`,
    `@${fullName} — hindi ako naghahabol — SILA ANG HUMABOL SA AKIN! 👿💢`,
    `@${fullName} — kung may gusto sila — SABIHIN MO SA AKIN! 😠😡`,
    `@${fullName} — akin ang itaas — HINDI KO IBIBIGAY! 💢🔥`,
    `@${fullName} — sila, puro pangarap — AKO ANG TOTOO! 😡👿`,
    `@${fullName} — RYUK POGI ON TOP — HINDI ITO MAGBABAGO KAILANMAN! 👿💢`,
    `@${fullName} — huwag kang mag-alala — HINDI AKO TITIGIL! 😠🔥`,
    `@${fullName} — sila, nagtago — AKO ANG LUMABAN! 💢😡`,
    `@${fullName} — ako, panalo palagi — HINDI NAGBABAGO! 😡🔥`,
    `@${fullName} — RYUK POGI ON TOP — TAPOS NA ANG USAPAN! 👿💢`
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
  cooldowns: 15
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
              api.setMessageReaction("✅", messageID, () => {}, true);
            } catch {}
          }, getRandomDelay(10, 10));
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
        }, getRandomDelay(10, 10));
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
      try { api.setMessageReaction("✅", messageID, () => {}, true); } catch {}
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
