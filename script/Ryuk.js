const fs = require("fs");
const path = require("path");

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817",
  "61595507156493"
];

let TARGET_USER_ID = "";
let targetNickname = "RYUK POGI";
let targetGCName = "RYUK POGI ON TOP";

const SELF_REACT_EMOJIS = ["😡", "😠", "🤬", "😤", "😾"];
const ALL_REACT_EMOJIS = ["🔥", "💪", "👑", "⚡", "😎", "✅", "💯"];

const AUTO_MESSAGE_INTERVAL_MIN = 20 * 60 * 1000;
const AUTO_MESSAGE_INTERVAL_MAX = 35 * 60 * 1000;

// ⚡ SOBRANG BILIS NA — PARANG FLASH!
const NICK_DELAY_MIN = 300;
const NICK_DELAY_MAX = 600;
const REPLY_DELAY_MIN = 50;     // ⚡ AGAD NA SASAGOT
const REPLY_DELAY_MAX = 150;    // ⚡ WALANG HINTAY
const COOLDOWN = 800;

const REACT_ON = "😺";
const REACT_OFF = "😿";

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const AUTO_MESSAGES = [
  "😡",
  "😠",
  "🤬",
  "😤 Watching...",
  "😾",
  "😡 Silent but watching",
  "😠",
  "🤬",
  "😾",
  "😤"
];

const DEFAULT_DATA = {
  active: true,
  silentMode: false,
  autoReact: false,
  selfReact: true,
  autoChat: true,
  targetNickname: "RYUK POGI",
  targetGCName: "RYUK POGI ON TOP",
  targetUserID: ""
};

const USER_COOLDOWN = new Map();
const PROCESSED_MESSAGES = new Set();
let AUTO_CHAT_TIMER = null;
let CURRENT_THREAD_ID = null;

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID).trim());
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomEmoji() {
  return SELF_REACT_EMOJIS[Math.floor(Math.random() * SELF_REACT_EMOJIS.length)];
}

function getRandomAutoReactEmoji() {
  return ALL_REACT_EMOJIS[Math.floor(Math.random() * ALL_REACT_EMOJIS.length)];
}

function getRandomAutoMessage() {
  return AUTO_MESSAGES[Math.floor(Math.random() * AUTO_MESSAGES.length)];
}

function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
    }
  } catch {}
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    data.targetNickname = targetNickname;
    data.targetGCName = targetGCName;
    data.targetUserID = String(TARGET_USER_ID).trim();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

function startAutoChat(api, threadID) {
  CURRENT_THREAD_ID = threadID;
  stopAutoChat();
  scheduleNextAutoMessage(api);
}

function stopAutoChat() {
  if (AUTO_CHAT_TIMER) {
    clearTimeout(AUTO_CHAT_TIMER);
    AUTO_CHAT_TIMER = null;
  }
}

function scheduleNextAutoMessage(api) {
  const data = loadSystemData();
  if (!data.active || !data.autoChat || !CURRENT_THREAD_ID) return;
  
  const delay = getRandomDelay(AUTO_MESSAGE_INTERVAL_MIN, AUTO_MESSAGE_INTERVAL_MAX);
  
  AUTO_CHAT_TIMER = setTimeout(() => {
    if (data.active && data.autoChat && CURRENT_THREAD_ID) {
      const msg = getRandomAutoMessage();
      api.sendMessage(msg, CURRENT_THREAD_ID, (err, info) => {
        if (!err && data.selfReact && info) {
          setTimeout(() => {
            try { api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true); } catch {}
          }, getRandomDelay(400, 800));
        }
        scheduleNextAutoMessage(api);
      });
    }
  }, delay);
}

function send(api, message, threadID, messageID, doSelfReact = false) {
  return api.sendMessage(message, threadID, (err, info) => {
    if (!err && doSelfReact && info) {
      setTimeout(() => {
        try { api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true); } catch {}
      }, getRandomDelay(400, 800));
    }
  }, messageID);
}

function markAsProcessed(messageID) {
  const id = String(messageID);
  if (PROCESSED_MESSAGES.has(id)) return false;
  PROCESSED_MESSAGES.add(id);
  return true;
}

