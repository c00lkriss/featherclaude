import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery/$order/$family")({
  head: () => ({
    meta: [
      { title: "Gallery — Coolkriss" },
      { name: "description", content: "Filtered bird photography gallery." },
      { property: "og:title", content: "Gallery — Coolkriss" },
      { property: "og:description", content: "Filtered bird photography gallery." },
    ],
  }),
  component: FilteredGalleryPage,
});

function FilteredGalleryPage() {
  const { order, family } = Route.useParams();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          {order}
        </p>
        <h1 className="font-display mt-1 text-4xl font-bold text-foreground md:text-5xl">
          {family}
        </h1>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-muted-foreground">Filtered gallery for {family} will appear here.</p>
      </div>
    </div>
  );
}
