const fs = require("fs");
const path = require("path");

// ==========================================
// 🔒 GC NAME LOCK — RYUK DOMAIN EXPANSION
// AUTO-REVERT | ✅ SAFE ANTI-DETECT VERSION
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
const TARGET_GC_NAME = "RYUK DOMAIN EXPANSION";

// ✅ SAFE SETTINGS — HINDI MA-DETECT | BAWAS API CALLS
const REVERT_DELAY_MIN = 4000;    // Minimum 4s bago ibalik
const REVERT_DELAY_MAX = 8000;    // Hanggang 8s — random para natural
const CHECK_INTERVAL = 45000;      // Check bawat 45s — mas ligtas ✅
const COOLDOWN = 8000;             // Pahinga 8s bago susunod na action
const MAX_RETRIES = 2;             // Hanggang 2 beses lang subok

const DATA_FILE = path.join(__dirname, "ngc_lock_data.json");
const IS_LOCKED = {};
const LAST_CHECK = {};
const LAST_ACTION = {};
const RETRY_COUNT = {};

function isAdmin(id) {
  return ADMIN_IDS.includes(String(id).trim());
}

// 🎲 Random delay para hindi magmukhang robot
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.config = {
  name: "ngc",
  aliases: ["gclock", "lockgc"],
  version: "1.2.0-SAFE",
  hasPermission: 1,
  credits: "RYUK DOMAIN LOCK",
  description: "📛 NGC — Lock GC Name | Safe Anti-Detect",
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: 8  // Mas mahaba ang cooldown ✅
};

// ✅ I-CHECK KUNG MAY NAGPALIT NG PANGALAN
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const tid = String(threadID);
    if (!IS_LOCKED[tid]) return;

    // Cooldown check — huwag masyadong mabilis ✅
    const now = Date.now();
    if (LAST_ACTION[tid] && now - LAST_ACTION[tid] < COOLDOWN) {
      return;
    }

    // May nagpalit ng pangalan sa GC
    if (logMessageType === "log:thread-name") {
      const newName = logMessageData.name || "";
      if (newName !== TARGET_GC_NAME) {
        if (!RETRY_COUNT[tid]) RETRY_COUNT[tid] = 0;
        if (RETRY_COUNT[tid] >= MAX_RETRIES) return; // Limitahan ✅
        
        RETRY_COUNT[tid]++;
        const delay = randomDelay(REVERT_DELAY_MIN, REVERT_DELAY_MAX);
        
        setTimeout(() => {
          api.setTitle(TARGET_GC_NAME, tid, () => {});
          LAST_ACTION[tid] = Date.now();
        }, delay);
      } else {
        RETRY_COUNT[tid] = 0; // Reset kung tama na
      }
      return;
    }

    // Regular check — mas madalang na ✅
    if (!LAST_CHECK[tid] || now - LAST_CHECK[tid] >= CHECK_INTERVAL) {
      LAST_CHECK[tid] = now;
      
      api.getThreadInfo(tid, (err, info) => {
        if (err || !info) return;
        if (info.threadName !== TARGET_GC_NAME) {
          if (!RETRY_COUNT[tid]) RETRY_COUNT[tid] = 0;
          if (RETRY_COUNT[tid] >= MAX_RETRIES) return;
          
          RETRY_COUNT[tid]++;
          const delay = randomDelay(REVERT_DELAY_MIN, REVERT_DELAY_MAX);
          
          setTimeout(() => {
            api.setTitle(TARGET_GC_NAME, tid, () => {});
            LAST_ACTION[tid] = Date.now();
          }, delay);
        } else {
          RETRY_COUNT[tid] = 0;
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
      RETRY_COUNT[tid] = 0;
      LAST_ACTION[tid] = 0;
      
      setTimeout(() => {
        api.setTitle(TARGET_GC_NAME, tid, () => {});
      }, randomDelay(1000, 2500));
      
      return api.sendMessage(
`📛 NGC! ACTIVATED ✅
📌 GC LOCKED: ${tid}
📛 Name: "${TARGET_GC_NAME}"
🛡️ Auto revert: 4-8s (safe mode)`, tid);
    }

    if (action === "off") {
      IS_LOCKED[tid] = false;
      RETRY_COUNT[tid] = 0;
      return api.sendMessage("📛 NGC — DEACTIVATED\nGC Name Free ✅", tid);
    }

    // Status
    const status = IS_LOCKED[tid] ? "ACTIVE" : "OFF";
    return api.sendMessage(
`📛 NGC STATUS
📌 Status: ${status}
📛 Target: "${TARGET_GC_NAME}"
🛡️ Revert: 4-8s random
Check: every 45s
Gamitin: ngc on | ngc off`, tid);

  } catch (err) {
    console.error("[NGC Command Error]:", err);
  }
};
