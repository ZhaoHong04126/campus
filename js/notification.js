// 請求瀏覽器通知權限
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        showAlert("您的瀏覽器不支援通知功能", "無法使用");
        return;
    }

    Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
            showAlert("✅ 已開啟課程提醒！\n系統將在課前 10 分鐘通知您。", "設定成功");
            startCourseChecker();
        } else {
            showAlert("❌ 您拒絕了通知權限，無法收到提醒。", "設定失敗");
        }
    });
}

// 檢查是否該發送通知
function checkUpcomingCourses() {
    if (Notification.permission !== "granted") return;
    const now = new Date();
    const day = now.getDay() === 0 ? 0 : now.getDay();
    const todayCourses = weeklySchedule[day] || [];
    
    todayCourses.forEach(course => {
        if (!course.time) return;

        const [cHour, cMinute] = course.time.split(':').map(Number);
        const courseTime = new Date();
        courseTime.setHours(cHour, cMinute, 0, 0);
        const diffMs = courseTime - now;
        const diffMins = Math.floor(diffMs / 1000 / 60);

        if (diffMins === 10) {
            const storageKey = `notif_course_${day}_${course.subject}_${course.time}`;
            if (!sessionStorage.getItem(storageKey)) {
                sendNotification(`🔔 上課提醒：${course.subject}`, `時間：${course.time}\n地點：${course.room || '未定'}`);
                sessionStorage.setItem(storageKey, 'true');
                
                setTimeout(() => sessionStorage.removeItem(storageKey), 3600 * 1000);
            }
        }
    });
}

// 實際發送通知的函式
function sendNotification(course) {
    const iconUrl = "https://cdn-icons-png.flaticon.com/512/2921/2921222.png"; 

    const title = `🔔 上課提醒：${course.subject}`;
    const options = {
        body: `時間：${course.time}\n地點：${course.room || '未定'}\n老師：${course.teacher || '未定'}`,
        icon: iconUrl,
        badge: iconUrl,
        vibrate: [200, 100, 200]
    };

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
        });
    } else {
        new Notification(title, options);
    }
}

// 每日晨間快報 (活動 + 紀念日)
function checkDailyBriefing() {
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour !== 7) return;

    const todayStr = now.toISOString().split('T')[0];
    const sentKey = `daily_briefing_sent_${todayStr}`;

    if (localStorage.getItem(sentKey)) return;

    let messages = [];

    if (typeof calendarEvents !== 'undefined') {
        const todayEvents = calendarEvents.filter(e => e.date === todayStr);
        todayEvents.forEach(e => {
            messages.push(`📅 行事曆：${e.title}`);
        });
    }

    if (typeof anniversaryList !== 'undefined') {
        anniversaryList.forEach(a => {
            const tDate = new Date(a.date);
            if (tDate.getMonth() === now.getMonth() && tDate.getDate() === now.getDate()) {
                messages.push(`💝 紀念日：${a.title} (就是今天！)`);
            }
        });
    }

    const day = now.getDay() === 0 ? 0 : now.getDay();
    const todayCourses = typeof weeklySchedule !== 'undefined' ? (weeklySchedule[day] || []) : [];
    if (todayCourses.length > 0) {
        todayCourses.sort((a, b) => (a.time || "23:59").localeCompare(b.time || "23:59"));
        const firstCourse = todayCourses[0];
        messages.push(`📚 第一堂課：${firstCourse.time} ${firstCourse.subject}`);
    }

    if (messages.length > 0) {
        sendNotification(
            `☀️ 早安！今日校園快報`, 
            messages.join('\n')
        );
        console.log("已發送晨間快報");
    }

    localStorage.setItem(sentKey, 'true');
}

// 通用發送函式
function sendNotification(title, body) {
    const iconUrl = "https://cdn-icons-png.flaticon.com/512/2921/2921222.png"; 

    const options = {
        body: body,
        icon: iconUrl,
        badge: iconUrl,
        vibrate: [200, 100, 200]
    };

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
        });
    } else {
        new Notification(title, options);
    }
}

let notificationInterval = null;
function startCourseChecker() {
    if (notificationInterval) clearInterval(notificationInterval);
    
    checkUpcomingCourses();
    checkDailyBriefing();
    
    notificationInterval = setInterval(() => {
        checkUpcomingCourses();
        checkDailyBriefing();
    }, 60000); 
    
    console.log("⏰ 通知服務已啟動 (課前提醒 + 每日晨報)");
}