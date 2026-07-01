import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Trophy } from "lucide-react";
import toast from "react-hot-toast";

import quizService from "../../service/quizService";
import Spinner from "../../components/common/spinner";

const QuizResultPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await quizService.getQuizResults(quizId);
      setResult(response?.data);
    } catch (error) {
      toast.error(error.message || "Failed to fetch quiz results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) fetchResult();
  }, [quizId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Result not found.</p>
      </div>
    );
  }

  const questions = result.questions || [];
  const userAnswers = result.userAnswers || [];
  const score = result.score || 0;
  const total = result.totalQuestions || questions.length || 0;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-emerald-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              {result.title || "Quiz Result"}
            </h1>

            <p className="text-lg font-semibold text-emerald-600 mt-2">
              {score} / {total} correct
            </p>

            <p className="text-sm text-slate-500">{percentage}% score</p>
          </div>

          <div className="space-y-5">
            {questions.map((question, index) => {
              const userAnswer =
                typeof userAnswers[index] === "string"
                  ? userAnswers[index]
                  : userAnswers[index]?.answer;

              const correctAnswer = question.correctAnswer;
              const isCorrect = userAnswer === correctAnswer;

              return (
                <div
                  key={question._id || index}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 mt-1" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-1" />
                    )}

                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {index + 1}. {question.question}
                      </h3>

                      <p className="text-sm mt-3">
                        <span className="font-medium text-slate-700">
                          Your answer:{" "}
                        </span>
                        <span
                          className={
                            isCorrect ? "text-emerald-600" : "text-red-600"
                          }
                        >
                          {userAnswer || "Not answered"}
                        </span>
                      </p>

                      <p className="text-sm mt-1">
                        <span className="font-medium text-slate-700">
                          Correct answer:{" "}
                        </span>
                        <span className="text-emerald-600">
                          {correctAnswer}
                        </span>
                      </p>

                      {question.explanation && (
                        <p className="text-sm text-slate-600 mt-3">
                          <span className="font-medium">Explanation: </span>
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => navigate("/documents")}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold"
            >
              Back to Documents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultPage;