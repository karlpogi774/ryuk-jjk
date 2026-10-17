const fs = require("fs");
const path = require("path");

// ADMIN UID RESTRICTION
const ADMIN_UID = ["61594022290817", "61595507156493"];

function isAdmin(senderID) {
  return ADMIN_UID.includes(String(senderID).trim());
}

module.exports.config = {
  name: "activate",
  version: "13.0.1",
  hasPermission: 2,
  credits: "Ryuk",
  description: "Gojo Satoru Edition - 2 Admins • Admin-locked auto-reply bot with safe anti-ban/anti-restriction system, auto self-react, and locked GC settings.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on | off | status | add <text> | listlines | setnick [name] | setgname [name]",
  cooldowns: 5
};

const DATA_PATH = path.join(__dirname, "activate_data.json");
const DEFAULT_LOCKED_NAME = "The one they can't change";

// Emojis for auto self-react (Gojo Vibe)
const REACT_EMOJIS = ["🕶️", "🔵", "🔴", "🟣", "😏", "⚡", "👑", "✨"];

// Extended Gojo Satoru Tagalog/English Safe Lines (30 Lines)
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

// ===== ANTI-BAN / ANTI-RESTRICTION BUFFER =====
const lastResponseTime = new Map();
const COOLDOWN_DELAY = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData, isGroup, type } = event;

  if (!isActive()) return;

  const data = loadData();
  const lockedGcName = data.gcName || DEFAULT_LOCKED_NAME;

  // 1. AUTO ENFORCE GC NAME
  if (isGroup && (logMessageType === "log:thread-name" || logMessageType === "log:subscribe" || logMessageType === "log:unsubscribe")) {
    if (logMessageData && logMessageData.name !== lockedGcName) {
      api.setTitle(lockedGcName, threadID, (err) => {
        if (err) console.error("Auto GC name enforcement failed:", err);
      });
    }
    return;
  }

  // 2. ANTI-UNSEND LISTENER
  if (type === "message_unsend") {
    return api.sendMessage(`🕶️ Yow! Nag-unsend ka ba? Akala mo ba hindi 'yan makikita ng Six Eyes ko? 🧠`, threadID);
  }

  if (!body || senderID === api.getCurrentUserID()) return;

  const lowerBody = body.trim().toLowerCase();

  // 3. SET GNAME — ADMIN ONLY
  if (lowerBody.startsWith("setgname")) {
    if (!isAdmin(senderID)) {
      return api.sendMessage("❌ Restricted: Admin lang ang may hawak ng kapangyarihan na 'to.", threadID, messageID);
    }
    const newGcName = body.slice(8).trim() || DEFAULT_LOCKED_NAME;
    if (!isGroup) return api.sendMessage("❌ Sa GC lang 'to pwedeng gamitin.", threadID, messageID);
    
    data.gcName = newGcName;
    saveData(data);
    api.setTitle(newGcName, threadID, (err) => {
      if (err) return api.sendMessage("❌ Bigo sa pagbago ng GC name.", threadID, messageID);
      return api.sendMessage(`✨ GC Name successfully locked to "${newGcName}".`, threadID, messageID);
    });
    return;
  }

  // 4. SET NICK — ADMIN ONLY
  if (lowerBody.startsWith("setnick")) {
    if (!isAdmin(senderID)) {
      return api.sendMessage("❌ Restricted: Admin lang ang pwedeng magpalit ng nicknames.", threadID, messageID);
    }
    const newNick = body.slice(7).trim() || DEFAULT_LOCKED_NAME;
    if (!isGroup) return api.sendMessage("❌ Sa GC lang 'to pwedeng gamitin.", threadID, messageID);

    data.nickName = newNick;
    saveData(data);
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs;
      api.sendMessage(`⏳ Changing all nicknames to "${newNick}"... Don't worry, I'm fast! ⚡`, threadID);

      for (const userID of participantIDs) {
        await sleep(600);
        api.changeNickname(newNick, threadID, userID, (err) => {
          if (err) console.error(`Failed nickname change for ${userID}:`, err);
        });
      }
      return api.sendMessage(`✅ All nicknames are now set to "${newNick}".`, threadID, messageID);
    } catch (e) {
      return api.sendMessage("❌ Bigo sa pagbago ng nicknames.", threadID, messageID);
    }
  }

  if (lowerBody.startsWith("/activate")) return;

  const now = Date.now();
  const lastTime = lastResponseTime.get(threadID) || 0;

  if (now - lastTime < COOLDOWN_DELAY) return;
  lastResponseTime.set(threadID, now);

  try {
    const roastsList = data.roasts && data.roasts.length > 0 ? data.roasts : DEFAULT_GOJO_ROASTS;
    const randomRoast = roastsList[Math.floor(Math.random() * roastsList.length)];
    const randomEmoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];

    await sleep(2500);

    api.sendMessage({
      body: randomRoast,
      mentions: [{ tag: `@${senderID}`, id: senderID }]
    }, threadID, async (err, info) => {
      if (!err && info && info.messageID) {
        await sleep(1000);
        api.setMessageReaction(randomEmoji, info.messageID, (reactErr) => {
          if (reactErr) console.error("Self-react error:", reactErr);
        }, true);
      }
    }, messageID);
  } catch (error) {
    console.error("Auto-reply error:", error);
  }
};

