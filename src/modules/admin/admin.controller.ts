import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { Types } from "mongoose";
import sendResponse from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { days } = req.query;
  if (!days)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Days is required if you want to suspend anyone!",
    );

  const updateStatus = await AdminService.updateStatus(
    new Types.ObjectId(req.params?.userId),
    Number(days),
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User suspention action perform.",
    data: updateStatus,
  });
});

export const AdminController = {
  changeUserStatus,
};
