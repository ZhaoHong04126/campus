// 用來記錄目前正在編輯的作業索引 (-1 代表新增模式)
let editingHomeworkIndex = -1;

// 渲染作業列表
function renderHomework() {
    const listDiv = document.getElementById('homework-list');
    const summaryDiv = document.getElementById('homework-summary');
    if (!listDiv) return;

    homeworkList.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.date) - new Date(b.date);
    });

    let html = '';
    let totalCount = homeworkList.length;
    let completedCount = 0;

    if (totalCount === 0) {
        html = `
            <div style="text-align:center; padding:30px; color:#999;">
                <div style="font-size:3rem; margin-bottom:10px;">🎒</div>
                <p>目前沒有作業<br>享受自由的時光吧！</p>
            </div>`;
    } else {
        homeworkList.forEach((item, index) => {
            if (item.completed) completedCount++;

            const statusColor = item.completed ? '#2ecc71' : '#e74c3c';
            const cardOpacity = item.completed ? '0.7' : '1';
            const decoration = item.completed ? 'line-through' : 'none';
            const icon = item.completed ? '✅' : '⬜';

            html += `
            <div class="card" style="margin-bottom: 12px; padding: 15px; border-left: 5px solid ${statusColor}; opacity: ${cardOpacity};">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div style="flex: 1;" onclick="editHomework(${index})">
                        <div style="font-size:0.85rem; color:#888; margin-bottom:4px;">
                            ${item.date} • <span style="color:var(--primary); font-weight:bold;">${item.subject}</span>
                        </div>
                        <div style="font-weight:bold; font-size:1.1rem; color:var(--text-main); text-decoration: ${decoration}; margin-bottom: 5px;">
                            ${item.title}
                        </div>
                        <div style="font-size:0.9rem; color:#666;">
                            分數: <span style="font-weight:bold; color:#333;">${item.score || '-'}</span> / ${item.total || 100}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:10px; align-items:flex-end;">
                        <button onclick="toggleHomeworkStatus(${index})" style="background:transparent; border:none; font-size:1.2rem; cursor:pointer;" title="切換狀態">${icon}</button>
                        <div style="display:flex; gap: 5px;">
                            <button onclick="editHomework(${index})" style="background:transparent; border:none; color:#f39c12; cursor:pointer; font-size:0.9rem;">✏️</button>
                            <button onclick="deleteHomework(${index})" style="background:transparent; border:none; color:#ccc; cursor:pointer; font-size:0.9rem;">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>`;
        });
    }
    
    listDiv.innerHTML = html;

    if (summaryDiv) {
        summaryDiv.innerHTML = `
            <span style="margin-right: 15px;">總計: <b>${totalCount}</b></span>
            <span style="color:#2ecc71;">完成: <b>${completedCount}</b></span> / 
            <span style="color:#e74c3c;">未完: <b>${totalCount - completedCount}</b></span>
        `;
    }
}

// 儲存作業 (新增或修改)
function addHomework() {
    const selectEl = document.getElementById('input-hw-subject-select');
    const textEl = document.getElementById('input-hw-subject-text');
    
    let subject = (selectEl.style.display !== 'none') ? selectEl.value : textEl.value;
    
    const title = document.getElementById('input-hw-title').value;
    const date = document.getElementById('input-hw-date').value;
    const score = document.getElementById('input-hw-score').value;
    const total = document.getElementById('input-hw-total').value;

    if (!subject || !title || !date) {
        showAlert("請輸入科目、作業名稱與日期", "資料不全");
        return;
    }

    const homeworkData = {
        subject,
        title,
        date,
        score: score,
        total: total || 100,
        completed: editingHomeworkIndex > -1 ? homeworkList[editingHomeworkIndex].completed : false
    };

    if (editingHomeworkIndex > -1) {
        homeworkList[editingHomeworkIndex] = homeworkData;
        showAlert("作業修改成功！", "完成");
    } else {
        homeworkList.push(homeworkData);
        showAlert("作業已新增！", "成功");
    }

    saveData();
    closeHomeworkModal();
    renderHomework();
}

