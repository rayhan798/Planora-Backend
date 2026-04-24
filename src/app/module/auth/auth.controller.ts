import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { tokenUtils } from "../../utils/token";
import { CookieUtils } from "../../utils/cookie";
import { AuthService } from "./auth.service";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { sendEmail } from "../../utils/email";
import { prisma } from '../../lib/prisma';

// ------------------ Register User ------------------
const registerUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    
   
    const result = await AuthService.registerUser(payload);

    const { user } = result;

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "User registered successfully. Please check your email for OTP.",
        data: { 
            user 
        },
    });
});

// ------------------ Login User ------------------
const loginUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AuthService.loginUser(payload);

    const { accessToken, refreshToken, user } = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User logged in successfully",
        data: { user, accessToken, refreshToken },
    });
});

// ------------------ Get Me ------------------
const getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new AppError(status.UNAUTHORIZED, "User not authenticated");
    }

    const user = await AuthService.getMe(Number(userId));

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User profile fetched successfully",
        data: user,
    });
});

// ------------------ Refresh Token ------------------
const getNewToken = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError(status.UNAUTHORIZED, "Refresh token missing");
    }

    const tokens = await AuthService.getNewToken(refreshToken);

    tokenUtils.setAccessTokenCookie(res, tokens.accessToken);
    tokenUtils.setRefreshTokenCookie(res, tokens.refreshToken);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "New tokens generated successfully",
        data: tokens,
    });
});

// ------------------ Change Password ------------------
const changePassword = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const payload = req.body;

    if (!userId) {
        throw new AppError(status.UNAUTHORIZED, "User not authenticated");
    }

    const tokens = await AuthService.changePassword(payload, Number(userId));

    tokenUtils.setAccessTokenCookie(res, tokens.accessToken);
    tokenUtils.setRefreshTokenCookie(res, tokens.refreshToken);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Password changed successfully",
        data: tokens,
    });
});

// ------------------ Logout ------------------
const logoutUser = catchAsync(async (req: Request, res: Response) => {
    await AuthService.logoutUser();

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "none" as const,
    };

    CookieUtils.clearCookie(res, "accessToken", cookieOptions);
    CookieUtils.clearCookie(res, "refreshToken", cookieOptions);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User logged out successfully",
    });
});

// ------------------ Google OAuth ------------------
const googleLogin = catchAsync((req: Request, res: Response) => {
    const redirectPath = req.query.redirect || "/dashboard";
    const encodedRedirectPath = encodeURIComponent(redirectPath as string);
    const callbackURL = `${envVars.FRONTEND_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;

    res.render("googleRedirect", {
        callbackURL,
        frontendUrl: envVars.FRONTEND_URL,
    });
});

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
    const redirectPath = (req.query.redirect as string) || "/dashboard";
    const result = await AuthService.googleLoginSuccess(req.user);

    tokenUtils.setAccessTokenCookie(res, result.accessToken);
    tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

    const finalRedirectPath = redirectPath.startsWith("/") ? redirectPath : "/dashboard";
    res.redirect(`${envVars.FRONTEND_URL}${finalRedirectPath}`);
});

const handleOAuthError = catchAsync((req: Request, res: Response) => {
    const error = (req.query.error as string) || "oauth_failed";
    res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
});

// ------------------ Verify Email (OTP) ------------------
const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
 
    const result = await AuthService.verifyEmail(email, otp);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Email verified successfully. Please login to continue.",
        data: { 
            user: result.user // শুধু ইউজার ডাটা পাঠাচ্ছি, কোনো টোকেন নয়
        },
    });
});

// ------------------ Forgot Password ------------------
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await AuthService.forgotPassword(email);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
    });
});

// ------------------ Reset Password ------------------
const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AuthService.resetPassword(payload);

    tokenUtils.setAccessTokenCookie(res, result.accessToken);
    tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Password reset successful",
        data: result,
    });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found with this email!");
  }

  if (user.emailVerified) { 
    throw new AppError(status.BAD_REQUEST, "Email is already verified!");
  }

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
    to: user.email,
    subject: "Planora - Your New Verification Code",
    templateName: "otp",
    templateData: {
      name: user.name || user.email.split('@')[0] || "User",
      otp: otp,
    },
  });

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "A new OTP has been sent to your email!",
    data: null,
  });
});

export const AuthController = {
    registerUser,
    loginUser,
    getMe,
    getNewToken,
    changePassword,
    logoutUser,
    googleLogin,
    googleLoginSuccess,
    handleOAuthError,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resendOtp,
};