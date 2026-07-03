/* ============================================================
   PERSONAL EXPENSE MANAGEMENT WEB APP — v2.1
   Behavioral nudges, streaks, animations, insights
   ============================================================ */

// ==================== GOOGLE SHEETS SYNC ====================

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxQKG6GZrL14es1vtRXN6A-h60JjkgN2WIQlbO7mLsX92SdczGTemnKtU911ij7jBd2Fg/exec';

/**
 * Send expense data to Google Sheets in the background.
 * Does not block the UI — fires and forgets.
 * If offline, queues the data for later sync.
 */
function syncToGoogleSheets(expense) {
    const payload = {
        date: expense.date,
        amount: expense.amount,
        reason: expense.reason,
        category: expense.category,
        account: expense.account
    };

    fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => {
        // If offline, queue for later
        console.log('Sync failed, queuing:', err);
        queueForSync(payload);
    });
}

/**
 * Queue failed syncs to retry later when online.
 */
function queueForSync(payload) {
    const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
    queue.push(payload);
    localStorage.setItem('sync_queue', JSON.stringify(queue));
}

/**
 * Retry any queued syncs (called when app loads and is online).
 */
function retrySyncQueue() {
    const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
    if (queue.length === 0) return;

    // Try to sync each queued item
    const remaining = [];
    queue.forEach(payload => {
        fetch(SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {
            remaining.push(payload);
        });
    });

    // Keep only failed ones
    setTimeout(() => {
        localStorage.setItem('sync_queue', JSON.stringify(remaining));
    }, 3000);
}

// Retry queued syncs when app loads and is online
if (navigator.onLine) {
    retrySyncQueue();
}
window.addEventListener('online', retrySyncQueue);

// ==================== STORAGE ====================

const STORAGE_KEY = 'expenses';
const BUDGET_KEY = 'budgets';
const FINANCES_KEY = 'finances';
const GOALS_KEY = 'goals';
const STREAK_KEY = 'streak_data';
const FIXED_KEY = 'fixed_expenses';

const CATEGORIES = [
    'Food', 'Grocery', 'Electronics', 'Gym', 'Fuel',
    'Shopping', 'Travel', 'Entertainment', 'Bills',
    'Investment', 'Medical', 'Subscription', 'Family', 'Others'
];

