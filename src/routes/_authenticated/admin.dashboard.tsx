import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Upload, FileText, Images, Star, ListChecks, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
