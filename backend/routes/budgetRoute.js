const express = require('express');
const router = express.Router();
const { getBudgets, setBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getBudgets);
router.post('/', protect, setBudget);

module.exports = router;
