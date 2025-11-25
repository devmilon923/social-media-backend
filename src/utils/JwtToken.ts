import { sign, verify } from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../config";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import ApiError from "../errors/ApiError";
export type TokenData = {
  id: string;
  name: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
};

const secret = JWT_SECRET_KEY as string;
if (!secret) throw new Error("JWT_SECRET is not defined");

export function generateToken({
  id,
  role,
  email,
}: {
  id: string;
  role: string;
  email: string;
}): string {
  return sign({ id, role, email }, JWT_SECRET_KEY as string, {
    expiresIn: "7d",
  });
}
export function verifySocketToken(token: string) {
  try {
    return verify(token, secret) as TokenData;
  } catch (error) {
    console.error(error);
    return null;
  }
}
export const verifyToken = (
  authHeader: string | undefined,
): { id?: string; email?: string } => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const errorMessage = "No token provided or invalid format.";
    throw { statusCode: httpStatus.UNAUTHORIZED, message: errorMessage };
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY as string) as {
      id?: string;
      email?: string;
    };
    return decoded;
  } catch (error) {
    throw new ApiError(498, "Invalid or expired token.");
  }
};
export const generateRegisterToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET_KEY as string, { expiresIn: "1h" });
};
