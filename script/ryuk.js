const fs = require("fs");
const path = require("path");

// ==========================================================
// 👑 RYUK POGI ON TOP — FINAL FIX V5.1 ✨
// ==========================================================
// ✅ HINDI NA MAG-SPAM GC NAME — IISA LANG ANG TARGET
// ✅ SETALLNICK SIGURADONG GUMAGANA — MAY DELAY
// ✅ HINDI MAG-REPLY SA ADMIN AT SARILI
// ✅ MAKUNAT — HINDI MA-DETECT 🛡️
// ==========================================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

// ✅ DITO MO PALITAN ANG PANGALAN — IISA LANG!
let TARGET_GC_NAME = "RYUK POGI ON TOP";
let TARGET_NICKNAME = "RYUK POGI ON TOP";

// ✅ DELAY SETTINGS
const DELAY_MIN = 1500;
const DELAY_MAX = 3000;
const NICK_DELAY_EACH = 800;
const COOLDOWN_SEC = 5;
const GC_NAME_COOLDOWN = 20000; // 20s bago ibalik — HINDI NA MAG-SPAM
const NICK_COOLDOWN = 15000;

// ✅ TRACKING — HINDI ULIT-ULIT
const lastGCNameAction = new Map();
const lastNickAction = new Map();

const DATA_FILE = path.join(__dirname, "ryuk_fixed_data.json");
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

