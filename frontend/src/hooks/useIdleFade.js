import { useCallback, useEffect, useRef, useState } from "react";

export function useIdleFade(delay = 2500) {
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  const triggerActive = useCallback(() => {
    setIsActive(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsActive(false), delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { isActive, triggerActive };
}

