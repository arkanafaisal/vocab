// ==========================================
// SECTION 1: STATE & BACKEND SERVICES
// ==========================================
const state = {
    user: null, 
    score: 0,
    streak: 0,
    currentQuestion: null,
    view: 'quiz', 
    leaderboard: [],
    lbStatus: 'idle', 
    lbCooldown: 0,
    retryCount: 0,
    quizUI: {
        selectedAnswer: null,
        isValidating: false,
        isTransitioning: false,
        correctAnswerText: null, 
        animationFinished: false,
        pendingResult: null 
    }
};

const Icons = {
    User: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    LogOut: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
    LogIn: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>`,
    Fire: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a5.5 5.5 0 1 1-11 0c0-.396.06-.776.17-1.132a5.5 5.5 0 0 0 .33 1.632z"/></svg>`,
    FireOutline: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a5.5 5.5 0 1 1-11 0c0-.396.06-.776.17-1.132a5.5 5.5 0 0 0 .33 1.632z"/></svg>`,
    Fullscreen: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`
};

// DOM Elements
const authModal = document.getElementById('auth-modal');
const globalToast = document.getElementById('global-toast');
const toastContent = document.getElementById('toast-content');
const connModal = document.getElementById('connection-modal');
const logoutSuccessModal = document.getElementById('logout-success-modal'); 
const fullscreenModal = document.getElementById('fullscreen-modal'); 
const userInfoModal = document.getElementById('user-info-modal');
const editModal = document.getElementById('edit-modal');
const resetConfirmModal = document.getElementById('reset-confirm-modal');

const fullscreenAllowBtn = document.getElementById('fullscreen-allow-btn'); 
const fullscreenDenyBtn = document.getElementById('fullscreen-deny-btn'); 
const connModalTitle = document.getElementById('conn-modal-title');
const connModalDesc = document.getElementById('conn-modal-desc');
const connReloadBtn = document.getElementById('conn-reload-btn');
const connLoading = document.getElementById('conn-loading');
const logoutRefreshBtn = document.getElementById('logout-refresh-btn'); 
const logoutTimer = document.getElementById('logout-timer'); 
const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('input-username');
const passwordInput = document.getElementById('input-password');
const emailInput = document.getElementById('input-email');
const confirmPassInput = document.getElementById('input-confirm-password');
const emailContainer = document.getElementById('container-email');
const confirmPassContainer = document.getElementById('container-confirm-pass');
const authBtnText = document.getElementById('auth-btn-text');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const authNotification = document.getElementById('auth-notification');
const authNotifText = document.getElementById('auth-notif-text');
const authNotifIcon = document.getElementById('auth-notif-icon');
const authSubtitleLogin = document.getElementById('auth-subtitle-login');
const authSubtitleRegister = document.getElementById('auth-subtitle-register');
const authCloseBtn = document.getElementById('auth-close-btn');
const retryBtn = document.getElementById('retry-btn'); 
const retryOverlay = document.getElementById('retry-overlay');
const userInfoCloseBtn = document.getElementById('user-info-close-btn');
const editCancelBtn = document.getElementById('edit-cancel-btn');
const resetCancelBtn = document.getElementById('reset-cancel-btn');
const mobileUserInfoBtn = document.getElementById('mobile-user-info-btn');

// Deep Link Modal Elements
const verifyProcessModal = document.getElementById('verify-process-modal');
const newPasswordModal = document.getElementById('new-password-modal');
const verifyTitle = document.getElementById('verify-title');
const verifyDesc = document.getElementById('verify-desc');
const verifySpinner = document.getElementById('verify-spinner');
const verifyIcon = document.getElementById('verify-icon');
const verifyErrorIcon = document.getElementById('verify-error-icon');
const verifyCloseBtn = document.getElementById('verify-close-btn');
const verifyBackBtn = document.getElementById('verify-back-btn');
const newPasswordForm = document.getElementById('new-password-form');
const npInput = document.getElementById('np-input');
const npConfirm = document.getElementById('np-confirm');
const npSubmitBtn = document.getElementById('np-submit-btn');
const npSuccessView = document.getElementById('np-success-view');
const npFormView = document.getElementById('np-form-view');
const npBackBtn = document.getElementById('np-back-btn');
const npMessage = document.getElementById('np-message');

// User Info Elements
const infoScore = document.getElementById('info-score');
const infoStreak = document.getElementById('info-streak');
const infoUsername = document.getElementById('info-username');
const infoEmail = document.getElementById('info-email');
const editUsernameBtn = document.getElementById('edit-username-btn');
const editEmailBtn = document.getElementById('edit-email-btn');
const resetPassInitBtn = document.getElementById('reset-pass-init-btn');

// Edit Modal Elements
const editModalTitle = document.getElementById('edit-modal-title');
const editLabelInput = document.getElementById('edit-label-input');
const editInputValue = document.getElementById('edit-input-value');
const editInputPassword = document.getElementById('edit-input-password');
const editSaveBtn = document.getElementById('edit-save-btn');
const editForm = document.getElementById('edit-form');
const editMessage = document.getElementById('edit-message');

// Reset Confirm Elements
const resetEmailTarget = document.getElementById('reset-email-target');
const resetConfirmSendBtn = document.getElementById('reset-confirm-send-btn');

const API_BASE_URL = "/api";
let socket = null;
let lbInterval = null;
let currentEditMode = null; // 'username' or 'email'
let toastTimeout;

function showToast(msg, type = 'info') {
    if (toastTimeout) clearTimeout(toastTimeout);
    let bgClass, textClass, iconSVG;

    if (type === 'success') {
        bgClass = 'bg-emerald-900/90 border border-emerald-500/50';
        textClass = 'text-white';
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        bgClass = 'bg-rose-900/90 border border-rose-500/50';
        textClass = 'text-white';
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
    } else {
        bgClass = 'bg-dark-800/90 border border-dark-600';
        textClass = 'text-slate-200';
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toastContent.className = `px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3 backdrop-blur-md ${bgClass} ${textClass}`;
    toastContent.innerHTML = `${iconSVG}<span>${msg}</span>`;

    globalToast.classList.remove('opacity-0', '-translate-y-10', 'pointer-events-none');
    globalToast.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');

    toastTimeout = setTimeout(() => {
        globalToast.classList.add('opacity-0', '-translate-y-10', 'pointer-events-none');
        globalToast.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    }, 3000);
}

function showConnectionModal(title, desc, isFatal = true) {
    connModalTitle.textContent = title;
    connModalDesc.textContent = desc;
    if (isFatal) {
        connReloadBtn.classList.remove('hidden');
        connLoading.classList.add('hidden');
    } else {
        connReloadBtn.classList.add('hidden');
        connLoading.classList.remove('hidden');
    }
    connModal.classList.remove('hidden');
}

// VALIDATION HELPERS
const isValidUsername = (u) => /^[a-zA-Z0-9_]{3,15}$/.test(u);
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 31;
const isValidPassword = (p) => p.length >= 6 && p.length <= 255;
const isValidToken = (t) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(t);

async function fetchData(endpoint, method = 'GET', body = null, isRetry = false) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        let response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // Pesan error manual untuk 429 dan 500 (tanpa parsing JSON)
        if (response.status === 429) {
            return { success: false, message: "limit tercapai, coba lagi nanti" };
        }
        if (response.status === 500) {
            return { success: false, message: "server error, harap hubungi admin" };
        }

        // Parsing JSON untuk status selain 429 dan 500 (termasuk 403, 401, dll)
        let responseData = await response.json();

        if (response.status === 401 && !isRetry) {
            if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
                return responseData; 
            }

            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST' });
            
            if (refreshRes.ok) {
                return await fetchData(endpoint, method, body, true);
            } else {
                state.user = null;
                if (socketService) socketService.disconnect();
                renderHeader(); 
                openAuthModal();
                showToast(responseData.message, 'error');
                return responseData;
            }
        }

        // Tampilkan pesan untuk error 403
        if (response.status === 403) {
            showToast(responseData.message, 'error');
            return responseData;
        }

        return responseData;

    } catch (err) {
        console.error(`API Error (${endpoint}):`, err);
        return { success: false, message: "Network Error" };
    }
}

const api = {
    async login(credential, password) {
        const isEmail = credential.includes('@');
        const body = { password };
        if (isEmail) body.email = credential;
        else body.username = credential;
        return await fetchData('/auth/login', 'POST', body);
    },
    async register(username, password, email) {
        const body = { username, password };
        if(email) body.email = email;
        return await fetchData('/auth/register', 'POST', body);
    },
    async logout() {
        return await fetchData('/auth/logout', 'DELETE');
    },
    async getLeaderboard() {
        return await fetchData('/users/', 'GET');
    },
    async getMe() {
        return await fetchData('/users/me', 'GET');
    },
    async updateUsername(newUsername, password) {
        return await fetchData('/users/update-username', 'PATCH', { newUsername, password });
    },
    async updateEmail(newEmail, password) {
        return await fetchData('/users/update-email', 'PATCH', { newEmail, password });
    },
    async resetPassword() {
        return await fetchData('/users/reset-password', 'PATCH');
    },
    async verifyEmail(token) {
            return await fetchData(`/users/verify-email?token=${token}`, 'GET');
    },
    async confirmResetPassword(token, newPassword) {
            // UPDATED Endpoint
            return await fetchData(`/users/verify-reset-password?token=${token}`, 'PATCH', { password: newPassword });
    }
};

const socketService = {
    connect() {
        if (socket) return;
        try {
            socket = io("/", {
                withCredentials: true,
                transports: ['websocket']
            });

            socket.on("warn", async (data) => {
                const code = data.code;
                const msg = data.message || "Terjadi peringatan dari server.";
                
                console.warn(`Socket Warn [${code}]: ${msg}`);

                switch (code) {
                    case 1001: // RATE_LOCKED
                        showConnectionModal("Akses Dibatasi", msg, true);
                        socketService.disconnect();
                        break;
                    case 1002: // TEMP_FAILURE
                        showToast(msg, 'error');
                        break;
                    case 1003: // UNAUTHORIZED, QUIZ_OUT_OF_SYNC, SESSION_EXPIRED
                        showToast(msg, 'error');
                        state.retryCount = (state.retryCount || 0) + 1;
                        if (state.retryCount > 3) {
                            window.location.reload();
                        } else {
                            setTimeout(() => {
                                if (socket && socket.disconnected) {
                                    socket.connect();
                                }
                            }, 1000);
                        }
                        break;
                    case 1004: // USER_NOT_FOUND, SERVER_ERROR
                        showConnectionModal("Terjadi Kesalahan", msg, true);
                        socketService.disconnect();
                        break;
                    case 1005: // ACCOUNT_CONFLICT
                        showToast(msg, 'error');
                        await api.logout();
                        state.user = null;
                        socketService.disconnect();
                        renderHeader();
                        openAuthModal();
                        break;
                    default:
                        showToast(msg, 'error');
                }
            });

            socket.on("disconnect", (reason) => {
                console.log("Socket disconnected:", reason);
                renderHeader();
                if (state.quizUI.isValidating) {
                    showToast("Koneksi terputus. Silakan coba lagi.", 'error');
                    state.quizUI.isValidating = false;
                    state.quizUI.selectedAnswer = null;
                    state.quizUI.animationFinished = false;
                    state.quizUI.pendingResult = null;
                    renderQuiz(); 
                }
            });

            socket.on("connect_error", async (err) => {
                console.log("Socket connect error:", err.message);
                const res = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST' });
                if (res.ok) {
                    socket.connect(); 
                } else {
                    state.user = null;
                    renderHeader();
                    openAuthModal();
                    showToast("Gagal terhubung ke game server. Silakan login ulang.", 'error');
                }
            });

        } catch(e) { console.log("Socket init failed"); }
    },
    disconnect() {
        if (socket) { socket.disconnect(); socket = null; }
    },
    getQuestion() { if (socket) socket.emit("request_question"); },
    submitAnswer(answer) { if (socket && socket.connected) socket.emit("submit_answer", answer); }, 
    onQuestionReceived(callback) { if (socket) socket.on("new_question", callback); },
    onAnswerResult(callback) { if (socket) socket.on("answer_result", callback); },
    off(event) { if (socket) socket.off(event); }
};

// ==========================================
// SECTION 2: UI LOGIC & HANDLERS
// ==========================================

let isLoginMode = true;

const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationFrameId;

const formatScore = (num) => num >= 1000 ? (num/1000).toFixed(1)+'K' : num.toLocaleString();

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function spawnParticles(x, y, count, type = 'spark') {
    let colors = ['#f59e0b', '#fbbf24']; 
    if (type === 'fire') colors = ['#ef4444', '#f87171', '#fbbf24', '#f59e0b']; 
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vx = type === 'ember' ? (Math.random() - 0.5) * 2 : Math.cos(angle) * (Math.random() * 3 + 1);
        const vy = type === 'ember' ? -(Math.random() * 2 + 1) : Math.sin(angle) * (Math.random() * 3 + 1);
        particles.push({ 
            x, y, vx, vy, 
            life: 1.0, 
            decay: Math.random() * 0.02 + 0.015, 
            color: colors[Math.floor(Math.random() * colors.length)], 
            size: Math.random() * 2.5 + 1, 
            type 
        });
    }
}

function loopParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    
    if (state.streak >= 10 && Math.random() < 0.3) {
        particles.push({ 
            x: Math.random() * canvas.width, 
            y: canvas.height + 10, 
            vx: (Math.random() - 0.5) * 1.5, 
            vy: -(Math.random() * 4 + 2), 
            life: 1.0, 
            decay: 0.01, 
            color: Math.random() > 0.5 ? '#fbbf24' : '#ef4444', 
            size: Math.random() * 3 + 1, 
            type: 'ember' 
        });
        active = true;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.type === 'ember') p.vx += (Math.random() - 0.5) * 0.1;
        
        if (p.life <= 0) particles.splice(i, 1);
        else {
            ctx.globalAlpha = p.life; 
            ctx.fillStyle = p.color; 
            ctx.beginPath(); 
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); 
            ctx.fill(); 
            active = true;
        }
    }
    if (active || state.streak >= 10) animationFrameId = requestAnimationFrame(loopParticles);
    else animationFrameId = null;
}

function startParticleLoop() {
    if (!animationFrameId) animationFrameId = requestAnimationFrame(loopParticles);
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    authNotification.classList.add('max-h-0', 'opacity-0');
    authNotification.classList.remove('max-h-20', 'opacity-100');
    
    if (isLoginMode) {
        authSubtitleLogin.classList.remove('-translate-y-8', 'opacity-0');
        authSubtitleRegister.classList.add('translate-y-8', 'opacity-0');
        
        emailContainer.classList.add('max-h-0', 'opacity-0');
        emailContainer.classList.remove('max-h-32', 'opacity-100');
        
        confirmPassContainer.classList.add('max-h-0', 'opacity-0');
        confirmPassContainer.classList.remove('max-h-32', 'opacity-100');
        confirmPassInput.disabled = true;
        emailInput.disabled = true;
        
        emailInput.tabIndex = -1;
        confirmPassInput.tabIndex = -1;
        
        authSubmitBtn.className = "mt-2 w-full py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 min-h-[44px] bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20";
        authBtnText.textContent = "LOG IN";
        authSwitchText.textContent = "Belum punya akun? ";
        authSwitchBtn.textContent = "Daftar Sekarang";
        authSwitchBtn.classList.replace('text-green-400', 'text-blue-400');
        authSwitchBtn.classList.replace('hover:text-blue-300', 'hover:text-blue-300');
    } else {
        authSubtitleLogin.classList.add('-translate-y-8', 'opacity-0');
        authSubtitleRegister.classList.remove('translate-y-8', 'opacity-0');
        
        emailContainer.classList.remove('max-h-0', 'opacity-0');
        emailContainer.classList.add('max-h-32', 'opacity-100');

        confirmPassContainer.classList.remove('max-h-0', 'opacity-0');
        confirmPassContainer.classList.add('max-h-32', 'opacity-100');
        confirmPassInput.disabled = false;
        emailInput.disabled = false;

        emailInput.tabIndex = 0;
        confirmPassInput.tabIndex = 0;

        authSubmitBtn.className = "mt-2 w-full py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20";
        authBtnText.textContent = "CREATE ACCOUNT";
        authSwitchText.textContent = "Sudah punya akun? ";
        authSwitchBtn.textContent = "Masuk";
        authSwitchBtn.classList.replace('text-blue-400', 'text-green-400');
        authSwitchBtn.classList.replace('hover:text-blue-300', 'hover:text-green-300');
    }
}

async function handleAuthSubmit(e) {
    if (e) e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const email = emailInput.value.trim();
    const confirmPass = confirmPassInput.value;
    
    if (!username) return showToast("Username wajib diisi", 'error');
    if (!password) return showToast("Password wajib diisi", 'error');

    if (!isLoginMode) {
        if (!isValidUsername(username)) return showToast("Username hanya boleh huruf, angka, underscore (3-20 karakter)", 'error');
        if (email && !isValidEmail(email)) return showToast("Format email tidak valid (maks 31 char)", 'error');
        if (!isValidPassword(password)) return showToast("Password minimal 6 karakter (maks 255)", 'error');
        if (password !== confirmPass) return showToast("Password tidak cocok", 'error');
    }

    authSubmitBtn.disabled = true;
    authBtnText.textContent = "Processing...";

    let res;
    if (isLoginMode) {
        res = await api.login(username, password);
    } else {
        res = await api.register(username, password, email);
    }

    authSubmitBtn.disabled = false;
    authBtnText.textContent = isLoginMode ? "LOG IN" : "CREATE ACCOUNT";

    if (res.success) {
        if (isLoginMode) {
            const userData = res.data;
            state.user = { username: userData.username, email: userData.email };
            state.score = userData.score;
            if(userData.streak) state.streak = userData.streak; 
            
            socketService.connect();
            authModal.classList.add('hidden');
            usernameInput.value = ''; passwordInput.value = '';
            
            // Trigger skeleton loader immediately
            state.currentQuestion = null; 
            initGame();
            
            renderStreakBadge(); 
            renderHeader();
            renderBackground();
            renderLeaderboard();
            fetchLeaderboardData(); 
            
            if (!document.fullscreenElement) {
                    fullscreenModal.classList.remove('hidden');
            }
        } else {
            toggleAuthMode();
            showToast(res.message, 'success');
        }
    } else {
        showToast(res.message, 'error');
    }
}

function showNotification(msg, type = 'error') {
    showToast(msg, type);
}

function openAuthModal() {
    authModal.classList.remove('hidden');
    authCloseBtn.classList.remove('hidden');
}

function showUserInfoModal() {
    if (!state.user) return;
    infoScore.textContent = formatScore(state.score);
    infoStreak.textContent = state.streak || 0;
    infoUsername.textContent = state.user.username;
    infoEmail.textContent = state.user.email || "Belum ada";
    
    userInfoModal.classList.remove('hidden');
}

function openEditModal(type) {
    currentEditMode = type;
    editModalTitle.textContent = type === 'username' ? 'Ubah Username' : 'Ubah Email';
    editLabelInput.textContent = type === 'username' ? 'USERNAME BARU' : 'EMAIL BARU';
    editMessage.classList.add('hidden');
    
    const saveBtn = document.getElementById('edit-save-btn');
    if (type === 'email') {
        saveBtn.textContent = "Kirim Link Verifikasi";
        saveBtn.classList.replace('text-sm', 'text-[10px]'); 
    } else {
        saveBtn.textContent = "Simpan";
        saveBtn.classList.replace('text-[10px]', 'text-sm');
    }

    editInputValue.value = "";
    editInputPassword.value = "";
    editModal.classList.remove('hidden');
}

async function handleEditSubmit(e) {
    e.preventDefault();
    const newVal = editInputValue.value.trim();
    const pass = editInputPassword.value;
    
    if(!newVal || !pass) {
        editMessage.textContent = "Semua field wajib diisi";
        editMessage.className = "text-rose-400 text-xs text-center mb-3 block";
        return;
    }
    
    if (currentEditMode === 'username' && !isValidUsername(newVal)) {
        editMessage.textContent = "Username tidak valid";
        editMessage.className = "text-rose-400 text-xs text-center mb-3 block";
        return;
    }
    if (currentEditMode === 'email' && !isValidEmail(newVal)) {
        editMessage.textContent = "Email tidak valid (maks 31 char)";
        editMessage.className = "text-rose-400 text-xs text-center mb-3 block";
        return;
    }
    if (!isValidPassword(pass)) {
        editMessage.textContent = "Password minimal 6 karakter";
        editMessage.className = "text-rose-400 text-xs text-center mb-3 block";
        return;
    }

    let res;
    if(currentEditMode === 'username') {
        res = await api.updateUsername(newVal, pass);
        if(res.success) {
            editModal.classList.add('hidden');
            userInfoModal.classList.add('hidden');
            showConnectionModal("Username Diubah", res.message, true);
        } else {
            editMessage.textContent = res.message;
            editMessage.className = "text-rose-400 text-xs text-left mb-3 block";
        }
    } else {
        res = await api.updateEmail(newVal, pass);
        editMessage.textContent = res.message;
        editMessage.className = res.success ? "text-emerald-400 text-xs text-left mb-3 block" : "text-rose-400 text-xs text-left mb-3 block";
        // Don't close modal on success immediately so user can read message
    }
}

function setPlaceholderState() {
        state.currentQuestion = {
        id: 'placeholder',
        vocab: 'Vocabulary',
        choices: ['Jawaban 1', 'Jawaban 2', 'Jawaban 3', 'Jawaban 4', 'Jawaban 5'],
        answer: null 
    };
    state.score = -1;
    renderQuiz();
}

function handleAnswer(choice) {
    if (state.quizUI.isValidating || state.quizUI.selectedAnswer) return;

    state.quizUI.selectedAnswer = choice;
    state.quizUI.isValidating = true;
    state.quizUI.animationFinished = false;
    state.quizUI.pendingResult = null;
    renderQuiz();

    if (state.user) {
        if (!socket || !socket.connected) {
                showToast("Koneksi terputus. Menghubungkan kembali...", 'error');
                return;
        }
        socketService.submitAnswer(choice); 
    } else {
            setTimeout(() => {
            state.quizUI.selectedAnswer = null;
            state.quizUI.isValidating = false;
            renderQuiz();
        }, 1000);
        return;
    }

    setTimeout(() => {
        state.quizUI.animationFinished = true;
        checkReveal();
    }, 1000); 
}

function checkReveal() {
    if (state.quizUI.animationFinished && state.quizUI.pendingResult) {
        const res = state.quizUI.pendingResult;
        const isCorrect = res.correct;
        
        state.quizUI.isValidating = false;
        state.quizUI.correctAnswerText = res.correctAnswer;
        
        if (res.points_added && isCorrect) {
            state.score += res.points_added;
            
            // Floating score animation
            const floater = document.createElement('div');
            floater.textContent = `+${res.points_added}`;
            floater.className = 'absolute -top-6 right-2 text-emerald-400 font-black text-lg animate-float-up-fade pointer-events-none drop-shadow-md z-50';
            document.getElementById('score-container').appendChild(floater);
            
            setTimeout(() => floater.remove(), 1000);
        }
        
        // Set streak based on result or wait for next? Backend returns it.
        // If incorrect, we delayed the reset to here to prevent spoilers.
        if (!isCorrect) {
            state.streak = 0;
            renderBackground(); 
            renderHeader(); 
            renderStreakBadge(); 
            renderLeaderboard();
        } else {
            state.streak = res.streak || state.streak;
        }

        if(isCorrect) {
            const sd = document.getElementById('score-display');
            sd.classList.add('text-amber-200');
            document.getElementById('score-container').classList.add('animate-score-pop');
            setTimeout(() => {
                sd.classList.remove('text-amber-200');
                document.getElementById('score-container').classList.remove('animate-score-pop');
            }, 400);
        }
        
        renderStreakBadge();
        renderHeader();
        renderBackground();
        renderQuiz(); 
        renderLeaderboard();

        setTimeout(() => {
            state.quizUI.isTransitioning = true;
            renderQuiz();
            
            setTimeout(() => {
                state.quizUI = { selectedAnswer: null, isValidating: false, isTransitioning: false, correctAnswerText: null, animationFinished: false, pendingResult: null };
                
                if (socket && socket.connected) {
                    socketService.getQuestion(); 
                } else {
                    socketService.getQuestion();
                }
            }, 300);
        }, 1000);
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

async function fetchLeaderboardData() {
    state.lbStatus = 'loading';
    renderLeaderboard();
    
    const res = await api.getLeaderboard();
    if (res.success && Array.isArray(res.data)) {
        state.leaderboard = res.data;
    }
    state.lbStatus = 'success';
    renderLeaderboard();

    setTimeout(() => {
        state.lbStatus = 'cooldown';
        state.lbCooldown = 5;
        renderLeaderboard();
        
        clearInterval(lbInterval);
        lbInterval = setInterval(() => {
            state.lbCooldown--;
            if (state.lbCooldown <= 0) {
                state.lbStatus = 'idle';
                clearInterval(lbInterval);
            }
            renderLeaderboard();
        }, 1000);
    }, 1000);
}

async function handleHashNavigation() {
    const hash = window.location.hash;
    if (hash.startsWith('#verify-email?token=')) {
        const token = hash.split('token=')[1];
        if (token && isValidToken(token)) {
            verifyProcessModal.classList.remove('hidden');
            
            const res = await api.verifyEmail(token);
            verifySpinner.classList.add('hidden');
            
            if (res.success) {
                verifyTitle.textContent = "Verifikasi Berhasil!";
                verifyDesc.textContent = res.message;
                verifyIcon.classList.remove('hidden');
                verifyBackBtn.classList.remove('hidden'); 
            } else {
                    verifyTitle.textContent = "Verifikasi Gagal";
                    verifyDesc.textContent = res.message;
                    verifyErrorIcon.classList.remove('hidden');
                    verifyBackBtn.classList.remove('hidden'); 
            }
        } else if (token) {
                verifyProcessModal.classList.remove('hidden');
                verifySpinner.classList.add('hidden');
                verifyTitle.textContent = "Verifikasi Gagal";
                verifyDesc.textContent = "Format token tidak valid.";
                verifyErrorIcon.classList.remove('hidden');
                verifyBackBtn.classList.remove('hidden'); 
        }
    } else if (hash.startsWith('#reset-password?token=')) {
        const token = hash.split('token=')[1];
        if (token && isValidToken(token)) {
                newPasswordModal.classList.remove('hidden');
                
                newPasswordForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const pass = npInput.value;
                    const confirm = npConfirm.value;
                    
                    if (!isValidPassword(pass)) {
                        npMessage.textContent = "Password minimal 6 karakter (maks 255)";
                        npMessage.className = "block text-left mb-3 text-rose-400 text-sm";
                        return;
                    }
                    if (pass !== confirm) {
                        npMessage.textContent = "Password tidak cocok";
                        npMessage.className = "block text-left mb-3 text-rose-400 text-sm";
                        return;
                    }
                    
                    npSubmitBtn.disabled = true;
                    npSubmitBtn.textContent = "Menyimpan...";
                    
                    const res = await api.confirmResetPassword(token, pass);
                    
                    npSubmitBtn.disabled = false;
                    npSubmitBtn.textContent = "Simpan Password Baru";
                    
                    if (res.success) {
                        npFormView.classList.add('hidden');
                        npSuccessView.classList.remove('hidden');
                        npSuccessView.classList.add('flex');
                    } else {
                        npMessage.textContent = res.message;
                        npMessage.className = "block text-left mb-3 text-rose-400 text-sm";
                    }
                };
        } else if (token) {
                newPasswordModal.classList.remove('hidden');
                npFormView.classList.add('hidden');
                const npErrorView = document.getElementById('np-error-view');
                if(npErrorView) {
                    npErrorView.classList.remove('hidden');
                    npErrorView.classList.add('flex');
                    document.getElementById('np-error-desc').textContent = "Format token tidak valid.";
                    document.getElementById('np-error-back-btn').onclick = () => {
                        newPasswordModal.classList.add('hidden');
                        window.history.replaceState(null, null, ' ');
                        startMainApp();
                    }
                }
        }
    }
}

// Navigation from Modals back to Main App
verifyBackBtn.addEventListener('click', () => {
    verifyProcessModal.classList.add('hidden');
    window.history.replaceState(null, null, ' ');
    startMainApp();
});

npBackBtn.addEventListener('click', () => {
    newPasswordModal.classList.add('hidden');
    window.history.replaceState(null, null, ' ');
    startMainApp(); 
    // openAuthModal() can be called inside startMainApp if not logged in
});

// ==========================================
// SECTION 3: RENDER UI FUNCTIONS
// ==========================================

function renderHeader() {
    const userSection = document.getElementById('navbar-user-section');
    const logo = document.getElementById('navbar-logo-container');
    
    if (state.streak >= 10) logo.classList.add('animate-logo-shake');
    else logo.classList.remove('animate-logo-shake');

    const logoText = document.getElementById('logo-text-vocab');
    if (state.streak >= 10) {
        logoText.className = "text-fire";
    } else {
        logoText.className = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400";
    }

    if (state.user) {
        const statusDot = (socket && socket.connected) 
            ? '<span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>' 
            : '<span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>';

        userSection.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="hidden md:flex flex-col items-end">
                    <div class="flex items-center gap-1.5">
                        ${statusDot}
                        <span class="text-xs font-bold text-slate-300">${state.user.username}</span>
                    </div>
                </div>
                <button id="desktop-user-info-btn" class="hidden md:block p-2 text-slate-400 hover:text-white transition-colors" title="Profil Saya">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </button>
                <button id="fullscreen-btn" class="p-2 text-slate-400 hover:text-white transition-colors" title="Toggle Fullscreen">
                    ${Icons.Fullscreen}
                </button>
                <button id="logout-confirm-btn-header" class="flex items-center gap-2 px-3 py-1.5 border border-rose-900/50 text-rose-400 bg-dark-800 rounded-xl text-xs font-bold hover:bg-rose-900/20 transition-all shadow-sm" title="Logout">
                    ${Icons.LogOut} <span class="hidden md:inline">Logout</span>
                </button>
            </div>
        `;
        document.getElementById('logout-confirm-btn-header').addEventListener('click', () => {
            document.getElementById('logout-modal').classList.remove('hidden');
        });
        document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
        document.getElementById('desktop-user-info-btn').addEventListener('click', showUserInfoModal);
    } else {
        userSection.innerHTML = `
            <button id="login-trigger-btn" class="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900 hover:bg-indigo-700 transition-all">
                ${Icons.LogIn} <span class="hidden md:inline">Login</span>
            </button>
        `;
        document.getElementById('login-trigger-btn').addEventListener('click', openAuthModal);
    }

    const navbar = document.getElementById('navbar');
    if (state.streak >= 10) navbar.style.borderColor = 'rgba(220, 38, 38, 0.5)';
    else navbar.style.borderColor = '';
}