// ===== COMMAND HANDLER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, isGroup } = event;

  if (!isAdmin(senderID)) {
    return api.sendMessage("❌ Access Denied: Admin lamang ang pwedeng gumamit ng Gojo Bot commands.", threadID, messageID);
  }

  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (sub === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);

    const lockedGcName = data.gcName || DEFAULT_LOCKED_NAME;
    if (isGroup) api.setTitle(lockedGcName, threadID, () => {});

    return api.sendMessage(
      `🕶️ GOJO SATORU BOT ACTIVATED (2 ADMINS)\n\n` +
      `• Mode: Infinite Auto-Reply (PM & GC)\n` +
      `• Safety: Anti-Ban Safe Delay (3s Buffer)\n` +
      `• Self-React: Gojo Emojis Active 🕶️🔴🟣\n` +
      `• Lines Available: ${DEFAULT_GOJO_ROASTS.length} Gojo Verses\n` +
      `• Enforced GC Name: "${lockedGcName}"\n\n` +
      `Don't worry, I'm the strongest! ✨`,
      threadID,
      messageID
    );
  }

  if (sub === "off") {
    data.active = false;
    saveData(data);
    return api.sendMessage("✅ Naka-OFF na ang Gojo auto-reply bot.", threadID, messageID);
  }

  if (sub === "status") {
    if (!data.active) {
      return api.sendMessage("Naka-OFF ang Gojo auto-reply bot sa kasalukuyan.", threadID, messageID);
    }
    const totalLines = (data.roasts || DEFAULT_GOJO_ROASTS).length;
    return api.sendMessage(
      `🕶️ Gojo Bot Status: ACTIVE (2 ADMINS LOCKED)\n` +
      `• Admin 1: 61594022290817\n` +
      `• Admin 2: 61595507156493\n` +
      `• Cooldown Buffer: 3 Seconds\n` +
      `• Enforced GC Name: "${data.gcName || DEFAULT_LOCKED_NAME}"\n` +
      `• Kabuuan ng mga linyang Gojo: ${totalLines}`,
      threadID,
      messageID
    );
  }

  if (sub === "add") {
    const customLine = args.slice(1).join(" ");
    if (!customLine) {
      return api.sendMessage("❌ Maglagay ng linyang idadagdag.\nHalimbawa: /activate add Don't worry, I'm the strongest.", threadID, messageID);
    }
    if (!data.roasts) data.roasts = DEFAULT_GOJO_ROASTS;
    data.roasts.push(customLine);
    saveData(data);
    return api.sendMessage(`✅ Naidagdag na ang bagong Gojo line:\n"${customLine}"`, threadID, messageID);
  }

  if (sub === "listlines") {
    const list = data.roasts || DEFAULT_GOJO_ROASTS;
    let msg = `📜 Gojo Auto-Reply Lines (${list.length}):\n\n`;
    list.forEach((line, index) => {
      msg += `${index + 1}. ${line}\n`;
    });
    return api.sendMessage(msg, threadID, messageID);
  }

  if (sub === "setnick") {
    if (!isGroup) return api.sendMessage("❌ Sa GC lang 'to pwedeng gamitin.", threadID, messageID);
    const customNickname = args.slice(1).join(" ") || DEFAULT_LOCKED_NAME;
    data.nickName = customNickname;
    saveData(data);

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs;
      api.sendMessage(`⏳ Binabago ang nicknames ng lahat ng ${participantIDs.length} miyembro...`, threadID);

      for (const userID of participantIDs) {
        await sleep(600);
        api.changeNickname(customNickname, threadID, userID, (err) => {
          if (err) console.error(`Failed nickname change for ${userID}:`, err);
        });
      }
      return api.sendMessage(`✅ Tagumpay na nabago ang lahat ng nicknames papuntang '${customNickname}'.`, threadID, messageID);
    } catch (e) {
      return api.sendMessage("❌ Bigo sa pagbago ng nicknames.", threadID, messageID);
    }
  }

  if (sub === "setgname") {
    if (!isGroup) return api.sendMessage("❌ Sa GC lang 'to pwedeng gamitin.", threadID, messageID);
    const customGcName = args.slice(1).join(" ") || DEFAULT_LOCKED_NAME;
    data.gcName = customGcName;
    saveData(data);

    api.setTitle(customGcName, threadID, (err) => {
      if (err) return api.sendMessage("❌ Bigo sa pagbago ng GC Name.", threadID, messageID);
      return api.sendMessage(`✅ GC Name locked to '${customGcName}'.`, threadID, messageID);
    });
    return;
  }

  return api.sendMessage(
    `🕶️ Gojo Admin Commands (2 Admins):\n` +
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
      
