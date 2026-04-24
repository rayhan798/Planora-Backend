import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AdminService } from "./admin.service";
import { idParamSchema } from "./admin.validation";

// ✅ Get All Users
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await AdminService.getAllUsers();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Users retrieved successfully",
    data: users,
  });
});

// Delete User
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);

  const result = await AdminService.deleteUser(Number(id));

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

// Delete Event
const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);

  const result = await AdminService.deleteEvent(Number(id));

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Event deleted successfully",
    data: result,
  });
});

// System Stats
const getSystemStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await AdminService.getSystemStats();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "System stats retrieved successfully",
    data: stats,
  });
});

export const AdminController = {
  getAllUsers,
  deleteUser,
  deleteEvent,
  getSystemStats,
};
