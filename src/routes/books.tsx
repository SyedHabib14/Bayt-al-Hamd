import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Download, ExternalLink, BookOpen } from "lucide-react";
import { booksQuery, useRealtimeInvalidate } from "@/lib/public-data";
import { BookCover } from "@/components/app/book-cover";
import { ShareButton } from "@/components/app/share-button";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Books — Bayt al-Ḥamd" },
      { name: "description", content: "A curated library of classical texts and hadith collections, free to read and download." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(booksQuery),
  component: BooksLibrary,
});

function BooksLibrary() {
  useRealtimeInvalidate();
  const { data: books } = useSuspenseQuery(booksQuery);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <p className="text-xs uppercase tracking-[0.35em] text-gold text-center -mb-16">The library</p>
      <h1 style={{"fontSize" : 100, "textAlign" : "center"}} className="urdu-text text-ink sm:text-10xl">کتب خانہ</h1>
      <p className="-mt-10 thin-text max-w-3xl text-center mx-auto display-6 text-ink-soft">
        A curated shelf of classical texts and ḥadīth collections.
      </p>
      <div className="gold-rule mt-8 w-24 mx-auto" />

      {books.length === 0 ? (
        <div className="manuscript relative mt-8 flex flex-col items-center overflow-hidden px-8 py-20 text-center shadow-xl">
          <div className="absolute inset-x-1/3 top-0 h-px bg-gold/60" />
          <BookOpen className="text-gold/70" size={42} strokeWidth={1.3} />
          <h2 className="mt-5 font-display text-2xl text-ink">The shelf is being prepared</h2>
          <p className="mt-2 max-w-md text-2sm leading-relaxed text-ink-soft">Our library is still awaiting its first entries. Return soon for carefully selected classical texts and ḥadīth collections.</p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-8 lg:grid-cols-4">
          {books.map((book, i) => (
            <BookCard key={book.id} book={book} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookCard({
  book,
  priority,
}: {
  book: {
    id: string;
    title: string;
    author: string | null;
    description: string | null;
    cover_url: string | null;
    download_url: string;
    archive_url: string | null;
    language: string | null;
  };
  priority?: boolean;
}) {
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/book/${book.id}` : `/book/${book.id}`;

  return (
    <div className="manuscript group flex flex-col overflow-hidden p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-4">
      <Link to="/book/$id" params={{ id: book.id }} className="block">
        <BookCover src={book.cover_url} title={book.title} priority={priority} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw" />
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        <Link to="/book/$id" params={{ id: book.id }} className="block">
          <h3 className="font-display text-base leading-snug text-ink group-hover:text-gold sm:text-lg">
            {book.title}
          </h3>
        </Link>
        {book.author && <p className="mt-1 font-semibold font-italic text-ink-soft sm:text-sm">{book.author}</p>}
        {book.description && (
          <p className="mt-2 hidden font-display text-sm leading-relaxed text-ink-soft/90 line-clamp-2 sm:block">
            {book.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <a
            href={book.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-3 py-2 text-xs font-medium text-parchment shadow-sm transition-all duration-200 hover:bg-gold hover:text-accent-foreground hover:shadow-[0_6px_20px_-6px_var(--gold)] active:scale-[0.98] sm:text-sm"
          >
            <Download size={13} />
            Download
          </a>
          <ShareButton compact title={book.title} text={book.description ?? undefined} url={shareUrl} />
        </div>
        {book.archive_url && (
          <a
            href={book.archive_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 self-start text-[10px] uppercase tracking-[0.15em] text-ink-soft/70 hover:text-gold"
          >
            <ExternalLink size={10} />
            Archive.org
          </a>
        )}
      </div>
    </div>
  );
}
