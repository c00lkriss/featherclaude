import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard, type BlogCardPost } from "@/components/blog/PostCard";
import { tagListHas } from "@/lib/related";

export const Route = createFileRoute("/blog/tag/$tag")({
  head: ({ params }) => {
    const tag = decodeURIComponent(params.tag);
    const title = `${tag} — Field Notes | Coolkriss`;
    const description = `Field notes and bird photography stories tagged "${tag}" by Gokul Krishna Addanki.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: TagPage,
});

function TagPage() {
  const { tag } = Route.useParams();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", "tag", tag.toLowerCase()],
    queryFn: async (): Promise<BlogCardPost[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, tags, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as BlogCardPost[]).filter((p) => tagListHas(p.tags, tag));
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All Field Notes
      </Link>

      <div className="mb-12 mt-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Tagged</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-foreground md:text-5xl">
          Field notes tagged “{tag}”
        </h1>
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
          <p className="font-display text-xl text-foreground">
            No field notes tagged “{tag}” yet.
          </p>
          <Link
            to="/blog"
            className="mt-4 inline-block text-sm uppercase tracking-widest text-primary hover:underline"
          >
            Browse all field notes
          </Link>
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
