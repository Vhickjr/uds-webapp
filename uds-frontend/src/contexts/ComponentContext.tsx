"use client";

import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface Component {
  id: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  status: "available" | "checked-out" | "low-stock";
}

export interface CheckoutRecord {
  id: string;
  componentId: string;
  componentName: string;
  userId: string;
  userName: string;
  quantity: number;
  checkoutDate: string;
  expectedReturn: string;
  returned: boolean;
  returnRequested?: boolean;
}

interface ComponentContextType {
  components: Component[];
  checkoutHistory: CheckoutRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addComponent: (c: Omit<Component, "id" | "available" | "status">) => Promise<void>;
  updateComponent: (id: string, updates: Partial<Component>) => Promise<void>;
  deleteComponent: (id: string) => Promise<void>;
  checkoutComponent: (
    componentId: string, quantity: number, expectedReturn: string
  ) => Promise<{ ok: boolean; error?: string }>;
  returnComponent: (checkoutId: string) => Promise<void>;
  requestReturn: (checkoutId: string) => Promise<void>;
  clearReturnRequest: (checkoutId: string) => Promise<void>;
}

const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

interface ComponentRow {
  id: string; name: string; category: string;
  quantity: number; available: number; status: Component["status"];
}

const toComponent = (r: ComponentRow): Component => ({
  id: r.id,
  name: r.name,
  category: r.category ?? "",
  quantity: r.quantity,
  available: r.available,
  status: r.status,
});

interface CheckoutRow {
  id: string; component_id: string; user_id: string; quantity: number;
  checkout_date: string; expected_return: string;
  returned: boolean; return_requested: boolean;
  components?: { name: string } | null;
  profiles?: { first_name: string | null; last_name: string | null } | null;
}

const toCheckout = (r: CheckoutRow): CheckoutRecord => ({
  id: r.id,
  componentId: r.component_id,
  componentName: r.components?.name ?? "",
  userId: r.user_id,
  userName: [r.profiles?.first_name, r.profiles?.last_name].filter(Boolean).join(" "),
  quantity: r.quantity,
  checkoutDate: r.checkout_date,
  expectedReturn: r.expected_return,
  returned: r.returned,
  returnRequested: r.return_requested,
});

const CHECKOUT_SELECT =
  "id, component_id, user_id, quantity, checkout_date, expected_return, returned, return_requested, components(name), profiles(first_name, last_name)";

export const ComponentProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [components, setComponents] = useState<Component[]>([]);
  const [checkoutHistory, setCheckoutHistory] = useState<CheckoutRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !isAuthenticated) {
      setComponents([]);
      setCheckoutHistory([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [compRes, coRes] = await Promise.all([
        // The view adds the derived `status` column.
        supabase.from("components_with_status").select("*").order("name"),
        supabase.from("checkouts").select(CHECKOUT_SELECT).order("checkout_date", { ascending: false }),
      ]);

      if (compRes.error) throw new Error(compRes.error.message);
      if (coRes.error) throw new Error(coRes.error.message);

      setComponents((compRes.data as ComponentRow[]).map(toComponent));
      setCheckoutHistory((coRes.data as unknown as CheckoutRow[]).map(toCheckout));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { void refresh(); }, [refresh]);

  const addComponent = useCallback(
    async (data: Omit<Component, "id" | "available" | "status">) => {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase unavailable");
      const { error } = await supabase.from("components").insert({
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        available: data.quantity,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh]
  );

  const updateComponent = useCallback(async (id: string, updates: Partial<Component>) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase unavailable");

    const row: Record<string, unknown> = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.quantity !== undefined) row.quantity = updates.quantity;
    if (updates.available !== undefined) row.available = updates.available;

    const { error } = await supabase.from("components").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  const deleteComponent = useCallback(async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase unavailable");
    const { error } = await supabase.from("components").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  /** Borrow: goes through the RPC so the stock decrement and ledger row are atomic. */
  const checkoutComponent = useCallback(
    async (componentId: string, quantity: number, expectedReturn: string) => {
      const supabase = getSupabase();
      if (!supabase) return { ok: false, error: "Supabase unavailable" };

      const { error } = await supabase.rpc("checkout_component", {
        p_component_id: componentId,
        p_quantity: quantity,
        p_expected_return: expectedReturn,
      });

      if (error) return { ok: false, error: error.message };
      await refresh();
      return { ok: true };
    },
    [refresh]
  );

  /** Return: RPC restores stock and closes the checkout in one transaction. */
  const returnComponent = useCallback(async (checkoutId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase unavailable");
    const { error } = await supabase.rpc("return_checkout", { p_checkout_id: checkoutId });
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  const setReturnRequested = useCallback(
    async (checkoutId: string, value: boolean) => {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase unavailable");
      const { error } = await supabase
        .from("checkouts")
        .update({ return_requested: value })
        .eq("id", checkoutId);
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh]
  );

  const requestReturn = useCallback(
    (id: string) => setReturnRequested(id, true), [setReturnRequested]);
  const clearReturnRequest = useCallback(
    (id: string) => setReturnRequested(id, false), [setReturnRequested]);

  return (
    <ComponentContext.Provider
      value={{
        components, checkoutHistory, loading, error, refresh,
        addComponent, updateComponent, deleteComponent,
        checkoutComponent, returnComponent, requestReturn, clearReturnRequest,
      }}
    >
      {children}
    </ComponentContext.Provider>
  );
};

export const useComponents = () => {
  const ctx = useContext(ComponentContext);
  if (!ctx) throw new Error("useComponents must be used within ComponentProvider");
  return ctx;
};

export default ComponentContext;
