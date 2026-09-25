const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 GOJO BOT → RYUK POGI ON TOP V9.2 👑
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const DATA_FILE = path.join(__dirname, "ryuk_exact_data.json");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  totalReplies: 0,
  replyToAdmins: false,
  cooldownMs: 3000
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const USED_QUOTES = new Set();
const MAX_SEEN_MESSAGES = 5000;

// ==========================================
// 🎯 TARGET SETTINGS — RYUK POGI ON TOP
// ==========================================
const targetNickname = "RYUK POGI ON TOP";
const targetGCName = "RYUK POGI ON TOP";

// ==========================================
// 🔐 ADMIN CHECK
// ==========================================
function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

// ==========================================
// RYUK QUOTES
// ==========================================
const GOJO_QUOTES = [
  "Sa buong langit at lupa, RYUK POGI ON TOP! 😎🔥",
  "Walang makakatalo — RYUK POGI ON TOP! 💀",
  "Infinity? Hindi, POGI ang tunay na lakas! ✨",
  "Kalmado lang, RYUK ang kausap mo. ON TOP palagi! 🗡️",
  "Isang tingin lang, alam mong RYUK POGI ON TOP! 😏",
  "Masyado kang mabagal — RYUK POGI ON TOP! ⚡",
  "Hindi nagyayabang — sinasabi lang: RYUK POGI ON TOP! 👑",
  "Domain Expansion: POGI ZONE — RYUK ON TOP! 🌌",
  "Relax ka lang, RYUK na ang bahala. POGI ON TOP! 💙",
  "Walang duda — RYUK POGI ON TOP! 🔥",
  "Your move? Huli na — RYUK POGI ON TOP! 😆",
  "Kahit saan, kahit kailan — RYUK POGI ON TOP! ✅",
  "Tingnan mo ang pangalan — RYUK POGI ON TOP! 📛",
  "System online: RYUK POGI ON TOP! 🟢",
  "Walang kapantay — RYUK POGI ON TOP! 💯"
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
    console.error("[RYUK] Data load error:", error.message);
  }
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[RYUK] Data save error:", error.message);
    return false;
  }
}

// ==========================================
// HELPERS
// ==========================================
function randomQuote() {
  if (USED_QUOTES.size >= GOJO_QUOTES.length) {
    USED_QUOTES.clear();
  }
  let available = GOJO_QUOTES.filter((_, i) => !USED_QUOTES.has(i));
  const index = GOJO_QUOTES.indexOf(available[Math.floor(Math.random() * available.length)]);
  USED_QUOTES.add(index);
  return GOJO_QUOTES[index];
}

function send(api, message, threadID, messageID) {
  return new Promise((resolve) => {
    api.sendMessage(message, threadID, () => resolve(), messageID);
  });
}

function rememberMessage(messageID) {
  if (SEEN_MESSAGES.has(messageID)) return false;
  SEEN_MESSAGES.add(messageID);
  if (SEEN_MESSAGES.size > MAX_SEEN_MESSAGES) {
    const iter = SEEN_MESSAGES.values();
    for (let i = 0; i < 100; i++) {
      SEEN_MESSAGES.delete(iter.next().value);
    }
  }
  return true;
}

// ==========================================
// NICKNAME SETTER WITH DELAY
// ==========================================
async function setAllNicknamesWithDelay(api, threadID, participantIDs, nickname) {
  for (const id of participantIDs) {
    await new Promise(res => setTimeout(res, 500)); // 0.5s delay per user
    api.changeNickname(nickname, threadID, id, () => {});
  }
}

// ==========================================
// BOT CONFIG
// ==========================================
module.exports.config = {
  name: "ryuk",
  version: "9.2.0",
  hasPermission: 0,
  credits: "RYUK POGI ON TOP | 4 Admin ✅",
  description: "Ryuk auto-reply, GC name & nickname enforcer",
  usePrefix: true,
  cooldowns: 2
};

