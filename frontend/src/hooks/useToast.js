import { useCallback, useRef } from "react";


export function useToast(setToast) {
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = "info") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    setToast({ visible: true, message, type });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, [setToast]);

  return showToast;
}