import { Router } from "express";
import { AdminController } from "./admin.controller";
import { authMiddleware, checkAuth } from "../../middleware/checkAuth";
import { roleMiddleware } from "../../middleware/roleMiddleware";

const router = Router();

// ✅ ONLY ADMIN
router.get(
  "/users",
  authMiddleware,
  checkAuth("ADMIN"),
  AdminController.getAllUsers
);

router.delete(
  "/user/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  AdminController.deleteUser
);

router.delete(
  "/event/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  AdminController.deleteEvent
);

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  AdminController.getSystemStats
);

export const AdminRoutes = router;