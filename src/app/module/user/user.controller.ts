import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { UserService } from "./user.service";
import { sendResponse } from "../../shared/sendResponse";
import {
  createUserSchema,
  updateUserSchema,
  CreateUserInput,
  UpdateUserInput,
} from "./user.validation";
import AppError from "../../errorHelpers/AppError";

// ---------------- Create User ----------------
const createUser = catchAsync(async (req: Request, res: Response) => {
  const parsedBody: CreateUserInput = createUserSchema.parse(req.body);

  const user = await UserService.createUser(parsedBody);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "User created successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// ---------------- Create Admin ----------------
const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const parsedBody: CreateUserInput = createUserSchema.parse(req.body);

  const user = await UserService.createAdmin(parsedBody);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Admin created successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// ---------------- Get Profile (Logged in User Only) ----------------
const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;

  const user = await UserService.getProfile(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      bio: user.bio,
      image: user.image,
      emailEnabled: user.emailEnabled,
      pushEnabled: user.pushEnabled,
      smsEnabled: user.smsEnabled,
    },
  });
});

// ---------------- Get Notification Settings (Logged in User Only) ----------------
const getNotifications = catchAsync(async (req: Request, res: Response) => {

  const userId = (req as any).user?.userId || (req as any).user?.id;

  const result = await UserService.getNotifications(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Notification settings retrieved successfully",
    data: result,
  });
});

// ---------------- Update Profile (Logged in User Only) ----------------
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;

  const parsedBody: UpdateUserInput = updateUserSchema.parse(req.body);

  const user = await UserService.updateProfile(userId, parsedBody);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Profile updated successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      image: user.image,
    },
  });
});

// ---------------- Update Password ----------------
const updatePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  const { newPassword } = req.body;

  if (!newPassword) {
    return sendResponse(res, {
      httpStatusCode: status.BAD_REQUEST,
      success: false,
      message: "New password is required",
    });
  }

  await UserService.updatePassword(userId, { newPassword });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Password updated successfully",
  });
});

// ---------------- Update Notification Settings ----------------
const updateNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  const { type, enabled } = req.body;

  if (!type || typeof enabled !== 'boolean') {
    return sendResponse(res, {
      httpStatusCode: status.BAD_REQUEST,
      success: false,
      message: "Notification type and status are required",
    });
  }

  const result = await UserService.updateNotifications(userId, { type, enabled });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Notification settings updated successfully",
    data: {
      emailEnabled: result.emailEnabled,
      pushEnabled: result.pushEnabled,
      smsEnabled: result.smsEnabled,
    },
  });
});

// ---------------- Get All Users (Admin Only) ----------------
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  // ১. চেক করুন ইউজার অ্যাডমিন কি না
  // (ধরে নিচ্ছি আপনার auth middleware req.user এ ডাটা পাস করে)
  if (req.user?.role !== 'ADMIN') {
    throw new AppError(status.FORBIDDEN, "You do not have permission to view this data");
  }

  const result = await UserService.getAllUsersFromDB(req.user?.role);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Users fetched successfully",
    data: result,
  });
});

// ---------------- Delete User (Admin Only) ----------------
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteUserFromDB(Number(id));

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  createAdmin,
  getProfile,
  getNotifications, 
  updateProfile,
  updatePassword,
  updateNotifications, 
  getAllUsers,
  deleteUser,
};