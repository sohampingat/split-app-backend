// Calculate balances for each person based on expenses
exports.calculateBalances = (expenses) => {
  const balances = {};
  
  expenses.forEach(expense => {
    // Person who paid gets positive balance
    balances[expense.paid_by] = (balances[expense.paid_by] || 0) + expense.amount;
    
    // Each person in splits gets negative balance for their share
    expense.splits.forEach(split => {
      balances[split.person] = (balances[split.person] || 0) - split.share;
    });
  });
  
  // Round to 2 decimal places to avoid floating point precision issues
  Object.keys(balances).forEach(person => {
    balances[person] = Math.round(balances[person] * 100) / 100;
  });
  
  return balances;
};

// Simplify debts to minimize number of transactions
exports.simplifyDebts = (balances) => {
  const debtors = [];
  const creditors = [];
  
  // Separate people into debtors (owe money) and creditors (owed money)
  for (const [person, amount] of Object.entries(balances)) {
    if (amount < -0.01) { // Small threshold to handle floating point precision
      debtors.push({ person, amount: Math.abs(amount) });
    } else if (amount > 0.01) {
      creditors.push({ person, amount });
    }
  }
  
  // Sort for consistent results
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  
  const settlements = [];
  
  while (debtors.length && creditors.length) {
    const debtor = debtors.shift();
    const creditor = creditors.shift();
    
    const settleAmount = Math.min(debtor.amount, creditor.amount);
    
    settlements.push({
      from: debtor.person,
      to: creditor.person,
      amount: Math.round(settleAmount * 100) / 100
    });
    
    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;
    
    // If there's remaining amount, put back in appropriate array
    if (debtor.amount > 0.01) {
      debtors.unshift(debtor);
    }
    if (creditor.amount > 0.01) {
      creditors.unshift(creditor);
    }
  }
  
  return settlements;
};

// Helper function to create equal splits
exports.createEqualSplits = (amount, people) => {
  const sharePerPerson = Math.round((amount / people.length) * 100) / 100;
  const splits = people.map(person => ({
    person,
    share: sharePerPerson
  }));
  
  // Handle any rounding difference by adjusting the last person's share
  const totalSplit = splits.reduce((sum, split) => sum + split.share, 0);
  const difference = Math.round((amount - totalSplit) * 100) / 100;
  
  if (difference !== 0) {
    splits[splits.length - 1].share += difference;
    splits[splits.length - 1].share = Math.round(splits[splits.length - 1].share * 100) / 100;
  }
  
  return splits;
};