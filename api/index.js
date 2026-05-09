const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const crypto = require('crypto');

const app = express();

// Environment validation
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// Database setup - PostgreSQL in production, SQLite in development
let db;
let isPG = false;

if (process.env.DATABASE_URL) {
  // Production: PostgreSQL
  const { Pool } = require('pg');
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  isPG = true;

  // Initialize PostgreSQL tables
  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(err => console.error('Error creating users table:', err));

  db.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      status TEXT NOT NULL,
      areas JSONB DEFAULT '[]',
      salary TEXT,
      link TEXT,
      notes TEXT,
      date_applied DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(err => console.error('Error creating applications table:', err));
} else {
  // Development: SQLite with promise wrappers
  const sqlite3 = require('sqlite3').verbose();
  const rawDb = new sqlite3.Database('./backend/jobquest.db');

  // Wrap SQLite in promises
  db = {
    get: (sql, params) => new Promise((resolve, reject) => {
      rawDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }),
    all: (sql, params) => new Promise((resolve, reject) => {
      rawDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }),
    run: (sql, params) => new Promise((resolve, reject) => {
      rawDb.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    }),
    query: (sql, params) => new Promise((resolve, reject) => {
      rawDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    })
  };

  rawDb.serialize(function() {
    rawDb.run('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    rawDb.run('CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, company TEXT NOT NULL, position TEXT NOT NULL, status TEXT NOT NULL, areas TEXT, salary TEXT, link TEXT, notes TEXT, date_applied DATE DEFAULT CURRENT_DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users (id))');
  });
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());

