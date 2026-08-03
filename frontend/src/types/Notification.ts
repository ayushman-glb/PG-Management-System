export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
  read: boolean;
  createdAt: string;
  link?: string;
}
