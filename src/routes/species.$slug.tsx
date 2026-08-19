import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info, MapPin, X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { BirdCallPlayer } from "@/components/BirdCallPlayer";
import { getWikipediaUrl } from "@/lib/wikipedia";
import { lqip, sizedImage } from "@/lib/image-url";
import { useSiteSettings } from "@/lib/site-settings";


type SpeciesSearch = { p?: string };

export const Route = createFileRoute("/species/$slug")({
  validateSearch: (search: Record<string, unknown>): SpeciesSearch => ({
    p: typeof search.p === "string" && search.p.length > 0 ? search.p : undefined,
  }),
  head: ({ params }) => {
    const slug = params.slug;
    const cleanSlug = slug.replace(/-[a-z0-9]{4}$/, "");
    const speciesName = cleanSlug
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const title = `${speciesName} — Bird Photography · Coolkriss`;
    const description = `Photograph of ${speciesName} by Gokul Krishna Addanki. Explore bird photography from India organised by taxonomy at coolkriss.in`;
    const ogImage = `https://coolkriss.in/og-default.jpg`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: "Coolkriss" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@coolkriss" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
      ],
    };
  },
  component: SpeciesPage,
});

type Photo = {
  id: string;
  title: string;
  description: string | null;
  common_name: string | null;
  species_name: string;
  species_slug: string;
  species_identifier: string;
  order_name: string;
  family_name: string;
  genus: string | null;
  image_url: string;
  thumbnail_url: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  date_taken: string | null;
  camera: string | null;
  lens: string | null;
  iso: number | null;
  aperture: string | null;
  shutter_speed: string | null;
  focal_length: string | null;
  iucn_status: string | null;
  xeno_canto_id: string | null;
  xeno_canto_url: string | null;
  xeno_canto_recordist: string | null;
  xeno_canto_license: string | null;
};

const IUCN_COLORS: Record<string, string> = {
  "Least Concern": "#4CAF50",
  "Near Threatened": "#8BC34A",
  "Vulnerable": "#FFC107",
  "Endangered": "#FF5722",
  "Critically Endangered": "#F44336",
  "Data Deficient": "#9E9E9E",
  "Not Evaluated": "#9E9E9E",
};

