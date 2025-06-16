const Expense = require("../models/Expense");
const { calculateBalances, simplifyDebts } = require("../utils/settlementCalculator");

exports.getPeople = async (req, res) => {
  try {
    const expenses = await Expense.find();
    const people = new Set();
    expenses.forEach(e => {
      people.add(e.paid_by);
      e.splits.forEach(s => people.add(s.person));
    });
    res.json({ success: true, data: [...people] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBalances = async (req, res) => {
  try {
    const expenses = await Expense.find();
    const balances = calculateBalances(expenses);
    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSettlements = async (req, res) => {
  try {
    const expenses = await Expense.find();
    const balances = calculateBalances(expenses);
    const settlements = simplifyDebts(balances);
    res.json({ success: true, data: settlements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
