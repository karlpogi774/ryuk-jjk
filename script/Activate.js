const fs = require("fs");
const path = require("path");

// AUTHORIZED ADMIN UIDs
const ADMIN_UIDS = ["61594022290817", "61594055835097", "61595507156493"];

module.exports.config = {
  name: "activate",
  version: "16.0.0",
  hasPermission: 2, // Admin only
  credits: "Ryuk",
  description: "Gojo Satoru Edition - Multi-admin bot with self-reacting commands, fixed setnick/setgname execution, and 3s GC revert.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on | off | status | add <text> | listlines | setnick [name] | setgname [name]",
  cooldowns: 5
};

const DATA_PATH = path.join(__dirname, "activate_data.json");
const DEFAULT_LOCKED_NAME = "The one they can't change";

// Emojis for auto self-react (Gojo Vibe)
const REACT_EMOJIS = ["🕶️", "🔵", "🔴", "🟣", "😏", "⚡", "👑", "✨"];

// Extended Gojo Satoru Tagalog/English Safe Lines
const DEFAULT_GOJO_ROASTS = [
  "Don't worry, I'm the strongest. Ikaw? Ewan ko lang sa'yo. 🕶️",
  "Yow! Nag-type ka pa talaga? Cute mo naman mag-try. 😏",
  "Napakatagal mo naman mag-isip, kinailangan mo pa ba ng Six Eyes para diyan?",
  "Bakit ka ba galit? Na-overwhelm ka ba sa charisma at lakas ko? ✨",
  "Huy, pakihinaan naman boses mo sa chat. Napupuno 'yung Limitless ko eh.",
  "Infinity holds everything back, pati na rin 'yung interes ko sa sinabi mo. 🟣",
  "Sabi nila nobody's perfect... well, nagkamali sila nung pinanganak ako. 🕶️",
  "Lods, bago ka makipag-talo sa akin, siguraduhin mo muna na kaya mong lumampas sa Infinity. 🔴",
  "Is that all you got? Akala ko naman may Domain Expansion ka ring ilalabas.",
  "Chill ka lang, hindi mo kailangang magpa-impress sa pinakamalakas.",
  "Gusto mo ba ng libreng tutorial kung paano maging kasing-pogi at kasing-lakas ko? 😏",
  "Ayan na naman siya, nagmamarunong na naman sa harap ng The Strongest.",
  "I'm flattered na sinusubukan mo 'kong asarin, kaso 'di tumatama sa Infinity. ⚡",
  "Anong pakiramdam ng nag-aaksaya ng laway sa taong hindi mo naman kayang pantayan? ✨",
  "Your effort is 10/10, pero 'yung sense ng sinabi mo 0/10. 🤡",
  "Alam mo, pwedeng-pwede ka mag-retire sa pakikipag-chat. Hindi kita pigilan.",
  "Domain Expansion: Unlimited Void! Nako, mukhang nablangko ka na nga talaga. 🧠⚡",
  "Huwag ka masyadong mag-alala, paborito pa rin naman kita... bilang palamuti sa GC.",
  "Cursed technique or physical attack man 'yan, wala pa ring epekto sa akin. 🕶️",
  "Lakas ng loob, pero kulang sa cursed energy. Practice ka muna sa iba.",
  "Seryoso ka ba sa sinabi mo o nagbibiro ka lang para pasayahin ako? 🤣",
  "I'm Gojo Satoru, and you're... wait, sino ka nga ulit?",
  "Hayaan mo, kapag may oras ako, babasahin ko 'yang nobela mo. Baka sakali.",
  "Wag kang mag-alala, hindi ako galit. Nanonood lang ako ng comedy show mo.",
  "May Infinity ako sa paligid ko, kaya 'yang mga hirit mo babalik din sa'yo. 🔴🔵",
  "Paalala lang: I am the ceiling. Hanggang diyan ka lang sa sahig.",
  "Sana all may lakas ng loob mag-chat nang walang kaplano-plano.",
  "Tulog mo na lang 'yan lods, wala pa ring magbabago bukas—ako pa rin ang pinakamalakas. 🕶️",
  "Masyado mong ginalingan mag-type, pero bakit parang walang tumama?",
  "Next time taasan mo naman 'yung lebel ng hirit mo, nakakaantok eh."
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
      if (!parsed.roasts || parsed.roasts.length === 0) {
        parsed.roasts = DEFAULT_GOJO_ROASTS;
      }
      if (!parsed.gcName) parsed.gcName = DEFAULT_LOCKED_NAME;
      if (!parsed.nickName) parsed.nickName = DEFAULT_LOCKED_NAME;
      return parsed;
    }
  } catch {}
  return { 
    active: false, 
    activatedBy: null, 
    roasts: DEFAULT_GOJO_ROASTS, 
    gcName: DEFAULT_LOCKED_NAME,
    nickName: DEFAULT_LOCKED_NAME
  };
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function isActive() {
  const data = loadData();
  return data.active === true;
}

