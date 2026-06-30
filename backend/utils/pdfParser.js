import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);

    const parser = new PDFParse({
      data: dataBuffer,
    });

    const result = await parser.getText();

    await parser.destroy();

    return {
      text: result.text || "",
      numPages: result.total || 0,
      info: result.info || {},
    };
  } catch (error) {
    console.error("PDF parsing error full:", error);
    throw error;
  }
};