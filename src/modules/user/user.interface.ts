import mongoose, { Document, ObjectId } from "mongoose";
import { TRole } from "../../config/role";
export const MoodEnum = ["Peaceful", "Grateful", "Hopeful", "Lonely", "Sad"];
export type IUser = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  gender?: "male" | "female" | "other";
  address?: string;
  image: string;
  isVerified: boolean;
  role: TRole;
  isRequest?: "approve" | "deny" | "send";
  isDeleted: boolean;
  fcmToken?: string;
} & Document;

export type IOTP = {
  email: string;
  otp: string;
  expiresAt: Date;
} & Document;
