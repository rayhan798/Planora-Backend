// src/modules/contact/contact.controller.ts
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import httpStatus from "http-status";
import { ContactService } from "./contact.service";

const createMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactService.createMessageIntoDB(req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Message sent successfully!",
    data: result,
  });
});

const getAllMessages = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactService.getAllMessagesFromDB();

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Messages retrieved successfully!",
    data: result,
  });
});

export const ContactController = {
  createMessage,
  getAllMessages,
};