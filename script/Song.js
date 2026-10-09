module.exports.config = {
  name: "song",
  aliases: ["sing", "lyrics", "music"],
  version: "1.0.0",
  credits: "RYUK",
  description: "Request a song — bot will sing for you!",
  usePrefix: true,
  commandCategory: "Fun",
  cooldowns: 5
};

const SONGS = {
  "m3": {
    title: "M3 — Unknown Song",
    lyrics: [
      "🎵 *Music starts playing* 🎵",
      "♪ La la la, melody in the air ♪",
      "♪ Dancing like nobody's there ♪",
      "♪ M3, the rhythm is right ♪",
      "♪ Shining like stars in the night ♪",
      "🎶 *Thank you for listening!* 🎶"
    ]
  },
  "happy": {
    title: "Happy — Pharrell Williams",
    lyrics: [
      "🎵 HAPPY 🎵",
      "♪ It might seem crazy what I'm about to say ♪",
      "♪ Sunshine, she's here, you can take a break ♪",
      "♪ I'm a hot air balloon that could go to space ♪",
      "♪ With the air, like I don't care, baby, by the way ♪",
      "♪ Because I'm happy ♪",
      "♪ Clap along if you feel like a room without a roof ♪",
      "🎶 *Keep being HAPPY!* 🎶"
    ]
  },
  "believer": {
    title: "Believer — Imagine Dragons",
    lyrics: [
      "🎵 BELIEVER 🎵",
      "♪ First things first ♪",
      "♪ I'ma say all the words inside my head ♪",
      "♪ I'm fired up and tired of the way that things have been ♪",
      "♪ The way that things have been ♪",
      "♪ Oh-oh, I'm a believer ♪",
      "🎶 *Don't give up!* 🎶"
    ]
  },
  "faded": {
    title: "Faded — Alan Walker",
    lyrics: [
      "🎵 FADED 🎵",
      "♪ You were the shadow to my light ♪",
      "♪ Did you feel us? ♪",
      "♪ Another star, you fade away ♪",
      "♪ Afraid our aim is out of sight ♪",
      "♪ Wanna see us, alight ♪",
      "🎶 *Where are you now?* 🎶"
    ]
  },
  "alone": {
    title: "Alone — Alan Walker",
    lyrics: [
      "🎵 ALONE 🎵",
      "♪ Lost in your mind ♪",
      "♪ I wanna know ♪",
      "♪ Was it all in my fantasy? ♪",
      "♪ Where are you now? ♪",
      "♪ Was it only imagination? ♪",
      "♪ I know I'm not alone ♪",
      "🎶 *You're never truly alone ❤️* 🎶"
    ]
  },
  "sunflower": {
    title: "Sunflower — Post Malone",
    lyrics: [
      "🎵 SUNFLOWER 🎵",
      "♪ Needless to say, I keep in touch ♪",
      "♪ You're the only one that I want ♪",
      "♪ You're the sunflower ♪",
      "♪ Yeah, you're the sunflower ♪",
      "♪ No matter where I go, I'll always remember ♪",
      "🎶 *You are my sunshine! 🌻* 🎶"
    ]
  }
};

// Add more songs easily!
const RANDOM_SONGS = [
  { title: "🎵 Melody", lyrics: ["♪ Dum dum dum... ♪", "♪ Music in my heart ♪", "♪ Always with you ♪", "🎶 *~ The End ~* 🎶"] },
  { title: "🎵 Dream", lyrics: ["♪ Close your eyes ♪", "♪ Make a wish ♪", "♪ Tomorrow is a new day ♪", "🎶 *Sweet dreams!* 🎶"] }
];

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const request = args.join(" ").toLowerCase();

  if (!request) {
    return api.sendMessage(
`🎵 SONG REQUEST 🎵

Available songs:
• /song m3 — Your special request!
• /song happy — Happy vibes!
• /song believer — Strong & powerful
• /song faded — Alan Walker classic
• /song alone — Never alone
• /song sunflower — Sweet & warm

Usage: /song [song name]
Example: /song m3`, threadID, messageID);
  }

  let song = SONGS[request];
  
  // If not found, pick a random one
  if (!song) {
    const randomIndex = Math.floor(Math.random() * RANDOM_SONGS.length);
    song = RANDOM_SONGS[randomIndex];
  }

  // Send song title
  api.sendMessage(`🎵 NOW PLAYING: ${song.title}\n⏳ Loading...`, threadID);

  // Send lyrics line by line with delay
  for (let i = 0; i < song.lyrics.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    api.sendMessage(song.lyrics[i], threadID);
  }
};
         
