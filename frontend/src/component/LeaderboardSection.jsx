
import { formatScore } from "../utils/formatScore";
import { Icons } from "./Icons";


export function LeaderboardSection({ view, streak, score, user, leaderboard, lbStatus, lbCooldown, fetchLeaderboardData, setActiveModal }) {
  const isHidden = view !== 'leaderboard' ? 'hidden md:flex' : 'flex';

  let displayList = [...leaderboard];
  if (user) {
    const exists = displayList.find(u => u.username === user.username);
    if (!exists) {
      displayList.push({ username: user.username, score: score, streak: streak || 0 });
    } else {
      exists.score = Math.max(exists.score, score);
      if (exists.username === user.username) exists.streak = streak;
    }
  }
  displayList.sort((a, b) => b.score - a.score);
  const myRankData = displayList.findIndex(u => user && u.username === user.username);

  let btnClass = "w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold shadow-md text-sm md:text-base shrink-0 ";
  let btnText = "Refresh Leaderboard";
  if (lbStatus === 'loading') { btnClass += "bg-slate-800 text-slate-400 cursor-wait border border-slate-700"; btnText = "Updating..."; }
  else if (lbStatus === 'success') { btnClass += "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 shadow-emerald-900/20"; btnText = "Updated!"; }
  else if (lbStatus === 'cooldown') { btnClass += "bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800"; btnText = `Wait ${lbCooldown}s`; }
  else { btnClass += "bg-slate-800 border border-slate-700 text-indigo-400 hover:bg-slate-700 hover:border-indigo-500/50 hover:shadow-lg active:scale-[0.98]"; }

  return (
    <div className={`w-full md:w-[350px] lg:w-[400px] h-full flex-col ${isHidden}`}>
      <div className="w-full max-w-2xl mx-auto p-4 flex flex-col h-full fade-in pb-10">
        <div className="md:hidden mb-3">
          {user && (
            <button onClick={() => setActiveModal('userInfo')} className="w-full py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-sm">
              <Icons.User /> Informasi User
            </button>
          )}
        </div>

        <div className={`bg-slate-800 rounded-3xl overflow-hidden flex flex-col relative mb-4 flex-1 min-h-0 transition-all duration-1000 ${streak >= 10 ? 'shadow-xl shadow-red-900/30 border border-red-900/50' : 'shadow-xl shadow-black/20 border border-slate-700'}`}>
          <div className={`p-4 relative flex items-center justify-center text-white shrink-0 shadow-lg z-20 border-b border-white/10 transition-all duration-1000 ${streak >= 10 ? 'bg-gradient-to-r from-red-900 to-orange-900' : 'bg-gradient-to-r from-indigo-800 to-purple-900'}`}>
            <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 tracking-wide drop-shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
              LEADERBOARD
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-slate-800 relative">
            <table className="w-full border-collapse table-fixed">
              <thead className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider bg-slate-900/95 backdrop-blur sticky top-0 z-10 shadow-sm border-b border-slate-700">
                <tr>
                  <th className="px-2 py-3 text-center w-[15%]">#</th>
                  <th className="px-4 py-3 text-left w-[55%]">Player</th>
                  <th className="px-4 py-3 text-right w-[30%]">Pts</th>
                  <th className="px-2 py-3 text-center w-[15%]">🔥</th>
                </tr>
              </thead>
              <tbody className="text-sm md:text-base">
                {displayList.map((u, i) => {
                  const isMe = user && u.username === user.username;
                  let trClass = "border-b border-slate-700 last:border-0 hover:bg-slate-700 transition-colors ";
                  let userClass = "truncate w-full text-slate-300";

                  if (isMe) {
                    if (streak >= 10) { trClass += "bg-red-900/20 hover:bg-red-900/30"; userClass = "truncate w-full text-red-400 animate-pulse"; }
                    else { trClass += "bg-amber-900/20 hover:bg-amber-900/30"; userClass = "truncate w-full text-amber-400"; }
                  }

                  return (
                    <tr key={u.username} className={trClass}>
                      <td className="px-2 py-3.5 font-bold w-[15%] text-center text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3.5 font-semibold w-[55%]"><div className={userClass}>{u.username}</div></td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-400 w-[30%]">{formatScore(u.score)}</td>
                      <td className="px-2 py-3.5 font-bold w-[15%] text-center text-orange-500">{u.streak || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {myRankData !== -1 && (
            <div className={`border-t shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)] px-0 transition-colors duration-1000 ${streak >= 10 ? 'bg-red-900/20 border-red-900/30' : 'bg-amber-900/20 border-amber-900/30'}`}>
              <table className="w-full table-fixed">
                <tbody className="text-sm md:text-base">
                  <tr className={streak >= 10 ? 'text-red-400' : 'text-amber-400'}>
                    <td className="px-2 py-3 font-bold w-[15%] text-center">#{myRankData + 1}</td>
                    <td className="px-4 py-3 font-bold w-[55%] truncate">You</td>
                    <td className="px-4 py-3 text-right font-mono font-bold w-[30%]">{formatScore(displayList[myRankData].score)}</td>
                    <td className="px-2 py-3 font-bold w-[15%] text-center text-orange-500">{streak || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
        <button disabled={lbStatus === 'loading' || lbStatus === 'cooldown'} onClick={fetchLeaderboardData} className={btnClass}>
          {btnText}
        </button>
      </div>
    </div>
  );
}