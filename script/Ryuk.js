const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 RYUK POGI ON TOP — FINAL FIXED V7.2 ✅
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ✅ PM GUMAGANA NA ✅
// ✅ NICKNAME LOCK — HINDI NA FAILED ✅
// ✅ AUTO-RESTORE — IBABALIK AGAD ✅
// ✅ SELF-REACT — PM + GC ✅
// ✅ MAKUNAT — HINDI MA-DETECT ✅
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

const SELF_REACT_EMOJIS = ["😆"];

// ⏱️ Delays — Pinaka-ayos na hindi ma-detect
const NICK_DELAY_MIN = 2500;
const NICK_DELAY_MAX = 4500;
const REPLY_DELAY_MIN = 3000;
const REPLY_DELAY_MAX = 6000;
const AUTO_RESTORE_DELAY = 2000;
const COOLDOWN = 5000;

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

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomEmoji() {
  return SELF_REACT_EMOJIS[Math.floor(Math.random() * SELF_REACT_EMOJIS.length)];
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
    if (!err && doSelfReact && info) {
      setTimeout(() => {
        try {
          api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
        } catch (e) {}
      }, getRandomDelay(1500, 2500));
    }
  }, messageID);
}

function sendMention(api, text, threadID, targetID, fullName, doSelfReact = false) {
  const msgBody = fullName 
    ? { body: text, mentions: [{ tag: `@${fullName}`, id: targetID }] } 
    : text;
  
  return api.sendMessage(msgBody, threadID, (err, info) => {
    if (!err && doSelfReact && info) {
      setTimeout(() => {
        try {
          api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
        } catch (e) {}
      }, getRandomDelay(1500, 2500));
    }
  });
}

function rememberMessage(messageID) {
  const id = String(messageID);
  if (SEEN_MESSAGES.has(id)) return false;
  SEEN_MESSAGES.add(id);
  if (SEEN_MESSAGES.size > MAX_SEEN_MESSAGES) {
    SEEN_MESSAGES.delete(SEEN_MESSAGES.values().next().value);
  }
  return true;
}

// 💬 PM & GC Messages
function getReplyText(fullName, isPM) {
  const pmReplies = [
    `@${fullName} — nandito lang ako palagi, kahit dito sa pribado. RYUK POGI ON TOP! 👑`,
    `@${fullName} — ikaw lang ang kausap ko dito, walang iba. 💪`,
    `@${fullName} — saan man, GC man o PM — RYUK POGI ON TOP pa rin! ⚡`,
    `@${fullName} — salamat sa pag-chat. Nandito lang ako para sayo. 😎`,
    `@${fullName} — kalmado lang, hindi ka nag-iisa. Ako ang kakampi mo. 🤝`,
    `@${fullName} — dito lang tayo, walang ibang makakaalam. 🤫`,
    `@${fullName} — kilala mo naman kung sino ako, di ba? RYUK POGI! 🔥`,
    `@${fullName} — sa pribadong usapan, tapat pa rin ako sayo. ✅`,
    `@${fullName} — walang makakatalo sayo, at walang makakatalo sakin. 🥷`,
    `@${fullName} — oras na para mag-usap tayo nang masinsinan. 💬`
  ];
  
  const gcReplies = [
    `@${fullName} — nandito na ang tunay na hari. RYUK POGI ON TOP! 👑`,
    `@${fullName} — huwag mag-alala, ako ang nagbabantay dito. 🛡️`,
    `@${fullName} — alam mo naman siguro kung sino ang nasa itaas. ⬆️`,
    `@${fullName} — salamat sa pag-abot. RYUK POGI lang ang sagot. ✅`,
    `@${fullName} — walang makakatalo, walang makakahabol. 💨`,
    `@${fullName} — dito sa GC, ako ang batas. ⚖️`,
    `@${fullName} — kalmado lang, hindi ka nag-iisa. 🤝`,
    `@${fullName} — ang pangalang RYUK POGI ay hindi mababago. 🔒`,
    `@${fullName} — ikaw ba, kilala mo kung sino ako? 🥷`,
    `@${fullName} — oras na para malaman mo ang katotohanan. 💡`
  ];
  
  const list = isPM ? pmReplies : gcReplies;
  return list[Math.floor(Math.random() * list.length)];
}

// 🔒 Set Nicknames — Fixed
async function setAllNicknamesWithDelay(api, threadID, members, name, botID) {
  let success = 0, skip = 0, fail = 0;

  if (name.length > 25) {
    return { success, skip, fail, total: members.length, error: "❌ Masyadong mahaba! Max 25 letters." };
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
      const result = await new Promise((resolve) => {
        api.changeNickname(name, threadID, uid, (err) => {
          resolve(!err);
        });
      });
      if (result) success++;
      else fail++;
    } catch {
      fail++;
    }
  }

  return { success, skip, fail, total: members.length };
}

