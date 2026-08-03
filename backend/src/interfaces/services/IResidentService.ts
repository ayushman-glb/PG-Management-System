export interface IOnboardResidentData {
  userId?: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  bedId: string;
  idProofNumber: string;
  idProofUrl?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  guardianName?: string;
  guardianPhone?: string;
  bankAccount?: string;
  upiId?: string;
  emergencyContact: string;
  emergencyName?: string;
  bloodGroup?: string;
  occupation?: string;
  companyCollege?: string;
  moveInDate: string;
}

export interface IVisitorPassData {
  visitorName: string;
  visitorMobile: string;
  relation: string;
  visitDate: string;
  timeSlot: string;
}

export interface IGatePassData {
  passType: string;
  destination: string;
  departureTime: string;
  returnTime: string;
  reason?: string;
}

export interface IResidentService {
  onboardResident(data: IOnboardResidentData): Promise<{ residentId: string; residentCode: string; message: string }>;
  getDirectory(query: { propertyId?: string; search?: string; status?: string }): Promise<any[]>;
  getPortalData(userId: string): Promise<any>;
  createVisitorPass(userId: string, data: IVisitorPassData): Promise<any>;
  createGatePass(userId: string, data: IGatePassData): Promise<any>;
  toggleMealSkip(userId: string, date: string, mealType: string): Promise<{ skipped: boolean; message: string }>;
}
