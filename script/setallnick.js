const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817",
  "61595507156493"
];

module.exports = {
  config: {
    name: "setallnick",
    version: "1.0.0",
    hasPermssion: 1,
    hasPermission: 1,
    role: 0,
    credits: "Jehosh",
    description: "I-set ang nickname ng lahat ng members sa GC",
    usePrefix: true,
    prefix: true,
    commandCategory: "admin",
    category: "admin",
    usages: "/setallnick <bagong nickname>",
    cooldowns: 5,
    countDown: 5
  },

  onStart: async function (context) {
    const { api, event, args } = context;
    const { threadID, messageID, senderID } = event;

    // Admin Verification Check
    if (!ADMIN_IDS.includes(String(senderID))) {
      return api.sendMessage("⚠️ Admin lang ang pwedeng gumamit ng command na ito.", threadID, messageID);
    }

    const newNickname = args.join(" ");
    if (!newNickname) {
      return api.sendMessage("⚠️ Maglagay ng nickname na gustong i-set sa lahat!\n\nHalimbawa:\n/setallnick Member", threadID, messageID);
    }

    try {
      // Kunin ang impormasyon ng GC
      const threadInfo = await new Promise((resolve, reject) => {
        api.getThreadInfo(threadID, (err, info) => {
          if (err) reject(err);
          else resolve(info);
        });
      });

      const participantIDs = threadInfo.participantIDs || [];
      api.sendMessage(`⏳ Sinu-simulan na ang pagpapalit ng nickname ng ${participantIDs.length} members sa "${newNickname}"...`, threadID, messageID);

      let count = 0;
      for (const uid of participantIDs) {
        // Paunti-unting pagpapalit para maiwasan ang rate limit ng FB
        await new Promise((resolve) => setTimeout(resolve, 1000));
        api.changeNickname(newNickname, threadID, uid, (err) => {
          if (!err) count++;
        });
      }

      setTimeout(() => {
        api.sendMessage(`✅ Tapos na! Nao-update na ang nickname ng mga members sa GC.`, threadID);
      }, participantIDs.length * 1000 + 2000);

    } catch (err) {
      console.error("Error in setallnick:", err);
      return api.sendMessage("❌ Nagka-error sa pagkuha ng member list ng GC.", threadID, messageID);
    }
  },

  run: async function (api, event, args) {
    if (typeof api === "object" && api.api && api.event) {
      return this.onStart(api);
    }
    return this.onStart({ api, event, args });
  }
};
