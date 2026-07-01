import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import quizService from "../../service/quizService";
import Spinner from "../../components/common/spinner";

const QuizTakePage = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState({});

    const fetchQuiz = async () => {
        try {
            setLoading(true);

            const response = await quizService.getQuizById(quizId);
            console.log("QUIZ RESPONSE:", response);

            const quizData = response?.data?.data || response?.data || response;
            setQuiz(quizData);
        } catch (error) {
            toast.error(error.message || "Failed to fetch quiz.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (quizId) fetchQuiz();
    }, [quizId]);

    const handleSelectAnswer = (questionIndex, option) => {
        setAnswers((prev) => ({
            ...prev,
            [questionIndex]: option,
        }));
    };

    const handleSubmitQuiz = async () => {
        if (!quiz?.questions?.length) return;

        if (Object.keys(answers).length !== quiz.questions.length) {
            toast.error("Please answer all questions before submitting.");
            return;
        }

        const userAnswers = quiz.questions.map((_, index) => answers[index]);

        try {
            setSubmitting(true);

            await quizService.submitQuiz(quizId, userAnswers);

            toast.success("Quiz submitted successfully!");
            navigate(`/quizzes/${quizId}/results`);
        } catch (error) {
            toast.error(error.message || "Failed to submit quiz.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="p-8">
                <p className="text-slate-600">Quiz not found.</p>
            </div>
        );
    }

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
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">
                            {quiz.title || "Quiz"}
                        </h1>

                        <p className="text-sm text-slate-500 mt-1">
                            {quiz.questions?.length || 0} questions
                        </p>
                    </div>

                    <div className="space-y-8">
                        {quiz.questions?.map((question, qIndex) => (
                            <div
                                key={question._id || qIndex}
                                className="p-5 rounded-2xl border border-slate-200 bg-slate-50"
                            >
                                <h3 className="font-semibold text-slate-900 mb-4">
                                    {qIndex + 1}. {question.question}
                                </h3>

                                <div className="space-y-3">
                                    {question.options?.map((option, optionIndex) => {
                                        const selected = answers[qIndex] === option;

                                        return (
                                            <button
                                                key={optionIndex}
                                                type="button"
                                                onClick={() =>
                                                    handleSelectAnswer(qIndex, option)
                                                }
                                                className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                                                    selected
                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                        : "border-slate-200 bg-white hover:bg-slate-100"
                                                }`}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end mt-8">
                        <button
                            onClick={handleSubmitQuiz}
                            disabled={submitting}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Submit Quiz
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizTakePage;