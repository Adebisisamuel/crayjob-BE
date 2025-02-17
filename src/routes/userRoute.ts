import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationCode,
  getUser,
} from "../controllers/userController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login-user", loginUser);
router.get("/me", authenticateUser, getUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-code", resendVerificationCode);

export default router;
