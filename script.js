// ========== Управление данными ==========
let transactions = [];
let familyMembers = ['Папа'];

// Загрузка данных из localStorage
function loadData() {
    const savedTransactions = localStorage.getItem('family_budget_transactions');
    const savedMembers = localStorage.getItem('family_budget_members');
    
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    } else {
        // Добавляем демо-данные для первого запуска
        transactions = [
            { id: Date.now(), desc: 'Зарплата', amount: 50000, type: 'income', category: 'other', date: new Date().toISOString() },
            { id: Date.now() + 1, desc: 'Продукты', amount: 3500, type: 'expense', category: 'food', date: new Date().toISOString() },
            { id: Date.now() + 2, desc: 'Такси', amount: 500, type: 'expense', category: 'transport', date: new Date().toISOString() }
        ];
    }
    
    if (savedMembers) {
        familyMembers = JSON.parse(savedMembers);
    }
}

// Сохранение данных
function saveData() {
    localStorage.setItem('family_budget_transactions', JSON.stringify(transactions));
    localStorage.setItem('family_budget_members', JSON.stringify(familyMembers));
}

// ========== Расчеты ==========
function getTotalIncome() {
    return transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
}

function getTotalExpense() {
    return transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
}

function getBalance() {
    return getTotalIncome() - getTotalExpense();
}

function getExpensesByCategory() {
    const categories = {
        food: 0,
        transport: 0,
        housing: 0,
        entertainment: 0,
        health: 0,
        other: 0
    };
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
        if (categories[t.category] !== undefined) {
            categories[t.category] += t.amount;
        }
    });
    
    return categories;
}

function getLast7DaysTrend() {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayExpenses = transactions.filter(t => {
            const tDate = new Date(t.date).toISOString().split('T')[0];
            return t.type === 'expense' && tDate === dateStr;
        }).reduce((sum, t) => sum + t.amount, 0);
        
        last7Days.push({
            date: dateStr,
            amount: dayExpenses
        });
    }
    
    return last7Days;
}

// ========== Отображение UI ==========
function updateBalanceUI() {
    document.getElementById('totalBalance').textContent = formatCurrency(getBalance());
    document.getElementById('totalIncome').textContent = formatNumber(getTotalIncome());
    document.getElementById('totalExpense').textContent = formatNumber(getTotalExpense());
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(amount);
}

function formatNumber(amount) {
    return new Intl.NumberFormat('ru-RU').format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function renderTransactions() {
    const container = document.getElementById('transactionsContainer');
    
    if (transactions.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет операций. Добавьте первую!</div>';
        return;
    }
    
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedTransactions.map(t => `
        <div class="transaction-item" data-id="${t.id}">
            <div class="transaction-info">
                <div class="transaction-desc">${escapeHtml(t.desc)}</div>
                <div class="transaction-category">${getCategoryName(t.category)}</div>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
            </div>
            <div class="transaction-date">${formatDate(t.date)}</div>
            <button class="delete-btn" onclick="deleteTransaction(${t.id})">×</button>
        </div>
    `).join('');
}

function getCategoryName(category) {
    const names = {
        food: '🍔 Еда',
        transport: '🚗 Транспорт',
        housing: '🏠 Жильё',
        entertainment: '🎮 Развлечения',
        health: '💊 Здоровье',
        other: '📦 Другое'
    };
    return names[category] || category;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderCharts() {
    // Простые текстовые графики (для демо, можно заменить на Chart.js)
    const categories = getExpensesByCategory();
    const categoriesContainer = document.getElementById('categoriesChart');
    
    let categoriesHtml = '<div style="font-size: 0.9rem;">';
    for (const [cat, amount] of Object.entries(categories)) {
        if (amount > 0) {
            const percent = getTotalExpense() > 0 ? (amount / getTotalExpense() * 100).toFixed(1) : 0;
            categoriesHtml += `
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>${getCategoryName(cat)}</span>
                        <span>${formatCurrency(amount)} (${percent}%)</span>
                    </div>
                    <div style="background: #eee; border-radius: 10px; overflow: hidden;">
                        <div style="background: #4CAF50; width: ${percent}%; height: 8px; border-radius: 10px;"></div>
                    </div>
                </div>
            `;
        }
    }
    if (getTotalExpense() === 0) {
        categoriesHtml += '<div class="empty-state">Нет расходов</div>';
    }
    categoriesHtml += '</div>';
    categoriesContainer.innerHTML = categoriesHtml;
    
    // Тренд за 7 дней
    const trend = getLast7DaysTrend();
    const trendContainer = document.getElementById('trendChart');
    const maxAmount = Math.max(...trend.map(d => d.amount), 1);
    
    let trendHtml = '<div>';
    for (const day of trend) {
        const height = (day.amount / maxAmount * 100).toFixed(1);
        const dateLabel = new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'short' });
        trendHtml += `
            <div style="display: inline-block; width: 13%; text-align: center; margin-right: 1%;">
                <div style="background: #2196F3; height: ${height}px; min-height: 4px; border-radius: 4px; margin-bottom: 5px;"></div>
                <div style="font-size: 0.7rem;">${dateLabel}</div>
                <div style="font-size: 0.65rem; color: #666;">${formatCurrency(day.amount)}</div>
            </div>
        `;
    }
    if (trend.every(d => d.amount === 0)) {
        trendHtml = '<div class="empty-state">Нет расходов за последние 7 дней</div>';
    } else {
        trendHtml += '</div>';
    }
    trendContainer.innerHTML = trendHtml;
}

