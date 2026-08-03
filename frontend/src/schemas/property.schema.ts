import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().min(2, "Property name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  totalRooms: z.number().int().positive("Total rooms must be positive"),
  totalBeds: z.number().int().positive("Total beds must be positive"),
});

export type PropertyInput = z.infer<typeof propertySchema>;
