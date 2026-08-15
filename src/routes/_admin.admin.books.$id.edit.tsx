import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Library, Trash2 } from "lucide-react";
import { getBookById, deleteBook } from "@/lib/book-admin.functions";
import { authHeaders } from "@/lib/auth-store";
import { BookForm } from "@/components/app/book-form";

export const Route = createFileRoute("/_admin/admin/books/$id/edit")({
  head: () => ({ meta: [{ title: "Edit book · Admin — Bayt al-Ḥamd" }, { name: "robots", content: "noindex" }] }),
  component: EditBook,
});

function EditBook() {
  const { id } = Route.useParams();
  const { data: book, isLoading } = useQuery({
    queryKey: ["admin", "book", id],
    queryFn: () => getBookById({ data: { id }, headers: authHeaders() }),
    staleTime: 15_000,
  });

  const del = useMutation({
    mutationFn: () => deleteBook({ data: { id }, headers: authHeaders() }),
    onSuccess: () => {
      window.location.href = "/admin/books";
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded bg-ink-soft/20" />
        <div className="manuscript animate-pulse space-y-4 p-6">
          <div className="h-4 w-24 rounded bg-ink-soft/20" />
          <div className="h-40 w-32 rounded-2xl bg-ink-soft/20" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Library size={40} className="text-ink-soft/40" />
        <p className="mt-4 font-display text-xl text-ink">Book not found</p>
        <Link to="/admin/books" className="mt-4 text-sm text-gold hover:underline">
          ← Back to all books
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Link
        to="/admin/books"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={14} />
        All books
      </Link>

      <BookForm book={book} onDone={() => { window.location.href = "/admin/books"; }} />

      <div className="border-t border-destructive/30 pt-6">
        <button
          onClick={() => {
            if (confirm("Delete this book permanently?")) del.mutate();
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          <Trash2 size={14} />
          Delete book
        </button>
      </div>
    </div>
  );
}
