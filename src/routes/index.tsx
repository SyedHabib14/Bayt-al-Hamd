import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { majalisQuery, booksQuery, formatDate, useRealtimeInvalidate } from "@/lib/public-data";
import { BookCover } from "@/components/app/book-cover";
import 'bootstrap/dist/css/bootstrap-utilities.min.css'
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bayt al-Ḥamd — Verify Ḥadīth" },
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
  // Secondary content — not blocking the initial paint/loader, since the
  // homepage's critical path is the majalis list above the fold.
  const { data: books } = useQuery({ ...booksQuery, select: (b) => b.slice(0, 5) });

  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
        <p className="eyebrow">&nbsp;A scholarly archive</p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.05] text-ink sm:text-6xl">
          Every ḥadīth of majlis,<span className="font-serif font-semibold text-gold">verified.</span>
        </h1>
        <p className="thin-text mt-6 max-w-3xl leading-relaxed text-ink-soft">
          Bayt al-Ḥamd is a companion for readers, students and scholars. For each majlis we publish the original
          Arabic with full tashkeel, a reliable English translation, the primary references and short
          scholarly notes — so no ḥadīth passes unchecked.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            to="/majalis"
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-2sm font-medium text-parchment shadow-md transition-all duration-300 ease-out hover:bg-gold hover:text-accent-foreground hover:shadow-[0_10px_32px_-10px_var(--gold)] active:scale-[0.98]"
          >
            Browse Majālis
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
          <Link to="/about" className="text-sm text-ink-soft underline decoration-gold/60 underline-offset-4 transition-colors hover:text-ink hover:decoration-gold">
            What is Bayt al-Ḥamd?
          </Link>
        </div>
        <div className="gold-rule-shimmer mt-14 max-w-md" />
        <p style={{ dir: "rtl" }} className="mt-6 graph-text text-ink text-center text-[35px] md:text-[55px]">
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-3xl text-ink">Recent Majālis</h2>
          <Link to="/majalis" className="text-sm text-ink-soft transition-colors hover:text-gold">View all →</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {recent.map((m) => (
            <Link key={m.id} to="/majlis/$id" params={{ id: m.id }}
              className="manuscript manuscript-interactive block p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl">
              <p className="eyebrow">{formatDate(m.date)}</p>
              <h3 className="mt-3 font-display text-2xl text-ink">{m.title}</h3>
              {m.description && <p className="mt-3 thin-text text-lg leading-relaxed text-ink-soft line-clamp-3">{m.description}</p>}
              <div className="gold-rule mt-6 w-16" />
            </Link>
          ))}
          {recent.length === 0 && (
            <p className="text-ink-soft">No majalis have been published yet.</p>
          )}
        </div>
      </section>

      {books && books.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="eyebrow">From the library</p>
              <h2 className="mt-2 font-display text-3xl text-ink">Books to read and keep</h2>
            </div>
            <Link to="/books" className="text-sm text-ink-soft transition-colors hover:text-gold">View all →</Link>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 sm:gap-6">
            {books.map((b) => (
              <Link key={b.id} to="/book/$id" params={{ id: b.id }} className="group block">
                <BookCover src={b.cover_url} title={b.title} sizes="(min-width: 640px) 18vw, 30vw" />
                <p className="mt-2 truncate text-xs text-ink-soft transition-colors group-hover:text-gold sm:text-sm">{b.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
