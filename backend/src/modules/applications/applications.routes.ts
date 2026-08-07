import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware";
import { ApplicationsController } from "./applications.controller";

const router = Router();
const controller = new ApplicationsController();

router.use(authenticate);

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/:id/documents", controller.uploadDocument);
router.patch("/:id/status", controller.updateStatus);
router.post("/:id/sign-lease", controller.signLease);

export default router;
