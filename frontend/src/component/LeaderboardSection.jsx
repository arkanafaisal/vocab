
import { formatScore } from "../utils/formatScore";
import { Icons } from "./Icons";


function LeaderboardRow({ rank, username, score, streak, isMe, isFire, isFooter }) {
  let trClass = isFooter ? (isFire ? 'text-red-400' : 'text-amber-400') : "border-b border-slate-700 last:border-0 hover:bg-slate-700 transition-colors ";
  let userClass = isFooter ? "truncate font-bold" : "truncate w-full text-slate-300";

  if (!isFooter && isMe) {
    if (isFire) { trClass += "bg-red-900/20 hover:bg-red-900/30"; userClass = "truncate w-full text-red-400 animate-pulse"; }
    else { trClass += "bg-amber-900/20 hover:bg-amber-900/30"; userClass = "truncate w-full text-amber-400"; }
  }

  return (
    <tr className={trClass}>
      <td className={`px-2 ${isFooter ? 'py-3 font-bold' : 'py-3.5 font-bold text-slate-500'} w-[10%] text-center`}>{isFooter ? `#${rank}` : rank}</td>
      <td className={`px-4 ${isFooter ? 'py-3 font-bold' : 'py-3.5 font-semibold'} w-[50%]`}>
        <div className={userClass}>{username}</div>
      </td>
      <td className={`px-4 ${isFooter ? 'py-3' : 'py-3.5 text-indigo-400'} text-right font-mono font-bold w-[25%]`}>{formatScore(score)}</td>
      <td className={`px-2 ${isFooter ? 'py-3' : 'py-3.5'} font-bold w-[15%] text-center text-orange-500`}>{streak || 0}</td>
    </tr>
  );
}

export function LeaderboardSection({ view, streak, score, user, guestUser, leaderboard, lbStatus, lbCooldown, fetchLeaderboardData, setActiveModal }) {
  const isHidden = view !== 'leaderboard' ? 'hidden md:flex' : 'flex';
  const activePlayer = user || guestUser;
  const isGuestMode = !user && Boolean(guestUser);

  let displayList = [...leaderboard];
  if (activePlayer) {
    const exists = displayList.find(u => u.username === activePlayer.username);
    if (!exists) {
      displayList.push({ username: activePlayer.username, score: score, streak: streak || 0 });
    } else {
      exists.score = Math.max(exists.score, score);
      if (exists.username === activePlayer.username) exists.streak = streak;
    }
  }
  displayList.sort((a, b) => b.score - a.score);
  const myRankData = displayList.findIndex(u => activePlayer && u.username === activePlayer.username);

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
              <Icons.Trophy />
              LEADERBOARD
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-slate-800 relative">
            <table className="w-full border-collapse table-fixed">
              <thead className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider bg-slate-900/95 backdrop-blur sticky top-0 z-10 shadow-sm border-b border-slate-700">
                <tr>
                  <th className="px-2 py-3 text-center w-[10%]">#</th>
                  <th className="px-4 py-3 text-left w-[50%]">Player</th>
                  <th className="px-4 py-3 text-right w-[25%]">Pts</th>
                  <th className="px-2 py-3 text-center w-[15%]">🔥</th>
                </tr>
              </thead>
              <tbody className="text-sm md:text-base">
                {displayList.map((u, i) => (
                  <LeaderboardRow
                    key={u.username}
                    rank={i + 1}
                    username={u.username}
                    score={u.score}
                    streak={u.streak}
                    isMe={activePlayer && u.username === activePlayer.username}
                    isFire={streak >= 10}
                    isFooter={false}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {isGuestMode && (
            <div className="bg-indigo-950/60 border-t border-indigo-500/30 px-4 py-2.5 text-xs text-indigo-200 flex items-center justify-between gap-2 shrink-0">
              <span>Mode offline: skor hanya lokal & tidak terlihat pemain lain.</span>
              <button onClick={() => setActiveModal('auth')} className="shrink-0 font-bold text-indigo-400 hover:text-indigo-300 underline">Login</button>
            </div>
          )}

          {myRankData !== -1 && (
            <div className={`border-t shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)] px-0 transition-colors duration-1000 ${streak >= 10 ? 'bg-red-900/20 border-red-900/30' : 'bg-amber-900/20 border-amber-900/30'}`}>
              <table className="w-full table-fixed">
                <tbody className="text-sm md:text-base">
                  <LeaderboardRow
                    rank={myRankData + 1}
                    username="You"
                    score={displayList[myRankData].score}
                    streak={streak}
                    isMe={true}
                    isFire={streak >= 10}
                    isFooter={true}
                  />
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