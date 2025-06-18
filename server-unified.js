require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err.message);
  console.error('Stack:', err.stack);
  // Don't exit - just log
});

process.on('unhandledRejection', (err) => {
  console.error('🚨 UNHANDLED REJECTION:', err);
  // Don't exit - just log
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Express error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// In-memory storage for testing (without MongoDB)
let expenses = [];
let payments = []; // Track completed payments
let idCounter = 1;
let paymentIdCounter = 1;

// ===== HELPER FUNCTIONS =====

function normalizeName(name) {
  if (!name || typeof name !== 'string') return name;
  // Trim whitespace and convert to proper case (first letter uppercase, rest lowercase)
  return name.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function getAllPeople() {
  const peopleSet = new Set();
  expenses.forEach(expense => {
    peopleSet.add(normalizeName(expense.paid_by));
    expense.split_among.forEach(split => peopleSet.add(normalizeName(split.person)));
  });
  return Array.from(peopleSet);
}

function calculatePersonBalance(personName) {
  let totalPaid = 0;
  let totalShare = 0;
  const normalizedPersonName = normalizeName(personName);
  
  expenses.forEach(expense => {
    if (normalizeName(expense.paid_by) === normalizedPersonName) {
      totalPaid += expense.amount;
    }
    const personSplit = expense.split_among.find(split => normalizeName(split.person) === normalizedPersonName);
    if (personSplit) {
      totalShare += personSplit.share;
    }
  });
  
  return {
    total_paid: Math.round(totalPaid * 100) / 100,
    total_share: Math.round(totalShare * 100) / 100,
    balance: Math.round((totalPaid - totalShare) * 100) / 100
  };
}

function calculateSettlements() {
  const people = getAllPeople();
  const balances = {};
  
  people.forEach(person => {
    const balance = calculatePersonBalance(person);
    balances[person] = balance.balance;
  });
  
  // Apply completed payments to balances
  payments.forEach(payment => {
    const normalizedFrom = normalizeName(payment.from);
    const normalizedTo = normalizeName(payment.to);
    
    if (balances[normalizedFrom] !== undefined) {
      balances[normalizedFrom] += payment.amount; // Reduce debt
    }
    if (balances[normalizedTo] !== undefined) {
      balances[normalizedTo] -= payment.amount; // Reduce what they're owed
    }
  });
  
  const settlements = [];
  const creditors = [];
  const debtors = [];
  
  Object.entries(balances).forEach(([person, balance]) => {
    if (balance > 0.01) {
      creditors.push({ person, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ person, amount: Math.abs(balance) });
    }
  });
  
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const settlementAmount = Math.min(creditor.amount, debtor.amount);
    
    if (settlementAmount > 0.01) {
      settlements.push({
        from: debtor.person,
        to: creditor.person,
        amount: Math.round(settlementAmount * 100) / 100
      });
    }
    
    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;
    
    if (creditor.amount <= 0.01) i++;
    if (debtor.amount <= 0.01) j++;
  }
  
  return settlements;
}

// ===== API ROUTES =====

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Split App Backend is healthy!',
    timestamp: new Date().toISOString(),
    environment: 'test'
  });
});

// Get all people
app.get('/people', (req, res) => {
  try {
    console.log('📋 Getting people...');
    const people = getAllPeople();
    console.log('✅ People found:', people);
    res.json({
      success: true,
      data: people.map(name => ({ name })),
      count: people.length,
      message: 'People retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting people:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving people',
      error: error.message
    });
  }
});

// Get all expenses
app.get('/expenses', (req, res) => {
  try {
    res.json({
      success: true,
      data: expenses,
      count: expenses.length,
      message: 'Expenses retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving expenses',
      error: error.message
    });
  }
});

