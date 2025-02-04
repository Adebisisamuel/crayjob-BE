import express from "express";
import {
  createTicket,
  deleteTicket,
  getAllTicket,
  getTicket,
  updateTicket,
} from "../controllers/ticketController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/create-ticket", authenticateUser, createTicket);
router.get("/get-all", authenticateUser, getAllTicket);
router.get("/getone-ticket/:id", authenticateUser, getTicket);
router.put("/update-ticket/:id", authenticateUser, updateTicket);
router.delete("/delete-ticket/:id", authenticateUser, deleteTicket);

export default router;
