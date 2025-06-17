const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");

// Simple routes (no auth for demo)
router.post("/", expenseController.addExpense);
router.get("/", expenseController.getExpenses);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

module.exports = router;
