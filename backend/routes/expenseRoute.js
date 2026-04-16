const express = require('express');
const router = express.Router();
const { getExpenses, addExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

// Route for normal authenticated user
router.get('/', protect, getExpenses);

// Add expense can be accessed by authenticated user OR auto-parsed script
router.post('/', (req, res, next) => {
  // If api secret is provided, bypass standard auth (for Google Apps Script usage)
  if(req.body.apiSecret && req.body.apiSecret === process.env.API_SECRET) {
     return next();
  }
  return protect(req, res, next);
}, addExpense);

module.exports = router;