function getExpenses() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveExpenses(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function getBudgets() {
    const data = localStorage.getItem(BUDGET_KEY);
    return data ? JSON.parse(data) : {};
}

function saveBudgets(budgets) {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
}

function getFinances() {
    const data = localStorage.getItem(FINANCES_KEY);
    return data ? JSON.parse(data) : {
        income: 114000,
        bank: 113000,
        investments: 184034
    };
}

function saveFinances(finances) {
    localStorage.setItem(FINANCES_KEY, JSON.stringify(finances));
}

function getFixedExpenses() {
    const data = localStorage.getItem(FIXED_KEY);
    return data ? JSON.parse(data) : [
        { name: 'Rent', amount: 15750, category: 'Bills' },
        { name: 'Education Loan EMI', amount: 19000, category: 'Bills' },
        { name: 'Brother', amount: 2000, category: 'Family' },
        { name: 'Father', amount: 4000, category: 'Family' },
        { name: 'PPFAS Flexi Cap', amount: 2500, category: 'Investment' },
        { name: 'UTI Nifty 50', amount: 2500, category: 'Investment' },
        { name: 'Bandhan Small Cap', amount: 2500, category: 'Investment' },
        { name: 'Nippon Gold BeES', amount: 1000, category: 'Investment' },
        { name: 'PPF', amount: 2000, category: 'Investment' },
        { name: 'RD', amount: 2000, category: 'Investment' },
        { name: 'Water', amount: 700, category: 'Bills' },
        { name: 'Electricity', amount: 1300, category: 'Bills' },
        { name: 'Appliance Rent', amount: 900, category: 'Bills' },
        { name: 'Netflix', amount: 199, category: 'Subscription' },
        { name: 'YouTube Premium', amount: 65, category: 'Subscription' },
        { name: 'WiFi (quarterly avg)', amount: 1100, category: 'Bills' },
        { name: 'Bike Service (quarterly avg)', amount: 600, category: 'Others' }
    ];
}

function saveFixedExpenses(items) {
    localStorage.setItem(FIXED_KEY, JSON.stringify(items));
}

function getFixedTotal() {
    return getFixedExpenses().reduce((sum, item) => sum + item.amount, 0);
}

function getGoals() {
    const data = localStorage.getItem(GOALS_KEY);
    return data ? JSON.parse(data) : [
        { name: 'Emergency Fund', target: 600000, current: 0 },
        { name: 'Investment Goal', target: 1000000, current: 184034 },
        { name: 'Europe Trip', target: 250000, current: 0 },
        { name: 'Loan Free', target: 1739311, current: 0 }
    ];
}

function saveGoals(goals) {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ==================== STREAK TRACKING ====================

function getStreakData() {
    const data = localStorage.getItem(STREAK_KEY);
    return data ? JSON.parse(data) : { lastDate: '', count: 0 };
}

function updateStreak() {
    const streak = getStreakData();
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    if (streak.lastDate === today) {
        // Already tracked today, no change
        return streak.count;
    } else if (streak.lastDate === yesterday) {
        // Consecutive day — increment
        streak.count += 1;
        streak.lastDate = today;
    } else if (streak.lastDate === '') {
        // First ever entry
        streak.count = 1;
        streak.lastDate = today;
    } else {
        // Streak broken — reset to 1
        streak.count = 1;
        streak.lastDate = today;
    }

    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
    return streak.count;
}

function getCurrentStreak() {
    const streak = getStreakData();
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    // If last entry was today or yesterday, streak is alive
    if (streak.lastDate === today || streak.lastDate === yesterday) {
        return streak.count;
    }
    return 0;
}

function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayDateString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ==================== DATE HELPERS ====================

function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function getCurrentMonth() {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
}

function getMonthName(monthIndex) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
}

function getTodayFormatted() {
    return formatDate(new Date());
}

// ==================== EXPENSE OPERATIONS ====================

function addExpense(amount, reason, category, account) {
    const expenses = getExpenses();
    const expense = {
        id: generateId(),
        date: formatDate(new Date()),
        amount: parseFloat(amount),
        reason: reason || '',
        category: category || '',
        account: account || ''
    };
    expenses.push(expense);
    saveExpenses(expenses);

    // Sync to Google Sheets (background, non-blocking)
    syncToGoogleSheets(expense);

    return expense;
}

function deleteExpense(id) {
    const expenses = getExpenses();
    saveExpenses(expenses.filter(exp => exp.id !== id));
}

function getCurrentMonthExpenses() {
    const expenses = getExpenses();
    const { month, year } = getCurrentMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthStr = months[month];
    const currentYearStr = String(year);

    return expenses.filter(exp => {
        const parts = exp.date.split(' ');
        return parts[1] === currentMonthStr && parts[2] === currentYearStr;
    });
}

function getTodayExpenses() {
    const today = getTodayFormatted();
    return getExpenses().filter(exp => exp.date === today);
}

function getCategorySpending() {
    const expenses = getCurrentMonthExpenses();
    const spending = {};
    expenses.forEach(exp => {
        const cat = exp.category || 'Others';
        spending[cat] = (spending[cat] || 0) + exp.amount;
    });
    return spending;
}

// ==================== FORMAT HELPERS ====================

function formatINR(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
}

// ==================== SMART DEFAULTS ====================

function getSuggestedCategory() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'Food';
    if (hour >= 11 && hour < 15) return 'Food';
    if (hour >= 19 && hour < 22) return 'Food';
    return '';
}

function getLastUsedAccount() {
    const expenses = getExpenses();
    if (expenses.length === 0) return '';
    return expenses[expenses.length - 1].account || '';
}

// ==================== ANIMATIONS ====================

/**
 * Animate a number counting up from 0 to target value.
 */
function animateNumber(element, targetValue, prefix = '₹', duration = 600) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (targetValue - start) * eased);

        element.textContent = prefix + Number(current).toLocaleString('en-IN');

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Animate percentage counting up.
 */
function animatePercent(element, targetValue, duration = 600) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(targetValue * eased);
        element.textContent = current + '%';

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ==================== EXPORT ====================

function exportAsCSV() {
    const expenses = getCurrentMonthExpenses();
    if (expenses.length === 0) return null;

    let csv = 'Date,Amount,Reason,Category,Account\n';
    expenses.forEach(exp => {
        const reason = exp.reason.includes(',') ? `"${exp.reason}"` : exp.reason;
        csv += `${exp.date},${exp.amount},${reason},${exp.category},${exp.account}\n`;
    });
    return csv;
}

function exportAsMarkdown() {
    const expenses = getCurrentMonthExpenses();
    if (expenses.length === 0) return null;

    let md = '| Date | Amount | Reason | Category | Account |\n';
    md += '|------|--------|--------|----------|---------|\n';
    expenses.forEach(exp => {
        md += `| ${exp.date} | ₹${exp.amount} | ${exp.reason} | ${exp.category} | ${exp.account} |\n`;
    });

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    md += `\n**Total: ₹${total.toLocaleString('en-IN')}**\n`;
    md += `**Entries: ${expenses.length}**\n`;
    return md;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ==================== NAVIGATION ====================

const pages = ['entry', 'history', 'budget', 'summary', 'export'];

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

    document.getElementById(`page-${page}`).classList.add('active');
    document.getElementById(`nav-${page}`).classList.add('active');

    if (page === 'entry') updateEntryPage();
    if (page === 'history') renderHistory();
    if (page === 'budget') renderBudget();
    if (page === 'summary') renderSummary();
}

