const fs = require("fs");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Automatic na gagawa ng appstate.json mula sa Render Environment Variable kung meron man
if (process.env.APPSTATE) {
  try {
    fs.writeFileSync("appstate.json", process.env.APPSTATE);
    console.log("Appstate successfully loaded from Environment Variables!");
  } catch (err) {
    console.error("Error writing appstate.json:", err);
  }
}

app.get("/", (req, res) => {
  res.send("Ryuk Gojo Bot is running live 24/7!");
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Patakbuhin ang auto.js kasabay ng server
require("./auto.js");
