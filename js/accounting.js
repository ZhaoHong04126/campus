// --- 負責記帳(記帳功能的主要邏輯) ---

// 定義目前選中的記帳分頁，預設為 'summary' (總覽)
let currentAccTab = 'summary';
// -1 代表新增模式，大於 -1 代表正在編輯某筆資料
let editingAccountingIndex = -1; 
// 紀錄帳戶頁面是否處於編輯模式
let isAccAccountsEditMode = false;

// 切換帳戶編輯/唯讀模式的邏輯
function toggleAccAccountsEditMode() {
    isAccAccountsEditMode = !isAccAccountsEditMode;
    const btn = document.getElementById('btn-toggle-acc-edit');
    const addBtn = document.getElementById('btn-add-payment-method');
    if (!btn) return;

    if (isAccAccountsEditMode) {
        btn.innerHTML = "✏️ 編輯模式";
        btn.style.color = "var(--primary)";
        btn.style.borderColor = "var(--primary)";
        btn.style.background = "#e6f0ff";
        if (addBtn) addBtn.style.display = "block";
        if (window.showAlert) showAlert("已開啟編輯模式！\n現在可以新增或刪除支付方式了。");
    } else {
        btn.innerHTML = "🔒 唯讀模式";
        btn.style.color = "#888";
        btn.style.borderColor = "#ddd";
        btn.style.background = "transparent";
        if (addBtn) addBtn.style.display = "none";
    }

    renderAccAccounts();
}

// 渲染記帳頁面的主函式
function renderAccounting() {
    let totalIncome = 0;
    let totalExpense = 0;
    updatePaymentMethodOptions();
    
    accountingList.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    accountingList.forEach(item => {
        const amount = parseInt(item.amount);
        if (item.type === 'income') totalIncome += amount;
        else if (item.type === 'expense') totalExpense += amount;
    });

    const summaryIncome = document.getElementById('acc-summary-income');
    const summaryExpense = document.getElementById('acc-summary-expense');
    const summaryBalance = document.getElementById('acc-summary-balance');
    
    if (summaryIncome) {
        summaryIncome.innerText = `$${totalIncome}`;
        summaryExpense.innerText = `$${totalExpense}`;
        const balance = totalIncome - totalExpense;
        summaryBalance.innerText = `$${balance}`;
        summaryBalance.style.color = balance >= 0 ? '#2ecc71' : '#e74c3c';
    }

    if (currentAccTab === 'details') renderAccDetails();
    else if (currentAccTab === 'chart') renderAccChart();
    else if (currentAccTab === 'daily') renderAccDaily();
    else if (currentAccTab === 'accounts') renderAccAccounts();
}

