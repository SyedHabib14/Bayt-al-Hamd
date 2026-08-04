import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Languages } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { ziyaratDetailQuery, useRealtimeInvalidate, type PublicZiyarat } from "@/lib/public-data";

export const Route = createFileRoute("/ziyarat/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(ziyaratDetailQuery(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `${loaderData.title_en} — Bayt al-Ḥamd` }, { name: "description", content: `${loaderData.title_en}, presented in Arabic with English translation.` }]
      : [{ title: "Ziyārat — Bayt al-Ḥamd" }],
  }),
  component: ZiyaratDetail,
});

const Passage = memo(function Passage({ arabic, english, showTranslation }: { arabic: string; english?: string; showTranslation: boolean }) {
  return (
    <section className={`grid gap-5 border-b border-gold-soft/60 py-7 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] last:border-0 lg:gap-10 ${showTranslation ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
      <p lang="ar" dir="rtl" className="graph-text text-2xl leading-[2.35] text-ink sm:text-3xl">{arabic}</p>
      <div className={`grid transition-[grid-template-rows,opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showTranslation ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] opacity-0 -translate-y-2"}`}>
        <div className="overflow-hidden"><p className="mt-4 font-serif text-base leading-8 text-ink-soft sm:text-lg"><HonorificText text={english ?? ""} /></p></div>
      </div>
    </section>
  );
});

// Presentation-only treatment: the stored English translation is never changed.
const HONORIFICS = [
  "عَجَّلَ ٱللَّٰهُ فَرَجَهُ الشَّرِيفَ",
  "عَجَّلَ ٱللَّٰهُ فَرَجَهُمَا الشَّرِيفَ",
  "عَلَيْهِمُ ٱلسَّلَامُ",
  "عَلَيْهِمَا ٱلسَّلَامُ",
  "عَلَيْهَا ٱلسَّلَامُ",
  "عَلَيْهِ ٱلسَّلَامُ",
  "جَلَّ جَلَالُهُ",
  "قُدِّسَ سِرُّهُ",
  "قُدِّسَ سِرُّهَا",
  "قُدِّسَ سِرُّهُمَا",
] as const;
const honorificPattern = new RegExp(`(${HONORIFICS.join("|")})`, "g");

function HonorificText({ text }: { text: string }) {
  return <>{text.split(honorificPattern).map((part, index) =>
    HONORIFICS.includes(part as typeof HONORIFICS[number])
      ? <span key={`${part}-${index}`} className="honorific" lang="ar" dir="rtl">{part}</span>
      : part,
  )}</>;
}

function ZiyaratDetail() {
  useRealtimeInvalidate();
  const { id } = Route.useParams();
  const { data: entry } = useSuspenseQuery(ziyaratDetailQuery(id));
  const [showTranslation, setShowTranslation] = useState(true);
  const passages = useMemo(() => {
    if (!entry) return [];
    const arabic = entry.content_ar.split(/\n\s*\n/).filter(Boolean);
    const english = entry.content_en.split(/\n\s*\n/).filter(Boolean);
    return arabic.map((text, index) => ({ arabic: text, english: english[index] ?? "" }));
  }, [entry]);
  if (!entry) return null;
  return (
    <main className="ambient-glow-shell mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mb-7 flex items-center justify-between gap-4">
        <Link to="/ziyarat" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-gold"><ArrowLeft className="h-4 w-4" />Collection</Link>
        <button type="button" aria-pressed={showTranslation} onClick={() => setShowTranslation(value => !value)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-all duration-300 ${showTranslation ? "border-gold/60 bg-card/80 text-gold shadow-[0_0_28px_-14px_var(--gold)]" : "border-border bg-muted/50 text-ink-soft"}`}><Languages className="font-light h-4 w-4" />English {showTranslation ? "ON" : "OFF"}</button>
      </div>
      <header className="manuscript paper-grain relative overflow-hidden px-6 py-10 text-center sm:px-10 sm:py-14">
        <span className="font-light eyebrow">{entry.classification}</span>
        <h1 lang="ar" className="graph-text -mt-10 text-center text-4xl text-ink sm:text-6xl">{entry.title_ar}</h1>
        <div className="mx-auto my-6 w-40 gold-rule-shimmer" />
        <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showTranslation ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden"><h2 className="text-2xl text-ink-soft sm:text-3xl">{entry.title_en}</h2></div>
        </div>
      </header>
      <article className="manuscript paper-grain mt-6 px-6 sm:px-10 lg:px-12">
        {passages.map((passage, index) => <Passage key={`${index}-${passage.arabic.slice(0, 16)}`} {...passage} showTranslation={showTranslation} />)}
      </article>
    </main>
  );
}
