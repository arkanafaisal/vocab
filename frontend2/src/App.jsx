import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// ==========================================
// API SERVICE
// ==========================================
const API_BASE_URL = "/api";

async function fetchData(endpoint, method = 'GET', body = null, isRetry = false) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        let response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (response.status === 429) return { success: false, message: "limit tercapai, coba lagi nanti" };
        if (response.status === 500) return { success: false, message: "server error, harap hubungi admin" };

        let responseData = await response.json();

        if (response.status === 401 && !isRetry) {
            if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
                return responseData; 
            }
            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST' });
            if (refreshRes.ok) {
                return await fetchData(endpoint, method, body, true);
            } else {
                return { success: false, message: responseData.message || "Session expired", forceLogout: true };
            }
        }

        if (response.status === 403) return responseData;

        return responseData;
    } catch (err) {
        console.error(`API Error (${endpoint}):`, err);
        return { success: false, message: "Network Error" };
    }
}

const api = {
    login: (credential, password) => fetchData('/auth/login', 'POST', { [credential.includes('@') ? 'email' : 'username']: credential, password }),
    register: (username, password, email) => fetchData('/auth/register', 'POST', { username, password, ...(email ? { email } : {}) }),
    logout: () => fetchData('/auth/logout', 'DELETE'),
    getLeaderboard: () => fetchData('/users/', 'GET'),
    getMe: () => fetchData('/users/me', 'GET'),
    updateUsername: (newUsername, password) => fetchData('/users/update-username', 'PATCH', { newUsername, password }),
    updateEmail: (newEmail, password) => fetchData('/users/update-email', 'PATCH', { newEmail, password }),
    resetPassword: () => fetchData('/users/reset-password', 'PATCH'),
    verifyEmail: (token) => fetchData(`/users/verify-email?token=${token}`, 'GET'),
    confirmResetPassword: (token, newPassword) => fetchData(`/users/verify-reset-password?token=${token}`, 'PATCH', { password: newPassword })
};

// ==========================================
// VALIDATION HELPERS
// ==========================================
const isValidUsername = (u) => /^[a-zA-Z0-9_]{3,20}$/.test(u);
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 31;
const isValidPassword = (p) => p.length >= 6 && p.length <= 255;
const isValidToken = (t) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(t);
const formatScore = (num) => num >= 1000 ? (num/1000).toFixed(1)+'K' : num.toLocaleString();