function renderBackground() {
    const root = document.getElementById('app-root');
    const vignette = document.getElementById('fire-vignette');
    
    if (state.streak >= 10) {
        root.classList.remove('bg-normal');
        root.classList.add('bg-fire');
        vignette.classList.remove('hidden');
        startParticleLoop();
    } else {
        root.classList.add('bg-normal');
        root.classList.remove('bg-fire');
        vignette.classList.add('hidden');
    }
}

function renderStreakBadge() {
    const container = document.getElementById('streak-badge-container');
    container.innerHTML = '';
    
    if (state.streak < 2) return;

    const div = document.createElement('div');
    let badgeClass = "flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-sm transition-all duration-500 animate-pop-in border ";
    let iconHTML = "";
    let textClass = "";

    if (state.streak >= 10) {
        badgeClass += "bg-rose-900/60 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-shake-intense scale-110";
        iconHTML = `<span class="text-rose-500 animate-fire-pulse">${Icons.Fire}</span>`;
        textClass = "bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 animate-gradient-text";
    } else if (state.streak >= 5) {
        badgeClass += "bg-orange-900/40 border-orange-500 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.3)]";
        iconHTML = `<span class="text-orange-500 animate-pulse">${Icons.FireOutline}</span>`;
    } else {
        badgeClass += "bg-amber-900/30 border-amber-500/50 text-amber-200";
        iconHTML = `<span class="text-amber-500">${Icons.FireOutline}</span>`;
    }

    div.className = badgeClass;
    div.innerHTML = `${iconHTML}<span class="${textClass}">${state.streak}</span>`;
    container.appendChild(div);
}

