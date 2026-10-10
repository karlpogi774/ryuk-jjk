const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

function isAdmin(id) {
  return ADMIN_IDS.includes(String(id).trim());
}

module.exports.config = {
  name: "count",
  aliases: ["win", "dura"],
  version: "3.3.0",
  credits: "RYUK",
  description: "Lose message → 1 to 20 → win message",
  usePrefix: true,
  commandCategory: "Fun",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions } = event;

  const targetID = Object.keys(mentions)[0];
  const winner = args.filter(w => !w.startsWith("@")).join(" ");

  if (!targetID || !winner) {
    return api.sendMessage("⚠️ Format: /count @[tao] [pangalan ng panalo]", threadID, messageID);
  }

  const targetName = mentions[targetID] || "You";

  // STEP 1 — Lose Message
  api.sendMessage(`@${targetName}

Wala kang laban mula sa simula pa lang
Tanggapin mo na lang ang resulta`, threadID, (err, info) => {
    if (!err) api.setMessageReaction("🔥", info.messageID, () => {}, true);
  });

  await new Promise(r => setTimeout(r, 1200));

  // STEP 2 — Count 1 to 20
  for (let i = 1; i <= 20; i++) {
    await new Promise(r => setTimeout(r, 700));
    api.sendMessage(`${i}`, threadID, (err, info) => {
      if (!err) api.setMessageReaction("🔥", info.messageID, () => {}, true);
    });
  }

  await new Promise(r => setTimeout(r, 700));

  // STEP 3 — Win Message
  api.sendMessage(`${winner}`, threadID, (err, info) => {
    if (!err) api.setMessageReaction("🔥", info.messageID, () => {}, true);
  });
};