pages.forEach(page => {
    document.getElementById(`nav-${page}`).addEventListener('click', () => showPage(page));
});

// ==================== ENTRY PAGE ====================

const expenseForm = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const reasonInput = document.getElementById('reason');
const successMessage = document.getElementById('success-message');

let selectedCategory = '';
let selectedAccount = '';

// Chip selection
function setupChips() {
    const categoryChips = document.querySelectorAll('#category-chips .chip');
    const accountChips = document.querySelectorAll('#account-chips .chip');

    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            categoryChips.forEach(c => c.classList.remove('selected'));
            if (selectedCategory === chip.dataset.value) {
                selectedCategory = '';
            } else {
                chip.classList.add('selected');
                selectedCategory = chip.dataset.value;
            }
            // Show budget warning if near limit
            checkBudgetWarning();
        });
    });

    accountChips.forEach(chip => {
        chip.addEventListener('click', () => {
            accountChips.forEach(c => c.classList.remove('selected'));
            if (selectedAccount === chip.dataset.value) {
                selectedAccount = '';
            } else {
                chip.classList.add('selected');
                selectedAccount = chip.dataset.value;
            }
        });
    });

    // Smart defaults
    const suggestedCat = getSuggestedCategory();
    if (suggestedCat) {
        const catChip = document.querySelector(`#category-chips .chip[data-value="${suggestedCat}"]`);
        if (catChip) {
            catChip.classList.add('selected');
            selectedCategory = suggestedCat;
        }
    }

    const lastAccount = getLastUsedAccount();
    if (lastAccount) {
        const accChip = document.querySelector(`#account-chips .chip[data-value="${lastAccount}"]`);
        if (accChip) {
            accChip.classList.add('selected');
            selectedAccount = lastAccount;
        }
    }
}

setupChips();

// Budget warning when category is near limit
function checkBudgetWarning() {
    const warningEl = document.getElementById('budget-warning');
    const warningText = document.getElementById('budget-warning-text');

    if (!selectedCategory) {
        warningEl.classList.add('hidden');
        return;
    }

    const budgets = getBudgets();
    const budget = budgets[selectedCategory];
    if (!budget) {
        warningEl.classList.add('hidden');
        return;
    }

    const spending = getCategorySpending();
    const spent = spending[selectedCategory] || 0;
    const percent = (spent / budget) * 100;

    if (percent >= 90) {
        warningText.textContent = `⚠️ ${selectedCategory}: ${Math.round(percent)}% of budget used (${formatINR(spent)}/${formatINR(budget)})`;
        warningEl.classList.remove('hidden');
    } else if (percent >= 75) {
        warningText.textContent = `${selectedCategory}: ${Math.round(percent)}% of budget used`;
        warningEl.classList.remove('hidden');
        warningEl.style.background = 'var(--warning-dim)';
        warningEl.style.borderColor = 'rgba(255, 183, 77, 0.2)';
        warningEl.style.color = 'var(--warning)';
    } else {
        warningEl.classList.add('hidden');
    }
}

// Entry page stats
function updateEntryPage() {
    const todayExpenses = getTodayExpenses();
    const monthExpenses = getCurrentMonthExpenses();
    const { month } = getCurrentMonth();
    const finances = getFinances();

    const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    document.getElementById('today-total').textContent = formatINR(todayTotal);
    document.getElementById('entry-month-total').textContent = formatINR(monthTotal);
    document.getElementById('entry-month-label').textContent = getMonthName(month);

    // Streak
    const streak = getCurrentStreak();
    document.getElementById('streak-badge').textContent = streak > 0 ? `🔥 ${streak} day${streak > 1 ? 's' : ''}` : '🔥 Start tracking!';

    // Daily insight: compare today vs daily average
    const insightEl = document.getElementById('daily-insight');
    const dayOfMonth = new Date().getDate();
    const dailyAvg = dayOfMonth > 1 ? monthTotal / (dayOfMonth - 1) : 0;

    if (monthExpenses.length > 0 && dayOfMonth > 1) {
        if (todayTotal < dailyAvg) {
            const saved = dailyAvg - todayTotal;
            insightEl.innerHTML = `<span class="below-avg">↓ ${formatINR(Math.round(saved))} below your daily average of ${formatINR(Math.round(dailyAvg))}</span>`;
        } else if (todayTotal > dailyAvg) {
            const over = todayTotal - dailyAvg;
            insightEl.innerHTML = `<span class="above-avg">↑ ${formatINR(Math.round(over))} above your daily average of ${formatINR(Math.round(dailyAvg))}</span>`;
        } else {
            insightEl.innerHTML = `<span>On par with daily average: ${formatINR(Math.round(dailyAvg))}</span>`;
        }
    } else {
        insightEl.innerHTML = '';
    }

    // Savings nudge
    const saved = Math.max(0, finances.income - getFixedTotal() - monthTotal);
    const nudgeEl = document.getElementById('savings-nudge');
    const nudgeText = document.getElementById('savings-nudge-text');
    if (saved > 0) {
        nudgeText.textContent = `You've saved ${formatINR(saved)} this month so far`;
        nudgeEl.classList.remove('hidden');
    } else {
        nudgeEl.classList.add('hidden');
    }

    checkBudgetWarning();

    // Render today's transactions
    renderTodayTransactions();
}

