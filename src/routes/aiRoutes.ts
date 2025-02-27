import express from "express";
import { bolnaCallback, callCandidates } from "../controllers/aiController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/call", authenticateUser, callCandidates);
router.post("/callback", bolnaCallback);

export default router;
