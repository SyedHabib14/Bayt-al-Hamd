import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "./auth-admin.server";
import { getAdminClient } from "./supabase-admin.server";

const ARTICLE_COVERS_BUCKET = "article-covers";

const articleInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(240),
  topic: z.string().trim().min(1).max(120),
  article_link: z.string().url().max(2000),
  cover_image_url: z.string().url().max(2000).nullable(),
  cover_image_path: z.string().max(500).nullable(),
  short_description: z.string().trim().max(240).nullable(),
  publish_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_published: z.boolean(),
});

export const listAllArticles = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("publish_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Response(error.message, { status: 500 });
    return data;
  });

export const saveArticle = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((data: unknown) => articleInput.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    const payload = {
      title: data.title,
      topic: data.topic,
      article_link: data.article_link,
      cover_image_url: data.cover_image_url,
      cover_image_path: data.cover_image_path,
      short_description: data.short_description,
      publish_date: data.publish_date,
      is_published: data.is_published,
    };

    const result = data.id
      ? await supabase.from("articles").update(payload).eq("id", data.id).select().single()
      : await supabase.from("articles").insert(payload).select().single();

    if (result.error) throw new Response(result.error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: context.auth.sub,
      user_cnic: context.auth.cnic,
      action: data.id ? "update" : "create",
      entity_type: "article",
      entity_id: result.data.id,
      details: { title: result.data.title, is_published: result.data.is_published },
    });
    return result.data;
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((data: { id: string; cover_image_path?: string | null }) => data)
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    if (data.cover_image_path) {
      await supabase.storage.from(ARTICLE_COVERS_BUCKET).remove([data.cover_image_path]);
    }
    const { error } = await supabase.from("articles").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    await supabase.from("audit_log").insert({
      user_id: context.auth.sub,
      user_cnic: context.auth.cnic,
      action: "delete",
      entity_type: "article",
      entity_id: data.id,
    });
    return { ok: true };
  });

const coverInput = z.object({
  base64: z.string().min(1).max(7_000_000),
  content_type: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
});

export const uploadArticleCover = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((data: unknown) => coverInput.parse(data))
  .handler(async ({ data }) => {
    const encoded = data.base64.includes(",") ? data.base64.split(",").pop() ?? "" : data.base64;
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    if (bytes.byteLength > 5 * 1024 * 1024) {
      throw new Response("Cover image must be 5 MB or smaller.", { status: 413 });
    }

    const extension = data.content_type.split("/")[1].replace("jpeg", "jpg");
    const path = ["covers", crypto.randomUUID() + "." + extension].join("/");
    const supabase = getAdminClient();
    const { error } = await supabase.storage.from(ARTICLE_COVERS_BUCKET).upload(
      path,
      new Blob([bytes], { type: data.content_type }),
      { cacheControl: "31536000", upsert: false, contentType: data.content_type },
    );
    if (error) throw new Response(error.message, { status: 400 });

    const { data: publicUrl } = supabase.storage.from(ARTICLE_COVERS_BUCKET).getPublicUrl(path);
    return { path, publicUrl: publicUrl.publicUrl };
  });

export const removeArticleCover = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((data: { path: string }) => data)
  .handler(async ({ data }) => {
    const { error } = await getAdminClient().storage.from(ARTICLE_COVERS_BUCKET).remove([data.path]);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });
