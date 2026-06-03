import { createFileRoute } from "@tanstack/react-router";
import { GalleryView } from "@/components/gallery/GalleryView";

export const Route = createFileRoute("/gallery/$order")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.order} — Gallery — Coolkriss` },
      { name: "description", content: `Bird photographs from the order ${params.order}.` },
      { property: "og:title", content: `${params.order} — Coolkriss` },
      { property: "og:description", content: `Bird photographs from the order ${params.order}.` },
    ],
  }),
  component: OrderGalleryPage,
});

function OrderGalleryPage() {
  const { order } = Route.useParams();
  return <GalleryView order={order} />;
}
