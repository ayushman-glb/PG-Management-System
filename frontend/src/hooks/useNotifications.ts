import { useState, useEffect } from "react";
import { notificationService } from "@services/notification.service";
import type { Notification } from "@types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService
      .getNotifications()
      .then((data) => setNotifications(data.notifications || data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAll = async () => {
    await notificationService.clearAll();
    setNotifications([]);
  };

  return { notifications, loading, markAsRead, clearAll };
}
