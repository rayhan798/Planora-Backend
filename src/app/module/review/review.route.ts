import { Router } from "express";
import { ReviewController } from "./review.controller";
import { authMiddleware } from "../../middleware/checkAuth";

const router = Router();

// --- WRITE OPERATIONS ---
router.post("/", authMiddleware, ReviewController.addReview);
router.put("/:id", authMiddleware, ReviewController.editReview); 
router.patch("/:id", authMiddleware, ReviewController.editReview);
router.delete("/:id", authMiddleware, ReviewController.deleteReview);

// --- READ OPERATIONS ---

router.get("/event/:eventId", authMiddleware, ReviewController.getEventReviews);

router.get("/my", authMiddleware, (req, res, next) => {
    req.params.eventId = "my";
    ReviewController.getEventReviews(req, res, next);
});


router.get("/", ReviewController.getEventReviews); 

export default router;