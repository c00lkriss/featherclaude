import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Coolkriss" },
      { name: "description", content: "Browse the complete bird photography gallery by taxonomy order and family." },
      { property: "og:title", content: "Gallery — Coolkriss" },
      { property: "og:description", content: "Browse the complete bird photography gallery by taxonomy order and family." },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
          Gallery
        </h1>
        <p className="mt-3 text-muted-foreground">
          Browse by taxonomy — orders, families, and species.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-muted-foreground">Gallery grid will be displayed here.</p>
      </div>
    </div>
  );
}
