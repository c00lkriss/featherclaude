import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coolkriss — Bird Photography from India" },
      { name: "description", content: "Award-winning bird photography from across the Indian subcontinent. Explore galleries by taxonomy, read field notes, and discover the beauty of avian life." },
      { property: "og:title", content: "Coolkriss — Bird Photography from India" },
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
  created_at: string;
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
  const { data: featured } = useQuery({
    queryKey: ["featured-photos"],
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, title, image_url, thumbnail_url, order_name")
        .eq("is_featured", true)
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const slides = featured && featured.length > 0 ? featured : null;
  const count = slides?.length ?? 4;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);

  return (
    <section className="relative h-screen w-full overflow-hidden -mt-16">
      {/* Slides */}
      <div className="absolute inset-0">
        {slides
          ? slides.map((p, i) => (
              <div
                key={p.id}
                className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
                style={{ opacity: i === idx ? 1 : 0 }}
              >
                <div
                  key={`${p.id}-${idx === i ? "on" : "off"}`}
                  className={`absolute inset-0 bg-cover bg-center ${i === idx ? "animate-ken-burns" : ""}`}
                  style={{ backgroundImage: `url(${p.image_url})` }}
                />
              </div>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
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

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/90" />

      {/* Overlay text */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="mb-6 text-xs font-light uppercase tracking-[0.4em] text-primary animate-fade-in-slow">
          Bird Photography · India
        </p>
        <h1 className="font-display text-6xl font-bold leading-none text-foreground md:text-8xl lg:text-9xl animate-fade-in-slow">
          Coolkriss
        </h1>
        <p className="mt-8 max-w-xl text-base font-light leading-relaxed text-muted-foreground md:text-lg animate-fade-in-slow">
          Quiet moments in the wild — a visual archive of birds across the Indian subcontinent.
        </p>
        <div className="mt-12 flex items-center gap-6 animate-fade-in-slow">
          <Link
            to="/gallery"
            className="rounded-none border border-primary bg-primary/90 px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary"
          >
            Enter the Gallery
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
    </section>
  );
}

/* ------------------------ PHOTO STRIP ------------------------ */

function PhotoStrip() {
  const { data } = useQuery({
    queryKey: ["strip-photos"],
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, title, image_url, thumbnail_url, order_name")
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

  return (
    <section className="border-y border-border/30 bg-surface py-12 overflow-hidden">
      <StripRow photos={row1} direction="left" />
      <div className="h-4" />
      <StripRow photos={row2} direction="right" />
    </section>
  );
}

function StripRow({ photos, direction }: { photos: Photo[]; direction: "left" | "right" }) {
  const repeated = [...photos, ...photos];
  return (
    <div className="marquee-wrap overflow-hidden">
      <div
        className={`flex w-max gap-3 ${direction === "left" ? "marquee-track-left" : "marquee-track-right"}`}
      >
        {repeated.map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            className="group relative h-40 w-40 flex-shrink-0 -mx-1 overflow-hidden rounded-sm bg-muted shadow-md transition-all duration-300 hover:z-10 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)]"
          >
            {p.image_url ? (
              <img
                src={p.thumbnail_url || p.image_url}
                alt={p.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(${135 + i * 23}deg, oklch(0.18 0.04 ${(i * 47) % 360}), oklch(0.08 0.02 ${(i * 73) % 360}))`,
                }}
              />
            )}
          </div>
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
      const counts = new Map<string, { count: number; image: string | null }>();
      (photosData ?? []).forEach((p) => {
        const cur = counts.get(p.order_name) ?? { count: 0, image: null };
        counts.set(p.order_name, {
          count: cur.count + 1,
          image: cur.image ?? p.image_url,
        });
      });
      return (ordersData ?? []).map((o: TaxonomyOrder) => ({
        ...o,
        count: counts.get(o.order_name)?.count ?? 0,
        coverImage: o.icon_url ?? counts.get(o.order_name)?.image ?? null,
      }));
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
              to="/gallery/$order/$family"
              params={{ order: o.order_name, family: "all" }}
              className="group relative block aspect-[3/4] overflow-hidden rounded-sm bg-surface"
            >
              {o.coverImage ? (
                <img
                  src={o.coverImage}
                  alt={o.order_name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
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
                  {o.count} {o.count === 1 ? "Photo" : "Photos"}
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
                    src={post.cover_image_url}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
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
                {new Date(post.created_at).toLocaleDateString("en-US", {
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
