import { supabase } from "@/integrations/supabase/client";

export type EbirdObservation = {
  id: string;
  location: string | null;
  state_province: string | null;
  date_observed: string | null;
  scientific_name: string | null;
  common_name: string | null;
  ebird_lat: number | null;
  ebird_long: number | null;
};

export type EbirdSuggestionTier =
  | "high" // date+species match
  | "good" // rare species (1-5 records)
  | "common" // 6+ records, no date match
  | "new" // not in list
  | "none";

export type EbirdSuggestion = {
  tier: EbirdSuggestionTier;
  message: string;
  location: string | null;
  state_province: string | null;
  date_observed: string | null;
  ebird_lat: number | null;
  ebird_long: number | null;
  alternatives: EbirdObservation[]; // additional observations the user can pick
  totalCount: number;
};

function fmtDate(d: string | null): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function plusDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Cross-reference the user's eBird life list to suggest a location for a photo.
 * See spec — priority cascade: date+species → rare species → common → new.
 */
export async function geteBirdLocationSuggestion(args: {
  scientific_name?: string | null;
  common_name?: string | null;
  photo_date?: string | null;
}): Promise<EbirdSuggestion> {
  const sci = (args.scientific_name ?? "").trim();
  const common = (args.common_name ?? "").trim();
  const date = args.photo_date ?? null;

  if (!sci && !common) {
    return {
      tier: "none",
      message: "",
      location: null,
      state_province: null,
      date_observed: null,
      ebird_lat: null,
      ebird_long: null,
      alternatives: [],
      totalCount: 0,
    };
  }

  // Fetch all matching rows once (life list is small); then split server-roundtrips.
  let q = supabase
    .from("ebird_lifelist")
    .select("id, location, state_province, date_observed, scientific_name, common_name, ebird_lat, ebird_long");
  if (sci) q = q.ilike("scientific_name", sci);
  else q = q.ilike("common_name", common);

  const { data, error } = await q;
  if (error) {
    console.warn("[ebird-suggestion] query failed:", error.message);
  }
  const all = (data ?? []) as EbirdObservation[];

  if (all.length === 0) {
    return {
      tier: "new",
      message: "Not found in your eBird list — this may be a new species for you! 🎉",
      location: null,
      state_province: null,
      date_observed: null,
      ebird_lat: null,
      ebird_long: null,
      alternatives: [],
      totalCount: 0,
    };
  }

  // PRIORITY 1: date+species
  if (date) {
    const lo = plusDays(date, -7);
    const hi = plusDays(date, 7);
    const window = all.filter(
      (r) => r.date_observed && r.date_observed >= lo && r.date_observed <= hi,
    );
    if (window.length > 0) {
      // closest to photo_date
      const target = new Date(date).getTime();
      window.sort(
        (a, b) =>
          Math.abs(new Date(a.date_observed!).getTime() - target) -
          Math.abs(new Date(b.date_observed!).getTime() - target),
      );
      const best = window[0];
      return {
        tier: "high",
        message: `High — matched your eBird record from ${fmtDate(best.date_observed)}`,
        location: best.location,
        state_province: best.state_province,
        date_observed: best.date_observed,
        ebird_lat: best.ebird_lat,
        ebird_long: best.ebird_long,
        alternatives: window.slice(1, 4),
        totalCount: all.length,
      };
    }
  }

  // Sort by date desc for "most recent" lookups
  const sorted = [...all].sort((a, b) => {
    const ad = a.date_observed ?? "";
    const bd = b.date_observed ?? "";
    return bd.localeCompare(ad);
  });

  // PRIORITY 2: rare species (1–5 records)
  if (all.length <= 5) {
    const best = sorted[0];
    return {
      tier: "good",
      message: `Good — you've only seen this species ${all.length} time${all.length === 1 ? "" : "s"}, most recently at ${best.location ?? "—"} on ${fmtDate(best.date_observed)}`,
      location: best.location,
      state_province: best.state_province,
      date_observed: best.date_observed,
      ebird_lat: best.ebird_lat,
      ebird_long: best.ebird_long,
      alternatives: sorted.slice(1),
      totalCount: all.length,
    };
  }

  // PRIORITY 3: common species — no auto-pick
  return {
    tier: "common",
    message: `Common in your list (${all.length} records) — please specify location`,
    location: null,
    state_province: null,
    date_observed: null,
    ebird_lat: null,
    ebird_long: null,
    alternatives: sorted.slice(0, 3),
    totalCount: all.length,
  };
}

/* ---------------- Nominatim geocoder ---------------- */

export type GeocodeResult = { lat: number; lon: number; display_name: string } | null;

export async function geocodeWithNominatim(query: string): Promise<GeocodeResult> {
  if (!query.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!arr || arr.length === 0) return null;
    return {
      lat: parseFloat(arr[0].lat),
      lon: parseFloat(arr[0].lon),
      display_name: arr[0].display_name,
    };
  } catch (err) {
    console.warn("[nominatim] geocode failed:", err);
    return null;
  }
}

/** Extract "Auto selected 32.61616, 74.74960" coordinates if present. */
export function extractAutoSelectedCoords(
  text: string | null | undefined,
): { lat: number; long: number } | null {
  if (!text) return null;
  const m = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const long = parseFloat(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(long)) return null;
  return { lat, long };
}
