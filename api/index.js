const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const crypto = require('crypto');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

let db, isPG = false;

if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  isPG = true;
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  db.on('error', (err) => console.error('Database pool error:', err));
  db.query(`CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`).catch(err => console.error('Users table error:', err));
  db.query(`CREATE TABLE IF NOT EXISTS applications (id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, company TEXT NOT NULL, position TEXT NOT NULL, status TEXT NOT NULL, areas JSONB DEFAULT '[]', salary TEXT, link TEXT, notes TEXT, date_applied DATE DEFAULT CURRENT_DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`).catch(err => console.error('Applications table error:', err));
} else {
  const sqlite3 = require('sqlite3').verbose();
  const rawDb = new sqlite3.Database('./backend/jobquest.db');
  db = {
    query: (sql, params) => new Promise((resolve, reject) => { rawDb.all(sql, params || [], (err, rows) => err ? reject(err) : resolve({ rows })); }),
    run: (sql, params) => new Promise((resolve, reject) => { rawDb.run(sql, params || [], function(err) { err ? reject(err) : resolve(this); }); })
  };
  rawDb.serialize(() => {
    rawDb.run('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    rawDb.run('CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, company TEXT NOT NULL, position TEXT NOT NULL, status TEXT NOT NULL, areas TEXT, salary TEXT, link TEXT, notes TEXT, date_applied DATE DEFAULT CURRENT_DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users (id))');
  });
}

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true, optionsSuccessStatus: 200 }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());

function authenticateToken(req, res, next) {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function q(sql, params) { return isPG ? db.query(sql, params) : db.query(sql.replace(/\$(\d+)/g, '?'), params); }
function r(sql, params) { return isPG ? db.query(sql, params) : db.run(sql.replace(/\$(\d+)/g, '?'), params); }

app.post('/api/auth/register', function(req, res) {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  q('SELECT id FROM users WHERE email = $1', [email]).then(result => {
    if (result.rows && result.rows.length > 0) return res.status(409).json({ error: 'Email already exists' });
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      const userId = crypto.randomUUID();
      r('INSERT INTO users (id, email, password, name) VALUES ($1, $2, $3, $4)', [userId, email, hashedPassword, name])
        .then(() => {
          const token = jwt.sign({ id: userId, email }, JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
          res.status(201).json({ user: { id: userId, email, name }, token });
        }).catch(err => { console.error('Insert user error:', err); res.status(500).json({ error: 'Failed to create user' }); });
    });
  }).catch(err => { console.error('Check user error:', err); res.status(500).json({ error: 'Database error' }); });
});

app.post('/api/auth/login', async function(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const result = await q('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.password) return res.status(500).json({ error: 'Server error: user data incomplete' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (e) { console.error('Login error:', e); res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/auth/me', authenticateToken, function(req, res) {
  q('SELECT id, email, name FROM users WHERE id = $1', [req.user.id])
    .then(result => { const user = result.rows[0]; if (!user) return res.status(404).json({ error: 'User not found' }); res.json({ user }); })
    .catch(err => { console.error('Get user error:', err); res.status(500).json({ error: 'Database error' }); });
});

app.get('/api/applications', authenticateToken, function(req, res) {
  q('SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id])
    .then(result => {
      const apps = result.rows.map(app => ({ id: app.id, userId: app.user_id, company: app.company, position: app.position, status: app.status, areas: app.areas ? (typeof app.areas === 'string' ? JSON.parse(app.areas) : app.areas) : [], salary: app.salary, link: app.link, notes: app.notes, dateApplied: app.date_applied }));
      res.json(apps);
    }).catch(err => { console.error('Get apps error:', err); res.status(500).json({ error: 'Database error' }); });
});

app.post('/api/applications', authenticateToken, function(req, res) {
  const { company, position, status, areas, salary, link, notes, dateApplied } = req.body;
  if (!company || !position || !status) return res.status(400).json({ error: 'Company, position, and status are required' });
  const appId = crypto.randomUUID();
  const areasJson = JSON.stringify(areas || []);
  r('INSERT INTO applications (id, user_id, company, position, status, areas, salary, link, notes, date_applied) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [appId, req.user.id, company, position, status, areasJson, salary || null, link || null, notes || null, dateApplied || null])
    .then(() => res.status(201).json({ id: appId, userId: req.user.id, company, position, status, areas: areas || [], salary, link, notes, dateApplied }))
    .catch(err => { console.error('Insert app error:', err); res.status(500).json({ error: 'Failed to create application' }); });
});

app.put('/api/applications/:id', authenticateToken, function(req, res) {
  const { id } = req.params;
  const { company, position, status, areas, salary, link, notes, dateApplied } = req.body;
  if (!company || !position || !status) return res.status(400).json({ error: 'Company, position, and status are required' });
  const areasJson = JSON.stringify(areas || []);
  r('UPDATE applications SET company=$1, position=$2, status=$3, areas=$4, salary=$5, link=$6, notes=$7, date_applied=$8 WHERE id=$9 AND user_id=$10', [company, position, status, areasJson, salary || null, link || null, notes || null, dateApplied || null, id, req.user.id])
    .then(result => { if (result.rowCount === 0) return res.status(404).json({ error: 'Application not found' }); res.json({ id, userId: req.user.id, company, position, status, areas: areas || [], salary, link, notes, dateApplied }); })
    .catch(err => { console.error('Update app error:', err); res.status(500).json({ error: 'Failed to update' }); });
});

app.delete('/api/applications/:id', authenticateToken, function(req, res) {
  r('DELETE FROM applications WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
    .then(result => { if (result.rowCount === 0) return res.status(404).json({ error: 'Application not found' }); res.json({ message: 'Application deleted successfully' }); })
    .catch(err => { console.error('Delete app error:', err); res.status(500).json({ error: 'Failed to delete' }); });
});

module.exports = app;
if (process.env.NODE_ENV !== 'production') { app.listen(3000, () => console.log('API running on port 3000')); }