import { Response } from "express";
import multer from "multer";
import { AuthRequest } from "../Types/authTypes";
import Resume from "../models/resumeModel";
import { errorResponse, successResponse } from "../utils/responseHandler";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "resumes",
    resource_type: "raw",
  } as unknown as { folder: string; resource_type: string },
});

const upload = multer({ storage });

export const uploadMiddleware = upload.array("resumes", 50);

export const uploadResumes = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json(errorResponse("Unauthorized: User not found"));
      return;
    }

    const { ticketId } = req.body;

    if (!ticketId) {
      res.status(400).json(errorResponse("Ticket ID is required"));
      return;
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json(errorResponse("No resumes uploaded"));
      return;
    }

    const existingResumesCount = await Resume.countDocuments({ ticketId });
    if (existingResumesCount + req.files.length > 50) {
      res
        .status(400)
        .json(errorResponse("Cannot upload more than 50 resumes per ticket"));
      return;
    }

    const uploadedFiles = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        const fileExtension = file.originalname.split(".").pop();
        const publicId = `resumes/${
          file.filename
        }-${Date.now()}.${fileExtension}`;

        const result = await cloudinary.uploader.upload(file.path, {
          folder: "resumes",
          resource_type: "raw",
          public_id: publicId,
          format: fileExtension,
        });

        return {
          userId: req.user!.id,
          ticketId,
          filename: file.originalname,
          fileUrl: result.secure_url,
        };
      })
    );

    const savedResumes = await Resume.insertMany(uploadedFiles);

    res
      .status(201)
      .json(successResponse("Resumes uploaded successfully", savedResumes));
    return;
  } catch (error) {
    console.error("Error uploading resumes:", error);
    res.status(500).json(errorResponse("Upload failed"));
    return;
  }
};

export const getResumesByTicket = async (req: AuthRequest, res: Response) => {};
