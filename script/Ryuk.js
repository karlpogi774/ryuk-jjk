const fs = require("fs");
const path = require("path");

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

let TARGET_USER_ID = "";
let targetNickname = "RYUK POGI";
let targetGCName = "RYUK POGI ON TOP";

const SELF_REACT_EMOJIS = ["😭"];
const ALL_REACT_EMOJIS = ["🔥", "💪", "👑", "⚡", "😎", "✅", "💯"];

const NICK_DELAY_MIN = 3000;
const NICK_DELAY_MAX = 9000;
const REPLY_DELAY_MIN = 1500;    // MAS MABILIS ✅
const REPLY_DELAY_MAX = 3500;     // MAS MABILIS ✅
const AUTO_RESTORE_DELAY = 90000;
const COOLDOWN = 3000;            // Mas mabilis na cooldown ✅

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: true,
  silentMode: false,
  autoReact: false,
  selfReact: true,
  targetNickname: "RYUK POGI",
  targetGCName: "RYUK POGI ON TOP",
  targetUserID: ""
};

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID).trim());
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomEmoji() {
  return SELF_REACT_EMOJIS[Math.floor(Math.random() * SELF_REACT_EMOJIS.length)];
}

function getRandomAutoReactEmoji() {
  return ALL_REACT_EMOJIS[Math.floor(Math.random() * ALL_REACT_EMOJIS.length)];
}

function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
    }
  } catch {}
  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    data.targetNickname = targetNickname;
    data.targetGCName = targetGCName;
    data.targetUserID = String(TARGET_USER_ID).trim();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

function send(api, message, threadID, messageID, doSelfReact = false) {
  return api.sendMessage(message, threadID, (err, info) => {
    if (!err && doSelfReact && info) {
      setTimeout(() => {
        try { api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true); } catch {}
      }, getRandomDelay(1000, 2000)); // MAS MABILIS ✅
    }
  }, messageID);
}

function rememberMessage(messageID) {
  const id = String(messageID);
  if (SEEN_MESSAGES.has(id)) return false;
  SEEN_MESSAGES.add(id);
  return true;
}

