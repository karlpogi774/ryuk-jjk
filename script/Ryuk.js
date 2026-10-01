const fs = require("fs");
const path = require("path");

// ==========================================
// RYUK POGI — FINAL WORKING VERSION V4.0
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ⚠️ KUNG AYAW GUMANA — IKLIIN ANG PANGALAN SA IBABA
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

// ⚠️ PILI KA LANG — KUNG AYAW GUMANA, PALITAN MO:
const TARGET_NICKNAME = "RYUK POGI";          // ✅ Maikli — siguradong gagana
// const TARGET_NICKNAME = "RYUK POGI ON TOP";  // ❌ Kung ayaw gumana, gamitin ang nasa itaas
const TARGET_GC_NAME = "RYUK POGI ON TOP";

const DATA_FILE = path.join(__dirname, "ryuk_gc_data.json");

const DEFAULT_DATA = {
  activeGCs: {},
  autoReact: true,
  autoWelcome: true,
  minDelay: 3000,
  maxDelay: 6000,
  totalReplies: 0
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();
const WELCOMED_USERS = new Set();
const MAX_SEEN = 5000;

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

// ==========================================
// ✅ INAYOS NA: MAY ERROR REPORTING
// ==========================================
async function setAllNicks(api, tid, members, name, botID) {
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  // I-check kung hindi sobrang mahaba
  if (name.length > 35) {
    return { 
      successCount, failCount, skipCount, total: members.length,
      error: `Pangalan masyadong mahaba! (${name.length} chars). Iikliin mo sa 35 pababa.`
    };
  }

  for (let i = 0; i < members.length; i++) {
    const uid = String(members[i]);
    
    // Huwag palitan ang sariling bot
    if (uid === String(botID)) {
      skipCount++;
      continue;
    }

    // ⚠️ 2 segundo bawat isa — huwag baguhin para hindi ma-block
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const result = await new Promise((resolve) => {
        api.changeNickname(name, tid, uid, (err) => {
          if (err) {
            resolve({ ok: false, msg: err.message || "Unknown error" });
          } else {
            resolve({ ok: true });
          }
        });
      });
      
      if (result.ok) {
        successCount++;
      } else {
        failCount++;
        console.log(`[FAIL] ${uid}: ${result.msg}`);
      }
    } catch (e) {
      failCount++;
      console.log(`[ERROR] ${uid}: ${e.message}`);
    }
  }

  return { successCount, failCount, skipCount, total: members.length };
}