function renderQuiz() {
    const loader = document.getElementById('quiz-loader');
    const container = document.getElementById('quiz-container');
    const card = document.getElementById('quiz-card');
    const questionText = document.getElementById('question-vocab');
    const choicesContainer = document.getElementById('choices-container');
    const scoreDisplay = document.getElementById('score-display');
    const scoreContainer = document.getElementById('score-container');

    if (!state.currentQuestion) {
        loader.classList.remove('hidden');
        container.classList.add('hidden');
        return;
    }

    loader.classList.add('hidden');
    container.classList.remove('hidden');

    // Fixed max-h-full to prevent scrolling on normal height devices
    card.className = "w-full max-w-lg bg-dark-800/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-black/30 flex flex-col max-h-full my-auto border-2 transition-all duration-500 relative border-dark-700"; 
    if (state.streak >= 10) card.classList.add('card-fire-glow-red');
    else if (state.streak >= 5) card.classList.add('card-fire-glow-orange');
    else if (state.streak >= 3) card.classList.add('border-amber-500/50', 'shadow-amber-500/20', 'shadow-lg');
    else card.classList.add('border-dark-700');

    if (state.quizUI.isTransitioning) {
        container.classList.remove('opacity-100', 'scale-100');
        container.classList.add('opacity-0', 'scale-95');
    } else {
        container.classList.add('opacity-100', 'scale-100');
        container.classList.remove('opacity-0', 'scale-95');
    }

    scoreDisplay.textContent = formatScore(state.score);
    scoreDisplay.className = "text-base font-extrabold text-amber-400 leading-none transition-colors";
    scoreContainer.className = "bg-amber-900/30 border border-amber-700/50 px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2 transition-transform duration-300";
    
    renderStreakBadge();

    questionText.textContent = state.currentQuestion.vocab;

    choicesContainer.innerHTML = '';
    const tmpl = document.getElementById('template-choice-btn');
    
    state.currentQuestion.choices.forEach(choice => {
        const clone = tmpl.content.cloneNode(true);
        const btn = clone.querySelector('button');
        const span = clone.querySelector('span');
        
        span.textContent = choice;
        
        const isSelected = state.quizUI.selectedAnswer === choice;
        const isCorrectAnswer = state.quizUI.correctAnswerText === choice;

        let btnClass = "w-full py-3.5 px-5 rounded-2xl text-sm font-bold transition-all duration-300 ease-out flex items-center justify-center min-h-[52px] text-center shadow-sm overflow-hidden relative group border-2 ";
        
        if (state.streak >= 10) btnClass += "bg-dark-900 text-slate-300 hover:bg-red-900/30 hover:border-red-500 border-dark-700 ";
        else if (state.streak >= 5) btnClass += "bg-dark-900 text-slate-300 hover:bg-orange-900/30 hover:border-orange-500 border-dark-700 ";
        else btnClass += "bg-dark-900 text-slate-300 hover:bg-dark-700 hover:text-white border-dark-700 ";

        if (state.quizUI.selectedAnswer) {
            btn.disabled = true;
            if (state.quizUI.isValidating) {
                if (isSelected) {
                    btnClass = "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center relative overflow-hidden bg-dark-900 text-white border-2 border-amber-500/50 shadow-md";
                    const fill = document.createElement('div');
                    fill.className = "absolute inset-0 bg-amber-500/20 animate-fill-bar origin-left z-0 opacity-100";
                    btn.appendChild(fill);
                } else {
                    btnClass = "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center relative overflow-hidden bg-dark-900 text-slate-500 border-2 border-transparent opacity-40 cursor-not-allowed";
                }
            } else if (state.quizUI.correctAnswerText) { // Result received
                    if (isCorrectAnswer) {
                    btnClass = "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center shadow-lg relative overflow-hidden bg-emerald-600 text-white border-2 border-emerald-500 shadow-emerald-900/50 scale-[1.02] z-10";
                } else if (isSelected) {
                    btnClass = "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center shadow-lg relative overflow-hidden bg-rose-600 text-white border-2 border-rose-500 shadow-rose-900/50";
                } else {
                    btnClass += " opacity-0 pointer-events-none transform scale-90"; 
                }
            }
        } else {
            if(state.streak >= 5 && !state.quizUI.selectedAnswer) {
                if (state.streak >= 10) btnClass += "card-fire-glow-red "; 
                else if (state.streak >= 5) btnClass += "card-fire-glow-orange "; 
            }
            btn.onclick = () => handleAnswer(choice);
        }

        btn.className = btnClass;
        choicesContainer.appendChild(btn);
    });
}

