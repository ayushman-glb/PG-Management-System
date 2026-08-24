import { api } from "./api";

export class SubscriptionService {
  async getPlans() {
    return api.get("/subscriptions/plans");
  }

  async getMySubscription() {
    return api.get("/subscriptions/my-subscription");
  }

  async initiateSubscription(planId: string) {
    return api.post("/subscriptions/initiate", { planId });
  }

  async verifySubscription(subscriptionId: string, razorpayPaymentId: string, razorpaySignature?: string) {
    return api.post("/subscriptions/verify", {
      subscriptionId,
      razorpayPaymentId,
      razorpaySignature,
    });
  }

  async cancelSubscription(reason?: string) {
    return api.post("/subscriptions/cancel", { reason });
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
