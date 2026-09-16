const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Simple web route para maging active ang Render web service
app.get("/", (req, res) => {
  res.send("Gojo Satoru Domain Bot is running and active! 🌌♾️");
});

app.listen(PORT, () => {
  console.log(`🌐 Gojo Web Server is listening on port ${PORT}`);
});

// Function para patakbuhin ang auto.js nang tuloy-tuloy
function startBot() {
  console.log("🚀 Starting Gojo Bot via auto.js...");
  
  const botProcess = spawn("node", ["auto.js"], {
    stdio: "inherit",
    cwd: __dirname
  });

  botProcess.on("close", (code) => {
    console.log(`⚠️ Bot process exited with code ${code}. Restarting in 5 seconds...`);
    setTimeout(startBot, 5000);
  });

  botProcess.on("error", (err) => {
    console.error("❌ Failed to start bot process:", err);
  });
}

// Simulan ang bot process
startBot();
