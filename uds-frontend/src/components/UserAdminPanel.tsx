"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShieldCheck, Users as UsersIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";
import { useAuth, type Role } from "@/contexts/AuthContext";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/permissions";

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  created_at: string;
}

const roleBadge: Record<Role, "default" | "secondary" | "outline"> = {
  superadmin: "default",
  admin: "default",
  intern: "secondary",
  guest: "outline",
};

export const UserAdminPanel = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, phone, role, created_at")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setRows((data ?? []) as ProfileRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const changeRole = async (row: ProfileRow, role: Role) => {
    const supabase = getSupabase();
    if (!supabase) return;

    setSavingId(row.id);
    // Optimistic: revert if the database refuses.
    const previous = row.role;
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, role } : x)));

    const { error } = await supabase.from("profiles").update({ role }).eq("id", row.id);

    if (error) {
      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, role: previous } : x)));
      toast.error(error.message);
    } else {
      toast.success(
        `${row.first_name || row.email} is now ${ROLE_LABELS[role]}` +
          (role === "guest" ? " — they can no longer borrow or book." : "")
      );
    }
    setSavingId(null);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.first_name, r.last_name, r.email].some((v) => (v ?? "").toLowerCase().includes(q))
    );
  }, [rows, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rows.forEach((r) => { c[r.role] = (c[r.role] ?? 0) + 1; });
    return c;
  }, [rows]);

  const pendingGuests = counts.guest ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            User Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            New accounts start as <strong>Guest</strong> and can browse only. Promote them to
            Intern to allow borrowing and space booking, or Admin to allow managing inventory,
            spaces and website content.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["superadmin", "admin", "intern", "guest"] as Role[]).map((r) => (
              <Badge key={r} variant={roleBadge[r]} className="gap-1.5">
                {ROLE_LABELS[r]}: {counts[r] ?? 0}
              </Badge>
            ))}
          </div>

          {pendingGuests > 0 && (
            <div className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
              <strong>{pendingGuests}</strong> account{pendingGuests === 1 ? "" : "s"} awaiting
              approval.
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {error && (
            <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[190px]">Change role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No accounts match that search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => {
                    const isSelf = row.id === user?._id;
                    const isOtherSuperadmin = row.role === "superadmin" && !isSelf;
                    // Locking your own row removes any way to strand the studio
                    // without a super admin by demoting the last one.
                    const locked = isSelf || isOtherSuperadmin;

                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.created_at?.split("T")[0]}
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleBadge[row.role]} className="gap-1">
                            {row.role === "superadmin" && <ShieldCheck className="h-3 w-3" />}
                            {ROLE_LABELS[row.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {locked ? (
                            <span className="text-xs text-muted-foreground">
                              {isSelf ? "Change via SQL" : "Super admin"}
                            </span>
                          ) : (
                            <Select
                              value={row.role}
                              disabled={savingId === row.id}
                              onValueChange={(v) => changeRole(row, v as Role)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ASSIGNABLE_ROLES.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {ROLE_LABELS[r]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
    </div>
  );
};

export default UserAdminPanel;
