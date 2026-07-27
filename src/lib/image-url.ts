/**
 * Supabase Storage image sizing helper.
 *
 * Rewrites `/storage/v1/object/public/...` URLs to the render/image endpoint
 * with width/quality query params. Non-Supabase URLs and empty inputs pass
 * through unchanged so older uploads and external assets keep working.
 */

const OBJECT_SEGMENT = "/storage/v1/object/public/";
const RENDER_SEGMENT = "/storage/v1/render/image/public/";

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
  if (opts.width) params.set("width", String(Math.round(opts.width)));
  if (opts.height) params.set("height", String(Math.round(opts.height)));
  if (opts.quality) params.set("quality", String(opts.quality));
  if (opts.resize) params.set("resize", opts.resize);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** srcset for responsive `<img>`s. `widths` is an ascending list of px widths. */
export function sizedSrcSet(
  url: string | null | undefined,
  widths: number[],
  quality = 75,
): string {
  if (!url || !url.includes(OBJECT_SEGMENT)) return "";
  return widths
    .map((w) => `${sizedImage(url, { width: w, quality })} ${w}w`)
    .join(", ");
}

/** Tiny LQIP for blur-up placeholders. 24px wide, low quality. */
export function lqip(url: string | null | undefined): string {
  if (!url || !url.includes(OBJECT_SEGMENT)) return "";
  return sizedImage(url, { width: 24, quality: 30 });
}
