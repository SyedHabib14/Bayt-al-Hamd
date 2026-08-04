import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useDeferredValue, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { authHeaders, useAuth } from "@/lib/auth-store";
import { listAllZiyarat, setZiyaratPublished, deleteZiyarat, type ZiyaratRow } from "@/lib/ziyarat-admin.functions";

type Classification = "ziyarat" | "munajat";

export const Route = createFileRoute("/_admin/admin/ziyarat")({
  head: () => ({ meta: [{ title: "Ziyārat & Munājāt · Admin — Bayt al-Ḥamd" }, { name: "robots", content: "noindex" }] }),
  component: AdminZiyarat,
});

const EntryRow = memo(function EntryRow({ entry, onToggle, onDelete }: { entry: ZiyaratRow; onToggle: (entry: ZiyaratRow) => void; onDelete: (entry: ZiyaratRow) => void }) {
  return (
    <article className="manuscript paper-grain grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2"><span className="eyebrow">{entry.classification}</span><span className={`rounded-full border px-2.5 py-1 text-[11px] ${entry.is_published ? "border-gold/50 text-gold" : "border-border text-muted-foreground"}`}>{entry.is_published ? "Published" : "Draft"}</span></div>
        <h2 className="truncate text-xl text-ink">{entry.title_en}</h2><p lang="ar" className="graph-text mt-1 truncate text-lg text-ink-soft">{entry.title_ar}</p><p className="mt-2 truncate text-xs text-muted-foreground">/{entry.slug}</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onToggle(entry)} className="rounded-md border border-border px-3 py-2 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold">{entry.is_published ? "Unpublish" : "Publish"}</button>
        <Link to="/admin/ziyarat/$id/edit" params={{ id: entry.id }} className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-sm text-parchment hover:bg-ink-soft"><Edit3 className="h-4 w-4" />Edit</Link>
        <button type="button" onClick={() => { if (confirm("Delete this entry permanently?")) onDelete(entry); }} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
      </div>
    </article>
  );
});

function AdminZiyarat() {
  const { token } = useAuth(); const qc = useQueryClient(); const { pathname } = useLocation(); const exact = pathname === "/admin/ziyarat"; const [search, setSearch] = useState(""); const [kind, setKind] = useState<"all" | Classification>("all"); const deferredSearch = useDeferredValue(search);
  const query = useQuery({ queryKey: ["admin", "ziyarat"], queryFn: () => listAllZiyarat({ headers: authHeaders() }), enabled: Boolean(token) && exact, retry: false, staleTime: 30_000, placeholderData: keepPreviousData });
  const mutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => setZiyaratPublished({ data: { id, value }, headers: authHeaders() }),
    onMutate: async ({ id, value }) => { await qc.cancelQueries({ queryKey: ["admin", "ziyarat"] }); const previous = qc.getQueryData<ZiyaratRow[]>(["admin", "ziyarat"]); qc.setQueryData<ZiyaratRow[]>(["admin", "ziyarat"], old => old?.map(item => item.id === id ? { ...item, is_published: value } : item)); return { previous }; },
    onError: (_error, _variables, context) => qc.setQueryData(["admin", "ziyarat"], context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "ziyarat"] }),
  });
  const del = useMutation({
    mutationFn: (entry: ZiyaratRow) => deleteZiyarat({ data: { id: entry.id }, headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "ziyarat"] }),
  });
  const entries = useMemo(() => (query.data ?? []).filter(item => (kind === "all" || item.classification === kind) && `${item.title_en} ${item.title_ar} ${item.slug}`.toLocaleLowerCase().includes(deferredSearch.trim().toLocaleLowerCase())), [query.data, kind, deferredSearch]);
  if (!exact) return <Outlet />;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Sacred texts</p><h1 className="mt-2 text-3xl text-ink sm:text-4xl">Ziyārat & Munājāt</h1></div><div className="flex gap-2"><button type="button" onClick={() => query.refetch()} className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-ink-soft hover:border-gold hover:text-gold" aria-label="Refresh"><RefreshCw className="h-4 w-4" /></button><Link to="/admin/ziyarat/$id/edit" params={{ id: "new" }} className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-parchment hover:bg-ink-soft"><Plus className="h-4 w-4" />New</Link></div></header>
      <section className="manuscript mb-6 grid gap-3 p-3 sm:grid-cols-[1fr_auto]"><label className="flex items-center gap-2 rounded-md border border-input bg-background/60 px-3"><Search className="h-4 w-4 text-muted-foreground" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search titles or slugs" className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></label><div className="grid grid-cols-3 rounded-md border border-border bg-muted/50 p-1">{(["all", "ziyarat", "munajat"] as const).map(value => <button key={value} type="button" onClick={() => setKind(value)} className={`rounded px-3 py-2 text-xs capitalize transition-all ${kind === value ? "bg-card text-ink shadow-sm" : "text-muted-foreground hover:text-ink"}`}>{value}</button>)}</div></section>
      <div className="grid gap-4">{query.isLoading ? [0,1,2].map(item => <div key={item} className="manuscript h-32 animate-pulse bg-muted/40" />) : entries.map(entry => <EntryRow key={entry.id} entry={entry} onToggle={item => mutation.mutate({ id: item.id, value: !item.is_published })} onDelete={item => del.mutate(item)} />)}</div>
      {!query.isLoading && entries.length === 0 && <div className="manuscript mt-5 p-12 text-center"><h2 className="text-xl">No entries found</h2><p className="mt-2 text-sm text-muted-foreground">Create a new entry or adjust the filters.</p></div>}
    </main>
  );
}
