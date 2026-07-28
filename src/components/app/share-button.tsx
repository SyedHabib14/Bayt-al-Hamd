import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  text?: string;
  url: string;
  className?: string;
  /** Compact icon-only variant for tight layouts (e.g. inside a card). */
  compact?: boolean;
}

/**
 * Aesthetic share button: uses the native Web Share API (opens the OS share
 * tray on mobile / supported browsers) and falls back to copying the link
 * to the clipboard with a brief confirmation state everywhere else.
 */
export function ShareButton({ title, text, url, className, compact }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled the share sheet, or share failed — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — silently no-op, the button remains usable.
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share this book"
        title={copied ? "Link copied" : "Share"}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-ink-soft backdrop-blur transition-all duration-200 hover:border-gold hover:text-gold hover:shadow-[0_0_0_3px_var(--gold-soft)]",
          className,
        )}
      >
        {copied ? <Check size={15} /> : <Share2 size={15} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full border border-gold/50 bg-transparent px-5 py-2.5 text-sm font-medium text-ink transition-all duration-200 hover:border-gold hover:bg-gold/10 hover:shadow-[0_4px_20px_-6px_var(--gold)] active:scale-[0.98]",
        className,
      )}
    >
      {copied ? (
        <>
          <Check size={16} className="text-gold" />
          Link copied
        </>
      ) : (
        <>
          <Share2 size={16} className="transition-transform duration-200 group-hover:rotate-12" />
          Share
        </>
      )}
    </button>
  );
}

/** Small inline "copy link" affordance, used as a secondary action next to Share. */
export function CopyLinkHint({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore
        }
      }}
      className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-gold"
    >
      <Link2 size={12} />
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
