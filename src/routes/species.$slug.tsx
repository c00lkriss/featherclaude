import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/species/$slug")({
  head: () => ({
    meta: [
      { title: "Species — Coolkriss" },
      { name: "description", content: "Detailed species information and photographs." },
      { property: "og:title", content: "Species — Coolkriss" },
      { property: "og:description", content: "Detailed species information and photographs." },
    ],
  }),
  component: SpeciesPage,
});

function SpeciesPage() {
  const { slug } = Route.useParams();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
        Species
      </p>
      <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
        {slug.replace(/-/g, " ")}
      </h1>
      <div className="mt-10 rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-muted-foreground">Full-screen species viewer will appear here.</p>
      </div>
    </div>
  );
}