function renderTodayTransactions() {
    const todayExpenses = getTodayExpenses();
    const list = document.getElementById('today-tx-list');
    const count = document.getElementById('today-tx-count');

    count.textContent = todayExpenses.length;

    if (todayExpenses.length === 0) {
        list.innerHTML = '<p class="today-tx-empty">No entries today yet.</p>';
        return;
    }

    const reversed = [...todayExpenses].reverse();
    list.innerHTML = reversed.map(exp => `
        <div class="today-tx-item">
            <div class="today-tx-left">
                <span class="today-tx-reason">${exp.reason || exp.category || 'Expense'}</span>
                <span class="today-tx-meta">${exp.category ? exp.category : ''}${exp.account ? ' · ' + exp.account : ''}</span>
            </div>
            <span class="today-tx-amount">${formatINR(exp.amount)}</span>
        </div>
    `).join('');
}

updateEntryPage();

// Form submit
expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const amount = amountInput.value.trim();
    if (!amount || parseFloat(amount) <= 0) {
        amountInput.focus();
        amountInput.parentElement.style.animation = 'shake 0.3s ease';
        setTimeout(() => amountInput.parentElement.style.animation = '', 300);
        return;
    }

    addExpense(amount, reasonInput.value.trim(), selectedCategory, selectedAccount);

    // Update streak
    updateStreak();

    // Success feedback
    successMessage.classList.remove('hidden');
    setTimeout(() => successMessage.classList.add('hidden'), 1200);

    // Reset (keep category and account sticky)
    amountInput.value = '';
    reasonInput.value = '';
    amountInput.focus();

    // Refresh stats
    updateEntryPage();
});

// ==================== HISTORY PAGE ====================

const CHART_COLORS = [
    '#6C63FF', '#00E676', '#FFB74D', '#FF5252', '#ab47bc',
    '#26c6da', '#ffee58', '#ec407a', '#8d6e63', '#78909c',
    '#7e57c2', '#29b6f6', '#9ccc65', '#ff7043'
];

function renderPieChart(expenses) {
    const chartContainer = document.getElementById('chart-container');
    const pieChart = document.getElementById('pie-chart');
    const chartLegend = document.getElementById('chart-legend');

    if (expenses.length === 0) {
        chartContainer.classList.add('hidden');
        return;
    }

    const categoryTotals = {};
    expenses.forEach(exp => {
        const cat = exp.category || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    });

    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, [, amount]) => sum + amount, 0);

    let cumulativeAngle = 0;
    let svgContent = '';

    if (sorted.length === 1) {
        svgContent = `<circle cx="100" cy="100" r="80" fill="${CHART_COLORS[0]}"/>`;
    } else {
        sorted.forEach(([, amount], index) => {
            const sliceAngle = (amount / total) * 360;
            const startRad = (cumulativeAngle - 90) * (Math.PI / 180);
            const endRad = (cumulativeAngle + sliceAngle - 90) * (Math.PI / 180);

            const x1 = 100 + 80 * Math.cos(startRad);
            const y1 = 100 + 80 * Math.sin(startRad);
            const x2 = 100 + 80 * Math.cos(endRad);
            const y2 = 100 + 80 * Math.sin(endRad);

            const largeArc = sliceAngle > 180 ? 1 : 0;
            const color = CHART_COLORS[index % CHART_COLORS.length];

            svgContent += `<path d="M100,100 L${x1},${y1} A80,80 0 ${largeArc},1 ${x2},${y2} Z" fill="${color}"/>`;
            cumulativeAngle += sliceAngle;
        });
    }

    pieChart.innerHTML = svgContent;

    chartLegend.innerHTML = sorted.map(([category, amount], index) => {
        const percent = ((amount / total) * 100).toFixed(0);
        const color = CHART_COLORS[index % CHART_COLORS.length];
        return `<div class="legend-item">
            <span class="legend-dot" style="background:${color}"></span>
            <span>${category}</span>
            <span class="legend-percent">${percent}%</span>
        </div>`;
    }).join('');

    chartContainer.classList.remove('hidden');
}

