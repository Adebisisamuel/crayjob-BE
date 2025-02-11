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
