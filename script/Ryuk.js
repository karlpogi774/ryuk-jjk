const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — NICK LOCK FIXED V1.3 ✅
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// TARGET NAME: RYUK POGI ON TOP ✅
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const targetNickname = "RYUK POGI ON TOP";
const targetGCName = "RYUK POGI ON TOP";

const LOCK_LINES = [
  "😂 Sinubukan mo pa? Sayang oras, babalik pa rin ako!",
  "🤣 Ang bagal mo — bago ka matapos, ibinalik ko na!",
  "😏 Hayaan mo na — wala kang laban, tanggapin mo na 😂",
  "😂 Cute naman magpalit — pero hindi gagana sayo!",
  "🤣 Pagod ka na? Ako hindi — RYUK pa rin mananalo!"
];

let lockLineIndex = 0;
function getNextLockLine() {
  const line = LOCK_LINES[lockLineIndex];
  lockLineIndex = (lockLineIndex + 1) % LOCK_LINES.length;
  return line;
}

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  totalReplies: 0
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN_MESSAGES = 5000;

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

const RYUK_QUOTES = [
  "😂 Sinubukan mo talaga? Wala kang laban sakin!",
  "🤣 Ang bagal mo — tapos ka na bago ka pa magsimula!",
  "😏 Tanggapin mo na — RYUK POGI ON TOP lang talaga 😂"
];

function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (error) {
    console.error("[ryuk] Load error:", error.message);
  }
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[ryuk] Save error:", error.message);
    return false;
  }
}

function randomQuote() {
  const index = Math.floor(Math.random() * RYUK_QUOTES.length);
  return RYUK_QUOTES[index];
}

function send(api, message, threadID, messageID = null) {
  api.sendMessage(message, threadID, () => {}, messageID);
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

// ✅ MAY DELAY NA — HINDI NA BINABAGSAK NG FB
async function setAllNicknamesWithDelay(api, threadID, members, name) {
  for (const uid of members) {
    await new Promise(resolve => setTimeout(resolve, 600)); // ⏱️ 0.6s bawat isa — ligtas
    api.changeNickname(name, threadID, uid, (err) => {
      if (err) console.error("[ryuk] Nick error para sa", uid, ":", err);
    });
  }
}

module.exports.config = {
  name: "ryuk",
  version: "1.3.0",
  hasPermission: 0,
  credits: "ryuk — NICK LOCK FIXED ✅",
  description: "RYUK POGI ON TOP | Fixed Nick Lock + GC Lock",
  usePrefix: true,
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    // ✅ AUTO-RESTORE NICK — GUMAGANA NA AGAD
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;
      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, (err) => {
          if (!err) {
            api.sendMessage("🛡️ Ibinalik agad! " + getNextLockLine(), threadID);
          }
        });
      }
      return;
    }

    // ✅ AUTO-RESTORE GC NAME
    if (logMessageType === "log:thread-name") {
      api.setTitle(targetGCName, threadID, (err) => {
        if (!err) {
          api.sendMessage("⚡ Sinubukan mong palitan! " + getNextLockLine(), threadID);
        }
      });
      return;
    }

    if (!senderID || !messageID) return;
    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);
    if (sender === botID || isAdmin(sender)) return;

    const data = loadSystemData();
    if (!data.active) return;
    if (!rememberMessage(String(messageID))) return;

    if (data.autoReact) {
      try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
    }

    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const lastTime = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - lastTime < 3000) return;
    USER_COOLDOWN.set(cooldownKey, now);

    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    const delay = Math.max(0, Math.min(Number(data.delay) || 2000, 10000));

    setTimeout(() => {
      const latestData = loadSystemData();
      if (!latestData.active) return;
      const reply = `👑 [ryuk]\n\n${randomQuote()}`;
      api.sendMessage(reply, threadID, (error) => {
        if (!error) {
          latestData.totalReplies = (latestData.totalReplies || 0) + 1;
          saveSystemData(latestData);
        }
      }, messageID);
    }, delay);

  } catch (error) {
    console.error("[ryuk] Event error:", error);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();

  if (action === "help") {
    return send(api,
`👑 ryuk CONTROL PANEL 👑

╭───「 COMMANDS 」
│
├ 💡 /ryuk help
│   Ipakita ang lahat ng commands
│
├ 📊 /ryuk status
│   Tingnan ang bot status
│
├ 🚀 /ryuk on
│   I-activate ang auto-reply
│
├ 🛑 /ryuk off
│   I-disable ang auto-reply
│
├ 😆 /ryuk reacton
│   I-on ang auto-reaction
│
├ 🔕 /ryuk reactoff
│   I-off ang auto-reaction
│
├ 🔒 /ryuk lock
│   I-LOCK GC + LAHAT NG NICK → RYUK POGI ON TOP ✅
│
╰──────────────

✅ Nick Lock: FIXED — may delay na, hindi na ma-detect!
👑 RYUK POGI ON TOP — WALANG KATULAD`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`👑 ryuk SYSTEM STATUS 👑

🤖 Auto Reply: ${data.active ? "🟢 ONLINE" : "🔴 OFFLINE"}
🔒 Nick Lock: 🟢 FIXED ✅
🔥 Auto React: ${data.autoReact ? "🟢 ON" : "🔴 OFF"}
🎯 Target: RYUK POGI ON TOP ✅`,
      threadID, messageID
    );
  }

  const adminActions = ["on", "off", "reacton", "reactoff", "lock"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return send(api, "⛔ Admin lang ang puwede 😂", threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api, "🚀 ryuk ACTIVATED!\n✅ Nick Lock: ON — Handa na!", threadID, messageID);
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "🛑 ryuk DEACTIVATED.", threadID, messageID);
  }

  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "🔥 Auto-reaction ON", threadID, messageID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "🔕 Auto-reaction OFF", threadID, messageID);
  }

  // ✅ LOCK GC + ALL NICKNAMES — MAY DELAY NA
  if (action === "lock") {
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    api.setTitle(targetGCName, threadID, () => {});

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.setMessageReaction("😋", messageID, threadID, () => {}, true);
      }
      const participantIDs = info.participantIDs || [];
      
      send(api, `🔒 Sinisimulan ang pag-lock sa ${participantIDs.length} na miyembro... ⏳`, threadID);
      
      // ✅ GUMAGANA NA — may tamang delay
      await setAllNicknamesWithDelay(api, threadID, participantIDs, targetNickname);
      
      send(api, "✅ TAPOS NA! Lahat ng nickname ay RYUK POGI ON TOP na! 👑", threadID);
      return api.setMessageReaction("🥷", messageID, threadID, () => {}, true);
    });
    return;
  }

  return send(api, "⚠️ Hindi alam — /ryuk help mo 😂", threadID, messageID);
};
  
