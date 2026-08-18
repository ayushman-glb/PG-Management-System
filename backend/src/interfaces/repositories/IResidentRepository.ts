import { Resident, Bed, Visitor, LeaveApplication, MealSchedule } from '@prisma/client';

export interface ICreateResidentData {
  userId: string;
  propertyId: string;
  bedId: string;
  idProofNumber: string;
  idProofUrl?: string;
  encryptedKycData: string;
  emergencyContact: string;
  emergencyName?: string;
  bloodGroup?: string;
  occupation?: string;
  companyCollege?: string;
  moveInDate: Date;
  rentDueDate: Date;
  profilePicture?: string;
  gender?: string;
  age?: number;
  permanentAddress?: string;
}

export interface IResidentRepository {
  findById(id: string): Promise<any | null>;
  findByUserId(userId: string): Promise<any | null>;
  findBedById(bedId: string): Promise<Bed | null>;
  updateBedOccupancy(bedId: string, isOccupied: boolean): Promise<Bed>;
  createResident(data: ICreateResidentData): Promise<Resident>;
  getDirectory(query: { propertyId?: string; search?: string; status?: string }): Promise<any[]>;
  findRoomBeds(roomId: string): Promise<any[]>;
  createVisitorPass(data: any): Promise<Visitor>;
  createGatePass(data: any): Promise<LeaveApplication>;
  findMealSkip(residentId: string, mealType: string, date: Date): Promise<MealSchedule | null>;
  createMealSkip(residentId: string, mealType: string, date: Date): Promise<MealSchedule>;
  deleteMealSkip(id: string): Promise<void>;
  ensureResidentProfile(user: { id: string; name: string; email: string; phone?: string | null; avatarUrl?: string | null; residentCode?: string | null }): Promise<any>;
}
