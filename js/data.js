// --- 資料存取核心 ---

// 載入資料的主函式
function loadData() {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const dbKey = 'CampusKing_v6.0_' + uid;
    
    const savedData = localStorage.getItem(dbKey);
    if (savedData) {
        parseAndApplyData(JSON.parse(savedData));
    } else {
        initDefaultData();
    }

    if (navigator.onLine) {
        syncFromCloud(uid);
    }
    refreshUI();

    if (Notification.permission === "granted") {
        if (typeof startCourseChecker === 'function') {
            startCourseChecker();
        }
    }
}

// 解析並應用資料物件至全域變數
function parseAndApplyData(parsed) {
    allData = parsed.allData || {};
    semesterList = parsed.semesterList || ["114-2"];
    userTitle = parsed.userTitle || (currentUser && currentUser.displayName ? currentUser.displayName : "同學");
    currentSemester = parsed.currentSemester || semesterList[0];
    graduationTarget = parsed.graduationTarget || 128;

    if (parsed.paymentMethods) {
        paymentMethods = parsed.paymentMethods;
    }
    if (parsed.periodConfig) {
        periodConfig = parsed.periodConfig;
    }
    if (parsed.userSchoolInfo) {
        userSchoolInfo = parsed.userSchoolInfo;
    }
    if (parsed.categoryTargets) {
        categoryTargets = parsed.categoryTargets;
    } else {
        categoryTargets = {};
    }

    if (parsed.notificationSettings) {
        notificationSettings = parsed.notificationSettings;
    }

    loadSemesterData(currentSemester);
}

// 初始化預設資料
function initDefaultData() {
    semesterList = ["114-1"];
    currentSemester = "114-2";
    allData = {
        "114-2": {
            schedule: JSON.parse(JSON.stringify(defaultSchedule)),
            grades: [],
            regularExams: {},
            midtermExams: {},
            calendarEvents: []
        }
    };
    loadSemesterData(currentSemester);
}

// 從 Firebase 雲端同步資料
function syncFromCloud(uid) {
    const statusBtn = document.getElementById('user-badge');
    if(statusBtn) statusBtn.innerText = "同步中...";

    db.collection("users").doc(uid).get().then((doc) => {
        if (doc.exists) {
            const cloudData = doc.data();
            console.log("🔥 雲端資料已下載");
            
            parseAndApplyData(cloudData);
            
            const dbKey = 'CampusKing_v6.0_' + uid;
            localStorage.setItem(dbKey, JSON.stringify(cloudData));

            refreshUI();
            if(statusBtn) statusBtn.innerText = '學生';
        } else {
            console.log("☁️ 此帳號尚無雲端資料，將自動上傳本地資料...");
            saveData();
            if(statusBtn) statusBtn.innerText = '學生';
        }
    }).catch((error) => {
        console.error("同步失敗:", error);
        if(statusBtn) statusBtn.innerText = "離線";
    });
}

