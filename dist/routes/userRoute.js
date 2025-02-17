"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/register", userController_1.registerUser);
router.post("/login-user", userController_1.loginUser);
router.get("/me", authMiddleware_1.authenticateUser, userController_1.getUser);
router.post("/verify-email", userController_1.verifyEmail);
router.post("/resend-code", userController_1.resendVerificationCode);
exports.default = router;
