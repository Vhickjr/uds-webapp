import { Suspense } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { IndexPage } from "@/components/IndexPage";

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
        <IndexPage />
      </Suspense>
    </RequireAuth>
  );
}
