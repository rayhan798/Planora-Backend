import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { ICreateReview, IUpdateReview } from "./review.interface";

export const ReviewService = {
  
  addReview: async (payload: ICreateReview) => {
    const existing = await prisma.review.findFirst({
      where: {
        eventId: payload.eventId,
        userId: payload.userId,
      },
    });

    if (existing) {
      throw new AppError(status.BAD_REQUEST, "You already reviewed this event");
    }

    const review = await prisma.review.create({
      data: {
        user: {
          connect: { id: Number(payload.userId) },
        },
        creator: {
          connect: { id: Number(payload.userId) }, 
        },
        event: {
          connect: { id: Number(payload.eventId) },
        },
        rating: payload.rating,
        comment: payload.comment || "",
      },
      include: {
        user: true,
        creator: true,
        event: true,
      },
    });

    return review;
  },

  editReview: async (reviewId: number, payload: IUpdateReview) => {
    return prisma.review.update({
      where: { id: reviewId },
      data: {
        ...payload,
        comment: payload.comment ?? "",
      },
    });
  },

  deleteReview: async (reviewId: number) => {
    return prisma.review.delete({
      where: { id: reviewId },
    });
  },

  getMyReviews: async (userId: number) => {
    return prisma.review.findMany({
      where: {
        AND: [
          {
            event: {
              creatorId: userId,
            },
          },
          {
            userId: {
              not: userId,
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  getEventReviews: async (eventId?: number) => {
    return prisma.review.findMany({
      where: eventId ? { eventId } : {},
      include: {
        user: true,
        event: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};
