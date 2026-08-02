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
        content:
          "Published articles, reflections, and reading links from Bayt al-Hamd.",
      },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(articlesQuery),
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
    .select(
      "id,title,topic,article_link,cover_image_url,short_description,publish_date",
    )
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

  const topics = useMemo(
    () =>
      Array.from(new Set(articles.map((article) => article.topic))).slice(0, 8),
    [articles],
  );

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-stone-50 text-stone-900 selection:bg-amber-200/70 dark:bg-stone-950 dark:text-stone-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 opacity-70 [background-image:radial-gradient(circle_at_1px_1px,rgba(120,113,108,0.16)_1px,transparent_0)] [background-size:24px_24px] dark:opacity-25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.16),transparent_58%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(180,83,9,0.16),transparent_58%)]"
      />

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16 lg:px-8 lg:pb-28">
        <header className="relative overflow-hidden rounded-[2rem] border border-amber-900/10 bg-white/75 px-6 py-10 shadow-[0_30px_90px_-45px_rgba(120,53,15,0.4)] backdrop-blur-xl sm:px-10 sm:py-14 lg:px-16 lg:py-20 dark:border-amber-200/10 dark:bg-stone-900/70">
          <div className="absolute -right-24 -top-24 size-72 rounded-full border border-amber-700/10" />
          <div className="absolute -right-12 -top-12 size-48 rounded-full border border-amber-700/10" />
          <div className="relative max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-700/20 bg-amber-50/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 dark:border-amber-300/15 dark:bg-amber-400/10 dark:text-amber-200">
              <Feather className="size-3.5" aria-hidden="true" />
              The written archive
            </div>

            <h1 className="font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-7xl">
              Articles
              <span className="ml-3 inline-block text-amber-700 dark:text-amber-400">.</span>
            </h1>
            <p className="mt-5 max-w-2xl thin-text leading-8 text-stone-600 sm:text-xl dark:text-stone-300">
              Carefully gathered reflections, reading links, and study notes,
              presented with the warm manuscript character of Bayt al-Hamd.
            </p>

            {topics.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2" aria-label="Article topics">
                {topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-stone-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm dark:border-stone-700 dark:bg-stone-800/70 dark:text-stone-200"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {featured && (
          <article className="group relative mt-8 overflow-hidden rounded-[2rem] border border-amber-900/10 bg-stone-900 shadow-2xl shadow-amber-950/15 dark:border-amber-100/10 sm:mt-10">
            <a
              href={featured.article_link}
              target="_blank"
              rel="noreferrer"
              className="grid min-h-[34rem] lg:grid-cols-[1.15fr_0.85fr]"
              aria-label={`Read featured article: ${featured.title}`}
            >
              <div className="relative min-h-72 overflow-hidden lg:min-h-full">
                {featured.cover_image_url ? (
                  <img
                    src={featured.cover_image_url}
                    alt=""
                    className="absolute inset-0 size-full object-cover transition duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-amber-800 via-stone-900 to-emerald-950">
                    <BookOpen className="size-20 text-amber-100/60" strokeWidth={1} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/15 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-stone-950/50" />
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-stone-950/45 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 backdrop-blur-md sm:left-7 sm:top-7">
                  <Sparkles className="size-3.5" />
                  Featured
                </div>
              </div>

              <div className="relative flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                  <span>{featured.topic}</span>
                  <span className="size-1 rounded-full bg-amber-300/50" />
                  <span className="inline-flex items-center gap-1.5 text-stone-300">
                    <CalendarDays className="size-3.5" />
                    {formatDate(featured.publish_date)}
                  </span>
                </div>

                <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight text-white text-balance sm:text-4xl lg:text-5xl">
                  {featured.title}
                </h2>

                {featured.short_description && (
                  <p className="mt-5 line-clamp-4 text-base leading-7 text-stone-300 sm:text-lg">
                    {featured.short_description}
                  </p>
                )}

                <span className="mt-8 inline-flex w-fit items-center gap-2 border-b border-amber-300/40 pb-1.5 text-sm font-semibold text-amber-200 transition group-hover:border-amber-200 group-hover:text-white">
                  Read featured article
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </a>
          </article>
        )}

        {rest.length > 0 && (
          <section className="mt-14 sm:mt-20" aria-labelledby="latest-articles">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-400">
                  Continue reading
                </p>
                <h2 id="latest-articles" className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                  From the archive
                </h2>
              </div>
              <Newspaper className="hidden size-8 text-amber-800/35 sm:block dark:text-amber-300/35" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {rest.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {articles.length === 0 && (
          <section className="mt-10 rounded-[2rem] border border-dashed border-amber-800/25 bg-white/60 px-6 py-16 text-center backdrop-blur-sm dark:border-amber-200/15 dark:bg-stone-900/50">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
              <BookOpen className="size-7" />
            </span>
            <h2 className="mt-5 font-serif text-2xl font-semibold">No articles published yet</h2>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-stone-600 dark:text-stone-400">
              Once an article is published from the admin page, it will appear here with its cover, topic, date, and reading link.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

function ArticleCard({ article }: { article: ArticleRow }) {
  return (
    <article className="group relative flex min-h-full flex-col overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-white/85 shadow-[0_18px_55px_-35px_rgba(120,53,15,0.5)] transition duration-300 hover:-translate-y-1.5 hover:border-amber-700/25 hover:shadow-[0_28px_70px_-35px_rgba(120,53,15,0.55)] dark:border-stone-800 dark:bg-stone-900/80 dark:hover:border-amber-300/20">
      <a
        href={article.article_link}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-full flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-4 dark:focus-visible:ring-amber-400 dark:focus-visible:ring-offset-stone-950"
        aria-label={`Read article: ${article.title}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-amber-100 via-stone-100 to-emerald-100 dark:from-amber-950 dark:via-stone-900 dark:to-emerald-950">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt=""
              loading="lazy"
              className="size-full object-cover transition duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="grid size-full place-items-center">
              <Feather className="size-12 text-amber-800/40 dark:text-amber-200/40" strokeWidth={1.25} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/45 via-transparent to-transparent" />
          <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-stone-950/50 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-amber-100 backdrop-blur-md">
            {article.topic}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
            <CalendarDays className="size-3.5 text-amber-700 dark:text-amber-400" />
            {formatDate(article.publish_date)}
          </div>

          <h3 className="mt-4 font-serif text-2xl font-semibold leading-snug text-stone-900 transition-colors group-hover:text-amber-900 dark:text-stone-100 dark:group-hover:text-amber-200">
            {article.title}
          </h3>

          {article.short_description && (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600 dark:text-stone-400">
              {article.short_description}
            </p>
          )}

          <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-amber-800 dark:text-amber-300">
            Read article
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </a>
    </article>
  );
}