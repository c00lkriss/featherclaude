import { createFileRoute } from "@tanstack/react-router";
import { GalleryView } from "@/components/gallery/GalleryView";

export const Route = createFileRoute("/gallery/$order/$family")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.family} — ${params.order} — Coolkriss` },
      { name: "description", content: `Bird photographs from the family ${params.family} (order ${params.order}).` },
      { property: "og:title", content: `${params.family} — Coolkriss` },
      { property: "og:description", content: `Bird photographs from the family ${params.family}.` },
    ],
  }),
  component: FamilyGalleryPage,
});

function FamilyGalleryPage() {
  const { order, family } = Route.useParams();
  return <GalleryView order={order} family={family} />;
}