function renderInsights(expenses) {
    const insightsCard = document.getElementById('insights-card');

    if (expenses.length === 0) {
        insightsCard.classList.add('hidden');
        return;
    }

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const dayOfMonth = new Date().getDate();
    const dailyAvg = dayOfMonth > 0 ? total / dayOfMonth : 0;
    const highest = Math.max(...expenses.map(exp => exp.amount));

    // Top category
    const catSpending = {};
    expenses.forEach(exp => {
        const cat = exp.category || 'Others';
        catSpending[cat] = (catSpending[cat] || 0) + exp.amount;
    });
    const topCat = Object.entries(catSpending).sort((a, b) => b[1] - a[1])[0];

    document.getElementById('insight-daily-avg').textContent = formatINR(Math.round(dailyAvg));
    document.getElementById('insight-highest').textContent = formatINR(highest);
    document.getElementById('insight-top-cat').textContent = topCat ? topCat[0] : '-';
    document.getElementById('insight-count').textContent = expenses.length;

    insightsCard.classList.remove('hidden');
}

function renderHistory() {
    const expenses = getCurrentMonthExpenses();
    const historyList = document.getElementById('history-list');
    const totalAmount = document.getElementById('history-total-amount');
    const monthTitle = document.getElementById('history-month-title');

    const { month, year } = getCurrentMonth();
    monthTitle.textContent = `${getMonthName(month)} ${year}`;

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    totalAmount.textContent = formatINR(total);

    renderPieChart(expenses);
    renderInsights(expenses);

    if (expenses.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No expenses yet this month.</p>';
        return;
    }

    const reversed = [...expenses].reverse();
    historyList.innerHTML = reversed.map(exp => `
        <div class="history-item">
            <div class="history-item-left">
                <span class="history-item-reason">${exp.reason || exp.category || 'Expense'}</span>
                <span class="history-item-meta">${exp.date}${exp.category ? ' · ' + exp.category : ''}${exp.account ? ' · ' + exp.account : ''}</span>
            </div>
            <span class="history-item-amount">${formatINR(exp.amount)}</span>
            <button class="history-item-delete" onclick="handleDelete('${exp.id}')" aria-label="Delete expense">×</button>
        </div>
    `).join('');
}

function handleDelete(id) {
    if (confirm('Delete this expense?')) {
        deleteExpense(id);
        renderHistory();
    }
}

// ==================== BUDGET PAGE ====================

function renderBudget() {
    const budgets = getBudgets();
    const spending = getCategorySpending();

    let totalBudget = 0;
    let totalSpent = 0;

    CATEGORIES.forEach(cat => {
        if (budgets[cat]) totalBudget += budgets[cat];
        if (spending[cat]) totalSpent += spending[cat];
    });

    const remaining = totalBudget - totalSpent;
    const usedPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

    document.getElementById('budget-total').textContent = formatINR(totalBudget);
    document.getElementById('budget-spent').textContent = formatINR(totalSpent);
    document.getElementById('budget-remaining').textContent = formatINR(remaining);

    const progressBar = document.getElementById('budget-progress-bar');
    // Animate progress bar
    setTimeout(() => {
        progressBar.style.width = `${Math.min(usedPercent, 100)}%`;
    }, 50);
    progressBar.className = 'progress-bar';
    if (totalSpent > totalBudget) progressBar.classList.add('over');
    else if (usedPercent >= 80) progressBar.classList.add('warning');

    document.getElementById('budget-progress-text').textContent = `${usedPercent.toFixed(0)}% used`;

    const budgetList = document.getElementById('budget-list');
    const items = CATEGORIES
        .filter(cat => budgets[cat] > 0)
        .map(cat => {
            const budget = budgets[cat];
            const spent = spending[cat] || 0;
            const percent = Math.min((spent / budget) * 100, 100);
            const isOver = spent > budget;
            const barColor = isOver ? 'var(--danger)' : percent > 80 ? 'var(--warning)' : 'var(--accent)';
            const status = isOver ? `Over by ${formatINR(spent - budget)}` : `${formatINR(budget - spent)} left`;

            return `<div class="budget-item">
                <div class="budget-item-header">
                    <span class="budget-item-name">${cat}</span>
                    <span class="budget-item-amounts">${formatINR(spent)} / ${formatINR(budget)}</span>
                </div>
                <div class="budget-item-bar">
                    <div class="budget-item-bar-fill" style="width:${percent}%;background:${barColor}"></div>
                </div>
                <div class="budget-item-status" style="color:${isOver ? 'var(--danger)' : 'var(--text-muted)'}">${status}</div>
            </div>`;
        });

    budgetList.innerHTML = items.length === 0
        ? '<p class="empty-state">No budgets set. Tap "Edit" to set category limits.</p>'
        : items.join('');
}