// ==========================================
// HANDLE EVENT
// ==========================================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID || !senderID || !messageID) return;

    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);
    const threadStr = String(threadID);
    const data = loadSystemData();

    // Skip own messages
    if (sender === botID) return;

    // Skip admins unless enabled
    if (isAdmin(sender) && !data.replyToAdmins) return;

    // ========================================
    // 🧐 WATCH: If anyone changes nickname → revert
    // ========================================
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;
      
      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, () => {});
      }
      return;
    }

    if (!data.active) return;
    if (!rememberMessage(String(messageID))) return;

    // ✍️ Typing Indicator
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    // 😆 Auto Reaction
    if (data.autoReact) {
      try {
        api.setMessageReaction("😆", messageID, () => {}, true);
      } catch (e) {
        console.error("[RYUK] React error:", e.message);
      }
    }

    // ⏱️ Cooldown
    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const lastTime = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - lastTime < data.cooldownMs) return;
    USER_COOLDOWN.set(cooldownKey, now);

    const delay = Math.max(0, Math.min(Number(data.delay) || 2000, 10000));

    setTimeout(() => {
      const latestData = loadSystemData();
      if (!latestData.active) return;

      const reply = `👑 [RYUK POGI ON TOP]\n\n${randomQuote()}`;
      
      api.sendMessage(reply, threadID, (error) => {
        if (error) {
          console.error("[RYUK] Send error:", error);
          return;
        }
        latestData.totalReplies = (latestData.totalReplies || 0) + 1;
        saveSystemData(latestData);
      }, messageID);
    }, delay);

  } catch (error) {
    console.error("[RYUK] Event error:", error);
  }
};

// ==========================================
// COMMAND RUNNER
// ==========================================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();
  const threadStr = String(threadID);

  // HELP
  if (action === "help") {
    return send(api,
`👑 RYUK POGI ON TOP — CONTROL PANEL 👑

╭───「 COMMANDS 」
│
├ 👑 /ryuk help
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
├ 🏷️ /ryuk gcname
│   Palitan GC name + lahat ng nickname → RYUK POGI ON TOP
│
├ 💬 /ryuk quote
│   Random Ryuk quote
│
╰──────────────

🔐 Admin access: 4 IDs registered ✅
👑 RYUK POGI ON TOP`,
      threadID, messageID
    );
  }

  // STATUS
  if (action === "status") {
    return send(api,
`👑 RYUK SYSTEM STATUS 👑

╭───「 SYSTEM 」
│
├ 🤖 Auto Reply:
│   ${data.active ? "🟢 ONLINE" : "🔴 OFFLINE"}
│
├ ⏱️ Reply Delay:
│   ${data.delay} ms
│
├ 😆 Auto Reaction:
│   ${data.autoReact ? "🟢 ENABLED" : "🔴 DISABLED"}
│
├ 💬 Total Replies:
│   ${data.totalReplies || 0}
│
├ 🏷️ Target Name:
│   ${targetGCName}
│
├ 🔐 Admin Count:
│   ${ADMIN_IDS.length} registered ✅
│
╰──────────────

👑 RYUK POGI ON TOP`,
      threadID, messageID
    );
  }

  // ADMIN-ONLY CONTROLS
  const adminActions = ["on", "off", "reacton", "reactoff", "gcname"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return send(api, "⛔ Access denied. Admin lamang ang puwede.", threadID, messageID);
  }

  // TURN ON
  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`🚀 RYUK SYSTEM ACTIVATED!

👑 Auto-reply: ON
⏱️ Delay: ${data.delay} ms
🔥 RYUK POGI ON TOP!`,
      threadID, messageID
    );
  }

  // TURN OFF
  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "🛑 RYUK SYSTEM DEACTIVATED!\n\nAuto-reply ay naka-off na.", threadID, messageID);
  }

  // AUTO REACTION ON
  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "😆 Auto-reaction activated!", threadID, messageID);
  }

  // AUTO REACTION OFF
  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "🔕 Auto-reaction disabled.", threadID, messageID);
  }

  // 🏷️ GCNAME — CHANGE GC NAME + ALL NICKNAMES
  if (action === "gcname") {
    // Set GC Name
    api.setTitle(targetGCName, threadID, () => {});

    // Get members & set all nicknames
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.setMessageReaction("😋", messageID, () => {}, true);
      }

      const participantIDs = info.participantIDs || [];
      await setAllNicknamesWithDelay(api, threadID, participantIDs, targetNickname);

      return api.setMessageReaction("👑", messageID, () => {}, true);
    });

    return send(api,
`🏷️ INILIPAT NA LAHAT → RYUK POGI ON TOP!

✅ GC Name: ${targetGCName}
✅ Lahat ng Nickname: ${targetNickname}
👑 RYUK POGI ON TOP PALAGI! 🔥`,
      threadID, messageID
    );
  }

  // RANDOM QUOTE
  if (action === "quote") {
    return send(api, `👑 [RYUK POGI ON TOP]\n\n${randomQuote()}`, threadID, messageID);
  }

  // UNKNOWN COMMAND
  return send(api, "⚠️ Unknown command.\n\nI-type ang /ryuk help para makita.", threadID, messageID);
};
