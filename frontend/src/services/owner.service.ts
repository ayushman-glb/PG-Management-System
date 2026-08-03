import { api } from "./api";

export class OwnerService {
  async submitOnboarding(data: any) {
    return api.post("/owners/onboard", data);
  }

  async getOnboardingStatus(ownerId: string) {
    return api.get(`/owners/${ownerId}/status`);
  }

  async getPendingVerifications() {
    return api.get("/owners/verifications");
  }
}

export const ownerService = new OwnerService();
