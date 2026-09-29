const fs = require("fs");
const path = require("path");

// ==========================================================
// 👑 RYUK POGI ON TOP — FINAL NO-SPAM V5.3 ✨
// ==========================================================
// ✅ IISA LANG PANGALAN — WALANG KALAT!
// ✅ SETALLNICK — TALAGANG PAPALITAN LAHAT ✅
// ✅ HINDI NA MAG-SPAM GC NAME
// ✅ MALINIS NA MENSAHE — WALANG LUMANG PANGALAN
// ==========================================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

// ✅ DITO MO PALITAN — IISA LANG ANG SUSUNOD!
let TARGET_GC_NAME = "RYUK POGI ON TOP";
let TARGET_NICKNAME = "RYUK POGI ON TOP";

// ✅ DELAY SETTINGS
const DELAY_MIN = 1500;
const DELAY_MAX = 3000;
const NICK_DELAY_EACH = 1000;
const COOLDOWN_SEC = 5;
const GC_NAME_COOLDOWN = 25000; // 25s — hindi na uulit agad
const NICK_COOLDOWN = 15000;

// ✅ ANTI-SPAM TRACKERS
const lastGCNameAction = new Map();
const lastNickAction = new Map();

const DATA_FILE = path.join(__dirname, "ryuk_clean_data.json");
const DEFAULT_DATA = {
  active: true,
  autoReply: true,
  autoReact: true,
  totalRestores: 0,
  totalReplies: 0
};

const cooldownMap = new Map();
const seenMessages = new Set();
const MAX_SEEN = 10000;

// ✅ AUTO-REPLY — MALINIS NA LINYA
const AUTO_REPLY_LINES = [
  "👑 Dito sa GC na ito, RYUK POGI ON TOP lang ang hari! Walang iba!",
  "⚡ Subukan mo man palitan, ibabalik ko agad!",
  "🔥 Huwag nang sumubok — alam niyo kung sino ang tunay!",
  "💪 Hindi matitinag — RYUK POGI ON TOP habang-buhay!",
  "🛡️ Bantay 24/7 — hindi magbabago ang tunay!",
  "✨ Iisa lang ang pangalan — RYUK POGI ON TOP!",
  "😎 Kalmado lang, huwag masyadong mainit ang ulo!",
  "🚀 Taas noo — RYUK POGI ON TOP!",
  "💎 Pinakamaganda at pinakamakunat — RYUK POGI!",
  "👁️ Bawat galaw nakikita — ibabalik agad!",
  "😂 Hindi uubra ang pagtatangka niyo!",
  "😏 Alam niyo na kung sino ang tunay na bida!",
  "🌟 Walang kapantay — RYUK POGI ON TOP!",
  "🔒 Nakakandado na — hindi mababago!",
  "🎯 Tiyak at sigurado — RYUK ang nasusunod!",
  "😤 Galit ka? Wala akong pakialam — dito ako ang hari!",
  "🌊 Tuloy-tuloy ang bantay — hindi hihinto!",
  "🦁 Matapang at gwapo — RYUK POGI ON TOP!",
  "☁️ Mataas pa sa ulap — hindi aabot ang pagtatangka!",
  "🔥 Kahit ilan pa kayo — sapat na ako!",
  "💬 Usap tayo, pero huwag magtangka!",
  "👑 Korona ay mananatili — RYUK POGI ON TOP!",
  "⚡ Bago mo pa mapindot — ibinalik ko na!",
  "😂 Nakakatawa naman — akala niyo ba magbabago?",
  "🛡️ Kalasag ay matibay — subukan niyo lang!",
  "✨ Mananatiling ganito — walang galaw!",
  "💎 Purong RYUK POGI lang — walang halo!",
  "🌅 Araw man o gabi — hindi natutulog!",
  "🎖️ Karangalan ay kay RYUK — mananatili!",
  "🔥 Nagniningning — hindi kukupas!",
  "🗡️ Subukan niyo lang — alam niyo na!",
  "🤫 Tahimik lang — naririnig ko lahat!",
  "💡 Matalino ka? Sige subukan mo!",
  "⚔️ Laban kung gusto mo — pero huwag magulat!",
  "🌿 Payapa kung iginagalang — matindi kung nilalabag!",
  "🏯 Matibay na pader — hindi mabubuwal!",
  "⚡ Walang hinto — tuloy-tuloy ang bantay!",
  "👑 Respeto sa tunay na hari — RYUK POGI ON TOP!",
  "🛡️ Bawat isa — magiging RYUK POGI ON TOP!",
  "✨ Walang pinalampas — lahat babantayan!",
  "🚀 Mula simula hanggang wakas — RYUK lang!",
  "💎 Hindi binibigo — RYUK POGI ON TOP!",
  "👁️ Walang nakaliligtas — agad na maibabalik!",
  "😂 Parang bata — hindi uubra dito!",
  "💪 Lakas ng loob — hindi matitinag!",
  "🌟 Bituin sa langit — gabay sa lahat!",
  "😎 Ang tunay na gwapo at malakas — RYUK POGI!"
];

