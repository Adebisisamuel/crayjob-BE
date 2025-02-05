import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/userModel";
import { successResponse, errorResponse } from "../utils/responseHandler";
import { sendActivationEmail } from "../utils/sendActivationEmail";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firstName, surname, email, password } = req.body;
    if (!firstName || !surname || !email || !password) {
      res.status(400).json(errorResponse("All fields are required"));
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json(errorResponse("user already exist"));
      return;
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const verificationCode = crypto.randomBytes(32).toString("hex");

    const user = new User({
      firstName,
      surname,
      email,
      password: hashPassword,
      verificationCode,
      isVerified: false,
    });
    await user.save();
    await sendActivationEmail(user.email, verificationCode);

    res
      .status(200)
      .json({ success: true, message: "User registered Successfully", user });
  } catch (error) {
    console.log("Error creating User", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
    return;
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json(errorResponse("User not found"));
      return;
    }

    if (!user.verificationCode || !user.verificationExpiresAt) {
      res
        .status(400)
        .json(errorResponse("Verification code expired or invalid"));
      return;
    }

    if (user.verificationCode === String(code)) {
      if (new Date() > user.verificationExpiresAt) {
        res.status(400).json(errorResponse("Verification code has expired"));
        return;
      }

      user.isVerified = true;
      user.verificationCode = "";
      user.verificationExpiresAt = null;
      await user.save();

      res.status(200).json(successResponse("Email successfully verified"));
      return;
    } else {
      res
        .status(400)
        .json(errorResponse("Invalid or incorrect verification code"));
      return;
    }
  } catch (error) {
    console.error("Error verifying email", error);
    res.status(500).json(errorResponse("Internal Server Error"));
    return;
  }
};

export const resendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json(errorResponse("User not found"));
      return;
    }
    if (user.isVerified) {
      res.status(400).json(errorResponse("User is already verified"));
      return;
    }
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    user.verificationCode = verificationCode;
    user.verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendActivationEmail(email, verificationCode);
    res
      .status(200)
      .json(successResponse("Verification Code resent successfully"));
  } catch (error) {
    console.log("Error sending verification Code");
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json(errorResponse("Invalid credentials"));
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json(errorResponse("Invalid credentials"));
      return;
    }
    if (user.isVerified === false) {
      res.status(400).json(errorResponse("Please Verify Your Email"));
      return;
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    res.json(successResponse("Login successful", { token }));
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};
