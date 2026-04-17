const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
const allowedOrigins = ['http://localhost:8081'];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- Database --------------------
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
    return;
  }

  console.log('Connected to SQLite database.');
  initializeDatabase();
});

function initializeDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS inspirations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      summary TEXT NOT NULL,
      explanation TEXT NOT NULL,
      visual TEXT,
      priority INTEGER NOT NULL CHECK(priority >= 1 AND priority <= 10)
    );
  `;

  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
      return;
    }

    seedDatabaseIfEmpty();
  });
}

function seedDatabaseIfEmpty() {
  db.get('SELECT COUNT(*) AS count FROM inspirations', (err, row) => {
    if (err) {
      console.error('Error checking inspirations count:', err.message);
      return;
    }

    if (!row) {
      console.error('Count query returned no row.');
      return;
    }

    if (row.count > 0) {
      return;
    }

    const insertSQL = `
      INSERT INTO inspirations (summary, explanation, visual, priority)
      VALUES (?, ?, ?, ?)
    `;

    const seedData = [
      ['Neon Cityscape', 'A futuristic cyberpunk city...', '', 9],
      ['Floating Islands', 'Massive islands drifting...', '', 8],
      ['Forest Spirit', 'A mystical creature...', '', 10]
    ];

    seedData.forEach((item) => {
      db.run(insertSQL, item, (insertErr) => {
        if (insertErr) {
          console.error('Error inserting seed data:', insertErr.message);
        }
      });
    });

    console.log('Database seeded with default inspirations.');
  });
}

// Routes

// GET all inspirations
app.get('/api', (req, res) => {
  db.all(
    'SELECT * FROM inspirations ORDER BY priority DESC, id ASC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

// GET one inspiration by id
app.get('/api/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM inspirations WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Inspiration not found.' });
    }

    res.json(row);
  });
});

// POST create new inspiration
app.post('/api', (req, res) => {
  const { summary, explanation, priority } = req.body;
  const parsedPriority = Number(priority);

  if (
    !summary ||
    !explanation ||
    !Number.isInteger(parsedPriority) ||
    parsedPriority < 1 ||
    parsedPriority > 10
  ) {
    return res.status(400).json({
      error: 'summary and explanation are required, and priority must be an integer between 1 and 10.'
    });
  }

  const insertSQL = `
    INSERT INTO inspirations (summary, explanation, visual, priority)
    VALUES (?, ?, ?, ?)
  `;

  db.run(insertSQL, [summary, explanation, null, parsedPriority], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.get('SELECT * FROM inspirations WHERE id = ?', [this.lastID], (selectErr, row) => {
      if (selectErr) {
        return res.status(500).json({ error: selectErr.message });
      }

      res.status(201).json(row);
    });
  });
});

// PUT update one inspiration
app.put('/api/:id', (req, res) => {
  const { id } = req.params;
  const { summary, explanation, priority } = req.body;
  const parsedPriority = Number(priority);

  db.get('SELECT * FROM inspirations WHERE id = ?', [id], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!existing) {
      return res.status(404).json({ error: 'Inspiration not found.' });
    }

    const updatedSummary = summary ?? existing.summary;
    const updatedExplanation = explanation ?? existing.explanation;
    const updatedPriority = priority !== undefined ? parsedPriority : existing.priority;

    if (
      !updatedSummary ||
      !updatedExplanation ||
      !Number.isInteger(updatedPriority) ||
      updatedPriority < 1 ||
      updatedPriority > 10
    ) {
      return res.status(400).json({
        error: 'summary and explanation are required, and priority must be an integer between 1 and 10.'
      });
    }

    const updateSQL = `
      UPDATE inspirations
      SET summary = ?, explanation = ?, priority = ?
      WHERE id = ?
    `;

    db.run(updateSQL, [updatedSummary, updatedExplanation, updatedPriority, id], function (updateErr) {
      if (updateErr) {
        return res.status(500).json({ error: updateErr.message });
      }

      db.get('SELECT * FROM inspirations WHERE id = ?', [id], (selectErr, row) => {
        if (selectErr) {
          return res.status(500).json({ error: selectErr.message });
        }

        res.json(row);
      });
    });
  });
});

// DELETE all inspirations
app.delete('/api', (req, res) => {
  db.run('DELETE FROM inspirations', [], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      message: 'All inspirations deleted successfully.',
      changes: this.changes
    });
  });
});

// DELETE one inspiration
app.delete('/api/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM inspirations WHERE id = ?', [id], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!existing) {
      return res.status(404).json({ error: 'Inspiration not found.' });
    }

    db.run('DELETE FROM inspirations WHERE id = ?', [id], function (deleteErr) {
      if (deleteErr) {
        return res.status(500).json({ error: deleteErr.message });
      }

      res.json({ message: 'Inspiration deleted successfully.' });
    });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/api`);
});
