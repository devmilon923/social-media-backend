import mongoose, { Document } from "mongoose";
export type ISupport = {
  name: string;
  email: string;
  msg: string;
  createdAt: Date;
  isDeleted: boolean;
} & Document;
