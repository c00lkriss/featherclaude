/**
 * Supabase Storage image sizing helper.
 *
 * Rewrites `/storage/v1/object/public/...` URLs to the render/image endpoint
 * with width/quality query params. Non-Supabase URLs and empty inputs pass
 * through unchanged so older uploads and external assets keep working.
 *
 * Note: Supabase's image render endpoint caps width/height at 2500px. For
 * 4K displays, use `fullResImage()` to serve the original unresized URL.
 */

const OBJECT_SEGMENT = "/storage/v1/object/public/";
const RENDER_SEGMENT = "/storage/v1/render/image/public/";
const MAX_RENDER_DIM = 2500;

export type SizedImageOptions = {
  width?: number;
  height?: number;
  quality?: number; // 20-100
  resize?: "cover" | "contain" | "fill";
};

export function sizedImage(url: string | null | undefined, opts: SizedImageOptions = {}): string {
  if (!url) return "";
  if (!url.includes(OBJECT_SEGMENT)) return url;
  const base = url.replace(OBJECT_SEGMENT, RENDER_SEGMENT);
  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(Math.min(MAX_RENDER_DIM, Math.round(opts.width))));
  if (opts.height) params.set("height", String(Math.min(MAX_RENDER_DIM, Math.round(opts.height))));
  if (opts.quality) params.set("quality", String(opts.quality));
  params.set("resize", opts.resize ?? "contain");
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** srcset for responsive `<img>`s. `widths` is an ascending list of px widths.
 *  Appends the original unresized URL as a 3840w candidate for 4K displays. */
export function sizedSrcSet(
  url: string | null | undefined,
  widths: number[],
  quality = 75,
): string {
  if (!url || !url.includes(OBJECT_SEGMENT)) return "";
  const entries = widths
    .filter((w) => w > 0 && w <= MAX_RENDER_DIM)
    .map((w) => `${sizedImage(url, { width: w, quality })} ${w}w`);
  entries.push(`${url} 3840w`);
  return entries.join(", ");
}

/** Original storage URL (no resize) — safe for 4K displays. */
export function fullResImage(url: string | null | undefined): string {
  if (!url) return "";
  return url;
}

/** Tiny LQIP for blur-up placeholders. 24px wide, low quality. */
export function lqip(url: string | null | undefined): string {
  if (!url || !url.includes(OBJECT_SEGMENT)) return "";
  return sizedImage(url, { width: 24, quality: 30 });
}
