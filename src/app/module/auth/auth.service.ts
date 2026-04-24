import status from "http-status";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { ILoginUserPayload, IRegisterUserPayload, IChangePasswordPayload } from "./auth.interface";
import { JwtPayload } from "jsonwebtoken";
import { jwtUtils } from "../../utils/jwt";
import { AuthLib } from "../../lib/auth";
import { sendEmail } from "../../utils/email";
const SALT_ROUNDS = 10;

// Register user
const registerUser = async (payload: IRegisterUserPayload) => {
  const { name, email, password } = payload;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new AppError(status.BAD_REQUEST, "User already exists");

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 1 * 60 * 1000); 

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "USER",
      status: "ACTIVE",
      isDeleted: false,
      emailVerified: false,
      verificationCode: otp,     
      verificationExpires: otpExpires,
    },
  });

  try {
    await sendEmail({
      to: email,
      subject: "Verify your Planora account",
      templateName: "otp",
      templateData: { name: user.name, otp },
    });
  } catch (err) {
    console.error("Email sending failed:", err);
   
  }

  return { user };
};

// Login user
const loginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;

  if (!password) throw new AppError(status.BAD_REQUEST, "Password is required");

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) throw new AppError(status.NOT_FOUND, "User not found");
  if (user.isDeleted || user.status === "DELETED") throw new AppError(status.NOT_FOUND, "User deleted");
  if (user.status === "BLOCKED") throw new AppError(status.FORBIDDEN, "User blocked");

  if (!user.emailVerified) {
    throw new AppError(
      status.FORBIDDEN, 
      "Your email is not verified. Please verify your email first."
    );
  }

  if (!user.password) {
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Authentication method not supported");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new AppError(status.UNAUTHORIZED, "Invalid credentials");

  const accessToken = tokenUtils.getAccessToken({ userId: user.id, role: user.role });
  const refreshToken = tokenUtils.getRefreshToken({ userId: user.id, role: user.role });

  return { user, accessToken, refreshToken };
};

// Get current user
const getMe = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(status.NOT_FOUND, "User not found");
  return user;
};

// Refresh token
const getNewToken = async (refreshToken: string) => {
  const verified = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET!);
  if (!verified.success || !verified.data) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
  }

  const { userId, role } = verified.data as { userId: number; role: string };

  const accessToken = tokenUtils.getAccessToken({ userId, role });
  const newRefreshToken = tokenUtils.getRefreshToken({ userId, role });

  return { accessToken, refreshToken: newRefreshToken };
};


// Change password
const changePassword = async (payload: IChangePasswordPayload, userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(status.NOT_FOUND, "User not found");

  const match = await bcrypt.compare(payload.currentPassword, user.password);
  if (!match) throw new AppError(status.UNAUTHORIZED, "Current password incorrect");

  const hashed = await bcrypt.hash(payload.newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  const accessToken = tokenUtils.getAccessToken({ userId: user.id, role: user.role });
  const refreshToken = tokenUtils.getRefreshToken({ userId: user.id, role: user.role });

  return { accessToken, refreshToken };
};

// Logout user
const logoutUser = async () => {
  return { success: true };
};

// Google OAuth Success
const googleLoginSuccess = async (user: any) => {
  if (!user || !user.userId) throw new AppError(status.UNAUTHORIZED, "Invalid user");

  const dbUser = await prisma.user.findUnique({ where: { id: Number(user.userId) } });
  if (!dbUser) throw new AppError(status.NOT_FOUND, "User not found");

  const accessToken = tokenUtils.getAccessToken({ userId: dbUser.id, role: dbUser.role });
  const refreshToken = tokenUtils.getRefreshToken({ userId: dbUser.id, role: dbUser.role });

  return { accessToken, refreshToken };
};

// Verify Email (OTP)
const verifyEmail = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(status.NOT_FOUND, "User not found");
  
  if (user.verificationCode !== otp) {
    throw new AppError(status.BAD_REQUEST, "Invalid OTP code");
  }

  if (user.verificationExpires && new Date() > user.verificationExpires) {
    throw new AppError(status.BAD_REQUEST, "OTP has expired");
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      verificationCode: null,
      verificationExpires: null,
    },
  });


  return { user: updatedUser };
};


// Forgot Password (OTP Request)
const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(status.NOT_FOUND, "User not found with this email");
  if (user.isDeleted) throw new AppError(status.NOT_FOUND, "User deleted");
  if (user.status === "BLOCKED") throw new AppError(status.FORBIDDEN, "User blocked");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 1 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: {
      verificationCode: otp,
      verificationExpires: otpExpires,
    },
  });

  try {
    await sendEmail({
      to: email,
      subject: "Reset your Planora password",
      templateName: "otp",
      templateData: { name: user.name, otp },
    });
  } catch (err) {
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send reset email");
  }

  return { message: "Reset OTP sent to your email" };
};

// Reset Password (Verify OTP & Update)
const resetPassword = async (payload: any) => {
  const { email, otp, newPassword } = payload;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(status.NOT_FOUND, "User not found");
  
  if (user.verificationCode !== otp) {
    throw new AppError(status.BAD_REQUEST, "Invalid OTP code");
  }

  if (user.verificationExpires && new Date() > user.verificationExpires) {
    throw new AppError(status.BAD_REQUEST, "OTP has expired");
  }


  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      verificationCode: null, 
      verificationExpires: null,
    },
  });

  const accessToken = tokenUtils.getAccessToken({ userId: updatedUser.id, role: updatedUser.role });
  const refreshToken = tokenUtils.getRefreshToken({ userId: updatedUser.id, role: updatedUser.role });

  return { user: updatedUser, accessToken, refreshToken };
};

// ----------------------
// Export service
// ----------------------
export const AuthService = {
  registerUser,
  loginUser,
  getMe,
  getNewToken,
  changePassword,
  logoutUser,
  googleLoginSuccess, 
  verifyEmail,
  forgotPassword,
  resetPassword,
};