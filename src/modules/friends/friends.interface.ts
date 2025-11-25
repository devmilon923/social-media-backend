import { Document, Types } from "mongoose";

export type IFriends = {
  following_user_id: Types.ObjectId;
  followed_user_id: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
} & Document;
