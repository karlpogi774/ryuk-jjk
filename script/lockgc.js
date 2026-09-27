const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 LOCK GC + NICK | POGI RYUK FINAL BOSS ✅
// ADMIN IDs — TAMA ANG PAGKAKALAGAY ✅
// ==========================================

const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const targetNickname = "POGI RYUK FINAL BOSS";
const targetGCName = "POGI RYUK FINAL BOSS";

// ✅ TAMA ANG PAGKAKUMBARA — LAGING STRING
function isAdmin(senderID) {
  return ADMIN_IDS.has(String(senderID).trim());
}

function setAllNicknamesWithDelay(api, threadID, members, name) {
  members.forEach((uid, index) => {
    setTimeout(() => {
      api.changeNickname(name, threadID, uid, () => {});
    }, index * 500);
  });
}

module.exports.config = {
  name: "lockgc",
  version: "1.0.2",
  hasPermission: 0,
  credits: "RYUK — ADMIN CHECK FIXED ✅",
  description: "Lock GC Name + All Nicknames → POGI RYUK FINAL BOSS",
  usePrefix: true,
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData } = event;
  if (!threadID) return;

  if (logMessageType === "log:user-nickname") {
    const targetUserID = logMessageData.participant_id;
    const currentNickname = logMessageData.nickname;

    if (currentNickname !== targetNickname) {
      api.changeNickname(targetNickname, threadID, targetUserID, () => {});
      api.sendMessage("🛡️ Ibinalik agad! POGI RYUK FINAL BOSS ✅", threadID);
    }
    return;
  }

  if (logMessageType === "log:thread-name") {
    api.setTitle(targetGCName, threadID, () => {});
    api.sendMessage("⚡ GC Name ibinalik! POGI RYUK FINAL BOSS ✅", threadID);
    return;
  }
};

module.exports.run = async function ({ api, event, senderID, messageID }) {
  const threadID = event.threadID;

  // ✅ PARA MAKITA MO KUNG ANONG ID ANG NAGBABALIK
  console.log("[lockgc] Sender ID received:", senderID, "→ String:", String(senderID));
  console.log("[lockgc] Is Admin?", isAdmin(senderID));

  if (!isAdmin(senderID)) {
    return api.sendMessage(
      `⛔ HINDI TUMUGMA!\n\nID mo: ${senderID}\nSiguraduhin na tama ang nakalagay!`,
      threadID,
      messageID
    );
  }

  api.setTitle(targetGCName, threadID, () => {});

  api.getThreadInfo(threadID, async (err, info) => {
    if (err || !info) {
      return api.setMessageReaction("😋", messageID, threadID, () => {}, true);
    }

    const participantIDs = info.participantIDs || [];
    setAllNicknamesWithDelay(api, threadID, participantIDs, targetNickname);

    api.sendMessage(
`🔒 LOCKED NA! ✅

👑 GC Name: ${targetGCName}
👤 Lahat Nickname: ${targetNickname}

🛡️ Hindi na mapapalitan!`,
      threadID,
      messageID
    );
    return api.setMessageReaction("🥷", messageID, threadID, () => {}, true);
  });
};
      
