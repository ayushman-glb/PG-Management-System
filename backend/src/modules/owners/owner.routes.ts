import { Router } from "express";
import { OwnerController } from "./owner.controller";
import { authenticate, authorize } from "../../middleware/authMiddleware";
import { Role } from "@prisma/client";

const router = Router();

// All owner routes require authentication
router.use(authenticate);

router.get("/", authorize(Role.SUPER_ADMIN, Role.ADMIN), OwnerController.getOwners);
router.get("/profile", OwnerController.getProfile);
router.get("/:ownerId/metrics", OwnerController.getMetrics);
router.get("/:id", OwnerController.getOwnerById);
router.post("/onboard", OwnerController.runFullOnboarding);
router.put("/:ownerId/personal", OwnerController.savePersonalDetails);
router.post("/:ownerId/kyc", OwnerController.submitKYC);
router.put("/:ownerId/business", OwnerController.saveBusinessInfo);
router.put("/:ownerId/bank", OwnerController.saveBankDetails);
router.post("/:ownerId/property", OwnerController.registerPGProperty);
router.put("/property/:pgId/location", OwnerController.saveLocation);
router.put("/property/:pgId/building", OwnerController.configureBuilding);
router.post("/property/:pgId/rooms/batch", OwnerController.batchCreateRooms);
router.post("/:ownerId/subscription", OwnerController.selectSubscription);
router.post("/property/:pgId/submit", OwnerController.submitForApproval);
router.get("/:ownerId/progress", OwnerController.getProgress);
// Alias for frontend compatibility — frontend calls /owners/:ownerId/status
router.get("/:ownerId/status", OwnerController.getProgress);

export default router;
