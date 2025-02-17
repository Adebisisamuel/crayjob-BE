import { Request, Response } from "express";
import AWS from "aws-sdk";
import mammoth from "mammoth";
import mongoose from "mongoose";
import multer from "multer";
import pdfParse from "pdf-parse";

import { AuthRequest } from "../Types/authTypes";
import ResumeModel from "../models/resumeModel";
import JobModel from "../models/jobModel";
import { extractCandidateDetails } from "../utils/resumeParser";
import { errorResponse, successResponse } from "../utils/responseHandler";

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

      const { jobId } = req.body;
      console.log("Received Job ID:", jobId);
      console.log("Authenticated User ID:", req.user!.id);
      if (!jobId) {
        res.status(400).json(errorResponse("JobId is Required"));
        return;
      }
      const job = await JobModel.find({
        _id: jobId,
        userId: req.user!.id,
      });
      if (!job) {
        res.status(404).json(errorResponse("Job not found or Unauthorized"));
        return;
      }
      console.log("Job Found:", job);

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
            jobId,
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

export const getCandidateByJobs = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      res.status(400).json({ message: "Invalid Ticket ID format" });
      return;
    }

    const candidates = await ResumeModel.find({ jobId }).select(
      "name email phone"
    );

    if (candidates.length === 0) {
      res.status(404).json({ message: "No candidates found for this ticket" });
      return;
    }

    res.status(200).json({ candidates });
    return;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
