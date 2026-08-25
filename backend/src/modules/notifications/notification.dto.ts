import { z } from 'zod';

export const SendNotificationSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    type: z.string().default('SYSTEM'),
  }),
});

export interface NotificationDTO {
  userId: string;
  title: string;
  message: string;
  type: string;
}

export type SendNotificationDTO = z.infer<typeof SendNotificationSchema>['body'];
