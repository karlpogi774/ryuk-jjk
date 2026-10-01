const fs = require("fs");
const path = require("path");

// ==========================================
// RYUK POGI ON TOP — SELF-REACT + UNDETECTABLE V6.0
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ✅ SELF-REACT — BOT REACTS TO OWN MESSAGES ✅
// ✅ TARGET ONLY — SIYA LANG ANG REPLYAN ✅
// ✅ UNDETECTABLE — SLOW & RANDOM ✅
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

let TARGET_USER_ID = "";
let targetNickname = "RYUK POGI";
let targetGCName = "RYUK POGI ON TOP";

// ✅ SELF-REACT EMOJIS — PWEDE PALITAN
const SELF_REACT_EMOJIS = ["🔥", "💪", "👑", "⚡", "😎", "🗡️", "✅"];

// ⏱️ ANTI-DETECT DELAYS — HUWAG BAGUHIN
const NICK_DELAY_MIN = 4000;
const NICK_DELAY_MAX = 7000;
const REPLY_DELAY_MIN = 6000;
const REPLY_DELAY_MAX = 10000;
const AUTO_RESTORE_DELAY = 5000;
const COOLDOWN = 8000;

const LOCK_LINES = [
  "RYUK POGI ON TOP — walang makakatalo dito.",
  "GC LOCKED — pangalan ay hindi mapapalitan ng kahit sino.",
  "RYUK POGI — ang tunay na hari sa grupong ito.",
  "LAKAS AT GWAPO — RYUK POGI ON TOP, walang duda.",
  "Lahat ay RYUK POGI ON TOP — walang exempted dito.",
  "Hindi mababago, hindi matitinag — RYUK POGI LANG.",
  "GC PROTECTED — subukan mo, ibabalik agad.",
  "RYUK POGI ON TOP — pangalan na tatak sa isip niyo.",
  "Walang makakabago — dito, RYUK ang nasusunod.",
  "Naka-lock nang mahigpit — RYUK POGI ON TOP habang-buhay.",
  "Pinakamaganda, pinakamakunat — RYUK POGI LANG YAN.",
  "RYUK POGI ON TOP — taas noo, walang aatras.",
  "Bantay 24/7 — pag binago, ibabalik agad sayo.",
  "Dito sa GC na ito — RYUK POGI lang ang bida.",
  "Pangalan na sagrado — RYUK POGI ON TOP, walang iba."
];

let lockLineIndex = 0;
function getNextLockLine() {
  const line = LOCK_LINES[lockLineIndex];
  lockLineIndex = (lockLineIndex + 1) % LOCK_LINES.length;
  return line;
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomEmoji() {
  return SELF_REACT_EMOJIS[Math.floor(Math.random() * SELF_REACT_EMOJIS.length)];
}

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: true,
  autoReact: false,
  selfReact: true, // ✅ NAKA-ON ANG SELF-REACT
  totalReplies: 0,
  targetNickname: "RYUK POGI",
  targetGCName: "RYUK POGI ON TOP",
  targetUserID: ""
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN_MESSAGES = 5000;

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

const RYUK_QUOTES = [
  "Sa buong langit at lupa, RYUK POGI ON TOP lang ang hari.",
  "Walang makakatalo — dito, RYUK ang nasusunod.",
  "Kalmado lang. RYUK POGI ang kausap mo.",
  "Hindi nagyayabang — sinasabi ko lang ang katotohanan.",
  "Subukan mo lang palitan — ibabalik ko agad.",
  "RYUK POGI ON TOP — walang duda, walang katulad.",
  "Mas mabagal ka pa sa bilis ko.",
  "Tingin ko sa lahat — alam kong RYUK POGI lang ang bida.",
  "Relax ka lang. Nandito na ang pinakamalakas at pinakamaganda.",
  "Walang challenge na hindi kayang harapin ni RYUK."
];

function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      targetNickname = saved.targetNickname || targetNickname;
      targetGCName = saved.targetGCName || targetGCName;
      TARGET_USER_ID = saved.targetUserID || "";
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (error) {
    console.error("[ryuk] Load error:", error.message);
  }
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    data.targetNickname = targetNickname;
    data.targetGCName = targetGCName;
    data.targetUserID = TARGET_USER_ID;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[ryuk] Save error:", error.message);
    return false;
  }
}

function randomQuote() {
  return RYUK_QUOTES[Math.floor(Math.random() * RYUK_QUOTES.length)];
}

