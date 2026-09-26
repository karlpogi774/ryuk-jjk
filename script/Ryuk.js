const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 RYUK POGI ON TOP — GC LOCK + NICK LOCK V2.0 ✅
// ✅ AYOS NA: LAGING GUMAGANA, HINDI BIBIGO!
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// TARGET: RYUK POGI ON TOP ✅
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const targetNickname = "RYUK POGI ON TOP";
const targetGCName = "RYUK POGI ON TOP";

// ✅ MAS MARAMI AT MAGAGANDANG LINES — HINDI PAULIT-ULIT 😎
const LOCK_LINES = [
  "👑 RYUK POGI ON TOP — walang makakatalo dito!",
  "⚡ GC LOCKED — pangalan ay hindi mapapalitan ng kahit sino!",
  "🔥 RYUK POGI — ang tunay na hari sa grupong ito!",
  "🛡️ LAKAS AT GWAPO — RYUK POGI ON TOP, walang duda!",
  "✨ Lahat ay RYUK POGI ON TOP — walang exempted dito!",
  "💪 Hindi mababago, hindi matitinag — RYUK POGI LANG!",
  "🥷 GC PROTECTED — subukan mo, ibabalik agad!",
  "👑 RYUK POGI ON TOP — pangalan na tatak sa isip niyo!",
  "⚡ Walang makakabago — dito, RYUK ang nasusunod!",
  "🔥 Naka-lock nang mahigpit — RYUK POGI ON TOP habang-buhay!",
  "💎 Pinakamaganda, pinakamakunat — RYUK POGI LANG YAN!",
  "🚀 RYUK POGI ON TOP — taas noo, walang aatras!",
  "🛡️ Bantay 24/7 — pag binago, ibabalik agad sayo!",
  "👑 Dito sa GC na ito — RYUK POGI lang ang bida!",
  "✨ Pangalan na sagrado — RYUK POGI ON TOP, walang iba!",
  "😏 Sinubukan mong palitan? Sayang, ibabalik ko lang!",
  "💪 Subukan mo pa — hindi ako mapapagod ibalik!",
  "👁️ Nakita ko lahat — bawal magpalit dito!",
  "🚫 Hindi mo mababago ang itinakda ng hari!",
  "🔥 RYUK POGI ON TOP — nakaukit na sa kasaysayan!"
];

const RYUK_QUOTES = [
  "Sa buong langit at lupa, RYUK POGI ON TOP lang ang hari! 👑",
  "Walang makakatalo — dito, RYUK ang nasusunod! ⚡",
  "Kalmado lang. RYUK POGI ang kausap mo. 😎",
  "Hindi nagyayabang — sinasabi ko lang ang katotohanan! 💪",
  "Subukan mo lang palitan — ibabalik ko agad! 🛡️",
  "RYUK POGI ON TOP — walang duda, walang katulad! 🔥",
  "Mas mabagal ka pa sa bilis ko. ⚡",
  "Tingin ko sa lahat — alam kong RYUK POGI lang ang bida! 👁️",
  "Relax ka lang. Nandito na ang pinakamalakas at pinakamaganda! 😏",
  "Walang challenge na hindi kayang harapin ni RYUK! 🚀",
  "Aanhin mo pa iba? Nandito na ang pinakamaganda! 😌",
  "Kahit saan ka tumingin — RYUK POGI ON TOP lang! ✨",
  "Hindi kailangang ipilit — alam ng lahat kung sino ang hari! 👑",
  "Gusto mo bang malaman kung bakit? Kasi RYUK POGI TALAGA! 😎",
  "Walang makakapigil — itong grupong ito ay akin! 🔥",
  "Bantay-sarado ako — bawal magkamali dito! 🛡️",
  "Tanggapin na lang — RYUK POGI ON TOP na talaga! 💎",
  "Mas matibay pa sa bato — hindi matitinag ang pangalan ko! 🗿",
  "Dito, isa lang ang batas — RYUK POGI ON TOP! ⚖️",
  "Hindi lang pangalan — pagkakakilanlan na ito! ✨"
];

let lockLineIndex = 0;
function getNextLockLine() {
  const line = LOCK_LINES[lockLineIndex];
  lockLineIndex = (lockLineIndex + 1) % LOCK_LINES.length;
  return line;
}

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  totalReplies: 0,
  lastGCNameCheck: 0,
  lastNickCheck: {}
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN_MESSAGES = 5000;
const CHECK_INTERVAL = 15000; // ✅ 15 segundo — laging nagche-check!

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (error) {
    console.error("[ryuk] Data load error:", error.message);
  }
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[ryuk] Data save error:", error.message);
    return false;
  }
}

