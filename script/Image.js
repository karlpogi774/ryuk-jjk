module.exports.config = {
  name: "image",
  aliases: ["img", "photo"],
  version: "1.0.0",
  credits: "RYUK",
  description: "Send a random image",
  usePrefix: true,
  commandCategory: "Fun",
  cooldowns: 5
};

const PICS = [
  "https://picsum.photos/seed/cat/600/400.jpg",
  "https://picsum.photos/seed/nature/600/400.jpg",
  "https://picsum.photos/seed/sunset/600/400.jpg",
  "https://picsum.photos/seed/flower/600/400.jpg",
  "https://picsum.photos/seed/mountain/600/400.jpg"
];

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const randomPic = PICS[Math.floor(Math.random() * PICS.length)];
  
  api.sendMessage(`🖼️ Here's your picture! ✅`, threadID);
  api.sendMessage({
    attachment: randomPic
  }, threadID, messageID);
};

