import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Upload, FileText, Images, Star, ListChecks, AlertCircle, Volume2, Loader2, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchXenoCantoCall } from "@/lib/xeno-canto";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Coolkriss" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [callsRunning, setCallsRunning] = useState(false);
  const [callsProgress, setCallsProgress] = useState({ done: 0, total: 0, found: 0, missing: 0, errors: 0 });
  const [callsLog, setCallsLog] = useState<string[]>([]);


  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [photos, posts, featured, orders] = await Promise.all([
        supabase.from("photos").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("photos").select("id", { count: "exact", head: true }).eq("is_featured", true),
        supabase.from("photos").select("order_name"),
      ]);
      const uniqueOrders = new Set((orders.data ?? []).map((p) => p.order_name)).size;
      return {
        photos: photos.count ?? 0,
        posts: posts.count ?? 0,
        featured: featured.count ?? 0,
        orders: uniqueOrders,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["admin-recent-photos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("photos")
        .select("id, title, common_name, image_url, thumbnail_url, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const runBatchCalls = async () => {
    if (callsRunning) return;
    setCallsRunning(true);
    setCallsProgress({ done: 0, total: 0, found: 0, missing: 0, errors: 0 });
    setCallsLog([]);
    const log = (line: string) => setCallsLog((prev) => [...prev, line].slice(-200));
    try {
      const { data: photos } = await supabase
        .from("photos")
        .select("id, species_name, common_name, created_at")
        .is("xeno_canto_id", null)
        .or("species_name.not.is.null,common_name.not.is.null")
        .order("created_at", { ascending: false });

      const rows = (photos ?? []) as { id: string; species_name: string | null; common_name: string | null }[];

      // Group by species to fetch once per unique species
      const keyOf = (r: { species_name: string | null; common_name: string | null }) =>
        `${(r.species_name || "").trim().toLowerCase()}|${(r.common_name || "").trim().toLowerCase()}`;
      const byKey = new Map<string, { sci: string | null; common: string | null; ids: string[] }>();
      for (const r of rows) {
        const k = keyOf(r);
        if (!byKey.has(k)) byKey.set(k, { sci: r.species_name, common: r.common_name, ids: [] });
        byKey.get(k)!.ids.push(r.id);
      }

      const entries = Array.from(byKey.values());
      setCallsProgress({ done: 0, total: entries.length, found: 0, missing: 0, errors: 0 });
      log(`Found ${entries.length} species across ${rows.length} photos needing bird calls. Starting…`);

      let found = 0, missing = 0, errors = 0;
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const name = e.common || e.sci || "(unknown)";
        try {
          const call = await fetchXenoCantoCall(e.sci, e.common);
          if (call) {
            await supabase.from("photos").update({
              xeno_canto_id: call.id,
              xeno_canto_url: call.url,
              xeno_canto_recordist: call.recordist,
              xeno_canto_license: call.license,
            }).in("id", e.ids);
            found++;
            log(`✓ ${name} — XC${call.id} found${call.country ? ` (${call.country})` : ""}`);
          } else {
            await supabase.from("photos").update({ xeno_canto_id: "not_found" }).in("id", e.ids);
            missing++;
            log(`✗ ${name} — not found`);
          }
        } catch (err: any) {
          errors++;
          log(`⚠ ${name} — API error, skipping`);
          console.warn("xeno-canto fetch failed for", e.sci || e.common, err?.message || err);
        }
        setCallsProgress({ done: i + 1, total: entries.length, found, missing, errors });
        await new Promise((r) => setTimeout(r, 1500));
      }
      log(`Complete: ${found} found · ${missing} not found · ${errors} errors`);
      log(`Refresh a species page to hear calls.`);
      toast.success(`✓ ${found} found · ${missing} not found${errors ? ` · ${errors} errors` : ""}`);
    } finally {
      setCallsRunning(false);
    }
  };


  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <p className="mb-3 text-xs font-light uppercase tracking-[0.3em] text-primary">
            Admin
          </p>
          <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
            Dashboard
          </h1>
        </div>
        <Link
          to="/admin/upload"
          className="hidden rounded-none border border-primary bg-primary/90 px-6 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary md:inline-block"
        >
          Upload Photo
        </Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-4">
        <StatCard label="Total Photos" value={stats?.photos ?? 0} />
        <StatCard label="Blog Posts" value={stats?.posts ?? 0} />
        <StatCard label="Featured" value={stats?.featured ?? 0} />
        <StatCard label="Orders Covered" value={stats?.orders ?? 0} />
      </div>

      {/* Quick actions */}
      <section className="mt-12">
        <h2 className="mb-5 text-xs font-light uppercase tracking-[0.3em] text-muted-foreground">
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <ActionCard to="/admin/upload" icon={<Upload className="h-5 w-5" />} label="Upload Photo" />
          <ActionCard to="/admin/bulk-upload" icon={<Images className="h-5 w-5" />} label="Bulk Upload" />
          <ActionCard to="/admin/manage" icon={<Star className="h-5 w-5" />} label="Manage Photos" />
          <ActionCard to="/admin/ebird" icon={<ListChecks className="h-5 w-5" />} label="eBird List" />
          <ActionCard to="/admin/incomplete" icon={<AlertCircle className="h-5 w-5" />} label="Incomplete" />
          <ActionCard to="/admin/blog" icon={<FileText className="h-5 w-5" />} label="New Blog Post" />
          <ActionCard to="/admin/settings" icon={<SettingsIcon className="h-5 w-5" />} label="Site Settings" />
        </div>
      </section>

      {/* Bird calls batch */}
      <section className="mt-12">
        <h2 className="mb-5 text-xs font-light uppercase tracking-[0.3em] text-muted-foreground">
          Bird Calls (xeno-canto)
        </h2>
        <div className="rounded-sm border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-base text-foreground">Fetch bird calls for all photos</p>
              <p className="mt-1 text-xs font-light text-muted-foreground">
                Loops through photos missing audio and fetches a quality-A recording per species.
              </p>
            </div>
            <button
              type="button"
              onClick={runBatchCalls}
              disabled={callsRunning}
              className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/90 px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary disabled:opacity-50"
            >
              {callsRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
              {callsRunning ? "Fetching…" : "Fetch bird calls"}
            </button>
          </div>
          {callsRunning && callsProgress.total > 0 && (
            <div className="mt-4">
              <div className="h-1.5 w-full rounded-full bg-background">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${(callsProgress.done / callsProgress.total) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-light text-muted-foreground">
                Fetching call {callsProgress.done}/{callsProgress.total} · {callsProgress.found} found · {callsProgress.missing} missing{callsProgress.errors ? ` · ${callsProgress.errors} errors` : ""}
              </p>
            </div>
          )}
          {callsLog.length > 0 && (
            <div className="mt-4 max-h-64 overflow-y-auto rounded-sm border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {callsLog.map((l, i) => (
                <div key={i} className={l.startsWith("✓") ? "text-primary" : l.startsWith("⚠") ? "text-amber-500" : l.startsWith("✗") ? "text-red-400/70" : ""}>{l}</div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Recent uploads */}
      <section className="mt-16">
        <h2 className="mb-5 text-xs font-light uppercase tracking-[0.3em] text-muted-foreground">
          Recent Uploads
        </h2>
        {recent && recent.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {recent.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-square overflow-hidden rounded-sm bg-surface"
              >
                <img
                  src={p.thumbnail_url || p.image_url}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-[10px] font-light text-foreground">
                    {p.common_name || p.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-sm border border-dashed border-border bg-surface/50 p-12 text-center">
            <Star className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
            <p className="font-light text-muted-foreground">
              No photographs uploaded yet.
            </p>
            <Link
              to="/admin/upload"
              className="mt-4 inline-block text-xs font-medium uppercase tracking-widest text-primary hover:underline"
            >
              Upload your first →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-background p-6">
      <p className="text-[10px] font-light uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </p>
      <p className="font-display mt-3 text-4xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function ActionCard({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to as any}
      className="group flex items-center justify-between border border-border bg-surface p-5 transition-colors hover:border-primary"
    >
      <div className="flex items-center gap-4">
        <span className="text-primary">{icon}</span>
        <span className="font-display text-base font-medium text-foreground">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground transition-transform group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
