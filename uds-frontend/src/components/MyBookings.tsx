"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSpaces, BookingStatus, todayISO } from "@/contexts/SpaceContext";

const statusVariant: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
  cancelled: "outline",
};

export const MyBookings = () => {
  const { user } = useAuth();
  const { bookings, cancelBooking } = useSpaces();

  const mine = bookings.filter((b) => b.userId === user?._id);

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking(id);
      toast.success("Booking cancelled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancel failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Space Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Space</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    You have no bookings yet.
                  </TableCell>
                </TableRow>
              ) : (
                mine.map((b) => {
                  // Only upcoming, live bookings can still be called off.
                  const cancellable =
                    (b.status === "pending" || b.status === "approved") && b.date >= todayISO();
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.spaceName}</TableCell>
                      <TableCell>{b.date}</TableCell>
                      <TableCell>
                        {b.startTime}–{b.endTime}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{b.purpose}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[b.status]} className="capitalize">
                          {b.status}
                        </Badge>
                        {b.status === "rejected" && b.decisionNote && (
                          <p className="mt-1 text-xs text-muted-foreground">{b.decisionNote}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {cancellable && (
                          <Button variant="outline" size="sm" onClick={() => handleCancel(b.id)}>
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyBookings;
