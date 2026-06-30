/**
 * Split text into chunks for better AI processing
 */
export const chunkText = (text, chunkSize = 500, overlap = 50) => {
    if (!text || text.trim().length === 0) return [];
  
    const cleanedText = text
      .replace(/\r\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim();
  
    const paragraphs = cleanedText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  
    const chunks = [];
    let currentChunk = [];
    let currentWordCount = 0;
    let chunkIndex = 0;
  
    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/);
      const wordCount = words.length;
  
      if (wordCount > chunkSize) {
        if (currentChunk.length > 0) {
          chunks.push({
            content: currentChunk.join("\n\n"),
            chunkIndex: chunkIndex++,
            pageNumber: 0,
          });
          currentChunk = [];
          currentWordCount = 0;
        }
  
        for (let i = 0; i < words.length; i += chunkSize - overlap) {
          chunks.push({
            content: words.slice(i, i + chunkSize).join(" "),
            chunkIndex: chunkIndex++,
            pageNumber: 0,
          });
  
          if (i + chunkSize >= words.length) break;
        }
  
        continue;
      }
  
      if (currentWordCount + wordCount > chunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.join("\n\n"),
          chunkIndex: chunkIndex++,
          pageNumber: 0,
        });
  
        const prevWords = currentChunk.join(" ").split(/\s+/);
        const overlapText = prevWords
          .slice(-Math.min(overlap, prevWords.length))
          .join(" ");
  
        currentChunk = [overlapText, paragraph];
        currentWordCount =
          overlapText.split(/\s+/).filter(Boolean).length + wordCount;
      } else {
        currentChunk.push(paragraph);
        currentWordCount += wordCount;
      }
    }
  
    if (currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.join("\n\n"),
        chunkIndex: chunkIndex++,
        pageNumber: 0,
      });
    }
  
    return chunks;
  };
  
  /**
   * Find relevant chunks based on keyword matching
   */
  export const findRelevantChunks = (chunks, query, maxChunks = 3) => {
    if (!chunks || chunks.length === 0 || !query) return [];
  
    const stopWords = new Set([
      "the", "is", "at", "which", "on", "a", "an", "and", "or", "but",
      "in", "with", "to", "for", "of", "as", "by", "this", "that", "it",
      "are", "was", "were", "be", "been", "what", "why", "how", "when",
      "where", "who",
    ]);
  
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^\w]/g, ""))
      .filter((w) => w.length > 2 && !stopWords.has(w));
  
    if (queryWords.length === 0) {
      return chunks.slice(0, maxChunks).map((chunk, index) => ({
        content: chunk.contents || chunk.content || "",
        contents: chunk.contents || chunk.content || "",
        chunkIndex: chunk.chunkIndex ?? index,
        pageNumber: chunk.pageNumber || 0,
        _id: chunk._id,
      }));
    }
  
    const scoredChunks = chunks.map((chunk, index) => {
      const chunkText = chunk.contents || chunk.content || "";
      const lowerContent = chunkText.toLowerCase();
      const contentWords = lowerContent.split(/\s+/).filter(Boolean).length || 1;
  
      let score = 0;
  
      for (const word of queryWords) {
        const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  
        const exactMatches =
          lowerContent.match(new RegExp(`\\b${safeWord}\\b`, "g")) || [];
  
        const partialMatches =
          lowerContent.match(new RegExp(safeWord, "g")) || [];
  
        score += exactMatches.length * 3;
        score += Math.max(0, partialMatches.length - exactMatches.length) * 1.5;
      }
  
      const matchedWords = queryWords.filter((word) =>
        lowerContent.includes(word)
      ).length;
  
      if (matchedWords > 1) score += matchedWords * 2;
  
      const normalizedScore = score / Math.sqrt(contentWords);
      const positionBonus = 1 - (index / chunks.length) * 0.1;
  
      return {
        content: chunkText,
        contents: chunkText,
        chunkIndex: chunk.chunkIndex ?? index,
        pageNumber: chunk.pageNumber || 0,
        _id: chunk._id,
        score: normalizedScore * positionBonus,
        rawScore: score,
        matchedWords,
      };
    });
  
    return scoredChunks
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.matchedWords !== a.matchedWords) {
          return b.matchedWords - a.matchedWords;
        }
        return a.chunkIndex - b.chunkIndex;
      })
      .slice(0, maxChunks);
  };