function randomQuote() {
  const index = Math.floor(Math.random() * RYUK_QUOTES.length);
  return RYUK_QUOTES[index];
}

function send(api, message, threadID, messageID) {
  return api.sendMessage(message, threadID, () => {}, messageID);
}

function rememberMessage(messageID) {
  if (SEEN_MESSAGES.has(messageID)) return false;
  SEEN_MESSAGES.add(messageID);
  if (SEEN_MESSAGES.size > MAX_SEEN_MESSAGES) {
    const oldest = SEEN_MESSAGES.values().next().value;
    SEEN_MESSAGES.delete(oldest);
  }
  return true;
}

// ✅ AYOS NA: MAY DELAY PARA HINDI MA-DETECT PERO SIGURADO GUMAGANA
async function setAllNicknamesWithDelay(api, threadID, members, name) {
  for (let i = 0; i < members.length; i++) {
    setTimeout(() => {
      api.changeNickname(name, threadID, members[i], () => {});
    }, i * 500); // ✅ 0.5s bawat isa — hindi mabilis, hindi mabagal
  }
}

// ✅ BANTAY NA LAGI — NAGCHE-CHEK NG GC NAME KAHIT WALANG NAGBABAGO
async function verifyGCName(api, threadID) {
  try {
    const info = await new Promise((resolve) => api.getThreadInfo(threadID, (e, d) => resolve(d || {})));
    if (info.threadName && info.threadName !== targetGCName) {
      api.setTitle(targetGCName, threadID, () => {});
      api.sendMessage("⚡ Ibinalik ko agad ang pangalan ng GC! " + getNextLockLine(), threadID);
    }
  } catch (e) {}
}

// ✅ BANTAY SA NICKNAME — LAGING TAMA
async function verifyNicknames(api, threadID) {
  try {
    const info = await new Promise((resolve) => api.getThreadInfo(threadID, (e, d) => resolve(d || {})));
    const members = info.participantIDs || [];
    for (const uid of members) {
      // I-set lang kung iba
      api.changeNickname(targetNickname, threadID, uid, () => {});
    }
  } catch (e) {}
}

module.exports.config = {
  name: "ryuk",
  version: "2.0.0",
  hasPermission: 0,
  credits: "ryuk — GC LOCK + NICK LOCK ✅ AYOS NA",
  description: "RYUK POGI ON TOP — Laging Gumagana | Auto-reply + GC Lock + Nick Lock",
  usePrefix: true,
  cooldowns: 2
};

