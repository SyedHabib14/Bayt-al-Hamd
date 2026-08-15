import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useDeferredValue, useMemo, useState } from "react";
import {
  BookHeart,
  Check,
  Edit3,
  FilePlus2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { authHeaders, useAuth } from "@/lib/auth-store";
import { listAllZiyarat, setZiyaratPublished, deleteZiyarat, type ZiyaratRow } from "@/lib/ziyarat-admin.functions";

type Classification = "ziyarat" | "munajat";

export const Route = createFileRoute("/_admin/admin/ziyarat")({
  head: () => ({
    meta: [
      { title: "Ziyārat & Munājāt · Admin — Bayt al-Ḥamd" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminZiyarat,
});

const EntryRow = memo(function EntryRow({ entry, onToggle, onDelete, toggling, deleting }: {
  entry: ZiyaratRow;
  onToggle: (entry: ZiyaratRow) => void;
  onDelete: (entry: ZiyaratRow) => void;
  toggling: boolean;
  deleting: boolean;
}) {
  return (
    <article className="manuscript paper-grain group relative isolate overflow-hidden rounded-[1.6rem] border border-white/40 bg-card/60 p-5 shadow-[0_18px_55px_-36px_rgba(58,42,15,.72)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-card/75 dark:border-white/10 dark:bg-[#131b18]/65 dark:hover:bg-[#17211d]/75 sm:p-6">
      <div className="pointer-events-none absolute -left-20 -top-20 -z-10 size-52 rounded-full bg-gold/12 blur-[70px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-4 sm:gap-5">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="eyebrow -ml-2 rounded-full border border-gold/20 bg-gold/[0.07] px-2.5 py-1 backdrop-blur-md">{entry.classification}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${entry.is_published ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                {entry.is_published ? <Check size={11} strokeWidth={2.2} /> : <Edit3 size={11} />}
                {entry.is_published ? "Published" : "Draft"}
              </span>
            </div>

            <h2 className="truncate font-display text-xl text-ink dark:text-[#f3ecdd] sm:text-2xl">{entry.title_en}</h2>
            <p lang="ar" dir="rtl" className="graph-text -mt-3 -mb-6 truncate text-right text-3xl leading-[1.75] text-ink dark:text-[#eee5d5] sm:text-4xl lg:text-[2.65rem]">
              {entry.title_ar}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <button type="button" disabled={toggling} onClick={() => onToggle(entry)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-gold/25 bg-card/45 px-4 text-sm text-ink-soft shadow-sm backdrop-blur-xl transition hover:border-gold hover:bg-gold/[0.06] hover:text-gold disabled:cursor-wait disabled:opacity-55 dark:border-white/10 sm:flex-none">
            {toggling ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} strokeWidth={1.6} />}
            {entry.is_published ? "Unpublish" : "Publish"}
          </button>
          <Link to="/admin/ziyarat/$id/edit" params={{ id: entry.id }} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm text-parchment shadow-[0_14px_30px_-18px_rgba(0,0,0,.7)] transition hover:-translate-y-0.5 hover:bg-ink-soft dark:bg-[#d0b66f] dark:text-[#111713] dark:hover:bg-[#ddc785] sm:flex-none">
            <Edit3 size={18} strokeWidth={1.7} /> Edit
          </Link>
          <button type="button" disabled={deleting} onClick={() => { if (confirm("Delete this entry permanently?")) onDelete(entry); }} aria-label={`Delete ${entry.title_en}`} className="inline-flex size-11 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/[0.05] text-destructive backdrop-blur-xl transition hover:border-destructive/45 hover:bg-destructive/10 disabled:cursor-wait disabled:opacity-50">
            {deleting ? <LoaderCircle size={19} className="animate-spin" /> : <Trash2 size={19} strokeWidth={1.7} />}
          </button>
        </div>
      </div>
    </article>
  );
});

function AdminZiyarat() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { pathname } = useLocation();
  const exact = pathname === "/admin/ziyarat";
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"all" | Classification>("all");
  const deferredSearch = useDeferredValue(search);

  const query = useQuery({
    queryKey: ["admin", "ziyarat"],
    queryFn: () => listAllZiyarat({ headers: authHeaders() }),
    enabled: Boolean(token) && exact,
    retry: false,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const mutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => setZiyaratPublished({ data: { id, value }, headers: authHeaders() }),
    onMutate: async ({ id, value }) => {
      await qc.cancelQueries({ queryKey: ["admin", "ziyarat"] });
      const previous = qc.getQueryData<ZiyaratRow[]>(["admin", "ziyarat"]);
      qc.setQueryData<ZiyaratRow[]>(["admin", "ziyarat"], (old) => old?.map((item) => item.id === id ? { ...item, is_published: value } : item));
      return { previous };
    },
    onError: (_error, _variables, context) => qc.setQueryData(["admin", "ziyarat"], context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "ziyarat"] }),
  });

  const del = useMutation({
    mutationFn: (entry: ZiyaratRow) => deleteZiyarat({ data: { id: entry.id }, headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "ziyarat"] }),
  });

  const allEntries = query.data ?? [];
  const entries = useMemo(() => allEntries.filter((item) =>
    (kind === "all" || item.classification === kind) &&
    `${item.title_en} ${item.title_ar} ${item.slug}`.toLocaleLowerCase().includes(deferredSearch.trim().toLocaleLowerCase())
  ), [allEntries, kind, deferredSearch]);

  if (!exact) return <Outlet />;

  const published = allEntries.filter((entry) => entry.is_published).length;

  return (
    <main className="relative isolate mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      <div className="pointer-events-none absolute -left-32 top-10 -z-10 size-96 rounded-full bg-gold/15 blur-[110px] dark:bg-gold/10" />
      <div className="pointer-events-none absolute -right-28 top-[34rem] -z-10 size-96 rounded-full bg-emerald-600/10 blur-[110px]" />

      <header className="manuscript relative isolate overflow-hidden rounded-[2rem] border border-white/20 bg-[#173d31]/85 px-6 py-8 text-[#f8f1e2] shadow-[0_26px_80px_-38px_rgba(23,61,49,.95)] backdrop-blur-2xl sm:px-8 sm:py-10 lg:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/[0.08] via-transparent to-black/10" />
        <div className="pointer-events-none absolute -left-20 -top-28 -z-10 size-72 rounded-full bg-[#d8bf7d]/15 blur-[70px]" />
        <div className="pointer-events-none absolute -right-28 -top-28 size-80 rounded-full border border-[#d7bd79]/10" />
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full border border-[#d7bd79]/15" />

        <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-[#d8bf7d]">
              <span className="grid size-12 place-items-center rounded-2xl border border-[#d8bf7d]/25 bg-white/[0.07] shadow-lg backdrop-blur-xl"><BookHeart size={25} strokeWidth={1.45} /></span>
              <p className="eyebrow text-[#d8bf7d]">Sacred texts</p>
            </div>
            <h1 className="mt-5 font-display text-3xl tracking-[-0.025em] text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">Ziyārat & Munājāt</h1>
            <p className="mt-3 max-w-xl thin-text text-xl leading-6 text-slate-700 dark:text-[#fff7e6]/95">Curate devotional texts, prepare translations, and control publication from one archive.</p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl border border-slate-300/80 bg-slate-900/5 px-3 text-xl thin-text text-slate-800 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-900/10 focus:outline-none focus:ring-4 focus:ring-slate-400/20 disabled:cursor-wait disabled:opacity-60 dark:border-[#d8bf7d]/30 dark:bg-white/[0.08] dark:text-[#f8f1e2] dark:hover:border-[#d8bf7d]/60 dark:hover:bg-white/[0.13] dark:focus:ring-[#d8bf7d]/15" aria-label="Refresh">
              <RefreshCw size={20} strokeWidth={1.7} className={query.isFetching ? "animate-spin" : ""} />
            </button>
            <Link to="/admin/ziyarat/$id/edit" params={{ id: "new" }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#d0b66f] px-3 text-lg thin-text text-[#111713] shadow-[0_15px_35px_-20px_rgba(216,191,125,.9)] transition hover:-translate-y-0.5 hover:bg-[#ddc785]">
              <Plus size={20} /> New Entry
            </Link>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3 sm:gap-4" aria-label="Entry summary">
        {[["All entries", allEntries.length], ["Added", published], ["Drafts", allEntries.length - published]].map(([label, value], index) => (
          <div key={String(label)} className="manuscript rounded-[1.35rem] border border-white/40 bg-card/55 p-4 text-center shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#131b18]/60 sm:p-5">
            <p className="font-display text-3xl text-ink dark:text-[#f3ecdd]">{value}</p>
            <p className={`mt-1 text-[9px] uppercase tracking-[.18em] ${index === 1 ? "text-emerald-600 dark:text-emerald-300" : index === 2 ? "text-amber-600 dark:text-amber-300" : "text-gold"}`}>{label}</p>
          </div>
        ))}
      </section>

      
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card/45 px-4 backdrop-blur-xl transition focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/10 dark:border-white/10 dark:bg-black/10">
          <Search size={20} strokeWidth={1.65} className="text-muted-foreground" />
          <span className="sr-only">Search entries</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search English, Arabic, or slug" className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground dark:text-[#f3ecdd]" />
        </label>
        <div className="grid grid-cols-3 rounded-xl border border-border bg-muted/40 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
          {(["all", "ziyarat", "munajat"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setKind(value)} className={`rounded-lg px-4 py-2.5 text-xs capitalize transition-all ${kind === value ? "bg-card text-ink shadow-sm dark:bg-white/10 dark:text-[#f3ecdd]" : "text-muted-foreground hover:text-ink dark:hover:text-[#eee7d9]"}`}>{value}</button>
          ))}
        </div>
    
      <div className="grid gap-4">
        {query.isLoading ? [0, 1, 2].map((item) => (
          <div key={item} className="manuscript h-44 animate-pulse rounded-[1.6rem] border border-white/35 bg-card/45 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]" />
        )) : entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            toggling={mutation.isPending && mutation.variables?.id === entry.id}
            deleting={del.isPending && del.variables?.id === entry.id}
            onToggle={(item) => mutation.mutate({ id: item.id, value: !item.is_published })}
            onDelete={(item) => del.mutate(item)}
          />
        ))}
      </div>

      {!query.isLoading && entries.length === 0 && (
        <div className="manuscript relative overflow-hidden rounded-[1.75rem] border border-white/40 bg-card/55 p-12 text-center shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-[#131b18]/60">
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[80px]" />
          <div className="relative mx-auto grid size-20 place-items-center rounded-[1.6rem] border border-gold/20 bg-gold/10"><FilePlus2 size={36} strokeWidth={1.4} className="text-gold" /></div>
          <h2 className="relative mt-6 font-display text-2xl text-ink dark:text-[#f3ecdd]">No entries found</h2>
          <p className="relative mt-2 text-sm text-muted-foreground">Create a new entry or adjust the filters.</p>
        </div>
      )}
    </main>
  );
}