function getReplyText(fullName, isPM) {
  const pmReplies = [
    `@${fullName} — Huwagg kang lumapit, ayaw kita kausap 😡😂 /silent`,
    `@${fullName} — Umalis ka na bago pa mawala ang pasensya ko 😡😂 /silent`,
    `@${fullName} — Sino ka ba para abalahin ako? 😡😂 /silent`,
    `@${fullName} — Ang kulit mo namann, hindi ba pwedeng manahimik? 😡😂 /silent`,
    `@${fullName} — Wala kang makukuha sa akinn, umalis ka na 😡😂 /silent`,
    `@${fullName} — Nakakainis ka na talagaa, alam mo ba 'yan? 😡😂 /silent`,
    `@${fullName} — Huwagg kang umakto na parang kilala kita 😡😂 /silent`,
    `@${fullName} — Masyado kang maingayg, tumahimik ka nga 😡😂 /silent`,
    `@${fullName} — Hindi kita interesadoo, wag mo akong abalahin 😡😂 /silent`,
    `@${fullName} — Subukan mo paa, at ikaw ang magsisisi 😡😂 /silent`,
    `@${fullName} — Hindi mo ba naiintindihan na ayaw kitaa? 😡😂 /silent`,
    `@${fullName} — Ang taas ng tingin mo sa sarili moo 😡😂 /silent`,
    `@${fullName} — Lumayo ka sa harap koo, salamat 😡😂 /silent`,
    `@${fullName} — Hindi nakakatawa ang ginagawa moo 😡😂 /silent`,
    `@${fullName} — Tigilan mo na akoo, hindi ako nagbibiro 😡😂 /silent`,
    `@${fullName} — Ano bang gusto mo? Sabihin mo na at umalis kaa 😡😂 /silent`,
    `@${fullName} — Wala kang silbii sa paningin ko 😡😂 /silent`,
    `@${fullName} — Huwagg kang magmalakii, hindi tayo pantay 😡😂 /silent`,
    `@${fullName} — Ang dami mong sinasabii pero walang saysay 😡😂 /silent`,
    `@${fullName} — Hindi mo antayann ang antas ko 😡😂 /silent`,
    `@${fullName} — Sayang lang ang oras mo sa akinn 😡😂 /silent`,
    `@${fullName} — Hindi ako interesado sa kwento moo 😡😂 /silent`,
    `@${fullName} — Umalis ka na habang maayos pa ang usapann 😡😂 /silent`,
    `@${fullName} — Hindi kita kaibigann, wag kang magpanggap 😡😂 /silent`,
    `@${fullName} — Nakakasawa na ang pagmumukhaa mo 😡😂 /silent`,
    `@${fullName} — Wala kang maipagmamalaki sa harap koo 😡😂 /silent`,
    `@${fullName} — Anoo, naghahanap ka ba ng atensyon? 😡😂 /silent`,
    `@${fullName} — Huwagg kang masyadong kumpiyansaa 😡😂 /silent`,
    `@${fullName} — Ang lakas ng loob mong kausapin akinn 😡😂 /silent`,
    `@${fullName} — Bumalik ka kung may halaga ka naa 😡😂 /silent`,
    `@${fullName} — Hindi ako naglalaroo, seryoso ako 😡😂 /silent`,
    `@${fullName} — Masyado kang nakakaabala sa araw koo 😡😂 /silent`,
    `@${fullName} — Huwagg kang magtangkang sundan akinn 😡😂 /silent`,
    `@${fullName} — Mas mabuti kang manahimik na langg 😡😂 /silent`,
    `@${fullName} — Huwagg mong subukan ang pasensya koo 😡😂 /silent`,
    `@${fullName} — Hindi ka nakakabilibb, nakakainis ka lang 😡😂 /silent`,
    `@${fullName} — Wag kang umepall, hindi kita kausap 😡😂 /silent`,
    `@${fullName} — Ang bagal mong umintindihinn 😡😂 /silent`,
    `@${fullName} — Hindi ako nagpapaliwanag sa tulad moo 😡😂 /silent`,
    `@${fullName} — Subukan mo ulit at magsisisi kaa 😡😂 /silent`,
    `@${fullName} — Huwagg kang masyadong malakas ang loobbb 😡😂 /silent`,
    `@${fullName} — Wala kang karapatang mang-abalaa 😡😂 /silent`,
    `@${fullName} — Hindi mo ba alam na nakakaabala kaa? 😡😂 /silent`,
    `@${fullName} — Umalis ka naa, hindi kita gustong makita 😡😂 /silent`,
    `@${fullName} — Huwagg kang umasa na magiging magkaibigan tayoo 😡😂 /silent`,
    `@${fullName} — Ang hirap mong intindihinn 😡😂 /silent`,
    `@${fullName} — Hindi ka espesyall, wag kang mag-isip 😡😂 /silent`,
    `@${fullName} — Tigilan mo na ako bago pa magbago ang isip koo 😡😂 /silent`,
    `@${fullName} — Ang ugali mo hindi magandaa, alam mo ba? 😡😂 /silent`,
    `@${fullName} — Huwagg kang dumikitt, hindi kita kilala 😡😂 /silent`,
    `@${fullName} — Hindi ako nagpapakumbabaa 😡😂 /silent`,
    `@${fullName} — Sayang talaga ang oras ko sayoo 😡😂 /silent`,
    `@${fullName} — Nakakabwisit ang pagiging epal moo 😡😂 /silent`,
    `@${fullName} — Hindi mo ako mababagoo 😡😂 /silent`,
    `@${fullName} — Huwagg kang umasta na parang mas mataas kaa 😡😂 /silent`,
    `@${fullName} — Hindi ako nagtitiwala sa hindi ko kilalaa 😡😂 /silent`,
    `@${fullName} — Wala kang panalo ditto, tanggapin mo na 😡😂 /silent`,
    `@${fullName} — Hindi mo ba nakikitang ayaw kita kausapp? 😡😂 /silent`,
    `@${fullName} — Lumayo ka, hindi mo ako kailangang guluhinn 😡😂 /silent`,
    `@${fullName} — Hindi ako interesado sa kung sino kaa 😡😂 /silent`,
    `@${fullName} — Wala kang makukuhaa, itigil mo na 'yan 😡😂 /silent`,
    `@${fullName} — Ang kulit mo namann, parang bata 😡😂 /silent`,
    `@${fullName} — Mas mabuti kang umalis habang pwede paa 😡😂 /silent`,
    `@${fullName} — Hindi mo ba naiintindihan ang simpleng salitaa? 😡😂 /silent`,
    `@${fullName} — Lumayo ka sa buhay koo, salamat 😡😂 /silent`
  ];

  const gcReplies = [
    `@${fullName} — Huwagg kang mag-ingay ditto, manahimik ka 😡😂 /silent`,
    `@${fullName} — Umalis ka na bago pa magalit ang ibaa 😡😂 /silent`,
    `@${fullName} — Sino ka ba para manggulo ditto? 😡😂 /silent`,
    `@${fullName} — Ang kulit moo, hindi ba pwede tumahimik? 😡😂 /silent`,
    `@${fullName} — Wala kang ambag ditto, wag kang magsalita 😡😂 /silent`,
    `@${fullName} — Nakakainis na ang pag-uugali moo 😡😂 /silent`,
    `@${fullName} — Huwagg kang umepall, hindi ikaw ang bida 😡😂 /silent`,
    `@${fullName} — Masyado kang maingayg, tumahimik ka nga 😡😂 /silent`,
    `@${fullName} — Hindi ka sentro ng atensyonn ditto 😡😂 /silent`,
    `@${fullName} — Subukan mo ulit at paalisin kitaa 😡😂 /silent`,
    `@${fullName} — Wala kang sinasabing makabuluhann 😡😂 /silent`,
    `@${fullName} — Huwagg kang magmalakii, hindi ka espesyal 😡😂 /silent`,
    `@${fullName} — Hindi ka kasali sa usapan naminn 😡😂 /silent`,
    `@${fullName} — Ang dami mong sinasabii pero walang laman 😡😂 /silent`,
    `@${fullName} — Hindi nakakatawa ang mga biro moo 😡😂 /silent`,
    `@${fullName} — Tigilan mo na ang paggulo moo 😡😂 /silent`,
    `@${fullName} — Ano bang problema moo? Solve mo 'yan 😡😂 /silent`,
    `@${fullName} — Hindi mo ba alam na nakakaabala ka sa ibaa? 😡😂 /silent`,
    `@${fullName} — Huwagg mong ituloy 'too, hindi maganda 😡😂 /silent`,
    `@${fullName} — Wala kang karapatang manghimasok ditto 😡😂 /silent`,
    `@${fullName} — Nakakasawa na ang paulit-ulit mong sinasabii 😡😂 /silent`,
    `@${fullName} — Huwagg kang magsalita kung wala kang alamm 😡😂 /silent`,
    `@${fullName} — Gusto mo bang hindi ka na pansininn? 😡😂 /silent`,
    `@${fullName} — Huwagg kang masyadong kumpiyansaa sa sarili 😡😂 /silent`,
    `@${fullName} — Ang lakas ng loob mong mang-abalaa 😡😂 /silent`,
    `@${fullName} — Wala kang makukuhaa ditto, umalis ka na 😡😂 /silent`,
    `@${fullName} — Mas mabuti kang manahimik na langg 😡😂 /silent`,
    `@${fullName} — Huwagg mong subukan ang pasensya naminn 😡😂 /silent`,
    `@${fullName} — Hindi ka nakakabilibb, alam mo ba 'yan? 😡😂 /silent`,
    `@${fullName} — Hindi kami interesado sa opinyon moo 😡😂 /silent`,
    `@${fullName} — Umalis ka bago pa magalit ang lahat 😡😂 /silent`,
    `@${fullName} — Wala kang halagaa ditto, tanggapin mo na 😡😂 /silent`,
    `@${fullName} — Huwagg kang magsalita kung mali namann 😡😂 /silent`,
    `@${fullName} — Ang ingay moo, parang bata na hindi mapakali 😡😂 /silent`,
    `@${fullName} — Hindi ka naminn kilala, wag kang magmalaki 😡😂 /silent`,
    `@${fullName} — Sayang lang ang oras namin sayoo 😡😂 /silent`,
    `@${fullName} — Huwagg kang magpanggap na kilala mo kamii 😡😂 /silent`,
    `@${fullName} — Ang kulit mo namann, hindi ba sapat na? 😡😂 /silent`,
    `@${fullName} — Mas mababa ka pa sa inaakala moo 😡😂 /silent`,
    `@${fullName} — Huwagg kang magyabang sa harap ng ibaa 😡😂 /silent`,
    `@${fullName} — Ano bang hindi mo naiintindihan sa "lumayo kaa"? 😡😂 /silent`,
    `@${fullName} — Hindi kami nagpapaliwanag sa hindi naminn kilala 😡😂 /silent`,
    `@${fullName} — Subukan mo ulit at hindi ka na papansininn 😡😂 /silent`,
    `@${fullName} — Wala kang karapatang mangunaa ditto 😡😂 /silent`,
    `@${fullName} — Hindi mo ba nakikitang ayaw ka namin dittoo? 😡😂 /silent`,
    `@${fullName} — Umalis ka naa, hindi ka namin gustong makita 😡😂 /silent`,
    `@${fullName} — Huwagg kang umasa na tatanggapin ka naminn 😡😂 /silent`,
    `@${fullName} — Ang hirap mong intindihinn, umalis ka na lang 😡😂 /silent`,
    `@${fullName} — Tigilan mo na ang paggulo sa aminn 😡😂 /silent`,
    `@${fullName} — Wala kang maipagmamalaki, tumahimik ka naa 😡😂 /silent`,
    `@${fullName} — Ang ugali mo hindi magandaa, isipin mo 'yan 😡😂 /silent`,
    `@${fullName} — Huwagg kang manghimasok sa usapan naminn 😡😂 /silent`,
    `@${fullName} — Hindi kami interesado sa kung ano kaa 😡😂 /silent`,
    `@${fullName} — Huwagg kang magsalita kung hindi ka siguradoo 😡😂 /silent`,
    `@${fullName} — Nakakabwisit ang pagiging makulit moo 😡😂 /silent`,
    `@${fullName} — Hindi mo kami mababagoo, itigil mo na 😡😂 /silent`,
    `@${fullName} — Ano bang gusto mong mangyari? Umalis ka naa 😡😂 /silent`,
    `@${fullName} — Huwagg kang umasta na parang sa iyo 'too 😡😂 /silent`,
    `@${fullName} — Wala kang panalo dittoo, tanggapin mo na lang 😡😂 /silent`,
    `@${fullName} — Ang ingay moo, manahimik ka na 😡😂 /silent`,
    `@${fullName} — Hindi mo ba naiintindihan ang simpleng pakiusapp? 😡😂 /silent`,
    `@${fullName} — Lumayo ka sa grupong itoo, salamat 😡😂 /silent`
  ];
  const list = isPM ? pmReplies : gcReplies;
  return list[Math.floor(Math.random() * list.length)];
}

