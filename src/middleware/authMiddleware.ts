import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/responseHandler";
import { AuthRequest } from "../Types/authTypes";

export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      res.status(401).json(errorResponse("Access denied. No token provided."));
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    req.user = { id: decoded.id };

    next();
  } catch (error) {
    res.status(401).json(errorResponse("Invalid token"));
  }
};
