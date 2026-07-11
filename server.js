import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const db = new Database('database.db');

app.use(cors());
app.use(express.json());

// Initialize SQLite DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE
  );
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    prompt_details TEXT,
    generated_plan TEXT,
    timestamp TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Endpoints
app.post('/api/login', (req, res) => {
  const { username } = req.body;
  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    const info = db.prepare('INSERT INTO users (username) VALUES (?)').run(username);
    user = { id: info.lastInsertRowid, username };
  }
  res.json(user);
});

app.get('/api/history/:userId', (req, res) => {
  const { userId } = req.params;
  const history = db.prepare('SELECT * FROM history WHERE user_id = ? ORDER BY id DESC').all(userId);
  res.json(history.map(h => ({
    ...h,
    prompt_details: JSON.parse(h.prompt_details),
    generated_plan: JSON.parse(h.generated_plan)
  })));
});

app.post('/api/history', (req, res) => {
  const { userId, prompt_details, generated_plan, timestamp } = req.body;
  db.prepare('INSERT INTO history (user_id, prompt_details, generated_plan, timestamp) VALUES (?, ?, ?, ?)')
    .run(userId, JSON.stringify(prompt_details), JSON.stringify(generated_plan), timestamp);
  res.json({ success: true });
});

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
