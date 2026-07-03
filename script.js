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
        action: 'add',
        date: expense.date,
        amount: expense.amount,
        reason: expense.reason,
        category: expense.category,
        account: expense.account,
        id: expense.id
    };

    fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => {
        console.log('Sync failed, queuing:', err);
        queueForSync(payload);
    });
}

/**
 * Mark an expense as deleted in Google Sheets.
 */
function syncDeleteToGoogleSheets(expenseId) {
    const payload = {
        action: 'delete',
        id: expenseId
    };

    fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => {
        console.log('Delete sync failed, queuing:', err);
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

    const promises = queue.map(payload =>
        fetch(SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(() => ({ status: 'synced' }))
         .catch(() => ({ status: 'failed', payload }))
    );

    Promise.all(promises).then(results => {
        const remaining = results
            .filter(r => r.status === 'failed')
            .map(r => r.payload);
        localStorage.setItem('sync_queue', JSON.stringify(remaining));
    });
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
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
}

function saveExpenses(expenses) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('Storage full. Please export a backup and clear old data from Settings.');
        }
    }
}

function getBudgets() {
    try {
        const data = localStorage.getItem(BUDGET_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) { return {}; }
}

function saveBudgets(budgets) {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
}

function getFinances() {
    try {
        const data = localStorage.getItem(FINANCES_KEY);
        return data ? JSON.parse(data) : { income: 114000, bank: 113000, investments: 185099 };
    } catch (e) { return { income: 114000, bank: 113000, investments: 185099 }; }
}

function saveFinances(finances) {
    localStorage.setItem(FINANCES_KEY, JSON.stringify(finances));
}

function getFixedExpenses() {
    try {
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
    } catch (e) { return []; }
}

function saveFixedExpenses(items) {
    localStorage.setItem(FIXED_KEY, JSON.stringify(items));
}

function getFixedTotal() {
    return getFixedExpenses().reduce((sum, item) => sum + item.amount, 0);
}

function getGoals() {
    try {
        const data = localStorage.getItem(GOALS_KEY);
        return data ? JSON.parse(data) : [
            { name: 'Emergency Fund', target: 600000, current: 0 },
            { name: 'Investment Goal', target: 1000000, current: 184034 },
            { name: 'Europe Trip', target: 250000, current: 0 },
            { name: 'Loan Free', target: 1739311, current: 0 }
        ];
    } catch (e) { return []; }
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

function addExpense(amount, reason, category, account, tags) {
    const expenses = getExpenses();
    const expense = {
        id: generateId(),
        date: formatDate(new Date()),
        amount: parseFloat(amount),
        reason: reason || '',
        category: category || '',
        account: account || '',
        tags: tags || ''
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

    // Mark as deleted in Google Sheets
    syncDeleteToGoogleSheets(id);
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

// Get last month's expenses for comparison
function getLastMonthExpenses() {
    const expenses = getExpenses();
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const targetMonth = months[lastMonth];
    const targetYear = String(lastYear);

    return expenses.filter(exp => {
        const parts = exp.date.split(' ');
        return parts[1] === targetMonth && parts[2] === targetYear;
    });
}

// Get last month's category spending
function getLastMonthCategorySpending() {
    const expenses = getLastMonthExpenses();
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

/**
 * Escape HTML to prevent XSS when inserting user text into innerHTML.
 */
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
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

const pages = ['entry', 'history', 'budget', 'summary', 'analytics', 'export', 'settings'];

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

    document.getElementById(`page-${page}`).classList.add('active');
    const navBtn = document.getElementById(`nav-${page}`);
    if (navBtn) navBtn.classList.add('active');

    if (page === 'entry') updateEntryPage();
    if (page === 'history') renderHistory();
    if (page === 'budget') renderBudget();
    if (page === 'summary') renderSummary();
    if (page === 'analytics') renderAnalytics();
    if (page === 'settings') renderSettings();
}

pages.forEach(page => {
    const navEl = document.getElementById(`nav-${page}`);
    if (navEl) navEl.addEventListener('click', () => showPage(page));
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

    // Spending velocity: project month-end spending
    const velocityEl = document.getElementById('velocity-insight');
    const velocityText = document.getElementById('velocity-text');
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    if (monthExpenses.length > 0 && dayOfMonth > 1) {
        const dailyRate = monthTotal / dayOfMonth;
        const projected = Math.round(dailyRate * daysInMonth);
        const budgets = getBudgets();
        const totalBudget = Object.values(budgets).reduce((sum, v) => sum + v, 0);

        if (totalBudget > 0) {
            if (projected > totalBudget) {
                velocityText.innerHTML = `<span class="over-pace">At this pace, you'll spend ${formatINR(projected)} by month end — ${formatINR(projected - totalBudget)} over budget</span>`;
            } else {
                velocityText.innerHTML = `<span class="on-track">Projected: ${formatINR(projected)} by month end — within budget</span>`;
            }
        } else {
            velocityText.innerHTML = `<span>Projected: ${formatINR(projected)} by month end</span>`;
        }
        velocityEl.classList.remove('hidden');
    } else {
        velocityEl.classList.add('hidden');
    }

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
                <span class="today-tx-reason">${escapeHTML(exp.reason || exp.category || 'Expense')}</span>
                <span class="today-tx-meta">${escapeHTML(exp.category)}${exp.account ? ' · ' + escapeHTML(exp.account) : ''}</span>
            </div>
            <span class="today-tx-amount">${formatINR(exp.amount)}</span>
        </div>
    `).join('');
}

updateEntryPage();

// ==================== AUTO-LOG FIXED EXPENSES ====================

const AUTOLOG_KEY = 'autolog_done';

/**
 * Check if fixed expenses have been auto-logged this month.
 * If not, show a prompt to auto-log them.
 */
function checkAutoLog() {
    const { month, year } = getCurrentMonth();
    const key = `${year}-${month}`;
    const done = JSON.parse(localStorage.getItem(AUTOLOG_KEY) || '{}');

    if (done[key]) return; // Already logged this month

    const fixedExpenses = getFixedExpenses();
    if (fixedExpenses.length === 0) return;

    // Show auto-log prompt
    showAutoLogPrompt(fixedExpenses, key);
}

function showAutoLogPrompt(fixedExpenses, monthKey) {
    const total = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);

    const prompt = document.createElement('div');
    prompt.className = 'autolog-prompt';
    prompt.id = 'autolog-prompt';
    prompt.innerHTML = `
        <div class="autolog-content">
            <span class="autolog-title">Log fixed expenses for this month?</span>
            <span class="autolog-detail">${fixedExpenses.length} items · ${formatINR(total)}</span>
            <div class="autolog-actions">
                <button id="autolog-skip" class="autolog-btn-skip">Skip</button>
                <button id="autolog-confirm" class="autolog-btn-confirm">Log All</button>
            </div>
        </div>
    `;

    document.getElementById('page-entry').insertBefore(prompt, document.getElementById('expense-form'));

    document.getElementById('autolog-confirm').addEventListener('click', () => {
        autoLogFixedExpenses(fixedExpenses, monthKey);
        prompt.remove();
    });

    document.getElementById('autolog-skip').addEventListener('click', () => {
        const done = JSON.parse(localStorage.getItem(AUTOLOG_KEY) || '{}');
        done[monthKey] = 'skipped';
        localStorage.setItem(AUTOLOG_KEY, JSON.stringify(done));
        prompt.remove();
    });
}

function autoLogFixedExpenses(fixedExpenses, monthKey) {
    const { month, year } = getCurrentMonth();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const firstOfMonth = `01 ${months[month]} ${year}`;

    // Batch: read once, push all, save once
    const expenses = getExpenses();
    fixedExpenses.forEach(item => {
        const expense = {
            id: generateId(),
            date: firstOfMonth,
            amount: item.amount,
            reason: item.name,
            category: item.category || 'Bills',
            account: '',
            auto: true
        };
        expenses.push(expense);
        syncToGoogleSheets(expense);
    });
    saveExpenses(expenses);

    // Mark as done
    const done = JSON.parse(localStorage.getItem(AUTOLOG_KEY) || '{}');
    done[monthKey] = 'logged';
    localStorage.setItem(AUTOLOG_KEY, JSON.stringify(done));

    updateEntryPage();
}

checkAutoLog();

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

    const tags = document.getElementById('tags-input').value.trim();
    addExpense(amount, reasonInput.value.trim(), selectedCategory, selectedAccount, tags);

    // Update streak
    const newStreak = updateStreak();

    // Pulse animation if streak incremented
    const streakEl = document.getElementById('streak-badge');
    streakEl.classList.add('streak-pulse');
    setTimeout(() => streakEl.classList.remove('streak-pulse'), 400);

    // Success feedback
    successMessage.classList.remove('hidden');
    setTimeout(() => successMessage.classList.add('hidden'), 1200);

    // Reset (keep category and account sticky)
    amountInput.value = '';
    reasonInput.value = '';
    document.getElementById('tags-input').value = '';
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

function renderMoMComparison(expenses) {
    const momEl = document.getElementById('mom-comparison');
    const momText = document.getElementById('mom-text');
    const lastMonthExpenses = getLastMonthExpenses();

    if (lastMonthExpenses.length === 0 || expenses.length === 0) {
        momEl.classList.add('hidden');
        return;
    }

    const currentTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const lastTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const diff = currentTotal - lastTotal;

    if (diff < 0) {
        momText.innerHTML = `<span class="mom-positive">↓ ${formatINR(Math.abs(diff))} less than last month</span>`;
    } else if (diff > 0) {
        momText.innerHTML = `<span class="mom-negative">↑ ${formatINR(diff)} more than last month</span>`;
    } else {
        momText.innerHTML = `<span>Same as last month</span>`;
    }
    momEl.classList.remove('hidden');
}

function renderCategoryTrends(expenses) {
    const trendsEl = document.getElementById('category-trends');
    const lastMonthSpending = getLastMonthCategorySpending();
    const currentSpending = getCategorySpending();

    // Only show if we have last month data
    if (Object.keys(lastMonthSpending).length === 0) {
        trendsEl.classList.add('hidden');
        return;
    }

    // Get categories that exist in either month
    const allCats = new Set([...Object.keys(currentSpending), ...Object.keys(lastMonthSpending)]);
    const trends = [];

    allCats.forEach(cat => {
        const current = currentSpending[cat] || 0;
        const last = lastMonthSpending[cat] || 0;
        if (last === 0 && current === 0) return;

        let percentChange = 0;
        if (last > 0) {
            percentChange = Math.round(((current - last) / last) * 100);
        } else if (current > 0) {
            percentChange = 100; // New category
        }

        if (Math.abs(percentChange) >= 10) { // Only show meaningful changes (10%+)
            trends.push({ cat, current, percentChange });
        }
    });

    if (trends.length === 0) {
        trendsEl.classList.add('hidden');
        return;
    }

    // Sort by absolute change (biggest movers first)
    trends.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));

    // Show top 5
    trendsEl.innerHTML = trends.slice(0, 5).map(t => {
        const isUp = t.percentChange > 0;
        return `<div class="trend-item">
            <div class="trend-item-left">
                <span class="trend-item-arrow ${isUp ? 'up' : 'down'}">${isUp ? '↑' : '↓'}${Math.abs(t.percentChange)}%</span>
                <span class="trend-item-name">${t.cat}</span>
            </div>
            <span class="trend-item-amount">${formatINR(t.current)}</span>
        </div>`;
    }).join('');

    trendsEl.classList.remove('hidden');
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
    renderMoMComparison(expenses);
    renderCategoryTrends(expenses);

    if (expenses.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No expenses yet this month.</p>';
        return;
    }

    const reversed = [...expenses].reverse();
    historyList.innerHTML = reversed.map(exp => `
        <div class="history-item">
            <div class="history-item-left">
                <span class="history-item-reason">${escapeHTML(exp.reason || exp.category || 'Expense')}</span>
                <span class="history-item-meta">${exp.date}${exp.category ? ' · ' + escapeHTML(exp.category) : ''}${exp.account ? ' · ' + escapeHTML(exp.account) : ''}</span>
            </div>
            <span class="history-item-amount">${formatINR(exp.amount)}</span>
            <button class="history-item-delete" onclick="handleDelete('${exp.id}')" aria-label="Delete expense">×</button>
        </div>
    `).join('');
}

let lastDeletedExpense = null;
let undoTimeout = null;

function handleDelete(id) {
    // Get the expense before deleting
    const expenses = getExpenses();
    lastDeletedExpense = expenses.find(exp => exp.id === id);

    // Delete it
    deleteExpense(id);
    renderHistory();

    // Show undo toast
    const undoToast = document.getElementById('undo-toast');
    undoToast.classList.remove('hidden');

    // Auto-dismiss after 4 seconds
    clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => {
        undoToast.classList.add('hidden');
        lastDeletedExpense = null;
    }, 4000);
}

// Undo button
document.getElementById('undo-btn').addEventListener('click', () => {
    if (lastDeletedExpense) {
        // Restore the expense
        const expenses = getExpenses();
        expenses.push(lastDeletedExpense);
        saveExpenses(expenses);
        syncToGoogleSheets(lastDeletedExpense); // Re-sync to sheet

        lastDeletedExpense = null;
        clearTimeout(undoTimeout);
        document.getElementById('undo-toast').classList.add('hidden');

        renderHistory();
    }
});

// ==================== BUDGET PAGE ====================

function renderBudget() {
    const budgets = getBudgets();
    const spending = getCategorySpending();

    let totalBudget = 0;
    let totalSpent = 0;

    CATEGORIES.forEach(cat => {
        if (budgets[cat]) {
            totalBudget += budgets[cat];
            // Only count spending in categories that HAVE a budget set
            if (spending[cat]) totalSpent += spending[cat];
        }
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
            const actualPercent = (spent / budget) * 100;
            const isOver = spent > budget;
            const barColor = isOver ? 'var(--negative)' : percent > 80 ? 'var(--warning)' : 'var(--accent)';
            const status = isOver ? `₹${(spent - budget).toLocaleString('en-IN')} over` : `₹${(budget - spent).toLocaleString('en-IN')} left`;

            return { html: `<div class="budget-item">
                <div class="budget-item-header">
                    <span class="budget-item-name">${cat}</span>
                    <span class="budget-item-amounts">${formatINR(spent)} / ${formatINR(budget)}</span>
                </div>
                <div class="budget-item-bar">
                    <div class="budget-item-bar-fill" style="width:${percent}%;background:${barColor}"></div>
                </div>
                <div class="budget-item-status" style="color:${isOver ? 'var(--negative)' : 'var(--text-tertiary)'}">${status}</div>
            </div>`, sortKey: actualPercent };
        })
        .sort((a, b) => b.sortKey - a.sortKey)
        .map(item => item.html);

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

    // Net Worth = Bank + Investments - Variable Spending this month
    // (Fixed expenses already reduced bank balance before you recorded it)
    const netWorth = (finances.bank || 0) + (finances.investments || 0) - totalSpent;
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
                <span class="goal-item-name">${escapeHTML(goal.name)}</span>
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
                    <span class="fixed-item-name">${escapeHTML(item.name)}</span>
                    <span class="fixed-item-category">${escapeHTML(item.category || '')}</span>
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
                    <span class="fixed-item-name">${escapeHTML(item.name)}</span>
                    <span class="fixed-item-category">${escapeHTML(item.category)}</span>
                </div>
                <span class="fixed-item-amount">${formatINR(item.amount)}</span>
            </div>
        `).join('');
    }

    list.innerHTML = html;
}

// Fixed Expenses Accordion Toggle
document.getElementById('toggle-fixed').addEventListener('click', () => {
    const content = document.getElementById('fixed-content');
    const icon = document.querySelector('.accordion-icon');
    content.classList.toggle('hidden');
    icon.classList.toggle('open');
});

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

// ==================== ANALYTICS PAGE ====================

function renderAnalytics() {
    renderHealthScore();
    renderAccountSpending();
    renderMonthlyReport();
    renderSubscriptions();
}

function renderHealthScore() {
    const finances = getFinances();
    const expenses = getCurrentMonthExpenses();
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const fixedTotal = getFixedTotal();
    const budgets = getBudgets();
    const totalBudget = Object.values(budgets).reduce((sum, v) => sum + v, 0);
    const goals = getGoals();

    // Calculate score components (each out of 25, total 100)
    // 1. Savings Rate (25 pts) — 20%+ = full marks
    const savingsRate = finances.income > 0 ? ((finances.income - fixedTotal - totalSpent) / finances.income) : 0;
    const savingsScore = Math.min(25, Math.max(0, Math.round(savingsRate * 125)));

    // 2. Budget Adherence (25 pts) — spending within budget
    let budgetScore = 25; // Full if no budget set
    if (totalBudget > 0) {
        const spending = getCategorySpending();
        // Only count spending in categories that have budgets
        let budgetedSpent = 0;
        Object.keys(budgets).forEach(cat => {
            if (budgets[cat] > 0 && spending[cat]) {
                budgetedSpent += spending[cat];
            }
        });
        budgetScore = budgetedSpent <= totalBudget ? 25 : Math.max(0, Math.round((1 - (budgetedSpent - totalBudget) / totalBudget) * 25));
    }

    // 3. Goal Progress (25 pts) — based on nearest goal
    const goalProgress = goals.length > 0 ? goals.reduce((sum, g) => sum + (g.target > 0 ? Math.min(1, g.current / g.target) : 0), 0) / goals.length : 0;
    const goalScore = Math.round(goalProgress * 25);

    // 4. Consistency (25 pts) — tracking streak
    const streak = getCurrentStreak();
    const consistencyScore = Math.min(25, streak); // 1 point per day, max 25

    const totalScore = savingsScore + budgetScore + goalScore + consistencyScore;

    // Update ring
    const ring = document.getElementById('health-ring');
    const circumference = 327; // 2 * PI * 52
    const offset = circumference - (totalScore / 100) * circumference;
    ring.style.strokeDashoffset = offset;

    // Color the ring based on score
    if (totalScore >= 75) ring.style.stroke = 'var(--positive)';
    else if (totalScore >= 50) ring.style.stroke = 'var(--accent)';
    else if (totalScore >= 25) ring.style.stroke = 'var(--warning)';
    else ring.style.stroke = 'var(--negative)';

    document.getElementById('health-score').textContent = totalScore;

    // Rating
    let rating = 'Needs Work';
    if (totalScore >= 80) rating = 'Excellent';
    else if (totalScore >= 60) rating = 'Good';
    else if (totalScore >= 40) rating = 'Fair';
    document.getElementById('health-rating').textContent = rating;

    // Breakdown
    document.getElementById('score-breakdown').innerHTML = [
        { name: 'Savings Rate', detail: `${Math.round(savingsRate * 100)}% of income`, points: savingsScore },
        { name: 'Budget Adherence', detail: totalBudget > 0 ? 'Within limits' : 'No budget set', points: budgetScore },
        { name: 'Goal Progress', detail: `${Math.round(goalProgress * 100)}% average`, points: goalScore },
        { name: 'Tracking Consistency', detail: `${streak} day streak`, points: consistencyScore }
    ].map(f => {
        const cls = f.points >= 20 ? 'good' : f.points >= 10 ? 'mid' : 'low';
        return `<div class="score-factor">
            <div class="score-factor-left">
                <span class="score-factor-name">${f.name}</span>
                <span class="score-factor-detail">${f.detail}</span>
            </div>
            <span class="score-factor-points ${cls}">${f.points}/25</span>
        </div>`;
    }).join('');
}

function renderAccountSpending() {
    const expenses = getCurrentMonthExpenses();
    const accountTotals = {};

    expenses.forEach(exp => {
        const acc = exp.account || 'Unspecified';
        accountTotals[acc] = (accountTotals[acc] || 0) + exp.amount;
    });

    const sorted = Object.entries(accountTotals).sort((a, b) => b[1] - a[1]);
    const list = document.getElementById('account-spending-list');

    if (sorted.length === 0) {
        list.innerHTML = '<p class="empty-state" style="padding:var(--space-4) 0">No spending data yet.</p>';
        return;
    }

    list.innerHTML = sorted.map(([name, amount]) => `
        <div class="account-spend-item">
            <span class="account-spend-name">${name}</span>
            <span class="account-spend-amount">${formatINR(amount)}</span>
        </div>
    `).join('');
}

function renderMonthlyReport() {
    const finances = getFinances();
    const expenses = getCurrentMonthExpenses();
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const fixedTotal = getFixedTotal();
    const saved = Math.max(0, finances.income - fixedTotal - totalSpent);
    const savingsRate = finances.income > 0 ? Math.round((saved / finances.income) * 100) : 0;
    const dayOfMonth = new Date().getDate();
    const dailyAvg = dayOfMonth > 0 ? Math.round(totalSpent / dayOfMonth) : 0;
    const highest = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;

    const report = document.getElementById('monthly-report');
    report.innerHTML = `
        <div class="report-row"><span>Total Income</span><span>${formatINR(finances.income)}</span></div>
        <div class="report-row"><span>Fixed Expenses</span><span>${formatINR(fixedTotal)}</span></div>
        <div class="report-row"><span>Variable Spending</span><span>${formatINR(totalSpent)}</span></div>
        <div class="report-row"><span>Total Saved</span><span class="positive">${formatINR(saved)}</span></div>
        <div class="report-row"><span>Savings Rate</span><span class="positive">${savingsRate}%</span></div>
        <div class="report-row"><span>Daily Average</span><span>${formatINR(dailyAvg)}</span></div>
        <div class="report-row"><span>Highest Single Expense</span><span>${formatINR(highest)}</span></div>
        <div class="report-row"><span>Total Entries</span><span>${expenses.length}</span></div>
    `;
}

function renderSubscriptions() {
    const fixed = getFixedExpenses();
    const subs = fixed.filter(item => item.category === 'Subscription');
    const list = document.getElementById('subscription-list');

    if (subs.length === 0) {
        list.innerHTML = '<p class="empty-state" style="padding:var(--space-4) 0">No subscriptions tracked.</p>';
        return;
    }

    const total = subs.reduce((sum, s) => sum + s.amount, 0);
    list.innerHTML = subs.map(s => `
        <div class="sub-item">
            <span class="sub-item-name">${s.name}</span>
            <span class="sub-item-amount">${formatINR(s.amount)}/mo</span>
        </div>
    `).join('') + `
        <div class="sub-item" style="border-top:1px solid var(--border-subtle);margin-top:var(--space-2);padding-top:var(--space-3)">
            <span class="sub-item-name" style="font-weight:600">Total</span>
            <span class="sub-item-amount" style="color:var(--accent);font-weight:600">${formatINR(total)}/mo</span>
        </div>
    `;
}

// ==================== SPLIT EXPENSE ====================

document.getElementById('split-btn').addEventListener('click', () => {
    // Pre-fill with amount if already typed
    const currentAmount = document.getElementById('amount').value;
    if (currentAmount) {
        document.getElementById('split-amount').value = currentAmount;
    }
    document.getElementById('split-modal').classList.remove('hidden');
});

document.getElementById('close-split-modal').addEventListener('click', () => {
    document.getElementById('split-modal').classList.add('hidden');
});

document.getElementById('split-calculate').addEventListener('click', () => {
    const total = parseFloat(document.getElementById('split-amount').value) || 0;
    const people = parseInt(document.getElementById('split-people').value) || 2;

    if (total > 0 && people >= 2) {
        const share = Math.ceil(total / people);
        document.getElementById('split-your-share').textContent = formatINR(share);
        document.getElementById('split-result').classList.remove('hidden');
    }
});

document.getElementById('split-use').addEventListener('click', () => {
    const share = document.getElementById('split-your-share').textContent;
    if (share && share !== '₹0') {
        // Extract number from formatted string
        const amount = parseInt(share.replace(/[₹,]/g, ''));
        document.getElementById('amount').value = amount;
        document.getElementById('split-modal').classList.add('hidden');
        document.getElementById('split-result').classList.add('hidden');
    }
});

// ==================== INCOME ENTRY ====================

const INCOME_KEY = 'income_log';

function getIncomeLog() {
    const data = localStorage.getItem(INCOME_KEY);
    return data ? JSON.parse(data) : [];
}

function saveIncomeLog(log) {
    localStorage.setItem(INCOME_KEY, JSON.stringify(log));
}

document.getElementById('log-income-btn').addEventListener('click', () => {
    document.getElementById('income-modal').classList.remove('hidden');
});

document.getElementById('close-income-modal').addEventListener('click', () => {
    document.getElementById('income-modal').classList.add('hidden');
});

document.getElementById('save-income-btn').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('income-amount').value) || 0;
    const source = document.getElementById('income-source').value.trim();
    const account = document.getElementById('income-account').value;

    if (amount <= 0) return;

    const log = getIncomeLog();
    log.push({
        id: generateId(),
        date: formatDate(new Date()),
        amount: amount,
        source: source || 'Income',
        account: account || ''
    });
    saveIncomeLog(log);

    // Clear and close
    document.getElementById('income-amount').value = '';
    document.getElementById('income-source').value = '';
    document.getElementById('income-account').value = '';
    document.getElementById('income-modal').classList.add('hidden');

    // Show success
    const msg = document.getElementById('success-message');
    msg.querySelector('span').textContent = '✓ Income logged';
    msg.classList.remove('hidden');
    setTimeout(() => {
        msg.querySelector('span').textContent = '✓ Saved';
        msg.classList.add('hidden');
    }, 1500);
});

