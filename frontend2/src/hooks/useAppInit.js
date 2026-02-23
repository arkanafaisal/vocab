import { useCallback, useRef, useEffect } from "react";

export function useAppInit(params) {
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  });

  const startMainApp = useCallback(async () => {
    const { 
      api, handleLogoutCleanup, setQuestion, fetchLeaderboardData, 
      setUser, setStreak, setScore, connectSocket, requestQuestion, setActiveModal 
    } = paramsRef.current;

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
  }, []);

  return { startMainApp };
}