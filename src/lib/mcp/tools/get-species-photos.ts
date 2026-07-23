import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_species_photos",
  title: "Get photos for a species",
  description: "Return all Coolkriss photos for a given species_identifier (base slug shared by every photo of that species).",
  inputSchema: {
    species_identifier: z.string().min(1).describe("Species identifier slug, e.g. 'common-hawk-cuckoo'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ species_identifier }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("photos")
      .select("id, common_name, species_name, species_slug, family_name, order_name, location, latitude, longitude, date_taken, image_url, description, iucn_status, is_featured")
      .eq("species_identifier", species_identifier)
      .order("date_taken", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { photos: data ?? [] },
    };
  },
});