// 儲存資料 (同時存入 LocalStorage 與 Firebase)
function saveData() {
    if (!currentUser) return;
    // 將目前操作中的變數寫回 allData 結構中
    allData[currentSemester] = { 
        schedule: weeklySchedule,                   // 目前的週課表資料
        lottery: lotteryList,                       // 儲存籤筒資料
        grades: gradeList,                          // 目前的學期成績單資料
        regularExams: regularExams,                 // 目前的平常考成績
        midtermExams: midtermExams,                 // 目前的段考成績
        calendarEvents: calendarEvents,             // 目前的行事曆活動
        accounting: accountingList,                 // 目前的收支記帳紀錄
        notes: quickNotes,                          // 目前的快述記事
        anniversaries: anniversaryList,             // 目前的紀念日列表
        startDate: semesterStartDate,               // 學期開始日期
        endDate: semesterEndDate,                   // 學期結束日期
        learning: learningList,                     // 學習進度計畫
        notificationSettings: notificationSettings, // 儲存通知設定
        homework: homeworkList,                     // 存儲作業資料
    };

    // 準備要儲存的完整物件
    const storageObj = {
        allData: allData,                       // 包含所有學期 (如 113-1, 114-2) 的完整資料結構
        semesterList: semesterList,             // 學期名稱列表 (用於選單)
        currentSemester: currentSemester,       // 紀錄使用者目前停留在哪個學期
        graduationTarget: graduationTarget,     // 畢業總學分目標 (全域設定)
        categoryTargets: categoryTargets,       // 各領域/必選修學分目標 (全域設定)
        userSchoolInfo: userSchoolInfo,         // 加入學校校系
        periodConfig: periodConfig,             // 課堂時間設定 (上課時長、起始時間)
        paymentMethods: paymentMethods,         // 將支付方式列表加入存檔物件中
        userTitle: userTitle,

        // 加入伺服器時間戳記 (這只對 Firestore 有效，存入 LocalStorage 前會被移除)
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    const dbKey = 'CampusKing_v6.0_' + currentUser.uid;
    // 複製一份給本地儲存 (移除 serverTimestamp 因為 LocalStorage 不支援)
    const localObj = JSON.parse(JSON.stringify(storageObj)); 
    delete localObj.lastUpdated; 
    localStorage.setItem(dbKey, JSON.stringify(localObj));

    db.collection("users").doc(currentUser.uid).set(storageObj, { merge: true })
    .then(() => {
        console.log("✅ 資料已備份至雲端");
    })
    .catch((error) => {
        console.error("❌ 雲端備份失敗: ", error);
    });

    refreshUI();
}

// 刷新所有介面 (當資料變更時呼叫此函式以更新畫面)
function refreshUI() {
    renderSemesterOptions(); // 重新渲染學期選單 (例如 113-1, 114-2)

    if (typeof updateExamSubjectOptions === 'function') updateExamSubjectOptions();
    
    switchDay(currentDay);
    loadGrades();

    // 安全地呼叫各個模組的渲染函式 (如果該模組已載入)
    if (typeof renderRegularExams === 'function') renderRegularExams(); // 平常考列表
    if (typeof renderMidtermExams === 'function') renderMidtermExams(); // 段考列表
    if (typeof renderCalendar === 'function') renderCalendar();         // 行事曆
    if (typeof renderWeeklyTable === 'function') renderWeeklyTable();   // 完整週課表網格
    if (typeof renderAnalysis === 'function') renderAnalysis();         // 成績趨勢圖表分析
    
    // 取得畢業學分目標的輸入框元素
    const targetInput = document.getElementById('setting-grad-target');
    // 若元素存在，將目前的設定值 (graduationTarget) 填入輸入框
    if (targetInput) targetInput.value = graduationTarget;

    if (typeof renderCategorySettingsInputs === 'function') renderCategorySettingsInputs(); // 學分分類設定輸入框
    if (typeof renderCreditSettings === 'function') renderCreditSettings();                 // 學分設定介面 (高中/大學)
    if (typeof renderAccounting === 'function') renderAccounting();                         // 記帳介面
    if (typeof renderNotes === 'function') renderNotes();                                   // 筆記列表
    if (typeof renderAnniversaries === 'function') renderAnniversaries();                   // 紀念日列表
    if (typeof renderSemesterSettings === 'function') renderSemesterSettings();             // 學期日期設定介面
    if (typeof renderLottery === 'function') renderLottery();                               // 重新渲染籤筒
    if (typeof renderNotificationApp === 'function') renderNotificationApp();               // 如果有定義通知
    if (typeof renderHomework === 'function') renderHomework();                             // 重新渲染作業列表
    // 確保成績輸入視窗的「分類下拉選單」是根據使用者的設定產生的
    if (typeof updateGradeCategoryOptions === 'function') updateGradeCategoryOptions();

    // 更新頂部導航列的名稱
    const nameDisplay = document.getElementById('user-name-display');
    if (nameDisplay) nameDisplay.innerText = userTitle;

    // 更新設定頁面的目前狀態
    const settingName = document.getElementById('setting-user-title');
    if (settingName) settingName.innerText = userTitle;
}

// 載入指定學期的資料到全域變數
function loadSemesterData(sem) {
    // 若該學期資料不存在 (例如剛新增的學期)，則初始化一個空的預設物件結構
    if (!allData[sem]) allData[sem] = {
        // 使用 JSON 序列化再反序列化，來進行「深拷貝」，確保新學期擁有獨立的課表結構，而不受預設值連動影響
        schedule: JSON.parse(JSON.stringify(defaultSchedule)),
        // 籤筒資料 (如果是新學期，給予預設值)
        lottery: JSON.parse(JSON.stringify(defaultLotteryData)),
        grades: [],         // 空的成績陣列
        regularExams: {},   // 空的平常考物件
        midtermExams: {},   // 空的段考物件
        calendarEvents: [], // 空的行事曆陣列
        accounting: [],     // 空的記帳陣列
        notes: [],          // 空的筆記陣列
        startDate: "",      // 學期開始日為空字串
        endDate: "",        // 學期結束日為空字串
        homework: [],       // 空的作業陣列
    };

    // --- 將資料庫中的資料指派給全域操作變數 (State)，方便其他 js 存取與修改 ---
    weeklySchedule = allData[sem].schedule;             // 載入週課表
    gradeList = allData[sem].grades;                    // 載入成績列表
    regularExams = allData[sem].regularExams || {};     // 載入平常考成績，若無資料則給予空物件 {} 以防錯誤
    midtermExams = allData[sem].midtermExams || {};     // 載入段考成績，若無資料則給予空物件 {}
    calendarEvents = allData[sem].calendarEvents || []; // 載入行事曆，若無資料則給予空陣列 []
    accountingList = allData[sem].accounting || [];     // 載入記帳資料，若無資料則給予空陣列 []
    quickNotes = allData[sem].notes || [];              // 載入筆記資料，若無資料則給予空陣列 []
    anniversaryList = allData[sem].anniversaries || []; // 載入紀念日資料，若無資料則給予空陣列 []
    homeworkList = allData[sem].homework || [];         // 載入作業資料，若無資料則給予空陣列 []
    learningList = allData[sem].learning || [];         // 載入學習計畫，若無資料則給予空陣列 []
    lotteryList = allData[sem].lottery || JSON.parse(JSON.stringify(defaultLotteryData));
    // 載入學期開始與結束日期
    semesterStartDate = allData[sem].startDate || "";
    semesterEndDate = allData[sem].endDate || "";
}

// 更新學分分類目標 (設定頁功能)
function updateCategorySettings(category, type, value) {
    const val = parseInt(value) || 0;
    if (typeof categoryTargets[category] === 'object') {
        if (type === '必修') categoryTargets[category]['必修'] = val;
        if (type === '選修') categoryTargets[category]['選修'] = val;
    } else {
        categoryTargets[category] = val;
    }
    saveData();
    if (typeof renderAnalysis === 'function') renderAnalysis();
}