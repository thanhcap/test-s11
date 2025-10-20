import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// API endpoint to get saved data
app.get("/api/data", (req, res) => {
  const filePath = path.join(__dirname, "placeholders.json");
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.json([]);  // return empty array if file doesn't exist
  }
});

// API endpoint to save data
app.post("/api/save", (req, res) => {
  const filePath = path.join(__dirname, "placeholders.json");
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
  res.json({ message: "Data saved" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
