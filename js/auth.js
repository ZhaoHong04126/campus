// --- 帳號驗證與管理 ---

// 切換登入/註冊模式的函式
function toggleLoginMode() {
    isRegisterMode = !isRegisterMode;
    const btn = document.getElementById('btn-submit');
    const toggleBtn = document.getElementById('toggle-btn');
    const toggleText = document.getElementById('toggle-text');
    
    if (isRegisterMode) { 
        btn.innerText = "註冊並登入"; 
        toggleText.innerText = "已經有帳號？"; 
        toggleBtn.innerText = "直接登入"; 
    }
    else { 
        btn.innerText = "登入"; 
        toggleText.innerText = "還沒有帳號？"; 
        toggleBtn.innerText = "建立新帳號"; 
    }
}

// 處理 Email 登入/註冊的函式
function handleEmailAuth() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (!email || !password) { showAlert("請輸入 Email 和密碼", "資料不全"); return; }
    
    if (isRegisterMode) {
        auth.createUserWithEmailAndPassword(email, password)
            .catch(e => showAlert(e.message, "註冊失敗"));
    } else {
        auth.signInWithEmailAndPassword(email, password)
            .catch(e => showAlert(e.message, "登入失敗"));
    }
}

// Google 登入函式
function loginWithGoogle() {
    auth.signInWithPopup(provider).catch(e => showAlert(e.message, "登入錯誤"));
}

// 匿名登入函式
function loginAnonymously() {
    auth.signInAnonymously().catch(e => showAlert(e.message, "登入錯誤"));
}

// 登出函式
function logout() {
    if (currentUser && currentUser.isAnonymous) {
        showConfirm("⚠️ 匿名帳號登出後資料會消失，確定嗎？", "警告").then(ok => {
            if (ok) performLogout();
        });
    } else {
        performLogout();
    }
}

// 執行實際的登出動作
function performLogout() {
    auth.signOut().then(() => window.location.reload());
}

// 註銷 (刪除) 帳號函式
function deleteAccount() {
    if (!currentUser) return;

    showConfirm("⚠️ 警告：此動作將「永久刪除」您的所有資料（包含課表、成績、記帳...等），且無法復原！\n\n確定要註銷帳號嗎？", "危險操作")
    .then(isConfirmed => {
        if (isConfirmed) {
            return showPrompt("為了確認您的意願，請輸入「DELETE」", "", "最終確認");
        }
        return null;
    })
    .then(inputStr => {
        if (inputStr === "DELETE") {
            const uid = currentUser.uid;
            
            if(window.showAlert) showAlert("正在刪除資料，請稍候...", "處理中");

            db.collection("users").doc(uid).delete()
            .then(() => {
                const dbKey = 'CampusKing_v6.0_' + uid;
                localStorage.removeItem(dbKey);

                return currentUser.delete();
            })
            .then(() => {
                alert("帳號已成功註銷，感謝您的使用。"); 
                window.location.reload();
            })
            .catch((error) => {
                console.error("Delete error:", error);
                if (error.code === 'auth/requires-recent-login') {
                    showAlert("🔒 為了確保帳號安全，系統要求您必須「重新登入」後才能執行刪除操作。\n\n請登出後再登入一次試試。", "驗證過期");
                } else {
                    showAlert("註銷失敗：" + error.message, "錯誤");
                }
            });
        } else if (inputStr !== null) {
            showAlert("輸入內容不正確，已取消操作。", "取消");
        }
    });
}

// UI 狀態
function updateLoginUI(isLoggedIn) {
    const loginOverlay = document.getElementById('login-overlay');
    const landingPage = document.getElementById('landing-page');
    const dashboard = document.querySelector('.dashboard-container');
    const topBar = document.getElementById('top-bar'); 
    const userInfo = document.getElementById('user-info');
    const userPhoto = document.getElementById('user-photo');

    console.log("Login Status:", isLoggedIn);

    if (isLoggedIn) {
        // --- ✅ 已登入 ---
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (landingPage) landingPage.style.display = 'none';
        if (dashboard) dashboard.style.display = 'grid';
        if (topBar) topBar.style.display = 'flex'; 
        if (userInfo) userInfo.style.display = 'flex';
        if (userPhoto && currentUser) {
            userPhoto.src = currentUser.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
        }

    } else {
        // --- 🔒 未登入 ---
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (landingPage) landingPage.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
        if (topBar) topBar.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// 忘記密碼功能
function forgotPassword() {
    const email = document.getElementById('email').value;

    if (!email) {
        showAlert("請先在上方輸入您的 Email，系統才能寄送重設信給您！", "缺少 Email");
        return;
    }

    showConfirm(`確定要寄送重設密碼信件至 ${email} 嗎？`, "重設密碼").then(isConfirmed => {
        if (isConfirmed) {
            auth.sendPasswordResetEmail(email)
            .then(() => {
                showAlert("📧 重設信已寄出！\n\n請檢查您的信箱 (若沒收到請查看垃圾郵件)。", "寄送成功");
            })
            .catch((error) => {
                let msg = "發送失敗：" + error.message;
                if (error.code === 'auth/user-not-found') msg = "找不到此 Email 的使用者。";
                showAlert(msg, "錯誤");
            });
        }
    });
}

// 檢查是否為管理員並顯示管理面板
function checkAdminStatus() {
    if (currentUser && typeof ADMIN_UID !== 'undefined' && currentUser.uid === ADMIN_UID) {
        console.log("👨‍💻 管理員已登入");
        
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.style.display = 'block';
        }
    }
}