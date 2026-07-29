import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sizedImage } from "@/lib/image-url";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coolkriss — Bird Photography by Gokul Krishna Addanki" },
      { name: "description", content: "Award-winning bird photography from across the Indian subcontinent. Explore galleries by taxonomy, read field notes, and discover the beauty of avian life." },
      { property: "og:title", content: "Coolkriss — Bird Photography by Gokul Krishna Addanki" },
      { property: "og:description", content: "Award-winning bird photography from across the Indian subcontinent." },
    ],
  }),
  component: LandingPage,
});

type Photo = {
  id: string;
  title: string;
  image_url: string;
  thumbnail_url: string | null;
  order_name: string;
  species_slug?: string;
  species_identifier?: string;
  hero_story?: string | null;
  hero_location?: string | null;
};

type TaxonomyOrder = {
  id: string;
  order_name: string;
  description: string | null;
  icon_url: string | null;
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  created_at: string | null;
};

function LandingPage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <PhotoStrip />
      <TaxonomyPreview />
      <LatestBlog />
    </div>
  );
}


/* ----------------------------- HERO ----------------------------- */

function Hero() {
  const navigate = useNavigate();
  const { data: featured } = useQuery({
    queryKey: ["featured-photos"],
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, title, image_url, thumbnail_url, order_name, species_slug, species_identifier, hero_story, hero_location")
        .eq("is_featured", true)
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });
  const goToPhoto = (photo?: Photo) => {
    if (!photo) return;
    const slug = photo.species_identifier || photo.species_slug;
    if (!slug) return;
    sessionStorage.setItem("gallery:lastPath", "/gallery");
    navigate({ to: "/species/$slug", params: { slug }, search: { p: photo.id } });
  };

  const slides = featured && featured.length > 0 ? featured : null;
  const count = slides?.length ?? 4;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 8000);
    return () => clearInterval(t);
  }, [count]);

  return (
    <section
      className="relative w-full overflow-hidden -mt-16"
      style={{ height: "100vh", minHeight: "100vh" }}
    >
      {/* Slides */}
      <div className="absolute inset-0">
        {slides
          ? slides.map((p, i) => {
              const isActive = i === idx;
              // Only render (and download) the active slide + immediate neighbour.
              const isNext = i === (idx + 1) % count;
              const shouldRender = isActive || isNext;
              return (
                <div
                  key={p.id}
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: isActive ? 1 : 0 }}
                >
                  {shouldRender && (
                    <div
                      key={`${p.id}-${isActive ? "on" : "off"}`}
                      className={`absolute inset-0 bg-cover bg-center ${isActive ? "animate-ken-burns" : ""}`}
                      style={{ backgroundImage: `url(${sizedImage(p.image_url, { width: 1920, quality: 85, resize: "cover" })})` }}
                    />
                  )}
                </div>
              );
            })
          : Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{ opacity: i === idx ? 1 : 0 }}
              >
                <div
                  className={`absolute inset-0 ${i === idx ? "animate-ken-burns" : ""}`}
                  style={{
                    background: [
                      "linear-gradient(135deg, oklch(0.25 0.08 60), oklch(0.08 0.02 30))",
                      "linear-gradient(135deg, oklch(0.20 0.07 200), oklch(0.06 0.02 240))",
                      "linear-gradient(135deg, oklch(0.28 0.09 30), oklch(0.10 0.03 20))",
                      "linear-gradient(135deg, oklch(0.22 0.06 150), oklch(0.07 0.02 170))",
                    ][i],
                  }}
                />
              </div>
            ))}
      </div>

      {/* Hidden preload for the active slide, high priority for LCP */}
      {slides && slides[idx] && (
        <img
          src={sizedImage(slides[idx].image_url, { width: 1920, quality: 80 })}
          alt=""
          aria-hidden
          // @ts-expect-error lowercase attr
          fetchpriority="high"
          decoding="async"
          className="hidden"
        />
      )}


      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/90 pointer-events-none" />

      {/* Subtle radial darken behind text for readability */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.15)_55%,transparent_80%)] pointer-events-none" />

      {/* Clickable layer to open current slide */}
      {slides && slides[idx] && (
        <button
          type="button"
          aria-label={`View ${slides[idx].title}`}
          onClick={() => goToPhoto(slides[idx])}
          className="absolute inset-0 z-[5] cursor-pointer"
        />
      )}

      {/* Overlay text */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center">
        <p className="mb-6 text-xs font-light uppercase tracking-[0.4em] text-primary animate-fade-in-slow">
          Bird Photography · India
        </p>
        <h1 className="font-display text-6xl font-bold leading-none text-foreground md:text-8xl lg:text-9xl animate-fade-in-slow">
          Coolkriss
        </h1>
        <p className="mt-8 max-w-xl text-base font-light leading-relaxed text-muted-foreground md:text-lg animate-fade-in-slow">
          Quiet moments in the wild — a visual archive of birds across the Indian subcontinent.
        </p>

        {/* Photographer branding + optional field-note for current STAR image */}
        {slides && slides[idx] && (
          <div key={`meta-${slides[idx].id}`} className="mt-8 flex flex-col items-center gap-2 animate-fade-in-slow">
            <p className="font-display text-lg font-medium text-foreground md:text-xl">
              Gokul Krishna Addanki
            </p>
            <p className="text-[10px] font-light uppercase tracking-[0.3em] text-muted-foreground">
              Wildlife Photographer • Birder • Conservationist
            </p>
            {slides[idx].hero_story && (
              <p className="mt-3 max-w-lg font-display text-base italic leading-relaxed text-foreground/90 md:text-lg">
                “{slides[idx].hero_story}”
              </p>
            )}
            {slides[idx].hero_location && (
              <p className="text-[11px] font-light uppercase tracking-[0.25em] text-primary/90">
                {slides[idx].hero_location}
              </p>
            )}
          </div>
        )}

        {/* Social row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 animate-fade-in-slow">
          <a
            href="https://www.instagram.com/coolkriss/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-white/90 transition-all duration-200 hover:scale-105 hover:text-white"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            <span className="text-xs font-light tracking-widest">@coolkriss</span>
          </a>
          <a
            href="https://www.youtube.com/watch?v=5WxexOSekdM"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Watch latest video"
            className="group relative flex h-14 w-24 items-center justify-center overflow-hidden rounded-sm border border-white/20 bg-black/40 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-white/50"
          >
            <img
              src="https://img.youtube.com/vi/5WxexOSekdM/mqdefault.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
              loading="lazy"
            />
            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-black shadow-lg">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </span>
          </a>
        </div>
        <div className="mt-12 flex items-center gap-6 animate-fade-in-slow">
          <Link
            to="/gallery"
            className="rounded-none border border-primary bg-primary/90 px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary"
          >
            Explore Gallery
          </Link>
          <Link
            to="/about-birds"
            className="text-xs font-medium uppercase tracking-widest text-foreground/80 transition-colors hover:text-primary"
          >
            Birds of India →
          </Link>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-[2px] transition-all duration-500 ${
                i === idx ? "w-10 bg-primary" : "w-6 bg-foreground/30"
              }`}
            />
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------ PHOTO STRIP ------------------------ */

function PhotoStrip() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["strip-photos"],
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, title, image_url, thumbnail_url, order_name, species_slug, species_identifier")
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data ?? [];
    },
  });

  const photos = data && data.length > 0 ? data : Array.from({ length: 16 }).map((_, i) => ({
    id: `placeholder-${i}`,
    title: "",
    image_url: "",
    thumbnail_url: null,
    order_name: "",
  }));

  const half = Math.ceil(photos.length / 2);
  const row1 = photos.slice(0, half);
  const row2 = photos.slice(half).length > 0 ? photos.slice(half) : photos.slice(0, half);

  const onPick = (photo: Photo) => {
    const slug = photo.species_identifier || photo.species_slug;
    if (!slug) return;
    sessionStorage.setItem("gallery:lastPath", "/gallery");
    navigate({ to: "/species/$slug", params: { slug }, search: { p: photo.id } });
  };

  return (
    <section className="border-y border-border/30 bg-surface py-12 overflow-hidden">
      <StripRow photos={row1} direction="left" onPick={onPick} />
      <div className="h-4" />
      <StripRow photos={row2} direction="right" onPick={onPick} />
    </section>
  );
}

