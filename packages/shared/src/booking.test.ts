import { describe, expect, it } from "vitest";
import { calculateCancellationFee, generateSlots, hasBookingOverlap, type Booking } from "./booking.js";

const existingBooking: Booking = {
  id: "b_1",
  customerId: "u_1",
  serviceIds: ["haircut"],
  date: "2026-05-05",
  startTime: "10:00",
  endTime: "10:30",
  status: "confirmed",
  paymentMethod: "pay_at_salon",
  paymentStatus: "unpaid",
  totalAmount: 50
};

describe("booking rules", () => {
  it("detects overlapping active bookings", () => {
    expect(
      hasBookingOverlap({ date: "2026-05-05", startTime: "10:15", endTime: "10:45" }, [existingBooking])
    ).toBe(true);
  });

  it("keeps cancelled bookings from blocking slots", () => {
    expect(
      hasBookingOverlap({ date: "2026-05-05", startTime: "10:15", endTime: "10:45" }, [
        { ...existingBooking, status: "cancelled" }
      ])
    ).toBe(false);
  });

  it("generates unavailable slots for occupied time ranges", () => {
    const slots = generateSlots("2026-05-05", 30, [existingBooking], [], {
      open: "10:00",
      close: "11:00",
      slotIntervalMinutes: 30
    });

    expect(slots).toEqual([
      { time: "10:00", available: false },
      { time: "10:30", available: true }
    ]);
  });

  it("charges no cancellation fee at least two hours before appointment", () => {
    expect(
      calculateCancellationFee(new Date("2026-05-05T07:59:00+05:30"), new Date("2026-05-05T10:00:00+05:30"), 400)
    ).toBe(0);
  });

  it("charges 25 percent cancellation fee under two hours", () => {
    expect(
      calculateCancellationFee(new Date("2026-05-05T08:30:00+05:30"), new Date("2026-05-05T10:00:00+05:30"), 401)
    ).toBe(101);
  });
});
