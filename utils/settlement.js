/**
 * Settlement Calculator
 * Calculates who owes money to whom and provides optimized settlement suggestions
 */

function calculateSettlements(balances) {
  const settlements = [];
  
  // Convert balances to arrays of creditors and debtors
  const creditors = []; // People who are owed money
  const debtors = [];   // People who owe money
  
  Object.entries(balances).forEach(([person, balance]) => {
    if (balance > 0.01) { // Owed money (creditor)
      creditors.push({ person, amount: balance });
    } else if (balance < -0.01) { // Owes money (debtor)
      debtors.push({ person, amount: Math.abs(balance) });
    }
  });
  
  // Sort to optimize settlements
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  
  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    // Calculate settlement amount
    const settlementAmount = Math.min(creditor.amount, debtor.amount);
    
    if (settlementAmount > 0.01) {
      settlements.push({
        from: debtor.person,
        to: creditor.person,
        amount: Math.round(settlementAmount * 100) / 100
      });
      
      // Update amounts
      creditor.amount -= settlementAmount;
      debtor.amount -= settlementAmount;
    }
    
    // Move to next creditor or debtor
    if (creditor.amount <= 0.01) i++;
    if (debtor.amount <= 0.01) j++;
  }
  
  return settlements;
}

function calculatePersonBalance(expenses, personName) {
  let totalPaid = 0;
  let totalShare = 0;
  
  expenses.forEach(expense => {
    // Amount paid by this person
    if (expense.paid_by === personName) {
      totalPaid += expense.amount;
    }
    
    // This person's share of the expense
    const personSplit = expense.split_among.find(split => split.person === personName);
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

function getAllPeopleFromExpenses(expenses) {
  const peopleSet = new Set();
  
  expenses.forEach(expense => {
    peopleSet.add(expense.paid_by);
    expense.split_among.forEach(split => {
      peopleSet.add(split.person);
    });
  });
  
  return Array.from(peopleSet);
}

module.exports = {
  calculateSettlements,
  calculatePersonBalance,
  getAllPeopleFromExpenses
};