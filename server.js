const express = require("express");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 10000;

// Render Health Check endpoint (Kailangan ito para pumasa sa Render check)
app.get("/", (req, res) => {
  res.status(200).send("Bot is active and running!");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Simulan ang Express server agad para ma-bind ang port sa Render
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Patakbuhin ang auto.js nang hiwalay ang proseso
function runBot() {
  const bot = spawn("node", ["auto.js"], {
    stdio: "inherit",
    shell: true
  });

  bot.on("close", (code) => {
    console.log(`Bot process exited with code ${code}. Restarting...`);
    setTimeout(runBot, 3000);
  });

  bot.on("error", (err) => {
    console.error("Bot process error:", err);
    setTimeout(runBot, 3000);
  });
}

runBot();
