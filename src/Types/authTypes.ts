import { Request } from "express";

export interface AuthRequest extends Request {
  user?: { id: string };
}

// declare global {
//   namespace Express {
//     interface Request {
//       user?: { id: string };
//     }
//   }
// }
