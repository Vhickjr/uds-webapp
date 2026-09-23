"use client";

import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  validateBooking as validateBookingRules,
  holdsSlot,
  todayISO,
  DAY_NAMES,
  type Space,
  type SpaceCategory,
  type Booking,
  type BookingStatus,
  type NewBooking,
} from "@/lib/booking-rules";

export type { Space, SpaceCategory, Booking, BookingStatus, NewBooking };
export { todayISO, DAY_NAMES };

export interface BookingResult {
  ok: boolean;
  error?: string;
  booking?: Booking;
}

interface SpaceContextType {
  spaces: Space[];
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addSpace: (space: Omit<Space, "id">) => Promise<void>;
  updateSpace: (id: string, updates: Partial<Space>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  requestBooking: (booking: NewBooking) => Promise<BookingResult>;
  approveBooking: (id: string) => Promise<void>;
  rejectBooking: (id: string, note?: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  activeBookingsFor: (spaceId: string, date: string) => Booking[];
  validateBooking: (booking: NewBooking) => string | null;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Row mapping: Postgres is snake_case and stores times as HH:MM:SS.
// ---------------------------------------------------------------------------

const hhmm = (t: string | null): string => (t ?? "").slice(0, 5);

interface SpaceRow {
  id: string; name: string; description: string; category: string;
  location: string; capacity: number; amenities: string[] | null;
  open_time: string; close_time: string; open_days: number[] | null;
  max_booking_hours: number; requires_approval: boolean; active: boolean;
}

const toSpace = (r: SpaceRow): Space => ({
  id: r.id,
  name: r.name,
  description: r.description ?? "",
  category: r.category as SpaceCategory,
  location: r.location ?? "",
  capacity: r.capacity,
  amenities: r.amenities ?? [],
  openTime: hhmm(r.open_time),
  closeTime: hhmm(r.close_time),
  openDays: r.open_days ?? [],
  maxBookingHours: r.max_booking_hours,
  requiresApproval: r.requires_approval,
  active: r.active,
});

const fromSpace = (s: Partial<Space>) => {
  const row: Record<string, unknown> = {};
  if (s.name !== undefined) row.name = s.name;
  if (s.description !== undefined) row.description = s.description;
  if (s.category !== undefined) row.category = s.category;
  if (s.location !== undefined) row.location = s.location;
  if (s.capacity !== undefined) row.capacity = s.capacity;
  if (s.amenities !== undefined) row.amenities = s.amenities;
  if (s.openTime !== undefined) row.open_time = s.openTime;
  if (s.closeTime !== undefined) row.close_time = s.closeTime;
  if (s.openDays !== undefined) row.open_days = s.openDays;
  if (s.maxBookingHours !== undefined) row.max_booking_hours = s.maxBookingHours;
  if (s.requiresApproval !== undefined) row.requires_approval = s.requiresApproval;
  if (s.active !== undefined) row.active = s.active;
  return row;
};

interface BookingRow {
  id: string; space_id: string; user_id: string; date: string;
  start_time: string; end_time: string; purpose: string; attendees: number;
  status: BookingStatus; decided_by: string | null; decision_note: string | null;
  spaces?: { name: string } | null;
  profiles?: { first_name: string | null; last_name: string | null } | null;
}

const toBooking = (r: BookingRow): Booking => ({
  id: r.id,
  spaceId: r.space_id,
  spaceName: r.spaces?.name ?? "",
  userId: r.user_id,
  userName: [r.profiles?.first_name, r.profiles?.last_name].filter(Boolean).join(" "),
  date: r.date,
  startTime: hhmm(r.start_time),
  endTime: hhmm(r.end_time),
  purpose: r.purpose ?? "",
  attendees: r.attendees,
  status: r.status,
  createdAt: "",
  decidedBy: r.decided_by ?? undefined,
  decisionNote: r.decision_note ?? undefined,
});

const BOOKING_SELECT =
  "id, space_id, user_id, date, start_time, end_time, purpose, attendees, status, decided_by, decision_note, spaces(name), profiles(first_name, last_name)";

export const SpaceProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !isAuthenticated) {
      setSpaces([]);
      setBookings([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [spaceRes, bookingRes] = await Promise.all([
        supabase.from("spaces").select("*").order("name"),
        supabase.from("bookings").select(BOOKING_SELECT).order("date", { ascending: false }),
      ]);

      if (spaceRes.error) throw new Error(spaceRes.error.message);
      if (bookingRes.error) throw new Error(bookingRes.error.message);

      setSpaces((spaceRes.data as SpaceRow[]).map(toSpace));
      setBookings((bookingRes.data as unknown as BookingRow[]).map(toBooking));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load spaces");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { void refresh(); }, [refresh]);

  const addSpace = useCallback(async (data: Omit<Space, "id">) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase unavailable");
    const { error } = await supabase.from("spaces").insert(fromSpace(data));
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  const updateSpace = useCallback(async (id: string, updates: Partial<Space>) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase unavailable");
    const { error } = await supabase.from("spaces").update(fromSpace(updates)).eq("id", id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  const deleteSpace = useCallback(async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase unavailable");
    // bookings.space_id cascades on delete, so its rows go with the space.
    const { error } = await supabase.from("spaces").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  const activeBookingsFor = useCallback(
    (spaceId: string, date: string): Booking[] =>
      bookings.filter((b) => b.spaceId === spaceId && b.date === date && holdsSlot(b)),
    [bookings]
  );

  const validateBooking = useCallback(
    (b: NewBooking): string | null =>
      validateBookingRules(b, spaces.find((s) => s.id === b.spaceId), bookings),
    [spaces, bookings]
  );

  const requestBooking = useCallback(async (data: NewBooking): Promise<BookingResult> => {
    const supabase = getSupabase();
    if (!supabase || !user) return { ok: false, error: "You need to be signed in." };

    // Client-side check for a fast, friendly message. The database's exclusion
    // constraint is the real guarantee against a concurrent double-booking.
    const localError = validateBooking(data);
    if (localError) return { ok: false, error: localError };

    const space = spaces.find((s) => s.id === data.spaceId);
    const { data: row, error } = await supabase
      .from("bookings")
      .insert({
        space_id: data.spaceId,
        user_id: user._id,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        purpose: data.purpose,
        attendees: data.attendees,
        status: space?.requiresApproval === false ? "approved" : "pending",
      })
      .select(BOOKING_SELECT)
      .single();

    if (error) {
      // 23P01 = exclusion_violation, i.e. someone took the slot first.
      const friendly =
        error.code === "23P01"
          ? "That slot was just taken. Pick another time."
          : error.message;
      return { ok: false, error: friendly };
    }

    await refresh();
    return { ok: true, booking: toBooking(row as unknown as BookingRow) };
  }, [user, spaces, validateBooking, refresh]);

  const setStatus = useCallback(
    async (id: string, status: BookingStatus, note?: string) => {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase unavailable");
      const patch: Record<string, unknown> = { status };
      if (user) patch.decided_by = user._id;
      if (note !== undefined) patch.decision_note = note;
      const { error } = await supabase.from("bookings").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      await refresh();
    },
    [user, refresh]
  );

  const approveBooking = useCallback((id: string) => setStatus(id, "approved"), [setStatus]);
  const rejectBooking = useCallback(
    (id: string, note?: string) => setStatus(id, "rejected", note),
    [setStatus]
  );
  const cancelBooking = useCallback((id: string) => setStatus(id, "cancelled"), [setStatus]);

  return (
    <SpaceContext.Provider
      value={{
        spaces, bookings, loading, error, refresh,
        addSpace, updateSpace, deleteSpace,
        requestBooking, approveBooking, rejectBooking, cancelBooking,
        activeBookingsFor, validateBooking,
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
};

export const useSpaces = () => {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error("useSpaces must be used within SpaceProvider");
  return ctx;
};

export default SpaceContext;
