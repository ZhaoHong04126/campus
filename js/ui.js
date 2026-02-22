// --- 自訂全域彈窗元件 (Custom Modals) ---

// 全域函式：顯示自訂 Alert Modal
// message: 提示訊息內容, title: 標題 (預設為 "💡 提示")
window.showAlert = function(message, title = "💡 提示") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        if(!modal) { alert(message); resolve(); return; }
        
        document.getElementById('custom-modal-title').innerText = title;
        document.getElementById('custom-modal-message').innerText = message;
        document.getElementById('custom-modal-input-container').style.display = 'none';
        
        const actions = document.getElementById('custom-modal-actions');
        actions.innerHTML = `<button class="btn" onclick="closeCustomModal(true)" style="flex:1; max-width:120px;">好，知道了</button>`;
        
        window._customModalResolve = resolve;
        
        modal.style.display = 'flex';
    });
}

// 全域函式：顯示自訂 Confirm Modal (取代原生的 window.confirm)
// 回傳 true (確定) 或 false (取消)
window.showConfirm = function(message, title = "❓ 確認") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        // 若無 Modal 元素，退回原生 confirm
        if(!modal) { resolve(confirm(message)); return; }
        
        // 設定文字
        document.getElementById('custom-modal-title').innerText = title;
        document.getElementById('custom-modal-message').innerText = message;
        // 隱藏輸入框
        document.getElementById('custom-modal-input-container').style.display = 'none';
        
        // 設定按鈕區塊：顯示「取消」與「確定」雙按鈕
        const actions = document.getElementById('custom-modal-actions');
        actions.innerHTML = `
            <button class="btn" onclick="closeCustomModal(false)" style="flex:1; background:#eee; color:#666;">取消</button>
            <button class="btn" onclick="closeCustomModal(true)" style="flex:1;">確定</button>
        `;
        
        // 暫存 resolve
        window._customModalResolve = resolve;
        // 顯示 Modal
        modal.style.display = 'flex';
    });
}

// 全域函式：顯示自訂 Prompt Modal (取代原生的 window.prompt)
// 回傳使用者輸入的字串，若取消則回傳 null
window.showPrompt = function(message, defaultValue = "", title = "✏️ 輸入") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        if(!modal) { resolve(prompt(message, defaultValue)); return; }
        
        document.getElementById('custom-modal-title').innerText = title;
        document.getElementById('custom-modal-message').innerText = message;
        
        const inputContainer = document.getElementById('custom-modal-input-container');
        const input = document.getElementById('custom-modal-input');
        inputContainer.style.display = 'block';
        
        input.value = defaultValue;
        input.focus();
        
        const actions = document.getElementById('custom-modal-actions');
        actions.innerHTML = `
            <button class="btn" onclick="closeCustomModal(null)" style="flex:1; background:#eee; color:#666;">取消</button>
            <button class="btn" onclick="closeCustomModal(document.getElementById('custom-modal-input').value)" style="flex:1;">確定</button>
        `;
        
        window._customModalResolve = resolve;
        modal.style.display = 'flex';
    });
}

// 關閉自訂 Modal 並回傳 Promise 結果的通用函式
window.closeCustomModal = function(result) {
    const modal = document.getElementById('custom-modal');
    modal.style.display = 'none';
    
    if (window._customModalResolve) {
        window._customModalResolve(result);
        window._customModalResolve = null;
    }
}

// --- 路由與導航控制 (Routing) ---

// 監聽瀏覽器上一頁/下一頁事件
window.addEventListener('popstate', (event) => {
    const targetView = event.state ? event.state.view : 'home';
    switchTab(targetView, false);
});

// 左上角返回按鈕的功能
function goBack() {
    if (window.history.state && window.history.state.view !== 'home') {
        window.history.back();
    } else {
        switchTab('home');
    }
}

