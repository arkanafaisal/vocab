import { Icons } from "../Icons";

export function ToastNotification({ toast }) {
  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[400] transition-all duration-300 ease-in-out w-full max-w-sm px-4 flex justify-center pointer-events-none ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
      <div className={`px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3 backdrop-blur-md text-white ${toast.type === 'success' ? 'bg-emerald-900/90 border border-emerald-500/50' : toast.type === 'error' ? 'bg-rose-900/90 border border-rose-500/50' : 'bg-slate-800/90 border border-slate-600'}`}>
        {toast.type === 'success' ? <Icons.Check /> : <Icons.AlertCircle />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
