// src/modules/contact/contact.route.ts
import express from "express";
import { validateRequest } from "../../middleware/validateRequest"; 
import { checkAuth } from "../../middleware/checkAuth"; 
import { ContactValidation } from "./contact.validation";
import { ContactController } from "./contact.controller";
import { contactRateLimiter } from "../../middleware/rateLimiter";


const router = express.Router();


router.post(
  "/send",
  contactRateLimiter, 
  validateRequest(ContactValidation.createContactZodSchema),
  ContactController.createMessage
);

router.get(
  "/all-messages",
  checkAuth("ADMIN"),
  ContactController.getAllMessages
);

export const ContactRoutes = router;