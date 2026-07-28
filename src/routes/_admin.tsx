import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, clearAuth, getToken, getUser, isTokenExpired } from "@/lib/auth-store";
import { Menu, X, LayoutDashboard, BookOpen, Users, ShieldAlert, LogOut, Library } from "lucide-react";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

const ADMIN_NAV = [
  { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/majalis" as const, label: "Majalis", icon: BookOpen },
  { to: "/admin/books" as const, label: "Books", icon: Library },
  { to: "/admin/users" as const, label: "Users", icon: Users },
  { to: "/admin/audit" as const, label: "Audit", icon: ShieldAlert },
];

function AdminLayout() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // Perform a thorough auth check
    const currentToken = getToken();
    const storedUser = getUser();
    
    if (!currentToken || storedUser === null) {
      // No token at all — redirect to unauthorized
      navigate({ to: "/unauthorized", replace: true });
      return;
    }

    // Check expiration
    if (isTokenExpired(currentToken)) {
      console.debug("[admin] Token expired, clearing auth");
      clearAuth();
      navigate({ to: "/unauthorized", replace: true });
      return;
    }

    setChecking(false);
  }, [token]);

  // Show a loading state while checking auth — prevents flash of unauthorized
  if (checking) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="mt-4 text-sm text-ink-soft">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!getToken() || !user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 sm:pb-6">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold sm:text-xs">Editorial</p>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Admin</h1>
          <p className="mt-1 text-xs text-ink-soft sm:text-sm">
            Signed in as <span className="text-ink font-medium">{user.name}</span> ·{" "}
            <span className="uppercase tracking-wider text-gold">{user.role}</span>
          </p>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border sm:hidden"
          aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
        >
          {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 sm:flex">
          {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/admin" }}
              activeProps={{ className: "bg-ink text-parchment border-ink" }}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-ink hover:border-gold hover:text-gold sm:text-sm"
            >
              <Icon size={14} className="shrink-0" />
              {label}
            </Link>
          ))}
          <button
            onClick={() => { clearAuth(); navigate({ to: "/" }); }}
            className="flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 sm:text-sm"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </nav>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="mb-6 rounded-md border border-border bg-card p-4 sm:hidden">
          <nav className="flex flex-col gap-2">
            {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/admin" }}
                activeProps={{ className: "bg-ink text-parchment border-ink" }}
                className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm text-ink hover:border-gold hover:text-gold"
                onClick={() => setMobileNavOpen(false)}
              >
                <Icon size={16} className="shrink-0" />
                {label}
              </Link>
            ))}
            <button
              onClick={() => { clearAuth(); navigate({ to: "/" }); }}
              className="flex items-center gap-3 rounded-md border border-destructive/40 px-4 py-3 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </nav>
        </div>
      )}

      <Outlet />
    </div>
  );
}