// ==========================================
// GLOBAL STYLES (Animations & Custom Classes)
// ==========================================
  

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
    const [user, setUser] = useState(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [view, setView] = useState('quiz'); // 'quiz' | 'leaderboard'
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    
    // Quiz State
    const [question, setQuestion] = useState(null);
    const [quizUI, setQuizUI] = useState({
        selectedAnswer: null,
        isValidating: false,
        isTransitioning: false,
        correctAnswerText: null,
        animationFinished: false,
        pendingResult: null,
        showRetry: false,
        popScore: false
    });
    const [floatingScores, setFloatingScores] = useState([]);

    // Leaderboard State
    const [leaderboard, setLeaderboard] = useState([]);
    const [lbStatus, setLbStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'cooldown'
    const [lbCooldown, setLbCooldown] = useState(0);

    // Modals & UI State
    const [activeModal, setActiveModal] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const toastTimeoutRef = useRef(null);
    
    const socketRef = useRef(null);
    const retryCountRef = useRef(0);

    const showToast = useCallback((message, type = 'info') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ visible: true, message, type });
        toastTimeoutRef.current = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    }, []);

    // --- Socket Management ---
    const connectSocket = useCallback(() => {
        if (socketRef.current) return;
        try {
            const socket = io("/", { withCredentials: true, transports: ['websocket'] });
            socketRef.current = socket;

            socket.on("connect", () => setIsSocketConnected(true));
            socket.on("disconnect", () => {
                setIsSocketConnected(false);
                setQuizUI(prev => prev.isValidating ? { ...prev, isValidating: false, selectedAnswer: null, animationFinished: false, pendingResult: null } : prev);
            });
            socket.on("warn", async (data) => {
                const code = data.code;
                const msg = data.message || "Terjadi peringatan dari server.";
                switch (code) {
                    case 1001: // RATE_LOCKED
                        setActiveModal('connection');
                        socket.disconnect();
                        break;
                    case 1002: // TEMP_FAILURE
                        showToast(msg, 'error');
                        break;
                    case 1003: // UNAUTHORIZED, QUIZ_OUT_OF_SYNC, SESSION_EXPIRED
                        showToast(msg, 'error');
                        retryCountRef.current += 1;
                        if (retryCountRef.current > 3) window.location.reload();
                        else setTimeout(() => { if (socket.disconnected) socket.connect(); }, 1000);
                        break;
                    case 1004: // USER_NOT_FOUND, SERVER_ERROR
                        setActiveModal('connection');
                        socket.disconnect();
                        break;
                    case 1005: // ACCOUNT_CONFLICT
                        showToast(msg, 'error');
                        await api.logout();
                        handleLogoutCleanup();
                        break;
                    default:
                        showToast(msg, 'error');
                }
            });
            socket.on("connect_error", async (err) => {
                const res = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST' });
                if (res.ok) socket.connect();
                else handleLogoutCleanup("Gagal terhubung ke game server. Silakan login ulang.");
            });

            socket.on("new_question", (q) => {
                setQuestion(q);
                setQuizUI({ selectedAnswer: null, isValidating: false, isTransitioning: false, correctAnswerText: null, animationFinished: false, pendingResult: null, showRetry: false, popScore: false });
            });

            socket.on("answer_result", (res) => {
                setQuizUI(prev => ({ ...prev, pendingResult: res }));
            });

        } catch (e) { console.error("Socket init failed"); }
    }, [showToast]);

    const handleLogoutCleanup = useCallback((msg = null) => {
        setUser(null);
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsSocketConnected(false);
        setActiveModal('auth');
        if (msg) showToast(msg, 'error');
    }, [showToast]);

    const requestQuestion = useCallback(() => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit("request_question");
        }
        setTimeout(() => {
            setQuizUI(prev => {
                if (prev.isValidating) return prev;
                return { ...prev, showRetry: true };
            });
        }, 3000);
    }, []);

    // --- Quiz Logic Engine ---
    useEffect(() => {
        if (quizUI.animationFinished && quizUI.pendingResult) {
            const res = quizUI.pendingResult;
            const isCorrect = res.correct;

            setQuizUI(prev => ({ ...prev, isValidating: false, correctAnswerText: res.correctAnswer }));

            if (res.points_added && isCorrect) {
                setScore(s => s + res.points_added);
                const id = Date.now();
                setFloatingScores(prev => [...prev, { id, pts: res.points_added }]);
                setTimeout(() => setFloatingScores(prev => prev.filter(fs => fs.id !== id)), 1000);
            }

            if (!isCorrect) setStreak(0);
            else if (res.streak !== undefined) setStreak(res.streak);

            if (isCorrect) {
                setQuizUI(prev => ({ ...prev, popScore: true }));
                setTimeout(() => setQuizUI(prev => ({ ...prev, popScore: false })), 400);
            }

            setTimeout(() => {
                setQuizUI(prev => ({ ...prev, isTransitioning: true }));
                setTimeout(() => {
                    setQuizUI({ selectedAnswer: null, isValidating: false, isTransitioning: false, correctAnswerText: null, animationFinished: false, pendingResult: null, showRetry: false, popScore: false });
                    requestQuestion();
                }, 300);
            }, 1000);
        }
    }, [quizUI.animationFinished, quizUI.pendingResult, requestQuestion]);

    const handleAnswer = (choice) => {
        if (quizUI.isValidating || quizUI.selectedAnswer) return;
        setQuizUI(prev => ({ ...prev, selectedAnswer: choice, isValidating: true, animationFinished: false, pendingResult: null }));

        if (user && socketRef.current?.connected) {
            socketRef.current.emit("submit_answer", choice);
        } else {
            setTimeout(() => setQuizUI(prev => ({ ...prev, selectedAnswer: null, isValidating: false })), 1000);
            return;
        }
        setTimeout(() => setQuizUI(prev => ({ ...prev, animationFinished: true })), 1000);
    };

    // --- Leaderboard Logic ---
    const fetchLeaderboardData = useCallback(async () => {
        setLbStatus('loading');
        const res = await api.getLeaderboard();
        if (res.success && Array.isArray(res.data)) setLeaderboard(res.data);
        setLbStatus('success');
        setTimeout(() => {
            setLbCooldown(5);
            setLbStatus('cooldown');
        }, 1000);
    }, []);

    useEffect(() => {
        if (lbStatus === 'cooldown' && lbCooldown > 0) {
            const timer = setTimeout(() => setLbCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else if (lbStatus === 'cooldown' && lbCooldown === 0) {
            setLbStatus('idle');
        }
    }, [lbStatus, lbCooldown]);

    // --- Initialization & Deep Linking ---
    const startMainApp = useCallback(async () => {
        const res = await api.getMe();
        if (res.success) {
            if (res.forceLogout) {
                handleLogoutCleanup();
                setQuestion({ id: 'placeholder', vocab: 'Vocabulary', choices: ['Jawaban 1', 'Jawaban 2', 'Jawaban 3', 'Jawaban 4', 'Jawaban 5'] });
                fetchLeaderboardData();
                return;
            }
            setUser(res.data);
            if (res.data.streak !== undefined) setStreak(res.data.streak);
            if (res.data.score !== undefined) setScore(res.data.score);
            
            connectSocket();
            setQuestion(null);
            setTimeout(() => requestQuestion(), 500);
            
            fetchLeaderboardData();
            if (!document.fullscreenElement) setActiveModal('fullscreen');
        } else {
            setActiveModal('auth');
            setQuestion({ id: 'placeholder', vocab: 'Vocabulary', choices: ['Jawaban 1', 'Jawaban 2', 'Jawaban 3', 'Jawaban 4', 'Jawaban 5'] });
            fetchLeaderboardData();
        }
    }, [connectSocket, fetchLeaderboardData, handleLogoutCleanup, requestQuestion]);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash.startsWith('#verify-email?token=')) {
            setActiveModal('verifyProcess');
        } else if (hash.startsWith('#reset-password?token=')) {
            setActiveModal('newPassword');
        } else {
            startMainApp();
        }
    }, [startMainApp]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    return (
        <div id="app-root" className={`flex flex-col h-dvh overflow-hidden relative app-background ${streak >= 10 ? 'bg-fire' : 'bg-normal'} bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white select-none font-sans`}>

            <ParticleCanvas streak={streak} />
            <div id="fire-vignette" className={`fire-vignette ${streak >= 10 ? '' : 'hidden'}`}></div>

            <Modals 
                activeModal={activeModal} 
                setActiveModal={setActiveModal} 
                toast={toast} 
                showToast={showToast}
                user={user} setUser={setUser}
                score={score} streak={streak}
                startMainApp={startMainApp}
                socketRef={socketRef}
                toggleFullscreen={toggleFullscreen}
            />

            <Navbar 
                user={user} streak={streak} isSocketConnected={isSocketConnected} 
                view={view} setView={setView} 
                setActiveModal={setActiveModal} toggleFullscreen={toggleFullscreen} 
            />

            <main className="flex-1 overflow-hidden relative flex flex-col md:flex-row p-4 gap-4 max-w-6xl mx-auto w-full">
                <QuizSection 
                    view={view} streak={streak} score={score} 
                    question={question} quizUI={quizUI} 
                    floatingScores={floatingScores}
                    handleAnswer={handleAnswer} requestQuestion={requestQuestion}
                />
                <LeaderboardSection 
                    view={view} streak={streak} score={score} user={user}
                    leaderboard={leaderboard} lbStatus={lbStatus} lbCooldown={lbCooldown}
                    fetchLeaderboardData={fetchLeaderboardData}
                    setActiveModal={setActiveModal}
                />
            </main>
        </div>
    );
}

