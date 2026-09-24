"use client";

import { useRouter } from "next/navigation";
import {
  Package, TrendingUp, AlertCircle, CalendarCheck, ArrowRight,
  CalendarPlus, Lightbulb, Boxes, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useComponents } from "@/contexts/ComponentContext";
import { useSpaces } from "@/contexts/SpaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { canTransact, isAdmin } from "@/lib/permissions";
import { todayISO } from "@/lib/booking-rules";
import { Reveal, Stagger, StaggerItem, CountUp } from "@/components/motion/Motion";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export const Dashboard = () => {
  const { user } = useAuth();
  const { components, checkoutHistory, loading: invLoading } = useComponents();
  const { bookings, loading: spaceLoading } = useSpaces();
  const router = useRouter();

  const today = todayISO();
  const transacts = canTransact(user?.role);
  const admin = isAdmin(user?.role);
  const loading = invLoading || spaceLoading;

  const totalUnits = components.reduce((s, c) => s + c.quantity, 0);
  const outUnits = components.reduce((s, c) => s + (c.quantity - c.available), 0);
  const lowStock = components.filter((c) => c.status === "low-stock").length;

  const myOpen = checkoutHistory.filter((c) => c.userId === user?._id && !c.returned);
  const myUpcoming = bookings.filter(
    (b) => b.userId === user?._id && b.status === "approved" && b.date >= today
  );
  const overdue = checkoutHistory.filter((c) => !c.returned && c.expectedReturn < today);

  const stats = [
    {
      title: "Components", value: String(totalUnits), icon: Package,
      hint: `${components.length} types in the studio`,
    },
    {
      title: "Currently out", value: String(outUnits), icon: TrendingUp,
      hint: `${checkoutHistory.filter((c) => !c.returned).length} open loans`,
    },
    {
      title: "Low stock", value: String(lowStock), icon: AlertCircle,
      hint: lowStock ? "Needs reordering" : "Everything stocked",
      tone: lowStock ? "warn" : undefined,
    },
    {
      title: admin ? "Bookings today" : "My bookings", icon: CalendarCheck,
      value: String(
        admin
          ? bookings.filter((b) => b.date === today && b.status === "approved").length
          : myUpcoming.length
      ),
      hint: admin ? "Approved for today" : "Upcoming and approved",
    },
  ];

  const actions = [
    ...(transacts
      ? [
          { label: "Book a space", icon: CalendarPlus, tab: "spaces" },
          { label: "Browse inventory", icon: Boxes, tab: "inventory" },
        ]
      : [{ label: "Browse inventory", icon: Boxes, tab: "inventory" }]),
    { label: "Generate project ideas", icon: Lightbulb, tab: "ideas" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {greeting()}
            {user?.firstName ? `, ${user.firstName}` : ""}
          </h2>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening in the studio today.
          </p>
        </div>
      </Reveal>

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <StaggerItem key={s.title}>
              <Card className="stat-card h-full transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.title}
                  </CardTitle>
                  <Icon
                    className={`h-4 w-4 ${s.tone === "warn" ? "text-destructive" : "text-accent"}`}
                  />
                </CardHeader>
                <CardContent>
                  <div className="font-display text-3xl font-bold text-foreground">
                    <CountUp value={s.value} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </Stagger>

      {/* Overdue is the one thing that should interrupt you. */}
      {admin && overdue.length > 0 && (
        <Reveal>
          <Card className="border-destructive/40 bg-destructive/[0.04]">
            <CardContent className="flex flex-wrap items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm">
                <strong>{overdue.length}</strong> item{overdue.length === 1 ? " is" : "s are"}{" "}
                past their return date.
              </p>
              <button
                onClick={() => router.replace("/dashboard?tab=analytics", { scroll: false })}
                className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Review overdue
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </CardContent>
          </Card>
        </Reveal>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* What this user personally has out / booked */}
        <Reveal className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Your activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!transacts ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Borrowing and booking unlock once your account is approved.
                </p>
              ) : myOpen.length === 0 && myUpcoming.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nothing borrowed and nothing booked. Pick something up from the inventory
                  or reserve a space to get started.
                </p>
              ) : (
                <>
                  {myOpen.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.componentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.quantity} unit{c.quantity === 1 ? "" : "s"} · due {c.expectedReturn}
                        </p>
                      </div>
                      {c.expectedReturn < today && <Badge variant="destructive">Overdue</Badge>}
                    </div>
                  ))}
                  {myUpcoming.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <CalendarCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{b.spaceName}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.date} · {b.startTime}–{b.endTime}
                        </p>
                      </div>
                      <Badge variant="secondary">Booked</Badge>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.tab}
                    onClick={() =>
                      router.replace(`/dashboard?tab=${a.tab}`, { scroll: false })
                    }
                    className="group flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/50"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-accent" />
                    <span className="flex-1 text-sm font-medium">{a.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}

              {admin && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {bookings.filter((b) => b.status === "pending").length} booking request
                  {bookings.filter((b) => b.status === "pending").length === 1 ? "" : "s"} awaiting
                  your review
                </div>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
};

export default Dashboard;
