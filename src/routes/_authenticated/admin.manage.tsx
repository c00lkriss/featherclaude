import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { MAX_FEATURED } from "@/lib/bird-constants";
import { sizedImage, lqip } from "@/lib/image-url";

export const Route = createFileRoute("/_authenticated/admin/manage")({
  head: () => ({
    meta: [
      { title: "Manage Photos — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ManagePage,
});

type Row = {
  id: string;
  title: string;
  common_name: string | null;
  order_name: string;
  image_url: string;
  thumbnail_url: string | null;
  is_featured: boolean | null;
};

function ManagePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "all-photos"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, title, common_name, order_name, image_url, thumbnail_url, is_featured")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const featuredCount = (data ?? []).filter((p) => p.is_featured).length;

  const toggleFeatured = useMutation({
    mutationFn: async (row: Row) => {
      const willFeature = !row.is_featured;
      if (willFeature && featuredCount >= MAX_FEATURED) {
        throw new Error(
          `You already have ${MAX_FEATURED} featured photos. Please unfeature one before adding another.`,
        );
      }
      const { error } = await supabase
        .from("photos")
        .update({ is_featured: willFeature })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "all-photos"] });
    },
    onError: (err: Error) => toast.warning(err.message),
  });

  const deletePhoto = useMutation({
    mutationFn: async (row: Row) => {
      // Try to derive storage path from public URL
      const marker = "/storage/v1/object/public/photos/";
      const idx = row.image_url.indexOf(marker);
      if (idx !== -1) {
        const path = decodeURIComponent(row.image_url.slice(idx + marker.length));
        const { error: stErr } = await supabase.storage.from("photos").remove([path]);
        if (stErr) console.warn("[manage] storage delete warning:", stErr.message);
      }
      const { error } = await supabase.from("photos").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "all-photos"] });
      toast.success("Photograph deleted.");
      setPendingDelete(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <Link
            to="/admin/dashboard"
            className="text-xs font-light uppercase tracking-[0.25em] text-muted-foreground hover:text-primary"
          >
            ← Dashboard
          </Link>
          <h1 className="font-display mt-4 text-4xl font-semibold text-foreground md:text-5xl">
            Manage Photos
          </h1>
        </div>
        <div className="rounded-sm border border-border bg-surface px-4 py-2 text-xs font-light uppercase tracking-[0.25em] text-muted-foreground">
          Featured: <span className="text-foreground">{featuredCount}/{MAX_FEATURED}</span>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-surface/50 p-16 text-center">
          <p className="text-muted-foreground">No photographs uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data!.map((row) => (
            <div
              key={row.id}
              className="group relative overflow-hidden rounded-sm border border-border bg-surface"
            >
              <div
                className="relative aspect-square bg-cover bg-center"
                style={{ backgroundImage: lqip(row.thumbnail_url || row.image_url) ? `url("${lqip(row.thumbnail_url || row.image_url)}")` : undefined }}
              >
                <img
                  src={sizedImage(row.thumbnail_url || row.image_url, { width: 500, quality: 70, resize: "cover" }) || (row.thumbnail_url || row.image_url)}
                  alt={row.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {row.is_featured && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-400 backdrop-blur-md">
                    <Star className="h-3 w-3 fill-amber-400" /> Featured
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleFeatured.mutate(row)}
                  className="absolute right-2 top-2 rounded-full bg-background/85 p-1.5 text-foreground backdrop-blur-md hover:text-amber-400"
                  title={row.is_featured ? "Unfeature" : "Feature"}
                >
                  <Star className={cn("h-3.5 w-3.5", row.is_featured && "fill-amber-400 text-amber-400")} />
                </button>
              </div>
              <div className="space-y-1 p-3">
                <p className="font-display truncate text-sm font-semibold text-foreground">
                  {row.common_name || row.title}
                </p>
                <p className="truncate text-[10px] font-light uppercase tracking-widest text-muted-foreground">
                  {row.order_name}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate({ to: "/admin/edit/$id", params: { id: row.id } })}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-sm border border-border bg-background py-1.5 text-[11px] font-medium uppercase tracking-widest text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => setPendingDelete(row)}
                    className="inline-flex items-center justify-center gap-1 rounded-sm border border-border bg-background px-2 py-1.5 text-[11px] font-medium uppercase tracking-widest text-foreground transition-colors hover:border-destructive hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-sm border border-border bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-semibold text-foreground">Delete photograph?</h3>
            <p className="mt-2 text-sm font-light text-muted-foreground">
              This removes <span className="text-foreground">{pendingDelete.common_name || pendingDelete.title}</span> from the gallery and storage. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="text-xs font-light uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePhoto.mutate(pendingDelete)}
                disabled={deletePhoto.isPending}
                className="rounded-none border border-destructive bg-destructive/90 px-5 py-2 text-xs font-medium uppercase tracking-widest text-destructive-foreground hover:bg-destructive disabled:opacity-50"
              >
                {deletePhoto.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
