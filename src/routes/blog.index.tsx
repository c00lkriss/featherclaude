import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostCard, type BlogCardPost, formatPostDate } from "@/components/blog/PostCard";

export { formatPostDate };

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

function BlogPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", "published"],
    queryFn: async (): Promise<BlogCardPost[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, tags, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogCardPost[];
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
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
