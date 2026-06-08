import { Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type Photo = {
  id: string;
  title: string;
  common_name: string | null;
  species_name: string;
  species_slug: string;
  species_identifier: string;
  order_name: string;
  family_name: string;
  image_url: string;
  thumbnail_url: string | null;
  tags: string[] | null;
};

type Props = {
  order?: string;
  family?: string;
  q?: string;
  location?: string;
};

export function GalleryView({ order, family, q = "", location }: Props) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Debounce search → URL (trigger after 2 characters)
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === q) return;
      if (searchInput.length > 0 && searchInput.length < 2) return;
      navigate({
        to: "/gallery",
        search: searchInput ? { q: searchInput } : {},
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, q, navigate]);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] gap-10 px-6 py-12 lg:py-16">
      <TaxonomySidebar activeOrder={order} activeFamily={family} />
      <main className="min-w-0 flex-1">
        <header className="mb-10">
          <p className="mb-3 text-xs font-light uppercase tracking-[0.3em] text-primary">
            Gallery
          </p>
          <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
            {location ?? family ?? order ?? "All Photographs"}
          </h1>
          {(order || family) && (
            <p className="mt-3 text-sm font-light text-muted-foreground">
              {family ? `Family · ${order}` : `Order`}
            </p>
          )}
          {location && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-sm border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-light text-primary">
              <span>Location · {location}</span>
              <button
                onClick={() => navigate({ to: "/gallery", search: {} })}
                className="text-primary/70 hover:text-primary"
                aria-label="Clear location filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </header>

        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search birds by name, species, order or family..."
            className="w-full rounded-sm border border-border bg-surface px-12 py-4 text-sm text-foreground placeholder:font-light placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-0"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <PhotoGrid order={order} family={family} q={q} location={location} />
      </main>
    </div>
  );
}

/* ---------------- Sidebar ---------------- */

