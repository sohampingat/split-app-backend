const ExpenseClean = require('../models/ExpenseClean');

// Get all expenses
const getExpenses = async (req, res) => {
  try {
    const expenses = await ExpenseClean.find().sort({ createdAt: -1 });
    
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
};

// Add new expense
const addExpense = async (req, res) => {
  try {
    const { amount, description, paid_by, split_among, split_type, category, exact_shares, percentages } = req.body;
    
    // Process split_among
    let finalSplitAmong = [];
    
    if (split_type === 'equal') {
      // Equal split among specified people or just the payer
      const people = split_among && split_among.length > 0 ? split_among : [paid_by];
      const sharePerPerson = amount / people.length;
      
      finalSplitAmong = people.map(person => ({
        person: person.trim(),
        share: Math.round(sharePerPerson * 100) / 100
      }));
    } else if (split_type === 'exact' && exact_shares) {
      // Exact amounts specified
      finalSplitAmong = Object.entries(exact_shares).map(([person, share]) => ({
        person: person.trim(),
        share: Number(share)
      }));
      
      // Validate total
      const total = finalSplitAmong.reduce((sum, split) => sum + split.share, 0);
      if (Math.abs(total - amount) > 0.01) {
        return res.status(400).json({
          success: false,
          message: 'Total of exact shares must equal the expense amount'
        });
      }
    } else if (split_type === 'percentage' && percentages) {
      // Percentage split
      const totalPercentage = Object.values(percentages).reduce((sum, pct) => sum + pct, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({
          success: false,
          message: 'Percentages must add up to 100%'
        });
      }
      
      finalSplitAmong = Object.entries(percentages).map(([person, percentage]) => ({
        person: person.trim(),
        share: Math.round((amount * percentage / 100) * 100) / 100
      }));
    } else {
      // Default to equal split with payer only
      finalSplitAmong = [{
        person: paid_by,
        share: amount
      }];
    }
    
    const expense = new ExpenseClean({
      amount,
      description,
      paid_by,
      split_among: finalSplitAmong,
      split_type: split_type || 'equal',
      category: category || 'General'
    });
    
    await expense.save();
    
    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense added successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error adding expense',
      error: error.message
    });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await ExpenseClean.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Update fields
    const updates = req.body;
    
    // If amount or split info is being updated, recalculate splits
    if (updates.amount || updates.split_among || updates.split_type || updates.exact_shares || updates.percentages) {
      const { amount, split_among, split_type, exact_shares, percentages } = updates;
      const finalAmount = amount || expense.amount;
      
      if (split_type === 'equal') {
        const people = split_among || expense.split_among.map(s => s.person);
        const sharePerPerson = finalAmount / people.length;
        updates.split_among = people.map(person => ({
          person: person.trim ? person.trim() : person,
          share: Math.round(sharePerPerson * 100) / 100
        }));
      } else if (split_type === 'exact' && exact_shares) {
        updates.split_among = Object.entries(exact_shares).map(([person, share]) => ({
          person: person.trim(),
          share: Number(share)
        }));
      } else if (split_type === 'percentage' && percentages) {
        updates.split_among = Object.entries(percentages).map(([person, percentage]) => ({
          person: person.trim(),
          share: Math.round((finalAmount * percentage / 100) * 100) / 100
        }));
      }
    }
    
    const updatedExpense = await ExpenseClean.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      data: updatedExpense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating expense',
      error: error.message
    });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await ExpenseClean.findByIdAndDelete(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: expense,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting expense',
      error: error.message
    });
  }
};

// Get expense by ID
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await ExpenseClean.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: expense,
      message: 'Expense retrieved successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving expense',
      error: error.message
    });
  }
};

module.exports = {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseById
};