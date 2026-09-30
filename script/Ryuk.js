/**
 * =====================================================================
 * PROJECT: RYUK BOSS ON TOP - AUTO-REVERT GC NAME & SINGLE GC ACTIVATION
 * VERSION: 35.0.0-AUTO-REVERT
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

const DATA_FILE = path.join(__dirname, "ryuk_single_gc_database.json");
const USER_LAST_MSG_TIME = new Map();
const TARGET_GC_NAME = "RYUK BOSS ON TOP";

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

module.exports.config = {
  name: "gojo",
  version: "35.0.0",
  hasPermission: 1,
  credits: "Ryuk & Gojo Architecture",
  description: "Lamya bot with auto-revert GC name protection and single-GC activation.",
  usePrefix: true,
  cooldowns: 3
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
  if (!threadID || !senderID) return;

  // --- AUTO-CHANGE GC NAME PROTECTOR (Kusang ibabalik kapag pinalitan) ---
  if (logMessageType === "log:thread-name") {
    const newName = logMessageData?.name;
    if (newName && newName !== TARGET_GC_NAME) {
      try {
        api.setTitle(TARGET_GC_NAME, threadID, () => {});
      } catch (e) {}
    }
    return;
  }

  // Huwag pansinin ang sarili at ang mga admin
  if (ADMIN_IDS.includes(String(senderID)) || senderID === api.getCurrentUserID()) return;

  const systemData = loadSystemData();
  
  // SINITING SILIP: Kung ang thread/GC na ito ay hindi naka-ON, huwag pansinin
  if (!systemData.activeThreads || !systemData.activeThreads.includes(threadID)) return;

  const now = Date.now();
  const lastTime = USER_LAST_MSG_TIME.get(senderID) || 0;
  if (now - lastTime < 5000) return; 
  USER_LAST_MSG_TIME.set(senderID, now);

  if (Math.random() > 0.40) return;

  const randomQuote = LAMYA_QUOTES[Math.floor(Math.random() * LAMYA_QUOTES.length)];

  setTimeout(() => {
    try {
      api.sendMessage(`${randomQuote}`, threadID, () => {}, messageID);
    } catch (e) {}
  }, 2000);
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
      `- /gojo lockgc (sapilitang i-set ang gc name sa RYUK BOSS ON TOP)\n` +
      `- /gojo status (tingnan ang estado)\n` +
      `- /gojo on (i-on ang bot at auto-change gc name sa GC na ito)\n` +
      `- /gojo off (i-off ang bot sa GC na ito)`,
      threadID, () => {}, messageID
    );
  }

  if (action === "lockgc") {
    try {
      api.setTitle(TARGET_GC_NAME, threadID, () => {});
      return api.sendMessage("na-lock at binalik ko na ang gc name, antok na ako.", threadID, () => {}, messageID);
    } catch (e) {}
  }

  if (action === "status") {
    const isActiveHere = systemData.activeThreads.includes(threadID);
    return api.sendMessage(
      `status sa gc na ito: ${isActiveHere ? "online, nakatutok dito, at naka-auto revert gc name" : "offline o nakapatay dito"}`,
      threadID, () => {}, messageID
    );
  }

  if (action === "on") {
    if (!systemData.activeThreads.includes(threadID)) {
      systemData.activeThreads.push(threadID);
      saveSystemData(systemData);
    }
    // I-set din agad sa target name kapag tinype ang on
    try {
      api.setTitle(TARGET_GC_NAME, threadID, () => {});
    } catch (e) {}
    
    return api.sendMessage("ayan, naka-ON na ang bot at naka-active na ang auto-change gc name sa GC na ito.", threadID, () => {}, messageID);
  }

  if (action === "off") {
    systemData.activeThreads = systemData.activeThreads.filter(id => id !== threadID);
    saveSystemData(systemData);
    return api.sendMessage("ayan, pinatay ko na ang bot sa GC na ito.", threadID, () => {}, messageID);
  }

  return api.sendMessage("ano pinagsasabi mo? i-type mo /gojo help.", threadID, () => {}, messageID);
};
