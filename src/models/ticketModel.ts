import mongoose, { Schema, Document } from "mongoose";

export interface ITicket extends Document {
  user: mongoose.Schema.Types.ObjectId;
  jobTitle: string;
  jobDescription: string;
  screeningQuestions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ticketSchema = new Schema<ITicket>(
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

export const Ticket = mongoose.model<ITicket>("Ticket", ticketSchema);
export default Ticket;
