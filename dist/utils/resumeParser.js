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
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCandidateDetails = void 0;
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const extractCandidateDetails = (text) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prompt = `
      Extract the full name, email, and phone number of the candidate from the following resume text.

      - Ensure the name is the actual candidate's name, NOT an address, skill, or company name.
      - If multiple names exist, choose the one that appears under "Name" or "Personal Information."
      - Provide the response strictly in JSON format.

      Resume Text:
      """ 
      ${text} 
      """

      Example JSON output:
      {
        "name": "John Doe",
        "email": "johndoe@gmail.com",
        "phone": "+1 123 456 7890"
      }
    `;
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Use Gemini Pro model
        const result = yield model.generateContent(prompt);
        const content = result.response.text();
        if (!content)
            throw new Error("Empty response from Gemini");
        const parsedData = JSON.parse(content);
        return {
            name: parsedData.name || "",
            email: parsedData.email || "",
            phone: parsedData.phone || "",
        };
    }
    catch (error) {
        console.error("Error extracting candidate details:", error);
        return { name: "", email: "", phone: "" };
    }
});
exports.extractCandidateDetails = extractCandidateDetails;
// import OpenAI from "openai";
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });
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
//     const response = await openai.chat.completions.create({
//       model: "gpt-4",
//       messages: [{ role: "system", content: prompt }],
//       temperature: 0.1,
//     });
//     const content = response.choices[0]?.message?.content?.trim();
//     if (!content) {
//       throw new Error("Empty response from OpenAI");
//     }
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
