// Database abstraction layer - PostgreSQL or SQLite
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;
let isPostgres = false;

// Check if PostgreSQL connection string is available
if (process.env.DATABASE_URL) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  db = {
    get: (query, params, callback) => {
      const sql = query.replace(/\$(\d+)/g, '?');
      pool.query(sql, params, (err, res) => {
        if (err) callback(err);
        else callback(null, res.rows[0]);
      });
    },
    all: (query, params, callback) => {
      const sql = query.replace(/\$(\d+)/g, '?');
      pool.query(sql, params, (err, res) => {
        if (err) callback(err);
        else callback(null, res.rows);
      });
    },
    run: (query, params, callback) => {
      const sql = query.replace(/\$(\d+)/g, '?');
      pool.query(sql, params, (err, res) => {
        callback(err, { changes: res.rowCount });
      });
    }
  };
  isPostgres = true;
  console.log('Connected to PostgreSQL database.');
} else {
  // SQLite fallback
  const dbPath = process.env.NODE_ENV === 'production' ? ':memory:' : './jobquest.db';
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database.');
    }
  });
  isPostgres = false;
}

module.exports = db;