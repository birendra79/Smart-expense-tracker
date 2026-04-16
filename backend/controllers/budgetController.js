const Budget = require('../models/Budget');

const getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const budgets = await Budget.find({ 
      user: req.user.id,
      month: currentMonth,
      year: currentYear
    });
    
    res.json(budgets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

const setBudget = async (req, res) => {
  try {
    const { category, monthlyLimit, month, year } = req.body;
    
    let budget = await Budget.findOne({ 
      user: req.user.id, 
      category, 
      month, 
      year 
    });

    if (budget) {
      budget.monthlyLimit = monthlyLimit;
    } else {
      budget = new Budget({
        user: req.user.id,
        category,
        monthlyLimit,
        month,
        year
      });
    }

    await budget.save();
    res.json(budget);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = { getBudgets, setBudget };
