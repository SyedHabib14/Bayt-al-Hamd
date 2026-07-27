import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useAuth, clearAuth } from "@/lib/auth-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="manuscript max-w-md text-center px-10 py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Dalīl</p>
        <h1 className="mt-4 font-display text-6xl text-ink">404</h1>
        <div className="gold-rule my-6" />
        <p className="text-ink-soft">This page could not be found in the archive.</p>
        <Link to="/" className="mt-8 inline-block border-b border-gold pb-1 text-ink hover:text-gold">
          Return to the entrance
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="manuscript max-w-md text-center px-10 py-14">
        <h1 className="font-display text-2xl text-ink">A page could not be rendered</h1>
        <div className="gold-rule my-6" />
        <p className="text-sm text-ink-soft">The scribe was interrupted. Please try again.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-ink px-4 py-2 text-sm text-parchment hover:bg-ink-soft">
            Try again
          </button>
          <a href="/" className="rounded-md border border-ink/20 px-4 py-2 text-sm text-ink hover:bg-secondary">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dalīl — Verify every ḥadīth of the majlis" },
      { name: "description", content: "A scholarly archive to authenticate every ḥadīth quoted in a majlis, with the original Arabic, translation, references and grading." },
      { name: "author", content: "Dalīl" },
      { property: "og:title", content: "Dalīl — Verify every ḥadīth of the majlis" },
      { property: "og:description", content: "The original Arabic, translation, references and scholarly notes for every ḥadīth of each majlis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preload", href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=Scheherazade+New:wght@400;500;600;700&display=swap", as: "style" },
      { rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=Scheherazade+New:wght@400;500;600;700&display=swap" },
      { rel: "prefetch", href: "/majalis" },
      { rel: "prefetch", href: "/search" },
      { rel: "prefetch", href: "/about" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function SiteHeader() {
  const { user } = useAuth();
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("dalil.theme");
    const enabled = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("dalil.theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-parchment/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="group flex items-baseline gap-3" onClick={() => setMobileOpen(false)}>
          <span className="font-display text-xl text-ink tracking-tight sm:text-2xl">Dalīl</span>
          <span className="hidden sm:inline text-[11px] uppercase tracking-[0.3em] text-gold">دَلِيل</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft sm:flex">
          <Link to="/majalis" className="hover:text-ink" activeProps={{ className: "text-ink" }}>Majalis</Link>
          <Link to="/search" className="hover:text-ink" activeProps={{ className: "text-ink" }}>Search</Link>
          <Link to="/about" className="hover:text-ink" activeProps={{ className: "text-ink" }}>About</Link>
          <button type="button" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="group relative flex h-8 w-14 items-center rounded-full border border-gold/50 bg-secondary p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gold">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-gold text-accent-foreground shadow-sm transition-transform duration-300 ease-out ${dark ? "translate-x-6" : "translate-x-0"}`}>
              {dark ? <Moon size={14} /> : <Sun size={14} />}
            </span>
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/admin" className="rounded-md bg-ink px-3 py-1.5 text-xs text-parchment hover:bg-ink-soft">
                Admin
              </Link>
              <button
                onClick={() => { clearAuth(); window.location.href = "/"; }}
                className="text-xs text-ink-soft hover:text-destructive"
              >Sign out</button>
            </div>
          ) : (
            <Link to="/login" className="rounded-md border border-ink/20 px-3 py-1.5 text-xs text-ink hover:border-gold hover:text-gold">
              Sign in
            </Link>
          )}
        </nav>

        {/* Mobile header actions */}
        <div className="flex items-center gap-2 sm:hidden">
          <button type="button" onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-ink-soft">
            {dark ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-ink"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="border-t border-border/60 px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-2">
            <Link to="/majalis" className="rounded-md px-4 py-3 text-sm font-medium text-ink-soft hover:bg-secondary" onClick={() => setMobileOpen(false)}>Majalis</Link>
            <Link to="/search" className="rounded-md px-4 py-3 text-sm font-medium text-ink-soft hover:bg-secondary" onClick={() => setMobileOpen(false)}>Search</Link>
            <Link to="/about" className="rounded-md px-4 py-3 text-sm font-medium text-ink-soft hover:bg-secondary" onClick={() => setMobileOpen(false)}>About</Link>
            {user ? (
              <>
                <Link to="/admin" className="rounded-md bg-ink px-4 py-3 text-center text-sm font-medium text-parchment" onClick={() => setMobileOpen(false)}>Admin</Link>
                <button onClick={() => { clearAuth(); window.location.href = "/"; }}
                  className="rounded-md px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10">Sign out</button>
              </>
            ) : (
              <Link to="/login" className="rounded-md border border-ink/20 px-4 py-3 text-center text-sm font-medium text-ink" onClick={() => setMobileOpen(false)}>Sign in</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-parchment/70">
      <div className="mx-auto max-w-6xl px-6 py-10 text-center">
        <p className="font-display text-lg text-ink">Dalīl · دَلِيل</p>
        <div className="gold-rule mx-auto my-4 w-24" />
        <p className="text-xs text-ink-soft">
          A scholarly companion for verifying every ḥadīth of the majlis.
        </p>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </QueryClientProvider>
  );
}
