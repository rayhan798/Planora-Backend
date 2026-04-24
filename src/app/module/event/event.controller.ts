import { Request, Response } from "express";
import status from "http-status";
import { EventService } from "./event.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { UpdateEventInput } from "./event.validation";
import { IEventResponse } from "./event.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { uploadFileToCloudinary } from "../../config/cloudinary.config";

// ---------------- CREATE EVENT ----------------
const createEvent = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  if (!user?.userId) {
    throw new AppError(status.UNAUTHORIZED, "User not authenticated");
  }

  const imageUrl = req.file?.path || req.body.image || null;

  const payload = {
    title: req.body.title,
    description: req.body.description,
    date: req.body.date,
    time: req.body.time,
    venue: req.body.venue,

    isPublic:
      typeof req.body.isPublic === "string"
        ? req.body.isPublic === "true"
        : Boolean(req.body.isPublic),

    fee: req.body.fee ? Number(req.body.fee) : 0,
    
    
    totalSeats: req.body.totalSeats ? Number(req.body.totalSeats) : 0,

    image: imageUrl,
    creatorId: Number(user.userId),
  };

  const event = await EventService.createEvent(payload);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Event created successfully",
    data: event,
  });
});

// ---------------- UPDATE EVENT ----------------
const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const eventId = Number(req.params.id);
  const user = req.user as IRequestUser;

  if (!user?.userId) {
    throw new AppError(status.UNAUTHORIZED, "User not authenticated");
  }

  let imageUrl: string | undefined;

  if (req.file) {
    const uploadResult = await uploadFileToCloudinary(
      req.file.buffer,
      req.file.originalname
    );
    imageUrl = uploadResult.secure_url;
  }

  const payload: UpdateEventInput = {
    ...req.body,

    image:
      imageUrl ||
      (typeof req.body.image === "string" ? req.body.image : undefined),

    isPublic:
      req.body.isPublic !== undefined
        ? typeof req.body.isPublic === "string"
          ? req.body.isPublic === "true"
          : Boolean(req.body.isPublic)
        : undefined,

    fee:
      req.body.fee !== undefined ? Number(req.body.fee) : undefined,

    
    totalSeats: 
      req.body.totalSeats !== undefined ? Number(req.body.totalSeats) : undefined,
  };

  const event = await EventService.updateEvent(
    eventId,
    payload,
    Number(user.userId),
    user.role
  );

  const response: IEventResponse = {
    ...event,
    creator: {
      id: event.creator?.id ?? Number(user.userId),
      name: event.creator?.name ?? user.name,
      email: event.creator?.email ?? user.email,
    },
    participantCount: event.participations?.length ?? 0,
    reviewsCount: event.reviews?.length ?? 0,
  };

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Event updated successfully",
    data: response,
  });
});

// ---------------- DELETE EVENT ----------------
const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const eventId = Number(req.params.id);
  const user = req.user as IRequestUser;

  if (!user?.userId) {
    throw new AppError(status.UNAUTHORIZED, "User not authenticated");
  }

  const event = await EventService.deleteEvent(
    eventId,
    Number(user.userId),
    user.role
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Event deleted successfully",
    data: { id: event.id },
  });
});

// ---------------- GET ALL EVENTS ----------------
const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const query: any = { ...req.query };

  if (req.originalUrl.includes("/my-events")) {
    query.creatorId = Number(user.userId);
  } else if (query.creatorId) {
    query.creatorId = Number(query.creatorId);
  }

  const result = await EventService.getAllEvents(
    user?.userId ? Number(user.userId) : undefined,
    user?.role || "GUEST",
    query
  );

  const response: IEventResponse[] = result.data.map((e: any) => ({
    ...e,
    creator: {
      id: e.creator?.id ?? 0,
      name: e.creator?.name ?? "Unknown",
      email: e.creator?.email ?? "",
    },
    participantCount: e.participations?.length ?? 0,
    reviewsCount: e.reviews?.length ?? 0,
  }));

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Events fetched successfully",
    data: response,
    meta: result.meta,
  });
});

// ---------------- GET PUBLIC EVENTS FOR SLIDER ----------------
const getPublicEventsForSlider = catchAsync(async (req: Request, res: Response) => {
  const query: any = { 
    isPublic: "true", 
    limit: 9,
    sortBy: "date",
    sortOrder: "asc" 
  };

  const result = await EventService.getAllEvents(
    undefined, 
    "GUEST",
    query
  );

  const response: IEventResponse[] = result.data.map((e: any) => ({
    ...e,
    creator: {
      id: e.creator?.id ?? 0,
      name: e.creator?.name ?? "Unknown",
      email: e.creator?.email ?? "",
    },
    participantCount: e.participations?.length ?? 0,
    reviewsCount: e.reviews?.length ?? 0,
  }));

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Public slider events fetched successfully",
    data: response,
  });
});

// ---------------- GET EVENT BY ID ----------------
const getEventById = catchAsync(async (req: Request, res: Response) => {
  const eventId = Number(req.params.id);
  const user = req.user as IRequestUser;

  const event = await EventService.getEventById(
    eventId,
    Number(user?.userId),
    user?.role || "USER"
  );

  const response: IEventResponse = {
    ...event,
    creator: {
      id: event.creator?.id ?? 0,
      name: event.creator?.name ?? "Unknown",
      email: event.creator?.email ?? "",
    },
    participantCount: event.participations?.length ?? 0,
    reviewsCount: event.reviews?.length ?? 0,
  };

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Event fetched successfully",
    data: response,
  });
});



 //---------------- INITIATE PAYMENT ----------------
const initiateEventPayment = catchAsync(async (req: Request, res: Response) => {
  
  const id = req.params.id; 
  
  const user = req.user as IRequestUser;

  const paymentInfo = await EventService.initiateEventPayment(
    Number(id),
    user
  );

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Payment initiated successfully",
    data: {
      paymentUrl: paymentInfo.paymentUrl, 
    
    },
  });
});

export const EventController = {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
  getPublicEventsForSlider,
  initiateEventPayment
};