function renderLeaderboard() {
    const lbCard = document.getElementById('leaderboard-card');
    const lbHeader = document.getElementById('leaderboard-header');
    const lbBody = document.getElementById('leaderboard-body');
    const btn = document.getElementById('refresh-lb-btn');
    const myRankRow = document.getElementById('current-user-rank-row');
    
    const mobileBtn = document.getElementById('mobile-user-info-btn');
    if (mobileBtn) {
            if (state.user) {
                mobileBtn.classList.remove('hidden');
                mobileBtn.onclick = showUserInfoModal;
            } else {
                mobileBtn.classList.add('hidden');
            }
    }

    if (state.streak >= 10) {
        lbCard.className = "bg-dark-800 rounded-3xl shadow-xl shadow-red-900/30 overflow-hidden border border-red-900/50 flex flex-col relative mb-4 flex-1 min-h-0 transition-all duration-1000";
        lbHeader.className = "bg-gradient-to-r from-red-900 to-orange-900 p-4 relative flex items-center justify-center text-white shrink-0 shadow-lg z-20 border-b border-white/10 transition-all duration-1000";
    } else {
        lbCard.className = "bg-dark-800 rounded-3xl shadow-xl shadow-black/20 overflow-hidden border border-dark-700 flex flex-col relative mb-4 flex-1 min-h-0 transition-all duration-1000";
        lbHeader.className = "bg-gradient-to-r from-indigo-800 to-purple-900 p-4 relative flex items-center justify-center text-white shrink-0 shadow-lg z-20 border-b border-white/10 transition-all duration-1000";
    }

    if (state.lbStatus === 'loading') {
        btn.className = "w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold shadow-md text-sm md:text-base bg-dark-800 text-slate-400 cursor-wait border border-dark-700 shrink-0";
        btn.textContent = "Updating...";
        btn.disabled = true;
    } else if (state.lbStatus === 'success') {
        btn.className = "w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold shadow-md text-sm md:text-base bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 shadow-emerald-900/20 shrink-0";
        btn.textContent = "Updated!";
        btn.disabled = false;
    } else if (state.lbStatus === 'cooldown') {
        btn.className = "w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold shadow-md text-sm md:text-base bg-dark-900 text-slate-500 cursor-not-allowed border border-dark-800 shrink-0";
        btn.textContent = `Wait ${state.lbCooldown}s`;
        btn.disabled = true;
    } else {
        btn.className = "w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold shadow-md text-sm md:text-base bg-dark-800 border border-dark-700 text-indigo-400 hover:bg-dark-700 hover:border-indigo-500/50 hover:shadow-lg active:scale-[0.98] shrink-0";
        btn.textContent = "Refresh Leaderboard";
        btn.disabled = false;
    }

    lbBody.innerHTML = '';
    const tmpl = document.getElementById('template-lb-row');

    let displayList = [...state.leaderboard];
    if (state.user) {
        const exists = displayList.find(u => u.username === state.user.username);
        if (!exists) {
            displayList.push({ 
                username: state.user.username, 
                score: state.score,
                streak: state.streak || 0 
            });
        } else {
            exists.score = Math.max(exists.score, state.score);
            if (exists.username === state.user.username) {
                exists.streak = state.streak;
            }
        }
    }
    displayList.sort((a,b) => b.score - a.score);
    
    displayList.forEach((u, index) => {
        const rank = index + 1;
        const isMe = state.user && u.username === state.user.username;
        
        const clone = tmpl.content.cloneNode(true);
        const tr = clone.querySelector('tr');
        const rankCell = clone.querySelector('.rank-cell');
        const userCell = clone.querySelector('.username-cell');
        const streakCell = clone.querySelector('.streak-cell');
        const scoreCell = clone.querySelector('.score-cell');

        rankCell.textContent = rank;
        userCell.textContent = u.username;
        streakCell.textContent = u.streak || 0; 
        scoreCell.textContent = formatScore(u.score);

        if (isMe) {
            if (state.streak >= 10) {
                tr.classList.add('bg-red-900/20', 'hover:bg-red-900/30');
                userCell.classList.add('text-red-400', 'animate-pulse');
                userCell.classList.remove('text-slate-300');
            } else {
                tr.classList.add('bg-amber-900/20', 'hover:bg-amber-900/30');
                userCell.classList.add('text-amber-400');
                userCell.classList.remove('text-slate-300');
            }
        }

        lbBody.appendChild(tr);
    });

    const myRankData = displayList.findIndex(u => state.user && u.username === state.user.username);
    if (myRankData !== -1) {
        myRankRow.classList.remove('hidden');
        myRankRow.className = `border-t shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)] px-0 transition-colors duration-1000 ${state.streak >= 10 ? 'bg-red-900/20 border-red-900/30' : 'bg-amber-900/20 border-amber-900/30'}`;
        
        myRankRow.innerHTML = `
            <table class="w-full table-fixed">
                <tbody class="text-sm md:text-base">
                    <tr class="${state.streak >= 10 ? 'text-red-400' : 'text-amber-400'}">
                        <td class="px-2 py-3 font-bold w-[15%] text-center">#${myRankData + 1}</td>
                        <td class="px-4 py-3 font-bold w-[55%] truncate">You</td>
                        <td class="px-4 py-3 text-right font-mono font-bold w-[30%]">${formatScore(displayList[myRankData].score)}</td>
                        <td class="px-2 py-3 font-bold w-[15%] text-center text-orange-500">${state.streak || 0}</td>
                    </tr>
                </tbody>
            </table>
        `;
    } else {
        myRankRow.classList.add('hidden');
    }
}

