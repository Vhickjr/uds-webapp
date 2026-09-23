"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Check, X, CalendarClock, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import {
  useSpaces,
  Space,
  SpaceCategory,
  DAY_NAMES,
} from "@/contexts/SpaceContext";

const CATEGORIES: SpaceCategory[] = [
  "Lab",
  "Workshop",
  "Studio",
  "Meeting Room",
  "Collaboration Area",
];

type FormState = {
  name: string;
  description: string;
  category: SpaceCategory;
  location: string;
  capacity: number;
  amenities: string;
  openTime: string;
  closeTime: string;
  openDays: number[];
  maxBookingHours: number;
  requiresApproval: boolean;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  category: "Lab",
  location: "",
  capacity: 10,
  amenities: "",
  openTime: "08:00",
  closeTime: "16:00",
  openDays: [1, 2, 3, 4, 5],
  maxBookingHours: 4,
  requiresApproval: true,
  active: true,
};

export const SpaceAdminPanel = () => {
  const {
    spaces,
    bookings,
    addSpace,
    updateSpace,
    deleteSpace,
    approveBooking,
    rejectBooking,
  } = useSpaces();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Space | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const pending = bookings.filter((b) => b.status === "pending");

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (space: Space) => {
    setEditing(space);
    setForm({
      name: space.name,
      description: space.description,
      category: space.category,
      location: space.location,
      capacity: space.capacity,
      amenities: space.amenities.join(", "),
      openTime: space.openTime,
      closeTime: space.closeTime,
      openDays: space.openDays,
      maxBookingHours: space.maxBookingHours,
      requiresApproval: space.requiresApproval,
      active: space.active,
    });
    setDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      openDays: f.openDays.includes(day)
        ? f.openDays.filter((d) => d !== day)
        : [...f.openDays, day].sort(),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.location.trim()) {
      toast.error("Name and location are required.");
      return;
    }
    if (form.capacity < 1) {
      toast.error("Capacity must be at least 1.");
      return;
    }
    if (form.openTime >= form.closeTime) {
      toast.error("Closing time must be after opening time.");
      return;
    }
    if (form.openDays.length === 0) {
      toast.error("Pick at least one open day.");
      return;
    }
    if (form.maxBookingHours < 1) {
      toast.error("Max booking length must be at least 1 hour.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      location: form.location.trim(),
      capacity: form.capacity,
      amenities: form.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      openTime: form.openTime,
      closeTime: form.closeTime,
      openDays: form.openDays,
      maxBookingHours: form.maxBookingHours,
      requiresApproval: form.requiresApproval,
      active: form.active,
    };

    try {
      if (editing) {
        await updateSpace(editing.id, payload);
        toast.success(`${payload.name} updated`);
      } else {
        await addSpace(payload);
        toast.success(`${payload.name} added`);
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleDelete = async (space: Space) => {
    const affected = bookings.filter(
      (b) => b.spaceId === space.id && (b.status === "pending" || b.status === "approved")
    ).length;
    try {
      await deleteSpace(space.id);
      toast.success(
        affected > 0
          ? `${space.name} deleted — ${affected} booking(s) removed with it`
          : `${space.name} deleted`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Booking Requests
            {pending.length > 0 && <Badge variant="secondary">{pending.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Space</TableHead>
                  <TableHead>Requested by</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>People</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No requests waiting for review.
                    </TableCell>
                  </TableRow>
                ) : (
                  pending.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.spaceName}</TableCell>
                      <TableCell>{b.userName}</TableCell>
                      <TableCell>
                        {b.date}
                        <span className="block text-xs text-muted-foreground">
                          {b.startTime}–{b.endTime}
                        </span>
                      </TableCell>
                      <TableCell>{b.attendees}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{b.purpose}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await approveBooking(b.id);
                                toast.success("Booking approved");
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "Approve failed");
                              }
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                await rejectBooking(b.id, "Rejected by admin");
                                toast("Booking rejected");
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "Reject failed");
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Space management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            Bookable Spaces
          </CardTitle>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add space
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Space</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spaces.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No spaces configured yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  spaces.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <span className="font-medium">{s.name}</span>
                        <span className="block text-xs text-muted-foreground">{s.location}</span>
                      </TableCell>
                      <TableCell>{s.category}</TableCell>
                      <TableCell>{s.capacity}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {s.openTime}–{s.closeTime}
                        <span className="block text-xs text-muted-foreground">
                          {s.openDays.map((d) => DAY_NAMES[d]).join(", ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        Max {s.maxBookingHours}h
                        <span className="block">
                          {s.requiresApproval ? "Approval required" : "Instant booking"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.active ? "default" : "outline"}>
                          {s.active ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(s)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add / edit space */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add a space"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="space-name">Name</Label>
              <Input
                id="space-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="space-description">Description</Label>
              <Textarea
                id="space-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as SpaceCategory })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="space-capacity">Capacity</Label>
                <Input
                  id="space-capacity"
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="space-location">Location</Label>
              <Input
                id="space-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="space-amenities">Amenities (comma separated)</Label>
              <Input
                id="space-amenities"
                placeholder="Projector, Whiteboard, Wi-Fi"
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="space-open">Opens</Label>
                <Input
                  id="space-open"
                  type="time"
                  value={form.openTime}
                  onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="space-close">Closes</Label>
                <Input
                  id="space-close"
                  type="time"
                  value={form.closeTime}
                  onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="space-max">Max hours</Label>
                <Input
                  id="space-max"
                  type="number"
                  min={1}
                  value={form.maxBookingHours}
                  onChange={(e) => setForm({ ...form, maxBookingHours: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Open days</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DAY_NAMES.map((name, day) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      form.openDays.includes(day)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="space-approval">Require approval</Label>
                <p className="text-xs text-muted-foreground">
                  Off means bookings confirm instantly.
                </p>
              </div>
              <Switch
                id="space-approval"
                checked={form.requiresApproval}
                onCheckedChange={(v) => setForm({ ...form, requiresApproval: v })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="space-active">Available for booking</Label>
                <p className="text-xs text-muted-foreground">
                  Off hides it without deleting its history.
                </p>
              </div>
              <Switch
                id="space-active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editing ? "Save changes" : "Add space"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpaceAdminPanel;
