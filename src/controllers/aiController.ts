import axios from "axios";
import { Response, NextFunction } from "express";
import CallFeedback from "../models/callFeedbackModel";

import JobModel from "../models/jobModel";
import ResumeModel from "../models/resumeModel";
import { extractCallDetails } from "../utils/resumeParser";
import { errorResponse } from "../utils/responseHandler";
import { AuthRequest } from "../Types/authTypes";

export const callCandidates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.body;

    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    if (!jobId) {
      res.status(400).json({ message: "Job ID is required" });
      return;
    }

    // Retrieve job details (including screening questions, job title, etc.)
    const job = await JobModel.findById(jobId);
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    await JobModel.findByIdAndUpdate(jobId, { jobStatus: "active" });

    // Retrieve candidates associated with the job that are NOT "shortlisted" or "in-progress"
    const candidates = await ResumeModel.find({
      jobId,
      status: { $nin: ["shortlisted"] },
    });
    if (candidates.length === 0) {
      res.status(404).json({ message: "No candidates found for this job" });
      return;
    }

    const callCustomer = async (candidate: {
      name: string;
      phone: string;
      id: string;
      jobId: string;
      userId: string;
      skills: string[];
      work_experience: any;
    }) => {
      try {
        const payload = {
          agent_id: process.env.BONLA_AGENT_ID,
          recipient_phone_number: candidate.phone, // Ensure this is in E.164 format
          from_phone_number: process.env.BONLA_FROM_PHONE_NUMBER,
          user_data: {
            candidateId: candidate.id,
            jobId: candidate.jobId,
            userId: candidate.userId,
            candidateProfile: {
              skills: candidate.skills,
              work_experience: candidate.work_experience,
              screening_questions: job.screeningQuestions,
              job_description: job.jobDescription,
              company_name: job.companyName,
              candidate_name: candidate.name,
            },
          },
        };

        const response = await axios.post(
          `${process.env.BONLA_API_BASE_URL}call`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${process.env.BONLA_API_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`Response for ${candidate.name}:`, response.data);
      } catch (error: any) {
        console.error(`Error in calling ${candidate.name}:`, error.message);
      }
    };

    const calledPhones = new Set<string>();

    for (const candidate of candidates) {
      const phone = candidate.phone;
      // Only call if phone exists and hasn't been called already
      if (phone && !calledPhones.has(phone)) {
        await callCustomer({
          name: candidate.name ?? "Unknown Candidate",
          phone: phone,
          id: candidate._id as string,
          jobId,
          userId: req.user.id,
          skills: candidate.skills as string[],
          work_experience: candidate.work_experience as any,
        });
        // Mark this phone as called
        calledPhones.add(phone);
      }
    }

    res.status(200).json({
      message: "Calls initiated successfully",
    });

    return;
  } catch (error: any) {
    console.error("Error in callCandidatesBolna:", error.message);
    next(error);
  }
};

enum CandidateStatus {
  InProgress = "in-progress",
  Unreachable = "unreachable",
  Shortlisted = "shortlisted",
  Rejected = "rejected",
  InReview = "in-review",
  NeedsHRReview = "needs-hr-review",
}

export const bolnaCallback: any = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;

    const candidateId = payload.context_details?.recipient_data?.candidateId;
    const jobId = payload.context_details?.recipient_data?.jobId;
    const userId = payload.context_details?.recipient_data?.userId;

    // Determine initial status from the callback status
    let candidateStatus: CandidateStatus;
    switch (payload.status) {
      case "initiated":
      case "ringing":
        candidateStatus = CandidateStatus.InProgress;
        break;
      case "busy":
        candidateStatus = CandidateStatus.Unreachable;
        break;
      case "completed":
      case "success":
        // For completed calls, we will further refine the status below
        candidateStatus = CandidateStatus.InReview;
        break;
      default:
        candidateStatus = CandidateStatus.InProgress;
        break;
    }

    if (payload.transcript) {
      const job = await JobModel.findById(jobId);
      const jobDescription = job?.jobDescription || "";
      const candidateSkills =
        payload.context_details?.recipient_data?.skills || [];
      const workExperience =
        payload.context_details?.recipient_data?.work_experience || [];
      const extractedData = await extractCallDetails(
        payload.transcript,
        jobDescription,
        candidateSkills,
        workExperience
      );

      // Business logic for final status:
      // Business logic for final status when the call is completed:
      if (payload.status === "completed" || payload.status === "success") {
        if (
          extractedData.recommendations &&
          extractedData.recommendations.finalDecision &&
          extractedData.recommendations.finalDecision.toLowerCase() === "hire"
        ) {
          candidateStatus = CandidateStatus.Shortlisted;
        } else if (
          extractedData.recommendations &&
          extractedData.recommendations.finalDecision &&
          extractedData.recommendations.finalDecision.toLowerCase() === "reject"
        ) {
          candidateStatus = CandidateStatus.Rejected;
        } else {
          // No clear decision was made so mark as needing HR review.
          candidateStatus = CandidateStatus.NeedsHRReview;
        }
      }

      // Helper: sanitize keys by replacing dots with underscores
      const sanitizeKeys = (obj: Record<string, string>) => {
        const sanitized: Record<string, string> = {};
        for (const key in obj) {
          sanitized[key.replace(/\./g, "_")] = obj[key];
        }
        return sanitized;
      };

      const sanitizedQA = sanitizeKeys(extractedData.screeningQA);
      const screeningQA = new Map(Object.entries(sanitizedQA));

      const updateData = {
        jobId: jobId,
        userId: userId,
        candidateId: candidateId,
        callId: payload.id,
        timeOfCall: new Date(payload.created_at),
        duration: payload.conversation_duration,
        status: payload.status,
        transcript: payload.transcript,
        summary: extractedData.summary,
        screeningQA,
        strengths: extractedData.strengths,
        areasOfImprovement: extractedData.areasOfImprovement,
        recommendations: extractedData.recommendations,
      };

      const options = { new: true, upsert: true };

      const feedbackResponse = await CallFeedback.findOneAndUpdate(
        { jobId, candidateId },
        updateData,
        options
      );
      console.log("Feedback upserted", feedbackResponse);
    } else {
      console.log(
        candidateId,
        jobId,
        userId,
        "No transcript provided; candidate status based solely on callback payload."
      );
    }
    // Update the candidate's status.
    await ResumeModel.findByIdAndUpdate(candidateId, {
      status: candidateStatus,
    });
    console.log(
      `Candidate ${candidateId} for job ${jobId} updated to status: ${candidateStatus}`
    );

    res.status(201).json({ message: "Callback processed successfully" });
  } catch (error: any) {
    console.error("Error in callCandidates:", error.message);
    next(error);
  }
};
