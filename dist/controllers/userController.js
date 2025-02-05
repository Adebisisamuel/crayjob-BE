"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.resendVerificationCode = exports.verifyEmail = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("../models/userModel"));
const responseHandler_1 = require("../utils/responseHandler");
const sendActivationEmail_1 = require("../utils/sendActivationEmail");
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, surname, email, password } = req.body;
        if (!firstName || !surname || !email || !password) {
            res.status(400).json((0, responseHandler_1.errorResponse)("All fields are required"));
            return;
        }
        const existingUser = yield userModel_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json((0, responseHandler_1.errorResponse)("user already exist"));
            return;
        }
        const hashPassword = yield bcryptjs_1.default.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const user = new userModel_1.default({
            firstName,
            surname,
            email,
            password: hashPassword,
            verificationCode,
            verificationExpiresAt,
            isVerified: false,
        });
        yield user.save();
        yield (0, sendActivationEmail_1.sendActivationEmail)(user.email, verificationCode);
        console.log("New User", user);
        res
            .status(200)
            .json({ success: true, message: "User registered Successfully", user });
    }
    catch (error) {
        console.log("Error creating User", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
        return;
    }
});
exports.registerUser = registerUser;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, code } = req.body;
        const user = yield userModel_1.default.findOne({ email });
        if (!user) {
            res.status(404).json((0, responseHandler_1.errorResponse)("User not found"));
            return;
        }
        if (!user.verificationCode || !user.verificationExpiresAt) {
            res
                .status(400)
                .json((0, responseHandler_1.errorResponse)("Verification code expired or invalid"));
            return;
        }
        if (user.verificationCode === String(code)) {
            if (new Date() > user.verificationExpiresAt) {
                res.status(400).json((0, responseHandler_1.errorResponse)("Verification code has expired"));
                return;
            }
            user.isVerified = true;
            user.verificationCode = "";
            user.verificationExpiresAt = null;
            yield user.save();
            res.status(200).json((0, responseHandler_1.successResponse)("Email successfully verified"));
            return;
        }
        else {
            res
                .status(400)
                .json((0, responseHandler_1.errorResponse)("Invalid or incorrect verification code"));
            return;
        }
    }
    catch (error) {
        console.error("Error verifying email", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
        return;
    }
});
exports.verifyEmail = verifyEmail;
const resendVerificationCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield userModel_1.default.findOne({ email });
        if (!user) {
            res.status(404).json((0, responseHandler_1.errorResponse)("User not found"));
            return;
        }
        if (user.isVerified) {
            res.status(400).json((0, responseHandler_1.errorResponse)("User is already verified"));
            return;
        }
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        user.verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        yield user.save();
        yield (0, sendActivationEmail_1.sendActivationEmail)(email, verificationCode);
        res
            .status(200)
            .json((0, responseHandler_1.successResponse)("Verification Code resent successfully"));
    }
    catch (error) {
        console.log("Error sending verification Code");
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
    }
});
exports.resendVerificationCode = resendVerificationCode;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield userModel_1.default.findOne({ email });
        if (!user) {
            res.status(400).json((0, responseHandler_1.errorResponse)("Invalid credentials"));
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json((0, responseHandler_1.errorResponse)("Invalid credentials"));
            return;
        }
        if (user.isVerified === false) {
            res.status(400).json((0, responseHandler_1.errorResponse)("Please Verify Your Email"));
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });
        res.json((0, responseHandler_1.successResponse)("Login successful", { token }));
    }
    catch (error) {
        console.error("Login error", error);
        res.status(500).json((0, responseHandler_1.errorResponse)("Internal Server Error"));
    }
});
exports.loginUser = loginUser;
