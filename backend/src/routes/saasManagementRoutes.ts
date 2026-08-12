import { Router, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { FineEngineService } from "../services/FineEngineService";
import { SearchService } from "../services/SearchService";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();
const prisma = new PrismaClient();
const fineEngine = new FineEngineService(prisma);
const searchService = new SearchService(prisma);

// All SaaS management endpoints require authentication
router.use(authenticate);

// FINE ENGINE ENDPOINTS
router.post("/fines/rules", async (req: Request, res: Response) => {
  try {
    const rule = await fineEngine.createFineRule(req.body);
    res
      .status(201)
      .json({ success: true, message: "Fine rule created", data: rule });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/fines/rules/pg/:pgId", async (req: Request, res: Response) => {
  try {
    const rules = await fineEngine.getFineRulesByPG(req.params.pgId);
    res.status(200).json({ success: true, data: rules });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/fines/issue", async (req: Request, res: Response) => {
  try {
    const fine = await fineEngine.issueFine(req.body);
    res
      .status(201)
      .json({ success: true, message: "Fine issued to resident", data: fine });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put("/fines/:fineId/waive", async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.body;
    const fine = await fineEngine.waiveFine(
      req.params.fineId,
      ownerId || "SYSTEM_OWNER",
    );
    res.status(200).json({ success: true, message: "Fine waived", data: fine });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get(
  "/fines/resident/:residentId",
  async (req: Request, res: Response) => {
    try {
      const fines = await fineEngine.getFinesByResident(req.params.residentId);
      res.status(200).json({ success: true, data: fines });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
);

// GLOBAL SEARCH ENDPOINT
router.get("/search", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const pgId = req.query.pgId as string | undefined;
    const results = await searchService.globalSearch(q, pgId);
    res.status(200).json({ success: true, data: results });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN VERIFICATION QUEUE ENDPOINTS
router.get("/admin/verification-queue", authorize(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const pendingOwners = await prisma.owner.findMany({
      include: {
        kyc: true,
        business: true,
        subscription: true,
        pgs: { include: { propertyDocuments: true } },
      },
    });
    res.status(200).json({ success: true, data: pendingOwners });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/admin/approve-pg/:pgId", authorize(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const pg = await prisma.pG.update({
      where: { id: req.params.pgId },
      data: { draftStatus: "APPROVED", status: "ACTIVE" },
    });
    res
      .status(200)
      .json({
        success: true,
        message: "PG Property approved and published live!",
        data: pg,
      });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ACCOUNT DELETION & SOFT-DELETE ENDPOINT
router.post("/account/delete", async (req: Request, res: Response) => {
  try {
    const { userId, role, password, otpConfirmation, reason } = req.body;

    if (!userId || !otpConfirmation) {
      throw new Error(
        "User ID and OTP confirmation required for account deletion.",
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User record not found.");

    // Soft delete user & record audit log
    await prisma.user.update({
      where: { id: userId },
      data: { role: "PUBLIC", email: `deleted_${Date.now()}@roombae.com` },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "ACCOUNT_DELETED_SOFT",
        ipAddress: req.ip || "unknown",
        userAgent: req.get("user-agent") || "RoomBae Client",
        details: `Account deletion executed. Reason: ${reason || "User requested checkout"}`,
      },
    });

    res
      .status(200)
      .json({
        success: true,
        message:
          "Account successfully deactivated and soft-deleted in compliance with data retention laws.",
      });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
