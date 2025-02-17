import { Response } from "express";
import { Job } from "../models/jobModel";
import { AuthRequest } from "../Types/authTypes";
import { successResponse, errorResponse } from "../utils/responseHandler";

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName,
      jobTitle,
      jobDescription,
      screeningQuestions,
      locationType,
      country,
      countryCode,
      state,
    } = req.body;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const allowedLocationTypes = ["Remote", "On-site", "Hybrid"];
    if (!allowedLocationTypes.includes(locationType)) {
      res.status(400).json({
        message: "Invalid locationType. Use 'Remote', 'On-site', or 'Hybrid'.",
      });
      return;
    }

    // if (!country || !countryCode || !state) {
    //   res
    //     .status(400)
    //     .json({ message: "Country, countryCode, and state are required." });
    //   return;
    // }

    const job = new Job({
      userId: req.user.id,
      companyName,
      jobTitle,
      jobDescription,
      locationType,
      screeningQuestions,
      country,
      countryCode,
      state,
    });

    await job.save();
    res.status(201).json(successResponse("Job created successfully", job));
    return;
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json(errorResponse("Internal Server Error"));
    return;
  }
};

export const getAllJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }
    const jobs = await Job.find({ user: req.user.id });
    res.json(successResponse("All jobs retrieved successfully", jobs));
  } catch (error) {
    console.log("Error retrieving jobs", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(400).json(errorResponse("Unauthorized"));
      return;
    }
    const job = await Job.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!job) {
      res.status(400).json(errorResponse("Job not found or Unauthorized"));
      return;
    }
    res.json(successResponse("Job retrieved successfully", job));
  } catch (error) {
    console.log("Error getting job", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }
    const job = await Job.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!job) {
      res.status(404).json(errorResponse("Ticket not found or unauthorized"));
    }
    res.json(successResponse("Job Updated Successfully", job));
    return;
  } catch (error) {
    console.log("Error Updating Job", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!job) {
      res.status(404).json(errorResponse("Job not found or unauthorized"));
    }
    res.status(200).json(successResponse("Job Deleted Successfully"));
  } catch (error) {
    console.log("Error deleteing Job", error);
    res.status(500).json(errorResponse("Internal Server Error"));
    return;
  }
};