function isAdmin(senderID) {
  return ADMIN_UIDS.includes(String(senderID));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// HELPER: Send message with automatic self-react
function sendAndReact(api, text, threadID, replyMessageID = null) {
  return new Promise((resolve) => {
    const callback = async (err, info) => {
      if (!err && info && info.messageID) {
        const randomEmoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
        await sleep(500);
        api.setMessageReaction(randomEmoji, info.messageID, () => {}, true);
      }
      resolve(info);
    };

    if (replyMessageID) {
      api.sendMessage(text, threadID, callback, replyMessageID);
    } else {
      api.sendMessage(text, threadID, callback);
    }
  });
}

// HELPER: Safe Promisified Nickname Change
function safeChangeNickname(api, nickname, threadID, userID) {
  return new Promise((resolve) => {
    try {
      api.changeNickname(String(nickname), threadID, String(userID), (err) => {
        if (err) console.error(`[NICK_ERR] User ${userID}:`, err);
        resolve(!err);
      });
    } catch (e) {
      console.error(`[NICK_EXCEPT] User ${userID}:`, e);
      resolve(false);
    }
  });
}

// HELPER: Safe Promisified GC Title Change
function safeSetTitle(api, title, threadID) {
  return new Promise((resolve) => {
    try {
      api.setTitle(String(title), threadID, (err) => {
        if (err) console.error(`[TITLE_ERR] Thread ${threadID}:`, err);
        resolve(!err);
      });
    } catch (e) {
      console.error(`[TITLE_EXCEPT] Thread ${threadID}:`, e);
      resolve(false);
    }
  });
}

const lastResponseTime = new Map();
const COOLDOWN_DELAY = 3000;

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData, isGroup, type } = event;

  if (!isActive()) return;

  const data = loadData();
  const lockedGcName = data.gcName || DEFAULT_LOCKED_NAME;

  // 1. AUTO REVERT GC NAME (3 SECONDS DELAY)
  if (isGroup && (logMessageType === "log:thread-name" || logMessageType === "log:subscribe" || logMessageType === "log:unsubscribe")) {
    if (logMessageData && logMessageData.name !== lockedGcName) {
      await sleep(3000);
      await safeSetTitle(api, lockedGcName, threadID);
    }
    return;
  }

  // 2. ANTI-UNSEND LISTENER
  if (type === "message_unsend") {
    return sendAndReact(api, `🕶️ Yow! Nag-unsend ka ba? Akala mo ba hindi 'yan makikita ng Six Eyes ko? 🧠`, threadID);
  }

  if (!body || senderID === api.getCurrentUserID()) return;

  const lowerBody = body.trim().toLowerCase();

  // 3. AUTO REQUEST: SET GNAME VIA CHAT (ADMIN ONLY)
  if (lowerBody.startsWith("setgname")) {
    if (!isAdmin(senderID)) {
      return sendAndReact(api, "❌ Restricted: Admins lang ang may hawak ng kapangyarihan na 'to.", threadID, messageID);
    }
    const newGcName = body.slice(8).trim() || DEFAULT_LOCKED_NAME;
    if (!isGroup) return sendAndReact(api, "❌ Sa GC lang 'to pwedeng gamitin.", threadID, messageID);
    
    data.gcName = newGcName;
    saveData(data);
    const ok = await safeSetTitle(api, newGcName, threadID);
    if (!ok) return sendAndReact(api, "❌ Bigo sa pagbago ng GC name. Siguraduhing Admin ang bot sa GC.", threadID, messageID);
    return sendAndReact(api, `✨ GC Name successfully locked to "${newGcName}".`, threadID, messageID);
  }

  // 4. AUTO REQUEST: SET NICK VIA CHAT (ADMIN ONLY)
  if (lowerBody.startsWith("setnick")) {
    if (!isAdmin(senderID)) {
      return sendAndReact(api, "❌ Restricted: Admins lang ang pwedeng magpalit ng nicknames.", threadID, messageID);
    }
    const newNick = body.slice(7).trim() || DEFAULT_LOCKED_NAME;
    if (!isGroup) return sendAndReact(api, "❌ Sa GC lang 'to pwedeng gamitin.", threadID, messageID);

    data.nickName = newNick;
    saveData(data);

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs || threadInfo.userInfo.map(u => u.id) || [];
      await sendAndReact(api, `⏳ Changing all nicknames to "${newNick}"... Don't worry, I'm fast! ⚡`, threadID, messageID);

      for (const userID of participantIDs) {
        await safeChangeNickname(api, newNick, threadID, userID);
        await sleep(500);
      }
      return sendAndReact(api, `✅ All nicknames are now set to "${newNick}".`, threadID, messageID);
    } catch (e) {
      console.error("Setnick error:", e);
      return sendAndReact(api, "❌ Bigo sa pagbago ng nicknames. Siguraduhing Admin ang bot account sa GC.", threadID, messageID);
    }
  }

  if (lowerBody.startsWith("/activate")) return;

  const now = Date.now();
  const lastTime = lastResponseTime.get(threadID) || 0;

  if (now - lastTime < COOLDOWN_DELAY) {
    return;
  }

  lastResponseTime.set(threadID, now);

  try {
    const roastsList = data.roasts && data.roasts.length > 0 ? data.roasts : DEFAULT_GOJO_ROASTS;
    const randomRoast = roastsList[Math.floor(Math.random() * roastsList.length)];

    await sleep(2500);
    await sendAndReact(api, randomRoast, threadID, messageID);
  } catch (error) {
    console.error("Auto-reply error:", error);
  }
};

