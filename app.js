/**
 * News Hub - 个人新闻聚合平台
 * 前端交互逻辑
 */

// ===== 配置 =====
const CONFIG = {
    PASSWORD: '465375',
    MAX_ATTEMPTS: 3,
    LOCK_DURATION: 3 * 60 * 1000, // 3分钟
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24小时
    API_ENDPOINT: '/api/news',
    STORAGE_KEY: 'newsHubAuth',
    LOCK_KEY: 'newsHubLock',
    READ_KEY: 'newsHubRead'
};

// ===== DOM 元素 =====
const elements = {
    authOverlay: document.getElementById('auth-overlay'),
    passwordForm: document.getElementById('password-form'),
    lockScreen: document.getElementById('lock-screen'),
    passwordInput: document.getElementById('password-input'),
    submitBtn: document.getElementById('submit-btn'),
    errorMsg: document.getElementById('error-msg'),
    countdownTimer: document.getElementById('countdown-timer'),
    app: document.getElementById('app'),
    newsList: document.getElementById('news-list'),
    skeleton: document.getElementById('skeleton'),
    emptyState: document.getElementById('empty-state'),
    errorState: document.getElementById('error-state'),
    errorText: document.getElementById('error-text'),
    refreshBtn: document.getElementById('refresh-btn'),
    retryBtn: document.getElementById('retry-btn'),
    updateTime: document.getElementById('update-time'),
    updateStatus: document.getElementById('update-status'),
    themeToggle: document.getElementById('theme-toggle'),
    logoutBtn: document.getElementById('logout-btn'),
    categoryBtns: document.querySelectorAll('.category-btn'),
    newsModal: document.getElementById('news-modal'),
    modalClose: document.querySelector('.modal-close'),
    modalOverlay: document.querySelector('.modal-overlay')
};

// ===== 状态管理 =====
let state = {
    news: [],
    currentCategory: 'all',
    isLoading: false,
    readIds: new Set(),
    isSample: false
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initTheme();
    bindEvents();
    loadReadStatus();
});

// ===== 认证逻辑 =====
function initAuth() {
    // 检查是否在锁定状态
    if (isLocked()) {
        showLockScreen();
        return;
    }
    
    // 检查是否有有效会话
    if (hasValidSession()) {
        showApp();
        loadNews();
    } else {
        showAuth();
    }
}

function isLocked() {
    const lockData = localStorage.getItem(CONFIG.LOCK_KEY);
    if (!lockData) return false;
    
    const { lockUntil } = JSON.parse(lockData);
    return Date.now() < lockUntil;
}

function hasValidSession() {
    const authData = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!authData) return false;
    
    const { timestamp } = JSON.parse(authData);
    return Date.now() - timestamp < CONFIG.SESSION_DURATION;
}

function showAuth() {
    elements.authOverlay.classList.remove('hidden');
    elements.app.classList.add('hidden');
    elements.passwordForm.classList.remove('hidden');
    elements.lockScreen.classList.add('hidden');
    elements.passwordInput.focus();
}

function showLockScreen() {
    elements.authOverlay.classList.remove('hidden');
    elements.app.classList.add('hidden');
    elements.passwordForm.classList.add('hidden');
    elements.lockScreen.classList.remove('hidden');
    
    startCountdown();
}

function showApp() {
    elements.authOverlay.classList.add('hidden');
    elements.app.classList.remove('hidden');
}

function startCountdown() {
    const lockData = JSON.parse(localStorage.getItem(CONFIG.LOCK_KEY));
    const lockUntil = lockData.lockUntil;
    
    function updateCountdown() {
        const remaining = lockUntil - Date.now();
        
        if (remaining <= 0) {
            localStorage.removeItem(CONFIG.LOCK_KEY);
            showAuth();
            return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        elements.countdownTimer.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        setTimeout(updateCountdown, 1000);
    }
    
    updateCountdown();
}

function handlePasswordSubmit() {
    const password = elements.passwordInput.value.trim();
    
    if (!password) {
        showError('请输入密码');
        return;
    }
    
    if (password === CONFIG.PASSWORD) {
        // 验证成功
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
            timestamp: Date.now()
        }));
        localStorage.removeItem(CONFIG.LOCK_KEY);
        
        showApp();
        loadNews();
    } else {
        // 验证失败
        handleFailedAttempt();
    }
}

function handleFailedAttempt() {
    let attempts = parseInt(localStorage.getItem('failedAttempts') || '0') + 1;
    localStorage.setItem('failedAttempts', attempts);
    
    if (attempts >= CONFIG.MAX_ATTEMPTS) {
        // 锁定
        localStorage.setItem(CONFIG.LOCK_KEY, JSON.stringify({
            lockUntil: Date.now() + CONFIG.LOCK_DURATION,
            attempts: attempts
        }));
        localStorage.removeItem('failedAttempts');
        showLockScreen();
    } else {
        const remaining = CONFIG.MAX_ATTEMPTS - attempts;
        showError(`密码错误，还剩 ${remaining} 次机会`);
        elements.passwordInput.value = '';
        elements.passwordInput.focus();
    }
}

function showError(msg) {
    elements.errorMsg.textContent = msg;
    elements.passwordInput.style.borderColor = '#dc2626';
    
    setTimeout(() => {
        elements.errorMsg.textContent = '';
        elements.passwordInput.style.borderColor = '';
    }, 3000);
}

function logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    localStorage.removeItem(CONFIG.LOCK_KEY);
    localStorage.removeItem('failedAttempts');
    location.reload();
}

// ===== 新闻加载 =====
async function loadNews(force = false) {
    if (state.isLoading) return;
    
    state.isLoading = true;
    showLoading();
    
    try {
        const response = await fetch(`${CONFIG.API_ENDPOINT}?category=${state.currentCategory}${force ? '&force=1' : ''}`);
        
        if (!response.ok) {
            throw new Error('加载失败');
        }
        
        const data = await response.json();
        state.news = data.news || [];
        state.isSample = data.isSample || false;
        
        renderNews();
        updateTime(data.lastUpdate);
        
        // 如果是示例数据，显示提示
        if (state.isSample) {
            elements.updateStatus.textContent = '示例数据';
            elements.updateStatus.style.color = '#f59e0b';
        }
        
    } catch (error) {
        console.error('加载新闻失败:', error);
        showErrorState('网络连接失败，请稍后重试');
    } finally {
        state.isLoading = false;
        elements.updateStatus.classList.remove('loading');
    }
}

function showLoading() {
    elements.skeleton.classList.remove('hidden');
    elements.newsList.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.updateStatus.classList.add('loading');
    elements.updateStatus.textContent = '更新中...';
}

function renderNews() {
    elements.skeleton.classList.add('hidden');
    
    if (state.news.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.newsList.classList.add('hidden');
        return;
    }
    
    elements.newsList.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    
    const html = state.news.map(item => createNewsCard(item)).join('');
    elements.newsList.innerHTML = html;
}

function createNewsCard(item) {
    const isRead = state.readIds.has(item.id);
    const timeAgo = getTimeAgo(item.publishedAt);
    
    return `
        <article class="news-card ${isRead ? 'read' : ''} ${item.category === 'breaking' ? 'breaking' : ''}" 
                 data-id="${item.id}" 
                 onclick="openNews('${item.id}')">
            <div class="card-header">
                <span class="category-tag ${item.category}">${getCategoryName(item.category)}</span>
                <span class="time-tag">${timeAgo}</span>
            </div>
            <h3 class="news-title">${escapeHtml(item.title)}</h3>
            <p class="news-summary">${escapeHtml(item.summary)}</p>
            <div class="source-tag">
                <span>📰</span>
                <span>${escapeHtml(item.source)}</span>
            </div>
        </article>
    `;
}

function getCategoryName(category) {
    const names = {
        ai: 'AI前沿',
        tech: '科技',
        finance: '财经',
        breaking: '突发'
    };
    return names[category] || category;
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN');
}

function updateTime(timestamp) {
    if (!timestamp) {
        elements.updateTime.textContent = '未知';
        return;
    }
    
    const date = new Date(timestamp);
    const timeStr = date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    elements.updateTime.textContent = timeStr;
}

function showErrorState(msg) {
    elements.skeleton.classList.add('hidden');
    elements.newsList.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.errorState.classList.remove('hidden');
    elements.errorText.textContent = msg;
    elements.updateStatus.textContent = '更新失败';
}

// ===== 新闻详情 =====
function openNews(id) {
    const item = state.news.find(n => n.id === id);
    if (!item) return;
    
    // 标记为已读
    markAsRead(id);
    
    // 填充模态框
    document.getElementById('modal-category').textContent = getCategoryName(item.category);
    document.getElementById('modal-category').className = `category-badge ${item.category}`;
    document.getElementById('modal-time').textContent = new Date(item.publishedAt).toLocaleString('zh-CN');
    document.getElementById('modal-title').textContent = item.title;
    document.getElementById('modal-summary').querySelector('p').textContent = item.summary || '暂无摘要';
    document.getElementById('modal-body').innerHTML = item.content || item.summary || '暂无内容';
    document.getElementById('modal-link').href = item.url;
    
    // 显示模态框
    elements.newsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.newsModal.classList.add('hidden');
    document.body.style.overflow = '';
}

function markAsRead(id) {
    state.readIds.add(id);
    localStorage.setItem(CONFIG.READ_KEY, JSON.stringify([...state.readIds]));
    
    // 更新UI
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) {
        card.classList.add('read');
    }
}

function loadReadStatus() {
    const readData = localStorage.getItem(CONFIG.READ_KEY);
    if (readData) {
        state.readIds = new Set(JSON.parse(readData));
    }
}

// ===== 主题切换 =====
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const sunIcon = elements.themeToggle.querySelector('.sun-icon');
    const moonIcon = elements.themeToggle.querySelector('.moon-icon');
    
    if (theme === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// ===== 分类筛选 =====
function filterCategory(category) {
    state.currentCategory = category;
    
    // 更新按钮状态
    elements.categoryBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    loadNews();
}

// ===== 工具函数 =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== 事件绑定 =====
function bindEvents() {
    // 密码提交
    elements.submitBtn.addEventListener('click', handlePasswordSubmit);
    elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handlePasswordSubmit();
    });
    
    // 刷新
    elements.refreshBtn.addEventListener('click', () => loadNews(true));
    
    // 重试
    elements.retryBtn.addEventListener('click', () => loadNews());
    
    // 主题切换
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // 退出登录
    elements.logoutBtn.addEventListener('click', logout);
    
    // 分类筛选
    elements.categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => filterCategory(btn.dataset.category));
    });
    
    // 模态框关闭
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', closeModal);
    
    // ESC 关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// 暴露全局函数
window.openNews = openNews;
