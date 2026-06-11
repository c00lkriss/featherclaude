import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = Record<string, string>;

export const DEFAULT_FAVICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path fill='%23c9a84c' d='M4 18c2-6 8-10 14-8 4 1 6 4 8 7l4-1-2 3 3 2-5 1c-1 3-4 5-8 5-7 0-12-4-14-9z'/><circle cx='22' cy='13' r='1.2' fill='%23111'/></svg>";

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SiteSettings> => {
      const { data } = await supabase.from("site_settings").select("key, value");
      const out: SiteSettings = {};
      (data ?? []).forEach((r: any) => {
        if (r?.key) out[r.key] = r.value ?? "";
      });
      return out;
    },
  });
}
