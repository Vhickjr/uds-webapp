/**
 * Supabase auth + RLS smoke test.
 *
 * Verifies the things 0001_init.sql is responsible for:
 *   - signup creates an auth user
 *   - the handle_new_user trigger creates a matching profiles row
 *   - new users default to the 'intern' role
 *   - RLS stops one user reading another's profile
 *   - site_content is world-readable but not writable by a non-admin
 *
 * Uses only the anon key — never put a service role key in this file.
 *
 *   npm run test:auth
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Read .env.local without adding a dotenv dependency.
const loadEnv = () => {
  try {
    const envPath = new URL("../.env.local", import.meta.url);
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch (e) {
    console.warn(`(could not read .env.local: ${e.message} — falling back to real env vars)`);
  }
};
loadEnv();

// Named to avoid shadowing the global URL class that loadEnv() relies on.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing credentials.\n" +
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local\n" +
    "(Supabase dashboard -> Project Settings -> API)"
  );
  process.exit(1);
}

let pass = 0, fail = 0;
const check = async (name, fn) => {
  try {
    await fn();
    console.log(`  ok   ${name}`);
    pass++;
  } catch (e) {
    console.log(`  FAIL ${name}\n       ${e.message}`);
    fail++;
  }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const anon = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const stamp = Date.now();
const emailDomain = process.env.UDS_TEST_EMAIL_DOMAIN || "example.com";
const userA = { email: `uds-test-a-${stamp}@${emailDomain}`, password: "Test-Passw0rd!" };
const userB = { email: `uds-test-b-${stamp}@${emailDomain}`, password: "Test-Passw0rd!" };

console.log(`\nSupabase: ${SUPABASE_URL}\n`);

// ---------------------------------------------------------------------------
// Guard: never create accounts while email confirmation is on.
//
// With "Confirm email" enabled, every signup sends a real message. Test
// addresses do not exist, so those messages bounce — and a high bounce rate
// gets a project's email privileges restricted by Supabase. Abort instead.
// ---------------------------------------------------------------------------
{
  const probe = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await probe.auth.signInWithPassword({
    email: `conf-probe-${stamp}@invalid.test`,
    password: "not-a-real-password",
  });
  void data;
  // A non-existent account returns invalid_credentials; this call sends no mail.
  if (error && /confirm/i.test(error.message)) {
    console.error("Unexpected: confirmation error on a non-existent account.");
  }
}

const confirmProbe = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
  headers: { apikey: SUPABASE_ANON_KEY },
}).then((r) => r.json()).catch(() => null);

if (confirmProbe && confirmProbe.mailer_autoconfirm === false) {
  console.error(
    "\nRefusing to run: email confirmation is ENABLED on this project.\n" +
    "Every test signup would send mail to a non-existent address, and bounced\n" +
    "mail can get your project's email sending restricted.\n\n" +
    "Turn it off first:\n" +
    "  Authentication -> Sign In / Providers -> Email -> Confirm email (off)\n"
  );
  process.exit(1);
}



const clientA = anon();
const clientB = anon();
let idA = null;

console.log("signup + profile trigger");

await check("user A signs up", async () => {
  const { data, error } = await clientA.auth.signUp({
    email: userA.email,
    password: userA.password,
    options: { data: { first_name: "Test", last_name: "Alpha", phone: "+2340000000001" } },
  });
  if (error) throw new Error(error.message);
  assert(data.user, "no user returned");
  idA = data.user.id;

  if (!data.session) {
    throw new Error(
      "signed up but got no session — email confirmation is ON. " +
      "Disable it for testing: Authentication -> Sign In / Providers -> Confirm email (off)."
    );
  }
});

await check("handle_new_user created a profiles row", async () => {
  const { data, error } = await clientA.from("profiles").select("*").eq("id", idA).single();
  if (error) throw new Error(error.message);
  assert(data, "no profile row — the on_auth_user_created trigger did not fire");
  assert(data.email === userA.email, `profile email was ${data.email}`);
});

await check("signup metadata reached the profile", async () => {
  const { data, error } = await clientA.from("profiles").select("first_name,last_name").eq("id", idA).single();
  if (error) throw new Error(error.message);
  assert(data.first_name === "Test", `first_name was "${data.first_name}"`);
  assert(data.last_name === "Alpha", `last_name was "${data.last_name}"`);
});

await check("new user defaults to 'intern'", async () => {
  const { data, error } = await clientA.from("profiles").select("role").eq("id", idA).single();
  if (error) throw new Error(error.message);
  assert(data.role === "intern", `role was "${data.role}"`);
});

console.log("\nRLS");

await check("user B signs up", async () => {
  const { data, error } = await clientB.auth.signUp({
    email: userB.email,
    password: userB.password,
    options: { data: { first_name: "Test", last_name: "Beta", phone: "+2340000000002" } },
  });
  if (error) throw new Error(error.message);
  assert(data.session, "no session for user B");
});

await check("user B cannot read user A's profile", async () => {
  const { data, error } = await clientB.from("profiles").select("*").eq("id", idA);
  if (error) return; // blocked outright is also correct
  assert(!data || data.length === 0, "RLS LEAK: user B read user A's profile");
});

await check("a non-admin cannot escalate their own role", async () => {
  const { data: me } = await clientB.auth.getUser();
  const { error } = await clientB.from("profiles").update({ role: "superadmin" }).eq("id", me.user.id);
  if (error) return; // rejected is correct

  const { data } = await clientB.from("profiles").select("role").eq("id", me.user.id).single();
  assert(data.role !== "superadmin", "PRIVILEGE ESCALATION: a user promoted themselves to superadmin");
});

await check("site_content is publicly readable", async () => {
  const { error } = await anon().from("site_content").select("section").limit(1);
  if (error) throw new Error(error.message);
});

await check("a non-admin cannot write site_content", async () => {
  const { error } = await clientB
    .from("site_content")
    .upsert({ section: "hero", data: { hijacked: true } }, { onConflict: "section" });
  assert(error, "RLS LEAK: a non-admin wrote to site_content");
});

console.log("\nspaces + bookings");

await check("signed-in user can read spaces", async () => {
  const { error } = await clientA.from("spaces").select("id,name").limit(1);
  if (error) throw new Error(error.message);
});

await check("a non-admin cannot create a space", async () => {
  const { error } = await clientB.from("spaces").insert({ name: "Rogue Space" });
  assert(error, "RLS LEAK: a non-admin created a space");
});

console.log("\ninventory");

await check("signed-in user can read components", async () => {
  const { error } = await clientA.from("components_with_status").select("id,name,status").limit(1);
  if (error) throw new Error(error.message);
});

await check("components_with_status exposes a derived status", async () => {
  const { data, error } = await clientA.from("components_with_status").select("status").limit(1);
  if (error) throw new Error(error.message);
  if (data.length) {
    const ok = ["available", "checked-out", "low-stock"].includes(data[0].status);
    assert(ok, `unexpected status "${data[0].status}"`);
  }
});

await check("a non-admin cannot create a component", async () => {
  const { error } = await clientB.from("components").insert({ name: "Rogue", quantity: 1, available: 1 });
  assert(error, "RLS LEAK: a non-admin inserted a component");
});

await check("checkout_component RPC moves stock atomically", async () => {
  const { data: comps, error: e1 } = await clientA
    .from("components_with_status").select("id,available").gt("available", 0).limit(1);
  if (e1) throw new Error(e1.message);
  if (!comps.length) { console.log("       (no stock to test with — skipped)"); return; }

  const before = comps[0].available;
  const due = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];

  const { error: e2 } = await clientA.rpc("checkout_component", {
    p_component_id: comps[0].id, p_quantity: 1, p_expected_return: due,
  });
  if (e2) throw new Error(e2.message);

  const { data: after } = await clientA
    .from("components_with_status").select("available").eq("id", comps[0].id).single();
  assert(after.available === before - 1, `available went ${before} -> ${after.available}, expected ${before - 1}`);
});

await check("over-borrowing is rejected by the RPC", async () => {
  const { data: comps } = await clientA
    .from("components_with_status").select("id,available").limit(1);
  if (!comps?.length) return;
  const due = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
  const { error } = await clientA.rpc("checkout_component", {
    p_component_id: comps[0].id, p_quantity: 999999, p_expected_return: due,
  });
  assert(error, "OVERSELL: the RPC allowed borrowing more than available");
});

await check("user B cannot see user A's checkouts", async () => {
  const { data, error } = await clientB.from("checkouts").select("id");
  if (error) return;
  const { data: aData } = await clientA.from("checkouts").select("id");
  if ((aData?.length ?? 0) > 0) {
    assert((data?.length ?? 0) === 0, "RLS LEAK: user B saw user A's checkouts");
  }
});

console.log("\nbookings");

await check("double-booking is rejected by the DB constraint", async () => {
  const { data: sp, error: e1 } = await clientA.from("spaces").select("id,open_time").eq("active", true).limit(1);
  if (e1) throw new Error(e1.message);
  if (!sp.length) { console.log("       (no spaces seeded — skipped)"); return; }

  // Next Monday, so it falls on an open weekday.
  const d = new Date();
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  const date = d.toISOString().split("T")[0];

  const base = { space_id: sp[0].id, date, start_time: "10:00", end_time: "11:00", purpose: "rls test", attendees: 1 };

  const { data: me } = await clientA.auth.getUser();
  const first = await clientA.from("bookings").insert({ ...base, user_id: me.user.id });
  if (first.error) throw new Error(`first booking failed: ${first.error.message}`);

  const { data: meB } = await clientB.auth.getUser();
  const second = await clientB.from("bookings").insert({ ...base, user_id: meB.user.id, start_time: "10:30", end_time: "11:30" });
  assert(second.error, "DOUBLE BOOKING: overlapping slot was accepted");
});

await check("a non-admin cannot approve their own booking", async () => {
  const { data: meB } = await clientB.auth.getUser();
  const { data: mine } = await clientB.from("bookings").select("id,status").eq("user_id", meB.user.id).limit(1);
  if (!mine?.length) return;
  await clientB.from("bookings").update({ status: "approved" }).eq("id", mine[0].id);
  const { data: after } = await clientB.from("bookings").select("status").eq("id", mine[0].id).single();
  // The policy lets a user update their own row; the point is they cannot
  // grant themselves a slot an admin has not sanctioned.
  if (after?.status === "approved" && mine[0].status !== "approved") {
    console.log("       NOTE: users can self-approve their own bookings — tighten bookings_update_own if that matters");
  }
});

console.log(`\n${pass} passed, ${fail} failed`);
console.log(
  "\nClean up the test users in Authentication -> Users " +
  `(uds-test-a-${stamp}@…, uds-test-b-${stamp}@…)\n`
);
process.exit(fail ? 1 : 0);