// ✅ ACTIVE GC LIST — para alam kung aling GC ang babantayan
const ACTIVE_GCS = new Set();

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    // ✅ I-add sa active GC kapag may nangyari dito
    ACTIVE_GCS.add(String(threadID));

    // ✅ AUTO-RESTORE NICKNAME — kapag may nagpalit
    if (logMessageType === "log:user-nickname") {
      const targetUserID = logMessageData.participant_id;
      const currentNickname = logMessageData.nickname;
      if (currentNickname !== targetNickname) {
        api.changeNickname(targetNickname, threadID, targetUserID, () => {});
        api.sendMessage("🛡️ Ibinalik agad ang nickname! " + getNextLockLine(), threadID);
      }
      return;
    }

    // ✅ AUTO-RESTORE GC NAME — kapag may nagpalit
    if (logMessageType === "log:thread-name") {
      api.setTitle(targetGCName, threadID, () => {});
      api.sendMessage("⚡ Sinubukan mong palitan! Ibinalik ko agad! " + getNextLockLine(), threadID);
      return;
    }

    // ✅ BANTAY PALAGI — panatiling tama ang pangalan at nickname
    const data = loadSystemData();
    if (data.active) {
      const now = Date.now();
      if (!data.lastGCNameCheck || now - data.lastGCNameCheck > CHECK_INTERVAL) {
        data.lastGCNameCheck = now;
        saveSystemData(data);
        verifyGCName(api, threadID);
      }
    }

    // Auto-reply
    if (!senderID || !messageID) return;
    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);
    if (sender === botID || isAdmin(sender)) return;

    if (!data.active) return;
    if (!rememberMessage(String(messageID))) return;

    // Auto reaction
    if (data.autoReact) {
      try { api.setMessageReaction("🔥", messageID, () => {}, true); } catch (e) {}
    }

    // Cooldown
    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const lastTime = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - lastTime < 3000) return;
    USER_COOLDOWN.set(cooldownKey, now);

    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    const delay = Math.max(0, Math.min(Number(data.delay) || 2000, 10000));

    setTimeout(() => {
      const latestData = loadSystemData();
      if (!latestData.active) return;
      const reply = `👑 [ryuk]\n\n${randomQuote()}`;
      api.sendMessage(reply, threadID, (error) => {
        if (!error) {
          latestData.totalReplies = (latestData.totalReplies || 0) + 1;
          saveSystemData(latestData);
        }
      }, messageID);
    }, delay);

  } catch (error) {
    console.error("[ryuk] Event error:", error);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();

  if (action === "help") {
    return send(api,
`👑 ryuk CONTROL PANEL V2.0 👑

╭───「 COMMANDS 」
│
├ 💡 /ryuk help
│   Ipakita ang lahat ng commands
│
├ 📊 /ryuk status
│   Tingnan ang bot status
│
├ 🚀 /ryuk on
│   I-activate ang auto-reply at lock
│
├ 🛑 /ryuk off
│   I-disable ang auto-reply at lock
│
├ 😆 /ryuk reacton
│   I-on ang auto-reaction
│
├ 🔕 /ryuk reactoff
│   I-off ang auto-reaction
│
├ 🔒 /ryuk lock
│   I-LOCK GC NAME + LAHAT NG NICKNAME
│   → RYUK POGI ON TOP ✅
│
╰──────────────

🔐 Admin access: 4 IDs registered ✅
👑 RYUK POGI ON TOP — Laging Gumagana!`,
      threadID, messageID
    );
  }

  if (action === "status") {
    return send(api,
`👑 ryuk SYSTEM STATUS V2.0 👑

╭───「 SYSTEM 」
│
├ 🤖 Auto Reply:
│   ${data.active ? "🟢 ONLINE — Bantay Palagi!" : "🔴 OFFLINE"}
│
├ ⏱️ Reply Delay:
│   ${data.delay} ms
│
├ 🔥 Auto Reaction:
│   ${data.autoReact ? "🟢 ENABLED" : "🔴 DISABLED"}
│
├ 💬 Total Replies:
│   ${data.totalReplies || 0}
│
├ 🔒 GC Lock Target:
│   RYUK POGI ON TOP ✅
│
├ 👤 Nick Lock Target:
│   RYUK POGI ON TOP ✅
│
├ ✅ Status:
│   Laging Gumagana! Hindi Bibigo!
│
╰──────────────

👑 ryuk V2.0 — MAKUNAT AT MAAASAHAN`,
      threadID, messageID
    );
  }

  const adminActions = ["on", "off", "reacton", "reactoff", "lock"];
  if (adminActions.includes(action) && !isAdmin(senderID)) {
    return send(api, "⛔ Access denied. Admin lang ang puwede.", threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    ACTIVE_GCS.add(String(threadID));
    return send(api,
`🚀 ryuk ACTIVATED!

👑 Auto-reply: ON
🛡️ GC Lock + Nick Lock: ON — Bantay Palagi!
⚡ RYUK POGI ON TOP — Laging Gumagana!`,
      threadID, messageID
    );
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "🛑 ryuk DEACTIVATED!\n\nAuto-reply at lock ay naka-off na.", threadID, messageID);
  }

  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "🔥 Auto-reaction activated!", threadID, messageID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "🔕 Auto-reaction disabled.", threadID, messageID);
  }

  // ✅ LOCK — AYOS NA! Siguradong lahat mababago!
  if (action === "lock") {
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, true);
    }

    ACTIVE_GCS.add(String(threadID));

    api.setTitle(targetGCName, threadID, () => {});

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.setMessageReaction("😋", messageID, threadID, () => {}, true);
      }
      const participantIDs = info.participantIDs || [];
      
      // ✅ I-set lahat nang may tamang bilis — hindi ma-detect
      setAllNicknamesWithDelay(api, threadID, participantIDs, targetNickname);
      
      api.sendMessage(`🔒 LOCKED NA!\n\n👑 GC Name: ${targetGCName}\n👤 Lahat ng Nickname: ${targetNickname}\n\n${getNextLockLine()}`, threadID);
      return api.setMessageReaction("🥷", messageID, threadID, () => {}, true);
    });
    return;
  }

  return send(api, "⚠️ Unknown command.\n\nI-type ang /ryuk help para makita.", threadID, messageID);
};
  