const SELF_REACTS = ["😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🔥", "💀", "🤣", "⚡", "👑"];
const OTHER_REACTS = ["🔥", "💪", "😎", "👑", "⚡", "✨", "😂"];

let replyIndex = 0;
function getNextReply() {
  const line = AUTO_REPLY_LINES[replyIndex];
  replyIndex = (replyIndex + 1) % AUTO_REPLY_LINES.length;
  return line;
}
function randomSelfReact() {
  return SELF_REACTS[Math.floor(Math.random() * SELF_REACTS.length)];
}
function randomOtherReact() {
  return OTHER_REACTS[Math.floor(Math.random() * OTHER_REACTS.length)];
}

// ==========================================================
// 💾 DATA FUNCTIONS
// ==========================================================
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      return { ...DEFAULT_DATA, ...JSON.parse(raw) };
    }
  } catch (e) { console.error("[RYUK] Load:", e.message); }
  return { ...DEFAULT_DATA };
}
function saveData(d) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); return true; }
  catch (e) { console.error("[RYUK] Save:", e.message); return false; }
}

// ==========================================================
// 🔐 HELPERS
// ==========================================================
function isAdmin(id) { return ADMIN_IDS.includes(String(id)); }
function randomDelay() {
  return Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
}
function hasCooldown(tid, uid) {
  const k = `${tid}_${uid}`;
  const now = Date.now();
  const last = cooldownMap.get(k) || 0;
  if (now - last < COOLDOWN_SEC * 1000) return true;
  cooldownMap.set(k, now);
  return false;
}
function markMessage(mid) {
  if (seenMessages.has(mid)) return false;
  seenMessages.add(mid);
  if (seenMessages.size > MAX_SEEN) seenMessages.delete(seenMessages.values().next().value);
  return true;
}

// ==========================================================
// 🛡️ SMART RESTORE — MALINIS, WALANG LUMANG PANGALAN
// ==========================================================
function canRestoreGCName(tid, currentName) {
  if (currentName === TARGET_GC_NAME) return false;
  const k = String(tid);
  const now = Date.now();
  const last = lastGCNameAction.get(k) || 0;
  if (now - last < GC_NAME_COOLDOWN) return false;
  lastGCNameAction.set(k, now);
  return true;
}
function canRestoreNick(tid, uid, currentName) {
  if (currentName === TARGET_NICKNAME) return false;
  const k = `${tid}_${uid}`;
  const now = Date.now();
  const last = lastNickAction.get(k) || 0;
  if (now - last < NICK_COOLDOWN) return false;
  lastNickAction.set(k, now);
  return true;
}

// ==========================================================
// 🏷️ SET ALL NICKNAMES — TALAGANG PAPALITAN ✅
// ==========================================================
async function setAllNicks(api, tid, members, botID) {
  let count = 0;
  for (const uid of members) {
    if (String(uid) === String(botID)) continue;
    api.changeNickname(TARGET_NICKNAME, tid, uid, () => {});
    count++;
    await new Promise(r => setTimeout(r, NICK_DELAY_EACH));
  }
  return count;
}

