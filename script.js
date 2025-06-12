// 个人每日规划系统 - 核心JavaScript代码
// 实现任务管理、数据存储、统计分析等功能

// Firebase认证管理类
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
    }

    // 初始化认证状态监听器
    init() {
        // 等待Firebase初始化完成
        this.waitForFirebase().then(() => {
            this.setupAuthStateListener();
            this.setupAuthButtons();
            this.isInitialized = true;
        });
    }

    // 等待Firebase初始化
    waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseAuth && window.googleProvider) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    // 设置认证状态监听器
    setupAuthStateListener() {
        window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
            this.currentUser = user;
            this.updateAuthUI(user);
            
            if (user) {
                console.log('用户已登录:', user.displayName);
                this.onUserSignedIn(user);
            } else {
                console.log('用户未登录');
                this.onUserSignedOut();
            }
        });
    }

    // 设置认证按钮事件
    setupAuthButtons() {
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        const signOutBtn = document.getElementById('signOutBtn');

        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => this.signInWithGoogle());
        }

        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }
    }

    // Google登录
    async signInWithGoogle() {
        try {
            const result = await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider);
            const user = result.user;
            
            // 显示成功消息
            this.showAuthMessage(`欢迎回来，${user.displayName}！`, 'success');
            
        } catch (error) {
            console.error('登录失败:', error);
            this.showAuthMessage('登录失败，请重试', 'error');
        }
    }

    // 退出登录
    async signOut() {
        try {
            await window.firebaseSignOut(window.firebaseAuth);
            this.showAuthMessage('已成功退出登录', 'info');
        } catch (error) {
            console.error('退出失败:', error);
            this.showAuthMessage('退出失败，请重试', 'error');
        }
    }

    // 更新认证UI
    updateAuthUI(user) {
        const loginSection = document.getElementById('loginSection');
        const userSection = document.getElementById('userSection');
        const userAvatar = document.getElementById('userAvatar');
        const userInitials = document.getElementById('userInitials');
        const userName = document.getElementById('userName');

        if (user) {
            // 显示用户信息
            if (loginSection) loginSection.style.display = 'none';
            if (userSection) {
                userSection.style.display = 'flex';
                userSection.classList.remove('hidden');
            }
            
            // 处理用户头像
            if (user.photoURL) {
                this.loadUserAvatar(user.photoURL, userAvatar, userInitials, user.displayName || user.email);
            } else {
                // 没有头像时显示首字母
                this.showUserInitials(userInitials, userAvatar, user.displayName || user.email);
            }
            
            if (userName) {
                userName.textContent = user.displayName || user.email;
            }
            
            // 更新同步状态
            this.updateSyncStatus(true);
        } else {
            // 显示登录按钮
            if (loginSection) loginSection.style.display = 'flex';
            if (userSection) {
                userSection.style.display = 'none';
                userSection.classList.add('hidden');
            }
            
            // 重置头像显示
            if (userAvatar) {
                userAvatar.classList.add('hidden');
            }
            if (userInitials) {
                userInitials.textContent = '?';
                userInitials.classList.remove('hidden');
            }
            
            // 隐藏同步状态
            this.updateSyncStatus(false);
        }
    }

    // 加载用户头像
    loadUserAvatar(photoURL, avatarImg, initialsSpan, userName) {
        if (!avatarImg || !photoURL) return;

        // 创建新的图片对象来测试加载
        const testImg = new Image();
        testImg.crossOrigin = 'anonymous'; // 尝试解决CORS问题
        
        testImg.onload = () => {
            // 头像加载成功
            avatarImg.src = photoURL;
            avatarImg.classList.remove('hidden');
            if (initialsSpan) initialsSpan.classList.add('hidden');
        };
        
        testImg.onerror = () => {
            // 头像加载失败，显示首字母
            console.log('头像加载失败，显示首字母');
            this.showUserInitials(initialsSpan, avatarImg, userName);
        };
        
        testImg.src = photoURL;
    }

    // 显示用户名首字母
    showUserInitials(initialsSpan, avatarImg, userName) {
        if (!initialsSpan || !userName) return;
        
        // 隐藏头像图片
        if (avatarImg) avatarImg.classList.add('hidden');
        
        // 提取首字母
        const initials = this.extractInitials(userName);
        initialsSpan.textContent = initials;
        initialsSpan.classList.remove('hidden');
    }

    // 提取用户名首字母
    extractInitials(name) {
        if (!name) return '?';
        
        const words = name.trim().split(' ');
        if (words.length >= 2) {
            // 有多个词，取前两个词的首字母
            return (words[0][0] + words[1][0]).toUpperCase();
        } else {
            // 只有一个词，取前两个字符
            return name.substring(0, 2).toUpperCase();
        }
    }

    // 用户登录后的处理
    async onUserSignedIn(user) {
        // 这里可以添加登录后的初始化逻辑
        // 比如同步数据、个性化设置等
        
        if (window.taskManager) {
            // 保存当前访客数据
            const guestData = {
                dailyTasks: [...window.taskManager.dailyTasks],
                singleTasks: [...window.taskManager.singleTasks], 
                completedTasks: [...window.taskManager.completedTasks],
                statistics: {...window.taskManager.statistics}
            };
            
            // 更新数据前缀，切换到用户模式
            window.taskManager.userPrefix = `user_${user.uid}_`;
            
            // 加载用户的云端数据
            await window.taskManager.loadAllData();
            
            // 合并访客数据和云端数据
            await window.taskManager.mergeGuestData(guestData);
            
            window.taskManager.updateAllDisplays();
        }
        
        // 确保语言设置正确更新
        updateLanguage();
    }

    // 用户退出后的处理
    async onUserSignedOut() {
        // 清除用户相关数据或切换到访客模式
        if (window.taskManager) {
            window.taskManager.userPrefix = 'guest_';
            // 退出登录时，只加载访客的本地数据
            await window.taskManager.loadAllData();
            window.taskManager.updateAllDisplays();
            console.log('🔄 已切换到访客模式，显示本地数据');
        }
        
        // 确保语言设置正确更新
        updateLanguage();
    }

    // 显示认证相关消息
    showAuthMessage(message, type = 'info') {
        // 复用现有的通知系统
        if (window.taskManager && window.taskManager.showNotification) {
            window.taskManager.showNotification(message, type);
        }
    }

    // 更新同步状态显示
    updateSyncStatus(isOnline = false) {
        const syncStatus = document.getElementById('syncStatus');
        const syncIndicator = document.getElementById('syncIndicator');
        const syncText = document.getElementById('syncText');

        if (syncStatus && syncIndicator && syncText) {
            if (this.isSignedIn()) {
                syncStatus.classList.remove('hidden');
                syncStatus.classList.add('flex');
                
                if (isOnline) {
                    syncIndicator.className = 'w-2 h-2 rounded-full bg-apple-green';
                    syncText.textContent = '云端同步';
                } else {
                    syncIndicator.className = 'w-2 h-2 rounded-full bg-apple-blue';
                    syncText.textContent = '已登录';
                }
            } else {
                syncStatus.classList.add('hidden');
                syncStatus.classList.remove('flex');
            }
        }
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 检查是否已登录
    isSignedIn() {
        return this.currentUser !== null;
    }

    // 获取用户ID
    getUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }
}

