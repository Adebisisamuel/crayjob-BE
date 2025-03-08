"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiController_1 = require("../controllers/aiController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/call", authMiddleware_1.authenticateUser, aiController_1.callCandidates);
router.post("/callback", aiController_1.bolnaCallback);
router.get("/ai-stats", authMiddleware_1.authenticateUser, aiController_1.getTotalEngagementStats);
exports.default = router;
