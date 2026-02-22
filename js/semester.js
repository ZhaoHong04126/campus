// 渲染學期下拉選單
function renderSemesterOptions() {
    const select = document.getElementById('semester-select');
    if (!select) return;
    select.innerHTML = '';
    
    semesterList.sort().reverse();
    semesterList.forEach(sem => {
        const option = document.createElement('option');
        option.value = sem;
        option.text = sem;
        if (sem === currentSemester) option.selected = true;
        select.appendChild(option);
    });
}
// 切換學期 (綁定在下拉選單 onChange)
function switchSemester() {
    const select = document.getElementById('semester-select');
    const newSemester = select.value;
    
    saveData(); // 1. 先存檔舊學期的資料 (此時變數還是舊的，這是為了保護舊資料)
    currentSemester = newSemester;
    loadSemesterData(currentSemester);
    saveData(); // 4. 再次存檔！
    refreshUI();
}


// 新增學期
function addNewSemester() {
    showPrompt("請輸入新學期名稱 (例如: 114-1)", "114-2", "新增學期")
    .then(newSemName => {
        if (newSemName) {
            saveData();

            if (semesterList.includes(newSemName)) {
                showAlert("這個學期已經存在囉！", "重複");
                currentSemester = newSemName;
            } else {
                semesterList.push(newSemName);
                currentSemester = newSemName;
                allData[newSemName] = { 
                    schedule: JSON.parse(JSON.stringify(defaultSchedule)),
                    grades: [],
                    regularExams: {},
                    midtermExams: {},
                    calendarEvents: [],
                    accounting: [],
                    notes: [],
                    anniversaries: [],
                    learning: [],
                };
            }

            loadSemesterData(currentSemester);
            saveData();
            renderSemesterOptions();
            showAlert(`已切換至 ${newSemName}`, "成功");
        }
    });
}

// 修改學期名稱
function editSemester() {
    showPrompt("請輸入新的學期名稱", currentSemester, "修改名稱")
    .then(newName => {
        if (newName && newName !== currentSemester) {
            if (semesterList.includes(newName)) {
                showAlert("名稱重複！", "錯誤");
                return;
            } 
            allData[newName] = allData[currentSemester];
            delete allData[currentSemester];
            
            const index = semesterList.indexOf(currentSemester);
            semesterList[index] = newName;
            currentSemester = newName;

            saveData();
            renderSemesterOptions();
            showAlert("修改成功！", "完成");
        }
    });
}

// 刪除學期
function deleteSemester() {
    if (semesterList.length <= 1) {
        showAlert("至少要保留一個學期，無法刪除！", "無法執行");
        return;
    }
    
    showConfirm(`確定要刪除「${currentSemester}」的所有資料嗎？此動作無法復原！`, "刪除確認")
    .then(isConfirmed => {
        if (isConfirmed) {
            delete allData[currentSemester];
            semesterList = semesterList.filter(s => s !== currentSemester);
            currentSemester = semesterList[0];

            saveData();
            loadSemesterData(currentSemester);
            refreshUI();
            showAlert("已刪除並切換至上一個學期", "完成");
        }
    });
}

// 儲存學期日期設定 (開學/結束日)
function saveSemesterDates() {
    const startVal = document.getElementById('setting-sem-start').value;
    const endVal = document.getElementById('setting-sem-end').value;

    if (!startVal) {
        showAlert("請至少設定「學期開始日」！", "無法儲存");
        return;
    }
    
    semesterStartDate = startVal;
    semesterEndDate = endVal;

    saveData();
    refreshUI();

    showAlert("學期日期已更新！", "儲存成功");
    
    toggleSemesterEdit();
}

// 更新學期設定介面顯示
function renderSemesterSettings() {
    const startInput = document.getElementById('setting-sem-start');
    const endInput = document.getElementById('setting-sem-end');
    const startText = document.getElementById('text-sem-start');
    const endText = document.getElementById('text-sem-end');
    
    if (startInput) startInput.value = semesterStartDate;
    if (endInput) endInput.value = semesterEndDate;
    if (startText) startText.innerText = semesterStartDate || "未設定";
    if (endText) endText.innerText = semesterEndDate || "未設定";
    
    updateSemesterStatus();
}

// 計算並顯示目前週次 (在首頁與設定頁)
function updateSemesterStatus() {
    const statusDiv = document.getElementById('semester-status-text');
    if (!statusDiv) return;

    if (!semesterStartDate) {
        statusDiv.innerText = "尚未設定學期開始日";
        statusDiv.style.color = "#999";
        return;
    }

    const start = new Date(semesterStartDate);
    const now = new Date();
    const end = semesterEndDate ? new Date(semesterEndDate) : null;

    const diffTime = now - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        statusDiv.innerText = `距離開學還有 ${Math.abs(diffDays)} 天`;
        statusDiv.style.color = "#f39c12";
    } else {
        const weekNum = Math.ceil(diffDays / 7);
        
        if (end && now > end) {
             statusDiv.innerText = "學期已結束";
             statusDiv.style.color = "#999";
        } else {
             statusDiv.innerText = `🟢 目前是 第 ${weekNum} 週`;
             statusDiv.style.color = "var(--primary)";
        }
    }
}

let isEditingSemester = false;
// 切換學期日期的檢視/編輯模式
function toggleSemesterEdit() {
    isEditingSemester = !isEditingSemester;
    const viewDiv = document.getElementById('semester-date-view-mode');
    const editDiv = document.getElementById('semester-date-edit-mode');
    const btn = document.getElementById('btn-edit-semester-dates');

    if (isEditingSemester) {
        viewDiv.style.display = 'none';
        editDiv.style.display = 'block';
        btn.style.display = 'none';
        
        const startInput = document.getElementById('setting-sem-start');
        const endInput = document.getElementById('setting-sem-end');
        if(startInput) startInput.value = semesterStartDate;
        if(endInput) endInput.value = semesterEndDate;

    } else {
        viewDiv.style.display = 'block';
        editDiv.style.display = 'none';
        btn.style.display = 'block';
        
        renderSemesterSettings();
    }
}