// 核心頁面切換函式
// tabName: 目標頁面的 ID 後綴 (例如 'schedule')
// addToHistory: 是否要將此次切換加入瀏覽器歷史紀錄 (預設 true)
function switchTab(tabName, addToHistory = true) {
    // 定義所有可能的頁面 ID 列表，用於重置顯示狀態
    const views = [
        'home', 'schedule', 'calendar', 
        'info', 'settings', 'chart', 
        'credits', 'regular', 'midterm', 
        'grades', 'exams-hub', 'grade-manager', 
        'accounting', 'notes', 'anniversary', 
        'learning', 'lottery', 'notifications',
        'homework',
    ];
    
    views.forEach(view => {
        const el = document.getElementById('view-' + view);
        if (el) el.style.display = 'none';
        
        const btn = document.getElementById('btn-' + view);
        if (btn) btn.classList.remove('active');
    });

    const targetView = document.getElementById('view-' + tabName);
    if (targetView) {
        targetView.style.display = 'block';
        document.body.setAttribute('data-page', tabName);
    }
    
    const targetBtn = document.getElementById('btn-' + tabName);
    if (targetBtn) targetBtn.classList.add('active');

    const backBtn = document.getElementById('nav-back-btn');
    const homeBtn = document.getElementById('nav-home-btn');
    const titleEl = document.getElementById('app-title');
    
    if (tabName === 'home') {
        if (backBtn) backBtn.style.display = 'none';
        if (homeBtn) homeBtn.style.display = 'none';
        if (titleEl) titleEl.innerText = '📅 校園王';
    } else {
        if (backBtn) backBtn.style.display = 'block';
        if (homeBtn) homeBtn.style.display = 'block';
        
        let pageTitle = "校園王";
        switch(tabName) {
            case 'schedule': pageTitle = "我的課表"; break;
            case 'calendar': pageTitle = "學期行事曆"; break;
            case 'grade-manager': pageTitle = "成績管理"; break;
            case 'accounting': pageTitle = "學期記帳"; break;
            case 'notes': pageTitle = "記事本"; break;
            case 'anniversary': pageTitle = "紀念日"; break;
            case 'info': pageTitle = "系統資訊"; break;
            case 'settings': pageTitle = "個人設定"; break;
            case 'lottery': pageTitle = "幸運籤筒"; break;
            case 'learning': pageTitle = "學習進度"; break;
            case 'notifications': pageTitle = "通知中心"; break;
            case 'homework': pageTitle = "作業管理"; break;
        }
        const titleEl = document.getElementById('app-title');
        if (titleEl) titleEl.innerText = pageTitle;
    }

    if (addToHistory) {
        if (tabName !== 'home') {
            history.pushState({ view: tabName }, null, `#${tabName}`);
        } else {
            history.pushState({ view: 'home' }, null, './');
        }
    }

    // --- 針對特定頁面執行初始化邏輯 ---
    
    if (tabName === 'schedule') {
        switchDay(currentDay);
        if (typeof switchScheduleMode === 'function') switchScheduleMode('daily');
    }
    if (tabName === 'calendar') {
        if (typeof renderCalendar === 'function') renderCalendar();
    }
    if (tabName === 'info') loadAnnouncements();
    if (tabName === 'grade-manager' && typeof switchGradeTab === 'function') switchGradeTab('dashboard');
    if (tabName === 'accounting') {
        if (typeof switchAccTab === 'function') switchAccTab('summary');
        else if (typeof renderAccounting === 'function') renderAccounting();
    }
    if (tabName === 'learning') {
        if (typeof renderLearning === 'function') renderLearning();
    }
    if (tabName === 'lottery') {
        if (typeof renderLottery === 'function') renderLottery();
    }
    if (tabName === 'notifications') {
        if (typeof renderNotificationApp === 'function') renderNotificationApp();
    }
    if (tabName === 'homework') {
        if (typeof renderHomework === 'function') renderHomework();
    }
}

