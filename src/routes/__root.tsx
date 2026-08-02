import{ QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useAuth, clearAuth } from "@/lib/auth-store";
import { ambientGlowConfig } from "@/lib/ambient-glow-config";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="manuscript max-w-md text-center px-10 py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Bayt al-Ḥamd</p>
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
      { title: "Bayt al-Ḥamd — Verify every ḥadīth of the majlis" },
      { name: "description", content: "A scholarly archive to authenticate every ḥadīth quoted in a majlis, with the original Arabic, translation, references and grading." },
      { name: "author", content: "Bayt al-Ḥamd" },
      { property: "og:title", content: "Bayt al-Ḥamd — Verify every ḥadīth of the majlis" },
      { property: "og:description", content: "The original Arabic, translation, references and scholarly notes for every ḥadīth of each majlis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preload", href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;500;600;700&family=Amiri+Quran&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Serif:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=Scheherazade+New:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&display=swap", as: "style" },
      { rel: "preload", href: "https://verses.quran.foundation/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;500;600;700&family=Amiri+Quran&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=Scheherazade+New:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&display=swap" },
      { rel: "prefetch", href: "/majalis" },
      { rel: "prefetch", href: "/books" },
      { rel: "prefetch", href: "/articles" },
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
    <header className="sticky top-0 z-30 border-b border-border/60 bg-parchment/80 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-parchment/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link
          to="/"
          className="group header-logo"
          aria-label="Bayt al-Ḥamd home"
          onClick={() => setMobileOpen(false)}
        >
          <span className="header-logo-shine" aria-hidden="true" />
          <img
            src="/BaH.png"
            alt="Bayt al-Ḥamd"
            className="header-logo-image"
            width={1024}
            height={1024}
            decoding="async"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-lg thin-text dark:text-white sm:flex">
          <Link to="/majalis" className="nav-link" activeProps={{ className: "nav-link nav-link-active" }}>Majalis</Link>
          <Link to="/books" className="nav-link" activeProps={{ className: "nav-link nav-link-active" }}>Books</Link>
           <Link to="/articles" className="nav-link" activeProps={{ className: "nav-link nav-link-active" }}>Articles</Link>
          <Link to="/search" className="nav-link" activeProps={{ className: "nav-link nav-link-active" }}>Search</Link>
          <Link to="/about" className="nav-link" activeProps={{ className: "nav-link nav-link-active" }}>About</Link>
          <button type="button" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="group relative flex h-8 w-14 items-center rounded-full border border-gold/50 p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gold">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-gold text-accent-foreground shadow-sm transition-transform duration-300 ease-out ${dark ? "translate-x-6" : "translate-x-0"}`}>
              {dark ? <Moon size={14} /> : <Sun size={14} />}
            </span>
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/admin" className="rounded-full bg-ink px-3.5 py-1.5 text-xs text-parchment transition-colors duration-200 hover:bg-gold hover:text-accent-foreground">
                Admin
              </Link>
              <button
                onClick={() => { clearAuth(); window.location.href = "/"; }}
                className="text-xs text-ink-soft transition-colors hover:text-destructive"
              >Sign out</button>
            </div>
          ) : (
            <Link to="/login" className="rounded-full border border-ink/20 px-3.5 py-1.5 text-lg thin-text transition-rounded-full border border-ink/20 px-3.5 py-1.5 text-lg thin-text transition-colors duration-200 hover:border-gold hover:text-gold duration-200 hover:border-gold hover:text-gold">
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
            <Link to="/majalis" className="thin-text header-mobile-tab rounded-md px-4 py-3 text-ink-soft hover:bg-secondary" onClick={() => setMobileOpen(false)}>Majalis</Link>
            <Link to="/books" className="thin-text header-mobile-tab rounded-md px-4 py-3 text-ink-soft hover:bg-secondary" onClick={() => setMobileOpen(false)}>Books</Link>
            <Link to="/articles" className="thin-text header-mobile-tab rounded-md px-4 py-3 text-ink-soft hover:bg-secondary" onClick={() => setMobileOpen(false)}>Articles</Link>
            <Link to="/search" className="thin-text header-mobile-tab rounded-md px-4 py-3 text-ink-soft hover:bg-secondary" onClick={() => setMobileOpen(false)}>Search</Link>
            <Link to="/about" className="thin-text header-mobile-tab rounded-md px-4 py-3 text-ink-soft hover:bg-secondary" onClick={() => setMobileOpen(false)}>About</Link>
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
        <p className="font-display font-semibold text-lg text-ink">Bayt al-Ḥamd</p>
        <div className="gold-rule mx-auto my-4 w-24" />
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 thin-text text-lg text-ink-soft">
          <Link to="/majalis" className="hover:text-gold">Majalis</Link>
          <Link to="/books" className="hover:text-gold">Books</Link>
          <Link to="/search" className="hover:text-gold">Search</Link>
          <Link to="/articles" className="hover:text-gold">Articles</Link>
          <Link to="/about" className="hover:text-gold">About</Link>
        </nav>
        <p className="mt-3 thin-text text-lg text-ink-soft/70">
          A scholarly companion for verifying every ḥadīth of the majlis.
        </p>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const glowStyle = {
    "--ambient-glow-easing": ambientGlowConfig.easing,
    "--ambient-glow-blend-mode": ambientGlowConfig.blendMode,
    "--ambient-glow-opacity": ambientGlowConfig.opacity.toString(),
  } as CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="ambient-glow-shell flex min-h-screen flex-col" style={glowStyle}>
        <div className="ambient-glow-viewport" aria-hidden="true">
          {ambientGlowConfig.layers.map((layer, index) => {
            const layerStyle = {
              "--ambient-glow-layer-color": layer.color,
              "--ambient-glow-layer-size": layer.size,
              "--ambient-glow-layer-blur": layer.blur,
              "--ambient-glow-layer-duration": layer.duration,
              "--ambient-glow-layer-top": layer.offsetTop,
              ...("offsetLeft" in layer ? { "--ambient-glow-layer-left": layer.offsetLeft } : {}),
              ...("offsetRight" in layer ? { "--ambient-glow-layer-right": layer.offsetRight } : {}),
            } as CSSProperties;

            return (
              <div
                key={`${layer.color}-${index}`}
                className="ambient-glow-layer"
                style={layerStyle}
              />
            );
          })}
        </div>
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </QueryClientProvider>
  );
}
