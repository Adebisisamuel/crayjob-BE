import express from "express";

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import userRoute from "./routes/userRoute";
import jobRoute from "./routes/jobRoute";
import resumeRoute from "./routes/resumeRoutes";

import connectDb from "./config/db";

dotenv.config();
connectDb();

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
// app.use(express.json());
app.use((req, res, next) => {
  if (req.method === "GET") {
    return next();
  }
  express.json()(req, res, next);
});

//Routes
app.use("/users", userRoute);
app.use("/job", jobRoute);
app.use("/resume", resumeRoute);

app.get("/", (req, res) => {
  res.send("CrayJob API is running!");
});

export default app;
