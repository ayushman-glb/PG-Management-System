import { api } from "./api";

export class RoomService {
  async createRoomTransferRequest(data: {
    residentId: string;
    pgId: string;
    currentBedId: string;
    preferredSharingType?: string;
    preferredRoomNumber?: string;
    reason: string;
    budget?: number;
    preferredMoveDate?: string;
    additionalNotes?: string;
    priority?: string;
  }) {
    const res = await api.post("/rooms/transfer-requests", data);
    return res?.data ?? res;
  }

  async getRoomTransferRequests(params?: { pgId?: string; residentId?: string }) {
    const query = new URLSearchParams();
    if (params?.pgId) query.append("pgId", params.pgId);
    if (params?.residentId) query.append("residentId", params.residentId);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await api.get(`/rooms/transfer-requests${queryString}`);
    return res?.data ?? res;
  }

  async approveRoomTransfer(requestId: string, targetBedId?: string, scheduledDate?: string, notes?: string) {
    const res = await api.put(`/rooms/transfer-requests/${requestId}/approve`, {
      targetBedId,
      scheduledDate,
      notes,
    });
    return res?.data ?? res;
  }

  async rejectRoomTransfer(requestId: string, rejectionReason: string) {
    const res = await api.put(`/rooms/transfer-requests/${requestId}/reject`, {
      rejectionReason,
    });
    return res?.data ?? res;
  }

  async completeRoomTransfer(requestId: string) {
    const res = await api.post(`/rooms/transfer-requests/${requestId}/complete`, {});
    return res?.data ?? res;
  }
}

export const roomService = new RoomService();
