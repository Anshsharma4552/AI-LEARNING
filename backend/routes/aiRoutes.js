import express from 'express';

import {
    generateFlashcards,
    generateQuiz,
    generateSummary,
    chat,
    explainConcept,
    getChatHistory
} from '../controllers/aiController';

import protect from '../middleware/auth';

const router=express.Router();

router.post('/generate-flashcards',generateFlashcards);
router.post('/generate-quiz',generateQuiz);
router.post('/generate-summary',generateSummary);
router.post('/chat',chat);
router.post('/explain-concept',explainConcept);
router.get('/chat-history/:documentId',getChatHistory);

export default router;