import { Router } from "express";
import { InvitationController } from "./invitation.controller";
import { authMiddleware } from "../../middleware/checkAuth";

const router = Router();

// Send invite
router.post("/", authMiddleware, InvitationController.sendInvite);

// Accept / Reject
router.patch("/:id", authMiddleware, InvitationController.respondInvite);

// Get my invites
router.get("/me", authMiddleware, InvitationController.getMyInvites);

export default router;