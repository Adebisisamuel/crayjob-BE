"use strict";
// import { GoogleGenerativeAI } from "@google/generative-ai";
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
exports.extractCandidateDetails = void 0;
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// export const extractCandidateDetails = async (text: string) => {
//   try {
//     const prompt = `
//       Extract the full name, email, and phone number of the candidate from the following resume text.
//       - Ensure the name is the actual candidate's name, NOT an address, skill, or company name.
//       - If multiple names exist, choose the one that appears under "Name" or "Personal Information."
//       - Provide the response strictly in JSON format.
//       Resume Text:
//       """
//       ${text}
//       """
//       Example JSON output:
//       {
//         "name": "John Doe",
//         "email": "johndoe@gmail.com",
//         "phone": "+1 123 456 7890"
//       }
//     `;
//     const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Use Gemini Pro model
//     const result = await model.generateContent(prompt);
//     const content = result.response.text();
//     if (!content) throw new Error("Empty response from Gemini");
//     const parsedData = JSON.parse(content);
//     return {
//       name: parsedData.name || "",
//       email: parsedData.email || "",
//       phone: parsedData.phone || "",
//     };
//   } catch (error) {
//     console.error("Error extracting candidate details:", error);
//     return { name: "", email: "", phone: "" };
//   }
// };
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const extractCandidateDetails = (text) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        console.log("Extracted Resume Text:", text); // Log the extracted text
        if (!text || text.trim().length === 0) {
            throw new Error("No text extracted from resume");
        }
        const prompt = `
      Extract the following details from the resume text:

      - Full name
      - Email
      - Phone number
      - Skills (At least 3 relevant skills)
      - Work Experience (Include 'title', 'company', and 'duration' for each job)

      Provide the response strictly in **valid JSON format**.

      Resume Text:
      """
      ${text}
      """

      Example JSON output:
      {
        "name": "John Doe",
        "email": "johndoe@gmail.com",
        "phone": "+1 123 456 7890",
        "skills": ["JavaScript", "React", "Node.js"],
        "work_experience": [
          {
            "title": "Software Engineer",
            "company": "Tech Corp",
            "duration": "Jan 2020 - Dec 2023"
          },
          {
            "title": "Frontend Developer",
            "company": "Web Solutions",
            "duration": "Feb 2018 - Dec 2019"
          }
        ]
      }
    `;
        console.log("Sending prompt to OpenAI...");
        const response = yield openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: prompt }],
            temperature: 0.1,
        });
        const content = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
        console.log("Raw OpenAI Response:", content); // Log OpenAI's raw response
        if (!content) {
            throw new Error("Empty response from OpenAI");
        }
        // Extract JSON part from OpenAI response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Invalid JSON response from OpenAI");
        }
        const parsedData = JSON.parse(jsonMatch[0]);
        console.log("Parsed Data:", parsedData); // Log the parsed data
        return {
            name: parsedData.name || "",
            email: parsedData.email || "",
            phone: parsedData.phone || "",
            skills: parsedData.skills || [],
            work_experience: parsedData.work_experience || [],
        };
    }
    catch (error) {
        console.error("Error extracting candidate details:", error);
        return {
            name: "",
            email: "",
            phone: "",
            skills: [],
            work_experience: [],
        };
    }
});
exports.extractCandidateDetails = extractCandidateDetails;
