// API Configuration - Use relative URLs to avoid CORS issues
const API_BASE_URL = '';

// Global state
let expenses = [];
let balances = {};
let settlements = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    document.getElementById('expense-form').addEventListener('submit', handleAddExpense);
    
    // Load initial data
    loadDashboardData();
});

// Tab switching
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Find and activate the correct tab button
        const buttons = document.querySelectorAll('.tab-btn');
        buttons.forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(`showTab('${tabName}')`)) {
                btn.classList.add('active');
            }
        });
    }
    
    // Load tab-specific data
    switch(tabName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'balances':
            loadBalances();
            break;
        case 'expenses':
            loadAllExpenses();
            break;
    }
}

// Show/Hide loading spinner
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Show notification
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notification-message');
    
    messageEl.textContent = message;
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.style.display = 'flex';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    document.getElementById('notification').style.display = 'none';
}

// API call helper
async function apiCall(url, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_BASE_URL}${url}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        showLoading();
        
        // Load expenses
        const expensesData = await apiCall('/expenses');
        if (expensesData.success) {
            expenses = expensesData.data || [];
            updateDashboardStats();
            updateRecentExpenses();
        }
        
        // Load balances
        const balanceData = await apiCall('/balances');
        if (balanceData.success) {
            balances = balanceData.data || {};
            updateQuickBalance();
        }
        
        // Load settlements
        const settlementsData = await apiCall('/settlements');
        if (settlementsData.success) {
            settlements = settlementsData.data || [];
            updateSettlementSuggestions();
        }
        
    } catch (error) {
        showNotification('Failed to load dashboard data: ' + error.message, true);
    } finally {
        hideLoading();
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const uniquePeople = new Set();
    
    expenses.forEach(expense => {
        uniquePeople.add(expense.paid_by);
        if (expense.splits) {
            expense.splits.forEach(split => uniquePeople.add(split.person));
        }
    });
    
    document.getElementById('total-expenses').textContent = totalExpenses;
    document.getElementById('total-people').textContent = uniquePeople.size;
    document.getElementById('total-amount').textContent = `₹${totalAmount.toFixed(2)}`;
}

