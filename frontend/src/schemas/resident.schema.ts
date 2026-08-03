import { z } from "zod";

export const residentSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Valid phone required"),
  roomNumber: z.string().min(1, "Room number is required"),
  bedNumber: z.string().min(1, "Bed number is required"),
  rentAmount: z.number().positive("Rent must be positive"),
  joinDate: z.string(),
});

export type ResidentInput = z.infer<typeof residentSchema>;
