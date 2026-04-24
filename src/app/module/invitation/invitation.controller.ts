import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { InvitationService } from "./invitation.service";
import {
  createInvitationSchema,
  updateInvitationSchema,
} from "./invitation.validation";
import { sendResponse } from "../../shared/sendResponse";

export const InvitationController = {
  sendInvite: catchAsync(async (req: Request, res: Response) => {
    const payload = createInvitationSchema.parse(req.body);

    const senderId = (req as any).user.userId;

    const result = await InvitationService.sendInvite({
      ...payload,
      senderId: Number(senderId), 
    });

    sendResponse(res, {
      httpStatusCode: 201,
      success: true,
      message: "Invitation sent successfully",
      data: result,
    });
  }),

  // 🔹 Accept / Reject
  respondInvite: catchAsync(async (req: Request, res: Response) => {
    const invitationId = Number(req.params.id);
    
    const userId = (req as any).user.userId; 

    const payload = updateInvitationSchema.parse(req.body);

    const result = await InvitationService.respondInvite(
      invitationId,
      Number(userId),
      payload
    );

    sendResponse(res, {
      httpStatusCode: 200,
      success: true,
      message: `Invitation ${payload.status.toLowerCase()}ed successfully`,
      data: result,
    });
  }),

  // 🔹 My Invites
 getMyInvites: catchAsync(async (req: Request, res: Response) => {
  const userIdFromToken = (req as any).user?.userId || (req as any).user?.id;

  if (!userIdFromToken) {
    throw new Error("Unauthorized! No valid User ID found in token.");
  }

  const result = await InvitationService.getMyInvites(Number(userIdFromToken));

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    message: "Invitations fetched successfully",
    data: result,
  });
}),

};