import { z } from "zod";

export const complaintSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(["MAINTENANCE", "PLUMBING", "ELECTRICAL", "INTERNET", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

export type ComplaintInput = z.infer<typeof complaintSchema>;
