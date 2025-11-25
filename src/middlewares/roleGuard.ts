import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../errors/ApiError";
import { TRole } from "../config/role";

export interface IUserPayload extends jwt.JwtPayload {
  id: string;
  role: string;
  email: string;
}

export const guardRole = (roles: TRole | TRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new ApiError(401, "Access denied. No token provided.");
    }

    try {
      // Decode token and cast it to IUserPayload
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY as string,
      ) as IUserPayload;
      // Attach the decoded payload to the request object
      (req as any).user = decoded;
      const userRole = decoded.role;
      // Check if the user has one of the allowed roles
      if (
        (Array.isArray(roles) && roles.includes(userRole as TRole)) ||
        roles === userRole
      ) {
        return next();
      }

      throw new ApiError(
        403,
        "You are not authorized to access this resource.",
      );
    } catch (error) {
      throw new ApiError(498, "Session Expired");
    }
  };
};
