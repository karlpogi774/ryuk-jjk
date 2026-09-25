// ==========================================================
// 👑 RYUK BOSS ON TOP — MAKUNAT V21.0 🧱
// ✅ GC NAME & NICKNAME: RYUK BOSS ON TOP
// ✅ KAPAG MAY NAGBAGO — AUTOMATIC IBALIK AGAD!
// ✅ LAHAT GUMAGANA KAHIT /SILENT!
// 🔒 ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817 ✅
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ryuk",
  version: "21.0.0-on-top",
  hasPermission: 0,
  credits: "👑 RYUK BOSS ON TOP — HINDI GAGALAWIN!",
  description: "RYUK BOSS ON TOP — IBALIK AGAD KUNG SINO MAN ANG SUMUBOK!",
  usePrefix: true,
  commandCategory: "👑 RYUK BOSS ON TOP",
  usages: "/ryuk on | /silent | /unsilent",
  cooldowns: 1
};

// ============== 🔒 ADMIN ==============
const ADMIN_IDS = Object.freeze([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const DATA_FILE = path.join(__dirname, "ryuk_king_data.json");

// ============== ⚡ TARGET — RYUK BOSS ON TOP ==============
const TARGET_NICKNAME = "RYUK BOSS ON TOP";
const TARGET_GCNAME = "RYUK BOSS ON TOP";

// ============== ⚡ DEFAULT DATA ==============
const DEFAULT_GC_DATA = Object.freeze({
  active: false,
  silent: false,
  roast: true,
  react: true,
  heartbeatReact: true,
  autoGname: true,
  autoNick: true,
  autoWelcome: true,
  savedGname: TARGET_GCNAME,
  savedNick: TARGET_NICKNAME,
  welcomeMsg: `
╭ ╭─────────────────────╮
 │ 👑 MALIGAYANG PAGDATING 👑
 │    @{username}
 │
 │ Ikaw ay naging 「RYUK BOSS ON TOP」na ⚡
 │ Sumunod sa batas, maging tapat
 │ Dito — RYUK ANG NASA TAAS 👑
 ╰───────────────────── ╮
 ╰─➤  RYUK GNM LVL 9999
  `.trim(),
  roastCount: 0,
  commandCount: 0,
  activatedBy: null,
  activatedAt: null,
  heartbeatIndex: 0,
  lastRestoreGname: 0,
  lastFullNickApply: 0
});

// ============== ⚡ ORAS ==============
const COOLDOWNS = Object.freeze({
  ROAST: 8000,
  COMMAND: 2500,
  HEARTBEAT: 20000,
  NICK_DELAY: 1000,
  RESTORE_GNAME: 1500,
  FULL_NICK_APPLY: 10000,
  GC_CHECK_INTERVAL: 5000
});

// ============== 🔄 TAGAPAG-INGAT ==============
const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const welcomedUsers = new Set();
const heartbeatIntervals = new Map();
const makunatNickIntervals = new Map();
const makunatGcNameIntervals = new Map();
const threadLocks = new Map();

// ============== ✨ MENSAHE ==============
const ALIVE_LINES = Object.freeze([
  "👑 RYUK BOSS ON TOP — HINDI MATATAGAL!",
  "💪 Kahit sino sumubok — IBABALIK KO AGAD!",
  "⚡ GC & NICK — RYUK BOSS ON TOP PALAGI!",
  "🔥 Walang makakapagbago — RYUK NANGUNGUNA!",
  "🧱 MAKUNAT — hangga't buhay, NASA TAAS AKO!"
]);

const HEARTBEAT_EMOJIS = ["🔥", "⚡", "💪", "👑", "✨"];
const ROASTS = Object.freeze([
  "💀 Subukan mo palitan — IBABALIK KO AGAD!",
  "🤣 Akala mo makakagawa ka? RYUK ON TOP PA RIN!",
  "👑 RYUK BOSS ON TOP — WALANG MAKAKAGAMBALA!",
  "😂 Walang makakatanggal sa akin sa TAAS!",
  "🔥 RYUK — HARI NG TAAS!"
]);
const EMOJIS = ["🔥", "💀", "🤣", "😆", "👑", "✨"];

// ============== 📂 DATA ==============
function loadAllData() {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}", "utf8");
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "{}");
  } catch (err) {
    console.error("[👑 RYUK] Load:", err?.message);
    return {};
  }
}

