import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "./auth-admin.server";
import { getAdminClient } from "./supabase-admin.server";

const COVER_BUCKET = "book-covers";
const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const bookInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  author: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  cover_url: z.string().url().optional().nullable(),
  download_url: z.string().url(),
  archive_url: z.string().url().optional().nullable().or(z.literal("")),
  language: z.string().max(80).optional().nullable(),
  pages: z.number().int().positive().optional().nullable(),
  is_published: z.boolean().default(false),
  position: z.number().int().default(0),
});

export const listAllBooks = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Response(error.message, { status: 500 });
    return data;
  });

export const getBookById = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getAdminClient();
    const { data: row, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 500 });
    return row;
  });

export const saveBook = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((d: unknown) => bookInput.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    const auth = context.auth;
    const payload = {
      title: data.title,
      author: data.author || null,
      description: data.description || null,
      cover_url: data.cover_url || null,
      download_url: data.download_url,
      archive_url: data.archive_url || null,
      language: data.language || null,
      pages: data.pages ?? null,
      is_published: data.is_published,
      position: data.position,
      updated_by: auth.sub,
    };
    if (data.id) {
      const { data: row, error } = await supabase
        .from("books")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Response(error.message, { status: 400 });
      await supabase.from("audit_log").insert({
        user_id: auth.sub, user_cnic: auth.cnic, action: "update", entity_type: "book",
        entity_id: row.id, details: { title: row.title },
      });
      return row;
    }
    const { data: row, error } = await supabase
      .from("books")
      .insert({ ...payload, created_by: auth.sub })
      .select()
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: auth.sub, user_cnic: auth.cnic, action: "create", entity_type: "book",
      entity_id: row.id, details: { title: row.title },
    });
    return row;
  });

export const deleteBook = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    // Best-effort: remove the stored cover image if it lives in our bucket.
    const { data: row } = await supabase.from("books").select("cover_url").eq("id", data.id).maybeSingle();
    if (row?.cover_url) {
      const marker = `/object/public/${COVER_BUCKET}/`;
      const idx = row.cover_url.indexOf(marker);
      if (idx !== -1) {
        const path = row.cover_url.slice(idx + marker.length);
        await supabase.storage.from(COVER_BUCKET).remove([path]);
      }
    }
    const { error } = await supabase.from("books").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: context.auth.sub, user_cnic: context.auth.cnic,
      action: "delete", entity_type: "book", entity_id: data.id,
    });
    return { ok: true };
  });

/**
 * Accepts a cover image as FormData (multipart), validates it, and stores it
 * in the public `book-covers` bucket under a random path. Returns the public URL.
 */
export const uploadBookCover = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((d: unknown) => {
    if (!(d instanceof FormData)) throw new Response("Expected multipart form data.", { status: 400 });
    return d;
  })
  .handler(async ({ data }) => {
    const file = data.get("file");
    if (!(file instanceof File)) throw new Response("No file provided.", { status: 400 });
    if (!ALLOWED_COVER_TYPES.has(file.type)) {
      throw new Response("Cover must be a JPEG, PNG, WEBP or AVIF image.", { status: 400 });
    }
    if (file.size > MAX_COVER_BYTES) {
      throw new Response("Cover image must be smaller than 5MB.", { status: 400 });
    }
    const supabase = getAdminClient();
    const ext = file.type.split("/")[1] || "jpg";
    // Storage folders are represented by the object key. Keep every cover in
    // the named Book Covers folder so the bucket stays tidy and predictable.
    const path = `Book Covers/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error } = await supabase.storage.from(COVER_BUCKET).upload(path, bytes, {
      contentType: file.type,
      upsert: false,
      cacheControl: "31536000",
    });
    if (error) throw new Response(error.message, { status: 400 });
    const { data: pub } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
    return { url: pub.publicUrl, path };
  });
