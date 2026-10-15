const fs = require("fs");
const path = require("path");

// ==========================================
// 🔒 GC NAME LOCK + SET NAME COMMAND
// AUTO-REVERT: 3s | ✅ NGC SET <name>
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817",
  "61595507156493"
];

let TARGET_GC_NAME = "RYUK DOMAIN EXPANSION";

const DATA_FILE = path.join(__dirname, "ngc_lock_data.json");
const REVERT_DELAY = 3000;        // 3 segundo bago ibalik
const CHECK_INTERVAL = 10000;      // Check bawat 10s
const COOLDOWN = 5000;             // Pahinga bago susunod

const IS_LOCKED = {};
const LAST_CHECK = {};
const LAST_ACTION = {};

function isAdmin(id) {
  return ADMIN_IDS.includes(String(id).trim());
}

// 💾 Save/Load
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ TARGET_GC_NAME }, null, 2));
  } catch (e) {}
}
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      if (data.TARGET_GC_NAME) TARGET_GC_NAME = data.TARGET_GC_NAME;
    }
  } catch (e) {}
}
loadData();

module.exports.config = {
  name: "ngc",
  aliases: ["gclock", "lockgc"],
  version: "1.2.0",
  hasPermission: 1,
  credits: "RYUK DOMAIN LOCK",
  description: "📛 NGC — Lock/Set GC Name | Auto Revert 3s",
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const tid = String(threadID);
    if (!IS_LOCKED[tid]) return;

    const now = Date.now();
    if (LAST_ACTION[tid] && now - LAST_ACTION[tid] < COOLDOWN) return;

    if (logMessageType === "log:thread-name") {
      const newName = logMessageData.name || "";
      if (newName !== TARGET_GC_NAME) {
        setTimeout(() => {
          api.setTitle(TARGET_GC_NAME, tid, () => {});
          LAST_ACTION[tid] = Date.now();
        }, REVERT_DELAY);
      }
    }

    if (!LAST_CHECK[tid] || now - LAST_CHECK[tid] >= CHECK_INTERVAL) {
      LAST_CHECK[tid] = now;
      api.getThreadInfo(tid, (err, info) => {
        if (err || !info) return;
        if (info.threadName !== TARGET_GC_NAME) {
          setTimeout(() => {
            api.setTitle(TARGET_GC_NAME, tid, () => {});
            LAST_ACTION[tid] = Date.now();
          }, REVERT_DELAY);
        }
      });
    }

  } catch (err) {
    console.error("[NGC Lock Error]:", err);
  }
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, senderID } = event;
    const tid = String(threadID);
    const sender = String(senderID).trim();

    if (!isAdmin(sender)) {
      return api.sendMessage("❌ Ikaw hindi pwede gamitin ito!", tid);
    }

    const action = (args[0] || "").toLowerCase();

    // ✅ SET NEW GC NAME
    if (action === "set") {
      const newName = args.slice(1).join(" ").trim();
      if (!newName) {
        return api.sendMessage("❌ Ilagay ang pangalan!\nHalimbawa: ngc set RYUK KINGDOM", tid);
      }
      TARGET_GC_NAME = newName;
      saveData();
      api.setTitle(TARGET_GC_NAME, tid, () => {});
      return api.sendMessage(
`📛 GC NAME UPDATED ✅
📛 Bagong Name: "${TARGET_GC_NAME}"
🔒 Auto-revert: 3s`, tid);
    }

    if (action === "on") {
      IS_LOCKED[tid] = true;
      api.setTitle(TARGET_GC_NAME, tid, () => {});
      return api.sendMessage(
`📛 NGC! ACTIVATED ✅
📌 GC LOCKED: ${tid}
📛 Name: "${TARGET_GC_NAME}"
🛡️ Auto revert: 3 seconds`, tid);
    }

    if (action === "off") {
      IS_LOCKED[tid] = false;
      return api.sendMessage("📛 NGC — DEACTIVATED\nGC Name Free ✅", tid);
    }

    const status = IS_LOCKED[tid] ? "ACTIVE" : "OFF";
    return api.sendMessage(
`📛 NGC STATUS
📌 Status: ${status}
📛 Target: "${TARGET_GC_NAME}"
🛡️ Revert: 3s
📖 Commands:
• ngc set <pangalan> — Palitan GC Name
• ngc on — I-lock
• ngc off — I-unlock`, tid);

  } catch (err) {
    console.error("[NGC Command Error]:", err);
  }
};
  
