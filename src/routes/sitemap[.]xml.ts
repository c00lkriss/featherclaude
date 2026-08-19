import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://coolkriss.in";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/gallery", changefreq: "daily", priority: "0.9" },
          { path: "/map", changefreq: "weekly", priority: "0.8" },
          { path: "/blog", changefreq: "weekly", priority: "0.8" },
          { path: "/about-birds", changefreq: "monthly", priority: "0.7" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
        ];

        // Fetch all unique species from database
        let speciesEntries: SitemapEntry[] = [];
        try {
          const { data } = await supabaseAdmin
            .from("photos")
            .select("species_identifier, created_at")
            .not("species_identifier", "is", null)
            .order("created_at", { ascending: false });

          if (data) {
            const seen = new Set<string>();
            speciesEntries = data
              .filter((row: any) => {
                if (!row.species_identifier || seen.has(row.species_identifier))
                  return false;
                seen.add(row.species_identifier);
                return true;
              })
              .map((row: any) => ({
                path: `/species/${row.species_identifier}`,
                lastmod: row.created_at ? row.created_at.split("T")[0] : undefined,
                changefreq: "monthly",
                priority: "0.8",
              }));
          }
        } catch {
          // DB unavailable — serve static sitemap only
        }

        const allEntries = [...staticEntries, ...speciesEntries];

        const toUrl = (e: SitemapEntry) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n");

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...allEntries.map(toUrl),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
