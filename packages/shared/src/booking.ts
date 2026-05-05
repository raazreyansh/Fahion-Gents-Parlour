export type BookingStatus = "pending_payment" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
export type PaymentMethod = "pay_at_salon";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

export const BOOKING_ADVANCE_INR = 20;
export const BOOKING_PLATFORM_CHARGE_INR = 2;
export const BOOKING_DEPOSIT_TOTAL_INR = BOOKING_ADVANCE_INR + BOOKING_PLATFORM_CHARGE_INR;

export type Booking = {
  id: string;
  customerId: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
};

export type BusinessHours = {
  open: string;
  close: string;
  slotIntervalMinutes: number;
};

const timeToMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const minutesToTime = (minutes: number) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export function addMinutes(time: string, minutes: number) {
  return minutesToTime(timeToMinutes(time) + minutes);
}

export function hasBookingOverlap(
  candidate: Pick<Booking, "date" | "startTime" | "endTime">,
  bookings: Pick<Booking, "date" | "startTime" | "endTime" | "status">[]
) {
  const candidateStart = timeToMinutes(candidate.startTime);
  const candidateEnd = timeToMinutes(candidate.endTime);

  return bookings.some((booking) => {
    if (booking.date !== candidate.date || booking.status === "cancelled") return false;
    const start = timeToMinutes(booking.startTime);
    const end = timeToMinutes(booking.endTime);
    return candidateStart < end && candidateEnd > start;
  });
}

export function generateSlots(
  date: string,
  durationMinutes: number,
  bookings: Booking[],
  blockedDates: string[],
  businessHours: BusinessHours
) {
  if (blockedDates.includes(date)) return [];
  const slots: { time: string; available: boolean }[] = [];
  const open = timeToMinutes(businessHours.open);
  const close = timeToMinutes(businessHours.close);

  for (let cursor = open; cursor + durationMinutes <= close; cursor += businessHours.slotIntervalMinutes) {
    const startTime = minutesToTime(cursor);
    const endTime = minutesToTime(cursor + durationMinutes);
    slots.push({
      time: startTime,
      available: !hasBookingOverlap({ date, startTime, endTime }, bookings)
    });
  }

  return slots;
}

export function calculateCancellationFee(now: Date, appointmentStart: Date, totalAmount: number) {
  const millisecondsUntilStart = appointmentStart.getTime() - now.getTime();
  const hoursUntilStart = millisecondsUntilStart / 1000 / 60 / 60;
  return hoursUntilStart >= 2 ? 0 : Math.ceil(totalAmount * 0.25);
}
