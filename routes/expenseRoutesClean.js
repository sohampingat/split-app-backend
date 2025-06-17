const express = require('express');
const router = express.Router();
const {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseById
} = require('../controllers/expenseControllerClean');
const { validateExpense, validateUpdateExpense } = require('../utils/validation');

// GET /expenses - Get all expenses
router.get('/', getExpenses);

// POST /expenses - Add new expense
router.post('/', validateExpense, addExpense);

// GET /expenses/:id - Get expense by ID
router.get('/:id', getExpenseById);

// PUT /expenses/:id - Update expense
router.put('/:id', validateUpdateExpense, updateExpense);

// DELETE /expenses/:id - Delete expense
router.delete('/:id', deleteExpense);

module.exports = router;