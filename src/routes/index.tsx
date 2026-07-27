import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { majalisQuery, formatDate, useRealtimeInvalidate } from "@/lib/public-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dalīl — Every ḥadīth of the majlis, verified" },
      { name: "description", content: "Browse majalis and read the authentic Arabic, translation, references and grading for every ḥadīth quoted." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(majalisQuery),
  component: Home,
});

function Home() {
  useRealtimeInvalidate();
  const { data: majalis } = useSuspenseQuery(majalisQuery);
  const recent = majalis.slice(0, 4);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">A scholarly archive</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-ink sm:text-6xl">
          Every ḥadīth of the majlis, <em className="font-serif italic text-ink-soft">verified.</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-soft">
          Dalīl is a companion for readers, students and scholars. For each majlis we publish the original
          Arabic with full tashkeel, a reliable English translation, the primary references and short
          scholarly notes — so no ḥadīth passes unchecked.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link to="/majalis" className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-parchment hover:bg-ink-soft">
            Browse majalis
          </Link>
          <Link to="/about" className="text-sm text-ink-soft underline decoration-gold underline-offset-4 hover:text-ink">
            What is Dalīl?
          </Link>
        </div>
        <div className="gold-rule mt-14 max-w-md" />
        <p className="mt-6 font-arabic text-3xl leading-loose text-ink" dir="rtl">
          إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl text-ink">Recent majalis</h2>
          <Link to="/majalis" className="text-sm text-ink-soft hover:text-ink">View all →</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {recent.map((m) => (
            <Link key={m.id} to="/majlis/$id" params={{ id: m.id }}
              className="manuscript block p-8 transition hover:-translate-y-0.5 hover:shadow-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-gold">{formatDate(m.date)}</p>
              <h3 className="mt-3 font-display text-2xl text-ink">{m.title}</h3>
              {m.description && <p className="mt-3 text-sm text-ink-soft line-clamp-3">{m.description}</p>}
              <div className="gold-rule mt-6 w-16" />
            </Link>
          ))}
          {recent.length === 0 && (
            <p className="text-ink-soft">No majalis have been published yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
