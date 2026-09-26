const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — MAKUNAT V2.0 | ANTI-SPAM ✅
// ADMIN IDs: 61594055835097, 61593892603402
// 61594325727109, 61594022290817
// TARGET: RYUK POGI ON TOP ✅
// ✅ GC LOCK | NICK LOCK | MATIBAY ANTI-SPAM
// ✅ HINDI MA-SUSPEND | HINDI MA-DETECT
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const targetNickname = "RYUK POGI ON TOP";
const targetGCName = "RYUK POGI ON TOP";
const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: false,
  autoReact: true,
  delay: 2500,
  totalReplies: 0,
  spamBlock: true,
  spamThreshold: 3,
  spamWindow: 10000
};

// ========== ANTI-SPAM SYSTEM ==========
const USER_MESSAGE_LOG = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN = 5000;
const RECENT_SAME_TEXT = new Map();

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

function cleanText(text = "") {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function checkSpam(threadID, senderID, body) {
  const now = Date.now();
  const userKey = `${threadID}-${senderID}`;
  const textKey = `${threadID}-${cleanText(body)}`;

  // Same message too fast
  const lastSameText = RECENT_SAME_TEXT.get(textKey) || 0;
  if (now - lastSameText < 6000) return true;
  RECENT_SAME_TEXT.set(textKey, now);

  // Message frequency counter
  if (!USER_MESSAGE_LOG.has(userKey)) {
    USER_MESSAGE_LOG.set(userKey, []);
  }
  const logs = USER_MESSAGE_LOG.get(userKey);
  const recent = logs.filter(t => now - t < DEFAULT_DATA.spamWindow);
  recent.push(now);
  USER_MESSAGE_LOG.set(userKey, recent);

  return recent.length > DEFAULT_DATA.spamThreshold;
}

function rememberMessage(msgID) {
  if (SEEN_MESSAGES.has(msgID)) return false;
  SEEN_MESSAGES.add(msgID);
  if (SEEN_MESSAGES.size > MAX_SEEN) {
    SEEN_MESSAGES.delete(SEEN_MESSAGES.values().next().value);
  }
  return true;
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
    }
  } catch (e) {
    console.error("[ryuk] Load err:", e.message);
  }
  return { ...DEFAULT_DATA };
}

function saveData(d) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); return true; }
  catch (e) { console.error("[ryuk] Save err:", e.message); return false; }
}

function send(api, msg, tid, mid = null) {
  api.sendMessage(msg, tid, () => {}, mid);
}