function renderFamilyMembers() {
    const container = document.getElementById('familyMembers');
    container.innerHTML = familyMembers.map((member, index) => `
        <div class="family-member">
            <input type="text" placeholder="Имя" class="member-name" value="${escapeHtml(member)}" data-index="${index}">
            <button class="remove-member" data-index="${index}" ${familyMembers.length === 1 ? 'disabled' : ''}>×</button>
        </div>
    `).join('');
    
    // Добавляем обработчики для редактирования
    document.querySelectorAll('.member-name').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            if (e.target.value.trim()) {
                familyMembers[index] = e.target.value.trim();
                saveData();
            } else {
                e.target.value = familyMembers[index];
            }
        });
    });
    
    document.querySelectorAll('.remove-member:not([disabled])').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            if (familyMembers.length > 1) {
                familyMembers.splice(index, 1);
                saveData();
                renderFamilyMembers();
            }
        });
    });
}

// ========== Операции с транзакциями ==========
function addTransaction(desc, amount, type, category) {
    const transaction = {
        id: Date.now(),
        desc: desc.trim(),
        amount: parseFloat(amount),
        type: type,
        category: category,
        date: new Date().toISOString()
    };
    
    transactions.push(transaction);
    saveData();
    updateUI();
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    updateUI();
}

// ========== Экспорт/Импорт ==========
function exportData() {
    const data = {
        transactions: transactions,
        familyMembers: familyMembers,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family_budget_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.transactions && Array.isArray(data.transactions)) {
                transactions = data.transactions;
            }
            if (data.familyMembers && Array.isArray(data.familyMembers)) {
                familyMembers = data.familyMembers;
            }
            saveData();
            updateUI();
            alert('Данные успешно импортированы!');
        } catch (error) {
            alert('Ошибка при импорте: неверный формат файла');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Вы уверены? Все данные будут безвозвратно удалены!')) {
        transactions = [];
        familyMembers = ['Папа'];
        saveData();
        updateUI();
    }
}

// ========== Обновление всего интерфейса ==========
function updateUI() {
    updateBalanceUI();
    renderTransactions();
    renderCharts();
    renderFamilyMembers();
}

// ========== Инициализация и обработчики ==========
function init() {
    loadData();
    updateUI();
    
    // Обработчики табов
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Обработчик формы
    document.getElementById('transactionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = document.getElementById('desc').value;
        const amount = document.getElementById('amount').value;
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        
        if (!desc || !amount || amount <= 0) {
            alert('Пожалуйста, заполните все поля корректно');
            return;
        }
        
        addTransaction(desc, amount, type, category);
        e.target.reset();
    });
    
    // Обработчики настроек
    document.getElementById('addMemberBtn').addEventListener('click', () => {
        familyMembers.push('Новый участник');
        saveData();
        renderFamilyMembers();
    });
    
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importData(e.target.files[0]);
            e.target.value = '';
        }
    });
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
}

// Запуск приложения
init();