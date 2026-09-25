const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — SELF-REACT NINJA 🥷 + PANG-ASAR LINES 😂
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

// ✅ MAS MARAMI — PANG-ASAR 😂
const LOCK_LINES = [
  "👑 RYUK POGI ON TOP — walang makakatalo dito!",
  "⚡ GC LOCKED — pangalan ay hindi mapapalitan ng kahit sino!",
  "🔥 RYUK POGI — ang tunay na hari sa grupong ito!",
  "🛡️ LAKAS AT GWAPO — RYUK POGI ON TOP, walang duda!",
  "✨ Lahat ay RYUK POGI ON TOP — walang exempted dito!",
  "💪 Hindi mababago, hindi matitinag — RYUK POGI LANG!",
  "🥷 GC PROTECTED — subukan mo, ibabalik agad!",
  "👑 RYUK POGI ON TOP — pangalan na tatak sa isip niyo!",
  "⚡ Walang makakabago — dito, RYUK ang nasusunod!",
  "🔥 Naka-lock nang mahigpit — RYUK POGI ON TOP habang-buhay!",
  "💎 Pinakamaganda, pinakamakunat — RYUK POGI LANG YAN!",
  "🚀 RYUK POGI ON TOP — taas noo, walang aatras!",
  "🛡️ Bantay 24/7 — pag binago, ibabalik agad sayo!",
  "👑 Dito sa GC na ito — RYUK POGI lang ang bida!",
  "✨ Pangalan na sagrado — RYUK POGI ON TOP, walang iba!",
  "😂 Sinubukan mo pa — wala kang laban kay RYUK!",
  "🤣 Ang bagal mo — bago ka pa magpalit, ibinalik ko na! 😂",
  "😏 Hayaan mo na — hindi mo talaga kaya, tanggapin mo na 😂",
  "💅 Susubukan mo pa? Cute! Pero RYUK pa rin mananalo 😂",
  "😎 Pagod ka na? Ako hindi! RYUK POGI ON TOP lang 😂"
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

// ✅ PANG-ASAR QUOTES 😂
const RYUK_QUOTES = [
  "Sa buong langit at lupa, RYUK POGI ON TOP lang ang hari! 👑",
  "Walang makakatalo — dito, RYUK ang nasusunod! ⚡",
  "Kalmado lang. RYUK POGI ang kausap mo. 😎",
  "Hindi nagyayabang — sinasabi ko lang ang katotohanan! 💪",
  "Subukan mo lang palitan — ibabalik ko agad! 🛡️",
  "RYUK POGI ON TOP — walang duda, walang katulad! 🔥",
  "Mas mabagal ka pa sa bilis ko. 😂",
  "Tingin ko sa lahat — alam kong RYUK POGI lang ang bida! 👁️",
  "Relax ka lang. Nandito na ang pinakamalakas at pinakamaganda! 😏",
  "Walang challenge na hindi kayang harapin ni RYUK! 🚀",
  "😂 Try mo ulit — parehas lang ang mangyayari, babalik pa rin ako!",
  "🤣 Kawawa ka naman — wala talagang laban sa RYUK!",
  "😏 Tanggapin mo na — RYUK POGI ON TOP habang-buhay! 😂",
  "💅 Cute naman magpalit — pero hindi gagana sayo 😂",
  "😎 Pagod ka na? Ako hindi! Lagi lang RYUK POGI ON TOP! 😂"
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

// ✅ SEND + SELF-REACT 🥷
function sendWithNinja(api, message, threadID, replyToID = null) {
  return new Promise((resolve) => {
    api.sendMessage(message, threadID, (err, info) => {
      if (!err && info && info.messageID) {
        api.setMessageReaction("🥷", info.messageID, () => {}, true);
      }
      resolve(info);
    }, replyToID);
  });
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
  version: "2.4.0",
  hasPermission: 0,
  credits: "ryuk — SELF-REACT 🥷 + PANG-ASAR 😂",
  description: "RYUK POGI ON TOP | Self-React Ninja + Pang-asar Lines",
  usePrefix: true,
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const threadStr = String(threadID);

    // ✅ AUTO-RESTORE NICK + SELF-REACT 🥷
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;
      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, () => {});
        sendWithNinja(api, "🛡️ Ibinalik agad! " + getNextLockLine(), threadID);
      }
      return;
    }

    // ✅ AUTO-RESTORE GC NAME + SELF-REACT 🥷
    if (logMessageType === "log:thread-name") {
      api.setTitle(targetGCName, threadID, () => {});
      sendWithNinja(api, "⚡ Sinubukan mong palitan! " + getNextLockLine(), threadID);
      return;
    }

    if (!senderID || !messageID) return;
    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);
    if (sender === botID || isAdmin(sender)) return;

    const data = loadSystemData();
    if (!data.active) return;
    if (!rememberMessage(String(messageID))) return;

    // Auto-react sa iba 🔥
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
      // ✅ SELF-REACT 🥷 sa sariling reply
      sendWithNinja(api, reply, threadID, messageID).then((info) => {
        if (info) {
          latestData.totalReplies = (latestData.totalReplies || 0) + 1;
          saveSystemData(latestData);
        }
      });
    }, delay);

  } catch (error) {
    console.error("[ryuk] Error:", error);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const threadStr = String(threadID);
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();

  if (action === "help") {
    return sendWithNinja(api,
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
│   I-LOCK GC + NICK → RYUK POGI ON TOP
│
╰──────────────

🥷 Self-React: ON ✅
😂 Pang-asar Lines: ON ✅
👑 RYUK POGI ON TOP — WALANG KATULAD`,
      threadID
    );
  }

  if (action === "status") {
    return sendWithNinja(api,
`👑 ryuk SYSTEM STATUS 👑

🤖 Auto Reply: ${data.active ? "🟢 ONLINE" : "🔴 OFFLINE"}
🥷 Self-React: 🟢 ON
🔥 Auto React: ${data.autoReact ? "🟢 ON" : "🔴 OFF"}
⏱️ Delay: ${data.delay} ms
🎯 Target: RYUK POGI ON TOP ✅
💬 Total Replies: ${data.totalReplies || 0}
😂 Pang-asar: ON ✅`,
      threadID
    );
  }

  const adminActions = ["on", "off", "reacton", "reactoff", "lock"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return sendWithNinja(api, "⛔ Access denied. Admin lang ang puwede. 😂", threadID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return sendWithNinja(api, "🚀 ryuk ACTIVATED!\n\n👑 RYUK POGI ON TOP — Handa na mang-asar 😂", threadID);
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return sendWithNinja(api, "🛑 ryuk DEACTIVATED.\n\nPahinga muna, babalik ako 😂", threadID);
  }

  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return sendWithNinja(api, "🔥 Auto-reaction ON — 🔥 sa iba, 🥷 sa sarili!", threadID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return sendWithNinja(api, "🔕 Auto-reaction OFF.", threadID);
  }

  // ✅ LOCK GC + ALL NICKNAMES
  if (action === "lock") {
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    api.setTitle(targetGCName, threadID, () => {});

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.setMessageReaction("😋", messageID, threadStr, () => {}, true);
      }
      const participantIDs = info.participantIDs || [];
      setAllNicknamesWithDelay(api, threadID, participantIDs, targetNickname);
      
      sendWithNinja(api, getNextLockLine(), threadID);
      return api.setMessageReaction("🥷", messageID, threadStr, () => {}, true);
    });
    return;
  }

  return sendWithNinja(api, "⚠️ Unknown command.\n\nI-type ang /ryuk help para makita 😂", threadID);
};
  
