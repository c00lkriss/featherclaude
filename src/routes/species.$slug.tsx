import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info, MapPin, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type SpeciesSearch = { p?: string };

export const Route = createFileRoute("/species/$slug")({
  validateSearch: (search: Record<string, unknown>): SpeciesSearch => ({
    p: typeof search.p === "string" && search.p.length > 0 ? search.p : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Coolkriss` },
      { name: "description", content: "Full-screen bird photograph viewer with EXIF and taxonomy." },
    ],
  }),
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
          "id, title, description, common_name, species_name, species_slug, species_identifier, order_name, family_name, genus, image_url, thumbnail_url, location, latitude, longitude, date_taken, camera, lens, iso, aperture, shutter_speed, focal_length, iucn_status",
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

  return (
    <div
      className="fixed inset-0 z-[60]"
      style={{ backgroundColor: "#0a0a0a" }}
      onMouseMove={() => setChromeVisible(true)}
      onMouseLeave={() => setChromeVisible(false)}
    >

      {current ? (
        <img
          src={current.image_url}
          alt={current.common_name || current.species_name}
          className="absolute inset-0 m-auto h-full w-full object-contain"
        />
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
            "absolute left-6 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/60 p-3 text-foreground backdrop-blur-md transition-all duration-300 hover:bg-background/80 hover:text-primary",
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
            "absolute right-6 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/60 p-3 text-foreground backdrop-blur-md transition-all duration-300 hover:bg-background/80 hover:text-primary",
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
