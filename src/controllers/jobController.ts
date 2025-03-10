import { Response } from "express";
import { IJob, Job } from "../models/jobModel";
import { AuthRequest } from "../Types/authTypes";
import { successResponse, errorResponse } from "../utils/responseHandler";
import ResumeModel from "../models/resumeModel";
import CallFeedback from "../models/callFeedbackModel";

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName,
      jobTitle,
      jobDescription,
      screeningQuestions,
      locationType,
      location,
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

    if (!location || !location.country || !location.state) {
      res.status(400).json({
        message: "Location (country, state) is required.",
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
      location,
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

    const jobs = await Job.find({ userId: req.user.id });
    const jobIds = jobs.map((job) => job._id);

    if (jobIds.length === 0) {
      res.json(successResponse("All jobs retrieved successfully", []));
      return;
    }

    // Aggregate resumes to get counts grouped by jobId and status.
    // Use $ifNull to default missing status fields to "queue".
    const resumeStatusCounts = await ResumeModel.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      {
        $group: {
          _id: {
            jobId: "$jobId",
            status: { $ifNull: ["$status", "queue"] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build a mapping of jobId to its candidatesStatus counts.
    const candidatesStatusMap: Record<string, Record<string, number>> = {};

    resumeStatusCounts.forEach((item: any) => {
      const jobIdStr = item._id.jobId.toString();
      if (!candidatesStatusMap[jobIdStr]) {
        candidatesStatusMap[jobIdStr] = {};
      }
      candidatesStatusMap[jobIdStr][item._id.status] = item.count;
    });

    // Default statuses with all counts set to 0
    const defaultStatuses: Record<string, number> = {
      queue: 0,
      "in-progress": 0,
      unreachable: 0,
      shortlisted: 0,
      rejected: 0,
      "in-review": 0,
      "needs-hr-review": 0,
    };

    // Extend the job object type to include candidatesStatus.
    interface IJobWithCandidatesStatus extends IJob {
      candidatesStatus?: Record<string, number>;
    }

    // Attach the candidatesStatus counts to each job, merging default statuses with any actual counts.
    const jobsWithCounts = jobs.map((job) => {
      const jobObj: IJobWithCandidatesStatus = job.toObject();
      const jobIdStr = job.id; // using Mongoose's virtual getter 'id'
      jobObj.candidatesStatus = {
        ...defaultStatuses,
        ...(candidatesStatusMap[jobIdStr] || {}),
      };
      return jobObj;
    });

    res.json(
      successResponse("All jobs retrieved successfully", jobsWithCounts)
    );
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
      userId: req.user.id,
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

    const {
      companyName,
      jobTitle,
      jobDescription,
      screeningQuestions,
      locationType,
      location,
    } = req.body;

    if (
      locationType &&
      !["Remote", "On-site", "Hybrid"].includes(locationType)
    ) {
      res
        .status(400)
        .json(
          errorResponse(
            "Invalid locationType. Use 'Remote', 'On-site', or 'Hybrid'."
          )
        );
      return;
    }

    if (location) {
      if (!location.country || !location.state) {
        res
          .status(400)
          .json(errorResponse("Location (country, state) is required."));
        return;
      }
    }

    const updateFields: any = {};

    if (companyName) updateFields.companyName = companyName;
    if (jobTitle) updateFields.jobTitle = jobTitle;
    if (jobDescription) updateFields.jobDescription = jobDescription;
    if (screeningQuestions)
      updateFields.screeningQuestions = screeningQuestions;
    if (locationType) updateFields.locationType = locationType;
    if (location) updateFields.location = location;

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!job) {
      res.status(404).json(errorResponse("Job not found or unauthorized"));
      return;
    }

    res.json(successResponse("Job Updated Successfully", job));
    return;
  } catch (error) {
    console.error("Error Updating Job:", error);
    res.status(500).json(errorResponse("Internal Server Error"));
    return;
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
      userId: req.user.id,
    });
    if (!job) {
      res.status(404).json(errorResponse("Job not found or unauthorized"));
      return;
    }
    res.status(200).json(successResponse("Job Deleted Successfully"));
    return;
  } catch (error) {
    console.log("Error deleteing Job", error);
    res.status(500).json(errorResponse("Internal Server Error"));
    return;
  }
};

export const getActiveJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const activeJobs = await Job.find({
      userId: req.user.id,
      jobStatus: "active",
    });
    const totalActiveJobs = activeJobs.length;

    res.status(200).json(
      successResponse("Active Jobs retrieved successfully", {
        totalActiveJobs,
        jobs: activeJobs,
      })
    );
    return;
  } catch (error) {
    console.error("Error getting active Jobs", error);
    res.status(500).json(errorResponse("Internal Server Error"));
    return;
  }
};