// ==================== TAGS HANDLING ====================
// Tags are stored with each expense. The tags-input value is read during form submit.

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

// ==================== ONBOARDING ====================

const ONBOARDING_KEY = 'onboarding_complete';
const CUSTOM_CATEGORIES_KEY = 'custom_categories';
const CUSTOM_ACCOUNTS_KEY = 'custom_accounts';

function isOnboardingDone() {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

function getCustomCategories() {
    const data = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return data ? JSON.parse(data) : [...CATEGORIES]; // Default categories
}

function saveCustomCategories(cats) {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(cats));
}

function getCustomAccounts() {
    const data = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [
        { name: 'SBI Savings', label: 'SBI' },
        { name: 'ICICI Salary Account', label: 'ICICI' },
        { name: 'HDFC Millennia', label: 'Millennia' },
        { name: 'HDFC Swiggy', label: 'Swiggy' },
        { name: 'ICICI Rubyx', label: 'Rubyx' },
        { name: 'Scapia', label: 'Scapia' }
    ];
}

function saveCustomAccounts(accounts) {
    localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(accounts));
}

// Show onboarding if first time (but skip if data already exists)
if (!isOnboardingDone() || localStorage.getItem('force_onboarding') === 'true') {
    if (localStorage.getItem('force_onboarding') === 'true') {
        // User explicitly requested onboarding reset
        localStorage.removeItem('force_onboarding');
        document.getElementById('onboarding').classList.remove('hidden');
    } else if (getExpenses().length > 0) {
        // Existing user, first upgrade — skip silently
        localStorage.setItem(ONBOARDING_KEY, 'true');
    } else {
        // Truly new user
        document.getElementById('onboarding').classList.remove('hidden');
    }
}