module.exports.config = {
  name: "ryuk",
  version: "7.9.3 FAST",
  hasPermission: 1,
  credits: "RYUK",
  description: "Main Bot — Mention + Silent + FAST",
  usePrefix: true,
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData, isGroup, body } = event;
    if (!threadID || !senderID) return;
    const data = loadSystemData();
    const botID = String(api.getCurrentUserID());
    const isPM = !isGroup;
    const sender = String(senderID).trim();
    const msg = String(body || "").trim().toLowerCase();
    if (!data.active) return;

    if (!isPM) {
      if (logMessageType === "log:user-nickname") {
        const uid = String(logMessageData.participant_id).trim();
        const curr = String(logMessageData.nickname || "").trim();
        if (curr !== targetNickname && uid !== botID) {
          setTimeout(() => {
            api.changeNickname(targetNickname, threadID, uid, () => {});
          }, AUTO_RESTORE_DELAY);
        }
        return;
      }
      if (logMessageType === "log:thread-name") {
        const currName = String(logMessageData.name || "").trim();
        if (currName !== targetGCName) {
          setTimeout(() => {
            api.setTitle(targetGCName, threadID, () => {});
          }, AUTO_RESTORE_DELAY);
        }
        return;
      }
    }

    if (!isPM && !isAdmin(sender)) {
      if (msg === "ryuk" || msg.startsWith("/ryuk")) {
        if (data.autoReact) {
          setTimeout(() => {
            try { api.setMessageReaction("🐕‍🦺", messageID, () => {}, true); } catch {}
          }, 800); // MAS MABILIS ✅
        }
        return;
      }
      if (data.autoReact && rememberMessage(messageID)) {
        setTimeout(() => {
          try { api.setMessageReaction(getRandomAutoReactEmoji(), messageID, () => {}, true); } catch {}
        }, 800); // MAS MABILIS ✅
      }
      return;
    }

    if (sender === botID) return;
    const targetIDClean = String(TARGET_USER_ID).trim();
    if (targetIDClean && sender !== targetIDClean && !isAdmin(sender)) return;
    if (!rememberMessage(messageID)) return;
    if (data.silentMode) return;

    const cooldownKey = `${threadID}:${sender}`;
    const now = Date.now();
    const last = USER_COOLDOWN.get(cooldownKey) || 0;
    if (now - last < COOLDOWN) return;
    USER_COOLDOWN.set(cooldownKey, now);

    let fullName = "Kaibigan";
    try {
      const info = await api.getUserInfo(senderID);
      if (info && info[senderID]) fullName = info[senderID].name || "Kaibigan";
    } catch {}

    setTimeout(() => {
      const latest = loadSystemData();
      if (!latest.active || latest.silentMode) return;
      const replyText = getReplyText(fullName, isPM);
      
      if (isPM) {
        api.sendMessage(replyText, threadID, (err, info) => {
          if (!err && latest.selfReact && info) {
            setTimeout(() => {
              try { api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true); } catch {}
            }, getRandomDelay(1000, 2000)); // MAS MABILIS ✅
          }
        });
      } else {
        api.sendMessage(
          { 
            body: replyText, 
            mentions: [{ tag: `@${fullName}`, id: senderID }]
          }, 
          threadID, 
          (err, info) => {
            if (!err && latest.selfReact && info) {
              setTimeout(() => {
                try { api.setMessageReaction(getRandomEmoji(), info.messageID, () => {}, true); } catch {}
              }, getRandomDelay(1000, 2000)); // MAS MABILIS ✅
            }
          }
        );
      }
    }, getRandomDelay(REPLY_DELAY_MIN, REPLY_DELAY_MAX));

  } catch {}
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID, isGroup } = event;
  const action = (args[0] || "help").toLowerCase();
  const data = loadSystemData();
  const isPM = !isGroup;
  const sender = String(senderID).trim();

  if (isGroup && !isAdmin(sender)) {
    setTimeout(() => { try { api.setMessageReaction("🤢", messageID, () => {}, true); } catch {} }, 800); // MAS MABILIS ✅
    return;
  }

  if (action === "help") {
    return send(api,
`📋 LAHAT NG UTOS:

/ryuk help
/ryuk status
/ryuk on
/ryuk off
/ryuk silent
/ryuk unsilent
/ryuk target [ID]
/ryuk target off
/ryuk setgname [pangalan]
/ryuk setnick [pangalan]
/ryuk selfreacton
/ryuk selfreactoff
/ryuk reacton
/ryuk reactoff`, threadID, messageID);
  }

  if (action === "status") {
    return send(api,
`👑 RYUK STATUS

✅ AKTIBO:          ${data.active ? "OO" : "HINDI"}
🔇 SILENT MODE:    ${data.silentMode ? "OO — HINDI MAGRE-REPLY" : "HINDI"}
🎯 TARGET:          ${TARGET_USER_ID || "WALA"}
💬 SELF-REACT:      ${data.selfReact ? "OO" : "HINDI"}
🔥 AUTO-REACT:      ${data.autoReact ? "OO" : "HINDI"}
👑 GC NAME:        ${targetGCName}
👤 NICKNAME:       ${targetNickname}`, threadID, messageID);
  }

  if (action === "on") {
    data.active = true;
    saveSystemData(data);
    return send(api, "✅ RYUK NAKABUHAY", threadID, messageID);
  }

  if (action === "off") {
    data.active = false;
    saveSystemData(data);
    return send(api, "❌ RYUK NAKAPATAY", threadID, messageID);
  }

  if (action === "silent") {
    data.silentMode = true;
    saveSystemData(data);
    return send(api, "@silent 🔇 Silent mode activated", threadID, messageID);
  }

  if (action === "unsilent") {
    data.silentMode = false;
    saveSystemData(data);
    return send(api, "@silent 🔊 Silent mode deactivated", threadID, messageID);
  }

  if (action === "target") {
    const target = args.slice(1).join(" ").trim();
    if (!target) return send(api, `🎯 KASALUKUYANG TARGET:\n${TARGET_USER_ID || "WALA"}`, threadID, messageID);
    if (target === "off") {
      TARGET_USER_ID = "";
      saveSystemData(data);
      return send(api, "✅ TARGET TINANGGAL", threadID, messageID);
    }
    if (!/^\d+$/.test(target)) return send(api, "❌ MALI ANG ID — NUMERO LANG", threadID, messageID);
    TARGET_USER_ID = target;
    saveSystemData(data);
    return send(api, `✅ TARGET NAKA-SET:\n${TARGET_USER_ID}`, threadID, messageID);
  }

  if (action === "setgname") {
    if (isPM) return send(api, "❌ SA GC LANG PWEDI", threadID, messageID);
    const newName = args.slice(1).join(" ").trim();
    if (!newName) return send(api, `📋 KASALUKUYANG GC NAME:\n${targetGCName}`, threadID, messageID);
    if (newName.length > 30) return send(api, "❌ 30 LETRA LANG ANG PWEDI", threadID, messageID);
    targetGCName = newName;
    saveSystemData(data);
    api.setTitle(targetGCName, threadID, () => {});
    return send(api, `✅ GC NAME:\n${targetGCName}`, threadID, messageID);
  }

  if (action === "setnick") {
    if (isPM) return send(api, "❌ SA GC LANG PWEDI", threadID, messageID);
    const newName = args.slice(1).join(" ").trim();
    if (!newName) return send(api, `📋 KASALUKUYANG NICKNAME:\n${targetNickname}`, threadID, messageID);
    if (newName.length > 25) return send(api, "❌ 25 LETRA LANG ANG PWEDI", threadID, messageID);
    targetNickname = newName;
    saveSystemData(data);
    return send(api, `✅ NICKNAME:\n${targetNickname}`, threadID, messageID);
  }

  if (action === "selfreacton") {
    data.selfReact = true;
    saveSystemData(data);
    return send(api, "✅ SELF-REACT ON", threadID, messageID);
  }

  if (action === "selfreactoff") {
    data.selfReact = false;
    saveSystemData(data);
    return send(api, "❌ SELF-REACT OFF", threadID, messageID);
  }

  if (action === "reacton") {
    data.autoReact = true;
    saveSystemData(data);
    return send(api, "✅ AUTO-REACT ON", threadID, messageID);
  }

  if (action === "reactoff") {
    data.autoReact = false;
    saveSystemData(data);
    return send(api, "❌ AUTO-REACT OFF", threadID, messageID);
  }

  return send(api, "❌ HINDI KILALANG UTOS", threadID, messageID);
};
  
