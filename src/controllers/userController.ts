import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/userModel";
import { successResponse, errorResponse } from "../utils/responseHandler";

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

    const user = new User({
      firstName,
      surname,
      email,
      password: hashPassword,
    });
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "User registered Successfully", user });
  } catch (error) {
    console.log("Error creating User", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
    return;
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    res.json(successResponse("Login successful", { token }));
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json(errorResponse("Internal Server Error"));
  }
};
