import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite
  const db = await open({
    filename: './incidents.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      priority_score INTEGER,
      suggested_order INTEGER,
      copilot_summary TEXT,
      copilot_steps TEXT,
      copilot_recommendations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  app.use(express.json());

  // API Routes
  app.get('/api/incidents', async (req, res) => {
    const incidents = await db.all('SELECT * FROM incidents ORDER BY created_at DESC');
    res.json(incidents);
  });

  app.post('/api/incidents', async (req, res) => {
    const { id, title, description, severity, category, status, priority_score, suggested_order, copilot_summary, copilot_steps, copilot_recommendations } = req.body;
    await db.run(
      `INSERT INTO incidents (id, title, description, severity, category, status, priority_score, suggested_order, copilot_summary, copilot_steps, copilot_recommendations) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description, severity, category, status, priority_score, suggested_order, copilot_summary, copilot_steps, copilot_recommendations]
    );
    res.json({ success: true });
  });

  app.get('/api/incidents/:id', async (req, res) => {
    const incident = await db.get('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
    res.json(incident);
  });

  app.delete('/api/incidents/:id', async (req, res) => {
    await db.run('DELETE FROM incidents WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
