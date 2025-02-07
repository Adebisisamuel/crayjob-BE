import mongoose, { Document, Schema } from "mongoose";

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  fileUrl: string;
  uploadedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
  },
  { timestamps: true }
);

export default mongoose.model<IResume>("Resume", ResumeSchema);
