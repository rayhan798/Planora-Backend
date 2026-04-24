import { Router } from "express";
import { UserController } from "./user.controller";
import { authMiddleware, checkAuth } from "../../middleware/checkAuth";
import { roleMiddleware } from "../../middleware/roleMiddleware";

const router = Router();

// --- Profile Routes ---

router.get(
  "/",
  checkAuth(), 
  roleMiddleware(["ADMIN"]),
  UserController.getAllUsers
);

router.get("/profile", authMiddleware, UserController.getProfile);
router.get("/me", authMiddleware, UserController.getProfile);
router.patch("/update-profile", authMiddleware, UserController.updateProfile);
router.patch("/update-password", authMiddleware, UserController.updatePassword);

router
  .route("/notifications")
  .get(authMiddleware, UserController.getNotifications) 
  .patch(authMiddleware, UserController.updateNotifications);     
// --- Admin & User Creation Routes ---

router.post(
  "/create-admin",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  UserController.createAdmin
);

router.post("/create", authMiddleware, UserController.createUser);

router.delete(
  "/:id",
  checkAuth("ADMIN"),
  UserController.deleteUser
);

export const UserRoutes = router;