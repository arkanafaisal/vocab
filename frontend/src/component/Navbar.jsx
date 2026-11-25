import { Icons } from './Icons.jsx';
import { useIdleFade } from '../hooks/useIdleFade.js';


export function Navbar({ user, streak, isSocketConnected, view, setView, setActiveModal, toggleFullscreen, isMuted, toggleMute, volume, setVolume }) {
    const getTabClass = (tab) => `flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all duration-200 ${view === tab ? (streak >= 10 ? 'bg-red-800 text-white' : 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50 scale-105') : 'text-slate-400 hover:text-white'}`;
    const soundFade = useIdleFade(2500);
    const fullscreenFade = useIdleFade(2500);

    const renderSoundControl = () => (
        <div
          className={`hidden md:flex items-center gap-1.5 transition-opacity duration-500 ${soundFade.isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100 focus-within:opacity-100'}`}
          onPointerEnter={soundFade.triggerActive}
        >
            <button onClick={() => { soundFade.triggerActive(); toggleMute(); }} className="p-2 text-slate-400 hover:text-white transition-colors" title={isMuted ? "Nyalakan Suara" : "Matikan Suara"}>
               {isMuted || volume === 0 ? <Icons.VolumeOff /> : <Icons.VolumeOn />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => { soundFade.triggerActive(); setVolume(parseFloat(e.target.value)); }}
              aria-label="Volume"
              className="w-16 accent-indigo-500 cursor-pointer h-1.5"
            />
        </div>
    );

    return (
        <nav id="navbar" className={`bg-slate-900/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm transition-colors duration-500 ${streak >= 10 ? 'border-red-500/50' : 'border-slate-700'}`}>
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between relative">
                <div className={`font-black text-xl tracking-tight shrink-0 flex items-center gap-2 ${streak >= 10 ? 'animate-logo-shake' : ''}`}>
                    <img src="/favicon.svg" alt="Vocab Logo" className="hidden md:block w-7 h-7" />
                    <div className="flex items-center gap-1">
                        <span className={streak >= 10 ? 'text-fire' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400'}>Vocab</span>
                        <span className="hidden sm:inline text-slate-200">Master</span>
                    </div>
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
                            {renderSoundControl()}
                            <button
                              onClick={() => { fullscreenFade.triggerActive(); toggleFullscreen(); }}
                              onPointerEnter={fullscreenFade.triggerActive}
                              className={`hidden md:block p-2 text-slate-400 hover:text-white transition-all duration-500 ${fullscreenFade.isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                              title="Toggle Fullscreen"
                            >
                               <Icons.Fullscreen />
                            </button>
                            <button onClick={() => setActiveModal('logout')} className="flex items-center gap-2 px-3 py-1.5 border border-rose-900/50 text-rose-400 bg-slate-800 rounded-xl text-xs font-bold hover:bg-rose-900/20 transition-all shadow-sm" title="Logout">
                                <Icons.LogOut /> <span className="hidden md:inline">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {renderSoundControl()}
                            <button onClick={() => setActiveModal('auth')} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900 hover:bg-indigo-700 transition-all">
                                <Icons.LogIn /> <span className="hidden md:inline">Login</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}