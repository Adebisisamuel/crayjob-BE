import mongoose, { Document, Schema } from "mongoose";

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  filename: string;
  fileUrl: string;
  uploadedAt: Date;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  work_experience?: { title: string; company: string; duration: string }[];
  status?: string;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    filename: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    location: {
      type: String,
    },
    skills: {
      type: [String],
    },
    work_experience: [
      {
        title: { type: String, required: false, default: "" },
        company: { type: String, required: false, default: "" },
        duration: { type: String, required: false, default: "" },
      },
    ],
    status: {
      type: String,
      enum: [
        "queue",
        "in-progress",
        "unreachable",
        "shortlisted",
        "rejected",
        "in-review",
        "needs-hr-review",
      ],
      default: "queue", // default status when resume is first uploaded
    },
  },
  { timestamps: true }
);

export default mongoose.model<IResume>("Resume", ResumeSchema);