function sendMsg(api, text, tid, mid) {
  return api.sendMessage(text, tid, () => {}, mid);
}

// ==========================================================
// ⚙️ BOT CONFIG
// ==========================================================
module.exports.config = {
  name: "ryuk",
  version: "5.3.0",
  hasPermission: 0,
  credits: "RYUK POGI ON TOP — CLEAN ✅",
  description: "Iisa Pangalan + No Spam + SetAllNick Works!",
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: 2
};

// ==========================================================
// 🔄 EVENT HANDLER — MALINIS NA MENSAGE
// ==========================================================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);
    const data = loadData();
    if (!data.active) return;

    if (sender === botID || isAdmin(sender)) return;

    // 🔒 GC NAME RESTORE — MALINIS NA!
    if (logMessageType === "log:thread-name") {
      const currName = logMessageData.name || "";
      if (canRestoreGCName(threadID, currName)) {
        api.setTitle(TARGET_GC_NAME, threadID, () => {});
        // ✅ IISA LANG — WALANG LUMANG PANGALAN!
        api.sendMessage(
          `⚡ IBINALIK AGAD!\n👑 ${TARGET_GC_NAME} ✅`,
          threadID, () => {}, messageID
        );
        data.totalRestores++;
        saveData(data);
      }
      return;
    }

    // 🏷️ NICKNAME RESTORE
    if (logMessageType === "log:user-nickname") {
      const uid = String(logMessageData.participant_id);
      const currNick = logMessageData.nickname || "";
      if (canRestoreNick(threadID, uid, currNick)) {
        api.changeNickname(TARGET_NICKNAME, threadID, uid, () => {});
        api.sendMessage(
          `🛡️ NICKNAME IBINALIK!\n👑 ${TARGET_NICKNAME} ✅`,
          threadID, () => {}, messageID
        );
        data.totalRestores++;
        saveData(data);
      }
      return;
    }

    // 💬 AUTO-REPLY
    if (!messageID || !markMessage(String(messageID))) return;
    if (!data.autoReply || hasCooldown(threadID, sender)) return;

    if (data.autoReact) {
      try { api.setMessageReaction(randomOtherReact(), messageID, () => {}, true); }
      catch (e) {}
    }

    if (typeof api.sendTypingIndicator === "function") api.sendTypingIndicator(threadID, true);

    setTimeout(() => {
      const latest = loadData();
      if (!latest.active || !latest.autoReply) return;
      const reply = `👑 RYUK POGI ON TOP\n\n${getNextReply()}`;
      api.sendMessage(reply, threadID, (err, info) => {
        if (!err && info?.messageID) {
          try { api.setMessageReaction(randomSelfReact(), info.messageID, () => {}, true); }
          catch (e) {}
          latest.totalReplies++;
          saveData(latest);
        }
      }, messageID);
    }, randomDelay());

  } catch (e) { console.error("[RYUK] Event:", e.message); }
};

