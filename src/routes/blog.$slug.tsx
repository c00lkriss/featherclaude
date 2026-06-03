import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({
    meta: [
      { title: "Blog Post — Coolkriss" },
      { name: "description", content: "Read the full story." },
      { property: "og:title", content: "Blog Post — Coolkriss" },
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
        {slug.replace(/-/g, " ")}
      </h1>
      <div className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-muted-foreground">Full blog post content will appear here.</p>
      </div>
    </div>
  );
}
