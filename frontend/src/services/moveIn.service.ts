import { api } from "./api";

export class MoveInService {
  async requestMoveOut(data: { bookingId: string; plannedMoveOutDate: string; reason: string; feedback?: string; bankDetails?: { accountName: string; accountNumber: string; ifscCode: string; upiId?: string } }) {
    return api.post("/move-in/request-move-out", data);
  }

  async getMoveOutRequests(pgId?: string) {
    const query = pgId ? `?pgId=${pgId}` : "";
    return api.get(`/move-in/move-out-requests${query}`);
  }

  async processMoveOutSettlement(data: { bookingId: string; damageDeduction?: number; unpaidBillsDeduction?: number; otherDeduction?: number; deductionReason?: string }) {
    return api.post("/move-in/process-settlement", data);
  }
}

export const moveInService = new MoveInService();
export default moveInService;