// ==========================================
// BACKGROUND CANVAS COMPONENT
// ==========================================
function ParticleCanvas({ streak }) {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const streakRef = useRef(streak);

    useEffect(() => { streakRef.current = streak; }, [streak]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize);
        resize();

        const spawnParticles = (x, y, count, type = 'spark') => {
            let colors = type === 'fire' ? ['#ef4444', '#f87171', '#fbbf24', '#f59e0b'] : ['#f59e0b', '#fbbf24'];
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const vx = type === 'ember' ? (Math.random() - 0.5) * 2 : Math.cos(angle) * (Math.random() * 3 + 1);
                const vy = type === 'ember' ? -(Math.random() * 2 + 1) : Math.sin(angle) * (Math.random() * 3 + 1);
                particlesRef.current.push({
                    x, y, vx, vy, life: 1.0, decay: Math.random() * 0.02 + 0.015,
                    color: colors[Math.floor(Math.random() * colors.length)], size: Math.random() * 2.5 + 1, type
                });
            }
        };

        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;

            if (streakRef.current >= 10 && Math.random() < 0.3) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width, y: canvas.height + 10,
                    vx: (Math.random() - 0.5) * 1.5, vy: -(Math.random() * 4 + 2),
                    life: 1.0, decay: 0.01, color: Math.random() > 0.5 ? '#fbbf24' : '#ef4444', size: Math.random() * 3 + 1, type: 'ember'
                });
                active = true;
            }

            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                let p = particlesRef.current[i];
                p.x += p.vx; p.y += p.vy; p.life -= p.decay;
                if (p.type === 'ember') p.vx += (Math.random() - 0.5) * 0.1;

                if (p.life <= 0) particlesRef.current.splice(i, 1);
                else {
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    active = true;
                }
            }
            if (active || streakRef.current >= 10) animationFrameId = requestAnimationFrame(loop);
            else animationFrameId = null;
        };

        const startLoop = () => { if (!animationFrameId) animationFrameId = requestAnimationFrame(loop); };
        
        const handleMouseDown = (e) => {
            if (streakRef.current >= 10) { spawnParticles(e.clientX, e.clientY, 8, 'fire'); startLoop(); }
        };
        window.addEventListener('mousedown', handleMouseDown);

        if (streakRef.current >= 10) startLoop();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousedown', handleMouseDown);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} id="particle-canvas" className="fixed inset-0 pointer-events-none z-[100]"></canvas>;
}

