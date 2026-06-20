import express from "express";
import protect from "../middleware/auth.js";

import {
    generateFlashcards,
    generateQuiz,
    generateSummary,
    chat,
    explainConcept,
    getChatHistory,
} from "../controllers/aiController.js";

const router = express.Router();

console.log("AI ROUTES LOADED");

router.post("/generate-flashcards", protect, generateFlashcards);
router.post("/generate-quiz", protect, generateQuiz);
router.post("/generate-summary", protect, generateSummary);

router.post("/chat", protect, (req, res, next) => {
    console.log("CHAT ROUTE HIT");
    next();
}, chat);

router.post("/explain-concept", protect, explainConcept);
router.get("/chat-history/:documentId", protect, getChatHistory);

export default router;