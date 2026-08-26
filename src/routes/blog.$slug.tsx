import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sizedImage } from "@/lib/image-url";

const SITE_OG_DEFAULT = "https://coolkriss.in/og-default.jpg";

const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, content, excerpt, cover_image_url, tags, created_at")
      .eq("slug", params.slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — Coolkriss` : "Field Notes — Coolkriss";
    const description =
      loaderData?.excerpt ?? "Stories, field notes, and photography tips from the wild.";
    const image = loaderData?.cover_image_url
      ? sizedImage(loaderData.cover_image_url, { width: 1200, quality: 80, resize: "cover" })
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
      scripts: loaderData
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: loaderData.title,
                image: image,
                datePublished: loaderData.created_at,
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
  const post = Route.useLoaderData();

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
              <span
                key={t}
                className="rounded-sm border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
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
    </article>
  );
}
