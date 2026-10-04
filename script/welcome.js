const fs = require("fs");
const path = require("path");

// ==========================================
// 👑 RYUK WELCOME — COMMAND VERSION V2.1 ✅
// ✅ NASA COMMAND NA — HINDI SA EVENT
// ✅ HAMBOG + NAKAKATAWA 😡😂
// ✅ HINDI MA-DETECT | HINDI AUTO-LOGOUT
// ✅ LAGING GUMAGANA SA BAGONG MIYEMBRO
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================

const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
];

// 🔒 MAKUNAT SETTINGS — HUWAG BABAGUHIN!
const DELAY_MIN = 6000;   // 6s — ligtas na minimum
const DELAY_MAX = 12000;  // 12s — hindi parehas palagi
const COOLDOWN = 10;       // 10s — pahinga

// ✅ NAKAKATAWA + HAMBOG WELCOME MESSAGES 😡😂
const WELCOME_MESSAGES = [
  "@%s — O, dumating na yung bagong sali! Mag-ingat ka dito, nandito si RYUK 😡😂",
  "@%s — Tignan natin kung hanggang kailan ka dito tatagal 😡😂",
  "@%s — Hindi lahat nakakatagal dito... sana ikaw magkaiba 😡😂",
  "@%s — Salamat sa pagsali! Wag kang mag-alala, hindi masama ang tingin ko sayo... ngayon 😡😂",
  "@%s — Bagong mukha! Sana hindi ka katulad ng nauna na umalis 😡😂",
  "@%s — Nandito ka na! Tandaan mo — RYUK ang namumuno dito 😡😂",
  "@%s — Akala mo ba madali dito? Subukan mo lang 😡😂",
  "@%s — Sali ka nang sali, kaya mo ba talaga? 😡😂",
  "@%s — Tignan mo sarili mo... tapos kami... alam mo na ang pagkakaiba 😡😂",
  "@%s — Salamat sa pagsali! Sana hindi ka magsisi 😡😂",
  "@%s — Dito walang pwesto para sa mahina... kaya mo ba? 😡😂",
  "@%s — Bagong miyembro! Handa ka na bang makita kung sino talaga ang nasa taas? 😡😂",
  "@%s — Nandito ka na... huwag kang magtataka kung bakit iba ang lahat 😡😂",
  "@%s — Inggit ka lang aminin mo na, wala kang magagawa 😡😂",
  "@%s — Sali ka dito pero alam mo ba kung sino ang tunay na hari dito? 😡😂",
  "@%s — Salamat sa pagsali! Sana hindi ka maging pabigat 😡😂",
  "@%s — Tignan mo sila... lahat sila tumitingin sa akin 😡😂",
  "@%s — Ikaw ang bagong dating? Sige, subukan natin 😡😂",
  "@%s — Hindi ka pinili nang walang dahilan... sana hindi ka bumigo 😡😂",
  "@%s — Dito hindi puro salita... gawa ang kailangan 😡😂",
  "@%s — Bagong mukha! Sana kaya mong makasabay sa amin 😡😂",
  "@%s — Akala mo ba makakalimot sila sayo? Hindi kung magpapakita ka 😡😂",
  "@%s — Salamat sa pagsali! Tandaan mo — mas mataas ang pamantayan dito 😡😂",
  "@%s — Hindi lahat nakakaabot dito... swerte mo kung mananatili ka 😡😂",
  "@%s — Nandito ka na... huwag kang magtaka kung bakit tahimik sila 😡😂",
  "@%s — Sali ka dito pero huwag kang umasa na pantay tayo 😡😂",
  "@%s — Bagong dating! Sana hindi ka maging katulad ng iba na umalis 😡😂",
  "@%s — Salamat sa pagsali! Dito kami hindi nagpapababa 😡😂",
  "@%s — Tignan mo ako... yan ang pamantayan 😡😂",
  "@%s — Hindi ka makakahanap ng katulad ko kahit saan 😡😂",
  "@%s — Bagong miyembro! Handa ka na bang makita ang tunay na lakas? 😡😂",
  "@%s — Salamat sa pagsali! Sana alam mo kung sino ang dapat sundin 😡😂",
  "@%s — Dito walang pwesto para sa mahina... kaya mo bang manatili? 😡😂",
  "@%s — Nandito ka na... huwag kang magtaka kung bakit ako iba 😡😂",
  "@%s — Sali ka dito pero huwag kang maglakas-loob 😡😂",
  "@%s — Bagong mukha! Sana hindi ka maging dahilan ng gulo 😡😂",
  "@%s — Salamat sa pagsali! Tandaan mo — hindi ako nakikipaglaro 😡😂",
  "@%s — Tignan mo sila... lahat sila nakatingin sa akin 😡😂",
  "@%s — Ikaw ang bagong sali? Sige, magpakita ka 😡😂",
  "@%s — Hindi lahat nakakatagal dito... ikaw ba? 😡😂",
  "@%s — Salamat sa pagsali! Sana hindi ka magsisi sa pagpasok 😡😂",
  "@%s — Dito ako ang sinusunod... hindi ikaw 😡😂",
  "@%s — Bagong miyembro! Sana alam mo kung sino ang tunay na nasa taas 😡😂",
  "@%s — Nandito ka na... huwag kang umasa na madali 😡😂",
  "@%s — Sali ka dito pero huwag kang maging pabigat 😡😂",
  "@%s — Bagong mukha! Sana kaya mong makasabay 😡😂",
  "@%s — Salamat sa pagsali! Tandaan mo — hindi ako nagpapababa 😡😂",
  "@%s — Tignan mo sarili mo... tapos ako... alam mo na 😡😂",
  "@%s — Hindi ka makakahanap ng katulad ko 😡😂",
  "@%s — Bagong dating! Sana hindi ka maging katulad ng iba 😡😂",
  "@%s — Salamat sa pagsali! Dito ako ang namumuno 😡😂",
  "@%s — Dito walang pwesto para sa mahina... kaya mo bang manatili? 😡😂",
  "@%s — Nandito ka na... huwag kang umasa na pantay tayo 😡😂",
  "@%s — Sali ka dito pero huwag kang maging pabigat 😡😂",
  "@%s — Bagong miyembro! Sana alam mo kung sino ang dapat sundin 😡😂",
  "@%s — Salamat sa pagsali! Sana hindi ka magsisi 😡😂",
  "@%s — Tignan mo ako... yan ang pamantayan 😡😂",
  "@%s — Hindi lahat nakakaabot dito... ikaw ba? 😡😂",
  "@%s — Bagong mukha! Handa ka na bang makita ang tunay na lakas? 😡😂",
  "@%s — Nandito ka na... huwag kang umasa na madali 😡😂",
  "@%s — Sali ka dito pero huwag kang maglakas-loob 😡😂",
  "@%s — Bagong dating! Sana kaya mong makasabay sa amin 😡😂",
  "@%s — Dito ako ang sinusunod... hindi ikaw 😡😂",
  "@%s — Tignan mo sila... lahat sila nakatingin sa akin 😡😂",
  "@%s — Ikaw ang bagong sali? Sige, subukan natin 😡😂",
  "@%s — Hindi lahat nakakatagal dito... ikaw ba? 😡😂",
  "@%s — Salamat sa pagsali! Sana hindi ka magsisi sa pagpasok 😡😂",
  "@%s — Bagong miyembro! Sana alam mo kung sino ang tunay na nasa taas 😡😂",
  "@%s — Nandito ka na... huwag kang magtaka kung bakit ako iba 😡😂",
  "@%s — Sali ka dito pero huwag kang maglakas-loob 😡😂",
  "@%s — Bagong mukha! Sana hindi ka maging dahilan ng gulo 😡😂",
  "@%s — Salamat sa pagsali! Dito kami hindi nagpapababa 😡😂",
  "@%s — Tignan mo sarili mo... tapos ako... alam mo na ang pagkakaiba 😡😂",
  "@%s — Hindi ka makakahanap ng katulad ko kahit saan 😡😂",
  "@%s — Bagong dating! Sana hindi ka maging katulad ng iba na umalis 😡😂",
  "@%s — Dito walang pwesto para sa mahina... kaya mo bang manatili? 😡😂",
  "@%s — Nandito ka na... huwag kang umasa na pantay tayo 😡😂",
  "@%s — Sali ka dito pero huwag kang maging pabigat 😡😂",
  "@%s — Bagong miyembro! Sana kaya mong makasabay 😡😂",
  "@%s — Salamat sa pagsali! Tandaan mo — hindi ako nakikipaglaro 😡😂",
  "@%s — Tignan mo ako... yan ang pamantayan 😡😂",
  "@%s — Hindi lahat nakakaabot dito... ikaw ba? 😡😂",
  "@%s — Bagong mukha! Handa ka na bang makita ang tunay na lakas? 😡😂",
  "@%s — Nandito ka na... huwag kang umasa na madali 😡😂",
  "@%s — Sali ka dito pero huwag kang maglakas-loob 😡😂",
  "@%s — Bagong dating! Sana alam mo kung sino ang dapat sundin 😡😂",
  "@%s — Salamat sa pagsali! Sana hindi ka magsisi 😡😂",
  "@%s — Dito ako ang namumuno 😡😂",
  "@%s — Hindi ako nagpapababa 😡😂",
  "@%s — Ikaw ang bagong sali? Sige, magpakita ka 😡😂",
  "@%s — Tandaan mo — mas mataas ang pamantayan dito 😡😂",
  "@%s — Hindi ako nakikipaglaro 😡😂",
  "@%s — Bagong miyembro! Sana hindi ka maging katulad ng iba 😡😂",
  "@%s — Nandito ka na... huwag kang umasa na madali 😡😂",
  "@%s — Sali ka dito pero huwag kang maging pabigat 😡😂",
  "@%s — Tignan mo sila... lahat sila nakatingin sa akin 😡😂",
  "@%s — Salamat sa pagsali! Sana kaya mong makasabay sa amin 😡😂",
  "@%s — Dito walang pwesto para sa mahina... kaya mo bang manatili? 😡😂",
  "@%s — Hindi lahat nakakatagal dito... ikaw ba? 😡😂",
  "@%s — Bagong mukha! Sana alam mo kung sino ang dapat sundin 😡😂",
  "@%s — Nandito ka na... huwag kang umasa na madali 😡😂",
  "@%s — Sali ka dito pero huwag kang maging pabigat 😡😂",
  "@%s — Tignan mo sarili mo... tapos ako... alam mo na 😡😂",
  "@%s — Hindi lahat nakakaabot dito... ikaw ba? 😡😂",
  "@%s — Bagong dating! Sana alam mo kung sino ang tunay na nasa taas 😡😂",
  "@%s — Dito ako ang sinusunod... hindi ikaw 😡😂",
  "@%s — Nandito ka na... huwag kang umasa na pantay tayo 😡😂",
  "@%s — Sali ka dito pero huwag kang maglakas-loob 😡😂",
  "@%s — Bagong miyembro! Handa ka na bang makita ang tunay na lakas? 😡😂",
  "@%s — Salamat sa pagsali! Sana hindi ka magsisi sa pagpasok 😡😂",
  "@%s — Tignan mo ako... yan ang pamantayan 😡😂",
  "@%s — Hindi ka makakahanap ng katulad ko kahit saan 😡😂",
  "@%s — Bagong mukha! Sana kaya mong makasabay 😡😂",
  "@%s — Dito kami hindi nagpapababa 😡😂",
  "@%s — Ikaw ang bagong sali? Sige, subukan natin 😡😂",
  "@%s — Tandaan mo — mas mataas ang pamantayan dito 😡😂",
  "@%s — Hindi ako nakikipaglaro 😡😂",
  "@%s — Bagong dating! Sana hindi ka maging katulad ng iba na umalis 😡😂",
  "@%s — Salamat sa pagsali! Dito ako ang namumuno 😡😂",
  "@%s — Dito walang pwesto para sa mahina... kaya mo bang manatili? 😡😂",
  "@%s — Hindi lahat nakakatagal dito... ikaw ba? 😡😂",
  "@%s — Bagong miyembro! Sana alam mo kung sino ang dapat sundin 😡😂",
  "@%s — Nandito ka na... huwag kang umasa na madali 😡😂",
  "@%s — Sali ka dito pero huwag kang maging pabigat 😡😂",
  "@%s — Tignan mo sila... lahat sila nakatingin sa akin 😡😂",
  "@%s — Salamat sa pagsali! Sana hindi ka magsisi 😡😂",
  "@%s — Tignan mo sarili mo... tapos ako... alam mo na ang pagkakaiba 😡😂",
  "@%s — Hindi ka makakahanap ng katulad ko 😡😂",
  "@%s — Bagong mukha! Handa ka na bang makita ang tunay na lakas? 😡😂",
  "@%s — Dito ako ang sinusunod... hindi ikaw 😡😂",
  "@%s — Nandito ka na... huwag kang umasa na pantay tayo 😡😂",
  "@%s — Sali ka dito pero huwag kang maglakas-loob 😡😂",
  "@%s — Bagong dating! Sana kaya mong makasabay sa amin 😡😂",
  "@%s — Salamat sa pagsali! Tandaan mo — hindi ako nagpapababa 😡😂",
  "@%s — Dito walang pwesto para sa mahina... kaya mo bang manatili? 😡😂",
  "@%s — Hindi lahat nakakaabot dito... ikaw ba? 😡😂",
  "@%s — Bagong miyembro! Sana hindi ka maging dahilan ng gulo 😡😂",
  "@%s — Nandito ka na... huwag kang magtaka kung bakit ako iba 😡😂",
  "@%s — Sali ka dito pero huwag kang maging pabigat 😡😂",
  "@%s — Tignan mo ako... yan ang pamantayan 😡😂",
  "@%s — Ikaw ang bagong sali? Sige, magpakita ka 😡😂",
  "@%s — Tandaan mo — mas mataas ang pamantayan dito 😡😂",
  "@%s — Hindi lahat nakakaabot dito... ikaw ba? 😡😂",
  "@%s — Bagong dating! Sana hindi ka maging katulad ng iba na umalis 😡😂",
  "@%s — Salamat sa pagsali! Sana hindi ka magsisi 😡😂",
  "@%s — Tignan mo sila... lahat sila nakatingin sa akin 😡😂",
  "@%s — Dito ako ang namumuno 😡😂",
  "@%s — Hindi ako nagpapababa 😡😂",
  "@%s — Bagong miyembro! Sana kaya mong makasabay sa amin 😡😂",
  "@%s — Dito walang pwesto para sa mahina... kaya mo bang manatili? 😡😂",
  "@%s — Hindi ka makakahanap ng katulad ko kahit saan 😡😂",
  "@%s — Bagong mukha! Sana alam mo kung sino ang dapat sundin 😡😂",
  "@%s — Nandito ka na... huwag kang umasa na madali 😡😂",
  "@%s — Sali ka dito pero huwag kang maglakas-loob 😡😂"
];

