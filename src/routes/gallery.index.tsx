import { createFileRoute } from "@tanstack/react-router";
import { GalleryView } from "@/components/gallery/GalleryView";

type GallerySearch = { q?: string };

export const Route = createFileRoute("/gallery/")({
  validateSearch: (search: Record<string, unknown>): GallerySearch => ({
    q: typeof search.q === "string" && search.q.length > 0 ? search.q : undefined,
  }),
  component: GalleryIndexPage,
});

function GalleryIndexPage() {
  const { q } = Route.useSearch();
  return <GalleryView q={q} />;
}
