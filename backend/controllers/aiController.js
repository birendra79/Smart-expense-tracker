const { GoogleGenerativeAI } = require('@google/generative-ai');
const Expense = require('../models/Expense');
require('dotenv').config();

const getAiInsights = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ msg: "Gemini API Key not configured." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Fetch last 3 months expenses for this user
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenses = await Expense.find({
      user: req.user.id,
      date: { $gte: threeMonthsAgo }
    });

    if (expenses.length === 0) {
      return res.json({ suggestion: "You don't have enough expense data yet to generate predictions. Start logging expenses!" });
    }

    // Summarize data to save tokens
    const summaries = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const prompt = `Analyze this user's spending data over the last 3 months: 
Total spent: $${totalSpent}
Category Breakdown: ${JSON.stringify(summaries)}

In 2 short, concise paragraphs:
1. Suggest budget improvements or red flags.
2. Predict upcoming expenses for the next month based on this trend.`;

    const result = await model.generateContent(prompt);
    res.json({ suggestion: result.response.text().trim() });
  } catch (err) {
    console.error("AI Insight Error:", err);
    res.status(500).send('Server Error generating AI insights');
  }
};

module.exports = { getAiInsights };