// 切換記帳分頁的函式
function switchAccTab(tabName) {
    currentAccTab = tabName;
    
    const tabs = ['summary', 'details', 'chart', 'daily','accounts'];
    tabs.forEach(t => {
        const btn = document.getElementById(`btn-acc-${t}`);
        const view = document.getElementById(`view-acc-${t}`);
        if (btn) btn.classList.remove('active'); 
        if (view) view.style.display = 'none';
    });

    const activeBtn = document.getElementById(`btn-acc-${tabName}`);
    const activeView = document.getElementById(`view-acc-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
    if (activeView) activeView.style.display = 'block';

    renderAccounting();
}

// 渲染收支明細列表
function renderAccDetails() {
    const listBody = document.getElementById('accounting-list-body');
    if (!listBody) return;
    listBody.innerHTML = '';

    if (accountingList.length === 0) {
        listBody.innerHTML = '<tr><td colspan="5" class="no-class">💰 目前無收支紀錄</td></tr>';
        return;
    }

    accountingList.forEach((item, index) => {
        const amount = parseInt(item.amount) || 0;
        let typeLabel = '';
        let amountColor = '';
        let sign = '';
        let methodHtml = '';

        if (item.type === 'transfer') {
            typeLabel = '<span style="background:#3498db; color:white; padding:2px 6px; border-radius:4px; font-size:0.75rem;">轉帳</span>';
            amountColor = 'color: #3498db;';
            sign = '';
            methodHtml = `
                <span style="font-size:0.85rem; color:#555;">
                    ${item.method} ➝ ${item.to_method}
                </span>`;
        } else {
            typeLabel = item.type === 'income' ? '<span class="badge-income">收入</span>' : '<span class="badge-expense">支出</span>';
            amountColor = item.type === 'income' ? 'color: #2ecc71;' : 'color: #e74c3c;';
            sign = item.type === 'income' ? '+' : '-';
            methodHtml = `<span style="background-color: #f3e5f5; color: #8e24aa; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">${item.method || '現金'}</span>`;
        }

        listBody.innerHTML += `
            <tr>
                <td>${item.date}</td>
                <td style="text-align: left;">${typeLabel} ${item.title}</td>
                <td>${methodHtml}</td> <td style="font-weight:bold; ${amountColor}">${sign}$${amount}</td>
                <td>
                    <button class="btn-edit" onclick="editTransaction(${index})" style="padding:4px 8px; margin-right:5px;">✏️</button>
                    <button class="btn-delete" onclick="deleteTransaction(${index})" style="padding:4px 8px;">🗑️</button>
                </td>
            </tr>
        `;
    });
}

// 渲染收支圖表 (Chart.js)
function renderAccChart() {
    const ctx = document.getElementById('accountingChart');
    if (!ctx) return;

    const monthlyData = {};
    const allMonths = new Set();

    accountingList.forEach(item => {
        const month = item.date.substring(0, 7);
        allMonths.add(month);
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
        
        const amount = parseInt(item.amount) || 0;

        if (item.type === 'income') monthlyData[month].income += amount;
        else monthlyData[month].expense += amount;
    });

    
    const sortedMonths = Array.from(allMonths).sort();
    const labels = sortedMonths;
    const dataIncome = sortedMonths.map(m => monthlyData[m].income);
    const dataExpense = sortedMonths.map(m => monthlyData[m].expense);
    const dataBalance = sortedMonths.map(m => monthlyData[m].income - monthlyData[m].expense);

    if (accChartInstance) accChartInstance.destroy();

    accChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: '結餘',
                    data: dataBalance,
                    borderColor: '#f1c40f',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    order: 0,
                },
                {
                    label: '收入',
                    data: dataIncome,
                    backgroundColor: 'rgba(46, 204, 113, 0.6)',
                    borderColor: '#2ecc71',
                    borderWidth: 1,
                    order: 1
                },
                {
                    label: '支出',
                    data: dataExpense,
                    backgroundColor: 'rgba(231, 76, 60, 0.6)',
                    borderColor: '#e74c3c',
                    borderWidth: 1,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });
}

// 渲染每日收支統計
function renderAccDaily() {
    const listBody = document.getElementById('daily-acc-body');
    if (!listBody) return;
    listBody.innerHTML = '';

    const dailyData = {};
    
    accountingList.forEach(item => {
        const date = item.date;
        if (!dailyData[date]) dailyData[date] = { income: 0, expense: 0 };
        
        const amount = parseInt(item.amount) || 0;
        if (item.type === 'income') dailyData[date].income += amount;
        else dailyData[date].expense += amount;
    });

    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) {
        listBody.innerHTML = '<tr><td colspan="4" class="no-class">📅 無資料</td></tr>';
        return;
    }

    sortedDates.forEach(date => {
        const d = dailyData[date];
        const net = d.income - d.expense;
        const netColor = net >= 0 ? '#2ecc71' : '#e74c3c';
        const netSign = net >= 0 ? '+' : '';

        listBody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td style="color:#2ecc71;">$${d.income}</td>
                <td style="color:#e74c3c;">$${d.expense}</td>
                <td style="font-weight:bold; color:${netColor};">${netSign}$${net}</td>
            </tr>
        `;
    });
}

