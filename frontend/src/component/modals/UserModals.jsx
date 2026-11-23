import { useState, useEffect } from "react";
import { Icons } from "../Icons";
import { api } from "../../services/api";
import { formatScore } from "../../utils/formatScore";
import { isValidUsername, isValidEmail, isValidPassword, isValidToken } from "../../utils/validation";

export function UserModals({ activeModal, setActiveModal, close, user, score, streak, showToast, startMainApp }) {
  const [editType, setEditType] = useState(null);
  const [editForm, setEditForm] = useState({ value: '', password: '' });
  const [editMsg, setEditMsg] = useState({ text: '', isError: false });

  const [npForm, setNpForm] = useState({ password: '', confirm: '' });
  const [npState, setNpState] = useState({ loading: false, success: false, error: null, initError: false });

  useEffect(() => {
    if (activeModal === 'newPassword') {
      const hashParams = window.location.hash.split('?')[1];
      const token = new URLSearchParams(hashParams).get('token');
      if (!token || !isValidToken(token)) {
        setNpState(prev => ({ ...prev, initError: true }));
      }
    }
  }, [activeModal]);

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

  return (
    <>
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

      {activeModal === 'resetConfirm' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md fade-in">
          <div className="w-full max-w-xs bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 animate-pop-in overflow-hidden p-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4"><Icons.Mail /></div>
            <h3 className="text-lg font-bold text-white mb-2">Reset Password?</h3>
            <p className="text-slate-400 text-sm mb-6">Kami akan mengirimkan link reset password ke email terdaftar Anda.</p>
            <div className="flex gap-3">
              <button onClick={() => setActiveModal('userInfo')} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors">Batal</button>
              <button onClick={handleResetConfirm} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-colors">Kirim Link</button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}
