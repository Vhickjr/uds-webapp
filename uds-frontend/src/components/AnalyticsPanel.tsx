"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import { AlertTriangle, Package, CalendarClock, TrendingUp } from "lucide-react";
import { useComponents } from "@/contexts/ComponentContext";
import { useSpaces } from "@/contexts/SpaceContext";
import { CHART_COLORS, STATUS_COLORS, AXIS_INK, GRID_INK } from "@/lib/chart-palette";
import { todayISO } from "@/lib/booking-rules";

const lastNDays = (n: number): string[] => {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const off = d.getTimezoneOffset() * 60000;
    out.push(new Date(d.getTime() - off).toISOString().split("T")[0]);
  }
  return out;
};

const shortDate = (iso: string) => iso.slice(5).replace("-", "/");

/** A single headline figure — clearer than a chart for one number. */
const StatTile = ({
  label, value, hint, icon: Icon, tone = "default",
}: {
  label: string; value: string | number; hint?: string;
  icon: typeof Package; tone?: "default" | "warn" | "bad";
}) => (
  <Card className="stat-card">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      <Icon
        className={`h-5 w-5 ${
          tone === "bad" ? "text-destructive" : tone === "warn" ? "text-accent" : "text-accent"
        }`}
      />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);

const chartTooltip = {
  contentStyle: {
    background: "hsl(0 0% 100%)",
    border: "1px solid hsl(29 32% 85%)",
    borderRadius: 12,
    fontSize: 13,
  },
};

