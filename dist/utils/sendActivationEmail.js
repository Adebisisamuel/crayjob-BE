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
exports.sendActivationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const userModel_1 = __importDefault(require("../models/userModel"));
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: "bensoneniola097@gmail.com",
        pass: "ixvakgglqddojliv",
    },
});
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
const sendActivationEmail = (email, verificationCode) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const verificationCode = generateVerificationCode();
        yield userModel_1.default.findOneAndUpdate({ email }, {
            verificationCode,
            verificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }, { new: true } // 👈 Ensures it updates the database
        );
        yield transporter.sendMail({
            from: `"CrayJobs" <bensoneniola097@gmail.com>`,
            to: email,
            subject: "Your Verification Code",
            html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>
             <p>This code will expire in 10 minutes.</p>`,
        });
        console.log(` Verification code sent to ${email}`);
    }
    catch (error) {
        console.error("Error sending verification email:", error);
    }
});
exports.sendActivationEmail = sendActivationEmail;
