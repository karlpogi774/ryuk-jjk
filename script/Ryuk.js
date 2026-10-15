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

const SELF_REACT_EMOJIS = ["🌙", "🖤", "🕊️", "☁️", "🦋", "🌑", "🌌"];
const ALL_REACT_EMOJIS = ["🔥", "💪", "👑", "⚡", "😎", "✅", "💯"];

// ✅ MGA AYUS NA DELAYS — HINDI NA MABILIS, HINDI MA-DETECT
const NICK_DELAY_MIN = 8000;
const NICK_DELAY_MAX = 15000;
const REPLY_DELAY_MIN = 3500;    // ✅ DATI 2000 → 3500 mas ligtas
const REPLY_DELAY_MAX = 6000;    // ✅ DATI 2000 → 6000 random delay
const AUTO_RESTORE_DELAY = 250000;
const COOLDOWN = 3000;           // ✅ DATI 2000 → 3000 mas mahaba pahinga

// ✅ ON/OFF REACT EMOJI
const REACT_ON = "😺";
const REACT_OFF = "😿";

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: true,
  silentMode: false,
  autoReact: false,
  selfReact: true,
  targetNickname: "RYUK POGI",
  targetGCName: "RYUK POGI ON TOP",
  targetUserID: ""
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();

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

function send(api, message, threadID, messageID, doSelfReact = false) {
  return api.sendMessage(message, threadID, (err, info) => {
    if (!err && doSelfReact && info) {
      setTimeout(() => {
        try { api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true); } catch {}
      }, getRandomDelay(5000, 8000)); // ✅ Random delay sa self-react
    }
  }, messageID);
}

function rememberMessage(messageID) {
  const id = String(messageID);
  if (SEEN_MESSAGES.has(id)) return false;
  SEEN_MESSAGES.add(id);
  return true;
}

function getReplyText(fullName, isPM) {
  const pmReplies = [
    `@${fullName} — 近寄るな。お前なんかに興味はない 😡😂 /silent`,
    `@${fullName} — さっさと消えろ。俺の機嫌が悪くなる前にな 😡😂 /silent`,
    `@${fullName} — お前誰だよ？俺の時間を無駄にするな 😡😂 /silent`,
    `@${fullName} — うるさい。静かにできないのか 😡😂 /silent`,
    `@${fullName} — 俺から何も得られるものはない。帰れ 😡😂 /silent`,
    `@${fullName} — 本当にしつこいな。いい加減にしろ 😡😂 /silent`,
    `@${fullName} — 知り合いでもないのに馴れ馴れしい 😡😂 /silent`,
    `@${fullName} — 声が大きすぎる。黙れ 😡😂 /silent`,
    `@${fullName} — お前と話す気はない。邪魔するな 😡😂 /silent`,
    `@${fullName} — もう一度言ってみろ。後悔することになるぞ 😡😂 /silent`
  ];
    
  const gcReplies = [
    `@${fullName} — Huwagg kang mag-ingay ditto, manahimik k 😡😂 /silent`,
    `@${fullName} — Umalis k na bago pa magalit ang ibaa 😡😂 /silent`,
    `@${fullName} — Sino kaba para manggulo ditto? 😡😂 /silent`,
    `@${fullName} — Ang kulit moo, hndi ba pwede tumahimik? 😡😂 /silent`,
    `@${fullName} — Wala kang ambag ditto, wag kang magsalita 😡😂 /silent`,
    `@${fullName} — Nakakainis n ang pag-uugali moo 😡😂 /silent`,
    `@${fullName} — Huwagg kang umepall, hndi ikaw ang bida 😡😂 /silent`,
    `@${fullName} — Masyado kang maingayg, tumahimik k nga 😡😂 /silent`,
    `@${fullName} — Hndi k sentro ng atensyonn ditto 😡😂 /silent`,
    `@${fullName} — Subukan m ulit at paalisin kitaa 😡😂 /silent`
  ];
  return isPM 
    ? pmReplies[Math.floor(Math.random() * pmReplies.length)] 
    : gcReplies[Math.floor(Math.random() * gcReplies.length)];
}

module.exports.config = {
  name: "ryuk",
  version: "7.10.0 SAFE DELAYS",
  hasPermission: 1,
  credits: "RYUK",
  description: "✅ Safe delays + on/off emoji react",
  usePrefix: true,
  cooldowns: 3
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

    if (!isPM) {
      if (logMessageType === "log:user-nickname") {
        const uid = String(logMessageData.participant_id).trim();
        const curr = String(logMessageData.nickname || "").trim();
        if (curr !== targetNickname && uid !== botID) {
          setTimeout(() => {
            api.changeNickname(targetNickname, threadID, uid, () => {});
          }, getRandomDelay(NICK_DELAY_MIN, NICK_DELAY_MAX)); // ✅ Random delay
        }
        return;
      }
      if (logMessageType === "log:thread-name") {
        const currName = String(logMessageData.name || "").trim();
        if (currName !== targetGCName) {
          setTimeout(() => {
            api.setTitle(targetGCName, threadID, () => {});
          }, getRandomDelay(NICK_DELAY_MIN, NICK_DELAY_MAX)); // ✅ Random delay
        }
        return;
      }
    }

    if (!isPM && !isAdmin(sender)) {
      if (msg === "ryuk" || msg.startsWith("/ryuk")) {
        if (data.autoReact) {
          setTimeout(() => {
            try { api.setMessageReaction("🐕‍🦺", messageID, () => {}, true); } catch {}
          }, getRandomDelay(1500, 2500)); // ✅ Random delay sa auto-react
        }
        return;
      }
      if (data.autoReact && rememberMessage(messageID)) {
        setTimeout(() => {
          try { api.setMessageReaction(getRandomAutoReactEmoji(), messageID, () => {}, true); } catch {}
        }, getRandomDelay(1500, 3000)); // ✅ Random delay — hindi parehas palagi
      }
      return;
    }

    if (sender === botID) return;
    const targetIDClean = String(TARGET_USER_ID).trim();
    if (targetIDClean && sender !== targetIDClean && !isAdmin(sender)) return;
    if (!rememberMessage(messageID)) return;
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
            }, getRandomDelay(5000, 8000));
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
              }, getRandomDelay(5000, 8000));
            }
          }
        );
      }
    }, getRandomDelay(REPLY_DELAY_MIN, REPLY_DELAY_MAX)); // ✅ Random reply delay
  } catch {}
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID, isGroup } = event;
  const action = (args[0] || "").toLowerCase();
  const data = loadSystemData();
  const isPM = !isGroup;
  const sender = String(senderID).trim();
  
  if (isGroup && !isAdmin(sender)) {
    setTimeout(() => { try { api.setMessageReaction("🤢", messageID, () => {}, true); } catch {} }, 1500);
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
 🎯 TARGET: ${TARGET_USER_ID || "LAHAT"}
 💬 AUTO-REACT: ${data.autoReact ? "ON" : "OFF"}
 😊 SELF-REACT: ${data.selfReact ? "ON" : "OFF"}
 🏷️ GC NAME: ${targetGCName}
 👤 NICKNAME: ${targetNickname}`, threadID, messageID);
  }
  
  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    api.setMessageReaction(REACT_ON, messageID, () => {}, true); // ✅ 😺 react
    return send(api, "✅ RYUK → ACTIVATED 😺", threadID, messageID);
  }
  
  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    api.setMessageReaction(REACT_OFF, messageID, () => {}, true); // ✅ 😿 react
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
  
