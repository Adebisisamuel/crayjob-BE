"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTicket = exports.updateTicket = exports.getTicket = exports.getAllTicket = exports.createTicket = void 0;
const ticketModel_1 = require("../models/ticketModel");
const responseHandler_1 = require("../utils/responseHandler");
const createTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { jobTitle, jobDescription, screeningQuestions } = req.body;
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const ticket = new ticketModel_1.Ticket({
            user: req.user.id,
            jobTitle,
            jobDescription,
            screeningQuestions,
        });
        yield ticket.save();
        res
            .status(201)
            .json((0, responseHandler_1.successResponse)("Ticket created successfully", ticket));
    }
    catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
    }
});
exports.createTicket = createTicket;
const getAllTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const tickets = yield ticketModel_1.Ticket.find({ user: req.user.id }).populate("user", "firstName surname email");
        res.json((0, responseHandler_1.successResponse)("All tickets retrieved successfully", tickets));
    }
    catch (error) {
        console.log("Error retrieving tickets", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
    }
});
exports.getAllTicket = getAllTicket;
const getTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(400).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const ticket = yield ticketModel_1.Ticket.findOne({
            _id: req.params.id,
            user: req.user.id,
        });
        if (!ticket) {
            res.status(400).json((0, responseHandler_1.errorResponse)("Ticket not found or Unauthorized"));
            return;
        }
        res.json((0, responseHandler_1.successResponse)("Ticket retrieved successfully", ticket));
    }
    catch (error) {
        console.log("Error getting ticket", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
    }
});
exports.getTicket = getTicket;
const updateTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const ticket = yield ticketModel_1.Ticket.findOneAndUpdate({
            _id: req.params.id,
            user: req.user.id,
        }, { $set: req.body }, { new: true, runValidators: true });
        if (!ticket) {
            res.status(404).json((0, responseHandler_1.errorResponse)("Ticket not found or unauthorized"));
        }
        res.json((0, responseHandler_1.successResponse)("Ticket Updated Successfully", ticket));
        return;
    }
    catch (error) {
        console.log("Error Updating Ticket", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
    }
});
exports.updateTicket = updateTicket;
const deleteTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const ticket = yield ticketModel_1.Ticket.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id,
        });
        if (!ticket) {
            res.status(404).json((0, responseHandler_1.errorResponse)("Ticket not found or unauthorized"));
        }
        res.status(200).json((0, responseHandler_1.successResponse)("Ticket Deleted Successfully"));
    }
    catch (error) {
        console.log("Error deleteing Ticket", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
        return;
    }
});
exports.deleteTicket = deleteTicket;
