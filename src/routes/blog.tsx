import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Field Notes — Coolkriss" },
      { name: "description", content: "Stories, field notes, and photography tips from the wild." },
      { property: "og:title", content: "Field Notes — Coolkriss" },
      { property: "og:description", content: "Stories, field notes, and photography tips from the wild." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
          Blog
        </h1>
        <p className="mt-3 text-muted-foreground">
          Stories, field notes, and photography tips from the wild.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-muted-foreground">Blog post grid will be displayed here.</p>
      </div>
    </div>
  );
}
