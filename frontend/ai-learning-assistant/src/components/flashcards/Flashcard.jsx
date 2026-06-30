import { Star, RotateCcw } from "lucide-react";

const Flashcard = ({ flashcard, onToggleStar, isFlipped, setIsFlipped }) => {
  const question = flashcard?.question || "No question available";
  const answer = flashcard?.answer || "No answer available";
  const difficulty = flashcard?.difficulty || "medium";

  const difficultyClass = {
    easy: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <div
      onClick={() => setIsFlipped((prev) => !prev)}
      className="min-h-[320px] rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-lg cursor-pointer transition hover:shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            difficultyClass[difficulty] || difficultyClass.medium
          }`}
        >
          {difficulty}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar?.(flashcard?._id);
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100"
          title="Mark important"
        >
          <Star
            className={`w-5 h-5 ${
              flashcard?.isStarred
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-400"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center text-center min-h-[190px]">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
          {isFlipped ? "Answer" : "Question"}
        </p>

        <h3 className="text-xl font-semibold text-slate-900 leading-relaxed">
          {isFlipped ? answer : question}
        </h3>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-500">
        <RotateCcw className="w-4 h-4" />
        Click card to flip
      </div>
    </div>
  );
};

export default Flashcard;