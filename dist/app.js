"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const db_1 = __importDefault(require("./config/db"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const ticketRoute_1 = __importDefault(require("./routes/ticketRoute"));
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
(0, db_1.default)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
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
app.use("/ticket", ticketRoute_1.default);
app.use("/resume", resumeRoutes_1.default);
app.get("/", (req, res) => {
    res.send("CrayJob API is running!");
});
exports.default = app;
