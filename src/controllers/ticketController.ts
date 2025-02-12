import { Request, Response } from "express";
import { Job } from "../models/jobModel";
import { AuthRequest } from "../Types/authTypes";
import { successResponse, errorResponse } from "../utils/responseHandler";

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, jobDescription, screeningQuestions } = req.body;

    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const job = new Job({
      user: req.user.id,
      jobTitle,
      jobDescription,
      screeningQuestions,
    });

    await job.save();
    res.status(201).json(successResponse("Job created successfully", job));
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getAllJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }
    const jobs = await Job.find({ user: req.user.id }).populate(
      "user",
      "firstName surname email"
    );
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
