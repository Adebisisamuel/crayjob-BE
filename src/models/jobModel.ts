import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  companyName: string;
  jobTitle: string;
  location: string;
  jobDescription: string;
  screeningQuestions: string[];
  locationType: string;
  countryCode: string;
  state: string;
  queue: number;
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
    countryCode: {
      type: String,
      trim: true,
      required: false,
    },
    state: {
      type: String,
      trim: true,
      required: false,
    },
    queue: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>("Job", jobSchema);
export default Job;
