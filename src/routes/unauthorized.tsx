import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({ meta: [{ title: "Unauthorized — Bayt al-Ḥamd" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="manuscript max-w-md text-center px-10 py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Bayt al-Ḥamd</p>
        <h1 className="mt-4 font-display text-5xl text-ink">401</h1>
        <div className="gold-rule my-6" />
        <p className="text-ink-soft">You are not authorised to view this page.</p>
        <Link to="/" className="mt-8 inline-block border-b border-gold pb-1 text-ink hover:text-gold">
          Return home
        </Link>
      </div>
    </div>
  ),
});
