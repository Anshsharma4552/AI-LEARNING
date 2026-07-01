import React from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  Clock,
  Trophy,
  ChevronRight,
  FileText,
} from "lucide-react";
import moment from "moment";

const QuizCard = ({ quiz }) => {
  if (!quiz) return null;

  const totalQuestions =
    quiz.totalQuestions || quiz.questions?.length || 0;

  const score =
    quiz.score !== undefined && quiz.score !== null
      ? `${quiz.score}/${totalQuestions}`
      : "Not Attempted";

  const percentage =
    totalQuestions > 0
      ? Math.round(((quiz.score || 0) / totalQuestions) * 100)
      : 0;

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-emerald-600" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {quiz.title}
              </h3>

              <p className="text-sm text-slate-500">
                {quiz.documentId?.title}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 mt-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              {totalQuestions} Questions
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              {moment(quiz.createdAt).fromNow()}
            </div>

            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              {score}
            </div>
          </div>

          {quiz.score !== undefined && (
            <div className="mt-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Progress</span>

                <span className="font-semibold text-slate-800">
                  {percentage}%
                </span>
              </div>

              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <Link
        to={
            quiz.userAnswers?.length > 0
            ? `/quizzes/${quiz._id}/results`
            : `/quizzes/${quiz._id}`
        }
        className={`ml-6 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-white transition ${
            quiz.userAnswers?.length > 0
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-emerald-600 hover:bg-emerald-700"
        }`}
        >
        {quiz.userAnswers?.length > 0 ? "View Result" : "Start"}
        <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default QuizCard;