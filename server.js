const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let botStatus = "initializing";
let lastRestartTime = new Date().toISOString();
let restartCount = 0;

// Middleware para sa JSON logging ng mga requests
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Enhanced Health Check Endpoint para sa Render
app.get("/health", (req, res) => {
  res.status(200).json({
    status: botStatus === "running" ? "healthy" : "unhealthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Root Status Page
app.get("/", (req, res) => {
  res.status(200).json({
    service: "Gojo Satoru Domain Bot Framework",
    status: botStatus,
    restarts: restartCount,
    lastRestart: lastRestartTime,
    memoryUsage: process.memoryUsage(),
    message: "Domain Expansion: Infinite Void is actively monitored! 🌌♾️"
  });
});

// Simulan ang Express Web Server
const server = app.listen(PORT, () => {
  console.log(`🌐 [SERVER] Gojo Web Server successfully listening on port ${PORT}`);
});

// Function para sa Bot Process Management at Detalyadong Logging
let botProcess = null;

function startBot() {
  console.log(`🚀 [BOT MANAGER] Spawning bot process via auto.js (Attempt #${restartCount + 1})...`);
  botStatus = "starting";
  
  botProcess = spawn("node", ["auto.js"], {
    stdio: "inherit",
    cwd: __dirname
  });

  botStatus = "running";
  lastRestartTime = new Date().toISOString();

  botProcess.on("close", (code) => {
    botStatus = "stopped";
    restartCount++;
    console.warn(`⚠️ [BOT MANAGER] Bot process exited with code ${code}. Restarting in 5 seconds... (Total Restarts: ${restartCount})`);
    setTimeout(startBot, 5000);
  });

  botProcess.on("error", (err) => {
    botStatus = "error";
    console.error("❌ [BOT MANAGER] Failed to start bot process due to error:", err);
    setTimeout(startBot, 5000);
  });
}

// I-trigger ang pag-start ng bot
startBot();

// Graceful Shutdown Handling
process.on("SIGINT", () => {
  console.log("🛑 [SERVER] Shutting down server and bot process gracefully...");
  botStatus = "shutting_down";
  if (botProcess) {
    botProcess.kill("SIGINT");
  }
  server.close(() => {
    console.log("👋 [SERVER] Server closed successfully.");
    process.exit(0);
  });
});