// Update recent expenses
function updateRecentExpenses() {
    const container = document.getElementById('recent-expenses-list');
    
    if (expenses.length === 0) {
        container.innerHTML = '<p class="no-data">No expenses yet. Add your first expense!</p>';
        return;
    }
    
    const recentExpenses = expenses.slice(-5).reverse(); // Last 5 expenses
    
    container.innerHTML = recentExpenses.map(expense => `
        <div class="expense-item">
            <div class="expense-details">
                <div>
                    <h4>${expense.description}</h4>
                    <div class="expense-meta">
                        Paid by ${expense.paid_by} • ${new Date(expense.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                </div>
                <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

// Update quick balance
function updateQuickBalance() {
    const container = document.getElementById('quick-balance-list');
    
    if (Object.keys(balances).length === 0) {
        container.innerHTML = '<p class="no-data">No balances to show.</p>';
        return;
    }
    
    let balanceHtml = '';
    Object.keys(balances).forEach(person => {
        const personBalance = balances[person];
        if (personBalance) {
            const isPositive = personBalance.balance > 0;
            const isZero = Math.abs(personBalance.balance) < 0.01;
            
            // Format the balance display like: Shantanu: +₹150 (paid ₹600, owes ₹450)
            balanceHtml += `
                <div class="balance-item ${isPositive ? 'positive' : isZero ? 'zero' : 'negative'}">
                    <div class="balance-header">
                        <h4>${person}</h4>
                        <div class="balance-amount">
                            ${isZero ? '₹0.00' : (isPositive ? '+' : '')}${isZero ? '' : '₹' + personBalance.balance.toFixed(2)}
                        </div>
                    </div>
                    <div class="balance-details">
                        ${isZero ? 'settled' : (isPositive ? 'is owed by others' : 'owes to others')}
                        <br>
                        <small>Paid: ₹${personBalance.total_paid.toFixed(2)} | Share: ₹${personBalance.total_share.toFixed(2)}</small>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = balanceHtml || '<p class="no-data">No balances to show.</p>';
}

// Handle add expense form submission
async function handleAddExpense(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const splitType = formData.get('split_type') || 'equal';
    
    let expenseData = {
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        paid_by: formData.get('paid_by').trim(),
        category: formData.get('category') || 'General',
        split_type: splitType
    };
    
    // Handle different split types
    if (splitType === 'equal') {
        expenseData.split_among = formData.get('split_among').split(',').map(name => name.trim()).filter(name => name);
    } else if (splitType === 'custom') {
        // Collect custom split data
        const customSplits = [];
        const splitRows = document.querySelectorAll('.custom-split-row');
        let totalCustomAmount = 0;
        
        splitRows.forEach(row => {
            const person = row.querySelector('.split-person').value.trim();
            const amount = parseFloat(row.querySelector('.split-amount').value);
            
            if (person && amount > 0) {
                customSplits.push({ person: person, share: amount });
                totalCustomAmount += amount;
            }
        });
        
        // Validate custom split amounts
        if (Math.abs(totalCustomAmount - expenseData.amount) > 0.01) {
            showNotification(`Custom split amounts (₹${totalCustomAmount.toFixed(2)}) must equal the total expense amount (₹${expenseData.amount.toFixed(2)})`, true);
            return;
        }
        
        expenseData.split_among = customSplits;
    }
    
    // Validation
    if (!expenseData.description || !expenseData.amount || !expenseData.paid_by || expenseData.split_among.length === 0) {
        showNotification('Please fill in all required fields', true);
        return;
    }
    
    if (expenseData.amount <= 0) {
        showNotification('Amount must be greater than 0', true);
        return;
    }
    
    try {
        showLoading();
        
        const result = await apiCall('/expenses', 'POST', expenseData);
        
        if (result.success) {
            showNotification('Expense added successfully!');
            document.getElementById('expense-form').reset();
            
            // Refresh data
            await loadDashboardData();
            
            // Switch to dashboard
            showTab('dashboard');
        } else {
            throw new Error(result.message || 'Failed to add expense');
        }
        
    } catch (error) {
        showNotification('Failed to add expense: ' + error.message, true);
    } finally {
        hideLoading();
    }
}

// Load all expenses
async function loadAllExpenses() {
    try {
        showLoading();
        
        const result = await apiCall('/expenses');
        
        if (result.success) {
            expenses = result.data || [];
            updateAllExpensesList();
        } else {
            throw new Error(result.message || 'Failed to load expenses');
        }
        
    } catch (error) {
        showNotification('Failed to load expenses: ' + error.message, true);
    } finally {
        hideLoading();
    }
}

// Update all expenses list
function updateAllExpensesList() {
    const container = document.getElementById('expenses-list');
    
    if (expenses.length === 0) {
        container.innerHTML = '<p class="no-data">No expenses yet.</p>';
        return;
    }
    
    const sortedExpenses = [...expenses].sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    
    container.innerHTML = sortedExpenses.map(expense => {
        const splits = expense.splits || [];
        const splitText = splits.length > 0 
            ? splits.map(split => `${split.person}: ₹${split.share.toFixed(2)}`).join(', ')
            : 'No splits available';
            
        return `
            <div class="expense-item">
                <div class="expense-details">
                    <div>
                        <h4>${expense.description}</h4>
                        <div class="expense-meta">
                            Paid by ${expense.paid_by} • ${new Date(expense.createdAt || Date.now()).toLocaleDateString()}
                            <br>
                            <strong>Splits:</strong> ${splitText}
                            ${expense.category ? `<br><strong>Category:</strong> ${expense.category}` : ''}
                        </div>
                    </div>
                    <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Load balances
async function loadBalances() {
    try {
        showLoading();
        
        const result = await apiCall('/balances');
        
        if (result.success) {
            balances = result.data || {};
            // Also load settlements
            const settlementsResult = await apiCall('/settlements');
            settlements = settlementsResult.success ? settlementsResult.data || [] : [];
            updateBalancesList();
            updateSettlementSuggestions();
        } else {
            throw new Error(result.message || 'Failed to load balances');
        }
        
    } catch (error) {
        showNotification('Failed to load balances: ' + error.message, true);
    } finally {
        hideLoading();
    }
}

// Update balances list  
function updateBalancesList() {
    const container = document.getElementById('balance-list');
    
    if (Object.keys(balances).length === 0) {
        container.innerHTML = '<p class="no-data">No balances to show. Add some expenses first!</p>';
        return;
    }
    
    let balanceHtml = '';
    Object.keys(balances).forEach(person => {
        const personBalance = balances[person];
        if (personBalance) {
            const isPositive = personBalance.balance > 0;
            const isZero = Math.abs(personBalance.balance) < 0.01;
            
            balanceHtml += `
                <div class="balance-item ${isPositive ? 'positive' : isZero ? 'zero' : 'negative'}">
                    <div class="balance-header">
                        <h4>${person}</h4>
                        <div class="balance-amount">
                            ${isZero ? '₹0.00' : (isPositive ? '+' : '')}${isZero ? '' : '₹' + personBalance.balance.toFixed(2)}
                        </div>
                    </div>
                    <div class="balance-details">
                        <p>${isZero ? 'settled' : (isPositive ? 'is owed by others' : 'owes to others')}</p>
                        <small>Paid: ₹${personBalance.total_paid.toFixed(2)} | Share: ₹${personBalance.total_share.toFixed(2)}</small>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = balanceHtml || '<p class="no-data">No balances to show.</p>';
}

// Update settlement suggestions
function updateSettlementSuggestions() {
    const container = document.getElementById('settlement-list');
    
    if (settlements.length === 0) {
        container.innerHTML = '<p class="no-data">No settlements needed yet.</p>';
        return;
    }
    
    container.innerHTML = settlements.map((settlement, index) => `
        <div class="settlement-item">
            <div class="settlement-info">
                <p><strong>${settlement.from}</strong> should pay <strong>₹${settlement.amount.toFixed(2)}</strong> to <strong>${settlement.to}</strong></p>
            </div>
            <div class="settlement-actions">
                <button class="btn-primary btn-small" onclick="markSettlementAsPaid('${settlement.from}', '${settlement.to}', ${settlement.amount})">
                    Mark as Paid
                </button>
            </div>
        </div>
    `).join('');
}

// Mark settlement as paid
async function markSettlementAsPaid(from, to, amount) {
    try {
        showLoading();
        
        const paymentData = {
            from: from,
            to: to,
            amount: amount,
            description: `Settlement payment: ${from} paid ${to}`
        };
        
        const result = await apiCall('/payments', 'POST', paymentData);
        
        if (result.success) {
            console.log(`💰 Payment recorded successfully: ${from} → ${to}: ₹${amount}`);
            showNotification(`✅ Payment recorded: ${from} paid ₹${amount.toFixed(2)} to ${to}!`);
            
            // Refresh ALL data to ensure everything is updated
            console.log('🔄 Refreshing dashboard data...');
            await loadDashboardData();
            
            // Also refresh specific components that might be visible
            console.log('🔄 Refreshing all components...');
            await refreshAllComponents();
            
            console.log('✅ All data refreshed after payment');
            
        } else {
            throw new Error(result.message || 'Failed to record payment');
        }
        
    } catch (error) {
        showNotification('Failed to record payment: ' + error.message, true);
    } finally {
        hideLoading();
    }
}

// Refresh expenses
async function refreshExpenses() {
    await loadAllExpenses();
    showNotification('Expenses refreshed!');
}

// Refresh all components after a payment
async function refreshAllComponents() {
    try {
        // Check which tabs are currently active and refresh accordingly
        if (document.getElementById('balances').classList.contains('active')) {
            await loadBalances();
        }
        
        if (document.getElementById('expenses').classList.contains('active')) {
            await loadAllExpenses();
        }
        
        // Note: Payment tab refresh would go here if needed
        
        // Always refresh dashboard stats (visible on all pages)
        const balanceData = await apiCall('/balances');
        if (balanceData.success) {
            balances = balanceData.data || {};
            updateQuickBalance();
        }
        
        const settlementsData = await apiCall('/settlements');
        if (settlementsData.success) {
            settlements = settlementsData.data || [];
            updateSettlementSuggestions();
        }
        
    } catch (error) {
        console.error('Error refreshing components:', error);
    }
}

// Toggle between equal and custom split inputs
function toggleSplitInput() {
    const splitType = document.getElementById('split_type').value;
    const equalSection = document.getElementById('equal-split-section');
    const customSection = document.getElementById('custom-split-section');
    
    if (splitType === 'equal') {
        equalSection.style.display = 'block';
        customSection.style.display = 'none';
        document.getElementById('split_among').required = true;
    } else {
        equalSection.style.display = 'none';
        customSection.style.display = 'block';
        document.getElementById('split_among').required = false;
        
        // Initialize with first row if empty
        const customInputs = document.getElementById('custom-split-inputs');
        if (customInputs.children.length <= 1) { // Only has the small text
            addCustomSplitRow();
        }
    }
}

// Add a new row for custom split
function addCustomSplitRow() {
    const container = document.getElementById('custom-split-inputs');
    const rowCount = container.querySelectorAll('.custom-split-row').length;
    
    const row = document.createElement('div');
    row.className = 'custom-split-row';
    row.innerHTML = `
        <div class="split-row-inputs">
            <input type="text" class="split-person" placeholder="Person name" required>
            <input type="number" class="split-amount" placeholder="Amount ₹" step="0.01" min="0" required>
            <button type="button" class="btn-danger btn-small" onclick="removeCustomSplitRow(this)">×</button>
        </div>
    `;
    
    container.appendChild(row);
}

// Remove a custom split row
function removeCustomSplitRow(button) {
    const container = document.getElementById('custom-split-inputs');
    const rows = container.querySelectorAll('.custom-split-row');
    
    if (rows.length > 1) {
        button.closest('.custom-split-row').remove();
    } else {
        showNotification('At least one person must be included in the split', true);
    }
}

// Error handling for failed image loads or missing icons
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
    }
}, true);