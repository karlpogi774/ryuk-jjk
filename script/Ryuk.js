const fs = require("fs");
const path = require("path");

// ==========================================
// RYUK POGI ON TOP — CUSTOM GC/NICK V2.0
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ✅ PWEDE BAGUHIN ANG GC NAME AT NICKNAME VIA COMMAND
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

// ✅ DEFAULT VALUES — PWEDE BAGUHIN VIA COMMAND
let targetNickname = "RYUK POGI ON TOP";
let targetGCName = "RYUK POGI ON TOP";

// ✅ MGA LINYA — WALANG EMOJI
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

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  totalReplies: 0,
  targetNickname: "RYUK POGI ON TOP",
  targetGCName: "RYUK POGI ON TOP"
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN_MESSAGES = 5000;

// ==========================================
// ADMIN CHECK
// ==========================================
function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

// ==========================================
// QUOTES — WALANG EMOJI
// ==========================================
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

// ==========================================
// DATA MANAGEMENT
// ==========================================
function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      targetNickname = saved.targetNickname || targetNickname;
      targetGCName = saved.targetGCName || targetGCName;
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (error) {
    console.error("[ryuk] Data load error:", error.message);
  }
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    data.targetNickname = targetNickname;
    data.targetGCName = targetGCName;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[ryuk] Data save error:", error.message);
    return false;
  }
}

// ==========================================
// HELPERS
// ==========================================
function randomQuote() {
  const index = Math.floor(Math.random() * RYUK_QUOTES.length);
  return RYUK_QUOTES[index];
}

