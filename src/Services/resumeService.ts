import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

export const extractTextFromFile = async (
  filePath: string
): Promise<string> => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === ".pdf") {
      return await extractTextFromPDF(filePath);
    } else if (ext === ".docx") {
      return await extractTextFromDOCX(filePath);
    } else {
      throw new Error(
        "Unsupported file format. Only PDF and DOCX are allowed."
      );
    }
  } catch (error) {
    console.error("Error extracting text:", error);
    return "";
  }
};

const extractTextFromPDF = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    if (pdfData.text.trim()) {
      return pdfData.text;
    } else {
      console.log("PDF seems to be an image. Falling back to OCR...");
      return await extractTextWithOCR(filePath);
    }
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "";
  }
};

const extractTextFromDOCX = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const { value } = await mammoth.extractRawText({ buffer: dataBuffer });
    return value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    return "";
  }
};

const extractTextWithOCR = async (filePath: string): Promise<string> => {
  try {
    const { data } = await Tesseract.recognize(filePath, "eng");
    return data.text;
  } catch (error) {
    console.error("Error with OCR:", error);
    return "";
  }
};

// import { parseFile } from "../utils/resumeParser";
// import openai from "../config/openaiConfig";

// export const parseResumeToJson = async (filePath: string) => {
//   try {
//     const documentText = await parseFile(filePath);

//     if (!documentText) {
//       throw new Error("No text extracted from resume.");
//     }

//     const prompt = `Extract the candidate's details in JSON format. Return only a valid JSON object without explanations.
//       Extract these fields: { "name": "", "email": "", "phone": "" } from the following text:
//       """${documentText.substring(0, 5000)}"""`; // Limit text to avoid token issues

//     const completion = await openai.chat.completions.create({
//       messages: [{ role: "user", content: prompt }],
//       model: "gpt-4",
//       temperature: 0.3,
//     });

//     const content = completion.choices[0]?.message?.content || "{}";
//     return JSON.parse(content);
//   } catch (error) {
//     console.error("Error generating resume JSON:", error);
//     return { name: "N/A", email: "N/A", phone: "N/A" };
//   }
// };