function saveAllData(allData) {
  try {
    fs.writeFileSync(`${DATA_FILE}.tmp`, JSON.stringify(allData, null, 2), "utf8");
    fs.renameSync(`${DATA_FILE}.tmp`, DATA_FILE);
    return true;
  } catch (err) {
    console.error("[👑 RYUK] Save:", err?.message);
    return false;
  }
}

function loadGCData(threadID) {
  const allData = loadAllData();
  const tid = String(threadID);
  if (!allData[tid]) allData[tid] = { ...DEFAULT_GC_DATA };
  return { ...DEFAULT_GC_DATA, ...allData[tid] };
}

function saveGCData(threadID, gcData) {
  const allData = loadAllData();
  allData[String(threadID)] = gcData;
  return saveAllData(allData);
}

// ============== 🛡️ TULONG ==============
const isAdmin = (id) => ADMIN_IDS.includes(String(id));
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function cooldownReady(map, key, duration) {
  const now = Date.now();
  const k = String(key);
  const last = map.get(k) || 0;
  if (now - last < duration) return false;
  map.set(k, now);
  return true;
}

function send(api, message, threadID, messageID = null) {
  return new Promise(resolve => {
    if (!api || !threadID || !message) return resolve(null);
    try { api.sendMessage(message, threadID, (_, i) => resolve(i), messageID); }
    catch { resolve(null); }
  });
}

function react(api, emoji, messageID) {
  return new Promise(resolve => {
    if (!api || !messageID || !emoji) return resolve(false);
    try {
      if (typeof api.setMessageReaction === "function") {
        api.setMessageReaction(emoji, messageID, () => resolve(true), true);
      } else { resolve(false); }
    } catch { resolve(false); }
  });
}

// ============== ✨ PALIT NICK SA ISANG MIYEMBRO ==============
async function setNickname(api, threadID, userID, newNick) {
  const methods = [
    async () => { await api.changeNickname?.(threadID, newNick, userID); },
    async () => { await api.changeNickname?.(newNick, threadID, userID); },
    async () => { await api.setNickname?.(threadID, newNick, userID); },
    async () => { await api.setNickname?.(newNick, threadID, userID); }
  ];
  for (let fn of methods) {
    try { await fn(); return true; } catch {}
  }
  return false;
}

// ============== ✨ PALIT NICK SA LAHAT MAY PAGKAANTALA ==============
async function setAllNicknamesWithDelay(api, threadID, userIDs, nickname) {
  const botID = String(await api.getCurrentUserID?.() || "");
  for (const id of userIDs) {
    if (String(id) === botID) continue;
    await setNickname(api, threadID, id, nickname);
    await sleep(COOLDOWNS.NICK_DELAY);
  }
}

async function applyNickToAll(api, threadID, nickname = TARGET_NICKNAME) {
  const lockKey = `nick_${threadID}`;
  if (threadLocks.get(lockKey)) return { success: 0, failed: 0 };
  threadLocks.set(lockKey, true);
  
  let info;
  try { info = await api.getThreadInfo(threadID); }
  catch { threadLocks.delete(lockKey); return { success: 0, failed: 0 }; }
  
  const members = info?.participantIDs || [];
  const botID = String(await api.getCurrentUserID?.() || "");
  let success = 0, failed = 0;
  
  for (const id of members) {
    if (String(id) === botID) continue;
    const ok = await setNickname(api, threadID, id, nickname);
    ok ? success++ : failed++;
    await sleep(COOLDOWNS.NICK_DELAY);
  }
  
  threadLocks.delete(lockKey);
  console.log(`[👑 ON TOP] GC ${threadID} → ${success} OK | ${failed} fail`);
  return { success, failed };
}