function send(api, message, threadID, messageID) {
  return api.sendMessage(message, threadID, () => {}, messageID);
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

async function setAllNicknamesWithDelay(api, threadID, members, name, botID) {
  let success = 0;
  let skip = 0;
  
  for (const uid of members) {
    if (String(uid) === String(botID)) {
      skip++;
      continue;
    }
    await new Promise(resolve => setTimeout(resolve, 1200));
    api.changeNickname(name, threadID, uid, () => {});
    success++;
  }
  return { success, skip, total: members.length };
}

// ==========================================
// BOT CONFIG
// ==========================================
module.exports.config = {
  name: "ryuk",
  version: "2.0.0",
  hasPermission: 0,
  credits: "ryuk — CUSTOM GC/NICK V2.0",
  description: "RYUK POGI ON TOP | Set GC Name & Nickname via Command",
  usePrefix: true,
  cooldowns: 2
};

// ==========================================
// HANDLE EVENT — AUTO-RESTORE
// ==========================================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const data = loadSystemData();

    // AUTO-RESTORE NICK IF SOMEONE CHANGES IT
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname || "";
      const botID = String(api.getCurrentUserID());
      
      if (currentNickname !== targetNickname && String(targetUserID) !== botID) {
        setTimeout(() => {
          api.changeNickname(targetNickname, threadID, targetUserID, () => {});
        }, 1500);
      }
      return;
    }

    // AUTO-RESTORE GC NAME IF SOMEONE CHANGES IT
    if (logMessageType === "log:thread-name") {
      setTimeout(() => {
        api.setTitle(targetGCName, threadID, () => {});
      }, 1500);
      return;
    }

    // Auto-reply
    if (!senderID || !messageID) return;
    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);
    if (sender === botID || isAdmin(sender)) return;

    if (!data.active) return;
    if (!rememberMessage(String(messageID))) return;

    // Auto reaction
    if (data.autoReact) {
      try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
    }

    // Cooldown
    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const lastTime = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - lastTime < 3000) return;
    USER_COOLDOWN.set(cooldownKey, now);

    const delay = Math.max(0, Math.min(Number(data.delay) || 2000, 10000));

    setTimeout(() => {
      const latestData = loadSystemData();
      if (!latestData.active) return;
      const reply = `[ryuk]\n\n${randomQuote()}`;
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

// ==========================================
// COMMAND RUNNER
// ==========================================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();
  const botID = String(api.getCurrentUserID());

  // HELP
  if (action === "help") {
    return send(api,
`ryuk CONTROL PANEL

COMMANDS

/ryuk help
  Show all commands

/ryuk status
  Check current status

/ryuk on
  Turn on auto-reply

/ryuk off
  Turn off auto-reply

/ryuk reacton
  Turn on auto-reaction

/ryuk reactoff
  Turn off auto-reaction

/ryuk lock
  Apply current GC Name + Nickname to all members

/ryuk setgname [name]
  Set custom GC Name (e.g. /ryuk setgname RYUK POGI ON TOP)

/ryuk setnick [name]
  Set custom Nickname for all members (e.g. /ryuk setnick RYUK POGI)

Admin access: 4 registered
RYUK POGI ON TOP — MAKUNAT`,
      threadID, messageID
    );
  }

  // STATUS
  if (action === "status") {
    return send(api,
`ryuk SYSTEM STATUS

Auto Reply: ${data.active ? "ONLINE" : "OFFLINE"}
Reply Delay: ${data.delay} ms
Auto Reaction: ${data.autoReact ? "ENABLED" : "DISABLED"}
Total Replies: ${data.totalReplies || 0}

Current GC Name: ${targetGCName}
Current Nickname: ${targetNickname}

Admin Count: ${ADMIN_IDS.length} registered`,
      threadID, messageID
    );
  }

  // ADMIN-ONLY
  const adminActions = ["on", "off", "reacton", "reactoff", "lock", "setgname", "setnick"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return send(api, "Access denied. Admin only.", threadID, messageID);
  }

  // TURN ON
  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`ryuk ACTIVATED

Auto-reply: ON
Target GC Name: ${targetGCName}
Target Nickname: ${targetNickname}`,
      threadID, messageID
    );
  }

  // TURN OFF
  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "ryuk DEACTIVATED\n\nAuto-reply turned off.", threadID, messageID);
  }

  // AUTO REACTION ON
  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "Auto-reaction: ON", threadID, messageID);
  }

  // AUTO REACTION OFF
  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "Auto-reaction: OFF", threadID, messageID);
  }

  // ✅ SET CUSTOM GC NAME
  if (action === "setgname") {
    const newName = args.slice(1).join(" ").trim();
    if (!newName) {
      return send(api,
`Usage: /ryuk setgname [name]

Example:
/ryuk setgname RYUK POGI ON TOP

Current: ${targetGCName}`,
        threadID, messageID
      );
    }
    targetGCName = newName;
    saveSystemData(data);
    api.setTitle(targetGCName, threadID, () => {});
    return send(api,
`GC Name updated

New Name: ${targetGCName}

Will auto-restore if changed.`,
      threadID, messageID
    );
  }

  // ✅ SET CUSTOM NICKNAME
  if (action === "setnick") {
    const newName = args.slice(1).join(" ").trim();
    if (!newName) {
      return send(api,
`Usage: /ryuk setnick [name]

Example:
/ryuk setnick RYUK POGI

Current: ${targetNickname}`,
        threadID, messageID
      );
    }
    if (newName.length > 35) {
      return send(api, "Nickname too long. Max 35 characters.", threadID, messageID);
    }
    targetNickname = newName;
    saveSystemData(data);
    return send(api,
`Nickname updated

New Name: ${targetNickname}

Use /ryuk lock to apply to all members.
Will auto-restore if changed.`,
      threadID, messageID
    );
  }

  // ✅ LOCK GC + ALL NICKNAMES
  if (action === "lock") {
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    api.setTitle(targetGCName, threadID, () => {});

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return send(api, "Cannot get group info.", threadID, messageID);
      }
      
      const members = info.participantIDs || [];
      
      send(api,
`Processing

GC Name: ${targetGCName}
Nickname: ${targetNickname}
Members: ${members.length}

Estimated time: ${Math.ceil(members.length * 1.2 / 60)} minutes
Do not close this chat`,
        threadID, messageID
      );
      
      const result = await setAllNicknamesWithDelay(api, threadID, members, targetNickname, botID);
      
      send(api,
`DONE

GC Name: ${targetGCName}
Total Members: ${result.total}
Changed: ${result.success}
Skipped (Bot): ${result.skip}

Auto-restore is active.
${getNextLockLine()}`,
        threadID
      );
    });
    return;
  }

  return send(api, "Unknown command. Type /ryuk help for list.", threadID, messageID);
};
  
