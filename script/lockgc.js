const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 LOCK GC + NICK | POGI RYUK FINAL BOSS ✅
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817 ✅
// TARGET NAME: POGI RYUK FINAL BOSS ✅
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817" // ✅ Nailagay na!
];

// ✅ TARGET NAMES — HINDI MAPAPALITAN!
const targetNickname = "POGI RYUK FINAL BOSS";
const targetGCName = "POGI RYUK FINAL BOSS";

// ✅ CHECK ADMIN
function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

// ✅ I-SET LAHAT NG NICKNAME MAY DELAY — HINDI MA-DETECT
function setAllNicknamesWithDelay(api, threadID, members, name) {
  members.forEach((uid, index) => {
    setTimeout(() => {
      api.changeNickname(name, threadID, uid, () => {});
    }, index * 500); // 0.5s bawat isa — hindi mabilis, hindi mabagal
  });
}

module.exports.config = {
  name: "lockgc",
  version: "1.0.1",
  hasPermission: 0,
  credits: "RYUK — LOCKED ✅ 4 ADMIN COMPLETE",
  description: "Lock GC Name + All Nicknames → POGI RYUK FINAL BOSS",
  usePrefix: true,
  cooldowns: 2
};

// ==========================================
// HANDLE EVENT — AUTO-RESTORE KAPAG BINAGO ✅
// ==========================================
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData } = event;
  if (!threadID) return;

  // ✅ KAPAG MAY NAGPALIT NG NICKNAME — IBABALIK AGAD!
  if (logMessageType === "log:user-nickname") {
    const targetUserID = logMessageData.participant_id;
    const currentNickname = logMessageData.nickname;

    if (currentNickname !== targetNickname) {
      api.changeNickname(targetNickname, threadID, targetUserID, () => {});
      api.sendMessage("🛡️ Ibinalik agad! POGI RYUK FINAL BOSS ✅", threadID);
    }
    return;
  }

  // ✅ KAPAG MAY NAGPALIT NG GC NAME — IBABALIK AGAD!
  if (logMessageType === "log:thread-name") {
    api.setTitle(targetGCName, threadID, () => {});
    api.sendMessage("⚡ GC Name ibinalik! POGI RYUK FINAL BOSS ✅", threadID);
    return;
  }
};

// ==========================================
// COMMAND — /lockgc
// ==========================================
module.exports.run = async function ({ api, event, senderID, messageID }) {
  const threadID = event.threadID;

  // ✅ ADMIN LANG ANG PWEDE
  if (!isAdmin(senderID)) {
    return api.sendMessage("⛔ Admin lang ang puwede!", threadID, messageID);
  }

  // ✅ I-LOCK NA!
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

🛡️ Hindi na mapapalitan!
🔐 Admin: 4 registered ✅`,
      threadID, messageID
    );
    return api.setMessageReaction("🥷", messageID, threadID, () => {}, true);
  });
};
  
