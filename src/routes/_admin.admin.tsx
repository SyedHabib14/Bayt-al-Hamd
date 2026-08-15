import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listAllMajalis } from "@/lib/admin.functions";
import { listAllBooks } from "@/lib/book-admin.functions";
import { getMonthlyUniqueVisitors } from "@/lib/visitor-admin.functions";
import { authHeaders, useAuth } from "@/lib/auth-store";
import {
  ArrowRight,
  BookOpen,
  EyeOff,
  FileText,
  Library,
  RefreshCw,
  Sparkles,
  UsersRound,
} from "lucide-react";

export const Route = createFileRoute("/_admin/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Bayt al-Ḥamd" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});


function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="manuscript group relative isolate overflow-hidden rounded-[1.5rem] border border-white/45 bg-card/60 p-5 shadow-[0_18px_55px_-32px_rgba(58,42,15,.6)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-gold/45 hover:bg-card/75 dark:border-white/10 dark:bg-[#131b18]/65 dark:shadow-[0_24px_65px_-35px_rgba(0,0,0,.9)] dark:hover:bg-[#17211d]/75 sm:p-6">
      <div className={`pointer-events-none absolute -left-10 -top-12 -z-10 size-36 rounded-full blur-3xl opacity-45 ${accent ?? "bg-secondary"}`} />
      <div className="pointer-events-none absolute -right-9 -top-9 size-28 rounded-full border border-gold/15 transition-transform duration-500 group-hover:scale-125" />
      <div className={`flex size-14 items-center justify-center rounded-2xl border border-white/35 shadow-[0_10px_25px_-15px_rgba(0,0,0,.7)] backdrop-blur-md ${accent ?? "bg-secondary"}`}>
        <Icon size={26} strokeWidth={1.65} className="text-ink dark:text-[#f3ead8]" />
      </div>
      <div className="mt-6 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gold dark:text-[#d4b96f] sm:text-xs">{label}</p>
        <p className="mt-1 font-display text-4xl text-ink dark:text-[#f4eddf] sm:text-5xl">{value}</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const isExactDashboard = pathname === "/admin";


  const { data: majalis, isError, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "majalis"],
    queryFn: () => listAllMajalis({ headers: authHeaders() }),
    enabled: Boolean(token) && isExactDashboard,
    retry: false,
    staleTime: 30_000,
  });

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ["admin", "books"],
    queryFn: () => listAllBooks({ headers: authHeaders() }),
    enabled: Boolean(token) && isExactDashboard,
    retry: false,
    staleTime: 30_000,
  });

  const { data: visitors, isLoading: visitorsLoading, isError: visitorsError } = useQuery({
    queryKey: ["admin", "monthly-unique-visitors"],
    queryFn: () => getMonthlyUniqueVisitors({ headers: authHeaders() }),
    enabled: Boolean(token) && isExactDashboard,
    retry: false,
    staleTime: 30_000,
  });

  if (!isExactDashboard) return <Outlet />;

  const rows = Array.isArray(majalis) ? majalis : [];
  const total = rows.length;
  const published = rows.filter((m) => m.is_published).length;
  const drafts = total - published;
  const bookRows = Array.isArray(books) ? books : [];
  const refreshAll = () => queryClient.invalidateQueries({ queryKey: ["admin"] });
  if (isLoading || booksLoading) {
    return (
      <div className="relative space-y-6" aria-busy="true" aria-label="Loading dashboard">
        <div className="pointer-events-none absolute -left-24 top-20 -z-10 size-72 rounded-full bg-gold/15 blur-[90px]" />
        <div className="manuscript h-48 animate-pulse rounded-[1.75rem] border border-white/30 bg-card/45 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="manuscript animate-pulse rounded-[1.5rem] border border-white/30 bg-card/50 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
              <div className="size-14 rounded-2xl bg-ink-soft/15" />
              <div className="mt-6 h-3 w-24 rounded bg-ink-soft/15" />
              <div className="mt-3 h-10 w-16 rounded bg-ink-soft/15" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate space-y-6">
      <div className="pointer-events-none absolute -left-28 top-16 -z-10 size-80 rounded-full bg-gold/15 blur-[100px] dark:bg-gold/10" />
      <div className="pointer-events-none absolute -right-28 top-[28rem] -z-10 size-96 rounded-full bg-emerald-700/10 blur-[110px] dark:bg-emerald-500/10" />


      <header className="manuscript relative isolate overflow-hidden rounded-[2rem] border border-white/20 bg-[#173d31]/85 px-6 py-8 text-[#f8f1e2] shadow-[0_26px_80px_-38px_rgba(23,61,49,.95)] backdrop-blur-2xl sm:px-8 sm:py-10 lg:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/[0.08] via-transparent to-black/10" />
        <div className="pointer-events-none absolute -left-20 -top-28 -z-10 size-72 rounded-full bg-[#d8bf7d]/15 blur-[70px]" />
        <div className="pointer-events-none absolute -right-28 -top-28 size-80 rounded-full border border-[#d7bd79]/10" />
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full border border-[#d7bd79]/15" />


        <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-[#d8bf7d]">
              <span className="grid size-11 place-items-center rounded-2xl border border-[#d8bf7d]/25 bg-white/[0.07] shadow-lg backdrop-blur-xl">
                <Sparkles size={22} strokeWidth={1.6} />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] sm:text-xs">Editorial overview</p>
            </div>
            <h1 className="mt-5 font-display text-3xl tracking-[-0.025em] text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">The Scholar’s Desk</h1>
            <p className="mt-3 max-w-xl thin-text text-xl leading-6 text-slate-700 dark:text-[#fff7e6]/95">Curate the archive, review works in progress, and keep the collection ready for its readers.</p>
          </div>

          <button type="button" onClick={refreshAll} disabled={isFetching} className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl border border-slate-300/80 bg-slate-900/5 px-3 text-xl thin-text text-slate-800 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-900/10 focus:outline-none focus:ring-4 focus:ring-slate-400/20 disabled:cursor-wait disabled:opacity-60 dark:border-[#d8bf7d]/30 dark:bg-white/[0.08] dark:text-[#f8f1e2] dark:hover:border-[#d8bf7d]/60 dark:hover:bg-white/[0.13] dark:focus:ring-[#d8bf7d]/15">
            <RefreshCw size={20} strokeWidth={1.7} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Refreshing…" : "Refresh data"}
          </button>
        </div>
      </header>


      <section aria-label="Archive statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={BookOpen} label="Total majalis" value={total} accent="bg-gold/20 dark:bg-[#d4b96f]/15" />
        <StatCard icon={FileText} label="Published" value={published} accent="bg-emerald-500/15" />
        <StatCard icon={EyeOff} label="Drafts" value={drafts} accent="bg-amber-500/15" />
        <StatCard icon={Library} label="Books" value={bookRows.length} accent="bg-sky-500/15" />
        <StatCard icon={UsersRound} label={visitors ? `${visitors.month}/${visitors.year} visitors` : "Monthly visitors"} value={visitorsError ? "—" : visitorsLoading ? "…" : (visitors?.uniqueVisitors ?? 0)} accent="bg-violet-500/15" />
      </section>


      {isError && (
        <div className="manuscript flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/[0.06] p-4 shadow-lg backdrop-blur-2xl sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-destructive">Could not load admin data. Try refreshing or sign out and sign in again.</p>
          <button type="button" onClick={() => refetch()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/50 px-4 py-2.5 text-xs text-ink backdrop-blur-xl transition hover:border-gold hover:text-gold dark:text-[#eee7d9]">
            <RefreshCw size={18} /> Retry
          </button>
        </div>
      )}


      <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="manuscript relative isolate overflow-hidden rounded-[1.75rem] border border-white/40 bg-card/60 p-6 shadow-[0_22px_65px_-38px_rgba(58,42,15,.7)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#131b18]/65 sm:p-8">
          <div className="pointer-events-none absolute -bottom-28 -right-20 -z-10 size-64 rounded-full bg-gold/15 blur-[75px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-20 size-56 rounded-full border border-gold/10" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold dark:text-[#d4b96f]">Primary collection</p>
          <div className="mt-5 flex size-[4.5rem] items-center justify-center rounded-[1.4rem] border border-gold/20 bg-gold/15 shadow-[0_14px_35px_-20px_rgba(120,88,25,.8)] backdrop-blur-xl">
            <BookOpen size={34} strokeWidth={1.5} className="text-ink dark:text-[#ddc782]" />
          </div>
          <h2 className="mt-6 font-display text-2xl text-ink dark:text-[#f3ecdd] sm:text-3xl">Manage the majalis archive</h2>
          <p className="mt-3 thin-text max-w-xl text-xl leading-6 text-ink-soft dark:text-[#979c95]">Review entries, continue drafts, and maintain the published collection from one focused workspace.</p>
          <Link to="/admin/majalis" className="mt-7 inline-flex items-center gap-1 rounded-2xl bg-ink px-3 py-3.5 text-lg thin-text text-parchment shadow-[0_14px_30px_-18px_rgba(0,0,0,.7)] transition hover:-translate-y-0.5 hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-gold/15 dark:bg-[#d0b66f] dark:text-[#111713] dark:hover:bg-[#ddc785]">
            Manage majalis <ArrowRight size={20} strokeWidth={1} />
          </Link>
        </div>


        <div className="manuscript relative isolate overflow-hidden rounded-[1.75rem] border border-white/40 bg-card/60 p-6 shadow-[0_22px_65px_-38px_rgba(58,42,15,.7)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#131b18]/65 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 -z-10 size-48 rounded-full bg-sky-500/15 blur-[65px]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold dark:text-[#d4b96f]">Library</p>
          <div className="mt-5 flex items-center gap-5">
            <div className="grid size-[4.5rem] place-items-center rounded-[1.4rem] border border-sky-500/15 bg-sky-500/10 shadow-[0_14px_35px_-20px_rgba(14,116,144,.7)] backdrop-blur-xl">
              <Library size={34} strokeWidth={1.5} className="text-sky-700 dark:text-sky-300" />
            </div>
            <div>
              <p className="font-display text-4xl text-ink dark:text-[#f3ecdd]">{bookRows.length}</p>
              <p className="text-xs text-ink-soft">Volumes catalogued</p>
            </div>
          </div>
          <Link to="/admin/books" className="mt-7 inline-flex w-full items-center justify-between rounded-2xl border border-gold/35 bg-card/35 px-4 py-3.5 text-lg thin-text text-ink shadow-sm backdrop-blur-xl transition hover:border-gold hover:bg-gold/[0.07] hover:text-gold dark:text-[#eee7d9]">
            Manage books <ArrowRight size={20} strokeWidth={1.7} />
          </Link>
        </div>
      </section>
    </div>
  );
}
