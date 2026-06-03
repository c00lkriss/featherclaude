import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about-birds")({
  head: () => ({
    meta: [
      { title: "Birds of India — Coolkriss" },
      { name: "description", content: "Explore the taxonomy and distribution of birds across India." },
      { property: "og:title", content: "Birds of India — Coolkriss" },
      { property: "og:description", content: "Explore the taxonomy and distribution of birds across India." },
    ],
  }),
  component: AboutBirdsPage,
});

function AboutBirdsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
          Birds of India
        </h1>
        <p className="mt-3 text-muted-foreground">
          Taxonomy and distribution across the subcontinent.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-muted-foreground">Taxonomy and distribution content will appear here.</p>
      </div>
    </div>
  );
}
