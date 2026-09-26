const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — GC-ALL WORKING + ANTI-SPAM V1.5 ✅
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// TARGET NAME: RYUK POGI ON TOP ✅
// ✅ GUMAGANA SA LAHAT NG GC | ANTI-SPAM | IGNORE ADMIN COMMAND SPAM
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
  active: false,
  autoReact: true,
  delay: 2500, // ⏱️ Medyo matagal para hindi ma-detect
  totalReplies: 0
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN_MESSAGES = 5000;
const RECENT_MESSAGES = new Map(); // ✅ Anti-spam: iwas ulit

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

// ✅ Anti-spam: parehas na mensahe sa loob ng GC — hindi uulit
function isSpamMessage(threadID, text) {
  const key = `${threadID}:${text.trim().toLowerCase()}`;
  const now = Date.now();
  const lastTime = RECENT_MESSAGES.get(key) || 0;
  if (now - lastTime < 8000) return true; // ⛔ 8s bawal ulit
  RECENT_MESSAGES.set(key, now);
  return false;
}

// ✅ Safe nickname changer — may delay, gumagana sa lahat ng GC
async function setAllNicknamesWithDelay(api, threadID, members, name) {
  let success = 0;
  let failed = 0;
  
  for (const uid of members) {
    await new Promise(resolve => setTimeout(resolve, 900)); // ⏱️ Ligtas na bilis
    
    api.changeNickname(name, threadID, uid, (err) => {
      if (err) {
        console.error("[ryuk] ❌ Nabigo:", uid, err?.message || err);
        failed++;
      } else {
        success++;
      }
    });
  }
  
  return { success, failed };
}

module.exports.config = {
  name: "ryuk",
  version: "1.5.0",
  hasPermission: 0,
  credits: "ryuk — ALL GC + ANTI-SPAM ✅",
  description: "RYUK POGI ON TOP | All GC Working + Anti-Spam",
  usePrefix: true,
  cooldowns: 3
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData, body } = event;
    if (!threadID) return;

    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);

    // ✅ AUTO-RESTORE NICK — GUMAGANA SA LAHAT NG GC
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;
      
      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, (err) => {
          if (!err) {
            send(api, "🛡️ Ibinalik agad! " + getNextLockLine(), threadID);
          }
        });
      }
      return;
    }

    // ✅ AUTO-RESTORE GC NAME — LAHAT NG GC
    if (logMessageType === "log:thread-name") {
      api.setTitle(targetGCName, threadID, (err) => {
        if (!err) {
          send(api, "⚡ Sinubukan mong palitan! " + getNextLockLine(), threadID);
        }
      });
      return;
    }

    if (!senderID || !messageID) return;
    
    // ✅ IGNORE: sariling bot at ADMIN — hindi mag-spam kapag ikaw nag-command
    if (sender === botID || isAdmin(sender)) return;

    const data = loadSystemData();
    if (!data.active) return;
    if (!rememberMessage(String(messageID))) return;

    // ✅ Anti-spam check
    if (body && isSpamMessage(threadID, body)) return;

    if (data.autoReact) {
      try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
    }

    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const lastTime = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - lastTime < 3500) return; // ⛔ 3.5s bawal ulit
    USER_COOLDOWN.set(cooldownKey, now);

    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    const delay = Math.max(0, Math.min(Number(data.delay) || 2500, 10000));

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
│   I-activate sa GC na ito
│
├ 🛑 /ryuk off
│   I-disable sa GC na ito
│
├ 😆 /ryuk reacton
│   I-on auto-reaction
│
├ 🔕 /ryuk reactoff
│   I-off auto-reaction
│
├ 🔒 /ryuk lock
│   I-LOCK GC + LAHAT NG NICK → RYUK POGI ON TOP ✅
│
╰──────────────

✅ Gumagana sa LAHAT ng GC
✅ Anti-Spam: ON
✅ Admin Command Spam: IGNORE
👑 RYUK POGI ON TOP — WALANG KATULAD`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`👑 ryuk SYSTEM STATUS 👑

🤖 Bot: ${data.active ? "🟢 ON" : "🔴 OFF"}
🔒 Nick Lock: 🟢 LAHAT NG GC ✅
🛡️ Anti-Spam: 🟢 ON ✅
🎯 Target: RYUK POGI ON TOP ✅
💬 Total Replies: ${data.totalReplies || 0}`,
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
    return send(api, 
`🚀 ryuk ACTIVATED SA GC NA ITO! ✅

🟢 Bot: ON na
🔒 Gumagana na dito at sa ibang GC
👑 RYUK POGI ON TOP — Handa na!`,
      threadID, messageID
    );
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "🛑 ryuk DEACTIVATED dito.", threadID, messageID);
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

  // ✅ LOCK — Gumagana sa LAHAT ng GC
  if (action === "lock") {
    if (!data.active) {
      return send(api, "⚠️ I-ON MUNA!\nI-type: /ryuk on 😂", threadID, messageID);
    }

    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    api.setTitle(targetGCName, threadID, () => {});

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return send(api, "❌ Hindi makuha ang GC info — subukan mo ulit!", threadID, messageID);
      }
      
      const memberCount = info.participantIDs?.length || 0;
      
      send(api, 
`🔒 NAGLA-LOCK SA GC NA ITO... ⏳

👥 Miyembro: ${memberCount}
⏱️ Tinatayang oras: ${(memberCount * 0.9).toFixed(1)} segundo
Huwag magpadala ng mensahe habang nagproproseso!`,
        threadID
      );
      
      const result = await setAllNicknamesWithDelay(api, threadID, info.participantIDs, targetNickname);
      
      send(api,
`✅ TAPOS NA SA GC NA ITO! 👑

🟢 Matagumpay: ${result.success}
🔴 Nabigo: ${result.failed}

🎯 Lahat ay: RYUK POGI ON TOP ✅
😂 Subukan niyong palitan — ibabalik ko agad sa LAHAT ng GC!`,
        threadID
      );
      
      return api.setMessageReaction("🥷", messageID, threadID, () => {}, true);
    });
    return;
  }

  return send(api, "⚠️ Hindi alam — /ryuk help mo 😂", threadID, messageID);
};
  
