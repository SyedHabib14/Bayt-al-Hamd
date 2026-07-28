import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { hadithDetailQuery, formatDate, useRealtimeInvalidate } from "@/lib/public-data";
import { GradeBadge, ReferenceList } from "@/components/app/hadith-display";

export const Route = createFileRoute("/hadith/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(hadithDetailQuery(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `Ḥadīth — ${loaderData.majlis?.title ?? "Bayt al-Ḥamd"}` }]
      : [{ title: "Ḥadīth — Bayt al-Ḥamd" }],
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
    <article className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      {majlis && (
        <Link
          to="/majlis/$id"
          params={{ id: majlis.id }}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-ink-soft transition-colors hover:text-ink"
        >
          ← {majlis.title} · {formatDate(majlis.date)}
        </Link>
      )}
      <section className="manuscript mt-6 p-6 sm:p-10 lg:p-14">
        {hadith.grade && <GradeBadge grade={hadith.grade} />}
        <p className="arabic-text mt-6" dir="rtl">{hadith.arabic_text}</p>
        <div className="gold-rule my-8" />
        <p className="font-serif text-2xl leading-relaxed text-ink">{hadith.translation_en}</p>
        {hadith.notes && (
          <p className="mt-6 border-l-2 border-gold/70 pl-4 text-sm italic leading-relaxed text-ink-soft">{hadith.notes}</p>
        )}
        <ReferenceList refs={refs} />
      </section>
    </article>
  );
}
