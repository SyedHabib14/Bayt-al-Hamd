import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, memo } from "react";
import {
  deleteHadith, deleteMajlis, getMajlisById, listHadithsByMajlisId, saveHadith, saveMajlis,
} from "@/lib/admin.functions";
import { authHeaders } from "@/lib/auth-store";
import { formatDate, referenceBooksQuery } from "@/lib/public-data";
import { Plus, Trash2, Edit3, ArrowLeft, RefreshCw, BookOpen, Library } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/majalis/$id/edit")({
  head: () => ({ meta: [{ title: "Edit majlis · Admin — Bayt al-Ḥamd" }, { name: "robots", content: "noindex" }] }),
  component: EditMajlis,
});

interface HadithRow {
  id: string; majlis_id: string; arabic_text: string; translation_en: string;
  grade: string | null; notes: string | null; is_published: boolean; position: number;
  reference?: { book_name: string; volume: string | null; page: string | null; hadith_number: string | null; reliability_note: string | null } | null;
}

function useMajlisAndHadiths(id: string) {
  return useQuery({
    queryKey: ["admin", "majlis", id],
    queryFn: async () => {
      const headers = authHeaders();
      const [majlis, hadiths] = await Promise.all([
        getMajlisById({ data: { id }, headers }),
        listHadithsByMajlisId({ data: { majlis_id: id }, headers }),
      ]);
      return { majlis, hadiths: (hadiths ?? []) as HadithRow[] };
    },
    staleTime: 15_000,
  });
}

