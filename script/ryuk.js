const fs = require("fs");
const path = require("path");

// ==========================================================
// 👑 RYUK POGI ON TOP — ULTIMATE MAKUNAT V5.0 ✨
// ==========================================================
// ✅ GC NAME LOCK — HINDI PAULIT-ULIT | SMART DETECTION
// ✅ ALL MEMBER NICKNAME SET — TAMA ANG BILIS MAY DELAY
// ✅ ANTI-SPAM | COOLDOWN | HINDI MA-DETECT 🛡️
// ✅ AUTO-REPLY — IBANG LINYA LAGI, HINDI UULITIN
// ✅ SELF-REACT + FUNNY REACTIONS 😂
// ✅ TARGETED — HINDI MAG-REPLY SA ADMIN AT SARILI
// ✅ HINDI AGAD KICK — KONTROLADO LANG
// ==========================================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

// ✅ TARGET VALUES — PALITAN MO KUNG GUSTO MO
const TARGET_GC_NAME = "RYUK POGI ON TOP";
const TARGET_NICKNAME = "RYUK POGI ON TOP";

// ✅ DELAY SETTINGS — HUWAG BILIS MASYADO! MAKUNAT SETTINGS
const DELAY_MIN = 1200;  // minimum ms
const DELAY_MAX = 2500;  // maximum ms
const NICK_DELAY_EACH = 600; // delay bawat member nickname
const COOLDOWN_SEC = 4; // bawat user, hindi mag-reply agad

// ✅ GC NAME — TRACKING PARA HINDI PAULIT-ULIT
const lastGCNameCheck = new Map(); // threadID → {name, timestamp}
const GC_NAME_COOLDOWN = 15000; // 15 seconds bago ibalik ulit

// ✅ NICKNAME — TRACKING PARA HINDI PAULIT-ULIT
const lastNickCheck = new Map(); // threadID_userID → {name, timestamp}
const NICK_COOLDOWN = 10000; // 10 seconds bago ibalik ulit

