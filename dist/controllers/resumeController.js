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
exports.getResumesByTicket = exports.uploadResumes = exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const resumeModel_1 = __importDefault(require("../models/resumeModel"));
const responseHandler_1 = require("../utils/responseHandler");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default,
    params: {
        folder: "resumes",
        resource_type: "raw",
    },
});
const upload = (0, multer_1.default)({ storage });
exports.uploadMiddleware = upload.array("resumes", 50);
const uploadResumes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json((0, responseHandler_1.errorResponse)("Unauthorized: User not found"));
            return;
        }
        const { ticketId } = req.body;
        if (!ticketId) {
            res.status(400).json((0, responseHandler_1.errorResponse)("Ticket ID is required"));
            return;
        }
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json((0, responseHandler_1.errorResponse)("No resumes uploaded"));
            return;
        }
        const existingResumesCount = yield resumeModel_1.default.countDocuments({ ticketId });
        if (existingResumesCount + req.files.length > 50) {
            res
                .status(400)
                .json((0, responseHandler_1.errorResponse)("Cannot upload more than 50 resumes per ticket"));
            return;
        }
        const uploadedFiles = yield Promise.all(req.files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const fileExtension = file.originalname.split(".").pop();
            const publicId = `resumes/${file.filename}-${Date.now()}.${fileExtension}`;
            const result = yield cloudinary_1.default.uploader.upload(file.path, {
                folder: "resumes",
                resource_type: "raw",
                public_id: publicId,
                format: fileExtension,
            });
            return {
                userId: req.user.id,
                ticketId,
                filename: file.originalname,
                fileUrl: result.secure_url,
            };
        })));
        const savedResumes = yield resumeModel_1.default.insertMany(uploadedFiles);
        res
            .status(201)
            .json((0, responseHandler_1.successResponse)("Resumes uploaded successfully", savedResumes));
        return;
    }
    catch (error) {
        console.error("Error uploading resumes:", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Upload failed"));
        return;
    }
});
exports.uploadResumes = uploadResumes;
const getResumesByTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () { });
exports.getResumesByTicket = getResumesByTicket;
