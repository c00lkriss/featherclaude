// Server-side proxy for xeno-canto.org API (avoids browser CORS).
// POST { species_name, common_name } → { found, id, recordist, license, type, country, embed_url }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const ALLOWED_LICENSES = ["by", "by-nc", "by-sa", "by-nc-sa"];

function licenseAllowed(lic: string | undefined | null): boolean {
  if (!lic) return false;
  const s = String(lic).toLowerCase();
  return ALLOWED_LICENSES.some((t) => s.includes(`/licenses/${t}/`)) ||
    ALLOWED_LICENSES.some((t) => s.includes(`cc-${t}`));
}

function formatLicense(lic: string): string {
  if (!lic) return "CC";
  const m = lic.match(/\/licenses\/([a-z-]+)\/([0-9.]+)/i);
  if (m) return `CC ${m[1].toUpperCase()} ${m[2]}`;
  return lic;
}

async function queryXC(q: string): Promise<any[]> {
  const url = `https://www.xeno-canto.org/api/2/recordings?query=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": "coolkriss.in/1.0" } });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  const recs = Array.isArray(data?.recordings) ? data.recordings : [];
  return recs.filter((r: any) => r["file-mp3"] && licenseAllowed(r.lic));
}

function pickBest(recs: any[]): any | null {
  if (recs.length === 0) return null;
  const calls = recs.filter((r) => /call/i.test(r.type ?? ""));
  const pool = calls.length ? calls : recs;
  const india = pool.find((r) => /india/i.test(r.cnt ?? ""));
  return india ?? pool[0];
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
    if (sci) recs = await queryXC(`${sci} q:A type:call`);
    if (recs.length === 0 && common) recs = await queryXC(`${common} q:A type:call`);
    if (recs.length === 0 && sci) recs = await queryXC(`${sci} q:A`);
    if (recs.length === 0 && common) recs = await queryXC(`${common} q:A`);

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
        recordist: pick.rec ?? "Unknown",
        license: formatLicense(pick.lic ?? ""),
        type: pick.type ?? "call",
        country: pick.cnt ?? null,
        url: pick["file-mp3"] ?? null,
        embed_url: `https://xeno-canto.org/${id}/embed?darkbg=1`,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ found: false, error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
