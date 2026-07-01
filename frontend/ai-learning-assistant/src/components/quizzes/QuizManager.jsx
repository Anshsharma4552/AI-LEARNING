import React, { useState, useEffect } from "react";
import { Plus, Trash2, Brain } from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";

import quizService from "../../service/quizService";
import aiService from "../../service/aiService";
import Spinner from "../common/spinner.jsx";
import Modal from "../common/Modal.jsx";
import QuizCard from "./QuizCard.jsx";

const QuizManager = ({ documentId }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [numQuestions, setNumQuestions] = useState(5);
    const [quizTitle, setQuizTitle] = useState("");

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);

    const fetchQuizzes = async () => {
        if (!documentId) return;

        setLoading(true);

        try {
            const response = await quizService.getQuizzesForDocument(documentId);
            setQuizzes(response?.data || []);
        } catch (error) {
            toast.error("Failed to fetch quizzes.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, [documentId]);

    const handleGenerateQuiz = async (e) => {
        e.preventDefault();

        if (!documentId) {
            toast.error("Document ID not found.");
            return;
        }

        if (!quizTitle.trim()) {
            toast.error("Please enter quiz title.");
            return;
        }

        setGenerating(true);

        try {
            await aiService.generateQuiz(documentId, {
                numQuestions,
                title: quizTitle,
            });

            toast.success("Quiz generated successfully!");
            setIsGenerateModalOpen(false);
            setQuizTitle("");
            setNumQuestions(5);
            await fetchQuizzes();
        } catch (error) {
            toast.error(error.message || "Failed to generate quiz.");
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteRequest = (quiz) => {
        setSelectedQuiz(quiz);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedQuiz?._id) return;

        setDeleting(true);

        try {
            await quizService.deleteQuiz(selectedQuiz._id);
            toast.success("Quiz deleted successfully.");
            setIsDeleteModalOpen(false);
            setSelectedQuiz(null);
            await fetchQuizzes();
        } catch (error) {
            toast.error("Failed to delete quiz.");
        } finally {
            setDeleting(false);
        }
    };

    const renderQuizContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            );
        }

        if (quizzes.length === 0) {
            return (
                <div className="text-center py-12 border border-dashed border-slate-300 rounded-2xl">
                    <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                        No quizzes yet. Generate your first quiz.
                    </p>
                </div>
            );
        }

        return (
            <div className="grid gap-4">
                {quizzes.map((quiz) => (
                    <div
                        key={quiz._id}
                        className="p-5 rounded-2xl border border-slate-200 hover:shadow-md transition bg-white"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <QuizCard quiz={quiz} />

                            <button
                                onClick={() => handleDeleteRequest(quiz)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete quiz"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-500 mt-2">
                            {quiz.totalQuestions || quiz.questions?.length || 0} questions
                            {quiz.createdAt && ` • ${moment(quiz.createdAt).fromNow()}`}
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                            Quizzes
                        </h2>
                        <p className="text-sm text-slate-500">
                            Test yourself with AI-generated quizzes.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                        Generate
                    </button>
                </div>

                {renderQuizContent()}
            </div>

            <Modal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                title="Generate Quiz"
            >
                <form onSubmit={handleGenerateQuiz} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Quiz Title
                        </label>
                        <input
                            type="text"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            placeholder="e.g. TypeScript Basics Quiz"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Number of Questions
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsGenerateModalOpen(false)}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={generating}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-50"
                        >
                            {generating ? "Generating..." : "Generate Quiz"}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Quiz"
            >
                <p className="text-sm text-slate-600 mb-6">
                    Are you sure you want to delete this quiz?
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm disabled:opacity-50"
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default QuizManager;