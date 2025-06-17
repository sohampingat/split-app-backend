const ExpenseClean = require('../models/ExpenseClean');
const { 
  calculateSettlements, 
  calculatePersonBalance, 
  getAllPeopleFromExpenses 
} = require('../utils/settlement');

// Get all people derived from expenses
const getPeople = async (req, res) => {
  try {
    const expenses = await ExpenseClean.find();
    const people = getAllPeopleFromExpenses(expenses);
    
    // Calculate balances for each person
    const peopleWithBalances = people.map(person => {
      const balance = calculatePersonBalance(expenses, person);
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving people',
      error: error.message
    });
  }
};

// Get balances for all people
const getBalances = async (req, res) => {
  try {
    const expenses = await ExpenseClean.find();
    
    if (expenses.length === 0) {
      return res.json({
        success: true,
        data: {},
        message: 'No expenses found, no balances to calculate'
      });
    }
    
    const people = getAllPeopleFromExpenses(expenses);
    const balances = {};
    
    people.forEach(person => {
      const balance = calculatePersonBalance(expenses, person);
      balances[person] = balance;
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
};

// Get settlement summary (optimized transactions)
const getSettlements = async (req, res) => {
  try {
    const expenses = await ExpenseClean.find();
    
    if (expenses.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No expenses found, no settlements needed'
      });
    }
    
    const people = getAllPeopleFromExpenses(expenses);
    const balances = {};
    
    // Calculate balances
    people.forEach(person => {
      const balance = calculatePersonBalance(expenses, person);
      balances[person] = balance.balance;
    });
    
    // Calculate optimized settlements
    const settlements = calculateSettlements(balances);
    
    // Calculate summary statistics
    const totalOwed = Object.values(balances)
      .filter(balance => balance > 0)
      .reduce((sum, balance) => sum + balance, 0);
    
    res.json({
      success: true,
      data: settlements,
      summary: {
        total_settlements: settlements.length,
        total_amount_to_settle: Math.round(totalOwed * 100) / 100,
        people_involved: people.length
      },
      message: 'Settlements calculated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating settlements',
      error: error.message
    });
  }
};

module.exports = {
  getPeople,
  getBalances,
  getSettlements
};