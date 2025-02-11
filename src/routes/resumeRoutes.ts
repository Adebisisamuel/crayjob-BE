import express from "express";
import {
  //   // getResumesByTicket,
  uploadResumes,
} from "../controllers/resumeController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/upload", authenticateUser, uploadResumes);
// router.get("/get-resumes/:ticketId", authenticateUser, getResumesByTicket);

export default router;
