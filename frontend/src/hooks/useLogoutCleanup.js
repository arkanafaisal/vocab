import { useCallback } from "react";

export function useLogoutCleanup({
  setUser,
  socketRef,
  setIsSocketConnected,
  showToast,
  onGuestFallback
}) {
  return useCallback((msg = null) => {
    setUser(null);

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsSocketConnected(false);
    if (onGuestFallback) onGuestFallback();

    if (msg) showToast(msg, 'error');
  }, [
    setUser,
    socketRef,
    setIsSocketConnected,
    showToast,
    onGuestFallback
  ]);
}