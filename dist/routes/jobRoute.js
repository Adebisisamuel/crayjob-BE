"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobController_1 = require("../controllers/jobController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/create-job", authMiddleware_1.authenticateUser, jobController_1.createJob);
router.get("/get-jobs", authMiddleware_1.authenticateUser, jobController_1.getAllJob);
router.get("/getone-ticket/:id", authMiddleware_1.authenticateUser, jobController_1.getJob);
router.put("/update-job/:id", authMiddleware_1.authenticateUser, jobController_1.updateJob);
router.delete("/delete-job/:id", authMiddleware_1.authenticateUser, jobController_1.deleteJob);
router.get("/jobs-active", authMiddleware_1.authenticateUser, jobController_1.getActiveJob);
router.get("/closed-jobs", authMiddleware_1.authenticateUser, jobController_1.getClosedJob);
router.get("/total-candidate", authMiddleware_1.authenticateUser, jobController_1.getTotalCandidate);
router.get("/rejected-candidate", authMiddleware_1.authenticateUser, jobController_1.getTotalRejectedCandidates);
exports.default = router;
