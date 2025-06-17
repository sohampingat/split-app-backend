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
    event.target.classList.add('active');
    
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
            balances = balanceData.balances || {};
            updateQuickBalance();
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
        const personBalances = balances[person];
        if (personBalances && personBalances.length > 0) {
            personBalances.forEach(balance => {
                const isPositive = balance.type === 'owed';
                balanceHtml += `
                    <div class="balance-item ${isPositive ? 'positive' : 'negative'}">
                        <h4>${person}</h4>
                        <div class="balance-amount">
                            ${isPositive ? '+' : '-'}₹${Math.abs(balance.amount).toFixed(2)}
                        </div>
                        <small>${isPositive ? 'is owed' : 'owes'}</small>
                    </div>
                `;
            });
        }
    });
    
    container.innerHTML = balanceHtml || '<p class="no-data">No balances to show.</p>';
}

// Handle add expense form submission
async function handleAddExpense(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const expenseData = {
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        paid_by: formData.get('paid_by').trim(),
        split_among: formData.get('split_among').split(',').map(name => name.trim()).filter(name => name),
        category: formData.get('category') || 'General'
    };
    
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
            balances = result.balances || {};
            settlements = result.settlements || [];
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
        const personBalances = balances[person];
        if (personBalances && personBalances.length > 0) {
            personBalances.forEach(balance => {
                const isPositive = balance.type === 'owed';
                balanceHtml += `
                    <div class="balance-item ${isPositive ? 'positive' : 'negative'}">
                        <h4>${person}</h4>
                        <div class="balance-amount">
                            ${isPositive ? '+' : '-'}₹${Math.abs(balance.amount).toFixed(2)}
                        </div>
                        <p>${isPositive ? 'is owed by others' : 'owes to others'}</p>
                    </div>
                `;
            });
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
    
    container.innerHTML = settlements.map(settlement => `
        <div class="settlement-item">
            <p><strong>${settlement.from}</strong> should pay <strong>₹${settlement.amount.toFixed(2)}</strong> to <strong>${settlement.to}</strong></p>
        </div>
    `).join('');
}

// Refresh expenses
async function refreshExpenses() {
    await loadAllExpenses();
    showNotification('Expenses refreshed!');
}

// Error handling for failed image loads or missing icons
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
    }
}, true);