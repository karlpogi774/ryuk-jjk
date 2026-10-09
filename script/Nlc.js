const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 NICKNAME LOCK — ENGLISH VERSION
// AUTO-REVERT + SET ALL NICKNAMES ✅
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const TARGET_NICKNAME = "RYUK POGI ON TOP";
const REVERT_DELAY = 2000;       // 2 seconds before reverting
const NICK_DELAY = 600;          // Delay between changes — safe & undetectable

const IS_LOCKED = {};

function isAdmin(id) {
  return ADMIN_IDS.includes(String(id).trim());
}

module.exports.config = {
  name: "nlc",
  aliases: ["nicklock", "locknick"],
  version: "1.3.0",
  hasPermission: 1,
  credits: "RYUK DOMAIN LOCK",
  description: "👑 NLC — Lock Nickname | Auto Revert + Set All",
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: 3
};

// ✅ SET ALL NICKNAMES — GUARANTEED TO WORK
async function setAllNicknames(api, threadID) {
  return new Promise((resolve) => {
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        console.log("[NLC ERROR] Failed to get thread info:", err);
        return resolve({ success: 0, skipped: 0, total: 0 });
      }

      const members = info.participantIDs || [];
      const botID = api.getCurrentUserID();
      let success = 0;
      let skipped = 0;

      for (let i = 0; i < members.length; i++) {
        const userID = members[i];

        // Skip bot and admins
        if (userID === botID || isAdmin(userID)) {
          skipped++;
          continue;
        }

        // Change nickname
        await new Promise(done => {
          api.changeNickname(TARGET_NICKNAME, userID, threadID, (changeErr) => {
            if (!changeErr) success++;
            done();
          });
        });

        // Small delay to avoid detection
        await new Promise(done => setTimeout(done, NICK_DELAY));
      }

      resolve({ success, skipped, total: members.length });
    });
  });
}

// ✅ AUTO-REVERT WHEN SOMEONE CHANGES A NICKNAME
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData } = event;
    if (!threadID || !IS_LOCKED[String(threadID)]) return;

    const botID = api.getCurrentUserID();

    if (logMessageType === "log:user-nickname") {
      const { participantID, nickname } = logMessageData;

      // Skip if bot or admin changed it
      if (participantID === botID || isAdmin(participantID)) return;

      // Revert if not the target nickname
      if (nickname !== TARGET_NICKNAME) {
        setTimeout(() => {
          api.changeNickname(TARGET_NICKNAME, participantID, threadID, () => {});
        }, REVERT_DELAY);
      }
    }
  } catch (err) {
    console.log("[NLC Event Error]:", err);
  }
};

// ✅ COMMANDS
module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID } = event;
  const tid = String(threadID);

  if (!isAdmin(senderID)) {
    return api.sendMessage("❌ You are not allowed to use this command!", tid);
  }

  const action = (args[0] || "").toLowerCase();

  if (action === "on") {
    IS_LOCKED[tid] = true;
    return api.sendMessage(
`👑 NLC! ACTIVATED ✅
📌 GC: ${tid}
👑 Nickname: "${TARGET_NICKNAME}"
🛡️ Auto-revert: 2 seconds
💡 Use: nlc setall`, tid);
  }

  if (action === "off") {
    IS_LOCKED[tid] = false;
    return api.sendMessage("👑 NLC — DEACTIVATED ✅", tid);
  }

  if (action === "setall") {
    api.sendMessage("⏳ Please wait... updating nicknames", tid);

    const result = await setAllNicknames(api, tid);

    return api.sendMessage(
`👑 NLC — DONE ✅
👑 Nickname: "${TARGET_NICKNAME}"
✅ Updated: ${result.success} members
⏭️ Skipped: ${result.skipped}
👥 Total: ${result.total}`, tid);
  }

  // Show commands
  return api.sendMessage(
`👑 NLC COMMANDS:
nlc on — Turn nickname lock ON
nlc off — Turn nickname lock OFF
nlc setall — Set EVERYONE'S nickname now ✅`, tid);
};
            
