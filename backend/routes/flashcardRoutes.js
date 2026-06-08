import express from 'express';
import {
    getFlashcards,
    getAllFlashcardSets,
    reviewFlashcard,
    toggleStarFlashcard,
    deleteFlashcardSet
} from '../controllers/flashcardController';

import protect from '../middleware/auth';

const router=express.Router();

router.use(protect)

router.get('/',getAllFlashcardSets);
router.get('/:documentId',getFlashcards);
router.post('/:cardId/review',reviewFlashcard);
router.put('/:cardId/star',toggleStarFlashcard);
router.delete('/:id',deleteFlashcardSet)

export default router;