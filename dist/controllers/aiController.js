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
exports.getTotalEngagementStats = exports.bolnaCallback = exports.callCandidates = void 0;
const axios_1 = __importDefault(require("axios"));
const callFeedbackModel_1 = __importDefault(require("../models/callFeedbackModel"));
const jobModel_1 = __importDefault(require("../models/jobModel"));
const resumeModel_1 = __importDefault(require("../models/resumeModel"));
const resumeParser_1 = require("../utils/resumeParser");
const responseHandler_1 = require("../utils/responseHandler");
const callCandidates = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { jobId } = req.body;
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        if (!jobId) {
            res.status(400).json({ message: "Job ID is required" });
            return;
        }
        // Retrieve job details (including screening questions, job title, etc.)
        const job = yield jobModel_1.default.findById(jobId);
        if (!job) {
            res.status(404).json({ message: "Job not found" });
            return;
        }
        yield jobModel_1.default.findByIdAndUpdate(jobId, { jobStatus: "active" });
        // Retrieve candidates associated with the job that are NOT "shortlisted" or "in-progress"
        const candidates = yield resumeModel_1.default.find({
            jobId,
            status: { $nin: ["shortlisted"] },
        });
        if (candidates.length === 0) {
            res.status(404).json({ message: "No candidates found for this job" });
            return;
        }
        const callCustomer = (candidate) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payload = {
                    agent_id: process.env.BONLA_AGENT_ID,
                    recipient_phone_number: candidate.phone, // Ensure this is in E.164 format
                    from_phone_number: process.env.BONLA_FROM_PHONE_NUMBER,
                    user_data: {
                        candidate_id: candidate.id,
                        job_id: candidate.jobId,
                        job_title: job.jobTitle,
                        job_country: job.location.country,
                        job_state: job.location.state,
                        company_name: job.companyName,
                        user_id: candidate.userId,
                        skills: candidate.skills,
                        work_experience: candidate.work_experience,
                        screening_questions: job.screeningQuestions,
                        job_description: job.jobDescription,
                        candidate_name: candidate.name,
                    },
                };
                const response = yield axios_1.default.post(`${process.env.BONLA_API_BASE_URL}call`, payload, {
                    headers: {
                        Authorization: `Bearer ${process.env.BONLA_API_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                });
                console.log(`Response for ${candidate.name}:`, response.data);
            }
            catch (error) {
                console.error(`Error in calling ${candidate.name}:`, error.message);
            }
        });
        const calledPhones = new Set();
        for (const candidate of candidates) {
            const phone = candidate.phone;
            // Only call if phone exists and hasn't been called already
            if (phone && !calledPhones.has(phone)) {
                yield callCustomer({
                    name: (_a = candidate.name) !== null && _a !== void 0 ? _a : "Unknown Candidate",
                    phone: phone,
                    id: candidate._id,
                    jobId,
                    userId: req.user.id,
                    skills: candidate.skills,
                    work_experience: candidate.work_experience,
                });
                // Mark this phone as called
                calledPhones.add(phone);
            }
        }
        res.status(200).json({
            message: "Calls initiated successfully",
        });
        return;
    }
    catch (error) {
        console.error("Error in callCandidatesBolna:", error.message);
        next(error);
    }
});
exports.callCandidates = callCandidates;
var CandidateStatus;
(function (CandidateStatus) {
    CandidateStatus["InProgress"] = "in-progress";
    CandidateStatus["Unreachable"] = "unreachable";
    CandidateStatus["Shortlisted"] = "shortlisted";
    CandidateStatus["Rejected"] = "rejected";
    CandidateStatus["InReview"] = "in-review";
    CandidateStatus["NeedsHRReview"] = "needs-hr-review";
})(CandidateStatus || (CandidateStatus = {}));
const bolnaCallback = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const payload = req.body;
        const candidateId = (_b = (_a = payload.context_details) === null || _a === void 0 ? void 0 : _a.recipient_data) === null || _b === void 0 ? void 0 : _b.candidate_id;
        const jobId = (_d = (_c = payload.context_details) === null || _c === void 0 ? void 0 : _c.recipient_data) === null || _d === void 0 ? void 0 : _d.job_id;
        const userId = (_f = (_e = payload.context_details) === null || _e === void 0 ? void 0 : _e.recipient_data) === null || _f === void 0 ? void 0 : _f.user_id;
        // Determine initial status from the callback status
        let candidateStatus;
        switch (payload.status) {
            case "initiated":
            case "ringing":
                candidateStatus = CandidateStatus.InProgress;
                break;
            case "busy":
                candidateStatus = CandidateStatus.Unreachable;
                break;
            case "completed":
            case "success":
                // For completed calls, we will further refine the status below
                candidateStatus = CandidateStatus.InReview;
                break;
            default:
                candidateStatus = CandidateStatus.InProgress;
                break;
        }
        if (payload.transcript) {
            const job = yield jobModel_1.default.findById(jobId);
            const jobDescription = (job === null || job === void 0 ? void 0 : job.jobDescription) || "";
            const candidateSkills = ((_h = (_g = payload.context_details) === null || _g === void 0 ? void 0 : _g.recipient_data) === null || _h === void 0 ? void 0 : _h.skills) || [];
            const workExperience = ((_k = (_j = payload.context_details) === null || _j === void 0 ? void 0 : _j.recipient_data) === null || _k === void 0 ? void 0 : _k.work_experience) || [];
            const extractedData = yield (0, resumeParser_1.extractCallDetails)(payload.transcript, jobDescription, candidateSkills, workExperience);
            // Business logic for final status:
            // Business logic for final status when the call is completed:
            if (payload.status === "completed" || payload.status === "success") {
                if (extractedData.recommendations &&
                    extractedData.recommendations.finalDecision &&
                    extractedData.recommendations.finalDecision.toLowerCase() === "hire") {
                    candidateStatus = CandidateStatus.Shortlisted;
                }
                else if (extractedData.recommendations &&
                    extractedData.recommendations.finalDecision &&
                    extractedData.recommendations.finalDecision.toLowerCase() === "reject") {
                    candidateStatus = CandidateStatus.Rejected;
                }
                else {
                    // No clear decision was made so mark as needing HR review.
                    candidateStatus = CandidateStatus.NeedsHRReview;
                }
            }
            // Helper: sanitize keys by replacing dots with underscores
            const sanitizeKeys = (obj) => {
                const sanitized = {};
                for (const key in obj) {
                    sanitized[key.replace(/\./g, "_")] = obj[key];
                }
                return sanitized;
            };
            const sanitizedQA = sanitizeKeys(extractedData.screeningQA);
            const screeningQA = new Map(Object.entries(sanitizedQA));
            const updateData = {
                jobId: jobId,
                userId: userId,
                candidateId: candidateId,
                callId: payload.id,
                timeOfCall: new Date(payload.created_at),
                duration: payload.conversation_duration,
                status: payload.status,
                transcript: payload.transcript,
                summary: extractedData.summary,
                screeningQA,
                strengths: extractedData.strengths,
                areasOfImprovement: extractedData.areasOfImprovement,
                recommendations: extractedData.recommendations,
            };
            const options = { new: true, upsert: true };
            const feedbackResponse = yield callFeedbackModel_1.default.findOneAndUpdate({ jobId, candidateId }, updateData, options);
            console.log("Feedback upserted", feedbackResponse);
        }
        else {
            console.log(candidateId, jobId, userId, "No transcript provided; candidate status based solely on callback payload.");
        }
        // Update the candidate's status.
        yield resumeModel_1.default.findByIdAndUpdate(candidateId, {
            status: candidateStatus,
        });
        console.log(`Candidate ${candidateId} for job ${jobId} updated to status: ${candidateStatus}`);
        res.status(201).json({ message: "Callback processed successfully" });
    }
    catch (error) {
        console.error("Error in callCandidates:", error.message);
        next(error);
    }
});
exports.bolnaCallback = bolnaCallback;
const getTotalEngagementStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Fetch feedbacks for the specific user
        const feedbacks = yield callFeedbackModel_1.default.find({ userId: userId });
        if (!feedbacks || feedbacks.length === 0) {
            res.status(404).json({ message: "No feedback found." });
            return;
        }
        let totalCallsInitiated = 0;
        let totalCallsAnswered = 0;
        let totalCallsCompleted = 0;
        let totalShortlisted = 0;
        feedbacks.forEach((feedback) => {
            totalCallsInitiated += 1;
            if (feedback.status === "completed" || feedback.status === "success") {
                totalCallsCompleted += 1;
            }
            if (feedback.status === "initiated" || feedback.status === "ringing") {
                totalCallsAnswered += 1;
            }
            if (feedback.status === "shortlisted") {
                totalShortlisted += 1;
            }
        });
        const totalCandidates = yield resumeModel_1.default.countDocuments({
            userId: userId,
        });
        const aiEngagementPercent = totalCandidates > 0 ? (totalShortlisted / totalCandidates) * 100 : 0;
        const answeredPercent = totalCallsInitiated > 0
            ? (totalCallsAnswered / totalCallsInitiated) * 100
            : 0;
        const completedPercent = totalCallsInitiated > 0
            ? (totalCallsCompleted / totalCallsInitiated) * 100
            : 0;
        const totalEngagement = (answeredPercent + completedPercent + aiEngagementPercent) / 3;
        res
            .status(200)
            .json((0, responseHandler_1.successResponse)("Total engagement stats fetched successfully", `${totalEngagement.toFixed(2)}%`));
        return;
    }
    catch (error) {
        console.error("Error in getting total engagement stats:", error);
        next(error);
    }
});
exports.getTotalEngagementStats = getTotalEngagementStats;