// ============== 🔒 IBALIK GC NAME ==============
async function restoreGroupName(api, threadID, gcData) {
  const targetName = gcData.savedGname;
  if (!targetName) return false;
  const now = Date.now();
  if (now - (gcData.lastRestoreGname || 0) < COOLDOWNS.RESTORE_GNAME) return false;
  
  let ok = false;
  if (typeof api.setTitle === "function") {
    try { await api.setTitle(targetName, threadID); ok = true; }
    catch {}
  }
  
  if (ok) {
    gcData.lastRestoreGname = now;
    saveGCData(threadID, gcData);
  }
  return ok;
}

// ============== 🧱 MAKUNAT NICK — TULOY PALAGI ==============
function startMakunatNick(api, threadID) {
  stopMakunatNick(threadID);
  const data = loadGCData(threadID);
  if (!data.active || !data.autoNick) return;
  
  const tid = String(threadID);
  makunatNickIntervals.set(tid, setInterval(async () => {
    const current = loadGCData(threadID);
    if (!current.active || !current.autoNick) {
      stopMakunatNick(tid);
      return;
    }
    
    const now = Date.now();
    if (now - (current.lastFullNickApply || 0) < COOLDOWNS.FULL_NICK_APPLY) return;
    
    await applyNickToAll(api, threadID, current.savedNick);
    current.lastFullNickApply = now;
    saveGCData(threadID, current);
  }, 1000));
}

function stopMakunatNick(threadID) {
  const k = String(threadID);
  if (makunatNickIntervals.has(k)) {
    clearInterval(makunatNickIntervals.get(k));
    makunatNickIntervals.delete(k);
  }
}

// ============== 🧱 MAKUNAT GC NAME — TULOY PALAGI ==============
function startMakunatGcName(api, threadID) {
  stopMakunatGcName(threadID);
  const data = loadGCData(threadID);
  if (!data.active || !data.autoGname) return;
  
  const tid = String(threadID);
  makunatGcNameIntervals.set(tid, setInterval(async () => {
    const current = loadGCData(threadID);
    if (!current.active || !current.autoGname) {
      stopMakunatGcName(tid);
      return;
    }
    
    let info;
    try { info = await api.getThreadInfo(threadID); }
    catch { return; }
    
    const currentName = info?.threadName || "";
    if (currentName !== current.savedGname) {
      const ok = await restoreGroupName(api, threadID, current);
      if (ok) {
        await send(api, `
👑 MAY NAGPALIT — IBINALIK AGAD!
🔒「${current.savedGname}」
        `.trim(), threadID);
      }
    }
  }, COOLDOWNS.GC_CHECK_INTERVAL));
}

function stopMakunatGcName(threadID) {
  const k = String(threadID);
  if (makunatGcNameIntervals.has(k)) {
    clearInterval(makunatGcNameIntervals.get(k));
    makunatGcNameIntervals.delete(k);
  }
}

// ============== 💪 HEARTBEAT — TULOY PALAGI ==============
function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  const data = loadGCData(threadID);
  if (!data.active) return;
  
  const tid = String(threadID);
  heartbeatIntervals.set(tid, setInterval(async () => {
    const current = loadGCData(threadID);
    if (!current.active) { stopHeartbeat(tid); return; }
    
    const msg = ALIVE_LINES[current.heartbeatIndex % ALIVE_LINES.length];
    current.heartbeatIndex++;
    saveGCData(threadID, current);
    
    const sent = await send(api, msg, threadID);
    if (sent?.messageID && current.heartbeatReact) {
      await react(api, pickRandom(HEARTBEAT_EMOJIS), sent.messageID);
    }
  }, COOLDOWNS.HEARTBEAT));
}

function stopHeartbeat(threadID) {
  const k = String(threadID);
  if (heartbeatIntervals.has(k)) {
    clearInterval(heartbeatIntervals.get(k));
    heartbeatIntervals.delete(k);
  }
}

