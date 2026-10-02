const fs = require("fs");
const path = require("path");

// ==========================================================
// 👑 RYUK POGI ON TOP — V7.6 ✅ AYOS NA ANG PAGPILI NG SASAGOT!
// ==========================================================
// ✅ SA GC — IKAW LANG ANG SASAGOT! IBANG TAO = WALANG SAGOT!
// ✅ "RYUK" SA GC MULA SA IBA → TAHIMIK LANG, WALANG LUMALABAS!
// ✅ AUTO-RESTORE GC NAME + NICKNAME — GUMAGANA PALAGI!
// ✅ LAHAT NG MAHABANG LINYA MO — NANDITO PA RIN! ✅
// ==========================================================
const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

let TARGET_USER_ID = "";
let targetNickname = "RYUK POGI";
let targetGCName = "RYUK POGI ON TOP";

const SELF_REACT_EMOJIS = ["🤬", "😡"];
const ALL_REACT_EMOJIS = ["🔥", "💪", "👑", "⚡", "😎", "✅", "💯"];

const NICK_DELAY_MIN = 2500;
const NICK_DELAY_MAX = 450;
const REPLY_DELAY_MIN = 15000;
const REPLY_DELAY_MAX = 15000;
const AUTO_RESTORE_DELAY = 10;
const COOLDOWN = 15000;

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: true,
  silentMode: false,
  autoReact: false,
  selfReact: true,
  totalReplies: 0,
  totalMentions: 0,
  totalRestores: 0,
  targetNickname: "RYUK POGI",
  targetGCName: "RYUK POGI ON TOP",
  targetUserID: "",
  lastActive: null,
  createdVersion: "7.6.0"
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN_MESSAGES = 5000;
const RESTORE_LOG = [];

function isAdmin(senderID) {
  const id = String(senderID).trim();
  return ADMIN_IDS.includes(id);
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
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      targetNickname = saved.targetNickname || targetNickname;
      targetGCName = saved.targetGCName || targetGCName;
      TARGET_USER_ID = String(saved.targetUserID || "").trim();
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (error) {
    console.error("[RYUK LOAD ERROR] —", error.message);
  }
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    data.targetNickname = targetNickname;
    data.targetGCName = targetGCName;
    data.targetUserID = String(TARGET_USER_ID).trim();
    data.lastActive = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[RYUK SAVE ERROR] —", error.message);
    return false;
  }
}

function addRestoreLog(type, oldValue, newValue) {
  RESTORE_LOG.unshift({
    time: new Date().toISOString(),
    type: type,
    old: oldValue,
    new: newValue
  });
  if (RESTORE_LOG.length > 20) RESTORE_LOG.pop();
}

function send(api, message, threadID, messageID, doSelfReact = false) {
  return api.sendMessage(message, threadID, (err, info) => {
    if (!err && doSelfReact && info) {
      setTimeout(() => {
        try {
          api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
        } catch (e) {
          console.log("[RYUK REACT ERROR] —", e.message);
        }
      }, getRandomDelay(10, 10));
    }
  }, messageID);
}

function sendMention(api, text, threadID, mentionsList = [], doSelfReact = false) {
  const msgBody = mentionsList.length > 0 
    ? { body: text, mentions: mentionsList } 
    : text;
  return api.sendMessage(msgBody, threadID, (err, info) => {
    if (!err && doSelfReact && info) {
      setTimeout(() => {
        try {
          api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
        } catch (e) {
          console.log("[RYUK REACT ERROR] —", e.message);
        }
      }, getRandomDelay(10, 10));
    }
  });
}

async function sendEveryone(api, text, threadID, doSelfReact = false) {
  return new Promise((resolve) => {
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        console.log("[RYUK EVERYONE ERROR] — Hindi makuha ang impormasyon ng GC");
        resolve(send(api, text, threadID, null, doSelfReact));
        return;
      }
      const members = info.participantIDs || [];
      const mentions = members.map(id => ({ tag: "@everyone", id: id }));
      api.sendMessage({ body: text, mentions: mentions }, threadID, (err, info) => {
        if (!err && doSelfReact && info) {
          setTimeout(() => {
            try {
              api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true);
            } catch (e) {
              console.log("[RYUK REACT ERROR] —", e.message);
            }
          }, getRandomDelay(10, 10));
        }
        resolve();
      });
    });
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

