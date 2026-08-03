import { api } from "./api";

export class NotificationService {
  async getNotifications() {
    return api.get("/notifications");
  }

  async markAsRead(id: string) {
    return api.put(`/notifications/${id}/read`);
  }

  async clearAll() {
    return api.delete("/notifications");
  }
}

export const notificationService = new NotificationService();
