import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Download, ExternalLink, ArrowLeft, Globe, FileText } from "lucide-react";
import { bookDetailQuery, useRealtimeInvalidate } from "@/lib/public-data";
import { BookCover } from "@/components/app/book-cover";
import { ShareButton } from "@/components/app/share-button";

export const Route = createFileRoute("/book/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(bookDetailQuery(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Bayt al-Ḥamd` },
          { name: "description", content: loaderData.description ?? `Read and download ${loaderData.title}.` },
        ]
      : [{ title: "Book — Bayt al-Ḥamd" }],
  }),
  component: BookDetail,
});

function BookDetail() {
  useRealtimeInvalidate();
  const { id } = Route.useParams();
  const { data: book } = useSuspenseQuery(bookDetailQuery(id));
  if (!book) return null;

  const shareUrl = typeof window !== "undefined" ? window.location.href : `/book/${id}`;

  return (
    <article className="mx-auto max-w-4xl px-6 py-16">
      <Link to="/books" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-ink-soft hover:text-ink">
        <ArrowLeft size={14} />
        All books
      </Link>

      <div className="mt-8 grid gap-8 sm:mt-10 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-12">
        <div className="mx-auto w-40 sm:mx-0 sm:w-full">
          <BookCover src={book.cover_url} title={book.title} priority />
        </div>

        <div className="min-w-0">
          {book.language && (
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{book.language}</p>
          )}
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">{book.title}</h1>
          {book.author && <p className="mt-2 text-lg text-ink-soft">{book.author}</p>}
          <div className="gold-rule mt-6 w-20" />

          {book.description && (
            <p className="mt-6 font-serif text-lg leading-relaxed text-ink">{book.description}</p>
          )}

          {book.pages && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-soft">
              <FileText size={14} />
              {book.pages} pages
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={book.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-parchment shadow-md transition-all duration-200 hover:bg-gold hover:text-accent-foreground hover:shadow-[0_8px_28px_-8px_var(--gold)] active:scale-[0.98]"
            >
              <Download size={16} />
              Download
            </a>
            <ShareButton title={book.title} text={book.description ?? undefined} url={shareUrl} />
          </div>

          {book.archive_url && (
            <a
              href={book.archive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-ink-soft hover:text-gold"
            >
              <Globe size={12} />
              View on Archive.org
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
