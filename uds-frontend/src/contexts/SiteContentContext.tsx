"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { DEFAULT_CONTENT } from "@/lib/site-defaults";
import { mergeSection, type SectionContent, type SiteContent } from "@/lib/site-content";

const STORAGE_KEY = "uds_site_content";

interface SiteContentContextType {
  content: SiteContent;
  loading: boolean;
  /** Where the content currently in memory came from. */
  source: "supabase" | "local" | "defaults";
  getSection: (key: string) => SectionContent;
  saveSection: (key: string, value: SectionContent) => Promise<void>;
  resetSection: (key: string) => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

const readLocal = (): SiteContent => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SiteContent) : {};
  } catch {
    return {};
  }
};

const writeLocal = (content: SiteContent) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(content)); } catch { /* ignore */ }
};

export const SiteContentProvider = ({ children }: { children: ReactNode }) => {
  const [overrides, setOverrides] = useState<SiteContent>({});
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [source, setSource] = useState<"supabase" | "local" | "defaults">(
    isSupabaseConfigured ? "supabase" : "defaults"
  );

  // Hydrate from localStorage on mount (never during render — it would mismatch SSR).
  useEffect(() => {
    const local = readLocal();
    if (Object.keys(local).length > 0) {
      setOverrides(local);
      if (!isSupabaseConfigured) setSource("local");
    }
  }, []);

  // When Supabase is configured it is authoritative and replaces local overrides.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("site_content").select("section, data");
      if (cancelled) return;

      if (error) {
        // Fall back to whatever is cached locally rather than blanking the site.
        console.error("site_content load failed:", error.message);
        setSource(Object.keys(readLocal()).length ? "local" : "defaults");
      } else {
        const next: SiteContent = {};
        for (const row of data ?? []) {
          next[row.section as string] = row.data as SectionContent;
        }
        setOverrides(next);
        setSource("supabase");
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  const content = useMemo(() => {
    const merged: SiteContent = {};
    for (const [key, fallback] of Object.entries(DEFAULT_CONTENT)) {
      merged[key] = mergeSection(overrides[key], fallback);
    }
    return merged;
  }, [overrides]);

  const getSection = useCallback(
    (key: string): SectionContent =>
      content[key] ?? DEFAULT_CONTENT[key] ?? { fields: {}, items: [] },
    [content]
  );

  const saveSection = useCallback(async (key: string, value: SectionContent) => {
    setOverrides((prev) => {
      const next = { ...prev, [key]: value };
      writeLocal(next);
      return next;
    });

    const supabase = getSupabase();
    if (!supabase) return; // local-only until Supabase is configured

    const { error } = await supabase
      .from("site_content")
      .upsert({ section: key, data: value }, { onConflict: "section" });

    if (error) throw new Error(error.message);
  }, []);

  const resetSection = useCallback(async (key: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      writeLocal(next);
      return next;
    });

    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase.from("site_content").delete().eq("section", key);
    if (error) throw new Error(error.message);
  }, []);

  return (
    <SiteContentContext.Provider
      value={{ content, loading, source, getSection, saveSection, resetSection }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error("useSiteContent must be used within SiteContentProvider");
  return ctx;
};

/** Convenience hook for a single section. */
export const useSection = (key: string): SectionContent => useSiteContent().getSection(key);

export default SiteContentContext;
