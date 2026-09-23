import { createFileRoute } from "@tanstack/react-router";
import { GalleryView } from "@/components/gallery/GalleryView";

export const Route = createFileRoute("/gallery/$order")({
  loader: async ({ params }) => {
    // Fetch one representative photo for og:image
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("photos")
        .select("image_url, common_name")
        .eq("order_name", params.order)
        .not("image_url", "is", null)
        .limit(1)
        .maybeSingle();
      return { coverImage: data?.image_url ?? null };
    } catch {
      return { coverImage: null };
    }
  },

  head: ({ params, loaderData }) => {
    const title = `${params.order} — Bird Gallery · Coolkriss`;
    const description =
      `Browse Gokul Krishna Addanki's photographs of ${params.order} birds ` +
      `from across India and beyond.`;
    const image = loaderData?.coverImage ?? null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Coolkriss" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },

  component: OrderGalleryPage,
});

function OrderGalleryPage() {
  const { order } = Route.useParams();
  return <GalleryView order={order} />;
}
