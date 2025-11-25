import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { UserModel } from "../user/user.model";
import mongoose from "mongoose";
import { IUserPayload } from "../../middlewares/roleGuard";
import { Friends } from "./friends.model";
import paginationBuilder from "../../utils/paginationBuilder";
import ApiError from "../../errors/ApiError";

const sendRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const user = req.user as IUserPayload;
  const result = await Friends.findOneAndUpdate(
    {
      followed_user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
      following_user_id: new mongoose.Types.ObjectId(userId || "n/a"),
      status: { $ne: "accepted" },
    },
    {
      followed_user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
      following_user_id: new mongoose.Types.ObjectId(userId || "n/a"),
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Request send successfully",
    data: result,
  });
});
const action = catchAsync(async (req: Request, res: Response) => {
  const requestId = req.params.requestId;
  const status = req.body.status as string;
  const user = req.user as IUserPayload;
  if (!status?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Status is required");
  }
  const result = await Friends.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(requestId || "n/a"),
      $or: [
        { followed_user_id: new mongoose.Types.ObjectId(user.id || "n/a") },
        { following_user_id: new mongoose.Types.ObjectId(user.id || "n/a") },
      ],
    },
    { status }
  );
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Request action added successfully",
    data: result,
  });
});
const getNewFriends = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const friendsList = await Friends.find({
    $or: [
      {
        followed_user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
      },
      {
        following_user_id: new mongoose.Types.ObjectId(user.id || "n/a"),
      },
    ],
  }).sort({ createdAt: -1 });
  const friendIds = friendsList.map((f: any) =>
    f.following_user_id.equals(user.id)
      ? f.followed_user_id
      : f.following_user_id
  );
  const result = await UserModel.find({
    _id: { $nin: [...friendIds, new mongoose.Types.ObjectId(user.id)] },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select("first_name last_name image")
    .lean();
  const totalData = await UserModel.countDocuments({
    _id: { $nin: [...friendIds, new mongoose.Types.ObjectId(user.id)] },
  });
  const pagination = paginationBuilder({ totalData, currentPage: page, limit });
  const response = result.map((usr: any) => {
    return {
      id: usr?._id,
      name:
        usr.first_name && usr.last_name
          ? `${usr.first_name} ${usr.first_name}`
          : "Unknown",
      title: "CEO of Figma",
      avatar: usr.image || "",
      connected: false,
    };
  });
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New users get successfully",
    data: response,
    pagination,
  });
});
const getMyFriends = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const status = req.query.status as string;
  const userId = new mongoose.Types.ObjectId(user.id || "n/a");
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  if (!status?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "status is required");
  }
  let query: any = {
    status: status,
  };
  if (status === "accepted") {
    query.$or = [{ followed_user_id: userId }, { following_user_id: userId }];
  }
  if (status === "pending") {
    query.following_user_id = userId;
  }
  const friendsList = await Friends.find(query)
    .populate("following_user_id", "first_name last_name image")
    .populate("followed_user_id", "first_name last_name image")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const totalData = await Friends.countDocuments(query);

  const pagination = paginationBuilder({
    totalData,
    currentPage: page,
    limit,
  });

  // Map friends data
  const response = friendsList.map((friendship: any) => {
    const friendUser = friendship.following_user_id._id.equals(userId)
      ? friendship.followed_user_id
      : friendship.following_user_id;

    return {
      id: friendUser?._id,
      requestId: friendship?._id,
      name:
        friendUser?.first_name && friendUser?.last_name
          ? `${friendUser.first_name} ${friendUser.last_name}`
          : "Unknown",
      avatar: friendUser?.avatar || friendUser?.image || "",
    };
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Friends retrieved successfully",
    data: response,
    pagination,
  });
});
export const FriendsController = {
  getNewFriends,
  sendRequest,
  getMyFriends,
  action,
};
