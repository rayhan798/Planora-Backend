import { Participation } from './../../generated/prisma/client';
import { Router } from "express";
import { AdminRoutes } from "../module/admin/admin.route";
import { AuthRoutes } from "../module/auth/auth.route";
import { UserRoutes } from "../module/user/user.route";
import { EventRoutes } from "../module/event/event.route";
import { ParticipationRoutes } from "../module/participation/participation.route";
import InvitationRoutes from "../module/invitation/invitation.route";
import ReviewRoutes from "../module/review/review.route";
import { ContactRoutes } from "../module/contact/contact.route";


const router = Router();

router.use("/admins", AdminRoutes);
router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/events", EventRoutes);
router.use("/participations", ParticipationRoutes);
router.use("/invitations", InvitationRoutes);
router.use("/reviews", ReviewRoutes);
router.use("/contact", ContactRoutes);



export const IndexRoutes = router;