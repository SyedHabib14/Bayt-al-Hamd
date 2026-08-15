import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, ScrollText, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { authHeaders, useAuth } from "@/lib/auth-store";
import { getZiyaratById, saveZiyarat, deleteZiyarat } from "@/lib/ziyarat-admin.functions";

type Classification = "ziyarat" | "munajat";
type FormState = { title_ar: string; title_en: string; content_ar: string; content_en: string; classification: Classification; slug: string; is_published: boolean };
const empty: FormState = { title_ar: "", title_en: "", content_ar: "", content_en: "", classification: "ziyarat", slug: "", is_published: false };
const slugify = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const Route = createFileRoute("/_admin/admin/ziyarat/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Ziyārat · Admin — Bayt al-Ḥamd" }, { name: "robots", content: "noindex" }] }),
  component: EditZiyarat,
});

function EditZiyarat() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { token } = useAuth();
  const creating = id === "new";
  const [values, setValues] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [slugEdited, setSlugEdited] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const query = useQuery({
    queryKey: ["admin", "ziyarat", id],
    queryFn: () => getZiyaratById({ data: { id }, headers: authHeaders() }),
    enabled: Boolean(token) && !creating,
    retry: false,
    staleTime: 15_000,
  });
  useEffect(() => {
    if (query.data) {
      const row = query.data as unknown as FormState & { id: string };
      setValues({ title_ar: row.title_ar, title_en: row.title_en, content_ar: row.content_ar, content_en: row.content_en, classification: row.classification, slug: row.slug, is_published: row.is_published });
      setSlugEdited(true);
    }
  }, [query.data]);
  const allowed = useMemo(() => Boolean(token), [token]);

  const mutation = useMutation({
    mutationFn: (values: FormState) => saveZiyarat({ data: { ...values, slug: slugify(values.slug) }, headers: authHeaders() }),
    onSuccess: async result => {
      await qc.invalidateQueries({ queryKey: ["admin", "ziyarat"] });
      setNotice({ tone: "ok", text: "Saved successfully" });
      if (creating && result?.id) navigate({ to: "/admin/ziyarat/$id/edit", params: { id: result.id }, replace: true });
    },
    onError: error => setNotice({ tone: "error", text: error instanceof Error ? error.message : "Unable to save" }),
  });

  const del = useMutation({
    mutationFn: () => deleteZiyarat({ data: { id }, headers: authHeaders() }),
    onSuccess: () => { window.location.href = "/admin/ziyarat"; },
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues(current => ({ ...current, [key]: value, ...(key === "title_en" && !slugEdited ? { slug: slugify(String(value)) } : {}) }));
    setErrors(current => ({ ...current, [key]: undefined }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!values.title_ar.trim()) next.title_ar = "Arabic title is required";
    if (!values.title_en.trim()) next.title_en = "English title is required";
    if (!values.content_ar.trim()) next.content_ar = "Arabic content is required";
    if (!values.content_en.trim()) next.content_en = "English translation is required";
    if (!values.slug.trim()) next.slug = "Slug is required";
    setErrors(next);
    if (Object.keys(next).length === 0) mutation.mutate(values);
  };

  if (!allowed) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="manuscript p-10 text-center">
          <h1 className="text-2xl">Access restricted</h1>
        </div>
      </main>
    );
  }

  if (!creating && query.isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="manuscript paper-grain h-[32rem] animate-pulse bg-muted/40" />
      </main>
    );
  }

  if (!creating && !query.data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="manuscript p-10 text-center">
          <h1 className="text-2xl">Entry not found</h1>
          <Link to="/admin/ziyarat" className="mt-4 inline-block text-sm text-gold hover:underline">← Back to all entries</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <Link to="/admin/ziyarat" className="group mb-6 inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-gold">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        All entries
      </Link>

      <form onSubmit={submit} className="manuscript paper-grain relative overflow-hidden">
        {/* colophon header */}
        <header className="relative border-b border-border px-6 py-7 sm:px-10 sm:py-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow flex items-center gap-2 text-gold">
                <ScrollText className="h-3.5 w-3.5" />
                {creating ? "New entry to the collection" : `Folio · ${values.classification === "ziyarat" ? "Ziyārat" : "Munājāt"}`}
              </p>
              <h1 className="mt-2 text-3xl leading-tight text-ink sm:text-4xl">
                {creating ? "Set down a new text" : values.title_en || "Untitled"}
              </h1>
              {!creating && values.title_ar && (
                <p dir="rtl" lang="ar" className="graph-text mt-1 text-xl text-ink-soft">{values.title_ar}</p>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-full border border-border bg-muted/40 py-2 pl-4 pr-2 text-sm transition-colors hover:border-gold/60">
              <span className="font-medium text-ink-soft">{values.is_published ? "Published" : "Draft"}</span>
              <span className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors" style={{ backgroundColor: values.is_published ? "var(--gold, #b8923f)" : "var(--border, #d8d0c0)" }}>
                <input type="checkbox" checked={values.is_published} onChange={e => update("is_published", e.target.checked)} className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                <span className={`inline-block h-4 w-4 transform rounded-full bg-parchment shadow transition-transform ${values.is_published ? "translate-x-4.5" : "translate-x-0.5"}`} />
              </span>
            </label>
          </div>
        </header>

        {/* title + meta row */}
        <div className="grid gap-6 border-b border-border/70 px-6 py-7 sm:grid-cols-2 sm:px-10 sm:py-8">
          <Field label="Title" hint="English" lang="en" error={errors.title_en}>
            <input
              value={values.title_en}
              onChange={e => update("title_en", e.target.value)}
              placeholder="e.g. Ziyārat al-ʿĀshūrāʾ"
              className="input w-full rounded-2xl border border-zinc-300/80 bg-white/50 px-4 py-2 text-zinc-900 shadow-sm backdrop-blur-sm transition-all duration-200 placeholder:text-zinc-400 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700/80 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400/50 dark:focus:ring-emerald-400/20"
            />
          </Field>
          <Field label="العنوان" hint="Arabic" lang="ar" error={errors.title_ar}>
            <input
              dir="rtl"
              lang="ar"
              value={values.title_ar}
              onChange={e => update("title_ar", e.target.value)}
              placeholder="عنوان الزيارة"
              className="input graph-text w-full rounded-2xl border border-zinc-300/80 bg-white/50 px-4 py-2 text-lg text-zinc-900 shadow-sm backdrop-blur-sm transition-all duration-200 placeholder:text-zinc-400 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700/80 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400/50 dark:focus:ring-emerald-400/20"
            />
          </Field>

          <Field label="Slug" hint="URL path" error={errors.slug}>
            <div className="flex items-center overflow-hidden rounded-md border border-border bg-background/60 focus-within:border-gold">
              <span className="select-none border-r border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">/texts/</span>
              <input value={values.slug} onChange={e => { setSlugEdited(true); update("slug", e.target.value); }} className="w-full bg-transparent px-3 py-2 text-sm text-ink outline-none" />
            </div>
          </Field>
          <Field label="Classification" hint="Category of text">
            <div className="flex gap-2">
              {(["ziyarat", "munajat"] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update("classification", option)}
                  className={`flex-1 rounded-md border px-4 py-2 text-sm capitalize transition-colors ${
                    values.classification === option
                      ? "border-gold bg-gold/10 text-ink font-medium"
                      : "border-border text-ink-soft hover:border-gold/50"
                  }`}
                >
                  {option === "ziyarat" ? "Ziyārat" : "Munājāt"}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* facing folios: the signature element */}
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <p className="eyebrow mb-5 text-ink-soft">The text</p>
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-0">
            <div className="lg:pr-8">
              <Field label="النص" hint="Arabic" lang="ar" error={errors.content_ar}>
                <textarea
                  dir="rtl"
                  lang="ar"
                  rows={16}
                  value={values.content_ar}
                  onChange={e => update("content_ar", e.target.value)}
                  placeholder="اكتب النص هنا…"
                  className="input graph-text min-h-[26rem] resize-y text-xl leading-loose"
                />
              </Field>
            </div>

            {/* stitched seam divider */}
            <div className="relative hidden lg:flex lg:flex-col lg:items-center">
              <div className="h-full w-px bg-gradient-to-b from-transparent via-border to-transparent" />
              <span className="absolute top-1/2 flex h-6 w-6 -translate-y-1/2 rotate-45 items-center justify-center border border-gold/60 bg-parchment">
                <span className="h-1.5 w-1.5 -rotate-45 rounded-full bg-gold" />
              </span>
            </div>
            <div className="my-2 h-px w-full bg-border lg:hidden" />

            <div className="lg:pl-8">
              <Field label="Translation" hint="English" lang="en" error={errors.content_en}>
                <textarea
                  rows={16}
                  value={values.content_en}
                  onChange={e => update("content_en", e.target.value)}
                  placeholder="Write the translation here…"
                  className="input min-h-[26rem] resize-y font-serif text-base leading-8"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* footer / actions */}
        <footer className="flex flex-col-reverse gap-4 border-t border-border bg-muted/20 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="flex items-center gap-2 text-sm">
            {notice && (
              <span className={`inline-flex items-center gap-1.5 ${notice.tone === "error" ? "text-destructive" : "text-gold"}`}>
                {notice.tone === "ok" && <Check className="h-4 w-4" />}
                {notice.text}
              </span>
            )}
            {!creating && (
              <button
                type="button"
                onClick={() => { if (confirm("Delete this entry permanently?")) del.mutate(); }}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Link to="/admin/ziyarat" className="rounded-md border border-border px-4 py-2 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold">
              Cancel
            </Link>
            <button
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2 text-sm text-parchment transition-colors hover:bg-ink-soft disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {mutation.isPending ? "Saving…" : creating ? "Add to collection" : "Save changes"}
            </button>
          </div>
        </footer>
      </form>
    </main>
  );
}

function Field({ label, hint, lang, error, children }: { label: string; hint?: string; lang?: "ar" | "en"; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="flex items-baseline justify-between">
        <span className={`text-sm font-medium text-ink ${lang === "ar" ? "graph-text" : ""}`}>{label}</span>
        {hint && <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{hint}</span>}
      </span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}