function authenticateToken(req, res, next) {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET || 'fallback-secret', function(err, user) {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Auth routes
app.post('/api/auth/register', function(req, res) {
  console.log('Register attempt:', { email: req.body.email, name: req.body.name });
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      console.log('Validation error: email and password required');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const checkUser = db instanceof require('pg').Pool
      ? db.query('SELECT id FROM users WHERE email = $1', [email])
      : db.query('SELECT id FROM users WHERE email = ?', [email]);

    checkUser.then(result => {
      const rows = result.rows || result;
      if (rows.length > 0) {
        console.log('Email already exists:', email);
        return res.status(409).json({ error: 'Email already exists' });
      }

      bcrypt.hash(password, 10, function(err, hashedPassword) {
        if (err) {
          console.error('Bcrypt error:', err);
          return res.status(500).json({ error: 'Server error' });
        }
        const userId = crypto.randomUUID();

        const insertUser = db instanceof require('pg').Pool
          ? db.query('INSERT INTO users (id, email, password, name) VALUES ($1, $2, $3, $4)', [userId, email, hashedPassword, name])
          : db.run('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)', [userId, email, hashedPassword, name]);

        insertUser.then(() => {
          console.log('User inserted:', userId);
          // Verify
          const verify = db instanceof require('pg').Pool
            ? db.query('SELECT id, email, password FROM users WHERE id = $1', [userId])
            : db.query('SELECT id, email, password FROM users WHERE id = ?', [userId]);
          verify.then(v => {
            const rows = v.rows || v;
            const u = rows[0];
            console.log('Verification - Has password:', !!u?.password);
          }).catch(e => console.error('Verification error:', e));

          const token = jwt.sign({ id: userId, email: email }, JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
          res.status(201).json({ user: { id: userId, email, name }, token });
        }).catch(err => {
          console.error('Insert user error:', err);
          res.status(500).json({ error: 'Failed to create user' });
        });
      });
    }).catch(err => {
      console.error('Check user error:', err);
      res.status(500).json({ error: 'Database error' });
    });
  } catch (e) {
    console.error('Register catch error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async function(req, res) {
  console.log('Login attempt:', { email: req.body.email });
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('Validation error: email and password required');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const getUser = db instanceof require('pg').Pool
      ? db.query('SELECT * FROM users WHERE email = $1', [email])
      : db.query('SELECT * FROM users WHERE email = ?', [email]);

    const result = await getUser;
    const rows = result.rows || result;
    const user = rows[0];
    console.log('User found:', user ? 'yes' : 'no');
    if (user) console.log('User password exists:', !!user.password);

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.password) {
      console.error('User password is missing in database:', user.id);
      return res.status(500).json({ error: 'Server error: user data incomplete' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, function(req, res) {
  const getUser = db instanceof require('pg').Pool
    ? db.query('SELECT id, email, name FROM users WHERE id = $1', [req.user.id])
    : db.query('SELECT id, email, name FROM users WHERE id = ?', [req.user.id]);

  getUser.then(result => {
    const rows = result.rows || result;
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user });
  }).catch(err => {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Database error' });
  });
});

app.get('/api/applications', authenticateToken, function(req, res) {
  const getApps = db instanceof require('pg').Pool
    ? db.query('SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id])
    : db.query('SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);

  getApps.then(result => {
    const rows = result.rows || result;
    const apps = rows.map(app => ({
      id: app.id,
      userId: app.user_id,
      company: app.company,
      position: app.position,
      status: app.status,
      areas: app.areas ? (typeof app.areas === 'string' ? JSON.parse(app.areas) : app.areas) : [],
      salary: app.salary,
      link: app.link,
      notes: app.notes,
      dateApplied: app.date_applied
    }));
    res.json(apps);
  }).catch(err => {
    console.error('Get applications error:', err);
    res.status(500).json({ error: 'Database error' });
  });
});

app.post('/api/applications', authenticateToken, function(req, res) {
  try {
    const { company, position, status, areas, salary, link, notes, dateApplied } = req.body;
    if (!company || !position || !status) return res.status(400).json({ error: 'Company, position, and status are required' });

    const appId = crypto.randomUUID();
    const areasJson = JSON.stringify(areas || []);

    const insertApp = db instanceof require('pg').Pool
      ? db.query(
          'INSERT INTO applications (id, user_id, company, position, status, areas, salary, link, notes, date_applied) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [appId, req.user.id, company, position, status, areasJson, salary || null, link || null, notes || null, dateApplied || null]
        )
      : db.run(
          'INSERT INTO applications (id, user_id, company, position, status, areas, salary, link, notes, date_applied) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [appId, req.user.id, company, position, status, areasJson, salary || null, link || null, notes || null, dateApplied || null]
        );

    insertApp.then(() => {
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
    }).catch(err => {
      console.error('Insert application error:', err);
      res.status(500).json({ error: 'Failed to create application' });
    });
  } catch (e) {
    console.error('Create application catch error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/applications/:id', authenticateToken, function(req, res) {
  try {
    const { id } = req.params;
    const { company, position, status, areas, salary, link, notes, dateApplied } = req.body;
    if (!company || !position || !status) return res.status(400).json({ error: 'Company, position, and status are required' });

    const areasJson = JSON.stringify(areas || []);

    const updateApp = db instanceof require('pg').Pool
      ? db.query(
          'UPDATE applications SET company=$1, position=$2, status=$3, areas=$4, salary=$5, link=$6, notes=$7, date_applied=$8 WHERE id=$9 AND user_id=$10',
          [company, position, status, areasJson, salary || null, link || null, notes || null, dateApplied || null, id, req.user.id]
        )
      : db.run(
          'UPDATE applications SET company=?, position=?, status=?, areas=?, salary=?, link=?, notes=?, date_applied=? WHERE id=? AND user_id=?',
          [company, position, status, areasJson, salary || null, link || null, notes || null, dateApplied || null, id, req.user.id]
        );

    updateApp.then(result => {
      if (result.rowCount ? result.rowCount === 0 : result.changes === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }
      res.json({ id, userId: req.user.id, company, position, status, areas: areas || [], salary, link, notes, dateApplied });
    }).catch(err => {
      console.error('Update application error:', err);
      res.status(500).json({ error: 'Failed to update' });
    });
  } catch (e) {
    console.error('Update application catch error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/applications/:id', authenticateToken, function(req, res) {
  const deleteApp = db instanceof require('pg').Pool
    ? db.query('DELETE FROM applications WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
    : db.run('DELETE FROM applications WHERE id=? AND user_id=?', [req.params.id, req.user.id]);

  deleteApp.then(result => {
    if (result.rowCount ? result.rowCount === 0 : result.changes === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: 'Application deleted successfully' });
  }).catch(err => {
    console.error('Delete application error:', err);
    res.status(500).json({ error: 'Failed to delete' });
  });
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, function() { console.log('API running on port 3000'); });
}