require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for testing (without MongoDB)
let expenses = [];
let payments = []; // Track completed payments
let idCounter = 1;
let paymentIdCounter = 1;

// Helper functions
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
        id: `settlement_${debtor.person}_${creditor.person}`,
        from: debtor.person,
        to: creditor.person,
        amount: Math.round(settlementAmount * 100) / 100,
        status: 'pending'
      });
      
      creditor.amount -= settlementAmount;
      debtor.amount -= settlementAmount;
    }
    
    if (creditor.amount <= 0.01) i++;
    if (debtor.amount <= 0.01) j++;
  }
  
  return settlements;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Split App Backend is healthy!',
    timestamp: new Date().toISOString(),
    environment: 'test'
  });
});

// Expense routes
app.get('/expenses', (req, res) => {
  res.json({
    success: true,
    data: expenses,
    count: expenses.length,
    message: 'Expenses retrieved successfully'
  });
});

app.post('/expenses', (req, res) => {
  try {
    const { amount, description, paid_by, split_among = [], split_type = 'equal', split_details = {} } = req.body;
    
    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
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
    
    // Process split based on type
    let finalSplitAmong = [];
    const people = split_among.length > 0 ? split_among : [paid_by];
    
    switch (split_type) {
      case 'equal':
        // Equal split (default)
        const sharePerPerson = amount / people.length;
        finalSplitAmong = people.map(person => ({
              person: person.trim(),
              share: Math.round(sharePerPerson * 100) / 100
            }));
        
        // Handle rounding - add remainder to payer
        const totalCalculated = finalSplitAmong.reduce((sum, split) => sum + split.share, 0);
        const remainder = Math.round((amount - totalCalculated) * 100) / 100;
        if (remainder !== 0) {
          const payerSplit = finalSplitAmong.find(split => split.person === paid_by.trim());
          if (payerSplit) {
            payerSplit.share = Math.round((payerSplit.share + remainder) * 100) / 100;
          }
        }
        break;
        
      case 'percentage':
        // Validate percentages
        const totalPercentage = Object.values(split_details).reduce((sum, pct) => sum + Number(pct), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          return res.status(400).json({
            success: false,
            message: `Percentages must add up to 100%. Current total: ${totalPercentage}%`
          });
        }
        
        finalSplitAmong = Object.entries(split_details).map(([person, percentage]) => ({
          person: person.trim(),
          share: Math.round((amount * Number(percentage) / 100) * 100) / 100
        }));
        break;
        
      case 'exact':
        // Validate exact amounts
        const totalExact = Object.values(split_details).reduce((sum, amt) => sum + Number(amt), 0);
        if (Math.abs(totalExact - amount) > 0.01) {
          return res.status(400).json({
            success: false,
            message: `Exact amounts must add up to total amount ₹${amount}. Current total: ₹${totalExact}`
          });
        }
        
        finalSplitAmong = Object.entries(split_details).map(([person, exactAmount]) => ({
          person: person.trim(),
          share: Number(exactAmount)
        }));
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'split_type must be "equal", "percentage", or "exact"'
        });
    }
    
    const expense = {
      id: idCounter++,
      amount: Number(amount),
      description: description.trim(),
      paid_by: normalizeName(paid_by.trim()),
      split_among: finalSplitAmong.map(split => ({
        person: normalizeName(split.person),
        share: split.share
      })),
      split_type: split_type,
      split_details: split_type !== 'equal' ? split_details : null,
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

app.put('/expenses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const expenseIndex = expenses.findIndex(exp => exp.id === id);
    
    if (expenseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    const updates = req.body;
    const expense = expenses[expenseIndex];
    
    // Update expense
    if (updates.amount) expense.amount = Number(updates.amount);
    if (updates.description) expense.description = updates.description.trim();
    if (updates.paid_by) expense.paid_by = updates.paid_by.trim();
    if (updates.category) expense.category = updates.category;
    
    // Recalculate split if needed
    if (updates.amount || updates.split_among) {
      const people = updates.split_among || expense.split_among.map(s => s.person);
      const sharePerPerson = expense.amount / people.length;
      expense.split_among = people.map(person => ({
        person: person.trim ? person.trim() : person,
        share: Math.round(sharePerPerson * 100) / 100
      }));
    }
    
    res.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating expense',
      error: error.message
    });
  }
});

