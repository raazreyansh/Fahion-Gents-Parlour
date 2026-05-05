import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

async function customerToken(app: any) {
  const response = await request(app).post("/api/auth/google").send({ idToken: "demo-token" });
  return response.body.accessToken as string;
}

describe("Fashion Gents API", () => {
  it("returns the service catalog", async () => {
    const app = createApp();
    const response = await request(app).get("/api/services").expect(200);
    expect(Array.isArray(response.body.services)).toBe(true);
  });

  it("handles availability", async () => {
    const app = createApp();
    const token = await customerToken(app);
    await request(app)
      .get("/api/availability/2026-05-05")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  it("handles platform fee info", async () => {
    const app = createApp();
    const token = await customerToken(app);
    const response = await request(app)
      .get("/api/platform-fee/upi")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body.upiUri).toBeDefined();
  });
});
