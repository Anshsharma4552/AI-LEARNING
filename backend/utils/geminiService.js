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

const MODEL = "gemini-2.0-flash-lite";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorMessage = (error, fallback) => {
  if (error?.status === 429) {
    return "Gemini quota limit reached. Please wait and try again later.";
  }

  if (error?.status === 503) {
    return "Gemini is currently busy. Please try again after a few seconds.";
  }

  return fallback;
};

const generateWithRetry = async (prompt, retries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
      });

      return response.text || "";
    } catch (error) {
      lastError = error;

      const isRetryable =
        error?.status === 503 ||
        error?.message?.includes("UNAVAILABLE") ||
        error?.message?.includes("high demand");

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      console.log(`Gemini retry ${attempt}/${retries}...`);
      await sleep(3000 * attempt);
    }
  }

  throw lastError;
};

export const generateFlashcards = async (text, count = 10) => {
  const prompt = `Generate exactly ${count} educational flashcards from this text.

Return ONLY this format:

Q: question
A: answer
D: easy

___

Rules:
- No markdown.
- No headings.
- D must be easy, medium, or hard.

Text:
${String(text || "").substring(0, 6000)}`;

  try {
    const generatedText = await generateWithRetry(prompt);

    const cards = generatedText
      .split("___")
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        let question = "";
        let answer = "";
        let difficulty = "medium";

        block.split("\n").forEach((line) => {
          const trimmed = line.trim();

          if (trimmed.startsWith("Q:")) {
            question = trimmed.replace(/^Q:\s*/, "").trim();
          } else if (trimmed.startsWith("A:")) {
            answer = trimmed.replace(/^A:\s*/, "").trim();
          } else if (trimmed.startsWith("D:")) {
            const diff = trimmed.replace(/^D:\s*/, "").trim().toLowerCase();
            if (["easy", "medium", "hard"].includes(diff)) difficulty = diff;
          }
        });

        return { question, answer, difficulty };
      })
      .filter((card) => card.question && card.answer)
      .slice(0, count);

    if (!cards.length) {
      throw new Error("Gemini returned no valid flashcards");
    }

    return cards;
  } catch (error) {
    console.error("Gemini flashcard error:", error);
    throw new Error(getErrorMessage(error, "Failed to generate flashcards"));
  }
};

export const generateQuiz = async (text, numQuestions = 5) => {
  const prompt = `Generate exactly ${numQuestions} multiple choice questions from this text.

Return ONLY this format:

Q: question
O1: option
O2: option
O3: option
O4: option
C: correct option text
E: explanation
D: medium

___

Rules:
- No markdown.
- No headings.
- C must exactly match one of O1, O2, O3, O4.
- D must be easy, medium, or hard.

Text:
${String(text || "").substring(0, 6000)}`;

  try {
    const generatedText = await generateWithRetry(prompt);

    const questions = generatedText
      .split("___")
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        let question = "";
        const options = [];
        let correctAnswer = "";
        let explanation = "";
        let difficulty = "medium";

        block.split("\n").forEach((line) => {
          const trimmed = line.trim();

          if (trimmed.startsWith("Q:")) {
            question = trimmed.replace(/^Q:\s*/, "").trim();
          } else if (/^O[1-4]:/.test(trimmed)) {
            options.push(trimmed.replace(/^O[1-4]:\s*/, "").trim());
          } else if (trimmed.startsWith("C:")) {
            correctAnswer = trimmed.replace(/^C:\s*/, "").trim();
          } else if (trimmed.startsWith("E:")) {
            explanation = trimmed.replace(/^E:\s*/, "").trim();
          } else if (trimmed.startsWith("D:")) {
            const diff = trimmed.replace(/^D:\s*/, "").trim().toLowerCase();
            if (["easy", "medium", "hard"].includes(diff)) difficulty = diff;
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
      .filter(
        (q) =>
          q.question &&
          q.options.length === 4 &&
          q.correctAnswer &&
          q.options.includes(q.correctAnswer)
      )
      .slice(0, numQuestions);

    if (!questions.length) {
      throw new Error("Gemini returned no valid quiz questions");
    }

    return questions;
  } catch (error) {
    console.error("Gemini quiz error:", error);
    throw new Error(getErrorMessage(error, "Failed to generate quiz questions"));
  }
};

export const generateSummary = async (text) => {
  const prompt = `Provide a clear structured summary of this document.

Rules:
- Use simple language.
- Include important points.

Text:
${String(text || "").substring(0, 8000)}`;

  try {
    return await generateWithRetry(prompt);
  } catch (error) {
    console.error("Gemini summary error:", error);
    throw new Error(getErrorMessage(error, "Failed to generate summary"));
  }
};

export const chatWithContext = async (question, chunks = []) => {
  try {
    const safeChunks = Array.isArray(chunks) ? chunks : [];

    const context = safeChunks
      .map((chunk, index) => {
        const text =
          chunk?.contents ||
          chunk?.content ||
          chunk?.text ||
          chunk?.chunk ||
          "";

        return `[Chunk ${index + 1}]\n${text}`;
      })
      .filter((item) => item.trim())
      .join("\n\n");

    if (!context.trim()) {
      return "No readable document content found to answer this question.";
    }

    const prompt = `Based on the document context, answer the user's question.

If answer is not available, say:
"The answer is not available in the document context."

Context:
${context.substring(0, 5000)}

Question:
${question}

Answer:`;

    return await generateWithRetry(prompt);
  } catch (error) {
    console.error("Gemini chat error:", error);
    throw new Error(getErrorMessage(error, "Failed to process chat request"));
  }
};

export const explainConcept = async (concept, context) => {
  const prompt = `Explain "${concept}" using this context.

Use simple language and examples.

Context:
${String(context || "").substring(0, 6000)}`;

  try {
    return await generateWithRetry(prompt);
  } catch (error) {
    console.error("Gemini explain error:", error);
    throw new Error(getErrorMessage(error, "Failed to explain concept"));
  }
};