function StripRow({ photos, direction, onPick }: { photos: Photo[]; direction: "left" | "right"; onPick: (photo: Photo) => void }) {
  const repeated = [...photos, ...photos];
  return (
    <div className="marquee-wrap overflow-hidden">
      <div
        className={`flex w-max gap-3 ${direction === "left" ? "marquee-track-left" : "marquee-track-right"}`}
      >
        {repeated.map((p, i) => (
          <button
            type="button"
            key={`${p.id}-${i}`}
            onClick={() => onPick(p)}
            disabled={!(p.species_identifier || p.species_slug)}
            className="group relative flex h-[220px] w-auto flex-shrink-0 items-center justify-center overflow-hidden rounded-sm shadow-md transition-all duration-300 hover:z-10 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] disabled:cursor-default"
            style={{ backgroundColor: "#0a0a0a" }}
          >
            {p.image_url ? (
              <img
                src={sizedImage(p.thumbnail_url || p.image_url, { width: 400, quality: 70 })}
                srcSet={`${sizedImage(p.thumbnail_url || p.image_url, { width: 400, quality: 70 })} 1x, ${sizedImage(p.thumbnail_url || p.image_url, { width: 800, quality: 70 })} 2x`}
                alt={p.title}
                className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            ) : (

              <div
                className="h-full w-40"
                style={{
                  background: `linear-gradient(${135 + i * 23}deg, oklch(0.18 0.04 ${(i * 47) % 360}), oklch(0.08 0.02 ${(i * 73) % 360}))`,
                }}
              />
            )}
          </button>
        ))}

      </div>
    </div>
  );
}

