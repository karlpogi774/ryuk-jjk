const fs = require("fs");
const path = require("path");

// ==========================================
// AUTO-WELCOME BOT — wc | LIHIM V1.1 ✅
// ✅ HINDI SASAGOT SA IBANG TAO — IKAW LANG!
// ✅ SA GC — MAGRE-REACT LANG, WALANG SAGOT!
// ✅ BATIIN LANG ANG BAGONG MIYEMBRO
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
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
const SEEN_COMMANDS = new Set();

function isAdmin(id) {
  return ADMIN_IDS.includes(String(id).trim());
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
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

function isGCActive(data, tid) {
  return data.activeGCs[String(tid)] === true;
}

function setGCActive(data, tid, status) {
  data.activeGCs[String(tid)] = status;
  saveData(data);
}

function getRandomWelcome() {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.config = {
  name: "wc",
  version: "1.1.0",
  hasPermission: 1,
  credits: "Auto-Welcome — Lihim V1.1",
  description: "✅ IKAW LANG ANG GUMAGAMIT | HINDI LUMALABAS SA LAHAT",
  usePrefix: true,
  cooldowns: 3
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData, isGroup, body } = event;
    if (!threadID) return;

    const tid = String(threadID);
    const botID = String(api.getCurrentUserID());
    const sender = String(senderID).trim();
    const msg = String(body || "").trim().toLowerCase();
    const data = loadData();

    // ✅ HANDLE COMMAND — HINDI SASAGOT SA IBANG TAO!
    if (msg.startsWith("wc") || msg.startsWith("/wc")) {
      const cmdKey = `${tid}:${messageID}`;
      if (SEEN_COMMANDS.has(cmdKey)) return;
      SEEN_COMMANDS.add(cmdKey);
      setTimeout(() => SEEN_COMMANDS.delete(cmdKey), 10000);

      if (!isAdmin(sender)) {
        // ❌ IBA — MAGRE-REACT LANG, WALANG SAGOT!
        if (isGroup) {
          setTimeout(() => {
            try { api.setMessageReaction("❌", messageID, () => {}, true); } catch {}
          }, getRandomDelay(1500, 2500));
        }
        return; // WALANG SAGOT!
      }

      // ✅ IKAW — SA GC: MAGRE-REACT LANG! SA PM: SASAGOT!
      if (isGroup) {
        setTimeout(() => {
          try { api.setMessageReaction("✅", messageID, () => {}, true); } catch {}
        }, getRandomDelay(1000, 2000));
        return; // WALANG SAGOT SA GC — LIHIM!
      }
    }

    // ✅ AUTO-WELCOME — BATIIN BAGONG MIYEMBRO
    if (logMessageType === "log:subscribe" && isGCActive(data, tid)) {
      const newUsers = logMessageData.addedParticipants || [];
      for (const user of newUsers) {
        const uid = String(user.userFbId || user.id);
        if (uid === botID) continue;
        
        const welcomeKey = `${tid}:${uid}`;
        if (WELCOMED_USERS.has(welcomeKey)) continue;
        WELCOMED_USERS.add(welcomeKey);
        setTimeout(() => WELCOMED_USERS.delete(welcomeKey), 3600000);
        
        setTimeout(() => {
          const name = user.fullName || "Bagong miyembro";
          api.sendMessage(
            `Maligayang pagdating, ${name}!\n\n${getRandomWelcome()}`,
            tid,
            () => {}
          );
        }, getRandomDelay(2000, 4000));
      }
    }
  } catch (e) {
    console.error("[wc] Error:", e.message);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID, isGroup } = event;
  const tid = String(threadID);
  const sender = String(senderID).trim();
  const action = (args[0] || "").toLowerCase();
  const data = loadData();

  // ✅ IKAW LANG ANG MAKAKAGAMIT
  if (!isAdmin(sender)) {
    if (isGroup) return; // SA GC — WALANG SAGOT!
    return api.sendMessage("❌ Hindi ikaw ang may-ari.", tid, messageID);
  }

  // ✅ SA GC — WALANG SAGOT SA COMMAND
  if (isGroup) {
    return; // TAHIMIK LANG — MAGRE-REACT NA SA HANDLE EVENT
  }

  // ✅ SA PM LANG LUMALABAS LAHAT
  if (action === "on") {
    setGCActive(data, tid, true);
    return api.sendMessage(
      "✅ wc ACTIVATED — Auto-Welcome ON\n\nBatiin na ang bagong miyembro dito.",
      tid,
      messageID
    );
  }

  if (action === "off") {
    setGCActive(data, tid, false);
    return api.sendMessage(
      "✅ wc DEACTIVATED — Auto-Welcome OFF",
      tid,
      messageID
    );
  }

  if (action === "status") {
    const active = isGCActive(data, tid);
    return api.sendMessage(
      "📊 wc STATUS\n\n" +
      "GC ID: " + tid + "\n" +
      "Status: " + (active ? "✅ ACTIVE" : "❌ INACTIVE") + "\n" +
      "Auto-Welcome: " + (active ? "✅ ON" : "❌ OFF"),
      tid,
      messageID
    );
  }

  // Help — SA PM LANG
  return api.sendMessage(
    "📋 wc COMMANDS\n\n" +
    "/wc on — I-on ang pagbati\n" +
    "/wc off — I-off ang pagbati\n" +
    "/wc status — Tingnan ang kalagayan\n\n" +
    "💡 Gamitin sa PM para makita ang sagot.\nSa GC — magre-react lang, walang lumalabas.",
    tid,
    messageID
  );
};
  