function send(api, message, threadID, messageID, doSelfReact = false) {
  return api.sendMessage(message, threadID, (err, info) => {
    if (!err && doSelfReact) {
      // ✅ SELF-REACT — HINDI AGAD, MAY DELAY
      setTimeout(() => {
        try {
          api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
        } catch (e) {}
      }, getRandomDelay(1500, 3000));
    }
  }, messageID);
}

function rememberMessage(messageID) {
  if (SEEN_MESSAGES.has(messageID)) return false;
  SEEN_MESSAGES.add(messageID);
  if (SEEN_MESSAGES.size > MAX_SEEN_MESSAGES) {
    SEEN_MESSAGES.delete(SEEN_MESSAGES.values().next().value);
  }
  return true;
}

async function setAllNicknamesWithDelay(api, threadID, members, name, botID) {
  let success = 0;
  let skip = 0;
  let fail = 0;

  if (name.length > 25) {
    return { success, skip, fail, total: members.length, error: "Pangalan masyadong mahaba. Gamitin: RYUK POGI" };
  }

  for (const uid of members) {
    if (String(uid) === String(botID)) {
      skip++;
      continue;
    }

    await new Promise(resolve => 
      setTimeout(resolve, getRandomDelay(NICK_DELAY_MIN, NICK_DELAY_MAX))
    );

    try {
      await new Promise((resolve) => {
        api.changeNickname(name, threadID, uid, (err) => {
          if (!err) success++;
          else fail++;
          resolve();
        });
      });
    } catch {
      fail++;
    }
  }

  return { success, skip, fail, total: members.length };
}

