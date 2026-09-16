const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files kung ilalagay mo sa public folder, o direktang i-send ang HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API para makuha ang status at oras ng bot
app.get("/api/status", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "activate_data.json");
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, "utf8");
      const jsonData = JSON.parse(rawData);
      
      // Kunin ang active threads/data
      res.json({ success: true, data: jsonData });
    } else {
      res.json({ success: false, message: "No data file found." });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
