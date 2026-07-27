import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { majalisQuery, formatDate, useRealtimeInvalidate } from "@/lib/public-data";

export const Route = createFileRoute("/majalis")({
  head: () => ({
    meta: [
      { title: "Majalis — Dalīl" },
      { name: "description", content: "All published majalis with their date and hadiths." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(majalisQuery),
  component: MajalisList,
});

function MajalisList() {
  useRealtimeInvalidate();
  const { data } = useSuspenseQuery(majalisQuery);
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-xs uppercase tracking-[0.35em] text-gold">The archive</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Majalis</h1>
      <div className="gold-rule mt-6 w-24" />
      <ul className="mt-12 divide-y divide-border">
        {data.map((m) => (
          <li key={m.id} className="group py-6">
            <Link to="/majlis/$id" params={{ id: m.id }} className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gold">{formatDate(m.date)}</p>
                <h2 className="mt-2 font-display text-2xl text-ink group-hover:text-gold">{m.title}</h2>
                {m.description && <p className="mt-2 max-w-2xl text-sm text-ink-soft">{m.description}</p>}
              </div>
              <span className="text-sm text-ink-soft group-hover:text-ink">Read →</span>
            </Link>
          </li>
        ))}
        {data.length === 0 && <li className="py-10 text-ink-soft">No majalis published yet.</li>}
      </ul>
    </div>
  );
}