function nextOnboardStep(step) {
    document.querySelectorAll('.onboarding-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`onboard-${step}`).classList.add('active');

    // Update dots
    document.querySelectorAll('.onboard-dot').forEach((d, i) => {
        d.classList.toggle('active', i === step - 1);
    });
}

function completeOnboarding() {
    // Save income
    const income = parseFloat(document.getElementById('onboard-income').value) || 114000;
    const finances = getFinances();
    finances.income = income;
    saveFinances(finances);

    // Save selected accounts with proper short labels
    const checkboxes = document.querySelectorAll('#onboard-accounts input[type="checkbox"]');
    const labelMap = {
        'SBI Savings': 'SBI',
        'ICICI Salary Account': 'ICICI',
        'HDFC Millennia': 'Millennia',
        'HDFC Swiggy': 'Swiggy',
        'ICICI Rubyx': 'Rubyx',
        'Scapia': 'Scapia'
    };
    const selectedAccounts = [];
    checkboxes.forEach(cb => {
        if (cb.checked) {
            const name = cb.value;
            const label = labelMap[name] || name;
            selectedAccounts.push({ name, label });
        }
    });
    if (selectedAccounts.length > 0) {
        saveCustomAccounts(selectedAccounts);
    }

    // Mark done
    localStorage.setItem(ONBOARDING_KEY, 'true');
    document.getElementById('onboarding').classList.add('hidden');

    // Rebuild chips with selected accounts
    rebuildAccountChips();
}

// Rebuild category chips from custom list
function rebuildCategoryChips() {
    const cats = getCustomCategories();
    const container = document.getElementById('category-chips');
    container.innerHTML = cats.map(cat =>
        `<button type="button" class="chip" data-value="${cat}">${cat}</button>`
    ).join('');

    // Re-attach event listeners
    container.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
            if (selectedCategory === chip.dataset.value) {
                selectedCategory = '';
            } else {
                chip.classList.add('selected');
                selectedCategory = chip.dataset.value;
            }
            checkBudgetWarning();
        });
    });
}

