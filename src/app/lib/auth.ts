/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "./prisma";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { sendEmail } from "../utils/email";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import ms, { StringValue } from "ms";

const SALT_ROUNDS = 10;

// ---------------- Types ----------------
interface IResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

// ---------------- JWT Helpers ----------------
export const jwtUtils = {
  createToken: (
    payload: JwtPayload,
    secret: string,
    expiresIn: string
  ) => {
    return jwt.sign(payload, secret, {
      expiresIn: ms(expiresIn as StringValue),
    });
  },

  verifyToken: <T>(
    token: string,
    secret: string
  ): { success: boolean; data?: T; message?: string } => {
    try {
      const decoded = jwt.verify(token, secret) as T;
      return { success: true, data: decoded };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  decodeToken: (token: string) => {
    return jwt.decode(token) as JwtPayload;
  },
};

// ---------------- Auth Methods ----------------
export const AuthLib = {
  // ✅ Register with Email Verification (OTP)
  registerUser: async (payload: {
    name: string;
    email: string;
    password: string;
  }) => {
    const { name, email, password } = payload;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 1 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        isDeleted: false,
        emailVerified: false,
        verificationCode: otp,
        verificationExpires: otpExpires,
      },
    });

    await sendEmail({
      to: email,
      subject: "Verify your Planora account",
      templateName: "otp",
      templateData: { name, otp },
    });

    return { 
      message: "Registration successful. Please verify your email.",
      userId: user.id 
    };
  },

  // ✅ Verify OTP
  verifyEmail: async (email: string, otp: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw new Error("User not found");
    if (user.emailVerified) throw new Error("Email already verified");
    if (user.verificationCode !== otp) throw new Error("Invalid OTP");
    if (user.verificationExpires && new Date() > user.verificationExpires) {
      throw new Error("OTP expired");
    }

    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpires: null,
      },
    });

    const accessToken = jwtUtils.createToken(
      { userId: user.id, role: user.role },
      envVars.ACCESS_TOKEN_SECRET,
      envVars.ACCESS_TOKEN_EXPIRES_IN
    );

    const refreshToken = jwtUtils.createToken(
      { userId: user.id, role: user.role },
      envVars.REFRESH_TOKEN_SECRET,
      envVars.REFRESH_TOKEN_EXPIRES_IN
    );

    return { user, accessToken, refreshToken };
  },

  // ✅ Login
  loginUser: async (payload: { email: string; password: string }) => {
    const { email, password } = payload;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    if (!user.emailVerified) throw new Error("Please verify your email first");
    if (user.status === UserStatus.BLOCKED) throw new Error("User blocked");
    if (user.status === UserStatus.DELETED || user.isDeleted) throw new Error("User deleted");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Invalid credentials");

    const accessToken = jwtUtils.createToken(
      { userId: user.id, role: user.role },
      envVars.ACCESS_TOKEN_SECRET,
      envVars.ACCESS_TOKEN_EXPIRES_IN
    );

    const refreshToken = jwtUtils.createToken(
      { userId: user.id, role: user.role },
      envVars.REFRESH_TOKEN_SECRET,
      envVars.REFRESH_TOKEN_EXPIRES_IN
    );

    return { user, accessToken, refreshToken };
  },

  // ✅ Get Me
  getMe: async (userId: number) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error("User not found");
    return user;
  },

  // ✅ Refresh Token
  getNewToken: async (refreshToken: string) => {
    const decoded = jwtUtils.verifyToken<{
      userId: number;
      role: string;
    }>(refreshToken, envVars.REFRESH_TOKEN_SECRET);

    if (!decoded.success || !decoded.data) {
      throw new Error("Invalid refresh token");
    }

    const accessToken = jwtUtils.createToken(
      {
        userId: decoded.data.userId,
        role: decoded.data.role,
      },
      envVars.ACCESS_TOKEN_SECRET,
      envVars.ACCESS_TOKEN_EXPIRES_IN
    );

    const newRefreshToken = jwtUtils.createToken(
      {
        userId: decoded.data.userId,
        role: decoded.data.role,
      },
      envVars.REFRESH_TOKEN_SECRET,
      envVars.REFRESH_TOKEN_EXPIRES_IN
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  // ✅ Change Password
  changePassword: async (
    payload: { currentPassword: string; newPassword: string },
    userId: number
  ) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error("User not found");

    const match = await bcrypt.compare(
      payload.currentPassword,
      user.password
    );

    if (!match) throw new Error("Current password incorrect");

    const hashed = await bcrypt.hash(
      payload.newPassword,
      SALT_ROUNDS
    );

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    const accessToken = jwtUtils.createToken(
      { userId: user.id, role: user.role },
      envVars.ACCESS_TOKEN_SECRET,
      envVars.ACCESS_TOKEN_EXPIRES_IN
    );

    const refreshToken = jwtUtils.createToken(
      { userId: user.id, role: user.role },
      envVars.REFRESH_TOKEN_SECRET,
      envVars.REFRESH_TOKEN_EXPIRES_IN
    );

    return { accessToken, refreshToken };
  },

  // ✅ Logout
  logoutUser: async () => {
    return { success: true };
  },

  // ✅ Forgot Password (Request OTP)
  forgotPassword: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw new Error("User not found");
    if (user.status === UserStatus.BLOCKED) throw new Error("User blocked");
    if (user.status === UserStatus.DELETED || user.isDeleted) throw new Error("User deleted");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 1 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        verificationCode: otp,
        verificationExpires: otpExpires,
      },
    });

    await sendEmail({
      to: email,
      subject: "Password Reset OTP - Planora",
      templateName: "otp",
      templateData: { name: user.name, otp },
    });

    return { message: "Password reset OTP sent to your email" };
  },

  // ✅ Reset Password (Verify OTP & Update Password)
  resetPassword: async (payload: IResetPasswordPayload) => {
    const { email, otp, newPassword } = payload;

    const user = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (!user) throw new Error("User not found");
    
    if (user.verificationCode !== otp) throw new Error("Invalid OTP");
    
    if (user.verificationExpires && new Date() > user.verificationExpires) {
      throw new Error("OTP expired");
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

    const accessToken = jwtUtils.createToken(
      { userId: updatedUser.id, role: updatedUser.role },
      envVars.ACCESS_TOKEN_SECRET,
      envVars.ACCESS_TOKEN_EXPIRES_IN
    );

    const refreshToken = jwtUtils.createToken(
      { userId: updatedUser.id, role: updatedUser.role },
      envVars.REFRESH_TOKEN_SECRET,
      envVars.REFRESH_TOKEN_EXPIRES_IN
    );

    return { 
      message: "Password reset successful", 
      accessToken, 
      refreshToken 
    };
  },
};