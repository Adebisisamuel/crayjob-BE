import express from "express";
import {
  createJob,
  deleteJob,
  getAllJob,
  getJob,
  updateJob,
} from "../controllers/jobController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/create-job", authenticateUser, createJob);
router.get("/get-all", authenticateUser, getAllJob);
router.get("/getone-ticket/:id", authenticateUser, getJob);
router.put("/update-ticket/:id", authenticateUser, updateJob);
router.delete("/delete-ticket/:id", authenticateUser, deleteJob);

export default router;
