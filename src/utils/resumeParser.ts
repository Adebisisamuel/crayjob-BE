// import pdfParse from "pdf-parse";
// import * as textract from "textract";

// interface ResumeDetails {
//   name: string | null;
//   email: string | null;
//   phone: string | null;
// }

// /**
//  * Extracts text from a given file (PDF, DOCX, or TXT)
//  * @param filePath - The path of the resume file
//  * @returns Extracted text from the file
//  */
// const extractText = async (filePath: string): Promise<string> => {
//   const ext = filePath.split(".").pop()?.toLowerCase();

//   if (!ext) throw new Error("Invalid file extension");

//   if (ext === "pdf") {
//     const data = await pdfParse(filePath);
//     return data.text;
//   } else if (ext === "doc" || ext === "docx" || ext === "txt") {
//     return new Promise((resolve, reject) => {
//       textract.fromFileWithPath(filePath, (error: any, text: any) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve(text || "");
//         }
//       });
//     });
//   } else {
//     throw new Error("Unsupported file format");
//   }
// };

// /**
//  * Extracts key details (name, email, phone) from resume text
//  * @param text - Extracted text from the resume
//  * @returns Parsed resume details
//  */
// const parseDetails = (text: string): ResumeDetails => {
//   const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
//   const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3}[-.\s]?\d{3,4}/g;
//   const nameRegex = /(?<=\bName[:\s]*)[A-Z][a-z]+\s[A-Z][a-z]+/g; // Basic pattern for names

//   const emails = text.match(emailRegex) || [];
//   const phones = text.match(phoneRegex) || [];
//   const names = text.match(nameRegex) || [];

//   return {
//     name: names.length > 0 ? names[0] : null,
//     email: emails.length > 0 ? emails[0] : null,
//     phone: phones.length > 0 ? phones[0] : null,
//   };
// };

// /**
//  * Parses a resume file to extract relevant details
//  * @param filePath - The path of the resume file
//  * @returns Parsed details (name, email, phone)
//  */
// const parseFile = async (filePath: string): Promise<ResumeDetails> => {
//   try {
//     const text = await extractText(filePath);
//     return parseDetails(text);
//   } catch (error) {
//     console.error("Error parsing resume:", error);
//     return { name: null, email: null, phone: null };
//   }
// };

// export default parseFile;
