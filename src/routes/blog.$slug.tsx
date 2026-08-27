import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sizedImage } from "@/lib/image-url";
import { ShareRow } from "@/components/ShareRow";
import { safeFilterTags, tagsMatchPhoto } from "@/lib/related";

const SITE_OG_DEFAULT = "https://coolkriss.in/og-default.jpg";

const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

type RelatedBird = {
  id: string;
  common_name: string | null;
  species_name: string;
  species_identifier: string;
  image_url: string;
  thumbnail_url: string | null;
};

type Neighbour = { slug: string; title: string } | null;

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, content, excerpt, cover_image_url, tags, created_at")
      .eq("slug", params.slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) throw notFound();
    const post = data;

    // --- Birds in this story (exact, case-insensitive tag == name) ---
    let birds: RelatedBird[] = [];
    const filterTags = safeFilterTags(post.tags);
    if (filterTags.length > 0) {
      const orFilter = filterTags
        .map((t) => `common_name.ilike.${t},species_name.ilike.${t}`)
        .join(",");
      const { data: photoRows } = await supabase
        .from("photos")
        .select("id, common_name, species_name, species_identifier, image_url, thumbnail_url")
        .or(orFilter)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      const seen = new Set<string>();
      for (const row of (photoRows ?? []) as RelatedBird[]) {
        if (!tagsMatchPhoto(post.tags, row)) continue;
        if (seen.has(row.species_identifier)) continue;
        seen.add(row.species_identifier);
        birds.push(row);
        if (birds.length >= 6) break;
      }
    }

    // --- Prev (older) / next (newer) published posts ---
    let prev: Neighbour = null;
    let next: Neighbour = null;
    if (post.created_at) {
      const [older, newer] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("slug, title")
          .eq("published", true)
          .lt("created_at", post.created_at)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("blog_posts")
          .select("slug, title")
          .eq("published", true)
          .gt("created_at", post.created_at)
          .order("created_at", { ascending: true })
          .limit(1),
      ]);
      prev = (older.data?.[0] as Neighbour) ?? null;
      next = (newer.data?.[0] as Neighbour) ?? null;
    }

    return { post, birds, prev, next };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    const title = post ? `${post.title} — Coolkriss` : "Field Notes — Coolkriss";
    const description =
      post?.excerpt ?? "Stories, field notes, and photography tips from the wild.";
    const image = post?.cover_image_url
      ? sizedImage(post.cover_image_url, { width: 1200, quality: 80, resize: "cover" })
      : SITE_OG_DEFAULT;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
      scripts: post
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: post.title,
                image: image,
                datePublished: post.created_at,
                description,
                author: { "@type": "Person", name: "Gokul Krishna Addanki" },
                publisher: { "@type": "Organization", name: "Coolkriss" },
              }),
            },
          ]
        : [],
    };
  },
  errorComponent: () => <PostMissing />,
  notFoundComponent: () => <PostMissing />,
  component: BlogPostPage,
});

function PostMissing() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl text-foreground">Post not found</h1>
      <p className="mt-3 text-muted-foreground">This field note isn't available.</p>
      <Link to="/blog" className="mt-6 inline-block text-sm uppercase tracking-widest text-primary">
        Back to Field Notes
      </Link>
    </div>
  );
}

function BlogPostPage() {
  const { post, birds, prev, next } = Route.useLoaderData();

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Field Notes
      </Link>

      {post.cover_image_url && (
        <img
          src={sizedImage(post.cover_image_url, { width: 1600, quality: 80 })}
          alt={post.title}
          className="mt-6 w-full rounded-sm border border-border bg-background object-contain"
        />
      )}

      <header className="mt-8">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          {formatDate(post.created_at)}
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {post.tags.map((t: string) => (
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
        <ShareRow className="mt-6" path={`/blog/${post.slug}`} title={post.title} />
      </header>

      <div className="mt-10 space-y-6 text-[17px] leading-[1.85] text-foreground/90">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: (p) => <h2 className="mt-12 font-display text-3xl text-foreground" {...p} />,
            h2: (p) => <h2 className="mt-12 font-display text-2xl text-foreground" {...p} />,
            h3: (p) => <h3 className="mt-8 font-display text-xl text-foreground" {...p} />,
            p: (p) => <p className="mt-6" {...p} />,
            a: (p) => (
              <a
                className="text-primary underline underline-offset-4 hover:text-primary/80"
                target="_blank"
                rel="noreferrer"
                {...p}
              />
            ),
            ul: (p) => <ul className="mt-6 list-disc space-y-2 pl-6" {...p} />,
            ol: (p) => <ol className="mt-6 list-decimal space-y-2 pl-6" {...p} />,
            blockquote: (p) => (
              <blockquote
                className="mt-8 border-l-2 border-primary/70 bg-surface/60 px-5 py-4 text-muted-foreground italic"
                {...p}
              />
            ),
            hr: () => <hr className="my-12 border-border" />,
            img: ({ src, alt }) => (
              <img
                src={sizedImage(typeof src === "string" ? src : "", { width: 1600, quality: 80 })}
                alt={alt ?? ""}
                loading="lazy"
                decoding="async"
                className="my-10 w-full rounded-sm border border-border bg-background object-contain"
              />
            ),
            code: (p) => (
              <code className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-sm" {...p} />
            ),
          }}
        >
          {post.content ?? ""}
        </ReactMarkdown>
      </div>

      {birds.length > 0 && (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="font-display text-2xl text-foreground">Birds in this story</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {birds.map((b) => (
              <Link
                key={b.id}
                to="/species/$slug"
                params={{ slug: b.species_identifier }}
                className="group overflow-hidden rounded-sm border border-border bg-surface transition-colors hover:border-primary/60"
              >
                <div
                  className="flex h-28 w-full items-center justify-center overflow-hidden"
                  style={{ backgroundColor: "#111" }}
                >
                  <img
                    src={sizedImage(b.thumbnail_url || b.image_url, {
                      width: 400,
                      quality: 72,
                      resize: "contain",
                    })}
                    alt={b.common_name || b.species_name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                    {b.common_name || b.species_name}
                  </p>
                  <p className="truncate text-[11px] font-light italic text-muted-foreground">
                    {b.species_name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-14 border-t border-border pt-8">
        <ShareRow path={`/blog/${post.slug}`} title={post.title} />
      </div>

      {(prev || next) && (
        <nav className="mt-8 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              to="/blog/$slug"
              params={{ slug: prev.slug }}
              className="group rounded-sm border border-border bg-surface p-4 transition-colors hover:border-primary/60"
            >
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                <ChevronLeft className="h-3 w-3" /> Previous
              </span>
              <span className="mt-2 block font-display text-base text-foreground group-hover:text-primary">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              to="/blog/$slug"
              params={{ slug: next.slug }}
              className="group rounded-sm border border-border bg-surface p-4 text-right transition-colors hover:border-primary/60 sm:col-start-2"
            >
              <span className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Next <ChevronRight className="h-3 w-3" />
              </span>
              <span className="mt-2 block font-display text-base text-foreground group-hover:text-primary">
                {next.title}
              </span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
