import { Suspense } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/DashboardShell";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        }
      >
        <DashboardShell />
      </Suspense>
    </RequireAuth>
  );
}