function getReplyText(fullName, isPM) {
  const pmReplies = [
    `@${fullName} — 近寄るな。お前なんかに興味はない 😡😂 /silent`,
    `@${fullName} — さっさと消えろ。俺の機嫌が悪くなる前にな 😡😂 /silent`,
    `@${fullName} — お前誰だよ？俺の時間を無駄にするな 😡😂 /silent`,
    `@${fullName} — うるさい。静かにできないのか 😡😂 /silent`,
    `@${fullName} — 俺から何も得られるものはない。帰れ 😡😂 /silent`
  ];
    
  const gcReplies = [
    `@${fullName} — Huwagg kang mag-ingay ditto, manahimik k 😡😂 /silent`,
    `@${fullName} — Umalis k na bago pa magalit ang ibaa 😡😂 /silent`,
    `@${fullName} — Sino kaba para manggulo ditto? 😡😂 /silent`,
    `@${fullName} — Ang kulit moo, hndi ba pwede tumahimik? 😡😂 /silent`,
    `@${fullName} — Wala kang ambag ditto, wag kang magsalita 😡😂 /silent`
  ];
  return isPM 
    ? pmReplies[Math.floor(Math.random() * pmReplies.length)] 
    : gcReplies[Math.floor(Math.random() * gcReplies.length)];
}

