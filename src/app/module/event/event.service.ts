import { prisma } from "../../lib/prisma";
import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { UpdateEventInput } from "./event.validation";
import { IEvent } from "./event.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { v7 as uuidv7 } from "uuid";
import { stripe } from "../../config/stripe.config";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { envVars } from "../../config/env";

/* ---------------- 1. CREATE EVENT ---------------- */
export const createEvent = async (payload: any) => {
  const eventDate = new Date(payload.date);

  if (isNaN(eventDate.getTime())) {
    throw new AppError(status.BAD_REQUEST, "Invalid date format");
  }

  
  const fee =
    typeof payload.fee === "string"
      ? parseFloat(payload.fee)
      : Number(payload.fee || 0);

  if (isNaN(fee)) {
    throw new AppError(status.BAD_REQUEST, "Invalid fee");
  }

 
  const totalSeats = payload.totalSeats ? Number(payload.totalSeats) : 0;

  const event = await prisma.event.create({
    data: {
      title: payload.title,
      description: payload.description,
      date: eventDate,
      time: payload.time,
      venue: payload.venue,

      isPublic: payload.isPublic === true || payload.isPublic === "true",

      fee,

   
      totalSeats: totalSeats,
      bookedSeats: 0,

      image: payload.image ?? null,

      // creator must come from auth user
      creator: {
        connect: { id: Number(payload.creatorId) },
      },
    },

    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      participations: true,
      reviews: true,
    },
  });

  return event;
};

/* ---------------- 2. UPDATE EVENT ---------------- */
const updateEvent = async (
  eventId: number,
  payload: UpdateEventInput,
  userId: number,
  userRole: string,
): Promise<IEvent> => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  const isAdmin = userRole === "ADMIN";
  const isOwner = event.creatorId === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(status.FORBIDDEN, "Not authorized to update this event");
  }

  const updateData: any = { ...payload };

  /*  Normalize isPublic */
  if (payload.isPublic !== undefined) {
    updateData.isPublic =
      (payload.isPublic as unknown) === true ||
      (payload.isPublic as unknown) === "true";
  }

  /*  Normalize fee */
  if (payload.fee !== undefined) {
    const fee =
      typeof payload.fee === "string" ? parseFloat(payload.fee) : payload.fee;
    if (isNaN(fee)) {
      throw new AppError(status.BAD_REQUEST, "Invalid fee");
    }
    updateData.fee = fee;
  }

  /* Normalize totalSeats  */
  if ((payload as any).totalSeats !== undefined) {
    const totalSeats = Number((payload as any).totalSeats);
    if (isNaN(totalSeats)) {
      throw new AppError(status.BAD_REQUEST, "Invalid total seats count");
    }
    updateData.totalSeats = totalSeats;
  }

  /*  Date + Time Safe Merge */
  if (payload.date) {
    const datePart =
      typeof payload.date === "string"
        ? payload.date.split("T")[0]
        : payload.date;

    const timePart = payload.time || "00:00";

    const combinedDate = new Date(`${datePart}T${timePart}:00.000Z`);

    if (isNaN(combinedDate.getTime())) {
      console.error("Failed to parse date:", payload.date);
    } else {
      updateData.date = combinedDate;
    }
  }

  /*  Image safe handling */
  if (payload.image !== undefined) {
    if (typeof payload.image === "string") {
      updateData.image =
        payload.image.includes("[object Object]") ||
        payload.image === "undefined"
          ? null
          : payload.image;
    } else if (typeof payload.image === "object" && payload.image) {
      const img: any = payload.image;
      updateData.image = img.secure_url || img.url || img.path || null;
    }
  }

  return (prisma as any).event.update({
    where: { id: eventId },
    data: updateData,
    include: {
      creator: { select: { id: true, name: true, email: true } },
      participations: { select: { id: true, userId: true } },
      reviews: { select: { id: true, rating: true } },
    },
  });
};

/* ---------------- 3. DELETE EVENT ---------------- */
const deleteEvent = async (
  eventId: number,
  userId: number,
  userRole: string,
): Promise<IEvent> => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  const isAdmin = userRole === "ADMIN";
  const isOwner = event.creatorId === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(status.FORBIDDEN, "Not authorized");
  }

  return prisma.event.delete({
    where: { id: eventId },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      participations: { select: { id: true, userId: true } },
      reviews: { select: { id: true, rating: true } },
    },
  });
};