// Rebuild account chips from custom list
function rebuildAccountChips() {
    const accounts = getCustomAccounts();
    const container = document.getElementById('account-chips');
    container.innerHTML = accounts.map(acc =>
        `<button type="button" class="chip" data-value="${acc.name}">${acc.label}</button>`
    ).join('');

    // Re-attach event listeners
    container.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
            if (selectedAccount === chip.dataset.value) {
                selectedAccount = '';
            } else {
                chip.classList.add('selected');
                selectedAccount = chip.dataset.value;
            }
        });
    });
}

// ==================== SETTINGS PAGE ====================

function renderSettings() {
    renderCategorySettings();
    renderAccountSettings();
}

function renderCategorySettings() {
    const cats = getCustomCategories();
    const list = document.getElementById('custom-categories-list');
    list.innerHTML = cats.map(cat => `
        <div class="settings-item">
            <span>${escapeHTML(cat)}</span>
            <button class="settings-item-delete" onclick="deleteCategory('${escapeHTML(cat)}')">×</button>
        </div>
    `).join('');
}

function renderAccountSettings() {
    const accounts = getCustomAccounts();
    const list = document.getElementById('custom-accounts-list');
    list.innerHTML = accounts.map(acc => `
        <div class="settings-item">
            <span>${escapeHTML(acc.name)} (${escapeHTML(acc.label)})</span>
            <button class="settings-item-delete" onclick="deleteAccount('${escapeHTML(acc.name)}')">×</button>
        </div>
    `).join('');
}

