import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js";
import * as geminiService from "../utils/geminiService.js";
import { findRelevantChunks } from "../utils/testChunker.js";

const getUserId = (req) => {
    return req.user?._id || req.user?.id || req.userId;
};

export const generateFlashcards = async (req, res, next) => {
    try {
        const userId = getUserId(req);
        const { documentId, count = 10 } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Not authorized",
            });
        }

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "Please provide documentId",
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId,
            status: "ready",
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document not found or not ready",
            });
        }

        const cards = await geminiService.generateFlashcards(
            document.extractedText,
            parseInt(count)
        );

        const flashcardSet = await Flashcard.create({
            userId,
            documentId: document._id,
            cards: cards.map((card) => ({
                question: card.question,
                answer: card.answer,
                difficulty: card.difficulty,
                reviewCount: 0,
                isStarred: false,
            })),
        });

        res.status(201).json({
            success: true,
            data: flashcardSet,
            message: "Flashcards generated successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const generateQuiz = async (req, res, next) => {
    try {
        const userId = getUserId(req);
        const { documentId, numQuestions = 5, title } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Not authorized",
            });
        }

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "Please provide documentId",
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId,
            status: "ready",
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document not found or not ready",
            });
        }

        const questions = await geminiService.generateQuiz(
            document.extractedText,
            parseInt(numQuestions)
        );

        const quiz = await Quiz.create({
            userId,
            documentId: document._id,
            title: title || `${document.title} - Quiz`,
            questions,
            totalQuestions: questions.length,
            userAnswers: [],
            score: 0,
        });

        res.status(201).json({
            success: true,
            data: quiz,
            message: "Quiz generated successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const generateSummary = async (req, res, next) => {
    try {
        const userId = getUserId(req);
        const { documentId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Not authorized",
            });
        }

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "Please provide documentId",
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId,
            status: "ready",
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document not found or not ready",
            });
        }

        const summary = await geminiService.generateSummary(
            document.extractedText
        );

        res.status(200).json({
            success: true,
            data: {
                documentId: document._id,
                title: document.title,
                summary,
            },
            message: "Summary generated successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const chat = async (req, res, next) => {
    try {
        const userId = getUserId(req);
        const { documentId, question } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Not authorized",
            });
        }

        if (!documentId || !question) {
            return res.status(400).json({
                success: false,
                error: "Please provide documentId and question",
            });
        }

        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document not found",
            });
        }

        const relevantChunks = findRelevantChunks(
            document.chunks || [],
            question,
            3
        );

        const chunkIndices = relevantChunks.map((c) => c.chunkIndex);

        let chatHistory = await ChatHistory.findOne({
            userId,
            documentId: document._id,
        });

        if (!chatHistory) {
            chatHistory = await ChatHistory.create({
                userId,
                documentId: document._id,
                messages: [],
            });
        }

        if (!Array.isArray(chatHistory.messages)) {
            chatHistory.messages = [];
        }

        const contextChunks =
            relevantChunks.length > 0
                ? relevantChunks
                : [{ content: document.extractedText || "" }];

        const answer = await geminiService.chatWithContext(
            question,
            contextChunks
        );

        chatHistory.messages.push(
            {
                role: "user",
                content: question,
                timestamp: new Date(),
                relevantChunks: [],
            },
            {
                role: "assistant",
                content: answer,
                timestamp: new Date(),
                relevantChunks: chunkIndices,
            }
        );

        await chatHistory.save();

        return res.status(200).json({
            success: true,
            data: {
                question,
                answer,
                relevantChunks: chunkIndices,
                chatHistoryId: chatHistory._id,
            },
            message: "Response generated successfully",
        });
    } catch (error) {
        console.error("CHAT CONTROLLER ERROR:", error);
        next(error);
    }
};
export const explainConcept = async (req, res, next) => {
    try {
        const userId = getUserId(req);
        const { documentId, concept } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Not authorized",
            });
        }

        if (!documentId || !concept) {
            return res.status(400).json({
                success: false,
                error: "Please provide documentId and concept",
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId,
            status: "ready",
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document not found or not ready",
            });
        }

        const relevantChunks = findRelevantChunks(
            document.chunks || [],
            concept,
            3
        );

        const context = relevantChunks.map((c) => c.content).join("\n\n");

        const explanation = await geminiService.explainConcept(
            concept,
            context
        );

        res.status(200).json({
            success: true,
            data: {
                concept,
                explanation,
                relevantChunks: relevantChunks.map((c) => c.chunkIndex),
            },
            message: "Explanation generated successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const getChatHistory = async (req, res, next) => {
    try {
        const userId = getUserId(req);
        const { documentId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Not authorized",
            });
        }

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "Please provide documentId",
            });
        }

        const chatHistory = await ChatHistory.findOne({
            userId,
            documentId,
        }).select("messages");

        if (!chatHistory) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No chat history found for this document",
            });
        }

        res.status(200).json({
            success: true,
            data: chatHistory.messages,
            message: "Chat history retrieved successfully",
        });
    } catch (error) {
        next(error);
    }
};