// 開啟新增記帳視窗
function openAccountingModal() {
    document.getElementById('accounting-modal').style.display = 'flex';
    document.getElementById('input-acc-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('input-acc-title').value = '';
    document.getElementById('input-acc-amount').value = '';
    document.getElementById('input-acc-type').value = 'expense';
    document.getElementById('input-acc-method').value = '現金';

    document.getElementById('input-acc-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('input-acc-title').value = '';
    document.getElementById('input-acc-amount').value = '';
    document.getElementById('input-acc-type').value = 'expense';
    
    if (typeof updatePaymentMethodOptions === 'function') updatePaymentMethodOptions();

    toggleAccType();
    editingAccountingIndex = -1;
    const btn = document.getElementById('btn-save-acc');
    if (btn) {
        btn.innerText = "+ 確定新增";
        btn.style.background = "#333";
    }
}

// 關閉新增記帳視窗
function closeAccountingModal() {
    document.getElementById('accounting-modal').style.display = 'none';
}

// 記帳/轉帳儲存函式 (含防呆機制)
function addTransaction() {
    const dateEl = document.getElementById('input-acc-date');
    const titleEl = document.getElementById('input-acc-title');
    const amountEl = document.getElementById('input-acc-amount');
    const typeEl = document.getElementById('input-acc-type');
    const methodEl = document.getElementById('input-acc-method');
    const toMethodEl = document.getElementById('input-acc-to-method');

    if (!dateEl || !amountEl) {
        showAlert("系統錯誤：找不到輸入欄位，請檢查 HTML");
        return;
    }

    const date = dateEl.value;
    let title = titleEl.value;
    const amount = amountEl.value;
    const type = typeEl ? typeEl.value : 'expense';
    const method = methodEl ? methodEl.value : '現金';
    const toMethod = toMethodEl ? toMethodEl.value : ''; 

    if (!date || !amount) {
        showAlert("請輸入日期與金額", "資料不全");
        return;
    }

    if (type === 'transfer') {
        if (method === toMethod) {
            showAlert("轉出與轉入帳戶不能相同！");
            return;
        }
        if (!title) title = "轉帳"; 
    } else if (!title) {
        showAlert("請輸入項目說明");
        return;
    }

    const newItem = {
        date: date,
        title: title,
        amount: parseInt(amount),
        type: type,
        method: method,
        to_method: type === 'transfer' ? toMethod : null
    };

    if (typeof editingAccountingIndex !== 'undefined' && editingAccountingIndex > -1) {
        accountingList[editingAccountingIndex] = newItem;
        showAlert("修改成功！", "完成");
    } else {
        accountingList.push(newItem);
        showAlert(type === 'transfer' ? "轉帳成功！" : "記帳成功！", "完成");
    }

    saveData();
    closeAccountingModal();
    renderAccounting();
}

// 刪除交易紀錄
function deleteTransaction(index) {
    showConfirm("確定要刪除這筆紀錄嗎？", "刪除確認").then(ok => {
            if (ok) {
            accountingList.splice(index, 1);
            saveData();
            renderAccounting();
        }
    });
}

// 渲染帳戶與餘額列表
function renderAccAccounts() {
    const listDiv = document.getElementById('acc-accounts-list');
    if (!listDiv) return;

    let html = '';
    const balances = {};
    paymentMethods.forEach(method => balances[method] = 0);

    accountingList.forEach(item => {
        const method = item.method || '現金';
        const amount = parseInt(item.amount) || 0;
        
        if (balances[method] === undefined) balances[method] = 0;
        
        if (item.type === 'income') {
            balances[method] += amount;
        } else if (item.type === 'expense') {
            balances[method] -= amount;
        } else if (item.type === 'transfer') {
            balances[method] -= amount; 
            const toMethod = item.to_method;
            if (toMethod) {
                if (balances[toMethod] === undefined) balances[toMethod] = 0;
                balances[toMethod] += amount;
            }
        }
    });

    paymentMethods.forEach((method, index) => {
        const bal = balances[method];
        const color = bal >= 0 ? '#2ecc71' : '#e74c3c';
        
        const btnDisplay = isAccAccountsEditMode ? 'block' : 'none';

        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 15px 0; border-bottom: 1px solid #eee;">
            <div>
                <div style="font-size: 1rem; font-weight: bold; color: var(--text-main);">${method}</div>
                <div style="font-size: 0.85rem; color: #888;">本學期結餘</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 1.1rem; font-weight:bold; color: ${color};">$${bal}</div>
                <div style="margin-top:5px; display: ${btnDisplay};">
                    <button onclick="editPaymentMethodBalance('${method}', ${bal})" style="background:transparent; border:none; color:#f39c12; cursor:pointer; font-size:0.8rem; margin-right:8px;">✏️ 編輯</button>
                    <button onclick="deletePaymentMethod(${index})" style="background:transparent; border:none; color:#e74c3c; cursor:pointer; font-size:0.8rem;">🗑️ 刪除</button>
                </div>
            </div>
        </div>`;
    });
    listDiv.innerHTML = html;
}

// 更新下拉選單 (給新增記帳視窗用)
function updatePaymentMethodOptions() {
    const select = document.getElementById('input-acc-method');
    const selectTo = document.getElementById('input-acc-to-method');
    if (!select) return;
    
    const currentVal = select.value;
    const currentValTo = selectTo ? selectTo.value : '';

    let optionsHtml = '';
    paymentMethods.forEach(method => {
        optionsHtml += `<option value="${method}">${method}</option>`;
    });
    
    select.innerHTML = optionsHtml;
    if (selectTo) selectTo.innerHTML = optionsHtml;

    if (paymentMethods.includes(currentVal)) select.value = currentVal;
    if (selectTo && paymentMethods.includes(currentValTo)) selectTo.value = currentValTo;
}

// 新增支付方式
function addPaymentMethod() {

    if (!isAccAccountsEditMode) {
        if (window.showAlert) showAlert("目前為「🔒 唯讀模式」\n若要新增帳戶，請先點擊右上角的按鈕切換至編輯狀態。");
        return;
    }

    showPrompt("請輸入新支付方式名稱 (例如: LINE Pay, 私房錢)", "", "新增帳戶")
    .then(name => {
        if (!name) return;
        if (name) {
            if (paymentMethods.includes(name)) {
                showAlert("這個名稱已經存在囉！");
                return;
            }
        }
        showPrompt(`請輸入「${name}」的初始金額：`, "0", "設定餘額")
        .then(amountStr => {
            const amount = parseInt(amountStr) || 0;

            paymentMethods.push(name);
            
            if (amount > 0) {
                accountingList.push({
                    date: new Date().toISOString().split('T')[0],
                    title: "初始餘額",
                    amount: amount,
                    type: "income",
                    method: name
                });
            }

            saveData();
            renderAccounting();
            
            const msg = amount > 0 ? `已新增「${name}」\n(初始餘額 $${amount})` : `已新增「${name}」`;
            showAlert(msg);
        });
    });
}

// 刪除支付方式
function deletePaymentMethod(index) {
    if (!isAccAccountsEditMode) {
        if (window.showAlert) showAlert("目前為「🔒 唯讀模式」\n若要刪除帳戶，請先點擊右上角的按鈕切換至編輯狀態。");
        return;
    }

    const target = paymentMethods[index];
    showConfirm(`確定要刪除「${target}」嗎？\n(注意：這不會刪除該帳戶的歷史記帳紀錄，但無法再選擇此方式)`, "刪除確認")
    .then(ok => {
        if (ok) {
            paymentMethods.splice(index, 1);
            saveData();
            renderAccounting();
            showAlert("已刪除");
        }
    });
}

// 編輯帳戶餘額 (透過自動新增校正紀錄)
function editPaymentMethodBalance(methodName, currentBalance) {
    if (!isAccAccountsEditMode) {
        if (window.showAlert) showAlert("目前為「🔒 唯讀模式」\n若要編輯金額，請先點擊右上角的按鈕切換至編輯狀態。");
        return;
    }

    showPrompt(`請輸入「${methodName}」目前的正確總餘額：`, currentBalance, "編輯帳戶金額")
    .then(newBalanceStr => {
        if (newBalanceStr === null) return; // 使用者按取消
        
        const newBalance = parseInt(newBalanceStr);
        if (isNaN(newBalance)) {
            if (window.showAlert) showAlert("請輸入有效的數字！", "錯誤");
            return;
        }

        const difference = newBalance - currentBalance;
        
        if (difference === 0) return; 

        accountingList.push({
            date: new Date().toISOString().split('T')[0],
            title: "餘額校正",
            amount: Math.abs(difference),
            type: difference > 0 ? "income" : "expense",
            method: methodName
        });

        saveData();
        renderAccounting();
        if (window.showAlert) showAlert(`已將「${methodName}」餘額校正為 $${newBalance}`, "修改成功");
    });
}

// 編輯交易
function editTransaction(index) {
    showConfirm("確定要更改這筆紀錄嗎？", "更改確認").then(ok => {
        if (ok) {
            const item = accountingList[index];
            openAccountingModal(); 
            
            document.getElementById('input-acc-date').value = item.date;
            document.getElementById('input-acc-title').value = item.title;
            document.getElementById('input-acc-amount').value = item.amount;
            document.getElementById('input-acc-type').value = item.type;
            if (item.type === 'transfer') {
                document.getElementById('input-acc-to-method').value = item.to_method;
            }
            document.getElementById('input-acc-method').value = item.method || '現金';

            editingAccountingIndex = index;

            const btn = document.getElementById('btn-save-acc');
            if (btn) {
                btn.innerText = "💾 保存修改";
                btn.style.background = "#f39c12"; // 橘色代表修改
            }

            toggleAccType();
        }
    });
}

// 切換類型時的 UI 變化
function toggleAccType() {
    const type = document.getElementById('input-acc-type').value;
    const toGroup = document.getElementById('group-acc-to-method');
    const methodLabel = document.getElementById('label-acc-method');
    
    if (type === 'transfer') {
        toGroup.style.display = 'block';
        if (methodLabel) methodLabel.innerText = "轉出帳戶 (扣款)";
        document.getElementById('input-acc-title').placeholder = "例如：提款、儲值 (選填)";
    } else {
        toGroup.style.display = 'none';
        if (methodLabel) methodLabel.innerText = "支付方式";
        document.getElementById('input-acc-title').placeholder = "例如：早餐、薪水";
    }
}