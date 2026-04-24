import { Event } from "../../../generated/prisma/client";

// Base Event type (matches Prisma model)
export interface IEvent {
  id: number;
  title: string;
  description: string;
  date: Date;
  time: string;
  venue: string;
  isPublic: boolean;
  fee: number;
  image?: string | null; 
  creatorId: number;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  participations?: { id: number; userId: number }[];
  reviews?: { id: number; rating: number }[];
}

// Event response type sent to frontend
export interface IEventResponse extends IEvent {
  creator: {
    id: number;
    name: string;
    email: string;
  };
  participantCount: number;
  reviewsCount: number;
}

// Filter type
export interface IEventFilter {
  type?: "public" | "private";
  fee?: "free" | "paid";
}