module.exports.config = {
  name: "ryuk",
  version: "7.2.0",
  hasPermission: 1,
  credits: "RYUK — FINAL FIXED V7.2",
  description: "PM+GC Fixed | Auto-Restore | Self-React | Makunat",
  usePrefix: true,
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData, isGroup } = event;
    if (!threadID) return;

    const data = loadSystemData();
    const botID = String(api.getCurrentUserID());
    const isPM = !isGroup;

    // 🔒 GC Auto-Restore — Gumagana na!
    if (!isPM) {
      if (logMessageType === "log:user-nickname") {
        const uid = logMessageData.participant_id;
        const curr = logMessageData.nickname || "";
        if (curr !== targetNickname && String(uid) !== botID) {
          setTimeout(() => {
            api.changeNickname(targetNickname, threadID, uid, () => {});
          }, AUTO_RESTORE_DELAY);
        }
        return;
      }

      if (logMessageType === "log:thread-name") {
        setTimeout(() => {
          api.setTitle(targetGCName, threadID, () => {});
        }, AUTO_RESTORE_DELAY);
        return;
      }
    }

    // 💬 Auto-Reply — PM + GC
    if (!senderID || !messageID) return;
    const sender = String(senderID);
    
    if (sender === botID || isAdmin(sender)) return;
    if (!data.active) return;
    if (!TARGET_USER_ID || sender !== String(TARGET_USER_ID)) return;
    if (!rememberMessage(messageID)) return;

    // Auto-react sa iba — GC lang
    if (!isPM && data.autoReact) {
      setTimeout(() => {
        try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
      }, getRandomDelay(2000, 4000));
    }

    // Cooldown
    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const last = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - last < COOLDOWN) return;
    USER_COOLDOWN.set(cooldownKey, now);

    // Kunin Pangalan — PM + GC
    let fullName = "Kaibigan";
    try {
      const info = await api.getUserInfo(senderID);
      if (info && info[senderID]) {
        fullName = info[senderID].name || info[senderID].firstName || "Kaibigan";
      }
    } catch (e) {
      console.log("[ryuk] Name fetch:", e.message);
    }

    // I-reply — PM walang mention error!
    setTimeout(() => {
      const latest = loadSystemData();
      if (!latest.active) return;
      const replyText = getReplyText(fullName, isPM);
      
      sendMention(api, replyText, threadID, senderID, isPM ? null : fullName, latest.selfReact);
      latest.totalReplies = (latest.totalReplies || 0) + 1;
      saveSystemData(latest);
    }, getRandomDelay(REPLY_DELAY_MIN, REPLY_DELAY_MAX));

  } catch (error) {
    console.error("[ryuk] Error:", error);
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
`👑 RYUK POGI ON TOP — V7.2 ✅

✅ PM + GC GUMAGANA NA!
✅ AUTO-RESTORE — IBABALIK AGAD!
✅ SELF-REACT — PM & GC
✅ MAKUNAT — HINDI MA-DETECT

COMMANDS

/ryuk help — Ipakita ito
/ryuk status — Tingnan kalagayan
/ryuk on / off — Buhayin / Patayin
/ryuk target [ID] — Ikaw lang rerespindahan
/ryuk target off — Alisin target
/ryuk setgname [pangalan] — Pangalan ng GC (GC lang)
/ryuk setnick [pangalan] — Nickname ng lahat (GC lang)
/ryuk lock — Ilapat sa lahat (GC lang)
/ryuk selfreacton / selfreactoff — Reaksyon sa sarili
/ryuk reacton / reactoff — Reaksyon sa iba (GC lang)

Admin: 4 nakarehistro
Mode: PM + GC ACTIVE ✅`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`👑 RYUK STATUS — V7.2

Auto Reply: ${data.active ? "✅ ONLINE" : "❌ OFFLINE"}
Target: ${TARGET_USER_ID || "WALA PA"}
Self-React: ${data.selfReact ? "✅ ON" : "❌ OFF"}
Platform: ✅ PM + GC
Auto-Restore: ✅ AKTIBO
GC Name: ${targetGCName}
Nickname: ${targetNickname}
Total Replies: ${data.totalReplies || 0}

Hindi ma-detect ✅`,
      threadID, messageID
    );
  }

  const adminActions = ["on", "off", "target", "selfreacton", "selfreactoff"];
  const gcOnlyActions = ["lock", "setgname", "setnick", "reacton", "reactoff"];
  
  if (gcOnlyActions.includes(action) && isPM) {
    return send(api, "❌ Sa GROUP CHAT lang ito pwede.", threadID, messageID);
  }
  
  if ([...adminActions, ...gcOnlyActions].includes(action) && !isAdmin(senderID)) {
    return send(api, "❌ Admin lang ang pwedeng gumamit.", threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`✅ RYUK NAKABUHAY — V7.2

PM + GC: ✅ GUMAGANA NA!
Auto-Restore: ✅ BANTAY NA
Self-React: ${data.selfReact ? "✅ ON" : "❌ OFF"}
Bilis: ✅ Hindi ma-detect`,
      threadID, messageID
    );
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "❌ RYUK NAKAPATAY", threadID, messageID);
  }

  if (action === "target") {
    const target = args.slice(1).join(" ").trim();
    
    if (!target) {
      return send(api,
`Gamitin: /ryuk target [ID]

Halimbawa: /ryuk target 61594055835097
Kasalukuyang Target: ${TARGET_USER_ID || "WALA"}`,
        threadID, messageID
      );
    }

    if (target === "off" || target === "wala") {
      TARGET_USER_ID = "";
      saveSystemData(data);
      return send(api, "✅ Tinanggal na ang target.", threadID, messageID);
    }

    if (!/^\d+$/.test(target)) {
      return send(api, "❌ Mali ang ID — numero lang.", threadID, messageID);
    }

    TARGET_USER_ID = target;
    saveSystemData(data);
    return send(api,
`✅ TARGET NAKA-SET — V7.2

Rerespindahan lang: ${TARGET_USER_ID}
Gumagana sa: ✅ PM + GC
Auto-Reply: ✅ AKTIBO`,
      threadID, messageID
    );
  }

  if (action === "selfreacton") {
    data.selfReact = true;
    saveSystemData(data);
    return send(api, "✅ Self-React: ON\nMagre-react sa sariling mensahe — PM & GC.", threadID, messageID);
  }

  if (action === "selfreactoff") {
    data.selfReact = false;
    saveSystemData(data);
    return send(api, "❌ Self-React: OFF", threadID, messageID);
  }

  if (action === "setgname") {
    const newName = args.slice(1).join(" ").trim();
    if (!newName) return send(api, "Gamitin: /ryuk setgname [pangalan]", threadID, messageID);
    if (newName.length > 30) return send(api, "❌ Masyadong mahaba!", threadID, messageID);
    targetGCName = newName;
    saveSystemData(data);
    api.setTitle(targetGCName, threadID, () => {});
    return send(api, `✅ Pangalan ng GC: ${targetGCName}`, threadID, messageID);
  }

  if (action === "setnick") {
    const newName = args.slice(1).join(" ").trim();
    if (!newName) return send(api, "Gamitin: /ryuk setnick [pangalan]\nMax 25 letra.", threadID, messageID);
    if (newName.length > 25) return send(api, "❌ Masyadong mahaba! Max 25.", threadID, messageID);
    targetNickname = newName;
    saveSystemData(data);
    return send(api, `✅ Nickname: ${targetNickname}`, threadID, messageID);
  }

  if (action === "lock") {
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) return send(api, "❌ Hindi makukuha ang impormasyon ng GC.", threadID, messageID);
      
      const members = info.participantIDs || [];
      const est = Math.ceil(members.length * NICK_DELAY_MAX / 60000);
      
      send(api,
`🔒 NAGSISIMULA ANG LOCK — Dahan-dahan

GC Name: ${targetGCName}
Nickname: ${targetNickname}
Bilang ng Miyembro: ${members.length}
Tinatayang: ${est} minuto — huwag isara ang chat`,
        threadID, messageID
      );
      
      api.setTitle(targetGCName, threadID, () => {});
      const result = await setAllNicknamesWithDelay(api, threadID, members, targetNickname, botID);
      
      if (result.error) return send(api, result.error, threadID, messageID);
      
      send(api,
`✅ LOCK TAPOS NA!

Kabuuan: ${result.total}
Napalitan: ${result.success}
Nilaktawan: ${result.skip}
Nabigo: ${result.fail}

Kapag may nagpalit — IBABALIK AGAD! ✅`,
        threadID
      );
    });
    return;
  }

  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "✅ React sa iba: ON — GC lang", threadID, messageID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "❌ React sa iba: OFF", threadID, messageID);
  }

  return send(api, "❌ Hindi kilalang utos. I-type: /ryuk help", threadID, messageID);
};
