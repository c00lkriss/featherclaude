// Xeno-canto API v3 proxy with API key (avoids browser CORS, keeps key secret).
// POST { species_name, common_name } → { found, id, embed_url, recordist, license, type, country }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_KEY = Deno.env.get("XENO_CANTO_KEY") ?? "";

async function queryXC(q: string): Promise<any[]> {
  if (!API_KEY) {
    console.error("XENO_CANTO_KEY not configured");
    return [];
  }
  const url = `https://xeno-canto.org/api/3/recordings?query=${encodeURIComponent(q)}&key=${API_KEY}`;
  const res = await fetch(url, { headers: { "User-Agent": "coolkriss.in/1.0" } });
  if (!res.ok) {
    console.warn("xeno-canto query failed", res.status, q);
    return [];
  }
  const data = await res.json().catch(() => null);
  return Array.isArray(data?.recordings) ? data.recordings : [];
}

function pickBest(recs: any[]): any | null {
  if (recs.length === 0) return null;
  const india = recs.find((r) => /india/i.test(r.cnt ?? ""));
  if (india) return india;
  const aQ = recs.find((r) => (r.q ?? "").toUpperCase() === "A");
  return aQ ?? recs[0];
}

function formatLicense(lic: string): string {
  if (!lic) return "CC";
  const m = lic.match(/\/licenses\/([a-z-]+)\/([0-9.]+)/i);
  if (m) return `CC ${m[1].toUpperCase()} ${m[2]}`;
  return lic;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sci = (body.species_name ?? "").trim();
    const common = (body.common_name ?? "").trim();
    if (!sci && !common) {
      return new Response(JSON.stringify({ found: false, error: "missing_name" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    let recs: any[] = [];

    // Step 1: common name + call filter
    if (common) {
      recs = await queryXC(`en:"${common}" q:A type:call`);
    }

    // Step 2: scientific name + call filter
    if (recs.length === 0 && sci) {
      const parts = sci.split(/\s+/);
      const gen = parts[0];
      const sp = parts[1];
      if (gen && sp) {
        recs = await queryXC(`gen:${gen} sp:${sp} q:A type:call`);
      }
    }

    // Step 3: drop type filter, common name
    if (recs.length === 0 && common) {
      recs = await queryXC(`en:"${common}" q:A`);
    }

    // Step 4: drop type filter, scientific
    if (recs.length === 0 && sci) {
      const parts = sci.split(/\s+/);
      const gen = parts[0];
      const sp = parts[1];
      if (gen && sp) recs = await queryXC(`gen:${gen} sp:${sp} q:A`);
    }

    const pick = pickBest(recs);
    if (!pick) {
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const id = String(pick.id);
    return new Response(
      JSON.stringify({
        found: true,
        id,
        embed_url: `https://xeno-canto.org/${id}/embed?darkbg=1`,
        recordist: pick.rec ?? "Unknown",
        license: formatLicense(pick.lic ?? ""),
        type: pick.type ?? "call",
        country: pick.cnt ?? null,
        url: pick["file-mp3"] ?? null,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("fetch-bird-call error", err);
    return new Response(JSON.stringify({ found: false, error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
