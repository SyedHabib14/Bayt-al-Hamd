import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { signJwt, verifyJwt } from "./jwt.server";
import { getAdminClient } from "./supabase-admin.server";
import { createClient } from "@supabase/supabase-js";

const CNIC_RE = /^\d{13}$/;

const cnicSchema = z.object({
  cnic: z.string().transform((s) => s.replace(/[-\s]/g, "")).refine((s) => CNIC_RE.test(s), {
    message: "CNIC must be 13 digits",
  }),
});

function getCnicLookupClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase server env not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function lookupCnic(cnic: string, ip: string) {
  try {
    const admin = getAdminClient();
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count, error: attemptsError } = await admin
      .from("cnic_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("attempted_at", since);
    if (!attemptsError && (count ?? 0) >= 10) throw new Response("Too many attempts. Please wait a few minutes.", { status: 429 });

    const { data, error } = await admin.from("users").select("id, cnic, full_name, role, is_active").eq("cnic", cnic).maybeSingle();
    if (!error) return { user: data, admin };
    console.error("[auth] service-key users lookup failed; trying RPC fallback", error);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("[auth] service-key unavailable; trying RPC fallback", error);
  }

  const lookup = getCnicLookupClient();
  const result = await lookup.rpc("authenticate_cnic", { input_cnic: cnic } as never) as {
    data: { id: string; cnic: string; full_name: string; role: string; is_active: boolean }[] | null;
    error: { message: string } | null;
  };
  if (result.error) throw new Error("Authentication service is not configured correctly.");
  // PostgREST returns RETURNS TABLE RPC results as an array, even with LIMIT 1.
  return { user: result.data?.[0] ?? null, admin: null };
}

export const cnicLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => cnicSchema.parse(d))
  .handler(async ({ data }) => {
    // CNIC verification uses a SECURITY DEFINER RPC, so it remains available
    // even when a stale service-role key is present in the deployment.
    const ip =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const { user, admin } = await lookupCnic(data.cnic, ip);
    const supabase = admin ?? getCnicLookupClient();

    const success = !!(user && user.is_active);
    if (admin) await admin.from("cnic_login_attempts").insert({ cnic: data.cnic, ip, success });

    if (!success || !user) {
      // Uniform error — never confirm existence
      throw new Response("Not authorized.", { status: 401 });
    }

    const token = await signJwt({
      sub: user.id,
      cnic: user.cnic,
      role: user.role as "admin" | "scholar" | "editor",
      name: user.full_name,
    });

    const { error: auditError } = await supabase.from("audit_log").insert({
      user_id: user.id,
      user_cnic: user.cnic,
      action: "login",
      entity_type: "auth",
      details: { ip },
      ip,
    });
    // Audit logging must not turn a valid login into a failed login.
    if (auditError) console.error("[auth] audit log insert failed", auditError);

    return {
      token,
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role as "admin" | "scholar" | "editor",
        cnic: user.cnic,
      },
    };
  });

export const getMe = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const payload = await verifyJwt(data.token);
    if (!payload) return null;
    return { id: payload.sub, name: payload.name, role: payload.role, cnic: payload.cnic, exp: payload.exp };
  });
