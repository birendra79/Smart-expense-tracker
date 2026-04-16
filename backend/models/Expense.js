const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true }, // e.g., Food, Travel, Bills, Shopping
  description: { type: String, required: true }, // e.g. "Vendor Name"
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, default: 'Cash' },
  isAutoParsed: { type: Boolean, default: false },
  isRecurring: { type: Boolean, default: false } // Auto flag via AI or vendor matching
});

module.exports = mongoose.model('Expense', expenseSchema);
