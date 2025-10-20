import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const app = express();
const __dirname = path.resolve();

// Configure multer
const upload = multer({ dest: "public/uploads/" });

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Upload route
app.post("/api/upload", upload.single("image"), (req, res) => {
  res.json({ path: `/uploads/${req.file.filename}` });
});

// Save/load routes
app.post("/api/save", (req, res) => {
  fs.writeFileSync("placeholders.json", JSON.stringify(req.body, null, 2));
  res.json({ message: "Data saved" });
});

app.get("/api/data", (req, res) => {
  if (fs.existsSync("placeholders.json")) {
    res.sendFile(path.join(__dirname, "placeholders.json"));
  } else {
    res.json([]);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
