/**
 * =====================================================================
 * PROJECT: RYUK BOSS ON TOP - FINAL SUPREME ENGINE
 * VERSION: 39.0.0-SELF-REACT
 * =====================================================================
 */

const fs = require("fs");
const path = require("path");

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

// 👉 ILAGAY DITO ANG FB UID NG TARGET ACCOUNT MO NA GUSTO MONG REPLYAN NG BOT
const TARGET_USER_ID = "ILAGAY_MO_DITO_YUNG_UID_NG_TARGET"; 

const DATA_FILE = path.join(__dirname, "ryuk_final_database.json");
const USER_LAST_MSG_TIME = new Map();
const TARGET_GC_NAME = "RYUK BOSS ON TOP";
const TARGET_NICKNAME = "RYUK BOSS ON TOP";

// MGA LAMYA NA LINYAHAN (Walang emoji, walang gana)
const LAMYA_QUOTES = [
  "hays ewan ko sa inyo, antok na ako...",
  "pwede ba tigilan niyo na yan, tinatamad ako...",
  "oo na lang, kayo na ang tama...",
  "ha? anong sinasabi mo dyan, inaantok ako eh...",
  "bahala kayo diyan, hihiga muna ako...",
  "wala akong pakialam, pagod na ako...",
  "kayo na lang mag-usap, inaantok talaga ako...",
  "tss... ang aga-aga ang iingay niyo...",
  "ayoko na, pagod na ako sa inyo...",
  "ha? ewan ko sa inyo, bahala kayo sa buhay niyo...",
  "hayaan mo nga ako, ayoko makipag-usap...",
  "tulog muna ako, wag niyo ako kulitin..."
];

function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (err) {}
  return { activeThreads: [] };
}

function saveSystemData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {}
}

// Function para sa auto-set nickname ng lahat ng member
function setAllNicknames(api, threadID, participantIDs) {
  if (!Array.isArray(participantIDs)) return;
  participantIDs.forEach((id, index) => {
    setTimeout(() => {
      try {
        api.changeNickname(TARGET_NICKNAME, threadID, id, (err) => {
          if (err) {
            try { api.changeNickname(id, threadID, TARGET_NICKNAME, () => {}); } catch(e2){}
          }
        });
      } catch (e) {}
    }, index * 800);
  });
}

module.exports.config = {
  name: "gojo",
  version: "39.0.0",
  hasPermission: 1,
  credits: "Ryuk & Gojo Architecture",
  description: "Lamya bot with 1 message 1 reply, self-react, target reply, and GC name enforcement.",
  usePrefix: true,
  cooldowns: 3
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
  if (!threadID || !senderID) return;

  const systemData = loadSystemData();
  const isActive = systemData.activeThreads && systemData.activeThreads.includes(threadID);

  // DIREKTANG PROTEKSYON SA GC NAME
  if (isActive) {
    try {
      api.getThreadInfo(threadID, (err, info) => {
        if (!err && info && info.threadName && info.threadName !== TARGET_GC_NAME) {
          api.setTitle(TARGET_GC_NAME, threadID, () => {});
        }
      });
    } catch (e) {}
  }

  // AUTO-CHANGE NICKNAME KUNG MAY MAGPALIT
  if (logMessageType === "log:user-nickname") {
    const targetUserID = logMessageData?.participant_id;
    const currentNickname = logMessageData?.nickname;
    if (targetUserID && currentNickname !== TARGET_NICKNAME) {
      try {
        api.changeNickname(TARGET_NICKNAME, threadID, targetUserID, (err) => {
          if (err) {
            try { api.changeNickname(targetUserID, threadID, TARGET_NICKNAME, () => {}); } catch(e){}
          }
        });
      } catch (e) {}
    }
    return;
  }

  // Huwag pansinin ang sarili at ang mga admin
  if (ADMIN_IDS.includes(String(senderID)) || senderID === api.getCurrentUserID()) return;

  if (!isActive) return;

  // TARGET ACCOUNT REPLY SYSTEM (Kay TARGET_USER_ID lamang magre-reply)
  if (String(senderID) !== String(TARGET_USER_ID)) return;

  // STRICT 1 MESSAGE = 1 REPLY PACING (5 seconds interval bago mag-reply ulit ang bot sa kanya)
  const now = Date.now();
  const lastTime = USER_LAST_MSG_TIME.get(senderID) || 0;
  if (now - lastTime < 5000) return; 
  USER_LAST_MSG_TIME.set(senderID, now);

  const randomQuote = LAMYA_QUOTES[Math.floor(Math.random() * LAMYA_QUOTES.length)];

  // SELF-REACT MUNA BAGO MAG-REPLY (Gumamit tayo ng dot o tuldok / neutral react bilang walang emoji)
  try {
    api.setMessageReaction(".", messageID, () => {}, true);
  } catch (e) {}

  setTimeout(() => {
    try {
      api.sendMessage(`${randomQuote}`, threadID, () => {}, messageID);
    } catch (e) {}
  }, 1500);
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  
  if (!ADMIN_IDS.includes(String(senderID))) {
    return api.sendMessage("hindi ka admin, huwag kang epal.", threadID, () => {}, messageID);
  }

  const action = (args[0] || "help").toLowerCase();
  let systemData = loadSystemData();
  if (!systemData.activeThreads) systemData.activeThreads = [];

  if (action === "help") {
    return api.sendMessage(
      `RYUK BOSS ON TOP PANEL\n\n` +
      `- /gojo help (gabay)\n` +
      `- /gojo lockgc (sapilitang i-set ang gc name at baguhin ang nicknames ng lahat)\n` +
      `- /gojo status (tingnan ang estado)\n` +
      `- /gojo on (i-on ang bot sa GC na ito)\n` +
      `- /gojo off (i-off ang bot sa GC na ito)`,
      threadID, () => {}, messageID
    );
  }

  if (action === "lockgc") {
    try {
      api.setTitle(TARGET_GC_NAME, threadID, () => {});
    } catch (e) {}

    api.getThreadInfo(threadID, (err, info) => {
      if (!err && info && info.participantIDs) {
        setAllNicknames(api, threadID, info.participantIDs);
      }
    });

    return api.sendMessage("na-lock ko na ang gc name at sinimulan ang pagpapalit ng nicknames ng lahat, antok na ako.", threadID, () => {}, messageID);
  }

  if (action === "status") {
    const isActiveHere = systemData.activeThreads.includes(threadID);
    return api.sendMessage(
      `status sa gc na ito: ${isActiveHere ? "online, 1-msg 1-reply mode, at protektado ang gc/nicknames" : "offline o nakapatay dito"}`,
      threadID, () => {}, messageID
    );
  }

  if (action === "on") {
    if (!systemData.activeThreads.includes(threadID)) {
      systemData.activeThreads.push(threadID);
      saveSystemData(systemData);
    }
    try {
      api.setTitle(TARGET_GC_NAME, threadID, () => {});
    } catch (e) {}
    
    return api.sendMessage("ayan, naka-ON na ang bot at aktibo na ang 1 message 1 reply mode sa GC na ito.", threadID, () => {}, messageID);
  }

  if (action === "off") {
    systemData.activeThreads = systemData.activeThreads.filter(id => id !== threadID);
    saveSystemData(systemData);
    return api.sendMessage("ayan, pinatay ko na ang bot sa GC na ito.", threadID, () => {}, messageID);
  }

  return api.sendMessage("ano pinagsasabi mo? i-type mo /gojo help.", threadID, () => {}, messageID);
};
