import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X as XIcon, MapPin, Save, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  geteBirdLocationSuggestion,
  geocodeWithNominatim,
} from "@/lib/ebird-suggestion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/incomplete")({
  head: () => ({
    meta: [
      { title: "Incomplete Photos — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: IncompletePage,
});

type Row = {
  id: string;
  title: string;
  common_name: string | null;
  species_name: string;
  scientific_name?: string | null;
  image_url: string;
  thumbnail_url: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  date_taken: string | null;
  iucn_status: string | null;
  description: string | null;
};

function IncompletePage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ location: string; latitude: string; longitude: string }>({
    location: "",
    latitude: "",
    longitude: "",
  });

  const { data: photos } = useQuery({
    queryKey: ["admin-incomplete"],
    queryFn: async () => {
      const { data } = await supabase
        .from("photos")
        .select(
          "id, title, common_name, species_name, image_url, thumbnail_url, location, latitude, longitude, date_taken, iucn_status, description",
        )
        .order("created_at", { ascending: false });
      return (data ?? []) as Row[];
    },
  });

  const { data: ebirdSci } = useQuery({
    queryKey: ["ebird-sci-set"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ebird_lifelist")
        .select("scientific_name");
      const set = new Set<string>();
      (data ?? []).forEach((r) => {
        if (r.scientific_name) set.add(r.scientific_name.toLowerCase());
      });
      return set;
    },
  });

  const incomplete = useMemo(() => {
    if (!photos) return [];
    return photos.filter(
      (p) => !p.location || !p.date_taken || !p.iucn_status || !p.description,
    );
  }, [photos]);

  const saveRow = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: { location: string | null; latitude: number | null; longitude: number | null };
    }) => {
      const { error } = await supabase.from("photos").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo updated.");
      qc.invalidateQueries({ queryKey: ["admin-incomplete"] });
      setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const startEdit = (row: Row) => {
    setEditing(row.id);
    setDraft({
      location: row.location ?? "",
      latitude: row.latitude != null ? String(row.latitude) : "",
      longitude: row.longitude != null ? String(row.longitude) : "",
    });
  };

  const suggestFromEbird = async (row: Row) => {
    const sug = await geteBirdLocationSuggestion({
      scientific_name: row.species_name,
      common_name: row.common_name,
      photo_date: row.date_taken,
    });
    if (sug.location) {
      let lat = sug.ebird_lat;
      let lon = sug.ebird_long;
      if (lat == null) {
        const geo = await geocodeWithNominatim(sug.location);
        if (geo) {
          lat = geo.lat;
          lon = geo.lon;
        }
      }
      setDraft({
        location: sug.location,
        latitude: lat != null ? String(lat) : "",
        longitude: lon != null ? String(lon) : "",
      });
      toast.success(`Suggestion: ${sug.location}`);
    } else {
      toast.info(sug.message || "No eBird suggestion available");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-10">
        <Link
          to="/admin/dashboard"
          className="text-xs font-light uppercase tracking-[0.25em] text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
        <h1 className="font-display mt-4 text-4xl font-semibold text-foreground md:text-5xl">
          Incomplete Photos
        </h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          {incomplete.length} photo{incomplete.length === 1 ? "" : "s"} missing location, date, IUCN status, or description.
        </p>
      </header>

      <div className="overflow-x-auto rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-[10px] font-light uppercase tracking-[0.2em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Species</th>
              <th className="px-4 py-3">🐦 In eBird</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">IUCN</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {incomplete.map((row) => {
              const inEbird = ebirdSci?.has(row.species_name.toLowerCase()) ?? false;
              const isEditing = editing === row.id;
              return (
                <>
                  <tr key={row.id} className="border-t border-border/60 text-foreground">
                    <td className="px-4 py-3">
                      <img
                        src={row.thumbnail_url || row.image_url}
                        alt={row.title}
                        className="h-12 w-12 rounded-sm object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.common_name || row.title}</p>
                      <p className="text-xs italic text-muted-foreground">{row.species_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      {inEbird ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XIcon className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.location || <span className="text-destructive/70">— missing</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.date_taken || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.iucn_status || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => (isEditing ? setEditing(null) : startEdit(row))}
                        className="text-xs font-medium uppercase tracking-widest text-primary hover:underline"
                      >
                        {isEditing ? "Close" : "Edit"}
                      </button>
                    </td>
                  </tr>
                  {isEditing && (
                    <tr key={row.id + "-edit"} className="border-t border-border/30 bg-surface/50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="flex flex-wrap items-end gap-3">
                          <label className="flex-1 min-w-[200px]">
                            <span className="mb-1 block text-[10px] font-light uppercase tracking-widest text-muted-foreground">
                              Location
                            </span>
                            <input
                              value={draft.location}
                              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                              className={inp}
                            />
                          </label>
                          <label>
                            <span className="mb-1 block text-[10px] font-light uppercase tracking-widest text-muted-foreground">
                              Latitude
                            </span>
                            <input
                              value={draft.latitude}
                              onChange={(e) => setDraft({ ...draft, latitude: e.target.value })}
                              className={cn(inp, "w-32")}
                            />
                          </label>
                          <label>
                            <span className="mb-1 block text-[10px] font-light uppercase tracking-widest text-muted-foreground">
                              Longitude
                            </span>
                            <input
                              value={draft.longitude}
                              onChange={(e) => setDraft({ ...draft, longitude: e.target.value })}
                              className={cn(inp, "w-32")}
                            />
                          </label>
                          {inEbird && !row.location && (
                            <button
                              type="button"
                              onClick={() => suggestFromEbird(row)}
                              className="inline-flex items-center gap-1 rounded-sm border border-primary px-3 py-2 text-xs font-medium uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              <Sparkles className="h-3 w-3" /> Suggest from eBird →
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              saveRow.mutate({
                                id: row.id,
                                patch: {
                                  location: draft.location || null,
                                  latitude: draft.latitude ? parseFloat(draft.latitude) : null,
                                  longitude: draft.longitude ? parseFloat(draft.longitude) : null,
                                },
                              })
                            }
                            disabled={saveRow.isPending}
                            className="inline-flex items-center gap-1 rounded-sm border border-primary bg-primary px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            <Save className="h-3 w-3" /> Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {incomplete.length === 0 && (
        <p className="mt-12 rounded-sm border border-dashed border-border bg-surface/50 p-12 text-center text-sm font-light text-muted-foreground">
          <MapPin className="mx-auto mb-3 h-6 w-6" />
          All photos are complete. 🎉
        </p>
      )}
    </div>
  );
}

const inp =
  "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none";
