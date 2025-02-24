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
exports.deleteCandidate = exports.getCandidateByJobs = exports.uploadResumes = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const mammoth_1 = __importDefault(require("mammoth"));
const mongoose_1 = __importDefault(require("mongoose"));
const multer_1 = __importDefault(require("multer"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const resumeModel_1 = __importDefault(require("../models/resumeModel"));
const jobModel_1 = __importDefault(require("../models/jobModel"));
const resumeParser_1 = require("../utils/resumeParser");
const responseHandler_1 = require("../utils/responseHandler");
// Configure AWS S3
const s3 = new aws_sdk_1.default.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
// Set up Multer storage
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() }).array("files", 50);
const uploadResumes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        upload(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            if (err)
                return res
                    .status(500)
                    .json({ message: "File upload failed", error: err });
            const { jobId } = req.body;
            console.log("Received Job ID:", jobId);
            console.log("Authenticated User ID:", req.user.id);
            if (!jobId) {
                res.status(400).json((0, responseHandler_1.errorResponse)("JobId is Required"));
                return;
            }
            const job = yield jobModel_1.default.find({
                _id: jobId,
                userId: req.user.id,
            });
            if (!job) {
                res.status(404).json((0, responseHandler_1.errorResponse)("Job not found or Unauthorized"));
                return;
            }
            console.log("Job Found:", job);
            const files = req.files;
            if (!files || files.length === 0)
                return res.status(400).json((0, responseHandler_1.errorResponse)("No files uploaded"));
            const recruiterId = req.user.id;
            const uploadedResumes = [];
            const duplicatesFound = [];
            for (const file of files) {
                try {
                    const fileBuffer = file.buffer;
                    const fileName = `${Date.now()}-${file.originalname}`;
                    const fileExtension = (_a = file.originalname
                        .split(".")
                        .pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                    // Upload file to AWS S3
                    const uploadParams = {
                        Bucket: process.env.AWS_S3_BUCKET_NAME,
                        Key: `resumes/${fileName}`,
                        Body: fileBuffer,
                        ContentType: file.mimetype,
                    };
                    const s3Upload = yield s3.upload(uploadParams).promise();
                    const fileUrl = s3Upload.Location;
                    let extractedText = "";
                    if (fileExtension === "pdf") {
                        extractedText = (yield (0, pdf_parse_1.default)(fileBuffer)).text;
                    }
                    else if (fileExtension === "docx") {
                        extractedText = (yield mammoth_1.default.extractRawText({ buffer: fileBuffer })).value;
                    }
                    else {
                        console.warn(`Skipping unsupported file: ${file.originalname}`);
                        continue;
                    }
                    console.log("Extracted Resume Text:", extractedText);
                    const { name, email, phone } = yield (0, resumeParser_1.extractCandidateDetails)(extractedText);
                    // Check for duplicate phone number for the same job.
                    if (phone) {
                        const duplicate = yield resumeModel_1.default.findOne({ jobId, phone });
                        if (duplicate) {
                            duplicatesFound.push({ fileName: file.originalname, phone });
                            // Skip this resume and continue processing other files.
                            continue;
                        }
                    }
                    // Save resume details in MongoDB
                    const newResume = new resumeModel_1.default({
                        userId: recruiterId,
                        jobId,
                        filename: file.originalname,
                        fileUrl,
                        name,
                        email,
                        phone,
                    });
                    yield newResume.save();
                    uploadedResumes.push(newResume);
                }
                catch (fileError) {
                    console.error(`Error processing file ${file.originalname}:`, fileError);
                    continue;
                }
            }
            // Prepare the response. You could return both successes and duplicates.
            const responseData = {
                uploadedResumes,
                duplicatesFound,
            };
            let message = "Resumes uploaded successfully.";
            if (duplicatesFound.length > 0) {
                message += ` ${duplicatesFound.length} duplicate resume(s) were skipped.`;
            }
            res.status(201).json({
                message,
                data: responseData,
            });
            return;
        }));
    }
    catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});
exports.uploadResumes = uploadResumes;
const getCandidateByJobs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { jobId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(jobId)) {
            res.status(400).json({ message: "Invalid Job ID format" });
            return;
        }
        // Include 'status' along with name, email, and phone.
        const candidates = yield resumeModel_1.default.find({ jobId });
        if (candidates.length === 0) {
            res.status(404).json({ message: "No candidates found for this ticket" });
            return;
        }
        res.status(200).json({ candidates });
        return;
    }
    catch (error) {
        console.error("Error fetching candidates:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});
exports.getCandidateByJobs = getCandidateByJobs;
const deleteCandidate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { candidateId } = req.params;
        if (!req.user) {
            res.status(404).json((0, responseHandler_1.errorResponse)("Unauthorized"));
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(candidateId)) {
            res.status(400).json((0, responseHandler_1.errorResponse)("Invalid Id format"));
            return;
        }
        const deleteResume = yield resumeModel_1.default.findOneAndDelete({
            _id: candidateId,
            userId: req.user.id,
        });
        if (!deleteResume) {
            res
                .status(401)
                .json((0, responseHandler_1.errorResponse)("Candidate not found or unauthorized"));
            return;
        }
        res.status(200).json((0, responseHandler_1.successResponse)("Candidate Deleted Successfully"));
    }
    catch (error) {
        console.log("Error Deleting Resume", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
    }
});
exports.deleteCandidate = deleteCandidate;