module.exports.config = {
  name: "ryuk",
  version: "1.0.1",
  hasPermission: 1,
  credits: "RYUK POGI — WORKING VERSION",
  description: "GC Lock + All Nicknames with Error Report",
  usePrefix: true,
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const data = loadData();
    const tid = String(threadID);
    const botID = String(api.getCurrentUserID());

    if (!isGCActive(data, tid)) return;

    // Auto-Welcome
    if (logMessageType === "log:subscribe") {
      if (!data.autoWelcome) return;
      const newUsers = logMessageData.addedParticipants || [];
      for (const user of newUsers) {
        const uid = String(user.userFbId || user.id);
        if (uid === botID) continue;
        const welcomeKey = `${tid}:${uid}`;
        if (WELCOMED_USERS.has(welcomeKey)) continue;
        WELCOMED_USERS.add(welcomeKey);
        setTimeout(() => WELCOMED_USERS.delete(welcomeKey), 3600000);
        setTimeout(() => {
          const name = user.fullName || "Bagong miyembro";
          api.sendMessage(`Maligayang pagdating, ${name}!`, tid, () => {});
        }, 2000);
      }
      return;
    }

    // Auto-restore Nickname
    if (logMessageType === "log:user-nickname") {
      const uid = String(logMessageData.participant_id);
      const current = logMessageData.nickname || "";
      if (current !== TARGET_NICKNAME && uid !== botID) {
        setTimeout(() => {
          api.changeNickname(TARGET_NICKNAME, tid, uid, () => {});
        }, 2000);
      }
      return;
    }

    // Auto-restore GC Name
    if (logMessageType === "log:thread-name") {
      setTimeout(() => {
        api.setTitle(TARGET_GC_NAME, tid, () => {});
      }, 2000);
      return;
    }

  } catch (e) {
    console.error("[RYUK] Error:", e.message);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const data = loadData();
  const tid = String(threadID);
  const botID = String(api.getCurrentUserID());
  const action = (args[0] || "").toLowerCase();

  if (!isAdmin(senderID)) {
    return api.sendMessage("Access denied. Admin only.", tid, null, messageID);
  }

  if (action === "on") {
    setGCActive(data, tid, true);
    return api.sendMessage(
      "✅ RYUK ACTIVATED — THIS GC ONLY\n\n" +
      "GC: " + tid + "\n" +
      "Target Nickname: " + TARGET_NICKNAME + "\n" +
      "Type /ryuk lock to apply to ALL members",
      tid, null, messageID
    );
  }

  if (action === "off") {
    setGCActive(data, tid, false);
    return api.sendMessage("✅ RYUK DEACTIVATED", tid, null, messageID);
  }

  if (action === "lock") {
    api.sendMessage(
      "⏳ Checking...\n\n" +
      "Target Nickname: " + TARGET_NICKNAME + "\n" +
      "Length: " + TARGET_NICKNAME.length + " chars\n" +
      "Please wait...",
      tid, null, messageID
    );

    api.setTitle(TARGET_GC_NAME, tid, () => {});

    api.getThreadInfo(tid, async (err, info) => {
      if (err || !info) {
        return api.sendMessage("❌ Error: Cannot get group info.", tid, null, messageID);
      }
      
      const members = info.participantIDs || [];
      
      api.sendMessage(
        "👥 Found " + members.length + " members\n" +
        "⏱️ Estimated time: " + Math.ceil(members.length * 2 / 60) + " minutes\n" +
        "⚠️ DO NOT close this chat!\n\n" +
        "Starting now...",
        tid, null, messageID
      );
      
      const result = await setAllNicks(api, tid, members, TARGET_NICKNAME, botID);
      
      if (result.error) {
        return api.sendMessage(
          "❌ ERROR: " + result.error + "\n\n" +
          "👉 Solution: Palitan ang TARGET_NICKNAME sa 'RYUK POGI' lang.",
          tid, null, messageID
        );
      }
      
      api.sendMessage(
        "✅ DONE!\n\n" +
        "Total Members: " + result.total + "\n" +
        "✅ Changed: " + result.successCount + "\n" +
        "⏭️ Skipped (Bot): " + result.skipCount + "\n" +
        "❌ Failed: " + result.failCount + "\n\n" +
        result.failCount > 0 
          ? "⚠️ Kung maraming Failed — iikliin mo ang pangalan!\nGamitin: 'RYUK POGI'" 
          : "Lahat nagtagumpay! ✅",
        tid, null, messageID
      );
    });
    return;
  }

  if (action === "status") {
    const active = isGCActive(data, tid);
    return api.sendMessage(
      "📊 STATUS\n\n" +
      "Active: " + (active ? "✅ YES" : "❌ NO") + "\n" +
      "Target Nickname: " + TARGET_NICKNAME + "\n" +
      "Target GC Name: " + TARGET_GC_NAME,
      tid, null, messageID
    );
  }

  return api.sendMessage(
    "📋 COMMANDS\n\n" +
    "/ryuk on     → Turn ON\n" +
    "/ryuk off    → Turn OFF\n" +
    "/ryuk lock   → Set ALL nicknames\n" +
    "/ryuk status → Check status\n\n" +
    "⚠️ Kung ayaw gumana ang lock — iikliin ang TARGET_NICKNAME sa code!",
    tid, null, messageID
  );
};
    