function randomDelay(min = 1800, max = 3500) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
  const LOCK_LINES = [
  "😂 Sinubukan mo pa? Sayang oras, babalik pa rin ako!",
  "🤣 Ang bagal mo — bago ka matapos, ibinalik ko na!",
  "😏 Hayaan mo na — wala kang laban, tanggapin mo na 😂",
  "😂 Cute naman magpalit — pero hindi gagana sayo!",
  "🤣 Pagod ka na? Ako hindi — RYUK pa rin mananalo!",
  "😂 Sige lang, magpalit ka — ibabalik ko ulit agad!",
  "😏 Sayang effort — RYUK POGI ON TOP lang talaga 😂",
  "😂 Paulit-ulit ka na — hindi ka pa rin natututo!",
  "🤣 Ang hirap mo pa — hindi naman mababago 😂",
  "😏 Subukan mo pang ilihis — babalik at babalik ako!",
  "😂 Parang sira na — paulit-ulit na lang 😂",
  "🤣 Hinga ka muna — hindi talaga gagana sayo 😂",
  "😏 Tanggapin mo na — ikaw ang talo 😂",
  "😂 Hinto mo na — hindi naman gagana 😂",
  "🤣 Paulit-ulit, parehas lang — RYUK PA RIN 😂",
  "😏 Ako ang batas dito — RYUK POGI ON TOP 😂",
  "😂 Sayang oras mo — alam mo na sagot 😂",
  "🤣 Hinga ka malalim — tanggapin mo na 😂",
  "😏 Wala nang ibang — RYUK LANG 😂",
  "😂 Kahit saan — RYUK POGI ON TOP 😂",
  "🤣 Ang kulit mo talaga — pero hindi pa rin 😂",
  "😏 Tapos na ang laban — RYUK ANG PANALO 😂",
  "😂 Hindi na mababago — nakatatak na 😂",
  "🤣 Paulit-ulit ka na — wala nang bago 😂",
  "😏 Araw-araw, gabi-gabi — RYUK PA RIN 😂",
  "😂 Subukan mo — mas lalo kong ibabalik 😂",
  "🤣 Alam mo na — bakit mo pa tinatanong? 😂",
  "😏 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "😂 Walang makakatalo — sigurado ako 😂",
  "🤣 Pagod ka na? Ako hindi — tuloy lang 😂",
  "😏 Talo ka na — aminin mo na 😂",
  "😂 Wala nang laban — RYUK ANG PANALO 😂",
  "🤣 Ang galing ko no? 😂",
  "😏 Tanggapin mo na ang katotohanan — RYUK NAMIN 😂",
  "😂 Ikaw lang ang nagpapagod — ako hindi 😂",
  "🤣 Walang tatalo sa RYUK 😂",
  "😏 Kahit kailan — hindi mo mapapalitan 😂",
  "😂 Paulit-ulit na lang tayo — alam mo na sagot 😂",
  "🤣 Ang bilis ko — bago ka matapos, tapos na ako 😂",
  "😏 Hinto mo na — wala kang magagawa 😂",
  "😂 Sayang oras mo — alam mo na sagot 😂",
  "🤣 Tuloy lang ako — hindi ako napapagod 😂",
  "😏 Paulit-ulit ka na — hindi ka pa rin natututo 😂",
  "😂 Ang bagal mo — tapos ka na bago ka pa magsimula 😂",
  "🤣 Subukan mo pang ilihis — babalik at babalik ako 😂",
  "😏 Wala nang bago — parehas lang 😂",
  "😂 Talo ka na — aminin mo na 😂",
  "🤣 Wala nang laban — RYUK ANG PANALO 😂",
  "😏 Ang kulit mo naman — pero hindi pa rin 😂",
  "😂 Sayang effort — RYUK LANG MALAKAS 😂",
  "🤣 Sige lang — mas lalo kong ibabalik 😂",
  "😏 Hindi ka ba napapagod? Ako hindi 😂",
  "😂 Walang makakatalo sa RYUK 😂",
  "🤣 Talo ka na — tapos na 😂",
  "😏 Aminin mo na — talo ka na 😂",
  "😂 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "🤣 Subukan mo — mas lalo kong ibabalik 😂",
  "😏 Alam mo na — bakit mo pa tinatanong? 😂",
  "😂 HANGGANG DULO — RYUK POGI ON TOP 😂",
  "🤣 Wala nang bago — RYUK PA RIN 😂",
  "😏 Araw-araw, gabi-gabi — RYUK PA RIN 😂",
  "😂 Hindi na mababago — nakatatak na 😂",
  "🤣 Paulit-ulit ka na — wala nang bago 😂",
  "😏 RYUK LANG MALAKAS — IKAW AY TALO 😂",
  "😂 Sige, subukan mo ulit — parehas lang 😂",
  "🤣 Ang bilis ko — tapos na bago ka pa magsalita 😂",
  "😏 Hindi ka makakatalo sa RYUK 😂",
  "😂 Hinto mo na — wala kang magagawa 😂",
  "🤣 Sayang oras mo — alam mo na sagot 😂",
  "😏 Tanggapin mo na — ikaw ang talo 😂",
  "😂 Walang makakatigil sa RYUK 😂",
  "🤣 Tuloy lang ako — hindi ako napapagod 😂",
  "😏 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "😂 Tapos na — RYUK ANG PANALO 😂",
  "🤣 Aminin mo na — talo ka na 😂",
  "😏 Wala nang laban — RYUK PA RIN 😂",
  "😂 Subukan mo pang tumakas — mahahabol kita 😂",
  "🤣 Ako ang una — ikaw ang huli 😂",
  "😏 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😂 Hindi na mababago — sigurado na 😂",
  "🤣 Paulit-ulit, walang pagod — RYUK PA RIN 😂",
  "😏 Ako ang batas dito — alam mo yan 😂",
  "😂 Wala kang magagawa — nasa akin ang kapangyarihan 😂",
  "🤣 Talo ka na — aminin mo na 😂",
  "😏 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "😂 Kahit saan, kahit kailan — RYUK PA RIN 😂",
  "🤣 Ang kulit mo talaga — pero hindi pa rin 😂",
  "😏 Sayang effort — RYUK LANG MALAKAS 😂",
  "😂 Sige lang — mas lalo kong ibabalik 😂",
  "🤣 Hindi ka ba napapagod? Ako hindi 😂",
  "😏 Tapos na ang laro — RYUK ANG PANALO 😂",
  "😂 Wala nang bago — parehas lang 😂",
  "🤣 Paulit-ulit ka na — wala nang bago 😂",
  "😏 Tanggapin mo na — hindi na mababago 😂",
  "😂 Subukan mo ulit — parehas lang ang resulta 😂",
  "🤣 Ang hirap mo pa — hindi naman mababago 😂",
  "😏 Walang makakatalo sa RYUK 😂",
  "😂 Hinga ka malalim — tanggapin mo na 😂",
  "🤣 Sayang lakas mo — alam mo na sagot 😂",
  "😏 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😂 Kahit anong gawin mo — RYUK PA RIN 😂",
  "🤣 Ako ang batas dito — tandaan mo yan 😂",
  "😏 Paulit-ulit, walang pagod — RYUK PA RIN 😂",
  "😂 Hindi ka makakaalis dito — RYUK PA RIN 😂",
  "🤣 Tapos na ang laro — RYUK ANG PANALO 😂",
  "😏 Aminin mo na — ikaw ang talo 😂",
  "😂 Wala nang laban — RYUK ANG PANALO 😂",
  "🤣 Ang galing ko no? 😂",
  "😏 Tanggapin mo na ang katotohanan — RYUK NAMIN 😂",
  "😂 Ikaw lang ang nagpapagod — ako hindi 😂",
  "🤣 Walang tatalo sa RYUK 😂",
  "😏 Kahit kailan — hindi mo mapapalitan 😂",
  "😂 Paulit-ulit na lang tayo — alam mo na sagot 😂",
  "🤣 Ang bilis ko — bago ka matapos, tapos na ako 😂",
  "😏 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😂 Subukan mo — mas lalo kong ibabalik 😂",
  "🤣 Alam mo na — bakit mo pa tinatanong? 😂",
  "😏 Walang makakatigil sa RYUK 😂",
  "😂 Hinto mo na — wala kang magagawa 😂",
  "🤣 Paulit-ulit na lang tayo — alam mo na sagot 😂",
  "😏 RYUK LANG MALAKAS — IKAW AY TALO 😂",
  "😂 Tapos na — RYUK ANG PANALO 😂",
  "🤣 Aminin mo na — talo ka na 😂",
  "😏 Wala nang ibang — RYUK LANG 😂",
  "😂 Sayang oras mo — alam mo na sagot 😂",
  "🤣 Hinga ka muna — hindi talaga gagana sayo 😂",
  "😏 Paulit-ulit ka na — hindi ka pa rin natututo 😂",
  "😂 Ang bagal mo — tapos ka na bago ka pa magsimula 😂",
  "🤣 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😏 Subukan mo pang ilihis — babalik at babalik ako 😂",
  "😂 Araw-araw, gabi-gabi — RYUK PA RIN 😂",
  "🤣 Hindi na mababago — nakatatak na 😂",
  "😏 Wala nang bago — RYUK PA RIN 😂",
  "😂 Talo ka na — aminin mo na 😂",
  "🤣 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "😏 Kahit saan — RYUK PA RIN 😂",
  "😂 Ang kulit mo naman — pero hindi pa rin 😂",
  "🤣 Paulit-ulit, walang pagod — RYUK PA RIN 😂",
  "😏 Subukan mo — parehas lang ang resulta 😂",
  "😂 Ang bilis ko — tapos na bago ka pa magsalita 😂",
  "🤣 Ako ang nagpapatakbo dito — alam mo yan 😂",
  "😏 Wala kang magagawa — nasa akin ang kapangyarihan 😂",
  "😂 Tapos na ang laro — RYUK ANG PANALO 😂",
  "🤣 Aminin mo na — ikaw ang talo 😂",
  "😏 Hinto mo na — hindi naman gagana 😂",
  "😂 Sayang effort — RYUK LANG MALAKAS 😂",
  "🤣 Tanggapin mo na — hindi na mababago 😂",
  "😏 Paulit-ulit ka na — wala nang bago 😂",
  "😂 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "🤣 Subukan mo ulit — parehas lang 😂",
  "😏 Sige lang — mas lalo kong ibabalik 😂",
  "😂 Hindi ka ba napapagod? Ako hindi 😂",
  "🤣 Walang makakatalo sa RYUK 😂",
  "😏 Talo ka na — tapos na 😂",
  "😂 Aminin mo na — talo ka na 😂",
  "🤣 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "😏 Wala nang laban — RYUK ANG PANALO 😂",
  "😂 Ang galing ko no? 😂",
  "🤣 Tanggapin mo na ang katotohanan — RYUK NAMIN 😂",
  "😏 Ikaw lang ang nagpapagod — ako hindi 😂",
  "😂 Walang tatalo sa RYUK 😂",
  "🤣 Kahit kailan — hindi mo mapapalitan 😂",
  "😏 Paulit-ulit na lang tayo — alam mo na sagot 😂",
  "😂 Ang bilis ko — bago ka matapos, tapos na ako 😂",
  "🤣 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😏 Subukan mo — mas lalo kong ibabalik 😂",
  "😂 Alam mo na — bakit mo pa tinatanong? 😂",
  "🤣 HANGGANG DULO — RYUK POGI ON TOP 😂"
];

