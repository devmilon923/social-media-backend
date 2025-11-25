import { UserController } from "../user/user.controller";
import mongoose, { Schema } from "mongoose";
import { IUser, IOTP, MoodEnum } from "./user.interface";
import { ERole } from "../../config/role";

const UserSchema = new Schema<IUser>(
  {
    first_name: { type: String, trim: true },
    last_name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, trim: true },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: false,
      default: null,
    },
    address: { type: String, trim: true, default: null },

    image: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ERole,
      required: false,
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: true,
    },
    fcmToken: { type: String, trim: true },
    isRequest: {
      type: String,
      enum: ["approve", "deny", "send"],
      default: "send",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

UserSchema.index({ name: "text" });
UserSchema.index({ createdAt: 1 });
UserModel.schema.index({ role: 1 });

const OTPSchema = new Schema<IOTP>({
  email: { type: String, required: true, trim: true, index: true },
  otp: { type: String, required: true, trim: true },
  expiresAt: { type: Date, required: true, index: { expires: "1m" } },
});

export const OTPModel = mongoose.model<IOTP>("OTP", OTPSchema);
OTPSchema.index({ email: 1, expiresAt: 1 });
