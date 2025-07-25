// db.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Create or open database
const db = new sqlite3.Database('./bank.db', (err) => {
  if (err) console.error('Database error:', err.message);
  else console.log('📦 Connected to SQLite database.');
});

// Load schema
const schema = fs.readFileSync('./models/schema.sql', 'utf8');
db.exec(schema, (err) => {
  if (err) console.error('Schema error:', err.message);
  else console.log('📄 Tables created successfully.');
});

module.exports = db;
