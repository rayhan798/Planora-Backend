export type ParticipationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface IParticipation {
  id: number;
  userId: number;
  eventId: number;
  status: ParticipationStatus;
  paymentStatus?: "PAID" | "UNPAID";
  createdAt: Date;
}