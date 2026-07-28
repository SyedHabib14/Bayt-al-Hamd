import { useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  src?: string | null;
  title: string;
  className?: string;
  /** Sizes attribute passed straight through for responsive image loading. */
  sizes?: string;
  priority?: boolean;
}

/**
 * Portrait, rounded book cover with a soft gilded frame. Falls back to a
 * generated placeholder (title initial on a manuscript gradient) when no
 * cover has been uploaded yet, or if the image fails to load.
 */
export function BookCover({ src, title, className, sizes, priority }: BookCoverProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;

  return (
    <div
      className={cn(
        "group relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-gold-soft/60 bg-secondary shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_18px_40px_-18px_oklch(0.4_0.05_75/0.45)] transition-transform duration-300 ease-out",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={`Cover of ${title}`}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          sizes={sizes}
          onError={() => setErrored(true)}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(160deg,oklch(0.97_0.02_82),oklch(0.9_0.03_78))] px-4 text-center dark:bg-[linear-gradient(160deg,oklch(0.1_0.02_260),oklch(0.06_0.015_260))]">
          <BookOpen className="text-gold/70" size={28} />
          <p className="line-clamp-3 font-display text-sm text-ink-soft/80">{title}</p>
        </div>
      )}
      {/* Fine gold edge highlight, echoes the manuscript utility used elsewhere */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
    </div>
  );
}
