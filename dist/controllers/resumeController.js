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
exports.extractResumesDetails = exports.uploadMiddleware = exports.uploadResumes = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const resumeModel_1 = __importDefault(require("../models/resumeModel"));
const responseHandler_1 = require("../utils/responseHandler");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const resumeParser_1 = __importDefault(require("../utils/resumeParser"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default,
    params: {
        folder: "resumes",
        resource_type: "raw",
    },
});
const upload = (0, multer_1.default)({ storage });
const uploadResumes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.files || !Array.isArray(req.files)) {
            res.status(400).json((0, responseHandler_1.errorResponse)("No files uploaded"));
            return;
        }
        const uploadedFiles = yield Promise.all(req.files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield cloudinary_1.default.uploader.upload(file.path, {
                folder: "resumes",
                resource_type: "auto",
            });
            return {
                userId: req.user.id,
                filename: file.originalname,
                fileUrl: result.secure_url,
            };
        })));
        const savedResumes = yield resumeModel_1.default.insertMany(uploadedFiles);
        res
            .status(201)
            .json((0, responseHandler_1.successResponse)("Resume Uploaded successfully", savedResumes));
        return;
    }
    catch (error) {
        console.error("Error uploading resumes:", error);
        res.status(500).json({ success: false, message: "Upload failed" });
        return;
    }
});
exports.uploadResumes = uploadResumes;
exports.uploadMiddleware = upload.array("resumes", 50);
const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
const phoneRegex = /\(?\+?[0-9]*\)?[0-9_\- \(\)]*/;
const nameRegex = /^[A-Za-z\s]+$/;
const extractResumesDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { resumeIds } = req.body;
        if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
            res
                .status(400)
                .json((0, responseHandler_1.errorResponse)("Please provide a list of resume IDs"));
            return;
        }
        const resumes = yield resumeModel_1.default.find({ _id: { $in: resumeIds } });
        if (!resumes || resumes.length === 0) {
            res.status(404).json({ message: "No resumes found" });
            return;
        }
        const extractedDataArray = yield Promise.all(resumes.map((resume) => __awaiter(void 0, void 0, void 0, function* () {
            const fileUrl = resume.fileUrl;
            const fileName = path_1.default.basename(fileUrl);
            const tempFilePath = path_1.default.join(__dirname, `../temp_files/${fileName}`);
            const response = yield (0, axios_1.default)({
                url: fileUrl,
                method: "GET",
                responseType: "stream",
            });
            const writer = fs_1.default.createWriteStream(tempFilePath);
            yield new Promise((resolve, reject) => {
                response.data.pipe(writer);
                writer.on("finish", resolve);
                writer.on("error", reject);
            });
            try {
                const fileText = yield (0, resumeParser_1.default)(tempFilePath);
                const nameMatch = fileText.match(nameRegex);
                const emailMatch = fileText.match(emailRegex);
                const phoneMatch = fileText.match(phoneRegex);
                const extractedData = {
                    resumeId: resume._id,
                    name: nameMatch ? nameMatch[0] : "Name not found",
                    email: emailMatch ? emailMatch[0] : "Email not found",
                    phone: phoneMatch ? phoneMatch[0] : "Phone number not found",
                };
                fs_1.default.unlinkSync(tempFilePath);
                return extractedData;
            }
            catch (error) {
                console.error("Error parsing resume:", error);
                fs_1.default.unlinkSync(tempFilePath);
                throw new Error("Error extracting resume details");
            }
        })));
        res.status(200).json({ success: true, extractedData: extractedDataArray });
        return;
    }
    catch (error) {
        console.error("Error extracting resume details:", error);
        res
            .status(500)
            .json({ success: false, message: "Error extracting resume details" });
        return;
    }
});
exports.extractResumesDetails = extractResumesDetails;