export const getClosedJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const closedJobs = await Job.find({
      userId: req.user.id,
      jobStatus: "closed",
    });
    const totalClosedJobs = closedJobs.length;

    res.status(200).json(
      successResponse("Closed Jobs retrieved successfully", {
        totalClosedJobs,
        jobs: closedJobs,
      })
    );
    return;
  } catch (error) {
    console.error("Error getting closed Jobs", error);
    res.status(500).json(errorResponse("Internal Server Error"));
    return;
  }
};

export const getTotalCandidate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(404).json(errorResponse("Unauthorized"));
      return;
    }
    const jobs = await Job.find({ userId: req.user.id });
    const jobIds = jobs.map((job) => job._id);

    if (jobIds.length === 0) {
      res
        .status(401)
        .json(successResponse("No candidate found", { totalCandidate: 0 }));
      return;
    }
    const totalCandidate = await ResumeModel.countDocuments({
      jobId: { $in: jobIds },
    });
    res.json(
      successResponse("Total candidates retrieved successfully", {
        totalCandidate,
      })
    );
    return;
  } catch (error) {
    console.log("Error fetching total candidates", error);
    res.status(500).json("Internal Server Error");
  }
};

export const getTotalRejectedCandidates = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const jobs = await Job.find({ userId: req.user.id });
    const jobIds = jobs.map((job) => job._id);

    if (jobIds.length === 0) {
      res.json(
        successResponse("No rejected candidates found", {
          totalRejectedCandidates: 0,
        })
      );
      return;
    }

    const totalRejectedCandidates = await ResumeModel.countDocuments({
      jobId: { $in: jobIds },
      status: "rejected",
    });

    res.json(
      successResponse("Total rejected candidates retrieved successfully", {
        totalRejectedCandidates,
      })
    );
    return;
  } catch (error) {
    console.log("Error fetching total rejected candidates", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getTotalJobCreated = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }
    const totalJob = await Job.find({ userId: req.user.id });
    res
      .status(200)
      .json(successResponse("Total Jobs retrieved successfully", { totalJob }));
  } catch (error) {
    console.log("Error Getting all Jobs", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const userId = req.user.id;

    // Fetch all jobs by the user
    const jobs = await Job.find({ userId });
    const jobIds = jobs.map((job) => job._id);

    // Get total job counts
    const totalJobsCreated = jobs.length;
    const totalActiveJobs = jobs.filter(
      (job) => job.jobStatus === "active"
    ).length;
    const totalClosedJobs = jobs.filter(
      (job) => job.jobStatus === "closed"
    ).length;

    // Get total candidates and rejected candidates count
    const [totalCandidates, totalRejectedCandidates] = await Promise.all([
      ResumeModel.countDocuments({ jobId: { $in: jobIds } }),
      ResumeModel.countDocuments({
        jobId: { $in: jobIds },
        status: "rejected",
      }),
    ]);

    // Fetch engagement stats
    const feedbacks = await CallFeedback.find({ userId });

    let totalCallsInitiated = feedbacks.length;
    let totalCallsAnswered = 0;
    let totalCallsCompleted = 0;
    let totalShortlisted = 0;

    feedbacks.forEach((feedback) => {
      if (["completed", "success"].includes(feedback.status))
        totalCallsCompleted++;
      if (["initiated", "ringing"].includes(feedback.status))
        totalCallsAnswered++;
      if (feedback.status === "shortlisted") totalShortlisted++;
    });

    // Calculate engagement percentages
    const aiEngagementPercent =
      totalCandidates > 0 ? (totalShortlisted / totalCandidates) * 100 : 0;
    const answeredPercent =
      totalCallsInitiated > 0
        ? (totalCallsAnswered / totalCallsInitiated) * 100
        : 0;
    const completedPercent =
      totalCallsInitiated > 0
        ? (totalCallsCompleted / totalCallsInitiated) * 100
        : 0;
    const totalEngagement =
      (answeredPercent + completedPercent + aiEngagementPercent) / 3;

    res.status(200).json(
      successResponse("Dashboard stats retrieved successfully", {
        totalJobsCreated,
        totalActiveJobs,
        totalClosedJobs,
        totalCandidates,
        totalRejectedCandidates,
        totalEngagement: `${totalEngagement.toFixed(2)}%`,
      })
    );
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};
