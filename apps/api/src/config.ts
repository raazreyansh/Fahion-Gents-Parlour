import "dotenv/config";

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:4000",
  webBaseUrl: process.env.WEB_BASE_URL ?? "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === "production" 
    ? (() => { throw new Error("JWT_SECRET must be set in production"); })() 
    : "dev-secret-change-me-in-prod"),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  platformUpiId: process.env.PLATFORM_UPI_ID ?? "fashiongents@upi",
  platformPayeeName: process.env.PLATFORM_PAYEE_NAME ?? "Fashion Gents Parlour",
  platformFeeInr: Number(process.env.PLATFORM_FEE_INR ?? 590),
  barberUpiId: process.env.BARBER_UPI_ID ?? "barber@upi",
  barberPayeeName: process.env.BARBER_PAYEE_NAME ?? "Fashion Gents Barber",
  bookingAdvanceInr: Number(process.env.BOOKING_ADVANCE_INR ?? 20),
  bookingPlatformChargeInr: Number(process.env.BOOKING_PLATFORM_CHARGE_INR ?? 2)
};
