const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — LOCK GC + NICK V1.2
// 👑 ryuk — INFINITY + GC LOCK V1.0
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// TARGET NAME: RYUK POGI ON TOP ✅
// BOT NAME: ryuk ✅
// ==========================================

const ADMIN_IDS = new Set([
const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);
];

// ✅ GC & NICK LOCK TARGET
const targetNickname = "RYUK POGI ON TOP";
const targetGCName = "RYUK POGI ON TOP";

// ✅ MGA LINES — HINDI PAULIT-ULIT 😎
const LINES = [
const LOCK_LINES = [
  "👑 RYUK POGI ON TOP — walang makakatalo dito!",
  "⚡ GC LOCKED — pangalan ay hindi mapapalitan ng kahit sino!",
  "🔥 RYUK POGI — ang tunay na hari sa grupong ito!",
@@ -37,88 +37,325 @@ const LINES = [
  "✨ Pangalan na sagrado — RYUK POGI ON TOP, walang iba!"
];

let lineIndex = 0;
function getNextLine() {
  const line = LINES[lineIndex];
  lineIndex = (lineIndex + 1) % LINES.length;
let lockLineIndex = 0;
function getNextLockLine() {
  const line = LOCK_LINES[lockLineIndex];
  lockLineIndex = (lockLineIndex + 1) % LOCK_LINES.length;
  return line;
}

const delay = ms => new Promise(res => setTimeout(res, ms));
const DATA_FILE = path.join(__dirname, "ryuk_data.json");

function setAllNicknamesWithDelay(api, threadID, members, name) {
  for (const uid of members) {
    api.changeNickname(name, threadID, uid, () => {});
const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  totalReplies: 0
};
const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN_MESSAGES = 5000;
// ==========================================
// 🔐 ADMIN CHECK
// ==========================================
function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}
// ==========================================
// QUOTES
// ==========================================
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
// ==========================================
// DATA MANAGEMENT
// ==========================================
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

function getBotCache(api) {
  if (!global._botCache) global._botCache = {};
  return global._botCache;
function saveSystemData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[ryuk] Data save error:", error.message);
    return false;
  }
}

module.exports = {
  config: {
    name: "ryuk",          // ✅ BOT NAME: ryuk (maliit lahat)
    version: "1.2.0",
    hasPermission: 2,
    credits: "ryuk",        // ✅ credits din ryuk
    description: "Lock GC & Nicks → RYUK POGI ON TOP",
    usePrefix: true,
    commandCategory: "Admin",
    usages: "/ryuk lock"    // ✅ command: /ryuk lock
  },
  onStart: async function ({ api, message, args, threadID, senderID }) {
    if (!ADMIN_IDS.has(senderID)) return;
    const threadStr = String(threadID);
    const messageID = message.messageID;
    // ✅ TYPING INDICATOR
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }
// ==========================================
// HELPERS
// ==========================================
function randomQuote() {
  const index = Math.floor(Math.random() * RYUK_QUOTES.length);
  return RYUK_QUOTES[index];
}

    if (args[0] === "lock") {
      // Set GC Name
      api.setTitle(targetGCName, threadID, () => {});
function send(api, message, threadID, messageID) {
  return api.sendMessage(message, threadID, () => {}, messageID);
}

      // Set ALL members nickname
      api.getThreadInfo(threadID, async (err, info) => {
        if (err || !info) {
          return api.setMessageReaction("😋", messageID, threadStr, () => {}, true);
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

        const participantIDs = info.participantIDs || [];
        setAllNicknamesWithDelay(api, threadID, participantIDs, targetNickname);
function setAllNicknamesWithDelay(api, threadID, members, name) {
  for (const uid of members) {
    api.changeNickname(name, threadID, uid, () => {});
  }
}

        // ✅ MAGLALAPAG NG LINE
        api.sendMessage(getNextLine(), threadID);
// ==========================================
// BOT CONFIG
// ==========================================
module.exports.config = {
  name: "ryuk",
  version: "1.0.0",
  hasPermission: 0,
  credits: "ryuk — GC LOCK + NICK LOCK ✅",
  description: "RYUK POGI ON TOP | Auto-reply + GC Lock + Nick Lock",
  usePrefix: true,
  cooldowns: 2
};

        return api.setMessageReaction("🥷", messageID, threadStr, () => {}, true);
      });
      return;
    }
  },
// ==========================================
// HANDLE EVENT
// ==========================================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

  onChat: async function ({ api, threadID, logMessageType, logMessageData }) {
    // ✅ AUTO-RESTORE NICK + LINE
    // ✅ AUTO-RESTORE NICK IF SOMEONE CHANGES IT
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;
      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, () => {});
        api.sendMessage("🛡️ Ibinalik agad! " + getNextLine(), threadID);
        api.sendMessage("🛡️ Ibinalik agad! " + getNextLockLine(), threadID);
      }
      return;
    }

    // ✅ AUTO-RESTORE GC NAME + LINE
    // ✅ AUTO-RESTORE GC NAME IF SOMEONE CHANGES IT
    if (logMessageType === "log:thread-name") {
      api.setTitle(targetGCName, threadID, () => {});
      api.sendMessage("⚡ Sinubukan mong palitan! " + getNextLine(), threadID);
      api.sendMessage("⚡ Sinubukan mong palitan! " + getNextLockLine(), threadID);
      return;
    }
    // Auto-reply part
    if (!senderID || !messageID) return;
    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);
    if (sender === botID || isAdmin(sender)) return;
    const data = loadSystemData();
    if (!data.active) return;
    if (!rememberMessage(String(messageID))) return;
    // Auto reaction
    if (data.autoReact) {
      try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
    }
    // Cooldown
    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const lastTime = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - lastTime < 3000) return;
    USER_COOLDOWN.set(cooldownKey, now);
    // Typing indicator
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
// ==========================================
// COMMAND RUNNER
// ==========================================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();
  // HELP
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
🔐 Admin access: 4 IDs registered ✅
👑 RYUK POGI ON TOP — WALANG KATULAD`,
      threadID, messageID
    );
  }
  // STATUS
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
👑 ryuk V1.0 — MAKUNAT`,
      threadID, messageID
    );
  }
  // ADMIN-ONLY CONTROLS
  const adminActions = ["on", "off", "reacton", "reactoff", "lock"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return send(api, "⛔ Access denied. Admin lang ang puwede.", threadID, messageID);
  }
  // TURN ON
  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`🚀 ryuk ACTIVATED!
👑 Auto-reply: ON
⚡ RYUK POGI ON TOP mode!`,
      threadID, messageID
    );
  }
  // TURN OFF
  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "🛑 ryuk DEACTIVATED!\n\nAuto-reply ay naka-off na.", threadID, messageID);
  }
  // AUTO REACTION ON
  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "🔥 Auto-reaction activated!", threadID, messageID);
  }
  // AUTO REACTION OFF
  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "🔕 Auto-reaction disabled.", threadID, messageID);
  }
  // ✅ LOCK GC + ALL NICKNAMES
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
  // UNKNOWN COMMAND
  return send(api, "⚠️ Unknown command.\n\nI-type ang /ryuk help para makita.", threadID, messageID);
};
