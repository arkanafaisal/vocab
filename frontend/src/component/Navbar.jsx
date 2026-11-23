import { Icons } from './Icons.jsx';


export function Navbar({ user, streak, isSocketConnected, view, setView, setActiveModal, toggleFullscreen }) {
    const getTabClass = (tab) => `flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all duration-200 ${view === tab ? (streak >= 10 ? 'bg-red-800 text-white' : 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50 scale-105') : 'text-slate-400 hover:text-white'}`;

    return (
        <nav id="navbar" className={`bg-slate-900/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm transition-colors duration-500 ${streak >= 10 ? 'border-red-500/50' : 'border-slate-700'}`}>
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between relative">
                <div className={`font-black text-xl tracking-tight shrink-0 flex items-center gap-1 ${streak >= 10 ? 'animate-logo-shake' : ''}`}>
                    <span className={streak >= 10 ? 'text-fire' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400'}>Vocab</span>
                    <span className="hidden sm:inline text-slate-200">Master</span>
                </div>
                
                <div className="flex bg-slate-800 border border-slate-700 p-1 rounded-xl mx-2 shrink-0 md:hidden">
                    <button onClick={() => setView('quiz')} className={getTabClass('quiz')}>
                        <Icons.Play />
                        <span className="hidden sm:inline">Play</span>
                    </button>
                    <button onClick={() => setView('leaderboard')} className={getTabClass('leaderboard')}>
                        <Icons.Trophy />
                        <span className="hidden sm:inline">Rank</span>
                    </button>
                </div>

                <div className="flex items-center justify-end shrink-0 min-w-[40px]">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex flex-col items-end">
                                <div className="flex items-center gap-1.5">
                                    {isSocketConnected 
                                        ? <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                        : <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                                    <span className="text-xs font-bold text-slate-300">{user.username}</span>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal('userInfo')} className="hidden md:block p-2 text-slate-400 hover:text-white transition-colors" title="Profil Saya">
                               <Icons.User />
                            </button>
                            <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-white transition-colors" title="Toggle Fullscreen">
                               <Icons.Fullscreen />
                            </button>
                            <button onClick={() => setActiveModal('logout')} className="flex items-center gap-2 px-3 py-1.5 border border-rose-900/50 text-rose-400 bg-slate-800 rounded-xl text-xs font-bold hover:bg-rose-900/20 transition-all shadow-sm" title="Logout">
                                <Icons.LogOut /> <span className="hidden md:inline">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setActiveModal('auth')} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900 hover:bg-indigo-700 transition-all">
                            <Icons.LogIn /> <span className="hidden md:inline">Login</span>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}