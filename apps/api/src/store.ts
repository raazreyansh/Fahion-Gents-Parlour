import { addMinutes, calculateServiceTotal, serviceCatalog, type Booking, type Service } from "@fgp/shared";
import { nanoid } from "nanoid";

export type UserRole = "customer" | "owner" | "staff";

export type User = {
  id: string;
  googleId: string;
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  role: UserRole;
  createdAt: string;
};

export type StaffProfile = {
  id: string;
  userId: string;
  displayName: string;
  active: boolean;
};

export type SalonSettings = {
  acceptingBookings: boolean;
  blockedDates: string[];
  businessHours: {
    open: string;
    close: string;
    slotIntervalMinutes: number;
  };
  subscriptionStatus: "trialing" | "active" | "past_due" | "restricted" | "cancelled";
};

export type Payment = {
  id: string;
  bookingId?: string;
  provider: "upi";
  providerRef: string;
  amountInr: number;
  status: "created" | "paid" | "failed";
  createdAt: string;
};

export type NotificationLog = {
  id: string;
  bookingId?: string;
  type: "sms" | "push" | "email";
  destination: string;
  status: "queued" | "sent" | "failed";
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  createdAt: string;
};

export type AppStore = ReturnType<typeof createStore>;

export function createStore() {
  const owner: User = {
    id: "owner_1",
    googleId: "owner-google",
    name: "Kartik Thakur",
    email: "owner@fashiongents.local",
    phone: "7739524042",
    role: "owner",
    createdAt: new Date().toISOString()
  };

  const salonSettings: SalonSettings = {
    acceptingBookings: true,
    blockedDates: [],
    businessHours: { open: "09:00", close: "21:00", slotIntervalMinutes: 30 },
    subscriptionStatus: "trialing"
  };

  return {
    users: new Map<string, User>([[owner.id, owner]]),
    staffProfiles: new Map<string, StaffProfile>(),
    services: new Map<string, Service>(serviceCatalog.map((service) => [service.id, service])),
    bookings: new Map<string, Booking>(),
    payments: new Map<string, Payment>(),
    notifications: new Map<string, NotificationLog>(),
    auditLogs: new Map<string, AuditLog>(),
    salonSettings
  };
}

export function createBookingRecord(input: {
  customerId: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  paymentMethod: Booking["paymentMethod"];
}, services: Service[]) {
  const total = calculateServiceTotal(input.serviceIds, services);
  return {
    id: `bk_${nanoid(8)}`,
    customerId: input.customerId,
    serviceIds: input.serviceIds,
    date: input.date,
    startTime: input.startTime,
    endTime: addMinutes(input.startTime, total.durationMinutes),
    status: "confirmed",
    paymentMethod: input.paymentMethod,
    paymentStatus: "unpaid",
    totalAmount: total.priceInr
  } satisfies Booking;
}
