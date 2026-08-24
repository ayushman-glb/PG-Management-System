import { api } from "./api";

export interface CreateBookingData {
  bedId: string;
  expectedCheckIn: string;
  expectedCheckOut?: string;
  monthlyRent: number;
  securityDeposit: number;
  specialRequests?: string;
}

export class BookingService {
  async listBookings(params: { pgId?: string; status?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.pgId) query.set("pgId", params.pgId);
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/bookings${queryString}`);
  }

  async getBookingById(id: string) {
    return api.get(`/bookings/${id}`);
  }

  async createBooking(data: CreateBookingData) {
    return api.post("/bookings", data);
  }

  async updateBookingStatus(id: string, status: string, notes?: string) {
    return api.patch(`/bookings/${id}/status`, { status, notes });
  }

  async allocateBed(id: string, allocationNotes?: string) {
    return api.post(`/bookings/${id}/allocate`, { allocationNotes });
  }

  async cancelBooking(id: string, cancellationReason: string) {
    return api.post(`/bookings/${id}/cancel`, { cancellationReason });
  }
}

export const bookingService = new BookingService();
export default bookingService;
