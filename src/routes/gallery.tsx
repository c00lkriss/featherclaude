import { createFileRoute, Outlet } from "@tanstack/react-router";

type GallerySearch = { q?: string };

export const Route = createFileRoute("/gallery")({
  validateSearch: (search: Record<string, unknown>): GallerySearch => ({
    q: typeof search.q === "string" && search.q.length > 0 ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Gallery — Coolkriss" },
      { name: "description", content: "Browse bird photography by taxonomy. Filter by order, family, or search by species name." },
      { property: "og:title", content: "Gallery — Coolkriss" },
      { property: "og:description", content: "Browse bird photography by taxonomy across the Indian subcontinent." },
    ],
  }),
  component: () => <Outlet />,
});