function renderView() {
    const quizCol = document.getElementById('quiz-col');
    const lbCol = document.getElementById('leaderboard-col');
    const btnQuiz = document.getElementById('nav-btn-quiz');
    const btnRank = document.getElementById('nav-btn-rank');

    const activeClass = state.streak >= 10 ? 'bg-red-800 text-white' : 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50 scale-105';
    const inactiveClass = 'text-slate-400 hover:text-white';

    if (state.view === 'quiz') {
        btnQuiz.className = `flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-200 ${activeClass}`;
        btnRank.className = `flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-200 ${inactiveClass}`;
    } else {
        btnQuiz.className = `flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-200 ${inactiveClass}`;
        btnRank.className = `flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-200 ${activeClass}`;
    }

    if (state.view === 'quiz') {
        quizCol.classList.remove('hidden');
        lbCol.classList.add('hidden');
        lbCol.classList.add('md:flex');
    } else {
        quizCol.classList.add('hidden');
        quizCol.classList.add('md:flex');
        lbCol.classList.remove('hidden');
    }
}

// ==========================================
// SECTION 4: INITIALIZATION & EVENTS
// ==========================================

function initGame() {
    renderQuiz();

    if (socket && state.user) {
        // Prevent duplicate listeners by removing old ones first
        socketService.off("new_question");
        socketService.off("answer_result");

        // Setup Listeners
        socketService.onQuestionReceived((q) => {
            console.log("Question received:", q);
            state.currentQuestion = q;
            // Reset UI for new question
            state.quizUI.selectedAnswer = null;
            state.quizUI.isValidating = false;
            state.quizUI.isTransitioning = false;
            state.quizUI.correctAnswerText = null;
            state.quizUI.animationFinished = false;
            state.quizUI.pendingResult = null;
            
            retryBtn.classList.add('hidden'); 
            retryOverlay.classList.add('hidden');
            
            renderQuiz();
        });

        socketService.onAnswerResult((res) => {
            console.log("Result received:", res);
            state.quizUI.pendingResult = res;
            // Removed instant reset here, moved to checkReveal to avoid spoilers
            checkReveal();
        });

        // Request Question Logic
        const requestQ = () => {
            console.log("Requesting question...");
            socketService.getQuestion();
            // Timeout fallback
            setTimeout(() => {
                if (!state.currentQuestion || state.currentQuestion.id === 'placeholder') {
                    console.log("Retry requesting question...");
                    socketService.getQuestion();
                    retryBtn.classList.remove('hidden');
                    retryOverlay.classList.remove('hidden'); 
                }
            }, 3000);
        };

        if (socket.connected) {
            requestQ();
        } else {
            socket.once("connect", () => {
                console.log("Socket connected! Requesting question...");
                // Delay execution slightly to allow backend session init
                setTimeout(requestQ, 500); 
            });
        }
    }
}

