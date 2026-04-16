const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// Make IO accessible in routes and controllers
app.set('io', io);

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected for real-time updates', socket.id);
  
  // Example: join user room if needed
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

// Connect Database
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn("MongoDB URI not found in .env, skipping DB connection for now.");
      return;
    }
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    console.warn("Starting server without database connection...");
    // process.exit(1);
  }
};
connectDB();

// Serve Static Frontend
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// Define Routes
app.use('/api/auth', require('./routes/authRoute'));
app.use('/api/expenses', require('./routes/expenseRoute'));
app.use('/api/budgets', require('./routes/budgetRoute'));
app.use('/api/ai', require('./routes/aiRoute'));

// Dashboard route for aggregated data (Enhanced with smart insights)
app.get('/api/dashboard', require('./middleware/authMiddleware').protect, async (req, res) => {
  try {
    const Expense = mongoose.model('Expense');
    const Budget = mongoose.model('Budget');
    
    // Fetch user's data
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
    const budgets = await Budget.find({ 
      user: req.user.id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });
    
    // Smart Insights Calculation:
    // This Month vs Last Month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filter expenses into last month and this month tracking
    let currentMonthTotal = 0;
    let lastMonthTotal = 0;
    let categoryTotals = {};
    
    expenses.forEach(exp => {
      const eDate = new Date(exp.date);
      if (eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear) {
        currentMonthTotal += exp.amount;
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      }
      if (
        (currentMonth === 0 && eDate.getMonth() === 11 && eDate.getFullYear() === currentYear - 1) ||
        (currentMonth > 0 && eDate.getMonth() === currentMonth - 1 && eDate.getFullYear() === currentYear)
      ) {
        lastMonthTotal += exp.amount;
      }
    });

    const highestCategory = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b, 'None');
    
    const percentageChange = lastMonthTotal > 0 
      ? (((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1) 
      : 0;

    let insightMessage = "You're spending smartly!";
    if (percentageChange > 0) {
      insightMessage = `You spent ${percentageChange}% more overall this month. Highest spending category: ${highestCategory}.`;
    } else if (percentageChange < 0) {
      insightMessage = `Great job! You spent ${Math.abs(percentageChange)}% less this month compared to last month.`;
    }

    res.json({ 
      expenses, 
      budgets, 
      insights: {
        message: insightMessage,
        highestCategory,
        percentageChange
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started with Socket.io on port ${PORT}`));
