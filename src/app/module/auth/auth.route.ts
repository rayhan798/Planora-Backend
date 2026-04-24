// src/modules/auth/auth.route.ts
import { Router } from "express";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth"; 
import { catchAsync } from "../../shared/catchAsync";
import { AuthValidation } from './auth.validation';
import { validateRequest } from '../../middleware/validateRequest';


const router = Router();

// ---------------- Public Routes ----------------
router.post("/register", catchAsync(AuthController.registerUser));
router.post("/login", catchAsync(AuthController.loginUser));

// Google OAuth
router.get("/login/google", catchAsync(AuthController.googleLogin));
router.get("/login/google/success", catchAsync(AuthController.googleLoginSuccess));
router.get("/login/google/error", catchAsync(AuthController.handleOAuthError));

// ---------------- Protected Routes ----------------
router.get("/me", checkAuth(), catchAsync(AuthController.getMe));
router.post("/change-password", checkAuth(), catchAsync(AuthController.changePassword));
router.post("/logout", checkAuth(), catchAsync(AuthController.logoutUser));

// Refresh token is public (client sends refreshToken)
router.post("/refresh-token", catchAsync(AuthController.getNewToken));

router.post("/verify-email", AuthController.verifyEmail)
router.post("/forget-password", AuthController.forgotPassword)
router.post("/reset-password", AuthController.resetPassword)

router.post(
  '/resend-otp',
  validateRequest(AuthValidation.resendOtpZodSchema),
  AuthController.resendOtp
);

export const AuthRoutes = router;