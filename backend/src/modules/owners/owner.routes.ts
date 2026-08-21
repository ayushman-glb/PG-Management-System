import { Router } from "express";
import { OwnerController } from "./owner.controller";
import { authenticate, authorize } from "../../middleware/authMiddleware";
import { assertOwnershipOf, assertPGOwnership } from "./owner.ownership.middleware";
import { Role } from "@prisma/client";

const router = Router();

// All owner routes require authentication
router.use(authenticate);

// ── Admin-only reads ──────────────────────────────────────────────────────────
router.get("/", authorize(Role.GOD, Role.ADMIN), OwnerController.getOwners);

// ── Self-profile (any authenticated owner) ───────────────────────────────────
router.get("/profile", authorize(Role.OWNER, Role.GOD, Role.ADMIN), OwnerController.getProfile);

// ── Owner-scoped mutations: must own the record ───────────────────────────────
router.get(
  "/:ownerId/metrics",
  authorize(Role.OWNER, Role.GOD, Role.ADMIN),
  assertOwnershipOf("ownerId"),
  OwnerController.getMetrics,
);

router.get(
  "/:ownerId/progress",
  authorize(Role.OWNER, Role.GOD, Role.ADMIN),
  assertOwnershipOf("ownerId"),
  OwnerController.getProgress,
);

// Alias for frontend compatibility
router.get(
  "/:ownerId/status",
  authorize(Role.OWNER, Role.GOD, Role.ADMIN),
  assertOwnershipOf("ownerId"),
  OwnerController.getProgress,
);

router.put(
  "/:ownerId/personal",
  authorize(Role.OWNER),
  assertOwnershipOf("ownerId"),
  OwnerController.savePersonalDetails,
);

router.post(
  "/:ownerId/kyc",
  authorize(Role.OWNER),
  assertOwnershipOf("ownerId"),
  OwnerController.submitKYC,
);

router.put(
  "/:ownerId/business",
  authorize(Role.OWNER),
  assertOwnershipOf("ownerId"),
  OwnerController.saveBusinessInfo,
);

router.put(
  "/:ownerId/bank",
  authorize(Role.OWNER),
  assertOwnershipOf("ownerId"),
  OwnerController.saveBankDetails,
);

router.post(
  "/:ownerId/property",
  authorize(Role.OWNER),
  assertOwnershipOf("ownerId"),
  OwnerController.registerPGProperty,
);

router.post(
  "/:ownerId/subscription",
  authorize(Role.OWNER),
  assertOwnershipOf("ownerId"),
  OwnerController.selectSubscription,
);

// ── PG-scoped mutations: must own the PG ─────────────────────────────────────
router.put(
  "/property/:pgId/location",
  authorize(Role.OWNER),
  assertPGOwnership("pgId"),
  OwnerController.saveLocation,
);

router.put(
  "/property/:pgId/building",
  authorize(Role.OWNER),
  assertPGOwnership("pgId"),
  OwnerController.configureBuilding,
);

router.post(
  "/property/:pgId/rooms/batch",
  authorize(Role.OWNER),
  assertPGOwnership("pgId"),
  OwnerController.batchCreateRooms,
);

router.post(
  "/property/:pgId/submit",
  authorize(Role.OWNER),
  assertPGOwnership("pgId"),
  OwnerController.submitForApproval,
);

// ── Full onboarding (owner self-service, creates new record) ─────────────────
router.post("/onboard", authorize(Role.OWNER), OwnerController.runFullOnboarding);

// ── Admin read-by-id ─────────────────────────────────────────────────────────
router.get("/:id", authorize(Role.OWNER, Role.GOD, Role.ADMIN), OwnerController.getOwnerById);

export default router;
