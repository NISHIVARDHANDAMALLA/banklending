// loans.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

// Helper function to calculate total payable and EMI
function calculateLoanDetails(amount, years, rate) {
  const total = amount + (amount * rate * years) / 100;
  const emi = total / (years * 12);
  return { total, emi };
}

// POST: Create a new loan
router.post('/', (req, res) => {
  const { customer_id, loan_amount, loan_period_years, interest_rate_yearly } = req.body;
  if (!customer_id || !loan_amount || !loan_period_years || !interest_rate_yearly) {
    return res.status(400).json({ error: 'Missing loan fields' });
  }

  const loan_id = uuidv4();
  const { total, emi } = calculateLoanDetails(loan_amount, loan_period_years, interest_rate_yearly);

  const query = `
    INSERT INTO loans (loan_id, customer_id, loan_amount, loan_period_years, interest_rate_yearly, total_amount_payable, monthly_emi)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [loan_id, customer_id, loan_amount, loan_period_years, interest_rate_yearly, total, emi];

  db.run(query, values, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({
      loan_id,
      customer_id,
      total_amount_payable: total,
      monthly_emi: emi
    });
  });
});

// GET: All loans
router.get('/', (req, res) => {
  db.all('SELECT * FROM loans', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// GET: Loan by ID
router.get('/:id', (req, res) => {
  const loan_id = req.params.id;
  db.get('SELECT * FROM loans WHERE loan_id = ?', [loan_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    res.json(row);
  });
});

// DELETE: Loan by ID
router.delete('/:id', (req, res) => {
  const loan_id = req.params.id;
  db.run('DELETE FROM loans WHERE loan_id = ?', [loan_id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    res.json({ message: 'Loan deleted successfully' });
  });
});

module.exports = router;
