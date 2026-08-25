import { api } from "./api";

export class BedService {
  async updateBedStatus(bedId: string, status: string, notes?: string) {
    const res = await api.put(`/beds/${bedId}/status`, { status, remarks: notes });
    return res?.data ?? res;
  }

  async createBedHold(bedId: string, reason: string, holdStartDate?: string, holdEndDate?: string, notes?: string) {
    const res = await api.post("/beds/holds", { bedId, reason, holdStartDate, holdEndDate, notes });
    return res?.data ?? res;
  }

  async releaseBedHold(holdId: string) {
    const res = await api.delete(`/beds/holds/${holdId}`);
    return res?.data ?? res;
  }

  async getBedHolds(pgId?: string) {
    const query = pgId ? `?pgId=${pgId}` : "";
    const res = await api.get(`/beds/holds${query}`);
    return res?.data ?? res;
  }
}

export const bedService = new BedService();
