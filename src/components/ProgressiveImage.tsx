import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { lqip, sizedImage, sizedSrcSet, type SizedImageOptions } from "@/lib/image-url";

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  /** Rendered width used for the primary src; also seeds srcset. */
  width?: number;
  quality?: number;
  /** Additional srcset widths. If omitted, we derive from `width`. */
  srcSetWidths?: number[];
  sizes?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "async" | "sync" | "auto";
  resize?: SizedImageOptions["resize"];
  onLoad?: () => void;
  draggable?: boolean;
  style?: React.CSSProperties;
};

/**
 * Image with LQIP blur-up placeholder + responsive srcset. Falls back
 * gracefully for non-Supabase URLs (no rewrite, no placeholder).
 */
export function ProgressiveImage({
  src,
  alt,
  className,
  wrapperClassName,
  width = 800,
  quality = 75,
  srcSetWidths,
  sizes,
  loading = "lazy",
  fetchPriority = "auto",
  decoding = "async",
  resize,
  onLoad,
  draggable,
  style,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const placeholder = lqip(src);
  const primary = sizedImage(src, { width, quality, resize });
  const widths = srcSetWidths ?? Array.from(new Set([Math.round(width / 2), width, width * 2])).filter((w) => w > 0);
  const srcSet = sizedSrcSet(src, widths, quality);

  // Handle images already in cache (onLoad won't fire).
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [primary]);

  return (
    <span
      className={cn("relative block overflow-hidden", wrapperClassName)}
      style={
        placeholder
          ? {
              backgroundImage: `url("${placeholder}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <img
        ref={imgRef}
        src={primary || src || ""}
        srcSet={srcSet || undefined}
        sizes={sizes}
        alt={alt}
        loading={loading}
        // @ts-expect-error React types lag on lowercase fetchpriority
        fetchpriority={fetchPriority}
        decoding={decoding}
        draggable={draggable}
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
        style={style}
        className={cn(
          "block h-auto w-full transition-opacity duration-500 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </span>
  );
}