// ============== 📩 HANDLE EVENT — AUTO IBALIK KUNG MAY NAGBAGO! ✅ ==============
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType, logMessageData } = event;
  if (!threadID) return;
  
  const gcData = loadGCData(threadID);
  if (!gcData.active) return;

  // ✅ KAPAG MAY NAGPALIT NG NICKNAME — IBALIK AGAD!
  if (logMessageType === "log:user-nickname") {
    const targetUserID = logMessageData.participant_id;
    const currentNickname = logMessageData.nickname;
    
    if (currentNickname !== gcData.savedNick) {
      api.changeNickname(gcData.savedNick, threadID, targetUserID, () => {});
    }
    return;
  }

  // ✅ KAPAG MAY NAGPALIT NG GC NAME — IBALIK AGAD!
  if (logMessageType === "log:thread-name") {
    setTimeout(async () => {
      const info = await api.getThreadInfo(threadID);
      if (info?.threadName !== gcData.savedGname) {
        api.setTitle(gcData.savedGname, threadID, () => {});
      }
    }, 500);
    return;
  }

  // ✅ BAGONG SUMALI — PALIT AGAD NICK
  if (logMessageType === "log:subscribe") {
    const newMembers = logMessageData?.addedParticipants || [];
    if (!newMembers.length) return;
    const botID = String(await api.getCurrentUserID?.() || "");
    
    for (const m of newMembers) {
      const uid = String(m.userFbId || m.id || "");
      if (!uid || uid === botID) continue;
      
      if (gcData.autoNick) {
        await setNickname(api, threadID, uid, gcData.savedNick);
        await sleep(COOLDOWNS.NICK_DELAY);
      }
      
      if (gcData.autoWelcome) {
        let name = "Bagong Miyembro";
        try {
          const info = await api.getUserInfo(uid);
          if (info?.[uid]) name = info[uid].name;
        } catch {}
        const text = gcData.welcomeMsg.replaceAll("{username}", name);
        await send(api, text, threadID);
      }
    }
    return;
  }

  // ✅ CHAT REPLY — TULOY PALAGI
  if (!senderID || !body) return;
  try { if (String(senderID) === String(await api.getCurrentUserID?.() || "")) return; } catch {}
  const text = String(body).trim();
  if (!text || text.startsWith("/") || text.startsWith("!")) return;
  
  if (!gcData.roast || processing.has(String(threadID))) return;
  if (!cooldownReady(roastCooldown, threadID, COOLDOWNS.ROAST)) return;
  
  processing.add(String(threadID));
  try {
    const sent = await send(api, pickRandom(ROASTS), threadID);
    if (sent?.messageID && gcData.react) {
      await react(api, pickRandom(EMOJIS), sent.messageID);
    }
    gcData.roastCount++;
    saveGCData(threadID, gcData);
  } finally {
    processing.delete(String(threadID));
  }
};