// ==========================================================
// ✅ ITO ANG HINDI BABAGUHIN — LAHAT NG MAHABANG LINYA MO!
// ==========================================================
function getReplyText(fullName, isPM) {
  const pmReplies = [
    `@${fullName} — nandito lang ako palagi para sayo. RYUK POGI ON TOP! 😸😼🤣😂`,
    `@${fullName} — ikaw lang ang kausap ko dito, walang iba. 😸😼🤣😂`,
    `@${fullName} — saan man, GC man o PM — RYUK POGI ON TOP pa rin! 😸😼🤣😂`,
    `@${fullName} — salamat sa pag-chat. Nandito lang ako palagi para sayo. 😸😼🤣😂`,
    `@${fullName} — kalmado lang, hindi ka nag-iisa. Ako ang kakampi mo. 😸😼🤣😂`,
    `@${fullName} — dito lang tayo, walang ibang makakaalam. 😸😼🤣😂`,
    `@${fullName} — kilala mo naman kung sino ako, di ba? RYUK POGI! 😸😼🤣😂`,
    `@${fullName} — sa pribadong usapan, tapat pa rin ako sayo. 😸😼🤣😂`,
    `@${fullName} — walang makakatalo sayo, at walang makakatalo sakin. 😸😼🤣😂`,
    `@${fullName} — oras na para mag-usap tayo nang masinsinan. 😸😼🤣😂`,
    `@${fullName} — hindi ako aalis hangga't kailangan mo ako. 😸😼🤣😂`,
    `@${fullName} — dito sa atin, walang susuko, walang bibitaw. 😸😼🤣😂`,
    `@${fullName} — ikaw ang pinili ko, at ikaw lang palagi. 😸😼🤣😂`,
    `@${fullName} — ang pangalang RYUK POGI ay hindi mababago. 😸😼🤣😂`,
    `@${fullName} — tiwala lang, hindi ka mabibigo. 😸😼🤣😂`
  ];
  const gcReplies = [
    `@${fullName} — nandito na ang tunay na hari. RYUK POGI ON TOP! 😸😼🤣😂`,
    `@${fullName} — huwag mag-alala, ako ang nagbabantay dito. 😸😼🤣😂`,
    `@${fullName} — alam mo naman siguro kung sino ang nasa itaas. 😸😼🤣😂`,
    `@${fullName} — salamat sa pag-abot. RYUK POGI lang ang sagot. 😸😼🤣😂`,
    `@${fullName} — walang makakatalo, walang makakahabol. 😸😼🤣😂`,
    `@${fullName} — dito sa GC, ako ang batas. 😸😼🤣😂`,
    `@${fullName} — kalmado lang, hindi ka nag-iisa. 😸😼🤣😂`,
    `@${fullName} — ang pangalang RYUK POGI ay hindi mababago. 😸😼🤣😂`,
    `@${fullName} — ikaw ba, kilala mo kung sino ako? 😸😼🤣😂`,
    `@${fullName} — oras na para malaman mo ang katotohanan. 😸😼🤣😂`,
    `@${fullName} — dito walang pinapanigan, tapat lang ako sa lahat. 😸😼🤣😂`,
    `@${fullName} — ang nasa itaas ay mananatili sa itaas. 😸😼🤣😂`,
    `@${fullName} — hindi ako magpapaloko, hindi ako matitinag. 😸😼🤣😂`,
    `@${fullName} — kung sino ang totoo, makikita mo sa gawa. 😸😼🤣😂`,
    `@${fullName} — RYUK POGI ON TOP — hindi ito sabi, ito ay alam. 😸😼🤣😂`
  ];
  const list = isPM ? pmReplies : gcReplies;
  return list[Math.floor(Math.random() * list.length)];
}

