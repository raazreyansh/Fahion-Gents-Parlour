import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import QRCode from "qrcode";
import { rateLimit } from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import { 
  calculateCancellationFee, 
  createBookingSchema, 
  generateSlots, 
  googleAuthSchema, 
  updateServiceSchema, 
  hasBookingOverlap,
  addMinutes, 
  calculateServiceTotal 
} from "@fgp/shared";
import { adminRequired, authRequired, signAccessToken } from "./auth.js";
import { config } from "./config.js";
import { HttpError, errorHandler } from "./errors.js";
import { supabase } from "./supabase.js";

const googleClient = new OAuth2Client(config.googleClientId);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { error: "too_many_requests", message: "Too many login attempts, please try again later." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

async function verifyGoogleToken(idToken: string) {
  if (!config.googleClientId) {
    if (process.env.NODE_ENV !== "production" && idToken === "demo-token") {
      return { sub: "demo-google-id", email: "demo@fashiongents.local", name: "Demo User" };
    }
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new HttpError(401, "Invalid Google token payload", "invalid_auth");
  }
  return { sub: payload.sub, email: payload.email, name: payload.name || "User" };
}

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

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: [config.webBaseUrl, "http://localhost:8081", "http://localhost:8082"], credentials: true }));
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(generalLimiter);

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "fashion-gents-api" });
  });

  app.post("/api/auth/google", authLimiter, async (request, response, next) => {
    try {
      const body = googleAuthSchema.parse(request.body);
      const googleUser = await verifyGoogleToken(body.idToken);
      
      const { data: existingUser, error: findError } = await supabase
        .from("users")
        .select("*")
        .eq("google_id", googleUser.sub)
        .single();

      if (findError && findError.code !== "PGRST116") throw findError;

      let user = existingUser;
      
      if (!user) {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            google_id: googleUser.sub,
            name: googleUser.name,
            email: googleUser.email,
            role: "customer"
          })
          .select()
          .single();
        
        if (createError) throw createError;
        user = newUser;
      }

      response.json({ 
        user, 
        accessToken: signAccessToken({ sub: user.id, role: user.role, email: user.email }) 
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", authRequired, async (request, response, next) => {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", request.user!.sub)
        .single();

      if (error || !user) throw new HttpError(404, "User not found", "user_not_found");
      response.json({ user });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/services", async (_request, response, next) => {
    try {
      const { data: services, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      response.json({ services: services || [] });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/availability/:date", authRequired, async (request, response, next) => {
    try {
      const date = String(request.params.date);
      const duration = Number(request.query.durationMinutes ?? 30);
      
      const [bookingsRes, settingsRes] = await Promise.all([
        supabase.from("bookings").select("*").eq("date", date).neq("status", "cancelled"),
        supabase.from("salon_settings").select("*").single()
      ]);

      if (settingsRes.error) throw settingsRes.error;
      const settings = settingsRes.data;

      const slots = generateSlots(
        date,
        duration,
        bookingsRes.data || [],
        settings.blocked_dates || [],
        settings.business_hours
      );
      response.json({ acceptingBookings: settings.accepting_bookings, slots });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/bookings", authRequired, async (request, response, next) => {
    try {
      const { data: settings, error: settingsError } = await supabase.from("salon_settings").select("*").single();
      if (settingsError) throw settingsError;
      if (!settings.accepting_bookings) throw new HttpError(409, "Salon is not accepting bookings", "closed");

      const body = createBookingSchema.parse(request.body);
      
      const { data: services, error: svcError } = await supabase.from("services").select("*").in("id", body.serviceIds);
      if (svcError) throw svcError;
      if (!services) throw new HttpError(400, "Selected services not found");

      const total = calculateServiceTotal(body.serviceIds, services as any);
      const booking = {
        customer_id: request.user!.sub,
        date: body.date,
        start_time: body.startTime,
        end_time: addMinutes(body.startTime, total.durationMinutes),
        status: "confirmed",
        payment_method: body.paymentMethod,
        payment_status: "unpaid",
        total_amount: total.priceInr
      };

      const { data: existingBookings, error: bksError } = await supabase.from("bookings").select("*").eq("date", body.date).neq("status", "cancelled");
      if (bksError) throw bksError;

      const mappedBookings = (existingBookings || []).map((b: any) => ({ ...b, startTime: b.start_time, endTime: b.end_time }));
      const mappedNewBooking = { ...booking, startTime: booking.start_time, endTime: booking.end_time } as any;

      if (hasBookingOverlap(mappedNewBooking, mappedBookings)) {
        throw new HttpError(409, "Selected slot is no longer available", "slot_conflict");
      }

      const { data: savedBooking, error: saveError } = await supabase
        .from("bookings")
        .insert(booking)
        .select()
        .single();
      
      if (saveError || !savedBooking) throw saveError || new Error("Failed to save booking");

      const bookingServices = body.serviceIds.map(sid => {
        const s = (services as any[]).find(x => x.id === sid)!;
        return { booking_id: savedBooking.id, service_id: sid, price_inr: s.price_inr, duration_minutes: s.duration_minutes };
      });
      await supabase.from("booking_services").insert(bookingServices);

      response.status(201).json({ 
        booking: savedBooking, 
        qrCodeDataUrl: await QRCode.toDataURL(savedBooking.id) 
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/bookings/my", authRequired, async (request, response, next) => {
    try {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*, booking_services(services(*))")
        .eq("customer_id", request.user!.sub)
        .order("date", { ascending: false });
      
      if (error) throw error;
      response.json({ bookings: bookings || [] });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/bookings/:id/cancel", authRequired, async (request, response, next) => {
    try {
      const { data: booking, error: findError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", request.params.id)
        .eq("customer_id", request.user!.sub)
        .single();
      
      if (findError || !booking) throw new HttpError(404, "Booking not found", "not_found");

      const fee = calculateCancellationFee(
        new Date(), 
        new Date(`${booking.date}T${booking.start_time}:00+05:30`), 
        booking.total_amount
      );

      const { data: updated, error: updateError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      response.json({ booking: updated, cancellationFeeInr: fee });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/bookings/today", authRequired, adminRequired, async (_request, response, next) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*, users(name, phone), booking_services(services(name))")
        .eq("date", today)
        .order("start_time", { ascending: true });
      
      if (error) throw error;
      response.json({ bookings: bookings || [] });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/bookings/:id/start", authRequired, adminRequired, async (request, response, next) => {
    try {
      const { data: booking, error } = await supabase
        .from("bookings")
        .update({ status: "in_progress" })
        .eq("id", request.params.id)
        .select()
        .single();
      
      if (error) throw error;
      response.json({ booking });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/bookings/:id/complete", authRequired, adminRequired, async (request, response, next) => {
    try {
      const { data: booking, error } = await supabase
        .from("bookings")
        .update({ status: "completed", payment_status: "paid" })
        .eq("id", request.params.id)
        .select()
        .single();
      
      if (error) throw error;
      response.json({ booking });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/availability", authRequired, adminRequired, async (request, response, next) => {
    try {
      const { data: settings, error } = await supabase
        .from("salon_settings")
        .update({ accepting_bookings: Boolean(request.body.acceptingBookings) })
        .eq("id", true)
        .select()
        .single();
      
      if (error) throw error;
      response.json({ settings });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/earnings", authRequired, adminRequired, async (_request, response, next) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: completed, error } = await supabase
        .from("bookings")
        .select("total_amount")
        .eq("status", "completed")
        .eq("date", today);
      
      if (error) throw error;
      
      response.json({
        dailyInr: (completed || []).reduce((sum, b) => sum + b.total_amount, 0),
        completedCount: (completed || []).length
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/analytics", authRequired, adminRequired, async (_request, response, next) => {
    try {
      response.json({
        popularServices: [],
        noShowRate: 0,
        retentionRate: 0
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/services", authRequired, adminRequired, async (request, response, next) => {
    try {
      const body = updateServiceSchema.required().parse(request.body);
      const { data: service, error } = await supabase
        .from("services")
        .insert({
          ...body,
          id: `svc_${Date.now()}`,
          category: "Haircut",
          description: request.body.description ?? "",
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      response.status(201).json({ service });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/services/:id", authRequired, adminRequired, async (request, response, next) => {
    try {
      const patch = updateServiceSchema.parse(request.body);
      const { data: service, error } = await supabase
        .from("services")
        .update(patch)
        .eq("id", request.params.id)
        .select()
        .single();
      
      if (error) throw error;
      response.json({ service });
    } catch (error) {
      next(error);
    }
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
