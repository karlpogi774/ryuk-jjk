const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 RYUK POGI ON TOP — PM + GC V7.1 ✅
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ✅ GAGANA SA PM AT GC ✅
// ✅ AUTO MENTION — @FullName kahit sa PM ✅
// ✅ SELF-REACT — Gagana sa parehas ✅
// ✅ UNDETECTABLE — Slow & Random ✅
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
  selfReact: true,
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

// ✅ MAY PANGALAN NA MENTION — GAGANA SA PM!
function randomMentionQuote(fullName, isPM = false) {
  const pmQuotes = [
    `@${fullName} — nandito na ako. RYUK POGI ON TOP, kahit dito sa pribado.`,
    `@${fullName} — ikaw lang ang kausap ko dito. Walang iba.`,
    `@${fullName} — saan man, GC man o PM — RYUK POGI ON TOP pa rin.`,
    `@${fullName} — salamat sa pag-chat. Nandito lang ako palagi.`,
    `@${fullName} — kalmado lang, hindi ka nag-iisa. Ako ang kakampi mo.`,
    `@${fullName} — dito lang tayo, walang ibang makakaalam.`,
    `@${fullName} — kilala mo naman kung sino ako, di ba?`,
    `@${fullName} — sa pribadong usapan, tapat pa rin ako sayo.`,
    `@${fullName} — walang makakatalo sayo, at walang makakatalo sakin.`,
    `@${fullName} — oras na para mag-usap tayo nang masinsinan.`
  ];
  
  const gcQuotes = [
    `@${fullName} — nandito na ang tunay na hari. RYUK POGI ON TOP.`,
    `@${fullName} — huwag mag-alala, ako ang nagbabantay dito.`,
    `@${fullName} — alam mo naman siguro kung sino ang nasa itaas.`,
    `@${fullName} — salamat sa pag-abot. RYUK POGI lang ang sagot.`,
    `@${fullName} — walang makakatalo, walang makakahabol.`,
    `@${fullName} — dito sa GC, ako ang batas.`,
    `@${fullName} — kalmado lang, hindi ka nag-iisa.`,
    `@${fullName} — ang pangalang RYUK POGI ay hindi mababago.`,
    `@${fullName} — ikaw ba, kilala mo kung sino ako?`,
    `@${fullName} — oras na para malaman mo ang katotohanan.`
  ];
  
  const list = isPM ? pmQuotes : gcQuotes;
  return list[Math.floor(Math.random() * list.length)];
}

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

function send(api, message, threadID, messageID, doSelfReact = false) {
  return api.sendMessage(message, threadID, (err, info) => {
    if (!err && doSelfReact) {
      setTimeout(() => {
        try {
          api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
        } catch (e) {}
      }, getRandomDelay(1500, 3000));
    }
  }, messageID);
}

