import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Sparkles, BookOpen, Lightbulb } from "lucide-react";
import toast from "react-hot-toast";

import aiService from "../../service/aiService";
import MarkdownRenderer from "../common/MarkdownRenderer";
import Modal from "../common/Modal";

const AIActions = () => {
    const { id: documentId } = useParams();

    const [loadingAction, setLoadingAction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [concept, setConcept] = useState("");

    const handleGenerateSummary = async () => {
        if (!documentId) {
            toast.error("Document ID not found.");
            return;
        }

        setLoadingAction("summary");

        try {
            const response = await aiService.generateSummary(documentId);

            console.log("SUMMARY RESPONSE:", response);

            const summary =
                response?.data?.data?.summary ||
                response?.data?.summary ||
                response?.summary ||
                "";

            if (!summary) {
                toast.error("No summary received.");
                return;
            }

            setModalTitle("Generated Summary");
            setModalContent(summary);
            setIsModalOpen(true);
        } catch (error) {
            console.error("SUMMARY ERROR:", error);
            toast.error("Failed to generate summary.");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleExplainConcept = async (e) => {
        e.preventDefault();

        if (!concept.trim()) {
            toast.error("Please enter a concept to explain.");
            return;
        }

        if (!documentId) {
            toast.error("Document ID not found.");
            return;
        }

        setLoadingAction("explain");

        try {
            const response = await aiService.explainConcept(documentId, concept);

            console.log("EXPLAIN RESPONSE:", response);

            const explanation =
                response?.data?.data?.explanation ||
                response?.data?.explanation ||
                response?.explanation ||
                "";

            if (!explanation) {
                toast.error("No explanation received.");
                return;
            }

            setModalTitle(`Explanation of "${concept}"`);
            setModalContent(explanation);
            setIsModalOpen(true);
            setConcept("");
        } catch (error) {
            console.error("EXPLAIN ERROR:", error);
            toast.error("Failed to explain concept.");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <>
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                AI Assistant
                            </h3>
                            <p className="text-xs text-slate-500">
                                Powered by advanced AI
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="group p-5 bg-gradient-to-br from-slate-50/50 to-white rounded-xl border border-slate-200/60 hover:border-slate-300/60 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-blue-600" strokeWidth={2} />
                                    </div>

                                    <h4 className="font-semibold text-slate-900">
                                        Generate Summary
                                    </h4>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Get a concise summary of the entire document.
                                </p>
                            </div>

                            <button
                                onClick={handleGenerateSummary}
                                disabled={loadingAction === "summary"}
                                className="shrink-0 h-10 px-5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            >
                                {loadingAction === "summary" ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Loading...
                                    </span>
                                ) : (
                                    "Summarize"
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="group p-5 bg-gradient-to-br from-slate-50/50 to-white rounded-xl border border-slate-200/60 hover:border-slate-300/60 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                                        <Lightbulb className="w-4 h-4 text-amber-600" strokeWidth={2} />
                                    </div>

                                    <h4 className="font-semibold text-slate-900">
                                        Explain a Concept
                                    </h4>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                    Ask AI to explain any concept from the document.
                                </p>

                                <form onSubmit={handleExplainConcept} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={concept}
                                        onChange={(e) => setConcept(e.target.value)}
                                        placeholder="Enter a concept..."
                                        className="flex-1 h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    />

                                    <button
                                        type="submit"
                                        disabled={loadingAction === "explain"}
                                        className="h-10 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                    >
                                        {loadingAction === "explain" ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Loading...
                                            </span>
                                        ) : (
                                            "Explain"
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
            >
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <div className="prose prose-sm max-w-none prose-slate">
                        <MarkdownRenderer content={modalContent} />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default AIActions;