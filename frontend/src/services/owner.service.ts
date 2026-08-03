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

  /**
   * Full multi-step owner onboarding wizard. Uses the aggregate
   * /owners/onboard backend endpoint to persist all steps in one call.
   */
  async runFullOnboarding(input: {
    ownerId: string;
    personal: any;
    kyc: any;
    business: any;
    bank: any;
    property: any;
    location: any;
    building: any;
    roomConfig: any;
    subscription: any;
  }) {
    const res = await api.post("/owners/onboard", input);
    return res?.data || res;
  }
}

export const ownerService = new OwnerService();