function deleteCategory(cat) {
    const cats = getCustomCategories().filter(c => c !== cat);
    saveCustomCategories(cats);
    rebuildCategoryChips();
    renderCategorySettings();
}

function deleteAccount(name) {
    const accounts = getCustomAccounts().filter(a => a.name !== name);
    saveCustomAccounts(accounts);
    rebuildAccountChips();
    renderAccountSettings();
}

// Add Category Modal
document.getElementById('add-category-btn').addEventListener('click', () => {
    document.getElementById('new-cat-name').value = '';
    document.getElementById('add-cat-modal').classList.remove('hidden');
});

document.getElementById('close-cat-modal').addEventListener('click', () => {
    document.getElementById('add-cat-modal').classList.add('hidden');
});

document.getElementById('save-new-cat').addEventListener('click', () => {
    const name = document.getElementById('new-cat-name').value.trim();
    if (!name) return;

    const cats = getCustomCategories();
    if (!cats.includes(name)) {
        cats.push(name);
        saveCustomCategories(cats);
        rebuildCategoryChips();
        renderCategorySettings();
    }
    document.getElementById('add-cat-modal').classList.add('hidden');
});

// Add Account Modal
document.getElementById('add-account-btn').addEventListener('click', () => {
    document.getElementById('new-acc-name').value = '';
    document.getElementById('new-acc-short').value = '';
    document.getElementById('add-acc-modal').classList.remove('hidden');
});

