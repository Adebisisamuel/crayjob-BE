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
const upload = multer({ storage: multer.memoryStorage() }).array("files", 50);

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
      const duplicatesFound = [];

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

          // Check for duplicate phone number for the same job.
          if (phone) {
            const duplicate = await ResumeModel.findOne({ jobId, phone });
            if (duplicate) {
              duplicatesFound.push({ fileName: file.originalname, phone });
              // Skip this resume and continue processing other files.
              continue;
            }
          }

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
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

export const getCandidateByJobs = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      res.status(400).json({ message: "Invalid Job ID format" });
      return;
    }

    // Include 'status' along with name, email, and phone.
    const candidates = await ResumeModel.find({ jobId });

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
