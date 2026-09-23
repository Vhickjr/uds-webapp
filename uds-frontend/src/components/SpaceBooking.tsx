"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Users, Clock, CalendarCheck, Search, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSpaces, Space, DAY_NAMES, todayISO } from "@/contexts/SpaceContext";

export const SpaceBooking = () => {
  const { user } = useAuth();
  const { spaces, requestBooking, activeBookingsFor } = useSpaces();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Space | null>(null);

  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [purpose, setPurpose] = useState("");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(spaces.map((s) => s.category)))],
    [spaces]
  );

  const visible = spaces.filter((s) => {
    if (!s.active) return false;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.amenities.some((a) => a.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === "all" || s.category === category;
    return matchesSearch && matchesCategory;
  });

  const openBooking = (space: Space) => {
    setSelected(space);
    setDate(todayISO());
    setStartTime(space.openTime);
    setEndTime("");
    setAttendees(1);
    setPurpose("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !user) return;

    const result = await requestBooking({
      spaceId: selected.id,
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      date,
      startTime,
      endTime,
      purpose,
      attendees,
    });

    if (!result.ok) {
      toast.error(result.error ?? "Could not create that booking.");
      return;
    }

    toast.success(
      result.booking?.status === "approved"
        ? `${selected.name} booked for ${date}, ${startTime}–${endTime}.`
        : `Request sent for ${selected.name}. An admin will review it.`
    );
    setSelected(null);
  };

  // Slots already taken on the chosen day, so users can avoid a clash up front.
  const takenSlots = selected ? activeBookingsFor(selected.id, date) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search spaces or amenities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No bookable spaces match that search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((space) => (
            <Card key={space.id} className="component-card flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{space.name}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {space.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-3">
                <p className="text-sm text-muted-foreground">{space.description}</p>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {space.location}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    Seats {space.capacity}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {space.openTime}–{space.closeTime} ·{" "}
                    {space.openDays.map((d) => DAY_NAMES[d]).join(", ")}
                  </div>
                </div>

                {space.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {space.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-2 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {space.requiresApproval ? (
                      <>
                        <CalendarCheck className="h-3.5 w-3.5" />
                        Needs admin approval
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5 text-accent" />
                        Books instantly
                      </>
                    )}
                    <span className="ml-auto">Max {space.maxBookingHours}h</span>
                  </div>
                  <Button className="w-full" onClick={() => openBooking(space)}>
                    Book this space
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book {selected?.name}</DialogTitle>
          </DialogHeader>

          {selected && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="booking-date">Date</Label>
                <Input
                  id="booking-date"
                  type="date"
                  min={todayISO()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="booking-start">Start</Label>
                  <Input
                    id="booking-start"
                    type="time"
                    min={selected.openTime}
                    max={selected.closeTime}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="booking-end">End</Label>
                  <Input
                    id="booking-end"
                    type="time"
                    min={selected.openTime}
                    max={selected.closeTime}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {takenSlots.length > 0 && (
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-xs font-medium mb-1.5">Already booked on {date}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {takenSlots.map((b) => (
                      <span
                        key={b.id}
                        className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {b.startTime}–{b.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="booking-attendees">Attendees (max {selected.capacity})</Label>
                <Input
                  id="booking-attendees"
                  type="number"
                  min={1}
                  max={selected.capacity}
                  value={attendees}
                  onChange={(e) => setAttendees(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="booking-purpose">Purpose</Label>
                <Input
                  id="booking-purpose"
                  placeholder="e.g. Final year project testing"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="mt-1"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {selected.requiresApproval
                  ? "This space needs admin approval — you'll see the request as pending."
                  : "This space books instantly."}{" "}
                Open {selected.openTime}–{selected.closeTime}, up to{" "}
                {selected.maxBookingHours}h per booking.
              </p>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {selected.requiresApproval ? "Request booking" : "Confirm booking"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpaceBooking;