document.getElementById('close-acc-modal').addEventListener('click', () => {
    document.getElementById('add-acc-modal').classList.add('hidden');
});

document.getElementById('save-new-acc').addEventListener('click', () => {
    const name = document.getElementById('new-acc-name').value.trim();
    const label = document.getElementById('new-acc-short').value.trim() || name;
    if (!name) return;

    const accounts = getCustomAccounts();
    if (!accounts.find(a => a.name === name)) {
        accounts.push({ name, label });
        saveCustomAccounts(accounts);
        rebuildAccountChips();
        renderAccountSettings();
    }
    document.getElementById('add-acc-modal').classList.add('hidden');
});

// Reset Onboarding
document.getElementById('reset-onboarding-btn').addEventListener('click', () => {
    if (confirm('This will show the onboarding setup next time you open the app. Continue?')) {
        localStorage.removeItem(ONBOARDING_KEY);
        localStorage.setItem('force_onboarding', 'true');
        alert('Onboarding will show on next app open.');
    }
});

// Clear All Data
document.getElementById('clear-all-data-btn').addEventListener('click', () => {
    if (confirm('This will DELETE ALL your data (expenses, budgets, goals, everything). This cannot be undone. Are you absolutely sure?')) {
        if (confirm('Last chance — all data will be permanently lost. Continue?')) {
            localStorage.clear();
            alert('All data cleared. The app will reload.');
            window.location.reload();
        }
    }
});

// Initialize custom chips on load
rebuildCategoryChips();
rebuildAccountChips();

// ==================== PWA ====================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('SW registered'))
            .catch(err => console.log('SW failed:', err));
    });
}
