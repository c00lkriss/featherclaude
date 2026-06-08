import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map — My World Through a Lens — Coolkriss" },
      {
        name: "description",
        content:
          "Every pin a moment, every species a memory. Explore bird photography locations across the world.",
      },
      { property: "og:title", content: "My World — Through a Lens" },
      {
        property: "og:description",
        content: "Bird photography locations and lifers across the world.",
      },
    ],
  }),
  component: MapPage,
});

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const CLUSTER_CSS = "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css";
const CLUSTER_DEFAULT_CSS =
  "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css";
const CLUSTER_JS =
  "https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js";

function loadCSS(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any)._loaded) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      (s as any)._loaded = true;
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

type PhotoRow = {
  id: string;
  common_name: string | null;
  species_name: string;
  species_identifier: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  thumbnail_url: string | null;
  image_url: string;
};

type LifelistRow = {
  id: string;
  common_name: string | null;
  scientific_name: string | null;
  date_observed: string | null;
  location: string | null;
  state_province: string | null;
  checklist_id: string | null;
};

function MapPage() {
  return (
    <div className="bg-background">
      <Header />
      <StatsBar />
      <MapView />
      <Wishlist />
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto max-w-7xl px-6 pt-16 text-center">
      <p className="mb-3 text-xs font-light uppercase tracking-[0.3em] text-primary">
        Field Map
      </p>
      <h1 className="font-display text-4xl font-semibold text-foreground md:text-6xl">
        My World — Through a Lens
      </h1>
      <p className="mt-4 text-base font-light text-muted-foreground">
        Every pin is a moment. Every species a memory.
      </p>
    </header>
  );
}

/* ---------------- Stats ---------------- */

function useStats() {
  return useQuery({
    queryKey: ["map-stats"],
    queryFn: async () => {
      const [{ data: photos }, { count: observedCount }, { data: lifelist }] =
        await Promise.all([
          supabase.from("photos").select("species_identifier, species_name, location"),
          supabase
            .from("ebird_lifelist")
            .select("id", { count: "exact", head: true })
            .eq("category", "species")
            .eq("countable", 1),
          supabase
            .from("ebird_lifelist")
            .select("scientific_name")
            .eq("category", "species")
            .eq("countable", 1),
        ]);

      const photoSpecies = new Set(
        (photos ?? []).map((p) => p.species_identifier).filter(Boolean),
      );
      const photoSciNames = new Set(
        (photos ?? []).map((p) => (p.species_name ?? "").toLowerCase()).filter(Boolean),
      );
      const locations = new Set(
        (photos ?? [])
          .map((p) => (p.location ?? "").trim())
          .filter((l) => l.length > 0),
      );

      const observed = observedCount ?? 0;
      const photographed = photoSpecies.size;
      const wishlistCount = (lifelist ?? []).filter(
        (l) => !photoSciNames.has((l.scientific_name ?? "").toLowerCase()),
      ).length;

      return {
        photographed,
        observed,
        locations: locations.size,
        wishlist: Math.max(wishlistCount, 0),
      };
    },
  });
}

function StatsBar() {
  const { data } = useStats();
  return (
    <section className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-4 px-6 md:grid-cols-4">
      <StatCard label="Species Photographed" value={data?.photographed ?? 0} />
      <StatCard label="Species Observed" value={data?.observed ?? 0} />
      <StatCard label="Locations Visited" value={data?.locations ?? 0} />
      <StatCard
        label="Yet to Photograph"
        sub="lifers still to capture"
        value={data?.wishlist ?? 0}
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 1500;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className="rounded-sm border border-border bg-surface p-6 text-center">
      <p className="text-[10px] font-light uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </p>
      <p className="font-display mt-3 text-4xl font-semibold text-primary md:text-5xl">
        {display.toLocaleString()}
      </p>
      {sub && (
        <p className="mt-1 text-[10px] font-light uppercase tracking-widest text-muted-foreground/70">
          {sub}
        </p>
      )}
    </div>
  );
}

