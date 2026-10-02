const fs = require("fs");
const path = require("path");

// ==========================================
// COUNT BOT — FAST + CLEAN VERSION V4.0
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// COUNT: 1-50 | WALANG EMOJI | MAS MABILIS ✅
// ==========================================

const DATA_DIR = path.join(__dirname, "count_data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const MAX_COUNT = 50;

// ⚡ BINALISAN: Mas mabilis na delay
const COUNT_DELAY_MIN = 100;   // dati 1200
const COUNT_DELAY_MAX = 1000;  // dati 1800

const activeCount = {};
const currentNumber = {};
const running = {};
const offenderNames = {};

// 😂 Funny reasons — WALANG EMOJI
const FUNNY_REASONS = [
  "Kasi mukhang nag-loading pa utak niya bago lumaban.",
  "Naubusan yata ng confidence bago pa magsimula.",
  "Nag-practice muna pero nakalimutan ang actual laban.",
  "Masyadong busy mag-isip kung paano matatalo.",
  "Parang WiFi signal, biglang nawawala ang tapang.",
  "Naghanap ng strategy pero sa Google Maps napunta.",
  "Akala niya easy mode, tutorial pala ang kailangan.",
  "Nag-ready nang todo tapos umatras din.",
  "Masyadong mahaba ang loading screen ng tapang.",
  "Nag-timeout bago pa matapos ang laban.",
  "Nawala ang confidence kasama ng internet connection.",
  "Nag-isip ng comeback pero walang available na comeback.",
  "Parang calculator na walang battery, hindi gumana.",
  "Naghanda ng speech pero hindi nakapaghanda ng laban.",
  "Sobrang daming plano, zero execution.",
  "Nag-buffer ang tapang. Please wait...",
  "Akala niya may second chance, wala palang save point.",
  "Naghanap ng kakampi pero lahat naka-AFK.",
  "Masyadong confident sa simula, comedy sa ending.",
  "Nawala ang fighting spirit sa unang minuto.",
  "Nag-update yata ng strategy habang ongoing ang laban.",
  "Muntik nang manalo, kaso nagising ang alarm.",
  "Nag-login para lumaban, nag-logout din agad.",
  "Hindi natalo sa laban, natalo sa sariling desisyon.",
  "Parang exam, confident sa una tapos blanko sa dulo.",
  "Naghanap ng shortcut pero dead end pala.",
  "Masyadong seryoso ang laban kaya naging comedy show.",
  "Nag-charge ng phone pero nakalimutang i-charge ang tapang.",
  "Nawala yata ang manual ng pagiging malakas.",
  "Nag-prepare ng victory pose nang maaga.",
  "Hindi pa ready ang character niya sa next level.",
  "Nagkaroon ng technical difficulty ang confidence.",
  "Nag-buffer ang utak bago nakapag-react.",
  "Akala niya boss fight, siya pala ang tutorial character.",
  "Naghanap ng opening pero nagsara agad ang pagkakataon.",
  "Masyadong mabilis ang plano, mabagal ang execution.",
  "Naka-energy saving mode yata ang tapang.",
  "Nagkaroon ng unexpected maintenance ang confidence.",
  "Nag-restart ng utak pero same result pa rin.",
  "Akala niya comeback season, cancelled pala.",
  "Nag-practice ng victory speech pero hindi nagamit.",
  "Nawala ang signal ng fighting spirit.",
  "Parang loading bar na stuck sa 1 percent.",
  "Naghanap ng dahilan bago pa hanapin ang panalo.",
  "Masyadong busy mag-explain kaysa lumaban.",
  "Nagkaroon ng system error ang confidence.",
  "Hindi compatible ang strategy sa situation.",
  "Nag-update ang game, naiwan ang player.",
  "Nag-expect ng madaling panalo pero surprise ending.",
  "Nag-try hard pero nag-try harder ang kalaban.",
  "Naghintay ng himala pero walang dumating.",
  "Parang group project, may effort pero walang result.",
  "Nagkaroon ng plot twist na hindi niya binasa.",
  "Nawala ang tapang somewhere between hello at laban.",
  "Nag-ready ang katawan, naiwan ang tiwala sa sarili.",
  "Akala niya final boss, pero siya ang na-finalize.",
  "Naghanap ng exit button kahit wala namang exit.",
  "Masyadong maganda ang pasok, maikli ang pagganap.",
  "Nag-ipon ng lakas pero nakalimutang gamitin.",
  "Nagkaroon ng emergency meeting ang utak niya."
];

function isAdmin(senderID) {
  return ADMIN_IDS.has(String(senderID));
}

function getFile(threadID) {
  return path.join(DATA_DIR, `${threadID}.json`);
}

function loadData(threadID) {
  try {
    const file = getFile(threadID);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      return {
        active: Boolean(data.active),
        num: Number(data.num) || 0,
        max: Number(data.max) || MAX_COUNT
      };
    }
  } catch (e) {
    console.error("[COUNT] Load error:", e.message);
  }
  return { active: false, num: 0, max: MAX_COUNT };
}

