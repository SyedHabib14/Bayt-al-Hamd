import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { majlisDetailQuery, formatDate, useRealtimeInvalidate } from "@/lib/public-data";

export const Route = createFileRoute("/majlis/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(majlisDetailQuery(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.majlis.title} — Dalīl` },
          { name: "description", content: loaderData.majlis.description ?? `Majlis on ${formatDate(loaderData.majlis.date)}` },
        ]
      : [{ title: "Majlis — Dalīl" }],
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
    <article className="mx-auto max-w-4xl px-6 py-16">
      <Link to="/majalis" className="text-xs uppercase tracking-[0.25em] text-ink-soft hover:text-ink">← All majalis</Link>
      <header className="mt-6">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">{formatDate(majlis.date)}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">{majlis.title}</h1>
        {majlis.description && <p className="mt-4 max-w-2xl text-lg text-ink-soft">{majlis.description}</p>}
        <div className="gold-rule mt-8" />
      </header>

      <div className="mt-12 space-y-10">
        {hadiths.map((h, i) => (
          <section key={h.id} className="manuscript p-8 sm:p-12">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.3em] text-gold">Ḥadīth {i + 1}</span>
              {h.grade && <span className="text-xs font-medium text-ink-soft">{h.grade}</span>}
            </div>
            <p className="arabic-text mt-6" dir="rtl">{h.arabic_text}</p>
            <div className="gold-rule my-6" />
            <p className="font-serif text-xl leading-relaxed text-ink">{h.translation_en}</p>
            {h.notes && (
              <p className="mt-5 border-l-2 border-gold pl-4 text-sm italic text-ink-soft">{h.notes}</p>
            )}
            {(refsByHadith.get(h.id)?.length ?? 0) > 0 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.25em] text-ink-soft">References</p>
                <ul className="mt-2 space-y-1 text-sm text-ink">
                  {refsByHadith.get(h.id)!.map((r) => (
                    <li key={r.id}>
                      <span className="font-serif italic">{r.book_name}</span>
                      {r.volume && <>, vol. {r.volume}</>}
                      {r.page && <>, p. {r.page}</>}
                      {r.hadith_number && <> · #{r.hadith_number}</>}
                      {r.reliability_note && <span className="text-ink-soft"> — {r.reliability_note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6">
              <Link to="/hadith/$id" params={{ id: h.id }} className="text-xs uppercase tracking-[0.25em] text-gold hover:underline">
                Permalink →
              </Link>
            </div>
          </section>
        ))}
        {hadiths.length === 0 && (
          <p className="text-ink-soft">No hadiths have been published for this majlis yet.</p>
        )}
      </div>
    </article>
  );
}
