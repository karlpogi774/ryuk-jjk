const fs = require("fs");
const path = require("path");

// ==========================================
// RYUK POGI ON TOP — TARGET REPLY V4.0
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ✅ TARGET ACCOUNT — SIYA LANG ANG REPLYAN NG BOT ✅
// ✅ ANTI-DETECT — BABAG NA PAGBILIS ✅
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

// ✅ ILAGAY DITO ANG TARGET NA IREREPALYAN
let TARGET_USER_ID = ""; // I-type: /ryuk target 615xxxxxxxxx

let targetNickname = "RYUK POGI";
let targetGCName = "RYUK POGI ON TOP";

// ⏱️ ANTI-DETECT DELAYS — HUWAG BAGUHIN
const NICK_DELAY_MIN = 2500;
const NICK_DELAY_MAX = 4000;
const REPLY_DELAY_MIN = 4000;
const REPLY_DELAY_MAX = 7000;

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

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
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

function send(api, message, threadID, messageID) {
  return api.sendMessage(message, threadID, () => {}, messageID);
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

  if (name.length > 35) {
    return { success, skip, fail, total: members.length, error: "Pangalan masyadong mahaba. Iikliin mo." };
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
  version: "4.0.0",
  hasPermission: 0,
  credits: "ryuk — TARGET REPLY V4.0",
  description: "Reply only to target account | Anti-Detect",
  usePrefix: true,
  cooldowns: 5
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
        setTimeout(() => api.changeNickname(targetNickname, threadID, uid, () => {}), 3000);
      }
      return;
    }

    if (logMessageType === "log:thread-name") {
      setTimeout(() => api.setTitle(targetGCName, threadID, () => {}), 3000);
      return;
    }

    // Auto-reply — SIYA LANG
    if (!senderID || !messageID) return;
    const sender = String(senderID);
    
    if (sender === botID || isAdmin(sender)) return;
    if (!data.active) return;
    if (!TARGET_USER_ID || sender !== String(TARGET_USER_ID)) return;
    if (!rememberMessage(String(messageID))) return;

    // Auto-reaction sa target
    if (data.autoReact) {
      setTimeout(() => {
        try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
      }, getRandomDelay(1000, 2000));
    }

    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const last = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - last < 6000) return;
    USER_COOLDOWN.set(cooldownKey, now);

    setTimeout(() => {
      const latest = loadSystemData();
      if (!latest.active) return;
      const reply = `[ryuk]\n\n${randomQuote()}`;
      api.sendMessage(reply, threadID, (err) => {
        if (!err) {
          latest.totalReplies = (latest.totalReplies || 0) + 1;
          saveSystemData(latest);
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
`ryuk CONTROL PANEL

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
  Remove target — reply to no one

/ryuk setgname [name]
  Set GC Name

/ryuk setnick [name]
  Set Nickname

/ryuk lock
  Apply to all members

Admin: 4 registered
Mode: Reply only to target account ✅`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`ryuk SYSTEM STATUS

Auto Reply: ${data.active ? "ONLINE" : "OFFLINE"}
Reply To: ${TARGET_USER_ID || "NOT SET"}
Auto Reaction: ${data.autoReact ? "ENABLED" : "DISABLED"}
Total Replies: ${data.totalReplies || 0}

GC Name: ${targetGCName}
Nickname: ${targetNickname}

Protection: ACTIVE — Safe Mode`,
      threadID, messageID
    );
  }

  const adminActions = ["on", "off", "target", "lock", "setgname", "setnick", "reacton", "reactoff"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return send(api, "Access denied. Admin only.", threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`ryuk ACTIVATED

Reply Mode: TARGET ONLY
Target: ${TARGET_USER_ID || "NOT SET — use /ryuk target [id]"}`,
      threadID, messageID
    );
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "ryuk DEACTIVATED", threadID, messageID);
  }

  // ✅ SET TARGET ACCOUNT
  if (action === "target") {
    const target = args.slice(1).join(" ").trim();
    
    if (!target) {
      return send(api,
`Usage: /ryuk target [user_id]

Example:
/ryuk target 61594055835097

Current Target: ${TARGET_USER_ID || "NONE"}

To remove: /ryuk target off`,
        threadID, messageID
      );
    }

    if (target === "off" || target === "none") {
      TARGET_USER_ID = "";
      saveSystemData(data);
      return send(api,
`Target removed

Bot will not reply to anyone now.
Set new target: /ryuk target [id]`,
        threadID, messageID
      );
    }

    if (!/^\d+$/.test(target)) {
      return send(api, "Invalid ID. Use numbers only.\nExample: 61594055835097", threadID, messageID);
    }

    TARGET_USER_ID = target;
    saveSystemData(data);
    return send(api,
`TARGET SET ✅

Bot will ONLY reply to:
${TARGET_USER_ID}

Others — bot will ignore.
Change anytime: /ryuk target [new_id]`,
      threadID, messageID
    );
  }

  if (action === "setgname") {
    const newName = args.slice(1).join(" ").trim();
    if (!newName) {
      return send(api, "Usage: /ryuk setgname [name]", threadID, messageID);
    }
    targetGCName = newName;
    saveSystemData(data);
    api.setTitle(targetGCName, threadID, () => {});
    return send(api, `GC Name updated: ${targetGCName}`, threadID, messageID);
  }

  if (action === "setnick") {
    const newName = args.slice(1).join(" ").trim();
    if (!newName) {
      return send(api, "Usage: /ryuk setnick [name]", threadID, messageID);
    }
    if (newName.length > 35) {
      return send(api, "Nickname too long. Max 35 chars.", threadID, messageID);
    }
    targetNickname = newName;
    saveSystemData(data);
    return send(api, `Nickname updated: ${targetNickname}`, threadID, messageID);
  }

  if (action === "lock") {
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) return send(api, "Cannot get group info.", threadID, messageID);
      
      const members = info.participantIDs || [];
      const est = Math.ceil(members.length * NICK_DELAY_MAX / 60000);
      
      send(api,
`STARTING LOCK

GC Name: ${targetGCName}
Nickname: ${targetNickname}
Members: ${members.length}
Estimated: ${est} min — keep chat open`,
        threadID, messageID
      );
      
      api.setTitle(targetGCName, threadID, () => {});
      const result = await setAllNicknamesWithDelay(api, threadID, members, targetNickname, botID);
      
      if (result.error) {
        return send(api, `${result.error}\n\nUse shorter name.`, threadID, messageID);
      }
      
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
    return send(api, "Auto-reaction: ON", threadID, messageID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "Auto-reaction: OFF", threadID, messageID);
  }

  return send(api, "Unknown command. /ryuk help", threadID, messageID);
};
  
