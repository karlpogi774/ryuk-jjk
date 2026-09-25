const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — INFINITY + GC LOCK V1.0
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// TARGET NAME: RYUK POGI ON TOP ✅
// SELF-REACT 😂 ADDED
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const targetNickname = "RYUK POGI ON TOP";
const targetGCName = "RYUK POGI ON TOP";

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
  "✨ Pangalan na sagrado — RYUK POGI ON TOP, walang iba!"
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

const RYUK_QUOTES = [
  "Sa buong langit at lupa, RYUK POGI ON TOP lang ang hari! 👑",
  "Walang makakatalo — dito, RYUK ang nasusunod! ⚡",
  "Kalmado lang. RYUK POGI ang kausap mo. 😎",
  "Hindi nagyayabang — sinasabi ko lang ang katotohanan! 💪",
  "Subukan mo lang palitan — ibabalik ko agad! 🛡️",
  "RYUK POGI ON TOP — walang duda, walang katulad! 🔥",
  "Mas mabagal ka pa sa bilis ko. ⚡",
  "Tingin ko sa lahat — alam kong RYUK POGI lang ang bida! 👁️",
  "Relax ka lang. Nandito na ang pinakamalakas at pinakamaganda! 😏",
  "Walang challenge na hindi kayang harapin ni RYUK! 🚀"
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

// ✅ SEND HELPER + SELF-REACT 😂
function send(api, message, threadID, messageID = null) {
  api.sendMessage(message, threadID, (err, info) => {
    if (!err && info && info.messageID) {
      api.setMessageReaction("😂", info.messageID, () => {}, true);
    }
  }, messageID);
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
  version: "1.1.0",
  hasPermission: 0,
  credits: "ryuk — GC LOCK + NICK LOCK + SELF-REACT 😂",
  description: "RYUK POGI ON TOP | Auto-reply + GC Lock + Nick Lock + Self-React",
  usePrefix: true,
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    // ✅ AUTO-RESTORE NICK + SELF-REACT 😂
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;
      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, () => {});
        send(api, "🛡️ Ibinalik agad! " + getNextLockLine(), threadID);
      }
      return;
    }

    // ✅ AUTO-RESTORE GC NAME + SELF-REACT 😂
    if (logMessageType === "log:thread-name") {
      api.setTitle(targetGCName, threadID, () => {});
      send(api, "⚡ Sinubukan mong palitan! " + getNextLockLine(), threadID);
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
      // ✅ SELF-REACT 😂 sa sariling reply
      send(api, reply, threadID, messageID);
      latestData.totalReplies = (latestData.totalReplies || 0) + 1;
      saveSystemData(latestData);
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
│   I-LOCK GC NAME + LAHAT NG NICK → RYUK POGI ON TOP
│
╰──────────────

😂 Self-React: ON ✅
🔐 Admin access: 4 IDs registered ✅
👑 RYUK POGI ON TOP — WALANG KATULAD`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`👑 ryuk SYSTEM STATUS 👑

╭───「 SYSTEM 」
│
├ 🤖 Auto Reply:
│   ${data.active ? "🟢 ONLINE" : "🔴 OFFLINE"}
│
├ ⏱️ Reply Delay:
│   ${data.delay} ms
│
├ 🔥 Auto Reaction:
│   ${data.autoReact ? "🟢 ENABLED" : "🔴 DISABLED"}
│
├ 😂 Self-React:
│   🟢 ENABLED ✅
│
├ 💬 Total Replies:
│   ${data.totalReplies || 0}
│
├ 🔒 GC Lock Target:
│   RYUK POGI ON TOP ✅
│
├ 🔐 Admin Count:
│   ${ADMIN_IDS.length} registered ✅
│
╰──────────────

👑 ryuk V1.1 — MAKUNAT 😂`,
      threadID, messageID
    );
  }

  const adminActions = ["on", "off", "reacton", "reactoff", "lock"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return send(api, "⛔ Access denied. Admin lang ang puwede. 😂", threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`🚀 ryuk ACTIVATED!

👑 Auto-reply: ON
😂 Self-React: ON
⚡ RYUK POGI ON TOP mode!`,
      threadID, messageID
    );
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "🛑 ryuk DEACTIVATED!\n\nAuto-reply ay naka-off na. 😂", threadID, messageID);
  }

  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "🔥 Auto-reaction activated!\n😂 Self-React: ON", threadID, messageID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "🔕 Auto-reaction disabled.\n😂 Self-React: ON", threadID, messageID);
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
      
      send(api, getNextLockLine(), threadID);
      return api.setMessageReaction("🥷", messageID, threadID, () => {}, true);
    });
    return;
  }

  return send(api, "⚠️ Unknown command.\n\nI-type ang /ryuk help para makita. 😂", threadID, messageID);
};
                  
