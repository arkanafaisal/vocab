import { useCallback, useRef, useEffect } from "react";

export function useQuizActions({ quizUI, setQuizUI, user, socketRef, question }) {
  const paramsRef = useRef({ quizUI, setQuizUI, user, question });

  useEffect(() => {
    paramsRef.current = { quizUI, setQuizUI, user, question };
  });

  const handleAnswer = useCallback((choice) => {
    const { quizUI, setQuizUI, user, question } = paramsRef.current;

    if (quizUI.isValidating || quizUI.selectedAnswer) return;
    
    setQuizUI(prev => ({ ...prev, selectedAnswer: choice, isValidating: true, animationFinished: false, pendingResult: null }));

    if (user && socketRef.current?.connected) {
      socketRef.current.emit("submit_answer", { answer: choice, index: question?.index });
    } else {
      setTimeout(() => setQuizUI(prev => ({ ...prev, selectedAnswer: null, isValidating: false })), 1000);
      return;
    }
    
    setTimeout(() => setQuizUI(prev => ({ ...prev, animationFinished: true })), 1000);
  }, [socketRef]);

  return { handleAnswer };
}