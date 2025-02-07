"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resumeController_1 = require("../controllers/resumeController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/upload", authMiddleware_1.authenticateUser, resumeController_1.uploadMiddleware, resumeController_1.uploadResumes);
router.post("/extract-resumes", resumeController_1.extractResumesDetails);
exports.default = router;
