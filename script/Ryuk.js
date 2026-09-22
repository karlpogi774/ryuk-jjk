// ======================================================
// 👑 GOJO BOT V13 | INFINITY MAKUNAT EDITION 👑
// Lamyang Estilo | 4 Admin Protected | Stable 24/7 ✅
// ======================================================

const fs = require("fs");
const path = require("path");

// ======================================================
// 🔒 ADMIN IDs — LAHAT DITO 🔒
// ======================================================
const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

const DATA_FILE = path.join(__dirname, "gojo_data.json");
const LOG_FILE = path.join(__dirname, "gojo_error.log");
const TEMP_FILE = DATA_FILE + ".tmp";

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2500,
  cooldown: 4000,
  totalReplies: 0
};

const MAX_QUEUE = 500;
const MAX_SEEN = 3000;
const MAX_SEND_RETRIES = 5;
const RETRY_DELAY = 5000;
const WATCHDOG_INTERVAL = 30000;
const STUCK_TIMEOUT = 120000;

// ======================================================
// ⚡ RUNTIME STATE
// ======================================================
let data = { ...DEFAULT_DATA };
let queue = [];
let queueRunning = false;
let watchdogRunning = false;
let lastQueueActivity = Date.now();
let lastSaveTime = 0;
const seenMessages = new Set();
const userLastReply = new Map();

// ======================================================
// 📝 LOGGING
// ======================================================
function logInfo(msg) {
  console.log(`[${new Date().toISOString()}] ✅ ${msg}`);
}

function logError(where, err) {
  const msg = `[${new Date().toISOString()}] ❌ ${where}: ${err?.stack || err}\n`;
  console.error(msg);
  try { fs.appendFileSync(LOG_FILE, msg, "utf8"); } catch (_) {}
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ======================================================
// 🧾 DATA MANAGEMENT
// ======================================================
function normalizeData(input) {
  const res = { ...DEFAULT_DATA, ...(typeof input === "object" ? input : {}) };
  res.active = res.active !== false;
  res.autoReact = res.autoReact !== false;
  res.delay = Number.isFinite(res.delay) ? Math.max(0, Math.min(res.delay, 10000)) : 2500;
  res.cooldown = Number.isFinite(res.cooldown) ? Math.max(0, Math.min(res.cooldown, 60000)) : 4000;
  res.totalReplies = Number.isFinite(res.totalReplies) ? Math.max(0, res.totalReplies) : 0;
  return res;
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) { data = { ...DEFAULT_DATA }; saveData(); return; }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    data = raw.trim() ? normalizeData(JSON.parse(raw)) : { ...DEFAULT_DATA };
  } catch (e) { logError("Load failed", e); data = { ...DEFAULT_DATA }; }
}

function saveData() {
  try {
    fs.writeFileSync(TEMP_FILE, JSON.stringify(normalizeData(data), null, 2), "utf8");
    if (fs.existsSync(DATA_FILE)) fs.copyFileSync(DATA_FILE, DATA_FILE + ".bak");
    fs.renameSync(TEMP_FILE, DATA_FILE);
    lastSaveTime = Date.now();
    return true;
  } catch (e) {
    logError("Save failed", e);
    try { if (fs.existsSync(TEMP_FILE)) fs.unlinkSync(TEMP_FILE); } catch (_) {}
    return false;
  }
}
loadData();

