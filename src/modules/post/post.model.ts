import mongoose, { Schema } from "mongoose";
import {
  IComment,
  IPost,
  IReaction,
  IReplies,
  StatusEnum,
} from "./post.interface";

const postSchema = new Schema<IPost>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    image: { type: String, required: false, default: null },
    status: { type: String, required: true, enum: StatusEnum },
    comment_count: { type: Number, required: false, default: 0 },
    reaction_count: { type: Number, required: false, default: 0 },
  },
  { timestamps: true }
);

const commentSchema = new Schema<IComment>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
      required: true,
    },
    text: { type: String, required: true, trim: true },
    reply_count: { type: Number, required: true, trim: true, default: 0 },
    reaction_count: { type: Number, required: true, trim: true, default: 0 },
  },
  { timestamps: true }
);

const repliesSchema = new Schema<IReplies>(
  {
    comment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
      required: true,
    },
    text: { type: String, required: true, trim: true },
    reaction_count: { type: Number, required: true, trim: true, default: 0 },
  },
  { timestamps: true }
);

const reactionSchema = new Schema<IReaction>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    target_type: {
      type: String,
      required: true,
      trim: true,
      enum: ["post", "comment", "reply"],
    },
    reaction_type: {
      type: String,
      required: true,
      trim: true,
      enum: ["like", "love", "haha", "wow", "angry"],
    },
    reaction_count: { type: Number, required: true, trim: true, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ user_id: 1, status: 1 });

export const Post = mongoose.model<IPost>("posts", postSchema);
export const Comments = mongoose.model<IComment>("comments", commentSchema);
export const Replies = mongoose.model<IReplies>("replies", repliesSchema);
export const Reactions = mongoose.model<IReaction>("reactions", reactionSchema);
