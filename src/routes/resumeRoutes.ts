import express from "express";
import {
  deleteCandidate,
  getCandidateByJobs,
  updateCandidateDetails,
  //   // getResumesByTicket,
  uploadResumes,
} from "../controllers/resumeController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/upload", authenticateUser, uploadResumes);
// router.get("/get-resumes/:ticketId", authenticateUser, getResumesByTicket);
router.get("/get-candidates/:jobId", authenticateUser, getCandidateByJobs);
router.put(
  "/update-candidate/:candidateId",
  authenticateUser,
  updateCandidateDetails
);
router.delete(
  "/delete-candidate/:candidateId",
  authenticateUser,
  deleteCandidate
);

export default router;
