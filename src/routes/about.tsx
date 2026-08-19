import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Gokul Krishna Addanki · Coolkriss" },
      {
        name: "description",
        content:
          "Wildlife and bird photographer based in Hyderabad, India. Documenting India's avian diversity through the lens since 2014.",
      },
      { property: "og:title", content: "About — Gokul Krishna Addanki · Coolkriss" },
      {
        property: "og:description",
        content:
          "Wildlife and bird photographer based in Hyderabad, India. Documenting India's avian diversity through the lens since 2014.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: "https://coolkriss.in/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://coolkriss.in/about" }],
  }),
  component: AboutPage,
});

type GearGroup = { category: string; items: string[] };

const FALLBACK_GEAR: GearGroup[] = [
  { category: "Camera Bodies", items: ["Canon EOS R5", "Nikon D500", "Sony A1"] },
  { category: "Lenses", items: ["500mm f/4 L IS", "100-400mm f/4.5-5.6 zoom", "600mm f/4 L IS"] },
  { category: "Support", items: ["Gitzo Series 5 Tripod", "Wimberley WH-200 Head", "Field hide / blind"] },
  {
    category: "Accessories",
    items: ["Camouflage netting", "Binoculars 10x42", "Field guides (Grimmett & Inskipp)"],
  },
];

const FALLBACK_BIO =
  "A passionate birder and photographer documenting the incredible avian diversity of India and beyond. Every photograph is a story of patience, light, and a fleeting moment in the wild. With over a decade behind the lens, I have chased birds from the Himalayan heights to the coastal wetlands of southern India — each expedition adding new chapters to an ongoing visual story of our remarkable avifauna.";

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!target) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setCount(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function StatCard({ value, label }: { value: number; label: string }) {
  const { count, ref } = useCountUp(value);
  return (
    <div
      ref={ref}
      className="flex flex-col items-center px-4 sm:border-l sm:border-border/30 sm:first:border-l-0 sm:px-6 md:px-10"
    >
      <span className="font-display text-4xl font-semibold" style={{ color: "#c9a84c" }}>
        {count}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function AboutPage() {
  const { data: settings } = useSiteSettings();
  const portraitUrl = settings?.portrait_url || "";

  const { data: stats } = useQuery({
    queryKey: ["about-stats"],
    queryFn: async () => {
      const [speciesRes, photosRes, ebirdRes, locRes] = await Promise.all([
        supabase.from("photos").select("species_identifier").not("species_identifier", "is", null),
        supabase.from("photos").select("id", { count: "exact", head: true }),
        supabase
          .from("ebird_lifelist")
          .select("id", { count: "exact", head: true })
          .eq("category", "species")
          .eq("countable", 1),
        supabase
          .from("photos")
          .select("location")
          .not("location", "is", null)
          .not("location", "eq", ""),
      ]);
      return {
        speciesPhotographed: new Set((speciesRes.data ?? []).map((r: any) => r.species_identifier)).size,
        photosPublished: photosRes.count ?? 0,
        speciesObserved: ebirdRes.count ?? 0,
        locationsVisited: new Set((locRes.data ?? []).map((r: any) => r.location)).size,
      };
    },
  });

  let gear: GearGroup[] = FALLBACK_GEAR;
  if (settings?.gear_list) {
    try {
      const parsed = JSON.parse(settings.gear_list);
      if (Array.isArray(parsed) && parsed.length > 0) gear = parsed;
    } catch {
      gear = FALLBACK_GEAR;
    }
  }

  const instagram = settings?.instagram_url || "https://www.instagram.com/coolkriss/";
  const youtube = settings?.youtube_url || "https://www.youtube.com/@CoolKrissGokul";
  const socialCls = "transition-all duration-200 hover:scale-110 hover:brightness-125";

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="w-full bg-background px-6 pb-16 pt-24">
        <div className="mx-auto max-w-[1800px]">
          <div className="grid gap-12 md:grid-cols-5 md:gap-16">
            <div className="flex flex-col items-center md:col-span-2">
              {portraitUrl ? (
                <img
                  src={portraitUrl}
                  alt="Gokul Krishna Addanki"
                  className="h-48 w-48 rounded-full border-4 object-cover object-center md:h-64 md:w-64"
                  style={{ borderColor: "#c9a84c" }}
                />
              ) : (
                <div
                  className="flex h-48 w-48 items-center justify-center rounded-full bg-surface md:h-64 md:w-64"
                  style={{ borderColor: "#c9a84c" }}
                >
                  <span className="font-display text-5xl" style={{ color: "#c9a84c" }}>
                    GKA
                  </span>
                </div>
              )}

              <div className="mt-8 flex gap-4">
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  style={{ color: "#c9a84c" }}
                  className={socialCls}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a
                  href={youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  style={{ color: "#c9a84c" }}
                  className={socialCls}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.8 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>
                </a>
              </div>
            </div>

            <div className="md:col-span-3">
              <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
                Gokul Krishna Addanki
              </h1>
              <p className="mt-2 text-xs uppercase tracking-[0.3em]" style={{ color: "#c9a84c" }}>
                Wildlife &amp; Bird Photographer
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Hyderabad, India · Photographing since 2014
              </p>
              <p className="mt-6 max-w-prose whitespace-pre-line text-sm font-light leading-relaxed text-muted-foreground">
                {settings?.about_bio || FALLBACK_BIO}
              </p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-0 md:mt-16">
            <StatCard value={stats?.speciesPhotographed ?? 0} label="Species Photographed" />
            <StatCard value={stats?.photosPublished ?? 0} label="Photographs Published" />
            <StatCard value={stats?.speciesObserved ?? 0} label="Species Observed via eBird" />
            <StatCard value={stats?.locationsVisited ?? 0} label="Locations Visited" />
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="w-full bg-surface py-20">
        <div className="mx-auto max-w-4xl px-6">
          <blockquote
            className="border-l-4 py-2 pl-8 text-left"
            style={{ borderColor: "#c9a84c" }}
          >
            <p className="font-display text-2xl font-light italic leading-relaxed text-foreground md:text-3xl">
              “I photograph birds not to collect them, but to understand them.”
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">— Gokul Krishna Addanki</footer>
          </blockquote>
        </div>
      </section>

      {/* GEAR */}
      <section className="w-full bg-background py-20">
        <div className="mx-auto max-w-[1800px] px-6">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">What's in the Bag</p>
          <h2 className="mb-12 font-display text-4xl font-semibold text-foreground">The Kit</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gear.map((g) => (
              <div key={g.category} className="rounded-sm border border-border/30 bg-surface p-6">
                <p className="mb-3 text-xs uppercase tracking-[0.25em] text-primary">{g.category}</p>
                <ul>
                  {(g.items ?? []).map((it) => (
                    <li
                      key={it}
                      className="border-b border-border/20 py-1 text-sm font-light text-muted-foreground last:border-0"
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-surface py-20 text-center">
        <h2 className="mb-8 font-display text-3xl font-semibold text-foreground">
          Explore the collection
        </h2>
        <div className="flex flex-wrap justify-center gap-4 px-6">
          <Link
            to="/gallery"
            className="border border-primary px-8 py-3 text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-background"
          >
            Explore Gallery →
          </Link>
          <Link
            to="/map"
            className="bg-primary px-8 py-3 text-xs uppercase tracking-widest text-background transition-opacity hover:opacity-90"
          >
            View the Map →
          </Link>
        </div>
      </section>
    </div>
  );
}
