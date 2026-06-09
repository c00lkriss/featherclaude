/** Compute aspect ratio bucket + dimensions for a File. */
export type ImageMeta = {
  width: number;
  height: number;
  aspect_ratio: string;
};

export function classifyAspect(w: number, h: number): string {
  if (h > w * 1.4) return "9:16";
  if (h > w * 1.1) return "4:5";
  if (w > h * 1.4) return "3:2";
  return "1:1";
}

export async function readImageMeta(file: File): Promise<ImageMeta | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      URL.revokeObjectURL(url);
      resolve({ width: w, height: h, aspect_ratio: classifyAspect(w, h) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
