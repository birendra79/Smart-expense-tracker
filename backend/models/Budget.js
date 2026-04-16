const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  monthlyLimit: { type: Number, required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true }
});

module.exports = mongoose.model('Budget', budgetSchema);
