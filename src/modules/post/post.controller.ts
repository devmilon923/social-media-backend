import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { Comments, Post, Reactions, Replies } from "./post.model";
import paginationBuilder from "../../utils/paginationBuilder";
import mongoose from "mongoose";
import { IUserPayload } from "../../middlewares/roleGuard";
import ApiError from "../../errors/ApiError";

const createPost = catchAsync(async (req: Request, res: Response) => {
  const { title, status } = req.body;
  const user = req.user as IUserPayload;
  let image = null;
  if (req.file?.filename) {
    image = `/images/${req.file.filename}`;
  }
  const result = await Post.findOneAndUpdate(
    { title, image, user_id: new mongoose.Types.ObjectId(user.id || "n/a") },
    {
      title,
      image,
      status,
      user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
    },
    { new: true, upsert: true, runValidators: true }
  );
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New post added successfully",
    data: result,
  });
});
const getFeed = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const user = req.user as IUserPayload;
  let query = {
    status: "public",
  };
  const skip = (page - 1) * limit;
  const result = await Post.find(query)
    .populate("user_id", "first_name last_name image")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const totalData = await Post.countDocuments(query);
  const pagination = paginationBuilder({ totalData, currentPage: page, limit });

  const formattedResponse = await Promise.all(
    result.map(async (post: any) => {
      const comments: any = await Comments.findOne({ post_id: post?._id })
        .sort({ createdAt: -1 })
        .populate("user_id", "first_name last_name image");
      const CRcount: any = await Reactions.countDocuments({
        target_id: comments?._id,
        target_type: "comment",
      });
      const isCR: any = await Reactions.findOne({
        user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
        target_id: comments?._id,
        target_type: "comment",
      })
        .sort({ createdAt: -1 })
        .select("reaction_type");
      const repliesCount = await Replies.countDocuments({
        post_id: post?._id,
        comment_id: comments?._id,
      });
      const replies = await Replies.find({
        post_id: post?._id,
        comment_id: comments?._id,
      })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate("user_id", "first_name last_name image");
      const isPR: any = await Reactions.findOne({
        user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
        target_id: post?._id,
        target_type: "post",
      }).select("reaction_type");

      // Fix: Await the Promise.all() for lastCommentReplies
      const lastCommentReplies = await Promise.all(
        replies.map(async (reply: any) => {
          const isRR: any = await Reactions.findOne({
            user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
            target_id: reply?._id, // Fix: should be reply._id, not comments._id
            target_type: "reply", // Fix: should be "reply", not "comment"
          })
            .sort({ createdAt: -1 })
            .select("reaction_type");
          const count: any = await Reactions.countDocuments({
            user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
            target_id: reply?._id,
            target_type: "reply",
          });
          return {
            id: reply._id,
            text: reply.text,
            user: `${reply?.user_id.first_name} ${reply?.user_id.last_name}`,
            image: reply?.user_id.image || "",
            reaction: count,
            createdAt: reply.createdAt,
            isReact: isRR?.reaction_type ? isRR?.reaction_type : null,
          };
        })
      );

      return {
        user: {
          id: post.user_id._id,
          name: `${post?.user_id.first_name} ${post?.user_id.last_name}`,
          image: post?.user_id.image,
        },
        post: {
          id: post._id,
          title: post.title,
          image: post.image || null,
          status: post.status,
          reaction_count: post?.reaction_count,
          comment_count: post?.comment_count + repliesCount,
          createdAt: post.createdAt,
          isReact: isPR?.reaction_type ? isPR?.reaction_type : null,
        },
        lastComment: comments
          ? {
              id: comments._id,
              text: comments.text,
              user: `${comments?.user_id.first_name} ${comments?.user_id.last_name}`,
              image: comments?.user_id.image || "",
              reaction: CRcount,
              createdAt: comments.createdAt,
              isReact: isCR?.reaction_type ? isCR?.reaction_type : null,
            }
          : {},
        lastCommentReplies,
      };
    })
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New post get successfully",
    data: formattedResponse,
    pagination,
  });
});

