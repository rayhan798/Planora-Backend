// src/app/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';


export const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, 
  message: {
    success: false,
    message: "Too many messages sent from this IP, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});