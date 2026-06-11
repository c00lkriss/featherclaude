import { createFileRoute } from "@tanstack/react-router";

const humanize = (slug: string) =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${humanize(params.slug)} — Coolkriss` },
      { name: "description", content: "Read the full story." },
      { property: "og:title", content: `${humanize(params.slug)} — Coolkriss` },
      { property: "og:description", content: "Read the full story." },
    ],
  }),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
        {humanize(slug)}
      </h1>
      <div className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-muted-foreground">Full blog post content will appear here.</p>
      </div>
    </div>
  );
}
