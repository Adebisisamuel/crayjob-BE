import { Request, Response } from "express";
import multer from "multer";
import AWS from "aws-sdk";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import ResumeModel from "../models/resumeModel";
import TicketModel from "../models/ticketModel";
import { extractCandidateDetails } from "../utils/resumeParser";
import { errorResponse, successResponse } from "../utils/responseHandler";
import { AuthRequest } from "../Types/authTypes";

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Set up Multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).array("resumes", 50);

export const uploadResumes = async (req: AuthRequest, res: Response) => {
  try {
    upload(req, res, async (err: any) => {
      if (err)
        return res
          .status(500)
          .json({ message: "File upload failed", error: err });

      const { ticketId } = req.body;
      console.log("Received Ticket ID:", ticketId);
      console.log("Authenticated User ID:", req.user!.id);
      if (!ticketId) {
        res.status(400).json(errorResponse("TicketId is Required"));
        return;
      }
      const ticket = await TicketModel.find({
        _id: ticketId,
        userId: req.user!.id,
      });
      if (!ticket) {
        res.status(404).json(errorResponse("Ticket not found or Unauthorized"));
        return;
      }
      console.log("Ticket Found:", ticket);

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0)
        return res.status(400).json(errorResponse("No files uploaded"));

      const recruiterId = req.user!.id;
      const uploadedResumes = [];

      for (const file of files) {
        try {
          const fileBuffer = file.buffer;
          const fileName = `${Date.now()}-${file.originalname}`;
          const fileExtension = file.originalname
            .split(".")
            .pop()
            ?.toLowerCase();

          // Upload file to AWS S3
          const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: `resumes/${fileName}`,
            Body: fileBuffer,
            ContentType: file.mimetype,
          };
          const s3Upload = await s3.upload(uploadParams).promise();
          const fileUrl = s3Upload.Location;

          let extractedText = "";

          if (fileExtension === "pdf") {
            extractedText = (await pdfParse(fileBuffer)).text;
          } else if (fileExtension === "docx") {
            extractedText = (
              await mammoth.extractRawText({ buffer: fileBuffer })
            ).value;
          } else {
            console.warn(`Skipping unsupported file: ${file.originalname}`);
            continue;
          }

          console.log("Extracted Resume Text:", extractedText);

          const { name, email, phone } = await extractCandidateDetails(
            extractedText
          );

          // Save resume details in MongoDB
          const newResume = new ResumeModel({
            userId: recruiterId,
            ticketId,
            filename: file.originalname,
            fileUrl,
            name,
            email,
            phone,
          });

          await newResume.save();
          uploadedResumes.push(newResume);
        } catch (fileError) {
          console.error(
            `Error processing file ${file.originalname}:`,
            fileError
          );
          continue;
        }
      }

      res.status(201).json({
        message: "Resumes uploaded successfully",
        data: uploadedResumes,
      });
      return;
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

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
