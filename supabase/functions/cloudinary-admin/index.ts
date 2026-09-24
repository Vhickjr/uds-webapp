/**
 * Cloudinary admin operations that require the API secret.
 *
 * The secret must never reach the browser, so privileged calls (delete,
 * replace) go: browser -> this function -> Cloudinary. Unsigned uploads still
 * go straight from the browser to Cloudinary via the upload preset; only
 * destructive operations come through here.
 *
 * Secrets required (supabase secrets set ...):
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const CLOUD = Deno.env.get("CLOUDINARY_CLOUD_NAME");
const API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
const API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

/** Cloudinary signs the alphabetically-sorted params, then appends the secret. */
const sign = async (params: Record<string, string>): Promise<string> => {
  const payload = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const bytes = new TextEncoder().encode(payload + API_SECRET);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (!CLOUD || !API_KEY || !API_SECRET) {
    return json({ error: "Cloudinary secrets are not configured on this function." }, 500);
  }

  // --- Authorise: must be a signed-in admin ------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return json({ error: "Not authenticated" }, 401);

  // Reuse the same role source the rest of the app trusts.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  const role = profile?.role;
  if (role !== "admin" && role !== "superadmin") {
    return json({ error: "Admins only" }, 403);
  }

  // --- Act ----------------------------------------------------------------
  let body: { action?: string; publicId?: string; resourceType?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { action, publicId, resourceType = "image" } = body;

  if (action !== "delete") {
    return json({ error: `Unsupported action: ${action ?? "(none)"}` }, 400);
  }
  if (!publicId) return json({ error: "publicId is required" }, 400);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await sign({ public_id: publicId, timestamp });

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("timestamp", timestamp);
  form.append("api_key", API_KEY);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType}/destroy`,
    { method: "POST", body: form }
  );

  const result = await res.json().catch(() => null);

  // Cloudinary answers 200 with {result:"not found"} for an unknown id.
  if (!res.ok || (result && result.result !== "ok" && result.result !== "not found")) {
    return json({ error: result?.error?.message ?? "Delete failed", result }, 502);
  }

  return json({ ok: true, result: result?.result ?? "ok", publicId });
});