// ✅ AUTO-REPLY MESSAGES — 50+ LINYA, HINDI UULITIN
const AUTO_REPLY_LINES = [
  "👑 Dito sa GC na ito, RYUK POGI ON TOP lang ang hari! Walang iba!",
  "⚡ Subukan mo man palitan, ibabalik ko agad — mas mabilis pa sa kidlat!",
  "🔥 Huwag nang sumubok, alam niyo naman kung sino ang tunay na bida dito eh!",
  "💪 Hindi matitinag, hindi mapapantayan — RYUK POGI ON TOP habang-buhay!",
  "🛡️ Naka-bantay ako 24/7, tulog man kayo o gising, RYUK ang nasusunod!",
  "✨ Pangalan na sagrado, pangalan na minahal — RYUK POGI ON TOP lang yan!",
  "😎 Kalmado lang, huwag masyadong mainit ang ulo, baka hindi mo kaya!",
  "🚀 Taas noo, walang aatras — RYUK POGI ON TOP, laging una!",
  "💎 Pinakamaganda, pinakamakunat, pinakasikat — RYUK POGI lang yan!",
  "👁️ Nakikita ko lahat, kahit anong gawin niyo, hindi kayo makakalusot!",
  "😂 Gusto niyo lang makipagtagisan? Sige lang, handa ako sa inyo!",
  "😏 Tingin ko sa inyo, alam niyo na kung sino ang tunay na bida dito!",
  "🌟 Walang katulad, walang kapantay — RYUK POGI ON TOP, iisang tunay!",
  "🔒 Nakakandado na, susi ay wala — pangalan ay mananatili!",
  "🎯 Tiyak at sigurado, walang pag-aalinlangan — RYUK ang hari!",
  "😤 Galit ka? Wala akong pakialam — dito, ako ang nasusunod!",
  "🌊 Tuloy-tuloy ang agos, tuloy-tuloy ang bantay — hindi hihinto!",
  "🦁 Matapang, malakas, gwapo — RYUK POGI ON TOP, buo ang loob!",
  "☁️ Mataas pa sa ulap, hindi aabot ang inyong pagtatangka!",
  "🔥 Kahit ilan pa kayo, isa lang ako — at sapat na ako!",
  "💬 Usap tayo, pero huwag magtangka — alam niyo na ang mangyayari!",
  "👑 Korona ay nakalagay, hindi matatanggal — RYUK POGI ON TOP!",
  "⚡ Mabilis, tumpak, sigurado — ibabalik agad bago mo pa mapindot!",
  "😂 Nakakatawa naman — akala niyo ba magbabago?",
  "🛡️ Kalasag ay matibay, hindi mababasag — subukan niyo lang!",
  "✨ Maganda ang pagkakaayos, mananatiling ganito — walang galaw!",
  "🚀 Pasulong lang, hindi aatras — RYUK POGI ON TOP, laging nandito!",
  "💎 Walang dumi, walang gasgas — purong RYUK POGI lang yan!",
  "👁️ Bantay-sarado, walang puwang — bawat galaw nakikita!",
  "💪 Lakas ng loob, lakas ng isip — hindi matitinag!",
  "🌅 Araw man o gabi, naka-bantay — hindi natutulog!",
  "🎖️ Karangalan ay akin, mananatili — RYUK POGI ON TOP!",
  "😏 Tingin ko sa inyo, alam niyo na kung sino ang tunay!",
  "🔥 Nagniningning, maliwanag — pangalan ay hindi kukupas!",
  "🗡️ Talim ay matalas, hindi mapurol — subukan niyo lang!",
  "🌟 Bituin sa langit, gabay sa lahat — RYUK POGI ON TOP!",
  "🤫 Tahimik lang, pero nakikinig — bawat salita naririnig!",
  "💡 Matalino ka? Sige, subukan mo. Pero sigurado ka ba?",
  "⚔️ Laban kung gusto mo, pero huwag magulat — talo ka agad!",
  "🌿 Payapa kung iginagalang, matindi kung nilalabag — ganyan ako!",
  "🏯 Matibay na pader, hindi mabubuwal — RYUK POGI ON TOP!",
  "⚡ Walang hinto, walang pagod — tuloy-tuloy ang pagbabantay!",
  "👑 Hindi hinihingi, ibinibigay — respeto sa tunay na hari!",
  "🔥 Ang liwanag ay hindi maitatanggi — RYUK POGI ON TOP!",
  "🛡️ Bawat pangalan, bawat isa — magiging RYUK POGI ON TOP!",
  "✨ Walang pinalampas, walang nakaligtaan — lahat babantayan!",
  "🚀 Mula simula hanggang wakas — RYUK POGI ON TOP lang!",
  "💎 Pinakapinagkakatiwalaan, hindi binibigo — RYUK POGI lang!",
  "👁️ Walang pinalalampas na galaw — agad na maibabalik!",
  "😂 Ang pagtatangka niyo, parang bata — hindi uubra dito!"
];

// ✅ REACTIONS — SARILING MENSAHE + IBA
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

// ✅ DATA FILE
const DATA_FILE = path.join(__dirname, "ryuk_ultimate_data.json");
const DEFAULT_DATA = {
  active: true,
  autoReply: true,
  autoReact: true,
  lockGCName: true,
  lockNicknames: true,
  totalRestores: 0,
  totalReplies: 0
};

const cooldownMap = new Map();
const seenMessages = new Set();
const MAX_SEEN = 10000;
// ==========================================================
// 💾 DATA MANAGEMENT — LIGTAS AT MATIBAY
// ==========================================================
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_DATA, ...parsed };
    }
  } catch (err) {
    console.error("[RYUK] Load error:", err.message);
  }
  return { ...DEFAULT_DATA };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("[RYUK] Save error:", err.message);
    return false;
  }
}

