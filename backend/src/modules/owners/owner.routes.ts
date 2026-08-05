import { Router } from "express";
import { OwnerController } from "./owner.controller";
import { verifyRecaptcha } from "../../middleware/recaptcha.middleware";

const router = Router();

router.post("/onboard", verifyRecaptcha("owner_registration"), OwnerController.runFullOnboarding);
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

export default router;
