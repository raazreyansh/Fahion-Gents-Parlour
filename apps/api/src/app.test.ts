import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createStore } from "./store.js";

async function customerToken(app: ReturnType<typeof createApp>) {
  const response = await request(app).post("/api/auth/google").send({ idToken: "demo-google-token" });
  return response.body.accessToken as string;
}

describe("Fashion Gents API", () => {
  it("returns the full service catalog", async () => {
    const app = createApp(createStore());
    const response = await request(app).get("/api/services").expect(200);

    expect(response.body.services).toHaveLength(16);
  });

  it("creates a Pay at Salon booking without OTP and blocks the occupied slot", async () => {
    const app = createApp(createStore());
    const token = await customerToken(app);

    const bookingResponse = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        serviceIds: ["haircut", "beard-setting"],
        date: "2026-05-05",
        startTime: "10:00",
        paymentMethod: "pay_at_salon"
      })
      .expect(201);

    expect(bookingResponse.body.booking.totalAmount).toBe(100);

    const availability = await request(app)
      .get("/api/availability/2026-05-05?durationMinutes=30")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(availability.body.slots.find((slot: { time: string }) => slot.time === "10:00").available).toBe(false);
  });

  it("exposes UPI platform fee details", async () => {
    const app = createApp(createStore());
    const token = await customerToken(app);

    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        serviceIds: ["haircut"],
        date: "2026-05-06",
        startTime: "10:00",
        paymentMethod: "pay_at_salon"
      })
      .expect(201);

    const upiResponse = await request(app)
      .get("/api/platform-fee/upi")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(upiResponse.body.amountInr).toBe(590);
    expect(upiResponse.body.upiUri).toContain("upi://pay");
  });

  it("exposes booking deposit UPI components for barber advance and platform charge", async () => {
    const app = createApp(createStore());
    const token = await customerToken(app);

    const response = await request(app)
      .get("/api/bookings/deposit-upi")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.totalAmountInr).toBe(22);
    expect(response.body.splitPaymentSupported).toBe(false);
    expect(response.body.payments).toMatchObject([
      { kind: "barber_advance", amountInr: 20 },
      { kind: "platform_charge", amountInr: 2 }
    ]);
    expect(response.body.payments[0].upiUri).toContain("upi://pay");
    expect(response.body.payments[1].upiUri).toContain("upi://pay");
  });
});
