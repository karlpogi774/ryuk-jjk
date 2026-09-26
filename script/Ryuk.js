const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — NICK LOCK FINAL V1.8 ✅
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// TARGET NAME: RYUK POGI ON TOP ✅
// ✅ NICKNAME WORKING | GC NAME WORKING | ANTI-SPAM
// ✅ SKIP BOT OWN NAME | ERROR DETAILS | STABLE DELAY
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
  delay: 2000,
  totalReplies: 0
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN_MESSAGES = 5000;
const RECENT_MESSAGES = new Map();

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
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

let lockLineIndex = 0;
function getNextLockLine() {
  const line = LOCK_LINES[lockLineIndex];
  lockLineIndex = (lockLineIndex + 1) % LOCK_LINES.length;
  return line;
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
  "😏 Tapos na ang laro — RYUK ANG PANALO 😂",
  "😂 Hindi ka makakaalis dito — RYUK PA RIN 😂",
  "🤣 Wala kang magagawa — nasa akin ang kapangyarihan 😂",
  "😏 Ikaw ang talo — aminin mo na 😂",
  "😂 Hinto mo na — hindi naman gagana 😂",
  "🤣 Paulit-ulit, parehas lang — RYUK PA RIN 😂",
  "😏 Ako ang batas dito — RYUK POGI ON TOP 😂",
  "😂 Magpalit ka nang magpalit — RYUK PA RIN 😂",
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
  function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (error) {
    console.error("[ryuk] Load error:", error.message);
  }
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[ryuk] Save error:", error.message);
    return false;
  }
}

function randomQuote() {
  const index = Math.floor(Math.random() * RYUK_QUOTES.length);
  return RYUK_QUOTES[index];
}

function send(api, message, threadID, messageID = null) {
  api.sendMessage(message, threadID, () => {}, messageID);
}

function rememberMessage(messageID) {
  if (SEEN_MESSAGES.has(messageID)) return false;
  SEEN_MESSAGES.add(messageID);
  if (SEEN_MESSAGES.size > MAX_SEEN_MESSAGES) {
    const oldest = SEEN_MESSAGES.values().next().value;
    SEEN_MESSAGES.delete(oldest);
  }
  return true;
}

function isSpamMessage(threadID, text) {
  const key = `${threadID}:${text.trim().toLowerCase()}`;
  const now = Date.now();
  const lastTime = RECENT_MESSAGES.get(key) || 0;
  if (now - lastTime < 8000) return true;
  RECENT_MESSAGES.set(key, now);
  return false;
}

