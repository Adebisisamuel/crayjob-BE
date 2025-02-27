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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCallFeedback = exports.getCallFeedback = void 0;
const responseHandler_1 = require("../utils/responseHandler");
const jobModel_1 = __importDefault(require("../models/jobModel"));
const callFeedbackModel_1 = __importDefault(require("../models/callFeedbackModel"));
const getCallFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const jobId = req.params.jobId;
        const candidateId = req.params.candidateId;
        if (!jobId) {
            res
                .status(400)
                .json((0, responseHandler_1.errorResponse)("Job ID is required in the request body."));
            return;
        }
        const job = yield jobModel_1.default.findOne({ _id: jobId, userId: req.user.id });
        if (!job) {
            res.status(404).json((0, responseHandler_1.errorResponse)("Job not found or Unauthorized"));
            return;
        }
        if (candidateId) {
            const feedback = yield callFeedbackModel_1.default.findOne({ candidateId, jobId });
            if (!feedback) {
                res
                    .status(404)
                    .json((0, responseHandler_1.errorResponse)("Feedback not found for the specified candidate and job."));
                return;
            }
            res.json((0, responseHandler_1.successResponse)("Feedback retrieved successfully", feedback));
            return;
        }
        else {
            const feedbacks = yield callFeedbackModel_1.default.find({ jobId });
            if (!feedbacks || feedbacks.length === 0) {
                res
                    .status(404)
                    .json((0, responseHandler_1.errorResponse)("No feedback found for the specified job."));
                return;
            }
            res.json((0, responseHandler_1.successResponse)("Feedbacks retrieved successfully", feedbacks));
            return;
        }
    }
    catch (error) {
        console.error("Error getting call feedback", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
        return;
    }
});
exports.getCallFeedback = getCallFeedback;
const getAllCallFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const jobId = req.params.jobId;
        if (!jobId) {
            res.status(400).json((0, responseHandler_1.errorResponse)("Job ID is required"));
            return;
        }
        const job = yield jobModel_1.default.findOne({ _id: jobId, userId: req.user.id });
        if (!job) {
            res.status(404).json((0, responseHandler_1.errorResponse)("Job not found or Unauthorized"));
            return;
        }
        const feedbacks = yield callFeedbackModel_1.default.find({ jobId });
        if (!feedbacks || feedbacks.length === 0) {
            res
                .status(404)
                .json((0, responseHandler_1.errorResponse)("No feedback found for the specified job."));
            return;
        }
        res.json((0, responseHandler_1.successResponse)("Feedbacks retrieved successfully", feedbacks));
        return;
    }
    catch (error) {
        console.error("Error getting call feedback", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
        return;
    }
});
exports.getAllCallFeedback = getAllCallFeedback;
