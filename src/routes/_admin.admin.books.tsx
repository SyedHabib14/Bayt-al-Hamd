import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, memo } from "react";
import { deleteBook, listAllBooks } from "@/lib/book-admin.functions";
import { authHeaders, useAuth } from "@/lib/auth-store";
import { Plus, Trash2, Edit3, RefreshCw, Library } from "lucide-react";
import { BookCover } from "@/components/app/book-cover";
import { BookForm } from "@/components/app/book-form";

export const Route = createFileRoute("/_admin/admin/books")({
  head: () => ({ meta: [{ title: "Books · Admin — Bayt al-Ḥamd" }, { name: "robots", content: "noindex" }] }),
  component: AdminBooks,
});

const BookRow = memo(function BookRow({
  book,
  onDelete,
}: {
  book: { id: string; title: string; author: string | null; cover_url: string | null; is_published: boolean };
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-4 border-b border-border py-4 last:border-b-0">
      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md">
        <BookCover src={book.cover_url} title={book.title} className="rounded-md" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base text-ink sm:text-lg">{book.title}</p>
        {book.author && <p className="truncate text-xs text-ink-soft sm:text-sm">{book.author}</p>}
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            book.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
          }`}
        >
          {book.is_published ? "Published" : "Draft"}
        </span>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link
          to="/admin/books/$id/edit"
          params={{ id: book.id }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-ink hover:border-gold hover:text-gold sm:py-1.5"
        >
          <Edit3 size={14} />
          <span className="hidden sm:inline">Edit</span>
        </Link>
        <button
          onClick={() => {
            if (confirm("Delete this book?")) onDelete(book.id);
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

function AdminBooks() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { pathname } = useLocation();
  const isExactList = pathname === "/admin/books";

  // Hooks below must always run (Rules of Hooks) even when we're about to
  // render <Outlet /> instead of this component's own UI — so `enabled`
  // gates the network request rather than skipping the hook call itself.
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "books"],
    queryFn: () => listAllBooks({ headers: authHeaders() }),
    enabled: Boolean(token) && isExactList,
    retry: false,
    staleTime: 30_000,
  });
  const [creating, setCreating] = useState(false);

  const del = useMutation({
    mutationFn: (id: string) => deleteBook({ data: { id }, headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "books"] }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "books"] });
      const prev = qc.getQueryData<unknown[]>(["admin", "books"]);
      qc.setQueryData(["admin", "books"], (old: unknown[] | undefined) => (old ?? []).filter((b: any) => b.id !== id));
      return { prev };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData(["admin", "books"], context?.prev);
    },
  });

  if (!isExactList) return <Outlet />;

  const books = Array.isArray(data) ? data : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">Books</h2>
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
          {creating ? "Cancel" : "New book"}
        </button>
      </div>

      {creating && (
        <BookForm
          onDone={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["admin", "books"] });
          }}
        />
      )}

      {isLoading && (
        <ul className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex animate-pulse items-center gap-4 border-b border-border pb-4">
              <div className="h-16 w-12 rounded-md bg-ink-soft/20" />
              <div className="flex-1">
                <div className="h-4 w-40 rounded bg-ink-soft/20" />
                <div className="mt-2 h-3 w-24 rounded bg-ink-soft/20" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && books.length === 0 && (
        <div className="manuscript mt-6 flex flex-col items-center py-16 text-center">
          <Library size={40} className="text-ink-soft/40" />
          <p className="mt-4 font-display text-xl text-ink">No books yet</p>
          <p className="mt-2 text-sm text-ink-soft">Add the first book to the library.</p>
        </div>
      )}

      {books.length > 0 && (
        <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card px-4 sm:px-6">
          {books.map((b) => (
            <BookRow key={b.id} book={b} onDelete={(id) => del.mutate(id)} />
          ))}
        </ul>
      )}
    </div>
  );
}
