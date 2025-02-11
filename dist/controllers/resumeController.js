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
exports.uploadResumes = void 0;
const multer_1 = __importDefault(require("multer"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const resumeModel_1 = __importDefault(require("../models/resumeModel"));
const ticketModel_1 = __importDefault(require("../models/ticketModel"));
const resumeParser_1 = require("../utils/resumeParser");
const responseHandler_1 = require("../utils/responseHandler");
// Configure AWS S3
const s3 = new aws_sdk_1.default.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
// Set up Multer storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage }).array("resumes", 50);
const uploadResumes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        upload(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            if (err)
                return res
                    .status(500)
                    .json({ message: "File upload failed", error: err });
            const { ticketId } = req.body;
            console.log("Received Ticket ID:", ticketId);
            console.log("Authenticated User ID:", req.user.id);
            if (!ticketId) {
                res.status(400).json((0, responseHandler_1.errorResponse)("TicketId is Required"));
                return;
            }
            const ticket = yield ticketModel_1.default.find({
                _id: ticketId,
                userId: req.user.id,
            });
            if (!ticket) {
                res.status(404).json((0, responseHandler_1.errorResponse)("Ticket not found or Unauthorized"));
                return;
            }
            console.log("Ticket Found:", ticket);
            const files = req.files;
            if (!files || files.length === 0)
                return res.status(400).json((0, responseHandler_1.errorResponse)("No files uploaded"));
            const recruiterId = req.user.id;
            const uploadedResumes = [];
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
                    // Save resume details in MongoDB
                    const newResume = new resumeModel_1.default({
                        userId: recruiterId,
                        ticketId,
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
            res.status(201).json({
                message: "Resumes uploaded successfully",
                data: uploadedResumes,
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
// export const getResumesByTicket = async (req: AuthRequest, res: Response) => {
//   try {
//     const { ticketId } = req.params;
//     if (!ticketId) {
//       res.status(400).json(errorResponse("Ticket ID is required"));
//       return;
//     }
//     const resumes = await Resume.find({ ticketId });
//     res
//       .status(200)
//       .json(successResponse("Resumes retrieved successfully", resumes));
//     return;
//   } catch (error) {
//     console.log("Error fetching Resume", error);
//     res.status(500).json(errorResponse("Internal Server Error"));
//   }
// };
