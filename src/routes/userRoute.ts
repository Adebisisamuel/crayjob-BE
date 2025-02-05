import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationCode,
} from "../controllers/userController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login-user", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-code", resendVerificationCode);

export default router;
