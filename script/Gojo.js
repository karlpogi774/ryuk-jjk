const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — LOCK GC + NICK V1.2
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// TARGET NAME: RYUK POGI ON TOP ✅
// BOT NAME: ryuk ✅
// ==========================================

const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const targetNickname = "RYUK POGI ON TOP";
const targetGCName = "RYUK POGI ON TOP";

// ✅ MGA LINES — HINDI PAULIT-ULIT 😎
const LINES = [
  "👑 RYUK POGI ON TOP — walang makakatalo dito!",
  "⚡ GC LOCKED — pangalan ay hindi mapapalitan ng kahit sino!",
  "🔥 RYUK POGI — ang tunay na hari sa grupong ito!",
  "🛡️ LAKAS AT GWAPO — RYUK POGI ON TOP, walang duda!",
  "✨ Lahat ay RYUK POGI ON TOP — walang exempted dito!",
  "💪 Hindi mababago, hindi matitinag — RYUK POGI LANG!",
  "🥷 GC PROTECTED — subukan mo, ibabalik agad!",
  "👑 RYUK POGI ON TOP — pangalan na tatak sa isip niyo!",
  "⚡ Walang makakabago — dito, RYUK ang nasusunod!",
  "🔥 Naka-lock nang mahigpit — RYUK POGI ON TOP habang-buhay!",
  "💎 Pinakamaganda, pinakamakunat — RYUK POGI LANG YAN!",
  "🚀 RYUK POGI ON TOP — taas noo, walang aatras!",
  "🛡️ Bantay 24/7 — pag binago, ibabalik agad sayo!",
  "👑 Dito sa GC na ito — RYUK POGI lang ang bida!",
  "✨ Pangalan na sagrado — RYUK POGI ON TOP, walang iba!"
];

let lineIndex = 0;
function getNextLine() {
  const line = LINES[lineIndex];
  lineIndex = (lineIndex + 1) % LINES.length;
  return line;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

function setAllNicknamesWithDelay(api, threadID, members, name) {
  for (const uid of members) {
    api.changeNickname(name, threadID, uid, () => {});
  }
}

function getBotCache(api) {
  if (!global._botCache) global._botCache = {};
  return global._botCache;
}

module.exports = {
  config: {
    name: "ryuk",          // ✅ BOT NAME: ryuk (maliit lahat)
    version: "1.2.0",
    hasPermission: 2,
    credits: "ryuk",        // ✅ credits din ryuk
    description: "Lock GC & Nicks → RYUK POGI ON TOP",
    usePrefix: true,
    commandCategory: "Admin",
    usages: "/ryuk lock"    // ✅ command: /ryuk lock
  },

  onStart: async function ({ api, message, args, threadID, senderID }) {
    if (!ADMIN_IDS.has(senderID)) return;

    const threadStr = String(threadID);
    const messageID = message.messageID;

    // ✅ TYPING INDICATOR
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    if (args[0] === "lock") {
      // Set GC Name
      api.setTitle(targetGCName, threadID, () => {});

      // Set ALL members nickname
      api.getThreadInfo(threadID, async (err, info) => {
        if (err || !info) {
          return api.setMessageReaction("😋", messageID, threadStr, () => {}, true);
        }

        const participantIDs = info.participantIDs || [];
        setAllNicknamesWithDelay(api, threadID, participantIDs, targetNickname);

        // ✅ MAGLALAPAG NG LINE
        api.sendMessage(getNextLine(), threadID);

        return api.setMessageReaction("🥷", messageID, threadStr, () => {}, true);
      });
      return;
    }
  },

  onChat: async function ({ api, threadID, logMessageType, logMessageData }) {
    // ✅ AUTO-RESTORE NICK + LINE
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;

      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, () => {});
        api.sendMessage("🛡️ Ibinalik agad! " + getNextLine(), threadID);
      }
    }

    // ✅ AUTO-RESTORE GC NAME + LINE
    if (logMessageType === "log:thread-name") {
      api.setTitle(targetGCName, threadID, () => {});
      api.sendMessage("⚡ Sinubukan mong palitan! " + getNextLine(), threadID);
    }
  }
};
  