export const AnalyticsPanel = () => {
  const { components, checkoutHistory } = useComponents();
  const { bookings } = useSpaces();
  const today = todayISO();

  // ---- Inventory ---------------------------------------------------------
  const totalUnits = components.reduce((s, c) => s + c.quantity, 0);
  const outUnits = components.reduce((s, c) => s + (c.quantity - c.available), 0);
  const utilisation = totalUnits ? Math.round((outUnits / totalUnits) * 100) : 0;

  const overdue = useMemo(
    () => checkoutHistory.filter((c) => !c.returned && c.expectedReturn < today),
    [checkoutHistory, today]
  );

  const lowStock = components.filter((c) => c.status === "low-stock");

  const topBorrowed = useMemo(() => {
    const counts: Record<string, number> = {};
    checkoutHistory.forEach((r) => {
      counts[r.componentName] = (counts[r.componentName] ?? 0) + r.quantity;
    });
    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  }, [checkoutHistory]);

  const borrowTrend = useMemo(() => {
    const days = lastNDays(14);
    const map: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
    checkoutHistory.forEach((r) => {
      if (r.checkoutDate in map) map[r.checkoutDate] += r.quantity;
    });
    return days.map((d) => ({ date: shortDate(d), units: map[d] }));
  }, [checkoutHistory]);

  // ---- Bookings ----------------------------------------------------------
  const bookingsBySpace = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      if (b.status === "cancelled" || b.status === "rejected") return;
      counts[b.spaceName || "Unknown"] = (counts[b.spaceName || "Unknown"] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [bookings]);

  const bookingStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => { counts[b.status] = (counts[b.status] ?? 0) + 1; });
    return (["approved", "pending", "rejected", "cancelled"] as const)
      .map((s) => ({ name: s, value: counts[s] ?? 0 }))
      .filter((d) => d.value > 0);
  }, [bookings]);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const upcoming = bookings.filter((b) => b.status === "approved" && b.date >= today).length;

  const hasBookings = bookings.length > 0;
  const hasCheckouts = checkoutHistory.length > 0;

  return (
    <div className="space-y-6">
      {/* Headline figures */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatTile
          label="Stock utilisation" value={`${utilisation}%`}
          hint={`${outUnits} of ${totalUnits} units out`} icon={TrendingUp}
        />
        <StatTile
          label="Overdue returns" value={overdue.length}
          hint={overdue.length ? "Past expected return date" : "Nothing overdue"}
          icon={AlertTriangle} tone={overdue.length ? "bad" : "default"}
        />
        <StatTile
          label="Low stock items" value={lowStock.length}
          hint={`${components.length} component types`} icon={Package}
          tone={lowStock.length ? "warn" : "default"}
        />
        <StatTile
          label="Bookings" value={upcoming}
          hint={`${pendingCount} awaiting approval`} icon={CalendarClock}
          tone={pendingCount ? "warn" : "default"}
        />
      </div>

      {/* Overdue is operational, not decorative — surface the rows themselves. */}
      {overdue.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Overdue items
              <Badge variant="destructive">{overdue.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Was due</TableHead>
                    <TableHead className="text-right">Days late</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue.map((r) => {
                    const late = Math.floor(
                      (Date.parse(today) - Date.parse(r.expectedReturn)) / 86400000
                    );
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.componentName}</TableCell>
                        <TableCell>{r.userName || "—"}</TableCell>
                        <TableCell>{r.quantity}</TableCell>
                        <TableCell>{r.expectedReturn}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {late}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Borrowing over time — one series, so no legend needed. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Units borrowed, last 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasCheckouts ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No borrowing recorded yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={borrowTrend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={GRID_INK} vertical={false} />
                  <XAxis dataKey="date" stroke={AXIS_INK} fontSize={12} tickLine={false} />
                  <YAxis stroke={AXIS_INK} fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip {...chartTooltip} />
                  <Line
                    type="monotone" dataKey="units" name="Units"
                    stroke={CHART_COLORS[0]} strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS[0] }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top borrowed — direct labels cover gold's sub-3:1 contrast. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most borrowed components</CardTitle>
          </CardHeader>
          <CardContent>
            {topBorrowed.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No borrowing recorded yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={topBorrowed} layout="vertical"
                  margin={{ top: 4, right: 32, left: 8, bottom: 0 }}
                >
                  <CartesianGrid stroke={GRID_INK} horizontal={false} />
                  <XAxis type="number" stroke={AXIS_INK} fontSize={12} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category" dataKey="name" stroke={AXIS_INK}
                    fontSize={12} tickLine={false} width={110}
                  />
                  <Tooltip {...chartTooltip} cursor={{ fill: "hsl(29 60% 89% / 0.4)" }} />
                  <Bar dataKey="qty" name="Units" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} barSize={16}>
                    <LabelList dataKey="qty" position="right" fontSize={12} fill={AXIS_INK} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Space demand */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bookings per space</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsBySpace.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No bookings yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bookingsBySpace} margin={{ top: 16, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={GRID_INK} vertical={false} />
                  <XAxis dataKey="name" stroke={AXIS_INK} fontSize={11} tickLine={false} interval={0} />
                  <YAxis stroke={AXIS_INK} fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip {...chartTooltip} cursor={{ fill: "hsl(29 60% 89% / 0.4)" }} />
                  <Bar dataKey="count" name="Bookings" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} barSize={38}>
                    <LabelList dataKey="count" position="top" fontSize={12} fill={AXIS_INK} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Booking status — reserved status colours, always with a text label. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasBookings ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No bookings yet.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={200} className="max-w-[220px]">
                  <PieChart>
                    <Pie
                      data={bookingStatus} dataKey="value" nameKey="name"
                      innerRadius={52} outerRadius={82} paddingAngle={2} stroke="hsl(0 0% 100%)" strokeWidth={2}
                    >
                      {bookingStatus.map((d) => (
                        <Cell
                          key={d.name}
                          fill={STATUS_COLORS[d.name as keyof typeof STATUS_COLORS]}
                        />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltip} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend doubles as the table view, so identity is never colour-alone. */}
                <ul className="flex-1 space-y-2 w-full">
                  {bookingStatus.map((d) => (
                    <li key={d.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-3 w-3 rounded-sm shrink-0"
                        style={{ background: STATUS_COLORS[d.name as keyof typeof STATUS_COLORS] }}
                      />
                      <span className="capitalize">{d.name}</span>
                      <span className="ml-auto font-medium tabular-nums">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low stock, as rows rather than a chart — it is a worklist. */}
      {lowStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low stock — reorder soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.category}</TableCell>
                      <TableCell className="text-right font-medium">{c.available}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{c.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPanel;
