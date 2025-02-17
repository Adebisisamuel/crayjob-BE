import express from "express";
import { callCandidates, vapiCallback } from "../controllers/aiController";

const router = express.Router();

router.post("/call", callCandidates);
router.post("/callback", vapiCallback);

export default router;
