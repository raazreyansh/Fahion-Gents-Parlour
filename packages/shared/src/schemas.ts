import { z } from "zod";

export const googleAuthSchema = z.object({
  idToken: z.string().min(10)
});

export const createBookingSchema = z.object({
  serviceIds: z.array(z.string()).min(1).max(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  paymentMethod: z.literal("pay_at_salon")
});

export const updateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  priceInr: z.number().int().positive().optional(),
  durationMinutes: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().optional()
});