async function setAllNicknamesWithDelay(api, threadID, members, name, botID) {
  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const uid of members) {
    if (String(uid) === String(botID)) {
      skipped++;
      continue;
    }

    await new Promise(resolve => setTimeout(resolve, 600));

    api.changeNickname(name, threadID, uid, (err) => {
      if (err) {
        failed++;
        console.error(`[ryuk] ❌ Nabigo ${uid}:`, err?.message || err);
      } else {
        success++;
      }
    });
  }

  return { success, failed, skipped };
              }
      module.exports.config = {
  name: "ryuk",
  version: "1.8.0",
  hasPermission: 0,
  credits: "ryuk — NICK LOCK FINAL ✅",
  description: "RYUK POGI ON TOP | Working Nick + GC Name",
  usePrefix: true,
  cooldowns: 3
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData, body } = event;
    if (!threadID) return;

    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);

    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;

      if (String(targetUserID) === String(botID)) return;
      
      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, (err) => {
          if (!err) {
            send(api, "🛡️ Ibinalik agad! " + getNextLockLine(), threadID);
          }
        });
      }
      return;
    }

    if (logMessageType === "log:thread-name") {
      api.setTitle(targetGCName, threadID, (err) => {
        if (!err) {
          send(api, "⚡ Sinubukan mong palitan! " + getNextLockLine(), threadID);
        }
      });
      return;
    }

    if (!senderID || !messageID) return;
    if (sender === botID || isAdmin(sender)) return;

    const data = loadSystemData();
    if (!data.active) return;
    if (!rememberMessage(String(messageID))) return;

    if (body && isSpamMessage(threadID, body)) return;

    if (data.autoReact) {
      try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
    }

    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const lastTime = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - lastTime < 3500) return;
    USER_COOLDOWN.set(cooldownKey, now);

    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    const delay = Math.max(0, Math.min(Number(data.delay) || 2000, 10000));

    setTimeout(() => {
      const latestData = loadSystemData();
      if (!latestData.active) return;
      const reply = `👑 [ryuk]\n\n${randomQuote()}`;
      api.sendMessage(reply, threadID, (error) => {
        if (!error) {
          latestData.totalReplies = (latestData.totalReplies || 0) + 1;
          saveSystemData(latestData);
        }
      }, messageID);
    }, delay);

  } catch (error) {
    console.error("[ryuk] Event error:", error);
  }
};
      module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();
  const botID = String(api.getCurrentUserID());

  if (action === "help") {
    return send(api,
`👑 ryuk CONTROL PANEL 👑

╭───「 COMMANDS 」
│
├ 💡 /ryuk help
│   Ipakita ang lahat ng commands
│
├ 📊 /ryuk status
│   Tingnan ang bot status
│
├ 🚀 /ryuk on
│   I-activate sa GC na ito
│
├ 🛑 /ryuk off
│   I-disable sa GC na ito
│
├ 😆 /ryuk reacton
│   I-on auto-reaction
│
├ 🔕 /ryuk reactoff
│   I-off auto-reaction
│
├ 🔒 /ryuk lock
│   I-LOCK GC + LAHAT NG NICK → RYUK POGI ON TOP ✅
│
╰──────────────

⚠️ UNANG-UNA: /ryuk on muna bago /ryuk lock!
👑 RYUK POGI ON TOP — WALANG KATULAD`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`👑 ryuk SYSTEM STATUS 👑

🤖 Bot: ${data.active ? "🟢 ON" : "🔴 OFF — I-ON MUNA!"}
🔒 Nick Lock: 🟢 READY ✅
🛡️ GC Name Lock: 🟢 READY ✅
🎯 Target: RYUK POGI ON TOP ✅
💬 Total Replies: ${data.totalReplies || 0}`,
      threadID, messageID
    );
  }

  const adminActions = ["on", "off", "reacton", "reactoff", "lock"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return send(api, "⛔ Admin lang ang puwede 😂", threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`🚀 ryuk ACTIVATED SA GC NA ITO! ✅

🟢 Bot: ON na
🔒 Pwede na: /ryuk lock
👑 RYUK POGI ON TOP — Handa na!`,
      threadID, messageID
    );
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "🛑 ryuk DEACTIVATED dito.", threadID, messageID);
  }

  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "🔥 Auto-reaction ON", threadID, messageID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "🔕 Auto-reaction OFF", threadID, messageID);
  }

  if (action === "lock") {
    if (!data.active) {
      return send(api, "⚠️ I-ON MUNA!\nI-type: /ryuk on 😂", threadID, messageID);
    }

    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    api.setTitle(targetGCName, threadID, () => {});

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return send(api, 
`❌ HINDI MAKUHA ANG GC INFO!

Mga posibleng dahilan:
• Kulang ng pahintulot ang bot sa GC
• Subukan mo ulit mamaya

I-type: /ryuk lock 😂`,
          threadID, messageID
        );
      }

      const memberCount = info.participantIDs?.length || 0;

      send(api,
`🔒 NAGLA-LOCK SA GC NA ITO... ⏳

👥 Miyembro: ${memberCount}
⏱️ Bilis: 0.6s bawat isa
Huwag magpadala ng mensahe habang nagproproseso!`,
        threadID
      );

      const result = await setAllNicknamesWithDelay(api, threadID, info.participantIDs, targetNickname, botID);

      let failedText = result.failed > 0 
        ? `\n⚠️ Nabigo: ${result.failed} — kulang ng pahintulot o sariling pangalan` 
        : "";

      send(api,
`✅ TAPOS NA SA GC NA ITO! 👑

🟢 Matagumpay: ${result.success}
⏭️ Nilaktawan (sarili): ${result.skipped}
🔴 Nabigo: ${result.failed}${failedText}

🎯 Lahat ay: RYUK POGI ON TOP ✅
😂 Subukan niyong palitan — ibabalik ko agad!`,
        threadID
      );

      return api.setMessageReaction("🥷", messageID, threadID, () => {}, true);
    });
    return;
  }

  return send(api, "⚠️ Hindi alam — /ryuk help mo 😂", threadID, messageID);
};
      
