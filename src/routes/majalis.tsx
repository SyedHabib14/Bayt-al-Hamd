import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { majalisQuery, formatDate, useRealtimeInvalidate } from "@/lib/public-data";
import 'bootstrap/dist/css/bootstrap-utilities.min.css'
export const Route = createFileRoute("/majalis")({
  head: () => ({
    meta: [
      { title: "Majalis — Bayt al-Ḥamd" },
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
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <p className="eyebrow text-center -mb-16">The archive of</p>
      <h1 style={{"fontSize" : 100, "textAlign" : "center"}} className="graph-text text-ink sm:text-5xl">مَجَالِسُ</h1>
      <div className="gold-rule mt-2 w-24 mx-auto" />
      <ul className="mt-12 space-y-4">
        {data.map((m) => (
          <li key={m.id}>
            <Link
              to="/majlis/$id"
              params={{ id: m.id }}
              className="manuscript manuscript-interactive group flex flex-col gap-2 p-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-2xl sm:flex-row sm:items-center sm:justify-between sm:p-7"
            >
              <div className="min-w-0">
                <p style={{"fontSize" : 14}} className="eyebrow">{formatDate(m.date)}</p>
                <h2 className="mt-2 font-display text-2xl text-ink transition-colors duration-200 group-hover:text-gold">{m.title}</h2>
                {m.description && <p className="display-6 mt-2 max-w-2xl text-2sm leading-relaxed text-ink-soft">{m.description}</p>}
              </div>
              <span className="shrink-0 text-sm text-ink-soft transition-all duration-200 group-hover:translate-x-1 group-hover:text-ink">
                Read →
              </span>
            </Link>
          </li>
        ))}
        {data.length === 0 && (
          <li className="manuscript py-16 text-center text-ink-soft">No majalis published yet.</li>
        )}
      </ul>
    </div>
  );
}
