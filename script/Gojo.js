const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 RYUK BOSS ON TOP — FB BOT 👑
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const DATA_FILE = path.join(__dirname, "ryuk_boss_data.json");

const DEFAULT_DATA = {
  lockActive: true,
  totalExecutions: 0
};

// ==========================================
// 🎯 TARGET NAMES — RYUK BOSS ON TOP
// ==========================================
const targetNickname = "RYUK BOSS ON TOP";
const targetGCName = "RYUK BOSS ON TOP";

// ==========================================
// 🔐 ADMIN CHECK
// ==========================================
function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

// ==========================================
// DATA MANAGEMENT
// ==========================================
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (e) {
    console.error("[RYUK BOSS] Load Error:", e.message);
  }
  return { ...DEFAULT_DATA };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("[RYUK BOSS] Save Error:", e.message);
    return false;
  }
}

// ==========================================
// SET ALL NICKNAMES WITH DELAY
// ==========================================
async function setAllNicknamesWithDelay(api, threadID, participantIDs, nickname) {
  for (const id of participantIDs) {
    await new Promise(res => setTimeout(res, 600)); // Iwas detection
    api.changeNickname(nickname, threadID, id, () => {});
  }
}

// ==========================================
// BOT CONFIG
// ==========================================
module.exports.config = {
  name: "ryukboss",
  version: "1.0.0",
  hasPermission: 0,
  credits: "RYUK BOSS ON TOP 👑",
  description: "GC Name + Nickname Lock + Auto-Revert",
  usePrefix: true,
  cooldowns: 3
};

// ==========================================
// HANDLE EVENT — WATCHER
// ==========================================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData, messageID } = event;
    if (!threadID) return;

    const botCache = api; // Compatibility
    const threadStr = String(threadID);
    const data = loadData();
    if (!data.lockActive) return;

    // ✍️ TYPING INDICATOR
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    // 🔒 AUTO-REVERT IF SOMEONE CHANGES NICKNAME
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;

      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, () => {});
        console.log(`[RYUK BOSS] Reverted ID ${targetUserID} → ${targetNickname}`);
      }
      return;
    }

  } catch (e) {
    console.error("[RYUK BOSS] Event Error:", e.message);
  }
};

// ==========================================
// COMMANDS
// ==========================================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadData();
  const threadStr = String(threadID);

  // 📖 HELP
  if (action === "help") {
    return api.sendMessage(
`👑 RYUK BOSS ON TOP — CONTROL PANEL 👑

╭───「 COMMANDS 」
│
├ 📖 /ryukboss help
│   Ipakita lahat ng commands
│
├ 🔒 /ryukboss lock
│   Palitan GC Name + Lahat Nickname
│   → RYUK BOSS ON TOP
│
├ 🟢 /ryukboss on
│   I-on Auto-Revert Lock
│
├ 🔴 /ryukboss off
│   I-off Auto-Revert Lock
│
├ 📊 /ryukboss status
│   Tingnan System Status
│
╰──────────────

🔐 Admin Only ✅
RYUK BOSS ON TOP 👑🔥`,
      threadID, messageID
    );
  }

  // 📊 STATUS
  if (action === "status") {
    return api.sendMessage(
`👑 SYSTEM STATUS 👑

🔒 Auto-Revert: ${data.lockActive ? "🟢 ACTIVE" : "🔴 DISABLED"}
🏷️ GC Name: ${targetGCName}
👤 Nickname: ${targetNickname}
🔐 Admin IDs: ${ADMIN_IDS.length} registered ✅
📝 Total Runs: ${data.totalExecutions || 0}

RYUK BOSS ON TOP 👑🔥`,
      threadID, messageID
    );
  }

  // ⛔ ADMIN ONLY CHECK
  const adminActions = ["lock", "on", "off"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return api.sendMessage("⛔ ACCESS DENIED — Admin lang ang puwede!", threadID, messageID);
  }

  // 🔒 LOCK GC + ALL NICKNAMES
  if (action === "lock") {
    // Set GC Name
    api.setTitle(targetGCName, threadID, () => {});

    // Get Members & Set All Nicknames
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.setMessageReaction("😋", messageID, () => {}, true);
      }

      const participantIDs = info.participantIDs || [];
      await setAllNicknamesWithDelay(api, threadID, participantIDs, targetNickname);

      data.totalExecutions = (data.totalExecutions || 0) + 1;
      saveData(data);

      return api.setMessageReaction("👑", messageID, () => {}, true);
    });

    return api.sendMessage(
`🔒 LOCKED SUCCESSFULLY! 👑

✅ GC Name → ${targetGCName}
✅ All Nicknames → ${targetNickname}
🔄 Auto-Revert: ACTIVE

Walang makakatakas! RYUK BOSS ON TOP 🔥`,
      threadID, messageID
    );
  }

  // 🟢 TURN ON LOCK
  if (action === "on") {
    data.lockActive = true;
    saveData(data);
    return api.sendMessage("🟢 AUTO-REVERT LOCK: ON 🔒\nBabalik agad kapag may nagpalit!", threadID, messageID);
  }

  // 🔴 TURN OFF LOCK
  if (action === "off") {
    data.lockActive = false;
    saveData(data);
    return api.sendMessage("🔴 AUTO-REVERT LOCK: OFF ⚠️\nHindi na babalik ang pangalan!", threadID, messageID);
  }

  // ⚠️ UNKNOWN COMMAND
  return api.sendMessage("⚠️ Unknown Command!\nI-type: /ryukboss help", threadID, messageID);
};
  
