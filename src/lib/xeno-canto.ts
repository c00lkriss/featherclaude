export type XenoCantoCall = {
  id: string;
  url: string;
  recordist: string;
  license: string;
  type: string;
};

const ALLOWED_LICENSES = ["by", "by-nc", "by-sa", "by-nc-sa"];

function licenseAllowed(lic: string | undefined | null): boolean {
  if (!lic) return false;
  const s = String(lic).toLowerCase();
  // xeno-canto licenses look like "//creativecommons.org/licenses/by-nc-sa/4.0/"
  return ALLOWED_LICENSES.some((tok) => s.includes(`/licenses/${tok}/`)) ||
    ALLOWED_LICENSES.some((tok) => s.includes(`cc-${tok}`));
}

/**
 * Fetches the best quality-A call/song recording for a species
 * from xeno-canto. Returns null if nothing usable is found.
 */
export async function fetchXenoCantoCall(scientificName: string): Promise<XenoCantoCall | null> {
  if (!scientificName?.trim()) return null;
  try {
    const url = `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(scientificName.trim())}+q:A`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const recordings: any[] = Array.isArray(data?.recordings) ? data.recordings : [];
    if (recordings.length === 0) return null;

    const usable = recordings.filter(
      (r) => r["file-mp3"] && licenseAllowed(r.lic),
    );
    if (usable.length === 0) return null;

    // Prefer "call" over "song"
    const call = usable.find((r) => /call/i.test(r.type ?? ""));
    const song = usable.find((r) => /song/i.test(r.type ?? ""));
    const pick = call ?? song ?? usable[0];

    return {
      id: String(pick.id),
      url: pick["file-mp3"],
      recordist: pick.rec ?? "Unknown",
      license: pick.lic ?? "",
      type: pick.type ?? "call",
    };
  } catch (err) {
    console.warn("[xeno-canto] fetch failed:", err);
    return null;
  }
}

/** Pretty-prints a xeno-canto license URL into "CC BY-NC". */
export function formatLicense(lic: string): string {
  if (!lic) return "CC";
  const m = lic.match(/\/licenses\/([a-z-]+)\//i);
  if (m) return `CC ${m[1].toUpperCase()}`;
  return lic;
}
