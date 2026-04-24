import { Router } from "express";
import { EventController } from "./event.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { multerUpload } from "../../config/multer.config";

const router = Router();


router.post(
  '/initiate-payment/:id', 
  checkAuth('USER', 'ADMIN'), 
  EventController.initiateEventPayment
);


router.post(
  "/", 
  checkAuth("USER", "ADMIN"), 
  multerUpload.single("image"),
  EventController.createEvent
);

router.put(
  "/:id", 
  checkAuth("USER", "ADMIN"), 
  multerUpload.single("image"), 
  EventController.updateEvent
);

router.delete(
  "/:id", 
  checkAuth("USER", "ADMIN"), 
  EventController.deleteEvent
);

router.get(
  "/", 
  checkAuth("USER", "ADMIN", "OPTIONAL"), 
  EventController.getAllEvents
);

router.get(
  "/my-events", 
  checkAuth("USER", "ADMIN"), 
  EventController.getAllEvents
);

router.get(
  "/public-slider", 
  EventController.getPublicEventsForSlider
);

router.get(
  "/:id", 
  checkAuth("USER", "ADMIN", "OPTIONAL"), 
  EventController.getEventById
);


export const EventRoutes = router;