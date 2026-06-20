import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set.");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-2.5-flash";

export const generateFlashcards = async (text, count = 10) => {
    const prompt = `Generate exactly ${count} educational flashcards from the following text.

Format:
Q: question
A: answer
D: easy/medium/hard

Separate each flashcard with ___

Text:
${String(text || "").substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        const generatedText = response.text || "";
        const cards = generatedText.split("___").filter((c) => c.trim());

        return cards
            .map((card) => {
                const lines = card.trim().split("\n");
                let question = "";
                let answer = "";
                let difficulty = "medium";

                lines.forEach((line) => {
                    const trimmed = line.trim();

                    if (trimmed.startsWith("Q:")) {
                        question = trimmed.substring(2).trim();
                    }

                    if (trimmed.startsWith("A:")) {
                        answer = trimmed.substring(2).trim();
                    }

                    if (trimmed.startsWith("D:")) {
                        const diff = trimmed.substring(2).trim().toLowerCase();
                        if (["easy", "medium", "hard"].includes(diff)) {
                            difficulty = diff;
                        }
                    }
                });

                return { question, answer, difficulty };
            })
            .filter((card) => card.question && card.answer)
            .slice(0, count);
    } catch (error) {
        console.error("Gemini flashcard error:", error);
        throw new Error("Failed to generate flashcards");
    }
};

export const generateQuiz = async (text, numQuestions = 5) => {
    const prompt = `Generate exactly ${numQuestions} multiple choice questions.

Format:
Q: question
O1: option
O2: option
O3: option
O4: option
C: correct option
E: explanation
D: easy/medium/hard

Separate each question with ___

Text:
${String(text || "").substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        const generatedText = response.text || "";
        const blocks = generatedText.split("___").filter((q) => q.trim());

        return blocks
            .map((block) => {
                const lines = block.trim().split("\n");

                let question = "";
                let options = [];
                let correctAnswer = "";
                let explanation = "";
                let difficulty = "medium";

                lines.forEach((line) => {
                    const trimmed = line.trim();

                    if (trimmed.startsWith("Q:")) {
                        question = trimmed.substring(2).trim();
                    } else if (/^O\d:/.test(trimmed)) {
                        options.push(trimmed.substring(3).trim());
                    } else if (trimmed.startsWith("C:")) {
                        correctAnswer = trimmed.substring(2).trim();
                    } else if (trimmed.startsWith("E:")) {
                        explanation = trimmed.substring(2).trim();
                    } else if (trimmed.startsWith("D:")) {
                        const diff = trimmed.substring(2).trim().toLowerCase();
                        if (["easy", "medium", "hard"].includes(diff)) {
                            difficulty = diff;
                        }
                    }
                });

                return {
                    question,
                    options,
                    correctAnswer,
                    explanation,
                    difficulty,
                };
            })
            .filter((q) => q.question && q.options.length === 4 && q.correctAnswer)
            .slice(0, numQuestions);
    } catch (error) {
        console.error("Gemini quiz error:", error);
        throw new Error("Failed to generate quiz questions");
    }
};

export const generateSummary = async (text) => {
    const prompt = `Provide a clear structured summary of this document.

Text:
${String(text || "").substring(0, 20000)}`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        return response.text || "";
    } catch (error) {
        console.error("Gemini summary error:", error);
        throw new Error("Failed to generate summary");
    }
};

export const chatWithContext = async (question, chunks = []) => {
    try {
        const safeChunks = Array.isArray(chunks) ? chunks : [];

        const context = safeChunks
            .map((c, i) => {
                const text = c?.content || c?.text || c?.chunk || "";
                return `[Chunk ${i + 1}]\n${text}`;
            })
            .filter((item) => item.trim())
            .join("\n\n");

        if (!context.trim()) {
            return "No readable document content found to answer this question.";
        }

        const prompt = `Based on the following document context, answer the user's question.
If the answer is not available in the context, say so clearly.

Context:
${context.substring(0, 5000)}

Question:
${question}

Answer:`;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        return response.text || "No answer generated.";
    } catch (error) {
        console.error("Gemini chat error:", error);
        throw new Error(error.message || "Failed to process chat request");
    }
};

export const explainConcept = async (concept, context) => {
    const prompt = `Explain "${concept}" using this context:

${String(context || "").substring(0, 10000)}`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        return response.text || "";
    } catch (error) {
        console.error("Gemini explain error:", error);
        throw new Error("Failed to explain concept");
    }
};