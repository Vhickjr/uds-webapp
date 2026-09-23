/**
 * Pure space-booking domain types and rules — no React, no storage.
 * Kept separate from SpaceContext so the scheduling logic can be tested and
 * reused (e.g. server-side) without pulling in a provider.
 */

export type SpaceCategory =
  | "Lab"
  | "Workshop"
  | "Studio"
  | "Meeting Room"
  | "Collaboration Area";

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

/** A bookable space. The fields below are the "booking options" admins manage. */
export interface Space {
  id: string;
  name: string;
  description: string;
  category: SpaceCategory;
  location: string;
  capacity: number;
  amenities: string[];
  /** Operating window, "HH:MM" 24h. Bookings must fall inside it. */
  openTime: string;
  closeTime: string;
  /** Days bookable, 0 = Sunday ... 6 = Saturday. */
  openDays: number[];
  /** Longest single booking allowed, in hours. */
  maxBookingHours: number;
  /** When false, bookings are auto-approved instead of queued for review. */
  requiresApproval: boolean;
  /** Soft-disable: hidden from booking without losing its history. */
  active: boolean;
}

export interface Booking {
  id: string;
  spaceId: string;
  spaceName: string;
  userId: string;
  userName: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:MM" 24h */
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: number;
  status: BookingStatus;
  createdAt: string;
  decidedBy?: string;
  decisionNote?: string;
}

export type NewBooking = Omit<Booking, "id" | "status" | "createdAt" | "spaceName">;

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "HH:MM" -> minutes since midnight. */
export const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Half-open interval overlap: back-to-back bookings (10:00–11:00, 11:00–12:00)
 * do not count as a clash.
 */
export const overlaps = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean => toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);

/** Local YYYY-MM-DD; avoids the UTC shift that a bare toISOString() introduces. */
export const todayISO = (): string => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
};

/** Weekday for a "YYYY-MM-DD" string, parsed as local time (not UTC). */
export const weekdayOf = (date: string): number => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
};

/** A booking holds a slot only while pending or approved. */
export const holdsSlot = (b: Pick<Booking, "status">): boolean =>
  b.status === "pending" || b.status === "approved";

/**
 * Validates a booking request against its space and the bookings already
 * holding slots on that day. Returns an error message, or null when valid.
 */
export const validateBooking = (
  booking: NewBooking,
  space: Space | undefined,
  sameDayBookings: Booking[],
  today: string = todayISO()
): string | null => {
  if (!space) return "That space no longer exists.";
  if (!space.active) return `${space.name} is currently unavailable for booking.`;

  if (!booking.date) return "Pick a date.";
  if (booking.date < today) return "That date is in the past.";

  const weekday = weekdayOf(booking.date);
  if (!space.openDays.includes(weekday)) {
    const open = space.openDays.map((n) => DAY_NAMES[n]).join(", ");
    return `${space.name} is only open on ${open}.`;
  }

  if (!booking.startTime || !booking.endTime) return "Pick a start and end time.";
  const start = toMinutes(booking.startTime);
  const end = toMinutes(booking.endTime);
  if (end <= start) return "End time must be after the start time.";

  if (start < toMinutes(space.openTime) || end > toMinutes(space.closeTime)) {
    return `${space.name} is open ${space.openTime}–${space.closeTime}.`;
  }

  if ((end - start) / 60 > space.maxBookingHours) {
    return `Bookings for ${space.name} are capped at ${space.maxBookingHours} hour(s).`;
  }

  if (booking.attendees < 1) return "Enter how many people will attend.";
  if (booking.attendees > space.capacity) return `${space.name} seats ${space.capacity}.`;

  if (!booking.purpose.trim()) return "Add a short purpose for the booking.";

  const clash = sameDayBookings
    .filter((b) => b.spaceId === booking.spaceId && b.date === booking.date && holdsSlot(b))
    .find((b) => overlaps(booking.startTime, booking.endTime, b.startTime, b.endTime));

  if (clash) return `Already booked ${clash.startTime}–${clash.endTime}. Pick another slot.`;

  return null;
};