function TaxonomySidebar({
  activeOrder,
  activeFamily,
}: {
  activeOrder?: string;
  activeFamily?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["taxonomy-tree"],
    queryFn: async () => {
      const [{ data: orders }, { data: photos }] = await Promise.all([
        supabase.from("taxonomy_orders").select("id, order_name").order("order_name"),
        supabase.from("photos").select("order_name, family_name"),
      ]);
      const tree = new Map<string, { count: number; families: Map<string, number> }>();
      (photos ?? []).forEach((p) => {
        const o = tree.get(p.order_name) ?? { count: 0, families: new Map() };
        o.count += 1;
        o.families.set(p.family_name, (o.families.get(p.family_name) ?? 0) + 1);
        tree.set(p.order_name, o);
      });
      // Merge declared orders + orders that only appear in photos
      const allNames = new Set<string>([
        ...(orders ?? []).map((o) => o.order_name),
        ...tree.keys(),
      ]);
      return Array.from(allNames)
        .sort()
        .map((name) => ({
          order_name: name,
          count: tree.get(name)?.count ?? 0,
          families: Array.from(tree.get(name)?.families.entries() ?? [])
            .map(([family_name, count]) => ({ family_name, count }))
            .sort((a, b) => a.family_name.localeCompare(b.family_name)),
        }));
    },
  });

  const totalCount = (data ?? []).reduce((sum, o) => sum + o.count, 0);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-primary px-5 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground shadow-lg lg:hidden"
      >
        {mobileOpen ? "Close" : "Filter"}
      </button>

      <aside
        className={cn(
          "lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-8rem)] lg:w-64 lg:flex-shrink-0 lg:overflow-y-auto",
          "fixed inset-0 z-30 overflow-y-auto bg-background/95 px-6 pt-24 backdrop-blur-md lg:static lg:inset-auto lg:bg-transparent lg:px-0 lg:pt-0 lg:backdrop-blur-none",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <h2 className="mb-1 text-xs font-light uppercase tracking-[0.3em] text-primary">
          Browse
        </h2>
        <p className="mb-6 font-display text-xl font-semibold text-foreground">
          By Taxonomy
        </p>

        <SidebarLink
          to="/gallery"
          label="All Photographs"
          count={totalCount}
          active={!activeOrder}
          onClick={() => setMobileOpen(false)}
        />

        <div className="mt-2 space-y-1">
          {data?.map((o) => (
            <OrderNode
              key={o.order_name}
              order={o}
              activeOrder={activeOrder}
              activeFamily={activeFamily}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </div>
      </aside>
    </>
  );
}

function SidebarLink({
  to,
  params,
  label,
  count,
  active,
  indent = false,
  onClick,
}: {
  to: string;
  params?: Record<string, string>;
  label: string;
  count: number;
  active: boolean;
  indent?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to as any}
      params={params as any}
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between border-l-2 py-1.5 pr-2 text-sm transition-colors",
        indent ? "pl-6" : "pl-3",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      <span className={cn("truncate font-light", active && "font-medium")}>{label}</span>
      <span className="ml-2 shrink-0 text-[10px] tabular-nums text-muted-foreground/70">
        {count}
      </span>
    </Link>
  );
}

function OrderNode({
  order,
  activeOrder,
  activeFamily,
  onNavigate,
}: {
  order: { order_name: string; count: number; families: { family_name: string; count: number }[] };
  activeOrder?: string;
  activeFamily?: string;
  onNavigate: () => void;
}) {
  const isActive = activeOrder === order.order_name;
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

  return (
    <div>
      <div className="flex items-stretch">
        <Link
          to="/gallery/$order"
          params={{ order: order.order_name }}
          onClick={onNavigate}
          className={cn(
            "group flex flex-1 items-center justify-between border-l-2 py-1.5 pl-3 pr-2 text-sm transition-colors",
            isActive && !activeFamily
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "truncate font-light",
              isActive && !activeFamily && "font-medium",
            )}
          >
            {order.order_name}
          </span>
          <span className="ml-2 shrink-0 text-[10px] tabular-nums text-muted-foreground/70">
            {order.count}
          </span>
        </Link>
        {order.families.length > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="px-2 text-muted-foreground hover:text-foreground"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
            />
          </button>
        )}
      </div>

      {open && order.families.length > 0 && (
        <div className="space-y-0.5 py-1">
          {order.families.map((f) => (
            <SidebarLink
              key={f.family_name}
              to="/gallery/$order/$family"
              params={{ order: order.order_name, family: f.family_name }}
              label={f.family_name}
              count={f.count}
              active={isActive && activeFamily === f.family_name}
              indent
              onClick={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Grid ---------------- */

function PhotoGrid({
  order,
  family,
  q,
}: {
  order?: string;
  family?: string;
  q: string;
}) {
  const searchTerm = q.trim().length >= 2 ? q.trim() : "";

  const query = useInfiniteQuery({
    queryKey: ["photos", { order, family, searchTerm }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<{ rows: Photo[]; total: number | null }> => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let req = supabase
        .from("photos")
        .select(
          "id, title, common_name, species_name, species_slug, species_identifier, order_name, family_name, image_url, thumbnail_url, tags",
          { count: searchTerm ? "exact" : undefined },
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (order) req = req.eq("order_name", order);
      if (family) req = req.eq("family_name", family);
      if (searchTerm) {
        const safe = searchTerm.replace(/[%,()]/g, " ");
        req = req.or(
          `common_name.ilike.%${safe}%,species_name.ilike.%${safe}%,order_name.ilike.%${safe}%,family_name.ilike.%${safe}%,tags.cs.{${safe}}`,
        );
      }
      const { data, error, count } = await req;
      if (error) throw error;
      return { rows: (data ?? []) as Photo[], total: count ?? null };
    },
    getNextPageParam: (last, all) =>
      last.rows.length < PAGE_SIZE ? undefined : all.length,
  });

  const photos = useMemo(
    () => query.data?.pages.flatMap((p) => p.rows) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.total ?? null;

  if (query.isLoading) {
    return (
      <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="mb-4 break-inside-avoid rounded-sm bg-surface"
            style={{ height: 240 + ((i * 53) % 180) }}
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-surface/50 p-16 text-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 64 64"
          className="mx-auto mb-5 h-14 w-14 text-muted-foreground"
          fill="currentColor"
        >
          <path d="M52 14c-4 0-7 2-9 5l-9 1c-7 1-13 5-16 11-2 4-2 9 0 13l-6 6c-1 1 0 3 1 3l9-2c5 3 11 3 16 1 7-3 11-9 12-16l5-9c2-3 3-6 3-9 0-2-2-4-4-4-1 0-2 0-2 1zm-4 6a2 2 0 110 4 2 2 0 010-4z"/>
        </svg>
        <p className="font-display text-2xl text-foreground">
          {q ? `No birds found for "${q}"` : "No photographs yet"}
        </p>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          {q ? "Try another name, order or family." : "Photographs in this section will appear here once uploaded."}
        </p>
      </div>
    );
  }

  return (
    <>
      {searchTerm && (
        <p className="mb-6 text-xs font-light uppercase tracking-[0.2em] text-muted-foreground">
          Showing {total ?? photos.length} result{(total ?? photos.length) === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
      )}
      <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
        {photos.map((p) => (
          <PhotoCard key={p.id} photo={p} />
        ))}
      </div>

      {query.hasNextPage && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="rounded-none border border-primary px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          >
            {query.isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </>
  );
}

function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <Link
      to="/species/$slug"
      params={{ slug: photo.species_identifier || photo.species_slug }}
      search={{ p: photo.id }}
      onClick={() => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("gallery:lastPath", window.location.pathname + window.location.search);
        }
      }}
      className="group mb-4 block break-inside-avoid overflow-hidden rounded-sm bg-surface transition-shadow duration-300 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]"
    >
      <div className="relative overflow-hidden">
        <img
          src={photo.thumbnail_url || photo.image_url}
          alt={photo.common_name || photo.species_name}
          loading="lazy"
          className="w-full transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="p-5">
            <p className="text-[10px] font-light uppercase tracking-[0.25em] text-primary">
              {photo.order_name}
            </p>
            <p className="mt-1 text-xs font-light uppercase tracking-widest text-foreground/80">
              {photo.family_name}
            </p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold leading-tight text-foreground">
          {photo.common_name || photo.species_name}
        </h3>
        <p className="mt-0.5 font-body text-sm font-light italic text-muted-foreground">
          {photo.species_name}
        </p>
      </div>
    </Link>
  );
}
