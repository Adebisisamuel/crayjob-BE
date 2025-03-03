import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  companyName: string;
  jobTitle: string;
  // location: string;
  location: {
    country: string;
    state: string;
    countryCode: string;
  };
  jobDescription: string;
  screeningQuestions: string[];
  locationType: string;
  queue: number;
  inProgress: number;
  unreachable: number;
  shortlisted: number;
  rejected: number;
  jobStatus: "active" | "closed";
  createdAt?: Date;
  updatedAt?: Date;
}

const jobSchema = new Schema<IJob>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      country: { type: String, trim: true, required: true },
      state: { type: String, trim: true, required: true },
      countryCode: { type: String, trim: true, required: false },
    },
    locationType: {
      type: String,
      required: true,
      enum: ["Remote", "On-site", "Hybrid"],
    },
    jobDescription: {
      type: String,
      required: true,
      trim: true,
    },
    screeningQuestions: {
      type: [String],
      required: true,
    },
    // countryCode: {
    //   type: String,
    //   trim: true,
    //   required: false,
    // },
    // country: {
    //   type: String,
    //   trim: true,
    //   required: false,
    // },
    // state: {
    //   type: String,
    //   trim: true,
    //   required: false,
    // },
    jobStatus: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>("Job", jobSchema);
export default Job;
