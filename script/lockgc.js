const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 BOT LOCK — RYUK BOSS ON TOP 👑
// LOCK GC NAME + ALL NICKNAMES + AUTO-REVERT
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const DATA_FILE = path.join(__dirname, "bot_lock_data.json");

const DEFAULT_DATA = {
  lockActive: true,
  totalLocked: 0
};

// ==========================================
// 🎯 LOCK TARGET — RYUK BOSS ON TOP
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
    console.error("[BOT LOCK] Load error:", e.message);
  }
  return { ...DEFAULT_DATA };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("[BOT LOCK] Save error:", e.message);
    return false;
  }
}

// ==========================================
// SET ALL NICKNAMES WITH DELAY
// ==========================================
async function setAllNicknamesWithDelay(api, threadID, participantIDs, nickname) {
  for (const id of participantIDs) {
    await new Promise(res => setTimeout(res, 600)); // 0.6s delay para iwas block
    api.changeNickname(nickname, threadID, id, () => {});
  }
}

// ==========================================
// BOT CONFIG
// ==========================================
module.exports.config = {
  name: "botlock",
  version: "1.0.0",
  hasPermission: 0,
  credits: "RYUK BOSS ON TOP 👑",
  description: "Lock GC Name + All Nicknames to RYUK BOSS ON TOP",
  usePrefix: true,
  cooldowns: 3
};

// ==========================================
// HANDLE EVENT — AUTO WATCHER
// ==========================================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const data = loadData();
    if (!data.lockActive) return;

    // ========================================
    // 🔒 AUTO-REVERT KUNG MAY NAGPALIT NG NICKNAME
    // ========================================
    if (logMessageType === "log:user-nickname") {
      const targetUserID =
