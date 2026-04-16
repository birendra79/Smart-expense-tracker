const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');
require('dotenv').config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;


// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendAlertEmail = async (userEmail, category, limit, total, isCritical) => {
  if (!process.env.EMAIL_USER) return;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: isCritical ? `CRITICAL: Budget Exceeded for ${category}` : `WARNING: Budget almost reached for ${category}`,
    text: `You have spent $${total} in the ${category} category. Your limit is $${limit}.`
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email send failed", error);
  }
};

const checkBudget = async (userId, category, amount, userEmail) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const budget = await Budget.findOne({ user: userId, category, month: currentMonth, year: currentYear });
  if (!budget) return;

  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0);

  const expenses = await Expense.find({
    user: userId,
    category,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  });

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  if (totalSpent > budget.monthlyLimit) {
    await sendAlertEmail(userEmail, category, budget.monthlyLimit, totalSpent, true);
  } else if (totalSpent >= budget.monthlyLimit * 0.8) {
    await sendAlertEmail(userEmail, category, budget.monthlyLimit, totalSpent, false);
  }
};

const checkRecurring = (description) => {
  const recurringKeywords = ['netflix', 'spotify', 'hulu', 'amazon prime', 'gym', 'membership', 'subscription'];
  return recurringKeywords.some(keyword => description.toLowerCase().includes(keyword));
};

const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

const addExpense = async (req, res) => {
  try {
    let { amount, category, description, paymentMethod, isAutoParsed } = req.body;
    let userId = req.user ? req.user.id : null;
    let userEmail = null;
    
    if (req.body.userEmail && req.body.apiSecret === process.env.API_SECRET) {
      const userObj = await User.findOne({ email: req.body.userEmail });
      if (userObj) {
        userId = userObj.id;
        userEmail = userObj.email;
      }
    } else if (req.user) {
      const userObj = await User.findById(req.user.id);
      userEmail = userObj.email;
    }

    if (!userId) return res.status(401).json({ msg: 'User not found' });

    if (!category && description && process.env.GEMINI_API_KEY && genAI) {
      try {
        let userCategories = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];
        if (userId) {
          const userDoc = await User.findById(userId);
          if (userDoc && userDoc.categories && userDoc.categories.length > 0) {
            userCategories = userDoc.categories;
          }
        }
        
        const categoriesString = userCategories.join(', ');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`Categorize the following expense description into one of these exact categories: ${categoriesString}. Return ONLY the exact single category name from that list. Description: ${description}`);
        category = result.response.text().trim();
        
        // Fallback in case AI returns something outside the list
        if (!userCategories.includes(category)) {
           category = userCategories[0];
        }
      } catch (aiError) {
        category = 'Other';
      }
    } else if (!category) {
      category = 'Other';
    }

    const isRecurring = checkRecurring(description);

    const newExpense = new Expense({
      user: userId,
      amount,
      category,
      description,
      paymentMethod,
      isAutoParsed: isAutoParsed || false,
      isRecurring
    });

    const expense = await newExpense.save();
    
    // Check Budget Alerts
    checkBudget(userId, category, amount, userEmail);

    // Emit real-time WebSocket update to the client
    const io = req.app.get('io');
    if (io) {
      io.emit('expense_updated', { userId, expense });
    }

    res.json(expense);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = { getExpenses, addExpense };
