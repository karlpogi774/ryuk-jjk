const fs = require("fs");
const path = require("path");

// ==============================================
// ADMIN LIST — LAHAT NG ID MO
// ==============================================
const ADMINS = [
  "61594055835097",   // Admin 1
  "61593892603402",   // Admin 2
  "61594325727109",   // Admin 3
  "61594022290817"    // Admin 4
];

// Check kung admin ang nag-utos
function isAdmin(userId) {
  return ADMINS.includes(userId);
}

module.exports.config = {
  name: "activate",
  version: "1.3.0",
  hasPermission: 0,
  credits: "sinzu + updated",
  description: "24-hour global auto-roast (ADMIN-ONLY control). Gumagana sa private at GC.",
  usePrefix: true,
  commandCategory: "Fun",
  usages: "/activate on — start 24h global auto-roast\n/activate off — stop\n/activate status — check time",
  cooldowns: 5
};

const DATA_PATH = path.join(__dirname, "activate_data.json");

// English roasts
const ROASTS = [
  "Bro really thought that message was necessary 💀",
  "The confidence… the delusion… unmatched.",
  "Say less, we already lost brain cells reading that.",
  "You typed all that just to embarrass yourself?",
  "Main character energy but the plot is mid.",
  "Who hurt you? Because that sentence hurt all of us.",
  "Please stop before the group chat files a restraining order.",
  "You really just said that out loud… in text… permanently.",
  "The audacity is loud but the intelligence is on mute.",
  "This is why group chats need a mute button for specific people.",
  "Bro woke up and chose violence against the English language.",
  "I’m not even mad, I’m just disappointed… and second-hand embarrassed.",
  "Your message just aged like milk left in the sun.",
  "Somewhere a grammar teacher is crying.",
  "This energy is giving ‘I peaked in high school’.",
  "You dropped that like it was fire. It was not.",
  "The group chat was peaceful until you arrived.",
  "Please log off for the sake of everyone’s mental health.",
  "That was a choice… a bold, terrible choice.",
  "I’m taking notes on how not to communicate."
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch {}
  return { expires: 0, activatedBy: null };
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function isActive() {
  const data = loadData();
  return data.expires && data.expires > Date.now();
}

function getRemaining() {
  const data = loadData();
  if (!data.expires) return 0;
  const left = data.expires - Date.now();
  return left > 0 ? left : 0;
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body } = event;

  // Ignore commands & sariling mensahe
  if (!body || body.startsWith("/") || senderID === api.getCurrentUserID()) return;
  // Huwag i-roast ang mga admin
  if (isAdmin(senderID)) return;

  if (!isActive()) return;

  // Random 4–7 roasts
  const count = Math.floor(Math.random() * 4) + 4;
  const shuffled = [...ROASTS].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  for (let i = 0; i < selected.length; i++) {
    setTimeout(() => {
      api.sendMessage(selected[i], threadID);
    }, i * 800);
  }
};

// ===== COMMAND =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const sub = (args[0] || "").toLowerCase();

  // --- ON/OFF = ADMIN LANG ---
  if (sub === "on") {
    if (!isAdmin(senderID)) {
      return api.sendMessage("❌ | Admin lang ang pwedeng magbukas nito!", threadID, messageID);
    }
    const data = loadData();
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    data.expires = expires;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);

    return api.sendMessage(
      `🔥 GLOBAL AUTO-ROAST: ON ✅\n\n` +
      `⏳ Tagal: 24 oras\n` +
      `📍 Sa lahat ng GC at Private Chat\n` +
      `Gamitin ang /activate off para itigil agad.`,
      threadID,
      messageID
    );
  }

  if (sub === "off") {
    if (!isAdmin(senderID)) {
      return api.sendMessage("❌ | Admin lang ang pwedeng magpatay nito!", threadID, messageID);
    }
    const data = loadData();
    if (isActive()) {
      data.expires = 0;
      saveData(data);
      return api.sendMessage("✅ Global auto-roast: OFF", threadID, messageID);
    }
    return api.sendMessage("Auto-roast ay hindi kasalukuyang nakabukas.", threadID, messageID);
  }

  // Status — pwedeng lahat
  if (sub === "status") {
    const left = getRemaining();
    if (left <= 0) {
      return api.sendMessage("🔥 Global Auto-roast: OFF", threadID, messageID);
    }
    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return api.sendMessage(
      `🔥 Global Auto-roast: ACTIVE ✅\n⏳ Natitirang oras: ${hours}h ${mins}m`,
      threadID,
      messageID
    );
  }

  // Walang tamang utos
  return api.sendMessage(
    `📋 Gamitin:\n` +
    `/activate on   → Simulan (Admin Only)\n` +
    `/activate off  → Itigil (Admin Only)\n` +
    `/activate status → Tingnan kung buhay`,
    threadID,
    messageID
  );
};
                                             