app.delete('/expenses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const expenseIndex = expenses.findIndex(exp => exp.id === id);
    
    if (expenseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    const deletedExpense = expenses.splice(expenseIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedExpense,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting expense',
      error: error.message
    });
  }
});

// Settlement routes
app.get('/people', (req, res) => {
  const people = getAllPeople();
  const peopleWithBalances = people.map(person => {
    const balance = calculatePersonBalance(person);
    return {
      name: person,
      ...balance,
      status: balance.balance > 0 ? 'owed' : balance.balance < 0 ? 'owes' : 'settled'
    };
  });
  
  res.json({
    success: true,
    data: peopleWithBalances,
    count: people.length,
    message: 'People retrieved successfully'
  });
});

app.get('/balances', (req, res) => {
  if (expenses.length === 0) {
    return res.json({
      success: true,
      data: {},
      message: 'No expenses found, no balances to calculate'
    });
  }
  
  const people = getAllPeople();
  const balances = {};
  
  people.forEach(person => {
    balances[person] = calculatePersonBalance(person);
  });
  
  res.json({
    success: true,
    data: balances,
    message: 'Balances calculated successfully'
  });
});

app.get('/settlements', (req, res) => {
  if (expenses.length === 0) {
    return res.json({
      success: true,
      data: [],
      message: 'No expenses found, no settlements needed'
    });
  }
  
  const settlements = calculateSettlements();
  const people = getAllPeople();
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  res.json({
    success: true,
    data: settlements,
    summary: {
      total_settlements: settlements.length,
      total_amount_to_settle: settlements.reduce((sum, s) => sum + s.amount, 0),
      people_involved: people.length,
      total_expenses: expenses.length,
      total_amount: Math.round(totalAmount * 100) / 100,
      total_payments_made: payments.length,
      total_amount_paid: payments.reduce((sum, p) => sum + p.amount, 0)
    },
    message: 'Settlements calculated successfully'
  });
});

// Payment routes
app.post('/payments', (req, res) => {
  try {
    const { from, to, amount, description } = req.body;
    
    // Validation
    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        message: 'From, to, and amount are required'
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }
    
    if (from === to) {
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

app.get('/payments', (req, res) => {
  res.json({
    success: true,
    data: payments,
    count: payments.length,
    message: 'Payments retrieved successfully'
  });
});

app.delete('/payments/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const paymentIndex = payments.findIndex(payment => payment.id === id);
    
    if (paymentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    const deletedPayment = payments.splice(paymentIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedPayment,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting payment',
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
    const parts = settlementId.replace('settlement_', '').split('_');
    if (parts.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settlement ID format'
      });
    }
    
    const from = parts[0];
    const to = parts.slice(1).join('_'); // Handle names with underscores
    
    // Find the current settlement amount
    const settlements = calculateSettlements();
    const settlement = settlements.find(s => s.from === from && s.to === to);
    
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
    res.status(500).json({
      success: false,
      message: 'Error recording settlement payment',
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

// Add clean test data endpoint
app.post('/add-test-data', (req, res) => {
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
      date: new Date("2024-01-15"),
      createdAt: new Date("2024-01-15")
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
      date: new Date("2024-01-16"),
      createdAt: new Date("2024-01-16")
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
      date: new Date("2024-01-17"),
      createdAt: new Date("2024-01-17")
    }
  ];
  
  expenses.push(...testExpenses);
  
  res.json({
    success: true,
    data: {
      expenses_added: testExpenses.length,
      expenses: testExpenses
    },
    message: 'Clean test data added successfully'
  });
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
  console.log(`🚀 Split App Backend (Test Mode) running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Web interface: http://localhost:${PORT}/`);
  console.log(`💡 Using in-memory storage for testing`);
});

// Add sample data - commented out for manual testing
// Use /add-test-data endpoint instead for clean data
console.log('💡 Server ready! Use /add-test-data endpoint to add clean test data');
console.log('🌐 Web interface: http://localhost:3000/professional.html');