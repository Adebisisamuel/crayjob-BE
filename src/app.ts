import express from "express";

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import userRoute from "./routes/userRoute";
import jobRoute from "./routes/jobRoute";
import resumeRoute from "./routes/resumeRoutes";
import aiRoute from "./routes/aiRoutes";
import feedbackRoute from "./routes/feedbackRoutes";

import connectDb from "./config/db";

dotenv.config();
connectDb();

const app = express();

// app.use(cors());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://d182t84hs333hf.cloudfront.net",
      "https://crayhunt.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));
// app.use(express.json());
app.use((req, res, next) => {
  if (req.method === "GET") {
    return next();
  }
  express.json()(req, res, next);
});
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

//Routes
app.use("/users", userRoute);
app.use("/job", jobRoute);
app.use("/resume", resumeRoute);
app.use("/ai", aiRoute);
app.use("/feedback", feedbackRoute);

app.get("/", (req, res) => {
  res.send("CrayHunt API is running!");
});

export default app;