// --- Event Listeners ---

window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousedown', (e) => {
    if (state.streak >= 10) { spawnParticles(e.clientX, e.clientY, 8, 'fire'); startParticleLoop(); }
});

// Enter key logic
usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (isLoginMode) {
                passwordInput.focus();
        } else {
                emailInput.focus();
        }
    }
});

emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        passwordInput.focus();
    }
});

passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (isLoginMode) {
            e.preventDefault();
            usernameInput.blur();
            passwordInput.blur();
            handleAuthSubmit(e);
        } else {
            e.preventDefault();
            confirmPassInput.focus();
        }
    }
});

confirmPassInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !isLoginMode) {
        e.preventDefault();
        usernameInput.blur();
        passwordInput.blur();
        confirmPassInput.blur();
        emailInput.blur();
        handleAuthSubmit(e);
    }
});

document.getElementById('auth-switch-btn').addEventListener('click', (e) => { e.preventDefault(); toggleAuthMode(); });

authCloseBtn.addEventListener('click', () => {
    authModal.classList.add('hidden');
    if (!state.user) {
        setPlaceholderState();
        fetchLeaderboardData(); 
    }
});

fullscreenAllowBtn.addEventListener('click', () => {
    fullscreenModal.classList.add('hidden');
    toggleFullscreen();
});

