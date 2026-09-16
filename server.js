const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Health check and status endpoints para sa Render dashboard
app.get("/", (req, res) => {
  res.status(200).send({
    status: "online",
    bot: "Gojo Satoru Domain Bot",
    timestamp: new Date().toISOString(),
    message: "Domain Expansion: Infinite Void is active! 🌌♾️"
  });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Start Express Web Server
app.listen(PORT, () => {
  console.log(`🌐 Gojo Web Server is successfully listening on port ${PORT}`);
});

// Function para patakbuhin at i-manage ang auto.js nang tuloy-tuloy
let botProcess = null;

function startBot() {
  console.log("🚀 Initializing Gojo Bot process via auto.js...");
  
  botProcess = spawn("node", ["auto.js"], {
    stdio: "inherit",
    cwd: __dirname
  });

  botProcess.on("close", (code) => {
    console.log(`⚠️ Bot process exited with code ${code}. Restarting in 5 seconds...`);
    setTimeout(startBot, 5000);
  });

  botProcess.on("error", (err) => {
    console.error("❌ Failed to start bot process:", err);
    setTimeout(startBot, 5000);
  });
}

// I-trigger ang pag-start ng bot
startBot();

// Graceful shutdown handling
process.on("SIGINT", () => {
  if (botProcess) botProcess.kill();
  process.exit(0);
});
