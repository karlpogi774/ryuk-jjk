const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// Serve ang HTML panel
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API para makuha ang live status at oras ng bot
app.get("/api/status", (req, res) => {
  try {
    // Subukan basahin ang posibleng data files na ginagamit ng bot
    const possibleFiles = ["drake_data.json", "ryuk_data.json", "activate_data.json", "gojo_data.json"];
    let jsonData = null;
    let foundFile = false;

    for (const file of possibleFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, "utf8");
        jsonData = JSON.parse(rawData);
        foundFile = true;
        break;
      }
    }

    if (!foundFile || !jsonData) {
      return res.json({ 
        success: false, 
        active: false, 
        message: "Wala pang active data file. I-type muna ang /drake on sa GC." 
      });
    }

    // Handle iba't ibang pormat ng JSON data structures
    let expires = 0;
    let targetUser = null;
    let lockedTitle = null;

    if (jsonData.expires) {
      // Single thread format
      expires = jsonData.expires;
      targetUser = jsonData.targetUser || null;
      lockedTitle = jsonData.lockedTitle || null;
    } else if (jsonData.threads) {
      // Multi-thread format (gaya ng Drake/Ryuk script)
      const threadKeys = Object.keys(jsonData.threads);
      if (threadKeys.length > 0) {
        const firstThread = jsonData.threads[threadKeys[0]];
        expires = firstThread.expires || 0;
        targetUser = firstThread.targetUser || null;
        lockedTitle = firstThread.lockedTitle || null;
      }
    }

    const now = Date.now();
    const timeLeft = expires > now ? expires - now : 0;
    const isActive = timeLeft > 0;

    res.json({
      success: true,
      active: isActive,
      timeLeft: timeLeft,
      targetUser: targetUser,
      lockedTitle: lockedTitle
    });

  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