// ==========================================================
// 🎮 COMMANDS — MALINIS AT AYOS
// ==========================================================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const cmd = (args[0] || "help").toLowerCase();
  const data = loadData();
  const botID = String(api.getCurrentUserID());

  if (cmd === "help") {
    return sendMsg(api,
`👑 RYUK POGI ON TOP — CONTROL v5.3 ✨

╭───────────────────────
│ 📋 MGA UTOS:
│
├ /ryuk help
│   Ipakita ito
│
├ /ryuk status
│   Tingnan estado
│
├ /ryuk on
│   I-ON system
│
├ /ryuk off
│   I-OFF system
│
├ /ryuk lockgc
│   I-set GC → ${TARGET_GC_NAME} ✅
│
├ ✅ /ryuk setallnick
│   Papalitan LAHAT → ${TARGET_NICKNAME}
│
├ /ryuk setgcname [pangalan]
│   PALITAN ANG TARGET GC NAME
│
├ /ryuk setnickname [pangalan]
│   PALITAN ANG TARGET NICKNAME
│
├ /ryuk reacton / reactoff
│   Auto-reaction
│
╰───────────────────────
🔐 Admin: ${ADMIN_IDS.length} ✅
🛡️ Iisa lang pangalan — walang kalat!`,
      threadID, messageID
    );
  }

  if (cmd === "status") {
    return sendMsg(api,
`👑 STATUS ✨

╭───────────────────────
│ 🤖 System: ${data.active ? "🟢 ACTIVE" : "🔴 OFF"}
│ 💬 Reply:   ${data.autoReply ? "🟢 ON" : "🔴 OFF"}
│ 🔥 React:  ${data.autoReact ? "🟢 ON" : "🔴 OFF"}
│ 🔒 GC:     ${TARGET_GC_NAME}
│ 🏷️ Nick:   ${TARGET_NICKNAME}
│ ✅ Restore:${data.totalRestores}
│ ✅ Reply:  ${data.totalReplies}
╰───────────────────────`,
      threadID, messageID
    );
  }

  const adminCmds = ["on", "off", "lockgc", "setallnick", "setgcname", "setnickname", "reacton", "reactoff"];
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return sendMsg(api, "⛔ Admin lang ang puwede.", threadID, messageID);
  }

  if (cmd === "on") {
    data.active = data.autoReply = true;
    saveData(data);
    return sendMsg(api, "🚀 NAKA-ON NA!\nBantay 24/7 ✅ Iisa lang pangalan 🛡️", threadID, messageID);
  }
  if (cmd === "off") {
    data.active = false; saveData(data);
    return sendMsg(api, "🛑 NAKA-OFF NA.", threadID, messageID);
  }
  if (cmd === "lockgc") {
    api.setTitle(TARGET_GC_NAME, threadID, () => {});
    return sendMsg(api, `⚡ GC LOCKED ✅\n👑 ${TARGET_GC_NAME}`, threadID, messageID);
  }
  if (cmd === "setallnick") {
    sendMsg(api, "⏳ Nagpapalit... huwag magpadala ng utos!", threadID, messageID);
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) return sendMsg(api, "⚠️ Subukan mo ulit.", threadID, messageID);
      const count = await setAllNicks(api, threadID, info.participantIDs || [], botID);
      return sendMsg(api, `🏷️ TAPOS NA! ✅\n👑 Napalitan: ${count} miyembro\n→ ${TARGET_NICKNAME}\n✅ Hindi kasali ang sarili ko`, threadID, messageID);
    });
    return;
  }
  if (cmd === "setgcname") {
    const name = args.slice(1).join(" ");
    if (!name) return sendMsg(api, "⚠️ Gamitin: /ryuk setgcname BAGONG PANGALAN", threadID, messageID);
    // ✅ IISA LANG — LUMANG TARGET AY PALITAN NA AGAD!
    TARGET_GC_NAME = name;
    api.setTitle(name, threadID, () => {});
    return sendMsg(api, `✅ GC name updated:\n👑 ${name} ✅\nIisa na lang — walang kalat!`, threadID, messageID);
  }
  if (cmd === "setnickname") {
    const name = args.slice(1).join(" ");
    if (!name) return sendMsg(api, "⚠️ Gamitin: /ryuk setnickname BAGONG NICK", threadID, messageID);
    TARGET_NICKNAME = name;
    return sendMsg(api, `✅ Nickname target updated:\n👑 ${name}\n\nI-type: /ryuk setallnick para ipatupad!`, threadID, messageID);
  }
  if (cmd === "reacton") {
    data.autoReact = true; saveData(data);
    return sendMsg(api, "🔥 Auto-react ON 😺😸", threadID, messageID);
  }
  if (cmd === "reactoff") {
    data.autoReact = false; saveData(data);
    return sendMsg(api, "🔕 Auto-react OFF", threadID, messageID);
  }

  sendMsg(api, "⚠️ Hindi kilala.\nI-type: /ryuk help", threadID, messageID);
};
    
