const fs = require("fs");
const path = require("path");

// ==========================================
// AUTO-WELCOME BOT — NAME: wc
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// COMMAND: /wc on | /wc off | /wc status
// FUNCTION: BATIIN ANG BAGONG MIYEMBRO LANG
// WALANG GC LOCK, WALANG NICKNAME CHANGE
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const WELCOME_MESSAGES = [
  "Maligayang pagdating! Masaya kaming nandito ka.",
  "Kumusta at salamat sa pagsali sa amin.",
  "Maligayang pagdating! Sana mag-enjoy ka sa grupong ito.",
  "Salamat sa pagsali! Malugod ka naming tinatanggap.",
  "Bagong miyembro! Maligayang pagdating sa lahat.",
  "Maligayang pagdating! Nasa tamang lugar ka.",
  "Salamat sa pagsama! Masaya kaming nandagdag ka.",
  "Maligayang pagdating! Sana maging mabuting kasapi ka."
];

const DATA_FILE = path.join(__dirname, "wc_data.json");

const DEFAULT_DATA = {
  activeGCs: {},
  autoWelcome: true
};

const WELCOMED_USERS = new Set();

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (e) {
    console.error("[wc] Load error:", e.message);
  }
  return { ...DEFAULT_DATA };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("[wc] Save error:", e.message);
    return false;
  }
}

function isGCActive(data, threadID) {
  return data.activeGCs[String(threadID)] === true;
}

function setGCActive(data, threadID, status) {
  data.activeGCs[String(threadID)] = status;
  saveData(data);
}

function getRandomWelcome() {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
}

// ==========================================
// BOT NAME: wc — AUTO-WELCOME LANG
// ==========================================
module.exports.config = {
  name: "wc",
  version: "3.1.0",
  hasPermission: 1,
  credits: "Auto-Welcome Bot",
  description: "wc — Auto-Welcome new members",
  usePrefix: true,
  cooldowns: 3
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const data = loadData();
    const tid = String(threadID);
    const botID = String(api.getCurrentUserID());

    if (!isGCActive(data, tid)) return;

    // BATIIN ANG BAGONG MIYEMBRO LANG
    if (logMessageType === "log:subscribe") {
      if (!data.autoWelcome) return;
      
      const newUsers = logMessageData.addedParticipants || [];
      
      for (const user of newUsers) {
        const uid = String(user.userFbId || user.id);
        
        // Huwag batiin ang sariling bot
        if (uid === botID) continue;
        
        // Batiin lang ng isang beses
        const welcomeKey = `${tid}:${uid}`;
        if (WELCOMED_USERS.has(welcomeKey)) continue;
        WELCOMED_USERS.add(welcomeKey);
        
        // I-clear matapos ang 1 oras
        setTimeout(() => WELCOMED_USERS.delete(welcomeKey), 3600000);
        
        setTimeout(() => {
          const name = user.fullName || "Bagong miyembro";
          api.sendMessage(
            "Maligayang pagdating, " + name + "!\n\n" + getRandomWelcome(),
            tid,
            () => {}
          );
        }, 1500);
      }
    }
  } catch (e) {
    console.error("[wc] Error:", e.message);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const data = loadData();
  const tid = String(threadID);
  const action = (args[0] || "").toLowerCase();

  if (!isAdmin(senderID)) {
    return api.sendMessage("Access denied. Admin only.", tid, null, messageID);
  }

  if (action === "on") {
    setGCActive(data, tid, true);
    return api.sendMessage(
      "wc ACTIVATED — THIS GC ONLY\n\n" +
      "Auto-Welcome is now ON.\n" +
      "Will greet new members here.",
      tid, null, messageID
    );
  }

  if (action === "off") {
    setGCActive(data, tid, false);
    return api.sendMessage(
      "wc DEACTIVATED — THIS GC ONLY\n\n" +
      "Auto-Welcome is now OFF.",
      tid, null, messageID
    );
  }

  if (action === "status") {
    const active = isGCActive(data, tid);
    return api.sendMessage(
      "wc STATUS\n\n" +
      "GC ID: " + tid + "\n" +
      "Status: " + (active ? "ACTIVE" : "INACTIVE") + "\n" +
      "Auto-Welcome: " + (active ? "ON" : "OFF"),
      tid, null, messageID
    );
  }

  // Help message
  return api.sendMessage(
    "wc COMMANDS\n\n" +
    "/wc on\n" +
    "  Turn on Auto-Welcome in this GC\n\n" +
    "/wc off\n" +
    "  Turn off Auto-Welcome in this GC\n\n" +
    "/wc status\n" +
    "  Check current status\n\n" +
    "Note: Works only where you turn it on.",
    tid, null, messageID
  );
};
  