const DATA_FILE = path.join(__dirname, "wc_data.json");
const DEFAULT_DATA = {
  activeGCs: {}
};

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
  version: "2.1.0",
  hasPermission: 1,
  credits: "RYUK WELCOME — COMMAND VERSION",
  description: "✅ Hamboog welcome sa bagong miyembro | wc on/off",
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: COOLDOWN
};

// ✅ HANDLE EVENT — PARA SA BAGONG MIYEMBRO
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData } = event;
    if (!threadID) return;

    const tid = String(threadID);
    const botID = String(api.getCurrentUserID());
    const data = loadData();

    // ✅ BAGONG MIYEMBRO — GUMAGANA KAHIT WALANG COMMAND
    if (logMessageType === "log:subscribe" && logMessageData && logMessageData.addedParticipants) {
      if (!data.activeGCs[tid]) return; // Kung naka-off, wag mag-welcome

      const newUsers = logMessageData.addedParticipants;
      
      for (const user of newUsers) {
        const uid = String(user.userFbId);
        
        // Wag batiin sarili
        if (uid === botID) continue;
        
        // Wag batiin nang paulit-ulit
        const key = `${tid}:${uid}`;
        if (WELCOMED_USERS.has(key)) continue;
        WELCOMED_USERS.add(key);
        
        // Tanggalin sa listahan pagkalipas ng 1 oras
        setTimeout(() => WELCOMED_USERS.delete(key), 3600000);

        // Kunin pangalan
        const userName = user.fullName || "Bagong Miyembro";
        
        // ✅ I-DELAY — HINDI AGAD = HINDI MA-DETECT!
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

// ✅ HANDLE COMMAND — wc on / wc off
module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, senderID } = event;
    const tid = String(threadID);
    const sender = String(senderID).trim();
    const data = loadData();

    if (!isAdmin(sender)) {
      return api.sendMessage("❌ Ikaw hindi pwede gamitin ito!", tid);
    }

    const action = (args[0] || "").toLowerCase();

    if (action === "on") {
      data.activeGCs[tid] = true;
      saveData(data);
      return api.sendMessage("✅ Welcome ACTIVE — HAMBOG MODE ON 😡😂", tid);
    }

    if (action === "off") {
      data.activeGCs[tid] = false;
      saveData(data);
      return api.sendMessage("✅ Welcome OFF — Tahimik na 😡😂", tid);
    }

    // Walang action — ipakita ang status
    const status = data.activeGCs[tid] ? "✅ ACTIVE" : "❌ OFF";
    return api.sendMessage(`👑 RYUK WELCOME\nStatus: ${status}\nGamitin: wc on | wc off`, tid);

  } catch (err) {
    console.error("[wc Command] Error:", err);
  }
};
