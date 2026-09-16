const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// Path kung saan sine-save ng bot ang data (ryuk_data.json)
const DATA_PATH = path.join(__dirname, "ryuk_data.json");

// I-serve ang HTML panel mo sa browser (Render URL)
app.get("/", (req, res) => {
  const htmlPath = path.join(__dirname, "index.html");
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.send("Server is running, pero wala pang nakitang index.html file.");
  }
});

// API endpoint para kunin ang status at oras ng bot para sa panel
app.get("/api/status", (req, res) => {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const rawData = fs.readFileSync(DATA_PATH, "utf8");
      const jsonData = JSON.parse(rawData);
      res.json({ success: true, data: jsonData });
    } else {
      res.json({ 
        success: false, 
        message: "Wala pang ryuk_data.json. Subukang i-type muna ang /ryuk on sa GC para malikha ito." 
      });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Autobot server is running and listening on port ${PORT}`);
});

// ==========================================
// DITO MO ISASAMA O II-REQUIRE ANG BOT CODE MO
// (Halimbawa: kung hiwalay ang main bot file mo, i-require mo dito)
// require("./auto.js"); 
// ==========================================
