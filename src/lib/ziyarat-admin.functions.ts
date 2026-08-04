import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "./auth-admin.server";
import { getAdminClient } from "./supabase-admin.server";

const ziyaratInput = z.object({
  id: z.string().uuid().optional(),
  title_ar: z.string().trim().min(1).max(1000),
  title_en: z.string().trim().min(1).max(500),
  content_ar: z.string().trim().min(1),
  content_en: z.string().trim().min(1),
  classification: z.enum(["ziyarat", "munajat"]),
  slug: z.string().trim().min(1).max(300),
  is_published: z.boolean().default(false),
});

export type ZiyaratRow = {
  id: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  classification: "ziyarat" | "munajat";
  slug: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export const listAllZiyarat = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("ziyarat")
      .select("id,title_ar,title_en,content_ar,content_en,classification,slug,is_published,created_at,updated_at,created_by,updated_by")
      .order("updated_at", { ascending: false });
    if (error) throw new Response(error.message, { status: 500 });
    return data as ZiyaratRow[];
  });

export const getZiyaratById = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getAdminClient();
    const { data: row, error } = await supabase
      .from("ziyarat")
      .select("id,title_ar,title_en,content_ar,content_en,classification,slug,is_published,created_at,updated_at,created_by,updated_by")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 500 });
    return (row as ZiyaratRow) ?? null;
  });

export const saveZiyarat = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((data: unknown) => ziyaratInput.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    const auth = context.auth;
    const payload = {
      title_ar: data.title_ar,
      title_en: data.title_en,
      content_ar: data.content_ar,
      content_en: data.content_en,
      classification: data.classification,
      slug: data.slug,
      is_published: data.is_published,
      updated_by: auth.sub,
    };

    let result;
    if (data.id) {
      result = await supabase
        .from("ziyarat")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("ziyarat")
        .insert({ ...payload, created_by: auth.sub })
        .select()
        .single();
    }

    if (result.error) throw new Response(result.error.message, { status: 400 });
    const row = result.data as ZiyaratRow;

    await supabase.from("audit_log").insert({
      user_id: auth.sub,
      user_cnic: auth.cnic,
      action: data.id ? "update" : "create",
      entity_type: "ziyarat",
      entity_id: row.id,
      details: {
        title: row.title_en,
        classification: row.classification,
        is_published: row.is_published,
      },
    });

    return row;
  });

export const setZiyaratPublished = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: { id: string; value: boolean }) => d)
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    const { data: row, error } = await supabase
      .from("ziyarat")
      .update({ is_published: data.value, updated_by: context.auth.sub })
      .eq("id", data.id)
      .select("id,title_en,classification,is_published")
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: context.auth.sub,
      user_cnic: context.auth.cnic,
      action: data.value ? "publish" : "unpublish",
      entity_type: "ziyarat",
      entity_id: row.id,
      details: { title: row.title_en, classification: row.classification },
    });
    return row;
  });

export const deleteZiyarat = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    const { error } = await supabase.from("ziyarat").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: context.auth.sub,
      user_cnic: context.auth.cnic,
      action: "delete",
      entity_type: "ziyarat",
      entity_id: data.id,
    });
    return { ok: true };
  });

