import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { hadithDetailQuery, formatDate, useRealtimeInvalidate } from "@/lib/public-data";

export const Route = createFileRoute("/hadith/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(hadithDetailQuery(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `Ḥadīth — ${loaderData.majlis?.title ?? "Dalīl"}` }]
      : [{ title: "Ḥadīth — Dalīl" }],
  }),
  component: HadithView,
});

function HadithView() {
  useRealtimeInvalidate();
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(hadithDetailQuery(id));
  if (!data) return null;
  const { hadith, majlis, refs } = data;
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {majlis && (
        <Link to="/majlis/$id" params={{ id: majlis.id }} className="text-xs uppercase tracking-[0.25em] text-ink-soft hover:text-ink">
          ← {majlis.title} · {formatDate(majlis.date)}
        </Link>
      )}
      <section className="manuscript mt-6 p-10 sm:p-14">
        {hadith.grade && <p className="text-xs uppercase tracking-[0.3em] text-gold">{hadith.grade}</p>}
        <p className="arabic-text mt-6" dir="rtl">{hadith.arabic_text}</p>
        <div className="gold-rule my-8" />
        <p className="font-serif text-2xl leading-relaxed text-ink">{hadith.translation_en}</p>
        {hadith.notes && (
          <p className="mt-6 border-l-2 border-gold pl-4 text-sm italic text-ink-soft">{hadith.notes}</p>
        )}
        {refs.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.25em] text-ink-soft">References</p>
            <ul className="mt-2 space-y-1 text-sm text-ink">
              {refs.map((r) => (
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
      </section>
    </article>
  );
}
