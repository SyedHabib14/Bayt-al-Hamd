import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { signJwt, verifyJwt } from "./jwt.server";
import { getAdminClient } from "./supabase-admin.server";

const CNIC_RE = /^\d{13}$/;

const cnicSchema = z.object({
  cnic: z.string().transform((s) => s.replace(/[-\s]/g, "")).refine((s) => CNIC_RE.test(s), {
    message: "CNIC must be 13 digits",
  }),
});

export const cnicLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => cnicSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = getAdminClient();
    const ip =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    // Rate limit: max 10 attempts / 15 min per IP
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count, error: attemptsError } = await supabase
      .from("cnic_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("attempted_at", since);
    if (attemptsError) throw new Error("Authentication service is not configured correctly.");
    if ((count ?? 0) >= 10) {
      throw new Response("Too many attempts. Please wait a few minutes.", { status: 429 });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, cnic, full_name, role, is_active")
      .eq("cnic", data.cnic)
      .maybeSingle();
    if (userError) throw new Error("Authentication service is not configured correctly.");

    const success = !!(user && user.is_active);
    await supabase.from("cnic_login_attempts").insert({ cnic: data.cnic, ip, success });

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
      user: { id: user.id, name: user.full_name, role: user.role, cnic: user.cnic },
    };
  });

export const getMe = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const payload = await verifyJwt(data.token);
    if (!payload) return null;
    return { id: payload.sub, name: payload.name, role: payload.role, cnic: payload.cnic, exp: payload.exp };
  });
