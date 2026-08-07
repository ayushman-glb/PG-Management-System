import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware";
import { MoveInController } from "./moveIn.controller";

const router = Router();
const controller = new MoveInController();

router.use(authenticate);

router.get("/tenant-summary", controller.getTenantDashboardSummary);
router.get("/:propertyId", controller.getMoveInInfo);
router.post("/:propertyId", controller.upsertMoveInInfo);

export default router;
