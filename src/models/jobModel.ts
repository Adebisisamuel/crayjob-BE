import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  user: mongoose.Schema.Types.ObjectId;
  jobTitle: string;
  jobDescription: string;
  screeningQuestions: string[];
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
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>("Job", jobSchema);
export default Job;
