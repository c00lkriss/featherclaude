import { Link } from "@tanstack/react-router";
import { sizedImage } from "@/lib/image-url";

export type BlogCardPost = {
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

export function PostCard({ post }: { post: BlogCardPost }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-sm border border-border bg-surface transition-colors hover:border-primary/60">
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="block">
        <div className="aspect-[3/2] w-full overflow-hidden bg-background">
          {post.cover_image_url ? (
            <img
              src={sizedImage(post.cover_image_url, { width: 800, quality: 75, resize: "cover" })}
              alt={post.title}
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
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          {formatPostDate(post.created_at)}
        </div>
        <Link to="/blog/$slug" params={{ slug: post.slug }}>
          <h2 className="mt-2 font-display text-xl text-foreground group-hover:text-primary">
            {post.title}
          </h2>
        </Link>
        {post.excerpt && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Link
                key={t}
                to="/blog/tag/$tag"
                params={{ tag: t }}
                className="rounded-sm border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
              >
                {t}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