// 国际化配置
const translations = {
    en: {
        // Navigation
        "nav.title": "Personal Daily Planning",
        "nav.home": "Home",
        "nav.tasks": "Task Management", 
        "nav.statistics": "Statistics",
        "nav.pending": "Pending Tasks",
        
        // Home page
        "home.totalCompleted": "Total Completed Tasks",
        "home.tasks": "tasks",
        "home.persistentFor": "Persistent For",
        "home.dailyTaskData": "Daily Task Cumulative Data",
        "home.todayTasks": "Today's Tasks",
        "home.progress": "Progress",
        "home.quickAdd": "Quick Add Task",
        "home.quickAddPlaceholder": "Enter task name...",
        "home.quickAddBtn": "Add Today's Task",
        
        // Tasks page
        "tasks.dailyTitle": "Daily Task Management",
        "tasks.addDaily": "+ Add Daily Task",
        "tasks.singleTitle": "Single Task Management",
        "tasks.addSingle": "+ Add Single Task",
        "tasks.futureTitle": "Future Task Preview",
        
        // Statistics page
        "stats.trendTitle": "Completion Trends",
        "stats.categoryTitle": "Task Category Statistics",
        "stats.detailedTitle": "Detailed Statistics",
        
        // Pending tasks page
        "pending.title": "Pending Task Management",
        "pending.all": "All",
        "pending.incomplete": "Incomplete",
        "pending.onHold": "On Hold",
        "pending.abandoned": "Abandoned",
        
        // Modal
        "modal.completeTask": "Complete Task",
        "modal.taskName": "Task Name",
        "modal.actualAmount": "Actual Completion Amount",
        "modal.enterAmount": "Enter actual completion amount",
        "modal.leaveBlank": "Leave blank to use default target value",
        "modal.notes": "Notes (Optional)",
        "modal.notesPlaceholder": "Record your thoughts, gains, or issues encountered...",
        "modal.cancel": "Cancel",
        "modal.confirm": "Confirm Completion",
        "modal.addTask": "Add Task",
        "modal.taskNameLabel": "Task Name",
        "modal.taskNamePlaceholder": "Enter task name",
        "modal.taskType": "Task Type",
        "modal.dailyTask": "Daily Task",
        "modal.singleTask": "Single Task",
        "modal.dimensionType": "Dimension Type",
        "modal.countDimension": "Count Dimension",
        "modal.timeDimension": "Time Dimension",
        "modal.simpleCompletion": "Simple Completion",
        "modal.targetValue": "Target Value",
        "modal.targetValuePlaceholder": "Enter target value",
        "modal.startDate": "Start Date",
        "modal.endDate": "End Date",
        "modal.dateNote": "Leave blank for continuous tasks",
        "modal.completionDate": "Completion Date",
        "modal.addTaskBtn": "Add Task",
        
        // Notifications
        "notification.enable": "Enable Notifications",
        "notification.description": "Get task completion reminders",
        "notification.enableBtn": "Enable",
        "notification.dismiss": "Dismiss",
        
        // Authentication
        "auth.signInWithGoogle": "Sign in with Google",
        "auth.signOut": "Sign Out",
        "auth.welcome": "Welcome back",
        "auth.signInFailed": "Sign in failed, please try again",
        "auth.signOutSuccess": "Successfully signed out",
        "auth.signOutFailed": "Sign out failed, please try again",
        
        // Dynamic content
        "completedDays": "Completed Days",
        "total": "Total",
        "activeDailyTasks": "Active Daily Tasks",
        "pendingSingleTasks": "Pending Single Tasks",
        "totalCompletions": "Total Completions",
        "delete": "Delete",
        "complete": "Complete",
        "postpone": "Postpone", 
        "abandon": "Abandon",
        "resubmit": "Resubmit",
        "cancelCompletion": "Cancel Completion",
        "dailyTaskDeleted": "Daily task permanently deleted",
        "taskDeleted": "Task deleted",
        "notificationsEnabled": "Notifications enabled!",
        "confirmCompletion": "Confirm Completion",
        "submitting": "Submitting...",
        "simpleCompletion": "Simple Completion",
        "target": "Target",
        "times": "times",
        "minutes": "minutes",
        "completedTasks": "Completed Tasks",
        "dailyTasks": "Daily Tasks",
        "singleTasks": "Single Tasks",
        "noData": "No Data",
        "noPending": "Great! No pending tasks",
        "noTodayTasks": "No tasks for today",
        "addDailyTask": "Add Daily Task",
        "addSingleTask": "Add Single Task",
        "activeDailyTasks": "Active Daily Tasks",
        "unfinishedTasks": "Unfinished Tasks",
        "overdueTasks": "Overdue Tasks",
        "todayTasks": "Today's Tasks",
        "upcomingTasks": "Upcoming Tasks",
        "noCompletedSingle": "No completed single tasks",
        "scheduledDate": "Scheduled Date",
        "completedDate": "Completed Date",
        "note": "Note",
        "reComplete": "Re-complete",
        "date": "Date",
        "todayCompletionRecords": "Today's Completion Records"
    },
    zh: {
        // Navigation  
        "nav.title": "个人每日规划",
        "nav.home": "首页",
        "nav.tasks": "任务管理",
        "nav.statistics": "数据统计", 
        "nav.pending": "未完成任务",
        
        // Home page
        "home.totalCompleted": "累计完成任务",
        "home.tasks": "个任务",
        "home.persistentFor": "已经坚持",
        "home.dailyTaskData": "每日任务累计数据",
        "home.todayTasks": "今日任务",
        "home.progress": "进度",
        "home.quickAdd": "快速添加任务",
        "home.quickAddPlaceholder": "输入任务名称...",
        "home.quickAddBtn": "添加今日任务",
        
        // Tasks page
        "tasks.dailyTitle": "每日任务管理",
        "tasks.addDaily": "+ 添加每日任务",
        "tasks.singleTitle": "单日任务管理", 
        "tasks.addSingle": "+ 添加单日任务",
        "tasks.futureTitle": "未来任务预览",
        
        // Statistics page
        "stats.trendTitle": "完成趋势",
        "stats.categoryTitle": "任务分类统计",
        "stats.detailedTitle": "详细统计",
        
        // Pending tasks page
        "pending.title": "未完成任务管理",
        "pending.all": "全部",
        "pending.incomplete": "未完成",
        "pending.onHold": "搁置",
        "pending.abandoned": "放弃",
        
        // Modal
        "modal.completeTask": "完成任务",
        "modal.taskName": "任务名称",
        "modal.actualAmount": "实际完成量",
        "modal.enterAmount": "输入实际完成的数量",
        "modal.leaveBlank": "不填写将使用默认目标值",
        "modal.notes": "备注（可选）",
        "modal.notesPlaceholder": "记录你的感想、收获或遇到的问题...",
        "modal.cancel": "取消",
        "modal.confirm": "确认完成",
        "modal.addTask": "添加任务",
        "modal.taskNameLabel": "任务名称",
        "modal.taskNamePlaceholder": "输入任务名称",
        "modal.taskType": "任务类型",
        "modal.dailyTask": "每日任务",
        "modal.singleTask": "单日任务",
        "modal.dimensionType": "维度类型",
        "modal.countDimension": "次数维度",
        "modal.timeDimension": "时间维度",
        "modal.simpleCompletion": "简单完成",
        "modal.targetValue": "目标值",
        "modal.targetValuePlaceholder": "输入目标值",
        "modal.startDate": "开始日期",
        "modal.endDate": "结束日期",
        "modal.dateNote": "留空表示持续进行",
        "modal.completionDate": "完成日期",
        "modal.addTaskBtn": "添加任务",
        
        // Notifications
        "notification.enable": "启用通知提醒",
        "notification.description": "获得任务完成提醒",
        "notification.enableBtn": "启用",
        "notification.dismiss": "关闭",
        
        // Authentication
        "auth.signInWithGoogle": "使用Google登录",
        "auth.signOut": "退出",
        "auth.welcome": "欢迎回来",
        "auth.signInFailed": "登录失败，请重试",
        "auth.signOutSuccess": "已成功退出登录",
        "auth.signOutFailed": "退出失败，请重试",
        
        // Dynamic content
        "completedDays": "完成天数",
        "total": "累计",
        "activeDailyTasks": "活跃每日任务",
        "pendingSingleTasks": "待完成单日任务",
        "totalCompletions": "总完成次数",
        "delete": "删除",
        "complete": "完成",
        "postpone": "搁置",
        "abandon": "放弃", 
        "resubmit": "再次提交",
        "cancelCompletion": "取消完成",
        "dailyTaskDeleted": "每日任务已永久删除",
        "taskDeleted": "任务已删除",
        "notificationsEnabled": "通知已启用！",
        "confirmCompletion": "确认完成",
        "submitting": "提交中...",
        "simpleCompletion": "简单完成",
        "target": "目标",
        "times": "次",
        "minutes": "分钟",
        "completedTasks": "完成任务数",
        "dailyTasks": "每日任务",
        "singleTasks": "单日任务",
        "noData": "暂无数据",
        "noPending": "太棒了！暂无未完成任务",
        "noTodayTasks": "今日暂无任务",
        "addDailyTask": "添加每日任务",
        "addSingleTask": "添加单日任务",
        "activeDailyTasks": "活跃每日任务",
        "unfinishedTasks": "未完成任务",
        "overdueTasks": "过期任务",
        "todayTasks": "今日任务",
        "upcomingTasks": "未来任务",
        "noCompletedSingle": "暂无已完成的单日任务",
        "scheduledDate": "计划日期",
        "completedDate": "完成日期",
        "note": "备注",
        "reComplete": "重新完成",
        "date": "日期",
        "todayCompletionRecords": "今日完成记录"
    }
};

// 当前语言设置
let currentLanguage = 'en'; // 默认英文

// 语言切换功能
function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'zh' : 'en';
    localStorage.setItem('language', currentLanguage);
    updateLanguage();
}

function updateLanguage() {
    // 更新 HTML lang 属性
    document.documentElement.lang = currentLanguage;
    
    // 更新语言按钮显示
    const langButton = document.getElementById('currentLang');
    if (langButton) {
        langButton.textContent = currentLanguage.toUpperCase();
    }
    
    // 更新页面标题
    document.title = translations[currentLanguage]['nav.title'];
    
    // 更新所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
    
    // 更新所有带有 data-i18n-placeholder 属性的元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[currentLanguage][key]) {
            element.placeholder = translations[currentLanguage][key];
        }
    });
    
    // 重新渲染动态内容
    if (window.taskManager) {
        window.taskManager.updateAllDisplays();
        window.taskManager.updateTodayDate();
    }
}

function getText(key) {
    return translations[currentLanguage][key] || key;
}

// 初始化语言设置
function initLanguage() {
    // 从 localStorage 读取语言设置，默认为英文
    const savedLanguage = localStorage.getItem('language') || 'en';
    currentLanguage = savedLanguage;
    updateLanguage();
}

class TaskManager {
    constructor() {
        // 用户数据前缀，用于数据隔离
        this.userPrefix = 'guest_';
        
        // 数据存储键名
        this.STORAGE_KEYS = {
            DAILY_TASKS: 'daily_tasks',
            SINGLE_TASKS: 'single_tasks', 
            COMPLETED_TASKS: 'completed_tasks',
            STATISTICS: 'task_statistics'
        };

        // 初始化数据
        this.dailyTasks = this.loadData(this.STORAGE_KEYS.DAILY_TASKS) || [];
        this.singleTasks = this.loadData(this.STORAGE_KEYS.SINGLE_TASKS) || [];
        this.completedTasks = this.loadData(this.STORAGE_KEYS.COMPLETED_TASKS) || [];
        this.statistics = this.loadData(this.STORAGE_KEYS.STATISTICS) || this.initializeStatistics();

        // 每日任务统计滑动相关
        this.currentDailyStatsPage = 0;
        this.dailyStatsPerPage = 4;

        // 图表实例
        this.completionTrendChart = null;
        this.taskCategoryChart = null;

        // 持续计时器相关
        this.persistStartTime = this.loadData('persist_start_time') || null;
        this.persistTimer = null;

        // 初始化应用
        this.init();
    }

    // 初始化应用
    init() {
        // 初始化语言设置
        initLanguage();
        
        this.setupEventListeners();
        this.initializeDailyTaskStats();
        this.generateFutureTasks();
        this.updateAllDisplays();
        this.setupNotifications();
        this.startPersistTimer();
        this.updateTodayDate();
        console.log(currentLanguage === 'en' ? 'Task management system initialized' : '任务管理系统初始化完成');
    }

    // 初始化每日任务统计
    initializeDailyTaskStats() {
        if (!this.statistics.dailyTaskStats) {
            this.statistics.dailyTaskStats = {};
        }

        // 确保所有每日任务都有统计记录
        this.dailyTasks.forEach(task => {
            if (!this.statistics.dailyTaskStats[task.id]) {
                this.statistics.dailyTaskStats[task.id] = {
                    taskName: task.name,
                    completedDays: 0,
                    totalValue: 0,
                    dimension: task.dimension,
                    unit: task.unit
                };
            }
        });

        // 重新计算统计数据
        this.recalculateDailyTaskStats();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 导航按钮事件
        document.getElementById('homeBtn').addEventListener('click', () => this.switchPanel('home'));
        document.getElementById('tasksBtn').addEventListener('click', () => this.switchPanel('tasks'));
        document.getElementById('statisticsBtn').addEventListener('click', () => this.switchPanel('statistics'));
        document.getElementById('unfinishedBtn').addEventListener('click', () => this.switchPanel('unfinished'));

        // 添加任务按钮
        document.getElementById('addDailyTaskBtn').addEventListener('click', () => this.openTaskModal('daily'));
        document.getElementById('addSingleTaskBtn').addEventListener('click', () => this.openTaskModal('single'));
        
        // 快速添加任务
        document.getElementById('quickAddBtn').addEventListener('click', () => this.quickAddTask());
        document.getElementById('quickTaskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.quickAddTask();
        });