// ======================================================
// 💬 GOJO LINES — LAMYANG ESTILO 💬
// ======================================================
const GOJO_LINES = [
  "Sa buong langit at lupa, ako lamang ang nag-iisang Honored One. ♾️",
  "Infinity ang pagitan natin — hindi mo ako maaabot. 😎",
  "Domain Expansion: Infinite Void — walang makakatalo. 🌌",
  "Relax ka lang, nandito na ang pinakamalakas sa lahat. 💙",
  "Six Eyes activated — nakikita ko ang lahat. 👁️",
  "Hindi nagyayabang — sinasabi ko lang ang katotohanan. 😏",
  "Gojo mode: ON — hindi titigil kahit kailan. ♾️",
  "Masyado kang mabagal para sa bilis ko. ⚡",
  "Walang drama, isang sagot lang — sapat na. 😂",
  "Nasa ibang mundo ang level na nilalaro ko. 🌌",
  "Hindi pa nga ako seryoso, nananalo na agad. 💙",
  "Ang lakas mo naman... puro salita lang eh. 😂",
  "Infinity barrier nakabantay — walang makakalusot. ♾️",
  "Tuloy mo lang — nakikinig ang Six Eyes. 👁️",
  "Ang tunay na lakas ay marunong maghintay ng tamang oras. ⏳",
  "Gojo Satoru — naririto para manatili. 😎",
  "Hindi ako late — dramatic entrance lang talaga. ✨",
  "Walang lag sa lakas ko — stable 24/7. ⚡",
  "Random ang linya, pero Gojo pa rin ang dating. 😎",
  "Keep calm — Infinity ang nagpapatakbo ng lahat. 🌌",
  "May mensahe? Gojo ay laging handang dumating. 😎",
  "Isang sagot lang — walang katapusang lakas. ♾️",
  "Bawat sagot ay darating sa tamang panahon. ⏱️",
  "Six Eyes online — handang magbantay. 👁️",
  "Walang kalituhan, walang duplicate — malinis lang. 💙",
  "Ang katahimikan ay bahagi ng aking diskarte. 😌",
  "Gojo energy: 100% — hindi mauubusan. 🔋",
  "Hindi kailangang mag-ingay para maging maalamat. 😎",
  "Domain Expansion: Maayos na pag-sagot sa lahat. 🌌",
  "Infinity nakabantay — sagot ay darating. ♾️",
  "May istilo ang bawat sagot — hindi puro ingay. 💙",
  "Ang tunay na galing ay nakikita sa katatagan. ⚡",
  "Kung may problema, ayusin bago magreklamo. 😂",
  "Huwag mag-alala — Gojo ang bahala sa lahat. 😎",
  "Depensang walang lamat, sagot na hindi mahuhuli. 🌌",
  "Nakita ng Six Eyes — may bago sa usapan. 👁️",
  "Isang tao, isang sagot — simple lang ang lahat. 💙",
  "Ang tiwala sa sarili ay walang kapalit. 😏",
  "Walang shortcut sa pagiging pinakamalakas. ♾️",
  "Gojo bot — handa, matatag, hindi aalis. 💙",
  "Infinity stable — tumatakbo nang walang humpay. ⚡",
  "Sino ang nagsabing kailangan kong magpabigat? 😏",
  "Walang makakalusot sa radar ng Gojo. 👁️",
  "Sapat na ang isang sagot para mapansin ako. 😎",
  "Tuloy ang usapan — Infinity ay nagbabantay pa rin. 🌌",
  "Hindi ako aalis — Gojo ay laging naririto. 💎"
];

const PREFIXES = ["♾️", "👁️", "🌌", "💙", "⚡"];
const MID = ["Gojo", "Six Eyes", "Infinity", "Honored One", "Boss"];
const STATUS = ["nagbabantay", "handang sumagot", "nakatutok", "hindi natutulog", "laging nandito"];
const EMOJIS = ["😎", "⚡", "♾️", "💙", "🌌", "👁️", "✨", "🔥", "🌀"];

const REPLIES = [...GOJO_LINES];
for (const p of PREFIXES) {
  for (const m of MID) {
    for (const s of STATUS) {
      for (const e of EMOJIS) {
        REPLIES.push(`${p} ${m} ${s} ${e}`);
      }
    }
  }
}

function randomReply() {
  return REPLIES[Math.floor(Math.random() * REPLIES.length)];
}

// ======================================================
// 🔐 ADMIN CHECK
// ======================================================
function isAdmin(id) {
  return ADMIN_IDS.includes(String(id));
}

// ======================================================
// ✅ CORE FUNCTIONS
// ======================================================
function sendMsg(api, text, tid, mid) {
  return new Promise(r => {
    try {
      api.sendMessage(text, tid, e => {
        if (e) { logError("Send failed", e); r(false); return; }
        r(true);
      }, mid);
    } catch (e) { logError("Send error", e); r(false); }
  });
}

function addReaction(api, mid) {
  try {
    if (!api?.setMessageReaction) return;
    api.setMessageReaction("🔥", mid, e => { if (e) logError("React failed", e); }, true);
  } catch (e) { logError("React error", e); }
}

function typingNow(api, tid) {
  try { if (api?.sendTypingIndicator) api.sendTypingIndicator(tid, () => {}); }
  catch (e) { logError("Typing error", e); }
}

function seenBefore(mid) {
  const id = String(mid);
  if (seenMessages.has(id)) return false;
  seenMessages.add(id);
  if (seenMessages.size > MAX_SEEN) seenMessages.delete(seenMessages.values().next().value);
  return true;
}

function enqueue(item) {
  if (!item?.api || !item.threadID || !item.senderID || !item.messageID) return;
  if (queue.length >= MAX_QUEUE) { logInfo("Queue full — lumang item tinanggal"); queue.shift(); }
  queue.push(item);
  lastQueueActivity = Date.now();
  startQueue();
}

