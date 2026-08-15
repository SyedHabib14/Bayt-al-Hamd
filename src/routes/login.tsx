import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { cnicLogin } from "@/lib/auth.functions";
import { setAuth, useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Bayt al-Ḥamd" }, { name: "robots", content: "noindex" }] }),
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

  if (user) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const digits = cnic.replace(/[-\s]/g, "");
      if (!/^\d{13}$/.test(digits)) {
        setError("CNIC must be 13 digits.");
        return;
      }
      const res = await cnicLogin({ data: { cnic: digits } });
      setAuth(res.token, res.user);
      router.invalidate();
      navigate({ to: "/admin" });
    } catch (err) {
      const msg = err && typeof err === "object" && "message" in err && (err as Error).message
        ? (err as Error).message : "Not authorized.";
      setError(msg.includes("Too many") || msg.includes("not configured") || msg.includes("JWT") ? msg : "Not authorized.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="-mt-14 relative isolate min-h-screen overflow-hidden bg-[#f5eee3] px-4 py-8 text-ink transition-colors dark:bg-[#16080d] dark:text-[#f6ede1] sm:px-6 sm:py-12 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-90 [background-image:radial-gradient(circle_at_15%_8%,rgba(152,100,46,.18),transparent_30%),radial-gradient(circle_at_88%_90%,rgba(92,16,39,.2),transparent_30%)] dark:opacity-70" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center sm:min-h-[calc(100vh-6rem)]">
        <section className="manuscript grid w-full overflow-hidden rounded-[1.75rem] border border-gold/25 bg-card/90 shadow-[0_32px_90px_-35px_rgba(60,42,12,.38)] backdrop-blur-xl dark:border-[#d5b870]/20 dark:bg-[#121a17]/95 dark:shadow-[0_32px_100px_-35px_rgba(0,0,0,.8)] md:grid-cols-[.9fr_1.1fr]">
          <aside className="relative hidden min-h-[620px] overflow-hidden border-r border-[#d2b874]/20 bg-[#19080d] p-10 text-[#f7f0df] md:flex md:flex-col md:justify-between lg:p-12">
            <div className="absolute -right-24 -top-24 size-72 rounded-full border border-[#d2b874]/15" />
            <div className="absolute -right-10 -top-10 size-48 rounded-full border border-[#d2b874]/20" />
            <div className="relative">
              <div className="flex size-11 items-center justify-center rounded-xl border border-[#d9c182]/35 bg-white/5"><BookOpen size={20} strokeWidth={1.5} /></div>
              <p className="mt-6 text-[10px] font-light uppercase tracking-[0.35em] text-[#d8c083]">Bayt al-Hamd</p>
            </div>
            <div className="relative">
              <p lang="ar" dir="rtl" className="graph-text text-center text-4xl leading-[1.15] text-[#fff4d6] [text-shadow:0_3px_22px_rgba(0,0,0,.2)] lg:text-[2.7rem]"> بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              <div className="my-7 h-px w-100 bg-gradient-to-r from-[#d8bc74] to-transparent" />
              <p className="max-w-xs font-display text-xl leading-relaxed">Enter with knowledge, serve with trust.</p>
              <p className="mt-4 max-w-xs thin-text text-lg leading-6 text-[#d8d2c5]/70">A private scholarly workspace for authorised editors and custodians.</p>
            </div>
            <div className="relative flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[#d8c083]/75"><ShieldCheck size={14} /> Secure scholar access</div>
          </aside>

          <div className="flex min-h-[580px] flex-col justify-center p-6 sm:p-10 lg:p-14">
            <div className="mx-auto w-full max-w-md">
              <div className="text-center md:hidden">
                <p lang="ar" dir="rtl" className="graph-text text-center text-[1.85rem] leading-[2.1] text-[#7b1d3b] dark:text-[#e1c780] sm:text-3xl"> بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                <div className="gold-rule mx-auto mt-4 h-px w-55 bg-gradient-to-r from-transparent via-gold to-transparent" />
              </div>

              <div className="mt-10 md:mt-0">
                <div className="flex items-center gap-3 text-gold dark:text-[#d8bc74]">
                  <span className="grid size-9 place-items-center rounded-full border border-current/25 bg-gold/5"><LockKeyhole size={15} /></span>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] sm:text-xs">Scholar access</p>
                </div>
                <h1 className="mt-6 font-display text-3xl tracking-[-0.025em] text-ink dark:text-[#f3ecdd] sm:text-4xl">Welcome back</h1>
                <p className="mt-3 max-w-sm thin-text text-lg leading-6 text-ink-soft dark:text-[#aaa69b]">Enter your enrolled 13-digit CNIC to continue to the editorial archive.</p>
              </div>

              <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="cnic" className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft dark:text-[#bbb3a4] sm:text-xs">CNIC</label>
                    <span className="text-[10px] text-ink-soft/70">13 digits</span>
                  </div>
                  <input id="cnic" inputMode="numeric" autoComplete="off" spellCheck={false}
                    aria-invalid={Boolean(error)} aria-describedby={error ? "cnic-error" : undefined}
                    value={cnic} onChange={(e) => { setCnic(formatCnic(e.target.value)); if (error) setError(null); }}
                    placeholder="XXXXX-XXXXXXX-X"
                    className="w-full rounded-xl border border-border bg-card/70 px-4 py-3.5 font-mono text-base tracking-[0.08em] text-ink outline-none transition duration-200 placeholder:text-ink-soft/55 focus:border-gold focus:ring-4 focus:ring-gold/15 dark:border-[#39443e] dark:bg-[#0c1311]/80 dark:text-[#f0e8d8] dark:placeholder:text-[#656b66] dark:focus:border-[#c3a65f] sm:text-lg" />
                </div>

                {error && <p id="cnic-error" role="alert" className="rounded-xl border border-destructive/15 bg-destructive/[0.07] px-4 py-3 text-sm text-destructive">{error}</p>}

                <button disabled={busy}
                  className="w-full rounded-xl bg-[#5a1530] px-5 py-3.5 text-2sm font-light tracking-wide text-[#fffaf0] shadow-[0_12px_30px_-14px_rgba(90,21,48,.8)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#721d40] focus:outline-none focus:ring-4 focus:ring-[#8e3157]/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-[#c3a65f] dark:text-[#211016] dark:hover:bg-[#d4ba78]">
                  <span className="flex items-center justify-center gap-2">{busy && <LoaderCircle size={16} className="animate-spin" />}{busy ? "Verifying…" : "Enter as Admin"}</span>
                </button>
              </form>

              <p className="mt-4 text-center italic text-[11px] leading-5 text-ink-soft/75 dark:text-[#777c77]">Access is limited to authorised editors. Your credentials are handled securely.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