let lockIndex = 0;
function nextLockLine() {
  const l = LOCK_LINES[lockIndex];
  lockIndex = (lockIndex + 1) % LOCK_LINES.length;
  return l;
}

const RYUK_QUOTES = [
  "😂 Sinubukan mo talaga? Wala kang laban sakin!",
  "🤣 Ang bagal mo — tapos ka na bago ka pa magsimula!",
  "😏 Tanggapin mo na — RYUK POGI ON TOP lang talaga 😂",
  "😂 Talo ka na agad — simula pa lang, talo ka na 😂",
  "🤣 Ang hirap mo pa — hindi naman mababago 😂",
  "😂 Subukan mo ulit — parehas lang ang resulta 😂",
  "😏 Kawawa ka naman — pilit pa rin 😂",
  "😂 Hinga ka muna — hindi talaga gagana sayo 😂",
  "🤣 Paulit-ulit ka na — hindi ka pa rin natututo 😂",
  "😏 Sayang effort — RYUK LANG MALAKAS 😂",
  "😂 Sige lang — mas lalo kong ibabalik 😂",
  "🤣 Hindi ka ba napapagod? Ako hindi 😂",
  "😏 Walang makakatigil sa RYUK 😂",
  "😂 Tapos na ang laban — RYUK ANG PANALO 😂",
  "🤣 Aminin mo na — talo ka na 😂",
  "😏 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😂 Kahit saan — RYUK PA RIN 😂",
  "🤣 Ang kulit mo naman — pero hindi pa rin 😂",
  "😏 Paulit-ulit, walang pagod — RYUK PA RIN 😂",
  "😂 Subukan mo pang ilihis — babalik at babalik ako 😂",
  "🤣 Ako ang nagpapatakbo dito — alam mo yan 😂",
  "😏 Wala nang ibang — RYUK LANG 😂",
  "😂 Sayang lakas mo — alam mo na sagot 😂",
  "🤣 Hinga ka malalim — tanggapin mo na 😂",
  "😏 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "😂 Walang makakatalo — sigurado ako 😂",
  "🤣 Pagod ka na? Ako hindi — tuloy lang 😂",
  "😏 Talo ka na — aminin mo na 😂",
  "😂 Wala nang laban — RYUK ANG PANALO 😂",
  "🤣 Ang galing ko no? 😂",
  "😏 Tanggapin mo na ang katotohanan — RYUK NAMIN 😂",
  "😂 Ikaw lang ang nagpapagod — ako hindi 😂",
  "🤣 Walang tatalo sa RYUK 😂",
  "😏 Kahit kailan — hindi mo mapapalitan 😂",
  "😂 Paulit-ulit na lang tayo — alam mo na sagot 😂",
  "🤣 Ang bilis ko — bago ka matapos, tapos na ako 😂",
  "😏 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😂 Subukan mo — mas lalo kong ibabalik 😂",
  "🤣 Alam mo na — bakit mo pa tinatanong? 😂",
  "😏 HANGGANG DULO — RYUK POGI ON TOP 😂",
  "😂 Wala nang bago — RYUK PA RIN 😂",
  "🤣 Talo ka na — aminin mo na 😂",
  "😏 Araw-araw, gabi-gabi — RYUK PA RIN 😂",
  "😂 Hindi na mababago — nakatatak na 😂",
  "🤣 Paulit-ulit ka na — wala nang bago 😂",
  "😏 RYUK LANG MALAKAS — IKAW AY TALO 😂",
  "😂 Sige, subukan mo ulit — parehas lang 😂",
  "🤣 Hindi ka makakatalo sa RYUK 😂",
  "😏 Hinto mo na — wala kang magagawa 😂",
  "😂 Sayang oras mo — alam mo na sagot 😂",
  "🤣 Tanggapin mo na — ikaw ang talo 😂",
  "😏 Walang makakatigil sa RYUK 😂",
  "😂 Tuloy lang ako — hindi ako napapagod 😂",
  "🤣 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "😏 Tapos na — RYUK ANG PANALO 😂",
  "😂 Aminin mo na — talo ka na 😂",
  "🤣 Wala nang laban — RYUK PA RIN 😂",
  "😏 Subukan mo pang tumakas — mahahabol kita 😂",
  "😂 Ako ang una — ikaw ang huli 😂",
  "🤣 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😏 Hindi na mababago — sigurado na 😂",
  "😂 Paulit-ulit, walang pagod — RYUK PA RIN 😂",
  "🤣 Ako ang batas dito — alam mo yan 😂",
  "😏 Wala kang magagawa — nasa akin ang kapangyarihan 😂",
  "😂 Talo ka na — aminin mo na 😂",
  "🤣 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "😏 Kahit saan, kahit kailan — RYUK PA RIN 😂",
  "😂 Ang kulit mo talaga — pero hindi pa rin 😂",
  "🤣 Sayang effort — RYUK LANG MALAKAS 😂",
  "😏 Sige lang — mas lalo kong ibabalik 😂",
  "😂 Hindi ka ba napapagod? Ako hindi 😂",
  "🤣 Tapos na ang laro — RYUK ANG PANALO 😂",
  "😏 Wala nang bago — parehas lang 😂",
  "😂 Paulit-ulit ka na — wala nang bago 😂",
  "🤣 Tanggapin mo na — hindi na mababago 😂",
  "😏 Subukan mo ulit — parehas lang ang resulta 😂",
  "😂 Ang hirap mo pa — hindi naman mababago 😂",
  "🤣 Walang makakatalo sa RYUK 😂",
  "😏 Hinga ka malalim — tanggapin mo na 😂",
  "😂 Sayang lakas mo — alam mo na sagot 😂",
  "🤣 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😏 Kahit anong gawin mo — RYUK PA RIN 😂",
  "😂 Ako ang batas dito — tandaan mo yan 😂",
  "🤣 Paulit-ulit, walang pagod — RYUK PA RIN 😂",
  "😏 Hindi ka makakaalis dito — RYUK PA RIN 😂",
  "😂 Tapos na ang laro — RYUK ANG PANALO 😂",
  "🤣 Aminin mo na — ikaw ang talo 😂",
  "😏 Hinto mo na — hindi naman gagana 😂",
  "😂 Sayang effort — RYUK LANG MALAKAS 😂",
  "🤣 Tanggapin mo na — hindi na mababago 😂",
  "😏 Paulit-ulit ka na — wala nang bago 😂",
  "😂 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "🤣 Subukan mo ulit — parehas lang 😂",
  "😏 Sige lang — mas lalo kong ibabalik 😂",
  "😂 Hindi ka ba napapagod? Ako hindi 😂",
  "🤣 Walang makakatalo sa RYUK 😂",
  "😏 Talo ka na — tapos na 😂",
  "😂 Aminin mo na — talo ka na 😂",
  "🤣 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "😏 Wala nang laban — RYUK ANG PANALO 😂",
  "😂 Ang galing ko no? 😂",
  "🤣 Tanggapin mo na ang katotohanan — RYUK NAMIN 😂",
  "😏 Ikaw lang ang nagpapagod — ako hindi 😂",
  "😂 Walang tatalo sa RYUK 😂",
  "🤣 Kahit kailan — hindi mo mapapalitan 😂",
  "😏 Paulit-ulit na lang tayo — alam mo na sagot 😂",
  "😂 Ang bilis ko — bago ka matapos, tapos na ako 😂",
  "🤣 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😏 Subukan mo — mas lalo kong ibabalik 😂",
  "😂 Alam mo na — bakit mo pa tinatanong? 😂",
  "🤣 Walang makakatigil sa RYUK 😂",
  "😏 Hinto mo na — wala kang magagawa 😂",
  "😂 Paulit-ulit na lang tayo — alam mo na sagot 😂",
  "🤣 RYUK LANG MALAKAS — IKAW AY TALO 😂",
  "😏 Tapos na — RYUK ANG PANALO 😂",
  "😂 Aminin mo na — talo ka na 😂",
  "🤣 Wala nang ibang — RYUK LANG 😂",
  "😏 Sayang oras mo — alam mo na sagot 😂",
  "😂 Hinga ka muna — hindi talaga gagana sayo 😂",
  "🤣 Tanggapin mo na — ikaw ang talo 😂",
  "😏 Paulit-ulit ka na — hindi ka pa rin natututo 😂",
  "😂 Ang bagal mo — tapos ka na bago ka pa magsimula 😂",
  "🤣 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😏 Subukan mo pang ilihis — babalik at babalik ako 😂",
  "😂 Araw-araw, gabi-gabi — RYUK PA RIN 😂",
  "🤣 Hindi na mababago — nakatatak na 😂",
  "😏 Wala nang bago — RYUK PA RIN 😂",
  "😂 Talo ka na — aminin mo na 😂",
  "🤣 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "😏 Kahit saan — RYUK PA RIN 😂",
  "😂 Ang kulit mo naman — pero hindi pa rin 😂",
  "🤣 Paulit-ulit, walang pagod — RYUK PA RIN 😂",
  "😏 Subukan mo — parehas lang ang resulta 😂",
  "😂 Ang bilis ko — tapos na bago ka pa magsalita 😂",
  "🤣 Ako ang nagpapatakbo dito — alam mo yan 😂",
  "😏 Wala kang magagawa — nasa akin ang kapangyarihan 😂",
  "😂 Tapos na ang laro — RYUK ANG PANALO 😂",
  "🤣 Aminin mo na — ikaw ang talo 😂",
  "😏 Hinto mo na — hindi naman gagana 😂",
  "😂 Sayang effort — RYUK LANG MALAKAS 😂",
  "🤣 Tanggapin mo na — hindi na mababago 😂",
  "😏 Paulit-ulit ka na — wala nang bago 😂",
  "😂 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "🤣 Subukan mo ulit — parehas lang 😂",
  "😏 Sige lang — mas lalo kong ibabalik 😂",
  "😂 Hindi ka ba napapagod? Ako hindi 😂",
  "🤣 Walang makakatalo sa RYUK 😂",
  "😏 Talo ka na — tapos na 😂",
  "😂 Aminin mo na — talo ka na 😂",
  "🤣 RYUK POGI ON TOP — HANGGANG DULO 😂",
  "😏 Wala nang laban — RYUK ANG PANALO 😂",
  "😂 Ang galing ko no? 😂",
  "🤣 Tanggapin mo na ang katotohanan — RYUK NAMIN 😂",
  "😏 Ikaw lang ang nagpapagod — ako hindi 😂",
  "😂 Walang tatalo sa RYUK 😂",
  "🤣 Kahit kailan — hindi mo mapapalitan 😂",
  "😏 Paulit-ulit na lang tayo — alam mo na sagot 😂",
  "😂 Ang bilis ko — bago ka matapos, tapos na ako 😂",
  "🤣 RYUK POGI ON TOP — WALANG KATULAD 😂",
  "😏 Subukan mo — mas lalo kong ibabalik 😂",
  "😂 Alam mo na — bakit mo pa tinatanong? 😂",
  "🤣 HANGGANG DULO — RYUK POGI ON TOP 😂"
];

