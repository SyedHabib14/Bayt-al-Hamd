import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Dalīl" }, { name: "description", content: "About the Dalīl archive." }] }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-[0.35em] text-gold">About</p>
      <h1 className="mt-3 font-display text-4xl text-ink">What is Dalīl?</h1>
      <div className="gold-rule mt-6 w-24" />
      <div className="prose mt-8 space-y-5 font-serif text-lg leading-relaxed text-ink">
        <p>
          <strong>Dalīl</strong> (دَلِيل — <em>the evidence, the guide</em>) is a scholarly archive
          dedicated to a single, careful task: to record and verify every ḥadīth quoted during a
          majlis.
        </p>
        <p>
          For each gathering we publish the original Arabic text with full tashkeel, a reliable
          English translation, the primary references from the canonical collections, and short
          scholarly notes on grading and context. The intent is to allow anyone — student, teacher
          or curious reader — to follow the majlis and confirm the source of every narration.
        </p>
        <p>
          Editorial work is undertaken by an enrolled circle of scholars and editors. Only they may
          add, edit or publish content, and every change is written into a permanent audit log.
        </p>
      </div>
    </div>
  );
}
