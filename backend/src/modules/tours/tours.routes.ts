import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware";
import { ToursController } from "./tours.controller";

const router = Router();
const controller = new ToursController();

router.use(authenticate);

// Shortlist routes
router.post("/shortlist/:propertyId", controller.toggleShortlist);
router.get("/shortlist", controller.getShortlist);

// Tour routes
router.post("/", controller.requestTour);
router.get("/", controller.getTours);
router.patch("/:id", controller.updateTourStatus);

export default router;
