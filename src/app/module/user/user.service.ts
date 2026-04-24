import bcrypt from "bcryptjs";
import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IUser } from "./user.interface";

const SALT_ROUNDS = 10;

// Create User
const createUser = async (payload: {
  name: string;
  email: string;
  password: string;
  role?: "USER" | "ADMIN";
}): Promise<IUser> => {
  const { name, email, password, role = "USER" } = payload;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(status.BAD_REQUEST, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      status: "ACTIVE",
      isDeleted: false,
      emailVerified: false,
      emailEnabled: true,
      pushEnabled: false,
      smsEnabled: false,
    },
  }) as unknown as IUser;

  return user;
};

// Create Admin
const createAdmin = async (payload: {
  name: string;
  email: string;
  password: string;
}): Promise<IUser> => {
  return createUser({ ...payload, role: "ADMIN" });
};

//  Get Profile
const getProfile = async (userId: string): Promise<IUser> => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return user as unknown as IUser;
};

// Get Notification Settings
const getNotifications = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: true,
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return user;
};

// Update Profile (Name, Bio, Image)
const updateProfile = async (
  userId: string,
  payload: Partial<{ 
    name: string; 
    bio: string; 
    // image: string 
  }>
): Promise<IUser> => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: Number(userId) },
    data: {
      name: payload.name ?? user.name,
      bio: payload.bio ?? user.bio,
      // image: payload.image ?? user.image,
    },
  });

  return updatedUser as unknown as IUser;
};

// Update Password
const updatePassword = async (
  userId: string,
  payload: { newPassword: string }
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: Number(userId) },
    data: {
      password: hashedPassword,
    },
  });
};

// Update Notification Settings
const updateNotifications = async (
  userId: string,
  payload: { type: 'email' | 'push' | 'sms'; enabled: boolean }
): Promise<IUser> => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const updateData: any = {};
  if (payload.type === 'email') updateData.emailEnabled = payload.enabled;
  if (payload.type === 'push') updateData.pushEnabled = payload.enabled;
  if (payload.type === 'sms') updateData.smsEnabled = payload.enabled;

  const updatedUser = await prisma.user.update({
    where: { id: Number(userId) },
    data: updateData,
  });

  return updatedUser as unknown as IUser;
};

// Get All Users (Admin Only)
const getAllUsersFromDB = async (requestedByRole: string): Promise<IUser[]> => {
  if (requestedByRole !== 'ADMIN') {
    throw new AppError(status.FORBIDDEN, "Access Denied: Admins Only");
  }

  const users = await prisma.user.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      id: 'desc',
    },
  });

  return users as unknown as IUser[];
};

const deleteUserFromDB = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found!");
  }

  const result = await prisma.user.delete({
    where: { id },
  });
  
  return result;
};

export const UserService = {
  createUser,
  createAdmin,
  getProfile,
  getAllUsersFromDB,
  getNotifications, 
  updateProfile,
  updatePassword,
  updateNotifications, 
  deleteUserFromDB,
};