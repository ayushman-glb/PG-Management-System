import { Request, Response } from "express";
import { Container } from "../../container";
import { PrismaClient } from "@prisma/client";
import { OwnerService } from "./owner.service";

const prisma = new PrismaClient();
const onboardingService = new OwnerService(prisma);

export class OwnerController {
  static async runFullOnboarding(req: Request, res: Response): Promise<void> {
    try {
      const {
        ownerId,
        personal,
        kyc,
        business,
        bank,
        property,
        location,
        building,
        roomConfig,
        subscription,
      } = req.body;

      if (!ownerId) {
        res
          .status(400)
          .json({ success: false, message: "ownerId is required" });
        return;
      }

      // 1. Personal
      if (personal)
        await onboardingService.savePersonalDetails(ownerId, personal);
      // 2. KYC
      if (kyc) await onboardingService.submitKYC(ownerId, kyc);
      // 3. Business
      if (business) await onboardingService.saveBusinessInfo(ownerId, business);
      // 4. Bank
      if (bank) await onboardingService.saveBankDetails(ownerId, bank);
      // 5. Property + location + building + rooms + subscription + submit
      let pgId: string | null = null;
      if (property) {
        const pg = await onboardingService.registerPGProperty(
          ownerId,
          property,
        );
        pgId = pg?.id || null;
        if (pgId && location)
          await onboardingService.saveLocation(pgId, location);
        if (pgId && building)
          await onboardingService.configureBuildingAndAmenities(pgId, building);
        if (pgId && roomConfig)
          await onboardingService.batchCreateRoomsAndBeds(pgId, roomConfig);
        if (pgId) await onboardingService.submitForAdminApproval(pgId);
      }
      // 6. Subscription
      if (subscription)
        await onboardingService.selectSubscriptionPlan(ownerId, subscription);

      res.status(201).json({
        success: true,
        message: "Full owner onboarding completed successfully",
        data: { ownerId, pgId },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async savePersonalDetails(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.savePersonalDetails(
        ownerId,
        req.body,
      );
      res
        .status(200)
        .json({ success: true, message: "Personal details saved", data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async submitKYC(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.submitKYC(ownerId, req.body);
      res
        .status(200)
        .json({ success: true, message: "KYC submitted successfully", data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async saveBusinessInfo(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.saveBusinessInfo(ownerId, req.body);
      res
        .status(200)
        .json({ success: true, message: "Business info saved", data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async saveBankDetails(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.saveBankDetails(ownerId, req.body);
      res
        .status(200)
        .json({
          success: true,
          message: "Bank details verified and saved",
          data,
        });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async registerPGProperty(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.registerPGProperty(
        ownerId,
        req.body,
      );
      res
        .status(201)
        .json({ success: true, message: "PG property created", data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async saveLocation(req: Request, res: Response): Promise<void> {
    try {
      const { pgId } = req.params;
      const data = await onboardingService.saveLocation(pgId, req.body);
      res
        .status(200)
        .json({ success: true, message: "Location updated", data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async configureBuilding(req: Request, res: Response): Promise<void> {
    try {
      const { pgId } = req.params;
      const data = await onboardingService.configureBuildingAndAmenities(
        pgId,
        req.body,
      );
      res
        .status(200)
        .json({
          success: true,
          message: "Building & amenities configured",
          data,
        });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async batchCreateRooms(req: Request, res: Response): Promise<void> {
    try {
      const { pgId } = req.params;
      const data = await onboardingService.batchCreateRoomsAndBeds(
        pgId,
        req.body,
      );
      res
        .status(200)
        .json({ success: true, message: "Rooms & beds generated", data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async selectSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.selectSubscriptionPlan(
        ownerId,
        req.body,
      );
      res
        .status(200)
        .json({ success: true, message: "Subscription plan activated", data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async submitForApproval(req: Request, res: Response): Promise<void> {
    try {
      const { pgId } = req.params;
      const data = await onboardingService.submitForAdminApproval(pgId);
      res
        .status(200)
        .json({ success: true, message: "Submitted for admin review", data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getProgress(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.getOnboardingProgress(ownerId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