module.exports.config = {
  name: "ryuk",
  version: "7.23.0 FLASH SPEED",
  hasPermission: 1,
  credits: "RYUK",
  description: "⚡ FLASH SPEED — Agad sasagot!",
  usePrefix: true,
  cooldowns: 0.8
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData, isGroup, body } = event;
    if (!threadID || !senderID) return;
    const data = loadSystemData();
    const botID = String(api.getCurrentUserID());
    const isPM = !isGroup;
    const sender = String(senderID).trim();
    const msg = String(body || "").trim().toLowerCase();
    if (!data.active) return;

    if (!markAsProcessed(messageID)) return;

    if (!isPM && data.autoChat && !CURRENT_THREAD_ID) {
      startAutoChat(api, threadID);
    }

    if (!isPM) {
      if (logMessageType === "log:user-nickname") {
        const uid = String(logMessageData.participant_id).trim();
        const curr = String(logMessageData.nickname || "").trim();
        if (curr !== targetNickname && uid !== botID) {
          setTimeout(() => {
            api.changeNickname(targetNickname, threadID, uid, () => {});
          }, getRandomDelay(NICK_DELAY_MIN, NICK_DELAY_MAX));
        }
        return;
      }
      if (logMessageType === "log:thread-name") {
        const currName = String(logMessageData.name || "").trim();
        if (currName !== targetGCName) {
          setTimeout(() => {
            api.setTitle(targetGCName, threadID, () => {});
          }, getRandomDelay(NICK_DELAY_MIN, NICK_DELAY_MAX));
        }
        return;
      }
    }

    if (!isPM && !isAdmin(sender)) {
      if (msg === "ryuk" || msg.startsWith("/ryuk")) {
        if (data.autoReact) {
          setTimeout(() => {
            try { api.setMessageReaction("🐕‍🦺", messageID, () => {}, true); } catch {}
          }, getRandomDelay(100, 200));
        }
        return;
      }
      if (data.autoReact) {
        setTimeout(() => {
          try { api.setMessageReaction(getRandomAutoReactEmoji(), messageID, () => {}, true); } catch {}
        }, getRandomDelay(100, 200));
      }
      return;
    }

    if (sender === botID) return;
    const targetIDClean = String(TARGET_USER_ID).trim();
    if (targetIDClean && sender !== targetIDClean && !isAdmin(sender)) return;
    if (data.silentMode) return;

    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const last = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - last < COOLDOWN) return;
    USER_COOLDOWN.set(cooldownKey, now);

    let fullName = "Kaibigan";
    try {
      const info = await api.getUserInfo(senderID);
      if (info && info[senderID]) fullName = info[senderID].name || "Kaibigan";
    } catch {}

    setTimeout(() => {
      const latest = loadSystemData();
      if (!latest.active || latest.silentMode) return;
      const replyText = getReplyText(fullName, isPM);
      if (isPM) {
        api.sendMessage(replyText, threadID, (err, info) => {
          if (!err && latest.selfReact && info) {
            setTimeout(() => {
              try { api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true); } catch {}
            }, getRandomDelay(400, 800));
          }
        });
      } else {
        api.sendMessage(
          {
            body: replyText,
            mentions: [
              { tag: `@${fullName}`, id: senderID, fromIndex: 0 }
            ]
          },
          threadID,
          (err, info) => {
            if (!err && latest.selfReact && info) {
              setTimeout(() => {
                try { api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true); } catch {}
              }, getRandomDelay(400, 800));
            }
          }
        );
      }
    }, getRandomDelay(REPLY_DELAY_MIN, REPLY_DELAY_MAX));
  } catch {}
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID, isGroup } = event;
  const action = (args[0] || "").toLowerCase();
  const data = loadSystemData();
  const isPM = !isGroup;
  const sender = String(senderID).trim();
  
  if (isGroup && !isAdmin(sender)) {
    setTimeout(() => { try { api.setMessageReaction("🤢", messageID, () => {}, true); } catch {} }, 150);
    return;
  }
  
  if (action === "help") {
    return send(api,
`BOT COMMAND:
 /ryuk help
 /ryuk status
 /ryuk on
 /ryuk off
 /ryuk silent
 /ryuk unsilent
 /ryuk autochat on
 /ryuk autochat off
 /ryuk target [ID]
 /ryuk target off
 /ryuk setgname [pangalan]
 /ryuk setnick [pangalan]
 /ryuk selfreacton
 /ryuk selfreactoff
 /ryuk reacton
 /ryuk reactoff`, threadID, messageID);
  }
  
  if (action === "status") {
    return send(api,
`👑 RYUK STATUS
 ✅ ACTIVE: ${data.active ? "ONLINE" : "OFFLINE"}
 🔇 SILENT: ${data.silentMode ? "ON" : "OFF"}
 💬 AUTO-CHAT: ${data.autoChat ? "ON" : "OFF"}
 🎯 TARGET: ${TARGET_USER_ID || "LAHAT"}
 💬 AUTO-REACT: ${data.autoReact ? "ON" : "OFF"}
 😊 SELF-REACT: ${data.selfReact ? "ON" : "OFF"}
 🏷️ GC NAME: ${targetGCName}
 👤 NICKNAME: ${targetNickname}`, threadID, messageID);
  }
  
  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    api.setMessageReaction(REACT_ON, messageID, () => {}, true);
    return send(api, "✅ RYUK → ACTIVATED 😺", threadID, messageID);
  }
  
  if (action === "off") {
    data.active = false;
    data.autoChat = false;
    stopAutoChat();
    saveSystemData(data);
    api.setMessageReaction(REACT_OFF, messageID, () => {}, true);
    return send(api, "❌ RYUK → DEACTIVATED 😿", threadID, messageID);
  }
  
  if (action === "silent") {
    data.silentMode = true;
    saveSystemData(data);
    return send(api, "🔇 SILENT MODE → ON", threadID, messageID);
  }
  
  if (action === "unsilent") {
    data.silentMode = false;
    saveSystemData(data);
    return send(api, "🔊 SILENT MODE → OFF", threadID, messageID);
  }

  if (action === "autochat" && args[1] === "on") {
    data.autoChat = true;
    saveSystemData(data);
    if (!isPM) startAutoChat(api, threadID);
    return send(api, "💬 AUTO-CHAT → ON\nEvery 20-35 mins ✅", threadID, messageID);
  }
  
  if (action === "autochat" && args[1] === "off") {
    data.autoChat = false;
    stopAutoChat();
    saveSystemData(data);
    return send(api, "💬 AUTO-CHAT → OFF ✅", threadID, messageID);
  }
  
  if (action === "target") {
    if (args[1] && args[1] !== "off") {
      TARGET_USER_ID = args[1];
      saveSystemData(data);
      return send(api, `🎯 TARGET SET: ${TARGET_USER_ID}`, threadID, messageID);
    } else if (args[1] === "off") {
      TARGET_USER_ID = "";
      saveSystemData(data);
      return send(api, "🎯 TARGET → OFF", threadID, messageID);
    }
    return send(api, "⚠️ GAMIT: /ryuk target [ID]", threadID, messageID);
  }
  
  if (action === "setgname") {
    if (isPM) return send(api, "❌ SA GC LANG PWEDI", threadID, messageID);
    const newName = args.slice(1).join(" ").trim();
    if (!newName) return send(api, "⚠️ GAMIT: /ryuk setgname [pangalan]", threadID, messageID);
    targetGCName = newName;
    api.setTitle(targetGCName, threadID, () => {});
    saveSystemData(data);
    return send(api, `✅ GC NAME → ${targetGCName}`, threadID, messageID);
  }
  
  if (action === "setnick") {
    if (isPM) return send(api, "❌ SA GC LANG PWEDI", threadID, messageID);
    const newNick = args.slice(1).join(" ").trim();
    if (!newNick) return send(api, "⚠️ GAMIT: /ryuk setnick [pangalan]", threadID, messageID);
    targetNickname = newNick;
    saveSystemData(data);
    return send(api, `✅ NICKNAME → ${targetNickname}`, threadID, messageID);
  }
  
  if (action === "selfreacton") {
    data.selfReact = true;
    saveSystemData(data);
    return send(api, "✅ SELF-REACT → ON", threadID, messageID);
  }
  
  if (action === "selfreactoff") {
    data.selfReact = false;
    saveSystemData(data);
    return send(api, "❌ SELF-REACT → OFF", threadID, messageID);
  }
  
  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "✅ AUTO-REACT → ON", threadID, messageID);
  }
  
  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "❌ AUTO-REACT → OFF", threadID, messageID);
  }
};
    