// ==========================================================
// 🔐 ADMIN CHECK
// ==========================================================
function isAdmin(id) {
  return ADMIN_IDS.includes(String(id));
}

// ==========================================================
// ⏱️ DELAY & COOLDOWN
// ==========================================================
function randomDelay() {
  return Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
}

function hasCooldown(threadID, userID) {
  const key = `${threadID}_${userID}`;
  const now = Date.now();
  const last = cooldownMap.get(key) || 0;
  if (now - last < COOLDOWN_SEC * 1000) return true;
  cooldownMap.set(key, now);
  return false;
}

function markMessage(msgID) {
  if (seenMessages.has(msgID)) return false;
  seenMessages.add(msgID);
  if (seenMessages.size > MAX_SEEN) {
    const first = seenMessages.values().next().value;
    seenMessages.delete(first);
  }
  return true;
}

// ==========================================================
// 📛 GC NAME LOCK — SMART, HINDI PAULIT-ULIT
// ==========================================================
function shouldRestoreGCName(threadID, currentName) {
  if (currentName === TARGET_GC_NAME) return false;
  const key = String(threadID);
  const last = lastGCNameCheck.get(key);
  const now = Date.now();
  if (!last || now - last.timestamp > GC_NAME_COOLDOWN) {
    lastGCNameCheck.set(key, { name: currentName, timestamp: now });
    return true;
  }
  return false;
}

// ==========================================================
// 🏷️ NICKNAME LOCK — SMART, HINDI PAULIT-ULIT
// ==========================================================
function shouldRestoreNick(threadID, userID, currentName) {
  if (currentName === TARGET_NICKNAME) return false;
  const key = `${threadID}_${userID}`;
  const last = lastNickCheck.get(key);
  const now = Date.now();
  if (!last || now - last.timestamp > NICK_COOLDOWN) {
    lastNickCheck.set(key, { name: currentName, timestamp: now });
    return true;
  }
  return false;
}

// ==========================================================
// 👥 SET ALL NICKNAMES — MAY DELAY PER MEMBER
// ==========================================================
async function setAllNicks(api, threadID, members) {
  for (const uid of members) {
    api.changeNickname(TARGET_NICKNAME, threadID, uid, () => {});
    await new Promise(r => setTimeout(r, NICK_DELAY_EACH));
  }
}

// ==========================================================
// 📤 SEND HELPER
// ==========================================================
function sendMsg(api, text, tid, mid) {
  return api.sendMessage(text, tid, () => {}, mid);
  }
  // ==========================================================
// ⚙️ BOT CONFIG — REGISTRATION
// ==========================================================
module.exports.config = {
  name: "ryuk",
  version: "5.0.0",
  hasPermission: 0,
  credits: "RYUK POGI ON TOP — ULTIMATE MAKUNAT ✅",
  description: "GC Lock + Nick Lock | Anti-Spam | Makunat System",
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: 2
};

