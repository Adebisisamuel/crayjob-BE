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
exports.getTotalCandidate = exports.getClosedJob = exports.getActiveJob = exports.deleteJob = exports.updateJob = exports.getJob = exports.getAllJob = exports.createJob = void 0;
const jobModel_1 = require("../models/jobModel");
const responseHandler_1 = require("../utils/responseHandler");
const resumeModel_1 = __importDefault(require("../models/resumeModel"));
const createJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyName, jobTitle, jobDescription, screeningQuestions, locationType, location, } = req.body;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const allowedLocationTypes = ["Remote", "On-site", "Hybrid"];
        if (!allowedLocationTypes.includes(locationType)) {
            res.status(400).json({
                message: "Invalid locationType. Use 'Remote', 'On-site', or 'Hybrid'.",
            });
            return;
        }
        if (!location || !location.country || !location.state) {
            res.status(400).json({
                message: "Location (country, state) is required.",
            });
            return;
        }
        // if (!country || !countryCode || !state) {
        //   res
        //     .status(400)
        //     .json({ message: "Country, countryCode, and state are required." });
        //   return;
        // }
        const job = new jobModel_1.Job({
            userId: req.user.id,
            companyName,
            jobTitle,
            jobDescription,
            locationType,
            screeningQuestions,
            location,
        });
        yield job.save();
        res.status(201).json((0, responseHandler_1.successResponse)("Job created successfully", job));
        return;
    }
    catch (error) {
        console.error("Error creating job:", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
        return;
    }
});
exports.createJob = createJob;
const getAllJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const jobs = yield jobModel_1.Job.find({ userId: req.user.id });
        const jobIds = jobs.map((job) => job._id);
        if (jobIds.length === 0) {
            res.json((0, responseHandler_1.successResponse)("All jobs retrieved successfully", []));
            return;
        }
        // Aggregate resumes to get counts grouped by jobId and status.
        // Use $ifNull to default missing status fields to "queue".
        const resumeStatusCounts = yield resumeModel_1.default.aggregate([
            { $match: { jobId: { $in: jobIds } } },
            {
                $group: {
                    _id: {
                        jobId: "$jobId",
                        status: { $ifNull: ["$status", "queue"] },
                    },
                    count: { $sum: 1 },
                },
            },
        ]);
        // Build a mapping of jobId to its candidatesStatus counts.
        const candidatesStatusMap = {};
        resumeStatusCounts.forEach((item) => {
            const jobIdStr = item._id.jobId.toString();
            if (!candidatesStatusMap[jobIdStr]) {
                candidatesStatusMap[jobIdStr] = {};
            }
            candidatesStatusMap[jobIdStr][item._id.status] = item.count;
        });
        // Default statuses with all counts set to 0
        const defaultStatuses = {
            queue: 0,
            "in-progress": 0,
            unreachable: 0,
            shortlisted: 0,
            rejected: 0,
            "in-review": 0,
            "needs-hr-review": 0,
        };
        // Attach the candidatesStatus counts to each job, merging default statuses with any actual counts.
        const jobsWithCounts = jobs.map((job) => {
            const jobObj = job.toObject();
            const jobIdStr = job.id; // using Mongoose's virtual getter 'id'
            jobObj.candidatesStatus = Object.assign(Object.assign({}, defaultStatuses), (candidatesStatusMap[jobIdStr] || {}));
            return jobObj;
        });
        res.json((0, responseHandler_1.successResponse)("All jobs retrieved successfully", jobsWithCounts));
    }
    catch (error) {
        console.log("Error retrieving jobs", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
    }
});
exports.getAllJob = getAllJob;
const getJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(400).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const job = yield jobModel_1.Job.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!job) {
            res.status(400).json((0, responseHandler_1.errorResponse)("Job not found or Unauthorized"));
            return;
        }
        res.json((0, responseHandler_1.successResponse)("Job retrieved successfully", job));
    }
    catch (error) {
        console.log("Error getting job", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
    }
});
exports.getJob = getJob;
const updateJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const job = yield jobModel_1.Job.findOneAndUpdate({
            _id: req.params.id,
            user: req.user.id,
        }, { $set: req.body }, { new: true, runValidators: true });
        if (!job) {
            res.status(404).json((0, responseHandler_1.errorResponse)("Ticket not found or unauthorized"));
        }
        res.json((0, responseHandler_1.successResponse)("Job Updated Successfully", job));
        return;
    }
    catch (error) {
        console.log("Error Updating Job", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
    }
});
exports.updateJob = updateJob;
const deleteJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const job = yield jobModel_1.Job.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!job) {
            res.status(404).json((0, responseHandler_1.errorResponse)("Job not found or unauthorized"));
            return;
        }
        res.status(200).json((0, responseHandler_1.successResponse)("Job Deleted Successfully"));
        return;
    }
    catch (error) {
        console.log("Error deleteing Job", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
        return;
    }
});
exports.deleteJob = deleteJob;
const getActiveJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const activeJobs = yield jobModel_1.Job.find({
            userId: req.user.id,
            jobStatus: "active",
        });
        const totalActiveJobs = activeJobs.length;
        res.status(200).json((0, responseHandler_1.successResponse)("Active Jobs retrieved successfully", {
            totalActiveJobs,
            jobs: activeJobs,
        }));
        return;
    }
    catch (error) {
        console.error("Error getting active Jobs", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
        return;
    }
});
exports.getActiveJob = getActiveJob;
const getClosedJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const closedJobs = yield jobModel_1.Job.find({
            userId: req.user.id,
            jobStatus: "closed",
        });
        const totalClosedJobs = closedJobs.length;
        res.status(200).json((0, responseHandler_1.successResponse)("Closed Jobs retrieved successfully", {
            totalClosedJobs,
            jobs: closedJobs,
        }));
        return;
    }
    catch (error) {
        console.error("Error getting closed Jobs", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
        return;
    }
});
exports.getClosedJob = getClosedJob;
const getTotalCandidate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(404).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        const jobs = yield jobModel_1.Job.find({ userId: req.user.id });
        const jobIds = jobs.map((job) => job._id);
        if (jobIds.length === 0) {
            res
                .status(401)
                .json((0, responseHandler_1.successResponse)("No candidate found", { totalCandidate: 0 }));
            return;
        }
        const totalCandidate = yield resumeModel_1.default.countDocuments({
            jobId: { $in: jobIds },
        });
        res.json((0, responseHandler_1.successResponse)("Total candidates retrieved successfully", {
            totalCandidate,
        }));
        return;
    }
    catch (error) {
        console.log("Error fetching total candidates", error);
        res.status(500).json("Internal Server Error");
    }
});
exports.getTotalCandidate = getTotalCandidate;
