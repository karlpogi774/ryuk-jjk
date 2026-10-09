module.exports.config = {
  name: "song",
  aliases: ["sing", "lyrics", "music"],
  version: "1.1.0",
  credits: "RYUK",
  description: "Request a song — lyrics + YouTube link included!",
  usePrefix: true,
  commandCategory: "Fun",
  cooldowns: 5
};

const SONGS = {
  "m3": {
    title: "M3",
    link: "https://youtu.be/dQw4w9WgXcQ",
    lyrics: [
      "🎵 M3 🎵",
      "♪ La la la, melody in the air ♪",
      "♪ Dancing like nobody's there ♪",
      "♪ M3, the rhythm is right ♪",
      "♪ Shining like stars in the night ♪",
      "🎧 Listen full song here: https://youtu.be/dQw4w9WgXcQ"
    ]
  },
  "happy": {
    title: "Happy — Pharrell Williams",
    link: "https://youtu.be/ZbZSe6N_BXs",
    lyrics: [
      "🎵 HAPPY 🎵",
      "♪ It might seem crazy what I'm about to say ♪",
      "♪ Sunshine, she's here, you can take a break ♪",
      "♪ I'm a hot air balloon that could go to space ♪",
      "♪ With the air, like I don't care, baby, by the way ♪",
      "♪ Because I'm happy ♪",
      "🎧 Listen full song here: https://youtu.be/ZbZSe6N_BXs"
    ]
  },
  "believer": {
    title: "Believer — Imagine Dragons",
    link: "https://youtu.be/7wtfhZwyrcc",
    lyrics: [
      "🎵 BELIEVER 🎵",
      "♪ First things first ♪",
      "♪ I'ma say all the words inside my head ♪",
      "♪ I'm fired up and tired of the way that things have been ♪",
      "♪ Oh-oh, I'm a believer ♪",
      "🎧 Listen full song here: https://youtu.be/7wtfhZwyrcc"
    ]
  },
  "faded": {
    title: "Faded — Alan Walker",
    link: "https://youtu.be/60ItHLz5WEA",
    lyrics: [
      "🎵 FADED 🎵",
      "♪ You were the shadow to my light ♪",
      "♪ Did you feel us? ♪",
      "♪ Another star, you fade away ♪",
      "♪ Afraid our aim is out of sight ♪",
      "♪ Wanna see us, alight ♪",
      "🎧 Listen full song here: https://youtu.be/60ItHLz5WEA"
    ]
  },
  "alone": {
    title: "Alone — Alan Walker",
    link: "https://youtu.be/1-xGerv5FOk",
    lyrics: [
      "🎵 ALONE 🎵",
      "♪ Lost in your mind ♪",
      "♪ I wanna know ♪",
      "♪ Was it all in my fantasy? ♪",
      "♪ Where are you now? ♪",
      "♪ Was it only imagination? ♪",
      "♪ I know I'm not alone ♪",
      "🎧 Listen full song here: https://youtu.be/1-xGerv5FOk"
    ]
  },
  "sunflower": {
    title: "Sunflower — Post Malone & Swae Lee",
    link: "https://youtu.be/ApXoW16zSf0",
    lyrics: [
      "🎵 SUNFLOWER 🎵",
      "♪ Needless to say, I keep in touch ♪",
      "♪ You're the only one that I want ♪",
      "♪ You're the sunflower ♪",
      "♪ Yeah, you're the sunflower ♪",
      "♪ No matter where I go, I'll always remember ♪",
      "🎧 Listen full song here: https://youtu.be/ApXoW16zSf0"
    ]
  },
  "perfect": {
    title: "Perfect — Ed Sheeran",
    link: "https://youtu.be/2Vv-BfVoq4g",
    lyrics: [
      "🎵 PERFECT 🎵",
      "♪ I found a love for me ♪",
      "♪ Darling, just dive right in and follow my lead ♪",
      "♪ Well, I found a girl, beautiful and sweet ♪",
      "♪ I never knew you were the someone waiting for me ♪",
      "🎧 Listen full song here: https://youtu.be/2Vv-BfVoq4g"
    ]
  },
  "shapeofyou": {
    title: "Shape of You — Ed Sheeran",
    link: "https://youtu.be/JGwWNGJdvx8",
    lyrics: [
      "🎵 SHAPE OF YOU 🎵",
      "♪ I'm in love with the shape of you ♪",
      "♪ We push and pull like a magnet do ♪",
      "♪ Although my heart is falling too ♪",
      "♪ I'm in love with your body ♪",
      "🎧 Listen full song here: https://youtu.be/JGwWNGJdvx8"
    ]
  },
  "stay": {
    title: "Stay — The Kid LAROI & Justin Bieber",
    link: "https://youtu.be/kTJczUoc26U",
    lyrics: [
      "🎵 STAY 🎵",
      "♪ I do the same thing, told you that I never would ♪",
      "♪ I told you I'd change, even when I knew I never could ♪",
      "♪ I know that I can't find nobody else as good as you ♪",
      "♪ I need you to stay, need you to stay, hey ♪",
      "🎧 Listen full song here: https://youtu.be/kTJczUoc26U"
    ]
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const request = args.join(" ").toLowerCase();

  if (!request) {
    return api.sendMessage(
`🎵 SONG REQUEST 🎵

Available songs:
• /song m3
• /song happy
• /song believer
• /song faded
• /song alone
• /song sunflower
• /song perfect
• /song shapeofyou
• /song stay

Usage: /song [song name]
Example: /song sunflower`, threadID, messageID);
  }

  const song = SONGS[request];
  
  if (!song) {
    return api.sendMessage(
`❌ Song not found!
Type /song to see the list 🎵`, threadID, messageID);
  }

  api.sendMessage(`🎵 NOW PLAYING: ${song.title}\n⏳ Loading...`, threadID);

  for (let i = 0; i < song.lyrics.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 1300));
    api.sendMessage(song.lyrics[i], threadID);
  }
};
      