module.exports.config = {
  name: "ryuk",
  version: "6.0.0",
  hasPermission: 0,
  credits: "ryuk — SELF-REACT V6.0",
  description: "Self-React + Target Only + Undetectable",
  usePrefix: true,
  cooldowns: 10
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const data = loadSystemData();
    const botID = String(api.getCurrentUserID());

    // Auto-restore GC/Nick
    if (logMessageType === "log:user-nickname") {
      const uid = logMessageData.participant_id;
      const curr = logMessageData.nickname || "";
      if (curr !== targetNickname && String(uid) !== botID) {
        setTimeout(() => api.changeNickname(targetNickname, threadID, uid, () => {}), AUTO_RESTORE_DELAY);
      }
      return;
    }

    if (logMessageType === "log:thread-name") {
      setTimeout(() => api.setTitle(targetGCName, threadID, () => {}), AUTO_RESTORE_DELAY);
      return;
    }

    // Auto-reply — SIYA LANG
    if (!senderID || !messageID) return;
    const sender = String(senderID);
    
    if (sender === botID || isAdmin(sender)) return;
    if (!data.active) return;
    if (!TARGET_USER_ID || sender !== String(TARGET_USER_ID)) return;
    if (!rememberMessage(String(messageID))) return;

    // Auto-reaction sa mensahe ng iba
    if (data.autoReact) {
      setTimeout(() => {
        try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
      }, getRandomDelay(2000, 4000));
    }

    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const last = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - last < COOLDOWN) return;
    USER_COOLDOWN.set(cooldownKey, now);

    // ✅ MAG-REPLY + MAG-SELF-REACT
    setTimeout(() => {
      const latest = loadSystemData();
      if (!latest.active) return;
      const reply = `[ryuk]\n\n${randomQuote()}`;
      
      api.sendMessage(reply, threadID, (err, info) => {
        if (!err) {
          latest.totalReplies = (latest.totalReplies || 0) + 1;
          saveSystemData(latest);
          
          // ✅ SELF-REACT SA SARILING MENSAHE
          if (latest.selfReact && info?.messageID) {
            setTimeout(() => {
              try {
                api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
              } catch (e) {}
            }, getRandomDelay(1500, 3000));
          }
        }
      }, messageID);
    }, getRandomDelay(REPLY_DELAY_MIN, REPLY_DELAY_MAX));

  } catch (error) {
    console.error("[ryuk] Event error:", error);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();
  const botID = String(api.getCurrentUserID());

  if (action === "help") {
    return send(api,
`ryuk CONTROL PANEL — SELF-REACT V6.0

COMMANDS

/ryuk help
  Show all commands

/ryuk status
  Check status

/ryuk on / off
  Turn auto-reply ON/OFF

/ryuk target [user_id]
  Set who bot will reply to
  Example: /ryuk target 61594055835097

/ryuk target off
  Remove target

/ryuk setgname [name]
  Set GC Name — maikli lang

/ryuk setnick [name]
  Set Nickname — max 25 letters

/ryuk lock
  Apply to all members — mabagal

/ryuk selfreacton / selfreactoff
  Self-reaction ON/OFF — bot reacts to own messages

/ryuk reacton / reactoff
  Reaction to others' messages ON/OFF

Admin: 4 registered
Mode: TARGET ONLY + SELF-REACT ✅`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`ryuk SYSTEM STATUS

Auto Reply: ${data.active ? "ONLINE" : "OFFLINE"}
Reply To: ${TARGET_USER_ID || "NOT SET"}
Self-React: ${data.selfReact ? "ENABLED" : "DISABLED"}
React to Others: ${data.autoReact ? "ENABLED" : "DISABLED"}
Total Replies: ${data.totalReplies || 0}

GC Name: ${targetGCName}
Nickname: ${targetNickname}

Mode: UNDETECTABLE — Slow & Random ✅`,
      threadID, messageID
    );
  }

  const adminActions = ["on", "off", "target", "lock", "setgname", "setnick", "reacton", "reactoff", "selfreacton", "selfreactoff"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return send(api, "Access denied. Admin only.", threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`ryuk ACTIVATED — SAFE MODE

Reply Mode: TARGET ONLY
Self-React: ${data.selfReact ? "ON" : "OFF"}
Speed: SLOW — Hindi ma-detect ✅`,
      threadID, messageID
    );
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "ryuk DEACTIVATED", threadID, messageID);
  }

  if (action === "target") {
    const target = args.slice(1).join(" ").trim();
    
    if (!target) {
      return send(api,
`Usage: /ryuk target [user_id]

Example: /ryuk target 61594055835097
Current: ${TARGET_USER_ID || "NONE"}`,
        threadID, messageID
      );
    }

    if (target === "off" || target === "none") {
      TARGET_USER_ID = "";
      saveSystemData(data);
      return send(api, "Target removed.", threadID, messageID);
    }

    if (!/^\d+$/.test(target)) {
      return send(api, "Invalid ID. Numbers only.", threadID, messageID);
    }

    TARGET_USER_ID = target;
    saveSystemData(data);
    return send(api,
`TARGET SET ✅

Only replies to: ${TARGET_USER_ID}
Self-React: Active ✅`,
      threadID, messageID
    );
  }

  // ✅ SELF-REACT ON
  if (action === "selfreacton") {
    data.selfReact = true;
    saveSystemData(data);
    return send(api, "Self-React: ON ✅\nBot will react to its own messages.", threadID, messageID);
  }

  // ✅ SELF-REACT OFF
  if (action === "selfreactoff") {
    data.selfReact = false;
    saveSystemData(data);
    return send(api, "Self-React: OFF", threadID, messageID);
  }

  if (action === "setgname") {
    const newName = args.slice(1).join(" ").trim();
    if (!newName) return send(api, "Usage: /ryuk setgname [name]", threadID, messageID);
    if (newName.length > 30) return send(api, "Too long. Use shorter name.", threadID, messageID);
    targetGCName = newName;
    saveSystemData(data);
    api.setTitle(targetGCName, threadID, () => {});
    return send(api, `GC Name: ${targetGCName}`, threadID, messageID);
  }

  if (action === "setnick") {
    const newName = args.slice(1).join(" ").trim();
    if (!newName) return send(api, "Usage: /ryuk setnick [name]\nMax 25 letters.", threadID, messageID);
    if (newName.length > 25) return send(api, "Too long! Use: RYUK POGI", threadID, messageID);
    targetNickname = newName;
    saveSystemData(data);
    return send(api, `Nickname: ${targetNickname}`, threadID, messageID);
  }

  if (action === "lock") {
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) return send(api, "Cannot get group info.", threadID, messageID);
      
      const members = info.participantIDs || [];
      const est = Math.ceil(members.length * NICK_DELAY_MAX / 60000);
      
      send(api,
`STARTING LOCK — SLOW MODE

GC Name: ${targetGCName}
Nickname: ${targetNickname}
Members: ${members.length}
Estimated: ${est} min — keep chat open`,
        threadID, messageID
      );
      
      api.setTitle(targetGCName, threadID, () => {});
      const result = await setAllNicknamesWithDelay(api, threadID, members, targetNickname, botID);
      
      if (result.error) return send(api, result.error, threadID, messageID);
      
      send(api,
`DONE

Total: ${result.total}
Changed: ${result.success}
Skipped: ${result.skip}
Failed: ${result.fail}`,
        threadID
      );
    });
    return;
  }

  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "React to others: ON", threadID, messageID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "React to others: OFF", threadID, messageID);
  }

  return send(api, "Unknown command. /ryuk help", threadID, messageID);
};
  