// 進入編輯模式
function editHomework(index) {
    const item = homeworkList[index];
    if (!item) return;

    editingHomeworkIndex = index;
    
    document.getElementById('homework-modal').style.display = 'flex';
    document.getElementById('modal-hw-title').innerText = "✏️ 編輯作業";
    
    const btn = document.getElementById('btn-save-hw');
    if (btn) {
        btn.innerText = "💾 儲存修改";
        btn.style.background = "#f39c12";
    }

    updateHomeworkSubjectOptions();

    const selectEl = document.getElementById('input-hw-subject-select');
    const textEl = document.getElementById('input-hw-subject-text');
    const toggleBtn = document.getElementById('btn-toggle-hw-input');
    
    let optionExists = false;
    for (let i = 0; i < selectEl.options.length; i++) {
        if (selectEl.options[i].value === item.subject) {
            optionExists = true;
            break;
        }
    }

    if (optionExists) {
        selectEl.style.display = 'block';
        textEl.style.display = 'none';
        selectEl.value = item.subject;
        toggleBtn.innerText = "✏️";
    } else {
        selectEl.style.display = 'none';
        textEl.style.display = 'block';
        textEl.value = item.subject;
        toggleBtn.innerText = "📜";
    }

    document.getElementById('input-hw-title').value = item.title;
    document.getElementById('input-hw-date').value = item.date;
    document.getElementById('input-hw-score').value = item.score || '';
    document.getElementById('input-hw-total').value = item.total || 100;
}

// 切換 自動/手寫 模式
function toggleHomeworkSubjectMode() {
    const selectEl = document.getElementById('input-hw-subject-select');
    const textEl = document.getElementById('input-hw-subject-text');
    const btn = document.getElementById('btn-toggle-hw-input');

    if (selectEl.style.display !== 'none') {
        selectEl.style.display = 'none';
        textEl.style.display = 'block';
        textEl.focus();
        btn.innerText = "📜";
    } else {
        selectEl.style.display = 'block';
        textEl.style.display = 'none';
        btn.innerText = "✏️";
    }
}

// 刪除作業
function deleteHomework(index) {
    showConfirm("確定要刪除這項作業嗎？").then(ok => {
        if (ok) {
            if (editingHomeworkIndex === index) closeHomeworkModal();
            homeworkList.splice(index, 1);
            saveData();
            renderHomework();
        }
    });
}

// Modal 控制
function openHomeworkModal() {
    editingHomeworkIndex = -1;
    document.getElementById('homework-modal').style.display = 'flex';
    document.getElementById('modal-hw-title').innerText = "🎒 新增作業";
    
    const btn = document.getElementById('btn-save-hw');
    if (btn) {
        btn.innerText = "+ 儲存";
        btn.style.background = "var(--primary)";
    }

    document.getElementById('input-hw-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('input-hw-title').value = '';
    document.getElementById('input-hw-score').value = '';
    document.getElementById('input-hw-total').value = '100';

    updateHomeworkSubjectOptions();
    
    const selectEl = document.getElementById('input-hw-subject-select');
    const textEl = document.getElementById('input-hw-subject-text');
    const toggleBtn = document.getElementById('btn-toggle-hw-input');
    
    selectEl.style.display = 'block';
    selectEl.value = '';
    textEl.style.display = 'none';
    textEl.value = '';
    toggleBtn.innerText = "✏️";
}

function closeHomeworkModal() {
    document.getElementById('homework-modal').style.display = 'none';
    editingHomeworkIndex = -1;
}

// 更新下拉選單內容 (從課表自動抓取)
function updateHomeworkSubjectOptions() {
    const select = document.getElementById('input-hw-subject-select');
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>請選擇科目</option>';
    
    let subjects = new Set();
    if (typeof weeklySchedule !== 'undefined') {
        Object.values(weeklySchedule).forEach(day => {
            day.forEach(c => {
                if(c.subject) subjects.add(c.subject);
            });
        });
    }

    subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.innerText = s;
        select.appendChild(opt);
    });
}