import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDb from "./config/db";
import userRoute from "./routes/userRoute";
import ticketRoute from "./routes/ticketRoute";
import resumeRoute from "./routes/resumeRoutes";
import dotenv from "dotenv";

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
app.use("/ticket", ticketRoute);
app.use("/resume", resumeRoute);

app.get("/", (req, res) => {
  res.send("CrayJob API is running!");
});

export default app;
