import express from "express";
import {
  //   extractResumesDetails,
  uploadMiddleware,
  uploadResumes,
} from "../controllers/resumeController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/upload", authenticateUser, uploadMiddleware, uploadResumes);
// router.post("/extract-resumes", extractResumesDetails);

export default router;