// 載入公告列表
function loadAnnouncements() {
    const infoContent = document.getElementById('info-content');
    if (!infoContent) return;
    
    const oldList = document.getElementById('announcement-list');
    if (oldList) oldList.remove();
    
    const listContainer = document.createElement('div');
    listContainer.id = 'announcement-list';
    listContainer.style.marginTop = '15px';
    listContainer.innerHTML = '<p style="color:#999;">正在載入最新公告...</p>';
    
    infoContent.appendChild(listContainer);
    
    db.collection("announcements").orderBy("createdAt", "desc").limit(10).get()
    .then((querySnapshot) => {
        let html = '<h4 style="color: var(--primary); margin-top:20px;">📢 最新公告</h4>';
        
        if (querySnapshot.empty) {
            html += '<p style="color:#666; font-size:0.9rem;">目前沒有新公告。</p>';
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const docId = doc.id;
                
                let dateStr = "剛剛";
                if (data.createdAt) {
                    const date = data.createdAt.toDate();
                    dateStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${(date.getMinutes()<10?'0':'') + date.getMinutes()}`;
                }
                
                let adminBtns = '';
                if (currentUser && currentUser.uid === ADMIN_UID) {
                    const safeContent = encodeURIComponent(data.content);
                    adminBtns = `
                        <div style="margin-top: 8px; text-align: right; border-top: 1px dashed #ddd; padding-top: 5px;">
                            <button onclick="editAnnouncement('${docId}', '${safeContent}')" style="background:transparent; border:none; color:#f39c12; cursor:pointer; font-size:0.85rem; margin-right:10px;">✏️ 編輯</button>
                            <button onclick="deleteAnnouncement('${docId}')" style="background:transparent; border:none; color:#e74c3c; cursor:pointer; font-size:0.85rem;">🗑️ 刪除</button>
                        </div>
                    `;
                }
                
                html += `
                <div style="background: var(--bg); padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid var(--warning);">
                    <div style="font-size: 0.95rem; color: var(--text-main); white-space: pre-wrap;">${data.content}</div>
                    <div style="text-align: right; font-size: 0.75rem; color: var(--text-sub); margin-top: 5px;">
                        ${dateStr}
                    </div>
                    ${adminBtns}
                </div>`;
            });
        }
        listContainer.innerHTML = html;
    })
    .catch((error) => {
        console.error("Error getting documents: ", error);
        listContainer.innerHTML = '<p style="color:var(--danger);">無法載入公告 (請確認網路)</p>';
    });
}

// --- 介面初始化 ---

// 應用程式初始化 (登入後呼叫)
function initUI() {
    loadTheme(); 
    document.getElementById('user-badge').innerText = '學生';
    
    const uniElements = document.querySelectorAll('.uni-only');
    uniElements.forEach(el => el.style.display = 'table-cell'); 
    
    switchDay(currentDay);
    loadGrades();
    if (typeof renderWeeklyTable === 'function') renderWeeklyTable();
    if (typeof renderAnalysis === 'function') renderAnalysis();
}

let isEditingCredits = false;


// 新增分類的邏輯
window.addNewCategory = function() {
    const nameInput = document.getElementById('new-cat-name');
    const typeInput = document.getElementById('new-cat-type');
    const name = nameInput.value.trim();
    
    if (!name) { showAlert("請輸入分類名稱"); return; }
    if (categoryTargets[name]) { showAlert("這個分類已經存在囉！"); return; }

    if (typeInput.value === 'complex') {
        categoryTargets[name] = { "必修": 0, "選修": 0 };
    } else {
        categoryTargets[name] = 0;
    }

    nameInput.value = '';
    renderCreditSettings(); 
}

// 刪除分類的邏輯
window.deleteCategory = function(name) {
    if(confirm(`確定要刪除「${name}」分類嗎？\n(注意：這不會刪除已登記的成績，但在圖表中將會歸類到「其他」)`)) {
        delete categoryTargets[name];
        renderCreditSettings();
    }
}


// --- 深色模式 (Dark Mode) ---

// 切換主題 (Light <-> Dark)
function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
}

// 載入已儲存的主題 (初始化時呼叫)
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);
}

// 更新主題相關的 UI 顯示 (例如開關狀態文字)
function updateThemeUI(theme) {
    const statusEl = document.getElementById('theme-status');
    if (statusEl) {
        statusEl.innerText = theme === 'dark' ? 'ON' : 'OFF';
        statusEl.style.color = theme === 'dark' ? '#2ecc71' : '#ccc';
    }
    if (window.gradeChartInstance) {}
}

// --- 課表匯出功能 ---

// 使用 html2canvas 將週課表表格轉為圖片下載
function exportSchedule() {
    const table = document.querySelector('.weekly-table');
    if (!table) return;
    
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ 處理中...";
    
    html2canvas(table, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `我的課表_${currentSemester || 'export'}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        
        btn.innerHTML = originalText;
        showAlert("課表圖片已下載至您的裝置！", "匯出成功");
    }).catch(err => {
        console.error(err);
        btn.innerHTML = originalText;
        showAlert("圖片製作失敗，請稍後再試", "錯誤");
    });
}

// --- 公告管理功能 (管理員) ---

// 編輯公告
function editAnnouncement(docId, encodedContent) {
    const oldContent = decodeURIComponent(encodedContent);
    showPrompt("修改公告內容：", oldContent, "✏️ 編輯公告")
    .then((newContent) => {
        if (newContent !== null && newContent.trim() !== "") {
            db.collection("announcements").doc(docId).update({
                content: newContent,
            })
            .then(() => {
                showAlert("公告已更新！", "成功");
                loadAnnouncements();
            })
            .catch((error) => {
                showAlert("更新失敗：" + error.message, "錯誤");
            });
        }
    });
}

// 刪除公告
function deleteAnnouncement(docId) {
    showConfirm("確定要永久刪除這則公告嗎？", "🗑️ 刪除確認")
    .then((isConfirmed) => {
        if (isConfirmed) {
            db.collection("announcements").doc(docId).delete()
            .then(() => {
                showAlert("公告已刪除。", "完成");
                loadAnnouncements();
            })
            .catch((error) => {
                showAlert("刪除失敗：" + error.message, "錯誤");
            });
        }
    });

}
// 修改顯示名稱的功能
function editUserTitle() {
    showPrompt("請輸入要在 APP 中顯示的名稱或稱號", userTitle, "設定顯示名稱")
    .then(newName => {
        if (newName && newName.trim() !== "") {
            userTitle = newName.trim();
            saveData();
            refreshUI();
            showAlert("名稱已更新！");
        }
    });
}

// --- 通知中心 APP 邏輯 ---

// 渲染通知設定介面
window.renderNotificationApp = function() {
    const list = document.getElementById('notification-settings-list');
    if (!list) return;

    const createToggle = (key, title, desc, icon) => {
        const isOn = notificationSettings[key];
        const statusColor = isOn ? 'var(--primary)' : '#ccc';
        const statusText = isOn ? 'ON' : 'OFF';
        
        return `
        <div class="settings-item" onclick="toggleNotificationSetting('${key}')" style="padding: 20px 10px;">
            <div style="display:flex; align-items:center;">
                <span style="font-size:1.5rem; margin-right:15px; background:#f0f0f0; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:12px;">${icon}</span>
                <div>
                    <div style="font-weight:bold; font-size:1rem; margin-bottom:4px;">${title}</div>
                    <div style="font-size:0.85rem; color:#888;">${desc}</div>
                </div>
            </div>
            <div style="font-size:1.2rem; font-weight:bold; color: ${statusColor};">
                ${statusText}
            </div>
        </div>`;
    };

    list.innerHTML = 
        createToggle('course', '課前提醒', '上課前 10 分鐘自動發送通知', '📚') +
        createToggle('daily', '每日晨報', '每天 07:00 摘要今日行程', '☀️') +
        createToggle('anniversary', '紀念日提醒', '重要日子當天早上發送提醒', '💝');
}

// 切換設定
window.toggleNotificationSetting = function(key) {
    notificationSettings[key] = !notificationSettings[key];
    saveData();
    renderNotificationApp();
    
    const status = notificationSettings[key] ? "已開啟" : "已關閉";
    if(window.showAlert) showAlert(`${status}通知`, "設定更新");
}

// 開啟登入視窗
function openLoginModal() {
    const modal = document.getElementById('login-overlay');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.transition = 'opacity 0.3s';
            modal.style.opacity = '1';
        }, 10);
    }
}

// 關閉登入視窗
function closeLoginModal() {
    const modal = document.getElementById('login-overlay');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 讓按鈕平滑滾動到特色區塊
function scrollToFeatures() {
    const section = document.getElementById('features');
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}