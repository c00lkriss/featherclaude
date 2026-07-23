import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_ebird_wishlist",
  title: "List eBird wishlist species",
  description:
    "List countable species from the eBird life list that have NOT yet been photographed on Coolkriss (the wishlist). Useful for planning next shoots.",
  inputSchema: {
    limit: z.number().int().min(1).max(500).optional().describe("Maximum species to return (default 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const [ebirdRes, photosRes] = await Promise.all([
      supabase
        .from("ebird_lifelist")
        .select("common_name, scientific_name, category, ebird_lat, ebird_long")
        .eq("category", "species"),
      supabase.from("photos").select("species_name"),
    ]);
    if (ebirdRes.error) return { content: [{ type: "text", text: ebirdRes.error.message }], isError: true };
    if (photosRes.error) return { content: [{ type: "text", text: photosRes.error.message }], isError: true };
    const photographed = new Set(
      (photosRes.data ?? [])
        .map((p) => (p.species_name ?? "").trim().toLowerCase())
        .filter(Boolean),
    );
    const wishlist = (ebirdRes.data ?? [])
      .filter((row) => !photographed.has((row.scientific_name ?? "").trim().toLowerCase()))
      .slice(0, limit ?? 100);
    return {
      content: [{ type: "text", text: JSON.stringify(wishlist, null, 2) }],
      structuredContent: { wishlist },
    };
  },
});
