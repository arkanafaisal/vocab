import { useState, useEffect, useRef, useCallback } from 'react';

import { useSocket } from './hooks/useSocket';
import { useQuizActions } from './hooks/useQuizActions.js';
import { useLeaderboard } from './hooks/useLeaderboard.js';
import { useToast } from './hooks/useToast';
import { useLogoutCleanup } from './hooks/useLogoutCleanup';

import { Navbar } from './component/Navbar';
import { QuizSection } from './component/QuizSection';
import { LeaderboardSection } from './component/LeaderboardSection';
import { Modals } from './component/Modals.jsx';
import { ParticleCanvas } from './component/ParticleCanvas';

import { api } from './services/api.js';
import { toggleFullscreen } from './utils/toggleFullscreen';






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

  // Modals & UI State
  const [activeModal, setActiveModal] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const socketRef = useRef(null);
  const retryCountRef = useRef(0);

  const showToast = useToast(setToast)
  const API_BASE_URL = "/api";

  const handleLogoutCleanup = useLogoutCleanup({
    setUser,
    socketRef,
    setIsSocketConnected,
    setActiveModal,
    showToast
  });
  // --- Socket Management ---
  const { connectSocket, requestQuestion } = useSocket(socketRef, {
    setIsSocketConnected,
    setQuizUI,
    setQuestion,
    setActiveModal,
    showToast,
    retryCountRef,
    api,
    handleLogoutCleanup,
    API_BASE_URL
  });


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

  const { handleAnswer } = useQuizActions({quizUI, setQuizUI, user, socketRef})

  // --- Leaderboard Logic ---
  const { leaderboard, lbStatus, lbCooldown, fetchLeaderboardData } = useLeaderboard()

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

