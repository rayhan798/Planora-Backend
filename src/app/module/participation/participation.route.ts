// src/app/module/participation/participation.route.ts

import { Router } from "express";
import { ParticipationController } from "./participation.controller";
import { authMiddleware } from "../../middleware/checkAuth";

const router = Router();

router.post(
  "/", 
  authMiddleware, 
  ParticipationController.createParticipation
);

router.get(
  "/", 
  authMiddleware, 
  ParticipationController.getAllParticipations
);

router.get(
  "/:id", 
  authMiddleware, 
  ParticipationController.getParticipationById
);

router.get(
  "/event/:eventId/pending", 
  authMiddleware, 
  ParticipationController.getPendingParticipations
);

router.patch(
  "/:eventId/status", 
  authMiddleware, 
  ParticipationController.updateParticipationStatus
);

router.delete(
  "/cancel/:eventId", 
  authMiddleware, 
  ParticipationController.cancelParticipation
);

router.delete(
  "/:id", 
  authMiddleware, 
  ParticipationController.deleteParticipation
);

export const ParticipationRoutes = router;