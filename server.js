const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Connect to SQLite database
const db = new sqlite3.Database('./loans.db', (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
  } else {
    console.log('📦 Connected to SQLite database.');
  }
});

// Create the loans table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS loans (
    loan_id TEXT PRIMARY KEY,
    customer_id TEXT,
    loan_amount REAL,
    loan_period_years INTEGER,
    interest_rate_yearly REAL,
    total_amount_payable REAL,
    monthly_emi REAL
  )
`, () => {
  console.log('📄 Tables created successfully.');
});

// ✅ POST /api/v1/loans – Create a new loan
app.post('/api/v1/loans', (req, res) => {
  const { customer_id, loan_amount, loan_period_years, interest_rate_yearly } = req.body;

  if (!customer_id || !loan_amount || !loan_period_years || !interest_rate_yearly) {
    return res.status(400).json({ error: 'Missing required loan details.' });
  }

  const total_amount_payable = loan_amount * (1 + (interest_rate_yearly * loan_period_years) / 100);
  const monthly_emi = total_amount_payable / (loan_period_years * 12);
  const loan_id = uuidv4();

  db.run(`
    INSERT INTO loans (
      loan_id, customer_id, loan_amount, loan_period_years, interest_rate_yearly,
      total_amount_payable, monthly_emi
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    loan_id, customer_id, loan_amount, loan_period_years, interest_rate_yearly,
    total_amount_payable, monthly_emi
  ], function (err) {
    if (err) {
      console.error('❌ Error inserting loan:', err.message);
      return res.status(500).json({ error: 'Failed to store loan data.' });
    }

    res.status(201).json({
      loan_id,
      customer_id,
      total_amount_payable,
      monthly_emi
    });
  });
});

// ✅ GET /api/v1/loans – Get all loans
app.get('/api/v1/loans', (req, res) => {
  db.all('SELECT * FROM loans', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve loans.' });
    }
    res.json(rows);
  });
});

// ✅ GET /api/v1/loans/:loan_id – Get a loan by ID
app.get('/api/v1/loans/:loan_id', (req, res) => {
  const { loan_id } = req.params;
  db.get('SELECT * FROM loans WHERE loan_id = ?', [loan_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve loan.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Loan not found.' });
    }
    res.json(row);
  });
});

// ✅ DELETE /api/v1/loans/:loan_id – Delete a loan by ID
app.delete('/api/v1/loans/:loan_id', (req, res) => {
  const { loan_id } = req.params;
  db.run('DELETE FROM loans WHERE loan_id = ?', [loan_id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete loan.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Loan not found.' });
    }
    res.json({ message: 'Loan deleted successfully.' });
  });
});

// Default route for root URL
app.get('/', (req, res) => {
  res.send('🚀 Bank Loan API is running. Use /api/v1/loans');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
