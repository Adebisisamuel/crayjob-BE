const OpenAI = require("openai");
import dotenv from "dotenv";

dotenv.config();
// const { OPENAI_API_KEY } = require("./config");

const configuration = {
  apiKey: process.env.OPENAI_API_KEY,
};

const openai = new OpenAI(configuration);
// module.exports = openai;
export default openai;
