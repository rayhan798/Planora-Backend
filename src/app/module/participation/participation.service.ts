import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

const createParticipation = async (userId: number, eventId: number) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  const existing = await prisma.participation.findFirst({
    where: { userId, eventId },
  });

  if (existing) {
    throw new AppError(status.BAD_REQUEST, "Already joined/requested");
  }

  let statusValue: "PENDING" | "APPROVED" = "PENDING";
  let paymentStatus: "PAID" | "UNPAID" = "UNPAID";

  if (event.isPublic && event.fee === 0) {
    statusValue = "APPROVED";
  } 
  else if (event.isPublic && event.fee > 0) {
    statusValue = "PENDING";
  } 
  else if (!event.isPublic && event.fee === 0) {
    statusValue = "PENDING";
  } 
  else if (!event.isPublic && event.fee > 0) {
    statusValue = "PENDING";
  }

 return await prisma.participation.create({
  data: {
    creatorId: userId, 
    userId: userId,
    eventId: eventId,

    status: statusValue,
    paymentStatus: paymentStatus,
  },
  include: {
    user: true,
    event: true
  }
});
};


const getAllParticipations = async () => {
  return await prisma.participation.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, title: true, date: true } }
    },
    orderBy: { createdAt: "desc" }
  });
};

const getParticipationById = async (id: number) => {
  const result = await prisma.participation.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: true
    }
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, "Participation record not found");
  }

  return result;
};


const getPendingFromDB = async (eventId: number) => {
  return await prisma.participation.findMany({
    where: {
      eventId: eventId,
      status: "PENDING",
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const updateStatusInDB = async (
  eventId: number, 
  userId: number, 
  newStatus: "APPROVED" | "REJECTED"
) => {
  const participation = await prisma.participation.findFirst({
    where: { eventId, userId }
  });

  if (!participation) {
    throw new AppError(status.NOT_FOUND, "Participation record not found");
  }

  return await prisma.participation.updateMany({
    where: { eventId, userId },
    data: { status: newStatus },
  });
};




const deleteParticipation = async (id: number) => {
  const result = await prisma.participation.delete({
    where: { id },
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, "Could not delete. Record not found.");
  }

  return result;
};




const cancelParticipation = async (eventId: number, userId: number) => {
  const participation = await prisma.participation.findFirst({
    where: { eventId, userId }
  });

  if (!participation) {
    throw new AppError(status.NOT_FOUND, "Request not found to cancel");
  }

  return await prisma.participation.deleteMany({
    where: { eventId, userId }
  });
};

export const ParticipationService = {
  createParticipation,
  getAllParticipations,
  getParticipationById,
  getPendingFromDB,
  updateStatusInDB,
  deleteParticipation,
  cancelParticipation
};