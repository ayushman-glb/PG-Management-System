import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { OwnerOnboardingService } from '../services/OwnerOnboardingService';

const onboardingService = new OwnerOnboardingService(prisma);

export class OwnerOnboardingController {
  static async savePersonalDetails(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.savePersonalDetails(ownerId, req.body);
      res.status(200).json({ success: true, message: 'Personal details saved', data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async submitKYC(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.submitKYC(ownerId, req.body);
      res.status(200).json({ success: true, message: 'KYC submitted successfully', data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async saveBusinessInfo(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.saveBusinessInfo(ownerId, req.body);
      res.status(200).json({ success: true, message: 'Business info saved', data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async saveBankDetails(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.saveBankDetails(ownerId, req.body);
      res.status(200).json({ success: true, message: 'Bank details verified and saved', data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async registerPGProperty(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.registerPGProperty(ownerId, req.body);
      res.status(201).json({ success: true, message: 'PG property created', data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async saveLocation(req: Request, res: Response): Promise<void> {
    try {
      const { pgId } = req.params;
      const data = await onboardingService.saveLocation(pgId, req.body);
      res.status(200).json({ success: true, message: 'Location updated', data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async configureBuilding(req: Request, res: Response): Promise<void> {
    try {
      const { pgId } = req.params;
      const data = await onboardingService.configureBuildingAndAmenities(pgId, req.body);
      res.status(200).json({ success: true, message: 'Building & amenities configured', data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async batchCreateRooms(req: Request, res: Response): Promise<void> {
    try {
      const { pgId } = req.params;
      const data = await onboardingService.batchCreateRoomsAndBeds(pgId, req.body);
      res.status(200).json({ success: true, message: 'Rooms & beds generated', data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async selectSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const data = await onboardingService.selectSubscriptionPlan(ownerId, req.body);
      res.status(200).json({ success: true, message: 'Subscription plan activated', data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async submitForApproval(req: Request, res: Response): Promise<void> {
    try {
      const { pgId } = req.params;
      const data = await onboardingService.submitForAdminApproval(pgId);
      res.status(200).json({ success: true, message: 'Submitted for admin review', data });
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
