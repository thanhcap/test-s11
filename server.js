import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const app = express();
const PORT = 8080;

const DATA_FILE = path.join(process.cwd(), 'placeholders.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `placeholder_${req.params.id}${ext}`);
  },
});
const upload = multer({ storage });

// Middleware to parse JSON bodies
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper to read placeholders from file
function readPlaceholders() {
  if (!fs.existsSync(DATA_FILE)) {
    // Initialize with 27 placeholders if file doesn't exist
    const placeholders = [];
    for (let i = 1; i <= 27; i++) {
      placeholders.push({
        id: i,
        studentName: '',
        famousPerson: '',
        blogText: '',
        imageUrl: '',
      });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(placeholders, null, 2));
    return placeholders;
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Helper to write placeholders to file
function writePlaceholders(placeholders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(placeholders, null, 2));
}

// Serve frontend HTML at '/'
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Placeholders</title></head>
      <body>
        <h1>Welcome to the Placeholders App</h1>
        <p>Use the API endpoints to interact with placeholders.</p>
      </body>
    </html>
  `);
});

// GET /api/placeholders - return all placeholders
app.get('/api/placeholders', (req, res) => {
  const placeholders = readPlaceholders();
  res.json(placeholders);
});

// PATCH /api/placeholders/:id - update placeholder fields
app.patch('/api/placeholders/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const updates = req.body;
  const placeholders = readPlaceholders();
  const index = placeholders.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Placeholder not found' });
  }

  // Only update allowed fields
  const allowedFields = ['studentName', 'famousPerson', 'blogText'];
  for (const field of allowedFields) {
    if (field in updates) {
      placeholders[index][field] = updates[field];
    }
  }

  writePlaceholders(placeholders);
  res.json(placeholders[index]);
});

// POST /api/placeholders/:id/image - upload image
app.post('/api/placeholders/:id/image', upload.single('image'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const placeholders = readPlaceholders();
  const index = placeholders.findIndex(p => p.id === id);
  if (index === -1) {
    // Delete uploaded file if placeholder not found
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(404).json({ error: 'Placeholder not found' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  // Update imageUrl to the uploaded file path relative to server
  placeholders[index].imageUrl = `/uploads/${req.file.filename}`;
  writePlaceholders(placeholders);

  res.json({ message: 'Image uploaded successfully', imageUrl: placeholders[index].imageUrl });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});