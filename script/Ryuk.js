const fs = require("fs");
const path = require("path");

// ==========================================================
// 👑 RYUK POGI ON TOP — IKAW LANG ANG MAKAKAGAMIT V7.9 ✅
// ✅ SA GC — HINDI SASAGOT SA IBANG TAO! IKAW LANG!
// ✅ "RYUK" SA GC → MAGRE-REACT LANG, WALANG SAGOT!
// ✅ SA PM LANG — LAHAT NG COMMAND LUMALABAS!
// ✅ HINDI MA-DETECT — WALANG LUMALABAS SA LAHAT!
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

const SELF_REACT_EMOJIS = ["🤣", "😂", "😆", "😹"];
const ALL_REACT_EMOJIS = ["🔥", "💪", "👑", "⚡", "😎", "✅", "💯"];

const NICK_DELAY_MIN = 1000;
const NICK_DELAY_MAX = 1000;
const REPLY_DELAY_MIN = 14000;
const REPLY_DELAY_MAX = 14000;
const REACT_DELAY_MIN = 1000;
const REACT_DELAY_MAX = 1000;
const AUTO_RESTORE_DELAY = 1000;
const COOLDOWN = 14000;
const MAX_SEEN_MESSAGES = 5000;

const DATA_FILE = path.join(__dirname, "ryuk_data.json");
const DEFAULT_DATA = {
  active: true, silentMode: false, autoReact: false, selfReact: true,
  totalReplies: 0, totalRestores: 0,
  targetNickname: "RYUK POGI", targetGCName: "RYUK POGI ON TOP", targetUserID: ""
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const PROCESSED_COMMANDS = new Set();

function isAdmin(id) { return ADMIN_IDS.includes(String(id).trim()); }
function getRandomDelay(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
function getSelfReact() { return SELF_REACT_EMOJIS[Math.floor(Math.random()*SELF_REACT_EMOJIS.length)]; }
function getAllReact() { return ALL_REACT_EMOJIS[Math.floor(Math.random()*ALL_REACT_EMOJIS.length)]; }

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const s = JSON.parse(fs.readFileSync(DATA_FILE,"utf8"));
      targetNickname = s.targetNickname || targetNickname;
      targetGCName = s.targetGCName || targetGCName;
      TARGET_USER_ID = String(s.targetUserID || "").trim();
      return { ...DEFAULT_DATA, ...s };
    }
  } catch(e) { console.error("[LOAD ERROR]", e.message); }
  return { ...DEFAULT_DATA };
}

function saveData(d) {
  try {
    d.targetNickname = targetNickname;
    d.targetGCName = targetGCName;
    d.targetUserID = String(TARGET_USER_ID).trim();
    fs.writeFileSync(DATA_FILE, JSON.stringify(d,null,2), "utf8");
    return true;
  } catch(e) { return false; }
}

function seenMsg(id) {
  const s = String(id);
  if (SEEN_MESSAGES.has(s)) return false;
  SEEN_MESSAGES.add(s);
  if (SEEN_MESSAGES.size > MAX_SEEN_MESSAGES) {
    SEEN_MESSAGES.delete(SEEN_MESSAGES.values().next().value);
  }
  return true;
}

function send(api, text, tid, mid, doSelfReact=false) {
  return api.sendMessage(text, tid, (e, info) => {
    if (!e && doSelfReact && info) {
      setTimeout(() => {
        try { api.setMessageReaction(getSelfReact(), info.messageID, ()=>{}, true); } catch {}
      }, getRandomDelay(1000, 1000));
    }
  }, mid);
}

function sendMention(api, text, tid, mentions=[], doSelfReact=false) {
  const body = mentions.length ? { body: text, mentions } : text;
  return api.sendMessage(body, tid, (e, info) => {
    if (!e && doSelfReact && info) {
      setTimeout(() => {
        try { api.setMessageReaction(getSelfReact(), info.messageID, ()=>{}, true); } catch {}
      }, getRandomDelay(1000, 1000));
    }
  });
}

