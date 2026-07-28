import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, memo } from "react";
import { deleteMajlis, listAllMajalis, saveMajlis } from "@/lib/admin.functions";
import { formatDate } from "@/lib/public-data";
import { authHeaders, useAuth } from "@/lib/auth-store";
import { Plus, Trash2, Edit3, RefreshCw, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/majalis")({
  head: () => ({ meta: [{ title: "Majalis · Admin — Bayt al-Ḥamd" }, { name: "robots", content: "noindex" }] }),
  component: AdminMajalis,
});

// Memoized majlis row for performance
const MajlisRow = memo(function MajlisRow({
  majlis,
  onDelete,
}: {
  majlis: { id: string; title: string; date: string; is_published: boolean };
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold sm:text-xs">
          {formatDate(majlis.date)}
        </p>
        <p className="mt-1 font-display text-lg text-ink">{majlis.title}</p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            majlis.is_published
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-amber-500/10 text-amber-600"
          }`}
        >
          {majlis.is_published ? "Published" : "Draft"}
        </span>
      </div>
      <div className="flex gap-2">
        <Link
          to="/admin/majalis/$id/edit"
          params={{ id: majlis.id }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-ink hover:border-gold hover:text-gold sm:py-1.5"
        >
          <Edit3 size={14} />
          <span className="hidden sm:inline">Edit</span>
        </Link>
        <button
          onClick={() => {
            if (confirm("Delete this majlis and all its hadiths?")) onDelete(majlis.id);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 sm:py-1.5"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </li>
  );
});

function AdminMajalis() {
  const { token } = useAuth();
  const qc = useQueryClient();

  // When navigating to a child route like /admin/majalis/$id/edit,
  // render <Outlet /> so the edit page component mounts. Hooks below still
  // run unconditionally on every render (Rules of Hooks); `enabled` gates
  // the network request rather than skipping the hook call itself.
  const { pathname } = useLocation();
  const isExactList = pathname === "/admin/majalis";

  const { data, isLoading, refetch } = useQuery({
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
    // Optimistic removal
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

  if (!isExactList) {
    return <Outlet />;
  }

  const majalis = Array.isArray(data) ? data : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">Majalis</h2>
          <button
            onClick={() => refetch()}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-ink-soft hover:border-gold hover:text-gold"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm text-parchment hover:bg-ink-soft"
        >
          {creating ? null : <Plus size={16} />}
          {creating ? "Cancel" : "New majlis"}
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <MajlisForm
          onDone={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["admin", "majalis"] });
          }}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <ul className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <li key={i} className="animate-pulse border-b border-border pb-4">
              <div className="h-3 w-24 rounded bg-ink-soft/20" />
              <div className="mt-2 h-5 w-48 rounded bg-ink-soft/20" />
              <div className="mt-2 h-4 w-16 rounded bg-ink-soft/20" />
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {!isLoading && majalis.length === 0 && (
        <div className="manuscript mt-6 flex flex-col items-center py-16 text-center">
          <BookOpen size={40} className="text-ink-soft/40" />
          <p className="mt-4 font-display text-xl text-ink">No majalis yet</p>
          <p className="mt-2 text-sm text-ink-soft">Create your first majlis to get started.</p>
        </div>
      )}

      {/* Majalis list */}
      {majalis.length > 0 && (
        <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card px-4 sm:px-6">
          {majalis.map((m) => (
            <MajlisRow key={m.id} majlis={m} onDelete={(id) => del.mutate(id)} />
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
    mutationFn: () =>
      saveMajlis({ data: { title, date, description, is_published: isPublished }, headers: authHeaders() }),
    onSuccess: () => onDone(),
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
      className="manuscript mt-4 space-y-4 p-5 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink sm:py-2"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink sm:py-2"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink sm:py-2"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4"
        />
        Publish immediately
      </label>
      {mut.error && <p className="text-sm text-destructive">Save failed. Please try again.</p>}
      <button
        disabled={mut.isPending}
        className="rounded-md bg-ink px-4 py-2.5 text-sm text-parchment hover:bg-ink-soft disabled:opacity-60 sm:py-2"
      >
        {mut.isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
