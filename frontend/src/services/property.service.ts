import { api } from "./api";

export class PropertyService {
  async getPublicProperties(params?: {
    city?: string;
    minRent?: number;
    maxRent?: number;
    roomType?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.city) query.append("city", params.city);
    if (params?.minRent) query.append("minRent", params.minRent.toString());
    if (params?.maxRent) query.append("maxRent", params.maxRent.toString());
    if (params?.roomType) query.append("roomType", params.roomType);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await api.get(`/properties/public${queryString}`);
    return res?.data ?? res;
  }

  async getPropertyById(id: string) {
    const res = await api.get(`/properties/${id}`);
    return res?.data ?? res;
  }

  async createProperty(propertyData: any) {
    const res = await api.post("/properties", propertyData);
    return res?.data ?? res;
  }

  async getOwnerSummary() {
    try {
      const res = await api.get("/dashboard/overview");
      return res?.data ?? res;
    } catch {
      const res = await api.get("/properties/owner-summary");
      return res?.data ?? res;
    }
  }
}

export const propertyService = new PropertyService();
