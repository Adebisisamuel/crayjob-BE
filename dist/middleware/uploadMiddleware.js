"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResumes = void 0;
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        }
        else {
            cb(new Error("Only PDF files are allowed"));
        }
    },
});
exports.uploadResumes = upload.array("resumes", 50);