function saveData(threadID, data) {
  try {
    fs.writeFileSync(getFile(threadID), JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("[COUNT] Save error:", e.message);
  }
}

function stopCount(threadID) {
  running[threadID] = false;
  activeCount[threadID] = false;
  const data = loadData(threadID);
  data.active = false;
  saveData(threadID, data);
}

function pickReason() {
  return FUNNY_REASONS[Math.floor(Math.random() * FUNNY_REASONS.length)];
}

function getRandomDelay() {
  return COUNT_DELAY_MIN + Math.floor(Math.random() * (COUNT_DELAY_MAX - COUNT_DELAY_MIN + 1));
}

function formatDate() {
  const now = new Date();
  const date = now.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "numeric",
    day: "numeric",
    year: "numeric"
  });
  const time = now.toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  const month = now.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long"
  });
  const year = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric"
  }).format(now);
  return { date, time, month, year };
}

function getUserName(api, userID) {
  return new Promise(resolve => {
    try {
      if (!api || typeof api.getUserInfo !== "function") {
        return resolve(`User ${userID}`);
      }
      api.getUserInfo(userID, (err, info) => {
        if (!err && info && info[userID]) {
          resolve(info[userID].name || info[userID].firstName || `User ${userID}`);
        } else {
          resolve(`User ${userID}`);
        }
      });
    } catch {
      resolve(`User ${userID}`);
    }
  });
}

function sendMessage(api, message, threadID) {
  return new Promise(resolve => {
    try {
      api.sendMessage(message, threadID, err => resolve(!err));
    } catch {
      resolve(false);
    }
  });
}

async function sendResult(api, threadID, stopped) {
  const dt = formatDate();
  let loseSection;

  if (offenderNames[threadID]) {
    const o = offenderNames[threadID];
    loseSection = `LOSE: ${o.fullName} (@[${o.id}])\n\n`;
  } else {
    loseSection = "LOSE: WALA — Walang nangahas lumaban!\n\n";
  }

  const title = stopped ? "COUNT STOPPED" : "50 REACHED!";
  const msg =
    `${title}\n\n` +
    `WIN: 50\n\n` +
    loseSection +
    `REASON: ${pickReason()}\n\n` +
    `DATE: ${dt.date}\n` +
    `MONTH: ${dt.month}\n` +
    `YEAR: ${dt.year}\n` +
    `TIME: ${dt.time}\n\n` +
    `COUNT COMPLETE!`;

  return sendMessage(api, msg, threadID);
}

