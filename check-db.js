const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/jobquest.db');

db.serialize(function() {
  // Check users table structure
  db.all("PRAGMA table_info(users)", (err, columns) => {
    console.log('Users table columns:');
    columns.forEach(col => console.log(` - ${col.name} (${col.type})`));
    
    // Check if password column exists
    const hasPassword = columns.some(col => col.name === 'password');
    console.log('Has password column:', hasPassword);
    
    // Show all users
    db.all("SELECT * FROM users", (err, users) => {
      console.log('\nUsers in DB:');
      if (users.length === 0) {
        console.log('No users found');
      } else {
        users.forEach(u => {
          console.log(`ID: ${u.id}, Email: ${u.email}, Password: ${u.password ? '***' : 'MISSING'}, Name: ${u.name}`);
        });
      }
      db.close();
    });
  });
});