import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import {
  ICreateInvitation,
  IUpdateInvitation,
} from "./invitation.interface";
import { InviteStatus } from "../../../generated/prisma/client";

// 🔹 Send Invite
const sendInvite = async ({
  eventId,
  receiverId,
  senderId,
}: ICreateInvitation) => {
  if (Number(senderId) === Number(receiverId)) {
    throw new AppError(status.BAD_REQUEST, "You cannot invite yourself");
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });
  if (!receiver) {
    throw new AppError(status.NOT_FOUND, "Receiver not found");
  }

  const existing = await prisma.invitation.findFirst({
    where: { eventId, receiverId },
  });

  if (existing) {
    throw new AppError(status.BAD_REQUEST, "Invitation already sent to this user");
  }

const invitation = await prisma.invitation.create({
  data: {
    creator: {
      connect: { id: Number(senderId) } 
    },
    event: {
      connect: { id: Number(eventId) }
    },
    sender: {
      connect: { id: Number(senderId) }
    },
    receiver: {
      connect: { id: Number(receiverId) }
    },
    status: "PENDING",
  },
  include: {
    event: true,
    sender: true,
    receiver: true,
    creator: true
  }
});

  return invitation;
};

// 🔹 Accept / Reject Invite
const respondInvite = async (
  invitationId: number,
  userId: number, 
  payload: IUpdateInvitation
) => {

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new AppError(status.NOT_FOUND, "Invitation not found");
  }


  if (invitation.receiverId !== userId) {
    throw new AppError(status.FORBIDDEN, "You are not authorized to respond to this invitation");
  }

 
  const updated = await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      status: payload.status as InviteStatus,
    },
  });

  return updated;
};

// 🔹 Get My Invitations
// invitation.service.ts
const getMyInvites = async (userId: number) => {
  return prisma.invitation.findMany({
    where: {
      receiverId: userId 
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          date: true,
          time: true,
          venue: true,
          image: true, 
          fee: true
        }
      },
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true 
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};
// ✅ SINGLE EXPORT (IMPORTANT)
export const InvitationService = {
  sendInvite,
  respondInvite,
  getMyInvites,
};