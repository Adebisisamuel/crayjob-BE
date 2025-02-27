"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const jobRoute_1 = __importDefault(require("./routes/jobRoute"));
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const feedbackRoutes_1 = __importDefault(require("./routes/feedbackRoutes"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
(0, db_1.default)();
const app = (0, express_1.default)();
// app.use(cors());
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "https://d182t84hs333hf.cloudfront.net",
        "https://crayhunt.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
// app.use(express.json());
app.use((req, res, next) => {
    if (req.method === "GET") {
        return next();
    }
    express_1.default.json()(req, res, next);
});
//Routes
app.use("/users", userRoute_1.default);
app.use("/job", jobRoute_1.default);
app.use("/resume", resumeRoutes_1.default);
app.use("/ai", aiRoutes_1.default);
app.use("/feedback", feedbackRoutes_1.default);
app.get("/", (req, res) => {
    res.send("CrayHunt API is running!");
});
exports.default = app;
