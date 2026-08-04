// Small helpers + shared queries against the public (RLS-filtered) Supabase client.
import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export type ZiyaratClassification = "ziyarat" | "munajat";
export type PublicZiyarat = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  classification: ZiyaratClassification;
  content_ar: string;
  content_en: string;
};

export const ziyaratQuery = queryOptions({
  queryKey: ["public", "ziyarat"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("ziyarat")
      .select("id, slug, title_ar, title_en, classification, content_en")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PublicZiyarat[];
  },
});

export const ziyaratDetailQuery = (id: string) =>
  queryOptions({
    queryKey: ["public", "ziyarat", id],
    queryFn: async () => {
      const key = /^[0-9a-f-]{36}$/i.test(id) ? { id } : { slug: id };
      const { data, error } = await supabase
        .from("ziyarat")
        .select("id, slug, title_ar, title_en, classification, content_ar, content_en")
        .eq("is_published", true)
        .match(key)
        .maybeSingle();
      if (error) throw error;
      return (data as PublicZiyarat | null) ?? null;
    },
  });

export const majalisQuery = queryOptions({
  queryKey: ["public", "majalis"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("majalis")
      .select("id, title, date, description")
      .order("date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const referenceBooksQuery = queryOptions({
  queryKey: ["public", "reference-books"],
  queryFn: async () => {
    const { data, error } = await supabase.from("reference_books").select("id, name, volume_count, description").order("position");
    if (error) throw error;
    return data ?? [];
  },
});

export const majlisDetailQuery = (id: string) =>
  queryOptions({
    queryKey: ["public", "majlis", id],
    queryFn: async () => {
      // The majlis row and its hadiths only depend on `id`, so fetch both
      // concurrently rather than waterfalling — cuts one round trip off
      // the critical path before we can even start fetching references.
      const [{ data, error }, { data: hadiths }] = await Promise.all([
        supabase.from("majalis").select("id, title, date, description").eq("id", id).maybeSingle(),
        supabase
          .from("hadiths")
          .select("id, arabic_text, translation_en, grade, notes, position")
          .eq("majlis_id", id)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);
      if (error) throw error;
      if (!data) return null;
      const ids = (hadiths ?? []).map((h) => h.id);
      const refs = ids.length
        ? (await supabase.from("hadith_references").select("*").in("hadith_id", ids)).data ?? []
        : [];
      return { majlis: data, hadiths: hadiths ?? [], refs };
    },
  });

export const booksQuery = queryOptions({
  queryKey: ["public", "books"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("books")
      .select("id, title, author, description, cover_url, download_url, archive_url, language, pages")
      .eq("is_published", true)
      .order("position", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const bookDetailQuery = (id: string) =>
  queryOptions({
    queryKey: ["public", "book", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, description, cover_url, download_url, archive_url, language, pages")
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const hadithDetailQuery = (id: string) =>
  queryOptions({
    queryKey: ["public", "hadith", id],
    queryFn: async () => {
      const { data: hadith, error } = await supabase
        .from("hadiths")
        .select("id, majlis_id, arabic_text, translation_en, grade, notes")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!hadith) return null;
      const [{ data: majlis }, { data: refs }] = await Promise.all([
        supabase.from("majalis").select("id, title, date").eq("id", hadith.majlis_id).maybeSingle(),
        supabase.from("hadith_references").select("*").eq("hadith_id", hadith.id),
      ]);
      return { hadith, majlis, refs: refs ?? [] };
    },
  });

export function useRealtimeInvalidate() {
  const qc = useQueryClient();
  useEffect(() => {
    let mounted = true;
    // Use a unique channel per hook instance. React can remount effects while
    // Supabase is still tearing down the previous channel; reusing the same
    // channel name can make a later `.on()` run after `.subscribe()`.
    const channelName = `public-changes-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}`;
    const ch = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "majalis" }, (payload) => {
        if (!mounted) return;
        console.debug("[realtime] majalis change:", payload.eventType, payload.new);
        qc.invalidateQueries({ queryKey: ["public", "majalis"] });
        qc.invalidateQueries({ queryKey: ["public", "majlis"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "hadiths" }, (payload) => {
        if (!mounted) return;
        console.debug("[realtime] hadiths change:", payload.eventType, payload.new);
        qc.invalidateQueries({ queryKey: ["public", "majlis"] });
        qc.invalidateQueries({ queryKey: ["public", "hadith"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "hadith_references" }, (payload) => {
        if (!mounted) return;
        console.debug("[realtime] hadith_references change:", payload.eventType, payload.new);
        qc.invalidateQueries({ queryKey: ["public", "majlis"] });
        qc.invalidateQueries({ queryKey: ["public", "hadith"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "books" }, (payload) => {
        if (!mounted) return;
        console.debug("[realtime] books change:", payload.eventType, payload.new);
        qc.invalidateQueries({ queryKey: ["public", "books"] });
        qc.invalidateQueries({ queryKey: ["public", "book"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ziyarat" }, (payload) => {
        if (!mounted) return;
        console.debug("[realtime] ziyarat change:", payload.eventType, payload.new);
        qc.invalidateQueries({ queryKey: ["public", "ziyarat"] });
      })
      .subscribe((status) => {
        console.debug("[realtime] subscription status:", status);
      });
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [qc]);
}

export function formatDate(iso: string): string {
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}
