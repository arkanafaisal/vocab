import { formatScore } from "../utils/formatScore";
import { Icons } from "./Icons";

function QuizSkeleton({ showRetry, onRetry, isHidden }) {
  return (
    <div className={`flex-1 h-full flex-col ${isHidden}`}>
      <div className="w-full h-full flex items-center justify-center p-4 fade-in">
        <div className="w-full max-w-lg bg-slate-800/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-black/30 flex flex-col max-h-full my-auto border-2 border-slate-700 relative">
          <div className="bg-slate-900/50 border-b border-slate-700 px-4 py-4 flex items-center justify-between shrink-0 relative z-10 animate-pulse rounded-t-[22px]">
            <div className="h-8 w-16 bg-slate-700 rounded-full"></div>
            <div className="h-8 w-20 bg-slate-700 rounded-full"></div>
          </div>
          <div className="shrink overflow-y-auto custom-scrollbar flex flex-col justify-center px-6 py-6 gap-6 animate-pulse min-h-0 rounded-b-[22px]">
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="h-4 w-32 bg-slate-700 rounded-full"></div>
              <div className="h-10 w-3/4 bg-slate-700 rounded-lg"></div>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-[52px] w-full bg-slate-800 border-2 border-slate-700 rounded-2xl"></div>)}
            </div>
          </div>
          {showRetry && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-3xl">
              <button onClick={onRetry} className="px-6 py-3 bg-slate-700 border border-slate-600 text-slate-200 rounded-xl font-bold hover:bg-slate-600 hover:text-white transition-all shadow-xl flex items-center gap-2 pointer-events-auto">
                <Icons.Refresh />
                Gagal memuat, Coba Lagi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getChoiceBtnClass(choice, quizUI, streak) {
  const base = "w-full py-3.5 px-5 rounded-2xl text-sm font-bold transition-all duration-300 ease-out flex items-center justify-center min-h-[52px] text-center shadow-sm overflow-hidden relative group border-2 ";
  const isSelected = quizUI.selectedAnswer === choice;
  const isCorrect = quizUI.correctAnswerText === choice;

  if (quizUI.isTransitioning) {
    if (streak >= 10) return base + "bg-slate-900 text-slate-300 border-slate-700 pointer-events-none ";
    if (streak >= 5) return base + "bg-slate-900 text-slate-300 border-slate-700 card-fire-glow-orange pointer-events-none ";
    return base + "bg-slate-900 text-slate-300 border-slate-700 pointer-events-none ";
  }

  if (quizUI.selectedAnswer) {
    if (quizUI.isValidating) {
      if (isSelected) return "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center relative overflow-hidden bg-slate-900 text-white border-2 border-amber-500/50 shadow-md";
      return "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center relative overflow-hidden bg-slate-900 text-slate-500 border-2 border-transparent opacity-40 cursor-not-allowed";
    }
    if (quizUI.correctAnswerText) {
      if (isCorrect) return "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center shadow-lg relative overflow-hidden bg-emerald-600 text-white border-2 border-emerald-500 shadow-emerald-900/50 scale-[1.02] z-10";
      if (isSelected) return "w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center min-h-[52px] text-center shadow-lg relative overflow-hidden bg-rose-600 text-white border-2 border-rose-500 shadow-rose-900/50";
      return base + "bg-slate-900 opacity-0 pointer-events-none transform scale-90 border-slate-700";
    }
  }

  if (streak >= 10) return base + "bg-slate-900 text-slate-300 hover:bg-red-900/30 hover:border-red-500 border-slate-700 ";
  if (streak >= 5) return base + "bg-slate-900 text-slate-300 hover:bg-orange-900/30 hover:border-orange-500 border-slate-700 card-fire-glow-orange ";
  return base + "bg-slate-900 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700 ";
}

export function QuizSection({ view, streak, score, question, quizUI, floatingScores, handleAnswer, requestQuestion }) {
  const isHidden = view !== 'quiz' ? 'hidden md:flex' : 'flex';

  const renderStreakBadge = () => {
    if (streak < 2) return null;
    let badgeClass = "flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-sm transition-all duration-500 animate-pop-in border ";
    let iconHTML = null;
    let textClass = "";

    if (streak >= 10) {
      badgeClass += "bg-rose-900/60 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-shake-intense scale-110";
      iconHTML = <span className="text-rose-500 animate-fire-pulse"><Icons.Fire /></span>;
      textClass = "bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 animate-gradient-text";
    } else if (streak >= 5) {
      badgeClass += "bg-orange-900/40 border-orange-500 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.3)]";
      iconHTML = <span className="text-orange-500 animate-pulse"><Icons.FireOutline /></span>;
    } else {
      badgeClass += "bg-amber-900/30 border-amber-500/50 text-amber-200";
      iconHTML = <span className="text-amber-500"><Icons.FireOutline /></span>;
    }

    return (
      <div className={badgeClass}>
        {iconHTML} <span className={textClass}>{streak}</span>
      </div>
    );
  };

  if (!question) {
    return <QuizSkeleton showRetry={quizUI.showRetry} onRetry={requestQuestion} isHidden={isHidden} />;
  }

  let cardClass = "w-full max-w-lg bg-slate-800/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-black/30 flex flex-col max-h-full my-auto border-2 transition-all duration-500 relative ";
  if (streak >= 10) cardClass += "card-fire-glow-red border-slate-700";
  else if (streak >= 5) cardClass += "card-fire-glow-orange border-slate-700";
  else if (streak >= 3) cardClass += "border-amber-500/50 shadow-amber-500/20 shadow-lg";
  else cardClass += "border-slate-700";

  return (
    <div className={`flex-1 h-full flex-col ${isHidden}`}>
      <div className="w-full h-full flex items-center justify-center p-4 fade-in">
        <div className={cardClass}>
          <div className="bg-slate-900/50 border-b border-slate-700 px-4 py-4 flex items-center justify-between shrink-0 relative z-10 rounded-t-[22px]">
            <div className="flex-1 flex justify-start">{renderStreakBadge()}</div>
            <div className="relative">
              <div className={`bg-amber-900/30 border border-amber-700/50 px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2 transition-transform duration-300 ${quizUI.popScore ? 'animate-score-pop' : ''}`}>
                <span className="text-[10px] font-bold text-amber-500 uppercase leading-none mt-[1px]">Score</span>
                <span className={`text-base font-extrabold leading-none transition-colors ${quizUI.popScore ? 'text-amber-200' : 'text-amber-400'}`}>{formatScore(score)}</span>
              </div>
              {floatingScores.map(fs => (
                <div key={fs.id} className="absolute -top-6 right-2 text-emerald-400 font-black text-lg animate-float-up-fade pointer-events-none drop-shadow-md z-50">
                  +{fs.pts}
                </div>
              ))}
            </div>
          </div>
          <div className="shrink overflow-y-auto custom-scrollbar flex flex-col justify-center relative z-10 min-h-0 rounded-b-[22px]">
            <div className="px-6 py-6 text-center">
              <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">Apa arti kata:</h2>
              <h1 className={`text-3xl md:text-4xl font-black text-white break-words leading-tight drop-shadow-md tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 to-white transition-opacity duration-300 ${quizUI.isTransitioning ? 'opacity-0' : 'opacity-100'}`}>{question.vocab}</h1>
            </div>
            <div className="px-6 pb-3">
              <div className="flex flex-col gap-3">
                {question.choices.map((choice, i) => {
                  const isSelected = quizUI.selectedAnswer === choice;
                  return (
                    <button key={i} disabled={!!quizUI.selectedAnswer || quizUI.isTransitioning} onClick={() => handleAnswer(choice)} className={getChoiceBtnClass(choice, quizUI, streak)}>
                      <span className={`relative z-10 break-words w-full transition-opacity duration-300 ${quizUI.isTransitioning ? 'opacity-0' : 'opacity-100'}`}>{choice}</span>
                      {quizUI.isValidating && isSelected && <div className="absolute inset-0 bg-amber-500/20 animate-fill-bar origin-left z-0 opacity-100"></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
