import { useCallback, useRef, useEffect } from "react";
import { evaluateGuestAnswer } from "../utils/guestQuiz";

export function useQuizActions({ quizUI, setQuizUI, user, socketRef, question, onAnswerTimeout }) {
  const paramsRef = useRef({ quizUI, setQuizUI, user, question });

  useEffect(() => {
    paramsRef.current = { quizUI, setQuizUI, user, question };
  });

  useEffect(() => {
    if (quizUI.isValidating && !quizUI.pendingResult && user) {
      const timer = setTimeout(() => {
        if (onAnswerTimeout) onAnswerTimeout("Koneksi gagal. Beralih ke mode offline.");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [quizUI.isValidating, quizUI.pendingResult, user, onAnswerTimeout]);

  const handleAnswer = useCallback((choice) => {
    const { quizUI, setQuizUI, user, question } = paramsRef.current;

    if (quizUI.isValidating || quizUI.selectedAnswer) return;

    if (user && socketRef.current?.connected) {
      setQuizUI(prev => ({ ...prev, selectedAnswer: choice, isValidating: true, animationFinished: false, pendingResult: null }));
      socketRef.current.emit("submit_answer", { answer: choice, index: question?.index });
    } else if (!user) {
      const result = evaluateGuestAnswer(choice);
      if (!result) return;
      setQuizUI(prev => ({ ...prev, selectedAnswer: choice, isValidating: true, animationFinished: false, pendingResult: result }));
    } else {
      setQuizUI(prev => ({ ...prev, selectedAnswer: choice, isValidating: true, animationFinished: false, pendingResult: null }));
      setTimeout(() => setQuizUI(prev => ({ ...prev, selectedAnswer: null, isValidating: false })), 1000);
      return;
    }

    setTimeout(() => setQuizUI(prev => ({ ...prev, animationFinished: true })), 1000);
  }, [socketRef]);

  return { handleAnswer };
}