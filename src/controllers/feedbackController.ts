import { Response } from "express";
import { AuthRequest } from "../Types/authTypes";
import { successResponse, errorResponse } from "../utils/responseHandler";
import Job from "../models/jobModel";
import CallFeedback from "../models/callFeedbackModel";

export const getCallFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }
    const jobId = req.params.jobId;
    const candidateId = req.params.candidateId;

    if (!jobId) {
      res
        .status(400)
        .json(errorResponse("Job ID is required in the request body."));
      return;
    }
    const job = await Job.findOne({ _id: jobId, userId: req.user.id });
    if (!job) {
      res.status(404).json(errorResponse("Job not found or Unauthorized"));
      return;
    }
    if (candidateId) {
      const feedback = await CallFeedback.findOne({ candidateId, jobId });
      if (!feedback) {
        res
          .status(404)
          .json(
            errorResponse(
              "Feedback not found for the specified candidate and job."
            )
          );
        return;
      }
      res.json(successResponse("Feedback retrieved successfully", feedback));
      return;
    } else {
      const feedbacks = await CallFeedback.find({ jobId });
      if (!feedbacks || feedbacks.length === 0) {
        res
          .status(404)
          .json(errorResponse("No feedback found for the specified job."));
        return;
      }
      res.json(successResponse("Feedbacks retrieved successfully", feedbacks));
      return;
    }
  } catch (error) {
    console.error("Error getting call feedback", error);
    res.status(500).json(errorResponse("Internal Server Error"));
    return;
  }
};

export const getAllCallFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }
    const jobId = req.params.jobId;
    if (!jobId) {
      res.status(400).json(errorResponse("Job ID is required"));
      return;
    }
    const job = await Job.findOne({ _id: jobId, userId: req.user.id });
    if (!job) {
      res.status(404).json(errorResponse("Job not found or Unauthorized"));
      return;
    }
    const feedbacks = await CallFeedback.find({ jobId });
    if (!feedbacks || feedbacks.length === 0) {
      res
        .status(404)
        .json(errorResponse("No feedback found for the specified job."));
      return;
    }
    res.json(successResponse("Feedbacks retrieved successfully", feedbacks));
    return;
  } catch (error) {
    console.error("Error getting call feedback", error);
    res.status(500).json(errorResponse("Internal Server Error"));
    return;
  }
};
