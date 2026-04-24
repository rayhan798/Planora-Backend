import { Request, Response } from "express";
import { ReviewService } from "./review.service";
import { catchAsync } from "../../shared/catchAsync";
import status from "http-status";
import AppError from "../../errorHelpers/AppError";

export const ReviewController = {
  addReview: catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;

    if (!user?.userId) {
      throw new AppError(status.UNAUTHORIZED, "Unauthorized");
    }

    const review = await ReviewService.addReview({
      ...req.body,
      userId: user.userId,
    });

    res.status(status.CREATED).json({
      success: true,
      data: review,
    });
  }),

  editReview: catchAsync(async (req: Request, res: Response) => {
    const review = await ReviewService.editReview(
      Number(req.params.id),
      req.body
    );
    res.status(status.OK).json({ success: true, data: review });
  }),

  deleteReview: catchAsync(async (req: Request, res: Response) => {
    const result = await ReviewService.deleteReview(Number(req.params.id));
    res.status(status.OK).json({ success: true, data: result });
  }),

  getEventReviews: catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;

   
    if (!eventId || eventId === "undefined" || eventId === "null") {
      return res.status(status.OK).json({
        success: true,
        message: "No valid eventId provided",
        data: [],
      });
    }

    // ২. CASE: MY REVIEWS
    if (eventId === "my") {
      const user = (req as any).user;
      const userId = Number(user?.userId || user?.id); 

      if (!userId) {
        throw new AppError(status.UNAUTHORIZED, "User not found in request");
      }

      const reviews = await ReviewService.getMyReviews(userId);
      return res.status(status.OK).json({ success: true, data: reviews });
    }

    // ৩. CASE: ALL REVIEWS
    if (eventId === "all") {
      const reviews = await ReviewService.getEventReviews(); 
      return res.status(status.OK).json({ success: true, data: reviews });
    }

    // ৪. CASE: SPECIFIC EVENT REVIEWS (Number check)
    const parsedEventId = Number(eventId);
    if (isNaN(parsedEventId)) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: `Invalid eventId format: ${eventId}`,
      });
    }

    const reviews = await ReviewService.getEventReviews(parsedEventId);

    return res.status(status.OK).json({
      success: true,
      data: reviews,
    });
  }),
};