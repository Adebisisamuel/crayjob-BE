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
exports.extractCallDetails = exports.extractCandidateDetails = void 0;
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
const extractCallDetails = (transcript, jobDescription, candidateSkills, workExperience) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const prompt = `
      You are an expert HR assistant. Given the transcript of a candidate call below, extract and output a JSON object with the following keys exactly:

      {
        "screeningQA": {
          "assistant": "user's response",
          "Question 2": "Candidate's response"
          // include all questions answered during the call
        },
        "summary": "A short overall summary of the candidate's responses",
        "strengths": "Key strengths identified from the conversation",
        "areasOfImprovement": "Areas where the candidate could improve",
        "recommendations": {
          "detailedWriteup": "A detailed recommendation write-up based on the conversation",
          "finalDecision": "Either 'hire' or 'reject' based on the conversation"
        }
      }

      Additionally, consider the following:
      - **Job Description**: Here are the key requirements for the position:
      ${jobDescription}

      - **Candidate Skills**: Here are the candidate’s relevant skills:
      ${candidateSkills.join(", ")}

      - **Work Experience**: Here are the details about the candidate’s work experience:
      ${JSON.stringify(workExperience)}

      Please ensure the following:
      - Be **fair and balanced** in your assessment. Avoid being too strict, and provide an objective evaluation of the candidate based on their responses.
      - **Do not penalize** the candidate too harshly for minor gaps or inconsistencies in their responses. Focus on their strengths and provide constructive suggestions for improvement where applicable.
      - Consider that candidates might be nervous or have off moments during the call, so try to be understanding and give them the benefit of the doubt.

      Use only the information provided in the transcript and the details above. If any field cannot be extracted, set its value to null.
      
      Here is the transcript:
      """
      ${transcript}
      """

      After analyzing both the conversation and the job requirements, adjust the final decision ("hire" or "reject") with a fair mindset.
    `;
        const response = yield openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: prompt }],
            temperature: 0.1,
        });
        const content = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
        if (!content) {
            throw new Error("Empty response from OpenAI");
        }
        const parsedData = JSON.parse(content);
        return parsedData;
    }
    catch (error) {
        console.error("Error extracting call details:", error);
        return {
            candidateName: null,
            callTime: null,
            callStatus: null,
            screeningQA: null,
            summary: null,
            strengths: null,
            areasOfImprovement: null,
            recommendations: null,
        };
    }
});
exports.extractCallDetails = extractCallDetails;
