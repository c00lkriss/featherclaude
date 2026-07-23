import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_photos",
  title: "Search bird photos",
  description:
    "Search Coolkriss bird photos by common name, scientific name, family, or order. Returns matching photos with species, location, and image URL.",
  inputSchema: {
    query: z.string().min(1).describe("Search text matched against common/scientific/family/order name."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum photos to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const like = `%${query}%`;
    const { data, error } = await supabase
      .from("photos")
      .select("id, common_name, species_name, species_identifier, family_name, order_name, location, date_taken, image_url, is_featured")
      .or(`common_name.ilike.${like},species_name.ilike.${like},family_name.ilike.${like},order_name.ilike.${like}`)
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { photos: data ?? [] },
    };
  },
});