function sendMention(api, text, threadID, targetID, fullName, doSelfReact = false) {
  const msgBody = fullName ? { body: text, mentions: [{ tag: `@${fullName}`, id: targetID }] } : text;
  
  return api.sendMessage(msgBody, threadID, (err, info) => {
    if (!err && doSelfReact) {
      setTimeout(() => {
        try {
          api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
        } catch (e) {}
      }, getRandomDelay(1500, 3000));
    }
  });
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
  version: "7.1.0",
  hasPermission: 0,
  credits: "RYUK — PM + GC WORKING V7.1",
  description: "Works in PM + GC | Auto Mention | Self-React | Undetectable",
  usePrefix: true,
  cooldowns: 10
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData, isGroup } = event;
    if (!threadID) return;

    const data = loadSystemData();
    const botID = String(api.getCurrentUserID());
    const isPM = !isGroup;

    // GC Lock lang — hindi gagana sa PM
    if (!isPM) {
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
    }

    // Auto-reply — GAGANA SA PM AT GC
    if (!senderID || !messageID) return;
    const sender = String(senderID);
    
    if (sender === botID || isAdmin(sender)) return;
    if (!data.active) return;
    if (!TARGET_USER_ID || sender !== String(TARGET_USER_ID)) return;
    if (!rememberMessage(String(messageID))) return;

    // Auto-reaction sa mensahe ng iba — GC lang
    if (!isPM && data.autoReact) {
      setTimeout(() => {
        try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
      }, getRandomDelay(2000, 4000));
    }

    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const last = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - last < COOLDOWN) return;
    USER_COOLDOWN.set(cooldownKey, now);

    // ✅ KUNIN ANG FULL NAME — GAGANA SA PM AT GC
    let fullName = "User";
    try {
      const info = await api.getUserInfo(senderID);
      if (info && info[senderID]) {
        fullName = info[senderID].name || info[senderID].firstName || "User";
      }
    } catch (e) {
      console.log("[ryuk] Cannot get name:", e.message);
    }

    // ✅ MAG-REPLY — MAY IBANG MENSAHE SA PM AT GC
    setTimeout(() => {
      const latest = loadSystemData();
      if (!latest.active) return;
      const replyText = randomMentionQuote(fullName, isPM);
      
      sendMention(api, replyText, threadID, senderID, isPM ? null : fullName, latest.selfReact);
      latest.totalReplies = (latest.totalReplies || 0) + 1;
      saveSystemData(latest);
    }, getRandomDelay(REPLY_DELAY_MIN, REPLY_DELAY_MAX));

  } catch (error) {
    console.error("[ryuk] Event error:", error);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID, isGroup } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();
  const botID = String(api.getCurrentUserID());
  const isPM = !isGroup;

  if (action === "help") {
    return send(api,
`👑 RYUK POGI ON TOP — V7.1 ✅

✅ GAGANA SA PM + GC!
✅ AUTO MENTION — @FullName
✅ SELF-REACT — Parehas sa PM at GC
✅ UNDETECTABLE — Slow & Random Delay

COMMANDS

/ryuk help
  Show this menu

/ryuk status
  Check system status

/ryuk on / off
  Turn auto-reply ON/OFF

/ryuk target [user_id]
  Set who bot will reply to
  Example: /ryuk target 61594055835097

/ryuk target off
  Remove target

/ryuk setgname [name]
  Set GC Name — GC only

/ryuk setnick [name]
  Set Nickname — GC only

/ryuk lock
  Apply to all members — GC only

/ryuk selfreacton / selfreactoff
  Self-reaction ON/OFF — works in PM & GC

/ryuk reacton / reactoff
  Reaction to others — GC only

Admin: 4 registered
Mode: PM + GC ACTIVE ✅`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`👑 RYUK SYSTEM STATUS — V7.1

Auto Reply: ${data.active ? "✅ ONLINE" : "❌ OFFLINE"}
Reply To: ${TARGET_USER_ID || "NOT SET"}
Self-React: ${data.selfReact ? "✅ ENABLED" : "❌ DISABLED"}
Platform: ✅ PM + GC
Auto-Mention: ✅ @FullName
React to Others: ${data.autoReact ? "✅ ENABLED" : "❌ DISABLED"}
Total Replies: ${data.totalReplies || 0}

GC Name: ${targetGCName}
Nickname: ${targetNickname}

Mode: UNDETECTABLE — Slow & Random ✅`,
      threadID, messageID
    );
  }

  const adminActions = ["on", "off", "target", "selfreacton", "selfreactoff"];
  const gcOnlyActions = ["lock", "setgname", "setnick", "reacton", "reactoff"];
  
  if (gcOnlyActions.includes(action) && isPM) {
    return send(api, "❌ Command available in GROUP CHAT only.", threadID, messageID);
  }
  
  if ([...adminActions, ...gcOnlyActions].includes(action) && !isAdmin(senderID)) {
    return send(api, "❌ Access denied. Admin only.", threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`✅ RYUK ACTIVATED — V7.1

Reply Mode: PM + GC ACTIVE
Self-React: ${data.selfReact ? "✅ ON" : "❌ OFF"}
Speed: SLOW — Hindi ma-detect ✅`,
      threadID, messageID
    );
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "❌ RYUK DEACTIVATED", threadID, messageID);
  }

  if (action === "target") {
    const target = args.slice(1).join(" ").trim();
    
    if (!target) {
      return send(api,
`Usage: /ryuk target [user_id]

Example: /ryuk target 61594055835097
Current Target: ${TARGET_USER_ID || "NONE"}`,
        threadID, messageID
      );
    }

    if (target === "off" || target === "none") {
      TARGET_USER_ID = "";
      saveSystemData(data);
      return send(api, "✅ Target removed.", threadID, messageID);
    }

    if (!/^\d+$/.test(target)) {
      return send(api, "❌ Invalid ID. Numbers only.", threadID, messageID);
    }

    TARGET_USER_ID = target;
    saveSystemData(data);
    return send(api,
`✅ TARGET SET — V7.1

Only replies to: ${TARGET_USER_ID}
Works in: ✅ PM + GC
Auto-Mention: ✅ @FullName
Self-React: ✅ Active`,
      threadID, messageID
    );
  }

  if (action === "selfreacton") {
    data.selfReact = true;
    saveSystemData(data);
    return send(api, "✅ Self-React: ON\nBot will react to own messages — PM & GC.", threadID, messageID);
  }

  if (action === "selfreactoff") {
    data.selfReact = false;
    saveSystemData(data);
    return send(api, "❌ Self-React: OFF", threadID, messageID);
  }

  if (action === "setgname") {
    const newName = args.slice(1).join(" ").trim();
    if (!newName) return send(api, "Usage: /ryuk setgname [name]", threadID, messageID);
    if (newName.length > 30) return send(api, "❌ Too long. Use shorter name.", threadID, messageID);
    targetGCName = newName;
    saveSystemData(data);
    api.setTitle(targetGCName, threadID, () => {});
    return send(api, `✅ GC Name set to: ${targetGCName}`, threadID, messageID);
  }

  if (action === "setnick") {
    const newName = args.slice(1).join(" ").trim();
    if (!newName) return send(api, "Usage: /ryuk setnick [name]\nMax 25 letters.", threadID, messageID);
    if (newName.length > 25) return send(api, "❌ Too long! Max 25 letters.", threadID, messageID);
    targetNickname = newName;
    saveSystemData(data);
    return send(api, `✅ Nickname set to: ${targetNickname}`, threadID, messageID);
  }

  if (action === "lock") {
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) return send(api, "❌ Cannot get group info.", threadID, messageID);
      
      const members = info.participantIDs || [];
      const est = Math.ceil(members.length * NICK_DELAY_MAX / 60000);
      
      send(api,
`🔒 STARTING LOCK — SLOW MODE

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
`✅ LOCK COMPLETE

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
    return send(api, "✅ React to others: ON — GC only", threadID, messageID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "❌ React to others: OFF", threadID, messageID);
  }

  return send(api, "❌ Unknown command. Type /ryuk help", threadID, messageID);
};
                           
