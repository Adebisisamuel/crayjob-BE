"use strict";
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
