const fs = require("fs");
const path = require("path");

// ==========================================
// RYUK POGI ON TOP — FIXED ALL NICKNAMES V2.7
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// TARGET GC NAME: RYUK POGI ON TOP
// TARGET NICKNAME: RYUK POGI ON TOP
// FIXED: SIGURADONG LAHAT NG MEMBER MAPAPALITAN ✅
// WALANG EMOJI — MALINIS NA VERSION
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const TARGET_NICKNAME = "RYUK POGI ON TOP";
const TARGET_GC_NAME = "RYUK POGI ON TOP";

const RYUK_LINES = [
  "RYUK POGI ON TOP — walang makakatalo dito",
  "GC LOCKED — pangalan ay hindi mapapalitan ng kahit sino",
  "RYUK POGI — ang tunay na hari sa grupong ito",
  "LAKAS AT GWAPO — RYUK POGI ON TOP, walang duda",
  "Lahat ay RYUK POGI ON TOP — walang exempted dito",
  "Hindi mababago, hindi matitinag — RYUK POGI LANG",
  "GC PROTECTED — subukan mo, ibabalik agad",
  "RYUK POGI ON TOP — pangalan na tatak sa isip niyo",
  "Walang makakabago — dito, RYUK ang nasusunod",
  "Naka-lock nang mahigpit — RYUK POGI ON TOP habang-buhay",
  "Pinakamaganda, pinakamakunat — RYUK POGI LANG YAN",
  "RYUK POGI ON TOP — taas noo, walang aatras",
  "Bantay 24/7 — pag binago, ibabalik agad sayo",
  "Dito sa GC na ito — RYUK POGI lang ang bida",
  "Pangalan na sagrado — RYUK POGI ON TOP, walang iba",
  "Hindi nagyayabang — sinasabi ko lang ang katotohanan",
  "Subukan mo lang — mas mabilis pa ako sa kidlat",
  "Ang tunay na pinuno — RYUK POGI ON TOP",
  "Walang makakatalo sa lakas at ganda ko",
  "RYUK POGI — pangalan na hindi malilimutan",
  "Matibay, matatag — RYUK POGI ON TOP",
  "Ikaw ang sumuko, hindi ako — RYUK POGI",
  "Pinakamakinang — RYUK POGI ON TOP",
  "Lumilipad pataas — RYUK POGI WALANG KAPANTAY",
  "Tingin mo kaya mo? Subukan mo lang",
  "Araw-araw RYUK POGI — walang araw na hindi",
  "Bilis ng kidlat — pag binago, ibabalik ko agad",
  "Hari ng lahat — RYUK POGI ON TOP",
  "Walang susuko, walang bibitaw — RYUK POGI",
  "Dito, isa lang ang nasusunod — AKO"
];

const DATA_FILE = path.join(__dirname, "ryuk_gc_data.json");

const DEFAULT_DATA = {
  activeGCs: {},
  autoReact: true,
  selfReact: true,
  minDelay: 3000,
  maxDelay: 6000,
  totalReplies: 0
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const MAX_SEEN = 5000;

let lineIndex = 0;
function getNextLine() {
  const line = RYUK_LINES[lineIndex];
  lineIndex = (lineIndex + 1) % RYUK_LINES.length;
  return line;
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return { ...DEFAULT_DATA, ...saved };
    }
  } catch (e) {
    console.error("[RYUK] Load error:", e.message);
  }
  return { ...DEFAULT_DATA };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("[RYUK] Save error:", e.message);
    return false;
  }
}

function isGCActive(data, threadID) {
  return data.activeGCs[String(threadID)] === true;
}

function setGCActive(data, threadID, status) {
  data.activeGCs[String(threadID)] = status;
  saveData(data);
}

function rememberMsg(id) {
  if (SEEN_MESSAGES.has(id)) return false;
  SEEN_MESSAGES.add(id);
  if (SEEN_MESSAGES.size > MAX_SEEN) {
    SEEN_MESSAGES.delete(SEEN_MESSAGES.values().next().value);
  }
  return true;
}

// ==========================================
// ✅ INAYOS: SIGURADONG LAHAT MAPAPALITAN
// ==========================================
async function setAllNicks(api, tid, members, name, botID) {
  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < members.length; i++) {
    const uid = String(members[i]);
    
    // ✅ HUWAG PALITAN ANG SARILING BOT
    if (uid === String(botID)) {
      skipCount++;
      continue;
    }

    // ✅ 1 BAWAT 1.2 SEGUNDO — HINDI MABIBIGLA ANG API
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      await new Promise((resolve) => {
        api.changeNickname(name, tid, uid, (err) => {
          if (!err) successCount++;
          resolve();
        });
      });
    } catch (e) {
      // patuloy kahit may mali
    }
  }

  return { successCount, skipCount, total: members.length };
}