        // 模态框事件
        document.getElementById('closeModal').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') this.closeTaskModal();
        });

        // 表单变化事件
        document.getElementById('taskType').addEventListener('change', (e) => this.handleTaskTypeChange(e));
        document.getElementById('dimension').addEventListener('change', (e) => this.handleDimensionChange(e));

        // 通知设置
        document.getElementById('enableNotifications').addEventListener('click', () => this.requestNotificationPermission());
        document.getElementById('dismissNotifications').addEventListener('click', () => this.dismissNotificationPrompt());

        // 未完成任务筛选
        document.getElementById('unfinishedFilter').addEventListener('change', (e) => this.filterUnfinishedTasks(e.target.value));

        // 完成任务模态框事件
        document.getElementById('closeCompletionModal').addEventListener('click', () => this.closeCompletionModal());
        document.getElementById('cancelCompletionBtn').addEventListener('click', () => this.closeCompletionModal());
        document.getElementById('completionForm').addEventListener('submit', (e) => this.handleCompletionSubmit(e));
        document.getElementById('completionModal').addEventListener('click', (e) => {
            if (e.target.id === 'completionModal') this.closeCompletionModal();
        });

        // 每日任务统计滑动按钮
        document.getElementById('dailyStatsLeft').addEventListener('click', () => this.slideDailyStats(-1));
        document.getElementById('dailyStatsRight').addEventListener('click', () => this.slideDailyStats(1));
        
        // 语言切换按钮
        const languageToggleBtn = document.getElementById('languageToggle');
        if (languageToggleBtn) {
            languageToggleBtn.addEventListener('click', () => toggleLanguage());
        }
    }

    // 面板切换功能
    switchPanel(panelName) {
        document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(panelName + 'Panel').classList.add('active');
        document.getElementById(panelName + 'Btn').classList.add('active');

        // 根据面板更新内容
        switch(panelName) {
            case 'home': 
                this.updateHomePanel(); 
                break;
            case 'tasks': 
                this.updateTasksPanel(); 
                break;
            case 'statistics': 
                // 统计页面需要强制刷新图表数据
                setTimeout(() => {
                    this.updateStatisticsPanel();
                }, 100);
                break;
            case 'unfinished': 
                this.updateUnfinishedPanel(); 
                break;
        }
    }

    // 数据存储方法
    async saveData(key, data) {
        try {
            // 始终保存到本地作为备份
            const prefixedKey = this.userPrefix + key;
            localStorage.setItem(prefixedKey, JSON.stringify(data));
            
            // 如果用户已登录，同时保存到云端
            if (window.authManager && window.authManager.isSignedIn()) {
                await this.saveToFirestore();
            }
        } catch (error) {
            console.error('数据保存失败:', error);
            this.showNotification('数据保存失败', 'error');
        }
    }

    loadData(key) {
        try {
            // 使用用户前缀隔离数据
            const prefixedKey = this.userPrefix + key;
            const data = localStorage.getItem(prefixedKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('数据加载失败:', error);
            return null;
        }
    }

    // 加载所有用户数据
    async loadAllData() {
        // 如果用户已登录，尝试从云端加载数据
        if (window.authManager && window.authManager.isSignedIn()) {
            await this.loadFromFirestore();
        } else {
            // 未登录用户从本地加载
            this.dailyTasks = this.loadData(this.STORAGE_KEYS.DAILY_TASKS) || [];
            this.singleTasks = this.loadData(this.STORAGE_KEYS.SINGLE_TASKS) || [];
            this.completedTasks = this.loadData(this.STORAGE_KEYS.COMPLETED_TASKS) || [];
            this.statistics = this.loadData(this.STORAGE_KEYS.STATISTICS) || this.initializeStatistics();
        }
        
        // 清理数据分类错误
        this.cleanupTaskClassification();
        
        // 重新生成未来任务
        this.generateFutureTasks();
        
        // 重新初始化每日任务统计
        this.initializeDailyTaskStats();
        
        // 加载计时器数据
        this.persistStartTime = this.loadData('persist_start_time');
        if (this.persistStartTime) {
            this.startPersistTimer();
        }
    }

    // 从Firestore云端加载数据
    async loadFromFirestore() {
        if (!window.authManager || !window.authManager.isSignedIn()) {
            return;
        }

        try {
            const userId = window.authManager.getUserId();
            const userDocRef = window.firestoreDoc(window.firebaseFirestore, 'users', userId);
            const userDoc = await window.firestoreGetDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.dailyTasks = userData.dailyTasks || [];
                this.singleTasks = userData.singleTasks || [];
                this.completedTasks = userData.completedTasks || [];
                this.statistics = userData.statistics || this.initializeStatistics();
                
                // 同步计时器数据
                if (userData.persistStartTime) {
                    this.persistStartTime = userData.persistStartTime;
                    this.saveData('persist_start_time', this.persistStartTime);
                    this.startPersistTimer();
                }
                
                console.log('✅ 从云端加载数据成功');
                this.showNotification('数据已从云端同步', 'success');
            } else {
                // 首次登录，创建用户文档
                await this.initializeUserInFirestore();
            }
        } catch (error) {
            console.error('❌ 从云端加载数据失败:', error);
            this.showNotification('云端数据加载失败，使用本地数据', 'warning');
            
            // 回退到本地数据
            this.dailyTasks = this.loadData(this.STORAGE_KEYS.DAILY_TASKS) || [];
            this.singleTasks = this.loadData(this.STORAGE_KEYS.SINGLE_TASKS) || [];
            this.completedTasks = this.loadData(this.STORAGE_KEYS.COMPLETED_TASKS) || [];
            this.statistics = this.loadData(this.STORAGE_KEYS.STATISTICS) || this.initializeStatistics();
        }
    }

    // 保存数据到Firestore云端
    async saveToFirestore() {
        if (!window.authManager || !window.authManager.isSignedIn()) {
            return;
        }

        try {
            const userId = window.authManager.getUserId();
            const userDocRef = window.firestoreDoc(window.firebaseFirestore, 'users', userId);
            
            const userData = {
                dailyTasks: this.dailyTasks,
                singleTasks: this.singleTasks,
                completedTasks: this.completedTasks,
                statistics: this.statistics,
                persistStartTime: this.persistStartTime, // 同步计时器数据
                lastUpdated: new Date().toISOString()
            };

            await window.firestoreSetDoc(userDocRef, userData);
            console.log('✅ 数据已保存到云端');
            
            // 静默成功，不显示通知避免打扰用户
        } catch (error) {
            console.error('❌ 保存到云端失败:', error);
            this.showNotification('云端数据保存失败', 'error');
        }
    }

    // 合并访客数据和云端数据
    async mergeGuestData(guestData) {
        if (!guestData || (!guestData.dailyTasks.length && !guestData.singleTasks.length && !guestData.completedTasks.length)) {
            return; // 没有访客数据需要合并
        }

        console.log('🔄 开始合并访客数据和云端数据...');

        // 合并每日任务（避免重复）
        guestData.dailyTasks.forEach(guestTask => {
            const exists = this.dailyTasks.some(task => task.id === guestTask.id);
            if (!exists) {
                this.dailyTasks.push(guestTask);
            }
        });

        // 合并单日任务（避免重复）
        guestData.singleTasks.forEach(guestTask => {
            const exists = this.singleTasks.some(task => task.id === guestTask.id);
            if (!exists) {
                this.singleTasks.push(guestTask);
            }
        });

        // 合并完成记录（避免重复）
        guestData.completedTasks.forEach(guestRecord => {
            const exists = this.completedTasks.some(record => record.id === guestRecord.id);
            if (!exists) {
                this.completedTasks.push(guestRecord);
            }
        });

        // 合并统计数据
        this.mergeStatistics(guestData.statistics);

        // 保存合并后的数据到云端和本地
        await this.saveAllData();

        const totalMerged = guestData.dailyTasks.length + guestData.singleTasks.length + guestData.completedTasks.length;
        if (totalMerged > 0) {
            this.showNotification(`已合并 ${totalMerged} 条访客数据到云端`, 'success');
            console.log('✅ 访客数据合并完成');
        }
    }

    // 合并统计数据
    mergeStatistics(guestStats) {
        if (!guestStats) return;

        // 合并基础统计
        this.statistics.totalCompleted += guestStats.totalCompleted || 0;
        
        // 合并每日完成记录
        if (guestStats.dailyCompletions) {
            Object.keys(guestStats.dailyCompletions).forEach(date => {
                if (!this.statistics.dailyCompletions[date]) {
                    this.statistics.dailyCompletions[date] = guestStats.dailyCompletions[date];
                } else {
                    this.statistics.dailyCompletions[date] += guestStats.dailyCompletions[date];
                }
            });
        }

        // 合并任务分类统计
        if (guestStats.taskCategories) {
            Object.keys(guestStats.taskCategories).forEach(category => {
                if (!this.statistics.taskCategories[category]) {
                    this.statistics.taskCategories[category] = guestStats.taskCategories[category];
                } else {
                    this.statistics.taskCategories[category] += guestStats.taskCategories[category];
                }
            });
        }
    }

    // 清理任务分类错误
    cleanupTaskClassification() {
        let needsSave = false;
        
        // 检查每日任务数组中是否有单日任务
        const wronglyClassifiedDaily = this.dailyTasks.filter(task => task.type === 'single');
        if (wronglyClassifiedDaily.length > 0) {
            console.log('🔧 发现错误分类的单日任务在每日任务中:', wronglyClassifiedDaily.length);
            // 移动到单日任务数组
            wronglyClassifiedDaily.forEach(task => {
                this.singleTasks.push(task);
            });
            // 从每日任务数组中移除
            this.dailyTasks = this.dailyTasks.filter(task => task.type === 'daily');
            needsSave = true;
        }
        
        // 检查单日任务数组中是否有每日任务
        const wronglyClassifiedSingle = this.singleTasks.filter(task => task.type === 'daily');
        if (wronglyClassifiedSingle.length > 0) {
            console.log('🔧 发现错误分类的每日任务在单日任务中:', wronglyClassifiedSingle.length);
            // 移动到每日任务数组
            wronglyClassifiedSingle.forEach(task => {
                this.dailyTasks.push(task);
            });
            // 从单日任务数组中移除
            this.singleTasks = this.singleTasks.filter(task => task.type === 'single');
            needsSave = true;
        }
        
        // 如果有修正，保存数据
        if (needsSave) {
            console.log('✅ 任务分类已修正，保存数据');
            this.saveData(this.STORAGE_KEYS.DAILY_TASKS, this.dailyTasks);
            this.saveData(this.STORAGE_KEYS.SINGLE_TASKS, this.singleTasks);
        }
    }

    // 保存所有数据（本地 + 云端）
    async saveAllData() {
        // 保存到本地
        await this.saveData(this.STORAGE_KEYS.DAILY_TASKS, this.dailyTasks);
        await this.saveData(this.STORAGE_KEYS.SINGLE_TASKS, this.singleTasks);
        await this.saveData(this.STORAGE_KEYS.COMPLETED_TASKS, this.completedTasks);
        await this.saveData(this.STORAGE_KEYS.STATISTICS, this.statistics);

        // 重新生成未来任务和统计
        this.generateFutureTasks();
        this.initializeDailyTaskStats();
    }

    // 初始化用户在Firestore中的文档
    async initializeUserInFirestore() {
        try {
            const userId = window.authManager.getUserId();
            const userDocRef = window.firestoreDoc(window.firebaseFirestore, 'users', userId);
            
            // 使用当前内存中的数据（已经合并过访客数据）
            const userData = {
                dailyTasks: this.dailyTasks,
                singleTasks: this.singleTasks,  
                completedTasks: this.completedTasks,
                statistics: this.statistics,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            await window.firestoreSetDoc(userDocRef, userData);
            
            console.log('✅ 用户文档初始化成功');
            
        } catch (error) {
            console.error('❌ 用户文档初始化失败:', error);
            this.showNotification('云端初始化失败', 'error');
        }
    }

    // 初始化统计数据
    initializeStatistics() {
        return {
            totalCompleted: 0,
            streakDays: 0,
            weeklyCompletionRate: 0,
            totalExerciseHours: 0,
            lastUpdateDate: new Date().toDateString(),
            dailyCompletions: {},
            taskCategories: {}
        };
    }

    // 任务管理方法
    addTask(taskData) {
        const task = {
            id: this.generateId(),
            name: taskData.name,
            type: taskData.type,
            dimension: taskData.dimension,
            targetValue: taskData.targetValue || 1,
            unit: this.getUnit(taskData.dimension),
            createdDate: new Date().toISOString(),
            startDate: taskData.startDate,
            endDate: taskData.endDate,
            date: taskData.date
        };

        if (task.type === 'daily') {
            this.dailyTasks.push(task);
            this.saveData(this.STORAGE_KEYS.DAILY_TASKS, this.dailyTasks);
        } else {
            this.singleTasks.push(task);
            this.saveData(this.STORAGE_KEYS.SINGLE_TASKS, this.singleTasks);
        }

        this.generateFutureTasks();
        this.updateAllDisplays();
        this.showNotification(currentLanguage === 'en' ? 'Task added successfully!' : '任务添加成功！', 'success');
    }

    // 删除任务
    deleteTask(taskId, taskType, isPermanent = false) {
        if (taskType === 'daily') {
            if (isPermanent) {
                this.dailyTasks = this.dailyTasks.filter(task => task.id !== taskId);
                this.saveData(this.STORAGE_KEYS.DAILY_TASKS, this.dailyTasks);
                
                // 删除相关的完成记录
                this.completedTasks = this.completedTasks.filter(record => record.taskId !== taskId);
                this.saveData(this.STORAGE_KEYS.COMPLETED_TASKS, this.completedTasks);
                
                // 删除统计数据
                if (this.statistics.dailyTaskStats && this.statistics.dailyTaskStats[taskId]) {
                    delete this.statistics.dailyTaskStats[taskId];
                    this.saveData(this.STORAGE_KEYS.STATISTICS, this.statistics);
                }
                
                const isEnglish = document.documentElement.lang === 'en';
            this.showNotification(getText('dailyTaskDeleted'), 'warning');
            }
        } else {
            this.singleTasks = this.singleTasks.filter(task => task.id !== taskId);
            this.saveData(this.STORAGE_KEYS.SINGLE_TASKS, this.singleTasks);
            
            // 删除相关的完成记录
            this.completedTasks = this.completedTasks.filter(record => record.taskId !== taskId);
            this.saveData(this.STORAGE_KEYS.COMPLETED_TASKS, this.completedTasks);
            
            const isEnglish = document.documentElement.lang === 'en';
                    this.showNotification(getText('taskDeleted'), 'success');
        }

        this.generateFutureTasks();
        this.updateAllDisplays();
    }

    // 完成任务
    completeTask(taskId, taskType, date = new Date(), customValue = null, note = '') {
        const dateStr = this.formatDate(date);
        const task = this.dailyTasks.find(t => t.id === taskId) || this.singleTasks.find(t => t.id === taskId);
        
        // 如果这是第一次完成任务，开始计时器
        if (!this.persistStartTime) {
            this.persistStartTime = new Date().toISOString();
            this.saveData('persist_start_time', this.persistStartTime);
            // 立即启动计时器
            this.startPersistTimer();
        }
        
        const completionRecord = {
            id: this.generateId(), // 给每个完成记录一个独特ID
            taskId,
            taskType,
            date: dateStr,
            completedAt: new Date().toISOString(),
            actualValue: customValue || task?.targetValue || 1,
            taskName: task?.name || '',
            dimension: task?.dimension || 'simple',
            note: note || '' // 添加备注字段
        };

        this.completedTasks.push(completionRecord);
        this.saveData(this.STORAGE_KEYS.COMPLETED_TASKS, this.completedTasks);

        this.updateStatistics(taskId, taskType, completionRecord.actualValue);
        
        // 不在这里调用updateAllDisplays，让调用者决定何时更新界面
        // this.updateAllDisplays();
        
        this.showNotification(currentLanguage === 'en' ? 'Task completed!' : '任务完成！', 'success');
        this.triggerCompletionAnimation();
    }

    // 生成未来任务
    generateFutureTasks() {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7); // 包含过去7天
        const endDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
        this.futureTasks = {};

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = this.formatDate(d);
            this.futureTasks[dateStr] = [];

            // 添加每日任务
            this.dailyTasks.forEach(task => {
                if (this.shouldTaskBeActiveOnDate(task, d)) {
                    this.futureTasks[dateStr].push({
                        ...task,
                        instanceId: `${task.id}_${dateStr}`,
                        date: dateStr,
                        completed: this.isTaskCompletedOnDate(task.id, dateStr)
                    });
                }
            });

            // 添加单日任务
            this.singleTasks.forEach(task => {
                if (task.date === dateStr) {
                    this.futureTasks[dateStr].push({
                        ...task,
                        instanceId: `${task.id}_${dateStr}`,
                        date: dateStr,
                        completed: this.isTaskCompletedOnDate(task.id, dateStr)
                    });
                }
            });
        }
    }

    // 检查任务是否在指定日期活跃
    shouldTaskBeActiveOnDate(task, date) {
        const startDate = task.startDate ? new Date(task.startDate) : new Date(task.createdDate);
        const endDate = task.endDate ? new Date(task.endDate) : null;

        if (date < startDate) return false;
        if (endDate && date > endDate) return false;
        
        return true;
    }

    // 检查任务是否已完成
    isTaskCompletedOnDate(taskId, dateStr) {
        return this.completedTasks.some(record => 
            record.taskId === taskId && record.date === dateStr
        );
    }

    // 更新统计数据
    updateStatistics(taskId, taskType, actualValue = 1) {
        // 注意：totalCompleted会在updateHomePanel中重新计算，此处不需要更新
        
        const today = this.formatDate(new Date());
        if (!this.statistics.dailyCompletions[today]) {
            this.statistics.dailyCompletions[today] = 0;
        }
        this.statistics.dailyCompletions[today]++;

        if (!this.statistics.taskCategories[taskType]) {
            this.statistics.taskCategories[taskType] = 0;
        }
        this.statistics.taskCategories[taskType]++;

        // 更新每日任务累计数据
        this.updateDailyTaskStats(taskId, actualValue);

        this.calculateStreakDays();
        this.calculateWeeklyCompletionRate();

        this.statistics.lastUpdateDate = new Date().toDateString();
        this.saveData(this.STORAGE_KEYS.STATISTICS, this.statistics);
    }

    // 更新每日任务累计统计
    updateDailyTaskStats(taskId, actualValue) {
        const task = this.dailyTasks.find(t => t.id === taskId);
        if (!task) return;

        if (!this.statistics.dailyTaskStats) {
            this.statistics.dailyTaskStats = {};
        }

        if (!this.statistics.dailyTaskStats[taskId]) {
            this.statistics.dailyTaskStats[taskId] = {
                taskName: task.name,
                completedDays: 0,
                totalValue: 0,
                dimension: task.dimension,
                unit: task.unit
            };
        }

        // 检查今天是否已经完成过该任务
        const today = this.formatDate(new Date());
        const todayCompletions = this.completedTasks.filter(record => 
            record.taskId === taskId && record.date === today
        );

        // 如果今天是第一次完成该任务，增加完成天数
        if (todayCompletions.length === 1) {
            this.statistics.dailyTaskStats[taskId].completedDays++;
        }

        this.statistics.dailyTaskStats[taskId].totalValue += actualValue;
    }

    // 计算连续完成天数
    calculateStreakDays() {
        const today = new Date();
        let streakDays = 0;
        
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = this.formatDate(checkDate);
            
            if (this.statistics.dailyCompletions[dateStr] > 0) {
                streakDays++;
            } else {
                break;
            }
        }
        
        this.statistics.streakDays = streakDays;
    }

    // 计算本周完成率
    calculateWeeklyCompletionRate() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        let totalTasks = 0;
        let completedTasks = 0;
        
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(weekStart);
            checkDate.setDate(weekStart.getDate() + i);
            const dateStr = this.formatDate(checkDate);
            
            const dayTasks = this.futureTasks[dateStr] || [];
            totalTasks += dayTasks.length;
            completedTasks += dayTasks.filter(task => task.completed).length;
        }
        
        this.statistics.weeklyCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }



    // 界面更新方法
    updateAllDisplays() {
        this.updateHomePanel();
        this.updateTasksPanel();
        this.updateStatisticsPanel();
        this.updateUnfinishedPanel();
    }

    // 更新首页面板
    updateHomePanel() {
        // 重新计算累计完成任务数
        this.statistics.totalCompleted = this.completedTasks.length;
        this.saveData(this.STORAGE_KEYS.STATISTICS, this.statistics);
        
        document.getElementById('totalCompleted').textContent = this.statistics.totalCompleted;

        this.updateDailyTasksStatsDisplay();
        this.updateTodayTasksOverview();
        this.updateTodayDate();
    }

    // 更新今日日期显示
    updateTodayDate() {
        const today = new Date();
        const todayElement = document.getElementById('todayDate');
        if (todayElement) {
            todayElement.textContent = this.formatDateDisplay(today, 'full');
        }
    }

    // 更新每日任务累计数据展示
    updateDailyTasksStatsDisplay() {
        const wrapper = document.getElementById('dailyStatsWrapper');
        const indicators = document.getElementById('dailyStatsIndicators');
        
        if (!this.statistics.dailyTaskStats || Object.keys(this.statistics.dailyTaskStats).length === 0) {
            wrapper.innerHTML = `<div class="text-center text-apple-gray p-8">${getText('noData')}</div>`;
            indicators.innerHTML = '';
            return;
        }

        const statsArray = Object.values(this.statistics.dailyTaskStats);
        const totalPages = Math.ceil(statsArray.length / 4); // 每页显示4个任务

        // 生成统计展示 - 参考UI demo的横向网格布局
        wrapper.innerHTML = `
            <div class="tasks-slider overflow-x-auto">
                <div class="flex gap-8 pb-4">
                    ${statsArray.map((stat, index) => `
                        <div class="task-card-stats flex-shrink-0 text-center">
                            <div class="task-name-stats text-base font-semibold text-apple-dark mb-3">${this.getTaskIcon(index)} ${stat.taskName}</div>
                            <div class="task-stats-grid flex justify-around">
                                <div class="task-stat-item">
                                    <div class="task-stat-number text-2xl font-bold text-apple-blue">${stat.completedDays}</div>
                                    <div class="task-stat-label text-xs text-apple-gray">${getText('completedDays')}</div>
                                </div>
                                <div class="task-stat-item">
                                    <div class="task-stat-number text-2xl font-bold text-apple-blue">${stat.totalValue}</div>
                                    <div class="task-stat-label text-xs text-apple-gray">${this.getUnit(stat.dimension) || getText('times')}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // 生成指示器（当任务数量超过4个时显示）
        if (statsArray.length > 4) {
            const dotsCount = Math.ceil(statsArray.length / 4);
            indicators.innerHTML = Array.from({length: dotsCount}, (_, i) => 
                `<div class="indicator-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
            ).join('');
            
            // 绑定指示器点击事件
            indicators.querySelectorAll('.indicator-dot').forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    const slider = wrapper.querySelector('.tasks-slider');
                    slider.scrollLeft = index * 300;
                    indicators.querySelectorAll('.indicator-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                });
            });
        } else {
            indicators.innerHTML = '';
        }

        this.updateDailyStatsButtons();
    }

    // 获取任务图标
    getTaskIcon(index) {
        const icons = ['📚', '🏃‍♂️', '💧', '📝', '🎯', '💪', '🧘', '🎨'];
        return icons[index % icons.length];
    }

    // 滑动每日任务统计
    slideDailyStats(direction) {
        const totalStats = Object.keys(this.statistics.dailyTaskStats || {}).length;
        const totalPages = Math.ceil(totalStats / this.dailyStatsPerPage);
        
        this.currentDailyStatsPage += direction;
        
        if (this.currentDailyStatsPage < 0) {
            this.currentDailyStatsPage = totalPages - 1;
        } else if (this.currentDailyStatsPage >= totalPages) {
            this.currentDailyStatsPage = 0;
        }
        
        this.updateDailyStatsPosition();
        this.updateDailyStatsButtons();
        this.updateDailyStatsIndicators();
    }

    // 跳转到指定页面
    goToDailyStatsPage(pageIndex) {
        this.currentDailyStatsPage = pageIndex;
        this.updateDailyStatsPosition();
        this.updateDailyStatsButtons();
        this.updateDailyStatsIndicators();
    }

    // 更新位置
    updateDailyStatsPosition() {
        const wrapper = document.getElementById('dailyStatsWrapper');
        const translateX = -this.currentDailyStatsPage * 100;
        wrapper.style.transform = `translateX(${translateX}%)`;
    }

    // 更新按钮状态
    updateDailyStatsButtons() {
        const leftBtn = document.getElementById('dailyStatsLeft');
        const rightBtn = document.getElementById('dailyStatsRight');
        const totalStats = Object.keys(this.statistics.dailyTaskStats || {}).length;
        const totalPages = Math.ceil(totalStats / this.dailyStatsPerPage);

        leftBtn.style.display = totalPages <= 1 ? 'none' : 'flex';
        rightBtn.style.display = totalPages <= 1 ? 'none' : 'flex';
    }

    // 更新指示器状态
    updateDailyStatsIndicators() {
        const indicators = document.querySelectorAll('.indicator-dot');
        indicators.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentDailyStatsPage);
        });
    }

    // 更新今日任务概览
    updateTodayTasksOverview() {
        const today = this.formatDate(new Date());
        const todayTasks = this.futureTasks[today] || [];
        const container = document.getElementById('todayTasksOverview');
        
        if (todayTasks.length === 0) {
            const isEnglish = document.documentElement.lang === 'en';
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><p>${getText('noTodayTasks')}</p></div>`;
            return;
        }

        container.innerHTML = todayTasks.map(task => {
            // 获取该任务今日的完成记录
            const todayCompletions = this.completedTasks.filter(record => 
                record.taskId === task.id && record.date === today
            );
            
            // 实时检查完成状态，而不依赖task.completed
            const isCompleted = todayCompletions.length > 0;
            
            return `
                <div class="task-item ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}">
                    <div class="task-main-content">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <button class="task-complete-btn ${isCompleted ? 'completed' : ''}" 
                                        onclick="taskManager.openCompletionModal('${task.id}', '${task.type}', '${today}', false)">
                                    ${isCompleted ? '✓' : ''}
                                </button>
                                <div>
                                    <div class="task-name font-medium text-apple-dark">${task.name}</div>
                                    <div class="text-xs text-apple-gray">${this.getTaskDescription(task)}</div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                ${isCompleted ? `
                                    <button class="resubmit-btn px-3 py-1 text-white text-xs rounded-lg" 
                                            onclick="taskManager.reSubmitTask('${task.id}', '${task.type}', '${today}')">
                                        🔄 ${getText('resubmit')}
                                    </button>
                                ` : ''}
                                <button class="text-apple-red text-sm" onclick="taskManager.deleteTask('${task.id}', '${task.type}')">
                                    ${getText('delete')}
                                </button>
                            </div>
                        </div>
                        
                        ${todayCompletions.length > 0 ? `
                            <div class="completion-records mt-3 p-3 bg-gray-50 rounded-lg">
                                <div class="text-sm font-medium text-apple-dark mb-2">${getText('todayCompletionRecords')} (${todayCompletions.length} ${getText('times')})</div>
                                <div class="space-y-2">
                                    ${todayCompletions.map(record => `
                                        <div class="completion-record flex items-center justify-between p-2 bg-white rounded-lg border">
                                            <div class="flex-1">
                                                <div class="text-sm text-apple-dark">
                                                    <span class="font-medium">${record.actualValue}</span> ${this.getUnit(record.dimension)}
                                                    <span class="text-xs text-apple-gray ml-2">${new Date(record.completedAt).toLocaleTimeString(currentLanguage === 'en' ? 'en-US' : 'zh-CN', {hour: '2-digit', minute: '2-digit'})}</span>
                                                </div>
                                                ${record.note ? `<div class="text-xs text-apple-gray mt-1">${record.note}</div>` : ''}
                                            </div>
                                            <button class="text-apple-red text-xs hover:text-red-600 transition-colors ml-3" 
                                                    onclick="taskManager.deleteCompletionRecord('${record.id}')">
                                                ${getText('cancelCompletion')}
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // 更新进度条 - 使用实时完成状态
        const completed = todayTasks.filter(task => {
            const todayCompletions = this.completedTasks.filter(record => 
                record.taskId === task.id && record.date === today
            );
            return todayCompletions.length > 0;
        }).length;
        const total = todayTasks.length;
        const progress = total > 0 ? (completed / total) * 100 : 0;
        
        document.getElementById('todayProgress').textContent = `${completed}/${total}`;
        document.getElementById('todayProgressBar').style.width = progress + '%';
    }

    // 打开完成任务模态框
    openCompletionModal(taskId, taskType, dateStr, isCompleted) {
        if (isCompleted) {
            // 如果已完成，直接取消完成
            this.toggleTaskCompletion(taskId, taskType, dateStr);
            return;
        }

        const task = this.dailyTasks.find(t => t.id === taskId) || this.singleTasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentCompletionTask = { taskId, taskType, dateStr, task };

        // 设置模态框内容
        document.getElementById('completionTaskName').textContent = task.name;
        document.getElementById('completionValue').value = task.targetValue || 1;
        
        const unitLabel = document.getElementById('completionUnit');
        const valueDiv = document.getElementById('completionValueDiv');
        
        if (task.dimension === 'simple') {
            valueDiv.style.display = 'block';
            unitLabel.textContent = getText('times');
        } else if (task.dimension === 'count') {
            valueDiv.style.display = 'block';
            unitLabel.textContent = getText('times');
        } else if (task.dimension === 'time') {
            valueDiv.style.display = 'block';
            unitLabel.textContent = getText('minutes');
        }

        document.getElementById('completionModal').classList.add('active');
    }

    // 强力关闭模态框 - 确保100%关闭
    forceCloseModal() {
        console.log('开始强力关闭模态框...');
        const modal = document.getElementById('completionModal');
        
        if (!modal) {
            console.error('找不到模态框元素');
            return;
        }
        
        // 多重方式确保关闭
        modal.classList.remove('active');
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
        
        console.log('模态框样式已设置为关闭状态');
        
        // 重置表单
        try {
            const form = document.getElementById('completionForm');
            const noteInput = document.getElementById('completionNote');
            const valueInput = document.getElementById('completionValue');
            
            if (form) form.reset();
            if (noteInput) noteInput.value = '';
            if (valueInput) valueInput.value = '';
            
            console.log('表单已重置');
        } catch (e) {
            console.log('表单重置出错，但不影响关闭:', e);
        }
        
        // 恢复提交按钮状态
        const submitBtn = document.querySelector('#completionForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = getText('confirmCompletion');
            console.log('提交按钮已恢复');
        }
        
        this.currentCompletionTask = null;
        
        // 延迟恢复正常样式属性
        setTimeout(() => {
            modal.style.visibility = '';
            modal.style.opacity = '';
            modal.style.pointerEvents = '';
            if (!modal.classList.contains('active')) {
                modal.style.display = '';
            }
            console.log('模态框样式已恢复正常');
        }, 500);
        
        console.log('模态框关闭操作完成');
    }

    // 关闭完成任务模态框
    closeCompletionModal() {
        this.forceCloseModal();
    }

    // 处理完成任务表单提交
    handleCompletionSubmit(e) {
        e.preventDefault();
        
        if (!this.currentCompletionTask) return;

        // 立即禁用提交按钮，防止重复提交
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = getText('submitting');
        }

        const customValue = parseFloat(document.getElementById('completionValue').value) || this.currentCompletionTask.task.targetValue || 1;
        const note = document.getElementById('completionNote').value.trim();
        
        try {
            // 执行任务完成逻辑
            this.completeTask(
                this.currentCompletionTask.taskId, 
                this.currentCompletionTask.taskType, 
                new Date(this.currentCompletionTask.dateStr),
                customValue,
                note
            );
            
            console.log('任务完成成功，开始关闭模态框');
            
            // 立即关闭模态框
            this.forceCloseModal();
            
            // 稍作延迟后更新界面，确保模态框完全关闭
            setTimeout(() => {
                console.log('开始更新界面显示...');
                this.generateFutureTasks();
                this.updateAllDisplays();
                console.log('界面更新完成');
            }, 100);
            
        } catch (error) {
            console.error('完成任务时出错:', error);
            const isEnglish = document.documentElement.lang === 'en';
            this.showNotification((currentLanguage === 'en' ? 'Error completing task: ' : '完成任务时出错: ') + error.message, 'error');
            
            // 出错时恢复按钮状态并关闭模态框
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = getText('confirmCompletion');
            }
            this.forceCloseModal();
        }
    }

    // 再次提交任务（允许同一天多次完成同一任务）
    reSubmitTask(taskId, taskType, dateStr) {
        const task = this.dailyTasks.find(t => t.id === taskId) || this.singleTasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentCompletionTask = { taskId, taskType, dateStr, task };

        // 设置模态框内容
        const isEnglish = document.documentElement.lang === 'en';
        document.getElementById('completionTaskName').textContent = task.name + (currentLanguage === 'en' ? ' (Resubmit)' : ' (再次提交)');
        document.getElementById('completionValue').value = task.targetValue || 1;
        document.getElementById('completionNote').value = '';
        
        const unitLabel = document.getElementById('completionUnit');
        const valueDiv = document.getElementById('completionValueDiv');
        
        if (task.dimension === 'simple') {
            valueDiv.style.display = 'block';
            unitLabel.textContent = getText('times');
        } else if (task.dimension === 'count') {
            valueDiv.style.display = 'block';
            unitLabel.textContent = getText('times');
        } else if (task.dimension === 'time') {
            valueDiv.style.display = 'block';
            unitLabel.textContent = getText('minutes');
        }

        // 修改提交按钮文字
        const submitBtn = document.querySelector('#completionForm button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = getText('resubmit');
        
        // 当模态框关闭时恢复按钮文字
        const modal = document.getElementById('completionModal');
        const resetButton = () => {
            submitBtn.textContent = originalText;
            modal.removeEventListener('transitionend', resetButton);
        };
        
        // 使用多种事件监听确保按钮文字恢复
        modal.addEventListener('transitionend', resetButton);
        
        // 备用机制：如果transition事件没触发，用定时器
        setTimeout(() => {
            if (submitBtn.textContent === getText('resubmit')) {
                submitBtn.textContent = originalText;
            }
        }, 1000);

        document.getElementById('completionModal').classList.add('active');
    }

    // 切换任务完成状态
    toggleTaskCompletion(taskId, taskType, dateStr) {
        const isCompleted = this.isTaskCompletedOnDate(taskId, dateStr);
        
        if (isCompleted) {
            // 取消完成
            this.completedTasks = this.completedTasks.filter(record => 
                !(record.taskId === taskId && record.date === dateStr)
            );
            this.saveData(this.STORAGE_KEYS.COMPLETED_TASKS, this.completedTasks);
            const isEnglish = document.documentElement.lang === 'en';
        this.showNotification(currentLanguage === 'en' ? 'Task marked as incomplete' : '任务已标记为未完成', 'info');
            
            // 更新每日任务统计
            this.recalculateDailyTaskStats();
            
            this.generateFutureTasks();
            this.updateAllDisplays();
        }
    }

    // 重新计算每日任务统计
    recalculateDailyTaskStats() {
        if (!this.statistics.dailyTaskStats) return;

        // 为所有完成记录确保有ID（向后兼容）
        this.completedTasks.forEach(record => {
            if (!record.id) {
                record.id = this.generateId();
            }
        });

        // 重置所有每日任务统计
        Object.keys(this.statistics.dailyTaskStats).forEach(taskId => {
            this.statistics.dailyTaskStats[taskId].completedDays = 0;
            this.statistics.dailyTaskStats[taskId].totalValue = 0;
        });

        // 按任务ID分组统计完成记录
        const taskCompletions = {};
        this.completedTasks.forEach(record => {
            if (!taskCompletions[record.taskId]) {
                taskCompletions[record.taskId] = new Set();
            }
            taskCompletions[record.taskId].add(record.date);
        });

        // 重新计算每日任务统计
        this.completedTasks.forEach(record => {
            if (this.statistics.dailyTaskStats[record.taskId]) {
                this.statistics.dailyTaskStats[record.taskId].totalValue += record.actualValue || 1;
            }
        });

        // 计算完成天数（去重）
        Object.keys(taskCompletions).forEach(taskId => {
            if (this.statistics.dailyTaskStats[taskId]) {
                this.statistics.dailyTaskStats[taskId].completedDays = taskCompletions[taskId].size;
            }
        });

        this.saveData(this.STORAGE_KEYS.STATISTICS, this.statistics);
    }

    // 获取任务描述
    getTaskDescription(task) {
        const isEnglish = document.documentElement.lang === 'en';
        if (task.dimension === 'simple') return getText('simpleCompletion');
        if (task.dimension === 'count') return `${getText('target')}: ${task.targetValue} ${getText('times')}`;
        if (task.dimension === 'time') return `${getText('target')}: ${task.targetValue} ${getText('minutes')}`;
        return '';
    }

    // 快速添加任务
    quickAddTask() {
        const input = document.getElementById('quickTaskInput');
        const taskName = input.value.trim();
        
        if (!taskName) {
            const isEnglish = document.documentElement.lang === 'en';
            this.showNotification(isEnglish ? 'Please enter task name' : '请输入任务名称', 'error');
            return;
        }

        const taskData = {
            name: taskName,
            type: 'single',
            dimension: 'simple',
            date: this.formatDate(new Date()),
            targetValue: 1
        };

        this.addTask(taskData);
        input.value = '';
    }

    // 模态框相关方法
    openTaskModal(taskType) {
        document.getElementById('taskModal').classList.add('active');
        document.getElementById('taskType').value = taskType;
        this.handleTaskTypeChange({ target: { value: taskType } });
        const isEnglish = document.documentElement.lang === 'en';
        document.getElementById('modalTitle').textContent = taskType === 'daily' ? 
            (isEnglish ? 'Add Daily Task' : '添加每日任务') : 
            (isEnglish ? 'Add Single Task' : '添加单日任务');
    }

    closeTaskModal() {
        document.getElementById('taskModal').classList.remove('active');
        document.getElementById('taskForm').reset();
    }

    handleTaskTypeChange(e) {
        const taskType = e.target.value;
        const dateSettings = document.getElementById('dateSettings');
        const singleDateDiv = document.getElementById('singleDateDiv');
        
        if (taskType === 'daily') {
            dateSettings.style.display = 'block';
            singleDateDiv.style.display = 'none';
        } else {
            dateSettings.style.display = 'none';
            singleDateDiv.style.display = 'block';
            document.getElementById('singleDate').value = this.formatDate(new Date());
        }
    }

    handleDimensionChange(e) {
        const dimension = e.target.value;
        const targetValueDiv = document.getElementById('targetValueDiv');
        const unitLabel = document.getElementById('unitLabel');
        
        if (dimension === 'simple') {
            targetValueDiv.style.display = 'none';
        } else {
            targetValueDiv.style.display = 'block';
            unitLabel.textContent = this.getUnit(dimension);
        }
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const taskData = {
            name: document.getElementById('taskName').value,
            type: document.getElementById('taskType').value,
            dimension: document.getElementById('dimension').value,
            targetValue: parseInt(document.getElementById('targetValue').value) || 1,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            date: document.getElementById('singleDate').value
        };

        this.addTask(taskData);
        this.closeTaskModal();
    }

    // 任务面板更新
    updateTasksPanel() {
        this.updateDailyTasksList();
        this.updateSingleTasksList();
        this.updateFutureTasksPreview();
    }

    updateDailyTasksList() {
        const container = document.getElementById('dailyTasksList');
        
        // 过滤出真正的每日任务（排除错误分类的单日任务）
        const realDailyTasks = this.dailyTasks.filter(task => task.type === 'daily');
        
        if (realDailyTasks.length === 0) {
            const isEnglish = document.documentElement.lang === 'en';
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><p>${currentLanguage === 'en' ? 'No daily tasks' : '暂无每日任务'}</p></div>`;
            return;
        }

        container.innerHTML = realDailyTasks.map(task => `
            <div class="task-item">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-medium text-apple-dark">${task.name}</div>
                        <div class="text-xs text-apple-gray">${this.getTaskDescription(task)}</div>
                        <div class="text-xs text-apple-gray">
                            ${task.startDate ? `${currentLanguage === 'en' ? 'Start: ' : '开始: '}${task.startDate}` : ''}
                            ${task.endDate ? ` ${currentLanguage === 'en' ? 'End: ' : '结束: '}${task.endDate}` : ''}
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="text-apple-red text-sm" onclick="taskManager.deleteTask('${task.id}', 'daily', true)">
                            ${getText('delete')}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateSingleTasksList() {
        const container = document.getElementById('singleTasksList');
        const today = this.formatDate(new Date());
        
        // 只显示今日的单日任务
        const todaySingleTasks = this.singleTasks.filter(task => task.date === today);
        
        if (todaySingleTasks.length === 0) {
            const isEnglish = document.documentElement.lang === 'en';
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📄</div><p>${currentLanguage === 'en' ? 'No single tasks for today' : '今日暂无单日任务'}</p></div>`;
            return;
        }

        container.innerHTML = todaySingleTasks.map(task => {
            const isCompleted = this.isTaskCompletedOnDate(task.id, task.date);
            return `
                <div class="task-item ${isCompleted ? 'completed' : ''}">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-medium text-apple-dark">${task.name}</div>
                            <div class="text-xs text-apple-gray">${this.getTaskDescription(task)}</div>
                            <div class="text-xs text-apple-gray">${document.documentElement.lang === 'en' ? 'Date: ' : '日期: '}${task.date}</div>
                            ${isCompleted ? `<div class="text-xs text-apple-green">✓ ${getText('completed')}</div>` : ''}
                        </div>
                        <div class="flex space-x-2">
                            ${!isCompleted ? `
                                <button class="text-apple-blue text-sm" onclick="taskManager.openCompletionModal('${task.id}', 'single', '${task.date}', false)">
                                    ${getText('complete')}
                                </button>
                            ` : `
                                <button class="text-apple-orange text-sm" onclick="taskManager.toggleTaskCompletion('${task.id}', 'single', '${task.date}')">
                                    ${getText('cancelCompletion')}
                                </button>
                            `}
                            <button class="text-apple-red text-sm" onclick="taskManager.deleteTask('${task.id}', 'single')">
                                ${getText('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateFutureTasksPreview() {
        const container = document.getElementById('futureTasksPreview');
        const today = new Date();
        const futureDates = [];
        
        for (let i = 1; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            futureDates.push(date);
        }

        container.innerHTML = futureDates.map(date => {
            const dateStr = this.formatDate(date);
            const tasks = this.futureTasks[dateStr] || [];
            
            return `
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="font-medium text-apple-dark mb-2">${this.formatDateDisplay(date)}</div>
                    <div class="space-y-1">
                        ${tasks.length > 0 ? tasks.map(task => `
                            <div class="text-sm text-apple-gray">• ${task.name}</div>
                        `).join('') : `<div class="text-sm text-apple-gray">${document.documentElement.lang === 'en' ? 'No tasks' : '无任务'}</div>`}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 统计面板更新
    updateStatisticsPanel() {
        console.log('更新数据统计页面，完成记录数量:', this.completedTasks.length);
        this.updateCompletionTrendChart();
        this.updateTaskCategoryChart();
        this.updateDetailedStats();
        console.log('数据统计页面更新完成');
    }

    updateCompletionTrendChart() {
        const canvas = document.getElementById('completionTrendChart');
        const ctx = canvas.getContext('2d');
        
        // 清除之前的图表实例
        if (this.completionTrendChart) {
            this.completionTrendChart.destroy();
        }
        
        // 获取最近7天的数据 - 基于实际完成记录重新计算
        const dates = [];
        const completions = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);
            dates.push(this.formatDateDisplay(date, 'short'));
            
            // 实时计算该日期的完成次数
            const dayCompletions = this.completedTasks.filter(record => record.date === dateStr).length;
            completions.push(dayCompletions);
        }

        this.completionTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: getText('completedTasks'),
                    data: completions,
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 10
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 5
                    }
                }
            }
        });
    }

    updateTaskCategoryChart() {
        const canvas = document.getElementById('taskCategoryChart');
        const ctx = canvas.getContext('2d');
        
        // 清除之前的图表实例
        if (this.taskCategoryChart) {
            this.taskCategoryChart.destroy();
        }
        
        // 基于实际完成记录重新计算分类统计
        const dailyCompletions = this.completedTasks.filter(record => record.taskType === 'daily').length;
        const singleCompletions = this.completedTasks.filter(record => record.taskType === 'single').length;
        
        const categories = [];
        const values = [];
        
        const isEnglish = document.documentElement.lang === 'en';
        
        if (dailyCompletions > 0) {
            categories.push(getText('dailyTasks'));
            values.push(dailyCompletions);
        }
        
        if (singleCompletions > 0) {
            categories.push(getText('singleTasks'));
            values.push(singleCompletions);
        }
        
        // 如果没有完成记录，显示占位数据
        if (categories.length === 0) {
            categories.push(getText('noData'));
            values.push(1);
        }

        this.taskCategoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: values,
                    backgroundColor: ['#007AFF', '#34C759', '#FF9500'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 11
                            },
                            padding: 12
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    updateDetailedStats() {
        const container = document.getElementById('detailedStats');
        
        // 计算实际的活跃任务数量
        const activeDailyTasks = this.dailyTasks.filter(task => {
            const today = new Date();
            return this.shouldTaskBeActiveOnDate(task, today);
        }).length;
        
        const activeSingleTasks = this.singleTasks.filter(task => {
            const taskDate = new Date(task.date);
            const today = new Date();
            // 显示未来30天内的单日任务
            return taskDate >= today && taskDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        }).length;
        
        // 获取当前页面语言
        const isEnglish = document.documentElement.lang === 'en';
        
        container.innerHTML = `
            <div class="text-center">
                <div class="text-2xl font-bold text-apple-blue">${activeDailyTasks}</div>
                <div class="text-sm text-apple-gray">${getText('activeDailyTasks')}</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-apple-green">${activeSingleTasks}</div>
                <div class="text-sm text-apple-gray">${getText('pendingSingleTasks')}</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-apple-purple">${this.completedTasks.length}</div>
                <div class="text-sm text-apple-gray">${getText('totalCompletions')}</div>
            </div>
        `;
    }

    // 未完成任务面板
    updateUnfinishedPanel() {
        const container = document.getElementById('unfinishedTasksList');
        const unfinishedTasks = this.getUnfinishedTasks();
        const completedTasks = this.getCompletedSingleTasks();
        const today = new Date();
        
        // 创建标签页界面
        container.innerHTML = `
            <div class="single-tasks-tabs">
                <div class="tab-buttons mb-4">
                    <button class="tab-button active" onclick="taskManager.switchSingleTaskTab('unfinished')" data-i18n="unfinishedTasks">
                        ${getText('unfinishedTasks')} (${unfinishedTasks.length})
                    </button>
                    <button class="tab-button" onclick="taskManager.switchSingleTaskTab('completed')" data-i18n="completedTasks">
                        ${getText('completedTasks')} (${completedTasks.length})
                    </button>
                </div>
                
                <div id="unfinished-tab" class="tab-content active">
                    ${this.renderUnfinishedTasksList(unfinishedTasks, today)}
                </div>
                
                <div id="completed-tab" class="tab-content hidden">
                    ${this.renderCompletedTasksList(completedTasks)}
                </div>
            </div>
        `;
    }

    // 渲染未完成任务列表
    renderUnfinishedTasksList(unfinishedTasks, today) {
        if (unfinishedTasks.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">🎉</div><p>${getText('noPending')}</p></div>`;
        }

        // 按状态分组：过期、今天、未来
        const overdue = [];
        const todayTasks = [];
        const upcoming = [];
        const todayStr = this.formatDate(today);

        unfinishedTasks.forEach(task => {
            const taskDate = new Date(task.date);
            if (task.date < todayStr) {
                overdue.push(task);
            } else if (task.date === todayStr) {
                todayTasks.push(task);
            } else {
                upcoming.push(task);
            }
        });

        let html = '';

        // 过期任务
        if (overdue.length > 0) {
            html += `
                <div class="task-group mb-6">
                    <h3 class="task-group-title text-apple-red">${getText('overdueTasks')} (${overdue.length})</h3>
                    ${overdue.map(task => this.renderTaskItem(task, 'overdue')).join('')}
                </div>
            `;
        }

        // 今天的任务
        if (todayTasks.length > 0) {
            html += `
                <div class="task-group mb-6">
                    <h3 class="task-group-title text-apple-blue">${getText('todayTasks')} (${todayTasks.length})</h3>
                    ${todayTasks.map(task => this.renderTaskItem(task, 'today')).join('')}
                </div>
            `;
        }

        // 未来任务
        if (upcoming.length > 0) {
            html += `
                <div class="task-group mb-6">
                    <h3 class="task-group-title text-apple-dark">${getText('upcomingTasks')} (${upcoming.length})</h3>
                    ${upcoming.map(task => this.renderTaskItem(task, 'upcoming')).join('')}
                </div>
            `;
        }

        return html;
    }

    // 渲染已完成任务列表
    renderCompletedTasksList(completedTasks) {
        if (completedTasks.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">📋</div><p>${getText('noCompletedSingle')}</p></div>`;
        }

        return completedTasks.map(task => {
            const completionDate = task.completionRecord ? new Date(task.completionRecord.completedAt) : null;
            const completionDateStr = completionDate ? this.formatDateDisplay(completionDate) : '未知';
            
            return `
                <div class="task-item completed-task">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="font-medium text-apple-dark">${task.name}</div>
                            <div class="text-xs text-apple-gray mt-1">
                                <span>${getText('scheduledDate')}: ${task.date}</span>
                                <span class="ml-4">${getText('completedDate')}: ${completionDateStr}</span>
                            </div>
                            ${task.completionRecord && task.completionRecord.note ? 
                                `<div class="text-xs text-apple-gray mt-1">${getText('note')}: ${task.completionRecord.note}</div>` : ''
                            }
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-apple-green text-sm">✓</span>
                            <button class="text-apple-orange text-sm" onclick="taskManager.reCompleteTask('${task.id}', '${task.date}')">
                                ${getText('reComplete')}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染单个任务项
    renderTaskItem(task, status) {
        const statusClass = {
            'overdue': 'border-l-4 border-apple-red',
            'today': 'border-l-4 border-apple-blue', 
            'upcoming': 'border-l-4 border-apple-gray'
        }[status] || '';

        return `
            <div class="task-item ${statusClass}">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-medium text-apple-dark">${task.name}</div>
                        <div class="text-xs text-apple-gray">${getText('date')}: ${task.date}</div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="text-apple-green text-sm" onclick="taskManager.markTaskAsCompleted('${task.id}', '${task.date}')">
                            ${getText('complete')}
                        </button>
                        <button class="text-apple-orange text-sm" onclick="taskManager.markTaskAsPostponed('${task.id}')">
                            ${getText('postpone')}
                        </button>
                        <button class="text-apple-red text-sm" onclick="taskManager.markTaskAsAbandoned('${task.id}')">
                            ${getText('abandon')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getUnfinishedTasks() {
        const today = new Date();
        const unfinished = [];
        
        // 检查所有单日任务，无论过去还是未来
        this.singleTasks.forEach(task => {
            const isCompleted = this.isTaskCompletedOnDate(task.id, task.date);
            if (!isCompleted) {
                unfinished.push({
                    ...task,
                    instanceId: `${task.id}_${task.date}`,
                    completed: false
                });
            }
        });
        
        // 按日期排序：过期的在前，今天的在中间，未来的在后
        unfinished.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
        });
        
        return unfinished;
    }

    // 获取已完成的单日任务
    getCompletedSingleTasks() {
        const completed = [];
        
        // 检查所有单日任务，找出已完成的
        this.singleTasks.forEach(task => {
            const isCompleted = this.isTaskCompletedOnDate(task.id, task.date);
            if (isCompleted) {
                // 获取完成记录的详细信息
                const completionRecord = this.completedTasks.find(record => 
                    record.taskId === task.id && record.date === task.date
                );
                
                completed.push({
                    ...task,
                    instanceId: `${task.id}_${task.date}`,
                    completed: true,
                    completionRecord: completionRecord
                });
            }
        });
        
        // 按完成时间排序，最近完成的在前
        completed.sort((a, b) => {
            const timeA = a.completionRecord ? new Date(a.completionRecord.completedAt) : new Date(0);
            const timeB = b.completionRecord ? new Date(b.completionRecord.completedAt) : new Date(0);
            return timeB - timeA;
        });
        
        return completed;
    }

    // 通知功能
    setupNotifications() {
        if ('Notification' in window && Notification.permission === 'default') {
            setTimeout(() => {
                document.getElementById('notificationPrompt').style.display = 'block';
            }, 3000);
        }
    }

    requestNotificationPermission() {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                const isEnglish = document.documentElement.lang === 'en';
                this.showNotification(getText('notificationsEnabled'), 'success');
                this.dismissNotificationPrompt();
            }
        });
    }

    dismissNotificationPrompt() {
        document.getElementById('notificationPrompt').style.display = 'none';
    }

    // 工具方法
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateDisplay(date, format = 'full') {
        const locale = currentLanguage === 'en' ? 'en-US' : 'zh-CN';
        const options = format === 'short' ? 
            { month: 'short', day: 'numeric' } : 
            { month: 'long', day: 'numeric', weekday: 'short' };
        
        return date.toLocaleDateString(locale, options);
    }

    getUnit(dimension) {
        switch(dimension) {
            case 'count': return getText('times');
            case 'time': return getText('minutes');
            default: return '';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1001;
            background: ${type === 'success' ? '#34C759' : type === 'error' ? '#FF3B30' : '#007AFF'};
            color: white; padding: 12px 20px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    triggerCompletionAnimation() {
        const elements = document.querySelectorAll('.breathing-number');
        elements.forEach(el => {
            el.classList.add('success-animation');
            setTimeout(() => el.classList.remove('success-animation'), 500);
        });
    }

    // 筛选未完成任务
    filterUnfinishedTasks(filter) {
        // 这里可以添加筛选逻辑
        this.updateUnfinishedPanel();
    }

    // 标记任务状态
    markTaskAsCompleted(taskId, date) {
        // 找到对应的任务并标记为完成
        const task = this.singleTasks.find(t => t.id === taskId);
        if (task) {
            this.completeTask(taskId, 'single', new Date(date));
            // 立即更新未完成任务面板
            this.updateUnfinishedPanel();
        }
    }

    markTaskAsPostponed(taskId) {
        const isEnglish = document.documentElement.lang === 'en';
        this.showNotification(currentLanguage === 'en' ? 'Task postponed' : '任务已搁置', 'info');
        // 可以添加搁置逻辑
    }

    markTaskAsAbandoned(taskId) {
        const isEnglish = document.documentElement.lang === 'en';
        this.showNotification(currentLanguage === 'en' ? 'Task abandoned' : '任务已放弃', 'warning');
        // 可以添加放弃逻辑
    }

    // 切换单日任务标签页
    switchSingleTaskTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="taskManager.switchSingleTaskTab('${tabName}')"]`).classList.add('active');

        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.remove('hidden');
            targetTab.classList.add('active');
        }
    }

    // 重新完成任务（修改完成记录）
    reCompleteTask(taskId, date) {
        const task = this.singleTasks.find(t => t.id === taskId);
        if (task) {
            this.openCompletionModal(taskId, 'single', date, true);
        }
    }

    // 启动持续计时器
    startPersistTimer() {
        // 如果已经有计时器在运行，先清除
        if (this.persistTimer) {
            clearInterval(this.persistTimer);
        }
        
        if (!this.persistStartTime) {
            document.getElementById('persistTimer').textContent = '000:00:00';
            return;
        }

        this.updatePersistTimer();
        this.persistTimer = setInterval(() => {
            this.updatePersistTimer();
        }, 1000);
    }

    // 更新持续计时器显示
    updatePersistTimer() {
        if (!this.persistStartTime) {
            document.getElementById('persistTimer').textContent = '000:00:00';
            return;
        }

        const startTime = new Date(this.persistStartTime);
        const now = new Date();
        const diff = now - startTime;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const formattedTime = `${hours.toString().padStart(3, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('persistTimer').textContent = formattedTime;

        // 每小时检查是否需要撒花特效
        if (minutes === 0 && seconds === 0) {
            this.showConfetti();
        }
    }

    // 撒花特效
    showConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);

        // 创建多个撒花片
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D', '#6BCF7F'];
            confetti.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                top: -10px;
                left: ${Math.random() * 100}%;
                animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
            `;
            confettiContainer.appendChild(confetti);
        }

        // 显示祝贺消息
        this.showNotification(currentLanguage === 'en' ? '🎉 Congratulations on persisting for another hour!' : '🎉 恭喜坚持又一个小时！', 'success');

        // 移除撒花容器
        setTimeout(() => {
            if (document.body.contains(confettiContainer)) {
                document.body.removeChild(confettiContainer);
            }
        }, 5000);
    }

    // 删除单个完成记录
    deleteCompletionRecord(recordId) {
        const recordIndex = this.completedTasks.findIndex(record => record.id === recordId);
        if (recordIndex === -1) return;

        const record = this.completedTasks[recordIndex];
        this.completedTasks.splice(recordIndex, 1);
        this.saveData(this.STORAGE_KEYS.COMPLETED_TASKS, this.completedTasks);

        // 重新计算每日任务统计
        this.recalculateDailyTaskStats();
        
        this.generateFutureTasks();
        this.updateAllDisplays();
        this.showNotification(currentLanguage === 'en' ? `Completion record cancelled: ${record.taskName}` : `已取消完成记录: ${record.taskName}`, 'info');
    }

    // 重置持续计时器（用于测试或重置功能）
    resetPersistTimer() {
        if (this.persistTimer) {
            clearInterval(this.persistTimer);
        }
        this.persistStartTime = null;
        this.saveData('persist_start_time', null);
        document.getElementById('persistTimer').textContent = '000:00:00';
    }
}

// 初始化应用
let taskManager;
let authManager;

document.addEventListener('DOMContentLoaded', () => {
    // 初始化任务管理器
    taskManager = new TaskManager();
    window.taskManager = taskManager; // 确保全局可访问
    
    // 初始化认证管理器
    authManager = new AuthManager();
    window.authManager = authManager; // 确保全局可访问
    authManager.init();
}); 

/* ==================== 国际化规则与检查工具 ==================== */

/**
 * 🌐 国际化开发规则 (Internationalization Rules)
 * 
 * 1. 【强制】所有用户可见的文本必须使用 getText(key) 函数
 * 2. 【强制】禁止在代码中直接使用中文或英文硬编码字符串
 * 3. 【强制】新增功能必须在 translations 对象中添加对应的中英文翻译
 * 4. 【强制】动态生成的内容必须使用 getText() 获取翻译文本
 * 5. 【强制】单位、数字等也必须国际化
 * 
 * ✅ 正确示例：
 * - getText('taskName')
 * - `${getText('total')}: ${count} ${getText('times')}`
 * - unitLabel.textContent = getText('minutes')
 * 
 * ❌ 错误示例：
 * - '任务名称' 或 'Task Name'
 * - `总计: ${count}次` 或 `Total: ${count} times`
 * - unitLabel.textContent = '分钟'
 */

/**
 * 国际化检查工具 - 检测代码中的硬编码文本
 */
function checkInternationalization() {
    console.log('🌐 开始国际化检查...');
    
    const issues = [];
    const codeText = document.documentElement.outerHTML + '\n' + document.querySelector('script').textContent;
    
    // 检查中文硬编码
    const chineseRegex = /[\u4e00-\u9fa5]+/g;
    const chineseMatches = codeText.match(chineseRegex);
    if (chineseMatches) {
        issues.push(`❌ 发现中文硬编码: ${chineseMatches.slice(0, 5).join(', ')}${chineseMatches.length > 5 ? '...' : ''}`);
    }
    
    // 检查常见英文硬编码模式
    const englishPatterns = [
        /['"`]Task\s+\w+['"`]/g,
        /['"`]\w+\s+Task['"`]/g,
        /['"`]\w+\s+completed['"`]/g,
        /['"`]Total\s+\w+['"`]/g,
        /['"`]\w+\s+times['"`]/g,
        /['"`]\w+\s+minutes['"`]/g
    ];
    
    englishPatterns.forEach((pattern, index) => {
        const matches = codeText.match(pattern);
        if (matches) {
            issues.push(`❌ 发现英文硬编码模式 ${index + 1}: ${matches.slice(0, 3).join(', ')}`);
        }
    });
    
    // 检查是否有未使用 getText() 的文本
    const suspiciousTextRegex = /textContent\s*=\s*['"`][^'"`]*['"`]/g;
    const suspiciousMatches = codeText.match(suspiciousTextRegex);
    if (suspiciousMatches) {
        const filtered = suspiciousMatches.filter(match => 
            !match.includes('getText(') && 
            !/^textContent\s*=\s*['"`][0-9:.-]+['"`]/.test(match)
        );
        if (filtered.length > 0) {
            issues.push(`⚠️ 可疑的textContent赋值: ${filtered.slice(0, 3).join(', ')}`);
        }
    }
    
    if (issues.length === 0) {
        console.log('✅ 国际化检查通过！');
    } else {
        console.log('❌ 国际化检查发现问题:');
        issues.forEach(issue => console.log(issue));
    }
    
    return issues;
}

/**
 * 翻译完整性检查 - 确保中英文翻译键值对一致
 */
function checkTranslationCompleteness() {
    console.log('🔍 检查翻译完整性...');
    
    const enKeys = Object.keys(translations.en);
    const zhKeys = Object.keys(translations.zh);
    
    const missingInChinese = enKeys.filter(key => !zhKeys.includes(key));
    const missingInEnglish = zhKeys.filter(key => !enKeys.includes(key));
    
    const issues = [];
    
    if (missingInChinese.length > 0) {
        issues.push(`❌ 中文翻译缺失: ${missingInChinese.join(', ')}`);
    }
    
    if (missingInEnglish.length > 0) {
        issues.push(`❌ 英文翻译缺失: ${missingInEnglish.join(', ')}`);
    }
    
    if (issues.length === 0) {
        console.log('✅ 翻译完整性检查通过！');
        console.log(`📊 总计翻译键值: ${enKeys.length} 个`);
    } else {
        console.log('❌ 翻译完整性检查发现问题:');
        issues.forEach(issue => console.log(issue));
    }
    
    return issues;
}

/**
 * 运行所有国际化检查
 */
function runAllI18nChecks() {
    console.log('🚀 运行完整国际化检查...');
    const translationIssues = checkTranslationCompleteness();
    const codeIssues = checkInternationalization();
    
    const totalIssues = translationIssues.length + codeIssues.length;
    
    if (totalIssues === 0) {
        console.log('🎉 所有国际化检查通过！系统已正确国际化。');
    } else {
        console.log(`⚠️ 发现 ${totalIssues} 个国际化问题，请及时修复。`);
    }
    
    return {
        translationIssues,
        codeIssues,
        totalIssues
    };
}

// 在开发模式下自动运行检查
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // 延迟运行，确保页面完全加载
    setTimeout(() => {
        runAllI18nChecks();
    }, 2000);
}

/* ==================== 国际化规则结束 ==================== */