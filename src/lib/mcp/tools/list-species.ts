import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_species",
  title: "List photographed species",
  description:
    "List distinct bird species photographed on Coolkriss with photo counts. Optionally filter by order or family.",
  inputSchema: {
    order_name: z.string().optional().describe("Filter by taxonomic order (e.g. Passeriformes)."),
    family_name: z.string().optional().describe("Filter by taxonomic family (e.g. Columbidae)."),
    limit: z.number().int().min(1).max(200).optional().describe("Maximum species to return (default 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_name, family_name, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("photos")
      .select("common_name, species_name, species_identifier, family_name, order_name");
    if (order_name) q = q.eq("order_name", order_name);
    if (family_name) q = q.eq("family_name", family_name);
    const { data, error } = await q.limit(2000);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const counts = new Map<string, { common_name: string; species_name: string; species_identifier: string; family_name: string; order_name: string; count: number }>();
    for (const row of data ?? []) {
      const key = row.species_identifier ?? row.species_name;
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { ...row, count: 1 });
    }
    const species = Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit ?? 100);
    return {
      content: [{ type: "text", text: JSON.stringify(species, null, 2) }],
      structuredContent: { species },
    };
  },
});
