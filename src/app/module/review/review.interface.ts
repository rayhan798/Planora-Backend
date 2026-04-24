export interface ICreateReview {
  userId: number;
  eventId: number;
  rating: number;
  comment?: string; 
}

export interface IUpdateReview {
  rating?: number;
  comment?: string;
}