import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDb from "./config/db";
import userRoute from "./routes/userRoute";
import dotenv from "dotenv";

dotenv.config();
connectDb();

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

//Routes
app.use("/users", userRoute);

app.get("/", (req, res) => {
  res.send("CrayJob API is running!");
});

export default app;