fullscreenDenyBtn.addEventListener('click', () => {
    fullscreenModal.classList.add('hidden');
});

userInfoCloseBtn.addEventListener('click', () => {
    userInfoModal.classList.add('hidden');
});

editCancelBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
});

editForm.addEventListener('submit', handleEditSubmit);

editUsernameBtn.addEventListener('click', () => openEditModal('username'));
editEmailBtn.addEventListener('click', () => openEditModal('email'));

resetPassInitBtn.addEventListener('click', () => {
    if (!state.user.email) {
        showToast("Fitur Reset Password membutuhkan email. Silakan tambahkan email pada akun Anda terlebih dahulu.", 'error');
        return;
    }
    resetEmailTarget.textContent = state.user.email;
    // Removed userInfoModal.classList.add('hidden'); so it stacks!
    resetConfirmModal.classList.remove('hidden');
});

resetCancelBtn.addEventListener('click', () => {
    resetConfirmModal.classList.add('hidden');
    // Removed userInfoModal.classList.remove('hidden'); since it was never hidden
});

document.getElementById('reset-confirm-send-btn').addEventListener('click', async () => {
    const res = await api.resetPassword();
    
    if (res.success) {
        resetConfirmModal.classList.add('hidden');
        showToast(res.message, 'success');
    } else {
        showToast(res.message, 'error');
    }
});

