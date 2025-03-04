"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resumeController_1 = require("../controllers/resumeController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/upload", authMiddleware_1.authenticateUser, resumeController_1.uploadResumes);
// router.get("/get-resumes/:ticketId", authenticateUser, getResumesByTicket);
router.get("/get-candidates/:jobId", authMiddleware_1.authenticateUser, resumeController_1.getCandidateByJobs);
router.put("/update-candidate/:candidateId", authMiddleware_1.authenticateUser, resumeController_1.updateCandidateDetails);
router.delete("/delete-candidate/:candidateId", authMiddleware_1.authenticateUser, resumeController_1.deleteCandidate);
router.patch("/candidates/:candidateId/status", authMiddleware_1.authenticateUser, resumeController_1.updateCandidateStatus);
exports.default = router;
