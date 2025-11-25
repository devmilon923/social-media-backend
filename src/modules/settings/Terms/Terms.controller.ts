import httpStatus from "http-status";
import sendError from "../../../utils/sendError";
import {
  createTermsInDB,
  getAllTermsFromDB,
  updateTermsInDB,
} from "./Terms.service";
import sendResponse from "../../../utils/sendResponse";

import catchAsync from "../../../utils/catchAsync";

import sanitizeHtml from "sanitize-html";
import { Request, Response } from "express";
import { findUserById } from "../../user/user.utils";
import { verifyToken } from "../../../utils/JwtToken";
import ApiError from "../../../errors/ApiError";

export const createTerms = catchAsync(async (req: Request, res: Response) => {
  let decoded;
  try {
    decoded = verifyToken(req.headers.authorization);
  } catch (error: any) {
    return sendError(res, error);
  }
  const userId = decoded.id as string; // Assuming the token contains the userId

  // Find the user by userId
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const { description } = req.body;
  const sanitizedContent = sanitizeHtml(description);
  if (!description) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Description is required!");
  }

  const result = await createTermsInDB({ sanitizedContent });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Terms created successfully.",
    data: result,
  });
});

export const getAllTerms = catchAsync(async (req: Request, res: Response) => {
  const result = await getAllTermsFromDB();
  const responseData = result[0];
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Terms retrieved successfully.",
    data: responseData,
  });
});

export const updateTerms = catchAsync(async (req: Request, res: Response) => {
  let decoded;
  try {
    decoded = verifyToken(req.headers.authorization);
  } catch (error: any) {
    return sendError(res, error);
  }

  const userId = decoded.id as string;

  // Find the user by userId
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const { description } = req.body;

  if (!description) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Description is required.");
  }

  const sanitizedDescription = sanitizeHtml(description);

  // Assume you're updating the terms based on the sanitized description
  const result = await updateTermsInDB(sanitizedDescription);

  if (!result) {
    // return sendError(res, {
    //   statusCode: httpStatus.INTERNAL_SERVER_ERROR,
    //   message: "Failed to update terms.",
    // });
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to update terms.");
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Terms updated successfully.",
    data: result,
  });
});
