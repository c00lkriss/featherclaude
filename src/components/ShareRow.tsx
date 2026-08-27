import { useState } from "react";
import { Check, Copy, Facebook, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Route path, e.g. "/blog/my-post". Canonical URL = https://coolkriss.in + path */
  path: string;
  title: string;
  className?: string;
  /** Compact dark-overlay variant (used on the photo viewer). */
  variant?: "default" | "overlay";
};

const SITE = "https://coolkriss.in";
const ACCENT = "#c9a84c";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.79l-4.77-6.23L5.4 22H2.14l8.02-9.16L1.5 2h6.96l4.31 5.7L18.244 2Zm-1.19 18h1.83L7.04 3.9H5.08L17.054 20Z" />
    </svg>
  );
}

export function ShareRow({ path, title, className, variant = "default" }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE}${path}`;
  const enc = encodeURIComponent;

  const links = [
    {
      label: "Share on WhatsApp",
      href: `https://wa.me/?text=${enc(`${title} — ${url}`)}`,
      icon: <MessageCircle className="h-4 w-4" />,
    },
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`,
      icon: <XIcon className="h-3.5 w-3.5" />,
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      icon: <Facebook className="h-4 w-4" />,
    },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  const btn = cn(
    "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
    variant === "overlay"
      ? "border-white/20 bg-black/40 hover:bg-black/60"
      : "border-border bg-surface hover:border-primary/60",
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className="mr-1 text-[10px] font-light uppercase tracking-[0.25em]"
        style={{ color: ACCENT }}
      >
        Share
      </span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={l.label}
          title={l.label}
          className={btn}
          style={{ color: ACCENT }}
        >
          {l.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        title="Copy link"
        className={btn}
        style={{ color: ACCENT }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
      {copied && (
        <span className="text-[11px] font-light" style={{ color: ACCENT }}>
          Copied
        </span>
      )}
    </div>
  );
}
