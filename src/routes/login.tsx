import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cnicLogin } from "@/lib/auth.functions";
import { setAuth, useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Dalīl" }, { name: "robots", content: "noindex" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [cnic, setCnic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/admin", replace: true });
  }, [user, navigate]);

  function formatCnic(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 13);
    return [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12)].filter(Boolean).join("-");
  }

  if (user) {
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const digits = cnic.replace(/[-\s]/g, "");
      if (!/^\d{13}$/.test(digits)) {
        setError("CNIC must be 13 digits."); setBusy(false); return;
      }
      const res = await cnicLogin({ data: { cnic: digits } });
      setAuth(res.token, res.user);
      router.invalidate();
      navigate({ to: "/admin" });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err && (err as Error).message
          ? (err as Error).message
          : "Not authorized.";
      setError(msg.includes("Too many") || msg.includes("not configured") || msg.includes("JWT")
        ? msg
        : "Not authorized.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="manuscript w-full p-6 sm:p-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold sm:text-xs">Scholar access</p>
        <h1 className="mt-3 font-display text-2xl text-ink sm:text-3xl">Sign in</h1>
        <div className="gold-rule my-5 sm:my-6" />
        <p className="text-sm text-ink-soft">
          Enter your enrolled 13-digit CNIC. Access is limited to authorised editors.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">CNIC</label>
            <input
              inputMode="numeric" autoComplete="off" spellCheck={false}
              value={cnic} onChange={(e) => setCnic(formatCnic(e.target.value))}
              placeholder="XXXXX-XXXXXXX-X"
              className="w-full rounded-md border border-border bg-card px-4 py-3 font-mono text-base tracking-wide text-ink focus:border-gold focus:outline-none sm:text-lg"
            />
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <button disabled={busy}
            className="w-full rounded-md bg-ink py-3 text-sm font-medium text-parchment hover:bg-ink-soft disabled:opacity-60 transition-colors duration-200">
            {busy ? "Verifying…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