// ==========================================================
// 🔄 EVENT HANDLER — BANTAY SA LAHAT NG PAGBABAGO
// ==========================================================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);
    const data = loadData();
    if (!data.active) return;

    // ✅ HINDI MAG-REPLY SA SARILI AT SA ADMIN
    if (sender === botID || isAdmin(sender)) return;

    // ======================================
    // 🔒 GC NAME RESTORE — HINDI PAULIT-ULIT
    // ======================================
    if (logMessageType === "log:thread-name") {
      const newName = logMessageData.name || "";
      if (shouldRestoreGCName(threadID, newName)) {
        api.setTitle(TARGET_GC_NAME, threadID, () => {});
        api.sendMessage(
          `⚡ GC NAME IBINALIK!\n👑 ${TARGET_GC_NAME} ✅`,
          threadID,
          () => {},
          messageID
        );
        data.totalRestores += 1;
        saveData(data);
      }
      return;
    }

    // ======================================
    // 🏷️ NICKNAME RESTORE — HINDI PAULIT-ULIT
    // ======================================
    if (logMessageType === "log:user-nickname") {
      const uid = String(logMessageData.participant_id);
      const newNick = logMessageData.nickname || "";
      if (shouldRestoreNick(threadID, uid, newNick)) {
        api.changeNickname(TARGET_NICKNAME, threadID, uid, () => {});
        api.sendMessage(
          `🛡️ NICKNAME IBINALIK!\n👑 ${TARGET_NICKNAME} ✅`,
          threadID,
          () => {},
          messageID
        );
        data.totalRestores += 1;
        saveData(data);
      }
      return;
    }

    // ======================================
    // 💬 AUTO-REPLY + REACTION
    // ======================================
    if (!messageID || !markMessage(String(messageID))) return;
    if (!data.autoReply) return;
    if (hasCooldown(threadID, sender)) return;

    // Auto-react sa mensahe ng iba
    if (data.autoReact) {
      try {
        api.setMessageReaction(randomOtherReact(), messageID, () => {}, true);
      } catch (e) {}
    }

    // Ipakita nagta-type
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    // Ipadala ang reply — may random delay
    setTimeout(() => {
      const latest = loadData();
      if (!latest.active || !latest.autoReply) return;
      const replyText = `👑 RYUK POGI ON TOP\n\n${getNextReply()}`;
      api.sendMessage(replyText, threadID, (err, info) => {
        if (!err && info?.messageID) {
          // Self-react sa sariling mensahe
          try {
            api.setMessageReaction(randomSelfReact(), info.messageID, () => {}, true);
          } catch (e) {}
          latest.totalReplies += 1;
          saveData(latest);
        }
      }, messageID);
    }, randomDelay());

  } catch (err) {
    console.error("[RYUK] Event error:", err.message);
  }
};

