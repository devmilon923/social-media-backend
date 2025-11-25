import { Document, Types } from "mongoose";

export const StatusEnum = ["public", "private"];
export type IPost = {
  user_id: Types.ObjectId;
  title: string;
  image: string;
  status: "private" | "public";
  comment_count: number;
  reaction_count: number;
} & Document;

export type IComment = {
  user_id: Types.ObjectId;
  post_id: Types.ObjectId;
  text: string;
  reply_count: number;
  reaction_count: number;
} & Document;

export type IReplies = {
  comment_id: Types.ObjectId;
  post_id: Types.ObjectId;
  user_id: Types.ObjectId;
  text: string;
  reaction_count: number;
} & Document;

export type IReaction = {
  user_id: Types.ObjectId;
  target_id: Types.ObjectId;
  target_type: "post" | "comment" | "reply";
  reaction_type: "like" | "love" | "haha" | "wow" | "angry";
  reaction_count: number;
} & Document;
