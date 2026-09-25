const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — PANG-ASAR LINES 😂
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// TARGET NAME: RYUK POGI ON TOP ✅
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const targetNickname = "RYUK POGI ON TOP";
const targetGCName = "RYUK POGI ON TOP";

// ✅ PANG-ASAR NA LINES 😂 — MAANING SILA
const LOCK_LINES = [
  "😂 Sinubukan mo pa? Sayang oras, babalik pa rin ako!",
  "🤣 Ang bagal mo — bago ka matapos, ibinalik ko na!",
  "😏 Hayaan mo na — wala kang laban, tanggapin mo na 😂",
  "😂 Cute naman magpalit — pero hindi gagana sayo!",
  "🤣 Pagod ka na? Ako hindi — RYUK pa rin mananalo!",
  "😂 Try mo ulit — parehas lang, babalik pa rin!",
  "😏 Kawawa ka naman — pilit pa, ayaw talaga 😂",
  "😂 Nakakapagod ka — paulit-ulit ka naman!",
  "🤣 Sige lang, magpalit ka — ako may oras sayo 😂",
  "😂 Tingnan natin kung hanggang kailan ka makakatagal!",
  "😏 Sayang effort — RYUK POGI ON TOP habang-buhay 😂",
  "😂 Ang sipag mo naman — pero wala pa rin 😂",
  "🤣 Susubukan mo pa? Nakakaawa naman 😂",
  "😂 Hinga ka muna — hindi talaga mababago 😂",
  "😏 Talo ka na agad — hindi mo mapapalitan ito 😂"
];

let lockLineIndex = 0;
function getNextLockLine() {
  const line = LOCK_LINES[lockLineIndex];
  lockLineIndex = (lockLineIndex + 1) % LOCK_LINES.length;
  return line;
}

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  totalReplies: 0
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN_MESSAGES = 5000;

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

// ✅ PANG-ASAR QUOTES 😂 — MAANING SILA
const RYUK_QUOTES = [
  "😂 Sinubukan mo talaga? Wala kang laban sakin!",
  "🤣 Ang bagal mo — tapos ka na bago ka pa magsimula!",
  "😏 Tanggapin mo na — RYUK POGI ON TOP lang talaga 😂",
  "😂 Sayang lakas — hindi mo mababago ito!",
  "🤣 Cute naman manalo sa isip — hindi totoo 😂",
  "😂 Paulit-ulit ka na — hindi ka pa rin natututo!",
  "😏 Nakakaawa naman — pilit pa rin 😂",
  "😂 Hinga ka muna — hindi talaga gagana sayo!",
  "🤣 Sige lang — magpalit ka, ako ibabalik ko 😂",
  "😂 Talo ka na — simula pa lang, talo ka na 😂"
];

function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (error) {
    console.error("[ryuk] Data load error:", error.message);
  }
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[ryuk] Data save error:", error.message);
    return false;
  }
}

function randomQuote() {
  const index = Math.floor(Math.random() * RYUK_QUOTES.length);
  return RYUK_QUOTES[index];
}

function send(api, message, threadID, messageID) {
  return api.sendMessage(message, threadID, () => {}, messageID);
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

function setAllNicknamesWithDelay(api, threadID, members, name) {
  for (const uid of members) {
    api.changeNickname(name, threadID, uid, () => {});
  }
}

module.exports.config = {
  name: "ryuk",
  version: "1.2.0",
  hasPermission: 0,
  credits: "ryuk — PANG-ASAR 😂",
  description: "RYUK POGI ON TOP | Pang-asar Lines 😂",
  usePrefix: true,
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    // ✅ AUTO-RESTORE NICK — PANG-ASAR 😂
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;
      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, () => {});
        api.sendMessage(getNextLockLine(), threadID);
      }
      return;
    }

    // ✅ AUTO-RESTORE GC NAME — PANG-ASAR 😂
    if (logMessageType === "log:thread-name") {
      api.setTitle(targetGCName, threadID, () => {});
      api.sendMessage(getNextLockLine(), threadID);
      return;
    }

    if (!senderID || !messageID) return;
    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);
    if (sender === botID || isAdmin(sender)) return;

    const data = loadSystemData();
    if (!data.active) return;
    if (!rememberMessage(String(messageID))) return;

    if (data.autoReact) {
      try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
    }

    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const lastTime = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - lastTime < 3000) return;
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
│   I-activate ang auto-reply
│
├ 🛑 /ryuk off
│   I-disable ang auto-reply
│
├ 😆 /ryuk reacton
│   I-on ang auto-reaction
│
├ 🔕 /ryuk reactoff
│   I-off ang auto-reaction
│
├ 🔒 /ryuk lock
│   I-LOCK GC + NICK → RYUK POGI ON TOP 😂
│
╰──────────────

😂 Pang-asar: ON ✅
👑 RYUK POGI ON TOP — WALANG KATULAD`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`👑 ryuk SYSTEM STATUS 👑

🤖 Auto Reply: ${data.active ? "🟢 ONLINE" : "🔴 OFFLINE"}
😂 Pang-asar: 🟢 ON ✅
🔥 Auto React: ${data.autoReact ? "🟢 ON" : "🔴 OFF"}
⏱️ Delay: ${data.delay} ms
🎯 Target: RYUK POGI ON TOP ✅
💬 Total Replies: ${data.totalReplies || 0}`,
      threadID, messageID
    );
  }

  const adminActions = ["on", "off", "reacton", "reactoff", "lock"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return send(api, "⛔ Admin lang — sayang pag-asa mo 😂", threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api, "🚀 ryuk ACTIVATED!\n😂 Handa na mang-asar!", threadID, messageID);
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "🛑 ryuk DEACTIVATED.\n😂 Pahinga muna, babalik ako!", threadID, messageID);
  }

  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "🔥 Auto-reaction ON — masakit sa ulo 😂", threadID, messageID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "🔕 Auto-reaction OFF — pero pang-asar pa rin 😂", threadID, messageID);
  }

  if (action === "lock") {
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    api.setTitle(targetGCName, threadID, () => {});

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.setMessageReaction("😋", messageID, threadID, () => {}, true);
      }
      const participantIDs = info.participantIDs || [];
      setAllNicknamesWithDelay(api, threadID, participantIDs, targetNickname);
      
      api.sendMessage(getNextLockLine(), threadID);
      return api.setMessageReaction("🥷", messageID, threadID, () => {}, true);
    });
    return;
  }

  return send(api, "⚠️ Hindi alam yan — /ryuk help mo 😂", threadID, messageID);
};
    
