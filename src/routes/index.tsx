import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coolkriss — Bird Photography" },
      { name: "description", content: "Award-winning bird photography from India. Explore the beauty of avian life through stunning visual stories." },
      { property: "og:title", content: "Coolkriss — Bird Photography" },
      { property: "og:description", content: "Award-winning bird photography from India. Explore the beauty of avian life through stunning visual stories." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
        Bird Photography
      </p>
      <h1 className="font-display max-w-4xl text-5xl font-bold leading-tight text-foreground md:text-7xl lg:text-8xl">
        Wings of India
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
        Award-winning bird photography capturing the extraordinary beauty of avian life across the Indian subcontinent.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <a
          href="/gallery"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-amber-dim"
        >
          Explore Gallery
        </a>
        <a
          href="/about-birds"
          className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
        >
          Birds of India
        </a>
      </div>
    </div>
  );
}