async function setAllNicknamesWithDelay(api, threadID, members, name, botID) {
  let success = 0, skip = 0, fail = 0;
  if (name.length > 25) {
    return { success, skip, fail, total: members.length, error: "❌ Masyadong mahaba ang pangalan! Pinakamataas: 25 letra." };
  }
  for (const uid of members) {
    if (String(uid) === String(botID)) {
      skip++;
      continue;
    }
    await new Promise(resolve => setTimeout(resolve, getRandomDelay(NICK_DELAY_MIN, NICK_DELAY_MAX)));
    try {
      const result = await new Promise((resolve) => {
        api.changeNickname(name, threadID, uid, (err) => {
          if (err) {
            console.log(`[RYUK NICK FAIL] — ID: ${uid} | Error: ${err.message}`);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
      if (result) {
        success++;
      } else {
        fail++;
      }
    } catch (error) {
      console.log(`[RYUK NICK ERROR] — ID: ${uid} | ${error.message}`);
      fail++;
    }
  }
  return { success, skip, fail, total: members.length };
}

module.exports.config = {
  name: "ryuk",
  version: "7.6.0",
  hasPermission: 1,
  credits: "RYUK — IKAW LANG ANG SASAGOT SA GC ✅",
  description: "✅ SA GC IKAW LANG — IBA = WALANG SAGOT | Auto-Restore | Makunat",
  usePrefix: true,
  cooldowns: 15
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

    // ✅ AUTO-RESTORE GC NAME AT NICKNAME — GUMAGANA PALAGI
    if (!isPM) {
      if (logMessageType === "log:user-nickname") {
        const uid = String(logMessageData.participant_id).trim();
        const curr = String(logMessageData.nickname || "").trim();
        if (curr !== targetNickname && uid !== botID) {
          setTimeout(() => {
            api.changeNickname(targetNickname, threadID, uid, (err) => {
              if (err) {
                console.log(`[RYUK RESTORE NICK FAIL] — ${uid} | ${err.message}`);
              } else {
                data.totalRestores = (data.totalRestores || 0) + 1;
                saveSystemData(data);
              }
            });
          }, AUTO_RESTORE_DELAY);
        }
        return;
      }
      if (logMessageType === "log:thread-name") {
        const currName = String(logMessageData.name || "").trim();
        if (currName !== targetGCName) {
          setTimeout(() => {
            api.setTitle(targetGCName, threadID, (err) => {
              if (err) {
                console.log(`[RYUK RESTORE GC FAIL] — ${err.message}`);
              } else {
                data.totalRestores = (data.totalRestores || 0) + 1;
                saveSystemData(data);
              }
            });
          }, AUTO_RESTORE_DELAY);
        }
        return;
      }
    }

    // ==========================================================
    // ✅ PINAKAIMPORTANTENG AYUS: SA GC — IKAW LANG ANG SASAGOT!
    // ==========================================================
    if (!isPM && !isAdmin(sender)) {
      // May nag-chat ng "ryuk" o command sa GC na hindi ikaw → WALANG SAGOT!
      if (msg === "ryuk" || msg.startsWith("ryuk ") || msg.startsWith("/ryuk")) {
        // Magre-react lang kung gusto mo, pero WALANG SAGOT!
        if (data.autoReact) {
          setTimeout(() => {
            try {
              api.setMessageReaction("✅", messageID, () => {}, true);
            } catch {}
          }, getRandomDelay(10, 10));
        }
        return; // ❌ TUMIGIL — WALANG LUMALABAS NA MENSAHE!
      }

      // Ibang mensahe sa GC mula sa hindi ikaw → magre-react lang kung naka-ON
      if (data.autoReact && rememberMessage(messageID)) {
        setTimeout(() => {
          try {
            api.setMessageReaction(getRandomAutoReactEmoji(), messageID, () => {}, true);
          } catch (e) {
            console.log("[RYUK AUTOREACT ERROR] —", e.message);
          }
        }, getRandomDelay(10, 10));
      }
      return; // ❌ HINDI SASAGOT SA IBANG TAO SA GC!
    }

    // ✅ DITO LANG SASAGOT — IKAW O SA PM
    if (sender === botID) return;

    const targetIDClean = String(TARGET_USER_ID).trim();
    if (targetIDClean && sender !== targetIDClean && !isAdmin(sender)) {
      return;
    }

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
      if (info && info[senderID]) {
        fullName = info[senderID].name || info[senderID].firstName || "Kaibigan";
      }
    } catch (e) {
      console.log("[RYUK NAME FETCH ERROR] —", e.message);
    }

    setTimeout(() => {
      const latest = loadSystemData();
      if (!latest.active || latest.silentMode) return;
      const replyText = getReplyText(fullName, isPM);
      const mentions = isPM ? [] : [{ tag: `@${fullName}`, id: senderID }];
      sendMention(api, replyText, threadID, mentions, latest.selfReact);
      latest.totalReplies = (latest.totalReplies || 0) + 1;
      latest.totalMentions = (latest.totalMentions || 0) + 1;
      saveSystemData(latest);
    }, getRandomDelay(REPLY_DELAY_MIN, REPLY_DELAY_MAX));

  } catch (error) {
    console.error("[RYUK HANDLE EVENT ERROR] —", error);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID, isGroup } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();
  const botID = String(api.getCurrentUserID());
  const isPM = !isGroup;
  const sender = String(senderID).trim();

  // ✅ SA GC — KUNG HINDI IKAW ANG NAG-COMMAND → WALANG SAGOT!
  if (isGroup && !isAdmin(sender)) {
    setTimeout(() => {
      try { api.setMessageReaction("✅", messageID, () => {}, true); } catch {}
    }, 1000);
    return; // TAHIMIK LANG — WALANG LUMALABAS!
  }

  if (action === "help") {
    return send(api,
`👑 RYUK POGI ON TOP — V7.6 ✅ IKAW LANG ANG SASAGOT SA GC!

✅ SA GC — IKAW LANG ANG RERESPINDAHAN! IBA = WALANG SAGOT!
✅ "RYUK" MULA SA IBA SA GC → TAHIMIK LANG!
✅ AUTO-RESTORE — IBABALIK AGAD ANG PANGALAN!
✅ LAHAT NG MAHABANG LINYA — NANDITO PA RIN! ✅

📋 LAHAT NG UTOS:

/ryuk help — Ipakita ang listahan ng utos
/ryuk status — Tingnan ang kalagayan ng bot
/ryuk on — Buhayin ang bot, simula ng pagbabantay
/ryuk off — Patayin ang bot, itigil ang lahat
/ryuk silent — Tahimik na, hindi magre-reply pero BANTAY PA RIN
/ryuk unsilent — Magre-reply na ulit, hindi na tahimik
/ryuk target [ID] — Ikaw lang ang rerespindahan ng bot
/ryuk target off — Alisin ang target, rerespindahan na ang lahat
/ryuk everyone [mensahe] — I-mention ang LAHAT ng miyembro sa GC
/ryuk setgname [pangalan] — Palitan ang pangalan ng GC at i-lock
/ryuk setnick [pangalan] — Itakda ang nickname na ilalapat sa lahat
/ryuk lock — Ilapat ang nickname sa LAHAT ng miyembro
/ryuk selfreacton — I-on ang reaksyon sa sariling mensahe
/ryuk selfreactoff — I-off ang reaksyon sa sariling mensahe
/ryuk reacton — I-on ang reaksyon sa mensahe ng iba (GC lang)
/ryuk reactoff — I-off ang reaksyon sa mensahe ng iba

🔒 ADMIN LIST: 4 na nakarehistro
👑 GC NAME: ${targetGCName}
👤 NICKNAME: ${targetNickname}
📌 VERSION: 7.6.0 — IKAW LANG SA GC ✅`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`👑 RYUK STATUS — V7.6

📊 KASALUKUYANG KALAGAYAN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ AKTIBO:          ${data.active ? "OO — NAKABUHAY" : "HINDI — NAKAPATAY"}
🔇 SILENT MODE:    ${data.silentMode ? "OO — TAHIMIK, BANTAY PA RIN" : "HINDI — NAKA-REPLY"}
🎯 TARGET:          ${TARGET_USER_ID || "WALA — RERESPINDAHAN LAHAT"}
💬 SELF-REACT:      ${data.selfReact ? "OO — AKTIBO" : "HINDI — NAKA-OFF"}
🔥 AUTO-REACT:      ${data.autoReact ? "OO — AKTIBO" : "HINDI — NAKA-OFF"}
👑 GC NAME:        ${targetGCName}
👤 NICKNAME:       ${targetNickname}
📤 KABUUANG REPLY:  ${data.totalReplies || 0}
🔄 KABUUANG RESTORE: ${data.totalRestores || 0}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ PROTEKSIYON:    AKTIBO — IBABALIK AGAD ANG PANGALAN
⚡ BILIS:           TAMA — HINDI MA-DETECT
📌 VERSION:        7.6.0 — IKAW LANG SA GC ✅`,
      threadID, messageID
    );
  }

  const adminActions = ["on", "off", "silent", "unsilent", "target", "selfreacton", "selfreactoff"];
  const gcOnlyActions = ["lock", "setgname", "setnick", "reacton", "reactoff", "everyone"];
  
  if (gcOnlyActions.includes(action) && isPM) {
    return send(api, "❌ HINDI PWEDENG DITO!\nAng utos na ito ay para sa GROUP CHAT lamang.\nPumunta sa GC kung saan aktibo ang bot at subukan ulit.", threadID, messageID);
  }
  if ([...adminActions, ...gcOnlyActions].includes(action) && !isAdmin(senderID)) {
    return send(api, "❌ HINDI IKAW ANG ADMIN!\nAng utos na ito ay para sa ADMIN lamang.\nIkaw ay walang pahintulot na gamitin ito.", threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api,
`✅ RYUK NAKABUHAY — V7.6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ AKTIBO:     OO — GUMAGANA NA!
🎯 TARGET:     ${TARGET_USER_ID || "WALA — RERESPINDAHAN LAHAT"}
🔇 SILENT:     HINDI — NAKA-REPLY
🛡️ BANTAY:     AKTIBO — IBABALIK AGAD!
⚡ BILIS:      TAMA — HINDI MA-DETECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nandito na ako. RYUK POGI ON TOP! 👑`,
      threadID, messageID
    );
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api,
`❌ RYUK NAKAPATAY — V7.6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ AKTIBO:     HINDI — NAKATIGIL NA
🔇 SILENT:     HINDI — NAKA-OFF
🛡️ BANTAY:     HINDI — HINDI NA MAGBABANTAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nakatigil na ang lahat. I-type /ryuk on para buhayin ulit.`,
      threadID, messageID
    );
  }

  if (action === "silent") {
    data.silentMode = true;
    saveSystemData(data);
    return send(api,
`✅ SILENT MODE — NAKA-ON

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔇 TAHIMIK:    OO — HINDI NA MAGRE-REPLY
🛡️ BANTAY:     OO — BANTAY PA RIN ANG PANGALAN!
🔄 IBABALIK:   OO — KAPAG NAPALITAN, IBABALIK AGAD!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hindi ako magpapakita ng sagot, pero narito pa rin ako.
I-type /ryuk unsilent para magsalita ulit. 🤫`,
      threadID, messageID
    );
  }

  if (action === "unsilent") {
    data.silentMode = false;
    saveSystemData(data);
    return send(api,
`✅ SILENT MODE — NAKA-OFF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔇 TAHIMIK:    HINDI — MAGRE-REPLY NA ULIT!
🛡️ BANTAY:     OO — BANTAY PA RIN ANG PANGALAN!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nagsasalita na ulit ako. RYUK POGI ON TOP! 👑`,
      threadID, messageID
    );
  }

  if (action === "target") {
    const target = args.slice(1).join(" ").trim();
    
    if (!target) {
      return send(api,
`🎯 GAMITIN ANG TARGET — V7.6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARA MAG-SET:
/ryuk target [ID NG TAO]

Halimbawa:
/ryuk target 61594055835097

PARA ALISIN:
/ryuk target off

KASALUKUYANG TARGET:
${TARGET_USER_ID || "WALA — RERESPINDAHAN ANG LAHAT NG MAG-CHAT"}

PAANO MAKUHA ANG ID:
👉 I-chat ang tao sa bot
👉 Kunin ang kanyang ID mula sa log
👉 Siguraduhing WALANG space, walang letra, numero lang
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        threadID, messageID
      );
    }

    if (target === "off" || target === "wala") {
      TARGET_USER_ID = "";
      saveSystemData(data);
      return send(api,
`✅ TARGET TINANGGAL — V7.6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TARGET:     WALA NA
💬 RERESPINDAHAN: LAHAT NG MAG-CHAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lahat ay rerespindahan na ulit.`,
        threadID, messageID
     );
     }
     if (!/^\d+$/.test(target)) {
       return send(api,
 `❌ MALI ANG ID — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ang ID ay DAPAT numero lamang!
 ❌ May letra — HINDI PWEDI
 ❌ May space — HINDI PWEDI
 ✅ Numero lang — PWEDI!
 Halimbawa: 61594055835097
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
     }
     TARGET_USER_ID = target;
     saveSystemData(data);
     return send(api,
 `✅ TARGET NAKA-SET — GUMAGANA NA! ✅
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🎯 TARGET ID:   ${TARGET_USER_ID}
 💬 RERESPINDAHAN: LANG ITO — IBA HINDI
 🔒 SIGURADO:    TUMUTUGMA NA ANG ID!
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 I-chat mo ako para subukan! ✅
 Ipa-chat sa iba — HINDI RERESPINDAHAN ✅
 I-type /ryuk target off para alisin`,
       threadID, messageID
     );
   }
   if (action === "everyone") {
     const msg = args.slice(1).join(" ").trim() || "Paalala sa lahat!";
     return sendEveryone(api, `📢 @everyone — ${msg}`, threadID, data.selfReact);
   }
   if (action === "selfreacton") {
     data.selfReact = true;
     saveSystemData(data);
     return send(api,
 `✅ SELF-REACT — NAKA-ON
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 💬 Magre-react na ako sa sarili kong mensahe
 🔥 Emoji: Awtomatikong nag-iiba
 ⏱️ Oras: Tama — HINDI MA-DETECT
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   if (action === "selfreactoff") {
     data.selfReact = false;
     saveSystemData(data);
     return send(api,
 `❌ SELF-REACT — NAKA-OFF
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hindi na ako magre-react sa sarili kong mensahe
 I-type /ryuk selfreacton para ibalik
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   if (action === "setgname") {
     const newName = args.slice(1).join(" ").trim();
     if (!newName) {
       return send(api,
 `📋 GAMITIN ANG SETGNAME — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 /ryuk setgname [bagong pangalan ng GC]
 Halimbawa:
 /ryuk setgname RYUK POGI ON TOP
 Pinakamataas na haba: 30 letra
 Kasalukuyan: ${targetGCName}
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
     }
     if (newName.length > 30) {
       return send(api,
 `❌ MASYADONG MAHABA — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Pinakamataas: 30 letra
 Ang inilagay mo: ${newName.length} letra
 Masyadong mahaba! Paikliin mo.
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
     }
     targetGCName = newName;
     saveSystemData(data);
     api.setTitle(targetGCName, threadID, () => {});
     return send(api,
 `✅ GC NAME NAPALITAN — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 LUMANG PANGALAN: ${targetGCName !== newName ? targetGCName : "(walang pagbabago)"}
 BAGONG PANGALAN: ${targetGCName}
 🔒 LOCKED — IBABALIK AGAD KAPAG NAPALITAN!
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   if (action === "setnick") {
     const newName = args.slice(1).join(" ").trim();
     if (!newName) {
       return send(api,
 `📋 GAMITIN ANG SETNICK — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 /ryuk setnick [bagong nickname]
 Halimbawa:
 /ryuk setnick RYUK POGI
 Pinakamataas na haba: 25 letra
 Kasalukuyan: ${targetNickname}
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
     }
     if (newName.length > 25) {
       return send(api,
 `❌ MASYADONG MAHABA — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Pinakamataas: 25 letra
 Ang inilagay mo: ${newName.length} letra
 Masyadong mahaba! Paikliin mo.
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
     }
     targetNickname = newName;
     saveSystemData(data);
     return send(api,
 `✅ NICKNAME NAKA-SET — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BAGONG NICKNAME: ${targetNickname}
 🔒 LOCKED — IBABALIK AGAD KAPAG NAPALITAN!
 I-type /ryuk lock para ilapat sa lahat ng miyembro
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   if (action === "lock") {
     api.getThreadInfo(threadID, async (err, info) => {
       if (err || !info) {
         return send(api,
 `❌ HINDI MAKUHA ANG GC — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hindi makukuha ang impormasyon ng GC.
 Subukan ulit mamaya.
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
           threadID, messageID
         );
       }
       const members = info.participantIDs || [];
       const estMin = Math.floor(members.length * NICK_DELAY_MIN / 60000);
       const estMax = Math.ceil(members.length * NICK_DELAY_MAX / 60000);
       
       send(api,
 `🔒 NAGSISIMULA ANG LOCK — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 👑 GC NAME:    ${targetGCName}
 👤 NICKNAME:   ${targetNickname}
 👥 MIYEMBRO:   ${members.length} katao
 ⏱️ TINATAYA:   ${estMin} - ${estMax} minuto
 ⚠️ HUWAG ISARA ANG CHAT!
 Maghihintay tayo hanggang matapos ang lahat.
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID, messageID
       );
       
       api.setTitle(targetGCName, threadID, () => {});
       const result = await setAllNicknamesWithDelay(api, threadID, members, targetNickname, botID);
       
       if (result.error) {
         return send(api, result.error, threadID, messageID);
       }
       
       send(api,
 `✅ LOCK TAPOS NA! — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 📊 KABUUANG REPLY:     ${result.total}
 ✅ NAPALITAN:   ${result.success}
 ⏭️ NILAKTASAN:  ${result.skip} (kasama ang sarili ko)
 ❌ NABIGO:     ${result.fail}
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🔒 PROTEKSIYON: AKTIBO — IBABALIK AGAD KAPAG NAPALITAN!
 RYUK POGI ON TOP! 👑
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
         threadID
       );
     });
     return;
   }
   if (action === "reacton") {
     data.autoReact = true;
     saveSystemData(data);
     return send(api,
 `✅ AUTO-REACT — NAKA-ON
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Magre-react na ako sa mensahe ng iba sa GC lang
 Hindi gagana sa pribadong usapan
 I-type /ryuk reactoff para patayin
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   if (action === "reactoff") {
     data.autoReact = false;
     saveSystemData(data);
     return send(api,
 `❌ AUTO-REACT — NAKA-OFF
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hindi na ako magre-react sa mensahe ng iba
 I-type /ryuk reacton para ibalik
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
       threadID, messageID
     );
   }
   return send(api,
 `❌ HINDI KILALANG UTOS — V7.6
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Ang inilagay mo: /ryuk ${args[0] || "(walang utos)"}
 Hindi ito kilala.
 I-type /ryuk help para makita ang lahat ng utos.
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
     threadID, messageID
   );
 };
