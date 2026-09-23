"use client";

import { Dashboard } from "@/components/Dashboard";
import { InventoryList } from "@/components/InventoryList";
import { AdminPanel } from "@/components/AdminPanel";
import { SpaceBooking } from "@/components/SpaceBooking";
import { SpaceAdminPanel } from "@/components/SpaceAdminPanel";
import MyBookings from "@/components/MyBookings";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MyBorrowings from "@/components/MyBorrowings";
import ProjectIdeaGenerator from "@/components/ProjectIdeaGenerator";
import { SiteAdminPanel } from "@/components/SiteAdminPanel";
import { isAdmin, isSuperAdmin, canEditContent, ROLE_LABELS } from "@/lib/permissions";

const triggerClass =
  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

export const IndexPage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const displayName = user ? `${user.firstName} ${user.lastName}` : "";

  const admin = isAdmin(user?.role);
  const superAdmin = isSuperAdmin(user?.role);
  const editsContent = canEditContent(user?.role);

  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");

  // Only honour a deep link the current user is actually allowed to open.
  const allowed = new Set<string>(["dashboard", "inventory"]);
  if (isAuthenticated) ["spaces", "mybookings", "ideas"].forEach((v) => allowed.add(v));
  if (user?.role === "intern") allowed.add("myborrowings");
  if (admin) ["admin", "spaceadmin"].forEach((v) => allowed.add(v));
  if (editsContent) allowed.add("siteadmin");

  const activeTab = requested && allowed.has(requested) ? requested : "dashboard";

  const handleTabChange = useCallback(
    (value: string) => {
      router.replace(value === "dashboard" ? "/dashboard" : `/dashboard?tab=${value}`, {
        scroll: false,
      });
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-background circuit-pattern">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src="/uds-logo.png"
                alt="UNILAG Design Studio — Innovation Hub"
                width={273}
                height={142}
                priority
                className="h-12 w-auto object-contain"
              />
            </Link>
            <div className="hidden sm:block border-l border-border pl-3">
              <p className="font-display text-sm font-semibold text-foreground">Inventory System</p>
              <p className="text-xs text-muted-foreground">Smart Studio Platform</p>
            </div>
            <div className="ml-auto text-right">
              {isAuthenticated ? (
                <div className="text-sm">
                  <div className="font-medium">{displayName}</div>
                  <div className="flex items-center justify-end gap-1.5">
                    {superAdmin && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                        Full access
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {user ? ROLE_LABELS[user.role] : ""}
                    </span>
                  </div>
                  <button onClick={() => logout()} className="text-xs text-red-500 mt-1">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Not signed in</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-secondary border border-border">
            <TabsTrigger value="dashboard" className={triggerClass}>
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="inventory" className={triggerClass}>
              Inventory
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger value="spaces" className={triggerClass}>
                Book a Space
              </TabsTrigger>
            )}
            {user?.role === "intern" && (
              <TabsTrigger value="myborrowings" className={triggerClass}>
                My Borrowings
              </TabsTrigger>
            )}
            {isAuthenticated && (
              <TabsTrigger value="mybookings" className={triggerClass}>
                My Bookings
              </TabsTrigger>
            )}
            {isAuthenticated && (
              <TabsTrigger value="ideas" className={triggerClass}>
                Idea Generator
              </TabsTrigger>
            )}
            {admin && (
              <TabsTrigger value="admin" className={triggerClass}>
                Inventory Admin
              </TabsTrigger>
            )}
            {admin && (
              <TabsTrigger value="spaceadmin" className={triggerClass}>
                Space Admin
              </TabsTrigger>
            )}
            {editsContent && (
              <TabsTrigger value="siteadmin" className={triggerClass}>
                Website
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryList />
          </TabsContent>

          {isAuthenticated && (
            <TabsContent value="spaces">
              <SpaceBooking />
            </TabsContent>
          )}

          {user?.role === "intern" && (
            <TabsContent value="myborrowings">
              <MyBorrowings />
            </TabsContent>
          )}

          {isAuthenticated && (
            <TabsContent value="mybookings">
              <MyBookings />
            </TabsContent>
          )}

          {isAuthenticated && (
            <TabsContent value="ideas">
              <ProjectIdeaGenerator />
            </TabsContent>
          )}

          {admin && (
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          )}

          {admin && (
            <TabsContent value="spaceadmin">
              <SpaceAdminPanel />
            </TabsContent>
          )}

          {editsContent && (
            <TabsContent value="siteadmin">
              <SiteAdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default IndexPage;
