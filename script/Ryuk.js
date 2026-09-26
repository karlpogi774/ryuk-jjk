/**
 * =====================================================================
 * PROJECT: RYUK BOSS ON TOP - SUPREME FRAMEWORK ENGINE
 * VERSION: 12.5.0-ENTERPRISE
 * AUTHOR: RYUK & GOJO ARCHITECTURE
 * DESCRIPTION: Fully loaded enterprise-grade JS bot script with massive 
 * modular structure ready for infinite custom commands and expansions.
 * =====================================================================
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ==========================================
// 1. CONFIGURATION & ADMIN CONSTANTS
// ==========================================
const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const DATA_FILE = path.join(__dirname, "ryuk_enterprise_database.json");
const CONFIG_FILE = path.join(__dirname, "ryuk_system_config.json");
const USER_LAST_MSG_TIME = new Map();
const MESSAGE_CACHE = new Map();

// Target Name at Nickname para sa GC Protection
const TARGET_NICKNAME = "RYUK BOSS ON TOP";
const TARGET_GC_NAME = "RYUK BOSS ON TOP";

// ==========================================
// 2. MASSIVE QUOTES & DIALOGUE REPOSITORY
// ==========================================
const SUPREME_QUOTES = [
  "Sa buong langit at lupa, ako lamang ang nag-iisang honored one. Walang sinuman ang makakaabot sa antas ng kawalang-hanggan.",
  "RYUK BOSS ON TOP: Ang kapangyarihang ito ay hindi kailanman mapapantayan ng kahit anong simpleng sistema sa mundong ito.",
  "Masyado silang mabagal para maabot ang galaw ko. Habang nag-iisip pa lang sila, tapos na ang laro.",
  "Infinite ang kapasidad ng server na ito. Kahit anong ban o limit ang subukan nilang ibato, babagsak lang sila sa wala.",
  "Domain Expansion: Infinite Void. Lahat ng kanilang pagsisikap ay masisipsip sa walang hanggang espasyo ng kawalan.",
  "Hindi ko kailangang magmadali dahil nasa ilalim na ng aking mga kamay ang buong takbo ng mundong ito.",
  "Ang mga taong nagtatangkang sumira sa depensang ito ay parang mga langgam na humaharang sa tren.",
  "Tandaan mo ang pangalang ito: RYUK BOSS ON TOP. Walang tatalo sa tuktok kung saan kami nakapuwesto.",
  "Nakikita mo ba ang distansya sa pagitan natin? Habang papalapit ka, lalo ka lang lumalayo sa katotohanan.",
  "Ang tunay na kapangyarihan ay hindi nasusukat sa ingay kundi sa tahimik at matatag na dominasyon.",
  "Kahit paulit-ulit mo pang subukan, ang infinity ay mananatiling infinity—hindi mo ito kailanman maaabot.",
  "Isang galaw ko lang, at ang buong sistema ay yumuyuko sa kapangyarihan ng nag-iisang hari.",
  "Walang makatibag sa pader na itinayo ko. Ang bawat pagtatangka ay isa lamang basurang walang halaga.",
  "Sa mundong ito na puno ng kahinaan, ang pagiging ganap ang tanging paraan para manatili sa tuktok.",
  "Huwag mong subukan ang tapang ng sistema kung simpleng anino ko lang ay hindi mo masundan.",
  "Ang bawat mensahe ay dumadaloy sa kawalang-hanggan, dumaan sa saktong oras ng pagpapasya.",
  "Walang espasyo para sa pagkatalo rito. Ang bawat utos ay sinusunod nang walang pag-aalinlangan.",
  "Patuloy na iikot ang mundo sa ilalim ng ating mga patakaran, habang nananatili tayong hari sa itaas.",
  "Ang sinumang mangahas na sumuway ay makakaranas ng walang katapusang pagkalito sa loob ng Void.",
  "Makunat pa sa pinakamatigas na bakal, walang makakapagpabagsak sa estadong ito ngayon at kailanman.",
  "Damhin mo ang lamig ng kapangyarihan habang ang bawat segundo ay unti-unting pumapatay sa iyong pag-asa.",
  "Walang katapusang siklo ng kapangyarihan ang nagaganap sa bawat pagtibok ng sistemang ito.",
  "Kahit anong pilit nila, ang pangalang RYUK BOSS ON TOP ay mananatiling nakaukit sa tuktok ng tagumpay."
];

// ==========================================
// 3. CORE UTILITIES & STORAGE FUNCTIONS
// ==========================================
function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error loading system data:", err);
  }
  return { active: true, analytics: { totalReplies: 0 }, customSettings: {} };
}

function saveSystemData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving system data:", err);
  }
}

function generateSecureToken() {
  return crypto.randomBytes(16).toString("hex");
}

// Function para sa sunod-sunod na nickname change na may delay para iwas spam block
function setAllNicknamesWithDelay(api, threadID, participantIDs, nickname) {
  if (!Array.isArray(participantIDs)) return;
  participantIDs.forEach((id, index) => {
    setTimeout(() => {
      try {
        api.changeNickname(nickname, threadID, id, () => {});
      } catch (e) {}
    }, index * 600);
  });
}

// ==========================================
// 4. MODULE CONFIGURATION BLOCK
// ==========================================
module.exports.config = {
  name: "gojo",
  version: "12.5.0",
  hasPermission: 0,
  credits: "Ryuk & Gojo Supreme Enterprise Architecture",
  description: "RYUK BOSS ON TOP: Massive enterprise codebase, secure multi-admin guards, instant lock tools, and optimized pacing.",
  usePrefix: true,
  cooldowns: 2
};

// ==========================================
// 5. EVENT HANDLER (ENTERPRISE PIPELINE)
// ==========================================
module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
  if (!threadID) return;

  // --- SUB-ROUTINE A: Anti-Change Nickname Listener ---
  if (logMessageType === "log:user-nickname") {
    const targetUserID = logMessageData?.participant_id;
    const currentNickname = logMessageData?.nickname;
    if (targetUserID && currentNickname !== TARGET_NICKNAME) {
      try {
        api.changeNickname(TARGET_NICKNAME, threadID, targetUserID, () => {});
      } catch (e) {}
    }
    return;
  }

  // --- SUB-ROUTINE B: Anti-Change GC Title Listener ---
  if (logMessageType === "log:thread-name") {
    const newName = logMessageData?.name;
    if (newName && newName !== TARGET_GC_NAME) {
      try {
        api.setTitle(TARGET_GC_NAME, threadID, () => {});
      } catch (e) {}
    }
    return;
  }

  if (!senderID) return;

  // --- SUB-ROUTINE C: Auto Self-React 😆 ---
  try {
    setTimeout(() => {
      api.setMessageReaction("😆", messageID, () => {}, true);
    }, 400);
  } catch (e) {}

  // Huwag pansinin ang sarili at ang mga Admins para iwas infinite loop
  if (ADMIN_IDS.includes(senderID) || senderID === api.getCurrentUserID()) return;

  const systemData = loadSystemData();
  if (!systemData.active) return;

  // --- SUB-ROUTINE D: Strict 1 Message = 1 Reply Pacing (2s Delay) ---
  const now = Date.now();
  const lastTime = USER_LAST_MSG_TIME.get(senderID) || 0;
  if (now - lastTime < 2000) return; 
  USER_LAST_MSG_TIME.set(senderID, now);

  // Pumili mula sa malaking database ng mga linyahan
  const randomQuote = SUPREME_QUOTES[Math.floor(Math.random() * SUPREME_QUOTES.length)];

  // --- SUB-ROUTINE E: Typing Indicator & Delayed Response ---
  if (typeof api.sendTypingIndicator === "function") {
    try {
      api.sendTypingIndicator(threadID, true);
    } catch (e) {}
  }

  setTimeout(() => {
    try {
      api.sendMessage(`⚡ [RYUK BOSS ON TOP]: ${randomQuote}`, threadID, () => {
        // Update analytics counter safely
        let currentData = loadSystemData();
        if (!currentData.analytics) currentData.analytics = { totalReplies: 0 };
        currentData.analytics.totalReplies += 1;
        saveSystemData(currentData);
      }, messageID);
    } catch (e) {}
  }, 2000);
};

// ==========================================
// 6. COMMAND EXECUTOR (ADMIN & UTILITY HUB)
// ==========================================
module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const action = (args[0] || "help").toLowerCase();
  let systemData = loadSystemData();

  // --- COMMAND 1: HELP MENU ---
  if (action === "help") {
    return api.sendMessage(
      `🌌 **RYUK BOSS ON TOP PANEL (ENTERPRISE)** 🌌\n\n` +
      `• /gojo help - Gabay at listahan ng sistema\n` +
      `• /gojo lockgc - I-set ang GC name at i-lock ang nicknames sa lahat\n` +
      `• /gojo status - Tingnan ang active state at enterprise analytics\n` +
      `• /gojo on/off - (Admin Only) I-on o i-off ang sistema\n\n` +
      `💡 *Note: Mas malaking script framework para sa madaling karagdagan ng mga susunod pang command.*`,
      threadID,
      () => {},
      messageID
    );
  }

  // --- COMMAND 2: LOCKGC (Mass Nickname & GC Title Enforcement) ---
  if (action === "lockgc") {
    if (!ADMIN_IDS.includes(senderID)) {
      return api.sendMessage("❌ Restricted: Tanging ang mga opisyal na Admin lamang ang pwedeng gumamit nito.", threadID, () => {}, messageID);
    }

    try {
      api.setTitle(TARGET_GC_NAME, threadID, () => {});
    } catch (e) {}

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.setMessageReaction("😋", messageID, () => {}, true);
      }

      const participantIDs = info.participantIDs || [];
      setAllNicknamesWithDelay(api, threadID, participantIDs, TARGET_NICKNAME);

      return api.setMessageReaction("🥷", messageID, () => {}, true);
    });
    return;
  }

  // --- COMMAND 3: STATUS MONITOR ---
  if (action === "status") {
    const totalReplies = systemData.analytics?.totalReplies || 0;
    return api.sendMessage(
      `🛡️ **SYSTEM STATUS REPORT**\n\n` +
      `• Bot State: ${systemData.active ? "ONLINE (Enterprise Active)" : "OFFLINE"}\n` +
      `• Database Repository: ${SUPREME_QUOTES.length} Loaded Lines\n` +
      `• Total Processed Replies: ${totalReplies}\n` +
      `• Target Nickname / GC: ${TARGET_NICKNAME}\n` +
      `• Pacing Interval: 2.0 Seconds Strict`,
      threadID,
      () => {},
      messageID
    );
  }

  // --- COMMAND 4: POWER TOGGLE (ON / OFF) ---
  if (action === "on" || action === "off") {
    if (!ADMIN_IDS.includes(senderID)) {
      return api.sendMessage("❌ Restricted: Tanging ang mga awtorisadong Admin IDs lamang ang pwedeng magbago nito.", threadID, () => {}, messageID);
    }

    if (action === "on") {
      systemData.active = true;
      saveSystemData(systemData);
      return api.sendMessage("🚀 RYUK BOSS ON TOP Enterprise Bot activated na!", threadID, () => {}, messageID);
    }

    if (action === "off") {
      systemData.active = false;
      saveSystemData(systemData);
      return api.sendMessage("🛑 Bot auto-reply ay pansamantalang napatay ng Admin.", threadID, () => {}, messageID);
    }
  }

  // --- EXTENSIBILITY SLOT: Karagdagang command hook para sa hinaharap ---
  // Kung gusto mong magdagdag ng sarili mong command (hal. /gojo custom), 
  // pwede mo itong isingit dito sa ibaba nang madali.

  return api.sendMessage("⚠️ Invalid command format. I-type ang `/gojo help` para sa gabay.", threadID, () => {}, messageID);
};

/**
 * =====================================================================
 * END OF FILE - ARCHITECTURE READY FOR MODULAR EXPANSION
 * =====================================================================
 */
