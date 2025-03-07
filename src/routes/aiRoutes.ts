import express from "express";
import {
  bolnaCallback,
  callCandidates,
  getTotalEngagementStats,
} from "../controllers/aiController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/call", authenticateUser, callCandidates);
router.post("/callback", bolnaCallback);
router.get("/ai-stats", authenticateUser, getTotalEngagementStats);

export default router;
