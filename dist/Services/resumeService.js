"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const extractTextFromFile = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const ext = path_1.default.extname(filePath).toLowerCase();
    try {
        if (ext === ".pdf") {
            return yield extractTextFromPDF(filePath);
        }
        else if (ext === ".docx") {
            return yield extractTextFromDOCX(filePath);
        }
        else {
            throw new Error("Unsupported file format. Only PDF and DOCX are allowed.");
        }
    }
    catch (error) {
        console.error("Error extracting text:", error);
        return "";
    }
});
exports.extractTextFromFile = extractTextFromFile;
const extractTextFromPDF = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataBuffer = fs_1.default.readFileSync(filePath);
        const pdfData = yield (0, pdf_parse_1.default)(dataBuffer);
        if (pdfData.text.trim()) {
            return pdfData.text;
        }
        else {
            console.log("PDF seems to be an image. Falling back to OCR...");
            return yield extractTextWithOCR(filePath);
        }
    }
    catch (error) {
        console.error("Error extracting text from PDF:", error);
        return "";
    }
});
const extractTextFromDOCX = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataBuffer = fs_1.default.readFileSync(filePath);
        const { value } = yield mammoth_1.default.extractRawText({ buffer: dataBuffer });
        return value;
    }
    catch (error) {
        console.error("Error extracting text from DOCX:", error);
        return "";
    }
});
const extractTextWithOCR = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data } = yield tesseract_js_1.default.recognize(filePath, "eng");
        return data.text;
    }
    catch (error) {
        console.error("Error with OCR:", error);
        return "";
    }
});
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
