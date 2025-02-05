"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ticketController_1 = require("../controllers/ticketController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/create-ticket", authMiddleware_1.authenticateUser, ticketController_1.createTicket);
router.get("/get-all", authMiddleware_1.authenticateUser, ticketController_1.getAllTicket);
router.get("/getone-ticket/:id", authMiddleware_1.authenticateUser, ticketController_1.getTicket);
router.put("/update-ticket/:id", authMiddleware_1.authenticateUser, ticketController_1.updateTicket);
router.delete("/delete-ticket/:id", authMiddleware_1.authenticateUser, ticketController_1.deleteTicket);
exports.default = router;