// Budget Modal
document.getElementById('edit-budget-btn').addEventListener('click', () => {
    const budgets = getBudgets();
    document.getElementById('budget-form-fields').innerHTML = CATEGORIES.map(cat => `
        <div class="form-group">
            <label>${cat}</label>
            <input type="number" id="budget-${cat}" value="${budgets[cat] || ''}" placeholder="0" inputmode="decimal">
        </div>
    `).join('');
    document.getElementById('budget-modal').classList.remove('hidden');
});

document.getElementById('close-budget-modal').addEventListener('click', () => {
    document.getElementById('budget-modal').classList.add('hidden');
});

document.getElementById('save-budget-btn').addEventListener('click', () => {
    const budgets = {};
    CATEGORIES.forEach(cat => {
        const val = document.getElementById(`budget-${cat}`).value;
        if (val && parseFloat(val) > 0) budgets[cat] = parseFloat(val);
    });
    saveBudgets(budgets);
    document.getElementById('budget-modal').classList.add('hidden');
    renderBudget();
});

// ==================== SUMMARY PAGE ====================

function renderSummary() {
    const finances = getFinances();
    const expenses = getCurrentMonthExpenses();
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const netWorth = (finances.bank || 0) + (finances.investments || 0);
    const fixedTotal = getFixedTotal();
    const saved = Math.max(0, finances.income - fixedTotal - totalSpent);
    const savingsRate = finances.income > 0 ? (saved / finances.income) * 100 : 0;

    // Animate numbers
    animateNumber(document.getElementById('summary-networth'), netWorth);
    animateNumber(document.getElementById('summary-income'), finances.income);
    animateNumber(document.getElementById('summary-spent'), totalSpent);
    animateNumber(document.getElementById('summary-saved'), saved);
    animatePercent(document.getElementById('summary-savings-rate'), Math.max(0, Math.round(savingsRate)));

    // Finance section
    document.getElementById('fin-income').textContent = formatINR(finances.income);
    document.getElementById('fin-bank').textContent = formatINR(finances.bank);
    document.getElementById('fin-investments').textContent = formatINR(finances.investments);

    // Fixed expenses section
    renderFixedExpenses();

    renderGoals();
}

function renderGoals() {
    const goals = getGoals();
    const goalsList = document.getElementById('goals-list');

    if (goals.length === 0) {
        goalsList.innerHTML = '<p class="empty-state">No goals set yet.</p>';
        return;
    }

    goalsList.innerHTML = goals.map(goal => {
        const percent = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
        const remaining = Math.max(0, goal.target - goal.current);
        return `<div class="goal-item">
            <div class="goal-item-header">
                <span class="goal-item-name">${goal.name}</span>
                <span class="goal-item-percent">${percent.toFixed(0)}%</span>
            </div>
            <div class="goal-item-bar">
                <div class="goal-item-bar-fill" style="width:${percent}%"></div>
            </div>
            <div class="goal-item-details">
                <span>${formatINR(goal.current)} saved</span>
                <span>${formatINR(remaining)} to go</span>
            </div>
        </div>`;
    }).join('');
}

// Finances Modal
document.getElementById('edit-finances-btn').addEventListener('click', () => {
    const finances = getFinances();
    document.getElementById('fin-income-input').value = finances.income || '';
    document.getElementById('fin-bank-input').value = finances.bank || '';
    document.getElementById('fin-investments-input').value = finances.investments || '';
    document.getElementById('finances-modal').classList.remove('hidden');
});

document.getElementById('close-finances-modal').addEventListener('click', () => {
    document.getElementById('finances-modal').classList.add('hidden');
});

document.getElementById('save-finances-btn').addEventListener('click', () => {
    const finances = {
        income: parseFloat(document.getElementById('fin-income-input').value) || 0,
        bank: parseFloat(document.getElementById('fin-bank-input').value) || 0,
        investments: parseFloat(document.getElementById('fin-investments-input').value) || 0
    };
    saveFinances(finances);
    document.getElementById('finances-modal').classList.add('hidden');
    renderSummary();
});

// ==================== FIXED EXPENSES ====================

