const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Security middleware
app.use(helmet());

// CORS configuration - allow all origins for serverless or use specific origin
const corsOptions = {
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(express.json());

// Database setup - use in-memory for serverless, file for local
const dbPath = process.env.NODE_ENV === 'production' ? ':memory:' : './jobquest.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Applications table
    db.run(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        company TEXT NOT NULL,
        position TEXT NOT NULL,
        status TEXT NOT NULL,
        areas TEXT, -- JSON array
        salary TEXT,
        link TEXT,
        notes TEXT,
        date_applied DATE DEFAULT CURRENT_DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
  });
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userId = require('crypto').randomUUID();
      db.run(
        'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
        [userId, email, hashedPassword, name],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          // Generate JWT
          const token = jwt.sign(
            { id: userId, email },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            user: { id: userId, email, name },
            token
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, email, name FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  });
});

// Applications routes
app.get('/api/applications', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Parse areas JSON
      const applications = rows.map(app => ({
        ...app,
        areas: app.areas ? JSON.parse(app.areas) : []
      }));

      res.json(applications);
    }
  );
});

app.post('/api/applications', authenticateToken, (req, res) => {
  const { company, position, status, areas, salary, link, notes, dateApplied } = req.body;

  if (!company || !position || !status) {
    return res.status(400).json({ error: 'Company, position, and status are required' });
  }

  const appId = require('crypto').randomUUID();
  const areasJson = JSON.stringify(areas || []);

  db.run(
    `INSERT INTO applications
     (id, user_id, company, position, status, areas, salary, link, notes, date_applied)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [appId, req.user.id, company, position, status, areasJson, salary, link, notes, dateApplied],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create application' });
      }

      res.status(201).json({
        id: appId,
        userId: req.user.id,
        company,
        position,
        status,
        areas: areas || [],
        salary,
        link,
        notes,
        dateApplied
      });
    }
  );
});

app.put('/api/applications/:id', authenticateToken, (req, res) => {
  const { company, position, status, areas, salary, link, notes, dateApplied } = req.body;
  const appId = req.params.id;

  if (!company || !position || !status) {
    return res.status(400).json({ error: 'Company, position, and status are required' });
  }

  const areasJson = JSON.stringify(areas || []);

  db.run(
    `UPDATE applications SET
     company = ?, position = ?, status = ?, areas = ?, salary = ?, link = ?, notes = ?, date_applied = ?
     WHERE id = ? AND user_id = ?`,
    [company, position, status, areasJson, salary, link, notes, dateApplied, appId, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update application' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json({
        id: appId,
        userId: req.user.id,
        company,
        position,
        status,
        areas: areas || [],
        salary,
        link,
        notes,
        dateApplied
      });
    }
  );
});

app.delete('/api/applications/:id', authenticateToken, (req, res) => {
  const appId = req.params.id;

  db.run(
    'DELETE FROM applications WHERE id = ? AND user_id = ?',
    [appId, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete application' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json({ message: 'Application deleted successfully' });
    }
  );
});

// Para serverless, exportar la app en lugar de escuchar puerto
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;