// Memoized hadith item for performance
const HadithItem = memo(function HadithItem({
  hadith,
  onEdit,
  onDelete,
}: {
  hadith: HadithRow;
  onEdit: (hadith: HadithRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="manuscript p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              hadith.is_published
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-amber-500/10 text-amber-600"
            }`}
          >
            {hadith.is_published ? "Published" : "Draft"}
          </span>
          {hadith.grade && (
            <span className="text-[10px] uppercase tracking-wider text-ink-soft">
              {hadith.grade}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(hadith)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-ink hover:border-gold"
          >
            <Edit3 size={12} />
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this hadith?")) onDelete(hadith.id);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>
      <p className="arabic-text mt-4 text-xl sm:text-2xl" dir="rtl">
        {hadith.arabic_text}
      </p>
      <p className="mt-3 font-serif text-base text-ink sm:text-lg">
        {hadith.translation_en}
      </p>
    </li>
  );
});

function EditMajlis() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useMajlisAndHadiths(id);
  const [addingHadith, setAddingHadith] = useState(false);
  const [editingHadith, setEditingHadith] = useState<HadithRow | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "majlis", id] });

  const delMajlis = useMutation({
    mutationFn: () => deleteMajlis({ data: { id }, headers: authHeaders() }),
    onSuccess: () => {
      window.location.href = "/admin/majalis";
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded bg-ink-soft/20" />
        <div className="manuscript animate-pulse space-y-4 p-6">
          <div className="h-4 w-24 rounded bg-ink-soft/20" />
          <div className="h-10 w-full rounded bg-ink-soft/20" />
          <div className="h-10 w-full rounded bg-ink-soft/20" />
        </div>
      </div>
    );
  }

  if (!data?.majlis) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <BookOpen size={40} className="text-ink-soft/40" />
        <p className="mt-4 font-display text-xl text-ink">Majlis not found</p>
        <Link
          to="/admin/majalis"
          className="mt-4 text-sm text-gold hover:underline"
        >
          ← Back to all majalis
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back link */}
      <Link
        to="/admin/majalis"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={14} />
        All majalis
      </Link>

      {/* Edit majlis form */}
      <MajlisEditForm majlis={data.majlis} onSaved={invalidate} />

      {/* Hadiths section */}
      <div className="border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-xl text-ink sm:text-2xl">
              Ḥadīths ({data.hadiths.length})
            </h3>
            <button
              onClick={() => refetch()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-ink-soft hover:border-gold hover:text-gold"
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <button
            onClick={() => {
              setAddingHadith((v) => !v);
              setEditingHadith(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs text-parchment hover:bg-ink-soft sm:py-1.5"
          >
            {addingHadith ? null : <Plus size={14} />}
            {addingHadith ? "Cancel" : "Add hadith"}
          </button>
        </div>

        {/* Add hadith form */}
        {addingHadith && (
          <HadithForm
            majlisId={id}
            position={data.hadiths.length + 1}
            onDone={() => {
              setAddingHadith(false);
              invalidate();
            }}
          />
        )}

        {/* Edit hadith form */}
        {editingHadith && (
          <HadithForm
            majlisId={id}
            hadith={editingHadith}
            onDone={() => {
              setEditingHadith(null);
              invalidate();
            }}
          />
        )}

        {/* Hadiths list */}
        {data.hadiths.length === 0 && !addingHadith && (
          <div className="manuscript mt-6 flex flex-col items-center py-12 text-center">
            <BookOpen size={36} className="text-ink-soft/40" />
            <p className="mt-3 font-display text-lg text-ink">No hadiths yet</p>
            <p className="mt-1 text-sm text-ink-soft">
              Add the first hadith to this majlis.
            </p>
          </div>
        )}

        {data.hadiths.length > 0 && (
          <ul className="mt-6 space-y-4">
            {data.hadiths.map((h) => (
              <HadithItem
                key={h.id}
                hadith={h}
                onEdit={(hadith) => {
                  setEditingHadith(hadith);
                  setAddingHadith(false);
                }}
                onDelete={(hadithId) => {
                  deleteHadith({ data: { id: hadithId }, headers: authHeaders() }).then(() => invalidate());
                }}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Delete majlis */}
      <div className="border-t border-destructive/30 pt-6">
        <button
          onClick={() => {
            if (confirm("Delete this majlis and all its hadiths permanently?"))
              delMajlis.mutate();
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          <Trash2 size={14} />
          Delete majlis
        </button>
      </div>
    </div>
  );
}

function MajlisEditForm({
  majlis,
  onSaved,
}: {
  majlis: any;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(majlis.title);
  const [date, setDate] = useState(String(majlis.date).slice(0, 10));
  const [description, setDescription] = useState(majlis.description ?? "");
  const [isPublished, setIsPublished] = useState(majlis.is_published);
  const mut = useMutation({
    mutationFn: () =>
      saveMajlis({
        data: {
          id: majlis.id,
          title,
          date,
          description,
          is_published: isPublished,
        },
        headers: authHeaders(),
      }),
    onSuccess: onSaved,
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
      className="manuscript space-y-4 p-5 sm:p-6"
    >
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold sm:text-xs">
        {formatDate(String(majlis.date))}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink sm:py-2"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink sm:py-2"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink sm:py-2"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4"
        />
        Published
      </label>
      {mut.error && (
        <p className="text-sm text-destructive">Save failed. Please try again.</p>
      )}
      <button
        disabled={mut.isPending}
        className="rounded-md bg-ink px-4 py-2.5 text-sm text-parchment hover:bg-ink-soft disabled:opacity-60 sm:py-2"
      >
        {mut.isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function HadithForm({
  majlisId,
  hadith,
  position,
  onDone,
}: {
  majlisId: string;
  hadith?: HadithRow;
  position?: number;
  onDone: () => void;
}) {
  const [arabic, setArabic] = useState(hadith?.arabic_text ?? "");
  const [translation, setTranslation] = useState(hadith?.translation_en ?? "");
  const [grade, setGrade] = useState(hadith?.grade ?? "");
  const [notes, setNotes] = useState(hadith?.notes ?? "");
  const [isPublished, setIsPublished] = useState(hadith?.is_published ?? true);
  const [book, setBook] = useState(hadith?.reference?.book_name ?? "");
  const [volume, setVolume] = useState(hadith?.reference?.volume ?? "");
  const [page, setPage] = useState(hadith?.reference?.page ?? "");
  const [hadithNumber, setHadithNumber] = useState(hadith?.reference?.hadith_number ?? "");
  const { data: referenceBooks = [] } = useQuery(referenceBooksQuery);
  const selectedBook = referenceBooks.find((item) => item.name === book);
  const volumeOptions = Array.from({ length: selectedBook?.volume_count ?? 0 }, (_, index) => String(index + 1));
  const pageOptions = Array.from({ length: 999 }, (_, index) => String(index + 1));
  const mut = useMutation({
    mutationFn: () =>
      saveHadith({
        data: {
          id: hadith?.id,
          majlis_id: majlisId,
          arabic_text: arabic,
          translation_en: translation,
          grade: grade || null,
          notes: notes || null,
          reference: book ? { book_name: book, volume, page, hadith_number: hadithNumber, reliability_note: "" } : null,
          is_published: isPublished,
          position: hadith?.position ?? position ?? 1,
        },
        headers: authHeaders(),
      }),
    onSuccess: onDone,
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
      className="manuscript mt-4 space-y-3 p-5 sm:p-6"
    >
      <div>
        <div className="mb-1 flex items-center gap-2"><Library size={14} className="text-gold" /><label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">Reference</label></div>
        <p className="mb-2 text-xs text-ink-soft">Add a source only when this hadith has been verified against it.</p>
        <label htmlFor="reference-book" className="sr-only">Reference book</label><select id="reference-book" value={book} onChange={(e) => { setBook(e.target.value); setVolume(""); }} className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/20">
          <option value="">No reference</option>
          {referenceBooks.map((item) => <option key={item.id} value={item.name}>{item.name} · {item.volume_count} vols.</option>)}
        </select>
        {book && <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div><label htmlFor="reference-volume" className="text-xs font-medium text-ink">Volume <span className="text-ink-soft">(1–{selectedBook?.volume_count ?? "—"})</span></label><select id="reference-volume" value={volume} onChange={(e) => setVolume(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-ink shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/20"><option value="">Select volume</option>{volumeOptions.map((item) => <option key={item} value={item}>Volume {item}</option>)}</select></div>
          <div><label htmlFor="reference-page" className="text-xs font-medium text-ink">Page <span className="text-ink-soft">(up to 999)</span></label><select id="reference-page" value={page} onChange={(e) => setPage(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-ink shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/20"><option value="">Select page</option>{pageOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          <div><label htmlFor="reference-number" className="text-xs font-medium text-ink">Hadith number <span className="text-ink-soft">(optional)</span></label><input id="reference-number" value={hadithNumber} onChange={(e) => setHadithNumber(e.target.value)} placeholder="e.g. 42" className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-ink shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/20" /></div>
        </div>}
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
          Arabic (with tashkeel)
        </label>
        <textarea
          value={arabic}
          onChange={(e) => setArabic(e.target.value)}
          rows={3}
          dir="rtl"
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 graph-text text-lg text-ink sm:text-xl sm:py-2"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
          English translation
        </label>
        <textarea
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 font-serif text-sm text-ink sm:py-2"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
            Grade
          </label>
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Ṣaḥīḥ, Ḥasan, Ḍaʿīf…"
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
      <div>
        <label className="text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-ink sm:py-2"
        />
      </div>
      {mut.error && (
        <p className="text-sm text-destructive">Save failed. Please try again.</p>
      )}
      <button
        disabled={mut.isPending}
        className="rounded-md bg-ink px-4 py-2.5 text-sm text-parchment hover:bg-ink-soft disabled:opacity-60 sm:py-2"
      >
        {mut.isPending ? "Saving…" : "Save hadith"}
      </button>
    </form>
  );
}
