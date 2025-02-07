import fs from "fs";
import pdf from "pdf-parse";
import mammoth from "mammoth";

async function parsePdf(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

async function parseWord(filePath: string): Promise<string> {
  const data = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer: data });
  return result.value;
}

async function parseFile(filePath: string): Promise<string> {
  try {
    const extension = filePath.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return await parsePdf(filePath);
      case "docx":
        return await parseWord(filePath);
      default:
        throw new Error("Unsupported file type.");
    }
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw new Error("Error parsing resume");
  }
}

export default parseFile;