async function countLoop(api, threadID) {
  if (activeCount[threadID]) return;
  activeCount[threadID] = true;

  while (running[threadID] && currentNumber[threadID] < MAX_COUNT) {
    currentNumber[threadID]++;
    saveData(threadID, {
      active: true,
      num: currentNumber[threadID],
      max: MAX_COUNT
    });

    const num = currentNumber[threadID];
    await sendMessage(api, `${num}`, threadID);

    if (num >= MAX_COUNT) {
      stopCount(threadID);
      await sendResult(api, threadID, false);
      activeCount[threadID] = false;
      return;
    }

    await new Promise(r => setTimeout(r, getRandomDelay()));
  }
  activeCount[threadID] = false;
}

function startCounting(api, threadID) {
  if (running[threadID]) return false;
  const data = loadData(threadID);
  offenderNames[threadID] = null;
  data.active = true;
  data.num = 0;
  data.max = MAX_COUNT;
  saveData(threadID, data);
  currentNumber[threadID] = 0;
  running[threadID] = true;
  countLoop(api, threadID);
  return true;
}

module.exports.config = {
  name: "count",
  version: "1.0.1",
  hasPermission: 1,
  credits: "RYUK",
  description: "Fast count 1-50 — Clean version",
  usePrefix: true,
  commandCategory: "COUNT",
  usages: "/count start | /count stop",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const tid = event.threadID;
  const sid = event.senderID;

  if (!isAdmin(sid)) return;

  const cmd = String(args[0] || "").toLowerCase();

  if (cmd === "start") {
    if (running[tid]) {
      return sendMessage(api, "May tumatakbo nang COUNT sa GC na ito.", tid);
    }
    startCounting(api, tid);
    return sendMessage(api,
      "COUNT STARTED\n\n" +
      "1 hanggang 50\n" +
      "Mabilis na pagbilang\n" +
      "Philippine Time\n" +
      "Walang emoji — malinis na tignan\n\n" +
      "Gamitin ang /count stop para huminto.",
      tid
    );
  }

  if (cmd === "stop") {
    if (!running[tid]) {
      return sendMessage(api, "Walang active COUNT.", tid);
    }
    stopCount(tid);
    return sendResult(api, tid, true);
  }

  return sendMessage(api,
    "COUNT COMMANDS\n\n" +
    "/count start\n" +
    "/count stop\n\n" +
    "Bilang: 1-50\n" +
    "Philippine Time",
    tid
  );
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event || !event.threadID) return;
    const tid = event.threadID;
    const data = loadData(tid);
    if (!data.active) return;
    if (event.type !== "message") return;

    const botID = String(api.getCurrentUserID ? api.getCurrentUserID() : api.userID || "");
    if (String(event.senderID) === botID) return;

    const body = String(event.body || "").toLowerCase();
    if (!body) return;

    const adminNames = ["ryuk", "gojo", "boss", "gnm", "gojo satoru"];
    const attackWords = /talo|baba|mahina|patay|alis|bwisit|gago|tanga|bobo|walang|pangit|bantay|hina|kawawa|iyak|tigil|hinto|alisin|siya|bawal|hindi/;

    let attacking = false;
    for (const name of adminNames) {
      if (body.includes(name) && attackWords.test(body)) {
        attacking = true;
        break;
      }
    }

    if (!attacking || !event.senderID) return;

    const fullName = await getUserName(api, event.senderID);
    offenderNames[tid] = { id: String(event.senderID), fullName };

    await new Promise(r => setTimeout(r, 800));
    const dt = formatDate();

    await sendMessage(api,
      "NAKITA KO ITO!\n\n" +
      `WIN: COUNT BOT\n\n` +
      `LOSE: ${fullName} (@[${event.senderID}])\n\n` +
      `REASON: ${pickReason()}\n\n` +
      `DATE: ${dt.date}\n` +
      `MONTH: ${dt.month}\n` +
      `YEAR: ${dt.year}\n` +
      `TIME: ${dt.time}`,
      tid
    );
  } catch (e) {
    console.error("[COUNT] Event error:", e.message);
  }
};
