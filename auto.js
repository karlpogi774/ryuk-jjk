const login = require("fca-unofficial");
const fs = require("fs");
const path = require("path");

const rainbowColors = ["\x1b[31m", "\x1b[33m", "\x1b[32m", "\x1b[36m", "\x1b[34m", "\x1b[35m"];
function rainbowText(text) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const color = rainbowColors[i % rainbowColors.length];
    result += color + text[i];
  }
  return result + "\x1b[0m";
}

const cookiePath = path.join(__dirname, "account.txt");
if (!fs.existsSync(cookiePath)) {
  console.error(rainbowText("[ ❌ ERROR ] account.txt file for cookie not found! — Powered by Kurapika"));
  process.exit(1);
}

let appState;
try {
  const cookieContent = fs.readFileSync(cookiePath, "utf8");
  appState = JSON.parse(cookieContent);
} catch (e) {
  console.error(rainbowText("[ ❌ ERROR ] Error parsing account.txt:"), e);
  process.exit(1);
}

const configPath = path.join(__dirname, "config.json");
let botConfig = { admin: [] };
if (fs.existsSync(configPath)) {
  try {
    botConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    console.error(rainbowText("[ ❌ ERROR ] Error parsing config.json:"), e);
  }
} else {
  console.warn(rainbowText("[ ⚠️ WARNING ] config.json not found. — Powered by Kurapika"));
}

login({ appState: appState }, (err, api) => {
  if (err) {
    console.error(rainbowText("[ ❌ LOGIN ERROR ]"), err);
    return;
  }

  console.log(rainbowText("┌─────────────────────────────────────────────────────────┐"));
  console.log(rainbowText("│          GOJO BOT ACTIVE — POWERED BY KURAPIKA          │"));
  console.log(rainbowText("└─────────────────────────────────────────────────────────┘"));
  console.log(rainbowText("✨ Status: Successfully logged in and running via auto.js!"));

  api.setOptions({
    listenEvents: true,
    selfListen: false,
    updatePresence: true,
    forceLogin: true
  });

  const scriptsDir = path.join(__dirname, "script");
  const commands = new Map();

  if (fs.existsSync(scriptsDir)) {
    const commandFiles = fs.readdirSync(scriptsDir).filter(file => file.endsWith(".js"));
    
    console.log(rainbowText("┌─────────────────────────────────────────────────────────┐"));
    console.log(rainbowText("│                    LOADED COMMANDS                      │"));
    console.log(rainbowText("├─────────────────────────────────────────────────────────┘"));

    for (const file of commandFiles) {
      const commandPath = path.join(scriptsDir, file);
      try {
        const commandModule = require(commandPath);
        if (commandModule.config && commandModule.config.name) {
          commands.set(commandModule.config.name, commandModule);
          console.log(rainbowText(`  ➜ Loaded: ${commandModule.config.name}.js`));
        }
      } catch (error) {
        console.error(rainbowText(`  ❌ Error loading ${file}:`), error);
      }
    }
    console.log(rainbowText("└─────────────────────────────────────────────────────────┘"));
  } else {
    console.warn(rainbowText("[ ⚠️ WARNING ] 'script/' folder not found. — Powered by Kurapika"));
  }

  api.listenMqtt(async (err, event) => {
    if (err) return console.error(rainbowText("[ ❌ MQTT ERROR ]"), err);

    try {
      if (event.type === "message" && event.body && event.body.startsWith("/")) {
        const args = event.body.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = commands.get(commandName);
        if (command) {
          await command.run({ api, event, args, botConfig });
        }
      }

      for (const [_, command] of commands) {
        if (typeof command.handleEvent === "function") {
          await command.handleEvent({ api, event, botConfig });
        }
      }

    } catch (error) {
      console.error(rainbowText("[ ❌ EXECUTION ERROR ]"), error);
    }
  });
});
