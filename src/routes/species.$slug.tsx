import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info, MapPin, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/species/$slug")({
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
};

function SpeciesPage() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const [infoOpen, setInfoOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  // Lock body scroll while viewer is open
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
          "id, title, description, common_name, species_name, species_slug, order_name, family_name, genus, image_url, thumbnail_url, location, latitude, longitude, date_taken, camera, lens, iso, aperture, shutter_speed, focal_length",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Deduplicate by species_slug — first occurrence wins (latest)
      const seen = new Set<string>();
      return (data ?? []).filter((p) => {
        if (seen.has(p.species_slug)) return false;
        seen.add(p.species_slug);
        return true;
      }) as Photo[];
    },
  });

  const index = useMemo(
    () => photos?.findIndex((p) => p.species_slug === slug) ?? -1,
    [photos, slug],
  );

  const current = index >= 0 ? photos![index] : null;
  const prev = index > 0 ? photos![index - 1] : null;
  const next = photos && index >= 0 && index < photos.length - 1 ? photos[index + 1] : null;

  const navigate = useNavigateTo();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prev) navigate(`/species/${prev.species_slug}`);
      else if (e.key === "ArrowRight" && next) navigate(`/species/${next.species_slug}`);
      else if (e.key === "i" || e.key === "I") setInfoOpen((v) => !v);
      else if (e.key === "Escape") router.history.back();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, router, navigate]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-background"
      onMouseMove={() => setChromeVisible(true)}
      onMouseLeave={() => setChromeVisible(false)}
    >
      {/* Image */}
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

      {/* Top bar */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-background/80 to-transparent px-6 py-5 transition-opacity duration-300",
          chromeVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <button
          onClick={() => router.history.back()}
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

      {/* Prev / Next arrows */}
      {prev && (
        <button
          onClick={() => navigate(`/species/${prev.species_slug}`)}
          aria-label="Previous"
          className={cn(
            "absolute left-6 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/60 p-3 text-foreground backdrop-blur-md transition-all duration-300 hover:bg-background/80 hover:text-primary",
            chromeVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {next && (
        <button
          onClick={() => navigate(`/species/${next.species_slug}`)}
          aria-label="Next"
          className={cn(
            "absolute right-6 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/60 p-3 text-foreground backdrop-blur-md transition-all duration-300 hover:bg-background/80 hover:text-primary",
            chromeVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Info button */}
      <button
        onClick={() => setInfoOpen((v) => !v)}
        aria-label="Toggle info"
        className={cn(
          "absolute bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-background/60 text-primary backdrop-blur-md transition-all duration-300 hover:bg-primary hover:text-primary-foreground",
          chromeVisible || infoOpen ? "opacity-100" : "opacity-0",
        )}
      >
        {infoOpen ? <X className="h-5 w-5" /> : <Info className="h-5 w-5" />}
      </button>

      {/* Info overlay */}
      {current && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 max-h-[75vh] overflow-y-auto border-t border-border/40 bg-background/85 px-6 py-10 backdrop-blur-xl transition-transform duration-500 ease-out md:px-12 md:py-12",
            infoOpen ? "translate-y-0" : "translate-y-full",
          )}
        >
          <InfoPanel photo={current} />
        </div>
      )}
    </div>
  );
}

/* Small hook so we use the typed router push from the route component */
function useNavigateTo() {
  const router = useRouter();
  return (to: string) => router.navigate({ to });
}

/* ---------------- Info Panel ---------------- */

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

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        {/* Left: identity */}
        <div>
          <p className="mb-3 text-xs font-light uppercase tracking-[0.3em] text-primary">
            {photo.order_name} · {photo.family_name}
          </p>
          <h2 className="font-display text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            {photo.common_name || photo.species_name}
          </h2>
          <p className="mt-2 font-body text-base font-light italic text-muted-foreground">
            {photo.species_name}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <TaxRow label="Order" value={photo.order_name} />
            <TaxRow label="Family" value={photo.family_name} />
            <TaxRow label="Genus" value={photo.genus} />
            <TaxRow label="Species" value={photo.species_name} />
          </dl>

          {photo.description && (
            <p className="mt-8 max-w-prose text-sm font-light leading-relaxed text-foreground/80">
              {photo.description}
            </p>
          )}

          {(photo.location || date) && (
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-light text-muted-foreground">
              {photo.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {photo.location}
                  {photo.latitude != null && photo.longitude != null && (
                    <span className="text-muted-foreground/60">
                      ({photo.latitude.toFixed(3)}, {photo.longitude.toFixed(3)})
                    </span>
                  )}
                </span>
              )}
              {date && (
                <span className="uppercase tracking-widest">{date}</span>
              )}
            </div>
          )}
        </div>

        {/* Right: EXIF */}
        <div>
          <p className="mb-4 text-xs font-light uppercase tracking-[0.3em] text-primary">
            Capture
          </p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
            {exif.map((row) => (
              <div key={row.label} className="border-l-2 border-border pl-4">
                <dt className="text-[10px] font-light uppercase tracking-widest text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="mt-1 font-display text-base text-foreground">
                  {row.value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

function TaxRow({ label, value }: { label: string; value: string | null }) {
  return (
    <>
      <dt className="font-light uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="font-body italic text-foreground">{value || "—"}</dd>
    </>
  );
}
