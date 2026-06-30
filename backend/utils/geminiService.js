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

const MODEL = "gemini-2.5-flash-lite";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        error?.status === 429 ||
        error?.message?.includes("UNAVAILABLE") ||
        error?.message?.includes("high demand");

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      console.log(`Gemini retry ${attempt}/${retries}...`);
      await sleep(2000 * attempt);
    }
  }

  throw lastError;
};

export const generateFlashcards = async (text, count = 10) => {
  const prompt = `Generate exactly ${count} educational flashcards from the following text.

Return ONLY in this format:

Q: question
A: answer
D: easy

___

Q: question
A: answer
D: medium

___

Q: question
A: answer
D: hard

Rules:
- Do not use markdown.
- Do not add extra headings.
- Difficulty must be only easy, medium, or hard.
- Generate useful exam-style flashcards.

Text:
${String(text || "").substring(0, 15000)}`;

  try {
    const generatedText = await generateWithRetry(prompt);

    const cards = generatedText
      .split("___")
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const lines = block.split("\n");

        let question = "";
        let answer = "";
        let difficulty = "medium";

        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed.startsWith("Q:")) {
            question = trimmed.replace(/^Q:\s*/, "").trim();
          } else if (trimmed.startsWith("A:")) {
            answer = trimmed.replace(/^A:\s*/, "").trim();
          } else if (trimmed.startsWith("D:")) {
            const diff = trimmed.replace(/^D:\s*/, "").trim().toLowerCase();

            if (["easy", "medium", "hard"].includes(diff)) {
              difficulty = diff;
            }
          }
        }

        return {
          question,
          answer,
          difficulty,
        };
      })
      .filter((card) => card.question && card.answer)
      .slice(0, count);

    if (cards.length === 0) {
      throw new Error("Gemini returned no valid flashcards");
    }

    return cards;
  } catch (error) {
    console.error("Gemini flashcard error:", error);
    throw new Error(
      error?.status === 503
        ? "Gemini is currently busy. Please try again after a few seconds."
        : "Failed to generate flashcards"
    );
  }
};

export const generateQuiz = async (text, numQuestions = 5) => {
  const prompt = `Generate exactly ${numQuestions} multiple choice questions.

Return ONLY in this format:

Q: question
O1: option
O2: option
O3: option
O4: option
C: correct option
E: explanation
D: medium

___

Rules:
- Do not use markdown.
- Correct option must exactly match one of O1, O2, O3, O4.
- Difficulty must be only easy, medium, or hard.

Text:
${String(text || "").substring(0, 15000)}`;

  try {
    const generatedText = await generateWithRetry(prompt);

    return generatedText
      .split("___")
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const lines = block.split("\n");

        let question = "";
        const options = [];
        let correctAnswer = "";
        let explanation = "";
        let difficulty = "medium";

        for (const line of lines) {
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

            if (["easy", "medium", "hard"].includes(diff)) {
              difficulty = diff;
            }
          }
        }

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
    throw new Error(
      error?.status === 503
        ? "Gemini is currently busy. Please try again after a few seconds."
        : "Failed to generate quiz questions"
    );
  }
};

export const generateSummary = async (text) => {
  const prompt = `Provide a clear structured summary of this document.

Rules:
- Use simple language.
- Include important points.
- Do not say the document text was not provided.

Text:
${String(text || "").substring(0, 20000)}`;

  try {
    return await generateWithRetry(prompt);
  } catch (error) {
    console.error("Gemini summary error:", error);
    throw new Error(
      error?.status === 503
        ? "Gemini is currently busy. Please try again after a few seconds."
        : "Failed to generate summary"
    );
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

    const prompt = `Based on the following document context, answer the user's question.

If the answer is not available in the context, say:
"The answer is not available in the document context."

Context:
${context.substring(0, 8000)}

Question:
${question}

Answer:`;

    return await generateWithRetry(prompt);
  } catch (error) {
    console.error("Gemini chat error:", error);
    throw new Error(
      error?.status === 503
        ? "Gemini is currently busy. Please try again after a few seconds."
        : "Failed to process chat request"
    );
  }
};

export const explainConcept = async (concept, context) => {
  const prompt = `Explain "${concept}" using this context.

Use simple language and examples where helpful.

Context:
${String(context || "").substring(0, 10000)}`;

  try {
    return await generateWithRetry(prompt);
  } catch (error) {
    console.error("Gemini explain error:", error);
    throw new Error(
      error?.status === 503
        ? "Gemini is currently busy. Please try again after a few seconds."
        : "Failed to explain concept"
    );
  }
};