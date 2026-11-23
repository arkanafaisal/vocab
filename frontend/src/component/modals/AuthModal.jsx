import { useState } from "react";
import { Icons } from "../Icons";
import { api } from "../../services/api";
import { isValidUsername, isValidEmail, isValidPassword } from "../../utils/validation";

export function AuthModal({ isOpen, close, user, startMainApp, showToast }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', password: '', email: '', confirmPass: '' });
  const [authProcessing, setAuthProcessing] = useState(false);

  if (!isOpen) return null;

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

  return (
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
  );
}
