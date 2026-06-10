import { supabase } from "@/integrations/supabase/client";

export type TaxonomyHit = {
  source: "photos" | "ebird" | null;
  order_name?: string;
  family_name?: string;
  genus?: string;
  species_name?: string;
  iucn_status?: string;
};

/**
 * Cross-references a common name against existing photos (priority)
 * then ebird_lifelist (fallback) to auto-populate taxonomy fields.
 */
export async function lookupTaxonomyByCommonName(commonName: string): Promise<TaxonomyHit> {
  const name = commonName?.trim();
  if (!name) return { source: null };

  // 1) Existing photos table — most reliable
  try {
    const { data } = await supabase
      .from("photos")
      .select("order_name, family_name, genus, species_name, iucn_status")
      .ilike("common_name", `%${name}%`)
      .not("order_name", "is", null)
      .limit(1);
    if (data?.[0]) {
      const r = data[0] as any;
      return {
        source: "photos",
        order_name: r.order_name || undefined,
        family_name: r.family_name || undefined,
        genus: r.genus || undefined,
        species_name: r.species_name || undefined,
        iucn_status: r.iucn_status || undefined,
      };
    }
  } catch {
    /* ignore */
  }

  // 2) eBird life list — only has scientific_name; derive genus
  try {
    const { data } = await supabase
      .from("ebird_lifelist")
      .select("scientific_name, common_name")
      .ilike("common_name", `%${name}%`)
      .limit(1);
    if (data?.[0]) {
      const sci = (data[0] as any).scientific_name as string | null;
      const genus = sci ? sci.split(/\s+/)[0] : undefined;
      return {
        source: "ebird",
        species_name: sci || undefined,
        genus,
      };
    }
  } catch {
    /* ignore */
  }

  return { source: null };
}
