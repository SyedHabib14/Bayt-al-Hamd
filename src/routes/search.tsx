import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/public-data";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — Bayt al-Ḥamd" }, { name: "description", content: "Search hadiths and majalis." }] }),
  component: SearchPage,
});

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function SearchPage() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isFetching } = useQuery({
    queryKey: ["search", debouncedQ],
    enabled: debouncedQ.trim().length >= 2,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const term = `%${debouncedQ.trim()}%`;
      const [h, m] = await Promise.all([
        supabase.from("hadiths")
          .select("id, translation_en, arabic_text, majlis_id, majalis!inner(title,date)")
          .or(`translation_en.ilike.${term},arabic_normalized.ilike.${term}`)
          .limit(30),
        supabase.from("majalis")
          .select("id, title, date, description")
          .or(`title.ilike.${term},description.ilike.${term}`)
          .limit(20),
      ]);
      return { hadiths: h.data ?? [], majalis: m.data ?? [] };
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl text-ink sm:text-4xl">Search the archive</h1>
      <div className="gold-rule mt-4 w-24" />
      <div className="relative mt-6 sm:mt-8">
        <input
          ref={inputRef}
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search hadiths, majalis, keywords…"
          className="w-full rounded-full border border-border bg-card px-5 py-3.5 pr-11 thin-text text-ink shadow-sm transition-all duration-200 focus:border-gold focus:shadow-[0_0_0_4px_var(--gold-soft)] focus:outline-none sm:text-lg"
          autoFocus
        />
        {isFetching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        )}
      </div>
      {debouncedQ.trim().length < 2 && debouncedQ.trim().length > 0 && (
        <p className="mt-4 -text text-lg text-ink-soft">Enter at least 2 characters.</p>
      )}
      {debouncedQ.trim().length < 2 && debouncedQ.trim().length === 0 && (
        <p className="mt-6 thin-text text-lg text-ink-soft">Enter at least 2 characters to search.</p>
      )}
      {data && (
        <div className="mt-8 space-y-8 sm:mt-10 sm:space-y-10">
          {data.majalis.length > 0 && (
            <section>
              <h2 className="font-display text-lg text-ink sm:text-xl">Majalis</h2>
              <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card shadow-sm">
                {data.majalis.map((m) => (
                  <li key={m.id} className="px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-secondary/40 sm:px-6">
                    <Link to="/majlis/$id" params={{ id: m.id }} className="block hover:text-gold">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-gold sm:text-xs">{formatDate(m.date)}</span>
                      <span className="ml-0 mt-0.5 block font-display text-base text-ink sm:ml-3 sm:inline sm:text-lg">{m.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.hadiths.length > 0 && (
            <section>
              <h2 className="font-display text-lg text-ink sm:text-xl">Ḥadīths</h2>
              <ul className="mt-3 space-y-3 sm:space-y-4">
                {data.hadiths.map((h) => (
                  <li key={h.id} className="manuscript p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:p-6">
                    <p className="arabic-text text-xl sm:text-2xl" dir="rtl">{h.arabic_text}</p>
                    <p className="mt-3 font-serif text-sm text-ink sm:text-base">{h.translation_en}</p>
                    <Link to="/hadith/$id" params={{ id: h.id }} className="mt-2 inline-block text-[10px] uppercase tracking-[0.25em] text-gold sm:mt-3 sm:text-xs">
                      Open →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.majalis.length === 0 && data.hadiths.length === 0 && (
            <div className="manuscript flex flex-col items-center py-12 text-center sm:py-16">
              <p className="text-ink-soft">No results found for "{debouncedQ}"</p>
              <p className="mt-2 text-sm text-ink-soft/60">Try different keywords or check your spelling.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
