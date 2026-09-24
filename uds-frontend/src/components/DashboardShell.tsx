"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Package, CalendarPlus, History, CalendarCheck, Lightbulb,
  Boxes, DoorOpen, BarChart3, Globe, Users as UsersIcon, LogOut, ShieldCheck, Clock,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Dashboard } from "@/components/Dashboard";
import { InventoryList } from "@/components/InventoryList";
import { AdminPanel } from "@/components/AdminPanel";
import { SpaceBooking } from "@/components/SpaceBooking";
import { SpaceAdminPanel } from "@/components/SpaceAdminPanel";
import { SiteAdminPanel } from "@/components/SiteAdminPanel";
import { UserAdminPanel } from "@/components/UserAdminPanel";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import MyBookings from "@/components/MyBookings";
import MyBorrowings from "@/components/MyBorrowings";
import ProjectIdeaGenerator from "@/components/ProjectIdeaGenerator";

import { useAuth } from "@/contexts/AuthContext";
import { useSpaces } from "@/contexts/SpaceContext";
import {
  isAdmin, isSuperAdmin, canEditContent, canManageUsers, canTransact, ROLE_LABELS,
} from "@/lib/permissions";

interface NavItem {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const DashboardShell = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { bookings } = useSpaces();
  const router = useRouter();
  const searchParams = useSearchParams();

  const admin = isAdmin(user?.role);
  const superAdmin = isSuperAdmin(user?.role);
  const editsContent = canEditContent(user?.role);
  const managesUsers = canManageUsers(user?.role);
  const transacts = canTransact(user?.role);
  const isGuest = user?.role === "guest";

  const pendingBookings = bookings.filter((b) => b.status === "pending").length;

  const groups: NavGroup[] = useMemo(() => {
    const g: NavGroup[] = [
      {
        label: "Workspace",
        items: [
          { key: "dashboard", label: "Overview", icon: LayoutDashboard },
          { key: "inventory", label: "Inventory", icon: Package },
          ...(transacts
            ? [{ key: "spaces", label: "Book a Space", icon: CalendarPlus }]
            : []),
        ],
      },
    ];

    const mine: NavItem[] = [];
    if (transacts) {
      mine.push({ key: "myborrowings", label: "My Borrowings", icon: History });
      mine.push({ key: "mybookings", label: "My Bookings", icon: CalendarCheck });
    }
    if (isAuthenticated) {
      mine.push({ key: "ideas", label: "Idea Generator", icon: Lightbulb });
    }
    if (mine.length) g.push({ label: "My Activity", items: mine });

    const ops: NavItem[] = [];
    if (admin) {
      ops.push({ key: "admin", label: "Inventory Admin", icon: Boxes });
      ops.push({
        key: "spaceadmin", label: "Space Admin", icon: DoorOpen,
        badge: pendingBookings || undefined,
      });
      ops.push({ key: "analytics", label: "Analytics", icon: BarChart3 });
    }
    if (editsContent) ops.push({ key: "siteadmin", label: "Website", icon: Globe });
    if (managesUsers) ops.push({ key: "users", label: "Users", icon: UsersIcon });
    if (ops.length) g.push({ label: "Administration", items: ops });

    return g;
  }, [transacts, isAuthenticated, admin, editsContent, managesUsers, pendingBookings]);

  const allowed = useMemo(
    () => new Set(groups.flatMap((g) => g.items.map((i) => i.key))),
    [groups]
  );

  const requested = searchParams.get("tab");
  const active = requested && allowed.has(requested) ? requested : "dashboard";

  const activeItem = groups.flatMap((g) => g.items).find((i) => i.key === active);

  const go = useCallback(
    (key: string) => {
      router.replace(key === "dashboard" ? "/dashboard" : `/dashboard?tab=${key}`, {
        scroll: false,
      });
    },
    [router]
  );

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  const panels: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    inventory: <InventoryList />,
    spaces: <SpaceBooking />,
    myborrowings: <MyBorrowings />,
    mybookings: <MyBookings />,
    ideas: <ProjectIdeaGenerator />,
    admin: <AdminPanel />,
    spaceadmin: <SpaceAdminPanel />,
    analytics: <AnalyticsPanel />,
    siteadmin: <SiteAdminPanel />,
    users: <UserAdminPanel />,
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarHeader className="p-3">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <Image
              src="/uds-logo.png"
              alt="UNILAG Design Studio"
              width={273}
              height={142}
              priority
              className="h-9 w-auto object-contain"
            />
          </Link>
        </SidebarHeader>

        <SidebarContent>
          {groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          isActive={active === item.key}
                          tooltip={item.label}
                          onClick={() => go(item.key)}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {item.badge ? (
                          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                        ) : null}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <div className="flex items-center gap-2 p-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">{displayName || user?.email}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {superAdmin && <ShieldCheck className="h-3 w-3 text-accent" />}
                {user ? ROLE_LABELS[user.role] : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              aria-label="Log out"
              className="h-8 w-8 shrink-0 group-data-[collapsible=icon]:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <SidebarTrigger />
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-semibold">
              {activeItem?.label ?? "Overview"}
            </h1>
          </div>
          {pendingBookings > 0 && admin && (
            <Badge variant="secondary" className="ml-auto gap-1">
              <Clock className="h-3 w-3" />
              {pendingBookings} pending
            </Badge>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {/* A new account lands as guest with almost nothing available —
              say why, rather than leaving them staring at an empty sidebar. */}
          {isGuest && (
            <div className="mb-6 rounded-xl border border-accent/40 bg-accent/10 p-4">
              <p className="font-medium text-foreground">Your account is pending approval</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You can browse the studio inventory, but borrowing equipment and booking
                spaces unlock once a studio administrator approves your account.
              </p>
            </div>
          )}

          {panels[active]}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardShell;
