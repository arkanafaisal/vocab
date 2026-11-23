import { Icons } from "../Icons";

export function AlertModals({ activeModal, close, handleLogout, handleTakeover, logoutTimer, toggleFullscreen, verifyState, startMainApp }) {
  return (
    <>
      {activeModal === 'logout' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md fade-in">
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

      {activeModal === 'accountConflict' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md fade-in">
          <div className="w-full max-w-xs bg-slate-800 rounded-2xl shadow-2xl border border-amber-900/50 animate-pop-in overflow-hidden p-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4"><Icons.Unplug /></div>
            <h3 className="text-lg font-bold text-white mb-2">Akun Sedang Digunakan</h3>
            <p className="text-slate-400 text-sm mb-6">Akun kamu sedang aktif di perangkat atau tab lain.</p>
            <div className="flex gap-3">
              <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors">Keluar</button>
              <button onClick={handleTakeover} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-colors">Pakai di Sini</button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}