const addComment = catchAsync(async (req: Request, res: Response) => {
  const post_id = req.params.postId as string;
  const text = req.body.text as string;
  if (!text?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Comment text is required");
  }
  const user = req.user as IUserPayload;
  const result = await Comments.create({
    text,
    user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
    post_id: new mongoose.Types.ObjectId(post_id || "n/a"),
  });
  await Post.findByIdAndUpdate(post_id, { $inc: { comment_count: 1 } });
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New comment added successfully",
    data: result,
  });
});

const addReplies = catchAsync(async (req: Request, res: Response) => {
  const post_id = req.params.postId as string;
  const text = req.body.text as string;
  console.log(text);
  const comment_id = req.body.comment_id as string;
  if (!text?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Comment text is required");
  }
  if (!comment_id?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Comment id is required");
  }
  const checkCommentId: any = await Comments.countDocuments({
    post_id: new mongoose.Types.ObjectId(post_id || "n/a"),
    _id: new mongoose.Types.ObjectId(comment_id || "n/a"),
  });
  if (checkCommentId === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid comment id");
  }
  const user = req.user as IUserPayload;
  const result = await Replies.create({
    text,
    user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
    post_id: new mongoose.Types.ObjectId(post_id || "n/a"),
    comment_id: new mongoose.Types.ObjectId(comment_id || "n/a"),
  });
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment replied successfully",
    data: result,
  });
});

const addReaction = catchAsync(async (req: Request, res: Response) => {
  const targetId = req.params.targetId as string;
  const { type, react } = req.body;
  if (!type || !react) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Reaction type and react is required"
    );
  }
  console.log(type);
  const user = req.user as IUserPayload;
  const result: any = await Reactions.findOne({
    user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
    target_id: new mongoose.Types.ObjectId(targetId || "n/a"),
    target_type: (type as string).toLowerCase(),
  });
  if (!result) {
    if (type === "post") {
      await Post.findByIdAndUpdate(targetId, { $inc: { reaction_count: 1 } });
    } else if (type === "comment") {
      await Comments.findByIdAndUpdate(targetId, {
        $inc: { reaction_count: 1 },
      });
    } else if (type === "reply") {
      await Replies.findByIdAndUpdate(targetId, {
        $inc: { reaction_count: 1 },
      });
    }
    await Reactions.create({
      user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
      target_id: new mongoose.Types.ObjectId(targetId || "n/a"),
      target_type: (type as string).toLowerCase(),
      reaction_type: react,
    });
  } else {
    if (result?.reaction_type === (react as string).toLowerCase()) {
      if (result.target_type === "post") {
        await Post.findByIdAndUpdate(result.target_id, {
          $inc: { reaction_count: -1 },
        });
      } else if (result.target_type === "comment") {
        await Comments.findByIdAndUpdate(result.target_id, {
          $inc: { reaction_count: -1 },
        });
      } else if (result.target_type === "reply") {
        await Replies.findByIdAndUpdate(result.target_id, {
          $inc: { reaction_count: -1 },
        });
      }
      await result.deleteOne();
    } else {
      result.reaction_type = (react as string).toLowerCase();
      await result.save();
    }
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Replied reaction send successfully",
    data: true,
  });
});

const getReaction = catchAsync(async (req: Request, res: Response) => {
  const targetId = req.params.targetId as string;
  const { type } = req.body;
  if (!type) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Reaction type is required");
  }

  const user = req.user as IUserPayload;
  const result: any = await Reactions.find({
    target_id: new mongoose.Types.ObjectId(targetId || "n/a"),
    target_type: (type as string).toLowerCase(),
    // user_id: { $ne: new mongoose.Types.ObjectId(user.id || "n/a") },
  })
    .sort({ createdAt: -1 })
    .populate("user_id", "first_name last_name image");
  const response = result.map((reaction: any) => {
    return {
      id: reaction?._id,
      name: `${reaction.user_id.first_name} ${reaction.user_id.last_name}`,
      reaction: reaction?.reaction_type,
      avatar: reaction?.user_id.image || "",
    };
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reaction get successfully",
    data: response,
  });
});
export const PostController = {
  createPost,
  getFeed,
  addComment,
  addReplies,
  addReaction,
  getReaction,
};
