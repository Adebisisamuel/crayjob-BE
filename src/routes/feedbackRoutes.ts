import express from "express";
import {
  getAllCallFeedback,
  getCallFeedback,
} from "../controllers/feedbackController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.get(
  "/get-feedback/:jobId/:candidateId",
  authenticateUser,
  getCallFeedback
);

router.get("/get-feedback/:jobId", authenticateUser, getAllCallFeedback);

export default router;
