import nodemailer from "nodemailer";
import dotenv from "dotenv";
import crypto from "crypto";
import User from "../models/userModel";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendActivationEmail = async (
  email: string,
  verificationCode: string
) => {
  try {
    const verificationCode = generateVerificationCode();

    await User.findOneAndUpdate(
      { email },
      {
        verificationCode,
        verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
      }
    );

    await transporter.sendMail({
      from: `"CrayJobs" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>
             <p>This code will expire in 10 minutes.</p>`,
    });

    console.log(` Verification code sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};
