import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { majlisDetailQuery, formatDate, useRealtimeInvalidate } from "@/lib/public-data";
import { GradeBadge, ReferenceList } from "@/components/app/hadith-display";

export const Route = createFileRoute("/majlis/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(majlisDetailQuery(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.majlis.title} — Bayt al-Ḥamd` },
          { name: "description", content: loaderData.majlis.description ?? `Majlis on ${formatDate(loaderData.majlis.date)}` },
        ]
      : [{ title: "Majlis — Bayt al-Ḥamd" }],
  }),
  component: MajlisView,
});

function MajlisView() {
  useRealtimeInvalidate();
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(majlisDetailQuery(id));
  if (!data) return null;
  const { majlis, hadiths, refs } = data;
  const refsByHadith = new Map<string, typeof refs>();
  refs.forEach((r) => {
    const arr = refsByHadith.get(r.hadith_id) ?? [];
    arr.push(r); refsByHadith.set(r.hadith_id, arr);
  });

  return (
    <article className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <Link to="/majalis" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-ink-soft transition-colors hover:text-ink">
        ← All majalis
      </Link>
      <header className="mt-6">
        <p className="eyebrow">{formatDate(majlis.date)}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">{majlis.title}</h1>
        {majlis.description && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{majlis.description}</p>}
        <div className="gold-rule mt-8" />
      </header>

      <div className="mt-12 space-y-8 sm:space-y-10">
        {hadiths.map((h, i) => (
          <section key={h.id} className="manuscript p-6 transition-shadow duration-300 sm:p-10 lg:p-12">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Ḥadīth {i + 1}</span>
              {h.grade && <GradeBadge grade={h.grade} />}
            </div>
            <p className="arabic-text mt-6" dir="rtl">{h.arabic_text}</p>
            <div className="gold-rule my-6" />
            <p className="font-serif text-xl leading-relaxed text-ink">{h.translation_en}</p>
            {h.notes && (
              <p className="mt-5 border-l-2 border-gold/70 pl-4 text-sm italic leading-relaxed text-ink-soft">{h.notes}</p>
            )}
            {(refsByHadith.get(h.id)?.length ?? 0) > 0 && (
              <ReferenceList refs={refsByHadith.get(h.id)!} />
            )}
            <div className="mt-6">
              <Link
                to="/hadith/$id"
                params={{ id: h.id }}
                className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.25em] text-gold transition-all hover:gap-1.5 hover:underline"
              >
                Permalink →
              </Link>
            </div>
          </section>
        ))}
        {hadiths.length === 0 && (
          <p className="manuscript py-12 text-center text-ink-soft">No hadiths have been published for this majlis yet.</p>
        )}
      </div>
    </article>
  );
}
