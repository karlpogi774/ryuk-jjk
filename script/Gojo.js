const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 GOJO BOT V9.1 | INFINITY FRAMEWORK 👑
// LAHAT NG ADMIN ID NAKALAGAY ✅
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const DATA_FILE = path.join(__dirname, "gojo_exact_data.json");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  totalReplies: 0
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN_MESSAGES = 5000;

// ==========================================
// 🔐 ADMIN CHECK — LAHAT MAY ACCESS
// ==========================================
function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

// ==========================================
// GOJO QUOTES
// ==========================================

const GOJO_QUOTES = [
  "Sa buong langit at lupa, ako lamang ang nag-iisang Honored One. ♾️",
  "Infinity ang pagitan natin. Hindi mo ako maaabot. 😎",
  "Domain Expansion: Infinite Void. 🌌",
  "Relax ka lang. Nandito na ang pinakamalakas. 💙",
  "Isang mensahe, isang sagot. Walang doble-doble.",
  "Masyado kang mabagal para sa Infinity ko. ⚡",
  "Hindi ako nagyayabang. Sinasabi ko lang ang katotohanan. 😏",
  "Six Eyes activated. Walang nakakalusot sa paningin ko. 👁️",
  "Kalmado lang. Gojo Satoru ang kausap mo. ♾️",
  "Walang challenge na hindi kayang harapin ng pinakamalakas.",
  "Your move. Ako na ang bahala sa reply. 😎",
  "Kahit gaano ka pa kabilis, Infinity pa rin ang haharapin mo.",
  "Walang drama. Isang reply lang, sapat na. 😂",
  "Nasa ibang level ang laro ko. 🌌",
  "Sige lang, mag-message ka. May sagot ako diyan. 😆",
  "Relax. Hindi pa nga ako seryoso. 💙",
  "Ang lakas mo naman... sa chat. 😂",
  "Infinite Void: loading your thoughts... 🌌",
  "Hindi lahat ng tahimik ay talo. Minsan, nag-iisip lang ng reply.",
  "Gojo mode: ON. ♾️",
  "Walang duplicate reply dito. Unique ang bawat galaw.",
  "Sino'ng nagsabing kailangan kong mag-effort? 😏",
  "Isang tingin lang, alam ko nang may bagong message. 👁️",
  "Infinity never sleeps. Pero ako, minsan kailangan din magpahinga. 😂",
  "Ang bilis mo mag-chat. Hinay-hinay lang, boss. 😆",
  "Sige, noted. Pero Gojo pa rin ang pinakamalakas. ♾️",
  "May bagong message? Hayaan mong sagutin ng legend.",
  "Ang buhay ay parang Infinite Void. Maraming iniisip, walang katapusan.",
  "Kaya kong sagutin 'yan. Pero kaya mo bang tanggapin? 😎",
  "System online. Gojo is watching. 👁️"
];

// ==========================================
// DATA MANAGEMENT
// ==========================================

function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (error) {
    console.error("[GOJO] Data load error:", error.message);
  }
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2),
      "utf8"
    );
    return true;
  } catch (error) {
    console.error("[GOJO] Data save error:", error.message);
    return false;
  }
}

// ==========================================
// HELPERS
// ==========================================

function randomQuote() {
  const index = Math.floor(Math.random() * GOJO_QUOTES.length);
  return GOJO_QUOTES[index];
}

function send(api, message, threadID, messageID) {
  return api.sendMessage(
    message,
    threadID,
    () => {},
    messageID
  );
}

function rememberMessage(messageID) {
  if (SEEN_MESSAGES.has(messageID)) return false;
  SEEN_MESSAGES.add(messageID);
  if (SEEN_MESSAGES.size > MAX_SEEN_MESSAGES) {
    const oldest = SEEN_MESSAGES.values().next().value;
    SEEN_MESSAGES.delete(oldest);
  }
  return true;
}

// ==========================================
// BOT CONFIG
// ==========================================

module.exports.config = {
  name: "gojo",
  version: "9.1.0",
  hasPermission: 0,
  credits: "Gojo Infinity Framework | 4 Admin ✅",
  description: "Gojo auto-reply, quotes, auto-react, all admin access",
  usePrefix: true,
  cooldowns: 2
};