/* ---------------------- TAXONOMY PREVIEW ---------------------- */

function TaxonomyPreview() {
  const { data: orders } = useQuery({
    queryKey: ["taxonomy-orders-with-counts"],
    queryFn: async () => {
      const [{ data: ordersData }, { data: photosData }] = await Promise.all([
        supabase.from("taxonomy_orders").select("*"),
        supabase.from("photos").select("order_name, image_url"),
      ]);
      const grouped = new Map<string, string[]>();
      (photosData ?? []).forEach((p) => {
        const arr = grouped.get(p.order_name) ?? [];
        arr.push(p.image_url);
        grouped.set(p.order_name, arr);
      });
      const pickRandom = (arr: string[] | undefined) =>
        arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;

      // Start with the taxonomy_orders table, then add any orders that have
      // photos but aren't registered in taxonomy_orders.
      const seen = new Set<string>();
      const base = (ordersData ?? []).map((o: TaxonomyOrder) => {
        seen.add(o.order_name);
        const imgs = grouped.get(o.order_name);
        return {
          ...o,
          count: imgs?.length ?? 0,
          coverImage: o.icon_url ?? pickRandom(imgs),
        };
      });
      const extras = Array.from(grouped.entries())
        .filter(([name]) => !seen.has(name))
        .map(([name, imgs]) => ({
          id: `derived-${name}`,
          order_name: name,
          description: null,
          icon_url: null,
          count: imgs.length,
          coverImage: pickRandom(imgs),
        }));
      return [...base, ...extras].sort((a, b) => b.count - a.count);
    },
  });

  const display =
    orders && orders.length > 0
      ? orders
      : ["Columbiformes", "Passeriformes", "Accipitriformes", "Anseriformes", "Pelecaniformes", "Piciformes", "Strigiformes", "Coraciiformes"].map(
          (name, i) => ({
            id: `placeholder-${i}`,
            order_name: name,
            description: null,
            icon_url: null,
            count: 0,
            coverImage: null,
          }),
        );

  return (
    <section className="bg-background px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex items-end justify-between">
          <div>
            <p className="mb-3 text-xs font-light uppercase tracking-[0.3em] text-primary">
              Taxonomy
            </p>
            <h2 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
              Explore by Order
            </h2>
          </div>
          <Link
            to="/gallery"
            className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary md:block"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {display.slice(0, 8).map((o, i) => (
            <Link
              key={o.id}
              to="/gallery/$order"
              params={{ order: o.order_name }}
              className="group relative block aspect-[3/4] overflow-hidden rounded-sm bg-surface"
            >
              {o.coverImage ? (
                <img
                  src={sizedImage(o.coverImage, { width: 800, quality: 75 })}
                  srcSet={`${sizedImage(o.coverImage, { width: 800, quality: 75 })} 1x, ${sizedImage(o.coverImage, { width: 1600, quality: 75 })} 2x`}
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  alt={o.order_name}
                  className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />


              ) : (
                <div
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(${135 + i * 41}deg, oklch(0.22 0.06 ${(i * 60) % 360}), oklch(0.08 0.02 ${(i * 90) % 360}))`,
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent transition-opacity duration-500 group-hover:opacity-70" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {o.order_name}
                </h3>
                <p className="mt-1 text-xs font-light uppercase tracking-widest text-primary">
                  {o.id.startsWith("placeholder-")
                    ? "—"
                    : `${o.count} ${o.count === 1 ? "Photo" : "Photos"}`}
                </p>

              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- LATEST BLOG ----------------------- */

function LatestBlog() {
  const { data: posts } = useQuery({
    queryKey: ["latest-blog"],
    queryFn: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  const display: BlogPost[] =
    posts && posts.length > 0
      ? posts
      : [
          { id: "p1", title: "The Patient Art of Stalking Kingfishers", slug: "#", excerpt: "Hours spent by a quiet stream taught me more about light than any tutorial ever could.", cover_image_url: null, created_at: new Date().toISOString() },
          { id: "p2", title: "On Finding the Indian Pitta", slug: "#", excerpt: "A jewel of the undergrowth, brief and brilliant — and how I almost missed it entirely.", cover_image_url: null, created_at: new Date().toISOString() },
          { id: "p3", title: "Notes From a Monsoon Wetland", slug: "#", excerpt: "When the rains arrive, the birds of Bharatpur transform — here's what I learned watching them.", cover_image_url: null, created_at: new Date().toISOString() },
        ];

  return (
    <section className="border-t border-border/30 bg-surface px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex items-end justify-between">
          <div>
            <p className="mb-3 text-xs font-light uppercase tracking-[0.3em] text-primary">
              Field Notes
            </p>
            <h2 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
              Latest from the Blog
            </h2>
          </div>
          <Link
            to="/blog"
            className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary md:block"
          >
            All Posts →
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {display.map((post, i) => (
            <Link
              key={post.id}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group block"
            >
              <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-sm bg-background">
                {post.cover_image_url ? (
                  <img
                    src={sizedImage(post.cover_image_url, { width: 800, quality: 75 })}
                    srcSet={`${sizedImage(post.cover_image_url, { width: 600, quality: 75 })} 600w, ${sizedImage(post.cover_image_url, { width: 1200, quality: 75 })} 1200w`}
                    sizes="(min-width: 768px) 33vw, 100vw"
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />

                ) : (
                  <div
                    className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(${135 + i * 60}deg, oklch(0.25 0.07 ${(i * 80) % 360}), oklch(0.08 0.02 ${(i * 110) % 360}))`,
                    }}
                  />
                )}
              </div>
              <p className="mb-2 text-[11px] font-light uppercase tracking-[0.25em] text-muted-foreground">
                {new Date(post.created_at ?? Date.now()).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <h3 className="font-display text-2xl font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground line-clamp-3">
                  {post.excerpt}
                </p>
              )}
              <span className="mt-5 inline-block text-xs font-medium uppercase tracking-widest text-primary">
                Read More →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
