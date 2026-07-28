import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAudit } from "@/lib/admin.functions";
import { authHeaders, useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/_admin/admin/audit")({
  head: () => ({ meta: [{ title: "Audit · Admin — Bayt al-Ḥamd" }, { name: "robots", content: "noindex" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { token } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => listAudit({ headers: authHeaders() }),
    enabled: Boolean(token),
    retry: false,
  });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const rows = Array.isArray(data) ? data : [];
  const visibleRows = useMemo(() => rows.filter((r) => {
    const matchesAction = filter === "all" || r.action === filter;
    const haystack = `${r.user_cnic ?? ""} ${r.entity_type} ${r.action} ${JSON.stringify(r.details ?? {})}`.toLowerCase();
    return matchesAction && haystack.includes(search.toLowerCase());
  }), [rows, filter, search]);
  const actions = [...new Set(rows.map((r) => r.action))];
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Audit log</h2>
      <p className="text-sm text-ink-soft">Latest 200 actions.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="manuscript p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gold">Events captured</p><p className="mt-2 font-display text-3xl text-ink">{rows.length}</p></div>
        <div className="manuscript p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gold">Creates</p><p className="mt-2 font-display text-3xl text-ink">{rows.filter((r) => r.action === "create").length}</p></div>
        <div className="manuscript p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gold">Updates</p><p className="mt-2 font-display text-3xl text-ink">{rows.filter((r) => r.action === "update").length}</p></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search audit trail…" className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink">
          <option value="all">All actions</option>
          {actions.map((action) => <option key={action} value={action}>{action}</option>)}
        </select>
        <span className="self-center text-xs text-ink-soft">{visibleRows.length} events shown</span>
      </div>
      {isLoading && <p className="mt-4 text-ink-soft">Loading…</p>}
      <div className="mt-6 overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs text-ink-soft">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.user_cnic ?? "—"}</td>
                <td className="px-3 py-2 uppercase tracking-wider text-gold">{r.action}</td>
                <td className="px-3 py-2">{r.entity_type}</td>
                <td className="px-3 py-2 text-xs text-ink-soft">
                  {r.details ? JSON.stringify(r.details) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
