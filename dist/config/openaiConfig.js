"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const OpenAI = require("openai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// const { OPENAI_API_KEY } = require("./config");
const configuration = {
    apiKey: process.env.OPENAI_API_KEY,
};
const openai = new OpenAI(configuration);
// module.exports = openai;
exports.default = openai;
