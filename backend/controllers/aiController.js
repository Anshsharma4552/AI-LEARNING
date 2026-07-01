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
    const { documentId, count = 10, title } = req.body;

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
      title: title?.trim() || `${document.title} Flashcards`,
      cards: cards.map((card) => ({
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty || "medium",
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
  
      if (!questions || questions.length === 0) {
        return res.status(500).json({
          success: false,
          error: "AI did not generate valid quiz questions. Please try again.",
        });
      }
  
      const quiz = await Quiz.create({
        userId,
        documentId: document._id,
        title: title?.trim() || `${document.title} - Quiz`,
        questions,
        totalQuestions: questions.length,
        userAnswers: [],
        score: 0,
        completedAt: null,
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
      document.extractedText || ""
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
      question,
      3
    );

    const chunkIndices = relevantChunks.map((chunk) => chunk.chunkIndex);

    const contextChunks =
      relevantChunks.length > 0
        ? relevantChunks
        : [{ contents: document.extractedText || "" }];

    const answer = await geminiService.chatWithContext(question, contextChunks);

    let chatHistory = await ChatHistory.findOne({
      userId,
      documentId: document._id,
    });

    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        userId,
        documentId: document._id,
        messages: [],
        chunkIndices: [],
      });
    }

    if (!Array.isArray(chatHistory.messages)) {
      chatHistory.messages = [];
    }

    chatHistory.messages.push(
      {
        role: "user",
        content: question,
        timestamp: new Date(),
      },
      {
        role: "assistant",
        content: answer,
        timestamp: new Date(),
      }
    );

    chatHistory.chunkIndices = chunkIndices;

    await chatHistory.save();

    res.status(200).json({
      success: true,

      question,
      answer,
      relevantChunks: chunkIndices,
      chunkIndices,
      chatHistoryId: chatHistory._id,

      data: {
        question,
        answer,
        relevantChunks: chunkIndices,
        chunkIndices,
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

    const context =
      relevantChunks.length > 0
        ? relevantChunks
            .map((chunk) => chunk.contents || chunk.content || "")
            .join("\n\n")
        : document.extractedText || "";

    const explanation = await geminiService.explainConcept(concept, context);

    res.status(200).json({
      success: true,
      data: {
        concept,
        explanation,
        relevantChunks: relevantChunks.map((chunk) => chunk.chunkIndex),
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
    });

    res.status(200).json({
      success: true,
      data: chatHistory?.messages || [],
      messages: chatHistory?.messages || [],
      message: "Chat history retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};