import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, Sparkles } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { ziyaratQuery, useRealtimeInvalidate, type PublicZiyarat } from "@/lib/public-data";

type Classification = "ziyarat" | "munajat";

export const Route = createFileRoute("/ziyarat")({
  head: () => ({
    meta: [
      { title: "Ziyārat & Munājāt — Bayt al-Ḥamd" },
      { name: "description", content: "A collection of Ziyārat and Munājāt in Arabic with English translation." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(ziyaratQuery),
  component: ZiyaratIndex,
});

const EntryCard = memo(function EntryCard({ entry }: { entry: PublicZiyarat }) {
  return (
<Link to="/ziyarat/$id" params={{ id: entry.id }} className="manuscript manuscript-interactive paper-grain group flex min-h-72 flex-col overflow-hidden p-6 hover:-translate-y-1 hover:border-gold sm:p-7">
      <div className="mb-8 flex items-center justify-between">
        <span className="font-light eyebrow">{entry.classification}</span>
        <BookOpen className="h-4 w-4 text-gold transition-transform duration-300 group-hover:scale-110" />
      </div>
      <h2 lang="ar" className="graph-text text-2xl text-ink -mt-11 sm:text-3xl">{entry.title_ar}</h2>
      <div className="my-4 gold-rule opacity-60" />
      <h3 className="text-xl text-ink">{entry.title_en}</h3>
      <p className="mt-3 line-clamp-3 thin-text text-lg leading-7 text-ink-soft">{entry.content_en}</p>
      <span className="mt-auto pt-6 text-xs uppercase tracking-[0.24em] text-gold">Read text</span>
    </Link>
  );
});

function ZiyaratIndex() {
  useRealtimeInvalidate();
  const { pathname } = useLocation();
  const [filter, setFilter] = useState<"all" | Classification>("all");
  const { data } = useSuspenseQuery(ziyaratQuery);
  const entries = useMemo(
    () => (data ?? []).filter(entry => filter === "all" || entry.classification === filter),
    [data, filter],
  );
  if (pathname !== "/ziyarat") return <Outlet />;
  return (
    <main className="ambient-glow-shell mx-auto min-h-screen w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-20">
      <header className="mx-auto max-w-3xl text-center">
        <p className="font-light eyebrow">Devotions of love and longing</p>
        <h1
          style={{
            fontSize: "clamp(2.25rem, 8vw, 100px)",
          }}
          className="
            -mt-2
            -mb-4
            sm:-mt-16
            sm:-mb-16
            text-center
            urdu-text
            text-ink
            whitespace-nowrap
          "
        >
          زیارات و مناجات
        </h1>
        <div className="mx-auto my-6 w-44 gold-rule-shimmer" />
        <p className="thin-text font-serif text-base leading-8 text-ink-soft sm:text-xl">Arabic texts and faithful English translations for visitation and remembrance.</p>
      </header>
      <div className="relative mx-auto mb-10 mt-10 w-fit rounded-xl border border-gold-soft bg-card/70 p-1.5 shadow-[0_0_40px_-18px_var(--gold)] backdrop-blur-xl">
        <Sparkles className="pointer-events-none absolute -right-2 -top-2 h-4 w-4 text-gold" />
        <div className="grid grid-cols-3">
          {(["ziyarat", "munajat", "all"] as const).map(value => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-4 py-1.5 text-sm font-black capitalize transition-all duration-300 sm:px-7 ${filter === value ? "bg-ink text-parchment shadow-lg" : "text-ink-soft hover:text-ink"}`}>{value}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {entries.map(entry => <EntryCard key={entry.id} entry={entry} />)}
      </div>
      {entries.length === 0 && (
        <div className="manuscript mx-auto max-w-2xl p-12 text-center">
          <h2 className="text-2xl">The collection is being prepared</h2>
          <p className="mt-3 font-serif text-ink-soft">Return soon for carefully presented devotional texts.</p>
        </div>
      )}
    </main>
  );
}
