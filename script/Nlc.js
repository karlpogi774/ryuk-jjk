const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const TARGET_NICKNAME = "RYUK POGI ON TOP";
const NICK_DELAY = 500;

function isAdmin(id) {
  return ADMIN_IDS.includes(String(id).trim());
}

module.exports.config = {
  name: "nlc",
  aliases: ["nicklock"],
  version: "1.4.0",
  description: "Set all nicknames",
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID } = event;

  if (!isAdmin(senderID)) {
    return api.sendMessage("❌ Only admin can use this!", threadID);
  }

  const action = (args[0] || "").toLowerCase();

  if (action === "setall") {
    api.sendMessage("⏳ Working... please wait", threadID);
    
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.sendMessage("❌ Cannot get group info. Make sure bot is in this GC.", threadID);
      }

      const members = info.participantIDs || [];
      const botID = api.getCurrentUserID();
      let success = 0;
      let skipped = 0;

      for (const userID of members) {
        if (userID === botID || isAdmin(userID)) {
          skipped++;
          continue;
        }

        await new Promise(done => setTimeout(done, NICK_DELAY));
        
        api.changeNickname(TARGET_NICKNAME, userID, threadID, (changeErr) => {
          if (!changeErr) success++;
        });
      }

      api.sendMessage(
`✅ DONE!
Changed: ${success} members
Skipped: ${skipped} (admin/bot)`, threadID);
    });
    return;
  }

  api.sendMessage(
`👑 NICKNAME COMMAND
Usage: /nlc setall

⚠️ IMPORTANT:
• Bot MUST be an ADMIN in this group
• Bot cannot change its own nickname
• Some members may have restricted nickname settings by Facebook`, threadID);
};
