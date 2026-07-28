import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { deleteUser, listUsers, saveUser } from "@/lib/admin.functions";
import { authHeaders, useAuth } from "@/lib/auth-store";
import { Plus, Users, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/users")({
  head: () => ({ meta: [{ title: "Users · Admin — Bayt al-Ḥamd" }, { name: "robots", content: "noindex" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listUsers({ headers: authHeaders() }),
    enabled: user?.role === "admin",
    retry: false,
    staleTime: 30_000,
  });
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const users = Array.isArray(data) ? data : [];
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? users.filter((u) => `${u.full_name} ${u.cnic} ${u.role}`.toLowerCase().includes(q)) : users;
  }, [search, users]);
  const active = users.filter((u) => u.is_active).length;
  const admins = users.filter((u) => u.role === "admin").length;
  const del = useMutation({
    mutationFn: (id: string) => deleteUser({ data: { id }, headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  if (user?.role !== "admin") {
    return (
      <div className="manuscript p-6 text-center">
        <p className="text-sm text-ink-soft">Only administrators may manage users.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-ink sm:text-3xl">Enrolled users</h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm text-parchment hover:bg-ink-soft"
        >
          {adding ? null : <Plus size={16} />}
          {adding ? "Cancel" : "Enroll user"}
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          ["Enrolled", users.length, "All authorised identities"],
          ["Active", active, "Can sign in now"],
          ["Administrators", admins, "Full editorial access"],
          ["Other roles", users.length - admins, "Scholars and editors"],
        ].map(([label, value, hint]) => (
          <div key={label} className="manuscript p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{label}</p>
            <p className="mt-2 font-display text-3xl text-ink">{value}</p>
            <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>
          </div>
        ))}
      </div>

      {users.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, CNIC or role…"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-ink sm:max-w-sm" />
          <span className="whitespace-nowrap text-xs text-ink-soft">{filteredUsers.length} shown</span>
        </div>
      )}

      {adding && (
        <UserForm
          onDone={() => {
            setAdding(false);
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
          }}
        />
      )}

      {isLoading && (
        <ul className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <li key={i} className="animate-pulse border-b border-border pb-4">
              <div className="h-5 w-40 rounded bg-ink-soft/20" />
              <div className="mt-1 h-3 w-28 rounded bg-ink-soft/20" />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="manuscript mt-4 border-destructive/30 p-4">
          <p className="text-sm text-destructive">Failed to load users. Please try refreshing.</p>
        </div>
      )}

      {!isLoading && !error && (data ?? []).length === 0 && (
        <div className="manuscript mt-6 flex flex-col items-center py-12 text-center">
          <Users size={36} className="text-ink-soft/40" />
          <p className="mt-3 font-display text-lg text-ink">No users enrolled</p>
          <p className="mt-1 text-sm text-ink-soft">Enroll the first user to get started.</p>
        </div>
      )}

      {!isLoading && filteredUsers.length > 0 && (
        <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
          {filteredUsers.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg text-ink">{u.full_name}</p>
                <p className="mt-0.5 font-mono text-xs text-ink-soft">{u.cnic}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    u.is_active
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {u.role}{!u.is_active && " · inactive"}
                </span>
              </div>
              <button
                onClick={() => {
                  if (confirm("Remove this user?")) del.mutate(u.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 sm:py-1.5"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UserForm({ onDone }: { onDone: () => void }) {
  const [cnic, setCnic] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "scholar" | "editor">("editor");
  const mut = useMutation({
    mutationFn: () => saveUser({ headers: authHeaders(), data: {
      cnic: cnic.replace(/[-\s]/g, ""), full_name: fullName, role, is_active: true,
    } }),
    onSuccess: onDone,
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
      className="manuscript mt-4 space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-ink-soft">CNIC</label>
          <input value={cnic} onChange={(e) => setCnic(e.target.value)} required
            placeholder="13 digits"
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-ink" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-ink-soft">Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-ink" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-ink-soft">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as any)}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-ink">
            <option value="admin">admin</option>
            <option value="scholar">scholar</option>
            <option value="editor">editor</option>
          </select>
        </div>
      </div>
      {mut.error && <p className="text-sm text-destructive">Could not enroll — CNIC may already exist.</p>}
      <button disabled={mut.isPending}
        className="rounded-md bg-ink px-4 py-2 text-sm text-parchment hover:bg-ink-soft">
        {mut.isPending ? "Saving…" : "Enroll"}
      </button>
    </form>
  );
}