// Add expense
app.post('/expenses', (req, res) => {
  try {
    const { amount, description, paid_by, split_among, split_type = 'equal' } = req.body;
    
    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required and must be positive'
      });
    }
    
    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }
    
    if (!paid_by || paid_by.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Paid by is required'
      });
    }
    
    if (!split_among || !Array.isArray(split_among) || split_among.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Split among is required and must be a non-empty array'
      });
    }
    
    let finalSplitAmong;
    
    if (split_type === 'custom') {
      // Handle custom splits - split_among should already be in {person, share} format
      finalSplitAmong = split_among.map(split => ({
        person: normalizeName(split.person),
        share: Number(split.share)
      }));
      
      // Validate total
      const totalCustom = finalSplitAmong.reduce((sum, split) => sum + split.share, 0);
      if (Math.abs(totalCustom - amount) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Custom split amounts (₹${totalCustom}) must equal the total expense amount (₹${amount})`
        });
      }
    } else {
      // Calculate equal splits
      const sharePerPerson = Math.round((amount / split_among.length) * 100) / 100;
      finalSplitAmong = split_among.map(person => ({
        person: normalizeName(person),
        share: sharePerPerson
      }));
      
      // Handle rounding difference
      const totalCalculated = finalSplitAmong.reduce((sum, split) => sum + split.share, 0);
      const difference = Math.round((amount - totalCalculated) * 100) / 100;
      if (difference !== 0) {
        finalSplitAmong[0].share += difference;
        finalSplitAmong[0].share = Math.round(finalSplitAmong[0].share * 100) / 100;
      }
    }
    
    const expense = {
      id: idCounter++,
      amount: Number(amount),
      description: description.trim(),
      paid_by: normalizeName(paid_by.trim()),
      split_among: finalSplitAmong,
      split_type: split_type,
      category: req.body.category || 'General',
      date: new Date(),
      createdAt: new Date()
    };
    
    expenses.push(expense);
    
    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding expense',
      error: error.message
    });
  }
});

// Get balances
app.get('/balances', (req, res) => {
  try {
    const people = getAllPeople();
    
    if (people.length === 0) {
      return res.json({
        success: true,
        data: {},
        message: 'No expenses found, no balances to calculate'
      });
    }
    
    const balances = {};
    people.forEach(person => {
      const balance = calculatePersonBalance(person);
      balances[person] = balance;
    });
    
    // Apply completed payments to balances (same logic as settlements)
    payments.forEach(payment => {
      const normalizedFrom = normalizeName(payment.from);
      const normalizedTo = normalizeName(payment.to);
      
      if (balances[normalizedFrom]) {
        balances[normalizedFrom].balance += payment.amount; // Reduce debt
      }
      if (balances[normalizedTo]) {
        balances[normalizedTo].balance -= payment.amount; // Reduce what they're owed
      }
    });
    
    res.json({
      success: true,
      data: balances,
      message: 'Balances calculated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating balances',
      error: error.message
    });
  }
});

// Get settlements
app.get('/settlements', (req, res) => {
  try {
    console.log('🧮 Calculating settlements...');
    const settlements = calculateSettlements();
    console.log('✅ Settlements calculated:', settlements);
    res.json({
      success: true,
      data: settlements,
      count: settlements.length,
      message: 'Settlements calculated successfully'
    });
  } catch (error) {
    console.error('❌ Error calculating settlements:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating settlements',
      error: error.message
    });
  }
});

// Mark settlement as paid (convenience endpoint)
app.post('/settlements/:settlementId/pay', (req, res) => {
  try {
    const { settlementId } = req.params;
    const { description } = req.body;
    // Parse settlement ID to get from and to
    // Format: settlement_<from>_<to>
    if (!settlementId || !settlementId.startsWith('settlement_')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settlement ID format'
      });
    }
    const parts = settlementId.replace('settlement_', '').split('_');
    if (parts.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settlement ID format'
      });
    }
    // Defensive: join all but last as from, last as to (handles underscores in names)
    const from = normalizeName(parts[0]);
    const to = normalizeName(parts.slice(1).join('_'));
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settlement participants'
      });
    }
    // Find the current settlement amount
    const settlements = calculateSettlements();
    const settlement = settlements.find(s => normalizeName(s.from) === from && normalizeName(s.to) === to);
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found or already paid'
      });
    }
    // Record the payment
    const payment = {
      id: paymentIdCounter++,
      from: from,
      to: to,
      amount: settlement.amount,
      description: description || `Settlement payment: ${from} → ${to}`,
      date: new Date(),
      createdAt: new Date()
    };
    payments.push(payment);
    res.status(201).json({
      success: true,
      data: payment,
      message: `Payment recorded: ${from} paid ${to} ₹${settlement.amount}`
    });
  } catch (error) {
    console.error('Error in /settlements/:settlementId/pay:', error); // Add logging
    res.status(500).json({
      success: false,
      message: 'Error recording settlement payment',
      error: error.message
    });
  }
});

// Record payment
app.post('/payments', (req, res) => {
  try {
    const { from, to, amount, description } = req.body;
    
    // Validation
    if (!from || !to || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'From, to, and positive amount are required'
      });
    }
    
    if (normalizeName(from) === normalizeName(to)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot pay yourself'
      });
    }
    
    const payment = {
      id: paymentIdCounter++,
      from: normalizeName(from.trim()),
      to: normalizeName(to.trim()),
      amount: Number(amount),
      description: description ? description.trim() : `Payment from ${normalizeName(from)} to ${normalizeName(to)}`,
      date: new Date(),
      createdAt: new Date()
    };
    
    payments.push(payment);
    
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
});

// Get payments
app.get('/payments', (req, res) => {
  try {
    res.json({
      success: true,
      data: payments,
      count: payments.length,
      message: 'Payments retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving payments',
      error: error.message
    });
  }
});

// Delete payment (undo)
app.delete('/payments/:id', (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    
    if (paymentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    const removedPayment = payments.splice(paymentIndex, 1)[0];
    
    res.json({
      success: true,
      data: removedPayment,
      message: 'Payment undone successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error undoing payment',
      error: error.message
    });
  }
});

// Reset data endpoint for testing
app.post('/reset-data', (req, res) => {
  expenses = [];
  payments = [];
  idCounter = 1;
  paymentIdCounter = 1;
  
  res.json({
    success: true,
    message: 'All data reset successfully'
  });
});

// Add clean test data endpoint - WITH ERROR HANDLING
app.post('/add-test-data', (req, res) => {
  try {
    console.log('🧪 Adding test data...');
    
    // Reset first
    expenses = [];
    payments = [];
    idCounter = 1;
    paymentIdCounter = 1;
    
    // Add clean test expenses with consistent names
    const testExpenses = [
      {
        id: idCounter++,
        amount: 600,
        description: "Dinner at restaurant",
        paid_by: "Shantanu",
        split_among: [
          { person: "Shantanu", share: 200 },
          { person: "Sanket", share: 200 },
          { person: "Om", share: 200 }
        ],
        split_type: "equal",
        category: "Food",
        date: "2024-01-15T00:00:00.000Z",
        createdAt: "2024-01-15T00:00:00.000Z"
      },
      {
        id: idCounter++,
        amount: 450,
        description: "Groceries",
        paid_by: "Sanket", 
        split_among: [
          { person: "Shantanu", share: 150 },
          { person: "Sanket", share: 150 },
          { person: "Om", share: 150 }
        ],
        split_type: "equal",
        category: "Food",
        date: "2024-01-16T00:00:00.000Z",
        createdAt: "2024-01-16T00:00:00.000Z"
      },
      {
        id: idCounter++,
        amount: 300,
        description: "Petrol",
        paid_by: "Om",
        split_among: [
          { person: "Shantanu", share: 100 },
          { person: "Sanket", share: 100 },
          { person: "Om", share: 100 }
        ],
        split_type: "equal", 
        category: "Transport",
        date: "2024-01-17T00:00:00.000Z",
        createdAt: "2024-01-17T00:00:00.000Z"
      }
    ];
    
    expenses.push(...testExpenses);
    
    console.log('✅ Test data added successfully');
    
    res.json({
      success: true,
      data: {
        expenses_added: testExpenses.length,
        expenses: testExpenses
      },
      message: 'Clean test data added successfully'
    });
  } catch (error) {
    console.error('❌ Error adding test data:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding test data',
      error: error.message
    });
  }
});

// Serve the main web interface at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'professional.html'));
});

// Error handling - must be last
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Split App Backend (Unified) running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Web interface: http://localhost:${PORT}/`);
  console.log(`💡 Using in-memory storage for testing`);
  console.log(`🧪 Use /add-test-data endpoint to add clean test data`);
});