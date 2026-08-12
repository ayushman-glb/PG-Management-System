import { Router } from "express";
import { Container } from "../../container";
import { authenticate } from "../../middleware/authMiddleware";
import { authLimiter } from "../../middleware/rateLimiter";

const router = Router();

// Require authentication for all device endpoints
router.use(authenticate);

router.post("/identify", authLimiter, (req, res, next) =>
  Container.deviceController.identifyDevice(req, res, next),
);
router.get("/", (req, res, next) =>
  Container.deviceController.getDevices(req, res, next),
);
router.patch("/:deviceId/trust", (req, res, next) =>
  Container.deviceController.trustDevice(req, res, next),
);
router.post("/:deviceId/revoke", (req, res, next) =>
  Container.deviceController.revokeDevice(req, res, next),
);
router.post("/:deviceId/block", (req, res, next) =>
  Container.deviceController.blockDevice(req, res, next),
);
router.post("/:deviceId/unblock", (req, res, next) =>
  Container.deviceController.unblockDevice(req, res, next),
);
router.get("/events", (req, res, next) =>
  Container.deviceController.getSecurityEvents(req, res, next),
);

export default router;