module.exports.config = {
  name: "ryuk",
  version: "2.7.0",
  hasPermission: 0,
  credits: "RYUK POGI ON TOP — ALL NICKS FIXED",
  description: "GC-Specific Lock | All Nicknames Fixed",
  usePrefix: true,
  cooldowns: 3
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const data = loadData();
    const tid = String(threadID);
    const botID = String(api.getCurrentUserID());
    const sender = String(senderID);

    if (!isGCActive(data, tid)) return;

    if (logMessageType === "log:user-nickname") {
      const uid = String(logMessageData.participant_id);
      const current = logMessageData.nickname || "";
      if (current !== TARGET_NICKNAME && uid !== botID) {
        setTimeout(() => {
          api.changeNickname(TARGET_NICKNAME, tid, uid, () => {});
        }, 1500);
      }
      return;
    }

    if (logMessageType === "log:thread-name") {
      setTimeout(() => {
        api.setTitle(TARGET_GC_NAME, tid, () => {});
      }, 1500);
      return;
    }

    if (sender === botID || isAdmin(sender)) return;
    if (!messageID || !rememberMsg(String(messageID))) return;

    if (data.autoReact) {
      try {
        api.setMessageReaction("OK", messageID, () => {}, true);
      } catch (e) {}
    }

    const key = `${tid}:${sender}`;
    const now = Date.now();
    const last = USER_COOLDOWN.get(key) || 0;
    if (now - last < 4000) return;
    USER_COOLDOWN.set(key, now);

    const delay = getRandomDelay(data.minDelay, data.maxDelay);

    setTimeout(() => {
      if (!isGCActive(loadData(), tid)) return;
      
      const reply = "RYUK POGI ON TOP\n\n" + getNextLine();
      
      api.sendMessage(reply, tid, (err, info) => {
        if (!err && info && data.selfReact) {
          setTimeout(() => {
            try {
              api.setMessageReaction("YES", info.messageID, () => {}, true);
            } catch (e) {}
          }, 500);
        }
        if (!err) {
          data.totalReplies = (data.totalReplies || 0) + 1;
          saveData(data);
        }
      }, messageID);
    }, delay);

  } catch (e) {
    console.error("[RYUK] Error:", e.message);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const data = loadData();
  const tid = String(threadID);
  const botID = String(api.getCurrentUserID());
  const action = (args[0] || "help").toLowerCase();

  if (action === "help") {
    return api.sendMessage(
"RYUK POGI ON TOP — CONTROL PANEL\n\n" +
"COMMANDS\n" +
"\n" +
"/ryuk help\n" +
"  Show all commands\n" +
"\n" +
"/ryuk on\n" +
"  Activate — this GC only\n" +
"\n" +
"/ryuk off\n" +
"  Deactivate — this GC only\n" +
"\n" +
"/ryuk lock\n" +
"  Set GC Name + ALL Nicknames to RYUK POGI ON TOP\n" +
"  NOTE: This may take time for large groups\n" +
"\n" +
"/ryuk reacton\n" +
"  Turn on auto-reaction\n" +
"\n" +
"/ryuk reactoff\n" +
"  Turn off auto-reaction\n" +
"\n" +
"/ryuk status\n" +
"  Check status for this GC\n" +
"\n" +
"Admins: " + ADMIN_IDS.length + " registered\n" +
"GC-SPECIFIC — Works only where you turn it on",
      tid, null, messageID
    );
  }

  if (action === "status") {
    const active = isGCActive(data, tid);
    return api.sendMessage(
"STATUS — GC-SPECIFIC\n\n" +
"GC ID: " + tid + "\n" +
"Status: " + (active ? "ACTIVE" : "INACTIVE") + "\n" +
"Auto-React: " + (data.autoReact ? "ON" : "OFF") + "\n" +
"Self-React: " + (data.selfReact ? "ON" : "OFF") + "\n" +
"Total Replies: " + (data.totalReplies || 0) + "\n" +
"Delay: " + data.minDelay + "-" + data.maxDelay + "ms\n" +
"Lock Target: " + TARGET_GC_NAME + "\n\n" +
"RYUK POGI ON TOP — MAKUNAT",
      tid, null, messageID
    );
  }

  const adminCmds = ["on", "off", "lock", "reacton", "reactoff"];
  if (adminCmds.includes(action) && !isAdmin(senderID)) {
    return api.sendMessage("Access denied. Admin only.", tid, null, messageID);
  }

  if (action === "on") {
    setGCActive(data, tid, true);
    return api.sendMessage(
"RYUK ACTIVATED — THIS GC ONLY\n\n" +
"GC: " + tid + "\n" +
"RYUK POGI ON TOP — active here\n" +
"Type /ryuk lock to apply to ALL members",
      tid, null, messageID
    );
  }

  if (action === "off") {
    setGCActive(data, tid, false);
    return api.sendMessage(
"RYUK DEACTIVATED — THIS GC ONLY\n\n" +
"Stopped in this group. Will not respond until /ryuk on",
      tid, null, messageID
    );
  }

  if (action === "lock") {
    api.sendTypingIndicator(tid, true);
    
    api.setTitle(TARGET_GC_NAME, tid, () => {});
    
    api.getThreadInfo(tid, async (err, info) => {
      if (err || !info) {
        return api.sendMessage("Cannot get group info. Please try again.", tid, null, messageID);
      }
      
      const members = info.participantIDs || [];
      
      api.sendMessage(
"Processing...\n\n" +
"Found " + members.length + " members\n" +
"Changing all nicknames to: " + TARGET_NICKNAME + "\n" +
"This may take " + Math.ceil(members.length * 1.2) + " seconds...\n" +
"Please wait...",
        tid, null, messageID
      );
      
      const result = await setAllNicks(api, tid, members, TARGET_NICKNAME, botID);
      
      api.sendMessage(
"COMPLETED — RYUK POGI ON TOP\n\n" +
"Group Name: " + TARGET_GC_NAME + "\n" +
"Total Members: " + result.total + "\n" +
"Nicknames Changed: " + result.successCount + "\n" +
"Skipped (Bot): " + result.skipCount + "\n" +
"Cannot be changed — will restore automatically\n\n" +
getNextLine(),
        tid, null, messageID
      );
    });
    return;
  }

  if (action === "reacton") {
    data.autoReact = true;
    saveData(data);
    return api.sendMessage("Auto-reaction: ON", tid, null, messageID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveData(data);
    return api.sendMessage("Auto-reaction: OFF", tid, null, messageID);
  }

  return api.sendMessage("Unknown command. Type /ryuk help for list.", tid, null, messageID);
};
  