// ==========================================
// HANDLE EVENT
// ==========================================

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID } = event;
    if (!threadID || !senderID || !messageID) return;

    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);

    // Ignore bot's own messages AND admin messages
    if (sender === botID || isAdmin(sender)) return;

    const data = loadSystemData();
    if (!data.active) return;
    if (!rememberMessage(String(messageID))) return;

    // Auto reaction
    if (data.autoReact) {
      try {
        api.setMessageReaction("😆", messageID, () => {}, true);
      } catch (e) { console.error("[GOJO] React error:", e.message); }
    }

    // Cooldown
    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const lastTime = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - lastTime < 3000) return;
    USER_COOLDOWN.set(cooldownKey, now);

    // Typing
    if (typeof api.sendTypingIndicator === "function") {
      try { api.sendTypingIndicator(threadID, () => {}); } catch (_) {}
    }

    const delay = Math.max(0, Math.min(Number(data.delay) || 2000, 10000));

    setTimeout(() => {
      const latestData = loadSystemData();
      if (!latestData.active) return;

      const reply = `♾️ [GOJO SATORU]\n\n${randomQuote()}`;
      
      api.sendMessage(reply, threadID, (error) => {
        if (error) {
          console.error("[GOJO] Send error:", error);
          return;
        }
        latestData.totalReplies = (latestData.totalReplies || 0) + 1;
        saveSystemData(latestData);
      }, messageID);
    }, delay);

  } catch (error) {
    console.error("[GOJO] Event error:", error);
  }
};

// ==========================================
// COMMAND RUNNER
// ==========================================

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();

  // HELP
  if (action === "help") {
    return send(api,
`🌌 GOJO INFINITY CONTROL PANEL 🌌

╭───「 COMMANDS 」
│
├ ♾️ /gojo help
│   Ipakita ang lahat ng commands
│
├ 📊 /gojo status
│   Tingnan ang bot status
│
├ 🚀 /gojo on
│   I-activate ang auto-reply
│
├ 🛑 /gojo off
│   I-disable ang auto-reply
│
├ 😆 /gojo reacton
│   I-on ang auto-reaction
│
├ 🔕 /gojo reactoff
│   I-off ang auto-reaction
│
├ 💬 /gojo quote
│   Random Gojo quote
│
╰──────────────

🔐 Admin access: 4 IDs registered ✅
♾️ GOJO SATORU: THE HONORED ONE`,
      threadID, messageID
    );
  }

  // STATUS
  if (action === "status") {
    return send(api,
`🌌 GOJO SYSTEM STATUS 🌌

╭───「 SYSTEM 」
│
├ 🤖 Auto Reply:
│   ${data.active ? "🟢 ONLINE" : "🔴 OFFLINE"}
│
├ ⏱️ Reply Delay:
│   ${data.delay} ms
│
├ 😆 Auto Reaction:
│   ${data.autoReact ? "🟢 ENABLED" : "🔴 DISABLED"}
│
├ 💬 Total Replies:
│   ${data.totalReplies || 0}
│
├ 🔐 Admin Count:
│   ${ADMIN_IDS.length} registered ✅
│
╰──────────────

🌌 Gojo Infinity Framework V9.1`,
      threadID, messageID
    );
  }

  // ADMIN-ONLY CONTROLS
  const adminActions = ["on", "off", "reacton", "reactoff"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return send(api, "⛔ Access denied. Admin lamang ang puwede.", threadID, messageID);
  }

  // TURN ON
  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`🚀 GOJO SYSTEM ACTIVATED!

♾️ Auto-reply: ON
⏱️ Delay: ${data.delay} ms
🌌 Infinity mode activated!`,
      threadID, messageID
    );
  }

  // TURN OFF
  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "🛑 GOJO SYSTEM DEACTIVATED!\n\nAuto-reply ay naka-off na.", threadID, messageID);
  }

  // AUTO REACTION ON
  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "😆 Auto-reaction activated!", threadID, messageID);
  }

  // AUTO REACTION OFF
  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "🔕 Auto-reaction disabled.", threadID, messageID);
  }

  // RANDOM QUOTE
  if (action === "quote") {
    return send(api, `♾️ [GOJO SATORU]\n\n${randomQuote()}`, threadID, messageID);
  }

  // UNKNOWN COMMAND
  return send(api, "⚠️ Unknown command.\n\nI-type ang /gojo help para makita.", threadID, messageID);
};
  