function getReplyText(fullName, isPM) {
  const pm = [
    `@${fullName} — nandito lang ako palagi para sayo. RYUK POGI ON TOP! 🤣😂😆😹`,
    `@${fullName} — ikaw lang ang kausap ko, walang iba. 🤣😂😆😹`,
    `@${fullName} — kalmado lang, hindi ka nag-iisa. 🤣😂😆😹`,
    `@${fullName} — tiwala lang, hindi ka mabibigo. 🤣😂😆😹`,
    `@${fullName} — hindi ako aalis hangga't kailangan mo ako. 🤣😂😆😹`
  ];
  const gc = [
    `@${fullName} — nandito na ako. RYUK POGI ON TOP! 🤣😂😆😹`,
    `@${fullName} — huwag mag-alala, ako ang nagbabantay dito. 🤣😂😆😹`,
    `@${fullName} — ang pangalang RYUK POGI ay hindi mababago. 🤣😂😆😹`,
    `@${fullName} — dito sa GC, may batas — at ako ang sumusunod dito. 🤣😂😆😹`,
    `@${fullName} — kalmado lang, hindi ka nag-iisa. 🤣😂😆😹`
  ];
  return isPM ? pm[Math.floor(Math.random()*pm.length)] : gc[Math.floor(Math.random()*gc.length)];
}

async function setAllNicknamesWithDelay(api, tid, members, name, botId) {
  let s=0, sk=0, f=0;
  if (name.length > 25) return { error: "❌ Masyadong mahaba! Max 25 letra." };
  for (const uid of members) {
    if (String(uid) === String(botId)) { sk++; continue; }
    await new Promise(r => setTimeout(r, getRandomDelay(NICK_DELAY_MIN, NICK_DELAY_MAX)));
    try {
      await new Promise(res => api.changeNickname(name, tid, uid, e => res(!e))) ? s++ : f++;
    } catch { f++; }
  }
  return { success:s, skip:sk, fail:f, total:members.length };
}

