const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — NICK LOCK + LINES ✅
// ADMIN IDs: 61594055835097, 61593892603402
// 61594325727109, 61594022290817
// TARGET: RYUK BOSS ON TOP ✅
// ✅ AUTO-BALIK KAPAG PALITAN | GC + NICK
// ✅ PANG-ASAR NA LINES 😂
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const targetNickname = "RYUK BOSS ON TOP";
const targetGCName = "RYUK BOSS ON TOP";
const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: false,
  autoReact: true,
  delay: 2500,
  totalReplies: 0
};

// ==========================================
// MGA LINYA — PANG-ASAR 😂
// ==========================================
const LOCK_LINES = [
  "😂 Sinubukan mo pa? Sayang oras, babalik pa rin ako!",
  "🤣 Ang bagal mo — bago ka matapos, ibinalik ko na!",
  "😏 Hayaan mo na — wala kang laban, tanggapin mo na 😂",
  "😂 Cute naman magpalit — pero hindi gagana sayo!",
  "🤣 Pagod ka na? Ako hindi — RYUK BOSS pa rin mananalo!",
  "😂 Sige lang, magpalit ka — ibabalik ko ulit agad!",
  "😏 Sayang effort — RYUK BOSS ON TOP lang talaga 😂",
  "😂 Paulit-ulit ka na — hindi ka pa rin natututo!",
  "🤣 Ang hirap mo pa — hindi naman mababago 😂",
  "😏 Subukan mo pang ilihis — babalik at babalik ako!",
  "😂 Parang sira na — paulit-ulit na lang 😂",
  "🤣 Hinga ka muna — hindi talaga gagana sayo 😂",
  "😏 Tanggapin mo na — ikaw ang talo 😂",
  "😂 Hinto mo na — hindi naman gagana 😂",
  "🤣 Paulit-ulit, parehas lang — RYUK BOSS PA RIN 😂",
  "😏 Ako ang batas dito — RYUK BOSS ON TOP 😂",
  "😂 Sayang oras mo — alam mo na sagot 😂",
  "🤣 Hinga ka malalim — tanggapin mo na 😂",
  "😏 Wala nang ibang — RYUK LANG 😂",
  "😂 Kahit saan — RYUK BOSS ON TOP 😂",
  "🤣 Ang kulit mo talaga — pero hindi pa rin 😂",
  "😏 Tapos na ang laban — RYUK ANG PANALO 😂",
  "😂 Hindi na mababago — nakatatak na 😂",
  "🤣 Paulit-ulit ka na — wala nang bago 😂",
  "😏 Araw-araw, gabi-gabi — RYUK BOSS PA RIN 😂",
  "😂 Subukan mo — mas lalo kong ibabalik 😂",
  "🤣 Alam mo na — bakit mo pa tinatanong? 😂",
  "😏 RYUK BOSS ON TOP — HANGGANG DULO 😂",
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
  "😂 RYUK BOSS ON TOP — HANGGANG DULO 😂",
  "🤣 Subukan mo — mas lalo kong ibabalik 😂",
  "😏 Alam mo na — bakit mo pa tinatanong? 😂",
  "😂 HANGGANG DULO — RYUK BOSS ON TOP 😂",
  "🤣 Wala nang bago — RYUK PA RIN 😂",
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
  "🤣 RYUK BOSS ON TOP — HANGGANG DULO 😂",
  "😏 Tapos na — RYUK ANG PANALO 😂",
  "😂 Aminin mo na — talo ka na 😂",
  "🤣 Wala nang laban — RYUK PA RIN 😂",
  "😏 Subukan mo pang tumakas — mahahabol kita 😂",
  "😂 Ako ang una — ikaw ang huli 😂",
  "🤣 RYUK BOSS ON TOP — WALANG KATULAD 😂",
  "😏 Hindi na mababago — sigurado na 😂",
  "😂 Paulit-ulit, walang pagod — RYUK PA RIN 😂",
  "🤣 Ako ang batas dito — alam mo yan 😂",
  "😏 Wala kang magagawa — nasa akin ang kapangyarihan 😂",
  "😂 Talo ka na — aminin mo na 😂",
  "🤣 RYUK BOSS ON TOP — HANGGANG DULO 😂",
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
  "🤣 RYUK BOSS ON TOP — WALANG KATULAD 😂",
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
  "😂 RYUK BOSS ON TOP — WALANG KATULAD 😂",
  "🤣 Subukan mo ulit — parehas lang 😂",
  "😏 Sige lang — mas lalo kong ibabalik 😂",
  "😂 Hindi ka ba napapagod? Ako hindi 😂",
  "🤣 Walang makakatalo sa RYUK 😂",
  "😏 Talo ka na — tapos na 😂",
  "😂 Aminin mo na — talo ka na 😂",
  "🤣 RYUK BOSS ON TOP — HANGGANG DULO 😂",
  "😏 Wala nang laban — RYUK ANG PANALO 😂",
  "😂 Ang galing ko no? 😂",
  "🤣 Tanggapin mo na ang katotohanan — RYUK NAMIN 😂",
  "😏 Ikaw lang ang nagpapagod — ako hindi 😂",
  "😂 Walang tatalo sa RYUK 😂",
  "🤣 Kahit kailan — hindi mo mapapalitan 😂",
  "😏 Paulit-ulit na lang tayo — alam mo na sagot 😂",
  "😂 Ang bilis ko — bago ka matapos, tapos na ako 😂",
  "🤣 RYUK BOSS ON TOP — WALANG KATULAD 😂",
  "😏 Subukan mo — mas lalo kong ibabalik 😂",
  "😂 Alam mo na — bakit mo pa tinatanong? 😂",
  "🤣 HANGGANG DULO — RYUK BOSS ON TOP 😂"
];

