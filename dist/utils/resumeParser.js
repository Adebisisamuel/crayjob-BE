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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
function parsePdf(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const dataBuffer = fs_1.default.readFileSync(filePath);
        const data = yield (0, pdf_parse_1.default)(dataBuffer);
        return data.text;
    });
}
function parseWord(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = fs_1.default.readFileSync(filePath);
        const result = yield mammoth_1.default.extractRawText({ buffer: data });
        return result.value;
    });
}
function parseFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const extension = (_a = filePath.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            switch (extension) {
                case "pdf":
                    return yield parsePdf(filePath);
                case "docx":
                    return yield parseWord(filePath);
                default:
                    throw new Error("Unsupported file type.");
            }
        }
        catch (error) {
            console.error("Error parsing resume:", error);
            throw new Error("Error parsing resume");
        }
    });
}
exports.default = parseFile;
