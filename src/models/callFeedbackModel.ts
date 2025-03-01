import mongoose, { Schema, Document } from "mongoose";

export interface ICallFeedback extends Document {
  jobId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  callId: string;
  timeOfCall: Date;
  duration: number;
  status: string;
  transcript: string;
  screeningQA: Record<string, string>;
  summary: string;
  strengths: string;
  areasOfImprovement: string;
  recommendations: {
    detailedWriteup: string;
    finalDecision: string;
  };
  createdAt: Date;
}

const CallFeedbackSchema = new Schema<ICallFeedback>({
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  candidateId: { type: Schema.Types.ObjectId, ref: "Resume", required: true },
  callId: { type: String, required: true },
  timeOfCall: { type: Date, default: Date.now },
  duration: { type: Number },
  status: { type: String },
  transcript: { type: String },
  screeningQA: { type: Map, of: String },
  summary: { type: String },
  strengths: { type: String },
  areasOfImprovement: { type: String },
  recommendations: {
    detailedWriteup: { type: String },
    finalDecision: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICallFeedback>(
  "CallFeedback",
  CallFeedbackSchema
);
