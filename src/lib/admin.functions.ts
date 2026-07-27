import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "./auth-admin.server";
import { getAdminClient } from "./supabase-admin.server";
import { authHeaders } from "./auth-store";

// ---------- Majalis ----------
const majlisInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  date: z.string().min(4),
  description: z.string().max(2000).optional().nullable(),
  is_published: z.boolean().default(false),
});

/**
 * Helper to build the auth header into server function data.
 * TanStack Start sends these as part of the request context on the client side.
 * The server middleware reads them from the HTTP request headers.
 */
function withAuth<T>(data: T): T & { _auth?: Record<string, string> } {
  // This is a no-op on the server — the middleware reads headers directly.
  // On the client, TanStack Start handles header forwarding automatically.
  return data as T & { _auth?: Record<string, string> };
}

export const saveMajlis = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: unknown) => majlisInput.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    const auth = context.auth;
    if (data.id) {
      const { data: row, error } = await supabase
        .from("majalis")
        .update({
          title: data.title,
          date: data.date,
          description: data.description ?? null,
          is_published: data.is_published,
          updated_by: auth.sub,
        })
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Response(error.message, { status: 400 });
      await supabase.from("audit_log").insert({
        user_id: auth.sub, user_cnic: auth.cnic, action: "update", entity_type: "majlis",
        entity_id: row.id, details: { title: row.title },
      });
      return row;
    }
    const { data: row, error } = await supabase
      .from("majalis")
      .insert({
        title: data.title, date: data.date, description: data.description ?? null,
        is_published: data.is_published, created_by: auth.sub, updated_by: auth.sub,
      })
      .select()
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: auth.sub, user_cnic: auth.cnic, action: "create", entity_type: "majlis",
      entity_id: row.id, details: { title: row.title },
    });
    return row;
  });

export const deleteMajlis = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    const { error } = await supabase.from("majalis").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: context.auth.sub, user_cnic: context.auth.cnic,
      action: "delete", entity_type: "majlis", entity_id: data.id,
    });
    return { ok: true };
  });

export const listAllMajalis = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("majalis").select("*").order("date", { ascending: false });
    if (error) throw new Response(error.message, { status: 500 });
    return data;
  });

// ---------- Hadiths ----------
const hadithInput = z.object({
  id: z.string().uuid().optional(),
  majlis_id: z.string().uuid(),
  arabic_text: z.string().min(3),
  translation_en: z.string().min(3),
  grade: z.string().max(120).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  is_published: z.boolean().default(false),
  position: z.number().int().default(0),
});

function normalizeArabic(s: string): string {
  return s.normalize("NFC").replace(/[\u064B-\u0652\u0670\u0640]/g, "").replace(/\s+/g, " ").trim();
}

export const saveHadith = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: unknown) => hadithInput.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    const auth = context.auth;
    const payload = {
      majlis_id: data.majlis_id,
      arabic_text: data.arabic_text,
      arabic_normalized: normalizeArabic(data.arabic_text),
      translation_en: data.translation_en,
      grade: data.grade ?? null,
      notes: data.notes ?? null,
      is_published: data.is_published,
      position: data.position,
      updated_by: auth.sub,
    };
    if (data.id) {
      const { data: row, error } = await supabase.from("hadiths").update(payload).eq("id", data.id).select().single();
      if (error) throw new Response(error.message, { status: 400 });
      await supabase.from("audit_log").insert({
        user_id: auth.sub, user_cnic: auth.cnic, action: "update", entity_type: "hadith", entity_id: row.id,
      });
      return row;
    }
    const { data: row, error } = await supabase
      .from("hadiths")
      .insert({ ...payload, created_by: auth.sub })
      .select()
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: auth.sub, user_cnic: auth.cnic, action: "create", entity_type: "hadith", entity_id: row.id,
    });
    return row;
  });

export const deleteHadith = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    const { error } = await supabase.from("hadiths").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: context.auth.sub, user_cnic: context.auth.cnic,
      action: "delete", entity_type: "hadith", entity_id: data.id,
    });
    return { ok: true };
  });

// ---------- Hadiths (by majlis) ----------
export const listHadithsByMajlisId = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: { majlis_id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getAdminClient();
    const { data: rows, error } = await supabase
      .from("hadiths")
      .select("*")
      .eq("majlis_id", data.majlis_id)
      .order("position")
      .order("created_at");
    if (error) throw new Response(error.message, { status: 500 });
    return rows ?? [];
  });

export const getMajlisById = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getAdminClient();
    const { data: row, error } = await supabase
      .from("majalis")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 500 });
    return row;
  });

// ---------- Users ----------
const userInput = z.object({
  id: z.string().uuid().optional(),
  cnic: z.string().regex(/^\d{13}$/),
  full_name: z.string().min(2).max(120),
  role: z.enum(["admin", "scholar", "editor"]),
  is_active: z.boolean().default(true),
});

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .handler(async ({ context }) => {
    if (context.auth.role !== "admin") throw new Response("Forbidden", { status: 403 });
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    if (error) throw new Response(error.message, { status: 500 });
    return data;
  });

export const saveUser = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: unknown) => userInput.parse(d))
  .handler(async ({ data, context }) => {
    if (context.auth.role !== "admin") throw new Response("Forbidden", { status: 403 });
    const supabase = getAdminClient();
    if (data.id) {
      const { data: row, error } = await supabase.from("users").update({
        cnic: data.cnic, full_name: data.full_name, role: data.role, is_active: data.is_active,
      }).eq("id", data.id).select().single();
      if (error) throw new Response(error.message, { status: 400 });
      await supabase.from("audit_log").insert({
        user_id: context.auth.sub, user_cnic: context.auth.cnic,
        action: "update", entity_type: "user", entity_id: row.id,
      });
      return row;
    }
    const { data: row, error } = await supabase.from("users").insert({
      cnic: data.cnic, full_name: data.full_name, role: data.role, is_active: data.is_active,
    }).select().single();
    if (error) throw new Response(error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: context.auth.sub, user_cnic: context.auth.cnic,
      action: "create", entity_type: "user", entity_id: row.id,
    });
    return row;
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    if (context.auth.role !== "admin") throw new Response("Forbidden", { status: 403 });
    if (data.id === context.auth.sub) throw new Response("Cannot remove yourself.", { status: 400 });
    const supabase = getAdminClient();
    const { error } = await supabase.from("users").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: context.auth.sub, user_cnic: context.auth.cnic,
      action: "delete", entity_type: "user", entity_id: data.id,
    });
    return { ok: true };
  });

export const listAudit = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Response(error.message, { status: 500 });
    return data;
  });
