const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 ryuk — NICK LOCK WORKING V1.4 ✅
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
  active: false, // ⚠️ KAILANGAN MUNA I-ON
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

// ✅ MAY DELAY + ASYNC — HINDI NA BINABAGSAK
async function setAllNicknamesWithDelay(api, threadID, members, name) {
  let success = 0;
  let failed = 0;
  
  for (const uid of members) {
    await new Promise(resolve => setTimeout(resolve, 800)); // ⏱️ 0.8s bawat isa — ligtas
    
    api.changeNickname(name, threadID, uid, (err) => {
      if (err) {
        console.error("[ryuk] ❌ Nabigo:", uid, err);
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
  version: "1.4.0",
  hasPermission: 0,
  credits: "ryuk — NICK LOCK WORKING ✅",
  description: "RYUK POGI ON TOP | Fixed Nick Lock + GC Lock",
  usePrefix: true,
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    // ✅ AUTO-RESTORE NICK — GUMAGANA AGAD
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;
      
      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, (err) => {
          if (!err) {
            api.sendMessage("🛡️ Ibinalik agad! " + getNextLockLine(), threadID);
          } else {
            api.sendMessage("⚠️ Hindi mabago — kulang ng pahintulot 😂", threadID);
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
├ 🚀 /ryuk on ⬅️ UNANG GAWIN!
│   I-activate ang bot bago mag-lock!
│
├ 🛑 /ryuk off
│   I-disable ang bot
│
├ 😆 /ryuk reacton
│   I-on ang auto-reaction
│
├ 🔕 /ryuk reactoff
│   I-off ang auto-reaction
│
├ 🔒 /ryuk lock ⬅️ Pagkatapos i-on
│   I-LOCK GC + LAHAT NG NICK → RYUK POGI ON TOP ✅
│
╰──────────────

⚠️ UNANG-UNA: /ryuk on muna bago /ryuk lock!
👑 RYUK POGI ON TOP — WALANG KATULAD`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`👑 ryuk SYSTEM STATUS 👑

🤖 Bot: ${data.active ? "🟢 ON — PWEDE NA MAG-LOCK" : "🔴 OFF — I-ON MUNA!"}
🔒 Nick Lock: 🟢 READY ✅
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
`🚀 ryuk ACTIVATED! ✅

🟢 Bot: ON na
🔒 Pwede na: /ryuk lock
👑 RYUK POGI ON TOP — Handa na!`,
      threadID, messageID
    );
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

  // ✅ LOCK GC + ALL NICKNAMES — MAY DELAY + RESULT
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
`🔒 SINISIMULAN ANG PAG-LOCK... ⏳

👥 Miyembro: ${memberCount}
⏱️ Tinatayang oras: ${(memberCount * 0.8).toFixed(1)} segundo
Huwag magpadala ng mensahe habang nagproproseso!`,
        threadID
      );
      
      // ✅ TUNAY NA PAGPAPALIT — may delay
      const result = await setAllNicknamesWithDelay(api, threadID, info.participantIDs, targetNickname);
      
      send(api,
`✅ TAPOS NA! 👑

🟢 Matagumpay: ${result.success}
🔴 Nabigo: ${result.failed}

🎯 Lahat ay: RYUK POGI ON TOP ✅
😂 Subukan niyong palitan — ibabalik ko agad!`,
        threadID
      );
      
      return api.setMessageReaction("🥷", messageID, threadID, () => {}, true);
    });
    return;
  }

  return send(api, "⚠️ Hindi alam — /ryuk help mo 😂", threadID, messageID);
};
