import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import QRCode from "qrcode";
import { calculateCancellationFee, createBookingSchema, generateSlots, googleAuthSchema, updateServiceSchema, hasBookingOverlap } from "@fgp/shared";
import { adminRequired, authRequired, signAccessToken } from "./auth.js";
import { config } from "./config.js";
import { HttpError, errorHandler } from "./errors.js";
import { createBookingRecord, createStore, type AppStore } from "./store.js";

function createUpiUri(input: { upiId: string; payeeName: string; amountInr: number; note: string }) {
  const params = new URLSearchParams({
    pa: input.upiId,
    pn: input.payeeName,
    am: String(input.amountInr),
    cu: "INR",
    tn: input.note
  });
  return `upi://pay?${params.toString()}`;
}

export function createApp(store: AppStore = createStore()) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: [config.webBaseUrl, "http://localhost:8081", "http://localhost:8082"], credentials: true }));
  app.use(morgan("dev"));

  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "fashion-gents-api" });
  });

  app.post("/api/auth/google", (request, response) => {
    const body = googleAuthSchema.parse(request.body);
    const existing = [...store.users.values()].find((user) => user.googleId === body.idToken || user.email === "demo@fashiongents.local");
    const user =
      existing ??
      {
        id: `usr_${Date.now()}`,
        googleId: body.idToken,
        name: "Demo Customer",
        email: "demo@fashiongents.local",
        role: "customer" as const,
        createdAt: new Date().toISOString()
      };
    store.users.set(user.id, user);
    response.json({ user, accessToken: signAccessToken({ sub: user.id, role: user.role, email: user.email }) });
  });

  app.get("/api/services", (_request, response) => {
    response.json({ services: [...store.services.values()].filter((service) => service.isActive) });
  });

  app.get("/api/availability/:date", authRequired, (request, response) => {
    const date = String(request.params.date);
    const duration = Number(request.query.durationMinutes ?? 30);
    const slots = generateSlots(
      date,
      duration,
      [...store.bookings.values()],
      store.salonSettings.blockedDates,
      store.salonSettings.businessHours
    );
    response.json({ acceptingBookings: store.salonSettings.acceptingBookings, slots });
  });

  app.post("/api/bookings", authRequired, async (request, response) => {
    if (!store.salonSettings.acceptingBookings) throw new HttpError(409, "Salon is not accepting bookings", "closed");
    const body = createBookingSchema.parse(request.body);
    const booking = createBookingRecord({ ...body, customerId: request.user!.sub }, [...store.services.values()]);
    const conflict = hasBookingOverlap(booking, [...store.bookings.values()]);
    if (conflict) throw new HttpError(409, "Selected slot is no longer available", "slot_conflict");
    store.bookings.set(booking.id, booking);
    store.notifications.set(`nt_${booking.id}`, {
      id: `nt_${booking.id}`,
      bookingId: booking.id,
      type: "email",
      destination: request.user!.email,
      status: "queued",
      createdAt: new Date().toISOString()
    });
    response.status(201).json({ booking, qrCodeDataUrl: await QRCode.toDataURL(booking.id) });
  });

  app.get("/api/bookings/my", authRequired, (request, response) => {
    response.json({ bookings: [...store.bookings.values()].filter((booking) => booking.customerId === request.user!.sub) });
  });

  app.put("/api/bookings/:id/cancel", authRequired, (request, response) => {
    const booking = store.bookings.get(String(request.params.id));
    if (!booking || booking.customerId !== request.user!.sub) throw new HttpError(404, "Booking not found", "not_found");
    const fee = calculateCancellationFee(new Date(), new Date(`${booking.date}T${booking.startTime}:00+05:30`), booking.totalAmount);
    booking.status = "cancelled";
    store.bookings.set(booking.id, booking);
    response.json({ booking, cancellationFeeInr: fee });
  });

  app.get("/api/admin/bookings/today", authRequired, adminRequired(store), (_request, response) => {
    const today = new Date().toISOString().slice(0, 10);
    response.json({ bookings: [...store.bookings.values()].filter((booking) => booking.date === today) });
  });

  app.put("/api/admin/bookings/:id/start", authRequired, adminRequired(store), (request, response) => {
    const booking = store.bookings.get(String(request.params.id));
    if (!booking) throw new HttpError(404, "Booking not found", "not_found");
    booking.status = "in_progress";
    response.json({ booking });
  });

  app.put("/api/admin/bookings/:id/complete", authRequired, adminRequired(store), (request, response) => {
    const booking = store.bookings.get(String(request.params.id));
    if (!booking) throw new HttpError(404, "Booking not found", "not_found");
    booking.status = "completed";
    booking.paymentStatus = booking.paymentStatus === "unpaid" ? "paid" : booking.paymentStatus;
    response.json({ booking });
  });

  app.put("/api/admin/availability", authRequired, adminRequired(store), (request, response) => {
    store.salonSettings.acceptingBookings = Boolean(request.body.acceptingBookings);
    response.json({ settings: store.salonSettings });
  });

  app.get("/api/admin/earnings", authRequired, adminRequired(store), (_request, response) => {
    const today = new Date().toISOString().slice(0, 10);
    const completed = [...store.bookings.values()].filter((booking) => booking.status === "completed" && booking.date === today);
    response.json({
      dailyInr: completed.reduce((sum, booking) => sum + booking.totalAmount, 0),
      completedCount: completed.length
    });
  });

  app.get("/api/admin/analytics", authRequired, adminRequired(store), (_request, response) => {
    response.json({
      popularServices: [...store.services.values()].slice(0, 5).map((service) => ({ serviceId: service.id, count: 0 })),
      noShowRate: 0,
      retentionRate: 0
    });
  });

  app.post("/api/admin/services", authRequired, adminRequired(store), (request, response) => {
    const service = { ...updateServiceSchema.required().parse(request.body), id: `svc_${Date.now()}`, category: "Haircut" as const, description: request.body.description ?? "", isActive: true };
    store.services.set(service.id, service);
    response.status(201).json({ service });
  });

  app.put("/api/admin/services/:id", authRequired, adminRequired(store), (request, response) => {
    const service = store.services.get(String(request.params.id));
    if (!service) throw new HttpError(404, "Service not found", "not_found");
    const patch = updateServiceSchema.parse(request.body);
    const updated = { ...service, ...patch };
    store.services.set(updated.id, updated);
    response.json({ service: updated });
  });

  app.get("/api/platform-fee/upi", authRequired, (_request, response) => {
    response.json({
      provider: "upi",
      upiId: config.platformUpiId,
      payeeName: config.platformPayeeName,
      amountInr: config.platformFeeInr,
      upiUri: createUpiUri({
        upiId: config.platformUpiId,
        payeeName: config.platformPayeeName,
        amountInr: config.platformFeeInr,
        note: "Fashion Gents Parlour monthly platform fee"
      })
    });
  });

  app.get("/api/bookings/deposit-upi", authRequired, (_request, response) => {
    const payments = [
      {
        kind: "barber_advance",
        upiId: config.barberUpiId,
        payeeName: config.barberPayeeName,
        amountInr: config.bookingAdvanceInr,
        upiUri: createUpiUri({
          upiId: config.barberUpiId,
          payeeName: config.barberPayeeName,
          amountInr: config.bookingAdvanceInr,
          note: "Fashion Gents Parlour booking advance"
        })
      },
      {
        kind: "platform_charge",
        upiId: config.platformUpiId,
        payeeName: config.platformPayeeName,
        amountInr: config.bookingPlatformChargeInr,
        upiUri: createUpiUri({
          upiId: config.platformUpiId,
          payeeName: config.platformPayeeName,
          amountInr: config.bookingPlatformChargeInr,
          note: "Fashion Gents Parlour booking platform charge"
        })
      }
    ];

    response.json({
      provider: "upi",
      splitPaymentSupported: false,
      totalAmountInr: config.bookingAdvanceInr + config.bookingPlatformChargeInr,
      payments
    });
  });

  app.use(errorHandler);
  return app;
}
