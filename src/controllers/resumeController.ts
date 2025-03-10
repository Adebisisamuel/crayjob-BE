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

          const { name, email, phone, location, skills, work_experience } =
            await extractCandidateDetails(extractedText);

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
            location,
            skills,
            work_experience,
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

export const updateCandidateDetails = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params; // Get the candidate's ID from the URL
    const { name, email, phone } = req.body; // Get updated details from the body

    // Validate incoming data (you can add more validation if needed)
    if (!name || !email || !phone) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Find the candidate by ID
    const candidate = await ResumeModel.findById(candidateId);

    if (!candidate) {
      res.status(404).json({ message: "Candidate not found" });
      return;
    }

    // Update candidate details
    candidate.name = name || candidate.name;
    candidate.email = email || candidate.email;
    candidate.phone = phone || candidate.phone;

    // Save the updated candidate details
    await candidate.save();

    // Return the updated candidate
    res
      .status(200)
      .json({ message: "Candidate details updated successfully", candidate });
    return;
  } catch (error) {
    console.error("Error updating candidate details:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

export const deleteCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateId } = req.params;

    if (!req.user) {
      res.status(404).json(errorResponse("Unauthorized"));
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      res.status(400).json(errorResponse("Invalid Id format"));
      return;
    }
    const deleteResume = await ResumeModel.findOneAndDelete({
      _id: candidateId,
      userId: req.user.id,
    });
    if (!deleteResume) {
      res
        .status(401)
        .json(errorResponse("Candidate not found or unauthorized"));
      return;
    }
    res.status(200).json(successResponse("Candidate Deleted Successfully"));
  } catch (error) {
    console.log("Error Deleting Resume", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const updateCandidateStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(404).json(errorResponse("Unauthorized"));
      return;
    }

    const { candidateId } = req.params;
    const { status } = req.body;

    // Validate incoming data
    if (!status) {
      res.status(400).json({ message: "Missing required field: status" });
      return;
    }

    // Find the candidate by ID
    const candidate = await ResumeModel.findById(candidateId);
    if (!candidate) {
      res.status(404).json({ message: "Candidate not found" });
      return;
    }
    const currentStatus = candidate.status;
    if (!currentStatus) {
      res.status(400).json({ message: "Candidate status is undefined" });
      return;
    }

    // Define allowed transitions based on current status
    const allowedTransitions: { [key: string]: string[] } = {
      queue: [
        "queue",
        "shortlisted",
        "rejected",
        "in-review",
        "needs-hr-review",
      ],
      rejected: [
        "queue",
        "shortlisted",
        "rejected",
        "in-review",
        "needs-hr-review",
      ],
      shortlisted: [
        "queue",
        "shortlisted",
        "rejected",
        "in-review",
        "needs-hr-review",
      ],
      "in-progress": [], // No transitions allowed from "in-progress"
      "in-review": ["shortlisted", "rejected", "needs-hr-review"],
      "needs-hr-review": ["shortlisted", "rejected", "in-review"],
    };

    if (!allowedTransitions[currentStatus].includes(status)) {
      res.status(400).json({
        message: `Invalid status transition from ${candidate.status} to ${status}`,
      });
      return;
    }

    // Update the status and save
    candidate.status = status;
    await candidate.save();

    // Return the updated candidate details
    res.status(200).json({
      message: "Candidate status updated successfully",
      candidate,
    });
  } catch (error) {
    console.error("Error updating candidate status:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
