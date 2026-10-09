const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 NICKNAME LOCK — RYUK DOMAIN EXPANSION
// AUTO-REVERT + SET ALL NICKNAMES ✅
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

// ✅ TARGET NICKNAME — HUWAG BAGUHIN DITO NA
const TARGET_NICKNAME = "RYUK POGI ON TOP";

// ✅ SETTINGS — LIGTAS NA HINDI MA-DETECT
const REVERT_DELAY = 3000;        // 3 segundo bago ibalik
const CHECK_INTERVAL = 15000;     // Check bawat 15s — hindi ma-detect
const NICK_DELAY_MIN = 800;       // Delay bawat pagpapalit ng nick
const NICK_DELAY_MAX = 1500;      // — para hindi ma-detect

const DATA_FILE = path.join(__dirname, "nlc_lock_data.json");
const IS_LOCKED = {};
const LAST_CHECK = {};

function isAdmin(id) {
  return ADMIN_IDS.includes(String(id).trim());
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.config = {
  name: "nlc",
  aliases: ["nicklock", "locknick"],
  version: "1.2.0",
  hasPermission: 1,
  credits: "RYUK DOMAIN LOCK",
  description: "👑 NLC — Lock Nickname | Auto Revert + Set All",
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: 5
};

// ✅ PALITAN ANG NICKNAME NG LAHAT NG MIYEMBRO
async function setAllNicknames(api, threadID, targetNickname, messageID) {
  try {
    const info = await new Promise((resolve, reject) => {
      api.getThreadInfo(threadID, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    const participantIDs = info.participantIDs || [];
    const botID = api.getCurrentUserID();
    let successCount = 0;
    let skipCount = 0;

    for (const userID of participantIDs) {
      // I-skip ang sarili at admins
      if (userID === botID || isAdmin(userID)) {
        skipCount++;
        continue;
      }

      const delay = getRandomDelay(NICK_DELAY_MIN, NICK_DELAY_MAX);
      await new Promise(resolve => setTimeout(resolve, delay));

      await new Promise(resolve => {
        api.changeNickname(targetNickname, userID, threadID, (err) => {
          if (!err) successCount++;
          resolve();
        });
      });
    }

    return { successCount, skipCount, total: participantIDs.length };
  } catch (err) {
    console.error("[Set All Nicknames Error]:", err);
    return { successCount: 0, skipCount: 0, total: 0, error: err };
  }
}

// ✅ I-CHECK KUNG MAY NAGPALIT NG NICKNAME
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const tid = String(threadID);
    if (!IS_LOCKED[tid]) return;

    const botID = api.getCurrentUserID();

    // May nagpalit ng nickname sa GC
    if (logMessageType === "log:user-nickname") {
      const { participantID, nickname } = logMessageData;

      // I-skip ang sarili at mga admin
      if (participantID === botID || isAdmin(participantID)) return;

      // Kung hindi target nickname → ibalik agad
      if (nickname !== TARGET_NICKNAME) {
        setTimeout(() => {
          api.changeNickname(TARGET_NICKNAME, participantID, tid, (err) => {
            if (err) console.log("[NLC] Revert failed:", err.message);
          });
        }, REVERT_DELAY);
      }
    }

    // Regular check — siguradong tama palagi
    const now = Date.now();
    if (!LAST_CHECK[tid] || now - LAST_CHECK[tid] >= CHECK_INTERVAL) {
      LAST_CHECK[tid] = now;
      api.getThreadInfo(tid, (err, info) => {
        if (err || !info) return;
        const nicknames = info.nicknames || {};
        for (const [userID, currentNick] of Object.entries(nicknames)) {
          if (userID === botID || isAdmin(userID)) continue;
          if (currentNick !== TARGET_NICKNAME) {
            setTimeout(() => {
              api.changeNickname(TARGET_NICKNAME, userID, tid, (err) => {});
            }, REVERT_DELAY);
          }
        }
      });
    }

  } catch (err) {
    console.error("[NLC Lock Error]:", err);
  }
};

// ✅ COMMAND — I-ON / I-OFF / SETALL
module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, senderID, messageID } = event;
    const tid = String(threadID);
    const sender = String(senderID).trim();

    if (!isAdmin(sender)) {
      return api.sendMessage("❌ Ikaw hindi pwede gamitin ito!", tid);
    }

    const action = (args[0] || "").toLowerCase();

    if (action === "on") {
      IS_LOCKED[tid] = true;
      return api.sendMessage(
`👑 NLC! ACTIVATED ✅
📌 GC LOCKED: ${tid}
👑 Nickname: "${TARGET_NICKNAME}"
🛡️ Auto revert: 3 seconds
💡 Gamitin: nlc setall — palitan lahat agad`, tid);
    }

    if (action === "off") {
      IS_LOCKED[tid] = false;
      return api.sendMessage("👑 NLC — DEACTIVATED\nNickname Free ✅", tid);
    }

    if (action === "setall") {
      api.sendMessage(`👑 NLC — Pinalitan ang lahat ng nickname...\n⏳ Sandali lang, huwag magmadali`, tid);
      
      const result = await setAllNicknames(api, tid, TARGET_NICKNAME, messageID);
      
      return api.sendMessage(
`👑 NLC — DONE ✅
👑 Nickname: "${TARGET_NICKNAME}"
✅ Pinalitan: ${result.successCount} miyembro
⏭️ Inilipat: ${result.skipCount} (ikaw + bot)
🛡️ Lock active: ${IS_LOCKED[tid] ? "YES ✅" : "NO ❌"}`, tid);
    }

    // Status
    const status = IS_LOCKED[tid] ? "ACTIVE" : "OFF";
    return api.sendMessage(
`👑 NLC STATUS
📌 Status: ${status}
👑 Target: "${TARGET_NICKNAME}"
🛡️ Revert: 3s

Gamitin:
nlc on — I-on ang lock
nlc off — I-off ang lock
nlc setall — Palitan lahat ngayon`, tid);

  } catch (err) {
    console.error("[NLC Command Error]:", err);
    return api.sendMessage("❌ May error, tingnan mo console.", event.threadID);
  }
};
                            