function SpeciesPage() {
  const { slug } = Route.useParams();
  const { p: pSearch } = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate();
  const [infoOpen, setInfoOpen] = useState(true);
  const [chromeVisible, setChromeVisible] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    if (localStorage.getItem("swipe-hint-seen")) return;
    setShowSwipeHint(true);
    const t = setTimeout(() => {
      setShowSwipeHint(false);
      localStorage.setItem("swipe-hint-seen", "1");
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx < 50 && absDy < 50) return;
    if (absDx >= absDy) {
      if (dx < 0 && next) goPhoto(next);
      else if (dx > 0 && prev) goPhoto(prev);
    } else {
      if (dy < -60 && !infoOpen) setInfoOpen(true);
      else if (dy > 60 && infoOpen) setInfoOpen(false);
    }
  }

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const { data: photos } = useQuery({
    queryKey: ["species-viewer-list"],
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await supabase
        .from("photos")
        .select(
          "id, title, description, common_name, species_name, species_slug, species_identifier, order_name, family_name, genus, image_url, thumbnail_url, location, latitude, longitude, date_taken, camera, lens, iso, aperture, shutter_speed, focal_length, iucn_status, xeno_canto_id, xeno_canto_url, xeno_canto_recordist, xeno_canto_license",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Group: keep order of first appearance of each species_identifier, then
      // place all photos of that species consecutively.
      const groups = new Map<string, Photo[]>();
      for (const row of (data ?? []) as Photo[]) {
        const key = row.species_identifier || row.species_slug;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      }
      const ordered: Photo[] = [];
      groups.forEach((arr) => ordered.push(...arr));
      return ordered;
    },
  });

  const index = useMemo(() => {
    if (!photos) return -1;
    if (pSearch) {
      const i = photos.findIndex((p) => p.id === pSearch && p.species_identifier === slug);
      if (i >= 0) return i;
    }
    return photos.findIndex((p) => p.species_identifier === slug);
  }, [photos, slug, pSearch]);

  const current = index >= 0 ? photos![index] : null;
  const prev = index > 0 ? photos![index - 1] : null;
  const next = photos && index >= 0 && index < photos.length - 1 ? photos[index + 1] : null;

  const goPhoto = (target: Photo) => {
    router.navigate({
      to: "/species/$slug",
      params: { slug: target.species_identifier },
      search: { p: target.id },
    });
  };

  const handleBackToGallery = () => {
    let target = "/gallery";
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("gallery:lastPath");
      if (saved && saved.startsWith("/gallery")) target = saved;
    }
    navigate({ to: target });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prev) goPhoto(prev);
      else if (e.key === "ArrowRight" && next) goPhoto(next);
      else if (e.key === "i" || e.key === "I") setInfoOpen((v) => !v);
      else if (e.key === "Escape") handleBackToGallery();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prev, next]);

  const { data: settings } = useSiteSettings();
  const logoUrl = settings?.logo_url || "";
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadAgreed, setDownloadAgreed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: nearbyPhotos } = useQuery({
    queryKey: ["nearby-species", current?.order_name, current?.species_identifier],
    enabled: !!current?.order_name,
    queryFn: async () => {
      const { data } = await supabase
        .from("photos")
        .select("id, common_name, species_name, species_identifier, image_url, order_name")
        .eq("order_name", current!.order_name)
        .neq("species_identifier", current!.species_identifier)
        .order("created_at", { ascending: false })
        .limit(24);
      const seen = new Set<string>();
      return (data ?? [])
        .filter((p: any) => {
          if (seen.has(p.species_identifier)) return false;
          seen.add(p.species_identifier);
          return true;
        })
        .slice(0, 12);
    },
  });

  async function handleDownload() {
    if (!current) return;
    setDownloading(true);
    try {
      const photoResp = await fetch(current.image_url);
      const photoBlob = await photoResp.blob();
      const photoBitmap = await createImageBitmap(photoBlob);

      const canvas = document.createElement("canvas");
      let w = photoBitmap.width;
      let h = photoBitmap.height;
      const maxDim = 1920;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(photoBitmap, 0, 0, w, h);

      if (logoUrl) {
        try {
          const logoResp = await fetch(logoUrl);
          const logoBlob = await logoResp.blob();
          const logoBitmap = await createImageBitmap(logoBlob);
          const logoW = Math.round(w * 0.18);
          const logoH = Math.round((logoW / logoBitmap.width) * logoBitmap.height);
          const padX = Math.round(w * 0.025);
          const padY = Math.round(h * 0.025);
          const logoX = w - logoW - padX;
          const logoY = h - logoH - padY;
          const backing = 14;
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.32)";
          ctx.beginPath();
          if ((ctx as any).roundRect) {
            (ctx as any).roundRect(logoX - backing, logoY - backing, logoW + backing * 2, logoH + backing * 2, 8);
          } else {
            ctx.rect(logoX - backing, logoY - backing, logoW + backing * 2, logoH + backing * 2);
          }
          ctx.fill();
          ctx.globalAlpha = 0.72;
          ctx.drawImage(logoBitmap, logoX, logoY, logoW, logoH);
          ctx.restore();
        } catch {
          addTextWatermark(ctx, w, h, current.common_name);
        }
      } else {
        addTextWatermark(ctx, w, h, current.common_name);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const slug2 = (current.common_name || current.species_name)
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
          a.download = `${slug2}-coolkriss.jpg`;
          a.click();
          URL.revokeObjectURL(url);
          setDownloadOpen(false);
          setDownloadAgreed(false);
        },
        "image/jpeg",
        0.9,
      );
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60]"
      style={{ backgroundColor: "#0a0a0a" }}
      onMouseMove={() => setChromeVisible(true)}
      onMouseLeave={() => setChromeVisible(false)}
    >
      {current && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ImageObject",
              "name": current.common_name || current.title,
              "description": current.description ||
                `Photograph of ${current.common_name} (${current.species_name}) by Gokul Krishna Addanki`,
              "contentUrl": current.image_url,
              "thumbnailUrl": current.thumbnail_url || current.image_url,
              "creator": {
                "@type": "Person",
                "name": "Gokul Krishna Addanki",
                "url": "https://coolkriss.in/about",
                "sameAs": [
                  "https://www.instagram.com/coolkriss/",
                  "https://www.youtube.com/@CoolKrissGokul",
                ],
              },
              "copyrightHolder": {
                "@type": "Person",
                "name": "Gokul Krishna Addanki",
              },
              "copyrightYear": current.date_taken
                ? new Date(current.date_taken).getFullYear()
                : new Date().getFullYear(),
              "license": "https://coolkriss.in/about",
              "acquireLicensePage": "https://coolkriss.in/about",
              "creditText": "© Gokul Krishna Addanki · coolkriss.in",
              "about": {
                "@type": "Thing",
                "name": current.common_name,
                "description": current.species_name,
                "sameAs": `https://en.wikipedia.org/wiki/${(current.common_name || "").replace(/\s+/g, "_")}`,
              },
              ...(current.latitude && current.longitude ? {
                "locationCreated": {
                  "@type": "Place",
                  "name": current.location || "India",
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": current.latitude,
                    "longitude": current.longitude,
                  },
                },
              } : {}),
              ...(current.date_taken ? { "dateCreated": current.date_taken } : {}),
            }),
          }}
        />
      )}

      {current ? (
        <>
          {/* Blurred LQIP fills instantly under the sharp image */}
          {lqip(current.image_url) && (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage: `url("${lqip(current.image_url)}")`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundColor: "#0a0a0a",
                filter: "blur(24px)",
                transform: "scale(1.05)",
              }}
            />
          )}
          <img
            key={current.id}
            src={sizedImage(current.image_url, { width: 1600, quality: 82, resize: "contain" })}
            srcSet={`${sizedImage(current.image_url, { width: 1200, quality: 80, resize: "contain" })} 1200w, ${sizedImage(current.image_url, { width: 1600, quality: 82, resize: "contain" })} 1600w, ${sizedImage(current.image_url, { width: 2400, quality: 82, resize: "contain" })} 2400w, ${current.image_url} 3840w`}
            sizes="100vw"
            alt={current.common_name || current.species_name}
            // @ts-expect-error lowercase attr
            fetchpriority="high"
            decoding="async"
            className="absolute inset-0 m-auto h-full w-full object-contain"
          />
          {/* Prefetch neighbours only */}
          {next && (
            <link rel="prefetch" as="image" href={sizedImage(next.image_url, { width: 1600, quality: 82, resize: "contain" })} />
          )}
          {prev && (
            <link rel="prefetch" as="image" href={sizedImage(prev.image_url, { width: 1600, quality: 82, resize: "contain" })} />
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display text-2xl text-muted-foreground">
            {photos ? "Photograph not found." : "Loading..."}
          </p>
        </div>
      )}



      <div
        className={cn(
          "absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-background/80 to-transparent px-6 py-5 transition-opacity duration-300",
          chromeVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <button
          onClick={handleBackToGallery}
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-foreground/80 transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Gallery
        </button>
        {current && (
          <p className="hidden text-xs font-light uppercase tracking-[0.3em] text-muted-foreground md:block">
            {current.common_name || current.species_name}
          </p>
        )}
        <span className="text-xs font-light tabular-nums text-muted-foreground">
          {photos && index >= 0 ? `${index + 1} / ${photos.length}` : ""}
        </span>
      </div>

      {prev && (
        <button
          onClick={() => goPhoto(prev)}
          aria-label="Previous"
          className={cn(
            "absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-all duration-300 hover:bg-background/80 hover:text-primary md:left-6 md:h-12 md:w-12",
            chromeVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {next && (
        <button
          onClick={() => goPhoto(next)}
          aria-label="Next"
          className={cn(
            "absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-all duration-300 hover:bg-background/80 hover:text-primary md:right-6 md:h-12 md:w-12",
            chromeVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}


      <button
        onClick={() => setInfoOpen((v) => !v)}
        aria-label="Toggle info"
        style={{
          borderColor: "#c9a84c",
          color: infoOpen ? "#111" : "#c9a84c",
          backgroundColor: infoOpen ? "#c9a84c" : "rgba(0,0,0,0.5)",
          boxShadow: infoOpen ? "0 0 24px 4px rgba(201,168,76,0.55)" : "0 0 0 rgba(0,0,0,0)",
        }}
        className={cn(
          "absolute bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 backdrop-blur-md transition-all duration-300",
          chromeVisible || infoOpen ? "opacity-100" : "opacity-0",
        )}
      >
        {infoOpen ? <X className="h-5 w-5" /> : <Info className="h-5 w-5" />}
      </button>

      {current && (
        <BirdCallPlayer
          photoId={current.id}
          scientificName={current.species_name}
          commonName={current.common_name}
          stored={{
            xeno_canto_id: current.xeno_canto_id,
            xeno_canto_url: current.xeno_canto_url,
            xeno_canto_recordist: current.xeno_canto_recordist,
            xeno_canto_license: current.xeno_canto_license,
          }}
          visible={chromeVisible || infoOpen}
        />
      )}

      {current && (
        <button
          onClick={() => {
            setDownloadOpen(true);
            setDownloadAgreed(false);
          }}
          aria-label="Download wallpaper"
          style={{
            borderColor: "#c9a84c",
            color: "#c9a84c",
            backgroundColor: "rgba(0,0,0,0.5)",
            right: "88px",
          }}
          className={cn(
            "absolute bottom-6 z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 backdrop-blur-md transition-all duration-300",
            chromeVisible || infoOpen ? "opacity-100" : "opacity-0",
          )}
        >
          <Download className="h-5 w-5" />
        </button>
      )}

      {current && (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 max-h-[50vh] overflow-y-auto border-t border-white/10 px-5 py-6 transition-transform duration-300 ease-out md:max-h-[45vh] md:px-12 md:py-10",
            infoOpen ? "translate-y-0" : "translate-y-full",
          )}
        >
          <InfoPanel photo={current} />

          {/* NEARBY SPECIES STRIP */}
          {nearbyPhotos && nearbyPhotos.length > 0 && (
            <div className="mx-auto mt-8 max-w-5xl border-t border-white/15 pt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-light uppercase tracking-[0.3em]" style={{ color: "#c9a84c" }}>
                    Same Order
                  </p>
                  <p className="mt-1 text-sm font-light text-white/85">
                    More {current.order_name} birds I've photographed
                  </p>
                </div>
                <Link
                  to="/gallery/$order"
                  params={{ order: current.order_name }}
                  className="whitespace-nowrap text-xs font-medium hover:underline"
                  style={{ color: "#c9a84c" }}
                >
                  See all →
                </Link>
              </div>

              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                {nearbyPhotos.map((p: any) => (
                  <Link
                    key={p.id}
                    to="/species/$slug"
                    params={{ slug: p.species_identifier }}
                    search={{ p: p.id }}
                    className="w-32 flex-shrink-0 group"
                  >
                    <div className="flex h-24 w-32 items-center justify-center overflow-hidden rounded-sm" style={{ backgroundColor: "#111" }}>
                      <img
                        src={sizedImage(p.image_url, { width: 300, quality: 70, resize: "contain" })}
                        alt={p.common_name || p.species_name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-2 truncate text-[11px] font-medium text-white/90">
                      {p.common_name || p.species_name}
                    </p>
                    <p className="truncate text-[10px] font-light italic text-white/60">
                      {p.species_name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOWNLOAD MODAL */}
      {downloadOpen && current && (
        <div
          className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDownloadOpen(false);
          }}
        >
          <div className="relative w-full max-w-md rounded-sm border border-border bg-background p-8">
            <button
              onClick={() => setDownloadOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-display text-xl font-semibold text-foreground">
              Download Wallpaper
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {current.common_name} · {current.species_name}
            </p>

            <div className="mt-6 rounded-sm border border-border/50 bg-surface p-4">
              <p className="text-xs font-medium text-foreground">🖼️ Personal use only</p>
              <p className="mt-2 text-xs font-light leading-relaxed text-muted-foreground">
                This photo may not be used for commercial purposes, advertising, editorial
                publication, or resale without prior written permission from Gokul Krishna Addanki.
              </p>
            </div>

            <p className="mt-4 text-[10px] font-light uppercase tracking-[0.2em] text-muted-foreground">
              © Gokul Krishna Addanki · coolkriss.in · All Rights Reserved · Personal use only
            </p>

            <label className="mt-6 flex items-start gap-3">
              <input
                type="checkbox"
                checked={downloadAgreed}
                onChange={(e) => setDownloadAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#c9a84c]"
              />
              <span className="text-xs font-light leading-relaxed text-muted-foreground">
                I agree this download is for personal use only and will not be used for any
                commercial or editorial purpose.
              </span>
            </label>

            <button
              onClick={handleDownload}
              disabled={!downloadAgreed || downloading}
              className="mt-6 w-full rounded-sm border border-primary bg-primary px-6 py-3 text-xs font-medium uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {downloading ? "Preparing download..." : "Download Wallpaper"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function IucnBadge({ status }: { status: string }) {
  const color = IUCN_COLORS[status] ?? "#9E9E9E";
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white"
      style={{
        backgroundColor: color,
        boxShadow: `0 4px 20px ${color}66, 0 1px 3px rgba(0,0,0,0.4)`,
      }}
    >
      <span className="h-2 w-2 rounded-full bg-white/90" />
      IUCN · {status}
    </span>
  );
}

const TEXT_SHADOW = "0 1px 3px rgba(0,0,0,0.8)";

function InfoPanel({ photo }: { photo: Photo }) {
  const exif: { label: string; value: string | null }[] = [
    { label: "Camera", value: photo.camera },
    { label: "Lens", value: photo.lens },
    { label: "ISO", value: photo.iso?.toString() ?? null },
    { label: "Aperture", value: photo.aperture },
    { label: "Shutter", value: photo.shutter_speed },
    { label: "Focal Length", value: photo.focal_length },
  ];

  const date = photo.date_taken
    ? new Date(photo.date_taken).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const tax = [photo.order_name, photo.family_name, photo.genus].filter(Boolean).join(" › ");

  return (
    <div className="mx-auto max-w-5xl text-white" style={{ textShadow: TEXT_SHADOW }}>
      <h2 className="font-display text-[1.1rem] font-semibold leading-tight md:text-5xl">
        {photo.common_name || photo.species_name}
      </h2>
      <p className="mt-1 font-body text-[0.85rem] font-light italic text-white/80 md:mt-2 md:text-lg">
        {photo.species_name}
      </p>

      {photo.iucn_status && (
        <div className="mt-4 md:mt-5" style={{ textShadow: "none" }}>
          <IucnBadge status={photo.iucn_status} />
        </div>
      )}

      <p className="mt-4 text-[10px] font-light uppercase tracking-[0.3em] text-white/85 md:mt-6 md:text-xs">
        {tax}
      </p>

      {(photo.common_name || photo.species_name) && (
        <a
          href={getWikipediaUrl(photo.common_name || photo.species_name)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline"
          style={{ color: "#c9a84c" }}
        >
          Wikipedia ↗
        </a>
      )}

      {photo.description && (
        <p className="mt-4 max-w-prose text-xs font-light leading-relaxed text-white/90 md:mt-5 md:text-sm">
          {photo.description}
        </p>
      )}

      <div className="my-5 h-px w-full bg-white/20 md:my-8" />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-[0.75rem] md:grid-cols-6 md:gap-x-6 md:gap-y-5 md:text-sm">
        {exif.map((row) => (
          <div key={row.label} className="border-l-2 border-white/30 pl-3">
            <dt className="text-[10px] font-light uppercase tracking-widest text-white/70">
              {row.label}
            </dt>
            <dd className="mt-1 font-display text-xs text-white md:text-sm">
              {row.value || "—"}
            </dd>
          </div>

        ))}
      </dl>

      {(photo.location || date) && (
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-light text-white/85">
          {photo.location && (
            <span className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" style={{ color: "#c9a84c" }} />
              {photo.location}
              {photo.latitude != null && photo.longitude != null && (
                <span className="text-white/60">
                  ({photo.latitude.toFixed(3)}, {photo.longitude.toFixed(3)})
                </span>
              )}
            </span>
          )}
          {date && <span className="uppercase tracking-widest">{date}</span>}
        </div>
      )}
    </div>
  );
}

function addTextWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  name: string | null,
) {
  const fontSize = Math.max(16, Math.round(w * 0.018));
  ctx.font = `${fontSize}px Inter, sans-serif`;
  const text = "© coolkriss.in" + (name ? " · " + name : "");
  const metrics = ctx.measureText(text);
  const padX = Math.round(w * 0.025);
  const padY = Math.round(h * 0.025);
  const tx = w - metrics.width - padX - 12;
  const ty = h - padY - 12;
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.fillRect(tx - 8, ty - fontSize, metrics.width + 16, fontSize + 14);
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  ctx.fillText(text, tx, ty);
}
