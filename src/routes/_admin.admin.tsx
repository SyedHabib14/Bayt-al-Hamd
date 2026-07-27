import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAllMajalis } from "@/lib/admin.functions";
import { authHeaders, useAuth } from "@/lib/auth-store";
import { BookOpen, FileText, EyeOff, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_admin/admin")({
  head: () => ({ meta: [{ title: "Admin — Dalīl" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="manuscript flex items-start gap-4 p-5 sm:p-8">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${accent ?? "bg-secondary"}`}>
        <Icon size={18} className="text-ink" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">{label}</p>
        <p className="mt-1 font-display text-3xl text-ink sm:text-4xl">{value}</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Determine if we're on the exact /admin path vs a child route like /admin/majalis.
  // When on a child route, we must render <Outlet /> so child route components mount.
  const { pathname } = useLocation();
  const isExactDashboard = pathname === "/admin";

  if (!isExactDashboard) {
    return <Outlet />;
  }

  const { data: majalis, isError, isLoading, refetch } = useQuery({
    queryKey: ["admin", "majalis"],
    queryFn: () => listAllMajalis({ headers: authHeaders() }),
    enabled: Boolean(token),
    retry: false,
    staleTime: 30_000, // 30s cache — avoids redundant refetches on navigation
  });
  const rows = Array.isArray(majalis) ? majalis : [];
  const total = rows.length;
  const published = rows.filter((m) => m.is_published).length;
  const drafts = total - published;

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="manuscript animate-pulse p-5 sm:p-8">
            <div className="h-3 w-24 rounded bg-ink-soft/20" />
            <div className="mt-3 h-8 w-16 rounded bg-ink-soft/20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Total majalis" value={total} accent="bg-gold/20" />
        <StatCard icon={FileText} label="Published" value={published} accent="bg-emerald-500/20" />
        <StatCard icon={EyeOff} label="Drafts" value={drafts} accent="bg-amber-500/20" />
      </div>
      {isError && (
        <div className="manuscript flex items-center gap-3 border-destructive/30 p-4">
          <p className="flex-1 text-sm text-destructive">
            Could not load admin data. Try refreshing or sign out and sign in again.
          </p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-ink hover:border-gold"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin/majalis"
          className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm text-parchment hover:bg-ink-soft"
        >
          <BookOpen size={16} />
          Manage majalis →
        </Link>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin"] })}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm text-ink hover:border-gold hover:text-gold"
        >
          <RefreshCw size={14} />
          Refresh data
        </button>
      </div>
    </div>
  );
}
