const login = require("fca-unofficial"); // Palitan mo ng exact FCA library mo kung iba ang gamit mo
const fs = require("fs");
const path = require("path");

// 1. Suriin kung may appstate.json bago mag-login
if (!fs.existsSync("appstate.json")) {
  console.error("Error: Walang makitang appstate.json file! I-check ang Environment Variables sa Render.");
  process.exit(1);
}

let appState;
try {
  appState = JSON.parse(fs.readFileSync("appstate.json", "utf8"));
} catch (e) {
  console.error("Error parsing appstate.json:", e);
  process.exit(1);
}

// 2. Simulan ang pag-login ng Bot
login({ appState: appState }, (err, api) => {
  if (err) {
    console.error("Login Error:", err);
    return;
  }

  console.log("Gojo is successfully logged in and running via auto.js!");

  // Itakda ang Options ng API
  api.setOptions({
    listenEvents: true,
    selfListen: false,
    updatePresence: true,
    forceLogin: true
  });

  // 3. I-load ang command file (Siguraduhing 'activate.js' ang pangalan ng file mo)
  const commandPath = path.join(__dirname, "activate.js"); 
  let commandModule = null;
  
  if (fs.existsSync(commandPath)) {
    commandModule = require(commandPath);
    console.log("Command module loaded successfully into auto.js.");
  } else {
    console.warn("Warning: Walang nahanap na command file sa path na '", commandPath, "'");
  }

  // 4. Listener loop para sa mga mensahe at events sa Messenger
  api.listenMqtt(async (err, event) => {
    if (err) return console.error("MQTT Error:", err);

    try {
      if (!commandModule) return;

      // Kapag nag-type ang user ng command (hal. /activate on)
      if (event.type === "message" && event.body && event.body.startsWith("/")) {
        const args = event.body.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (commandModule.config && commandModule.config.name === commandName) {
          await commandModule.run({ api, event, args });
        }
      }

      // Kapag nagpapadala ng regular na mensahe, sticker, o emoji (para sa handleEvent)
      if (typeof commandModule.handleEvent === "function") {
        await commandModule.handleEvent({ api, event });
      }

    } catch (error) {
      console.error("Execution Error in event listener:", error);
    }
  });
});
