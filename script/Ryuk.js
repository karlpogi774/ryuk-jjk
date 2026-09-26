const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — DOMAIN EXPANSION ✅
// ADMIN IDs: 61594055835097, 61593892603402
// 61594325727109, 61594022290817
// TARGET: DOMAIN EXPANSION NI RYUK ✅
// ✅ AUTO-BALIK KAPAG PALITAN | GC + NICK
// ✅ Anti-Spam | Auto Self-React | Roast
// ==========================================

const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const targetNickname = "DOMAIN EXPANSION NI RYUK";
const targetGCName = "DOMAIN EXPANSION NI RYUK";

module.exports.config = {
  name: "activate",
  version: "3.0.0",
  hasPermission: 2,
  credits: "sinzu / ryuk — DOMAIN EXPANSION ✅",
  description: "DOMAIN EXPANSION NI RYUK | Auto-Roast | Anti-Spam | Auto-Lock",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on | off | status | setnick | setgname",
  cooldowns: 5
};

const DATA_PATH = path.join(__dirname, "activate_data.json");

// Emojis for auto self-react
const REACT_EMOJIS = ["🔥", "💀", "🤣", "😆", "🤡", "👎", "🥷", "⚡", "☄️"];

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
  "I’m taking notes on how not to communicate.",
  "😂 Try changing it — DOMAIN EXPANSION NI RYUK will return!",
  "🤣 You can try but you can't escape the Domain Expansion!",
  "⚡ Nothing escapes my Domain — it always comes back!",
  "☄️ You thought you could change it? Nice try 😂"
];

function isAdmin(senderID) {
  return ADMIN_IDS.has(String(senderID));
}

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch {}
  return { active: false, activatedBy: null };
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function isActive() {
  const data = loadData();
  return data.active === true;
}

async function setAllNicknamesWithDelay(api, threadID, participantIDs, name) {
  let success = 0, failed = 0;
  const botID = String(api.getCurrentUserID());

  for (const userID of participantIDs) {
    if (String(userID) === botID) continue;
    await new Promise(resolve => setTimeout(resolve, 600));
    api.changeNickname(name, threadID, userID, (err) => {
      if (err) failed++;
      else success++;
    });
  }
  return { success, failed };
}

// Anti-spam tracker
const isProcessing = new Set();
  // ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, logMessageType, logMessageData, messageID } = event;
  if (!threadID) return;

  const botID = String(api.getCurrentUserID());
  const threadStr = String(threadID);

  // ======================================
  // AUTO-BALIK NICKNAME KAPAG PALITAN ✅
  // ======================================
  if (logMessageType === "log:user-nickname") {
    const targetUserID = logMessageData.participant_id;
    const currentNickname = logMessageData.nickname;

    if (String(targetUserID) === botID) return;

    if (currentNickname !== targetNickname) {
      api.changeNickname(targetNickname, threadID, targetUserID, () => {
        const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
        api.sendMessage(`🛡️ ${roast}\nDOMAIN EXPANSION NI RYUK RESTORED! ⚡`, threadID);
      });
    }
    return;
  }

  // ======================================
  // AUTO-BALIK GC NAME KAPAG PALITAN ✅
  // ======================================
  if (logMessageType === "log:thread-name") {
    api.setTitle(targetGCName, threadID, () => {
      const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
      api.sendMessage(`⚡ ${roast}\nGC NAME RESTORED: DOMAIN EXPANSION NI RYUK ✅`, threadID);
    });
    return;
  }

  // Anti-Spam & Validation
  if (!body || body.startsWith("/") || senderID === botID) return;
  if (!isActive()) return;
  if (isProcessing.has(threadID)) return;
  isProcessing.add(threadID);

  try {
    const randomRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
    const randomEmoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];

    api.sendMessage(randomRoast, threadID, (err, info) => {
      if (!err && info && info.messageID) {
        api.setMessageReaction(randomEmoji, info.messageID, (reactErr) => {
          if (reactErr) console.error("Self-react error:", reactErr);
        }, true);
      }
      isProcessing.delete(threadID);
    });
  } catch (error) {
    console.error("Auto-roast error:", error);
    isProcessing.delete(threadID);
  }
};
// ===== COMMAND HANDLER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const threadStr = String(threadID);
  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  // ADMIN CHECK
  if (["on", "off", "status", "setnick", "setgname"].includes(sub) && !isAdmin(senderID)) {
    return api.sendMessage("⛔ Admin only — DOMAIN EXPANSION NI RYUK 😂", threadID, messageID);
  }

  // Turn ON
  if (sub === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);

    return api.sendMessage(
      `🔥 DOMAIN EXPANSION NI RYUK: ACTIVATED ♾️\n\n` +
      `Duration: INFINITE ♾️\n` +
      `Features: Anti-Spam ✅ | Auto Self-React ✅ | Auto-Lock GC+Nick ✅\n` +
      `Target: DOMAIN EXPANSION NI RYUK ✅\n` +
      `Use /activate off to stop.`,
      threadID,
      messageID
    );
  }

  // Turn OFF
  if (sub === "off") {
    data.active = false;
    saveData(data);
    return api.sendMessage("✅ DOMAIN EXPANSION deactivated.", threadID, messageID);
  }

  // Check Status
  if (sub === "status") {
    if (!data.active) {
      return api.sendMessage("DOMAIN EXPANSION is currently OFF.", threadID, messageID);
    }
    return api.sendMessage(
      `🔥 DOMAIN EXPANSION NI RYUK — ACTIVE ♾️\nAnti-Spam ✅ | Self-React ✅ | Auto-Restore ✅\nTarget: DOMAIN EXPANSION NI RYUK ✅`,
      threadID,
      messageID
    );
  }

  // SETNICK — Eksakto sa istruktura mo ✅
  if (sub === "setnick") {
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    api.setTitle(targetGCName, threadID, () => {});

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.setMessageReaction("😋", messageID, threadStr, () => {}, true);
      }

      const participantIDs = info.participantIDs || [];
      api.sendMessage(`⏳ Deploying DOMAIN EXPANSION to ${participantIDs.length} members… ⚡`, threadID);

      await setAllNicknamesWithDelay(api, threadID, participantIDs, targetNickname);

      return api.setMessageReaction("🥷", messageID, threadStr, () => {}, true);
    });
    return;
  }

  // SETGNAME
  if (sub === "setgname") {
    api.setTitle(targetGCName, threadID, (err) => {
      if (err) {
        return api.sendMessage("❌ Failed to change group name. Check permissions.", threadID, messageID);
      }
      return api.sendMessage("✅ Group name set: DOMAIN EXPANSION NI RYUK ✅", threadID, messageID);
    });
    return;
  }

  // HELP
  return api.sendMessage(
    `👑 DOMAIN EXPANSION NI RYUK — COMMANDS 👑\n\n` +
    `/activate on     → Activate Domain Expansion ♾️\n` +
    `/activate off    → Deactivate\n` +
    `/activate status  → Check status\n` +
    `/activate setnick → Set ALL nicks + GC Name → DOMAIN EXPANSION NI RYUK ✅\n` +
    `/activate setgname → Set GC Name → DOMAIN EXPANSION NI RYUK ✅\n\n` +
    `🛡️ Auto-restore enabled — if anyone changes it, I restore it instantly ⚡`,
    threadID,
    messageID
  );
};
      
