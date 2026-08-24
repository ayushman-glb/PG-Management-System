import { api } from "./api";

export class NotificationService {
  async getNotifications(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.unreadOnly) query.set("unreadOnly", "true");
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/notifications${queryString}`);
  }

  async markAsRead(id: string) {
    return api.patch(`/notifications/${id}/read`, {});
  }

  async markAllAsRead() {
    return api.patch("/notifications/read-all", {});
  }

  async clearAll() {
    return this.markAllAsRead();
  }

  async broadcastAnnouncement(data: { pgId: string; title: string; message: string; floorId?: string; roomId?: string; sendEmail?: boolean }) {
    return api.post("/notifications/announcement", data);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
