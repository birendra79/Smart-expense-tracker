const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAiInsights } = require('../controllers/aiController');

router.get('/insights', protect, getAiInsights);

module.exports = router;