let lockIndex = 0;
function getNextLockLine() {
  const line = LOCK_LINES[lockIndex];
  lockIndex = (lockIndex + 1) % LOCK_LINES.length;
  return line;
}

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
    }
  } catch (e) { console.error("[ryuk] Load err:", e.message); }
  return { ...DEFAULT_DATA };
}

function saveData(d) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); return true; }
  catch (e) { console.error("[ryuk] Save err:", e.message); return false; }
}

function send(api, msg, tid, mid = null) {
  api.sendMessage(msg, tid, () => {}, mid);
  }
  async function setAllNicknamesWithDelay(api, threadID, participantIDs, name) {
  let success = 0, failed = 0;
  const botID = String(api.getCurrentUserID());

  for (const uid of participantIDs) {
    if (String(uid) === botID) continue;
    await new Promise(resolve => setTimeout(resolve, 600));
    api.changeNickname(name, threadID, uid, (err) => {
      if (err) failed++;
      else success++;
    });
  }
  return { success, failed };
}

module.exports.config = {
  name: "ryuk",
  version: "2.2.0",
  hasPermission: 0,
  credits: "ryuk — NICK LOCK + LINES ✅",
  description: "RYUK BOSS ON TOP | Auto-Restore + Pang-asar Lines 😂",
  usePrefix: true,
  cooldowns: 3
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, logMessageType, logMessageData, messageID } = event;
    if (!threadID) return;

    const botID = String(api.getCurrentUserID());
    const threadStr = String(threadID);

    // ======================================
    // AUTO-BALIK KAPAG PALITAN NICKNAME + LINE 😂
    // ======================================
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;

      if (String(targetUserID) === botID) return;

      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, () => {
          send(api, "🛡️ Ibinalik agad! " + getNextLockLine(), threadID);
        });
      }
      return;
    }

    // ======================================
    // AUTO-BALIK KAPAG PALITAN GC NAME + LINE 😂
    // ======================================
    if (logMessageType === "log:thread-name") {
      api.setTitle(targetGCName, threadID, () => {
        send(api, "⚡ Sinubukan mong palitan! " + getNextLockLine(), threadID);
      });
      return;
    }

  } catch (e) {
    console.error("[ryuk] Event ERR:", e);
  }
};
    module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const threadStr = String(threadID);
  const act = (args[0] || "help").toLowerCase();
  const data = loadData();

  if (act === "help") {
    return send(api,
`👑 ryuk CONTROL PANEL 👑

/ryuk on    → I-activate sa GC na ito
/ryuk off   → I-deactivate
/ryuk lock  → I-set lahat → RYUK BOSS ON TOP ✅

😂 Kapag may magpalit, IBABALIK KO AGAD at pang-aasarin ko pa!`,
      threadID, messageID
    );
  }

  if (!isAdmin(senderID)) {
    return send(api, "⛔ Admin lang ang puwede 😂", threadID, messageID);
  }

  if (act === "on") {
    data.active = true;
    saveData(data);
    return send(api,
`🚀 ryuk ON na! ✅

🔒 Handa na magbantay — kapag may magpalit, IBABALIK KO AGAD 😂
I-type: /ryuk lock para i-lock lahat ng pangalan → RYUK BOSS ON TOP`,
      threadID, messageID
    );
  }

  if (act === "off") {
    data.active = false;
    saveData(data);
    return send(api, "🛑 ryuk OFF na — hindi na magbabantay", threadID, messageID);
  }

  if (act === "lock") {
    if (!data.active) {
      return send(api, "⚠️ I-type muna: /ryuk on", threadID, messageID);
    }

    // api typing indicator
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    api.setTitle(targetGCName, threadID, () => {});

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.setMessageReaction("😋", messageID, threadStr, () => {}, true);
      }

      send(api, "🔒 NAGLA-LOCK NG LAHAT... Hintay lang ⏳", threadID);

      const participantIDs = info.participantIDs || [];
      const result = await setAllNicknamesWithDelay(api, threadID, participantIDs, targetNickname);

      api.sendMessage(
`✅ TAPOS NA! LAHAT NAKA-LOCK NA 👑

🟢 Matagumpay: ${result.success}
🔴 Nabigo: ${result.failed}

🎯 Lahat: RYUK BOSS ON TOP ✅
😂 Subukan niyong palitan — IBABALIK KO AGAD AT PANG-AASARIN KO PA KAYO!`,
        threadID,
        () => {},
        messageID
      );

      return api.setMessageReaction("🥷", messageID, threadStr, () => {}, true);
    });
    return;
  }
};
                
