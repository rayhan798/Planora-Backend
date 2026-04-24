import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IAdminStats } from "./admin.interface";

// ✅ Get All Users (NEW ADD)
const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users;
};

// Delete User
const deleteUser = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // 🔥 first delete related events
  await prisma.event.deleteMany({
    where: { creatorId: userId },
  });

  // then delete user
  await prisma.user.delete({
    where: { id: userId },
  });

  return { id: userId };
};

// Delete Event
const deleteEvent = async (eventId: number) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  await prisma.event.delete({
    where: { id: eventId },
  });

  return { id: eventId };
};

// System Stats
const getSystemStats = async (): Promise<IAdminStats> => {
  const totalUsers = await prisma.user.count();
  const totalEvents = await prisma.event.count();
  const totalParticipations = await prisma.participation.count();
  const totalReviews = await prisma.review.count();

  return {
    totalUsers,
    totalEvents,
    totalParticipations,
    totalReviews,
  };
};

export const AdminService = {
  getAllUsers, 
  deleteUser,
  deleteEvent,
  getSystemStats,
};