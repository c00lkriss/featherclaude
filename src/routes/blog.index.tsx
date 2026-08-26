import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sizedImage } from "@/lib/image-url";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Field Notes — Coolkriss" },
      { name: "description", content: "Stories, field notes, and photography tips from the wild." },
      { property: "og:title", content: "Field Notes — Coolkriss" },
      { property: "og:description", content: "Stories, field notes, and photography tips from the wild." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogPage,
});

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  created_at: string | null;
};

export const formatPostDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

function BlogPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", "published"],
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, tags, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">Field Notes</h1>
        <p className="mt-3 text-muted-foreground">
          Stories, field notes, and photography tips from the wild.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-sm border border-border bg-surface">
              <div className="aspect-[3/2] w-full bg-background" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 rounded bg-background" />
                <div className="h-4 w-full rounded bg-background" />
              </div>
            </div>
          ))}
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-surface/50 p-16 text-center">
          <p className="font-display text-xl text-foreground">No field notes published yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            New stories from the field are on their way — check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-col overflow-hidden rounded-sm border border-border bg-surface transition-colors hover:border-primary/60"
            >
              <div className="aspect-[3/2] w-full overflow-hidden bg-background">
                {p.cover_image_url ? (
                  <img
                    src={sizedImage(p.cover_image_url, { width: 800, quality: 75, resize: "cover" })}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background to-surface">
                    <span className="font-display text-2xl text-primary/40">Coolkriss</span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  {formatPostDate(p.created_at)}
                </div>
                <h2 className="mt-2 font-display text-xl text-foreground group-hover:text-primary">
                  {p.title}
                </h2>
                {p.excerpt && (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {p.excerpt}
                  </p>
                )}
                {p.tags && p.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-sm border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
