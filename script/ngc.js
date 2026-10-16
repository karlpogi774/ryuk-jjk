const fs = require("fs");
const path = require("path");

// ==========================================
// 🔒 GC NAME LOCK — RYUK DOMAIN EXPANSION
// AUTO-REVERT | HINDI MA-DETECT ✅
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817",
  "61595507156493"
];

// ✅ TARGET GC NAME — HUWAG BAGUHIN DITO NA
const TARGET_GC_NAME = "DOMAIN EXPANSION NI RYUK😈😈😈";

// ✅ SETTINGS — LIGTAS NA HINDI MA-DETECT
const REVERT_DELAY = 3000;        // 3 segundo bago ibalik
const CHECK_INTERVAL = 10000;      // Check bawat 10s — hindi ma-detect
const COOLDOWN = 5000;             // Pahinga bago susunod na action

const DATA_FILE = path.join(__dirname, "ngc_lock_data.json");
const IS_LOCKED = {};
const LAST_CHECK = {};

function isAdmin(id) {
  return ADMIN_IDS.includes(String(id).trim());
}

module.exports.config = {
  name: "ngc",
  aliases: ["gclock", "lockgc"],
  version: "1.1.0",
  hasPermission: 1,
  credits: "RYUK DOMAIN LOCK",
  description: "📛 NGC — Lock GC Name | Auto Revert 3s",
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: 5
};

// ✅ I-CHECK KUNG MAY NAGPALIT NG PANGALAN
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const tid = String(threadID);
    if (!IS_LOCKED[tid]) return;

    // May nagpalit ng pangalan sa GC
    if (logMessageType === "log:thread-name") {
      const newName = logMessageData.name || "";
      if (newName !== TARGET_GC_NAME) {
        setTimeout(() => {
          api.setTitle(TARGET_GC_NAME, tid, () => {});
        }, REVERT_DELAY);
      }
    }

    // Regular check — siguradong tama palagi
    const now = Date.now();
    if (!LAST_CHECK[tid] || now - LAST_CHECK[tid] >= CHECK_INTERVAL) {
      LAST_CHECK[tid] = now;
      api.getThreadInfo(tid, (err, info) => {
        if (err || !info) return;
        if (info.threadName !== TARGET_GC_NAME) {
          setTimeout(() => {
            api.setTitle(TARGET_GC_NAME, tid, () => {});
          }, REVERT_DELAY);
        }
      });
    }

  } catch (err) {
    console.error("[NGC Lock Error]:", err);
  }
};

// ✅ COMMAND — I-ON / I-OFF ANG LOCK
module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, senderID } = event;
    const tid = String(threadID);
    const sender = String(senderID).trim();

    if (!isAdmin(sender)) {
      return api.sendMessage("❌ Ikaw hindi pwede gamitin ito!", tid);
    }

    const action = (args[0] || "").toLowerCase();

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

    // Status
    const status = IS_LOCKED[tid] ? "ACTIVE" : "OFF";
    return api.sendMessage(
`📛 NGC STATUS
📌 Status: ${status}
📛 Target: "${TARGET_GC_NAME}"
🛡️ Revert: 3s
Gamitin: ngc on | ngc off`, tid);

  } catch (err) {
    console.error("[NGC Command Error]:", err);
  }
};
