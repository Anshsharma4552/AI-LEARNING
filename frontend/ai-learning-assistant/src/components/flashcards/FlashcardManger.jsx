import React, { useState, useEffect } from "react";
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    Trash2,
    ArrowLeft,
    Brain,
} from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";

import flashcardService from "../../service/flashcardService.js";
import aiService from "../../service/aiService.js";
import Spinner from "../common/spinner.jsx";
import Modal from "../common/Modal.jsx";
import Flashcard from "./Flashcard.jsx";

const FlashcardManager = ({ documentId }) => {
    const [flashcardSets, setFlashcardSets] = useState([]);
    const [selectedSet, setSelectedSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [setToDelete, setSetToDelete] = useState(null);

    const [flashcardTitle, setFlashcardTitle] = useState("");

    const fetchFlashcardSets = async () => {
        if (!documentId) return;

        setLoading(true);

        try {
            const response = await flashcardService.getFlashcardsForDocument(documentId);
            setFlashcardSets(response?.data || []);
        } catch (error) {
            toast.error("Failed to fetch flashcard sets.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlashcardSets();
    }, [documentId]);

    const handleGenerateFlashcards = async () => {
        if (!documentId) {
            toast.error("Document ID not found.");
            return;
        }

        if (!flashcardTitle.trim()) {
            toast.error("Please enter a flashcard set title.");
            return;
        }

        setGenerating(true);

        try {
            await aiService.generateFlashcards(
                documentId,
                { count: 10 },
                flashcardTitle
            );

            toast.success("Flashcards generated successfully!");
            setFlashcardTitle("");
            await fetchFlashcardSets();
        } catch (error) {
            toast.error(error.message || "Failed to generate flashcards.");
        } finally {
            setGenerating(false);
        }
    };

    const handleNextCard = () => {
        if (!selectedSet?.cards?.length) return;

        setIsFlipped(false);

        setCurrentCardIndex(
            (prevIndex) => (prevIndex + 1) % selectedSet.cards.length
        );
    };

    const handlePrevCard = () => {
        if (!selectedSet?.cards?.length) return;

        setIsFlipped(false);

        setCurrentCardIndex(
            (prevIndex) =>
                (prevIndex - 1 + selectedSet.cards.length) %
                selectedSet.cards.length
        );
    };

    const handleReview = async (index) => {
        const currentCard = selectedSet?.cards?.[currentCardIndex];
        if (!currentCard) return;

        try {
            await flashcardService.reviewFlashcard(currentCard._id, index);
            toast.success("Flashcard reviewed!");
        } catch (error) {
            toast.error("Failed to review flashcard.");
        }
    };

    const handleToggleStar = async (cardId) => {
        if (!cardId) return;

        try {
            const response = await flashcardService.toggleStar(cardId);
            const updatedCard = response?.data;

            setFlashcardSets((prevSets) =>
                prevSets.map((set) => ({
                    ...set,
                    cards: set.cards.map((card) =>
                        card._id === cardId
                            ? {
                                  ...card,
                                  isStarred:
                                      updatedCard?.isStarred ?? !card.isStarred,
                              }
                            : card
                    ),
                }))
            );

            setSelectedSet((prevSet) => {
                if (!prevSet) return prevSet;

                return {
                    ...prevSet,
                    cards: prevSet.cards.map((card) =>
                        card._id === cardId
                            ? {
                                  ...card,
                                  isStarred:
                                      updatedCard?.isStarred ?? !card.isStarred,
                              }
                            : card
                    ),
                };
            });

            toast.success("Updated important flashcard.");
        } catch (error) {
            toast.error(error.message || "Failed to update flashcard.");
        }
    };

    const handleDeleteRequest = (e, set) => {
        e.stopPropagation();
        setSetToDelete(set);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!setToDelete?._id) return;

        setDeleting(true);

        try {
            await flashcardService.deleteFlashcardSet(setToDelete._id);
            toast.success("Flashcard set deleted.");
            setIsDeleteModalOpen(false);
            setSetToDelete(null);
            setSelectedSet(null);
            await fetchFlashcardSets();
        } catch (error) {
            toast.error("Failed to delete flashcard set.");
        } finally {
            setDeleting(false);
        }
    };

    const handleSelectSet = (set) => {
        setSelectedSet(set);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    const handleBackToSets = () => {
        setSelectedSet(null);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    const renderFlashcardViewer = () => {
        const currentCard = selectedSet?.cards?.[currentCardIndex];

        return (
            <div>
                <button
                    onClick={handleBackToSets}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sets
                </button>

                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">
                        {selectedSet?.title || "Flashcards"}
                    </h3>

                    <p className="text-sm text-slate-500">
                        {currentCardIndex + 1} / {selectedSet?.cards?.length || 0}
                    </p>
                </div>

                {currentCard && (
                    <Flashcard
                        flashcard={currentCard}
                        isFlipped={isFlipped}
                        setIsFlipped={setIsFlipped}
                        onToggleStar={handleToggleStar}
                    />
                )}

                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        onClick={handlePrevCard}
                        className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => handleReview(0)}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium"
                    >
                        Review
                    </button>

                    <button
                        onClick={handleNextCard}
                        className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    const renderSetList = () => {
        if (loading) {
            return (
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            );
        }

        return (
            <div>
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">
                                Flashcards
                            </h2>
                            <p className="text-sm text-slate-500">
                                Practice with AI-generated flashcards.
                            </p>
                        </div>

                        <button
                            onClick={handleGenerateFlashcards}
                            disabled={generating}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
                        >
                            {generating ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Generate
                                </>
                            )}
                        </button>
                    </div>

                    <input
                        type="text"
                        value={flashcardTitle}
                        onChange={(e) => setFlashcardTitle(e.target.value)}
                        placeholder="Enter flashcard set title"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {flashcardSets.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-300 rounded-2xl">
                        <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">
                            No flashcards yet. Generate your first set.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {flashcardSets.map((set) => (
                            <div
                                key={set._id}
                                onClick={() => handleSelectSet(set)}
                                className="p-5 rounded-2xl border border-slate-200 hover:shadow-md cursor-pointer transition"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-slate-900">
                                            {set.title || "Untitled Flashcard Set"}
                                        </h3>

                                        <p className="text-sm text-slate-500 mt-1">
                                            {set.cards?.length || 0} cards
                                            {set.createdAt &&
                                                ` • ${moment(set.createdAt).fromNow()}`}
                                        </p>
                                    </div>

                                    <button
                                        onClick={(e) => handleDeleteRequest(e, set)}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 p-8">
                {selectedSet ? renderFlashcardViewer() : renderSetList()}
            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Flashcard Set"
            >
                <p className="text-sm text-slate-600 mb-6">
                    Are you sure you want to delete this flashcard set?
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

export default FlashcardManager;