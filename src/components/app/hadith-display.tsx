/** Grade badges get a distinct color per grade so readers can scan authenticity at a glance. */
export function GradeBadge({ grade }: { grade: string }) {
  const normalized = grade.toLowerCase();
  const tone = normalized.includes("sahih") || normalized.includes("ṣaḥīḥ")
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : normalized.includes("hasan") || normalized.includes("ḥasan")
      ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
      : normalized.includes("da'if") || normalized.includes("ḍaʿīf") || normalized.includes("weak")
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "bg-secondary text-ink-soft";
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{grade}</span>;
}

interface Reference {
  id: string;
  book_name: string;
  volume?: string | number | null;
  page?: string | number | null;
  hadith_number?: string | number | null;
  reliability_note?: string | null;
}

export function ReferenceList({ refs }: { refs: Reference[] }) {
  if (refs.length === 0) return null;
  return (
    <div className="mt-6 rounded-lg bg-secondary/50 p-4">
      <p className="eyebrow">References</p>
      <ul className="mt-2 space-y-1.5 text-sm text-ink">
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
  );
}
