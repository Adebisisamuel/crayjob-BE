import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  user: mongoose.Schema.Types.ObjectId;
  jobTitle: string;
  jobDescription: string;
  screeningQuestions: string[];
  locationType: string;
  countryCode: string;
  state: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const jobSchema = new Schema<IJob>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
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

    locationType: {
      type: String,
      required: true,
      enum: ["Remote", "On-site", "Hybrid"],
    },

    countryCode: {
      type: String,
      trim: true,
      required: true,
    },
    state: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>("Job", jobSchema);
export default Job;