async function safeSend(api, text, tid, mid) {
  for (let a = 1; a <= MAX_SEND_RETRIES; a++) {
    const ok = await new Promise(r => {
      try {
        api.sendMessage(text, tid, e => r(!e), mid);
      } catch { r(false); }
    });
    if (ok) return true;
    if (a < MAX_SEND_RETRIES) await sleep(Math.min(RETRY_DELAY * a, 30000));
  }
  return false;
}

async function startQueue() {
  if (queueRunning || !queue.length) return;
  queueRunning = true;
  try {
    while (queue.length) {
      lastQueueActivity = Date.now();
      const item = queue[0];
      loadData();
      if (!data.active) { await sleep(1000); continue; }
      const key = `${item.threadID}:${item.senderID}`;
      const elapsed = Date.now() - (userLastReply.get(key) || 0);
      if (elapsed < data.cooldown) { await sleep(data.cooldown - elapsed); continue; }
      typingNow(item.api, item.threadID);
      if (data.delay > 0) await sleep(data.delay);
      loadData(); if (!data.active) continue;
      const text = `♾️ 【 GOJO SATORU 】\n\n${randomReply()}`;
      const sent = await safeSend(item.api, text, item.threadID, item.messageID);
      if (sent) {
        userLastReply.set(key, Date.now());
        data.totalReplies++;
        saveData();
        queue.shift();
        logInfo(`Sagot naipadala | Natira: ${queue.length} | Kabuuan: ${data.totalReplies}`);
        if (data.autoReact) addReaction(item.api, item.messageID);
      } else {
        logInfo("Hindi naipadala — lumipat sa susunod");
        queue.shift();
        await sleep(3000);
      }
    }
  } catch (e) { logError("Queue crash", e); }
  finally {
    queueRunning = false;
    if (queue.length) setTimeout(startQueue, 1000);
  }
}

function startWatchdog() {
  if (watchdogRunning) return;
  watchdogRunning = true;
  setInterval(() => {
    try {
      if (queue.length && !queueRunning) {
        logInfo("🔄 Bumangon muli — patuloy ang takbo");
        startQueue();
      }
      if (queue.length && queueRunning && Date.now() - lastQueueActivity > STUCK_TIMEOUT) {
        logInfo("⚠️ Naipit — binubuhay muli");
        queueRunning = false;
        setTimeout(startQueue, 1000);
      }
    } catch (e) { logError("Watchdog error", e); }
  }, WATCHDOG_INTERVAL);
  logInfo("♾️ Infinity Watchdog — BANTAY NAKABUKAS ✅");
}

setInterval(() => {
  try {
    const now = Date.now();
    for (const [k, t] of userLastReply.entries()) if (now - t > 3600000) userLastReply.delete(k);
    while (seenMessages.size > MAX_SEEN) seenMessages.delete(seenMessages.values().next().value);
    loadData();
    if (queue.length && !queueRunning && data.active) startQueue();
  } catch (e) { logError("Maintenance error", e); }
}, 60000);

startWatchdog();

// ======================================================
// 📬 MAIN EVENT — KAPAG MAY MENSAHE
// ======================================================
module.exports = {
  config: {
    name: "gojo",
    version: "13.0.0",
    hasPermission: 0,
    credits: "GOJO BOT — RYUK",
    description: "Infinity Makunat | Lamyang Estilo | 4 Admin ✅",
    usePrefix: true,
    commandCategory: "Ultimate"
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID, senderID, body } = event;

    // ===== NOVA ON / OFF =====
    if (/^gojo\s+on$/i.test(body)) {
      if (!isAdmin(senderID)) return;
      data.active = true;
      saveData();
      return api.sendMessage("♾️ GOJO ACTIVE — Tuloy-tuloy na! Hindi hihinto! 💎👑", threadID);
    }
    if (/^gojo\s+off$/i.test(body)) {
      if (!isAdmin(senderID)) return;
      data.active = false;
      saveData();
      return api.sendMessage("♾️ GOJO PAUSE — Tahimik muna, pero nagbabantay pa rin. 👁️", threadID);
    }
    if (/^gojo\s+silent$/i.test(body)) {
      if (!isAdmin(senderID)) return;
      data.autoReact = false;
      saveData();
      return api.sendMessage("♾️ Silent mode — Sagot pa rin, walang reaksyon. ✅", threadID);
    }
    if (/^gojo\s+react$/i.test(body)) {
      if (!isAdmin(senderID)) return;
      data.autoReact = true;
      saveData();
      return api.sendMessage("♾️ Auto-react — Bumalik na! 🔥", threadID);
    }

    // ===== TULAY-TULONG NA SAGOT =====
    if (!seenBefore(messageID)) return;
    if (!data.active) return;

    enqueue({
      api,
      threadID,
      messageID,
      senderID
    });
  }
};
  