// ==========================================================
// 🎮 COMMAND RUNNER — MGA UTOS NG ADMIN
// ==========================================================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const cmd = (args[0] || "help").toLowerCase();
  const data = loadData();

  // ------------------------------
  // HELP — LAHAT NG UTOS
  // ------------------------------
  if (cmd === "help") {
    return sendMsg(api,
`👑 RYUK POGI ON TOP — CONTROL PANEL v5.0 ✨

╭───────────────────────
│ 📋 MGA UTOS:
│
├ /ryuk help
│   Ipakita ito
│
├ /ryuk status
│   Tingnan ang estado
│
├ /ryuk on
│   I-ON ang buong system
│
├ /ryuk off
│   I-OFF ang buong system
│
├ /ryuk lockgc
│   I-set GC name sa → ${TARGET_GC_NAME}
│
├ /ryuk setallnick
│   Palitan nickname LAHAT member → ${TARGET_NICKNAME}
│
├ /ryuk setname [pangalan]
│   Palitan ang target GC name
│
├ /ryuk setnick [pangalan]
│   Palitan ang target nickname
│
├ /ryuk reacton
│   I-ON ang auto-reaction
│
├ /ryuk reactoff
│   I-OFF ang auto-reaction
│
╰───────────────────────
🔐 Admin: ${ADMIN_IDS.length} na rehistrado ✅
👑 RYUK POGI ON TOP — MAKUNAT, WALANG SUSPEND!`,
      threadID, messageID
    );
  }

  // ------------------------------
  // STATUS
  // ------------------------------
  if (cmd === "status") {
    return sendMsg(api,
`👑 SYSTEM STATUS ✨

╭───────────────────────
│ 🤖 System:     ${data.active ? "🟢 ACTIVE" : "🔴 INACTIVE"}
│ 💬 Auto-Reply: ${data.autoReply ? "🟢 ON" : "🔴 OFF"}
│ 🔥 Auto-React: ${data.autoReact ? "🟢 ON" : "🔴 OFF"}
│ 🔒 GC Lock:    ${TARGET_GC_NAME}
│ 🏷️ Nick Lock:  ${TARGET_NICKNAME}
│ ✅ Restores:   ${data.totalRestores || 0}
│ ✅ Replies:    ${data.totalReplies || 0}
╰───────────────────────
👑 RYUK POGI ON TOP v5.0 — LIGTAS AT MATIBAY`,
      threadID, messageID
    );
  }

  // ------------------------------
  // ADMIN LANG MGA UTOS
  // ------------------------------
  const adminCmds = ["on", "off", "lockgc", "setallnick", "setname", "setnick", "reacton", "reactoff"];
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return sendMsg(api, "⛔ Access denied. Admin lang ang pwedeng gumamit nito.", threadID, messageID);
  }

  // ON
  if (cmd === "on") {
    data.active = true;
    data.autoReply = true;
    saveData(data);
    return sendMsg(api, "🚀 RYUK POGI ON TOP — NAKA-ON NA!\n\nBantay 24/7 ✅ Hindi ma-suspend 🛡️", threadID, messageID);
  }

  // OFF
  if (cmd === "off") {
    data.active = false;
    saveData(data);
    return sendMsg(api, "🛑 RYUK POGI — NAKA-OFF NA.\nHindi na magbabantay pansamantala.", threadID, messageID);
  }

  // LOCK GC NAME
  if (cmd === "lockgc") {
    api.setTitle(TARGET_GC_NAME, threadID, () => {});
    return sendMsg(api,
`⚡ GC NAME LOCKED ✅

👑 ${TARGET_GC_NAME}

Hindi na mapapalitan ng iba!`,
      threadID, messageID
    );
  }

  // SET ALL NICKNAMES
  if (cmd === "setallnick") {
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return sendMsg(api, "⚠️ Hindi makuha ang impormasyon ng GC.", threadID, messageID);
      }
      await setAllNicks(api, threadID, info.participantIDs || []);
      return sendMsg(api,
`🏷️ LAHAT NG NICKNAME NAPALITAN ✅

👑 ${TARGET_NICKNAME}

May delay bawat isa — hindi mag-detect 🛡️`,
        threadID, messageID
      );
    });
    return;
  }

  // SET CUSTOM GC NAME
  if (cmd === "setname") {
    const newName = args.slice(1).join(" ");
    if (!newName) {
      return sendMsg(api, "⚠️ Ilagay ang pangalan.\nHalimbawa: /ryuk setname BAGONG PANGALAN", threadID, messageID);
    }
    // Palitan ang global target sa memory
    Object.assign(global, { TARGET_GC_NAME: newName });
    api.setTitle(newName, threadID, () => {});
    return sendMsg(api, `✅ GC name set to:\n👑 ${newName}`, threadID, messageID);
  }

  // SET CUSTOM NICKNAME
  if (cmd === "setnick") {
    const newNick = args.slice(1).join(" ");
    if (!newNick) {
      return sendMsg(api, "⚠️ Ilagay ang nickname.\nHalimbawa: /ryuk setnick BAGONG NICK", threadID, messageID);
    }
    Object.assign(global, { TARGET_NICKNAME: newNick });
    return sendMsg(api, `✅ Nickname target set to:\n👑 ${newNick}`, threadID, messageID);
  }

  // REACT ON
  if (cmd === "reacton") {
    data.autoReact = true;
    saveData(data);
    return sendMsg(api, "🔥 Auto-reaction NAKA-ON! 😺😸😹", threadID, messageID);
  }

  // REACT OFF
  if (cmd === "reactoff") {
    data.autoReact = false;
    saveData(data);
    return sendMsg(api, "🔕 Auto-reaction NAKA-OFF.", threadID, messageID);
  }

  // HINDI ALAM NA UTOS
  return sendMsg(api, "⚠️ Hindi kilalang utos.\nI-type: /ryuk help para makita lahat.", threadID, messageID);
};
  