// ==========================================
// NAVBAR COMPONENT
// ==========================================
function Navbar({ user, streak, isSocketConnected, view, setView, setActiveModal, toggleFullscreen }) {
    return (
        <nav id="navbar" className={`bg-slate-900/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm transition-colors duration-500 ${streak >= 10 ? 'border-red-500/50' : 'border-slate-700'}`}>
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between relative">
                <div className={`font-black text-xl tracking-tight shrink-0 flex items-center gap-1 ${streak >= 10 ? 'animate-logo-shake' : ''}`}>
                    <span className={streak >= 10 ? 'text-fire' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400'}>Vocab</span>
                    <span className="hidden sm:inline text-slate-200">Master</span>
                </div>
                
                <div className="flex bg-slate-800 border border-slate-700 p-1 rounded-xl mx-2 shrink-0 md:hidden">
                    <button onClick={() => setView('quiz')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all duration-200 ${view === 'quiz' ? (streak >= 10 ? 'bg-red-800 text-white' : 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50 scale-105') : 'text-slate-400 hover:text-white'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> 
                        <span className="hidden sm:inline">Play</span>
                    </button>
                    <button onClick={() => setView('leaderboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all duration-200 ${view === 'leaderboard' ? (streak >= 10 ? 'bg-red-800 text-white' : 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50 scale-105') : 'text-slate-400 hover:text-white'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> 
                        <span className="hidden sm:inline">Rank</span>
                    </button>
                </div>

                <div className="flex items-center justify-end shrink-0 min-w-[40px]">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex flex-col items-end">
                                <div className="flex items-center gap-1.5">
                                    {isSocketConnected 
                                        ? <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                        : <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                                    <span className="text-xs font-bold text-slate-300">{user.username}</span>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal('userInfo')} className="hidden md:block p-2 text-slate-400 hover:text-white transition-colors" title="Profil Saya">
                               <Icons.User />
                            </button>
                            <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-white transition-colors" title="Toggle Fullscreen">
                               <Icons.Fullscreen />
                            </button>
                            <button onClick={() => setActiveModal('logout')} className="flex items-center gap-2 px-3 py-1.5 border border-rose-900/50 text-rose-400 bg-slate-800 rounded-xl text-xs font-bold hover:bg-rose-900/20 transition-all shadow-sm" title="Logout">
                                <Icons.LogOut /> <span className="hidden md:inline">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setActiveModal('auth')} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900 hover:bg-indigo-700 transition-all">
                            <Icons.LogIn /> <span className="hidden md:inline">Login</span>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}

// ==========================================
// QUIZ SECTION COMPONENT
// ==========================================
function QuizSection({ view, streak, score, question, quizUI, floatingScores, handleAnswer, requestQuestion }) {
    const isHidden = view !== 'quiz' ? 'hidden md:flex' : 'flex';

    const renderStreakBadge = () => {
        if (streak < 2) return null;
        let badgeClass = "flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-sm transition-all duration-500 animate-pop-in border ";
        let iconHTML = null;
        let textClass = "";

        if (streak >= 10) {
            badgeClass += "bg-rose-900/60 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-shake-intense scale-110";
            iconHTML = <span className="text-rose-500 animate-fire-pulse"><Icons.Fire /></span>;
            textClass = "bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 animate-gradient-text";
        } else if (streak >= 5) {
            badgeClass += "bg-orange-900/40 border-orange-500 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.3)]";
            iconHTML = <span className="text-orange-500 animate-pulse"><Icons.FireOutline /></span>;
        } else {
            badgeClass += "bg-amber-900/30 border-amber-500/50 text-amber-200";
            iconHTML = <span className="text-amber-500"><Icons.FireOutline /></span>;
        }

        return (
            <div className={badgeClass}>
                {iconHTML} <span className={textClass}>{streak}</span>
            </div>
        );
    };

    if (!question) {
        return (
            <div className={`flex-1 h-full flex-col ${isHidden}`}>
                <div className="w-full h-full flex items-center justify-center p-4 fade-in">
                    <div className="w-full max-w-lg bg-slate-800/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-black/30 flex flex-col max-h-full my-auto border-2 border-slate-700 relative">
                        <div className="bg-slate-900/50 border-b border-slate-700 px-4 py-4 flex items-center justify-between shrink-0 relative z-10 animate-pulse rounded-t-[22px]">
                             <div className="h-8 w-16 bg-slate-700 rounded-full"></div>
                             <div className="h-8 w-20 bg-slate-700 rounded-full"></div>
                        </div>
                        <div className="shrink overflow-y-auto custom-scrollbar flex flex-col justify-center px-6 py-6 gap-6 animate-pulse min-h-0 rounded-b-[22px]">
                            <div className="flex flex-col items-center gap-3 w-full">
                                <div className="h-4 w-32 bg-slate-700 rounded-full"></div> 
                                <div className="h-10 w-3/4 bg-slate-700 rounded-lg"></div> 
                            </div>
                            <div className="flex flex-col gap-3 w-full">
                                {[1,2,3,4,5].map(i => <div key={i} className="h-[52px] w-full bg-slate-800 border-2 border-slate-700 rounded-2xl"></div>)}
                            </div>
                        </div>
                        {quizUI.showRetry && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-3xl">
                                 <button onClick={requestQuestion} className="px-6 py-3 bg-slate-700 border border-slate-600 text-slate-200 rounded-xl font-bold hover:bg-slate-600 hover:text-white transition-all shadow-xl flex items-center gap-2 pointer-events-auto">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                                    Gagal memuat, Coba Lagi
                                 </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    let cardClass = "w-full max-w-lg bg-slate-800/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-black/30 flex flex-col max-h-full my-auto border-2 transition-all duration-500 relative ";
    if (streak >= 10) cardClass += "card-fire-glow-red border-slate-700";
    else if (streak >= 5) cardClass += "card-fire-glow-orange border-slate-700";
    else if (streak >= 3) cardClass += "border-amber-500/50 shadow-amber-500/20 shadow-lg";
    else cardClass += "border-slate-700";

    return (
        <div className={`flex-1 h-full flex-col ${isHidden}`}>
            <div className={`w-full h-full flex items-center justify-center p-4 fade-in transition-all duration-500 ease-out ${quizUI.isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <div className={cardClass}>
                    <div className="bg-slate-900/50 border-b border-slate-700 px-4 py-4 flex items-center justify-between shrink-0 relative z-10 rounded-t-[22px]">
                        <div className="flex-1 flex justify-start">{renderStreakBadge()}</div>
                        <div className="relative">
                            <div className={`bg-amber-900/30 border border-amber-700/50 px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2 transition-transform duration-300 ${quizUI.popScore ? 'animate-score-pop' : ''}`}>
                                <span className="text-[10px] font-bold text-amber-500 uppercase leading-none mt-[1px]">Score</span>
                                <span className={`text-base font-extrabold leading-none transition-colors ${quizUI.popScore ? 'text-amber-200' : 'text-amber-400'}`}>{formatScore(score)}</span>
                            </div>
                            {floatingScores.map(fs => (
                                <div key={fs.id} className="absolute -top-6 right-2 text-emerald-400 font-black text-lg animate-float-up-fade pointer-events-none drop-shadow-md z-50">
                                    +{fs.pts}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="shrink overflow-y-auto custom-scrollbar flex flex-col justify-center relative z-10 min-h-0 rounded-b-[22px]">
                        <div className="px-6 py-6 text-center">
                            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">Apa arti kata:</h2>
                            <h1 className="text-3xl md:text-4xl font-black text-white break-words leading-tight drop-shadow-md tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 to-white">{question.vocab}</h1>
                        </div>
                        <div className="px-6 pb-3">
                            <div className="flex flex-col gap-3">
                                {question.choices.map((choice, i) => {
                                    const isSelected = quizUI.selectedAnswer === choice;
                                    const isCorrectAnswer = quizUI.correctAnswerText === choice;

                                    let btnClass = "w-full py-3.5 px-5 rounded-2xl text-sm font-bold transition-all duration-300 ease-out flex items-center justify-center min-h-[52px] text-center shadow-sm overflow-hidden relative group border-2 ";
                                    
                                    if (quizUI.selectedAnswer) {
                                        if (quizUI.isValidating) {
                                            if (isSelected) {
                                                btnClass = "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center relative overflow-hidden bg-slate-900 text-white border-2 border-amber-500/50 shadow-md";
                                            } else {
                                                btnClass = "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center relative overflow-hidden bg-slate-900 text-slate-500 border-2 border-transparent opacity-40 cursor-not-allowed";
                                            }
                                        } else if (quizUI.correctAnswerText) {
                                            if (isCorrectAnswer) {
                                                btnClass = "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center shadow-lg relative overflow-hidden bg-emerald-600 text-white border-2 border-emerald-500 shadow-emerald-900/50 scale-[1.02] z-10";
                                            } else if (isSelected) {
                                                btnClass = "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center shadow-lg relative overflow-hidden bg-rose-600 text-white border-2 border-rose-500 shadow-rose-900/50";
                                            } else {
                                                btnClass += " bg-slate-900 opacity-0 pointer-events-none transform scale-90 border-slate-700"; 
                                            }
                                        }
                                    } else {
                                        if (streak >= 10) btnClass += "bg-slate-900 text-slate-300 hover:bg-red-900/30 hover:border-red-500 border-slate-700 ";
                                        else if (streak >= 5) btnClass += "bg-slate-900 text-slate-300 hover:bg-orange-900/30 hover:border-orange-500 border-slate-700 card-fire-glow-orange ";
                                        else btnClass += "bg-slate-900 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700 ";
                                    }

                                    return (
                                        <button key={i} disabled={!!quizUI.selectedAnswer} onClick={() => handleAnswer(choice)} className={btnClass}>
                                            <span className="relative z-10 break-words w-full">{choice}</span>
                                            {quizUI.isValidating && isSelected && <div className="absolute inset-0 bg-amber-500/20 animate-fill-bar origin-left z-0 opacity-100"></div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// LEADERBOARD SECTION COMPONENT
// ==========================================
function LeaderboardSection({ view, streak, score, user, leaderboard, lbStatus, lbCooldown, fetchLeaderboardData, setActiveModal }) {
    const isHidden = view !== 'leaderboard' ? 'hidden md:flex' : 'flex';

    let displayList = [...leaderboard];
    if (user) {
        const exists = displayList.find(u => u.username === user.username);
        if (!exists) {
            displayList.push({ username: user.username, score: score, streak: streak || 0 });
        } else {
            exists.score = Math.max(exists.score, score);
            if (exists.username === user.username) exists.streak = streak;
        }
    }
    displayList.sort((a,b) => b.score - a.score);
    const myRankData = displayList.findIndex(u => user && u.username === user.username);

    let btnClass = "w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold shadow-md text-sm md:text-base shrink-0 ";
    let btnText = "Refresh Leaderboard";
    if (lbStatus === 'loading') { btnClass += "bg-slate-800 text-slate-400 cursor-wait border border-slate-700"; btnText = "Updating..."; }
    else if (lbStatus === 'success') { btnClass += "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 shadow-emerald-900/20"; btnText = "Updated!"; }
    else if (lbStatus === 'cooldown') { btnClass += "bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800"; btnText = `Wait ${lbCooldown}s`; }
    else { btnClass += "bg-slate-800 border border-slate-700 text-indigo-400 hover:bg-slate-700 hover:border-indigo-500/50 hover:shadow-lg active:scale-[0.98]"; }

    return (
        <div className={`w-full md:w-[350px] lg:w-[400px] h-full flex-col ${isHidden}`}>
            <div className="w-full max-w-2xl mx-auto p-4 flex flex-col h-full fade-in pb-10">
                <div className="md:hidden mb-3">
                    {user && (
                        <button onClick={() => setActiveModal('userInfo')} className="w-full py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-sm">
                            <Icons.User /> Informasi User
                        </button>
                    )}
                </div>

                <div className={`bg-slate-800 rounded-3xl overflow-hidden flex flex-col relative mb-4 flex-1 min-h-0 transition-all duration-1000 ${streak >= 10 ? 'shadow-xl shadow-red-900/30 border border-red-900/50' : 'shadow-xl shadow-black/20 border border-slate-700'}`}>
                    <div className={`p-4 relative flex items-center justify-center text-white shrink-0 shadow-lg z-20 border-b border-white/10 transition-all duration-1000 ${streak >= 10 ? 'bg-gradient-to-r from-red-900 to-orange-900' : 'bg-gradient-to-r from-indigo-800 to-purple-900'}`}>
                        <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 tracking-wide drop-shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> 
                            LEADERBOARD
                        </h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-slate-800 relative">
                        <table className="w-full border-collapse table-fixed">
                            <thead className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider bg-slate-900/95 backdrop-blur sticky top-0 z-10 shadow-sm border-b border-slate-700">
                                <tr>
                                    <th className="px-2 py-3 text-center w-[15%]">#</th>
                                    <th className="px-4 py-3 text-left w-[55%]">Player</th>
                                    <th className="px-4 py-3 text-right w-[30%]">Pts</th>
                                    <th className="px-2 py-3 text-center w-[15%]">🔥</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm md:text-base">
                                {displayList.map((u, i) => {
                                    const isMe = user && u.username === user.username;
                                    let trClass = "border-b border-slate-700 last:border-0 hover:bg-slate-700 transition-colors ";
                                    let userClass = "truncate w-full text-slate-300";
                                    
                                    if (isMe) {
                                        if (streak >= 10) { trClass += "bg-red-900/20 hover:bg-red-900/30"; userClass = "truncate w-full text-red-400 animate-pulse"; }
                                        else { trClass += "bg-amber-900/20 hover:bg-amber-900/30"; userClass = "truncate w-full text-amber-400"; }
                                    }

                                    return (
                                        <tr key={u.username} className={trClass}>
                                            <td className="px-2 py-3.5 font-bold w-[15%] text-center text-slate-500">{i + 1}</td>
                                            <td className="px-4 py-3.5 font-semibold w-[55%]"><div className={userClass}>{u.username}</div></td>
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-400 w-[30%]">{formatScore(u.score)}</td>
                                            <td className="px-2 py-3.5 font-bold w-[15%] text-center text-orange-500">{u.streak || 0}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    {myRankData !== -1 && (
                        <div className={`border-t shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)] px-0 transition-colors duration-1000 ${streak >= 10 ? 'bg-red-900/20 border-red-900/30' : 'bg-amber-900/20 border-amber-900/30'}`}>
                            <table className="w-full table-fixed">
                                <tbody className="text-sm md:text-base">
                                    <tr className={streak >= 10 ? 'text-red-400' : 'text-amber-400'}>
                                        <td className="px-2 py-3 font-bold w-[15%] text-center">#{myRankData + 1}</td>
                                        <td className="px-4 py-3 font-bold w-[55%] truncate">You</td>
                                        <td className="px-4 py-3 text-right font-mono font-bold w-[30%]">{formatScore(displayList[myRankData].score)}</td>
                                        <td className="px-2 py-3 font-bold w-[15%] text-center text-orange-500">{streak || 0}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <button disabled={lbStatus === 'loading' || lbStatus === 'cooldown'} onClick={fetchLeaderboardData} className={btnClass}>
                    {btnText}
                </button>
            </div>
        </div>
    );
}


// ==========================================
// MODALS COMPONENT
// ==========================================
function Modals({ activeModal, setActiveModal, toast, showToast, user, setUser, score, streak, startMainApp, socketRef, toggleFullscreen }) {
    
    // Auth Modal State
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [authForm, setAuthForm] = useState({ username: '', password: '', email: '', confirmPass: '' });
    const [authProcessing, setAuthProcessing] = useState(false);
    
    // Edit Modal State
    const [editType, setEditType] = useState(null); // 'username' | 'email'
    const [editForm, setEditForm] = useState({ value: '', password: '' });
    const [editMsg, setEditMsg] = useState({ text: '', isError: false });

    // New Password Modal State
    const [npForm, setNpForm] = useState({ password: '', confirm: '' });
    const [npState, setNpState] = useState({ loading: false, success: false, error: null, initError: false });

    // Verify Email State
    const [verifyState, setVerifyState] = useState({ loading: true, success: false, message: '' });

    // Logout Success State
    const [logoutTimer, setLogoutTimer] = useState(3);

    const close = () => setActiveModal(null);

    // Deep linking processors
    useEffect(() => {
        if (activeModal === 'verifyProcess') {
            const token = window.location.hash.split('token=')[1];
            if (token && isValidToken(token)) {
                api.verifyEmail(token).then(res => setVerifyState({ loading: false, success: res.success, message: res.message || (res.success ? "Verifikasi Berhasil!" : "Verifikasi Gagal") }));
            } else {
                setVerifyState({ loading: false, success: false, message: "Format token tidak valid." });
            }
        } else if (activeModal === 'newPassword') {
            const token = window.location.hash.split('token=')[1];
            if (!token || !isValidToken(token)) {
                setNpState(prev => ({ ...prev, initError: true }));
            }
        } else if (activeModal === 'logoutSuccess') {
            setLogoutTimer(3);
            const timer = setInterval(() => {
                setLogoutTimer(t => {
                    if (t <= 1) { clearInterval(timer); window.location.reload(); }
                    return t - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [activeModal]);

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        const { username, password, email, confirmPass } = authForm;
        
        if (!username) return showToast("Username wajib diisi", 'error');
        if (!password) return showToast("Password wajib diisi", 'error');

        if (!isLoginMode) {
            if (!isValidUsername(username)) return showToast("Username hanya boleh huruf, angka, underscore (3-20 karakter)", 'error');
            if (email && !isValidEmail(email)) return showToast("Format email tidak valid (maks 31 char)", 'error');
            if (!isValidPassword(password)) return showToast("Password minimal 6 karakter (maks 255)", 'error');
            if (password !== confirmPass) return showToast("Password tidak cocok", 'error');
        }

        setAuthProcessing(true);
        const res = isLoginMode ? await api.login(username, password) : await api.register(username, password, email);
        setAuthProcessing(false);

        if (res.success) {
            if (isLoginMode) {
                close();
                setAuthForm({ username: '', password: '', email: '', confirmPass: '' });
                startMainApp();
            } else {
                setIsLoginMode(true);
                showToast(res.message, 'success');
            }
        } else {
            showToast(res.message, 'error');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const { value, password } = editForm;
        if(!value || !password) return setEditMsg({ text: "Semua field wajib diisi", isError: true });
        if (editType === 'username' && !isValidUsername(value)) return setEditMsg({ text: "Username tidak valid", isError: true });
        if (editType === 'email' && !isValidEmail(value)) return setEditMsg({ text: "Email tidak valid", isError: true });
        if (!isValidPassword(password)) return setEditMsg({ text: "Password minimal 6 karakter", isError: true });

        const res = editType === 'username' ? await api.updateUsername(value, password) : await api.updateEmail(value, password);
        if (res.success) {
            if (editType === 'username') { close(); showToast("Username Diubah: " + res.message, 'success'); } 
            else { setEditMsg({ text: res.message, isError: false }); }
        } else {
            setEditMsg({ text: res.message, isError: true });
        }
    };

    const handleResetConfirm = async () => {
        const res = await api.resetPassword();
        if (res.success) { close(); showToast(res.message, 'success'); } 
        else { showToast(res.message, 'error'); }
    };

    const handleNewPasswordSubmit = async (e) => {
        e.preventDefault();
        const { password, confirm } = npForm;
        if (!isValidPassword(password)) return setNpState(p => ({ ...p, error: "Password minimal 6 karakter (maks 255)" }));
        if (password !== confirm) return setNpState(p => ({ ...p, error: "Password tidak cocok" }));
        
        setNpState(p => ({ ...p, loading: true }));
        const token = window.location.hash.split('token=')[1];
        const res = await api.confirmResetPassword(token, password);
        setNpState(p => ({ ...p, loading: false }));
        
        if (res.success) setNpState(p => ({ ...p, success: true }));
        else setNpState(p => ({ ...p, error: res.message }));
    };

    const handleLogout = async () => {
        await api.logout();
        setUser(null);
        if(socketRef.current) socketRef.current.disconnect();
        setActiveModal('logoutSuccess');
    };

    return (
        <div id="modal-container" className="z-[300] relative">
            {/* Global Toast */}
            <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[400] transition-all duration-300 ease-in-out w-full max-w-sm px-4 flex justify-center pointer-events-none ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
                <div className={`px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3 backdrop-blur-md text-white ${toast.type === 'success' ? 'bg-emerald-900/90 border border-emerald-500/50' : toast.type === 'error' ? 'bg-rose-900/90 border border-rose-500/50' : 'bg-slate-800/90 border border-slate-600'}`}>
                    {toast.type === 'success' ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>}
                    <span>{toast.message}</span>
                </div>
            </div>

            {/* Auth Modal */}
            {activeModal === 'auth' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md fade-in">
                    <div className="w-full max-w-sm bg-slate-800 rounded-3xl shadow-2xl shadow-black/50 border border-slate-700 animate-pop-in relative overflow-hidden flex flex-col">
                        {!user && <button onClick={() => { close(); if(!user) startMainApp(); }} className="absolute top-3 right-3 z-20 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-all"><Icons.Close /></button>}
                        <div className="bg-gradient-to-br from-indigo-700 to-purple-800 px-6 py-6 text-center relative overflow-hidden shrink-0">
                            <h1 className="text-2xl font-extrabold text-white mb-1 relative z-10 tracking-tight">Vocab Master</h1>
                            <div className="relative h-5 w-full overflow-hidden">
                                <p className={`text-indigo-100 text-sm absolute w-full transition-all duration-500 transform ${isLoginMode ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}>Welcome back!</p>
                                <p className={`text-indigo-100 text-sm absolute w-full transition-all duration-500 transform ${!isLoginMode ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>Join us now!</p>
                            </div>
                        </div>
                        <div className="p-5 bg-slate-800">
                            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">USERNAME / EMAIL</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Icons.User /></div>
                                        <input type="text" maxLength="255" required className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all invalid:border-rose-500" placeholder="user / email" value={authForm.username} onChange={e => setAuthForm(p => ({...p, username: e.target.value}))}/>
                                    </div>
                                </div>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isLoginMode ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'}`}>
                                    <div className="pt-1">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">EMAIL (OPSIONAL)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Icons.Mail /></div>
                                            <input type="email" maxLength="31" tabIndex={isLoginMode ? -1 : 0} disabled={isLoginMode} className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all" placeholder="contoh@email.com" value={authForm.email} onChange={e => setAuthForm(p => ({...p, email: e.target.value}))}/>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">PASSWORD</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Icons.Lock /></div>
                                        <input type="password" maxLength="255" required className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(p => ({...p, password: e.target.value}))}/>
                                    </div>
                                </div>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isLoginMode ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'}`}>
                                    <div className="pt-1">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">CONFIRM PASSWORD</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Icons.Lock /></div>
                                            <input type="password" maxLength="255" tabIndex={isLoginMode ? -1 : 0} disabled={isLoginMode} className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all" placeholder="••••••••" value={authForm.confirmPass} onChange={e => setAuthForm(p => ({...p, confirmPass: e.target.value}))}/>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" disabled={authProcessing} className={`mt-2 w-full py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 min-h-[44px] text-white shadow-lg ${isLoginMode ? 'bg-green-600 hover:bg-green-700 shadow-green-900/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'}`}>
                                    <span>{authProcessing ? "Processing..." : (isLoginMode ? "LOG IN" : "CREATE ACCOUNT")}</span>
                                </button>
                            </form>
                            <div className="mt-4 text-center">
                                <p className="text-xs text-slate-400 font-medium">
                                    <span>{isLoginMode ? "Belum punya akun? " : "Sudah punya akun? "}</span>
                                    <button onClick={(e) => { e.preventDefault(); setIsLoginMode(!isLoginMode); }} className={`font-bold underline decoration-current/30 underline-offset-2 transition-colors ${isLoginMode ? 'text-blue-400 hover:text-blue-300' : 'text-green-400 hover:text-green-300'}`}>
                                        {isLoginMode ? "Daftar Sekarang" : "Masuk"}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Info Modal */}
            {activeModal === 'userInfo' && user && (
                <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md fade-in">
                    <div className="w-full max-w-sm bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 animate-pop-in relative overflow-hidden flex flex-col">
                        <button onClick={close} className="absolute top-3 right-3 z-20 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-all"><Icons.Close /></button>
                        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 px-6 py-6 text-center relative overflow-hidden shrink-0">
                            <h2 className="text-xl font-bold text-white mb-1 relative z-10">Profil Saya</h2>
                        </div>
                        <div className="p-6 bg-slate-800 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-700 text-center">
                                    <span className="block text-xs text-slate-400 font-bold uppercase mb-1">Score</span>
                                    <span className="block text-xl font-black text-amber-400">{formatScore(score)}</span>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-700 text-center">
                                    <span className="block text-xs text-slate-400 font-bold uppercase mb-1">Streak</span>
                                    <span className="block text-xl font-black text-orange-500">{streak || 0}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase">Username</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-200 text-sm font-medium">{user.username}</div>
                                        <button onClick={() => { setEditType('username'); setEditForm({value: '', password: ''}); setEditMsg({text:'', isError:false}); setActiveModal('edit'); }} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-indigo-400 transition-colors"><Icons.Edit /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase">Email</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-200 text-sm font-medium truncate">{user.email || "Belum ada"}</div>
                                        <button onClick={() => { setEditType('email'); setEditForm({value: '', password: ''}); setEditMsg({text:'', isError:false}); setActiveModal('edit'); }} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-indigo-400 transition-colors"><Icons.Edit /></button>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => { if(!user.email) showToast("Fitur Reset Password membutuhkan email. Silakan tambahkan email terlebih dahulu.", 'error'); else setActiveModal('resetConfirm'); }} className="w-full py-3 rounded-xl border border-indigo-500/30 bg-indigo-900/10 text-indigo-300 font-bold text-sm hover:bg-indigo-900/30 transition-colors mt-2">
                                Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {activeModal === 'edit' && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md fade-in">
                    <div className="w-full max-w-xs bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 animate-pop-in overflow-hidden flex flex-col">
                        <div className="p-5 bg-slate-800">
                            <h3 className="text-lg font-bold text-white mb-2">{editType === 'username' ? 'Ubah Username' : 'Ubah Email'}</h3>
                            {editMsg.text && <span className={`block text-left mb-3 text-xs ${editMsg.isError ? 'text-rose-400' : 'text-emerald-400'}`}>{editMsg.text}</span>}
                            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">{editType === 'username' ? 'USERNAME BARU' : 'EMAIL BARU'}</label>
                                    <input type="text" maxLength="255" className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none" value={editForm.value} onChange={e => setEditForm(p => ({...p, value: e.target.value}))}/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">PASSWORD</label>
                                    <input type="password" maxLength="255" className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none" value={editForm.password} onChange={e => setEditForm(p => ({...p, password: e.target.value}))}/>
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <button type="button" onClick={() => setActiveModal('userInfo')} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors">Batal</button>
                                    <button type="submit" className={`flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold transition-colors ${editType === 'email' ? 'text-[10px]' : 'text-sm'}`}>{editType === 'email' ? 'Kirim Link Verifikasi' : 'Simpan'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Confirm Modal */}
            {activeModal === 'resetConfirm' && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md fade-in">
                    <div className="w-full max-w-xs bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 animate-pop-in overflow-hidden p-6 text-center">
                        <div className="mx-auto w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4"><Icons.Mail /></div>
                        <h3 className="text-lg font-bold text-white mb-2">Reset Password?</h3>
                        <p className="text-slate-400 text-sm mb-6">Link reset password akan dikirim ke email: <br/><span className="text-indigo-400 font-bold">{user?.email}</span></p>
                        <div className="flex gap-3">
                            <button onClick={() => setActiveModal('userInfo')} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors">Batal</button>
                            <button onClick={handleResetConfirm} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-colors">Kirim Link</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirm Modal */}
            {activeModal === 'logout' && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md fade-in">
                    <div className="w-full max-w-xs bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 animate-pop-in overflow-hidden p-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4"><Icons.LogOut /></div>
                        <h3 className="text-lg font-bold text-white mb-2">Konfirmasi Logout</h3>
                        <p className="text-slate-400 text-sm mb-6">Apakah Anda yakin ingin keluar dari akun?</p>
                        <div className="flex gap-3">
                            <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors">Batal</button>
                            <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 shadow-lg shadow-rose-900/20 transition-colors">Keluar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Connection Modal */}
            {activeModal === 'connection' && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md fade-in">
                    <div className="w-full max-w-xs bg-slate-800 rounded-2xl shadow-2xl border border-rose-900/50 animate-pop-in overflow-hidden p-6 text-center">
                        <div className="mx-auto w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 animate-pulse"><Icons.Unplug /></div>
                        <h3 className="text-lg font-bold text-white mb-2">Koneksi Terputus</h3>
                        <p className="text-slate-400 text-sm mb-6">Terjadi kesalahan pada koneksi server.</p>
                        <button onClick={() => window.location.reload()} className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 shadow-lg shadow-rose-900/20 transition-colors">Muat Ulang</button>
                    </div>
                </div>
            )}

            {/* Logout Success Modal */}
            {activeModal === 'logoutSuccess' && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md fade-in">
                    <div className="w-full max-w-xs bg-slate-800 rounded-2xl shadow-2xl border border-emerald-900/50 animate-pop-in overflow-hidden p-6 text-center">
                        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4"><Icons.Check /></div>
                        <h3 className="text-lg font-bold text-white mb-2">Berhasil Keluar</h3>
                        <p className="text-slate-400 text-sm mb-6">Halaman akan dimuat ulang dalam <span className="font-bold text-emerald-400">{logoutTimer}</span> detik.</p>
                        <button onClick={() => window.location.reload()} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-colors">Muat Ulang Sekarang</button>
                    </div>
                </div>
            )}

            {/* Fullscreen Modal */}
            {activeModal === 'fullscreen' && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md fade-in">
                    <div className="w-full max-w-xs bg-slate-800 rounded-2xl shadow-2xl border border-indigo-900/50 animate-pop-in overflow-hidden p-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4"><Icons.Fullscreen /></div>
                        <h3 className="text-lg font-bold text-white mb-2">Mode Layar Penuh?</h3>
                        <p className="text-slate-400 text-sm mb-6">Untuk pengalaman bermain yang lebih imersif, kami sarankan menggunakan mode layar penuh.</p>
                        <div className="flex gap-3">
                            <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors">Nanti</button>
                            <button onClick={() => { close(); toggleFullscreen(); }} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-colors">Ya, Aktifkan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Verify Email Process Modal */}
            {activeModal === 'verifyProcess' && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-lg">
                    <div className="w-full max-w-xs bg-slate-800 rounded-2xl shadow-2xl border border-indigo-500/50 p-8 text-center flex flex-col items-center">
                        {verifyState.loading ? (
                            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${verifyState.success ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                {verifyState.success ? <Icons.Check /> : <Icons.Close />}
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-white mb-2">{verifyState.loading ? 'Memverifikasi...' : (verifyState.success ? 'Verifikasi Berhasil!' : 'Verifikasi Gagal')}</h3>
                        <p className="text-slate-400 text-sm">{verifyState.loading ? 'Mohon tunggu sebentar.' : verifyState.message}</p>
                        
                        {!verifyState.loading && (
                            <button onClick={() => { window.history.replaceState(null, null, ' '); close(); startMainApp(); }} className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors">Kembali ke Halaman Utama</button>
                        )}
                    </div>
                </div>
            )}

            {/* New Password Modal */}
            {activeModal === 'newPassword' && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-lg">
                    <div className="w-full max-w-sm bg-slate-800 rounded-3xl shadow-2xl border border-indigo-500/50 p-6 flex flex-col relative">
                        {npState.success ? (
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4"><Icons.Check /></div>
                                <h3 className="text-xl font-bold text-white mb-2">Password Diubah!</h3>
                                <p className="text-slate-400 text-sm mb-6">Password Anda berhasil diperbarui. Silakan login kembali.</p>
                                <button onClick={() => { window.history.replaceState(null, null, ' '); close(); startMainApp(); }} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors">Kembali ke Halaman Utama</button>
                            </div>
                        ) : npState.initError ? (
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4"><Icons.Close /></div>
                                <h3 className="text-xl font-bold text-white mb-2">Akses Ditolak</h3>
                                <p className="text-slate-400 text-sm mb-6">Token tidak valid atau telah kedaluwarsa.</p>
                                <button onClick={() => { window.history.replaceState(null, null, ' '); close(); startMainApp(); }} className="w-full py-2.5 rounded-xl bg-slate-700 text-white font-bold text-sm hover:bg-slate-600 transition-colors">Kembali ke Halaman Utama</button>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1 text-center">Atur Password Baru</h3>
                                <p className="text-slate-400 text-sm mb-4 text-center">Silakan masukkan password baru untuk akun Anda.</p>
                                {npState.error && <span className="block text-left mb-3 text-rose-400 text-sm">{npState.error}</span>}
                                <form onSubmit={handleNewPasswordSubmit} className="flex flex-col gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">PASSWORD BARU</label>
                                        <input type="password" maxLength="255" required className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none" value={npForm.password} onChange={e => setNpForm(p => ({...p, password: e.target.value}))}/>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">KONFIRMASI PASSWORD</label>
                                        <input type="password" maxLength="255" required className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none" value={npForm.confirm} onChange={e => setNpForm(p => ({...p, confirm: e.target.value}))}/>
                                    </div>
                                    <button type="submit" disabled={npState.loading} className="mt-2 w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-colors">
                                        {npState.loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// ICONS COMPONENT MAP
// ==========================================
const Icons = {
    User: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    LogOut: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
    LogIn: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>,
    Fire: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a5.5 5.5 0 1 1-11 0c0-.396.06-.776.17-1.132a5.5 5.5 0 0 0 .33 1.632z"/></svg>,
    FireOutline: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a5.5 5.5 0 1 1-11 0c0-.396.06-.776.17-1.132a5.5 5.5 0 0 0 .33 1.632z"/></svg>,
    Fullscreen: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
    Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Mail: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
    Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>,
    Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    Unplug: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
};