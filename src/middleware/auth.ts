import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthUser } from "../types";

declare global {
  
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}


export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: please log in first" });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET as string) as unknown as AuthUser;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized: your session has expired" });
  }
}