module.exports.config = {
  name: "ryuk",
  version: "7.9.0",
  hasPermission: 1,
  credits: "RYUK — IKAW LANG ANG MAKAKAGAMIT V7.9",
  description: "✅ SA GC — WALANG SAGOT SA IBA! IKAW LANG SA PM!",
  usePrefix: true,
  cooldowns: 14
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData, isGroup, body } = event;
    if (!threadID || !senderID) return;

    const data = loadData();
    const botID = String(api.getCurrentUserID());
    const isPM = !isGroup;
    const sender = String(senderID).trim();
    const msg = String(body || "").trim().toLowerCase();
    const cmdKey = `${threadID}:${messageID}`;

    if (!data.active) return;
    if (sender === botID) return;

    // ==========================================================
    // ✅ AYUSIN: MAY NAG-SABI NG "RYUK" SA GC → MAGRE-REACT LANG! WALANG SAGOT!
    // ==========================================================
    if (msg === "ryuk" || msg.startsWith("ryuk ") || msg.startsWith("/ryuk")) {
      if (PROCESSED_COMMANDS.has(cmdKey)) return;
      PROCESSED_COMMANDS.add(cmdKey);
      setTimeout(() => PROCESSED_COMMANDS.delete(cmdKey), 15000);

      // ❌ IBANG TAO SA GC → MAGRE-REACT LANG, HINDI SASAGOT!
      if (!isAdmin(sender)) {
        if (isGroup) {
          setTimeout(() => {
            try { api.setMessageReaction("✅", messageID, ()=>{}, true); } catch {}
          }, getRandomDelay(1500, 3000));
        }
        return; // TUMIGIL — WALANG SAGOT!
      }

      // ✅ IKAW SA GC → MAGRE-REACT LANG, WALANG SAGOT!
      if (isGroup) {
        setTimeout(() => {
          try { api.setMessageReaction("👑", messageID, ()=>{}, true); } catch {}
        }, getRandomDelay(1000, 2000));
        return; // WALANG SAGOT SA GC — LIHIM!
      }
    }

    // ==========================================================
    // ✅ AYUSIN: HINDI SASAGOT SA IBANG TAO SA GC!
    // ==========================================================
    if (isGroup && !isAdmin(sender)) {
      // I-reply lang kung may SET TARGET na at siya ang target
      const targetId = String(TARGET_USER_ID).trim();
      if (!targetId || sender !== targetId) {
        // Kung walang target o hindi siya — MAGRE-REACT LANG, WALANG SAGOT!
        if (data.autoReact && seenMsg(messageID)) {
          setTimeout(() => {
            try { api.setMessageReaction(getAllReact(), messageID, ()=>{}, true); } catch {}
          }, getRandomDelay(REACT_DELAY_MIN, REACT_DELAY_MAX));
        }
        return; // HINDI SASAGOT SA IBANG TAO SA GC!
      }
    }

    // ✅ AUTO-RESTORE GC NAME AT NICKNAME — GUMAGANA PALAGI
    if (!isPM) {
      if (logMessageType === "log:user-nickname") {
        const uid = String(logMessageData.participant_id).trim();
        const curr = String(logMessageData.nickname || "").trim();
        if (curr !== targetNickname && uid !== botID) {
          setTimeout(() => {
            api.changeNickname(targetNickname, threadID, uid, () => {});
          }, AUTO_RESTORE_DELAY);
        }
        return;
      }
      if (logMessageType === "log:thread-name") {
        const curr = String(logMessageData.name || "").trim();
        if (curr !== targetGCName) {
          setTimeout(() => {
            api.setTitle(targetGCName, threadID, () => {});
          }, AUTO_RESTORE_DELAY);
        }
        return;
      }
    }

    // ✅ REPLY — KUNG ADMIN O SIYA ANG TARGET LANG
    const targetId = String(TARGET_USER_ID).trim();
    if (targetId && sender !== targetId && !isAdmin(sender)) return;
    if (!seenMsg(messageID)) return;
    if (data.silentMode) return;

    const key = `${threadID}:${sender}`;
    const now = Date.now();
    const last = USER_COOLDOWN.get(key) || 0;
    if (now - last < COOLDOWN) return;
    USER_COOLDOWN.set(key, now);

    let fullName = "Kaibigan";
    try {
      const info = await api.getUserInfo(senderID);
      if (info && info[senderID]) {
        fullName = info[senderID].name || info[senderID].firstName || "Kaibigan";
      }
    } catch {}

    setTimeout(() => {
      const latest = loadData();
      if (!latest.active || latest.silentMode) return;
      const reply = getReplyText(fullName, isPM);
      const mentions = isPM ? [] : [{ tag: `@${fullName}`, id: senderID }];
      sendMention(api, reply, threadID, mentions, latest.selfReact);
      latest.totalReplies++;
      saveData(latest);
    }, getRandomDelay(REPLY_DELAY_MIN, REPLY_DELAY_MAX));

  } catch (e) { console.error("[ERROR]", e); }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID, isGroup } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadData();
  const botID = String(api.getCurrentUserID());
  const isPM = !isGroup;
  const sender = String(senderID).trim();

  // ✅ IKAW LANG ANG MAKAKAGAMIT NG COMMAND
  if (!isAdmin(sender)) {
    if (isPM) return send(api, "❌ Hindi ikaw ang may-ari.", threadID, messageID);
    return; // SA GC — WALANG SAGOT!
  }

  // ✅ SA GC — WALANG SAGOT SA COMMAND, MAGRE-REACT LANG!
  if (isGroup) {
    return; // TAHIMIK LANG — WALANG LUMALABAS!
  }

  // ✅ SA PM LANG LUMALABAS LAHAT NG COMMAND — SAYO LANG!
  if (action === "help") {
    return send(api,
`👑 RYUK POGI ON TOP — IKAW LANG ANG MAKAKAGAMIT V7.9 ✅

✅ SA GC — HINDI SASAGOT SA IBANG TAO!
✅ SA GC — "RYUK" → MAGRE-REACT LANG, WALANG SAGOT!
✅ SA PM LANG — LAHAT NG UTOS LUMALABAS!
✅ IKAW LANG — WALANG IBA ANG MAKAKAGAMIT!

📋 LAHAT NG UTOS (I-type SA PM):
/ryuk on — Buhayin ang bot
/ryuk off — Patayin ang bot
/ryuk silent — Tahimik na, bantay pa rin
/ryuk unsilent — Nagsasalita na ulit
/ryuk target [ID] — Ikaw lang ang kakausapin
/ryuk target off — Lahat rerespindahan
/ryuk setgname [pangalan] — I-lock GC name
/ryuk setnick [pangalan] — I-lock nickname
/ryuk lock — Ilapat sa lahat ng miyembro
/ryuk selfreacton — Self-react ON
/ryuk selfreactoff — Self-react OFF
/ryuk reacton — Auto-react sa lahat
/ryuk reactoff — Auto-react OFF

👑 GC NAME: ${targetGCName}
👤 NICKNAME: ${targetNickname}
🛡️ VERSION: 7.9.0 — IKAW LANG ✅`,
      threadID, messageID, data.selfReact
    );
  }

  if (action === "on") {
    data.active = true;
    saveData(data);
    return send(api, "✅ Buhay na ako 👑\nRYUK POGI ON TOP!", threadID, messageID, data.selfReact);
  }

  if (action === "off") {
    data.active = false;
    saveData(data);
    return send(api, "✅ Tumigil na 😴\n/ryuk on para buhayin ulit.", threadID, messageID, data.selfReact);
  }

  if (action === "silent") {
    data.silentMode = true;
    saveData(data);
    return send(api, "✅ Tahimik na 😶\nBantay pa rin — hindi magre-reply.", threadID, messageID, data.selfReact);
  }

  if (action === "unsilent") {
    data.silentMode = false;
    saveData(data);
    return send(api, "✅ Nagsasalita na ulit 👑", threadID, messageID, data.selfReact);
  }

  if (action === "target") {
    const t = args.slice(1).join(" ").trim();
    if (!t || t === "off" || t === "wala") {
      TARGET_USER_ID = "";
      saveData(data);
      return send(api, "✅ Tinanggal na target\nLahat rerespindahan na.", threadID, messageID, data.selfReact);
    }
    if (!/^\d+$/.test(t)) {
      return send(api, "❌ Numero lang ang ilagay!\nHalimbawa: target 61594055835097", threadID, messageID, data.selfReact);
    }
    TARGET_USER_ID = t;
    saveData(data);
    return send(api, `✅ Ikaw na lang ang kakausapin 🎯\nID: ${TARGET_USER_ID}`, threadID, messageID, data.selfReact);
  }

  if (action === "setgname") {
    const n = args.slice(1).join(" ").trim() || "RYUK POGI ON TOP";
    if (n.length > 30) return send(api, "❌ Masyadong mahaba! Max 30 letra.", threadID, messageID);
    targetGCName = n;
    saveData(data);
    return send(api, `✅ GC Name: ${targetGCName}\n🔒 I-lock na — ibabalik ko agad!`, threadID, messageID, data.selfReact);
  }

  if (action === "setnick") {
    const n = args.slice(1).join(" ").trim() || "RYUK POGI";
    if (n.length > 25) return send(api, "❌ Masyadong mahaba! Max 25 letra.", threadID, messageID);
    targetNickname = n;
    saveData(data);
    return send(api, `✅ Nickname: ${targetNickname}\n🔒 I-lock na — ibabalik ko agad!`, threadID, messageID, data.selfReact);
  }

  if (action === "lock") {
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) return send(api, "❌ Hindi makuha ang GC.", threadID, messageID);
      const members = info.participantIDs || [];
      send(api, `🔒 Nagsisimula na...\n👥 ${members.length} miyembro`, threadID, messageID);
      api.setTitle(targetGCName, threadID, () => {});
      const res = await setAllNicknamesWithDelay(api, threadID, members, targetNickname, botID);
      if (res.error) return send(api, res.error, threadID);
      send(api,
`✅ TAPOS NA! 🎉
✅ Napalitan: ${res.success}
⏭️ Nilaktasan: ${res.skip}
❌ Nabigo: ${res.fail}
🔒 LOCKED — IBABALIK AGAD!
RYUK POGI ON TOP! 👑`, threadID, null, data.selfReact);
    });
    return;
  }

  if (action === "selfreacton") {
    data.selfReact = true;
    saveData(data);
    return send(api, "✅ Self-react — NAKA-ON 🤣", threadID, messageID, data.selfReact);
  }

  if (action === "selfreactoff") {
    data.selfReact = false;
    saveData(data);
    return send(api, "✅ Self-react — NAKA-OFF ✅", threadID, messageID, data.selfReact);
  }

  if (action === "reacton") {
    data.autoReact = true;
    saveData(data);
    return send(api, "✅ Auto-react — NAKA-ON 🔥", threadID, messageID, data.selfReact);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveData(data);
    return send(api, "✅ Auto-react — NAKA-OFF ✅", threadID, messageID, data.selfReact);
  }

  return send(api, "❌ Hindi kilalang utos\nI-type: /ryuk help", threadID, messageID);
};
  
