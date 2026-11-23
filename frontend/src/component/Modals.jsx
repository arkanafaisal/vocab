import { useEffect, useState } from "react";
import { api } from "../services/api";
import { isValidToken } from "../utils/validation";

import { ToastNotification } from "./modals/ToastNotification";
import { AuthModal } from "./modals/AuthModal";
import { UserModals } from "./modals/UserModals";
import { AlertModals } from "./modals/AlertModals";

export function Modals({ activeModal, setActiveModal, toast, showToast, user, setUser, score, streak, startMainApp, socketRef, toggleFullscreen, requestQuestion }) {
  const [logoutTimer, setLogoutTimer] = useState(3);
  const [verifyState, setVerifyState] = useState({ loading: true, success: false, message: '' });

  const close = () => setActiveModal(null);

  useEffect(() => {
    if (activeModal === 'verifyProcess') {
      const hashParams = window.location.hash.split('?')[1];
      const token = new URLSearchParams(hashParams).get('token');
      if (token && isValidToken(token)) {
        api.verifyEmail(token).then(res => setVerifyState({ loading: false, success: res.success, message: res.message || (res.success ? "Verifikasi Berhasil!" : "Verifikasi Gagal") }));
      } else {
        setVerifyState({ loading: false, success: false, message: "Format token tidak valid." });
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

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    if (socketRef.current) socketRef.current.disconnect();
    setActiveModal('logoutSuccess');
  };

  const handleTakeover = () => {
    close();
    if (socketRef.current) {
      if (socketRef.current.disconnected) {
        socketRef.current.connect();
      }
      setTimeout(() => {
        if (requestQuestion) requestQuestion();
      }, 300);
    } else {
      startMainApp();
    }
  };

  return (
    <div id="modal-container" className="z-[300] relative">
      <ToastNotification toast={toast} />
      <AuthModal
        isOpen={activeModal === 'auth'}
        close={close}
        user={user}
        startMainApp={startMainApp}
        showToast={showToast}
      />
      <UserModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        close={close}
        user={user}
        score={score}
        streak={streak}
        showToast={showToast}
        startMainApp={startMainApp}
      />
      <AlertModals
        activeModal={activeModal}
        close={close}
        handleLogout={handleLogout}
        handleTakeover={handleTakeover}
        logoutTimer={logoutTimer}
        toggleFullscreen={toggleFullscreen}
        verifyState={verifyState}
        startMainApp={startMainApp}
      />
    </div>
  );
}
