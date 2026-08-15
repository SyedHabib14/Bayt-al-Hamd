

import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useState } from "react";
import {
  BookOpen,
  Check,
  Edit3,
  Library,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { deleteBook, listAllBooks } from "@/lib/book-admin.functions";
import { authHeaders, useAuth } from "@/lib/auth-store";
import { BookCover } from "@/components/app/book-cover";
import { BookForm } from "@/components/app/book-form";

export const Route = createFileRoute("/_admin/admin/books")({
  head: () => ({
    meta: [
      { title: "Books · Admin — Bayt al-Ḥamd" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBooks,
});

type BookRowData = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  is_published: boolean;
};

const BookRow = memo(function BookRow({
  book,
  onDelete,
  deleting,
}: {
  book: BookRowData;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <li className="manuscript group rounded-[1.35rem] border border-white/40 bg-card/60 p-3 shadow-[0_16px_45px_-35px_rgba(58,42,15,.72)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-card/75 dark:border-white/10 dark:bg-[#131b18]/65 dark:hover:bg-[#17211d]/75 sm:p-5">
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
        <div className="h-24 w-[4.5rem] overflow-hidden rounded-xl border border-gold/15 bg-secondary shadow-[0_12px_30px_-20px_rgba(0,0,0,.75)] sm:h-[7.5rem] sm:w-[5.5rem] sm:rounded-2xl">
          <BookCover src={book.cover_url} title={book.title} className="h-full w-full rounded-xl object-cover sm:rounded-2xl" />
        </div>

        <div className="min-w-0 self-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider backdrop-blur-md ${book.is_published ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
              {book.is_published ? <Check size={11} strokeWidth={2.2} /> : <Edit3 size={11} />}
              {book.is_published ? "Published" : "Draft"}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 font-display text-lg leading-snug text-ink dark:text-[#f3ecdd] sm:text-xl">{book.title}</p>
          {book.author && <p className="mt-1 line-clamp-1 text-xs text-ink-soft dark:text-[#979c95] sm:text-sm">{book.author}</p>}
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:flex sm:shrink-0">
          <Link
            to="/admin/books/$id/edit"
            params={{ id: book.id }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card/45 px-4 text-sm text-ink shadow-sm backdrop-blur-xl transition hover:border-gold hover:bg-gold/[0.06] hover:text-gold focus:outline-none focus:ring-4 focus:ring-gold/10 dark:border-white/10 dark:text-[#eee7d9]"
          >
            <Edit3 size={18} strokeWidth={1.7} /> Edit
          </Link>
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (confirm("Delete this book?")) onDelete(book.id);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-destructive/25 bg-destructive/[0.05] px-4 text-sm text-destructive backdrop-blur-xl transition hover:border-destructive/45 hover:bg-destructive/10 focus:outline-none focus:ring-4 focus:ring-destructive/10 disabled:cursor-wait disabled:opacity-50"
          >
            {deleting ? <LoaderCircle size={18} className="animate-spin" /> : <Trash2 size={18} strokeWidth={1.7} />}
            Delete
          </button>
        </div>
      </div>
    </li>
  );
});

function AdminBooks() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { pathname } = useLocation();
  const isExactList = pathname === "/admin/books";

  const { data, isLoading, isFetching, refetch } = useQuery({
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
      qc.setQueryData(["admin", "books"], (old: unknown[] | undefined) =>
        (old ?? []).filter((book: any) => book.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData(["admin", "books"], context?.prev);
    },
  });

  if (!isExactList) return <Outlet />;

  const books = Array.isArray(data) ? data : [];
  const published = books.filter((book) => book.is_published).length;
  const drafts = books.length - published;

  return (
    <div className="relative isolate space-y-4 sm:space-y-6">
      <div className="pointer-events-none absolute -left-28 top-12 -z-10 size-80 rounded-full bg-gold/12 blur-[100px] dark:bg-gold/8" />
      <div className="pointer-events-none absolute -right-24 top-[34rem] -z-10 size-80 rounded-full bg-sky-600/10 blur-[100px]" />

      <header className="manuscript rounded-[1.6rem] border border-white/20 bg-[#173d31]/90 px-5 py-6 text-[#f8f1e2] shadow-[0_24px_70px_-38px_rgba(23,61,49,.95)] backdrop-blur-2xl sm:rounded-[2rem] sm:px-8 sm:py-9 lg:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-[#d8bf7d]">
              <span className="grid size-11 place-items-center rounded-2xl border border-[#d8bf7d]/25 bg-white/[0.07] shadow-lg backdrop-blur-xl sm:size-12">
                <Library size={24} strokeWidth={1.5} />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] sm:text-xs">Library archive</p>
            </div>
            <h1 className="mt-5 font-display text-3xl tracking-[-0.025em] text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">Books</h1>
            <p className="mt-3 max-w-xl thin-text text-xl leading-6 text-slate-700 dark:text-[#fff7e6]/95">Curate volumes, maintain publication status, and manage the library collection.</p>
          </div>

          <div className="grid grid-cols-[3.25rem_1fr] gap-2 sm:flex">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl border border-slate-300/80 bg-slate-900/5 px-3 text-xl thin-text text-slate-800 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-900/10 focus:outline-none focus:ring-4 focus:ring-slate-400/20 disabled:cursor-wait disabled:opacity-60 dark:border-[#d8bf7d]/30 dark:bg-white/[0.08] dark:text-[#f8f1e2] dark:hover:border-[#d8bf7d]/60 dark:hover:bg-white/[0.13] dark:focus:ring-[#d8bf7d]/15"
              aria-label="Refresh books"
            >
              <RefreshCw size={20} strokeWidth={1.7} className={isFetching ? "animate-spin" : ""} />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setCreating((value) => !value)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#d0b66f] px-3 text-lg thin-text text-[#111713] shadow-[0_15px_35px_-20px_rgba(216,191,125,.9)] transition hover:-translate-y-0.5 hover:bg-[#ddc785] focus:outline-none focus:ring-4 focus:ring-[#d8bf7d]/20"
            >
              {creating ? <X size={20} /> : <Plus size={20} />}
              {creating ? "Cancel" : "New Book"}
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2.5 sm:gap-4" aria-label="Book summary">
        {([
          ["All books", books.length, Library, "bg-gold/15"],
          ["Published", published, Check, "bg-emerald-500/15"],
          ["Drafts", drafts, Edit3, "bg-amber-500/15"],
        ] as const satisfies readonly [string, number, LucideIcon, string][]).map(([label, value, Icon, accent]) => (
          <div key={String(label)} className="manuscript flex min-w-0 flex-col items-center rounded-[1.2rem] border border-white/40 bg-card/55 p-3 text-center shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#131b18]/60 sm:flex-row sm:gap-4 sm:rounded-[1.35rem] sm:p-5 sm:text-left">
            <div className={`grid size-10 shrink-0 place-items-center rounded-xl sm:size-12 ${accent}`}>
              <Icon size={20} strokeWidth={1.6} className="text-ink dark:text-[#eee7d9]" />
            </div>
            <div className="mt-2 min-w-0 sm:mt-0">
              <p className="font-display text-2xl text-ink dark:text-[#f3ecdd] sm:text-3xl">{value}</p>
              <p className="truncate text-[8px] uppercase tracking-[0.12em] text-ink-soft sm:text-[10px] sm:tracking-[0.17em]">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {creating && (
        <div className="manuscript relative isolate overflow-hidden rounded-[1.5rem] border border-white/55 bg-card/70 p-4 shadow-[0_24px_70px_-38px_rgba(58,42,15,.8)] backdrop-blur-[28px] supports-[backdrop-filter]:bg-card/55 dark:border-white/10 dark:bg-[#131b18]/75 dark:supports-[backdrop-filter]:bg-[#131b18]/60 sm:p-7 [&_h1]:text-ink [&_h2]:text-ink [&_h3]:text-ink [&_h4]:text-ink [&_p]:text-ink-soft [&_label]:text-ink [&_legend]:text-ink [&_input]:border-border [&_input]:bg-background/65 [&_input]:text-ink [&_input]:backdrop-blur-xl [&_textarea]:border-border [&_textarea]:bg-background/65 [&_textarea]:text-ink [&_textarea]:backdrop-blur-xl [&_select]:border-border [&_select]:bg-background/65 [&_select]:text-ink dark:[&_h1]:text-[#f3ecdd] dark:[&_h2]:text-[#f3ecdd] dark:[&_h3]:text-[#f3ecdd] dark:[&_h4]:text-[#f3ecdd] dark:[&_p]:text-[#b9b6ad] dark:[&_label]:text-[#eee7d9] dark:[&_legend]:text-[#eee7d9] dark:[&_input]:border-white/10 dark:[&_input]:bg-black/20 dark:[&_input]:text-[#f3ecdd] dark:[&_textarea]:border-white/10 dark:[&_textarea]:bg-black/20 dark:[&_textarea]:text-[#f3ecdd] dark:[&_select]:border-white/10 dark:[&_select]:bg-black/20 dark:[&_select]:text-[#f3ecdd]">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-white/20 backdrop-blur-3xl dark:bg-white/[0.025]" />
          <div className="mb-5 flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-gold/10 text-gold"><BookOpen size={24} strokeWidth={1.5} /></div>
            <div><p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-gold">New library entry</p><h2 className="mt-1 font-display text-xl text-ink dark:text-[#f3ecdd] sm:text-2xl">Add a book</h2></div>
          </div>
          <BookForm
            onDone={() => {
              setCreating(false);
              qc.invalidateQueries({ queryKey: ["admin", "books"] });
            }}
          />
        </div>
      )}

      {isLoading && (
        <ul className="space-y-3" aria-label="Loading books">
          {[1, 2, 3].map((item) => (
            <li key={item} className="manuscript animate-pulse rounded-[1.35rem] border border-white/35 bg-card/50 p-3 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
              <div className="flex gap-4"><div className="h-24 w-[4.5rem] rounded-xl bg-ink-soft/15 sm:h-[7.5rem] sm:w-[5.5rem]" /><div className="flex-1 py-2"><div className="h-3 w-20 rounded bg-ink-soft/15" /><div className="mt-4 h-6 max-w-sm rounded bg-ink-soft/15" /><div className="mt-3 h-3 w-28 rounded bg-ink-soft/15" /></div></div>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && books.length === 0 && (
        <div className="manuscript rounded-[1.5rem] border border-white/40 bg-card/55 px-5 py-14 text-center shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-[#131b18]/60 sm:rounded-[1.75rem] sm:py-16">
          <div className="mx-auto grid size-20 place-items-center rounded-[1.5rem] border border-gold/20 bg-gold/10 shadow-lg backdrop-blur-xl">
            <Library size={38} strokeWidth={1.35} className="text-gold" />
          </div>
          <p className="mt-6 font-display text-2xl text-ink dark:text-[#f3ecdd]">No books yet</p>
          <p className="mt-2 text-sm text-ink-soft">Add the first book to begin the library.</p>
        </div>
      )}

      {!isLoading && books.length > 0 && (
        <ul className="space-y-3">
          {books.map((book) => (
            <BookRow
              key={book.id}
              book={book}
              deleting={del.isPending && del.variables === book.id}
              onDelete={(id) => del.mutate(id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
