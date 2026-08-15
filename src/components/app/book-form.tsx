import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { UploadCloud, Loader2, ImageOff, Info } from "lucide-react";
import { saveBook, uploadBookCover } from "@/lib/book-admin.functions";
import { authHeaders } from "@/lib/auth-store";
import { BookCover } from "@/components/app/book-cover";

interface BookRow {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  download_url: string;
  archive_url: string | null;
  language: string | null;
  pages: number | null;
  is_published: boolean;
  position: number;
}

export function BookForm({ book, onDone }: { book?: BookRow; onDone: () => void }) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [description, setDescription] = useState(book?.description ?? "");
  const [downloadUrl, setDownloadUrl] = useState(book?.download_url ?? "");
  const [archiveUrl, setArchiveUrl] = useState(book?.archive_url ?? "");
  const [language, setLanguage] = useState(book?.language ?? "Arabic / English");
  const [pages, setPages] = useState(book?.pages ? String(book.pages) : "");
  const [isPublished, setIsPublished] = useState(book?.is_published ?? true);
  const [coverUrl, setCoverUrl] = useState(book?.cover_url ?? "");
  const [coverPreview, setCoverPreview] = useState<string | null>(book?.cover_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return uploadBookCover({ data: fd, headers: authHeaders() });
    },
    onSuccess: (res) => setCoverUrl(res.url),
  });

  const save = useMutation({
    mutationFn: () =>
      saveBook({
        data: {
          id: book?.id,
          title,
          author: author || null,
          description: description || null,
          cover_url: coverUrl || null,
          download_url: downloadUrl,
          archive_url: archiveUrl || null,
          language: language || null,
          pages: pages ? parseInt(pages, 10) : null,
          is_published: isPublished,
          position: book?.position ?? 0,
        },
        headers: authHeaders(),
      }),
    onSuccess: onDone,
  });

  function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    upload.mutate(file);
  }

  const descriptionCount = description.length;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="manuscript mt-4 space-y-6 p-5 sm:p-8"
    >
      <div className="flex items-center gap-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold sm:text-xs">
          {book ? "Edit book" : "New book"}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
        {/* Cover uploader */}
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">Cover image</label>
          <div className="mt-2 w-32 sm:w-full">
            <BookCover src={coverPreview} title={title || "Cover"} />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={upload.isPending}
            className="mt-3 inline-flex w-32 items-center justify-center gap-1.5 rounded-md border border-dashed border-gold/60 px-3 py-2 text-xs text-ink-soft hover:border-gold hover:text-gold disabled:opacity-60 sm:w-full"
          >
            {upload.isPending ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
            {upload.isPending ? "Uploading…" : coverUrl ? "Replace cover" : "Upload cover"}
          </button>
          {upload.error && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-destructive">
              <ImageOff size={11} />
              Upload failed. Try a JPEG/PNG under 5MB.
            </p>
          )}
          <p className="mt-1.5 flex items-start gap-1 text-[10px] leading-relaxed text-ink-soft/70">
            <Info size={11} className="mt-0.5 shrink-0" />
            Portrait orientation (2:3) looks best — e.g. 800×1200px.
          </p>
        </div>

        {/* Core fields */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ṣaḥīḥ al-Bukhārī"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 font-display text-base text-ink sm:py-2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">Author</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Imām al-Bukhārī"
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink sm:py-2"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">Language</label>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Arabic / English"
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink sm:py-2"
              />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
                Short description
              </label>
              <span className="text-[10px] text-ink-soft/60">{descriptionCount}/280</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 280))}
              rows={3}
              placeholder="A one or two sentence introduction readers will see on the library card."
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink sm:py-2"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold sm:text-xs">Distribution</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
              Download link (Archive.org direct file)
            </label>
            <input
              type="url"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              required
              placeholder="https://archive.org/download/.../book.pdf"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 font-mono text-xs text-ink sm:py-2"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
              Archive.org page (optional)
            </label>
            <input
              type="url"
              value={archiveUrl}
              onChange={(e) => setArchiveUrl(e.target.value)}
              placeholder="https://archive.org/details/..."
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 font-mono text-xs text-ink sm:py-2"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
              Pages (optional)
            </label>
            <input
              type="number"
              min={1}
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink sm:py-2"
            />
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink sm:mt-6">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4"
            />
            Published
          </label>
        </div>
      </div>

      {save.error && <p className="text-sm text-destructive">Save failed. Please check the links and try again.</p>}

      <button
        disabled={save.isPending || upload.isPending}
        className="rounded-md bg-ink px-4 py-2.5 text-sm text-parchment hover:bg-ink-soft disabled:opacity-60 sm:py-2"
      >
        {save.isPending ? "Saving…" : "Save book"}
      </button>
    </form>
  );
}
