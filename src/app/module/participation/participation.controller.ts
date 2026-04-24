// src/app/module/participation/participation.controller.ts

import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ParticipationService } from "./participation.service";
import { createParticipationSchema } from "./participation.validation";

const createParticipation = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { eventId } = createParticipationSchema.parse(req.body);

  const result = await ParticipationService.createParticipation(userId, eventId);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Participation created successfully",
    data: result,
  });
});

const getAllParticipations = catchAsync(async (req: Request, res: Response) => {
  const result = await ParticipationService.getAllParticipations();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "All participations fetched successfully",
    data: result,
  });
});

const getParticipationById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ParticipationService.getParticipationById(Number(id));

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Participation details fetched",
    data: result,
  });
});

const getPendingParticipations = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const result = await ParticipationService.getPendingFromDB(Number(eventId));

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Pending requests fetched successfully",
    data: result,
  });
});

const updateParticipationStatus = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { userId, status: newStatus } = req.body;

  const result = await ParticipationService.updateStatusInDB(
    Number(eventId),
    Number(userId),
    newStatus
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: `Request ${newStatus.toLowerCase()} successfully`,
    data: result,
  });
});

const deleteParticipation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ParticipationService.deleteParticipation(Number(id));

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Participation deleted successfully",
    data: result,
  });
});

const cancelParticipation = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { eventId } = req.params;

  const result = await ParticipationService.cancelParticipation(Number(eventId), userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Join request cancelled successfully",
    data: result,
  });
});

export const ParticipationController = {
  createParticipation,
  getAllParticipations,
  getParticipationById,
  getPendingParticipations,
  updateParticipationStatus,
  deleteParticipation,
  cancelParticipation
};