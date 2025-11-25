import mongoose, { Schema } from "mongoose";
import { INotification } from "./notification.interface";

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adminId: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    adminMsgTittle: { type: String, required: true },
    adminMsg: { type: String, required: true },
    isAdminRead: { type: Boolean, default: false },
    userMsgTittle: { type: String, required: true },
    userMsg: { type: String, required: true },
    isUserRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
