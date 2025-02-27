"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const feedbackController_1 = require("../controllers/feedbackController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get("/get-feedback/:jobId/:candidateId", authMiddleware_1.authenticateUser, feedbackController_1.getCallFeedback);
router.get("/get-feedback/:jobId", authMiddleware_1.authenticateUser, feedbackController_1.getAllCallFeedback);
exports.default = router;
