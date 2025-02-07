import { Response } from "express";
import multer from "multer";
import path from "path";
import { AuthRequest } from "../Types/authTypes";
import Resume from "../models/resumeModel";
import { errorResponse, successResponse } from "../utils/responseHandler";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";
import parseFile from "../utils/resumeParser";
import axios from "axios";
import fs from "fs";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "resumes",
    resource_type: "raw",
  } as unknown as { folder: string; resource_type: string },
});
const upload = multer({ storage });

export const uploadResumes = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      res.status(400).json(errorResponse("No files uploaded"));
      return;
    }

    const uploadedFiles = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "resumes",
          resource_type: "auto",
        });

        return {
          userId: req.user!.id,
          filename: file.originalname,
          fileUrl: result.secure_url,
        };
      })
    );

    const savedResumes = await Resume.insertMany(uploadedFiles);
    res
      .status(201)
      .json(successResponse("Resume Uploaded successfully", savedResumes));
    return;
  } catch (error) {
    console.error("Error uploading resumes:", error);
    res.status(500).json({ success: false, message: "Upload failed" });
    return;
  }
};

export const uploadMiddleware = upload.array("resumes", 50);

const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
const phoneRegex = /\(?\+?[0-9]*\)?[0-9_\- \(\)]*/;
const nameRegex = /^[A-Za-z\s]+$/;

export const extractResumesDetails = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { resumeIds } = req.body;

    if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
      res
        .status(400)
        .json(errorResponse("Please provide a list of resume IDs"));
      return;
    }

    const resumes = await Resume.find({ _id: { $in: resumeIds } });
    if (!resumes || resumes.length === 0) {
      res.status(404).json({ message: "No resumes found" });
      return;
    }

    const extractedDataArray = await Promise.all(
      resumes.map(async (resume) => {
        const fileUrl = resume.fileUrl;
        const fileName = path.basename(fileUrl);
        const tempFilePath = path.join(__dirname, `../temp_files/${fileName}`);

        const response = await axios({
          url: fileUrl,
          method: "GET",
          responseType: "stream",
        });

        const writer = fs.createWriteStream(tempFilePath);
        await new Promise<void>((resolve, reject) => {
          response.data.pipe(writer);
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        try {
          const fileText = await parseFile(tempFilePath);

          const nameMatch = fileText.match(nameRegex);
          const emailMatch = fileText.match(emailRegex);
          const phoneMatch = fileText.match(phoneRegex);

          const extractedData = {
            resumeId: resume._id,
            name: nameMatch ? nameMatch[0] : "Name not found",
            email: emailMatch ? emailMatch[0] : "Email not found",
            phone: phoneMatch ? phoneMatch[0] : "Phone number not found",
          };

          fs.unlinkSync(tempFilePath);

          return extractedData;
        } catch (error) {
          console.error("Error parsing resume:", error);
          fs.unlinkSync(tempFilePath);
          throw new Error("Error extracting resume details");
        }
      })
    );

    res.status(200).json({ success: true, extractedData: extractedDataArray });
    return;
  } catch (error) {
    console.error("Error extracting resume details:", error);
    res
      .status(500)
      .json({ success: false, message: "Error extracting resume details" });
    return;
  }
};
