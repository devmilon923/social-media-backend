import mongoose, { Schema } from "mongoose";
import { IFriends } from "./friends.interface";

const friendSchema = new Schema<IFriends>(
  {
    following_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followed_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: false,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);
export const Friends = mongoose.model<IFriends>("friends", friendSchema);