/* ---------------- 4. GET ALL EVENTS ---------------- */

const getAllEvents = async (
  userId: number | undefined, 
  userRole: string,
  queryParams?: Record<string, any>,
) => {
  const qb = new QueryBuilder<IEvent>(prisma.event, queryParams || {}, {
    searchableFields: ["title", "description", "venue"],
    filterableFields: ["isPublic", "fee", "date", "creatorId"],
  });

  if (queryParams?.creatorId) {
    qb.where({ creatorId: Number(queryParams.creatorId) } as any);
  }

  return qb
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      creator: { select: { id: true, name: true, email: true } },
      participations: { select: { id: true, userId: true } },
      reviews: { select: { id: true, rating: true } },
    })
    .execute();
};

// ----------------- GET PUBLIC EVENTS FOR SLIDER ----------------
const getPublicEventsForSlider = async () => {
 
  const queryParams = {
    isPublic: "true", 
    limit: 9,
    sortBy: "date",
    sortOrder: "asc",
  };

  return await getAllEvents(undefined, "GUEST", queryParams);
};

/* ---------------- 5. GET EVENT BY ID ---------------- */
const getEventById = async (
  eventId: number | string,
  userId: number | undefined | null,
  userRole: string = "GUEST"
): Promise<any> => {
  
  const numericEventId = Number(eventId);

  if (isNaN(numericEventId)) {
    throw new AppError(status.BAD_REQUEST, "Invalid Event ID format");
  }

  const event = await prisma.event.findUnique({
    where: { id: numericEventId },
    include: {
      creator: { 
        select: { id: true, name: true, email: true } 
      },
      participations: { 
        select: { id: true, userId: true } 
      },
      reviews: { 
        select: { id: true, rating: true } 
      },
    },
  });

  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  const isAdmin = userRole === "ADMIN";
  
  const currentUserId = userId ? Number(userId) : 0;
  const isOwner = event.creatorId === currentUserId;

  if (!event.isPublic && !isAdmin && !isOwner) {
    throw new AppError(status.FORBIDDEN, "This is a private event. Access denied.");
  }

  return event;
};

export default getEventById;

//---------------- 6. UPDATE EVENT SEATS AFTER PAYMENT ----------------
const updateEventSeatsAfterPayment = async (eventId: number, tx: any) => {
  const event = await tx.event.findUnique({
    where: { id: eventId },
  });

  if (!event)
    throw new AppError(status.NOT_FOUND, "Event not found during seat update");

  if (event.totalSeats > 0 && event.bookedSeats >= event.totalSeats) {
    throw new AppError(status.BAD_REQUEST, "Event is already full!");
  }

  return await tx.event.update({
    where: { id: eventId },
    data: {
      bookedSeats: { increment: 1 },
    },
  });
};


 //---------------- INITIATE EVENT PAYMENT ----------------
const initiateEventPayment = async (
  eventId: number,
  user: any, 
  inviteId?: number,
) => {
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
  });

  if (event.totalSeats > 0 && event.bookedSeats >= event.totalSeats) {
    throw new Error("This event is already full!");
  }

  const transactionId = `EVT-${uuidv7().slice(0, 8).toUpperCase()}`;

  await (prisma as any).payment.create({
    data: {
      transactionId: transactionId,
      amount: Number(event.fee),
      userId: Number(user.userId),
      eventId: Number(eventId),
      creatorId: Number(event.creatorId), 
      method: "STRIPE", 
      status: "PENDING",
    },
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: `Ticket for: ${event.title}`,
            description: `Venue: ${event.venue}`,
          },
          unit_amount: Math.round(Number(event.fee) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: inviteId ? inviteId.toString() : event.id.toString(),
      paymentId: transactionId, 
      inviteId: inviteId ? inviteId.toString() : "",
      eventId: event.id.toString(),
      userId: user.userId.toString(),
      paymentType: inviteId ? "INVITATION_PAYMENT" : "DIRECT_BOOKING",
    },
    success_url: `${envVars.FRONTEND_URL}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${envVars.FRONTEND_URL}/events/${event.id}`,
  });

  return { paymentUrl: session.url };
};

export const EventService = {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
  getPublicEventsForSlider,
  updateEventSeatsAfterPayment,
  initiateEventPayment,
};
