import { supabase } from "@/integrations/supabase/client";

export type XenoCantoCall = {
  id: string;
  url: string | null;
  recordist: string;
  license: string;
  type: string;
  country: string | null;
  embed_url: string;
};

/**
 * Fetches the best call recording via the `fetch-bird-call` edge function
 * (server-side proxy to xeno-canto.org — avoids browser CORS).
 */
export async function fetchXenoCantoCall(
  scientificName: string | null | undefined,
  commonName?: string | null,
): Promise<XenoCantoCall | null> {
  const sci = scientificName?.trim() ?? "";
  const common = commonName?.trim() ?? "";
  if (!sci && !common) return null;

  try {
    const { data, error } = await supabase.functions.invoke("fetch-bird-call", {
      body: { species_name: sci, common_name: common },
    });
    if (error) {
      console.warn("[fetch-bird-call] invoke failed:", error.message);
      return null;
    }
    if (!data || !data.found) return null;
    return {
      id: String(data.id),
      url: data.url ?? null,
      recordist: data.recordist ?? "Unknown",
      license: data.license ?? "",
      type: data.type ?? "call",
      country: data.country ?? null,
      embed_url: data.embed_url,
    };
  } catch (err) {
    console.warn("[fetch-bird-call] error:", err);
    return null;
  }
}

/** Pretty license string — function already formatted server-side, kept for compatibility. */
export function formatLicense(lic: string): string {
  if (!lic) return "CC";
  if (lic.startsWith("CC ")) return lic;
  const m = lic.match(/\/licenses\/([a-z-]+)\/([0-9.]+)/i);
  if (m) return `CC ${m[1].toUpperCase()} ${m[2]}`;
  return lic;
}