function renderFixedExpenses() {
    const items = getFixedExpenses();
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const investmentTotal = items.filter(i => i.category === 'Investment').reduce((sum, i) => sum + i.amount, 0);
    const expenseTotal = total - investmentTotal;
    const list = document.getElementById('fixed-expenses-list');

    document.getElementById('fixed-total-display').textContent = formatINR(total);

    if (items.length === 0) {
        list.innerHTML = '<div class="fixed-item"><span class="fixed-item-name" style="color:var(--text-muted)">No fixed expenses added.</span></div>';
        return;
    }

    // Separate investments from expenses
    const investments = items.filter(i => i.category === 'Investment');
    const expenses = items.filter(i => i.category !== 'Investment');

    let html = '';

    // Expenses section
    if (expenses.length > 0) {
        html += `<div class="fixed-section-label">Expenses <span>${formatINR(expenseTotal)}</span></div>`;
        html += expenses.map(item => `
            <div class="fixed-item">
                <div class="fixed-item-left">
                    <span class="fixed-item-name">${item.name}</span>
                    <span class="fixed-item-category">${item.category || ''}</span>
                </div>
                <span class="fixed-item-amount">${formatINR(item.amount)}</span>
            </div>
        `).join('');
    }

    // Investments section
    if (investments.length > 0) {
        html += `<div class="fixed-section-label investment">Investments <span>${formatINR(investmentTotal)}</span></div>`;
        html += investments.map(item => `
            <div class="fixed-item">
                <div class="fixed-item-left">
                    <span class="fixed-item-name">${item.name}</span>
                    <span class="fixed-item-category">${item.category}</span>
                </div>
                <span class="fixed-item-amount">${formatINR(item.amount)}</span>
            </div>
        `).join('');
    }

    list.innerHTML = html;
}

// Fixed Expenses Modal
document.getElementById('edit-fixed-btn').addEventListener('click', () => {
    renderFixedForm(getFixedExpenses());
    document.getElementById('fixed-modal').classList.remove('hidden');
});

document.getElementById('close-fixed-modal').addEventListener('click', () => {
    document.getElementById('fixed-modal').classList.add('hidden');
});

function renderFixedForm(items) {
    const formFields = document.getElementById('fixed-form-fields');
    formFields.innerHTML = items.map((item, i) => `
        <div class="fixed-form-row" data-index="${i}">
            <input type="text" class="fixed-name-input" value="${item.name}" placeholder="Name (e.g. Rent)">
            <input type="number" class="fixed-amount-input" value="${item.amount}" placeholder="₹" inputmode="decimal">
            <button type="button" class="fixed-delete-btn" onclick="removeFixedRow(${i})">×</button>
        </div>
        <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border);">
            <select class="fixed-category-input" style="width:100%;padding:8px 12px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-xs);color:var(--text-primary);font-size:0.8rem;font-family:var(--font);">
                <option value="Bills" ${item.category === 'Bills' ? 'selected' : ''}>Expense</option>
                <option value="Investment" ${item.category === 'Investment' ? 'selected' : ''}>Investment</option>
                <option value="Family" ${item.category === 'Family' ? 'selected' : ''}>Family</option>
                <option value="Subscription" ${item.category === 'Subscription' ? 'selected' : ''}>Subscription</option>
                <option value="Others" ${item.category === 'Others' ? 'selected' : ''}>Others</option>
            </select>
        </div>
    `).join('');
}

function removeFixedRow(index) {
    const items = collectFixedFormData();
    items.splice(index, 1);
    renderFixedForm(items);
}

document.getElementById('add-fixed-btn').addEventListener('click', () => {
    const items = collectFixedFormData();
    items.push({ name: '', amount: 0, category: '' });
    renderFixedForm(items);
    // Scroll to bottom of modal
    const modalBody = document.getElementById('fixed-form-fields');
    modalBody.scrollTop = modalBody.scrollHeight;
});

function collectFixedFormData() {
    const names = document.querySelectorAll('.fixed-name-input');
    const amounts = document.querySelectorAll('.fixed-amount-input');
    const categories = document.querySelectorAll('.fixed-category-input');
    const items = [];
    names.forEach((el, i) => {
        const name = el.value.trim();
        const amount = parseFloat(amounts[i].value) || 0;
        const category = categories[i] ? categories[i].value : 'Bills';
        if (name || amount > 0) {
            items.push({ name: name || 'Unnamed', amount, category });
        }
    });
    return items;
}

document.getElementById('save-fixed-btn').addEventListener('click', () => {
    const items = collectFixedFormData();
    saveFixedExpenses(items);
    document.getElementById('fixed-modal').classList.add('hidden');
    renderSummary();
});

// Goals Modal
document.getElementById('edit-goals-btn').addEventListener('click', () => {
    renderGoalForm(getGoals());
    document.getElementById('goals-modal').classList.remove('hidden');
});

document.getElementById('close-goals-modal').addEventListener('click', () => {
    document.getElementById('goals-modal').classList.add('hidden');
});

