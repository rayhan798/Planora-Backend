export interface IUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "BLOCKED" | "DELETED";

  bio?: string | null;   
  image?: string | null; 

  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;

  isDeleted: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}