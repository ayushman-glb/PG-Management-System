import { api } from "./api";

export class VisitorService {
  async createVisitorPass(data: any) {
    const res = await api.post("/residents/portal/visitor-pass", data);
    return res?.data ?? res;
  }

  async createGatePass(data: any) {
    const res = await api.post("/residents/portal/gate-pass", data);
    return res?.data ?? res;
  }
}

export const visitorService = new VisitorService();