// ===== COMMAND HANDLER WITH AUTO SELF-REACT =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, isGroup } = event;

  if (!isAdmin(senderID)) {
    return sendAndReact(api, "❌ Access Denied: Authorized Admin UID lang ang pwedeng gumamit nito.", threadID, messageID);
  }

  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (sub === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);

    const lockedGcName = data.gcName || DEFAULT_LOCKED_NAME;
    if (isGroup) {
      await safeSetTitle(api, lockedGcName, threadID);
    }

    return sendAndReact(
      api,
      `🕶️ GOJO SATORU BOT ACTIVATED (Multi-Admin Supported)\n\n` +
      `• Mode: Infinite Auto-Reply (PM & GC)\n` +
      `• Safety: Anti-Ban Safe Delay (3s Buffer)\n` +
      `• GC Enforcement: Auto Revert in 3 Seconds ⏳\n` +
      `• Self-React: Active on All Responses & Commands 🕶️🔴🟣\n` +
      `• Enforced GC Name: "${lockedGcName}"\n\n` +
      `Don't worry, I'm the strongest! ✨`,
      threadID,
      messageID
    );
  }

  if (sub === "off") {
    data.active = false;
    saveData(data);
    return sendAndReact(api, "✅ Naka-OFF na ang Gojo auto-reply bot.", threadID, messageID);
  }

  if (sub === "status") {
    if (!data.active) {
      return sendAndReact(api, "Naka-OFF ang Gojo auto-reply bot sa kasalukuyan.", threadID, messageID);
    }
    const totalLines = (data.roasts || DEFAULT_GOJO_ROASTS).length;
    return sendAndReact(
      api,
      `🕶️ Gojo Bot Status: ACTIVE\n` +
      `Admins: ${ADMIN_UIDS.join(", ")}\n` +
      `3s GC Revert Delay: ENABLED\n` +
      `Enforced GC Name: "${data.gcName || DEFAULT_LOCKED_NAME}"\n` +
      `Kabuuan ng mga linyang Gojo: ${totalLines}`,
      threadID,
      messageID
    );
  }

  if (sub === "add") {
    const customLine = args.slice(1).join(" ");
    if (!customLine) {
      return sendAndReact(api, "❌ Maglagay ng linyang idadagdag.\nHalimbawa: /activate add Don't worry, I'm the strongest.", threadID, messageID);
    }

    if (!data.roasts) data.roasts = DEFAULT_GOJO_ROASTS;
    data.roasts.push(customLine);
    saveData(data);

    return sendAndReact(api, `✅ Naidagdag na ang bagong Gojo line:\n"${customLine}"`, threadID, messageID);
  }

  if (sub === "listlines") {
    const list = data.roasts || DEFAULT_GOJO_ROASTS;
    let msg = `📜 Gojo Auto-Reply Lines (${list.length}):\n\n`;
    list.forEach((line, index) => {
      msg += `${index + 1}. ${line}\n`;
    });
    return sendAndReact(api, msg, threadID, messageID);
  }

  if (sub === "setnick") {
    if (!isGroup) return sendAndReact(api, "❌ Sa GC lang 'to pwedeng gamitin.", threadID, messageID);
    const customNickname = args.slice(1).join(" ") || DEFAULT_LOCKED_NAME;
    data.nickName = customNickname;
    saveData(data);

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs || threadInfo.userInfo.map(u => u.id) || [];

      await sendAndReact(api, `⏳ Binabago ang nicknames ng lahat ng ${participantIDs.length} miyembro...`, threadID, messageID);

      for (const userID of participantIDs) {
        await safeChangeNickname(api, customNickname, threadID, userID);
        await sleep(500);
      }
      return sendAndReact(api, `✅ Tagumpay na nabago ang lahat ng nicknames papuntang '${customNickname}'.`, threadID, messageID);
    } catch (e) {
      console.error("Setnick command error:", e);
      return sendAndReact(api, "❌ Bigo sa pagbago ng nicknames. Siguraduhing Admin ang bot account sa GC.", threadID, messageID);
    }
  }

  if (sub === "setgname") {
    if (!isGroup) return sendAndReact(api, "❌ Sa GC lang 'to pwedeng gamitin.", threadID, messageID);
    const customGcName = args.slice(1).join(" ") || DEFAULT_LOCKED_NAME;
    data.gcName = customGcName;
    saveData(data);

    const ok = await safeSetTitle(api, customGcName, threadID);
    if (!ok) return sendAndReact(api, "❌ Bigo sa pagbago ng GC Name. Siguraduhing Admin ang bot sa GC.", threadID, messageID);
    return sendAndReact(api, `✅ GC Name locked to '${customGcName}'.`, threadID, messageID);
  }

  return sendAndReact(
    api,
    `🕶️ Gojo Admin Commands:\n` +
    `/activate on — Simulan ang Gojo auto-reply\n` +
    `/activate off — Itigil ang bot\n` +
    `/activate status — Tignan ang status\n` +
    `/activate add <text> — Magdagdag ng bagong Gojo line\n` +
    `/activate listlines — Ilista ang lahat ng Gojo lines\n` +
    `/activate setnick [pangalan] — Set nickname ng lahat\n` +
    `/activate setgname [pangalan] — Set GC Name`,
    threadID,
    messageID
  );
};
