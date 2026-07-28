import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Bayt al-Ḥamd" }, { name: "description", content: "About the Bayt al-Ḥamd archive." }] }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <p className="eyebrow text-center">YOU MAY BE CURIOUS THAT</p>
      <h1 className="mt-3 font-display text-4xl text-center text-ink sm:text-5xl">What is Bayt al-Ḥamd?</h1>
      <div className="gold-rule mt-8 w-24 mx-auto" />
      <div className="prose mt-8 space-y-5 font-serif text-lg leading-relaxed text-ink">
        <p>
          <strong>Bayt al-Ḥamd</strong> (The House of Praise) is historically revered in Shia tradition as the designated house in Samarrah associated with the upbringing and sanctuary of Imam al-Mahdi [ajtf]. This project is a scholarly archive
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