function renderGoalForm(goals) {
    document.getElementById('goals-form-fields').innerHTML = goals.map((goal, i) => `
        <div class="form-group" style="border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:12px;">
            <label>Goal ${i + 1}</label>
            <input type="text" class="goal-name-input" value="${goal.name}" placeholder="Goal name" style="margin-bottom:8px;">
            <input type="number" class="goal-target-input" value="${goal.target}" placeholder="Target amount" inputmode="decimal" style="margin-bottom:8px;">
            <input type="number" class="goal-current-input" value="${goal.current}" placeholder="Current progress" inputmode="decimal">
        </div>
    `).join('');
}

document.getElementById('add-goal-btn').addEventListener('click', () => {
    const goals = collectGoalFormData();
    goals.push({ name: '', target: 0, current: 0 });
    renderGoalForm(goals);
});

function collectGoalFormData() {
    const names = document.querySelectorAll('.goal-name-input');
    const targets = document.querySelectorAll('.goal-target-input');
    const currents = document.querySelectorAll('.goal-current-input');
    const goals = [];
    names.forEach((el, i) => {
        const name = el.value.trim();
        if (name) goals.push({ name, target: parseFloat(targets[i].value) || 0, current: parseFloat(currents[i].value) || 0 });
    });
    return goals;
}

document.getElementById('save-goals-btn').addEventListener('click', () => {
    saveGoals(collectGoalFormData());
    document.getElementById('goals-modal').classList.add('hidden');
    renderSummary();
});

// ==================== EXPORT & BACKUP ====================

document.getElementById('export-csv').addEventListener('click', () => {
    const csv = exportAsCSV();
    if (!csv) { alert('No expenses to export this month.'); return; }
    const { month, year } = getCurrentMonth();
    downloadFile(csv, `expenses_${getMonthName(month).toLowerCase()}_${year}.csv`, 'text/csv');
    document.getElementById('export-preview').classList.remove('hidden');
    document.getElementById('export-preview-content').textContent = csv;
});

document.getElementById('export-md').addEventListener('click', () => {
    const md = exportAsMarkdown();
    if (!md) { alert('No expenses to export this month.'); return; }
    const { month, year } = getCurrentMonth();
    downloadFile(md, `expenses_${getMonthName(month).toLowerCase()}_${year}.md`, 'text/markdown');
    document.getElementById('export-preview').classList.remove('hidden');
    document.getElementById('export-preview-content').textContent = md;
});

// Full Data Backup
document.getElementById('backup-all').addEventListener('click', () => {
    const backup = {
        version: '2.1',
        exportDate: new Date().toISOString(),
        expenses: getExpenses(),
        budgets: getBudgets(),
        finances: getFinances(),
        goals: getGoals(),
        fixedExpenses: getFixedExpenses(),
        streakData: JSON.parse(localStorage.getItem(STREAK_KEY) || '{}')
    };

    const content = JSON.stringify(backup, null, 2);
    const date = new Date().toISOString().split('T')[0]; // 2026-07-04
    downloadFile(content, `expense_backup_${date}.json`, 'application/json');

    alert(`Backup saved! Contains ${backup.expenses.length} expenses.`);
});

// Restore Data
document.getElementById('restore-all').addEventListener('click', () => {
    document.getElementById('restore-file-input').click();
});

document.getElementById('restore-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const backup = JSON.parse(event.target.result);

            // Validate it's a real backup
            if (!backup.expenses || !backup.version) {
                alert('This does not look like a valid backup file.');
                return;
            }

            // Confirm before overwriting
            const count = backup.expenses.length;
            const date = backup.exportDate ? new Date(backup.exportDate).toLocaleDateString() : 'unknown date';
            if (!confirm(`Restore backup from ${date}?\n\nThis contains ${count} expenses.\n\nThis will REPLACE all current data.`)) {
                return;
            }

            // Restore all data
            if (backup.expenses) saveExpenses(backup.expenses);
            if (backup.budgets) saveBudgets(backup.budgets);
            if (backup.finances) saveFinances(backup.finances);
            if (backup.goals) saveGoals(backup.goals);
            if (backup.fixedExpenses) saveFixedExpenses(backup.fixedExpenses);
            if (backup.streakData) localStorage.setItem(STREAK_KEY, JSON.stringify(backup.streakData));

            alert('Data restored successfully! The page will reload.');
            window.location.reload();
        } catch (err) {
            alert('Error reading file. Make sure it is a valid backup JSON file.');
        }
    };
    reader.readAsText(file);

    // Reset file input so same file can be selected again
    e.target.value = '';
});

// ==================== PWA ====================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('SW registered'))
            .catch(err => console.log('SW failed:', err));
    });
}