/* ---------------- Map ---------------- */

function MapView() {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  const { data: photos } = useQuery({
    queryKey: ["map-photos"],
    queryFn: async (): Promise<PhotoRow[]> => {
      const { data, error } = await supabase
        .from("photos")
        .select(
          "id, common_name, species_name, species_identifier, location, latitude, longitude, thumbnail_url, image_url",
        )
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      if (error) throw error;
      return (data ?? []) as PhotoRow[];
    },
  });

  // Load Leaflet + cluster
  useEffect(() => {
    let cancelled = false;
    loadCSS(LEAFLET_CSS);
    loadCSS(CLUSTER_CSS);
    loadCSS(CLUSTER_DEFAULT_CSS);
    (async () => {
      try {
        await loadScript(LEAFLET_JS);
        await loadScript(CLUSTER_JS);
        if (!cancelled) setReady(true);
      } catch (e) {
        console.error("[map] leaflet load failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapEl.current || !photos) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapEl.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      worldCopyJump: true,
    });

    L.tileLayer(
      "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap contributors © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    // Group by location
    type Loc = {
      name: string;
      lat: number;
      lng: number;
      photos: PhotoRow[];
      species: Set<string>;
    };
    const groups = new Map<string, Loc>();
    photos.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;
      const key = (p.location ?? `${p.latitude.toFixed(3)},${p.longitude.toFixed(3)}`).trim();
      if (!groups.has(key)) {
        groups.set(key, {
          name: key || "Unknown",
          lat: p.latitude,
          lng: p.longitude,
          photos: [],
          species: new Set(),
        });
      }
      const g = groups.get(key)!;
      g.photos.push(p);
      g.species.add(p.species_identifier);
    });

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
    });

    Array.from(groups.values()).forEach((g) => {
      const count = g.photos.length;
      const html = `
        <div style="
          background:#c9a84c;
          color:#1a1a1a;
          width:36px;height:36px;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-weight:600;font-size:12px;
          border:2px solid rgba(255,255,255,0.85);
          box-shadow:0 4px 14px rgba(201,168,76,0.5);
        ">${count}</div>`;
      const icon = L.divIcon({
        html,
        className: "coolkriss-pin",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const marker = L.marker([g.lat, g.lng], { icon });
      marker.bindTooltip(
        `<strong>${escapeHtml(g.name)}</strong><br/>${g.species.size} species`,
        { direction: "top", offset: [0, -10] },
      );

      const thumbs = g.photos
        .slice(0, 3)
        .map(
          (p) =>
            `<img src="${p.thumbnail_url || p.image_url}" alt="" style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin-right:4px;"/>`,
        )
        .join("");
      const galleryHref = `/gallery?location=${encodeURIComponent(g.name)}`;
      const popup = `
        <div style="min-width:200px;color:#1a1a1a">
          <div style="font-weight:600;margin-bottom:4px">${escapeHtml(g.name)}</div>
          <div style="font-size:12px;color:#555;margin-bottom:8px">
            ${g.species.size} species · ${g.photos.length} photo${g.photos.length === 1 ? "" : "s"}
          </div>
          <div style="display:flex;margin-bottom:8px">${thumbs}</div>
          <a href="${galleryHref}" style="
            display:inline-block;font-size:12px;font-weight:500;
            color:#8a7028;text-decoration:none;
          ">View photos →</a>
        </div>`;
      marker.bindPopup(popup);
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);

    if (groups.size > 0) {
      try {
        const bounds = L.latLngBounds(
          Array.from(groups.values()).map((g) => [g.lat, g.lng]),
        );
        map.fitBounds(bounds.pad(0.3), { maxZoom: 8 });
      } catch {
        // ignore
      }
    }

    return () => {
      map.remove();
    };
  }, [ready, photos]);

  return (
    <section className="mt-14 w-full">
      <div
        ref={mapEl}
        className="w-full bg-surface"
        style={{ height: "70vh" }}
        aria-label="World map of bird photography locations"
      />
      {!ready && (
        <p className="mt-2 text-center text-xs font-light text-muted-foreground">
          Loading map…
        </p>
      )}
    </section>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------------- Wishlist ---------------- */

const WISHLIST_PAGE = 20;

function Wishlist() {
  const { data: photoSpecies } = useQuery({
    queryKey: ["wishlist-photo-species"],
    queryFn: async () => {
      const { data } = await supabase.from("photos").select("species_name");
      return new Set(
        (data ?? []).map((p) => (p.species_name ?? "").toLowerCase()),
      );
    },
  });

  const { data: lifelist } = useQuery({
    queryKey: ["wishlist-lifelist"],
    queryFn: async (): Promise<LifelistRow[]> => {
      const { data, error } = await supabase
        .from("ebird_lifelist")
        .select(
          "id, common_name, scientific_name, date_observed, location, state_province, checklist_id",
        )
        .eq("category", "species")
        .eq("countable", 1)
        .order("common_name");
      if (error) throw error;
      return (data ?? []) as LifelistRow[];
    },
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => setPage(0), [search]);

  const wishlist = useMemo(() => {
    if (!lifelist || !photoSpecies) return [];
    return lifelist.filter(
      (r) => !photoSpecies.has((r.scientific_name ?? "").toLowerCase()),
    );
  }, [lifelist, photoSpecies]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return wishlist;
    return wishlist.filter(
      (r) =>
        (r.common_name ?? "").toLowerCase().includes(term) ||
        (r.scientific_name ?? "").toLowerCase().includes(term),
    );
  }, [wishlist, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / WISHLIST_PAGE));
  const pageRows = filtered.slice(page * WISHLIST_PAGE, (page + 1) * WISHLIST_PAGE);

  const observed = lifelist?.length ?? 0;
  const photographed = observed - wishlist.length;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
        My Photographic Wishlist <span className="text-primary">🎯</span>
      </h2>
      <p className="mt-2 text-sm font-light text-muted-foreground">
        Species observed in the field but not yet photographed.
      </p>
      <p className="mt-3 text-xs font-light uppercase tracking-[0.2em] text-muted-foreground">
        {observed} observed · {photographed} photographed · {wishlist.length} on the wishlist
      </p>

      <div className="relative mt-8">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by common or scientific name…"
          className="w-full rounded-sm border border-border bg-surface px-12 py-3 text-sm text-foreground placeholder:font-light placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left text-[10px] font-light uppercase tracking-[0.2em] text-muted-foreground">
              <th className="px-4 py-3">Common name</th>
              <th className="px-4 py-3">Scientific name</th>
              <th className="px-4 py-3">Date observed</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3 text-right">Checklist</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm font-light text-muted-foreground">
                  {wishlist.length === 0
                    ? "Upload your eBird life list in admin to populate the wishlist."
                    : "No matches."}
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr key={r.id} className="border-t border-border/60 text-foreground">
                  <td className="px-4 py-3 font-medium">{r.common_name}</td>
                  <td className="px-4 py-3 italic text-muted-foreground">
                    {r.scientific_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.date_observed ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.location ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.state_province ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.checklist_id ? (
                      <a
                        href={`https://ebird.org/checklist/${r.checklist_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between text-xs font-light uppercase tracking-[0.2em] text-muted-foreground">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-sm border border-border px-4 py-2 hover:border-primary hover:text-primary disabled:opacity-40"
          >
            ← Prev
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-sm border border-border px-4 py-2 hover:border-primary hover:text-primary disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          to="/gallery"
          className="text-xs font-medium uppercase tracking-[0.25em] text-primary hover:underline"
        >
          ← Back to gallery
        </Link>
      </div>
    </section>
  );
}
