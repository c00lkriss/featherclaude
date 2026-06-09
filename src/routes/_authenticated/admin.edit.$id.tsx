import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { BIRD_ORDERS, FAMILIES_BY_ORDER, IUCN_OPTIONS, MAX_FEATURED, slugify } from "@/lib/bird-constants";
import { LocationField } from "@/components/LocationField";
import { geocodeWithNominatim } from "@/lib/ebird-suggestion";


export const Route = createFileRoute("/_authenticated/admin/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit Photo — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EditPage,
});

type Form = {
  order_name: string;
  family_name: string;
  genus: string;
  species_name: string;
  common_name: string;
  species_identifier: string;
  title: string;
  description: string;
  date_taken: string;
  camera: string;
  lens: string;
  iso: string;
  aperture: string;
  shutter_speed: string;
  focal_length: string;
  location: string;
  latitude: string;
  longitude: string;
  country: string;
  tags: string;
  is_featured: boolean;
  iucn_status: string;
};

const inputCls =
  "w-full rounded-sm border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none";

function EditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  const { data, error } = useQuery({
    queryKey: ["admin", "photo", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("photos").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setImageUrl(data.image_url);
    setForm({
      order_name: data.order_name ?? "",
      family_name: data.family_name ?? "",
      genus: data.genus ?? "",
      species_name: data.species_name ?? "",
      common_name: data.common_name ?? "",
      species_identifier: (data as { species_identifier?: string }).species_identifier ?? data.species_slug ?? "",
      title: data.title ?? "",
      description: data.description ?? "",
      date_taken: data.date_taken ?? "",
      camera: data.camera ?? "",
      lens: data.lens ?? "",
      iso: data.iso != null ? String(data.iso) : "",
      aperture: data.aperture ?? "",
      shutter_speed: data.shutter_speed ?? "",
      focal_length: data.focal_length ?? "",
      location: data.location ?? "",
      latitude: data.latitude != null ? String(data.latitude) : "",
      longitude: data.longitude != null ? String(data.longitude) : "",
      country: data.country ?? "India",
      tags: (data.tags ?? []).join(", "),
      is_featured: !!data.is_featured,
      iucn_status: data.iucn_status ?? "",
    });
  }, [data]);

  if (error) {
    return <div className="mx-auto max-w-3xl p-16 text-destructive">Failed to load: {error.message}</div>;
  }
  if (!form) return <div className="mx-auto max-w-3xl p-16 text-muted-foreground">Loading…</div>;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f!, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (form.is_featured && !data?.is_featured) {
        const { count, error: cErr } = await supabase
          .from("photos")
          .select("id", { count: "exact", head: true })
          .eq("is_featured", true);
        if (cErr) throw cErr;
        if ((count ?? 0) >= MAX_FEATURED) {
          toast.warning(
            `You already have ${MAX_FEATURED} featured photos. Please unfeature one before adding another.`,
          );
          setSubmitting(false);
          return;
        }
      }

      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

      // Auto-geocode if location present but coords missing
      let latNum = form.latitude ? parseFloat(form.latitude) : null;
      let lonNum = form.longitude ? parseFloat(form.longitude) : null;
      let missingCoords = false;
      if (form.location && (latNum == null || lonNum == null)) {
        const geo = await geocodeWithNominatim(form.location);
        if (geo) {
          latNum = geo.lat;
          lonNum = geo.lon;
        } else {
          missingCoords = true;
        }
      }

      const { error: upErr } = await supabase
        .from("photos")
        .update({
          title: form.title,
          description: form.description || null,
          order_name: form.order_name,
          family_name: form.family_name,
          genus: form.genus || null,
          species_name: form.species_name,
          common_name: form.common_name || null,
          species_identifier: form.species_identifier || slugify(form.common_name || form.species_name),
          date_taken: form.date_taken || null,
          camera: form.camera || null,
          lens: form.lens || null,
          iso: form.iso ? parseInt(form.iso, 10) : null,
          aperture: form.aperture || null,
          shutter_speed: form.shutter_speed || null,
          focal_length: form.focal_length || null,
          location: form.location || null,
          latitude: latNum,
          longitude: lonNum,
          missing_coordinates: missingCoords,
          country: form.country || "India",
          tags,
          is_featured: form.is_featured,
          iucn_status: form.iucn_status || null,
        })
        .eq("id", id);
      if (upErr) throw upErr;
      toast.success("Photograph updated.");
      navigate({ to: "/admin/manage" });

    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const familySuggestions = FAMILIES_BY_ORDER[form.order_name] ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-10">
        <Link to="/admin/manage" className="text-xs font-light uppercase tracking-[0.25em] text-muted-foreground hover:text-primary">
          ← Manage Photos
        </Link>
        <h1 className="font-display mt-4 text-4xl font-semibold text-foreground md:text-5xl">
          Edit Photograph
        </h1>
      </header>

      {imageUrl && (
        <img src={imageUrl} alt="" className="mb-8 max-h-[400px] w-full rounded-sm border border-border object-contain" />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Section title="Taxonomy">
          <Grid>
            <Field label="Order">
              <select value={form.order_name} onChange={(e) => set("order_name", e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {BIRD_ORDERS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Family">
              <input list="family-list" value={form.family_name} onChange={(e) => set("family_name", e.target.value)} className={inputCls} />
              <datalist id="family-list">
                {familySuggestions.map((f) => <option key={f} value={f} />)}
              </datalist>
            </Field>
            <Field label="Genus">
              <input value={form.genus} onChange={(e) => set("genus", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Species (scientific)">
              <input value={form.species_name} onChange={(e) => set("species_name", e.target.value)} className={cn(inputCls, "italic")} />
            </Field>
            <Field label="Common name">
              <input value={form.common_name} onChange={(e) => set("common_name", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Species identifier">
              <input value={form.species_identifier} onChange={(e) => set("species_identifier", slugify(e.target.value))} className={inputCls} />
            </Field>
          </Grid>
        </Section>

        <Section title="Conservation">
          <Field label="IUCN Status">
            <select value={form.iucn_status} onChange={(e) => set("iucn_status", e.target.value)} className={inputCls}>
              <option value="">Select…</option>
              {IUCN_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Photograph">
          <Grid>
            <Field label="Title"><input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} /></Field>
            <Field label="Date taken"><input type="date" value={form.date_taken} onChange={(e) => set("date_taken", e.target.value)} className={inputCls} /></Field>
            <Field label="Description" full>
              <textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} className={cn(inputCls, "resize-none")} />
            </Field>
          </Grid>
        </Section>

        <Section title="Capture Data">
          <Grid>
            <Field label="Camera"><input value={form.camera} onChange={(e) => set("camera", e.target.value)} className={inputCls} /></Field>
            <Field label="Lens"><input value={form.lens} onChange={(e) => set("lens", e.target.value)} className={inputCls} /></Field>
            <Field label="ISO"><input value={form.iso} onChange={(e) => set("iso", e.target.value)} className={inputCls} /></Field>
            <Field label="Aperture"><input value={form.aperture} onChange={(e) => set("aperture", e.target.value)} className={inputCls} /></Field>
            <Field label="Shutter"><input value={form.shutter_speed} onChange={(e) => set("shutter_speed", e.target.value)} className={inputCls} /></Field>
            <Field label="Focal length"><input value={form.focal_length} onChange={(e) => set("focal_length", e.target.value)} className={inputCls} /></Field>
          </Grid>
        </Section>

        <Section title="Location">
          <Grid>
            <Field label="Place name" full><input value={form.location} onChange={(e) => set("location", e.target.value)} className={inputCls} /></Field>
            <Field label="Latitude"><input value={form.latitude} onChange={(e) => set("latitude", e.target.value)} className={inputCls} /></Field>
            <Field label="Longitude"><input value={form.longitude} onChange={(e) => set("longitude", e.target.value)} className={inputCls} /></Field>
            <Field label="Country"><input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} /></Field>
          </Grid>
        </Section>

        <Section title="Tags & Featured">
          <Field label="Tags (comma-separated)">
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} />
          </Field>
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-sm border border-border bg-surface p-4">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => set("is_featured", e.target.checked)}
              className="h-4 w-4 accent-[--color-primary]"
            />
            <span className="text-sm font-light text-foreground">
              Featured photograph (max {MAX_FEATURED} site-wide)
            </span>
          </label>
        </Section>

        <div className="flex items-center justify-end gap-4 border-t border-border pt-8">
          <Link to="/admin/manage" className="text-xs font-light uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-none border border-primary bg-primary/90 px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display mb-5 text-2xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("block", full && "md:col-span-2")}>
      <span className="mb-2 block text-[10px] font-light uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