// ============== 👑 MGA UTOS ==============
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const cmd = String(args?.[0] || "help").toLowerCase();
  
  const adminCmds = ["on","off","silent","unsilent","restore","setnick","autonick","setgname","autogname","roast","react","heartreact","autowelcome","setwelcome","status"];
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return send(api, "🔒 BAWAL — hindi pinagkatiwalaan!", threadID, messageID);
  }
  
  if (!cooldownReady(commandCooldown, senderID, COOLDOWNS.COMMAND)) return;
  
  let gcData = loadGCData(threadID);
  gcData.commandCount++;
  saveGCData(threadID, gcData);

  // ⚡ BUKASAN — RYUK ON TOP!
  if (cmd === "on") {
    gcData.active = true;
    gcData.silent = false;
    gcData.savedNick = TARGET_NICKNAME;
    gcData.savedGname = TARGET_GCNAME;
    gcData.activatedBy = senderID;
    gcData.activatedAt = Date.now();
    gcData.lastFullNickApply = 0;
    saveGCData(threadID, gcData);
    
    // ✅ AGAD ITAKDA ANG GC NAME
    api.setTitle(TARGET_GCNAME, threadID, () => {});
    
    api.getThreadInfo(threadID, async (err, info) => {
      if (!err && info) {
        const participantIDs = info.participantIDs || [];
        await setAllNicknamesWithDelay(api, threadID, participantIDs, TARGET_NICKNAME);
      }
    });
    
    startHeartbeat(api, threadID);
    startMakunatNick(api, threadID);
    startMakunatGcName(api, threadID);
    
    return send(api, `
👑「RYUK BOSS ON TOP」— NAKABUKAS NA! 🧱

✅ GC NAME: 「${TARGET_GCNAME}」
✅ NICKNAME:「${TARGET_NICKNAME}」
✅ KAPAG MAY NAGPALIT → AUTOMATIC IBALIK AGAD!
✅ TUWING 10S → PALIT SA LAHAT
✅ TUWING 5S → BANTAY GC NAME
✅ LAHAT GUMAGANA KAHIT /SILENT!

💡 /silent — walang titigil | /unsilent — pareho lang
    `.trim(), threadID, messageID);
  }

  // 🔴 PATAYIN
  if (cmd === "off") {
    gcData.active = false;
    gcData.silent = false;
    saveGCData(threadID, gcData);
    
    stopHeartbeat(threadID);
    stopMakunatNick(threadID);
    stopMakunatGcName(threadID);
    
    return send(api, "🔴「RYUK BOSS ON TOP」— TUMIGIL NA!", threadID, messageID);
  }

  // 🤫 SILENT — WALANG BABAGO
  if (cmd === "silent") {
    if (!gcData.active) return send(api, "⚠️ /ryuk on muna!", threadID, messageID);
    if (gcData.silent) return send(api, `
🤫 Naka-SILENT na!
✅ WALANG TUMIGIL — RYUK ON TOP PA RIN!
🧱 MAY NAGPALIT → IBALIK AGAD!
🧱 TUWING 10S → PALIT NICK
🧱 TUWING 5S → IBALIK GC NAME
💓 HEARTBEAT • 👋 WELCOME • 💬 REPLY — LAHAT GUMAGANA!
💡 /unsilent — pareho lang
    `.trim(), threadID, messageID);
    
    gcData.silent = true;
    saveGCData(threadID, gcData);
    return send(api, `
🤫「SILENT」— RYUK ON TOP PA RIN! ✅

✅ MAY NAGPALIT NG NICK → IBALIK AGAD!
✅ MAY NAGPALIT NG GC → IBALIK AGAD!
✅ TUWING 10S → PALIT SA LAHAT
✅ TUWING 5S → BANTAY GC NAME
✅ LAHAT — TULOY-TULOY!
    `.trim(), threadID, messageID);
  }

  // 🔊 UNSILENT
  if (cmd === "unsilent") {
    gcData.silent = false;
    saveGCData(threadID, gcData);
    return send(api, "🔊「NORMAL」— RYUK ON TOP PA RIN! ✅", threadID, messageID);
  }

  // 🔒 RESTORE — IBALIK AGAD!
  if (cmd === "restore") {
    gcData.savedNick = TARGET_NICKNAME;
    gcData.savedGname = TARGET_GCNAME;
    gcData.lastFullNickApply = 0;
    saveGCData(threadID, gcData);
    
    api.setTitle(TARGET_GCNAME, threadID, () => {});
    
    api.getThreadInfo(threadID, async (err, info) => {
      if (!err && info) {
        await setAllNicknamesWithDelay(api, threadID, info.participantIDs || [], TARGET_NICKNAME);
      }
    });
    
    return send(api, `
👑 IBINALIK LAHAT SA RYUK ON TOP! ✅
🔷 GC: 「${TARGET_GCNAME}」
🔷 NICK:「${TARGET_NICKNAME}」
    `.trim(), threadID, messageID);
  }

  // ✅ STATUS
  if (cmd === "status") {
    return send(api, `
👑 KALAGAYAN — RYUK BOSS ON TOP

Sistema:     ${gcData.active ? "NAKABUKAS 🟢" : "NAKASARA 🔴"}
Target GC:   「${gcData.savedGname}」
Target Nick: 「${gcData.savedNick}」
Auto-Restore:✅ IBALIK AGAD KUNG MAY NAGPALIT!
Silent:      ${gcData.silent ? "AKTIBO 🤫 — TULOY LAHAT!" : "NORMAL 🔊"}
    `.trim(), threadID, messageID);
  }

  return send(api, `
👑 MGA UTOS:

/ryuk on       → Buksan — RYUK ON TOP AGAD!
/ryuk off      → Patayin
/ryuk restore  → Ibalik agad sa RYUK ON TOP
/silent        → 🤫 Walang titigil — lahat gumagana!
/unsilent      → 🔊 Pareho lang
/ryuk status   → Tignan kalagayan
    `.trim(), threadID, messageID);
};
      
