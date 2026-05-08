const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Security middleware
app.use(helmet());

// CORS configuration
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

// Initialize database tables
async function initDatabase() {
  try {
    // Users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Applications table
    await db.run(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        company TEXT NOT NULL,
        position TEXT NOT NULL,
        status TEXT NOT NULL,
        areas TEXT,
        salary TEXT,
        link TEXT,
        notes TEXT,
        date_applied DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    console.log('Database tables initialized.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initDatabase();

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

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userExists = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });

    if (userExists) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = require('crypto').randomUUID();

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
        [userId, email, hashedPassword, name],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: { id: userId, email, name },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
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

    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, email, name FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Applications routes
app.get('/api/applications', authenticateToken, async (req, res) => {
  try {
    const applications = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const apps = applications.map(app => ({
      ...app,
      areas: app.areas ? JSON.parse(app.areas) : []
    }));

    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/applications', authenticateToken, async (req, res) => {
  try {
    const { company, position, status, areas, salary, link, notes, dateApplied } = req.body;

    if (!company || !position || !status) {
      return res.status(400).json({ error: 'Company, position, and status are required' });
    }

    const appId = require('crypto').randomUUID();
    const areasJson = JSON.stringify(areas || []);

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO applications (id, user_id, company, position, status, areas, salary, link, notes, date_applied)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [appId, req.user.id, company, position, status, areasJson, salary, link, notes, dateApplied],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

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
  } catch (error) {
    res.status(500).json({ error: 'Failed to create application' });
  }
});

app.put('/api/applications/:id', authenticateToken, async (req, res) => {
  try {
    const { company, position, status, areas, salary, link, notes, dateApplied } = req.body;
    const appId = req.params.id;

    if (!company || !position || !status) {
      return res.status(400).json({ error: 'Company, position, and status are required' });
    }

    const areasJson = JSON.stringify(areas || []);

    const result = await new Promise((resolve, reject) => {
      db.run(
        `UPDATE applications SET
         company = ?, position = ?, status = ?, areas = ?, salary = ?, link = ?, notes = ?, date_applied = ?
         WHERE id = ? AND user_id = ?`,
        [company, position, status, areasJson, salary, link, notes, dateApplied, appId, req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    if (result.changes === 0) {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

app.delete('/api/applications/:id', authenticateToken, async (req, res) => {
  try {
    const appId = req.params.id;

    const result = await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM applications WHERE id = ? AND user_id = ?',
        [appId, req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Serverless export
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;