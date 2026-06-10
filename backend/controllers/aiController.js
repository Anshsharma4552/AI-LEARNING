import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js";
import * as geminiService from '../utils/geminiService.js';
import { findRelevantChunks } from "../utils/testChunker.js";

export const generateFlashcards= async (req,res,next)=>{
    try{
        const { documentId,count=10}=req.body;
        if(!documentId){
            return res.status(400).json({
                success:false,
                error:"Please provide documentId",
                statusCode:400
            })
        }
        const document=await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:'ready'
        })
        if(!document){
            return res.status(404).json({
                success:false,
                error:"Document not found or not ready",
                statusCode:404
            })
        }
        const cards=await geminiService.generateFlashcards(
            document.extractedText,
            parseInt(count)
        )
        const flashcardSet= await Flashcard.create({
            userId:req.user._id,
            documentId:document._id,
            cards:cards.map(card=>({
                question: card.question,
                answer:card.answer,
                difficulty:card.difficulty,
                reviewCount:0,
                isStarred:false
            }))
        })
        return res.status(201).json({
            success:true,
            data:flashcardSet,
            message:'Flashcards generated successfully'
        })
    }catch(error){
        next(error)
    }
}

export const generateQuiz= async (req,res,next)=>{
    try{
        const { documentId, numQuestions=5,title}=req.body;

        if(!documentId){
            return res.status(400).json({
                success:false,
                error:'Please provide documentId',
                statusCode:400
            })
        }
        const document= await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:'ready'
        })

        if(!document){
            return res.status(404).json({
                success:false,
                error:"Document not found or not ready",
                statusCode:404
            })
        }

        const questions= await geminiService.generateQuiz(
            document.extractedText,
            parseInt(numQuestions)
        )


        const quiz=await Wuiz.create({
            userId:req.user._id,
            documentId:document._id,
            title:title || `${document.title} - Quiz`,
            questions:questions,
            totalQuestions:questions.length,
            userAnswers=[],
            score:0
        })

        res.status(201).json({
            success:true,
            data:Quiz,
            message:"Quiz generated successfully"
        })
    }catch(error){
        next(error)
    }
}



export const generateSummary= async (req,res,next)=>{
    try{
        const { documentId } = req.body;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: 'Please provide documentId',
                statusCode: 400
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id,
            status: 'ready'
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found or not ready',
                statusCode: 404
            });
        }
        const summary= await geminiService.generateSummary(document.extractedText())
        res.status(200).json({
            success:true,
            data:{
                documentId:document._id,
                title:document.title,
                summary
            },
            message:'Summary generated successfullly'
        })
    }catch(error){
        next(error)
    }
}

export const chat= async (req,res,next)=>{
    try{


    }catch(error){
        next(error)
    }
}
export const explainConcept= async (req,res,next)=>{
    try{


    }catch(error){
        next(error)
    }
}



export const getChatHistory= async (req,res,next)=>{
    try{


    }catch(error){
        next(error)
    }
}