authForm.addEventListener('submit', handleAuthSubmit);

document.getElementById('logout-cancel-btn').addEventListener('click', () => document.getElementById('logout-modal').classList.add('hidden'));
document.getElementById('logout-confirm-btn').addEventListener('click', async () => {
    await api.logout();
    state.user = null;
    if(socket) socketService.disconnect();
    document.getElementById('logout-modal').classList.add('hidden');
    renderHeader();
    
    logoutSuccessModal.classList.remove('hidden');
    let timeLeft = 3;
    logoutTimer.textContent = timeLeft;
    
    const timer = setInterval(() => {
        timeLeft--;
        logoutTimer.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            window.location.reload();
        }
    }, 1000);

    logoutRefreshBtn.onclick = () => window.location.reload();
});

connReloadBtn.addEventListener('click', () => {
    window.location.reload();
});

document.getElementById('nav-btn-quiz').addEventListener('click', () => { state.view = 'quiz'; renderView(); });
document.getElementById('nav-btn-rank').addEventListener('click', () => { state.view = 'leaderboard'; renderView(); });
document.getElementById('refresh-lb-btn').addEventListener('click', fetchLeaderboardData);
retryBtn.addEventListener('click', () => {
    retryBtn.classList.add('hidden');
    retryOverlay.classList.add('hidden');
    socketService.getQuestion();
});

async function startMainApp() {
    emailInput.tabIndex = -1;
    confirmPassInput.tabIndex = -1;
    
    const res = await api.getMe();
    if (res.success) {
        state.user = res.data; 
        if(res.data.streak) state.streak = res.data.streak; 
        state.score = res.data.score;
        
        socketService.connect();
        state.currentQuestion = null; // Clear placeholder
        initGame();
        
        renderStreakBadge();
        renderHeader();
        renderBackground(); 
        fetchLeaderboardData();
        if (!document.fullscreenElement) {
            fullscreenModal.classList.remove('hidden');
        }
    } else {
        openAuthModal();
        setPlaceholderState(); 
        fetchLeaderboardData(); 
    }
}

// --- Main Init ---
(async function init() {
    resizeCanvas();
    renderView();
    renderHeader();

    if (window.location.hash.startsWith('#verify-email') || window.location.hash.startsWith('#reset-password')) {
        // If it's a deep link, do NOT run the main logic yet. Wait for user to click back to main.
        handleHashNavigation();
    } else {
        startMainApp();
    }
})();

