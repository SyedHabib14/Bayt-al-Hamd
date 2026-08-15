import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Edit3,
  ImagePlus,
  Link2,
  Newspaper,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { authHeaders, useAuth } from "@/lib/auth-store";
import { formatDate } from "@/lib/public-data";
import {
  deleteArticle,
  listAllArticles,
  removeArticleCover,
  saveArticle,
  uploadArticleCover,
} from "@/lib/article-admin.functions";

export const Route = createFileRoute("/_admin/admin/articles")({
  head: () => ({
    meta: [
      { title: "Articles · Admin — Bayt al-Hamd" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminArticles,
});

type ArticleRow = {
  id: string;
  title: string;
  topic: string;
  article_link: string;
  cover_image_url: string | null;
  cover_image_path: string | null;
  short_description: string | null;
  publish_date: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

const ArticleRowCard = memo(function ArticleRowCard({
  article,
  onEdit,
  onDelete,
}: {
  article: ArticleRow;
  onEdit: (article: ArticleRow) => void;
  onDelete: (article: ArticleRow) => void;
}) {
  return (
    <article className="group manuscript overflow-hidden border-border bg-card/95 transition hover:-translate-y-0.5 hover:border-gold/70 hover:shadow-lg hover:shadow-gold/10">
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div className="relative min-h-44 overflow-hidden bg-ink/10 md:min-h-full">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full min-h-44 items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(185,143,73,0.30),transparent_38%),linear-gradient(135deg,rgba(45,34,22,0.96),rgba(99,72,35,0.88))] text-parchment">
              <Newspaper className="h-10 w-10 opacity-80" />
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full border border-gold/40 bg-parchment/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-ink shadow-sm">
            {article.is_published ? "Published" : "Draft"}
          </span>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-medium text-ink">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              {article.topic}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(article.publish_date)}
            </span>
          </div>

          <div>
            <h3 className="font-serif text-xl text-ink sm:text-2xl">{article.title}</h3>
            {article.short_description && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-soft">
                {article.short_description}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2">
            <a
              href={article.article_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-ink hover:border-gold hover:text-gold"
            >
              Open link <ArrowUpRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={() => onEdit(article)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-ink hover:border-gold hover:text-gold"
            >
              <Edit3 className="h-4 w-4" /> Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this article permanently?")) onDelete(article);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

function AdminArticles() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ArticleRow | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "articles"],
    queryFn: () => listAllArticles({ headers: authHeaders() }),
    enabled: Boolean(token),
    retry: false,
    staleTime: 30_000,
  });

  const del = useMutation({
    mutationFn: (article: ArticleRow) => deleteArticle({
      data: { id: article.id, cover_image_path: article.cover_image_path },
      headers: authHeaders(),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "articles"] }),
  });

  const articles = Array.isArray(data) ? data : [];
  const publishedCount = useMemo(() => articles.filter((a) => a.is_published).length, [articles]);

  if (!token) {
    return (
      <section className="manuscript p-6 text-center">
        <p className="text-sm text-ink-soft">Please sign in to manage articles.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(185,143,73,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(45,34,22,0.10),transparent_32%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">Admin library</p>
            <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Articles</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
              Curate public articles with a polished cover image, topic, link, short description, and publish date.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-parchment/60 px-3 py-1.5 text-xs text-ink-soft">
              {publishedCount} published / {articles.length} total
            </span>
            <button
              type="button"
              onClick={() => refetch()}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-ink-soft hover:border-gold hover:text-gold"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating((v) => !v);
                setEditing(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm text-parchment hover:bg-ink-soft"
            >
              {creating ? null : <Plus className="h-4 w-4" />}
              {creating ? "Cancel" : "New article"}
            </button>
          </div>
        </div>
      </div>

      {(creating || editing) && (
        <ArticleForm
          key={editing?.id ?? "new"}
          article={editing ?? undefined}
          onDone={() => {
            setCreating(false);
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["admin", "articles"] });
          }}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {isLoading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="manuscript h-44 animate-pulse bg-card/80" />
          ))}
        </div>
      )}

      {!isLoading && articles.length === 0 && !creating && (
        <div className="manuscript p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <Newspaper className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-serif text-2xl text-ink">No articles yet</h2>
          <p className="mt-2 text-sm text-ink-soft">Create the first article card for the public page.</p>
        </div>
      )}

      {articles.length > 0 && (
        <div className="grid gap-4">
          {articles.map((article) => (
            <ArticleRowCard
              key={article.id}
              article={article}
              onEdit={(item) => {
                setEditing(item);
                setCreating(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onDelete={(item) => del.mutate(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read cover image."));
    reader.readAsDataURL(file);
  });
}

function ArticleForm({
  article,
  onDone,
  onCancel,
}: {
  article?: ArticleRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [topic, setTopic] = useState(article?.topic ?? "");
  const [articleLink, setArticleLink] = useState(article?.article_link ?? "");
  const [shortDescription, setShortDescription] = useState(article?.short_description ?? "");
  const [publishDate, setPublishDate] = useState(article?.publish_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [isPublished, setIsPublished] = useState(article?.is_published ?? false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(article?.cover_image_url ?? null);

  const mut = useMutation({
    mutationFn: async () => {
      let nextCoverUrl = article?.cover_image_url ?? null;
      let nextCoverPath = article?.cover_image_path ?? null;
      const previousCoverPath = nextCoverPath;

      if (coverFile) {
        const contentType = coverFile.type as "image/jpeg" | "image/png" | "image/webp" | "image/avif";
        if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(contentType)) {
          throw new Error("Please choose a JPG, PNG, WebP, or AVIF image.");
        }
        const uploaded = await uploadArticleCover({
          data: { base64: await fileToDataUrl(coverFile), content_type: contentType },
          headers: authHeaders(),
        });
        nextCoverUrl = uploaded.publicUrl;
        nextCoverPath = uploaded.path;
      }

      const saved = await saveArticle({
        data: {
          id: article?.id,
          title: title.trim(),
          topic: topic.trim(),
          article_link: articleLink.trim(),
          cover_image_url: nextCoverUrl,
          cover_image_path: nextCoverPath,
          short_description: shortDescription.trim() || null,
          publish_date: publishDate,
          is_published: isPublished,
        },
        headers: authHeaders(),
      });
      if (coverFile && previousCoverPath && previousCoverPath !== nextCoverPath) {
        await removeArticleCover({ data: { path: previousCoverPath }, headers: authHeaders() });
      }
      return saved;
    },
    onSuccess: onDone,
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mut.mutate();
      }}
      className="manuscript space-y-5 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            {article ? "Edit article" : "New article"}
          </p>
          <h2 className="mt-1 font-serif text-2xl text-ink">Article details</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="self-start rounded-md border border-border px-3 py-2 text-sm text-ink-soft hover:border-gold hover:text-gold"
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <label className="block text-sm text-ink">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/20"
              placeholder="A thoughtful title for the article"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-ink">
              Topic
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                required
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/20"
                placeholder="Aqidah, Seerah, Reflections..."
              />
            </label>

            <label className="block text-sm text-ink">
              Publish date
              <input
                type="date"
                value={publishDate}
                onChange={(event) => setPublishDate(event.target.value)}
                required
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </label>
          </div>

          <label className="block text-sm text-ink">
            Article link
            <div className="relative mt-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                type="url"
                value={articleLink}
                onChange={(event) => setArticleLink(event.target.value)}
                required
                className="w-full rounded-md border border-border bg-card py-2.5 pl-10 pr-3 text-sm text-ink shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/20"
                placeholder="https://..."
              />
            </div>
          </label>

          <label className="block text-sm text-ink">
            Short description
            <textarea
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
              rows={4}
              maxLength={240}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm leading-6 text-ink shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/20"
              placeholder="A concise invitation that makes readers want to open the article."
            />
            <span className="mt-1 block text-xs text-ink-soft">{shortDescription.length}/240 characters</span>
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
              className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
            />
            Publish on the public articles page
          </label>
        </div>

        <div className="rounded-xl border border-border bg-parchment/50 p-3">
          <label className="group flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gold/50 bg-card text-center transition hover:border-gold hover:bg-gold/5">
            {coverPreview ? (
              <img src={coverPreview} alt="Article cover preview" className="h-72 w-full object-cover" />
            ) : (
              <div className="p-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                  <ImagePlus className="h-7 w-7" />
                </div>
                <p className="mt-4 font-serif text-lg text-ink">Cover picture</p>
                <p className="mt-2 text-xs leading-5 text-ink-soft">
                  Upload a warm, editorial image. It will be stored in Supabase Storage.
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setCoverFile(file);
                if (file) setCoverPreview(URL.createObjectURL(file));
              }}
            />
          </label>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <UploadCloud className="h-3.5 w-3.5" /> Supabase bucket: article-covers
          </p>
        </div>
      </div>

      {mut.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Save failed. Check the articles table, storage bucket, and Supabase permissions.
        </p>
      )}

      <button
        type="submit"
        disabled={mut.isPending}
        className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm text-parchment hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {mut.isPending ? "Saving..." : article ? "Save changes" : isPublished ? "Publish article" : "Save draft"}
      </button>
    </form>
  );
}
