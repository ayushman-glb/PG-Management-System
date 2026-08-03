export interface CreateFineRulePayload {
  pgId: string;
  fineType: 'LATE_RENT' | 'DAMAGE' | 'ELECTRICITY' | 'WATER' | 'CLEANING' | 'CUSTOM';
  calculationType: 'FLAT' | 'PERCENTAGE' | 'PER_DAY';
  amount: number;
  percentage?: number;
  perDayRate?: number;
  maxFineAmount?: number;
  gracePeriodDays?: number;
}

export interface IssueFinePayload {
  residentId: string;
  ruleId?: string;
  fineType: 'LATE_RENT' | 'DAMAGE' | 'ELECTRICITY' | 'WATER' | 'CLEANING' | 'CUSTOM';
  amount: number;
  reason: string;
  dueDate: string;
}

export interface IFineEngineService {
  createFineRule(payload: CreateFineRulePayload): Promise<any>;
  getFineRulesByPG(pgId: string): Promise<any>;
  calculateLateRentFine(residentId: string, rentDueDate: Date, rentAmount: number): Promise<number>;
  issueFine(payload: IssueFinePayload): Promise<any>;
  waiveFine(fineId: string, ownerId: string): Promise<any>;
  getFinesByResident(residentId: string): Promise<any>;
}
