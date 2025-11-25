import { Document, Types } from "mongoose";

// Define the INotification type
export type INotification = {
  userId: Types.ObjectId;
  adminId: Types.ObjectId[];
  adminMsgTittle: string;
  adminMsg: string;
  userMsgTittle: string;
  userMsg: string;
  isAdminRead: Boolean;
  isUserRead: Boolean;
} & Document;

export type INotificationPayload = {
  title: string;
  body: string;
};
