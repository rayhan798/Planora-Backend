export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface ICreateInvitation {
  eventId: number;
  receiverId: number;
  senderId?: number;
}

export interface IUpdateInvitation {
  status: "ACCEPTED" | "DECLINED" | "REJECTED";
}