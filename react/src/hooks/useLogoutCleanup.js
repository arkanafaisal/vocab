import { useCallback } from "react";

export function useLogoutCleanup({
  setUser,
  socketRef,
  setIsSocketConnected,
  setActiveModal,
  showToast
}) {
  return useCallback((msg = null) => {
    setUser(null);

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsSocketConnected(false);
    setActiveModal('auth');

    if (msg) showToast(msg, 'error');
  }, [
    setUser,
    socketRef,
    setIsSocketConnected,
    setActiveModal,
    showToast
  ]);
}