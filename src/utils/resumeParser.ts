// import { GoogleGenerativeAI } from "@google/generative-ai";

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

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const extractCandidateDetails = async (text: string) => {
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

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsedData = JSON.parse(content);

    return {
      name: parsedData.name || "",
      email: parsedData.email || "",
      phone: parsedData.phone || "",
    };
  } catch (error) {
    console.error("Error extracting candidate details:", error);
    return { name: "", email: "", phone: "" };
  }
};

export const extractCallDetails = async (transcript: any) => {
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
  "recommendations": "Hiring recommendation based on the conversation"
}

Use only the information provided in the transcript. If any field cannot be extracted, set its value to null.
Here is the transcript:
"""
${transcript}
"""
Ensure your output is strictly valid JSON and nothing else.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsedData = JSON.parse(content);
    return parsedData;
  } catch (error) {
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
};
