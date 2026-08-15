import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useState } from "react";
import { deleteMajlis, listAllMajalis, saveMajlis } from "@/lib/admin.functions";
import { formatDate } from "@/lib/public-data";
import { authHeaders, useAuth } from "@/lib/auth-store";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Edit3,
  FilePlus2,
  LoaderCircle,
  Plus,
  RefreshCw,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/majalis")({
  head: () => ({
    meta: [
      { title: "Majalis · Admin — Bayt al-Ḥamd" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMajalis,
});

const MajlisRow = memo(function MajlisRow({
  majlis,
  onDelete,
  deleting,
}: {
  majlis: { id: string; title: string; date: string; is_published: boolean };
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <li className="group relative isolate overflow-hidden rounded-[1.4rem] border border-white/40 bg-card/55 p-4 shadow-[0_16px_45px_-35px_rgba(58,42,15,.75)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-card/75 dark:border-white/10 dark:bg-[#131b18]/60 dark:hover:bg-[#17211d]/75 sm:p-5">
      <div className="pointer-events-none absolute -left-14 -top-14 -z-10 size-36 rounded-full bg-gold/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />


      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-gold/20 bg-gold/10 shadow-[0_12px_30px_-20px_rgba(115,82,22,.7)] backdrop-blur-xl">
            <ScrollText size={27} strokeWidth={1.45} className="text-gold dark:text-[#ddc782]" />
          </div>


          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold dark:text-[#d4b96f] sm:text-xs">
                <CalendarDays size={14} strokeWidth={1.7} />
                {formatDate(majlis.date)}
              </p>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider backdrop-blur-md ${majlis.is_published ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                {majlis.is_published ? <Check size={11} strokeWidth={2.2} /> : <Edit3 size={11} />}
                {majlis.is_published ? "Published" : "Draft"}
              </span>
            </div>
            <p className="mt-2 truncate font-display text-lg text-ink dark:text-[#f3ecdd] sm:text-xl">{majlis.title}</p>
          </div>
        </div>


        <div className="flex shrink-0 gap-2 sm:pl-4">
          <Link
            to="/admin/majalis/$id/edit"
            params={{ id: majlis.id }}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card/45 px-4 text-sm text-ink shadow-sm backdrop-blur-xl transition hover:border-gold hover:bg-gold/[0.06] hover:text-gold focus:outline-none focus:ring-4 focus:ring-gold/10 dark:border-white/10 dark:text-[#eee7d9] sm:flex-none"
          >
            <Edit3 size={18} strokeWidth={1.7} /> Edit
          </Link>
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (confirm("Delete this majlis and all its hadiths?")) onDelete(majlis.id);
            }}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-destructive/25 bg-destructive/[0.05] px-4 text-sm text-destructive backdrop-blur-xl transition hover:border-destructive/45 hover:bg-destructive/10 focus:outline-none focus:ring-4 focus:ring-destructive/10 disabled:cursor-wait disabled:opacity-50 sm:flex-none"
          >
            {deleting ? <LoaderCircle size={18} className="animate-spin" /> : <Trash2 size={18} strokeWidth={1.7} />}
            Delete
          </button>
        </div>
      </div>
    </li>
  );
});
function AdminMajalis() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { pathname } = useLocation();
  const isExactList = pathname === "/admin/majalis";
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "majalis"],
    queryFn: () => listAllMajalis({ headers: authHeaders() }),
    enabled: Boolean(token) && isExactList,
    retry: false,
    staleTime: 30_000,
  });

  const [creating, setCreating] = useState(false);


  const del = useMutation({
    mutationFn: (id: string) => deleteMajlis({ data: { id }, headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "majalis"] }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "majalis"] });
      const prev = qc.getQueryData<unknown[]>(["admin", "majalis"]);
      qc.setQueryData(["admin", "majalis"], (old: unknown[] | undefined) =>
        (old ?? []).filter((m: any) => m.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData(["admin", "majalis"], context?.prev);
    },
  });

  if (!isExactList) return <Outlet />;
  const majalis = Array.isArray(data) ? data : [];
  const published = majalis.filter((m) => m.is_published).length;
  const drafts = majalis.length - published;
  return (
    <div className="relative isolate space-y-6">
      <div className="pointer-events-none absolute -left-32 top-10 -z-10 size-96 rounded-full bg-gold/15 blur-[110px] dark:bg-gold/10" />
      <div className="pointer-events-none absolute -right-24 top-[30rem] -z-10 size-80 rounded-full bg-emerald-600/10 blur-[100px]" />
      <header className="manuscript relative isolate overflow-hidden rounded-[2rem] border border-white/20 bg-[#173d31]/85 px-6 py-8 text-[#f8f1e2] shadow-[0_26px_80px_-38px_rgba(23,61,49,.95)] backdrop-blur-2xl sm:px-8 sm:py-10 lg:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/[0.08] via-transparent to-black/10" />
        <div className="pointer-events-none absolute -left-20 -top-28 -z-10 size-72 rounded-full bg-[#d8bf7d]/15 blur-[70px]" />
        <div className="pointer-events-none absolute -right-28 -top-28 size-80 rounded-full border border-[#d7bd79]/10" />
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full border border-[#d7bd79]/15" />

        <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-[#d8bf7d]">
              <span className="grid size-12 place-items-center rounded-2xl border border-[#d8bf7d]/25 bg-white/[0.07] shadow-lg backdrop-blur-xl">
                <BookOpen size={25} strokeWidth={1.5} />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] sm:text-xs">Editorial archive</p>
            </div>
            <h1 className="mt-5 font-display text-3xl tracking-[-0.025em] text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">Majālis</h1>
            <p className="mt-3 max-w-xl thin-text text-xl leading-6 text-slate-700 dark:text-[#fff7e6]/95">Create, review, and prepare scholarly sessions for publication.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl border border-slate-300/80 bg-slate-900/5 px-3 text-xl thin-text text-slate-800 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-900/10 focus:outline-none focus:ring-4 focus:ring-slate-400/20 disabled:cursor-wait disabled:opacity-60 dark:border-[#d8bf7d]/30 dark:bg-white/[0.08] dark:text-[#f8f1e2] dark:hover:border-[#d8bf7d]/60 dark:hover:bg-white/[0.13] dark:focus:ring-[#d8bf7d]/15"
            >
              <RefreshCw size={19} strokeWidth={1.7} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setCreating((value) => !value)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#d0b66f] px-3 text-lg thin-text text-[#111713] shadow-[0_15px_35px_-20px_rgba(216,191,125,.9)] transition hover:-translate-y-0.5 hover:bg-[#ddc785] focus:outline-none focus:ring-4 focus:ring-[#d8bf7d]/20"
            >
              {creating ? <X size={20} /> : <Plus size={20} />}
              {creating ? "Cancel" : "New Majlis"}
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3 sm:gap-4" aria-label="Majalis summary">
        {([
          ["All majalis", majalis.length, BookOpen, "bg-gold/15"],
          ["Published", published, Check, "bg-emerald-500/15"],
          ["Drafts", drafts, Edit3, "bg-amber-500/15"],
        ] as const satisfies readonly [string, number, LucideIcon, string][]).map(([label, value, Icon, accent]) => (
          <div key={label as string} className="manuscript flex flex-col gap-3 rounded-[1.35rem] border border-white/40 bg-card/55 p-4 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#131b18]/60 sm:flex-row sm:items-center sm:p-5">
            <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${accent}`}>
              <Icon size={21} strokeWidth={1.6} className="text-ink dark:text-[#eee7d9]" />
            </div>
            <div>
              <p className="font-display text-2xl text-ink dark:text-[#f3ecdd]">{value}</p>
              <p className="text-[9px] uppercase tracking-[0.17em] text-ink-soft sm:text-[10px]">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {creating && (
        <MajlisForm
          onDone={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["admin", "majalis"] });
          }}
        />
      )}
      {isLoading && (
        <ul className="space-y-3" aria-label="Loading majalis">
          {[1, 2, 3].map((i) => (
            <li key={i} className="manuscript animate-pulse rounded-[1.4rem] border border-white/35 bg-card/50 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex gap-4">
                <div className="size-14 rounded-2xl bg-ink-soft/15" />
                <div className="flex-1"><div className="h-3 w-28 rounded bg-ink-soft/15" /><div className="mt-3 h-6 max-w-sm rounded bg-ink-soft/15" /></div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && majalis.length === 0 && (
        <div className="manuscript relative overflow-hidden rounded-[1.75rem] border border-white/40 bg-card/55 px-6 py-16 text-center shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-[#131b18]/60">
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[80px]" />
          <div className="relative mx-auto grid size-20 place-items-center rounded-[1.6rem] border border-gold/20 bg-gold/10 shadow-lg backdrop-blur-xl">
            <BookOpen size={38} strokeWidth={1.35} className="text-gold" />
          </div>
          <p className="relative mt-6 font-display text-2xl text-ink dark:text-[#f3ecdd]">No majalis yet</p>
          <p className="relative mt-2 text-sm text-ink-soft">Create your first majlis to begin the archive.</p>
        </div>
      )}
      {!isLoading && majalis.length > 0 && (
        <ul className="space-y-3">
          {majalis.map((majlis) => (
            <MajlisRow
              key={majlis.id}
              majlis={majlis}
              deleting={del.isPending && del.variables === majlis.id}
              onDelete={(id) => del.mutate(id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
function MajlisForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);


  const mut = useMutation({
    mutationFn: () => saveMajlis({ data: { title, date, description, is_published: isPublished }, headers: authHeaders() }),
    onSuccess: onDone,
  });


  const fieldClass = "mt-2 w-full rounded-xl border border-border bg-card/55 px-4 py-3 text-sm text-ink shadow-sm outline-none backdrop-blur-xl transition placeholder:text-ink-soft/50 focus:border-gold focus:ring-4 focus:ring-gold/10 dark:border-white/10 dark:bg-black/15 dark:text-[#f3ecdd]";


  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mut.mutate();
      }}
      className="manuscript relative isolate overflow-hidden rounded-[1.75rem] border border-white/40 bg-card/60 p-5 shadow-[0_22px_65px_-38px_rgba(58,42,15,.7)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#131b18]/65 sm:p-8"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 -z-10 size-60 rounded-full bg-gold/15 blur-[75px]" />
      <div className="flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-2xl border border-gold/20 bg-gold/10 shadow-lg backdrop-blur-xl">
          <FilePlus2 size={27} strokeWidth={1.5} className="text-gold" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">New archive entry</p>
          <h2 className="mt-1 font-display text-2xl text-ink dark:text-[#f3ecdd]">Create a majlis</h2>
        </div>
      </div>


      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Enter the majlis title" className={fieldClass} />
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={fieldClass} />
        </label>
      </div>


      <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Add a concise editorial description" className={`${fieldClass} resize-y`} />
      </label>


      <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
        <span><span className="block text-sm font-medium text-ink dark:text-[#eee7d9]">Publish immediately</span><span className="mt-1 block text-xs text-ink-soft">Make this majlis visible in the public archive.</span></span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${isPublished ? "bg-emerald-600" : "bg-ink-soft/25"}`}>
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="peer sr-only" />
          <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${isPublished ? "left-6" : "left-1"}`} />
        </span>
      </label>


      {mut.error && <p role="alert" className="mt-5 rounded-xl border border-destructive/20 bg-destructive/[0.06] px-4 py-3 text-sm text-destructive">Save failed. Please try again.</p>}


      <button disabled={mut.isPending} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl bg-ink px-6 text-sm font-medium text-parchment shadow-[0_14px_30px_-18px_rgba(0,0,0,.7)] transition hover:-translate-y-0.5 hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-gold/15 disabled:cursor-wait disabled:opacity-60 dark:bg-[#d0b66f] dark:text-[#111713] dark:hover:bg-[#ddc785]">
        {mut.isPending ? <LoaderCircle size={19} className="animate-spin" /> : <FilePlus2 size={19} />}
        {mut.isPending ? "Saving…" : "Save majlis"}
        {!mut.isPending && <ArrowRight size={18} />}
      </button>
    </form>
  );
}
