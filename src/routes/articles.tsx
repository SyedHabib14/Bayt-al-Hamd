import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Feather,
  Newspaper,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/public-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "Articles — Bayt al-Hamd" },
      {
        name: "description",
        content: "Published articles, reflections, and reading links from Bayt al-Hamd.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(articlesQuery),
  component: ArticlesPage,
});

const ARTICLES_TABLE = "articles";

type ArticleRow = {
  id: string;
  title: string;
  topic: string;
  article_link: string;
  cover_image_url: string | null;
  short_description: string | null;
  publish_date: string;
};

async function listPublishedArticles() {
  const { data, error } = await supabase
    .from(ARTICLES_TABLE)
    .select("id,title,topic,article_link,cover_image_url,short_description,publish_date")
    .eq("is_published", true)
    .order("publish_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ArticleRow[];
}

const articlesQuery = {
  queryKey: ["public", "articles"],
  queryFn: listPublishedArticles,
  staleTime: 60_000,
};

function ArticlesPage() {
  const { data } = useSuspenseQuery(articlesQuery);
  const articles = data ?? [];
  const featured = articles[0];
  const rest = featured ? articles.slice(1) : articles;
  const topics = useMemo(() => Array.from(new Set(articles.map((article) => article.topic))).slice(0, 8), [articles]);

  return (
    <main className="space-y-10 pb-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-5 py-10 shadow-sm sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(185,143,73,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(45,34,22,0.12),transparent_30%)]" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border border-gold/20" />
        <div className="pointer-events-none absolute -bottom-24 left-16 h-64 w-64 rounded-full border border-gold/10" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold shadow-sm">
            <Feather className="h-7 w-7" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.36em] text-gold">The written archive</p>
          <h1 className="mt-3 font-serif text-4xl text-ink sm:text-5xl lg:text-6xl">Articles</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
            Carefully gathered reflections, reading links, and study notes presented with the same warm manuscript character as the rest of Bayt al-Hamd.
          </p>

          {topics.length > 0 && (
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-gold/30 bg-parchment/70 px-3 py-1.5 text-xs font-medium text-ink shadow-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {featured && (
        <section className="manuscript group overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <a
              href={featured.article_link}
              target="_blank"
              rel="noreferrer"
              className="relative block min-h-[24rem] overflow-hidden bg-ink/10"
              aria-label={`Read ${featured.title}`}
            >
              {featured.cover_image_url ? (
                <img
                  src={featured.cover_image_url}
                  alt={featured.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full min-h-[24rem] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(185,143,73,0.30),transparent_36%),linear-gradient(135deg,rgba(45,34,22,0.96),rgba(99,72,35,0.88))] text-parchment">
                  <Newspaper className="h-16 w-16 opacity-80" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/55 to-transparent" />
              <span className="absolute left-5 top-5 rounded-full border border-gold/40 bg-parchment/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink shadow-sm">
                Featured
              </span>
            </a>

            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-medium text-ink">
                  <Sparkles className="h-3.5 w-3.5 text-gold" />
                  {featured.topic}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(featured.publish_date)}
                </span>
              </div>

              <h2 className="mt-5 font-serif text-3xl leading-tight text-ink sm:text-4xl">
                {featured.title}
              </h2>
              {featured.short_description && (
                <p className="mt-4 text-sm leading-7 text-ink-soft sm:text-base">
                  {featured.short_description}
                </p>
              )}
              <a
                href={featured.article_link}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm text-parchment hover:bg-ink-soft"
              >
                Read featured article <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rest.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </section>
      )}

      {articles.length === 0 && (
        <section className="manuscript p-8 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <BookOpen className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-serif text-2xl text-ink">No articles published yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
            Once an article is published from the admin page, it will appear here with its cover, topic, date, and reading link.
          </p>
        </section>
      )}
    </main>
  );
}

function ArticleCard({ article }: { article: ArticleRow }) {
  return (
    <article className="group manuscript overflow-hidden p-0 transition hover:-translate-y-1 hover:border-gold/70 hover:shadow-lg hover:shadow-gold/10">
      <a href={article.article_link} target="_blank" rel="noreferrer" className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-ink/10">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(185,143,73,0.28),transparent_38%),linear-gradient(135deg,rgba(45,34,22,0.96),rgba(99,72,35,0.88))] text-parchment">
              <Newspaper className="h-12 w-12 opacity-80" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/50 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full border border-gold/40 bg-parchment/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-ink shadow-sm">
            {article.topic}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(article.publish_date)}
          </div>
          <h3 className="mt-3 font-serif text-2xl leading-tight text-ink group-hover:text-gold">
            {article.title}
          </h3>
          {article.short_description && (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-soft">
              {article.short_description}
            </p>
          )}
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink group-hover:text-gold">
            Read article <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </a>
    </article>
  );
}
