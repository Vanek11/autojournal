import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const vehicleSchema = z.object({
  make: z.string().min(1, "Укажите марку"),
  model: z.string().min(1, "Укажите модель"),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  plateNumber: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  fuelType: z.enum(["petrol", "diesel", "gas", "hybrid", "electric", "other"]),
  currentMileage: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional().nullable()
});

export const journalSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum(["maintenance", "repair", "fuel", "expense", "document", "other"]),
  title: z.string().min(1, "Укажите название записи"),
  description: z.string().optional().nullable(),
  eventDate: z.string().min(1, "Укажите дату"),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  amount: z.coerce.number().min(0).optional().nullable(),
  vendor: z.string().optional().nullable()
});

export const reminderSchema = z.object({
  vehicleId: z.string().min(1),
  title: z.string().min(1, "Укажите название напоминания"),
  description: z.string().optional().nullable(),
  triggerType: z.enum(["date", "mileage", "date_and_mileage"]),
  triggerDate: z.string().optional().nullable(),
  triggerMileage: z.coerce.number().int().min(0).optional().nullable()
});

export const documentSchema = z.object({
  vehicleId: z.string().min(1),
  title: z.string().min(1, "Укажите название документа"),
  type: z.enum(["receipt", "insurance", "service_act", "photo", "pdf", "other"]),
  fileUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable()
});