function randomQuote() {
  return RYUK_QUOTES[Math.floor(Math.random() * RYUK_QUOTES.length)];
      }
    async function setAllNicknamesWithDelay(api, threadID, members, name, botID) {
  let success = 0, failed = 0, skipped = 0;
  for (const uid of members) {
    if (String(uid) === String(botID)) { skipped++; continue; }
    await new Promise(r => setTimeout(r, 600));
    api.changeNickname(name, threadID, uid, (err) => {
      if (err) { failed++; console.error(`[ryuk] ❌ ${uid}:`, err?.message || err); }
      else success++;
    });
  }
  return { success, failed, skipped };
}

module.exports.config = {
  name: "ryuk",
  version: "2.0.0",
  hasPermission: 0,
  credits: "ryuk — ANTI-SPAM + LOCK ✅",
  description: "RYUK POGI ON TOP | GC+Nick Lock | Anti-Spam",
  usePrefix: true,
  cooldowns: 3
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData, body } = event;
    if (!threadID) return;

    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);
    const data = loadData();

    // Auto-restore NICKNAME
    if (logMessageType === "log:user-nickname") {
      const targetUID = logMessageData.participant_id;
      if (String(targetUID) === botID) return;
      if (logMessageData.nickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUID, (err) => {
          if (!err) send(api, "🛡️ Ibinalik agad! " + nextLockLine(), threadID);
        });
      }
      return;
    }

    // Auto-restore GC NAME
    if (logMessageType === "log:thread-name") {
      api.setTitle(targetGCName, threadID, () => {
        send(api, "⚡ Sinubukan mong palitan! " + nextLockLine(), threadID);
      });
      return;
    }

    if (!senderID || !messageID) return;
    if (sender === botID || isAdmin(sender)) return;
    if (!data.active) return;
    if (!rememberMessage(String(messageID))) return;

    // ========== ANTI-SPAM CHECK ==========
    if (data.spamBlock && checkSpam(threadID, sender, body || "")) {
      console.log(`[ryuk] 🚫 SPAM BLOCKED: ${sender}`);
      return; // TAHIMIK LANG — HINDI SASAGOT
    }

    // Auto-reaction
    if (data.autoReact) {
      try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
    }

    // Reply with random delay
    setTimeout(() => {
      const latest = loadData();
      if (!latest.active) return;
      const msg = `👑 [ryuk]\n\n${randomQuote()}`;
      api.sendMessage(msg, threadID, (err) => {
        if (!err) { latest.totalReplies++; saveData(latest); }
      }, messageID);
    }, randomDelay());

  } catch (e) {
    console.error("[ryuk] Event ERR:", e);
  }
};
                                      module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const act = (args[0] || "help").toLowerCase();
  const data = loadData();
  const botID = String(api.getCurrentUserID());

  if (act === "help") {
    return send(api,
`👑 ryuk CONTROL PANEL v2.0 👑

╭───「 COMMANDS 」
│
├ 💡 /ryuk help
│   Ipakita lahat ng utos
│
├ 📊 /ryuk status
│   Tingnan katayuan ng bot
│
├ 🚀 /ryuk on
│   I-activate sa GC na ito
│
├ 🛑 /ryuk off
│   Ipatigil sa GC na ito
│
├ 🔒 /ryuk lock
│   I-lock GC + lahat → RYUK POGI ON TOP ✅
│
├ 🛡️ /ryuk spamon
│   I-on anti-spam proteksyon
│
├ 🚫 /ryuk spamoff
│   I-off anti-spam
│
├ 🔥 /ryuk reacton
│   I-on auto-reaction
│
├ 🔕 /ryuk reactoff
│   I-off auto-reaction
│
╰──────────────

⚠️ UNANG-UNA: /ryuk on muna bago /ryuk lock!
🛡️ Anti-Spam: Haharang sa paulit-ulit na mensahe
👑 RYUK POGI ON TOP — WALANG KATULAD`,
      threadID, messageID
    );
  }

  if (act === "status") {
    return send(api,
`👑 ryUK SYSTEM STATUS 👑

🤖 Bot: ${data.active ? "🟢 AKTIBO" : "🔴 NAKATIGIL — /ryuk on muna!"}
🛡️ Anti-Spam: ${data.spamBlock ? "🟢 ON — HINDI SASAGOT SA SPAM" : "🔴 OFF"}
🔒 Nick Lock: 🟢 READY — Ibabalik agad kapag pinalitan
🛡️ GC Name Lock: 🟢 READY — RYUK POGI ON TOP ✅
🎯 Target: RYUK POGI ON TOP ✅
💬 Kabuong Sagot: ${data.totalReplies || 0}`,
      threadID, messageID
    );
  }

  const adminOnly = ["on","off","lock","spamon","spamoff","reacton","reactoff"];
  if (adminOnly.includes(act) && !isAdmin(senderID)) {
    return send(api, "⛔ Admin lang ang puwede 😂", threadID, messageID);
  }

  if (act === "on") {
    data.active = true;
    saveData(data);
    return send(api,
`🚀 ryuk AKTIBO NA SA GC NA ITO! ✅

🟢 Bot: ON na
🛡️ Anti-Spam: ${data.spamBlock ? "ON — Haharang sa spam" : "OFF"}
🔒 Susunod: I-type /ryuk lock para i-lock lahat!
👑 RYUK POGI ON TOP — Handa na!`,
      threadID, messageID
    );
  }

  if (act === "off") {
    data.active = false;
    saveData(data);
    return send(api, "🛑 ryuk NAKATIGIL na dito.", threadID, messageID);
  }

  if (act === "spamon") {
    data.spamBlock = true;
    saveData(data);
    return send(api, "🛡️ Anti-Spam: ON na — hindi sasagot sa paulit-ulit 😂", threadID, messageID);
  }

  if (act === "spamoff") {
    data.spamBlock = false;
    saveData(data);
    return send(api, "🚫 Anti-Spam: OFF na — lahat sasagutin ko 😂", threadID, messageID);
  }

  if (act === "reacton") {
    data.autoReact = true;
    saveData(data);
    return send(api, "🔥 Auto-reaction: ON na", threadID, messageID);
  }

  if (act === "reactoff") {
    data.autoReact = false;
    saveData(data);
    return send(api, "🔕 Auto-reaction: OFF na", threadID, messageID);
  }

  if (act === "lock") {
    if (!data.active) {
      return send(api, "⚠️ I-ON MUNA!\nI-type: /ryuk on 😂", threadID, messageID);
    }

    if (typeof api.sendTypingIndicator === "function") api.sendTypingIndicator(threadID, true);
    api.setTitle(targetGCName, threadID, () => {});

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return send(api,
`❌ HINDI MAKUHA ANG IMPORMASYON NG GC!

• Kulang ng pahintulot ang bot
• Subukan mo ulit mamaya

I-type: /ryuk lock 😂`,
          threadID, messageID
        );
      }

      send(api,
`🔒 NAGLA-LOCK NG LAHAT NG PANGALAN... ⏳

👥 Bilang ng Miyembro: ${info.participantIDs?.length || 0}
⏱️ Bilis: 0.6s bawat isa
❌ HUWAG MUNA MAG-PADALA NG MENSAHE HABANG NAGPROPROSESO!`,
        threadID
      );

      const res = await setAllNicknamesWithDelay(api, threadID, info.participantIDs, targetNickname, botID);
      const failText = res.failed > 0 ? `\n⚠️ Nabigo: ${res.failed} — kulang ng pahintulot o sariling pangalan` : "";

      send(api,
`✅ TAPOS NA! LAHAT NAKA-LOCK NA 👑

🟢 Matagumpay: ${res.success}
⏭️ Nilaktawan (sarili): ${res.skipped}
🔴 Nabigo: ${res.failed}${failText}

🎯 Lahat ng pangalan: RYUK POGI ON TOP ✅
😂 Subukan niyong palitan — IBABALIK KO AGAD!`,
        threadID
      );

      api.setMessageReaction("🥷", messageID, threadID, () => {}, true);
    });
    return;
  }

  send(api, "⚠️ Hindi alam — /ryuk help mo 😂", threadID, messageID);
};
                                        
