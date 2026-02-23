import { useEffect, useState } from "react";
import { Icons } from "./Icons";
import { api } from "../services/api";
import { formatScore } from "../utils/formatScore";

import { isValidUsername, isValidEmail, isValidPassword, isValidToken } from '../utils/validation'


export function Modals({ activeModal, setActiveModal, toast, showToast, user, setUser, score, streak, startMainApp, socketRef, toggleFullscreen }) {

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
        // Safely parse regardless of URL structure
        const hashParams = window.location.hash.split('?')[1];
        const token = new URLSearchParams(hashParams).get('token');
      if (token && isValidToken(token)) {
        api.verifyEmail(token).then(res => setVerifyState({ loading: false, success: res.success, message: res.message || (res.success ? "Verifikasi Berhasil!" : "Verifikasi Gagal") }));
      } else {
        setVerifyState({ loading: false, success: false, message: "Format token tidak valid." });
      }
    } else if (activeModal === 'newPassword') {
        const hashParams = window.location.hash.split('?')[1];
        const token = new URLSearchParams(hashParams).get('token');
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
    if (!value || !password) return setEditMsg({ text: "Semua field wajib diisi", isError: true });
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
    if (socketRef.current) socketRef.current.disconnect();
    setActiveModal('logoutSuccess');
  };

  return (
    <div id="modal-container" className="z-[300] relative">
      {/* Global Toast */}
      <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[400] transition-all duration-300 ease-in-out w-full max-w-sm px-4 flex justify-center pointer-events-none ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <div className={`px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3 backdrop-blur-md text-white ${toast.type === 'success' ? 'bg-emerald-900/90 border border-emerald-500/50' : toast.type === 'error' ? 'bg-rose-900/90 border border-rose-500/50' : 'bg-slate-800/90 border border-slate-600'}`}>
          {toast.type === 'success' ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>}
          <span>{toast.message}</span>
        </div>
      </div>

      {/* Auth Modal */}
      {activeModal === 'auth' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md fade-in">
          <div className="w-full max-w-sm bg-slate-800 rounded-3xl shadow-2xl shadow-black/50 border border-slate-700 animate-pop-in relative overflow-hidden flex flex-col">
            {!user && <button onClick={() => { close(); if (!user) startMainApp(); }} className="absolute top-3 right-3 z-20 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-all"><Icons.Close /></button>}
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
                    <input autoComplete="username" enterKeyHint="next" type="text" maxLength="255" required className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all invalid:border-rose-500" placeholder="user / email" value={authForm.username} onChange={e => setAuthForm(p => ({ ...p, username: e.target.value }))} />
                  </div>
                </div>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isLoginMode ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'}`}>
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">EMAIL (OPSIONAL)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Icons.Mail /></div>
                      <input enterKeyHint="next" type="email" maxLength="31" tabIndex={isLoginMode ? -1 : 0} disabled={isLoginMode} className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all" placeholder="contoh@email.com" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">PASSWORD</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Icons.Lock /></div>
                    <input autoComplete={isLoginMode? "current-password" : "new-password"} enterKeyHint={isLoginMode? 'done' : 'next'} type="password" maxLength="255" required className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                </div>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isLoginMode ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'}`}>
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">CONFIRM PASSWORD</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Icons.Lock /></div>
                      <input autoComplete="new-password" enterKeyHint="done" type="password" maxLength="255" tabIndex={isLoginMode ? -1 : 0} disabled={isLoginMode} className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all" placeholder="••••••••" value={authForm.confirmPass} onChange={e => setAuthForm(p => ({ ...p, confirmPass: e.target.value }))} />
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
                    <button onClick={() => { setEditType('username'); setEditForm({ value: '', password: '' }); setEditMsg({ text: '', isError: false }); setActiveModal('edit'); }} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-indigo-400 transition-colors"><Icons.Edit /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase">Email</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-200 text-sm font-medium truncate">{user.email || "Belum ada"}</div>
                    <button onClick={() => { setEditType('email'); setEditForm({ value: '', password: '' }); setEditMsg({ text: '', isError: false }); setActiveModal('edit'); }} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-indigo-400 transition-colors"><Icons.Edit /></button>
                  </div>
                </div>
              </div>
              <button onClick={() => { if (!user.email) showToast("Fitur Reset Password membutuhkan email. Silakan tambahkan email terlebih dahulu.", 'error'); else setActiveModal('resetConfirm'); }} className="w-full py-3 rounded-xl border border-indigo-500/30 bg-indigo-900/10 text-indigo-300 font-bold text-sm hover:bg-indigo-900/30 transition-colors mt-2">
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
                  <input enterKeyHint="next" type="text" maxLength="255" className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none" value={editForm.value} onChange={e => setEditForm(p => ({ ...p, value: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">PASSWORD</label>
                  <input autoComplete="current-password" enterKeyHint="next" type="password" maxLength="255" className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} />
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
            <p className="text-slate-400 text-sm mb-6">Link reset password akan dikirim ke email: <br /><span className="text-indigo-400 font-bold">{user?.email}</span></p>
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
                    <input autoComplete="new-password" type="password" maxLength="255" required className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none" value={npForm.password} onChange={e => setNpForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">KONFIRMASI PASSWORD</label>
                    <input autoComplete="new-password" type="password" maxLength="255" required className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none" value={npForm.confirm} onChange={e => setNpForm(p => ({ ...p, confirm: e.target.value }))} />
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
