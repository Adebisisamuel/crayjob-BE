import express from "express";
import {
  createJob,
  deleteJob,
  getAllJob,
  getJob,
  updateJob,
} from "../controllers/ticketController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/create-ticket", authenticateUser, createJob);
router.get("/get-all", authenticateUser, getAllJob);
router.get("/getone-ticket/:id", authenticateUser, getJob);
router.put("/update-ticket/:id", authenticateUser, updateJob);
router.delete("/delete-ticket/:id", authenticateUser, deleteJob);

export default router;
