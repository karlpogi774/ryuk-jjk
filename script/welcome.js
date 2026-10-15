const fs = require("fs");
const path = require("path");

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817",
  "61595507156493"
];

const DELAY_MIN = 6000;
const DELAY_MAX = 12000;
const COOLDOWN = 10;

const WELCOME_MESSAGES = [
  "@%s — 新しい風が吹いたか。それともただの通り雨か 😡😂 /silent",
  "@%s — ここは生き残れる者だけがいる場所だ。覚悟はできてる 😡😂 /silent",
  "@%s — 入ってきたからにはルールに従え。俺がルールだ 😡😂 /silent",
  "@%s — 長居するなとは言わない。だがつまらないことはするな 😡😂 /silent",
  "@%s — 新しい顔か。消える前に名前くらいは覚えてやる 😡😂 /silent",
  "@%s — 誰であろうと特別扱いはしない。実力で示せ 😡😂 /silent",
  "@%s — ここの景色は俺が作ってる。従う者だけが見られる 😡😂 /silent",
  "@%s — 来るもの拒まず、去る者追わず。だが無駄な時間は許さない 😡😂 /silent",
  "@%s — 君がここにいる意味を見つけてみろ。見つからなければ終わりだ 😡😂 /silent",
  "@%s — 俺の目に留まったからには、それなりの覚悟を持て 😡😂 /silent",
  "@%s — 簡単に居場所は手に入らない。努力を見せてみろ 😡😂 /silent",
  "@%s — ここにいるということは俺に従うということだ 😡😂 /silent",
  "@%s — 新しいメンバーか。俺の基準は高いぞ 😡😂 /silent",
  "@%s — 誰もが同じ道を通るわけじゃない。君次第だ 😡😂 /silent",
  "@%s — 俺が認めた者だけが上に行ける。分かったか 😡😂 /silent",
  "@%s — 入ってきたからには結果を出せ。結果のない者には用はない 😡😂 /silent",
  "@%s — ここは俺の領域だ。勝手な真似は許さない 😡😂 /silent",
  "@%s — どれだけ耐えられるか見せてもらおう 😡😂 /silent",
  "@%s — 俺の言うことが聞けないなら今すぐ出て行け 😡😂 /silent",
  "@%s — 長く続くといいな。大抵はすぐに消えていくから 😡😂 /silent",
  "@%s — 君が何者なのか興味はない。ただ行動を見せろ 😡😂 /silent",
  "@%s — 下を見ろ。みんなそこにいる。上を見ろ。俺がいる 😡😂 /silent",
  "@%s — 俺に追いつこうなんて思わない方がいい 😡😂 /silent",
  "@%s — ここでは俺が全てだ。逆らうなら去れ 😡😂 /silent",
  "@%s — 新しい場所には覚悟が必要だ。分かってるな 😡😂 /silent",
  "@%s — 俺の前では誰もが等しい。だから努力だけが差になる 😡😂 /silent",
  "@%s — その居場所、君のものになるとは限らない 😡😂 /silent",
  "@%s — 俺が必要と認めた時、初めて君は存在する 😡😂 /silent",
  "@%s — 黙ってついて来ればいい。余計なことをするな 😡😂 /silent",
  "@%s — ここには俺がいる。俺がいる限り俺が一番だ 😡😂 /silent",
  "@%s — 君の実力、俺が確かめてやる。期待しないで待ってろ 😡😂 /silent",
  "@%s — ただ一つ言っておく。俺には逆らうな 😡😂 /silent",
  "@%s — どこから来ようと関係ない。ここでの実力が全てだ 😡😂 /silent",
  "@%s — 俺の領域に踏み込んだからには覚悟があるだろうな 😡😂 /silent",
  "@%s — 静かにしているのが一番賢い。分かったか 😡😂 /silent",
  "@%s — 俺が話す時は黙って聞け。それがルールだ 😡😂 /silent",
  "@%s — 君が何を望もうと俺が決める。それがここの掟 😡😂 /silent",
  "@%s — 俺に認められたい？なら俺を超えてみろ 😡😂 /silent",
  "@%s — 簡単に手に入る地位なんて意味がない 😡😂 /silent",
  "@%s — 俺は誰のものでもない。俺自身が俺のルールだ 😡😂 /silent"
];

const DATA_FILE = path.join(__dirname, "wc_data.json");
const DEFAULT_DATA = { activeGCs: {} };
const WELCOMED_USERS = new Set();

function isAdmin(id) {
  return ADMIN_IDS.includes(String(id).trim());
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
    }
  } catch (e) {
    console.error("[wc] Load error:", e.message);
  }
  return { ...DEFAULT_DATA };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("[wc] Save error:", e.message);
    return false;
  }
}

function getRandomDelay() {
  return Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
}

function getRandomWelcome() {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
}

module.exports.config = {
  name: "wc",
  aliases: ["welcome"],
  version: "2.2.0",
  hasPermission: 1,
  credits: "RYUK WELCOME",
  description: "✅ Japanese cold welcome | wc on/off",
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: COOLDOWN
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData, body, senderID } = event;
    if (!threadID) return;

    const tid = String(threadID);
    const botID = String(api.getCurrentUserID());
    const data = loadData();

    // ✅ KAPAG MAY NAG-TYPE NG "WELCOME" — HUWAG SUMAGOT!
    if (body && /^[\s!]*welcome[\s!]*$/i.test(body.trim())) {
      return; // TAHIMIK LANG — WALANG SAGOT
    }

    // ✅ BAGONG MIYEMBRO — MAG-WELCOME KUNG NAKA-ON
    if (logMessageType === "log:subscribe" && logMessageData && logMessageData.addedParticipants) {
      if (!data.activeGCs[tid]) return;

      const newUsers = logMessageData.addedParticipants;
      
      for (const user of newUsers) {
        const uid = String(user.userFbId);
        if (uid === botID) continue;
        
        const key = `${tid}:${uid}`;
        if (WELCOMED_USERS.has(key)) continue;
        WELCOMED_USERS.add(key);
        
        setTimeout(() => WELCOMED_USERS.delete(key), 3600000);

        const userName = user.fullName || "新しいメンバー";
        
        setTimeout(() => {
          const welcomeMsg = getRandomWelcome().replace("%s", userName);
          api.sendMessage(welcomeMsg, tid);
        }, getRandomDelay());
      }
    }
  } catch (err) {
    console.error("[wc Event] Error:", err);
  }
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, senderID } = event;
    const tid = String(threadID);
    const sender = String(senderID).trim();
    const data = loadData();

    if (!isAdmin(sender)) {
      return api.sendMessage("❌ 許可されていません！管理者のみ使用可能です /silent", tid);
    }

    const action = (args[0] || "").toLowerCase();

    if (action === "on") {
      data.activeGCs[tid] = true;
      saveData(data);
      return api.sendMessage("✅ WELCOME — ACTIVE 😡😂 /silent", tid);
    }

    if (action === "off") {
      data.activeGCs[tid] = false;
      saveData(data);
      return api.sendMessage("✅ WELCOME — OFF 😡😂 /silent", tid);
    }

    const status = data.activeGCs[tid] ? "✅ ACTIVE" : "❌ OFF";
    return api.sendMessage(`👑 WELCOME\nStatus: ${status}\nGamitin: wc on | wc off /silent`, tid);

  } catch (err) {
    console.error("[wc Command] Error:", err);
  }
};
  