// ✅ AUTO-REPLY — 50+ LINYA
const AUTO_REPLY_LINES = [
  "👑 Dito sa GC na ito, RYUK POGI ON TOP lang ang hari! Walang iba!",
  "⚡ Subukan mo man palitan, ibabalik ko agad — mas mabilis pa sa kidlat!",
  "🔥 Huwag nang sumubok, alam niyo naman kung sino ang tunay na bida dito eh!",
  "💪 Hindi matitinag, hindi mapapantayan — RYUK POGI ON TOP habang-buhay!",
  "🛡️ Naka-bantay ako 24/7, tulog man kayo o gising, RYUK ang nasusunod!",
  "✨ Pangalan na sagrado — RYUK POGI ON TOP lang yan!",
  "😎 Kalmado lang, huwag masyadong mainit ang ulo!",
  "🚀 Taas noo, walang aatras — RYUK POGI ON TOP!",
  "💎 Pinakamaganda at pinakamakunat — RYUK POGI lang!",
  "👁️ Nakikita ko lahat, hindi kayo makakalusot!",
  "😂 Gusto niyo lang makipagtagisan? Sige lang!",
  "😏 Alam niyo na kung sino ang tunay!",
  "🌟 Walang katulad — RYUK POGI ON TOP!",
  "🔒 Nakakandado na — hindi mababago!",
  "🎯 Tiyak at sigurado — RYUK ang nasusunod!",
  "😤 Galit ka? Wala akong pakialam — dito ako ang hari!",
  "🌊 Tuloy-tuloy ang bantay — hindi hihinto!",
  "🦁 Matapang at gwapo — RYUK POGI ON TOP!",
  "☁️ Mataas pa sa ulap — hindi aabot ang pagtatangka niyo!",
  "🔥 Kahit ilan pa kayo, sapat na ako!",
  "💬 Usap tayo, pero huwag magtangka!",
  "👑 Korona ay hindi matatanggal!",
  "⚡ Mabilis, tumpak — bago mo pa mapindot, ibinalik ko na!",
  "😂 Nakakatawa naman — akala niyo ba magbabago?",
  "🛡️ Kalasag ay matibay — subukan niyo lang!",
  "✨ Mananatiling ganito — walang galaw!",
  "💎 Walang dumi — purong RYUK POGI lang!",
  "🌅 Araw man o gabi — hindi natutulog!",
  "🎖️ Karangalan ay mananatili kay RYUK!",
  "🔥 Nagniningning — hindi kukupas!",
  "🗡️ Subukan niyo lang — alam niyo na ang mangyayari!",
  "🤫 Tahimik lang, pero naririnig ko lahat!",
  "💡 Matalino ka? Sige subukan mo!",
  "⚔️ Laban kung gusto mo — pero huwag magulat!",
  "🌿 Payapa kung iginagalang, matindi kung nilalabag!",
  "🏯 Matibay na pader — hindi mabubuwal!",
  "⚡ Walang hinto — tuloy-tuloy ang bantay!",
  "👑 Hindi hinihingi — ibinibigay ang respeto!",
  "🛡️ Bawat isa — magiging RYUK POGI ON TOP!",
  "✨ Walang pinalampas — lahat babantayan!",
  "🚀 Mula simula hanggang wakas — RYUK lang!",
  "💎 Pinakapinagkakatiwalaan — hindi binibigo!",
  "👁️ Walang nakaliligtas sa pagbabantay ko!",
  "😂 Parang bata ang pagtatangka niyo — hindi uubra!",
  "💪 Lakas ng loob — hindi matitinag!",
  "🌟 Bituin sa langit — gabay sa lahat!",
  "🚀 Pasulong lang — hindi aatras!",
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
// 🛡️ SMART RESTORE — HINDI NA MAG-SPAM
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
// 🏷️ SET ALL NICKNAMES — MAY DELAY PER MEMBER
// ==========================================================
async function setAllNicks(api, tid, members) {
  for (const uid of members) {
    api.changeNickname(TARGET_NICKNAME, tid, uid, () => {});
    await new Promise(r => setTimeout(r, NICK_DELAY_EACH));
  }
}

function sendMsg(api, text, tid, mid) {
  return api.sendMessage(text, tid, () => {}, mid);
}

// ==========================================================
// ⚙️ BOT CONFIG
// ==========================================================
module.exports.config = {
  name: "ryuk",
  version: "5.1.0",
  hasPermission: 0,
  credits: "RYUK POGI ON TOP — FIXED ✅",
  description: "GC Lock + Nick Lock — No Spam, Works!",
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: 2
};

// ==========================================================
// 🔄 EVENT HANDLER
// ==========================================================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);
    const data = loadData();
    if (!data.active) return;

    // ❌ HINDI MAG-REPLY SA SARILI O ADMIN
    if (sender === botID || isAdmin(sender)) return;

    // 🔒 GC NAME RESTORE
    if (logMessageType === "log:thread-name") {
      const currName = logMessageData.name || "";
      if (canRestoreGCName(threadID, currName)) {
        api.setTitle(TARGET_GC_NAME, threadID, () => {});
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
// 🎮 COMMANDS
// ==========================================================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const cmd = (args[0] || "help").toLowerCase();
  const data = loadData();

  if (cmd === "help") {
    return sendMsg(api,
`👑 RYUK POGI ON TOP — CONTROL v5.1 ✨

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
│   I-set GC → ${TARGET_GC_NAME}
│
├ /ryuk setallnick
│   Palitan LAHAT → ${TARGET_NICKNAME} ✅
│
├ /ryuk setgcname [pangalan]
│   Palitan target GC name
│
├ /ryuk setnickname [pangalan]
│   Palitan target nickname
│
├ /ryuk reacton / reactoff
│   Auto-reaction
│
╰───────────────────────
🔐 Admin: ${ADMIN_IDS.length} ✅
🛡️ Hindi mag-spam | Hindi ma-suspend`,
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
    return sendMsg(api, "🚀 NAKA-ON NA!\nBantay 24/7 ✅ Hindi ma-suspend 🛡️", threadID, messageID);
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
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) return sendMsg(api, "⚠️ Hindi makuha ang GC info.", threadID, messageID);
      await setAllNicks(api, threadID, info.participantIDs || []);
      return sendMsg(api, `🏷️ LAHAT NAPALITAN ✅\n👑 ${TARGET_NICKNAME}\nMay delay bawat isa — hindi ma-detect 🛡️`, threadID, messageID);
    });
    return;
  }
  if (cmd === "setgcname") {
    const name = args.slice(1).join(" ");
    if (!name) return sendMsg(api, "⚠️ Gamitin: /ryuk setgcname BAGONG PANGALAN", threadID, messageID);
    TARGET_GC_NAME = name;
    api.setTitle(name, threadID, () => {});
    return sendMsg(api, `✅ GC name updated:\n👑 ${name}`, threadID, messageID);
  }
  if (cmd === "setnickname") {
    const name = args.slice(1).join(" ");
    if (!name) return sendMsg(api, "⚠️ Gamitin: /ryuk setnickname BAGONG NICK", threadID, messageID);
    TARGET_NICKNAME = name;
    return sendMsg(api, `✅ Nickname target updated:\n👑 ${name}`, threadID, messageID);
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
